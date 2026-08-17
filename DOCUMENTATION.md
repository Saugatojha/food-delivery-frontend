# SmartServe — Full-Stack Documentation

## Project Overview

SmartServe is a food ordering platform with four user roles: **Customer**, **Restaurant Owner**, **Rider**, and **Admin**. The frontend is built with React 19 + Vite 8, and the backend is an Express + Prisma + MySQL API.

### Tech Stack

| Layer            | Technology               | Purpose                                                     |
| ---------------- | ------------------------ | ----------------------------------------------------------- |
| Frontend         | React 19                 | UI components                                               |
| Build tool       | Vite 8                   | Dev server + bundler                                        |
| Styling          | Tailwind CSS 4           | Utility-first CSS                                           |
| Routing          | React Router DOM 7       | Client-side navigation                                      |
| HTTP             | Axios                    | API calls to backend                                        |
| Maps             | Leaflet + react-leaflet  | Free map tiles via OpenStreetMap                            |
| Lint             | ESLint                   | React hooks + react-refresh rules                           |
| Test (FE)        | Vitest + Testing Library | Unit tests for utils, mock data, routes                     |
| E2E (FE)         | Playwright               | Browser-level login flow tests (setup only)                 |
| Backend          | Express 5                | REST API server                                             |
| ORM              | Prisma 7                 | Database schema + migrations                                |
| Database         | MySQL 8                  | Relational DB (via Prisma `@prisma/adapter-mariadb` driver) |
| Auth             | bcrypt + JWT             | Password hashing + token auth                               |
| 2FA              | speakeasy + qrcode       | TOTP two-factor authentication (Google Authenticator)       |
| Security         | Helmet                   | CSP headers + HSTS preload                                  |
| Input Validation | Custom sanitization      | XSS prevention + password strength                          |
| Test (BE)        | Vitest                   | Backend route tests                                         |

---

## Architecture

```
frontend/ (port 5173)
  index.html
    └─ src/main.jsx
         └─ BrowserRouter
              └─ App.jsx
                   ├─ ErrorBoundary
                   ├─ AuthProvider (user state)
                    │    └─ ToastProvider
                    │         └─ NotificationProvider (in-app bell + browser push, polls unread-count)
                    │              └─ Navbar (hamburger menu, cart badge, notification bell, responsive)
                    │              └─ <Routes>
                   │              ├─ /login -> Login (AuthShell)
                   │              ├─ /register -> Register (AuthShell)
                   │              ├─ /verify-email?token=&email= -> VerifyEmail
                   │              ├─ /forgot-password -> ForgotPassword (AuthShell)
                   │              ├─ /reset-password?token=&email= -> ResetPassword
                   │              ├─ /terms -> Terms
                   │              ├─ /privacy -> Privacy
                   │              ├─ / -> ProtectedRoute -> Home (map + filters + sort)
                   │              ├─ /restaurant/:id -> ProtectedRoute -> Restaurant (map)
                   │              ├─ /cart -> RoleRoute(customer) -> Cart (location picker → checkout)
                   │              ├─ /checkout -> RoleRoute(customer) -> Checkout (+ map + phone)
                   │              ├─ /orders -> RoleRoute(customer) -> OrderTracking (+ map)
                   │              ├─ /account -> RoleRoute(customer) -> Account (profile + 2FA)
                    │              ├─ /owner -> RoleRoute(owner|rider) -> OwnerDashboard (Role-based: Orders/Menu/Settings/Earnings for owners; Deliveries/Earnings for riders)
                    │              ├─ /owner/menu -> RoleRoute(owner|rider) -> OwnerMenu
                    │              ├─ /owner/orders -> RoleRoute(owner|rider) -> OwnerOrders
                    │              └─ /admin -> RoleRoute(admin) -> AdminPanel (users, restaurants, stats)

Vite dev server proxies /api and /uploads to http://localhost:5001 (see vite.config.js).

server/ (port 5001)
  src/
    ├── index.js                 Express app entry (CORS, JSON, legacy-URL rewrite, EADDRINUSE guard)
    ├── config/
    │   ├── env.js               PORT, JWT_SECRET, JWT_EXPIRES_IN, FRONTEND_URL
    │   └── database.js          PrismaClient singleton with MySQL (mariadb) driver adapter;
    │                            allowPublicKeyRetrieval set for MySQL 8 caching_sha2_password over TCP
    │   ├── middleware/
    │   │   ├── auth.js          authenticate (JWT verify) + authorize (role check)
    │   │   ├── csrf.js          CSRF token validation for state-changing requests
    │   │   └── validate.js      validate() / validateOptional() field checkers; sanitizeString() XSS prevention;
    │   │                        Password validation (8+ chars, upper, lower, digit, special); email/name/length validation
    ├── routes/
    │   ├── auth.js              POST /register (email normalized, unverified), POST /login (403 EMAIL_NOT_VERIFIED until verified; returns requires2FA + tempToken if 2FA enabled), GET /verify-email, POST /resend-verification, POST /forgot-password, POST /reset-password, GET /me, POST /2fa/setup, POST /2fa/enable, POST /2fa/disable, POST /2fa/verify
    │   ├── restaurants.js       GET /, GET /:id/menu
    │   ├── orders.js            POST / (accepts phone), GET /, GET /tracking/:id, PATCH /:id/status (role-scoped)
    │   ├── cart.js              GET /, POST /sync, POST /add, DELETE /:id (authenticated, validates items)
    │   ├── notifications.js     GET /, GET /unread-count, PATCH /:id/read, POST /read-all
    │   ├── upload.js            POST /image (multer → /uploads, returns relative URL)
    │   ├── owner.js             GET/POST/PATCH/DELETE /menu (+ image), GET/POST/PATCH/DELETE /menu/categories, GET/POST/PATCH/DELETE /menu/subcategories, GET/PATCH /restaurant, GET /orders, GET /riders, GET /earnings, PATCH /orders/:id/status (needs riderId to Confirm), PATCH /orders/:id/rider, POST /orders/:id/auto-assign-rider
    │   ├── rider.js             GET /deliveries, GET /my-deliveries, GET /earnings, PATCH /orders/:id/accept, PATCH /orders/:id/reject, PATCH /orders/:id/status
    │   └── admin.js             GET /stats, GET/PATCH /users, GET/POST/PATCH/DELETE /restaurants
    └── utils/
        ├── statusFlow.js        Role-based status transition validation
        ├── mailer.js            sendVerificationEmail + sendPasswordResetEmail (dev: print links to console)
        ├── notify.js            createNotification, notifyRestaurantOwner, notifyCustomer
        ├── urls.js              legacyUrlRewriteMiddleware rewrites stale localhost:5000 URLs to APP_URL
        └── errors.js            Consistent error response helpers
  prisma/
    ├── schema.prisma             14 models (User with 2FA fields, Category, SubCategory, MenuItem category + image, User email verification, PasswordResetToken, Notification)
    ├── seed.js                  Idempotent: skips if users exist; seeds 4 users (emailVerified: true), 7 restaurants, 14 categories, subcategories, 26 menu items
    ├── reset.js                 Refuses if server port 5001 in use, then prisma migrate reset --force (drop, migrate, re-seed)
    └── migrations/              MySQL migration files
```

