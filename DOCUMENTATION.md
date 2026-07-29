# SmartServe — Full-Stack Documentation

## Project Overview

SmartServe is a food ordering platform with four user roles: **Customer**, **Restaurant Owner**, **Rider**, and **Admin**. The frontend is built with React 19 + Vite 8, and the backend is an Express + Prisma + SQLite API.

### Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 19 | UI components |
| Build tool | Vite 8 | Dev server + bundler |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| Routing | React Router DOM 7 | Client-side navigation |
| HTTP | Axios | API calls to backend |
| Maps | Leaflet + react-leaflet | Free map tiles via OpenStreetMap |
| Lint | ESLint | React hooks + react-refresh rules |
| Test (FE) | Vitest + Testing Library | Unit tests for utils, mock data, routes |
| E2E (FE) | Playwright | Browser-level login flow tests (setup only) |
| Backend | Express 5 | REST API server |
| ORM | Prisma 7 | Database schema + migrations |
| Database | SQLite | Zero-config file-based DB |
| Auth | bcrypt + JWT | Password hashing + token auth |
| Test (BE) | Vitest | Backend route tests |

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
                    │         └─ Navbar (hamburger menu, cart badge, responsive)
                    │         └─ <Routes>
                   │              ├─ /login -> Login
                   │              ├─ /register -> Register
                   │              ├─ / -> ProtectedRoute -> Home (map + filters + sort)
                   │              ├─ /restaurant/:id -> ProtectedRoute -> Restaurant (map)
                   │              ├─ /cart -> RoleRoute(customer) -> Cart
                   │              ├─ /checkout -> RoleRoute(customer) -> Checkout (+ map + phone)
                   │              ├─ /orders -> RoleRoute(customer) -> OrderTracking (+ map)
                   │              ├─ /owner -> RoleRoute(owner) -> OwnerDashboard
                   │              ├─ /owner/menu -> RoleRoute(owner) -> OwnerMenu
                   │              ├─ /owner/orders -> RoleRoute(owner) -> OwnerOrders
                   │              ├─ /rider -> RoleRoute(rider) -> RiderDashboard (+ map + geolocation)
                   │              └─ /admin -> RoleRoute(admin) -> AdminPanel

server/ (port 5000)
  src/
    ├── index.js                 Express app entry
    ├── config/
    │   ├── env.js               PORT, JWT_SECRET, JWT_EXPIRES_IN
    │   └── database.js          PrismaClient singleton with SQLite adapter
    ├── middleware/
    │   ├── auth.js              authenticate (JWT verify) + authorize (role check)
    │   └── validate.js          validate() / validateOptional() field checkers
    ├── routes/
    │   ├── auth.js              POST /register (email normalized), POST /login (email normalized), GET /me
    │   ├── restaurants.js       GET /, GET /:id/menu
    │   ├── orders.js            POST / (accepts phone), GET /, GET /tracking/:id, PATCH /:id/status
    │   ├── owner.js             GET /orders, GET /menu, POST /menu, PATCH /menu/:id, DELETE /menu/:id
    │   ├── rider.js             GET /deliveries, PATCH /location
    │   └── admin.js             GET /stats, GET /users, GET /restaurants
    └── utils/
        ├── statusFlow.js        Role-based status transition validation
        └── errors.js            Consistent error response helpers
  prisma/
    ├── schema.prisma            9 models (Order includes phone field)
    ├── seed.js                  Seeds 4 users, 6 restaurants (Kathmandu coords), 18 menu items
    ├── reset.js                 Refuses if server port 5000 in use, then deletes dev.db, re-runs migrations, re-seeds
    └── migrations/              SQLite migration files
