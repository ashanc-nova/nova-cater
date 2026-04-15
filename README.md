# Nova Cater Frontend

Frontend application for a multi-location catering ordering experience. This project is currently frontend-led and uses local mock persistence for cart, order, and identity-like flows, but it has already been refactored so a backend team can wire it into a real restaurant platform without reworking the component structure.

## Stack

- React 19
- React Router 7
- Vite 5
- Tailwind CSS
- Local storage for temporary mock persistence

## Run Locally

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run build
npm run preview
```

## App Routes

- `/` and `/menu`
  - Menu browsing, modifiers, floating cart, location selection
- `/order-details`
  - Event details, customer details, payment type, order confirmation
- `/order-summary`
  - Post-submit order summary, modify-order OTP gate, pay-now flow
- `/my-orders`
  - Trusted device order list, search order, OTP unlock flow for cross-device retrieval

## Project Structure

```text
src/
  components/
    Header.jsx
    Footer.jsx
    Cart.jsx
    HeaderLocationPopover.jsx
    LocationSelectorModal.jsx
    BrandMark.jsx
  context/
    TenantContext.jsx
    ThemeContext.jsx
    LocationContext.jsx
    CartContext.jsx
  data/
    tenantConfig.js
    menuData.js
    enterpriseLocations.js
  pages/
    Home.jsx
    OrderDetails.jsx
    OrderSummary.jsx
    MyOrders.jsx
  utils/
    storage.js
