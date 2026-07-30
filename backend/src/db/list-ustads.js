require('dotenv').config();
const { db } = require('./index');
const { ustads } = require('./schema');

async function listUstads() {
  console.log('Listing all ustads...');
  
  try {
    const allUstads = await db.select().from(ustads);
    
    if (allUstads.length === 0) {
      console.log('No ustads found in database.');
      process.exit(0);
    }

    console.log('\nUstads:');
    console.log('ID\tName\t\tCreated At');
    console.log('---\t----\t\t----------');
    allUstads.forEach(ustad => {
      console.log(`${ustad.id}\t${ustad.name}\t${ustad.createdAt.toISOString().split('T')[0]}`);
    });
    
    console.log('\nTo update a PIN, run: node src/db/update-ustad-pin.js <ustadId> <newPin>');
    console.log('Example: node src/db/update-ustad-pin.js 1 9999');
    
    process.exit(0);
  } catch (error) {
    console.error('Error listing ustads:', error);
    process.exit(1);
  }
}

listUstads();
