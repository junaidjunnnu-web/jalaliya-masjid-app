require('dotenv').config();
const postgres = require('postgres');
const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function addUstadPhone() {
  console.log('Adding phone field to ustads table...\n');
  
  try {
    await sql`ALTER TABLE ustads ADD COLUMN IF NOT EXISTS phone VARCHAR(15);`;
    console.log('✓ Added phone column to ustads table');
    
    console.log('\n✅ Phone field added successfully!');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error adding phone field:', error);
    await sql.end();
    process.exit(1);
  }
}

addUstadPhone();
