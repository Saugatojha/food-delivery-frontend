# SmartServe — Frontend Documentation

## Project Overview

SmartServe is a food ordering platform prototype with four user roles: **Customer**, **Restaurant Owner**, **Rider**, and **Admin**. This is the **frontend-only** build. No backend exists yet.

### Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | React 19 | UI components |
| Build tool | Vite 8 | Dev server + bundler |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| Routing | React Router DOM 7 | Client-side navigation |
| HTTP | Axios | API calls (configured, not connected) |
| Lint | ESLint | React hooks + react-refresh rules |
| Test | Vitest + Testing Library | Unit tests for utils, mock data, routes |
| Auth | None (mock) | JWT-like flow mocked in memory/localStorage |

---

## Architecture

```
index.html
  └─ src/main.jsx  (entry point)
       └─ BrowserRouter
            └─ App.jsx
                 ├─ ErrorBoundary (catches crashes)
                 ├─ AuthProvider (user state)
                 │    └─ ToastProvider (notifications)
                 │         └─ Navbar (role-aware nav links)
                 │         └─ <Routes>
                 │              ├─ /login -> Login
                 │              ├─ /register -> Register
                 │              ├─ / -> ProtectedRoute -> Home
                 │              ├─ /restaurant/:id -> ProtectedRoute -> Restaurant
                 │              ├─ /cart -> RoleRoute(customer) -> Cart
                 │              ├─ /checkout -> RoleRoute(customer) -> Checkout
                 │              ├─ /orders -> RoleRoute(customer) -> OrderTracking
                 │              ├─ /owner -> RoleRoute(owner) -> OwnerDashboard
                 │              ├─ /owner/menu -> RoleRoute(owner) -> OwnerMenu
                 │              ├─ /owner/orders -> RoleRoute(owner) -> OwnerOrders
                 │              ├─ /rider -> RoleRoute(rider) -> RiderDashboard
                 │              └─ /admin -> RoleRoute(admin) -> AdminPanel
```

### Route Guards

- **ProtectedRoute** — redirects to `/login` if no user in context. Saves intended path so user is sent back after login.
- **RoleRoute** — accepts `roles` array. Redirects to `/login` if no user, or `/` if user's role isn't in the array.

---

## File Map

```
src/
├── api/
│   └── client.js           Axios -> VITE_API_URL || localhost:5000/api. 401 clears auth + redirects.
│
├── context/
│   ├── AuthContext.jsx      User state, login/register/logout. Uses storage utility.
│   └── ToastContext.jsx     Toast notification system. Auto-dismiss after 3s.
│
├── utils/
│   └── storage.js           Safe readJson/writeJson/removeKeys. Catches JSON.parse failures.
│
├── services/
│   └── orders.js            Shared order/cart operations. Status flow constants + validation.
│
├── components/
│   ├── EmptyState.jsx       Reusable: icon + title + message + optional action button.
│   ├── ErrorBoundary.jsx    Class component. Catches render errors, shows reload button.
│   ├── LoadingSkeleton.jsx  CardSkeleton + ListSkeleton with pulse animation.
│   ├── Navbar.jsx           Brand link + role-aware nav links + user name + logout.
│   ├── ProtectedRoute.jsx   Auth gate — redirects to /login.
│   └── RoleRoute.jsx        Role gate — checks user.role against roles[] array.
│
├── data/
│   └── mock.js              All mock data + utility functions. Single source of truth.
│
├── pages/
│   ├── Login.jsx            Email/password form. Shows test account credentials. Toast feedback.
│   ├── Register.jsx         Name/email/password form. Toast feedback.
│   ├── Home.jsx             Restaurant grid. Closed restaurants greyed out + labeled.
│   ├── Restaurant.jsx       Menu items for one restaurant. "Add to Cart" per item. Uses storage utility.
│   ├── Cart.jsx             Cart items with qty +/-/remove. Total. Empty state. Uses storage utility.
│   ├── Checkout.jsx         Address + payment. Uses <Navigate> for empty cart. Uses orders service.
│   ├── OrderTracking.jsx    5-step progress bar. Uses orders service.
│   ├── owner/
│   │   ├── Dashboard.jsx    3 stats cards + pending list. Uses orders service.
│   │   ├── MenuManagement.jsx List items + inline add form.
│   │   └── Orders.jsx       Status flow via shared orders service with transition validation.
│   ├── rider/
│   │   └── Dashboard.jsx    Delivery flow via shared orders service with transition validation.
│   └── admin/
│       └── Panel.jsx        4 stat cards + users table + restaurants grid. Uses orders service.
│
├── App.jsx                  Route definitions. RoleRoute checks per role.
├── main.jsx                 ReactDOM.createRoot + BrowserRouter.
└── index.css                @import "tailwindcss"
```

---

## Mock Data

All mock data lives in `src/data/mock.js`.

**Users (preseeded):**

