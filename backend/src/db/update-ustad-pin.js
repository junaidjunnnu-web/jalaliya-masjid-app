require('dotenv').config();
const { db } = require('./index');
const { ustads } = require('./schema');
const bcrypt = require('bcrypt');

async function updateUstadPin() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node src/db/update-ustad-pin.js <ustadId> <newPin>');
    console.log('Example: node src/db/update-ustad-pin.js 1 9999');
    console.log('\nTo see all ustads and their IDs, run: node src/db/list-ustads.js');
    process.exit(1);
  }

  const ustadId = parseInt(args[0]);
  const newPin = args[1];

  if (isNaN(ustadId)) {
    console.log('Error: ustadId must be a number');
    process.exit(1);
  }

  if (newPin.length !== 4) {
    console.log('Error: PIN must be exactly 4 digits');
    process.exit(1);
  }

  try {
    const pinHash = await bcrypt.hash(newPin, 10);
    
    const result = await db.update(ustads)
      .set({ pinHash })
      .where(eq(ustads.id, ustadId))
      .returning();

    if (result.length === 0) {
      console.log(`Error: Ustad with ID ${ustadId} not found`);
      process.exit(1);
    }

    console.log(`✅ Successfully updated PIN for Ustad "${result[0].name}" (ID: ${ustadId})`);
    console.log(`   New PIN: ${newPin}`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating PIN:', error);
    process.exit(1);
  }
}

const { eq } = require('drizzle-orm');
updateUstadPin();
