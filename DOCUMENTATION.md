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
                   │              ├─ / -> ProtectedRoute -> Home (map + filters + sort)
                   │              ├─ /restaurant/:id -> ProtectedRoute -> Restaurant (map)
                   │              ├─ /cart -> RoleRoute(customer) -> Cart (location picker → checkout)
                   │              ├─ /checkout -> RoleRoute(customer) -> Checkout (+ map + phone)
                   │              ├─ /orders -> RoleRoute(customer) -> OrderTracking (+ map)
                    │              ├─ /owner -> RoleRoute(owner|rider) -> OwnerDashboard (Orders/Menu/Settings tabs, rider assignment)
                    │              └─ /admin -> RoleRoute(admin) -> AdminPanel (restaurant CRUD only)

Vite dev server proxies /api and /uploads to http://localhost:5001 (see vite.config.js).

server/ (port 5001)
  src/
    ├── index.js                 Express app entry (CORS, JSON, legacy-URL rewrite, EADDRINUSE guard)
    ├── config/
    │   ├── env.js               PORT, JWT_SECRET, JWT_EXPIRES_IN, FRONTEND_URL
    │   └── database.js          PrismaClient singleton with MySQL (mariadb) driver adapter;
    │                            allowPublicKeyRetrieval set for MySQL 8 caching_sha2_password over TCP
    ├── middleware/
    │   ├── auth.js              authenticate (JWT verify) + authorize (role check)
    │   ├── csrf.js              CSRF token validation for state-changing requests
    │   └── validate.js          validate() / validateOptional() field checkers; sanitizeString() XSS prevention;
    │                            Password validation (8+ chars, upper, lower, digit, special); email/name/length validation
    ├── routes/
    │   ├── auth.js              POST /register (email normalized, unverified), POST /login (403 EMAIL_NOT_VERIFIED until verified), GET /verify-email, POST /resend-verification, POST /forgot-password, POST /reset-password, GET /me
    │   ├── restaurants.js       GET /, GET /:id/menu
    │   ├── orders.js            POST / (accepts phone), GET /, GET /tracking/:id, PATCH /:id/status (role-scoped)
    │   ├── cart.js              GET /, POST /sync, POST /add, DELETE /:id (authenticated, validates items)
    │   ├── notifications.js     GET /, GET /unread-count, PATCH /:id/read, POST /read-all
    │   ├── upload.js            POST /image (multer → /uploads, returns relative URL)
    │   ├── owner.js             GET/POST/PATCH/DELETE /menu (+ image), GET /orders, GET /riders, PATCH /orders/:id/status (needs riderId), PATCH /orders/:id/rider
    │   ├── rider.js             GET /deliveries, GET /my-deliveries, GET /earnings,
    │   │                        PATCH /orders/:id/accept, PATCH /orders/:id/reject,
    │   │                        PATCH /orders/:id/status, PATCH /location
    │   └── admin.js             GET /users, GET /restaurants, POST/PATCH/DELETE /restaurants
    └── utils/
        ├── statusFlow.js        Role-based status transition validation
        ├── mailer.js            sendVerificationEmail + sendPasswordResetEmail (dev: print links to console)
        ├── notify.js            createNotification, notifyRestaurantOwner, notifyCustomer
        ├── urls.js              legacyUrlRewriteMiddleware rewrites stale localhost:5000 URLs to APP_URL
        └── errors.js            Consistent error response helpers
  prisma/
    ├── schema.prisma            11 models (MenuItem category + image, User email verification, PasswordResetToken, Notification)
    ├── seed.js                  Seeds 4 users (emailVerified: true), 7 restaurants (including Nepali), 26 menu items with categories
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
│   ├── AuthContext.jsx           User state, login/register/logout/verifyEmail/resendVerification/forgotPassword/resetPassword via real API. Emails trimmed + lowercased.
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
│   └── RoleRoute.jsx             Role gate.
├── data/
│   └── mock.js                   Backup mock data with Kathmandu coordinates.
├── pages/
│   ├── Login.jsx                 Email/username + password with inline validation + toast on error. Redirects by role after login. Shows "verify email" banner on EMAIL_NOT_VERIFIED.
│   ├── Register.jsx              Name (first/middle/last) + email/password with inline validation. On success → /verify-email.
│   ├── VerifyEmail.jsx           Consumes GET /auth/verify-email?token=, resend link UI.
│   ├── ForgotPassword.jsx        Email/username form → POST /auth/forgot-password; shows generic success + devLink (dev only).
│   ├── ResetPassword.jsx         Reads ?token=, new password + confirm with strength check → POST /auth/reset-password; invalid/missing token shows an inline warning.
│   ├── Home.jsx                  Map showing all 7 restaurants + search by name/cuisine + cuisine filter chips (incl. Nepali) + sort.
│   ├── Restaurant.jsx            Map showing restaurant location + menu items (with images) from API.
│   ├── Cart.jsx                  Cart items with qty +/-/remove + total + empty state + delivery-location map picker → proceeds to checkout.
│   ├── Checkout.jsx              Phone + address + map picker (prefilled from cart location) + inline validation. Sends delivery coords to API.
│   ├── OrderTracking.jsx         5-step progress bar + map + real rider coords marker (when provided) + phone display; polls every 15s, paused when the tab is hidden, refetches on focus.
│   ├── owner/
│   │   └── Dashboard.jsx         3-tab: Orders (accept with rider-select modal + decline + assign-rider dropdown, audio), Menu (category-grouped + add/edit), Settings.
│   ├── rider/
│   │   └── Dashboard.jsx         3-tab: Available (accept/pass, mini map), My Deliveries (status advance, live map), Earnings (daily/weekly/all-time).
│   └── admin/
│       └── Panel.jsx             Restaurant CRUD only.
├── App.jsx                       Route definitions (login, register, verify-email, forgot-password, reset-password + protected routes).
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
│   │   ├── auth.js               POST /api/auth/register, POST /api/auth/login, GET /api/auth/verify-email?token=, POST /api/auth/resend-verification, POST /api/auth/forgot-password, POST /api/auth/reset-password, GET /api/auth/me
│   │   ├── restaurants.js        GET /api/restaurants, GET /api/restaurants/:id/menu
│   │   ├── orders.js             POST /api/orders (accepts phone), GET /api/orders, GET /api/orders/tracking/:id, PATCH /api/orders/:id/status
│   │   │                         PATCH status is restricted to owner/rider/admin and verified against restaurant ownership (owner) or the assigned rider
│   │   ├── cart.js               GET /api/cart, POST /api/cart/sync, POST /api/cart/add, DELETE /api/cart/:id
│   │   ├── notifications.js      GET /api/notifications, GET /api/notifications/unread-count, PATCH /api/notifications/:id/read, POST /api/notifications/read-all
│   │   ├── upload.js             POST /api/upload/image (multipart, max 5MB, jpeg/png/gif/webp) → { url: '/uploads/...' }
│   │   ├── owner.js              GET /api/owner/restaurant, PATCH /api/owner/restaurant, GET /api/owner/orders, GET /api/owner/riders, PATCH /api/owner/orders/:id/status (needs riderId to Confirm), PATCH /api/owner/orders/:id/rider, /api/owner/menu CRUD (+ image)
│   │   ├── rider.js              GET /api/rider/deliveries, GET /api/rider/my-deliveries, GET /api/rider/earnings, PATCH /api/rider/orders/:id/(accept|reject|status), PATCH /api/rider/location
│   │   └── admin.js              GET /api/admin/users, GET/POST/PATCH/DELETE /api/admin/restaurants
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

