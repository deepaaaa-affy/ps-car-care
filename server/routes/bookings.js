const router = require('express').Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { customerOnly } = require('../middleware/auth');
const { SLOTS, SIZES, DEPOSIT_RATE, DEPOSITS_ENABLED, TIMEZONE } = require('../config');

const dir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(dir, { recursive: true });
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = multer({
  storage: multer.diskStorage({
    destination: dir,
    filename: (req, f, cb) => cb(null, crypto.randomBytes(16).toString('hex') + EXT[f.mimetype]),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
  fileFilter: (req, f, cb) =>
    EXT[f.mimetype] ? cb(null, true) : cb(Object.assign(new Error('Only JPG, PNG or WebP images'), { status: 400 })),
});

const todayLocal = () => new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
function validDate(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return false;
  const dt = new Date(d + 'T00:00:00Z');
  return !isNaN(dt) && dt.getUTCDay() !== 0 && d >= todayLocal(); // closed Sundays, no past dates
}

// Which slots are already taken on a date.
router.get('/slots', async (req, res) => {
  if (!validDate(req.query.date)) return res.status(400).json({ message: 'Choose a valid date' });
  const taken = await Booking.find({ date: req.query.date, slotActive: true }).distinct('slot');
  res.json({ slots: SLOTS, taken });
});

router.post('/', customerOnly, upload.array('photos', 3), async (req, res) => {
  const files = req.files || [];
  const dropFiles = () => files.forEach((f) => fs.unlink(f.path, () => {}));
  const { serviceId, vehicleSize, date, slot, phone } = req.body;
  const service = mongoose.isValidObjectId(serviceId) && (await Service.findOne({ _id: serviceId, active: true }));
  if (!service || !SIZES[vehicleSize] || !SLOTS.includes(slot) || !validDate(date)) {
    dropFiles();
    return res.status(400).json({ message: 'Please check your booking details' });
  }
  const sms = req.body.smsReminder === 'true';
  const deposit = DEPOSITS_ENABLED && req.body.payDeposit === 'true';
  if (sms && !/^[0-9+\s]{8,15}$/.test(phone || '')) {
    dropFiles();
    return res.status(400).json({ message: 'Enter a valid mobile number for SMS reminders' });
  }
  const price = Math.round(service.basePrice * SIZES[vehicleSize]); // always calculated on the server
  try {
    const booking = await Booking.create({
      user: req.user.id,
      service: service.id,
      vehicleSize,
      date,
      slot,
      price,
      smsReminder: sms,
      phone: sms ? phone.trim() : undefined,
      photos: files.map((f) => f.filename),
      deposit: { requested: deposit, amount: deposit ? Math.round(price * DEPOSIT_RATE) : 0, paid: false },
    });
    res.status(201).json(booking);
  } catch (e) {
    dropFiles();
    if (e.code === 11000) return res.status(409).json({ message: 'Sorry, that slot was just taken. Pick another.' });
    throw e;
  }
});

router.get('/mine', customerOnly, async (req, res) => {
  res.json(await Booking.find({ user: req.user.id }).populate('service', 'name').sort('-createdAt'));
});

router.patch('/:id/cancel', customerOnly, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  const b = await Booking.findOne({ _id: req.params.id, user: req.user.id });
  if (!b) return res.status(404).json({ message: 'Booking not found' });
  if (!['pending', 'approved'].includes(b.status)) return res.status(400).json({ message: 'This booking can no longer be cancelled' });
  b.status = 'cancelled';
  await b.save();
  res.json(b);
});

module.exports = router;
