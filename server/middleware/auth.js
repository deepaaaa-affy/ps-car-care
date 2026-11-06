const User = require('../models/User');
const { verifySession } = require('../utils/tokens');

// Reads the session cookie and loads the user fresh from the database.
// The role is never taken from the cookie. Deactivating someone, or sending them a new invite
// (which bumps sessionVersion), ends their session on their very next request.
async function sessionUser(req) {
  const p = verifySession(req.cookies.token);
  const u = await User.findById(p.id);
  if (!u || !u.active || (u.sessionVersion || 0) !== (p.v || 0)) throw new Error('bad session');
  return u;
}

// Any logged-in user (customer or admin).
exports.protect = async (req, res, next) => {
  try {
    req.user = await sessionUser(req);
    next();
  } catch {
    res.status(401).json({ message: 'Please log in' });
  }
};

// Customer features (booking, My bookings).
exports.customerOnly = async (req, res, next) => {
  let u;
  try {
    u = await sessionUser(req);
  } catch {
    return res.status(401).json({ message: 'Please log in' });
  }
  if (u.role !== 'customer') return res.status(403).json({ message: 'This is for customer accounts' });
  req.user = u;
  next();
};

// Everything under /api/admin.
exports.adminOnly = async (req, res, next) => {
  let u;
  try {
    u = await sessionUser(req);
  } catch {
    return res.status(401).json({ message: 'Please log in' });
  }
  if (u.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
  req.user = req.admin = u;
  next();
};
