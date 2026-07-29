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
                 │              ├─ /cart -> ProtectedRoute -> Cart
                 │              ├─ /checkout -> ProtectedRoute -> Checkout
                 │              ├─ /orders -> ProtectedRoute -> OrderTracking
                 │              ├─ /owner -> RoleRoute(owner) -> OwnerDashboard
                 │              ├─ /owner/menu -> RoleRoute(owner) -> OwnerMenu
                 │              ├─ /owner/orders -> RoleRoute(owner) -> OwnerOrders
                 │              ├─ /rider -> RoleRoute(rider) -> RiderDashboard
                 │              └─ /admin -> RoleRoute(admin) -> AdminPanel
```

### Route Guards

- **ProtectedRoute** — redirects to `/login` if no user in context. Saves intended path so user is sent back after login.
- **RoleRoute** — extends ProtectedRoute. Redirects to `/` if user's role doesn't match the required role.

---

## File Map

```
src/
├── api/
│   └── client.js           Axios instance -> localhost:5000/api. 401 interceptor auto-redirects to login.
│
├── context/
│   ├── AuthContext.jsx      User state, login/register/logout. Reads/writes localStorage.
│   └── ToastContext.jsx     Toast notification system. Auto-dismiss after 3s.
│
├── components/
│   ├── EmptyState.jsx       Reusable: icon + title + message + optional action button.
│   ├── ErrorBoundary.jsx    Class component. Catches render errors, shows reload button.
│   ├── LoadingSkeleton.jsx  CardSkeleton + ListSkeleton with pulse animation.
│   ├── Navbar.jsx           Brand link + role-aware nav links + user name + logout.
│   ├── ProtectedRoute.jsx   Auth gate — redirects to /login.
│   └── RoleRoute.jsx        Role gate — checks user.role matches required role.
│
├── data/
│   └── mock.js              All mock data + utility functions. Single source of truth.
│
├── pages/
│   ├── Login.jsx            Email/password form. Shows test account credentials. Toast feedback.
│   ├── Register.jsx         Name/email/password form. Toast feedback.
│   ├── Home.jsx             Restaurant grid. Closed restaurants greyed out + labeled.
│   ├── Restaurant.jsx       Menu items for one restaurant. "Add to Cart" per item. Handles "not found" + "closed".
│   ├── Cart.jsx             Cart items with qty +/-/remove. Total. Empty state with CTA.
│   ├── Checkout.jsx         Address + payment method + order summary. Simulated 1.5s placement.
│   ├── OrderTracking.jsx    5-step progress bar for each order. Empty state.
│   ├── owner/
│   │   ├── Dashboard.jsx    3 stats cards (total orders, pending, revenue) + pending list.
│   │   ├── MenuManagement.jsx List items + inline add form.
│   │   └── Orders.jsx       Status flow: Pending -> Confirmed -> Preparing -> Ready for Pickup
│   ├── rider/
│   │   └── Dashboard.jsx    Filtered orders: Ready for Pickup -> Out for Delivery -> Delivered
│   └── admin/
│       └── Panel.jsx        4 stat cards + users table + restaurants grid.
│
├── App.jsx                  Route definitions. Provider nesting.
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

**Auth flow:** `mockLogin` and `mockRegister` are synchronous functions that simulate API behavior. New registrations push into the in-memory `MOCK_USERS` array. Tokens are strings like `'mock-jwt-' + Date.now()` — not real JWTs.

**Cart + Orders:** Both stored in `localStorage`. Cart = `localStorage.cart`, Orders = `localStorage.orders`. This is the entire "database" — no persistence across browsers, no backend sync.

---

## Data Flow Per Role

### Customer

1. Opens app -> redirected to `/login`
2. Logs in with test account -> lands on `/` (restaurant list)
3. Clicks a restaurant -> `/restaurant/:id` (menu)
4. Clicks "Add to Cart" -> item saved to `localStorage.cart`, toast shown
5. Goes to `/cart` -> adjusts qtys, sees total
6. Goes to `/checkout` -> enters address, selects payment method, places order
7. Order saved to `localStorage.orders`, cart cleared, redirected to `/orders`
8. OrderTracking shows 5-step progress bar (Pending -> Confirmed -> Preparing -> Out for Delivery -> Delivered)

### Owner

