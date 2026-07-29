require('dotenv').config();
const { db } = require('./index');
const { places } = require('./schema');

async function seed() {
  console.log('Seeding places table...');
  
  const placesToSeed = [
    'Ghandinagara',
    'Alekatte',
    'MD Block',
    'Ranger Block',
    'Near Manasa Hall',
    'Somwarpet Town',
    'Convent Bane',
    'Karkalli',
    'Other',
  ];

  for (const placeName of placesToSeed) {
    await db.insert(places).values({ name: placeName }).onConflictDoNothing();
  }

  console.log('Places seeded successfully!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Error seeding:', error);
  process.exit(1);
});
