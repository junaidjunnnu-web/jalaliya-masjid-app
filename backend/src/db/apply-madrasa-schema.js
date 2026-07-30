require('dotenv').config();
const postgres = require('postgres');
const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function applyMadrasaSchema() {
  console.log('Applying Madrasa schema changes...');
  
  try {
    // Create ustads table
    await sql`
      CREATE TABLE IF NOT EXISTS ustads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        pin_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    console.log('✓ Created ustads table');

    // Add new columns to madrasa_students
    await sql`
      ALTER TABLE madrasa_students ADD COLUMN IF NOT EXISTS standard VARCHAR(20);
    `;
    console.log('✓ Added standard column');

    await sql`
      ALTER TABLE madrasa_students ADD COLUMN IF NOT EXISTS father_name VARCHAR(100);
    `;
    console.log('✓ Added father_name column');

    await sql`
      ALTER TABLE madrasa_students ADD COLUMN IF NOT EXISTS father_phone VARCHAR(15);
    `;
    console.log('✓ Added father_phone column');

    await sql`
      ALTER TABLE madrasa_students ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
    `;
    console.log('✓ Added created_at column');

    // Add markedByUstadId to madrasa_attendance
    await sql`
      ALTER TABLE madrasa_attendance ADD COLUMN IF NOT EXISTS marked_by_ustad_id INTEGER REFERENCES ustads(id) ON DELETE SET NULL;
    `;
    console.log('✓ Added marked_by_ustad_id column');

    await sql`
      ALTER TABLE madrasa_attendance ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
    `;
    console.log('✓ Added created_at column to attendance');

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS madrasa_students_standard_idx ON madrasa_students(standard);
    `;
    console.log('✓ Created standard index');

    await sql`
      CREATE INDEX IF NOT EXISTS madrasa_students_father_phone_idx ON madrasa_students(father_phone);
    `;
    console.log('✓ Created father_phone index');

    await sql`
      CREATE INDEX IF NOT EXISTS madrasa_attendance_marked_by_ustad_id_idx ON madrasa_attendance(marked_by_ustad_id);
    `;
    console.log('✓ Created marked_by_ustad_id index');

    console.log('\nSchema changes applied successfully!');
    console.log('Now run: node src/db/seed-ustads.js');
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error applying schema changes:', error);
    await sql.end();
    process.exit(1);
  }
}

applyMadrasaSchema();
