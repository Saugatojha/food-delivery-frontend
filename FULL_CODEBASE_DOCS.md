# SmartServe — Complete Codebase Documentation

> Every file, every component, every route, every config — fully documented.

---

## 1. Project Overview

**SmartServe** is a food delivery platform with 4 roles: Customer, Restaurant Owner, Rider, Admin. Customers browse restaurants on a map, add items to cart, place orders, and track delivery in real-time. Owners manage menu, orders, riders, and earnings. Riders view assigned deliveries and update status. Admins manage all users and restaurants.

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| UI Framework | React | 19.2.8 | Component-based UI |
| Build Tool | Vite | 8.1.1 | Dev server + bundler (HMR) |
| CSS | Tailwind CSS | 4.3.3 | Utility-first styling via `@tailwindcss/vite` plugin |
| Routing | React Router DOM | 7.18.1 | Client-side SPA routing |
| HTTP Client | Axios | 1.18.1 | API calls with interceptors |
| Maps | Leaflet + react-leaflet | 1.9.4 / 5.0.0 | OpenStreetMap tile rendering |
| Linting | ESLint | 10.8.0 | react-hooks + react-refresh rules |
| Testing (FE) | Vitest + Testing Library | 4.1.10 / 16.3.2 | Unit tests, jsdom environment |
| E2E Testing | Playwright | 1.62.0 | Browser-level tests |
| Backend | Express | 5.2.1 | REST API server |
| ORM | Prisma | 7.9.1 | Schema + migrations + query builder |
| Database | MySQL 8 | — | Relational DB via `@prisma/adapter-mariadb` |
| Auth | bcryptjs + jsonwebtoken | 3.0.3 / 9.0.3 | Password hashing + JWT tokens |
| 2FA | speakeasy + qrcode | 2.0.0 / 1.5.4 | TOTP authenticator integration |
| Security | Helmet | 8.3.0 | HTTP security headers (CSP, HSTS) |
| Rate Limiting | express-rate-limit | 8.6.1 | API abuse prevention |
| File Upload | Multer | 2.2.0 | Multipart image upload |
| Email | Resend | 6.18.1 | Transactional email (dev: console logs) |
| Logging | Winston | 3.19.0 | Structured server logging |
| Dev Tools | nodemon + concurrently | 3.1.14 / 10.0.4 | Auto-restart + parallel FE/BE dev |

---

## 3. Directory Structure

```
food-delivery-frontend/
├── index.html                    # Vite entry HTML (loads Inter font from Google Fonts)
├── package.json                  # Frontend deps + scripts
├── vite.config.js                # Vite config: React plugin, Tailwind, proxy /api → :5001, Vitest
├── eslint.config.js              # ESLint config
├── playwright.config.js          # Playwright E2E config (baseURL localhost:5173, headless)
├── DOCUMENTATION.md              # Existing project documentation
├── SECURITY_CHECKLIST.md         # Security audit checklist
├── SEQUENCE_DIAGRAMS.md          # Sequence diagram docs
├── RESEND_INTEGRATION_LOG.md     # Resend email integration notes
├── UI_UX_IMPROVEMENT_REPORT.md   # UI/UX audit report
│
├── public/                       # Static assets served at root
│   ├── smartserve.png            # App logo (Navbar + AuthShell)
│   ├── burgerbarn.png            # Burger Barn restaurant image
│   ├── curryhouse.png            # Curry House restaurant image
│   ├── momohouse.png             # Momo House restaurant image
│   ├── noodenest.png             # Noodle Nest restaurant image
│   ├── sushispot.png             # Sushi Spot restaurant image
│   └── tocotown.png              # Taco Town restaurant image
│
├── src/                          # Frontend source
│   ├── main.jsx                  # Entry point: StrictMode + BrowserRouter + Leaflet CSS
│   ├── App.jsx                   # Route definitions + provider tree
│   ├── index.css                 # Tailwind import + CSS vars + hover-lift
│   │
│   ├── api/
│   │   └── client.js             # Axios instance with CSRF + 401 redirect
│   │
│   ├── context/
│   │   ├── AuthContext.jsx        # User state, login/register/logout/2FA/verify
│   │   ├── ToastContext.jsx       # Toast notification system
│   │   └── NotificationContext.jsx # Polling notifications + browser push
│   │
│   ├── services/
│   │   └── orders.js             # API calls + localStorage cart + status flows
│   │
│   ├── components/
│   │   ├── AuthShell.jsx         # Branded two-column auth layout
│   │   ├── EmptyState.jsx        # Reusable empty/error state
│   │   ├── ErrorBoundary.jsx     # React error boundary
│   │   ├── ImageUpload.jsx       # File picker → POST /api/upload/image
│   │   ├── LoadingSkeleton.jsx   # CardSkeleton + ListSkeleton
│   │   ├── MapView.jsx           # Leaflet map with markers + OSRM route
│   │   ├── Navbar.jsx            # Navigation bar with role links + bell + cart badge
│   │   ├── ProtectedRoute.jsx    # Auth gate
│   │   ├── RoleRoute.jsx         # Role gate
│   │   └── TwoFactorSetup.jsx    # TOTP 2FA setup/enable/disable UI
│   │
│   ├── pages/
│   │   ├── Login.jsx             # Email/password + 2FA challenge
│   │   ├── Register.jsx          # Name + email/password registration
│   │   ├── VerifyEmail.jsx       # Email verification
│   │   ├── ForgotPassword.jsx    # Password reset request
│   │   ├── ResetPassword.jsx     # Password reset form
│   │   ├── Terms.jsx             # Terms of Service
│   │   ├── Privacy.jsx           # Privacy Policy
│   │   ├── Home.jsx              # Restaurant listing with map + search + filters
│   │   ├── Restaurant.jsx        # Single restaurant menu + map
│   │   ├── Cart.jsx              # Cart with delivery location picker
│   │   ├── Checkout.jsx          # Phone + address + map + place order
│   │   ├── OrderTracking.jsx     # Order progress + live map
│   │   ├── Account.jsx           # Customer profile + 2FA
│   │   ├── owner/
│   │   │   ├── Dashboard.jsx     # Unified owner/rider dashboard (orders/menu/riders/settings/earnings)
│   │   │   ├── MenuManagement.jsx # Standalone menu management
│   │   │   └── Orders.jsx        # Standalone orders view
│   │   ├── rider/
│   │   │   └── (Dashboard.jsx shared via /rider route)
│   │   └── admin/
│   │       └── Panel.jsx         # Admin: users, restaurants, stats, 2FA
│   │
│   ├── data/
│   │   └── mock.js               # Backup mock data + formatPrice + CUISINE_CATEGORIES
│   │
│   ├── utils/
│   │   ├── storage.js            # Safe JSON read/write/removeKeys
│   │   ├── leafletIcon.js        # Fix Leaflet default marker icon for Vite
│   │   └── location.js           # Geolocation helpers
│   │
│   ├── test/
│   │   └── setup.js              # Vitest setup (jest-dom matchers)
│   │
│   └── e2e/
│       └── login.spec.js         # Playwright login flow tests
│
├── server/                       # Backend source
│   ├── .env                      # DATABASE_URL, JWT_SECRET, PORT=5001
│   ├── .env.example              # Template (no real credentials)
│   ├── package.json              # Backend deps + scripts
│   ├── vitest.config.js          # Vitest config (node environment)
│   ├── prisma.config.ts          # Prisma 7 config (schema + migrations seed)
│   │
│   ├── src/
│   │   ├── index.js              # Express app entry (middleware stack + route mounting)
│   │   ├── config/
│   │   │   ├── env.js            # PORT, JWT_SECRET, JWT_EXPIRES_IN, FRONTEND_URL
│   │   │   ├── database.js       # PrismaClient singleton with MySQL adapter
│   │   │   └── logger.js         # Winston logger
│   │   ├── middleware/
│   │   │   ├── auth.js           # authenticate (JWT) + authorize (role check)
│   │   │   ├── csrf.js           # CSRF token generation + validation
│   │   │   └── validate.js       # Field validation + password strength + XSS sanitize
│   │   ├── routes/
│   │   │   ├── auth.js           # Register, login, 2FA, email verify, password reset
│   │   │   ├── restaurants.js    # Public restaurant listing + menu
│   │   │   ├── orders.js         # Create order, list, track, status update
│   │   │   ├── cart.js           # Server-side cart (not yet wired to FE)
│   │   │   ├── notifications.js  # Notification CRUD
│   │   │   ├── upload.js         # Image upload (multer)
│   │   │   ├── owner.js          # Owner: menu CRUD, categories, subcategories, riders, orders, earnings
│   │   │   ├── rider.js          # Rider: deliveries, earnings, status updates
│   │   │   └── admin.js          # Admin: stats, user management, restaurant CRUD
│   │   └── utils/
│   │       ├── errors.js         # badRequest, unauthorized, forbidden, notFound, conflict, serverError
│   │       ├── mailer.js         # sendVerificationEmail + sendPasswordResetEmail (Resend)
│   │       ├── notify.js         # createNotification, notifyRestaurantOwner, notifyCustomer
│   │       ├── statusFlow.js     # FLOWS per role, getNextStatus, isValidTransition, TERMINAL_STATUSES
│   │       └── urls.js           # Legacy URL rewrite middleware (localhost:5000 → current)
│   │
│   ├── prisma/
│   │   ├── schema.prisma         # 14 models
│   │   ├── seed.js               # Idempotent seed (4 users, 7 restaurants, 26 menu items)
│   │   ├── reset.js              # Port-5001 guard + prisma migrate reset
│   │   └── migrations/           # Auto-generated migration files
│   │
│   └── uploads/                  # Uploaded images stored here
```

