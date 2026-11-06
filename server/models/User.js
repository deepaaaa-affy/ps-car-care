const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false }, // empty for invited staff until they accept the invite
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    active: { type: Boolean, default: true },
    sessionVersion: { type: Number, default: 0 }, // bumped to end every existing session for this user
    inviteTokenHash: { type: String, select: false }, // SHA-256 of the single-use invite token
    inviteExpires: Date,
    lastLoginAt: Date,
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    failedLogins: { type: Number, default: 0 },
    lockUntil: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
