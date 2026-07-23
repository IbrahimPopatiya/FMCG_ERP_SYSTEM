# Frontend Structure Plan — Customer App vs ERP (Staff) App

## 1. Two separate products, one backend

This project is really **two frontends sharing one FastAPI backend**, not one app with a role switch:

1. **Customer App** — a Blinkit/Zepto-style shopping experience for shop owners to browse the catalog and place their own orders. Consumer UX: big product cards, search, cart, quick reorder, order tracking. Lives at `(customer)/`.
2. **ERP Management App** — the internal back-office tool used by staff (`admin`, `salesman`, `driver`, `manager`, `dispatcher`, `cashier`). Data-dense UX: tables, filters, forms, approve/reject actions. Lives at `(staff)/admin/` today (folder name is a leftover from early build — see §6).

They must never share layout/nav components — a shopping cart UI and a stock-adjustment form have nothing in common. They already don't (`(customer)/layout.tsx` vs `(staff)/admin/layout.tsx` are separate) — keep it that way.

## 2. Final status — implemented vs remaining

| Area | Status |
|---|---|
| Customer app core flow (browse → cart → order → track → account) | **Implemented** |
| Customer app Blinkit-style extras (home feed, category grid, search, order-status stepper, dues view) | **Remaining** |
| ERP pages for existing CRUD domains (products, customers, users, orders, invoices, deliveries, inventory, payments, purchases, returns, suppliers, vehicles) | **Implemented** |
| ERP pages for brands, categories | **Remaining** (backend ready, screen not built) |
| ERP pages for credit notes, warehouses, routes, price lists | **Remaining** (backend list endpoint also missing) |
| Role-based nav + page gating in ERP app | **Remaining** (everyone sees everything today) |
| Backend per-role authorization (`require_role`) | **Remaining** (only staff-vs-customer split + one hand-rolled check exist) |
| Backend order scoping by role (salesman → own route) | **Remaining** (unverified, needs a check) |

## 3. Customer App — Blinkit-style plan

### Implemented
- `(customer)/products/page.tsx` — product listing
- `(customer)/products/[productId]/page.tsx` — product detail
- `(customer)/cart/page.tsx` — cart
- `(customer)/orders/page.tsx` + `[orderId]/page.tsx` — own order list + detail
- `(customer)/account/page.tsx` — account page
- Auth: customer login via unified `/auth/login`, scoped by JWT `type: "customer"` — server derives `customer_id` from token, never trusts client-sent IDs (per `api_reference.md` §19)

### Remaining, to reach a Blinkit-like feel
- **Home/landing screen** — Blinkit opens on a curated home feed (banners, categories grid, "reorder your last basket"), not a raw product list. Needs a new `(customer)/page.tsx`.
- **Category browsing** — `categories` API exists (`GET /categories`) but no customer-facing category filter/grid UI yet.
- **Search** — no search endpoint/UI confirmed for the customer product list; needed for the "search first" Blinkit pattern.
- **Persistent cart bar** — Blinkit shows a floating cart summary bar across all screens once items are added; confirm whether `cart/page.tsx` is the only cart UI or a global cart state + bar already exists.
- **Order tracking timeline** — a live status tracker (placed → packed → out for delivery → delivered), driven by `OrderStatus` (pending/approved/loaded/delivered/cancelled) and `DeliveryStatus`. Order detail page should render this as a stepper, not just a status badge.
- **Dues/credit view** — customers can view outstanding dues per `api_reference.md` §19; no dedicated screen yet — belongs on `account/page.tsx` or a new `dues/page.tsx`.
- **Price list awareness** — confirm the product listing already applies customer-specific pricing (via `price_lists`) rather than a flat catalog price.

## 4. ERP Management App — staff plan

### Implemented (`(staff)/admin/`)
`dashboard`, `products` (+ new, detail), `customers` (+ detail), `users`, `orders` (+ detail), `invoices` (+ detail), `deliveries` (+ detail), `inventory`, `payments`, `purchases` (+ detail), `returns` (+ detail), `suppliers`, `vehicles`.

All of these are currently shown to **every** staff member regardless of role — no role-based filtering exists yet (`DesktopSidebar`/`MobileBottomNav` take a flat `items` list, no role logic).

### Remaining — pages to build, backend already ready
- `brands/` — CRUD exists (`GET/POST/PATCH/DELETE /brands`)
- `categories/` — CRUD exists (`GET/POST/PATCH/DELETE /categories`)