---

## 4. Configuration Files

### `vite.config.js`
- **React plugin** via `@vitejs/plugin-react`
- **Tailwind CSS** via `@tailwindcss/vite` plugin
- **Dev server**: port 5173, `host: true` (LAN accessible)
- **Proxy**: `/api` → `http://localhost:5001`, `/uploads` → `http://localhost:5001`
- **Vitest**: jsdom environment, setup file `./src/test/setup.js`, excludes node_modules/server/e2e

### `server/.env`
```
DATABASE_URL="mysql://root:aoD7gE1OIPQL0GLW8eyVjhSv@localhost:3306/smartserve"
JWT_SECRET="smartserve-dev-secret-2026"
JWT_EXPIRES_IN="2h"
PORT=5001
```

### `server/prisma.config.ts`
```ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { seed: "node prisma/seed.js" },
  datasource: { url: env("DATABASE_URL") },
})
```

### `package.json` scripts
| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `concurrently "npm run dev:server" "npm run dev:client"` | Start both FE + BE |
| `dev:client` | `vite` | Vite dev server |
| `dev:server` | `cd server && npm run dev` | Nodemon backend |
| `build` | `vite build` | Production build |
| `lint` | `eslint src` | Lint frontend |
| `test` | `vitest run` | Run frontend tests |
| `test:e2e` | `playwright test` | Run E2E tests |

### `server/package.json` scripts
| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `nodemon src/index.js` | Dev server with auto-restart |
| `start` | `node src/index.js` | Production start |
| `seed` | `prisma db seed` | Run seed data |
| `reset` | `node prisma/reset.js` | Drop DB + re-migrate + re-seed |
| `migrate` | `prisma migrate dev` | Run migrations |
| `test` | `vitest run` | Run backend tests |

---

## 5. Database Schema (14 Models)

### User
| Field | Type | Default | Notes |
|-------|------|---------|-------|
| id | Int | autoincrement | Primary key |
| name | String | — | User's display name |
| email | String | — | Unique, normalized (trimmed + lowercased) |
| password | String | — | bcrypt hash |
| role | String | "customer" | customer / owner / rider / admin |
| restaurantId | Int? | null | FK → Restaurant (for riders) |
| emailVerified | Boolean | false | Must be true to login |
| verificationToken | String? | null | SHA-256 hash for email verification |
| verificationExpires | DateTime? | null | Token expiry |
| failedLoginAttempts | Int | 0 | Account lockout counter |
| lockedUntil | DateTime? | null | Account lockout timestamp |
| twoFactorSecret | String? | null | TOTP secret (base32) |
| twoFactorEnabled | Boolean | false | 2FA opt-in flag |
| createdAt | DateTime | now() | — |
| updatedAt | DateTime | @updatedAt | Auto-updated |

