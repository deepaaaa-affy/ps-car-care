const mongoose = require('mongoose');
const { STATUSES } = require('../config');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    vehicleSize: { type: String, enum: ['small', 'sedan', 'large'], required: true },
    date: { type: String, required: true }, // YYYY-MM-DD, business local date
    slot: { type: String, required: true }, // e.g. 09:00
    price: { type: Number, required: true },
    status: { type: String, enum: STATUSES, default: 'pending' },
    photos: [String], // damage photos (V2)
    phone: String,
    smsReminder: { type: Boolean, default: false }, // V2: sent by an SMS provider later
    deposit: {
      requested: { type: Boolean, default: false }, // V2: paid through Stripe later
      amount: { type: Number, default: 0 },
      paid: { type: Boolean, default: false },
    },
    slotActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

bookingSchema.pre('save', function () {
  this.slotActive = this.status !== 'cancelled';
});

// Two customers can never hold the same date + slot (cancelled bookings free it).
bookingSchema.index(
  { date: 1, slot: 1 },
  { unique: true, partialFilterExpression: { slotActive: true } }
);

module.exports = mongoose.model('Booking', bookingSchema);