| Name | Email | Password | Role | Notes |
|---|---|---|---|---|
| John Doe | john@test.com | password | customer | Default customer |
| Pizza Palace | owner@test.com | password | owner | Linked to restaurant ID 1 |
| Rider Ram | rider@test.com | password | rider | Can update delivery status |
| Admin User | admin@test.com | password | admin | Full system overview |

**Restaurants:** 6 restaurants, each with 3 menu items. Taco Town (ID 4) is `isOpen: false` to test closed-state UI.

**Prices:** In NPR (Rs). Realistic values (Margherita Pizza Rs 169, Classic Burger Rs 130, etc.).

**Auth flow:** `mockLogin` and `mockRegister` are synchronous functions that simulate API behavior. New registrations push into the in-memory `MOCK_USERS` array (resets on refresh). Tokens are strings like `'mock-jwt-' + Date.now()` — not real JWTs.

**Cart + Orders:** Both stored in `localStorage` via `src/services/orders.js` and `src/utils/storage.js`.

---

## Data Flow Per Role

### Customer
1. Opens app -> redirected to `/login`
2. Logs in -> lands on `/` (restaurant list)
3. Clicks restaurant -> `/restaurant/:id` (menu) -> "Add to Cart"
4. `/cart` -> adjust qtys, see total
5. `/checkout` -> enter address, place order
6. `/orders` -> 5-step progress bar

### Owner
1. Logs in as `owner@test.com` -> navbar: Dashboard/Menu/Orders
2. `/owner` -> stats + pending orders
3. `/owner/menu` -> view/add items
4. `/owner/orders` -> advance through Pending -> Confirmed -> Preparing -> Ready for Pickup

### Rider
1. Logs in as `rider@test.com` -> navbar: Deliveries
2. `/rider` -> Ready for Pickup / Out for Delivery orders
3. "Pick Up" -> Out for Delivery -> "Mark Delivered"

### Admin
1. Logs in as `admin@test.com` -> navbar: Panel
2. `/admin` -> stats + users table + restaurant cards

---

## Key Changes from Review

| # | Issue | Fix |
|---|---|---|
| 1 | Raw `JSON.parse` crashes | `src/utils/storage.js` with try/catch wrappers. Used everywhere. |
| 2 | Wrong-role users could access customer pages | `/cart`, `/checkout`, `/orders` now use `RoleRoute roles={['customer']}` |
| 3 | Checkout called `navigate()` during render | Returns `<Navigate to="/cart" replace />` instead |
| 4 | API URL hardcoded | `import.meta.env.VITE_API_URL \|\| 'http://localhost:5000/api'` |
| 5 | 401 hard redirect | Kept for now (standard pattern without React Router access in interceptors) |
| 6 | Owner/rider duplicate localStorage logic | `src/services/orders.js` with shared `getAllOrders`, `updateOrderStatus`, transition validation |
| 7 | No lint/test tooling | ESLint config + Vitest + 15 tests covering storage and mock helpers |

---

## Known Limitations (Honest)

1. **No backend** — Auth uses mock functions. Axios client is configured but no server runs.
2. **Cart/Orders localStorage** — Refresh persists. Clear localStorage = data gone. No sync.
3. **Mock users reset on refresh** — `MOCK_USERS` is module-level `const`, registrations lost on page reload.
4. **No real payment** — 1.5s simulated delay then saves the order.
5. **No real maps** — Address is a text field.
6. **No search/filter** — No search bar, cuisine filter, or sort on restaurant list.
7. **No pagination** — All data loads at once.
8. **Owner-restaurant linking** — Hardcoded via `ownerId`. No UI to manage this.
9. **No image uploads** — Text-based placeholders shown (Pizza, Burger, etc.)
10. **Loading states** — Wired but data is synchronous, so skeletons never trigger naturally.
11. **Form validation** — Minimal. No email format or password strength checks.
12. **Test coverage** — 15 tests cover storage utils and mock helpers, but route guards, checkout redirect, cart behavior, and order transitions are not tested yet.

---

## Next Steps (Backend)

Expected API contract when building the Express server:

| Method | Endpoint | Request | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` |
| GET | `/api/restaurants` | — | `[ ...restaurants ]` |
| GET | `/api/restaurants/:id/menu` | — | `[ ...menuItems ]` |
| POST | `/api/orders` | `{ items, address, paymentMethod }` | `{ order }` |
| GET | `/api/orders` | — | `[ ...orders ]` |
| PATCH | `/api/orders/:id/status` | `{ status }` | `{ order }` |
| GET | `/api/owner/orders` | — | `[ ...orders ]` |
| PATCH | `/api/owner/menu` | `{ name, price, desc }` | `{ item }` |

---

## Build & Run

```bash
cd C:\Users\admin\Desktop\food-delivery-frontend
npm run dev       # Dev server with HMR
npm run build     # Production build -> dist/
npm run preview   # Preview production build
npm run lint      # ESLint check
npm run test      # Run tests once (CI)
npm run test:watch  # Run tests in watch mode
```
