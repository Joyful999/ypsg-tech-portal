# YPSG Tech Portal — Backend API

Node.js + Express + MySQL backend for the YPSG Youth Tech Empowerment Seminar portal:
registration, login, certificate generation (PDF via PDFKit), certificate email delivery
(Nodemailer/SMTP), and an admin API for participant management.

## Stack
- **Express** — HTTP framework
- **MySQL** (via `mysql2/promise`) — raw SQL, no ORM
- **JWT** (`jsonwebtoken`) — separate secrets/tokens for participants vs. admins
- **bcryptjs** — password hashing (pure JS — no native build step, so it installs cleanly everywhere)
- **Nodemailer** — SMTP email delivery
- **PDFKit** — certificate PDF generation
- **express-validator**, **helmet**, **cors**, **express-rate-limit** — validation & hardening

## Setup

```bash
cd ypsg-backend
npm install
cp .env.example .env
# edit .env with your real DB, JWT, SMTP, and admin-seed values

# Create the database + tables, and seed the first admin account:
npm run migrate

# Start the API (auto-restarts on change):
npm run dev
# or for production:
npm start
```

The server checks its MySQL and SMTP connections at startup and logs whether each
succeeded — if either fails, look at the printed error and double-check the matching
`.env` variables.

> **Note on this repo as delivered:** it was built in a sandboxed environment with no
> access to the public npm registry, so `npm install` hasn't been run here — you'll need
> to run it yourself once you copy this folder into an environment with normal internet
> access. Every file has already been syntax-checked (`node --check`).

### Certificate fonts (optional but recommended)

`utils/generateCertificatePdf.js` looks for Cinzel/Poppins `.ttf` files in
`assets/fonts/` to match the website's typography exactly. See
`assets/fonts/README.txt` for the four filenames it expects and where to get them
(both are free Google Fonts). Without them, the PDF still generates correctly using
PDFKit's built-in Times-Roman/Helvetica as a close stand-in.

## Environment variables

See `.env.example` for the full list with comments. Key ones:

| Variable | Purpose |
|---|---|
| `DB_*` | MySQL connection |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Participant session tokens |
| `ADMIN_JWT_SECRET` / `ADMIN_JWT_EXPIRES_IN` | Admin session tokens (kept separate on purpose) |
| `BCRYPT_SALT_ROUNDS` | Password hashing cost factor |
| `SMTP_*`, `MAIL_FROM_*` | Certificate delivery email |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used once by `npm run migrate` to create the first admin |
| `CLIENT_ORIGIN` | Comma-separated list of frontend origins allowed by CORS |

## API Reference

All request/response bodies are JSON unless noted. Protected routes expect
`Authorization: Bearer <token>`.

### Auth — `/api/auth`
| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/register` | — | `fullName, email, password, confirmPassword` | Creates account, returns `{ user, token }` |
| POST | `/login` | — | `email, password` | Returns `{ user, token }` |
| GET | `/me` | user | — | Returns `{ user, certificate }` for the logged-in account |

### Certificates — `/api/certificates` (all routes require a user token)
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/generate` | `certificateName` | Generates the PDF, saves it, emails it. 409 if already generated and not unlocked by an admin |
| GET | `/status` | — | Current certificate status for this account |
| GET | `/download` | — | Streams the PDF file |

### Admin — `/api/admin`
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/login` | — | `email, password` → `{ admin, token }` (admin-only JWT secret) |
| GET | `/stats` | admin | `{ totalUsers, generated, sent, pending }` |
| GET | `/participants?search=&status=` | admin | `status`: `all` \| `generated` \| `not_generated` \| `pending` |
| GET | `/participants/export?search=&status=` | admin | Downloads a CSV of the current filter |
| DELETE | `/participants/:id` | admin | Deletes a user (cascades their certificate row + best-effort deletes the PDF file) |
| POST | `/participants/:id/resend-certificate` | admin | Re-sends the existing certificate email |
| POST | `/participants/:id/allow-regeneration` | admin | Unlocks certificate generation again for that user (spec requirement: "prevent duplicate generation unless permitted by an administrator") |

## Wiring up the frontend

In the frontend's `js/register.js`, `js/login.js`, `js/dashboard.js`, and `js/admin.js`,
every place that should call this API is already marked with a `// TODO` comment showing
the exact `fetch()` call to swap in — store the returned `token` (e.g. in memory or
`sessionStorage`) and send it as `Authorization: Bearer <token>` on subsequent requests.
