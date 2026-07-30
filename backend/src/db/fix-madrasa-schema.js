require('dotenv').config();
const postgres = require('postgres');
const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function fixSchema() {
  console.log('Fixing madrasa_students table structure...\n');
  
  try {
    // Drop old columns
    console.log('Dropping old columns...');
    await sql`ALTER TABLE madrasa_students DROP COLUMN IF EXISTS guardian_name;`;
    console.log('✓ Dropped guardian_name');
    
    await sql`ALTER TABLE madrasa_students DROP COLUMN IF EXISTS guardian_phone;`;
    console.log('✓ Dropped guardian_phone');
    
    await sql`ALTER TABLE madrasa_students DROP COLUMN IF EXISTS family_id;`;
    console.log('✓ Dropped family_id');
    
    await sql`ALTER TABLE madrasa_students DROP COLUMN IF EXISTS class_level;`;
    console.log('✓ Dropped class_level');
    
    await sql`ALTER TABLE madrasa_students DROP COLUMN IF EXISTS ustad_name;`;
    console.log('✓ Dropped ustad_name');
    
    await sql`ALTER TABLE madrasa_students DROP COLUMN IF EXISTS progress_notes;`;
    console.log('✓ Dropped progress_notes');
    
    await sql`ALTER TABLE madrasa_students DROP COLUMN IF EXISTS photo_url;`;
    console.log('✓ Dropped photo_url');
    
    // Make new columns NOT NULL
    console.log('\nMaking new columns NOT NULL...');
    await sql`ALTER TABLE madrasa_students ALTER COLUMN standard SET NOT NULL;`;
    console.log('✓ Set standard to NOT NULL');
    
    await sql`ALTER TABLE madrasa_students ALTER COLUMN father_name SET NOT NULL;`;
    console.log('✓ Set father_name to NOT NULL');
    
    await sql`ALTER TABLE madrasa_students ALTER COLUMN father_phone SET NOT NULL;`;
    console.log('✓ Set father_phone to NOT NULL');
    
    await sql`ALTER TABLE madrasa_students ALTER COLUMN created_at SET NOT NULL;`;
    console.log('✓ Set created_at to NOT NULL');
    
    // Fix marked_by_ustad_id in attendance table - should be nullable
    console.log('\nFixing madrasa_attendance table...');
    await sql`ALTER TABLE madrasa_attendance ALTER COLUMN marked_by_ustad_id DROP NOT NULL;`;
    console.log('✓ Made marked_by_ustad_id nullable in attendance table');
    
    console.log('\n✅ Schema fixed successfully!');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error fixing schema:', error);
    await sql.end();
    process.exit(1);
  }
}

fixSchema();
