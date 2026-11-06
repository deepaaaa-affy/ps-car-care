const nodemailer = require('nodemailer');

const configured = !!process.env.SMTP_HOST;
const transport = configured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

exports.mailConfigured = configured;

// Sends a new staff member their set-password link. Returns true if an email was sent.
// Without SMTP settings nothing is sent; the admin panel shows the link instead.
exports.sendInvite = async (to, name, inviteUrl) => {
  const text =
    `Hi ${name},\n\nYou have been added as a staff admin at PS Car Care.\n\n` +
    `Open the link below to choose your password. It works once and expires in 48 hours.\n\n${inviteUrl}\n\n` +
    `Then log in on the normal website login page with ${to} and your new password.\n`;
  if (!transport) return false;
  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'You have been added to PS Car Care admin',
    text,
  });
  return true;
};