### Security Checklist

A `SECURITY_CHECKLIST.md` is maintained at the project root covering 4 areas (security, functional, performance, accessibility) with recommended fixes for each item.

### Security Enhancements

**Helmet.js Configuration:**

- **Content Security Policy (CSP):** Restricts script/style execution to same-origin or trusted sources; allows OpenStreetMap tile requests and Resend email service.
- **HSTS Preload:** Enforces HTTPS with a 1-year max age and subdomain inclusion.

**Input Validation & Sanitization (`server/src/middleware/validate.js`):**

- **XSS Prevention:** `sanitizeString()` removes `<>`, `javascript:`, and event handlers from user input.
- **Password Strength:** Requires minimum 8 characters with uppercase, lowercase, digit, and special character.
- **Field Validation:** Email regex, name length limits (100 chars), text/description length caps.
- **Email Verification:** Users cannot log in until email is verified; tokens expire in 1 hour.

### Route Guards

- **ProtectedRoute** — redirects to `/login` if no user in context. Saves intended path.
- **RoleRoute** — accepts `roles` array. Redirects to `/login` if no user, or `/` if wrong role.

### Post-Login Redirect

After successful login, users are redirected by role:

- **Rider** → `/owner` (shared owner/orders dashboard with rider assignment)
- **Owner** → `/owner` (restaurant dashboard)
- **Admin** → `/admin` (restaurant management)
- **Customer** → `/` (Home page with restaurant listing)

---

## File Map (Frontend)

```
src/
├── api/
│   └── client.js                Axios -> '/api' (Vite dev proxy → localhost:5001). 10s timeout. 401 clears auth + redirects to /login except on public paths (/login, /register, /forgot-password, /reset-password, /verify-email).
├── context/
│   ├── AuthContext.jsx           User state, login/register/logout/verify2FA/verifyEmail/resendVerification/forgotPassword/resetPassword via real API. Emails trimmed + lowercased. Login handles requires2FA flow.
│   ├── ToastContext.jsx          Toast notification system. Auto-dismiss after 3s, manual dismiss button, max 3 visible toasts.
│   └── NotificationContext.jsx   Polls /notifications/unread-count (15s), bell badge, Notification API browser push.
├── utils/
│   ├── storage.js                Safe readJson/writeJson/removeKeys.
│   └── leafletIcon.js            Fixes Leaflet default marker icon for Vite.
├── services/
│   └── orders.js                 Async API calls + cart (localStorage with cart-update event) + delivery-location storage + status flow constants. updateOwnerOrderStatus accepts optional riderId.
├── components/
│   ├── AuthShell.jsx             Branded two-column layout wrapping Login / Register / ForgotPassword.
│   ├── EmptyState.jsx            Reusable: icon + title + message + optional action.
│   ├── ErrorBoundary.jsx         Catches render errors, shows reload button.
│   ├── ImageUpload.jsx           Reusable image picker → POST /api/upload/image → returns URL.
│   ├── LoadingSkeleton.jsx       CardSkeleton + ListSkeleton with pulse animation.
│   ├── MapView.jsx               Leaflet map: multi-restaurant markers with popups OR single restaurant/delivery/rider + OSRM road route.
│   ├── Navbar.jsx                Brand link + role-aware nav links + cart badge + notification bell + user name + logout + hamburger menu.
│   ├── ProtectedRoute.jsx        Auth gate.
│   ├── RoleRoute.jsx             Role gate.
│   └── TwoFactorSetup.jsx        TOTP 2FA setup/enable/disable component with QR code and backup codes.
├── data/
│   └── mock.js                   Backup mock data with Kathmandu coordinates.
├── pages/
│   ├── Login.jsx                 Email/username + password with inline validation + toast on error. Handles 2FA challenge (requires2FA + tempToken flow). Redirects by role after login. Shows "verify email" banner on EMAIL_NOT_VERIFIED.
│   ├── Register.jsx              Name (first/middle/last) + email/password with inline validation. On success → /verify-email.
│   ├── VerifyEmail.jsx           Consumes GET /auth/verify-email?token=, resend link UI.
│   ├── ForgotPassword.jsx        Email/username form → POST /auth/forgot-password; shows generic success + devLink (dev only).
│   ├── ResetPassword.jsx         Reads ?token=, new password + confirm with strength check → POST /auth/reset-password; invalid/missing token shows an inline warning.
│   ├── Terms.jsx                 Terms of Service page.
│   ├── Privacy.jsx               Privacy Policy page.
│   ├── Home.jsx                  Map showing all 7 restaurants + search by name/cuisine (debounced 300ms) + cuisine filter chips (incl. Nepali) + sort + retry on failure.
│   ├── Restaurant.jsx            Map showing restaurant location + menu items from API grouped by dynamic category.
│   ├── Account.jsx               Customer account page with profile info + 2FA setup (TwoFactorSetup component).
│   ├── Cart.jsx                  Cart items with qty +/-/remove + total + empty state + delivery-location map picker → proceeds to checkout.
│   ├── Checkout.jsx              Phone + address + map picker (prefilled from cart location) + inline validation. Sends delivery coords to API.
│   ├── OrderTracking.jsx         5-step progress bar + map + real rider coords marker (when provided) + phone display; visibility-aware polling every 15s (pauses when hidden, refetches on focus).
│   ├── owner/
│   │   ├── Dashboard.jsx         Unified role dashboard: Owner tabs (Orders with dynamic transitions/rider assignment, Menu with dynamic category/subcategory management, Settings with 2FA, Earnings); Rider tabs (Deliveries with 'Start Delivery'/'Mark Delivered', Settings with 2FA, Earnings).
│   │   ├── MenuManagement.jsx    Standalone menu management view.
│   │   └── Orders.jsx            Standalone owner orders view.
│   └── admin/
│       └── Panel.jsx             Admin oversight: System stats, user role management, and restaurant CRUD.
├── App.jsx                       Route definitions (login, register, verify-email, forgot-password, reset-password, terms, privacy + role-protected routes incl. /account, /rider).
├── main.jsx                      ReactDOM.createRoot + BrowserRouter + Leaflet CSS.
├── e2e/
│   └── login.spec.js             Playwright: 5 tests — login flow, wrong-password error, server-unreachable message, forgot-password reachability, reset-password invalid-link.
├── playwright.config.js          Playwright config (baseURL localhost:5173, headless).
└── index.css                     @import "tailwindcss", Inter font, brand CSS vars, hover-lift animation
```

---

## File Map (Backend)