### Remaining — pages blocked on backend (no list/GET endpoint yet, only mutations)
- `credit-notes/` — only `approve`/`reject` exist, no list endpoint
- `warehouses/` — only create/update/status/delete exist, no list endpoint
- `routes/` (sales routes) — only create/update/assign-salesman/delete exist, no list endpoint
- `price-lists/` — only create/update/delete + item mutations exist, no list endpoint
- Existing pages that may also be working around a missing list endpoint (`invoices`, `returns`, `purchases`, `suppliers`, `vehicles`, `deliveries`, `payments`) — verify how each currently populates its list; add a `GET` list route if genuinely missing.

### Remaining — role-based access control
Every staff page is visible to every role today. Needs: role-filtered nav, a `useRoleGuard` on each page, and a backend `require_role()` dependency so it isn't UI-only gating (see §5).

## 5. Per-role screens inside the ERP app

The backend has 6 staff roles (`app/core/enums.py::UserRole`): `admin`, `salesman`, `driver`, `manager`, `dispatcher`, `cashier`. No backend enforcement exists per role today except one hand-written check in `credit_note.py` — only `admin` or the customer's assigned route salesman may approve/reject a credit note. Everything else is currently wide open to any authenticated staff member (a gap, see §6).

### Admin — sees everything
Dashboard, Products, Categories*, Brands*, Price Lists*, Customers, Users, Routes*, Orders, Invoices, Deliveries, Vehicles, Inventory, Purchases, Suppliers, Payments, Returns, Credit Notes*.
(`*` = page not yet built, see §4.)

### Salesman
Dashboard (own route summary), Customers (scoped to own route), Products (browse, read-only), Orders (create + list own), Order detail, Credit Notes (approve/reject for own route's customers).
Hidden: Users, Suppliers, Purchases, Inventory, Vehicles, Warehouses.

### Driver
Dashboard (today's deliveries), Deliveries (assigned to them — start/arrive/complete/fail), Delivery detail, Payments (record payment collected on delivery), Vehicle (assigned vehicle, read-only).
Hidden: Products, Customer management, Users, Purchases, Suppliers, Inventory adjustments.

### Manager
Dashboard (cross-domain KPIs), Products, Customers, Orders, Invoices, Deliveries, Inventory, Purchases, Suppliers, Payments, Returns, Vehicles, Routes*.
Hidden: Users (stays admin-only).

### Dispatcher
Dashboard (orders pending dispatch), Orders (approve → load), Deliveries (create + assign driver/vehicle), Vehicles (assign driver, set status), Routes* (read-only).
Hidden: Users, Suppliers, Purchases, Payment verification, Product edits.

### Cashier
Dashboard (`/admin/cashier/dashboard` — today's cash/UPI/cheque collection, pending verification, returns count), Driver Collections (`/admin/cashier/driver-collections` — today's payments grouped by driver, + detail), Payments (list, verify, bounce), Party Balance (`/admin/cashier/party-balance` — per-customer outstanding dues, backed by new `GET /customers/{id}/dues`), Invoices (read-only, payment status), Customers (read-only, dues), Reports (`/admin/cashier/reports` — date-range collection summary + CSV export).
Hidden: Order creation, Products, Users, Inventory, Purchases, Deliveries, Vehicles, Returns approve/reject (backend restricts that to admin/manager).

Note: the richer mobile-app-style cashier workflow in `final_docs/design-prompt/cashier_workflow_prompt.md` (Expense Entry, Alerts/Follow-ups, driver-linked returns, PDF/Excel export) goes beyond what the backend supports today — those pieces were intentionally left out of this pass (no Expense domain exists; Return has no driver_id to link to a driver's collection run). Build them as their own backend+frontend PR when needed.

## 6. Implementation approach (minimal, no overengineering)

1. Persist `role` from `/auth/login` response into the session (`lib/auth/session.ts`) — already returned by the API, just not stored today.
2. `lib/nav/roleNav.ts` — one flat map `{ role → nav items + home route }`. `DesktopSidebar`/`MobileBottomNav` already accept a plain `items` array — pass the role-filtered list instead of a hardcoded one.
3. `lib/hooks/useRoleGuard.ts` — small hook, redirect to the role's home if `user.role` isn't in a page's allowed list. Add one call to each existing `(staff)/admin/*/page.tsx`.
4. Backend follow-up (flag to team, not a frontend task): add a `require_role(*roles)` FastAPI dependency so role gating is enforced server-side too, not just client-side redirects. Also confirm/add the scoping mentioned in `api_work_allocation.md` ("customer sees own, salesman sees own route's customers" on `GET /orders`) actually exists in `sales_order.py`.

No generic permissions/ACL engine — a flat per-role array plus one guard hook is enough for 6 roles + customer (YAGNI).

## 7. Naming cleanup (optional, not blocking)

`(staff)/admin/` is a slightly misleading folder name now that it holds screens for 6 different roles, not just admin. Consider renaming to `(staff)/app/` or `(staff)/erp/` at some point — cosmetic only, do as a separate small PR, not bundled with the role-gating work.
