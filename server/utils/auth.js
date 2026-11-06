const bcrypt = require('bcryptjs');
const User = require('../models/User');

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

exports.publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });
exports.validPassword = (p, min = 8) => typeof p === 'string' && p.length >= min && p.length <= 128;
exports.EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
exports.clean = (s, max) => String(s || '').trim().slice(0, max);

exports.registerFail = async (user) => {
  user.failedLogins += 1;
  if (user.failedLogins >= MAX_FAILS) {
    user.lockUntil = new Date(Date.now() + LOCK_MS);
    user.failedLogins = 0;
  }
  await user.save();
};

// Returns the user, null for bad credentials, or 'locked'.
// Same error and similar timing whether the email exists or not.
exports.attemptLogin = async (email, password) => {
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+passwordHash');
  if (!user || !user.active || !user.passwordHash) {
    await bcrypt.compare(String(password), DUMMY_HASH);
    return null;
  }
  if (user.lockUntil && user.lockUntil > Date.now()) return 'locked';
  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) {
    await exports.registerFail(user);
    return null;
  }
  user.failedLogins = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();
  return user;
};