```

## Current Architecture

### 1. Tenant-first configuration

The application is now organized around a single config object in [src/data/tenantConfig.js](/Users/142ashan/Downloads/Nova-cater/src/data/tenantConfig.js).

This file currently acts as the backend substitute for:

- brand identity
- site title
- hero content
- support contact information
- location catalog
- business and restaurant refs
- category definitions
- menu items
- modifier schemas

This is the main place to replace later with either:

1. a backend API response, or
2. a static JSON fetched at runtime from `public/`

### 2. Context layers

- [src/context/TenantContext.jsx](/Users/142ashan/Downloads/Nova-cater/src/context/TenantContext.jsx)
  - exposes the current tenant config
- [src/context/LocationContext.jsx](/Users/142ashan/Downloads/Nova-cater/src/context/LocationContext.jsx)
  - manages selected location
  - defaults from saved location or nearest location via browser geolocation
- [src/context/CartContext.jsx](/Users/142ashan/Downloads/Nova-cater/src/context/CartContext.jsx)
  - manages cart state and persistence
- [src/context/ThemeContext.jsx](/Users/142ashan/Downloads/Nova-cater/src/context/ThemeContext.jsx)
  - manages light/dark mode with browser persistence

### 3. Tenant-scoped persistence

Persistent browser state is managed through [src/utils/storage.js](/Users/142ashan/Downloads/Nova-cater/src/utils/storage.js).

Current storage keys:

- `appCart`
- `appOrders`
- `trustedOrderIds`
- `appEventDetails`
- `lastCustomerDetails`
- `selectedLocationId`

These are automatically namespaced by tenant ID, for example:

```text
sns:appCart
sns:appOrders
```

Legacy `sns...` keys are still migrated forward for backward compatibility.

## What Is Mocked Right Now

The app currently mocks these flows in the frontend:

- menu and modifier data
- location catalog and store metadata
- order submission
- order history
- trusted-device order retrieval
- modify-order OTP verification
- pay-now state changes

All of these are currently persisted in local storage, not sent to a server.

## Backend Integration Guide

This section is the main handoff for backend developers.

### A. Replace tenant config source

Current source:

- [src/data/tenantConfig.js](/Users/142ashan/Downloads/Nova-cater/src/data/tenantConfig.js)

Recommended future shape:

- fetch a single tenant bootstrap payload at app load
- hydrate:
  - brand
  - locations
  - categories
  - menu items
  - modifier schemas
  - app-level API settings

Good options:

1. `GET /tenant-config`
2. `GET /restaurants/:tenantId/config`
3. static `public/config/<tenant>.json` if backend is not ready yet

### B. Replace location catalog

Current source:

- `tenantConfig.locations`

Needs backend ownership later for:

- store list
- addresses
- phone/email
- state/city groupings
- lat/lng
- businessRefId
- restaurantRefId
- timezone

UI already expects all of these.

Main consumers:

- [src/context/LocationContext.jsx](/Users/142ashan/Downloads/Nova-cater/src/context/LocationContext.jsx)
- [src/components/Header.jsx](/Users/142ashan/Downloads/Nova-cater/src/components/Header.jsx)
- [src/components/HeaderLocationPopover.jsx](/Users/142ashan/Downloads/Nova-cater/src/components/HeaderLocationPopover.jsx)
- [src/components/LocationSelectorModal.jsx](/Users/142ashan/Downloads/Nova-cater/src/components/LocationSelectorModal.jsx)
- [src/components/Footer.jsx](/Users/142ashan/Downloads/Nova-cater/src/components/Footer.jsx)

### C. Replace menu and modifier data

Current source:

- `tenantConfig.menu`

That includes:

- categories
- items grouped by category
- modifier schemas

Main consumer:

- [src/pages/Home.jsx](/Users/142ashan/Downloads/Nova-cater/src/pages/Home.jsx)

Important note:
Modifier behavior is no longer tied to category display text. It is now driven by `modifierSchemaId` and `menu.modifierSchemas`, which is the right shape for backend-driven category metadata.

### D. Replace order creation

Current behavior:

- [src/pages/OrderDetails.jsx](/Users/142ashan/Downloads/Nova-cater/src/pages/OrderDetails.jsx)
- builds an `orderDetails` object
- stores it into local storage
- navigates to order summary

Replace this with:

1. validate form
2. build API payload
3. `POST` to backend
4. persist only what is needed locally
5. navigate using backend order ID/ref

Current order payload includes:

- event name
- event date/time
- service type
- delivery address
- delivery instructions
- guest count
- customer details
- special requirements
- selected location snapshot
- cart items
- subtotal, tax, fees, total
- payment option and payment status

Recommendation:
Keep the location snapshot in the returned order record even after backend integration. It protects the UI from future store metadata changes.

### E. Replace order history and retrieval

Current behavior:

- [src/pages/MyOrders.jsx](/Users/142ashan/Downloads/Nova-cater/src/pages/MyOrders.jsx)
- reads all orders from local storage
- filters trusted orders on this device
- supports search by phone, email, and order ID
- unlocks external orders with a mocked 4-digit OTP

Recommended backend mapping:

- `GET /orders?customer=...`
- `GET /orders/:id`
- `POST /orders/:id/unlock`
- `POST /orders/:id/send-otp`

Current trusted-device behavior can remain local even with backend:

- after successful OTP verification, store the unlocked order ID in tenant-scoped local storage

### F. Replace modify-order OTP flow

Current behavior:

- [src/pages/OrderSummary.jsx](/Users/142ashan/Downloads/Nova-cater/src/pages/OrderSummary.jsx)
- shows OTP modal before modify
- defaults to email if available
- can switch to phone/text
- accepts any 4-digit format in mock mode

Recommended backend split:

1. send OTP
2. verify OTP
3. allow modify

Likely endpoints:

- `POST /orders/:id/send-modify-otp`
- `POST /orders/:id/verify-modify-otp`

### G. Replace payment status changes

Current behavior:

- `Pay Now` in [src/pages/OrderSummary.jsx](/Users/142ashan/Downloads/Nova-cater/src/pages/OrderSummary.jsx)
- simply flips payment state in local storage

Recommended backend mapping:

- create payment intent/session
- redirect or open payment UI
- update order payment state from backend callback/webhook

## Current UI-to-Platform Mapping

The frontend already carries these platform-friendly fields per selected store:

- `businessRefId`
- `restaurantRefId`
- `applicationName`

These currently live in `tenantConfig.locations`.

That means once the API layer is introduced, the selected location already gives the frontend enough routing context to call store-scoped backend endpoints.

## How To Introduce API Calls Cleanly

The simplest next step is to add a lightweight service layer, for example:

```text
src/services/
  tenantService.js
  menuService.js
  orderService.js
  authService.js
  locationService.js