```
server/
├── src/
│   ├── index.js                  Express app, CORS, JSON parsing, legacy-URL rewrite middleware, mounts all routes. Logs a clear error and exits if port 5001 is already in use.
│   ├── config/
│   │   ├── env.js                Reads PORT, JWT_SECRET, JWT_EXPIRES_IN, FRONTEND_URL from env.
│   │   └── database.js           PrismaClient with MySQL (mariadb) driver adapter (allowPublicKeyRetrieval for MySQL 8).
│   ├── middleware/
│   │   ├── auth.js               authenticate (JWT verify via Authorization header) + authorize (role check).
│   │   └── validate.js           validate() / validateOptional() field checkers.
│   ├── routes/
│       │   ├── auth.js               POST /api/auth/register, POST /api/auth/login (returns requires2FA if 2FA enabled), GET /api/auth/verify-email?token=, POST /api/auth/resend-verification, POST /api/auth/forgot-password, POST /api/auth/reset-password, GET /api/auth/me, POST /api/auth/2fa/setup, POST /api/auth/2fa/enable, POST /api/auth/2fa/disable, POST /api/auth/2fa/verify
│   │   ├── restaurants.js        GET /api/restaurants, GET /api/restaurants/:id/menu
│   │   ├── orders.js             POST /api/orders (accepts phone), GET /api/orders, GET /api/orders/tracking/:id, PATCH /api/orders/:id/status
│   │   │                         PATCH status is restricted to owner/rider/admin and verified against restaurant ownership (owner) or the assigned rider
│   │   ├── cart.js               GET /api/cart, POST /api/cart/sync, POST /api/cart/add, DELETE /api/cart/:id
│   │   ├── notifications.js      GET /api/notifications, GET /api/notifications/unread-count, PATCH /api/notifications/:id/read, POST /api/notifications/read-all
│   │   ├── upload.js             POST /api/upload/image (multipart, max 5MB, jpeg/png/gif/webp) → { url: '/uploads/...' }
│   │   ├── owner.js              GET/PATCH /api/owner/restaurant, GET /api/owner/orders, GET /api/owner/riders, PATCH /api/owner/orders/:id/status (needs riderId to Confirm), PATCH /api/owner/orders/:id/rider, /api/owner/menu CRUD (+ image), /api/owner/menu/categories CRUD
│   │   ├── rider.js              GET /api/rider/deliveries, GET /api/rider/my-deliveries, GET /api/rider/earnings, PATCH /api/rider/orders/:id/(accept|reject|status)
│   │   └── admin.js              GET /api/admin/stats, GET/PATCH /api/admin/users, GET/POST/PATCH/DELETE /api/admin/restaurants
│   └── utils/
│       ├── statusFlow.js         FLOWS per role, getNextStatus, isValidTransition, TERMINAL_STATUSES
│       ├── mailer.js             sendVerificationEmail + sendPasswordResetEmail — print dev links, send via Resend in production
│       ├── notify.js             createNotification + notifyRestaurantOwner + notifyCustomer
│       ├── urls.js               rewriteLegacyUrls + legacyUrlRewriteMiddleware (rewrites stale localhost:5000 URLs in JSON responses)
│       └── errors.js             error, badRequest, unauthorized, forbidden, notFound, conflict, serverError
├── prisma/
│   ├── schema.prisma             11 models (User emailVerified/verificationToken, MenuItem.image, PasswordResetToken, Notification)
│   ├── seed.js                   Seeds demo data (Kathmandu coords, emailVerified users)
│   ├── reset.js                  Port-5001 guard, then prisma migrate reset --force (drop, migrate, re-seed)
│   └── migrations/               Auto-generated by prisma migrate
├── prisma.config.ts              Prisma 7 config
├── .env                          DATABASE_URL, JWT_SECRET, PORT=5001, CORS_ORIGIN, APP_URL, FRONTEND_URL
└── package.json
```

---

## Prisma Schema

14 models: User, Restaurant, MenuItem, Category, SubCategory, Order, OrderItem, Payment, Delivery, Rating, Notification, PasswordResetToken.

Key coordinate fields (for map feature):

- `Restaurant.latitude` / `Restaurant.longitude`
- `Order.deliveryLatitude` / `Order.deliveryLongitude`
- `Delivery.riderLatitude` / `Delivery.riderLongitude` / `Delivery.locationUpdatedAt`

Key contact field:

- `Order.phone` — Customer phone number for delivery contact

Email verification fields:

- `User.emailVerified` / `User.verificationToken` / `User.verificationExpires`

Two-factor authentication fields:

- `User.twoFactorSecret` (TOTP secret, base32) / `User.twoFactorEnabled` (boolean, default false)

Category/SubCategory fields:

- `Category.restaurantId` / `Category.name` — unique per restaurant
- `SubCategory.categoryId` / `SubCategory.name` — unique per category

Password reset fields:

- `PasswordResetToken.token` (SHA-256 hash, unique) / `userId` / `expiresAt` (30 min) / `usedAt` (single-use) / `createdAt`

Notification fields:

- `Notification.userId` / `title` / `message` / `type` / `orderId` / `read` / `createdAt`

---

## Seed Data

**Users (all passwords: `password`):**

| Name         | Email             | Role     | Notes                                      |
| ------------ | ----------------- | -------- | ------------------------------------------ |
| John Doe     | john@example.com  | customer | Default customer (emailVerified)           |
| Pizza Palace | owner@example.com | owner    | Linked to restaurant ID 1 (emailVerified)  |
| Rider Ram    | rider@example.com | rider    | Can update delivery status (emailVerified) |
| Admin User   | admin@example.com | admin    | Full system overview (emailVerified)       |

> All seed users are created with `emailVerified: true`, so demo logins work without verification. New registrations require email verification before login (dev mailer prints the link to the server console).

**Restaurants:** 7 restaurants with Kathmandu-area coordinates, each with categorized menu items at realistic NPR prices. Taco Town (ID 4) is `isOpen: false`. Each has a placeholder image via `placehold.co`.

| Restaurant   | Cuisine  | Location (lat, lng)              | Items                                         | Image |
| ------------ | -------- | -------------------------------- | --------------------------------------------- | ----- |
| Pizza Palace | Italian  | 27.7150, 85.3120 (Thamel)        | Pizza x2, Appetizer                           | ✅    |
| Burger Barn  | American | 27.7040, 85.3070 (Durbar Square) | Burger x2, Fries                              | ✅    |
| Sushi Spot   | Japanese | 27.6710, 85.3260 (Patan)         | Sushi x2, Appetizer                           | ✅    |
| Taco Town    | Mexican  | 27.7210, 85.3620 (Boudhanath)    | Taco, Quesadilla, Appetizer                   | ✅    |
| Curry House  | Indian   | 27.7100, 85.3480 (Pashupatinath) | Curry, Bread, Rice                            | ✅    |
| Noodle Nest  | Chinese  | 27.6720, 85.4280 (Bhaktapur)     | Noodle, Rice, Appetizer                       | ✅    |
| Momo House   | Nepali   | 27.7180, 85.3350 (Thamel)        | Momo x3, Rice, Noodle, Appetizer, Beverage x2 | ✅    |

