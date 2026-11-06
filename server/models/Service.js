const mongoose = require('mongoose');

module.exports = mongoose.model(
  'Service',
  new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true, maxlength: 80 },
      description: { type: String, trim: true, maxlength: 300, default: '' },
      basePrice: { type: Number, required: true, min: 0 },
      duration: { type: String, default: '2 hrs' },
      active: { type: Boolean, default: true },
    },
    { timestamps: true }
  )
);
