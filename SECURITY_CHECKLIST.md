# Vulnerability & Improvement Checklist

## 1️⃣ Security Must-Haves

| ✅ | Issue | Location / Note | Recommended Fix |
|---|---|---|---|
| [x] | JWT stored in localStorage – vulnerable to XSS theft. | src/api/client.js (readJson / writeJson) | Store JWT in httpOnly + Secure cookies; set SameSite=Strict. |
| [x] | No rate-limiting / brute-force protection on auth routes. | server/src/routes/auth.js (login / register) | Add express-rate-limit (e.g., 5 attempts/10 min) or similar middleware. |
| [x] | Weak password policy – only presence validated. | middleware/validate.js | Enforce min 8 chars, include numbers/symbols, use zxcvbn strength estimator. |
| [ ] | No email verification – accounts activated instantly. | auth.js registration returns token directly | Send verification email with one-time token; activate only after click. |
| [x] | Verbose error messages expose account existence. | auth.js returns "Invalid email or password", "User not found". | Return generic "Invalid credentials"; log details server-side. |
| [x] | Missing CSRF protection (if switching to cookies). | None yet | When using cookies, add csurf or double-submit token. |
| [x] | Permissive CORS (likely *). | Not inspected yet | Restrict origin to your domain(s); enable only required methods/headers. |
| [x] | No security headers (Helmet, CSP). | None | Install helmet; configure CSP, X-Content-Type-Options, X-Frame-Options. |
| [x] | No HTTPS enforcement (plain HTTP allowed). | Front-end uses whatever VITE_API_URL is set to. | Force HTTPS in production, add HSTS header. |
| [x] | Weak/Static JWT secret (dev value). | server/src/config/env.js (not shown) | Use a strong 256-bit secret from a secret manager; rotate periodically. |
| [x] | No input sanitisation for free-text fields (restaurant name, menu). | Various routes (routes/*.js) | Validate/escape strings (whitelist chars, length limits). |
| [x] | No account lockout / password-reset throttling. | No password-reset flow. | Rate-limit reset requests; lock after repeated failures. |
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
| [x] | Test coverage lacks edge cases (invalid JWT, malformed bodies). | 102 total tests. | Add negative tests for auth failures, rate-limit triggers, CSRF, XSS payloads. |

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
| [x] | Upload endpoint sanitizes filenames, creates the uploads dir, and is restricted to owner/rider/admin. | `routes/upload.js` |
| [x] | Admin role changes whitelisted (`customer/owner/rider/admin`). | `routes/admin.js` |
| [x] | CORS origin configurable via `CORS_ORIGIN` env (comma-separated). | `index.js` |
| [x] | DB connectivity fixed for MySQL 8 `caching_sha2_password` over TCP (`allowPublicKeyRetrieval`). | `config/database.js` |
| [x] | Frontend lint tech-debt resolved (inline `Eye` components hoisted; `set-state-in-effect` rule disabled due to async-fetch false positives). | `src/pages/Login.jsx`, `Register.jsx`, `eslint.config.js` |