11 models: User, Restaurant, MenuItem, Order, OrderItem, Payment, Delivery, Rating, Notification, PasswordResetToken.

Key coordinate fields (for map feature):

- `Restaurant.latitude` / `Restaurant.longitude`
- `Order.deliveryLatitude` / `Order.deliveryLongitude`
- `Delivery.riderLatitude` / `Delivery.riderLongitude` / `Delivery.locationUpdatedAt`

Key contact field:

- `Order.phone` — Customer phone number for delivery contact

Email verification fields:

- `User.emailVerified` / `User.verificationToken` / `User.verificationExpires`

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
| POST   | `/api/auth/login`               | `{ login, password }`       | `{ token, user }` or `403 { code: 'EMAIL_NOT_VERIFIED', email }`                           |
| GET    | `/api/auth/verify-email?token=` | —                           | `{ message }` (marks email verified)                                                       |
| POST   | `/api/auth/resend-verification` | `{ login }`                 | `{ message, devLink? }`                                                                    |
| POST   | `/api/auth/forgot-password`     | `{ login }`                 | `{ message, devLink? }` (generic message — no email enumeration)                           |
| POST   | `/api/auth/reset-password`      | `{ token, password }`       | `{ message }` (single-use, 30-min expiry, resets lockout)                                  |
| GET    | `/api/auth/me`                  | —                           | `{ user }`                                                                                 |

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