```

### Route Guards

- **ProtectedRoute** — redirects to `/login` if no user in context. Saves intended path.
- **RoleRoute** — accepts `roles` array. Redirects to `/login` if no user, or `/` if wrong role.

---

## File Map (Frontend)

```
src/
├── api/
│   └── client.js                Axios -> VITE_API_URL (default localhost:5000/api). 401 clears auth + redirects.
├── context/
│   ├── AuthContext.jsx           User state, login/register/logout via real API. Emails trimmed + lowercased.
│   └── ToastContext.jsx          Toast notification system. Auto-dismiss after 3s.
├── utils/
│   ├── storage.js                Safe readJson/writeJson/removeKeys.
│   └── leafletIcon.js            Fixes Leaflet default marker icon for Vite.
├── services/
│   └── orders.js                 Async API calls + cart (localStorage with cart-update event) + status flow constants.
├── components/
│   ├── EmptyState.jsx            Reusable: icon + title + message + optional action.
│   ├── ErrorBoundary.jsx         Catches render errors, shows reload button.
│   ├── LoadingSkeleton.jsx       CardSkeleton + ListSkeleton with pulse animation.
│   ├── MapView.jsx               Leaflet map: multi-restaurant markers with popups OR single restaurant/delivery/rider + OSRM road route.
│   ├── Navbar.jsx                Brand link + role-aware nav links + cart badge + user name + logout + hamburger menu.
│   ├── ProtectedRoute.jsx        Auth gate.
│   └── RoleRoute.jsx             Role gate.
├── data/
│   └── mock.js                   Backup mock data with Kathmandu coordinates.
├── pages/
│   ├── Login.jsx                 Email/password with inline validation + toast on error.
│   ├── Register.jsx              Name/email/password with inline validation.
│   ├── Home.jsx                  Map showing all 6 restaurants + search by name/cuisine + cuisine filter chips + sort (Top Rated / Fastest Delivery / Open Now).
│   ├── Restaurant.jsx            Map showing restaurant location + menu items from API.
│   ├── Cart.jsx                  Cart items with qty +/-/remove + total + empty state. LocalStorage.
│   ├── Checkout.jsx              Phone + address + map picker + inline validation (red borders + error text). Sends delivery coords to API.
│   ├── OrderTracking.jsx         5-step progress bar + map with markers + simulated rider + phone display.
│   ├── owner/
│   │   ├── Dashboard.jsx         3 stats cards + pending list from API.
│   │   ├── MenuManagement.jsx    List/add/delete menu items via API.
│   │   └── Orders.jsx            Status flow with Accept/Reject buttons + phone display.
│   ├── rider/
│   │   └── Dashboard.jsx         Available deliveries from API + geolocation button + per-order map + phone display.
│   └── admin/
│       └── Panel.jsx             4 stat cards + users table + restaurants grid from API.
├── App.jsx                       Route definitions.
├── main.jsx                      ReactDOM.createRoot + BrowserRouter + Leaflet CSS.
├── e2e/
│   └── login.spec.js             Playwright: customer login flow + wrong-password error.
├── playwright.config.js          Playwright config (baseURL localhost:5173, headless).
└── index.css                     @import "tailwindcss", Inter font, brand CSS vars, hover-lift animation
```

---

## File Map (Backend)

```
server/
├── src/
│   ├── index.js                  Express app, CORS, JSON parsing, mounts all routes.
│   ├── config/
│   │   ├── env.js                Reads PORT, JWT_SECRET, JWT_EXPIRES_IN from env.
│   │   └── database.js           PrismaClient with better-sqlite3 adapter.
│   ├── middleware/
│   │   ├── auth.js               authenticate (JWT verify via Authorization header) + authorize (role check).
│   │   └── validate.js           validate() / validateOptional() field checkers.
│   ├── routes/
│   │   ├── auth.js               POST /api/auth/register (email normalized), POST /api/auth/login (email normalized), GET /api/auth/me
│   │   ├── restaurants.js        GET /api/restaurants, GET /api/restaurants/:id/menu
│   │   ├── orders.js             POST /api/orders (accepts phone), GET /api/orders, GET /api/orders/tracking/:id, PATCH /api/orders/:id/status
│   │   ├── owner.js              GET /api/owner/orders, GET/POST/PATCH/DELETE /api/owner/menu
│   │   ├── rider.js              GET /api/rider/deliveries, PATCH /api/rider/location
│   │   └── admin.js              GET /api/admin/stats, GET /api/admin/users, GET /api/admin/restaurants
│   └── utils/
│       ├── statusFlow.js         FLOWS per role, getNextStatus, isValidTransition, TERMINAL_STATUSES
│       └── errors.js             error, badRequest, unauthorized, forbidden, notFound, conflict, serverError
├── prisma/
│   ├── schema.prisma             9 models (Order.phone added)
│   ├── seed.js                   Seeds demo data (Kathmandu coords)
│   ├── reset.js                  Port-5000 guard, then deletes dev.db, re-runs migrations, re-seeds
│   └── migrations/               Auto-generated by prisma migrate
├── prisma.config.ts              Prisma 7 config
├── .env                          DATABASE_URL, JWT_SECRET, PORT=5000
└── package.json
```

---

## Prisma Schema

9 models: User, Restaurant, MenuItem, Order, OrderItem, Payment, Delivery, Rating.

Key coordinate fields (for map feature):
- `Restaurant.latitude` / `Restaurant.longitude`
- `Order.deliveryLatitude` / `Order.deliveryLongitude`
- `Delivery.riderLatitude` / `Delivery.riderLongitude` / `Delivery.locationUpdatedAt`

Key contact field:
- `Order.phone` — Customer phone number for delivery contact

---

## Seed Data

**Users (all passwords: `password`):**

| Name | Email | Role | Notes |
|---|---|---|---|
| John Doe | john@test.com | customer | Default customer |
| Pizza Palace | owner@test.com | owner | Linked to restaurant ID 1 |
| Rider Ram | rider@test.com | rider | Can update delivery status |
| Admin User | admin@test.com | admin | Full system overview |

**Restaurants:** 6 restaurants with Kathmandu-area coordinates, each with 3 menu items. Taco Town (ID 4) is `isOpen: false`. Each has a placeholder image via `placehold.co`.

| Restaurant | Cuisine | Location (lat, lng) | Image |
|---|---|---|---|
| Pizza Palace | Italian | 27.7150, 85.3120 (Thamel) | ✅ |
| Burger Barn | American | 27.7040, 85.3070 (Durbar Square) | ✅ |
| Sushi Spot | Japanese | 27.6710, 85.3260 (Patan) | ✅ |
| Taco Town | Mexican | 27.7210, 85.3620 (Boudhanath) | ✅ |
| Curry House | Indian | 27.7100, 85.3480 (Pashupatinath) | ✅ |
| Noodle Nest | Chinese | 27.6720, 85.4280 (Bhaktapur) | ✅ |

---

## Order Status Flow

Roles progress through these statuses (one step at a time):

| Role | Flow |
|---|---|
| Customer | Pending → Confirmed → Preparing → Out for Delivery → Delivered |
| Owner | Pending → Confirmed → Preparing → Ready for Pickup |
| Rider | Ready for Pickup → Out for Delivery → Delivered |

Terminal statuses (cannot transition out): Delivered, Cancelled, Rejected.

---

## API Contract

All endpoints require `Authorization: Bearer <token>` header except auth routes.

### Auth

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` |
| GET | `/api/auth/me` | — | `{ user }` |

