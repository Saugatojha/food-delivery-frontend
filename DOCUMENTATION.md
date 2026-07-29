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
                   │         └─ Navbar
                   │         └─ <Routes>
                   │              ├─ /login -> Login
                   │              ├─ /register -> Register
                   │              ├─ / -> ProtectedRoute -> Home
                   │              ├─ /restaurant/:id -> ProtectedRoute -> Restaurant
                   │              ├─ /cart -> RoleRoute(customer) -> Cart
                   │              ├─ /checkout -> RoleRoute(customer) -> Checkout (+ map)
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
    │   └── auth.js              authenticate (JWT verify) + authorize (role check)
    ├── routes/
    │   ├── auth.js              POST /register, POST /login, GET /me
    │   ├── restaurants.js       GET /, GET /:id/menu
    │   ├── orders.js            POST /, GET /, GET /tracking/:id, PATCH /:id/status
    │   ├── owner.js             GET /orders, GET /menu, POST /menu, PATCH /menu/:id, DELETE /menu/:id
    │   ├── rider.js             GET /deliveries, PATCH /location
    │   └── admin.js             GET /stats, GET /users, GET /restaurants
    └── utils/
        └── statusFlow.js        Role-based status transition validation
  prisma/
    ├── schema.prisma            9 models (User, Restaurant, MenuItem, Order, OrderItem, Payment, Delivery, Rating)
    ├── seed.js                  Seeds 4 users, 6 restaurants (with lat/lng), 18 menu items
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
│   ├── AuthContext.jsx           User state, login/register/logout via real API.
│   └── ToastContext.jsx          Toast notification system. Auto-dismiss after 3s.
├── utils/
│   ├── storage.js                Safe readJson/writeJson/removeKeys.
│   └── leafletIcon.js            Fixes Leaflet default marker icon for Vite.
├── services/
│   └── orders.js                 Async API calls for orders + cart (localStorage) + status flow constants.
├── components/
│   ├── EmptyState.jsx            Reusable: icon + title + message + optional action.
│   ├── ErrorBoundary.jsx         Catches render errors, shows reload button.
│   ├── LoadingSkeleton.jsx       CardSkeleton + ListSkeleton with pulse animation.
│   ├── MapView.jsx               Leaflet map: restaurant/delivery/rider markers, polyline route, click-to-select.
│   ├── Navbar.jsx                Brand link + role-aware nav links + user name + logout.
│   ├── ProtectedRoute.jsx        Auth gate.
│   └── RoleRoute.jsx             Role gate.
├── data/
│   └── mock.js                   Backup mock data (formatPrice, calcTotal, MOCK_RESTAURANTS with coordinates).
├── pages/
│   ├── Login.jsx                 Email/password form.
│   ├── Register.jsx              Name/email/password form.
│   ├── Home.jsx                  Restaurant grid from API. Closed restaurants greyed out.
│   ├── Restaurant.jsx            Menu items from API. "Add to Cart" per item.
│   ├── Cart.jsx                  Cart items with qty +/-/remove. Total. Empty state. LocalStorage.
│   ├── Checkout.jsx              Address + map picker + payment. Sends delivery coords to API.
│   ├── OrderTracking.jsx         5-step progress bar + map with markers + simulated rider.
│   ├── owner/
│   │   ├── Dashboard.jsx         3 stats cards + pending list from API.
│   │   ├── MenuManagement.jsx    List/add/delete menu items via API.
│   │   └── Orders.jsx            Status flow via API with transition validation.
│   ├── rider/
│   │   └── Dashboard.jsx         Available deliveries from API + geolocation button + per-order map.
│   └── admin/
│       └── Panel.jsx             4 stat cards + users table + restaurants grid from API.
├── App.jsx                       Route definitions.
├── main.jsx                      ReactDOM.createRoot + BrowserRouter + Leaflet CSS.
└── index.css                     @import "tailwindcss"
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
│   │   └── auth.js               authenticate (JWT verify via Authorization header) + authorize (role check).
│   ├── routes/
│   │   ├── auth.js               POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
│   │   ├── restaurants.js        GET /api/restaurants, GET /api/restaurants/:id/menu
│   │   ├── orders.js             POST /api/orders, GET /api/orders, GET /api/orders/tracking/:id, PATCH /api/orders/:id/status
│   │   ├── owner.js              GET /api/owner/orders, GET/POST/PATCH/DELETE /api/owner/menu
│   │   ├── rider.js              GET /api/rider/deliveries, PATCH /api/rider/location
│   │   └── admin.js              GET /api/admin/stats, GET /api/admin/users, GET /api/admin/restaurants
│   └── utils/
│       └── statusFlow.js         FLOWS per role, getNextStatus, isValidTransition, TERMINAL_STATUSES
├── prisma/
│   ├── schema.prisma             9 models
│   ├── seed.js                   Seeds demo data
│   └── migrations/               Auto-generated by prisma migrate
├── prisma.config.ts              Prisma 7 config (schema path, seed command, datasource URL)
├── .env                          DATABASE_URL, JWT_SECRET, PORT
└── package.json
```

---

## Prisma Schema

9 models: User, Restaurant, MenuItem, Order, OrderItem, Payment, Delivery, Rating.

Key coordinate fields (for map feature):
- `Restaurant.latitude` / `Restaurant.longitude`
- `Order.deliveryLatitude` / `Order.deliveryLongitude`
- `Delivery.riderLatitude` / `Delivery.riderLongitude` / `Delivery.locationUpdatedAt`

---

## Seed Data

**Users (all passwords: `password`):**

| Name | Email | Role | Notes |
|---|---|---|---|
| John Doe | john@test.com | customer | Default customer |
| Pizza Palace | owner@test.com | owner | Linked to restaurant ID 1 |
| Rider Ram | rider@test.com | rider | Can update delivery status |
| Admin User | admin@test.com | admin | Full system overview |

**Restaurants:** 6 restaurants with Bengaluru-area coordinates, each with 3 menu items. Taco Town (ID 4) is `isOpen: false`.

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

### Restaurants

| Method | Endpoint | Response |
|---|---|---|
| GET | `/api/restaurants` | `[ Restaurant ]` |
| GET | `/api/restaurants/:id/menu` | `{ restaurant, items }` |

### Orders

| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/api/orders` | `{ items: [{ menuItemId, restaurantId, quantity }], address, paymentMethod, deliveryLatitude?, deliveryLongitude? }` | `Order` |
| GET | `/api/orders` | — | `[ Order ]` |
| GET | `/api/orders/tracking/:id` | — | `Order` with restaurant/ delivery coords |
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

## Known Limitations

1. **SQLite (dev only)** — Not suitable for production concurrency. Switch to MySQL/PostgreSQL for deployment.
2. **Cart is localStorage** — Cart persists locally but doesn't sync across devices.
3. **No real payment** — Payment is mocked. No Stripe/PayPal integration.
4. **No real routing** — Map polyline is a straight line, not a road route.
5. **No search/filter** — No search bar, cuisine filter, or sort on restaurant list.
6. **No pagination** — All data loads at once.
7. **No image uploads** — Text-based placeholders.
8. **Form validation** — Minimal. No email format or password strength checks.
9. **Owner-restaurant linking** — Hardcoded via `ownerId`. No UI to manage this.
10. **Test coverage** — 41 frontend tests. No backend tests yet.

---

## Build & Run

### Backend

```bash
cd server
npm run dev          # Dev server with nodemon on port 5000
```

### Frontend

```bash
npm run dev          # Vite dev server with HMR on port 5173
npm run build        # Production build -> dist/
npm run preview      # Preview production build
npm run lint         # ESLint check
npm run test         # Vitest (41 tests)
```

### Full Stack

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
npm run dev
```

The frontend Axios client defaults to `http://localhost:5000/api`. Set `VITE_API_URL` in `.env` to override.