**Relations**: orders, ratings, cartItems, notifications, passwordResetTokens, restaurant (FK via restaurantId), ownedRestaurant (FK via ownerId on Restaurant)

### Restaurant
| Field | Type | Notes |
|-------|------|-------|
| id | Int | Primary key |
| name | String | Restaurant name |
| cuisine | String | Cuisine type (Italian, Japanese, etc.) |
| rating | Float | Default 0 |
| image | String? | Local path or URL |
| deliveryTime | String | e.g. "25-35 min" |
| isOpen | Boolean | Whether accepting orders |
| latitude | Float? | Map coordinates |
| longitude | Float? | Map coordinates |
| ownerId | Int? | Unique FK → User (restaurant owner) |

**Relations**: owner (User), users (User[] — riders), categories, menuItems, orders, ratings, cartItems

### MenuItem
| Field | Type | Default |
|-------|------|---------|
| id | Int | Primary key |
| restaurantId | Int | FK → Restaurant |
| name | String | Item name |
| price | Float | Price in NPR |
| category | String | "General" |
| subCategory | String | "General" |
| desc | String? | Description |
| image | String? | Item image URL |

### Category
| Field | Type | Notes |
|-------|------|-------|
| id | Int | Primary key |
| restaurantId | Int | FK → Restaurant |
| name | String | Category name |

**Constraint**: `@@unique([restaurantId, name])` — unique category name per restaurant

**Relations**: subCategories (SubCategory[])

### SubCategory
| Field | Type | Notes |
|-------|------|-------|
| id | Int | Primary key |
| categoryId | Int | FK → Category |
| name | String | Subcategory name |

**Constraint**: `@@unique([categoryId, name])` — unique subcategory name per category

### Order
| Field | Type | Default |
|-------|------|---------|
| id | Int | Primary key |
| userId | Int | FK → User (customer) |
| restaurantId | Int | FK → Restaurant |
| total | Float | Order total in NPR |
| address | String | Delivery address |
| phone | String? | Customer phone |
| paymentMethod | String | Payment method |
| status | String | "Pending" |
| deliveryEta | String? | Estimated time |
| deliveryLatitude | Float? | Customer delivery coords |
| deliveryLongitude | Float? | Customer delivery coords |

**Relations**: user, restaurant, items (OrderItem[]), payment (Payment?), delivery (Delivery?), ratings (Rating[])

### OrderItem
| Field | Type |
|-------|------|
| id | Int |
| orderId | Int |
| menuItemId | Int |
| quantity | Int |
| price | Float |

### Payment
| Field | Type | Default |
|-------|------|---------|
| id | Int | Primary key |
| orderId | Int | Unique FK → Order |
| method | String | Payment method |
| status | String | "completed" |

### Delivery
| Field | Type | Default |
|-------|------|---------|
| id | Int | Primary key |
| orderId | Int | Unique FK → Order |
| riderId | Int? | FK → User (rider) |
| status | String | "assigned" |
| address | String | Delivery address |

### CartItem
| Field | Type | Default |
|-------|------|---------|
| id | Int | Primary key |
| userId | Int | FK → User |
| menuItemId | Int | FK → MenuItem |
| restaurantId | Int | FK → Restaurant |
| quantity | Int | 1 |

### Rating
| Field | Type |
|-------|------|
| id | Int |
| orderId | Int |
| userId | Int |
| restaurantId | Int |
| score | Int |
| comment | String? |

### Notification
| Field | Type | Default |
|-------|------|---------|
| id | Int | Primary key |
| userId | Int | FK → User |
| title | String | Notification title |
| message | String | Notification body |
| type | String | "info" |
| orderId | Int? | FK → Order |
| read | Boolean | false |
| createdAt | DateTime | now() |

### PasswordResetToken
| Field | Type | Notes |
|-------|------|-------|
| id | Int | Primary key |
| token | String | Unique, SHA-256 hashed |
| userId | Int | FK → User (cascade delete) |
| expiresAt | DateTime | 30-minute expiry |
| usedAt | DateTime? | Single-use enforcement |
| createdAt | DateTime | now() |

---

## 6. Seed Data

**Idempotent** — checks `prisma.user.count() > 0`, skips if data exists.

### Users (all password: `password`, all emailVerified: true)

| Name | Email | Role | Notes |
|------|-------|------|-------|
| John Doe | john@example.com | customer | Default customer |
| Pizza Palace | owner@example.com | owner | Linked to restaurant ID 1 |
| Rider Ram | rider@example.com | rider | Linked to restaurant ID 1 |
| Admin User | admin@example.com | admin | Full system access |

### Restaurants

| # | Name | Cuisine | Lat, Lng | Image | isOpen |
|---|------|---------|----------|-------|--------|
| 1 | Pizza Palace | Italian | 27.7150, 85.3120 | placehold.co | true |
| 2 | Burger Barn | American | 27.7040, 85.3070 | /burgerbarn.png | true |
| 3 | Sushi Spot | Japanese | 27.6710, 85.3260 | /sushispot.png | true |
| 4 | Taco Town | Mexican | 27.7210, 85.3620 | /tocotown.png | **false** |
| 5 | Curry House | Indian | 27.7100, 85.3480 | /curryhouse.png | true |
| 6 | Noodle Nest | Chinese | 27.6720, 85.4280 | /noodenest.png | true |
| 7 | Momo House | Nepali | 27.7180, 85.3350 | /momohouse.png | true |

### Categories & SubCategories

| Restaurant | Category | SubCategories |
|------------|----------|---------------|
| Pizza Palace | Pizza | Vegetarian, Non-Vegetarian |
| Pizza Palace | Appetizer | Hot |

### Menu Items (26 total)