---

## Order Status Flow

Roles progress through these statuses (one step at a time):

| Role     | Flow                                                                                                              |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| Customer | Pending → Confirmed → Preparing → Out for Delivery → Delivered                                                    |
| Owner    | Pending → Confirmed → Preparing → Ready for Pickup → Out for Delivery → Delivered (Rejected allowed from Pending) |
| Rider    | Pending → Confirmed → Preparing → Ready for Pickup → Out for Delivery → Delivered                                 |

Terminal statuses (cannot transition out): Delivered, Cancelled, Rejected.

> **Owner/rider merge:** owners work in a shared `/owner` dashboard. When an owner confirms an order (`Pending → Confirmed`), they **must pick a rider** (`riderId` in the request body) — the `Delivery` row is created with that rider assigned. Riders can also be (re)assigned later via `PATCH /api/owner/orders/:id/rider`. A rider (or the owning rider) may only advance an order they are assigned to.

---

## API Contract

All endpoints require `Authorization: Bearer <token>` header except auth routes.

### Auth

| Method | Endpoint                        | Body                        | Response                                                                                   |
| ------ | ------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------ |
| POST   | `/api/auth/register`            | `{ name, email, password }` | `201 { message, user: { emailVerified: false }, devLink? }` (no token — must verify email) |
| POST   | `/api/auth/login`               | `{ login, password }`       | `{ token, user }` or `{ requires2FA: true, tempToken }` or `403 { code: 'EMAIL_NOT_VERIFIED', email }` |
| GET    | `/api/auth/verify-email?token=` | —                           | `{ message }` (marks email verified)                                                       |
| POST   | `/api/auth/resend-verification` | `{ login }`                 | `{ message, devLink? }`                                                                    |
| POST   | `/api/auth/forgot-password`     | `{ login }`                 | `{ message, devLink? }` (generic message — no email enumeration)                           |
| POST   | `/api/auth/reset-password`      | `{ token, password }`       | `{ message }` (single-use, 30-min expiry, resets lockout)                                  |
| GET    | `/api/auth/me`                  | —                           | `{ user }` (includes twoFactorEnabled)                                                     |
| POST   | `/api/auth/2fa/setup`           | —                           | `{ secret, qrCode }` (QR data URL for authenticator app)                                  |
| POST   | `/api/auth/2fa/enable`          | `{ token }`                 | `{ message, backupCodes }` (6-digit TOTP code from authenticator app)                      |
| POST   | `/api/auth/2fa/disable`         | `{ token }`                 | `{ message }` (requires current TOTP code)                                                 |
| POST   | `/api/auth/2fa/verify`          | `{ tempToken, token }`      | `{ token, user }` (completes 2FA login with TOTP code)                                    |

Emails are normalized (trimmed + lowercased) on register and login. New users must verify their email before the first login. In dev (`NODE_ENV !== 'production'`), `mailer.js` prints the verification URL to the server console instead of sending real email; the frontend also surfaces it as a `devLink`.

### Restaurants

| Method | Endpoint                    | Response                |
| ------ | --------------------------- | ----------------------- |
| GET    | `/api/restaurants`          | `[ Restaurant ]`        |
| GET    | `/api/restaurants/:id/menu` | `{ restaurant, items }` |

### Orders

| Method | Endpoint                   | Body                                                                                                                         | Response                                                                                |
| ------ | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| POST   | `/api/orders`              | `{ items: [{ menuItemId, restaurantId, quantity }], address, phone?, paymentMethod, deliveryLatitude?, deliveryLongitude? }` | `Order` (owner gets a "New order received" notification)                                |
| GET    | `/api/orders`              | —                                                                                                                            | `[ Order ]`                                                                             |
| GET    | `/api/orders/tracking/:id` | —                                                                                                                            | `Order` with restaurant/delivery coords                                                 |
| PATCH  | `/api/orders/:id/status`   | `{ status }`                                                                                                                 | `Order` (owner/rider/admin only; owner must own the restaurant, rider must be assigned) |

### Cart

