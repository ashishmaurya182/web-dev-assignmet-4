# EventEase

EventEase is a full-stack college event management platform built with React, Vite, Node.js, Express, MongoDB, and Mongoose.

## Features
- Browse and search events
- Register/login as student
- Sign in as student or admin with a password or emailed one-time code
- Reset a password after verifying an emailed one-time code
- Admin dashboard for event management
- Event registration with duplicate and capacity checks
- Optional student ID; personal email addresses are accepted
- Participant tracking
- Responsive glassmorphism UI

## Tech Stack
- Frontend: React, Vite, Tailwind CSS, React Router, Lucide React
- Backend: Node.js, Express.js, Mongoose, JWT, bcryptjs
- Database: MongoDB Atlas or local in-memory MongoDB during development

## Local setup
### Backend
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Open the frontend at http://localhost:5173 and the backend at http://localhost:5000.

To start both applications for a local demo, open two terminals:

```bash
# Terminal 1
cd server
npm start

# Terminal 2
cd client
npm run dev -- --host 0.0.0.0
```

## Environment variables
### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/eventease
JWT_SECRET=your-long-random-secret
CLIENT_URL=http://localhost:5173
OTP_SECRET=your-different-long-random-secret
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=EventEase <no-reply@your-domain.com>
```

For MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string.
Configure all SMTP variables on the backend to deliver sign-in and password-reset codes. `SMTP_SECURE` defaults to `true` on port 465 and `false` on other ports; set it explicitly only when your provider requires a different TLS mode. The server verifies the SMTP connection during startup, logs a safe status, and never prints OTP values. OTP requests fail unless the SMTP server accepts the email.

Use the SMTP host, port, username, and password supplied by your email provider. If you use Gmail, create and use a Google App Password rather than your regular account password. The `SMTP_FROM` address must be authorized by your provider; `eventease070@gmail.com` can be used there only if you control that mailbox and the SMTP provider allows it as a sender. Do not put SMTP credentials or production secrets in source control.

Email codes expire after 10 minutes, can be requested once per minute, and allow up to five verification attempts.

On the login page, choose **Email code** to request a sign-in code. To recover an account, choose **Forgot password?**, request a reset code, then enter it with a new password. The account role (student or admin) is read from the existing account; it is never selected by the user during sign-in.

### Capacity and database sizing

The local in-memory MongoDB is for development only; its data disappears when the server stops and it is not suitable for real student or registration records. For deployment, use MongoDB Atlas (or another managed MongoDB replica set), set `MONGO_URI`, and size the cluster against measured peak traffic. The app creates unique/indexed email and event-registration keys, maintains an atomic per-event registration counter for capacity checks, and paginates participant results (50 per page). Connection pool size can be tuned with `MONGO_MAX_POOL_SIZE` and `MONGO_MIN_POOL_SIZE`.

The requested 20,000 accounts and 5,000 registrations/day are reasonable planning targets for a properly sized managed database, but actual capacity depends on peak concurrency, event count, query patterns, and the Atlas tier. Load-test with representative data before production and monitor database CPU, connections, query latency, and storage. Do not treat the in-memory fallback or a successful local build as a production capacity test.

Connection pool timeouts are configurable with `MONGO_MAX_IDLE_TIME_MS`, `MONGO_SERVER_SELECTION_TIMEOUT_MS`, `MONGO_SOCKET_TIMEOUT_MS`, and `MONGO_WAIT_QUEUE_TIMEOUT_MS`. On a fresh deployment the server builds its declared indexes before accepting traffic and backfills counters for existing events once. If the API is behind a trusted reverse proxy, set `TRUST_PROXY=true`; otherwise leave it false.


### Frontend (.env)
```env
VITE_API_URL=
```

Locally, leaving `VITE_API_URL` empty uses the localhost backend only in Vite development mode. In production, set `VITE_API_URL` in the frontend host to the deployed backend URL ending in `/api` (for example, `https://your-backend.example.com/api`). Production builds reject localhost API URLs instead of silently calling the visitor's computer.

## Demo accounts
In non-production environments, optional demo users and events are seeded only when both `DEMO_ADMIN_PASSWORD` and `DEMO_STUDENT_PASSWORD` are set in the backend environment. Set private local values; production never seeds demo accounts.

## Deployment
- Frontend: Vercel
- Backend: Render

In Vercel, set `VITE_API_URL` to the deployed backend URL ending in `/api`, then redeploy the frontend. In Render (or another backend host), configure `MONGO_URI`, `JWT_SECRET`, `OTP_SECRET`, `CLIENT_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` as environment variables/secrets. Set `CLIENT_URL` to the exact Vercel origin, including `https://`; comma-separate additional trusted origins such as a custom domain or Vercel preview origin. Do not add a trailing slash to origins. SMTP credentials belong only in the backend host's secret environment settings, never Vercel or frontend variables. Do not set demo account passwords or enable demo data in production.

To test real delivery locally, copy `server/.env.example` to `server/.env`, enter valid SMTP settings from your provider, and set `SMTP_FROM` to a sender that provider authorizes. Start the backend and confirm its startup log says the SMTP connection was verified. Start the frontend with `VITE_API_URL=http://localhost:5000/api`, request an email code for an existing account, and check its inbox (including spam). A successful request is returned only after SMTP `sendMail()` succeeds; the backend logs the message ID but never the code. A test to an unregistered address returns an error and does not send an email.
