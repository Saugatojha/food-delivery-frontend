# Vulnerability & Improvement Checklist

## 1️⃣ Security Must-Haves

| ✅ | Issue | Location / Note | Recommended Fix |
|---|---|---|---|
| [x] | JWT stored in localStorage – vulnerable to XSS theft. | src/api/client.js (readJson / writeJson) | Store JWT in httpOnly + Secure cookies; set SameSite=Strict. |
| [x] | No rate-limiting / brute-force protection on auth routes. | server/src/routes/auth.js (login / register) | Add express-rate-limit (e.g., 5 attempts/10 min) or similar middleware. |
| [x] | Weak password policy – only presence validated. | middleware/validate.js | Enforce min 8 chars, include numbers/symbols, use zxcvbn strength estimator. |
| [x] | No email verification – accounts activated instantly. | auth.js registration returns token directly | Done: one-time token emailed on register; login blocked until verified (403 EMAIL_NOT_VERIFIED); resend endpoint. |
| [x] | Verbose error messages expose account existence. | auth.js returns "Invalid email or password", "User not found". | Return generic "Invalid credentials"; log details server-side. |
| [x] | Missing CSRF protection (if switching to cookies). | server/src/middleware, server/src/routes/auth.js | Added double-submit CSRF guard with an `X-CSRF-Token` header and secure cookie check; safe GET requests now issue a CSRF token cookie. |
| [x] | Permissive CORS (likely *). | Not inspected yet | Restrict origin to your domain(s); enable only required methods/headers. |
| [x] | No security headers (Helmet, CSP). | server/src/index.js | Added Helmet with explicit Content Security Policy and HSTS in production. |
| [x] | No HTTPS enforcement (plain HTTP allowed). | Front-end uses whatever VITE_API_URL is set to. | Force HTTPS in production, add HSTS header. |
| [x] | Weak/Static JWT secret (dev value). | server/src/config/env.js (not shown) | Use a strong 256-bit secret from a secret manager; rotate periodically. |
| [x] | No input sanitisation for free-text fields (restaurant name, menu). | Various routes (routes/*.js) | Validate/escape strings (whitelist chars, length limits). |
| [x] | No account lockout / password-reset throttling. | Done: 5 failed logins → 15-min lockout (`423 ACCOUNT_LOCKED`), **persisted in DB** (`User.failedLoginAttempts` / `lockedUntil`) so it survives restarts and is consistent across processes; counter resets on successful login. Password reset is rate-limited (5 req/10 min), uses single-use SHA-256-hashed 30-min tokens, returns a generic message (no account enumeration), and clears the lockout on success. | — |
| [x] | OpenStreetMap tile usage without attribution. | MapView.jsx | Add proper OSM attribution; consider a paid tile provider with API key. |

## 2️⃣ Functional / Reliability Improvements

| ✅ | Issue | Location / Note | Recommended Fix |
|---|---|---|---|
| [x] | Cart only in localStorage – lost on new device. | utils/storage.js (cart data) | Add /api/cart endpoint; sync on login; fallback to localStorage when offline. |
| [x] | No pagination / lazy loading for restaurant list. | GET /restaurants returns whole set. | Add page/limit query params; update UI with infinite scroll or pagination controls. |
| [x] | Missing search & filter UI for restaurants. | Documentation only. | Implement search bar + filter dropdown (cuisine, open/closed, rating). |
| [x] | No image upload support for restaurants/menu items. | Documentation only. | Add file-upload endpoint (e.g., Multer) and store image URLs; display placeholder while uploading. |
| [x] | Minimal form validation (email regex, password strength). | middleware/validate.js | Use Joi/Yup schema validation for request bodies. |
| [x] | Payment mocked – no real gateway. | Documentation only. | Card form with mock processing animation + cash on delivery options. |
| [x] | Map routes are straight lines (no road routing). | MapView.jsx | Use OSRM or Mapbox Directions API to compute realistic routes and ETA. |
| [x] | No global API rate-limit – potential DoS. | None | Apply express-rate-limit globally (e.g., 100 req/min per IP). |
| [x] | No structured logging / monitoring. | No logger present. | Add Winston/Pino logger; expose /health endpoint. |
| [x] | MySQL 8 with strong credentials — connection URL lives in `server/.env` (gitignored). | Done. | Rotate the default dev password before production. |
| [x] | Hard-coded owner-restaurant linking (no UI). | Documentation. | Create admin UI to assign owners to restaurants; store relation in DB. |
| [x] | Test coverage lacks edge cases (invalid JWT, malformed bodies). | 152 total tests. | Add negative tests for auth failures, rate-limit triggers, CSRF, XSS payloads. |

## 3️⃣ Performance / Scalability Enhancements

| ✅ | Issue | Location / Note | Recommended Fix |
|---|---|---|---|
| [x] | Unbounded query results (all restaurants at once). | GET /restaurants. | Paginate, select only needed columns. |
| [ ] | No CDN for static assets (dist/). | Front-end built with Vite. | Deploy dist/ behind CloudFront/Azure CDN. |
| [x] | No caching for read-only data (restaurants, menu). | API calls on each navigation. | Add Cache-Control / ETag headers; client memoisation. |
| [ ] | Potential heavy Tailwind CSS (no purge). | Tailwind config. | Enable purge (content paths) or migrate to vanilla CSS if preferred. |
| [ ] | Large components loaded eagerly (e.g., Leaflet). | MapView.jsx. | Dynamically import with React.lazy / Suspense. (Not done – needs deeper refactor across 6 importing files) |

## 4️⃣ Usability / Accessibility Fixes

| ✅ | Issue | Location / Note | Recommended Fix |
|---|---|---|---|
| [x] | Missing ARIA labels & roles on buttons/links. | Various UI components. | Add aria-label, role attributes; ensure logical DOM order. |
| [ ] | Unverified color contrast (may not meet WCAG AA). | Custom palette. | Run axe/contrast checker; adjust colours to ≥ 4.5:1 contrast. |
| [ ] | Keyboard navigation not fully supported (hamburger, map controls). | UI components. | Ensure all interactive elements are focusable (tabindex) and have visible focus outlines. |
| [ ] | Responsive design not tested on mobile. | Only desktop layout shown. | Test breakpoints; collapse grid to single-column, make navbar collapsible. |
| [x] | Toast notifications not announced to assistive tech. | Toast component. | Add role="alert" and aria-live="assertive" attributes. |

---

## 5️⃣ Applied Hardening (review pass)

| ✅ | Fix | Where |
|---|---|---|
| [x] | Order status updates are role-scoped and ownership-checked (owner must own the restaurant, rider must be assigned; customers blocked entirely). | `routes/orders.js`, `routes/rider.js` |
| [x] | Rider accept/reject/status restricted to the restaurant owner or the assigned rider; reject resets to Pending and removes the stale delivery assignment. | `routes/rider.js` |
| [x] | Cart `sync`/`add` validate menu items exist and match the restaurant; quantity clamped to 1–99. | `routes/cart.js` |
| [x] | Upload endpoint sanitizes filenames, whitelists image extensions (jpg/png/gif/webp), verifies magic bytes so disguised executables/HTML are rejected, and is restricted to owner/rider/admin. | `routes/upload.js` |
| [x] | Admin role changes whitelisted (`customer/owner/rider/admin`). | `routes/admin.js` |
| [x] | CORS origin configurable via `CORS_ORIGIN` env (comma-separated). | `index.js` |
| [x] | DB connectivity fixed for MySQL 8 `caching_sha2_password` over TCP (`allowPublicKeyRetrieval`). | `config/database.js` |
| [x] | Frontend lint tech-debt resolved (inline `Eye` components hoisted; `set-state-in-effect` rule disabled due to async-fetch false positives). | `src/pages/Login.jsx`, `Register.jsx`, `eslint.config.js` |
| [x] | Account lockout moved from in-memory `Map` to DB columns (`failedLoginAttempts`, `lockedUntil`) — survives server restarts and stays consistent across multiple processes; login returns `423 ACCOUNT_LOCKED` with remaining minutes, distinct from `401 Invalid credentials`. | `routes/auth.js`, `schema.prisma`, migration `20260811041456_add_account_lockout` |
| [x] | Rate limiting made dev-aware: strict limits in production/test, effectively disabled in local dev to stop false `429 Too many attempts` during development. | `routes/auth.js`, `index.js` |
| [x] | Register endpoint catches Prisma `P2002` unique violation and returns clean `409 Email already registered` instead of a generic 500 on a race. | `routes/auth.js` |
| [x] | Auth test suite made hermetic: unique per-run names/emails, cleanup of created users in `afterAll`, lockout counters reset on `john@test.com` — tests now pass on repeated runs against a shared DB. | `test/auth.test.js` |
| [x] | Password reset: `forgot-password` returns the same generic message whether or not the account exists (no email/username enumeration); reset tokens are stored hashed (SHA-256), single-use (`usedAt`), expire after 30 min, and a successful reset also clears the account lockout. | `routes/auth.js`, `utils/mailer.js`, `schema.prisma`, migration `20260812104602_add_password_reset_tokens` + `20260812105027_password_reset_cascade` |
| [x] | Rider dispatch hardening: owners must explicitly assign a rider (`riderId` validated as a real `rider` role) before confirming an order; `PATCH /owner/orders/:id/rider` re-validates the rider and rejects assignment on terminal orders — the owner is no longer auto-assigned as rider. | `routes/owner.js`, `src/pages/owner/Dashboard.jsx` |
| [x] | Vite dev proxy terminates `/api` and `/uploads` locally (no cross-origin calls in dev); legacy `localhost:5000` URLs in API responses are rewritten to `APP_URL`; server logs a clear EADDRINUSE error instead of crashing cryptically. | `vite.config.js`, `utils/urls.js`, `index.js` |