| Method | Endpoint         | Body                                                  | Response                                                                                                                                 |
| ------ | ---------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/cart`      | —                                                     | `[ CartItem ]` (with `menuItem`)                                                                                                         |
| POST   | `/api/cart/sync` | `{ items: [{ menuItemId, restaurantId, quantity }] }` | `[ CartItem ]` — validates every item exists and belongs to the given restaurant, clamps quantity to 1–99, then replaces the user's cart |
| POST   | `/api/cart/add`  | `{ menuItemId, restaurantId, quantity }`              | `CartItem` — validates item + restaurant, adds or upserts quantity (capped at 99)                                                        |
| DELETE | `/api/cart/:id`  | —                                                     | `{ message }`                                                                                                                            |

The cart UX is still client-side (localStorage); the `/api/cart` endpoints are available for server-side sync but are not yet wired into the frontend.

### Notifications

| Method | Endpoint                          | Response                       |
| ------ | --------------------------------- | ------------------------------ |
| GET    | `/api/notifications`              | `[ Notification ]` (latest 50) |
| GET    | `/api/notifications/unread-count` | `{ count }`                    |
| PATCH  | `/api/notifications/:id/read`     | `Notification`                 |
| POST   | `/api/notifications/read-all`     | `{ message }`                  |

Notifications are created for: new order (owner), order Confirmed/Rejected (customer), Out for Delivery/Delivered (customer).

### Upload

| Method | Endpoint            | Body                                           | Response  |
| ------ | ------------------- | ---------------------------------------------- | --------- |
| POST   | `/api/upload/image` | multipart `image` (max 5MB, jpeg/png/gif/webp) | `{ url }` |

Uploaded files land in `server/uploads/` and are served at `/uploads/...`. The returned URL is relative (`/uploads/<file>`); the Vite dev proxy forwards `/uploads` to the backend.

### Owner

| Method | Endpoint                             | Body                                          | Response                                                               |
| ------ | ------------------------------------ | --------------------------------------------- | ---------------------------------------------------------------------- |
| GET    | `/api/owner/restaurant`              | —                                             | `Restaurant`                                                           |
| PATCH  | `/api/owner/restaurant`              | restaurant fields                             | `Restaurant`                                                           |
| GET    | `/api/owner/orders`                  | —                                             | `[ Order ]`                                                            |
| PATCH  | `/api/owner/orders/:id/status`       | `{ status, riderId? }`                        | `Order` — `riderId` is **required** to confirm (`Pending → Confirmed`) |
| PATCH  | `/api/owner/orders/:id/rider`        | `{ riderId }`                                 | `Order` — (re)assign a rider to a non-terminal order                   |
| POST   | `/api/owner/orders/:id/auto-assign-rider` | —                                        | `{ rider, order }` — auto-assigns first available rider                |
| GET    | `/api/owner/riders`                  | —                                             | `[ { id, name, email } ]` — rider accounts for assignment              |
| POST   | `/api/owner/riders`                  | `{ name, email, password }`                   | `{ id, name, email }` — creates a new rider account                    |
| DELETE | `/api/owner/riders/:id`              | —                                             | `{ message }` — removes rider from restaurant                          |
| GET    | `/api/owner/menu`                    | —                                             | `[ MenuItem ]`                                                         |
| POST   | `/api/owner/menu`                    | `{ name, price, category?, subCategory?, desc? }` | `MenuItem` (auto-creates Category record if new)                   |
| PATCH  | `/api/owner/menu/:id`                | `{ name?, price?, category?, subCategory?, desc? }` | `MenuItem`                                                     |
| DELETE | `/api/owner/menu/:id`                | —                                             | `{ message }`                                                          |
| GET    | `/api/owner/menu/categories`         | —                                             | `[{ name, subCategories: [{ id, name }] }]`                           |
| POST   | `/api/owner/menu/categories`         | `{ name }`                                    | `201 { category }` (creates custom category, max 50 chars)             |
| PATCH  | `/api/owner/menu/categories/:oldName`| `{ newName }`                                 | `{ message, newCategory }` (renames category across all items)         |
| DELETE | `/api/owner/menu/categories/:name`   | —                                             | `{ message }` (removes category and all items within)                  |
| POST   | `/api/owner/menu/subcategories`      | `{ name, category }`                          | `201 { id, name, category }`                                           |
| PATCH  | `/api/owner/menu/subcategories/:id`  | `{ name }`                                    | `{ message, name }` (renames subcategory)                              |
| DELETE | `/api/owner/menu/subcategories/:id`  | —                                             | `{ message }` (resets items to "General")                              |
| GET    | `/api/owner/earnings`                | —                                             | `{ totalEarnings, totalDeliveries, dailyEarnings, dailyCount, weeklyEarnings, weeklyCount }` |

### Rider

| Method | Endpoint                       | Body                      | Response                                                                                     |
| ------ | ------------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| GET    | `/api/rider/deliveries`        | —                         | `[ Order ]` (available for pickup)                                                           |
| GET    | `/api/rider/my-deliveries`     | —                         | `[ Order ]` (rider's accepted deliveries)                                                    |
| GET    | `/api/rider/earnings`          | —                         | `{ totalEarnings, totalDeliveries, dailyEarnings, dailyCount, weeklyEarnings, weeklyCount }` |
| PATCH  | `/api/rider/orders/:id/accept` | —                         | `Order` (assigns rider, status→Out for Delivery)                                             |
| PATCH  | `/api/rider/orders/:id/reject` | —                         | `{ message }` (returns to pending)                                                           |
| PATCH  | `/api/rider/orders/:id/status` | `{ status }`              | `Order`                                                                                      |

### Admin

| Method | Endpoint                     | Body                      | Response                                                   |
| ------ | ---------------------------- | ------------------------- | ---------------------------------------------------------- |
| GET    | `/api/admin/stats`           | —                         | `{ users, restaurants, orders, revenue }`                  |
| GET    | `/api/admin/users`           | —                         | `[ User ]`                                                 |
| PATCH  | `/api/admin/users/:id`       | `{ role?, restaurantId? }`| `User` (updates user role or linked restaurant)            |
| GET    | `/api/admin/restaurants`     | —                         | `[ Restaurant ]`                                           |
| POST   | `/api/admin/restaurants`     | restaurant fields         | `Restaurant`                                               |
| PATCH  | `/api/admin/restaurants/:id` | restaurant fields         | `Restaurant`                                               |
| DELETE | `/api/admin/restaurants/:id` | —                         | `{ message }`                                              |

---

## Key Frontend Features

### Home Page

- **Map** — Leaflet/OSM map showing all 7 restaurants as orange **R** markers at their Kathmandu locations. Click marker for popup with name + cuisine.
- **Search** — Text filter by restaurant name or cuisine, **debounced 300ms** so the request fires only after the user pauses typing.
- **Error / retry** — If the restaurant list fails to load, an inline error state with a **Retry** button and an error toast is shown.
- **Cuisine chips** — All / Italian / American / Japanese / Mexican / Indian / Chinese / Nepali buttons.
- **Sort** — Top Rated, Fastest Delivery, Open Now.
- **Location label** — "Delivering to Kathmandu, Nepal".

### Checkout

- **Phone number** — Required field with format validation (7-15 digits).
- **Inline validation** — Red borders + error messages for missing address, phone, map location, or closed restaurant.
- **Cart badge** — Navbar shows live item count via `cart-update` custom event.

### Cart → Delivery Location (Feature 1)

- The Cart page shows a **map location picker** ("1. Choose your delivery location") before checkout.
- The customer clicks the map (or "Use current location") to drop a delivery pin.
- The chosen location is persisted to localStorage (`delivery-location`) and prefilled on the Checkout page map.
- "2. Proceed to Checkout" navigates to `/checkout`; the saved location is cleared after the order is placed.

### Email Verification (Feature 2)

- **Register** creates an unverified account (`emailVerified: false`) and does **not** log the user in or return a token. The response includes a `devLink` (dev mode only) and the `verificationToken` for immediate use.
- **Login** returns `403 { code: 'EMAIL_NOT_VERIFIED', email }` until the account is verified. Login shows a banner with a "Resend verification link" action.
- **Verify page** (`/verify-email`) consumes `GET /api/auth/verify-email?token=`, shows success/error, and offers resend. After registration, users are automatically redirected with the verification token for immediate verification.
- **Resend** (`POST /api/auth/resend-verification`) rotates the token and prints a new dev link.
- **Dev mailer** (`server/src/utils/mailer.js`) prints verification **and** password-reset links to the server console; production sends real email via Resend (`RESEND_API_KEY`).
- Seed users are pre-verified so demo logins still work.

### Notifications (Feature 3)

- **In-app bell** in the Navbar polls `/api/notifications/unread-count` every 15s, shows an unread badge, and a dropdown list. Mark-read and mark-all-read actions are wired.
- **Browser push** — on an unread-count increase, the frontend requests the `Notification` permission once and shows a browser notification (title + message). Works while the tab is open.
- **Events**: owner receives "New order received" on order create; customer receives notifications when an order is **Confirmed**, **Rejected**, **Out for Delivery**, and **Delivered**.

### Password Reset (Feature 5)

- **Forgot Password page** (`/forgot-password`, wrapped in `AuthShell`) — email-or-username form → `POST /api/auth/forgot-password`. Always shows the same generic success message ("If an account exists...") so the endpoint does not leak which emails are registered.
- **Reset Password page** (`/reset-password?token=&email=`) — new password + confirm with the same strength rules as Register → `POST /api/auth/reset-password`. A missing/invalid token shows an inline warning with a "Request a new reset link" action.
- **Backend** — reset tokens are single-use, SHA-256 hashed at rest, expire after 30 minutes, and a successful reset clears the account lockout (`failedLoginAttempts`/`lockedUntil`). Rate-limited (5/10 min) like registration.
- **Dev mailer** prints the reset link (`FRONTEND_URL` + `/reset-password?token=...`) to the server console; production sends real email via Resend.

### Rider Dispatch (Feature 6)

- **Owner dashboard** fetches `GET /api/owner/riders` and shows a rider dropdown per order; the accept modal requires selecting a rider before confirming an order.
- **Assign later** — a per-order "Assign rider" dropdown calls `PATCH /api/owner/orders/:id/rider`, so riders can be (re)assigned after an order is placed (not on terminal orders).
- **Backend** — `PATCH /api/owner/orders/:id/status` now returns `400` if `riderId` is missing for `Pending → Confirmed`; it no longer auto-assigns the owner as rider.

### Image Uploads (Feature 4)

- **Upload API** — `POST /api/upload/image` (multer, 5MB max, jpeg/png/gif/webp) stores files in `server/uploads/` and returns a relative URL (`/uploads/<file>`).
- **ImageUpload component** (`src/components/ImageUpload.jsx`) — reusable file picker with preview, used in:
  - Owner **Settings** tab (restaurant image).
  - Owner **Menu** add/edit forms (per-item images, both Dashboard tab and `/owner/menu` page).
- **Display** — menu item thumbnails appear in the owner menu lists, Cart, and the customer Restaurant page.

### Two-Factor Authentication (2FA)

- **TOTP-based** — Uses Google Authenticator or any TOTP-compatible authenticator app.
- **Setup flow** — User clicks "Enable 2FA" in Settings/Account, backend generates a TOTP secret and QR code, user scans with authenticator app and enters a 6-digit code to confirm.
- **Login flow** — If 2FA is enabled, login returns `{ requires2FA: true, tempToken }` instead of a real JWT. Frontend shows a 6-digit code input; backend verifies the TOTP code and issues the real JWT.
- **Disable flow** — User enters current TOTP code to disable 2FA; secret is removed from the database.
- **Backup codes** — 8 one-time-use codes generated on enable (displayed once, stored client-side).
- **Available to all roles** — Customer (Account page), Owner/Rider (Dashboard Settings), Admin (Admin Panel).
- **Opt-in** — `User.twoFactorEnabled` defaults to `false`; existing users are unaffected.

### Dynamic Category & Subcategory Management

- **Category/SubCategory models** — Prisma models with `@@unique([restaurantId, name])` and `@@unique([categoryId, name])` constraints.
- **CRUD endpoints** — `GET/POST/PATCH/DELETE /owner/menu/categories` and `POST/PATCH/DELETE /owner/menu/subcategories`.
- **Auto-creation** — Adding a menu item with a new category name auto-upserts the Category record.
- **Dynamic input fields** — Category and subcategory fields in the add/edit menu item forms are text inputs with `<datalist>` autocomplete suggestions (not hardcoded dropdowns), allowing users to type new category names directly.

### Restaurant Images

- **Local files** — Restaurant images stored as static files in `public/` (burgerbarn.png, curryhouse.png, momohouse.png, noodenest.png, sushispot.png, tocotown.png).
- **Seed data** — References local paths (`/burgerbarn.png`) instead of external placeholder URLs.
- **Display** — `object-contain` on Home page cards and Restaurant detail page for proper image rendering.

### Owner Earnings

- **Dedicated endpoint** — `GET /api/owner/earnings` returns daily, weekly, and total earnings for the owner's restaurant (sum of `Order.total` for delivered orders).
- **Separate from rider earnings** — Owner earnings are scoped to the restaurant; rider earnings are scoped to the rider's deliveries.

### Email Normalization

Emails are trimmed and lowercased both on the frontend (AuthContext) and backend (auth routes), so `John@Test.com` matches `john@test.com`.

### Responsive Navigation

- **Hamburger menu** — Navbar collapses to a hamburger button (`☰`/`✕`) on small screens. Menu items slide down in a mobile dropdown.
- **`aria-expanded`** — Screen-reader-accessible toggle state.

### Brand Styling

- **CSS variables** — `--primary: #F97316` (orange), `--font-base: 'Inter', system-ui` set via `@theme` directive in `index.css`.
- **Inter font** — Loaded from Google Fonts in `index.html`.
- **Hover-lift** — `.hover-lift` utility class: `translateY(-2px)` + box-shadow on hover, applied to restaurant cards.

