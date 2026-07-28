const { db } = require('./index');
const { families, familyMembers } = require('./schema');
const { eq } = require('drizzle-orm');
const postgres = require('postgres');
require('dotenv').config();

async function addMissingColumns() {
  console.log('Adding missing columns to family_members table...');
  const connectionString = process.env.DATABASE_URL;
  const client = postgres(connectionString);

  try {
    await client`ALTER TABLE family_members ADD COLUMN IF NOT EXISTS phone VARCHAR(15)`;
    console.log('Added phone column');
    await client`ALTER TABLE family_members ADD COLUMN IF NOT EXISTS occupation VARCHAR(100)`;
    console.log('Added occupation column');
    await client.end();
  } catch (error) {
    console.error('Error adding columns:', error);
    await client.end();
    throw error;
  }
}

async function migrateFamilyMembers() {
  console.log('Starting migration of existing family data to family_members table...');

  // First add missing columns
  await addMissingColumns();

  try {
    // Get all families
    const allFamilies = await db.select().from(families);
    console.log(`Found ${allFamilies.length} families to process`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const family of allFamilies) {
      // Check if this family already has members
      const existingMembers = await db.select()
        .from(familyMembers)
        .where(eq(familyMembers.familyId, family.id));

      if (existingMembers.length > 0) {
        console.log(`Skipping family ${family.id} - already has ${existingMembers.length} members`);
        skippedCount++;
        continue;
      }

      // Create a member from the headName/headPhone data
      console.log(`Migrating family ${family.id}: ${family.headName}`);
      
      const [newMember] = await db.insert(familyMembers).values({
        familyId: family.id,
        name: family.headName,
        relation: 'Head of family',
        phone: family.headPhone,
        age: null,
        gender: null,
        maritalStatus: null,
        occupation: null,
        isFeeApplicable: true,
      }).returning();

      console.log(`Created member: ${newMember.name} (${newMember.relation})`);
      migratedCount++;
    }

    console.log(`\nMigration complete!`);
    console.log(`Migrated: ${migratedCount} families`);
    console.log(`Skipped: ${skippedCount} families (already had members)`);

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateFamilyMembers();