| Restaurant | Item | Category | Price (NPR) |
|------------|------|----------|-------------|
| Pizza Palace | Margherita Pizza | Pizza > Vegetarian | 599 |
| Pizza Palace | Pepperoni Pizza | Pizza > Non-Vegetarian | 749 |
| Pizza Palace | Garlic Bread | Appetizer > Hot | 199 |
| Burger Barn | Classic Burger | Burger > Beef | 450 |
| Burger Barn | Cheese Burger | Burger > Beef | 520 |
| Burger Barn | French Fries | Fries > Classic | 180 |
| Sushi Spot | California Roll | Sushi > Maki | 550 |
| Sushi Spot | Salmon Roll | Sushi > Maki | 680 |
| Sushi Spot | Edamame | Appetizer > Cold | 250 |
| Taco Town | Beef Taco | Taco > Hard | 220 |
| Taco Town | Chicken Quesadilla | Quesadilla > Chicken | 380 |
| Taco Town | Guacamole | Appetizer > Cold | 250 |
| Curry House | Butter Chicken | Curry > Chicken | 650 |
| Curry House | Garlic Naan | Bread > Naan | 120 |
| Curry House | Chicken Biryani | Rice > Biryani | 550 |
| Noodle Nest | Chow Mein | Noodle > Chow Mein | 380 |
| Noodle Nest | Fried Rice | Rice > Fried | 350 |
| Noodle Nest | Spring Rolls | Appetizer > Hot | 200 |
| Momo House | Chicken Momo | Momo > Steamed | 280 |
| Momo House | Buff Momo | Momo > Steamed | 320 |
| Momo House | Veg Momo | Momo > Steamed | 250 |
| Momo House | Dal Bhat | Rice > Regular | 350 |
| Momo House | Chow Mein | Noodle > Chow Mein | 220 |
| Momo House | Sekuwa | Appetizer > Hot | 400 |
| Momo House | Lassi | Beverage > Cold | 120 |
| Momo House | Chiya | Beverage > Hot | 60 |

---

## 7. Backend Entry Point (`server/src/index.js`)

### Middleware Stack (applied in order)
1. **Helmet** — CSP (allows OpenStreetMap tiles, Resend, Google Fonts), HSTS preload
2. **Rate Limiter** — 100 req/min in production, 100000 in dev, skipped in test
3. **CORS** — origin from `CORS_ORIGIN` env (default `http://localhost:5173`), credentials: true
4. **cookieParser** — parses cookies
5. **express.json** — JSON body parsing
6. **legacyUrlRewriteMiddleware** — rewrites stale `localhost:5000` URLs to current origin
7. **Request logger** — Winston logs method + URL + IP (skipped in test)

### Route Mounting
```
/api/auth         → authRoutes (no CSRF — login/register are public)
/api              → csrfProtection (all state-changing routes below require CSRF)
/api/restaurants  → restaurantRoutes
/api/orders       → orderRoutes
/api/owner        → ownerRoutes
/api/rider        → riderRoutes
/api/admin        → adminRoutes
/api/cart          → cartRoutes
/api/upload       → uploadRoutes
/api/notifications → notificationRoutes
/uploads          → express.static (serves uploaded files)
/api/health       → { status: 'ok' }
```

### Production Middleware
- **Trust proxy** enabled
- **HTTPS redirect** — 301 redirect if not secure

### EADDRINUSE Guard
If port 5001 is already in use, logs a clear error and exits with code 1.

---

## 8. Backend Middleware

### `auth.js` — Authentication
- **`authenticate`** — Extracts JWT from `Authorization: Bearer` header or `jwt` cookie. Verifies with `jwt.verify()`. Looks up user in DB. Sets `req.user` with `{ id, name, email, role, restaurantId, twoFactorEnabled }`.
- **`authorize(...roles)`** — Returns middleware that checks `req.user.role` is in the allowed roles array. Returns 403 if not.

### `csrf.js` — CSRF Protection
- **`generateCsrfToken()`** — Creates 32-byte random hex token
- **`setCsrfCookie(res, token)`** — Sets non-httpOnly cookie `csrf-token` (2-hour expiry, lax sameSite, secure in production)
- **`csrfProtection`** — Validates `X-CSRF-Token` header matches `csrf-token` cookie on state-changing requests (POST/PUT/PATCH/DELETE). Skipped in test environment and for GET/HEAD/OPTIONS.

### `validate.js` — Input Validation
- **`validate(...fields)`** — Middleware checking required fields exist and aren't empty. Validates email regex, name length (max 100), sanitizes address/description/cuisine fields.
- **`validateOptional(...fields)`** — Validates optional fields aren't set to null/empty. Sanitizes text fields.
- **`validatePasswordStrength`** — Checks password: min 8 chars, uppercase, lowercase, digit, special character.
- **`sanitizeString(input, maxLength)`** — Removes `<>`, `javascript:`, and `on*=` event handlers. Truncates to maxLength.

---

## 9. Backend Routes — Full API Contract

### Auth Routes (`/api/auth`)
No CSRF protection. Public endpoints.

| Method | Endpoint | Body | Response | Notes |
|--------|----------|------|----------|-------|
| POST | `/register` | `{ name, email, password }` | `201 { message, user: { emailVerified: false }, devLink? }` | Emails normalized. No token returned — must verify email first. Dev mode returns `devLink`. |
| POST | `/login` | `{ login, password }` | `{ token, user }` or `{ requires2FA: true, tempToken }` or `403 { code: 'EMAIL_NOT_VERIFIED', email }` | Rate limited. Account locks after 5 failed attempts. Returns `tempToken` if 2FA enabled. |
| GET | `/verify-email?token=&email=` | — | `{ message }` | Marks email as verified. |
| POST | `/resend-verification` | `{ login }` | `{ message, devLink? }` | Rotates verification token. |
| POST | `/forgot-password` | `{ login }` | `{ message, devLink? }` | Generic message — no email enumeration. Creates 30-min single-use token. |
| POST | `/reset-password` | `{ token, password }` | `{ message }` | Resets password + clears lockout. Single-use token. |
| GET | `/me` | — | `{ user }` | Returns authenticated user with `twoFactorEnabled`. |
| POST | `/2fa/setup` | — | `{ secret, qrCode }` | Generates TOTP secret + QR data URL. |
| POST | `/2fa/enable` | `{ token }` | `{ message, backupCodes }` | Verifies 6-digit TOTP code, enables 2FA, returns 8 backup codes. |
| POST | `/2fa/disable` | `{ token }` | `{ message }` | Requires current TOTP code to disable. Removes secret. |
| POST | `/2fa/verify` | `{ tempToken, token }` | `{ token, user }` | Completes 2FA login — verifies TOTP code, issues real JWT. |

