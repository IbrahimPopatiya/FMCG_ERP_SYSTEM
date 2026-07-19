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

## 2. Track 1 — Amin: Catalog & Supply

| # | Domain | APIs (from `api_reference.md`) | Tables Owned |
|---|---|---|---|
| 1 | Categories & Brands | `POST/PATCH/DELETE /categories`, `POST/PATCH/DELETE /brands` | CATEGORIES, BRANDS |
| 2 | Products | `POST/PATCH /products`, `PATCH /products/{id}/status`, `DELETE /products/{id}` | PRODUCTS |
| 3 | Price Lists | `POST/PATCH/DELETE /price-lists`, `POST/PATCH/DELETE /price-lists/{id}/items` | PRICE_LISTS, PRICE_LIST_ITEMS |
| 4 | Warehouses | `POST/PATCH /warehouses`, `PATCH /warehouses/{id}/status`, `DELETE /warehouses/{id}` | WAREHOUSES |
| 5 | Suppliers | `POST/PATCH /suppliers`, `PATCH /suppliers/{id}/status`, `DELETE /suppliers/{id}` | SUPPLIERS |
| 6 | Vehicles | `POST/PATCH /vehicles`, `PATCH /vehicles/{id}/driver`, `PATCH /vehicles/{id}/status`, `DELETE /vehicles/{id}` | VEHICLES |
| 7 | Inventory | `POST /inventory/adjustments`, `POST /inventory/transfers`, `GET /inventory` | INVENTORY, INVENTORY_MOVEMENTS |
| 8 | Purchases | `POST/PATCH /purchases`, `POST /purchases/{id}/receive`, `POST /purchases/{id}/cancel` | PURCHASES, PURCHASE_ITEMS |
| 9 | Tally Sync | `POST /tally/sync/invoices`, `POST /tally/sync/payments`, `POST /tally/sync/returns`, `POST /tally/retry/{entityType}/{id}` | (reads INVOICES, PAYMENTS, RETURNS) |

**Build order for this track:**
1. Categories & Brands → Products → Price Lists (catalog must exist before pricing)
2. Warehouses → Suppliers → Vehicles (independent, can be done in any order)
3. Inventory (needs Products + Warehouses done)
4. Purchases (needs Suppliers + Warehouses + Inventory done)
5. Tally Sync (last — needs Invoices/Payments/Returns to exist, which is Ibrahim's track)

---

## 3. Track 2 — Ibrahim: Selling & Operations

| # | Domain | APIs (from `api_reference.md`) | Tables Owned |
|---|---|---|---|
| 1 | Auth & Users | `POST /auth/login`, `POST /auth/logout`, `POST/PATCH /users`, `PATCH /users/{id}/status`, `DELETE /users/{id}` | USERS |
| 2 | Routes | `POST/PATCH /routes`, `PATCH /routes/{id}/salesman`, `DELETE /routes/{id}` | ROUTES |
| 3 | Customers | `POST/PATCH /customers`, `PATCH /customers/{id}/status`, `PATCH /customers/{id}/location`, `DELETE /customers/{id}` | CUSTOMERS |
| 4 | Sales Orders | `POST/PATCH /orders`, `POST /orders/{id}/approve`, `POST /orders/{id}/load`, `POST /orders/{id}/cancel` | SALES_ORDERS, SALES_ORDER_ITEMS |
| 5 | Invoices | `POST /orders/{id}/invoice`, `POST /invoices/{id}/cancel` | INVOICES |
| 6 | Delivery / Driver | `POST /deliveries`, `POST /deliveries/{id}/start`, `.../arrive`, `.../complete`, `.../fail` | DELIVERIES |
| 7 | Payments | `POST /payments`, `POST /payments/{id}/verify`, `POST /payments/{id}/bounce` | PAYMENTS |
| 8 | Returns | `POST /returns`, `.../approve`, `.../reject`, `.../complete` | RETURNS, RETURN_ITEMS |
| 9 | File Uploads | `POST /files` | (object storage only, no table) |

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
[ ] Categories & Brands
[ ] Products
[ ] Price Lists
[ ] Warehouses
[ ] Suppliers
[ ] Vehicles
[ ] Inventory
[ ] Purchases
[ ] Tally Sync

Track 2 — Ibrahim
[ ] Auth & Users
[ ] Routes
[ ] Customers
[ ] File Uploads
[ ] Sales Orders
[ ] Invoices
[ ] Delivery / Driver
[ ] Payments
[ ] Returns
```

---

*Update the checklist above as domains are completed. If the team grows or ownership changes, update the tables in Sections 2 and 3 to match.*