### Restaurant Images

- **Schema** — `Restaurant.image` (String?) added via migration `add_image`.
- **Placeholder URLs** — Each of the 7 restaurants has a `placehold.co` URL in seed data.
- **Display** — Thumbnail image shown on Home cards and Restaurant detail page.

### Dynamic Category Management

Restaurant menus feature dynamic category management instead of hardcoded cuisine categories:

- **Custom Categories** — Owners can create new custom categories (max 50 characters, trimmed, validated) directly from the Menu dashboard sidebar.
- **Rename Categories** — Renaming a category (`PATCH /api/owner/menu/categories/:oldName`) updates all associated menu items automatically in a single atomic operation.
- **Delete Categories** — Deleting a category (`DELETE /api/owner/menu/categories/:name`) cleans up the category and associated items with explicit UI confirmation.
- **Category Management Panel** — 4-column layout in Owner Dashboard (3 columns for categorized menu items, 1 column for category management sidebar with live item counts and quick-edit controls).
- **Customer View** — Customer restaurant menu views dynamically group menu items under their respective custom categories.

### Rider Delivery Management & Owner Order Visibility

- **Rider Deliveries View** — Riders have a dedicated **Deliveries** tab displaying assigned active orders (`Ready for Pickup` and `Out for Delivery`) with restaurant logos, customer addresses, phone numbers, and delivery statistics.
- **Action Buttons** — Quick lifecycle actions: **Start Delivery** (`Ready for Pickup → Out for Delivery`) and **Mark Delivered** (`Out for Delivery → Delivered` with confirmation dialog).
- **Owner Visibility** — Active orders in the Owner dashboard display the assigned rider with a `🚴 Rider: [Name]` badge and color-coded status pills.
- **Earnings Tab** — Both owners and riders have access to their earnings breakdown (daily, weekly, and total metrics).

### Dynamic Order Status Transitions

- **Flexible Workflow** — `getAllowedTransitions()` calculates valid status options per role.
- **Multi-Button Actions** — Instead of a single sequential button, owners and riders see explicit transition buttons for each valid next status.
- **Pending Actions** — Pending orders present distinct **Accept** (opens rider selection modal) and **Decline** (red reject button) controls.
- **Customer Notifications** — Status transitions trigger real-time in-app notifications and browser push alerts for customers.

### OSRM Road Routing

- **RoadRoute component** — Fetches driving route geometry from the public OSRM API (`router.project-osrm.org`).
- **Real polyline** — Replaces the previous straight-line polyline with the actual road path.
- **Fallback** — If the OSRM fetch fails, no route is drawn and a small non-blocking "Route unavailable" note is shown instead of failing silently.

