const crypto = require('crypto');

// Invite links carry a random token; only its SHA-256 hash is stored in the database.
exports.sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');
exports.randomToken = () => crypto.randomBytes(32).toString('hex');