Emails are normalized (trimmed + lowercased) on register and login.

### Restaurants

| Method | Endpoint | Response |
|---|---|---|
| GET | `/api/restaurants` | `[ Restaurant ]` |
| GET | `/api/restaurants/:id/menu` | `{ restaurant, items }` |

### Orders

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/api/orders` | `{ items: [{ menuItemId, restaurantId, quantity }], address, phone?, paymentMethod, deliveryLatitude?, deliveryLongitude? }` | `Order` |
| GET | `/api/orders` | — | `[ Order ]` |
| GET | `/api/orders/tracking/:id` | — | `Order` with restaurant/delivery coords |
| PATCH | `/api/orders/:id/status` | `{ status }` | `Order` |

### Owner

| Method | Endpoint | Body | Response |
|---|---|---|---|
| GET | `/api/owner/orders` | — | `[ Order ]` |
| GET | `/api/owner/menu` | — | `[ MenuItem ]` |
| POST | `/api/owner/menu` | `{ name, price, desc? }` | `MenuItem` |
| PATCH | `/api/owner/menu/:id` | `{ name?, price?, desc? }` | `MenuItem` |
| DELETE | `/api/owner/menu/:id` | — | `{ message }` |

### Rider

| Method | Endpoint | Body | Response |
|---|---|---|---|
| GET | `/api/rider/deliveries` | — | `[ Order ]` |
| PATCH | `/api/rider/location` | `{ latitude, longitude }` | `Delivery` |

### Admin

| Method | Endpoint | Response |
|---|---|---|
| GET | `/api/admin/stats` | `{ users, restaurants, orders, revenue }` |
| GET | `/api/admin/users` | `[ User ]` |
| GET | `/api/admin/restaurants` | `[ Restaurant ]` |

---

## Key Frontend Features

### Home Page
- **Map** — Leaflet/OSM map showing all 6 restaurants as orange **R** markers at their Kathmandu locations. Click marker for popup with name + cuisine.
- **Search** — Text filter by restaurant name or cuisine.
- **Cuisine chips** — All / Italian / American / Japanese / Mexican / Indian / Chinese buttons.
- **Sort** — Top Rated, Fastest Delivery, Open Now.
- **Location label** — "Delivering to Kathmandu, Nepal".

### Checkout
- **Phone number** — Required field with format validation (7-15 digits).
- **Inline validation** — Red borders + error messages for missing address, phone, map location, or closed restaurant.
- **Cart badge** — Navbar shows live item count via `cart-update` custom event.

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

### OSRM Road Routing
- **RoadRoute component** — Fetches driving route geometry from the public OSRM API (`router.project-osrm.org`).
- **Real polyline** — Replaces the previous straight-line polyline with the actual road path.
- **Fallback** — If the OSRM fetch fails, no route is drawn (silent failure).

### Accessibility
- **`aria-label`** — Added to search input, cuisine filter chips (`aria-pressed`), login/register buttons, checkout actions, place-order, and "use current location" button.
- **`aria-expanded`** — Navbar hamburger menu communicates toggle state.

---

## Known Limitations

1. **SQLite (dev only)** — Not suitable for production concurrency. Switch to MySQL/PostgreSQL for deployment.
2. **Cart is localStorage** — Cart persists locally but doesn't sync across devices (no backend cart API).
3. **No real payment** — Payment is mocked. No Stripe/PayPal integration.
4. **No pagination** — All data loads at once.
5. **No image uploads** — Placeholder images from `placehold.co`, no file upload.
6. **Owner-restaurant linking** — Hardcoded via `ownerId`. No UI to manage this.
7. **Rider assignment** — No automatic rider assignment when order reaches Ready for Pickup.
8. **Accessibility** — Partial `aria-label` coverage; not fully WCAG-compliant.
9. **Test coverage** — 43 backend tests + 41 frontend tests + Playwright config (e2e/ directory) = 84 unit tests.

---

## Build & Run

### Backend

```bash
cd server
npm run dev          # Dev server with nodemon on port 5000
npm run test         # Vitest (43 tests)
npm run seed         # Re-run seed data
npm run reset        # Refuses if port 5000 in use, then delete dev.db, re-run migrations, re-seed
npm run migrate      # Run prisma migrate dev
```

### Frontend

```bash
npm run dev          # Vite dev server with HMR on port 5173
npm run build        # Production build -> dist/
npm run preview      # Preview production build
npm run lint         # ESLint check
npm run test         # Vitest (41 tests)
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

The frontend Axios client defaults to `http://localhost:5000/api`. Set `VITE_API_URL` in `.env` to override.