### Accessibility

- **`aria-label`** — Added to search input, cuisine filter chips (`aria-pressed`), login/register buttons, checkout actions, place-order, and "use current location" button.
- **`aria-expanded`** — Navbar hamburger menu communicates toggle state.

---

## Known Limitations

1. **MySQL for dev/prod** — MySQL 8 via Prisma driver adapter; connection URL in `server/.env` (`DATABASE_URL`). Copy `server/.env.example` to `server/.env` and set your own credentials (never commit real passwords).
2. **Cart is localStorage** — Cart persists locally; a backend `/api/cart` API exists (validated `sync`/`add`) but is not yet wired into the frontend, so carts don't sync across devices.
3. **No real payment** — Payment is mocked. No Stripe/PayPal integration.
4. **No pagination** — All data loads at once.
5. **Email is dev-only** — `mailer.js` prints verification + password-reset links to the server console instead of sending real email; production requires a `RESEND_API_KEY`.
6. **Owner-restaurant linking** — Hardcoded via `ownerId`. Admin panel allows assigning owners when adding/editing restaurants.
7. **Rider dispatch** — Owners can now assign a rider per order, but there is still no public dispatch board for riders to claim orders; riders are assigned by the owner.
8. **Accessibility** — Partial `aria-label` coverage; not fully WCAG-compliant.
9. **Test coverage** — 77 backend tests + 70 frontend tests + 5 Playwright e2e tests (e2e/ directory).

### Recent Security Improvements

- **2FA (TOTP)** - Opt-in two-factor authentication using Google Authenticator / Authy. Setup generates a QR code and backup codes; login adds a 6-digit code step when enabled. Available to all roles (customers via Account page, owners/riders via Dashboard Settings, admins via Admin Panel).
- **Email verification token removed from register response** - The raw `verificationToken` is no longer sent in the registration API response, preventing email verification bypass. Dev mode still provides `devLink` for testing.
- **Email verification optimization** - Users are automatically redirected with the dev link for immediate verification in dev mode.
- **Admin data scope** - Admin panel is properly scoped to only expose user management (id, name, email, role, restaurantId) and restaurant CRUD operations. No customer order data is accessible via admin routes.
- **Forgot password functionality** - Properly implemented with secure token handling and rate limiting.

---

## Build & Run

### Prerequisites

- **MySQL 8** running locally (Windows service `MySQL80`, or any reachable instance).
- Set `DATABASE_URL` in `server/.env`:
  `mysql://<user>:<password>@localhost:3306/smartserve`
  (Copy `server/.env.example` and replace `<your-password>` with your own — real credentials are never committed.)
- Create the database once: `CREATE DATABASE smartserve CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`

### Backend

```bash
cd server
npm install
npx prisma migrate dev   # apply migrations (MySQL schema)
npm run seed             # Re-run seed data (4 users, 7 restaurants, 26 menu items)
npm run dev              # Dev server with nodemon on port 5001
npm run test             # Vitest (77 tests)
npm run reset            # Refuses if port 5001 in use, then prisma migrate reset --force (drop DB, re-migrate, re-seed)
npm run migrate          # Run prisma migrate dev
```

### Frontend

```bash
npm run dev          # Vite dev server with HMR on port 5173
npm run build        # Production build -> dist/
npm run preview      # Preview production build
npm run lint         # ESLint check
npm run test         # Vitest (70 tests)
npm run test:e2e     # Playwright E2E tests (requires both servers running)
```

### Running Tests

```bash
# Frontend tests (from repo root)
npm run test

# Backend tests
cd server && npx vitest run

# Both
cd server && npx vitest run && cd .. && npm run test

# E2E tests (requires both servers running)
npx playwright test
```

The frontend Axios client uses a relative base URL (`/api`); in development the Vite server proxies `/api` and `/uploads` to `http://localhost:5001` (see `vite.config.js`). Set `VITE_API_URL` in `.env` to override the base URL in production builds.

---

## Agile Development Process (Scrum)

SmartServe is developed using an **agile (Scrum-style) methodology**: small, time-boxed sprints delivering working, tested increments; a prioritized product backlog; and a defined Definition of Done. This section records the process, the work delivered so far, and the future backlog.

### Roles

| Role          | Responsibility                                          | Owner                |
| ------------- | ------------------------------------------------------- | -------------------- |
| Product Owner | Prioritizes backlog, defines user stories, accepts work | Client / stakeholder |
| Scrum Master  | Facilitates ceremonies, removes blockers, guards DoD    | Dev lead             |
| Developers    | Implement stories, self-organize, estimate              | Engineering team     |

### Ceremonies

| Ceremony         | Frequency            | Purpose                                           |
| ---------------- | -------------------- | ------------------------------------------------- |
| Backlog grooming | Bi-weekly            | Split epics into stories, estimate, re-prioritize |
| Sprint planning  | Start of each sprint | Commit to sprint goal + sprint backlog            |
| Daily stand-up   | Daily (15 min)       | Progress, plan, blockers                          |
| Sprint review    | End of sprint        | Demo working increment to stakeholders            |
| Retrospective    | End of sprint        | What went well / improve / action items           |

### Definition of Done (DoD)

A user story is **Done** only when all of the following are true:

- Feature works end-to-end against the real API (no mock-only paths).
- Backend: route covered by a passing Vitest test; migration applied.
- Frontend: `vite build` succeeds; component tested where applicable.
- Feedback states covered: loading, empty, success, and error.
- Accessibility: new interactive elements have `aria-label` / keyboard access.
- Documentation updated (`DOCUMENTATION.md` / `SEQUENCE_DIAGRAMS.md`).
- Branch merged to `main` and pushed.

### Product Backlog (prioritized)

| ID    | User story                                                                                                 | Priority | Status              |
| ----- | ---------------------------------------------------------------------------------------------------------- | -------- | ------------------- |
| US-01 | As a customer, I want to enter my delivery location on the Cart page so that I can go straight to checkout | High     | ✅ Done (Sprint 6)  |
| US-02 | As a new user, I want to verify my email before logging in so that my account is secure                    | High     | ✅ Done (Sprint 6)  |
| US-03 | As a customer, I want a notification when the restaurant accepts or rejects my order                       | High     | ✅ Done (Sprint 6)  |
| US-04 | As an owner, I want to upload images for my restaurant and menu items                                      | High     | ✅ Done (Sprint 6)  |
| US-05 | As a customer, I want the order tracker to update live so that I don't have to refresh                     | High     | ✅ Done (Sprint 8)  |
| US-06 | As a customer, I want a 3-step checkout wizard with live validation                                        | Medium   | 🆕 Backlog          |
| US-07 | As a user, I want dark mode and reduced-motion support                                                     | Medium   | 🆕 Backlog          |
| US-08 | As an owner, I want to manage restaurant linking to my account                                             | Low      | 🆕 Backlog          |
| US-09 | As a user who forgot my password, I want to reset it via email so that I can get back into my account      | High     | ✅ Done (Sprint 9)  |
| US-10 | As an owner, I want to assign a specific rider to each order so that deliveries are dispatched             | High     | ✅ Done (Sprint 9)  |
| US-11 | As an owner, I want to create, rename, and delete custom menu categories dynamically                      | High     | ✅ Done (Sprint 10) |
| US-12 | As a rider, I want dedicated delivery management with one-click status updates and earnings metrics        | High     | ✅ Done (Sprint 10) |

