require('dotenv').config();
const postgres = require('postgres');
const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);

async function checkSchema() {
  console.log('Checking madrasa_students table structure...\n');
  
  try {
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'madrasa_students'
      ORDER BY ordinal_position;
    `;
    
    console.log('Columns in madrasa_students:');
    console.log('Column Name\t\tData Type\tNullable\tDefault');
    console.log('-----------\t\t---------\t--------\t-------');
    columns.forEach(col => {
      console.log(`${col.column_name.padEnd(20)}\t${col.data_type.padEnd(10)}\t${col.is_nullable}\t${col.column_default || 'NULL'}`);
    });
    
    console.log('\n\nChecking madrasa_attendance table structure...\n');
    
    const attendanceColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'madrasa_attendance'
      ORDER BY ordinal_position;
    `;
    
    console.log('Columns in madrasa_attendance:');
    console.log('Column Name\t\t\tData Type\tNullable\tDefault');
    console.log('----------------\t\t---------\t--------\t-------');
    attendanceColumns.forEach(col => {
      console.log(`${col.column_name.padEnd(24)}\t${col.data_type.padEnd(10)}\t${col.is_nullable}\t${col.column_default || 'NULL'}`);
    });
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error checking schema:', error);
    await sql.end();
    process.exit(1);
  }
}

checkSchema();