### Restaurant Routes (`/api/restaurants`)

| Method | Endpoint | Query Params | Response |
|--------|----------|-------------|----------|
| GET | `/` | `page`, `limit`, `search`, `cuisine`, `sort`, `open` | `{ restaurants: [...], total, totalPages }` — cuisine uses exact match (`equals`), search uses OR on name + cuisine |
| GET | `/:id/menu` | — | `{ restaurant, items }` — No cache headers (always fresh) |

### Order Routes (`/api/orders`)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/` | `{ items, address, phone, paymentMethod, deliveryLatitude, deliveryLongitude }` | `Order` — Creates order + OrderItems + Payment + notifies owner |
| GET | `/` | — | `[ Order ]` — All orders for current user |
| GET | `/tracking/:id` | — | `Order` with restaurant/delivery coords |
| PATCH | `/:id/status` | `{ status }` | `Order` — Role-scoped status transition |

### Owner Routes (`/api/owner`)
All require `authenticate` + `authorize('owner')`.

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/restaurant` | — | `Restaurant` |
| PATCH | `/restaurant` | restaurant fields | `Restaurant` |
| GET | `/orders` | — | `[ Order ]` with items + restaurant + delivery |
| PATCH | `/orders/:id/status` | `{ status, riderId? }` | `Order` — `riderId` required for Confirmed |
| PATCH | `/orders/:id/rider` | `{ riderId }` | `Order` — (re)assign rider |
| POST | `/orders/:id/auto-assign-rider` | — | `{ rider, order }` |
| GET | `/riders` | — | `[{ id, name, email }]` — riders for this restaurant |
| POST | `/riders` | `{ name, email, password }` | `{ id, name, email }` — creates rider account |
| DELETE | `/riders/:id` | — | `{ message }` |
| GET | `/menu` | — | `[ MenuItem ]` |
| POST | `/menu` | `{ name, price, category, subCategory, desc, image }` | `MenuItem` — auto-creates Category if new |
| PATCH | `/menu/:id` | `{ name, price, category, subCategory, desc, image }` | `MenuItem` |
| DELETE | `/menu/:id` | — | `{ message }` |
| GET | `/menu/categories` | — | `[{ name, subCategories: [{ id, name }] }]` |
| POST | `/menu/categories` | `{ name }` | `201 { category }` — max 50 chars |
| PATCH | `/menu/categories/:oldName` | `{ newName }` | `{ message, newCategory }` — renames across all items |
| DELETE | `/menu/categories/:name` | — | `{ message }` — deletes category + all items |
| POST | `/menu/subcategories` | `{ name, category }` | `201 { id, name, category }` |
| PATCH | `/menu/subcategories/:id` | `{ name }` | `{ message, name }` |
| DELETE | `/menu/subcategories/:id` | — | `{ message }` — resets items to "General" |
| GET | `/earnings` | — | `{ totalEarnings, totalDeliveries, dailyEarnings, dailyCount, weeklyEarnings, weeklyCount }` |

### Rider Routes (`/api/rider`)
All require `authenticate` + `authorize('rider')`.

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/deliveries` | — | `[ Order ]` — available for pickup |
| GET | `/my-deliveries` | — | `[ Order ]` — rider's accepted deliveries |
| GET | `/earnings` | — | `{ totalEarnings, totalDeliveries, dailyEarnings, dailyCount, weeklyEarnings, weeklyCount }` |
| PATCH | `/orders/:id/accept` | — | `Order` — assigns rider, status → Out for Delivery |
| PATCH | `/orders/:id/reject` | — | `{ message }` — returns to pending |
| PATCH | `/orders/:id/status` | `{ status }` | `Order` |

### Admin Routes (`/api/admin`)
All require `authenticate` + `authorize('admin')`.

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/stats` | — | `{ users, restaurants, orders, revenue }` |
| GET | `/users` | — | `[ User ]` — limited fields (id, name, email, role, restaurantId) |
| PATCH | `/users/:id` | `{ role?, restaurantId? }` | `User` |
| GET | `/restaurants` | — | `[ Restaurant ]` |
| POST | `/restaurants` | restaurant fields | `Restaurant` |
| PATCH | `/restaurants/:id` | restaurant fields | `Restaurant` |
| DELETE | `/restaurants/:id` | — | `{ message }` |

### Cart Routes (`/api/cart`)
Server-side cart (exists but not yet wired to frontend).

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/` | — | `[ CartItem ]` with menuItem |
| POST | `/sync` | `{ items: [{ menuItemId, restaurantId, quantity }] }` | `[ CartItem ]` — replaces cart, validates items |
| POST | `/add` | `{ menuItemId, restaurantId, quantity }` | `CartItem` — upserts (capped at 99) |
| DELETE | `/:id` | — | `{ message }` |

### Notification Routes (`/api/notifications`)

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/` | `[ Notification ]` — latest 50 |
| GET | `/unread-count` | `{ count }` |
| PATCH | `/:id/read` | `Notification` |
| POST | `/read-all` | `{ message }` |

### Upload Routes (`/api/upload`)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/image` | multipart `image` (max 5MB, jpeg/png/gif/webp) | `{ url: '/uploads/<file>' }` |

---

## 10. Backend Utilities

### `errors.js`
Consistent JSON error responses: `badRequest(400)`, `unauthorized(401)`, `forbidden(403)`, `notFound(404)`, `conflict(409)`, `serverError(500)`.

### `statusFlow.js`
```js
FLOWS = {
  customer: ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'],
  owner:    ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Rejected'],
  rider:    ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered'],
}
TERMINAL_STATUSES = ['Delivered', 'Cancelled', 'Rejected']
```
- `getAllowedTransitions(role, currentStatus)` — returns valid next statuses
- `isValidTransition(current, next, role)` — validates a transition
- Owner at Pending can choose Confirmed or Rejected

### `mailer.js`
- **Dev mode**: prints links to server console, returns `devLink`
- **Production**: sends via Resend API (`RESEND_API_KEY` env)
- Functions: `sendVerificationEmail(user, token)`, `sendPasswordResetEmail(user, token)`
- URLs built from `FRONTEND_URL` env

