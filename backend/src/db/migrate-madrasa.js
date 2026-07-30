require('dotenv').config();
const { db } = require('./index');
const { madrasaStudents, madrasaAttendance } = require('./schema');
const { eq } = require('drizzle-orm');

async function migrateMadrasa() {
  console.log('Migrating Madrasa tables...');
  
  try {
    // Delete all existing Madrasa data (as requested by user)
    console.log('Deleting existing Madrasa data...');
    await db.delete(madrasaAttendance);
    await db.delete(madrasaStudents);
    console.log('Old Madrasa data deleted.');
    
    // The schema changes will be applied via drizzle-kit push
    console.log('Please run: npx drizzle-kit push:pg');
    console.log('Then run: node src/db/seed-ustads.js');
    
    process.exit(0);
  } catch (error) {
    console.error('Error migrating Madrasa:', error);
    process.exit(1);
  }
}

migrateMadrasa();