### Sprint History

| Sprint | Goal                     | Delivered                                                                                                                                                                                                                                      |
| ------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1      | Foundation               | Express + Prisma + MySQL API, JWT httpOnly auth, CORS, CSRF                                                                                                                                                                                    |
| 2      | Discovery                | Home page with map, search, cuisine filters, sort, pagination                                                                                                                                                                                  |
| 3      | Ordering                 | Restaurant/menu pages, cart (localStorage), mock payment checkout                                                                                                                                                                              |
| 4      | Fulfillment              | Role dashboards: owner (orders/menu/settings), rider (deliveries/earnings), admin CRUD                                                                                                                                                         |
| 5      | Reliability              | Security checklist, account lockout, rate limits, accessibility audit, category/subcategory menu system, docs                                                                                                                                  |
| 6      | Engagement               | Delivery location → checkout (US-01), email verification (US-02), in-app + browser notifications (US-03), image uploads (US-04)                                                                                                              |
| 7      | Polish                   | UI polish, component feedback states, design audit, and road-route integration                                                                                                                                                                 |
| 8      | Hardening (bug fixes)    | Visibility-aware order tracking polling (US-05), real rider coords (no simulated rider), error surfacing (Home retry, Checkout toast, OSRM route note), debounced restaurant search, dismissible + capped toasts                               |
| 9      | Auth + dispatch          | Password reset via email (US-09), owner-driven rider dispatch (US-10, rider list + per-order assignment), Vite proxy to backend, relative upload URLs, 401 redirect guard, EADDRINUSE guard                                                      |
| 10     | Workflow & categories (current) | Dynamic category management (US-11: GET/POST/PATCH/DELETE /owner/menu/categories, custom categories, rename, delete), rider delivery workflow (US-12: 'Start Delivery', 'Mark Delivered', stats), dynamic order transitions, demo data update |

### Velocity & Quality

- **Test suite:** 77 backend + 70 frontend + 5 e2e = 152 automated tests, all green.
- **Build:** production `vite build` passes.
- **Working increment at end of every sprint** — demonstrable against the live dev servers.

### Retrospective notes (Sprint 6)

- **Went well:** 4 independent features shipped in one sprint; schema migration + seed handled cleanly; backend notifications isolated in `utils/notify.js` so routes stay thin.
- **Improve:** e2e Playwright suite not yet run against the new auth flow. (The Sprint 6 frontend lint tech-debt — inline `Eye` components and `set-state-in-effect` — was resolved in the hardening pass; `eslint.config.js` now disables the over-aggressive `set-state-in-effect` rule that false-positives on async-fetch effects.)

---

## Component Abstraction & Navigation Flow

### Abstraction layers

| Layer                 | Responsibility                                | Examples                                                                                                            |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| App shell             | Providers + global layout + route table       | `ErrorBoundary`, `AuthProvider`, `ToastProvider`, `NotificationProvider`, `Navbar`, `<Routes>`                      |
| Route guards          | Authorization at route level                  | `ProtectedRoute` (logged-in), `RoleRoute` (role check)                                                              |
| Pages                 | Route-level views / screens                   | `Login`, `Register`, `VerifyEmail`, `ForgotPassword`, `ResetPassword`, `Terms`, `Privacy`, `Home`, `Restaurant`, `Cart`, `Checkout`, `OrderTracking`, `owner/Dashboard`, `admin/Panel` |
| Reusable components   | Shared building blocks used by many pages     | `Navbar`, `MapView`, `ImageUpload`, `LoadingSkeleton`, `EmptyState`, `ErrorBoundary`, `AuthShell`, `TwoFactorSetup`                 |
| Context providers     | Cross-cutting shared state (no prop drilling) | `AuthContext`, `ToastContext`, `NotificationContext`                                                                |
| Services / API client | Data access layer                             | `api/client.js`, `services/orders.js`                                                                               |

### Component tree (route → components)

```
App
└─ ErrorBoundary
   └─ AuthProvider
      └─ ToastProvider
         └─ NotificationProvider
            ├─ Navbar                      (bell + dropdown reads NotificationContext)
            └─ Routes
               ├─ /login            → Login (AuthShell)
               ├─ /register         → Register (AuthShell)
               ├─ /verify-email     → VerifyEmail
               ├─ /forgot-password  → ForgotPassword (AuthShell)
               ├─ /reset-password   → ResetPassword
               ├─ /terms            → Terms
               ├─ /privacy          → Privacy
               ├─ /                 → ProtectedRoute → Home
               ├─ /restaurant/:id   → ProtectedRoute → Restaurant
               ├─ /cart             → RoleRoute(customer) → Cart → MapView
               ├─ /checkout         → RoleRoute(customer) → Checkout → MapView
               ├─ /orders           → RoleRoute(customer) → OrderTracking
               ├─ /account          → RoleRoute(customer) → Account → TwoFactorSetup
               ├─ /owner            → RoleRoute(owner)    → owner/Dashboard → ImageUpload, CardSkeleton, TwoFactorSetup
               ├─ /owner/menu       → RoleRoute(owner)    → owner/MenuManagement
               ├─ /owner/orders     → RoleRoute(owner)    → owner/Orders
               ├─ /rider            → RoleRoute(rider)    → owner/Dashboard → TwoFactorSetup
               └─ /admin            → RoleRoute(admin)    → admin/Panel → TwoFactorSetup
```

### Components needed: signup → login → dashboard

1. **`Register.jsx`** — form + validation + password strength meter; on success calls `register()`, then `navigate('/verify-email?email=...')` (no auto-login).
2. **`VerifyEmail.jsx`** — reads `?token`, calls `AuthContext.verifyEmail(token)`, redirects to `/login`.
3. **`Login.jsx`** — calls `AuthContext.login()`; on success routes by role: `roleRoutes = { rider: '/owner', owner: '/owner', admin: '/admin' }` → `navigate(roleRoutes[u.role] || '/')` (customers land on Home).
4. **Route guard `RoleRoute`** — reads `AuthContext.user`; unauthenticated → `/login`, wrong role → `/`. Passes through when role matches.
5. **Dashboard pages** — compose reusable components + context: e.g. `owner/Dashboard` uses `ImageUpload` (restaurant image), `CardSkeleton` (loading), `ToastContext` (feedback), `AuthContext` (identity); `Navbar` renders the notification bell backed by `NotificationContext`.