### `notify.js`
- `createNotification({ userId, title, message, type, orderId })` — creates DB notification
- `notifyRestaurantOwner(order, title, message)` — finds restaurant owner, notifies them
- `notifyCustomer(order, title, message)` — notifies order customer

### `urls.js`
- `legacyUrlRewriteMiddleware` — intercepts `res.json()`, rewrites any `localhost:5000` URLs to current origin
- Prevents stale URLs in DB from breaking frontend

---

## 11. Frontend — App Shell & Providers

### `main.jsx`
Entry point: wraps `<App />` in `StrictMode` + `BrowserRouter`. Imports Leaflet CSS + `leafletIcon` fix.

### `App.jsx` — Provider Tree
```
ErrorBoundary
  └─ AuthProvider (user state from /api/auth/me on mount)
      └─ ToastProvider (global toast notifications)
          └─ NotificationProvider (polls /api/notifications/unread-count every 15s)
              ├─ Navbar (always visible when logged in)
              └─ Routes (page content)
```

### Route Table
| Path | Guard | Component | Role |
|------|-------|-----------|------|
| `/login` | — | Login | Public |
| `/register` | — | Register | Public |
| `/verify-email` | — | VerifyEmail | Public |
| `/forgot-password` | — | ForgotPassword | Public |
| `/reset-password` | — | ResetPassword | Public |
| `/terms` | — | Terms | Public |
| `/privacy` | — | Privacy | Public |
| `/` | ProtectedRoute | Home | Any logged-in |
| `/restaurant/:id` | ProtectedRoute | Restaurant | Any logged-in |
| `/cart` | RoleRoute(['customer']) | Cart | Customer |
| `/checkout` | RoleRoute(['customer']) | Checkout | Customer |
| `/orders` | RoleRoute(['customer']) | OrderTracking | Customer |
| `/account` | RoleRoute(['customer']) | Account | Customer |
| `/owner` | RoleRoute(['owner']) | OwnerDashboard | Owner |
| `/owner/menu` | RoleRoute(['owner']) | OwnerMenu | Owner |
| `/owner/orders` | RoleRoute(['owner']) | OwnerOrders | Owner |
| `/rider` | RoleRoute(['rider']) | OwnerDashboard | Rider |
| `/admin` | RoleRoute(['admin']) | AdminPanel | Admin |

### Post-Login Redirect
- Customer → `/`
- Owner → `/owner`
- Rider → `/owner`
- Admin → `/admin`

---

## 12. Frontend — API Client (`api/client.js`)

- **Base URL**: `import.meta.env.VITE_API_URL || '/api'` (Vite proxy in dev)
- **Timeout**: 10 seconds
- **CSRF interceptor**: reads `csrf-token` cookie, attaches `X-CSRF-Token` header on POST/PUT/PATCH/DELETE
- **401 interceptor**: on 401 response (not on public paths), clears user from localStorage and redirects to `/login`
- **Public paths** (exempt from 401 redirect): `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`

---

## 13. Frontend — Context Providers

### `AuthContext`
- **State**: `user` (from localStorage, refreshed via `/api/auth/me` on mount), `loading`
- **Methods**: `login(login, password)`, `verify2FA(tempToken, code)`, `register(name, email, password)`, `verifyEmail(token, email)`, `resendVerification(email)`, `forgotPassword(login)`, `resetPassword(token, password)`, `logout()`
- **2FA flow**: login returns `{ requires2FA: true, tempToken }` → frontend shows 6-digit input → `verify2FA()` completes login
- **Email normalization**: emails trimmed + lowercased on both frontend and backend

### `ToastContext`
- **Methods**: `showToast(message, type)` — types: 'success' (green), 'error' (red), 'info' (orange)
- Auto-dismiss after 3 seconds
- Max 3 visible toasts at once
- Manual dismiss via × button

### `NotificationContext`
- **State**: `unreadCount`, `notifications`, `open` (dropdown state)
- **Polling**: fetches `/api/notifications/unread-count` every 15 seconds
- **Browser push**: on unread count increase, requests Notification permission, shows browser notification
- **Methods**: `toggle()` (dropdown), `refresh()` (fetch full list), `markRead(id)`, `markAllRead()`
- Resets state when user logs out

---

## 14. Frontend — Services (`services/orders.js`)

### API Functions
| Function | Endpoint | Purpose |
|----------|----------|---------|
| `getAllOrders()` | GET /orders | All orders |
| `getOrdersForRestaurant(id)` | GET /orders | Filter by restaurant |
| `getAvailableDeliveries()` | GET /rider/deliveries | Available orders |
| `getMyDeliveries()` | GET /rider/my-deliveries | Rider's orders |
| `updateOrderStatus(id, status)` | PATCH /orders/:id/status | Status update |
| `updateOwnerOrderStatus(id, status, riderId?)` | PATCH /owner/orders/:id/status | Owner status update |
| `getRiderEarnings()` | GET /rider/earnings | Rider earnings |
| `getAvailableRiders()` | GET /owner/riders | Owner's riders |
| `assignRiderToOrder(orderId, riderId)` | POST /owner/orders/:id/assign-rider | Assign rider |
| `autoAssignRider(orderId)` | POST /owner/orders/:id/auto-assign-rider | Auto-assign |
| `saveOrder(order)` | POST /orders | Create order |
| `submitOrder(payload)` | POST /orders | Submit with items/address/phone |

### LocalStorage Functions
| Function | Key | Purpose |
|----------|-----|---------|
| `getCart()` | `cart` | Read cart items (JSON array) |
| `saveCart(items)` | `cart` | Save cart + dispatch `cart-update` event |
| `getDeliveryLocation()` | `delivery-location` | Read delivery coords |
| `saveDeliveryLocation(loc)` | `delivery-location` | Save delivery coords |
| `clearDeliveryLocation()` | `delivery-location` | Remove delivery coords |

### Status Flow Helpers
- `STATUS_FLOWS` — role-keyed flow arrays
- `isValidTransition(current, next, flow)` — checks if transition is exactly one step forward
- `getNextStatus(current, flow)` — returns next status in flow
- `getAllowedTransitions(current, flow)` — returns array of valid next statuses (Pending allows both Confirmed and Rejected)

