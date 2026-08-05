# Sequence Diagrams

> Rendered with [Mermaid](https://mermaid.js.org). Copy any block into https://mermaid.live to view, or open this file in a Markdown viewer with Mermaid support (VS Code + "Markdown Preview Mermaid Support").

## Actors & Roles

| Actor | Role | Accesses |
|---|---|---|
| Customer | Places orders, tracks delivery | `/`, `/restaurant/:id`, `/cart`, `/checkout`, `/order-tracking/:id` |
| Owner | Manages restaurant + menu, confirms orders | `/owner` (Orders / Menu / Settings) |
| Rider | Accepts deliveries, updates status + location, views earnings | `/rider` (Available / My Deliveries / Earnings) |
| Admin | Full restaurant CRUD, app oversight | `/admin` |
| Backend | Express + Prisma (MySQL 8) | `/api/*` |

---

## 1. Authentication & Role-Based Redirect

```mermaid
sequenceDiagram
    participant C as Client
    participant F as Frontend (React)
    participant S as Backend (Express)
    participant D as Database (Prisma)

    C->>F: Submit login form
    F->>S: POST /api/auth/login { login, password }
    S->>D: user.findUnique (email)
    D-->>S: user row (hash, role, emailVerified)
    S->>S: bcrypt.compare(password, hash)
    alt email not verified
        S-->>F: 403 { code: 'EMAIL_NOT_VERIFIED', email }
        F-->>C: Banner + "Resend verification link"
    else verified
        S-->>F: 200 { token, user: { id, name, role } }
        F->>F: AuthContext stores token + user
        F-->>C: Redirect by role
        Note over C: role === 'owner' → /owner<br/>role === 'rider' → /rider<br/>role === 'admin' → /admin<br/>else → /
    end
```

---

## 1b. Registration & Email Verification

```mermaid
sequenceDiagram
    participant C as Client
    participant F as Frontend (React)
    participant S as Backend (Express)
    participant D as Database (Prisma)

    C->>F: Submit register form
    F->>S: POST /api/auth/register { name, email, password }
    S->>S: bcrypt.hash(password) + random verification token (24h expiry)
    S->>D: user.create (emailVerified: false, verificationToken)
    S->>S: sendVerificationEmail (dev: prints link to console)
    S-->>F: 201 { message, user, devLink? }  (no token / no auto-login)
    F-->>C: Redirect to /verify-email?email=...

    C->>F: Open /verify-email?token=... (from email/link)
    F->>S: GET /api/auth/verify-email?token=...
    S->>D: user.findUnique (verificationToken)
    S->>D: user.update (emailVerified: true, clear token)
    S-->>F: { message: 'Email verified' }
    F-->>C: Success → /login

    alt token missing / expired / wrong
        C->>F: Click "Resend verification link"
        F->>S: POST /api/auth/resend-verification { login }
        S->>D: user.update (new verificationToken)
        S->>S: sendVerificationEmail (new dev link)
        S-->>F: { message, devLink? }
        F-->>C: New link shown / sent
    end
```

---

## 2. Browse Restaurants & Place an Order

```mermaid
sequenceDiagram
    participant C as Customer
    participant F as Frontend (React)
    participant S as Backend (Express)
    participant D as Database (Prisma)

    C->>F: Open app / Home
    F->>S: GET /api/restaurants
    S->>D: restaurant.findMany (isOpen, cuisine)
    D-->>S: restaurant list
    S-->>F: 200 restaurants
    F-->>C: Restaurant cards (cuisine filter)

    C->>F: Open restaurant menu
    F->>S: GET /api/restaurants/:id
    S->>D: restaurant.findUnique + menuItem.findMany
    D-->>S: restaurant + menu items (category, subCategory)
    S-->>F: 200 { restaurant, menu }
    F->>F: Group menu by category → subCategory (fallback "Other")
    F-->>C: Grouped menu

    C->>F: Add items to cart
    F->>F: Update Cart (local state, localStorage)
    C->>F: Cart: click map / "Use current location"
    F->>F: saveDeliveryLocation (localStorage 'delivery-location')
    C->>F: "Proceed to Checkout"
    F-->>C: /checkout (location prefilled on map)
    F->>S: POST /api/orders { items[], address, phone, paymentMethod, deliveryLatitude, deliveryLongitude }
    S->>D: Validate restaurant open + menu items exist
    D-->>S: menu items + prices
    S->>S: Compute total = Σ(price × quantity)
    S->>D: order.create + items + payment + delivery (status Pending)
    D-->>S: order (id, status: Pending)
    S->>S: notifyRestaurantOwner("New order received")
    S-->>F: 201 order
    F->>F: clearDeliveryLocation + empty cart
    F-->>C: Order placed → /orders
```

---

## 3. Order Fulfillment (Owner)

```mermaid
sequenceDiagram
    participant O as Owner
    participant F as Frontend (Owner Dashboard)
    participant S as Backend (Express)
    participant D as Database (Prisma)

    O->>F: Open Orders tab
    F->>S: GET /api/owner/orders (JWT: role=owner)
    S->>D: order.findMany by restaurantId
    D-->>S: orders (Pending)
    S-->>F: 200 orders
    F-->>O: Order cards + audio ping

    alt Accept order
        O->>F: Click Accept
        F->>F: Confirmation modal
        O->>F: Confirm
        F->>S: PATCH /api/owner/orders/:id/status { status: "Confirmed" }
        S->>D: order.update (Pending → Confirmed)
        D-->>S: updated order
        S->>S: notifyCustomer("Order Confirmed")
        S-->>F: 200 updated
        F-->>O: Order shown as Confirmed
    else Decline order
        O->>F: Click Decline → Confirm
        F->>S: PATCH /api/owner/orders/:id/status { status: "Rejected" }
        S->>S: isValidTransition(Pending, Rejected, owner) → allowed
        S->>D: order.update (Pending → Rejected)
        D-->>S: updated order
        S->>S: notifyCustomer("Order Rejected")
        S-->>F: 200 updated
        F-->>O: Order marked Rejected
    end

    Note over O,S: Owner then advances: Confirmed → Preparing → Ready for Pickup
```

---

## 4. Delivery (Rider)

```mermaid
sequenceDiagram
    participant R as Rider
    participant F as Frontend (Rider Dashboard)
    participant S as Backend (Express)
    participant D as Database (Prisma)
    participant C as Customer

    R->>F: Open Available tab
    F->>S: GET /api/rider/deliveries
    S->>D: order.findMany (status Ready for Pickup / Out for Delivery)
    D-->>S: available orders
    S-->>F: 200 orders
    F-->>R: Available order cards + mini map (location = Kathmandu default)

    alt Accept
        R->>F: Accept delivery
        F->>S: PATCH /api/rider/orders/:id/accept
        S->>D: delivery.upsert (riderId = rider)
        S->>D: order.update (Ready for Pickup → Out for Delivery)
        D-->>S: updated order + delivery
        S-->>F: 200 updated
        F-->>R: Moves to "My Deliveries"
    else Pass
        R->>F: Pass on delivery
        F->>S: PATCH /api/rider/orders/:id/reject
        S->>D: order.update (→ Pending)
        D-->>S: order
        S-->>F: 200 { message }
        F-->>R: Removed from available list
    end

    Note over R,C: During delivery the rider updates status + location:
    R->>F: Advance status (Out for Delivery → Delivered)
    F->>S: PATCH /api/rider/orders/:id/status { status }
    S->>D: order.update (status validated via statusFlow)
    D-->>S: updated
    S->>S: notifyCustomer("Out for Delivery" / "Delivered")
    S-->>F: 200 updated
    F-->>C: Customer sees status + rider location on tracking map
```

---

## 5. Live Tracking (Customer)

```mermaid
sequenceDiagram
    participant C as Customer
    participant F as Frontend (OrderTracking)
    participant S as Backend (Express)
    participant D as Database (Prisma)

    C->>F: Open /order-tracking/:id (poll every N seconds)
    F->>S: GET /api/orders/tracking/:id (JWT)
    S->>D: order.findUnique + restaurant + delivery (riderLat/Lng)
    D-->>S: order status + rider coordinates
    S-->>F: 200 { status, delivery: { riderLatitude, riderLongitude } }
    F-->>C: Status badge + live map (restaurant → rider → delivery point)

    Note over C,D: Rider PATCH /api/rider/location updates riderLat/Lng<br/>which the next poll picks up automatically.
```

---

## 6. Menu Management (Owner)

```mermaid
sequenceDiagram
    participant O as Owner
    participant F as Frontend (Owner Menu tab)
    participant S as Backend (Express)
    participant D as Database (Prisma)

    O->>F: Open Menu tab
    F->>S: GET /api/owner/menu
    S->>D: menuItem.findMany (restaurantId)
    D-->>S: items
    S-->>F: 200 items
    F->>F: Group by category → subCategory
    F-->>O: Menu list

    alt Add item
        O->>F: Click "Add Item"
        F-->>O: Form (name, price, cuisine-based category dropdown, subCategory dropdown, image upload)
        O->>F: Submit
        F->>S: POST /api/owner/menu { name, price, category, subCategory, desc, image }
        S->>D: menuItem.create (defaults "General" if omitted)
        D-->>S: item
        S-->>F: 201 item
        F-->>O: Item appears in list
    else Edit item
        O->>F: Edit existing item
        F->>S: PATCH /api/owner/menu/:id { name, price, category, subCategory, desc, image }
        S->>D: menuItem.update
        D-->>S: updated item
        S-->>F: 200 updated
        F-->>O: Item updated
    else Delete item
        O->>F: Delete item
        F->>S: DELETE /api/owner/menu/:id
        S->>D: menuItem.delete
        D-->>S: ok
        S-->>F: 200 { message }
        F-->>O: Item removed
    end

    Note over O,D: Image upload path (before saving):<br/>F->>S: POST /api/upload/image (multipart)<br/>S->>S: multer → server/uploads/<br/>S-->>F: { url } → F includes url in menu body
```

---

## 7. Admin — Restaurant CRUD

```mermaid
sequenceDiagram
    participant A as Admin
    participant F as Frontend (Admin Panel)
    participant S as Backend (Express)
    participant D as Database (Prisma)

    A->>F: Open Admin panel
    F->>S: GET /api/admin/restaurants
    S->>D: restaurant.findMany
    D-->>S: restaurants
    S-->>F: 200 restaurants
    F-->>A: Restaurant table

    alt Create
        A->>F: "Add Restaurant" form
        F->>S: POST /api/admin/restaurants { name, cuisine, ownerId, ... }
        S->>D: restaurant.create
        D-->>S: restaurant
        S-->>F: 201 restaurant
    else Update
        A->>F: Edit restaurant
        F->>S: PATCH /api/admin/restaurants/:id
        S->>D: restaurant.update
        D-->>S: restaurant
        S-->>F: 200 restaurant
    else Delete
        A->>F: Delete restaurant
        F->>S: DELETE /api/admin/restaurants/:id
        S->>D: restaurant.delete
        D-->>S: ok
        S-->>F: 200 { message }
    end

    F-->>A: Refreshed list
```

---

## 8. Rider Earnings

```mermaid
sequenceDiagram
    participant R as Rider
    participant F as Frontend (Rider Earnings tab)
    participant S as Backend (Express)
    participant D as Database (Prisma)

    R->>F: Open Earnings tab
    F->>S: GET /api/rider/earnings (JWT: role=rider)
    S->>D: order.findMany (riderId, status Delivered)
    D-->>S: delivered orders (total, createdAt)
    S->>S: Compute daily / weekly / all-time totals + counts
    S-->>F: 200 { totalEarnings, dailyEarnings, weeklyEarnings, ... }
    F-->>R: Earnings counters (Daily / Weekly / All-Time)
```

---

---

## 9. Notifications (In-App Bell + Browser Push)

```mermaid
sequenceDiagram
    participant U as User (any role)
    participant F as Frontend (NotificationContext)
    participant S as Backend (Express)
    participant D as Database (Prisma)

    Note over U,D: Trigger: order created / Confirmed / Rejected / Out for Delivery / Delivered
    Note over S,D: notifyRestaurantOwner / notifyCustomer call createNotification(userId, title, message)

    S->>D: notification.create (userId, title, message, read: false)
    D-->>S: notification

    loop Every 15s (while logged in)
        F->>S: GET /api/notifications/unread-count
        S->>D: notification.count (userId, read: false)
        D-->>S: count
        S-->>F: { count }
        alt count increased
            F->>S: GET /api/notifications
            S-->>F: [ notifications ]
            alt Notification API supported
                F->>F: requestPermission (once)
                F->>F: new Notification(title, { body: message })
                F-->>U: OS/browser notification
            end
        end
        F-->>U: Bell badge updates (unread count)
    end

    U->>F: Open bell dropdown
    F->>S: GET /api/notifications (refreshes list)
    S-->>F: latest 50 notifications
    F-->>U: Notification list (unread highlighted)

    alt Mark one read
        U->>F: Click notification
        F->>S: PATCH /api/notifications/:id/read
        S->>D: notification.update (read: true)
        S-->>F: updated
    else Mark all read
        U->>F: Click "Mark all read"
        F->>S: POST /api/notifications/read-all
        S->>D: notification.updateMany (read: true)
        S-->>F: { message }
    end
```

---

## Security Notes (from `SECURITY_CHECKLIST.md`)

- Every `/api/*` mutating route is behind `csrfProtection` (skipped in `NODE_ENV=test`).
- Auth uses `authenticate` (JWT) + `authorize(role)` middleware per route group.
- Order status changes are validated with `isValidTransition` / `TERMINAL_STATUSES` to block illegal transitions and terminal-order edits.
- Passwords are hashed with bcrypt; no secrets committed.
- Email verification gates the first login (`403 EMAIL_NOT_VERIFIED`); the verify/resend routes rotate the one-time token with a 24h expiry.
- Notification endpoints are authenticated and scoped to the requesting `userId` (no cross-user reads/writes).
- Uploads are behind `authenticate`, size-limited (5MB) and filtered to `jpeg/png/gif/webp` mime types.
