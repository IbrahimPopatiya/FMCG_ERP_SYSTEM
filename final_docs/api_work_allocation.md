# API Work Allocation
## Distribution Management System (DMS) — Who Builds What

| | |
|---|---|
| **Purpose** | Split the API build work from `api_reference.md` between the two developers, so both can work in parallel without blocking each other |
| **Team** | Amin, Ibrahim |
| **Related Docs** | `api_reference.md`, `database_schema_docs.markdown`, `prd.md`, `project_setup.md` |

---

## 1. How the Split Works

The 18 API domains are split into two tracks so each person owns a **complete, self-contained side** of the system — this avoids both people editing the same files or the same database tables at the same time.

- **Amin → Catalog & Supply side.** Everything about *what* we sell and *where* it lives: products, pricing, warehouses, suppliers, vehicles, stock, purchases, and Tally sync.
- **Ibrahim → Selling & Operations side.** Everything about *who* we sell to and the *order-to-cash* journey: users, customers, orders, invoices, deliveries, payments, returns, and file uploads.

Both tracks share one dependency: **Auth & Users must be built first**, because every other API needs a logged-in user. After that, the two tracks run in parallel.

---

## ⚠️ Status Update — 2026-07-20 (read this before building anything)

While building **Sales Orders** and the **customer self-service portal** (Ibrahim's track), two things from **Amin's track** had to be built early because Sales Orders couldn't work without them, plus one small addition to Products:

| Domain (Amin's track) | What happened | Status |
|---|---|---|
| **Warehouses** | Built in full (`POST/PATCH /warehouses`, `PATCH /warehouses/{id}/status`, `DELETE /warehouses/{id}`) — needed so Sales Orders could compare warehouse state vs customer state for CGST/SGST/IGST. | ✅ **Done — do not rebuild.** |
| **Products** | `GET /products` (catalog listing) was added — not in the original write-API list, but needed so both staff and customers can browse the catalog with correct pricing. Create/update/status/delete were already there and are untouched. | ✅ **`GET` added — rest unchanged.** |
| **Price Lists** | `price_list_items.price` was changed to `discount_percent` (a percentage off the product's base price) instead of an absolute override price. This changes the request/response shape of `POST/PATCH /price-lists/{id}/items`. | ⚠️ **Shape changed — see Section 2 below before touching this domain.** |

**Why this happened:** these three pieces were hard blockers for Sales Orders and couldn't wait. It broke the "no shared files" rule for this one occasion — it's not a pattern going forward.

**What this means for Amin:**
- Pull `develop` before starting anything — these are already merged in.
- Skip Warehouses entirely — it's done, tested, and in use by Sales Orders.
- For Products, only `GET` was touched — Amin's planned `POST/PATCH/DELETE` work is untouched and can proceed normally.
- For Price Lists, read the new shape before adding anything else to that domain (details in Section 2).
- **New shared alembic head is `c3d8f1a6b2e7`.** Any new migration must set `down_revision = 'c3d8f1a6b2e7'`. Pull `develop` first to confirm — if two people generate migrations from different heads at the same time, talk before resolving it (per `CLAUDE.md` §5.6).
- A new shared auth mechanism now exists (`app/core/deps.py`): `get_current_principal` / `Principal` / `require_staff`. **Amin's existing/planned routes don't need to change** — `get_current_user` still works exactly as before, since a customer's token is naturally rejected there (different table lookup). Only reach for `get_current_principal` if a route needs to be readable by both staff and customers (like the Products catalog `GET` above) — none of Amin's remaining domains need this.

---

## 2. Track 1 — Amin: Catalog & Supply

| # | Domain | Status | Tables Owned |
|---|---|---|---|
| 1 | Categories & Brands | 🟡 Assumed already built (unchanged this round) | CATEGORIES, BRANDS |
| 2 | Products | 🟡 Create/update/status/delete assumed already built; `GET` added by Ibrahim's track | PRODUCTS |
| 3 | Price Lists | 🟡 CRUD built; item shape changed to `discount_percent` (see below) | PRICE_LISTS, PRICE_LIST_ITEMS |
| 4 | Warehouses | ✅ **Fully built — skip** | WAREHOUSES |
| 5 | Suppliers | ⬜ Not started | SUPPLIERS |
| 6 | Vehicles | ⬜ Not started | VEHICLES |
| 7 | Inventory | ⬜ Not started | INVENTORY, INVENTORY_MOVEMENTS |
| 8 | Purchases | ⬜ Not started | PURCHASES, PURCHASE_ITEMS |
| 9 | Tally Sync | ⬜ Not started | (reads INVOICES, PAYMENTS, RETURNS) |

**APIs to build in each domain** (checked = already done in the current codebase):

```
Categories & Brands
  [x] POST   /categories
  [x] PATCH  /categories/{id}
  [x] DELETE /categories/{id}
  [x] POST   /brands
  [x] PATCH  /brands/{id}
  [x] DELETE /brands/{id}

Products
  [x] POST   /products
  [x] PATCH  /products/{id}
  [x] PATCH  /products/{id}/status
  [x] DELETE /products/{id}
  [x] GET    /products              -- added by Ibrahim's track (catalog, priced per caller)

Price Lists
  [x] POST   /price-lists
  [x] PATCH  /price-lists/{id}
  [x] DELETE /price-lists/{id}
  [x] POST   /price-lists/{id}/items       -- body is now {product_id, discount_percent} not {product_id, price}
  [x] PATCH  /price-lists/{id}/items/{itemId}   -- body is now {discount_percent}
  [x] DELETE /price-lists/{id}/items/{itemId}
  Note: a product with no item row in a list now means "0% discount, full price" -
  there's a reusable app/services/price_list.py::get_effective_price(db, price_list_id,
  product_id, base_price) function - reuse it anywhere else a price needs to be resolved,
  don't recompute the discount math inline.

Warehouses  -- DONE, do not rebuild
  [x] POST   /warehouses
  [x] PATCH  /warehouses/{id}
  [x] PATCH  /warehouses/{id}/status
  [x] DELETE /warehouses/{id}

Suppliers
  [ ] POST   /suppliers
  [ ] PATCH  /suppliers/{id}
  [ ] PATCH  /suppliers/{id}/status
  [ ] DELETE /suppliers/{id}

Vehicles
  [ ] POST   /vehicles
  [ ] PATCH  /vehicles/{id}
  [ ] PATCH  /vehicles/{id}/driver
  [ ] PATCH  /vehicles/{id}/status
  [ ] DELETE /vehicles/{id}

Inventory
  [ ] POST   /inventory/adjustments
  [ ] POST   /inventory/transfers
  [ ] GET    /inventory

Purchases
  [ ] POST   /purchases
  [ ] PATCH  /purchases/{id}
  [ ] POST   /purchases/{id}/receive
  [ ] POST   /purchases/{id}/cancel

Tally Sync
  [ ] POST   /tally/sync/invoices
  [ ] POST   /tally/sync/payments
  [ ] POST   /tally/sync/returns
  [ ] POST   /tally/retry/{entityType}/{id}
```

**Build order for this track:**
1. Categories & Brands → Products → Price Lists (catalog must exist before pricing)
2. Warehouses → Suppliers → Vehicles (independent, can be done in any order)
3. Inventory (needs Products + Warehouses done)
4. Purchases (needs Suppliers + Warehouses + Inventory done)
5. Tally Sync (last — needs Invoices/Payments/Returns to exist, which is Ibrahim's track)

---

## 3. Track 2 — Ibrahim: Selling & Operations

| # | Domain | Status | Tables Owned |
|---|---|---|---|
| 1 | Auth & Users | ✅ `/auth/login` done (unified staff+customer); `/auth/logout`, Users CRUD assumed already built | USERS |
| 2 | Routes | 🟡 Assumed already built (unchanged this round) | ROUTES |
| 3 | Customers | 🟡 Built; gained `password_hash`/`login_enabled` + unique `mobile` this round | CUSTOMERS |
| 4 | Sales Orders | 🟡 Create/edit/cancel/list/get done; approve/load still open | SALES_ORDERS, SALES_ORDER_ITEMS |
| 5 | Invoices | ✅ Generate + cancel done | INVOICES |
| 6 | Delivery / Driver | ✅ Full state machine done (create/start/arrive/complete/fail) | DELIVERIES |
| 7 | Payments | ⬜ Not started | PAYMENTS |
| 8 | Returns | ⬜ Not started | RETURNS, RETURN_ITEMS |
| 9 | File Uploads | ⬜ Not started | (object storage only, no table) |

**APIs to build in each domain** (checked = already done in the current codebase):

```
Auth & Users
  [x] POST   /auth/login       -- unified: checks users first, then customers; returns principal_type
  [ ] POST   /auth/logout
  [x] POST   /users
  [x] PATCH  /users/{id}
  [x] PATCH  /users/{id}/status
  [x] DELETE /users/{id}

Routes
  [x] POST   /routes
  [x] PATCH  /routes/{id}
  [x] PATCH  /routes/{id}/salesman
  [x] DELETE /routes/{id}

Customers
  [x] POST   /customers        -- now requires a `password` field (customer's portal login)
  [x] PATCH  /customers/{id}   -- can now also toggle `login_enabled`
  [x] PATCH  /customers/{id}/status
  [x] PATCH  /customers/{id}/location
  [x] DELETE /customers/{id}

Sales Orders
  [x] POST   /orders                 -- shared: staff sends customer_id, customer token forces it from token
  [x] PATCH  /orders/{id}            -- pending-only, ownership-checked
  [x] POST   /orders/{id}/cancel     -- pending-only, ownership-checked
  [x] GET    /orders                 -- scoped: customer sees own, salesman sees own route's customers
  [x] GET    /orders/{id}
  [ ] POST   /orders/{id}/approve    -- next up; will need Inventory (Amin) for stock reservation
  [ ] POST   /orders/{id}/load       -- needs Inventory (Amin)

Invoices
  [x] POST   /orders/{id}/invoice   -- staff-only, requires order status approved/loaded, one invoice per order
  [x] POST   /invoices/{id}/cancel  -- staff-only, only while payment_status is unpaid (soft delete)

Delivery / Driver
  [x] POST   /deliveries              -- one delivery per invoice
  [x] POST   /deliveries/{id}/start   -- pending -> out_for_delivery
  [x] POST   /deliveries/{id}/arrive  -- records GPS/timestamp only, no status change
  [x] POST   /deliveries/{id}/complete -- creates a cleared Payment, recomputes invoice.payment_status,
                                          sets order.status = delivered. status field in request is
                                          restricted to "delivered" (detailed outcomes are a documented
                                          v2 schema gap, not built - see database_schema_docs.markdown note 10)
  [x] POST   /deliveries/{id}/fail    -- out_for_delivery -> failed only

Payments
  [ ] POST   /payments
  [ ] POST   /payments/{id}/verify
  [ ] POST   /payments/{id}/bounce

Returns
  [ ] POST   /returns
  [ ] POST   /returns/{id}/approve
  [ ] POST   /returns/{id}/reject
  [ ] POST   /returns/{id}/complete

File Uploads
  [ ] POST   /files
```

**Build order for this track:**
1. Auth & Users (do this first — everyone needs it)
2. Routes → Customers
3. File Uploads (small, independent — build whenever convenient, needed by Deliveries/Returns later)
4. Sales Orders (needs Customers done on this track, and Products + Price Lists + Warehouses from Amin's track)
5. Invoices (needs Sales Orders)
6. Deliveries (needs Invoices, Vehicles from Amin's track)
7. Payments (needs Invoices)
8. Returns (needs Invoices, Warehouses from Amin's track)

---

## 4. Shared Dependency Points (Where the Two Tracks Meet)

These are the moments where one track needs something from the other. Flag it in standup/chat when your side is ready.

| Ibrahim needs from Amin | For |
|---|---|
| Products + Price Lists ready | Sales Orders (to fetch price and GST rate) |
| Warehouses ready | Sales Orders, Deliveries, Returns (state for GST, stock location) |
| Vehicles ready | Deliveries (vehicle assignment) |
| Inventory APIs ready | Sales Order approve/load steps (stock reservation) |

| Amin needs from Ibrahim | For |
|---|---|
| Invoices, Payments, Returns ready | Tally Sync (nothing to sync until these exist) |

**Suggested rule:** build and merge master data (Categories, Brands, Products, Price Lists, Warehouses) in the **first week**, since almost everything downstream depends on it. Everything else can proceed in parallel after that.

---

## 5. Cross-Cutting Rules (Applies to Both Tracks)

From `api_reference.md` Section 19 — follow these regardless of which track you're on:

- The server always calculates prices, GST, totals, stock levels, and payment status. Never trust these values from the frontend.
- Stock only changes through named actions (order approve/load, purchase receive, return complete, inventory adjustment/transfer) — never a direct stock edit.
- Deletes are soft deletes (`deleted_at`), never a real row delete.
- Every write to a financial or stock table should also create an Audit Log entry — build a shared helper/service for this early so both tracks call the same function instead of writing it twice.
- Files are uploaded via `POST /files` first, then the returned path is passed into the business API.

**Recommendation:** since the Audit Log and file-upload helper are used by both tracks, whoever finishes Auth & Users first should build these two shared pieces before the tracks fully diverge, so neither person duplicates the work.

---

## 6. Progress Tracking

Use this checklist format (copy into your issue tracker or update here) to track status per domain:

```
Track 1 — Amin
[x] Categories & Brands
[x] Products             (GET added by Ibrahim's track)
[x] Price Lists          (item shape changed to discount_percent)
[x] Warehouses           (built by Ibrahim's track - do not rebuild)
[ ] Suppliers
[ ] Vehicles
[ ] Inventory
[ ] Purchases
[ ] Tally Sync

Track 2 — Ibrahim
[x] Auth & Users          (login done; logout still open)
[x] Routes
[x] Customers
[ ] File Uploads
[x] Sales Orders          (approve/load still open, blocked on Inventory)
[x] Invoices
[x] Delivery / Driver
[ ] Payments
[ ] Returns
```

*Last updated: 2026-07-20, after building Deliveries (`features/delivery` branch, not yet merged to `develop`). Invoices already merged.*

---

*Update the checklist above as domains are completed. If the team grows or ownership changes, update the tables in Sections 2 and 3 to match.*
