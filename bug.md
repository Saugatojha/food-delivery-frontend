# Bug Log — Sprint 8 Hardening

This log records the five bugs fixed during the Sprint 8 hardening pass (all in `food-delivery-frontend`), along with the fix applied, files touched, and the tests added. All changes are merged into `main`.

## Bug 1 — Order tracking polled even when the tab was hidden

**Severity:** Medium · **Area:** `OrderTracking`

**Problem**
The order tracker fetched the latest order state on a fixed 15s interval, so it kept polling in the background even when the tab was hidden. That wasted requests and produced stale updates on return.

**Fix**
- `src/pages/OrderTracking.jsx` — polling is now gated on `document.visibilityState` (paused while hidden) and a `focus` listener triggers an immediate refetch when the tab becomes visible again.

**Tests** — `src/test/orderTracking.test.jsx` (fake timers): polls every 15s while visible, pauses when hidden, refetches immediately on focus, and cleans up listeners.

## Bug 2 — Map showed a fake "simulated" rider marker

**Severity:** Medium · **Area:** `MapView`

**Problem**
The delivery map drew a rider marker that was never real — it simulated a rider moving toward the destination, so users were shown a rider that did not exist.

**Fix**
- `src/components/MapView.jsx` — the rider marker is now rendered **only when real GPS coordinates exist** on the delivery record (`riderLatitude`/`riderLongitude`). Otherwise no rider marker is shown.

**Tests** — `src/test/map.test.jsx`: rider marker rendered when coords are present, absent when they are not.

## Bug 3 — Fetch/route failures were silently swallowed

**Severity:** High · **Area:** `Home`, `Checkout`, `MapView`

**Problem**
Three silent-failure spots left the UI stuck or empty with no explanation: the Home restaurant list, the Checkout order placement, and the OSRM road-route fetch.

**Fix**
- `src/pages/Home.jsx` — a failed restaurant-list request now shows an inline error state with a **Retry** button and an error toast instead of failing silently.
- `src/pages/Checkout.jsx` — the order-failure toast now includes an actionable hint.
- `src/components/MapView.jsx` — OSRM route failures show a small non-blocking **"Route unavailable"** note while keeping the graceful no-polyline fallback. Also removed an unused `routeLoaded` state and keyed the route fetch on coordinates so polling re-renders don't re-fetch OSRM.

**Tests** — `src/test/home.test.jsx` (new file): success render, inline error + retry + toast, retry re-fetches. `src/test/map.test.jsx`: route note appears on failure and stays hidden on success.

## Bug 4 — Restaurant search fired a request on every keystroke

**Severity:** Low · **Area:** `Home`

**Problem**
The Home search box sent a `/restaurants` request for every keystroke, hammering the API.

**Fix**
- `src/pages/Home.jsx` — added a `debouncedSearch` state: the request now fires only **300ms after the user pauses typing**.

**Tests** — `src/test/home.test.jsx`: fake-timer test asserting no refetch during typing and exactly one refetch 300ms later with the typed term.

## Bug 5 — Toasts could not be dismissed and stacked without limit

**Severity:** Low · **Area:** `ToastContext`

**Problem**
Toasts had no manual dismiss control and could pile up unbounded, cluttering the screen.

**Fix**
- `src/context/ToastContext.jsx` — each toast now has a dismiss button (`aria-label="Dismiss notification"`) and the stack renders at most **3 toasts**, dropping the oldest when more arrive. `role="alert"` / `aria-live="assertive"` are preserved for screen readers.

**Tests** — `src/test/toast.test.jsx` (new file): renders with alert role + assertive live region, dismiss via close button, 3-toast cap drops the oldest, auto-dismiss after 3s.

---

## Verification

- Lint: `npm run lint` — clean.
- Tests: `npm run test` — **64 passing** (was 47 before this sprint).
- Build: `npm run build` — succeeds.

## Commits

| Commit | Description |
|---|---|
| `125ec20` | fix: add visibility-aware polling to OrderTracking |
| `af0ab7a` | fix: use real rider GPS instead of simulated midpoint |
| `baa6894` | fix: surface silent fetch failures instead of empty screens |
| `f3492de` | fix: debounce restaurant search input |
| `c248b68` | fix: add toast dismiss button and cap visible toasts |
| `08d1421` | docs: record Sprint 8 hardening fixes, update test counts |