1. Logs in as owner@test.com -> navbar shows Dashboard/Menu/Orders links
2. **Dashboard** (`/owner`): stats cards + list of pending orders for their restaurant
3. **Menu** (`/owner/menu`): view menu items + add new items via inline form
4. **Orders** (`/owner/orders`): all orders for their restaurant. Each order has a "Mark [next status]" button. Flow: Pending -> Confirmed -> Preparing -> Ready for Pickup

### Rider

1. Logs in as rider@test.com -> navbar shows "Deliveries"
2. Dashboard (`/rider`): shows orders with status "Ready for Pickup" or "Out for Delivery"
3. Clicks "Pick Up" -> status becomes "Out for Delivery"
4. Clicks "Mark Delivered" -> status becomes "Delivered" -> order disappears from rider view

### Admin

1. Logs in as admin@test.com -> navbar shows "Panel"
2. Panel (`/admin`): 4 stat cards (users, restaurants, orders, revenue) + users table with role badges + restaurant cards

---

## Known Limitations (Honest)

1. **No backend** — Auth uses mock functions in `mock.js`. Axios client points to `localhost:5000/api` but no server is running. If anyone calls `api.get(...)` it will fail with a network error.

2. **Cart/Orders use localStorage** — Refresh the page and data persists. Clear localStorage and it's gone. No multi-device sync.

3. **Mock data is in-memory** — `MOCK_USERS` resets on page refresh. Registering a new user works until refresh, then they disappear. The `MOCK_USERS` array is a `const` at module scope, not persisted.

4. **No real payment** — Checkout simulates a 1.5s delay then saves the order. Shows the flow only.

5. **No real maps** — Delivery address is a text field. No geolocation, no tracking map.

6. **Search/filter** — No search bar on the restaurant list. No cuisine filter.

7. **No pagination** — All data loads at once. Fine for 6 restaurants, not fine for 600.

8. **Owner-restaurant linking** — Hardcoded via `ownerId` in `MOCK_RESTAURANTS`. Owner 2 owns restaurant 1. No UI for this.

9. **No image uploads** — Menu items use emoji as placeholder images. Restaurant cards too.

10. **No loading states on most pages** — `Home.jsx` has a `loading` variable but it's hardcoded to `false`. The skeleton loader is wired but never triggers because data is synchronous.

11. **Form validation** — Minimal. Email format not validated. Password strength not checked.

12. **Role route for customer** — Customer routes (`/`, `/cart`, etc.) use `ProtectedRoute` but don't check `role === 'customer'`. An owner visiting `/cart` would see it. This works for the prototype but isn't strict.

---

## Design Decisions

- **No external UI library** — Everything is custom Tailwind to keep dependencies minimal and show full control.
- **Orange as brand color** — Food-appropriate, used for primary buttons and nav.
- **Semantic status colors** — Yellow = pending, blue = in progress, green = done/success, red = error.
- **Toasts over alerts** — `ToastContext` provides non-blocking feedback. Replaces the `alert()` calls from the first prototype.
- **Empty states everywhere** — Every list page has a graceful empty state with icon + message + CTA instead of a blank screen.
- **Mobile-first classes** — `sm:` and `lg:` prefixes on layout. Nav hides text labels on small screens.

---

## Next Steps (Backend)

When building the Express backend, these endpoints are expected:

| Method | Endpoint | Request | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` |
| GET | `/api/restaurants` | — | `[ ...restaurants ]` |
| GET | `/api/restaurants/:id/menu` | — | `[ ...menuItems ]` |
| POST | `/api/orders` | `{ items, address, paymentMethod }` | `{ order }` |
| GET | `/api/orders` | — | `[ ...orders ]` |
| PATCH | `/api/orders/:id/status` | `{ status }` | `{ order }` |
| GET | `/api/owner/orders` | — | `[ ...orders ]` (filtered) |
| PATCH | `/api/owner/menu` | `{ name, price, desc }` | `{ item }` |

The `AuthContext` is already wired to call these endpoints. Swap the mock functions in `AuthContext.jsx` with real `api.post(...)` calls. The Login/Register pages use `async/await` with try/catch — they'll work as-is.

---

## Build & Run

```bash
cd C:\Users\admin\Desktop\food-delivery-frontend
npm run dev       # Dev server with HMR
npm run build     # Production build -> dist/
npm run preview   # Preview production build
```