---

## 15. Frontend — Components

### `AuthShell.jsx`
Two-column branded layout wrapping Login/Register/ForgotPassword. Left side: logo + tagline. Right side: form slot.

### `EmptyState.jsx`
Reusable: `icon` (emoji) + `title` + `message` + optional `action` (button element).

### `ErrorBoundary.jsx`
React class component error boundary. Catches render errors, shows error message + reload button.

### `ImageUpload.jsx`
File picker with preview. POSTs to `/api/upload/image`. Returns URL string. Used in restaurant settings and menu item management.

### `LoadingSkeleton.jsx`
- `CardSkeleton` — placeholder card with pulse animation
- `ListSkeleton(count)` — renders `count` CardSkeletons

### `MapView.jsx`
Leaflet map component. Supports:
- Multi-restaurant view (Home page) — orange markers with popups
- Single restaurant + delivery + rider view (Order Tracking, Checkout)
- OSRM road route via polyline
- `interactive` prop controls zoom/pan
- `showRouteNote` shows "Route unavailable" fallback

### `Navbar.jsx`
- **Logo**: `/smartserve.png` displayed left
- **Role-aware links**: customer (Home, Cart, Orders, Account), owner (Dashboard, Menu, Orders), rider (Dashboard), admin (Panel)
- **Cart badge**: listens to `cart-update` custom event, shows item count
- **Notification bell**: dropdown with unread badge, mark-read/mark-all-read
- **User name** + **Logout button** (orange)
- **Hamburger menu**: collapses on mobile, slide-down dropdown
- **Styling**: white bg, gray text, orange accent only on logout button
- **Accessibility**: `aria-expanded`, `aria-label` on all interactive elements

### `ProtectedRoute.jsx`
If `user` is null, redirects to `/login` (saves intended path). Shows loading spinner while auth state loads.

### `RoleRoute.jsx`
Like ProtectedRoute but also checks `user.role` against allowed `roles` array. Wrong role redirects to `/`.

### `TwoFactorSetup.jsx`
Multi-step 2FA component:
1. **idle** — "Enable 2FA" button
2. **scan** — Shows QR code + manual secret key + 6-digit input
3. **enabled** — Shows "Enabled" status + Disable button
4. **disable** — Shows 6-digit input to confirm disable
5. **backup codes** — Shows 8 one-time codes in grid after enable

---

## 16. Frontend — Pages

### `Login.jsx`
- Email/username + password form with inline validation
- **Password visibility toggle** (Eye icon)
- **Error handling**: EMAIL_NOT_VERIFIED (shows banner with resend link), 423 (account locked), 429 (rate limited), network error, invalid credentials
- **2FA challenge**: when `requires2FA` is true, shows 6-digit code input with "Back to login" option
- Post-login redirect by role

### `Register.jsx`
- Name (first/middle/last) + email + password + confirm password
- Password strength meter (visual bar)
- Inline validation (required fields, email format, password match)
- On success → redirect to `/verify-email?email=...`

### `VerifyEmail.jsx`
- Reads `?token=` and `?email=` from URL
- Calls `GET /api/auth/verify-email?token=...`
- Shows success/error state
- Resend verification link button

### `ForgotPassword.jsx`
- Email/username input → `POST /api/auth/forgot-password`
- Always shows generic success message ("If an account exists...")
- Dev mode: shows clickable link to reset page

### `ResetPassword.jsx`
- Reads `?token=` and `?email=` from URL
- New password + confirm with strength check
- Missing/invalid token shows inline warning
- On success → redirect to login

### `Home.jsx`
- **Search**: text input debounced 300ms
- **Cuisine filter**: chips (All, Italian, American, Japanese, Mexican, Indian, Chinese, Nepali)
- **Sort**: Top Rated, Fastest Delivery, Open Now
- **Map**: Leaflet map showing all restaurants
- **Grid**: restaurant cards with image, name, cuisine, rating, delivery time
- **Pagination**: prev/next with page indicator
- **Error state**: retry button + error toast
- **Empty state**: "No matching restaurants" message
- Closed restaurants are dimmed + not clickable

### `Restaurant.jsx`
- Fetches menu from `GET /api/restaurants/:id/menu`
- Displays restaurant info + map
- Menu items grouped by category
- Add to cart functionality

### `Cart.jsx`
- **Delivery location picker** (step 1): Leaflet map with click-to-pin + "Use current location" button
- Saved to localStorage (`delivery-location`)
- Cart items with quantity +/-/remove
- Total calculation
- Empty state
- "Proceed to Checkout" (step 2)

### `Checkout.jsx`
- Phone number (required, 7-15 digits)
- Address input
- Map picker (prefilled from cart delivery location)
- Inline validation (red borders + error messages)
- Place order → clears cart + delivery location → redirect to order tracking

### `OrderTracking.jsx`
- 5-step progress bar (Pending → Confirmed → Preparing → Out for Delivery → Delivered)
- Map showing restaurant + delivery location + rider position
- Phone display
- Visibility-aware polling (pauses when tab hidden, refetches on focus)
- Polls every 15 seconds

### `Account.jsx`
- Profile info: name, email, role, emailVerified
- `TwoFactorSetup` component for 2FA management

### `owner/Dashboard.jsx`
Unified dashboard for owners AND riders (role detected via `user.role`).

**Owner Tabs**: Orders, Menu, Riders, Settings, Earnings
**Rider Tabs**: Deliveries, Earnings

#### Orders Tab (Owner)
- Stats cards: Pending, Active, Completed counts
- **Pending orders**: Accept (opens rider selection modal) / Decline buttons
- **Active orders**: Status transition buttons (multi-button for Pending → Confirmed + Rejected), rider assignment dropdown
- **Completed orders**: summary list
- **Declined orders**: summary list
- Maps for orders with delivery coords

#### Menu Tab (Owner)
- 4-column layout: 3 columns for categorized menu items, 1 column for category management sidebar
- **Category management**: Add category (max 50 chars), Rename category, Delete category (with confirmation showing item count)
- **Subcategory management**: Add subcategory to category, Delete subcategory (items reset to "General")
- **Add menu item**: Name, Category (datalist autocomplete), Subcategory (datalist), Price, Description — **no image upload field**
- **Edit menu item**: Same fields as add — uses datalist inputs for category/subcategory
- **Delete menu item**: Confirmation dialog

