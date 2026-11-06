// Adds the starting service list (sample prices in AUD). Safe to run once on an empty database.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const Service = require('../models/Service');

const SERVICES = [
  ['Car wash and detailing', 'Hand wash, vacuum and full detail.', 60, '2 hrs'],
  ['Interior and exterior cleaning', 'Deep clean of seats, carpets, glass and paint.', 110, '3 hrs'],
  ['Car polish', 'Machine polish for deep gloss.', 120, '3 hrs'],
  ['Paint protection and waxing', 'Wax and sealant to protect the finish.', 90, '2 hrs'],
  ['Paint and touch-up', 'Colour-matched panel and chip repair.', 180, '1 day'],
  ['Scratch repair', 'Remove scuffs and deep scratches.', 90, '2 hrs'],
  ['Window tinting', 'Heat and UV film, fitted clean.', 220, '3 hrs'],
  ['Car PPF', 'Self-healing paint protection film.', 900, '1 day'],
  ['General car care and maintenance', 'Checks and care to keep your car in shape.', 80, '1 hr'],
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  if (await Service.countDocuments()) {
    console.log('Services already exist. Nothing changed.');
  } else {
    await Service.insertMany(SERVICES.map(([name, description, basePrice, duration]) => ({ name, description, basePrice, duration })));
    console.log(`Added ${SERVICES.length} services.`);
  }
  await mongoose.disconnect();
})();