```

Recommended rules:

- components should not call `fetch` directly
- pages should call service functions
- services should map API payloads to the current UI shape
- keep `tenantConfig.js` as the fallback/mock adapter until the API is ready

## Recommended Integration Order

To reduce churn, wire things in this sequence:

1. tenant bootstrap/config
2. locations
3. menu catalog + modifiers
4. order creation
5. order history
6. OTP send/verify flows
7. payment flow

This order works well because each later step depends on earlier runtime data.

## Important Current Behaviors To Preserve

When wiring the backend, preserve these UX behaviors:

- selected location persists in browser
- first-time users default to light mode
- cart persists while browsing
- modify-order flow restores cart and event details
- order summary uses order-level location snapshot, not just current selected location
- customer details prefill from last order
- trusted-device order retrieval persists after OTP unlock

## Static Mock HTML Files

These files exist under `public/`:

- [public/components/header.html](/Users/142ashan/Downloads/Nova-cater/public/components/header.html)
- [public/components/footer.html](/Users/142ashan/Downloads/Nova-cater/public/components/footer.html)
- [public/pages/home.html](/Users/142ashan/Downloads/Nova-cater/public/pages/home.html)
- [public/pages/menu.html](/Users/142ashan/Downloads/Nova-cater/public/pages/menu.html)
- [public/pages/my-orders.html](/Users/142ashan/Downloads/Nova-cater/public/pages/my-orders.html)
- [public/pages/order-details.html](/Users/142ashan/Downloads/Nova-cater/public/pages/order-details.html)
- [public/pages/order-summary.html](/Users/142ashan/Downloads/Nova-cater/public/pages/order-summary.html)

These are reference/mock artifacts only. The live app uses the React code in `src/`.

## Multi-Restaurant Readiness Status

The app is now structurally ready for multi-restaurant support because:

- brand shell is config-driven
- locations are config-driven
- menu and modifiers are config-driven
- storage is tenant-scoped
- order records include location snapshots
- component logic no longer depends on hardcoded SNS assumptions in runtime code

The main remaining backend step is not a frontend refactor. It is simply replacing the config and mock storage flows with real API responses.

## Notes For Your Team

- If you need a no-backend intermediate step, move `tenantConfig.js` into a standalone JSON file and fetch it at runtime.
- If you need per-brand deploys, the current shape supports that cleanly.
- If you need one deploy for many restaurants, the next step is a tenant bootstrap lookup based on hostname, route param, or launch context.

## Quick Handoff Summary

If your developers only read one section, the most important files are:

- [src/data/tenantConfig.js](/Users/142ashan/Downloads/Nova-cater/src/data/tenantConfig.js)
- [src/context/TenantContext.jsx](/Users/142ashan/Downloads/Nova-cater/src/context/TenantContext.jsx)
- [src/context/LocationContext.jsx](/Users/142ashan/Downloads/Nova-cater/src/context/LocationContext.jsx)
- [src/context/CartContext.jsx](/Users/142ashan/Downloads/Nova-cater/src/context/CartContext.jsx)
- [src/pages/Home.jsx](/Users/142ashan/Downloads/Nova-cater/src/pages/Home.jsx)
- [src/pages/OrderDetails.jsx](/Users/142ashan/Downloads/Nova-cater/src/pages/OrderDetails.jsx)
- [src/pages/OrderSummary.jsx](/Users/142ashan/Downloads/Nova-cater/src/pages/OrderSummary.jsx)
- [src/pages/MyOrders.jsx](/Users/142ashan/Downloads/Nova-cater/src/pages/MyOrders.jsx)
- [src/utils/storage.js](/Users/142ashan/Downloads/Nova-cater/src/utils/storage.js)

That set is enough to understand almost the whole data flow.