#### Riders Tab (Owner)
- List of assigned riders with name + email
- Remove rider button
- Add rider form: name, email, password

#### Settings Tab
- **Owner**: Restaurant details view + Edit form (name, cuisine, deliveryTime, isOpen, image via ImageUpload) + TwoFactorSetup
- **Rider**: Just TwoFactorSetup

#### Earnings Tab
- Stats cards: Today, This Week, All Time, Average per Delivery
- Owner earnings: from `GET /owner/earnings` (sum of delivered order totals)
- Rider earnings: from `GET /rider/earnings`

#### Delivery Tab (Rider)
- Stats cards: In Progress, Delivered counts
- Active deliveries with restaurant logo, items, price, address
- **Start Delivery** button (Ready for Pickup → Out for Delivery)
- **Mark Delivered** button (Out for Delivery → Delivered, with confirmation)
- Delivered history list

### `admin/Panel.jsx`
- **Stats**: User count, restaurant count, order count, total revenue
- **User management**: List users, change role, assign restaurant
- **Restaurant CRUD**: Add, edit, delete restaurants
- **TwoFactorSetup** at bottom of page

---

## 17. Styling & Brand

### CSS Variables (`index.css`)
```css
--primary: #f97316       (orange-500)
--primary-dark: #ea580c  (orange-600)
--primary-light: #fb923c (orange-400)
--font-base: 'Inter', system-ui, sans-serif
```

### Tailwind Theme (`@theme` directive)
```css
--color-primary: #f97316
--color-primary-dark: #ea580c
--color-primary-light: #fb923c
```

### Key Utility Classes
- `.hover-lift` — `translateY(-2px)` + box-shadow on hover, applied to restaurant cards
- `bg-gray-50` — page background
- Orange accent used sparingly (buttons, badges, active states)
- Navbar: white bg, gray text, orange only on logout button

### Font
- **Inter** loaded from Google Fonts in `index.html`
- Applied globally via `* { font-family: var(--font-base); }`

---

## 18. Order Status Flow

```
Customer flow:   Pending → Confirmed → Preparing → Out for Delivery → Delivered
Owner flow:      Pending → Confirmed → Preparing → Ready for Pickup → Out for Delivery → Delivered
                                                       ↓
                                                    Rejected (from Pending)
Rider flow:      Pending → Confirmed → Preparing → Ready for Pickup → Out for Delivery → Delivered
```

Terminal statuses (no transitions out): `Delivered`, `Cancelled`, `Rejected`

**Owner-rider merge**: When owner confirms an order (Pending → Confirmed), they **must** select a rider. The `Delivery` row is created with that rider. Riders can be (re)assigned later via `PATCH /owner/orders/:id/rider`.

---

## 19. Security Features

1. **JWT Authentication** — 2-hour expiry, sent via `Authorization: Bearer` header
2. **CSRF Protection** — Double-submit cookie pattern (cookie + header match)
3. **bcrypt Password Hashing** — 10 salt rounds
4. **Account Lockout** — After 5 failed login attempts
5. **Rate Limiting** — 100 req/min production, 100000 dev
6. **Helmet Security Headers** — CSP, HSTS preload, noSniff, etc.
7. **Input Validation** — Email regex, password strength, field length limits
8. **XSS Prevention** — `sanitizeString()` removes HTML/event handlers
9. **Email Verification** — Required before first login
10. **Password Reset** — Single-use SHA-256 tokens, 30-minute expiry
11. **2FA (TOTP)** — Opt-in authenticator app integration
12. **Email Enumeration Prevention** — Forgot password always returns same message
13. **Role-Based Access Control** — Route-level + endpoint-level authorization
14. **Admin Data Scope** — Only exposes user management + restaurant CRUD, no customer data

---

## 20. Setup & Running

### Prerequisites
- MySQL 8 running on localhost:3306
- Node.js (v18+)

### Database Setup
```sql
CREATE DATABASE smartserve CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Backend
```bash
cd server
cp .env.example .env       # Set your MySQL credentials
npm install
npx prisma generate        # Generate Prisma client (REQUIRED after schema changes)
npx prisma migrate dev     # Apply migrations
npm run seed               # Seed demo data
npm run dev                # Start on port 5001
```

### Frontend
```bash
npm install
npm run dev                # Start on port 5173 (proxies /api to :5001)
```

### Quick Start (Both)
```bash
npm run dev                # Uses concurrently to start FE + BE
```

### Testing
```bash
npm run test               # Frontend Vitest (70 tests)
cd server && npm run test  # Backend Vitest (77 tests)
npx playwright test        # E2E (5 tests, requires both servers)
```

### Database Reset
```bash
cd server
npm run reset              # Refuses if port 5001 in use, then drops + re-migrates + re-seeds
```

---

## 21. Known Limitations

1. **Cart is localStorage only** — Backend `/api/cart` exists but is not wired to frontend
2. **No real payment** — Payment is mocked, no Stripe/PayPal integration
3. **No pagination** on most endpoints (Home page has pagination, others load all)
4. **Email is dev-only** — Prints links to console; production requires `RESEND_API_KEY`
5. **Rider dispatch** — Owner-assigned only, no public dispatch board for riders to claim
6. **Accessibility** — Partial `aria-label` coverage, not fully WCAG-compliant
7. **No image upload in menu item forms** — Only available in restaurant settings

---

## 22. Recent Changes

- **2FA (TOTP)** — Full implementation with QR code, backup codes, login challenge flow
- **Owner earnings** — Dedicated endpoint + dashboard tab
- **Category/SubCategory CRUD** — Dynamic management with datalist inputs
- **Security** — Removed verificationToken from register response
- **Cuisine search** — Fixed to use exact match instead of contains
- **Menu cache** — Removed Cache-Control header for fresh data
- **Customer Account page** — Profile + 2FA at `/account`
- **2FA in admin panel** — Available at bottom of admin Panel page
- **Documentation** — Comprehensive docs in DOCUMENTATION.md + this file