| Method | Endpoint                       | Body                                          | Response                                                               |
| ------ | ------------------------------ | --------------------------------------------- | ---------------------------------------------------------------------- |
| GET    | `/api/owner/restaurant`        | —                                             | `Restaurant`                                                           |
| PATCH  | `/api/owner/restaurant`        | restaurant fields                             | `Restaurant`                                                           |
| GET    | `/api/owner/orders`            | —                                             | `[ Order ]`                                                            |
| PATCH  | `/api/owner/orders/:id/status` | `{ status, riderId? }`                        | `Order` — `riderId` is **required** to confirm (`Pending → Confirmed`) |
| PATCH  | `/api/owner/orders/:id/rider`  | `{ riderId }`                                 | `Order` — (re)assign a rider to a non-terminal order                   |
| GET    | `/api/owner/riders`            | —                                             | `[ { id, name, email } ]` — rider accounts for assignment              |
| GET    | `/api/owner/menu`              | —                                             | `[ MenuItem ]`                                                         |
| POST   | `/api/owner/menu`              | `{ name, price, category?, desc?, image? }`   | `MenuItem`                                                             |
| PATCH  | `/api/owner/menu/:id`          | `{ name?, price?, category?, desc?, image? }` | `MenuItem`                                                             |
| DELETE | `/api/owner/menu/:id`          | —                                             | `{ message }`                                                          |

### Rider

