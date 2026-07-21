# YPSG Tech Portal — Landing Page

Static landing page (HTML5 / CSS3 / vanilla ES6+ — no frameworks) for the YPSG Youth Tech
Empowerment Seminar, per the full site spec.

## Files
- `index.html` — full landing page markup (nav, hero, about, topics, benefits, event info, FAQ, contact, footer)
- `register.html` / `login.html` — participant auth pages
- `dashboard.html` — participant dashboard + certificate generation/preview/download
- `admin-login.html` / `admin.html` — admin auth + participant management panel
- `css/` — `style.css` (site-wide), `auth.css` (shared auth-page styling), `dashboard.css`, `admin.css`
- `js/api.js` — shared API client: base URL, fetch wrapper, session/token storage (used by every other script)
- `js/main.js`, `js/auth-common.js`, `js/register.js`, `js/login.js`, `js/dashboard.js`, `js/admin-login.js`, `js/admin.js`

## Backend wiring
Every page now calls the real Express API in `ypsg-backend/` (see that project's README) instead of
simulating requests:
- `js/api.js` sets `API_BASE_URL` — change this to your deployed backend's URL.
- Register/login/admin-login POST to `/api/auth/register`, `/api/auth/login`, `/api/admin/login` and store
  the returned JWT in `sessionStorage` (participant and admin tokens are kept separate).
- The dashboard fetches `/api/auth/me` on load, posts to `/api/certificates/generate`, and downloads the
  real PDF from `/api/certificates/download` (with the `Authorization` header, via a blob download — a
  plain `<a href>` can't attach auth headers).
- The admin panel fetches `/api/admin/stats` and `/api/admin/participants` (with live search/status-filter
  query params), and calls delete / resend-certificate / export endpoints with the admin token.
- If a token is missing or the API returns 401, the relevant page redirects back to its login page.

Run the backend locally (`npm run dev` inside `ypsg-backend/`, default port 5000) and open any of these
HTML files directly in a browser, or serve them with any static file server — no build step needed.

## Design notes
- Signature element: an "Adire × circuit" line motif (in the hidden `<svg>` defs, `#adire-motif`) —
  a pattern that merges traditional Yoruba adire cloth geometry with circuit-board tracing, used as
  the hero watermark, the About section illustration, and the dark Event Info section backdrop. It's
  the one deliberately bold visual choice tying "Yoruba Political Stakeholders Group" and "tech
  seminar" together instead of using a generic stock photo or abstract blob.

## Opening it
Just open `index.html` in a browser — no build step, no dependencies to install. Google Fonts and
Font Awesome load from their CDNs, so an internet connection is needed for icons/fonts to render;
everything else is self-contained.
