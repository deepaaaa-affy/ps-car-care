// Creates the FIRST admin (the owner) from ADMIN_EMAIL and ADMIN_PASSWORD in .env. Run once.
// The owner then logs in on the normal /login page and invites other staff from the admin panel.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { EMAIL } = require('../utils/auth');

(async () => {
  const email = String(process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!EMAIL.test(email)) {
    console.error('Set ADMIN_EMAIL (the owner\'s email) in server/.env');
    process.exit(1);
  }
  if (password.length < 12 || password.length > 128) {
    console.error('Set ADMIN_PASSWORD in server/.env (at least 12 characters)');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  if (await User.exists({ email })) {
    console.log('That email already has an account. Nothing changed.');
  } else {
    await User.create({ name: 'Owner', email, role: 'admin', passwordHash: await bcrypt.hash(password, 12) });
    console.log(`Admin created: ${email}`);
    console.log('Log in at /login with this email and password, then remove ADMIN_PASSWORD from server/.env.');
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