| Method | Endpoint                       | Body                      | Response                                                                                     |
| ------ | ------------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| GET    | `/api/rider/deliveries`        | —                         | `[ Order ]` (available for pickup)                                                           |
| GET    | `/api/rider/my-deliveries`     | —                         | `[ Order ]` (rider's accepted deliveries)                                                    |
| GET    | `/api/rider/earnings`          | —                         | `{ totalEarnings, totalDeliveries, dailyEarnings, dailyCount, weeklyEarnings, weeklyCount }` |
| PATCH  | `/api/rider/orders/:id/accept` | —                         | `Order` (assigns rider, status→Out for Delivery)                                             |
| PATCH  | `/api/rider/orders/:id/reject` | —                         | `{ message }` (returns to pending)                                                           |
| PATCH  | `/api/rider/orders/:id/status` | `{ status }`              | `Order`                                                                                      |
| PATCH  | `/api/rider/location`          | `{ latitude, longitude }` | `Delivery`                                                                                   |

### Admin

| Method | Endpoint                     | Body              | Response         |
| ------ | ---------------------------- | ----------------- | ---------------- |
| GET    | `/api/admin/users`           | —                 | `[ User ]`       |
| GET    | `/api/admin/restaurants`     | —                 | `[ Restaurant ]` |
| POST   | `/api/admin/restaurants`     | restaurant fields | `Restaurant`     |
| PATCH  | `/api/admin/restaurants/:id` | restaurant fields | `Restaurant`     |
| DELETE | `/api/admin/restaurants/:id` | —                 | `{ message }`    |

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
- **Placeholder URLs** — Each of the 6 restaurants has a `placehold.co` URL in seed data.
- **Display** — Thumbnail image shown on Home cards and Restaurant detail page.

### Cuisine-Based Menu Categories

When a restaurant owner edits their menu, the available categories auto-filter based on the restaurant's cuisine type. These are defined in `CUISINE_CATEGORIES` in `src/data/mock.js`:

| Cuisine  | Categories                                       |
| -------- | ------------------------------------------------ |
| Italian  | Pizza, Pasta, Salad, Dessert, Beverage           |
| American | Burger, Sandwich, Fries, Beverage, Dessert       |
| Japanese | Sushi, Roll, Noodle, Appetizer, Dessert          |
| Mexican  | Taco, Quesadilla, Nachos, Burrito, Beverage      |
| Indian   | Curry, Bread, Rice, Appetizer, Dessert, Beverage |
| Chinese  | Noodle, Rice, Dumpling, Appetizer, Soup          |
| Nepali   | Momo, Curry, Rice, Dal Bhat, Appetizer, Beverage |

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

- **Email verification optimization** - Registration now includes verification token in response, eliminating the need for double-send. Users are automatically redirected with the token for immediate verification.
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

| ID    | User story                                                                                                 | Priority | Status             |
| ----- | ---------------------------------------------------------------------------------------------------------- | -------- | ------------------ |
| US-01 | As a customer, I want to enter my delivery location on the Cart page so that I can go straight to checkout | High     | ✅ Done (Sprint 6) |
| US-02 | As a new user, I want to verify my email before logging in so that my account is secure                    | High     | ✅ Done (Sprint 6) |
| US-03 | As a customer, I want a notification when the restaurant accepts or rejects my order                       | High     | ✅ Done (Sprint 6) |
| US-04 | As an owner, I want to upload images for my restaurant and menu items                                      | High     | ✅ Done (Sprint 6) |
| US-05 | As a customer, I want the order tracker to update live so that I don't have to refresh                     | High     | 🆕 Backlog         |
| US-06 | As a customer, I want a 3-step checkout wizard with live validation                                        | Medium   | 🆕 Backlog         |
| US-07 | As a user, I want dark mode and reduced-motion support                                                     | Medium   | 🆕 Backlog         |
| US-08 | As an owner, I want to manage restaurant linking to my account                                             | Low      | 🆕 Backlog         |
| US-09 | As a user who forgot my password, I want to reset it via email so that I can get back into my account      | High     | ✅ Done (Sprint 9) |
| US-10 | As an owner, I want to assign a specific rider to each order so that deliveries are dispatched             | High     | ✅ Done (Sprint 9) |

### Sprint History

| Sprint | Goal                   | Delivered                                                                                                                                                                                                                                      |
| ------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1      | Foundation             | Express + Prisma + MySQL API, JWT httpOnly auth, CORS, CSRF                                                                                                                                                                                    |
| 2      | Discovery              | Home page with map, search, cuisine filters, sort, pagination                                                                                                                                                                                  |
| 3      | Ordering               | Restaurant/menu pages, cart (localStorage), mock payment checkout                                                                                                                                                                              |
| 4      | Fulfillment            | Role dashboards: owner (orders/menu/settings), rider (deliveries/earnings), admin CRUD                                                                                                                                                         |
| 5      | Reliability            | Security checklist, account lockout, rate limits, accessibility audit, category/subcategory menu system, docs                                                                                                                                  |
| 6      | Engagement (current)   | **Delivery location → checkout (US-01), email verification (US-02), in-app + browser notifications (US-03), image uploads (US-04)**                                                                                                            |
| 7      | Polish (planned)       | Tracking polling, checkout wizard, dark mode, performance/lazy routes                                                                                                                                                                          |
| 8      | Hardening (bug fixes)  | Visibility-aware order tracking polling, real rider coords (no simulated rider), error surfacing (Home retry, Checkout toast, OSRM route note), debounced restaurant search, dismissible + capped toasts                                       |
| 9      | Auth + dispatch (done) | Password reset via email (forgot-password/reset-password, single-use hashed 30-min tokens), owner-driven rider dispatch (rider list + per-order assignment), Vite proxy to backend, relative upload URLs, 401 redirect guard, EADDRINUSE guard |

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
| Pages                 | Route-level views / screens                   | `Login`, `Register`, `VerifyEmail`, `Home`, `Cart`, `Checkout`, `owner/Dashboard`, `rider/Dashboard`, `admin/Panel` |
| Reusable components   | Shared building blocks used by many pages     | `Navbar`, `MapView`, `ImageUpload`, `LoadingSkeleton`, `EmptyState`, `ErrorBoundary`                                |
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
               ├─ /                 → ProtectedRoute → Home
               ├─ /restaurant/:id   → ProtectedRoute → Restaurant
               ├─ /cart             → RoleRoute(customer) → Cart → MapView
               ├─ /checkout         → RoleRoute(customer) → Checkout → MapView
               ├─ /orders           → RoleRoute(customer) → OrderTracking
               ├─ /owner            → RoleRoute(owner|rider)  → owner/Dashboard → ImageUpload, CardSkeleton
               ├─ /owner/menu       → RoleRoute(owner|rider)  → owner/MenuManagement → ImageUpload
               ├─ /owner/orders     → RoleRoute(owner|rider)  → owner/Orders
               └─ /admin            → RoleRoute(admin)  → admin/Panel
```

### Components needed: signup → login → dashboard

1. **`Register.jsx`** — form + validation + password strength meter; on success calls `register()`, then `navigate('/verify-email?email=...')` (no auto-login).
2. **`VerifyEmail.jsx`** — reads `?token`, calls `AuthContext.verifyEmail(token)`, redirects to `/login`.
3. **`Login.jsx`** — calls `AuthContext.login()`; on success routes by role: `roleRoutes = { rider: '/owner', owner: '/owner', admin: '/admin' }` → `navigate(roleRoutes[u.role] || '/')` (customers land on Home).
4. **Route guard `RoleRoute`** — reads `AuthContext.user`; unauthenticated → `/login`, wrong role → `/`. Passes through when role matches.
5. **Dashboard pages** — compose reusable components + context: e.g. `owner/Dashboard` uses `ImageUpload` (restaurant image), `CardSkeleton` (loading), `ToastContext` (feedback), `AuthContext` (identity); `Navbar` renders the notification bell backed by `NotificationContext`.
