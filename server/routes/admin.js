// Everything under /api/admin requires a logged-in, active admin (checked against the database on every request).
const router = require('express').Router();
const path = require('path');
const mongoose = require('mongoose');
const { adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { STATUSES } = require('../config');
const { EMAIL, clean } = require('../utils/auth');
const { sendInvite } = require('../utils/mailer');
const { sha256, randomToken } = require('../utils/crypto');

router.use(adminOnly);
router.param('id', (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : res.status(400).json({ message: 'Invalid id' })
);

/* ---------- bookings ---------- */
router.get('/bookings', async (req, res) => {
  res.json(
    await Booking.find().populate('user', 'name email').populate('service', 'name').sort('-createdAt').limit(300)
  );
});

router.patch('/bookings/:id', async (req, res) => {
  if (!STATUSES.includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' });
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  booking.status = req.body.status; // customers see this in their progress tracker
  await booking.save();
  res.json(booking);
});

// Damage photos are private: only logged-in admins can open them.
router.get('/photos/:file', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'uploads', path.basename(req.params.file)), (err) => {
    if (err) res.status(404).end();
  });
});

/* ---------- services ---------- */
router.get('/services', async (req, res) => res.json(await Service.find().sort('createdAt')));

router.post('/services', async (req, res) => {
  const name = clean(req.body.name, 80);
  const basePrice = Number(req.body.basePrice);
  if (!name || !(basePrice >= 0)) return res.status(400).json({ message: 'Name and price required' });
  const s = await Service.create({
    name,
    basePrice,
    description: clean(req.body.description, 300),
    duration: clean(req.body.duration, 20) || '2 hrs',
  });
  res.status(201).json(s);
});

router.patch('/services/:id', async (req, res) => {
  const s = await Service.findById(req.params.id);
  if (!s) return res.status(404).json({ message: 'Service not found' });
  if (req.body.basePrice !== undefined) {
    const p = Number(req.body.basePrice);
    if (!(p >= 0)) return res.status(400).json({ message: 'Invalid price' });
    s.basePrice = p;
  }
  if (req.body.name !== undefined) s.name = clean(req.body.name, 80) || s.name;
  if (req.body.description !== undefined) s.description = clean(req.body.description, 300);
  if (req.body.duration !== undefined) s.duration = clean(req.body.duration, 20) || s.duration;
  if (typeof req.body.active === 'boolean') s.active = req.body.active;
  await s.save();
  res.json(s);
});

/* ---------- staff: any logged-in admin can invite other admins ---------- */
const INVITE_MS = 48 * 36e5;

// Gives the user a fresh single-use invite token (only its hash is stored). Caller saves.
function newInvite(user) {
  const token = randomToken();
  user.inviteTokenHash = sha256(token);
  user.inviteExpires = new Date(Date.now() + INVITE_MS);
  return `${process.env.CLIENT_URL || 'http://localhost:5173'}/accept-invite?token=${token}`;
}

// Emails the link when SMTP is set up; otherwise hands it back so the inviting admin can send it.
async function deliverInvite(res, user, link, status) {
  const emailed = await sendInvite(user.email, user.name, link);
  res.status(status).json({ id: user.id, emailed, inviteUrl: emailed ? undefined : link });
}

router.get('/staff', async (req, res) => {
  const list = await User.find({ role: 'admin' }).select('+passwordHash').sort('createdAt');
  res.json(
    list.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      active: u.active,
      hasPassword: !!u.passwordHash, // never the hash itself
      inviteExpired: !u.passwordHash && (!u.inviteExpires || u.inviteExpires < new Date()),
      isMe: u.id === req.admin.id,
    }))
  );
});

// Inviting = creating an admin with no password yet, plus a link to choose one.
router.post('/staff/invite', async (req, res) => {
  const name = clean(req.body.name, 80);
  const email = String(req.body.email || '').toLowerCase().trim();
  if (!name || !EMAIL.test(email)) return res.status(400).json({ message: 'Enter a name and valid email' });
  // An email can never be both a customer and an admin.
  if (await User.exists({ email })) return res.status(409).json({ message: 'That email already has an account' });
  const user = new User({ name, email, role: 'admin', invitedBy: req.admin.id });
  const link = newInvite(user);
  await user.save();
  await deliverInvite(res, user, link, 201);
});

// For staff who never set a password or forgot it: clears the password, ends their sessions, issues a new link.
router.post('/staff/:id/reinvite', async (req, res) => {
  if (req.params.id === req.admin.id) return res.status(400).json({ message: 'You cannot reset your own access here' });
  const user = await User.findOne({ _id: req.params.id, role: 'admin' });
  if (!user) return res.status(404).json({ message: 'Staff member not found' });
  if (!user.active) return res.status(400).json({ message: 'Reactivate this staff member first' });
  user.passwordHash = undefined;
  user.sessionVersion = (user.sessionVersion || 0) + 1;
  user.failedLogins = 0;
  user.lockUntil = undefined;
  const link = newInvite(user);
  await user.save();
  await deliverInvite(res, user, link, 200);
});

// Deactivate or reactivate. Deactivating ends their session on their very next request.
router.patch('/staff/:id', async (req, res) => {
  if (req.params.id === req.admin.id) return res.status(400).json({ message: 'You cannot change your own access' });
  if (typeof req.body.active !== 'boolean') return res.status(400).json({ message: 'active must be true or false' });
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'admin' },
    { active: req.body.active },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: 'Staff member not found' });
  res.json({ id: user.id, active: user.active });
});

module.exports = router;
