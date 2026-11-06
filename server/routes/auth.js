// One login for everyone. The user's role (from the database) decides what they can open.
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { setSessionCookie, clearSessionCookie } = require('../utils/tokens');
const { attemptLogin, publicUser, validPassword, EMAIL, clean } = require('../utils/auth');
const { sha256 } = require('../utils/crypto');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, try again later' },
});

router.post('/signup', limiter, async (req, res) => {
  const name = clean(req.body.name, 80);
  const email = String(req.body.email || '').toLowerCase().trim();
  const { password } = req.body;
  if (!name || !EMAIL.test(email)) return res.status(400).json({ message: 'Enter your name and a valid email' });
  if (!validPassword(password, 8)) return res.status(400).json({ message: 'Password must be at least 8 characters' });
  if (await User.exists({ email })) return res.status(409).json({ message: 'That email is already registered' });
  // Role is always "customer" here, whatever the request body says.
  const user = await User.create({ name, email, role: 'customer', passwordHash: await bcrypt.hash(password, 12) });
  setSessionCookie(res, user);
  res.status(201).json({ user: publicUser(user) });
});

router.post('/login', limiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email and password required' });
  }
  const user = await attemptLogin(email, password);
  if (user === 'locked') return res.status(429).json({ message: 'Too many attempts, try again in 15 minutes' });
  if (!user) return res.status(401).json({ message: 'Invalid email or password' });
  setSessionCookie(res, user);
  res.json({ user: publicUser(user) });
});

// Invited staff choose their password here. The link token works once and expires after 48 hours.
router.post('/accept-invite', limiter, async (req, res) => {
  const { token, password } = req.body || {};
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) {
    return res.status(400).json({ message: 'This invite link is invalid or has expired. Ask an admin for a new one.' });
  }
  if (!validPassword(password, 10)) return res.status(400).json({ message: 'Password must be at least 10 characters' });
  const user = await User.findOne({
    inviteTokenHash: sha256(token),
    inviteExpires: { $gt: new Date() },
    role: 'admin',
    active: true,
  });
  if (!user) return res.status(400).json({ message: 'This invite link is invalid or has expired. Ask an admin for a new one.' });
  user.passwordHash = await bcrypt.hash(password, 12);
  user.inviteTokenHash = undefined;
  user.inviteExpires = undefined;
  user.failedLogins = 0;
  user.lockUntil = undefined;
  await user.save();
  res.json({ ok: true, email: user.email });
});

router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;
