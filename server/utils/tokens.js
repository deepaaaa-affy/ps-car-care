const jwt = require('jsonwebtoken');

const prod = process.env.NODE_ENV === 'production';
const need = (name) => {
  if (!process.env[name]) throw new Error(`${name} is not set`);
  return process.env[name];
};

// One session cookie "token" for everyone. Admin sessions are shorter.
// The token only says WHO the user is; their role and active flag are re-read from the database on every request.
const HOURS = { admin: 12, customer: 7 * 24 };
const cookieOpts = { httpOnly: true, sameSite: 'lax', secure: prod, path: '/' };

exports.setSessionCookie = (res, user) => {
  const hours = HOURS[user.role] || HOURS.customer;
  const t = jwt.sign({ id: user.id, v: user.sessionVersion || 0 }, need('JWT_SECRET'), { expiresIn: hours * 3600 });
  res.cookie('token', t, { ...cookieOpts, maxAge: hours * 36e5 });
};
exports.clearSessionCookie = (res) => res.clearCookie('token', cookieOpts);
exports.verifySession = (t) => jwt.verify(t, need('JWT_SECRET'));
