const { drizzle } = require('drizzle-orm/node-postgres');
const pg = require('pg');
const fs = require('fs');
const path = require('path');

const { Client } = pg;

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'drizzle', '0000_stiff_warpath.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('Executing migration...');
    await client.query(migrationSQL);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration();
