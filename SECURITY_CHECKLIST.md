# Vulnerability & Improvement Checklist

## 1️⃣ Security Must-Haves

| Status | Issue | Location / Note | Recommended Fix |
|--------|-------|-----------------|----------------|
| [ ] | JWT stored in localStorage – vulnerable to XSS theft | `src/api/client.js` (readJson/writeJson) | Store JWT in httpOnly + Secure cookies; set SameSite=Strict |
| [ ] | No rate-limiting / brute-force protection on auth routes | `server/src/routes/auth.js` (login/register) | Add `express-rate-limit` (e.g. 5 attempts/10 min) |
| [ ] | Weak password policy – only presence validated | `middleware/validate.js` | Enforce min 8 chars, include numbers/symbols, use zxcvbn |
| [ ] | No email verification – accounts activated instantly | `auth.js` registration returns token directly | Send verification email with one-time token |
| [ ] | Verbose error messages expose account existence | `auth.js` returns "Invalid email or password" | Return generic "Invalid credentials"; log details server-side |
| [ ] | Missing CSRF protection (if switching to cookies) | None yet | Add csurf or double-submit cookie pattern |
| [ ] | Permissive CORS (likely *) | Not inspected yet | Restrict origin to your domain(s) |
| [ ] | No security headers (Helmet, CSP) | None | Install helmet; configure CSP, X-Content-Type-Options, X-Frame-Options |
| [ ] | No HTTPS enforcement (plain HTTP allowed) | Front-end uses whatever VITE_API_URL is set to | Force HTTPS in production, add HSTS header |
| [ ] | Weak/Static JWT secret (dev value) | `server/src/config/env.js` | Use a strong 256-bit secret from a secret manager |
| [ ] | No input sanitisation for free-text fields | Various routes | Validate/escape strings (whitelist chars, length limits) |
| [ ] | No account lockout / password-reset throttling | No password-reset flow | Rate-limit reset requests; lock after repeated failures |
| [ ] | OSM tile usage without additional attribution | MapView.jsx | Add proper OSM attribution; consider paid tile provider |

## 2️⃣ Functional / Reliability Improvements

| Status | Issue | Location / Note | Recommended Fix |
|--------|-------|-----------------|----------------|
| [ ] | Cart only in localStorage – lost on new device | `utils/storage.js` (cart data) | Add `/api/cart` endpoint; sync on login; fallback to localStorage |
| [ ] | No pagination / lazy loading for restaurant list | GET /restaurants returns whole set | Add page/limit query params; update UI with pagination |
| [ ] | Missing search & filter UI for restaurants | Documentation only | Already implemented (search bar + cuisine chips + sort) |
| [ ] | No image upload support | Documentation only | Already implemented (placeholder URLs from placehold.co) |
| [ ] | Minimal form validation (email regex, password strength) | `middleware/validate.js` | Use Joi/Yup schema validation |
| [ ] | Payment mocked – no real gateway | Documentation only | Integrate Stripe/PayPal (feature flag for mock mode) |
| [ ] | Map routes are straight lines (no road routing) | MapView.jsx | Already implemented (OSRM road route via RoadRoute component) |
| [ ] | No global API rate-limit – potential DoS | None | Apply express-rate-limit globally (100 req/min per IP) |
| [ ] | No structured logging / monitoring | None | Add Winston/Pino logger; expose /health endpoint |
| [ ] | SQLite for dev only – not ready for production | Documentation | Switch to PostgreSQL/MySQL for production |
| [ ] | Hard-coded owner-restaurant linking (no UI) | Documentation | Create admin UI to assign owners to restaurants |
| [ ] | Test coverage lacks edge cases | 84 total tests | Add negative tests for auth failures, rate-limit, CSRF, XSS |

## 3️⃣ Performance / Scalability

| Status | Issue | Location / Note | Recommended Fix |
|--------|-------|-----------------|----------------|
| [ ] | Unbounded query results (all restaurants at once) | GET /restaurants | Paginate, select only needed columns |
| [ ] | No CDN for static assets (dist/) | Front-end built with Vite | Deploy dist/ behind CloudFront/Azure CDN |
| [ ] | No caching for read-only data (restaurants, menu) | API calls on each navigation | Add Cache-Control / ETag headers |
| [ ] | Potential heavy Tailwind CSS (no purge) | Tailwind config | Already handled (Vite + Tailwind v4 purges by default) |
| [ ] | Large components loaded eagerly (Leaflet) | MapView.jsx | Dynamically import with React.lazy / Suspense |

## 4️⃣ Usability / Accessibility

| Status | Issue | Location / Note | Recommended Fix |
|--------|-------|-----------------|----------------|
| [ ] | Missing ARIA labels & roles on buttons/links | Various UI components | Partially done (search, chips, login/register/checkout buttons). Need full coverage |
| [ ] | Unverified color contrast (may not meet WCAG AA) | Custom palette | Run axe/contrast checker; adjust to ≥ 4.5:1 |
| [ ] | Keyboard navigation not fully supported | UI components | Ensure all interactive elements focusable with visible outlines |
| [ ] | Responsive design not tested on mobile | Layout | Partially done (hamburger menu). Needs full breakpoint testing |
| [ ] | Toast notifications not announced to assistive tech | Toast component | Add role="alert" and aria-live="assertive" |
