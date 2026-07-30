require('dotenv').config();
const { db } = require('./index');
const { ustads } = require('./schema');
const bcrypt = require('bcrypt');

async function seedUstads() {
  console.log('Seeding ustads table...');
  
  // Create 3 ustads with placeholder names and default PINs (1234, 5678, 9012)
  const ustadsToSeed = [
    { name: 'Ustad 1', pin: '1234' },
    { name: 'Ustad 2', pin: '5678' },
    { name: 'Ustad 3', pin: '9012' },
  ];

  for (const ustadData of ustadsToSeed) {
    const pinHash = await bcrypt.hash(ustadData.pin, 10);
    await db.insert(ustads).values({ 
      name: ustadData.name, 
      pinHash 
    }).onConflictDoNothing();
  }

  console.log('Ustads seeded successfully!');
  console.log('Default PINs: Ustad 1: 1234, Ustad 2: 5678, Ustad 3: 9012');
  process.exit(0);
}

seedUstads().catch((error) => {
  console.error('Error seeding ustads:', error);
  process.exit(1);
});
