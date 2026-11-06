# PS Car Care (MERN)

Website for PS Car Care, Albury NSW: public site, customer accounts, online booking
and a staff admin panel. Customers and staff share one login; staff join by invite.

```
server/   Express + MongoDB API
client/   React (Vite) website
```

## Quick start (VS Code)

Once `server/.env` is filled in (step 2), from the project folder:

```bash
npm install && npm run install:all   # first time only
npm run dev                          # API on :5000 + website on http://localhost:5173
```

Or in VS Code: **Terminal > Run Build Task** (Ctrl+Shift+B) starts both, and the
**Run and Debug** panel has "Open website (Chrome/Edge)" and "Debug API".

## 1. What you need

- Node.js 18 or newer
- A MongoDB database: free MongoDB Atlas, or MongoDB installed locally

## 2. Run it locally

**API**

```bash
cd server
npm install
cp .env.example .env
```

Fill in `.env`:

- `MONGO_URI` (your Atlas or local connection string)
- `JWT_SECRET`. Generate it with
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `ADMIN_EMAIL`: the owner's email
- `ADMIN_PASSWORD`: the owner's first password, at least 12 characters

Then:

```bash
npm run seed:services   # adds the 9 starting services
npm run seed:admin      # creates the owner admin from ADMIN_EMAIL and ADMIN_PASSWORD
npm run dev             # API on http://localhost:5000
```

After `seed:admin` has run, remove `ADMIN_PASSWORD` from `.env`. If the email already exists,
the script changes nothing and says so.

**Website** (second terminal)

```bash
cd client
npm install
npm run dev             # http://localhost:5173
```

## 3. Logging in

Everyone uses the same page: `http://localhost:5173/login`, with email and password.

- **Customers** sign up at `/signup` and land on **My bookings** after logging in.
- **Admins** land on the admin panel (`/admin`). The **Admin** link in the menu only appears for them.
- The account's role is stored in the database. The server re-reads it on every request and never trusts
  the browser, so a customer can never open the admin area or its API.

The owner logs in for the first time with `ADMIN_EMAIL` and `ADMIN_PASSWORD` (step 2).

## 4. Adding staff as admins

Admin panel > **Staff** > enter the person's name and email > **Invite as admin**.

- Any logged-in admin can invite others.
- The invite creates an admin account with no password yet, and a link: `/accept-invite?token=...`
- With SMTP settings in `.env`, the link is emailed automatically. Without them, the panel shows the link
  with a **Copy** button so you can send it yourself (text, email, etc.).
- The invited person opens the link, chooses a password (at least 10 characters, typed twice),
  then logs in on the normal `/login` page.
- The link works **once** and expires after **48 hours**.
- An email can't be both a customer and an admin: inviting an email that already has an account is refused.
- **Send new invite**: for staff who never set a password, whose link expired, or who forgot their password.
  It clears their password, logs them out everywhere, and creates a fresh link.
- **Deactivate** blocks someone straight away, even if they are logged in. **Reactivate** lets them back in.
  You cannot deactivate yourself.

## 5. How logins are protected

- Passwords are hashed with bcrypt. No API ever returns a password or hash.
- One session cookie (`token`): httpOnly, SameSite=Lax, Secure in production.
  Admin sessions last 12 hours, customer sessions 7 days.
- Every protected request loads the user from the database and checks they still exist, are active and
  have the right role. Deactivated users are refused immediately.
- 5 wrong passwords lock the account for 15 minutes. Login, signup and accept-invite are rate limited per IP.
- Wrong password and unknown email give the same "Invalid email or password" message.
- Invite tokens are random; only their SHA-256 hash is stored, and they are deleted once used.
- Damage photos are only viewable by logged-in admins.

## 6. Going live

- Host the website and API under the same site (for example `pscarcare.com.au` and `api.pscarcare.com.au`) so the session cookie is sent to the API.
- Set `NODE_ENV=production`, `CLIENT_URL` to the website address (invite links use it).
- Add SMTP settings if you want invite emails sent automatically.
- Uploaded photos are stored in `server/uploads`. On hosts with temporary disks (Render free tier), move them to Cloudinary or S3.

## Not built yet

- Online deposit payments (Stripe). For now customers pay at the shop only; the deposit option is
  off (`DEPOSITS_ENABLED` in `server/config.js`, plus the payment choice in `client/src/pages/Book.jsx`).
- Real SMS reminders (needs a provider such as Twilio). The reminder preference and mobile number are saved.
- Admin upload for the before/after gallery (the gallery page uses placeholders).
- Booking length (long jobs such as PPF, which takes 1 day, currently hold only one time slot).
