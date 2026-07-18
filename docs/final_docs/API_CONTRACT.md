# API Contract Design Document
## FMCG Distribution ERP — Phase 1

| | |
|---|---|
| **Document Type** | API Contract Specification |
| **Based on** | `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/database_docs/PHASE1_SIMPLE_SCHEMA.md` |
| **Version** | v1 |
| **Status** | Draft — for engineering sign-off before implementation starts |
| **Format standard** | REST, following [OpenAPI 3.x](https://swagger.io/specification/) conventions — the industry-standard way to describe HTTP APIs, machine-readable and human-readable at once |

### Why this document exists (and why it looks like this)
This is the document that lets backend (FastAPI) and frontend (Next.js + React Native) work **in parallel without blocking each other**. The industry rule this follows is called **contract-first (or API-first) design**: the contract is written and agreed *before* implementation, both sides code against it, and it becomes the single source of truth that both sides can be checked against — instead of the frontend reverse-engineering whatever the backend happens to return.

FastAPI has one major advantage here: because we define request/response shapes as Pydantic models, **the actual running backend auto-generates a live OpenAPI spec at `/docs` and `/openapi.json`** — this document is the design source, and once built, the generated spec becomes the enforced, always-accurate version of it. That's how "keeping it correct" is solved industrially: the contract isn't just a doc that can drift, it's regenerated from the real code.

---

## 1. Conventions (apply to every endpoint below)

### 1.1 Base URL & versioning
```
https://api.<yourdomain>.com/api/v1/...
```
Version in the URL path (`/api/v1/`), not a header — simplest, most visible option, standard for APIs at this scale. Only bump to `v2` if a breaking change is unavoidable; additive changes (new optional field, new endpoint) never require a version bump.

### 1.2 Resource naming
- Plural nouns, `kebab-case` for multi-word paths: `/orders`, `/order-items`, `/dispatch-items`.
- Nouns, not verbs: `POST /orders`, not `/create-order`. The HTTP method carries the verb.
- Nesting only one level deep, only when a resource can't exist without its parent: `/orders/{order_id}/items`. Never `/customers/{id}/orders/{id}/items/{id}/...` — flatten past one level and use query filters instead: `/order-items?order_id=...`.

### 1.3 HTTP methods
| Method | Use |
|---|---|
| `GET` | Read, never mutates |
| `POST` | Create a new resource, or trigger an action that isn't a pure CRUD op (e.g. `POST /orders/{id}/approve`) |
| `PATCH` | Partial update of an existing resource |
| `PUT` | Not used in this API — `PATCH` covers all our update cases; avoids ambiguity |
| `DELETE` | Not used on business data (PRD Rule #2 — nothing is overwritten/deleted, only status-transitioned). Reserved only for genuinely disposable data (e.g. a draft cart). |

### 1.4 State-transition actions
Business objects move through a lifecycle (Order: pending → approved → …). These are **not** `PATCH /orders/{id}` with a status field (too easy to bypass business rules) — they're explicit action endpoints:
```
POST /orders/{id}/approve
POST /orders/{id}/reject
POST /dispatches/{id}/lock
POST /payments/{id}/verify
```
This matches Architecture doc §8.3 — every one of these writes a `status_history` row server-side, and the endpoint name makes the allowed transition self-documenting instead of hidden inside a generic update.

### 1.5 Standard response envelope
**Success (single resource):**
```json
{ "data": { ... } }
```
**Success (list, always paginated):**
```json
{
  "data": [ ... ],
  "meta": { "page": 1, "page_size": 20, "total": 134 }
}
```
**Error (consistent shape everywhere, per Architecture §8.4):**
```json
{
  "error_code": "CREDIT_LIMIT_EXCEEDED",
  "message": "Customer credit limit exceeded by ₹4,200 — order can still be placed, flagged for review.",
  "details": { "field": "customer_id" }
}
```
`error_code` is a stable, machine-checkable string (SCREAMING_SNAKE_CASE) — frontend code branches on this, never on the human-readable `message`.

### 1.6 Pagination, filtering, sorting
- Pagination: `?page=1&page_size=20` (defaults: page=1, page_size=20, max 100).
- Filtering: plain query params matching field names — `?status=pending&customer_id=...`.
- Sorting: `?sort=-created_at` (`-` prefix = descending).

### 1.7 HTTP status codes (used consistently)
| Code | Meaning |
|---|---|
| 200 | OK (GET, PATCH, action endpoints) |
| 201 | Created (POST that creates a resource) |
| 400 | Bad request — validation failure |
| 401 | Not authenticated (missing/invalid token) |
| 403 | Authenticated but not permitted (wrong role) |
| 404 | Resource not found |
| 409 | Conflict — e.g. trying to lock an already-locked dispatch |
| 422 | Semantically invalid (passes schema validation, fails business rule) |
| 500 | Server error |

### 1.8 Authentication
Every endpoint except login/OTP requires:
```
Authorization: Bearer <JWT>
```
Two separate token audiences (Architecture §8.1): staff tokens (`auth` module) and customer tokens (`customers` module) — a customer token can never authenticate a staff-only endpoint, enforced server-side, not just hidden in UI.

### 1.9 Idempotency on money/state-changing POSTs
Financially significant POSTs (`/dispatches/{id}/generate-invoice`, `/payments`) accept an optional `Idempotency-Key` header — if the same key is sent twice (e.g. a mobile app retry after a timeout), the server returns the original result instead of creating a duplicate. Standard practice for any API that touches money.

### 1.10 Role permission notation
Each endpoint below lists which roles may call it, matching `users.role` from the schema: `admin`, `sales_manager`, `salesman`, `warehouse`, `accountant`, `driver`, `cashier`, plus `customer` (separate token audience).

---

## 2. Endpoints by Module

*(Each module below maps 1:1 to the backend modules in `docs/ARCHITECTURE.md` §5.2, and to the tables in `docs/database_docs/PHASE1_SIMPLE_SCHEMA.md`.)*

### 2.1 `auth` — Staff login
| Method | Path | Purpose | Roles |
|---|---|---|---|
| POST | `/auth/otp/request` | Send OTP to staff mobile | public |
| POST | `/auth/otp/verify` | Verify OTP, return JWT access + refresh token | public |
| POST | `/auth/refresh` | Exchange refresh token for new access token | any staff |
| POST | `/auth/logout` | Revoke current session | any staff |
| GET | `/auth/me` | Current logged-in user's profile + role | any staff |

### 2.2 `customers` — Customer profile & login
| Method | Path | Purpose | Roles |
|---|---|---|---|
| POST | `/customer-auth/otp/request` | Send OTP to customer mobile | public |
| POST | `/customer-auth/otp/verify` | Verify OTP, return customer JWT | public |
| GET | `/customers` | List customers (filter by salesman, status) | admin, sales_manager, salesman |
| POST | `/customers` | Register new customer | admin, sales_manager |
| GET | `/customers/{id}` | Customer detail | admin, sales_manager, salesman, customer (self) |
| PATCH | `/customers/{id}` | Update customer profile/credit limit/salesman assignment | admin, sales_manager |
| GET | `/customers/{id}/outstanding` | Outstanding balance (read-only, synced from Tally) | admin, accountant, customer (self) |

### 2.3 `catalog` — Products
| Method | Path | Purpose | Roles |
|---|---|---|---|
| GET | `/products` | List/search/filter catalogue (`?category=&brand=&q=`) | any authenticated |
| GET | `/products/{id}` | Product detail | any authenticated |
| POST | `/products` | Add product | admin |
| PATCH | `/products/{id}` | Edit product (price, GST%, active flag, etc.) | admin |

*(Price/GST/discount are always read from here server-side when pricing an order — never trusted from any client, per Architecture §8.2.)*

### 2.4 `orders` — Order lifecycle
| Method | Path | Purpose | Roles |
|---|---|---|---|
| POST | `/orders` | Place a new order (server computes pricing/GST/credit alert) | customer, salesman |
| GET | `/orders` | List orders (filter by status/customer/salesman/date) | admin, sales_manager, salesman, customer (own only) |
| GET | `/orders/{id}` | Order detail incl. items | admin, sales_manager, salesman, customer (own only) |
| PATCH | `/orders/{id}/items` | Edit line items (only while status=pending) | customer, salesman |
| POST | `/orders/{id}/approve` | Approve order | admin, sales_manager, salesman |
| POST | `/orders/{id}/reject` | Reject order, with reason | admin, sales_manager, salesman |
| GET | `/orders/{id}/history` | Status history timeline | admin, sales_manager, salesman, customer (own only) |

### 2.5 `planning` — Vehicles & trips
| Method | Path | Purpose | Roles |
|---|---|---|---|
| GET / POST | `/vehicles` | List / add vehicle | admin |
| GET / POST | `/trips` | List / create trip (vehicle + driver + date) | admin, sales_manager |
| POST | `/trips/{id}/orders` | Attach an approved order to a trip | admin, sales_manager |
| DELETE | `/trips/{id}/orders/{order_id}` | Detach order from trip (only pre-dispatch) | admin, sales_manager |
| POST | `/trips/{id}/dispatch` | Mark trip dispatched (locks its orders' dispatches) | admin, warehouse |
| GET | `/trips/{id}` | Trip detail incl. attached orders | admin, sales_manager, driver (own trip) |

### 2.6 `warehouse` — Dispatch & loading
| Method | Path | Purpose | Roles |
|---|---|---|---|
| GET | `/dispatches` | List dispatches (today's loading queue, filter by trip/status) | admin, warehouse |
| GET | `/dispatches/{id}` | Dispatch detail incl. items (ordered vs loaded) | admin, warehouse |
| PATCH | `/dispatches/{id}/items` | Enter loaded quantity + reason code for variance | warehouse |
| POST | `/dispatches/{id}/lock` | Lock dispatch — no further loading edits (PRD Rule #6) | admin, warehouse |
| POST | `/dispatches/{id}/generate-invoice` | Trigger Tally invoice generation (async via Celery) | accountant, admin |

### 2.7 `accounting` — Invoice references (Tally-backed)
| Method | Path | Purpose | Roles |
|---|---|---|---|
| GET | `/invoices` | List invoice references (filter by sync status, customer) | admin, accountant, customer (own only) |
| GET | `/invoices/{id}` | Invoice detail + PDF URL + Tally sync status | admin, accountant, customer (own only) |
| POST | `/invoices/{id}/retry-sync` | Manually retry a failed Tally sync | admin, accountant |

### 2.8 `delivery`
| Method | Path | Purpose | Roles |
|---|---|---|---|
| GET | `/deliveries` | List deliveries (driver's assigned queue, or all for admin) | admin, driver (own only) |
| GET | `/deliveries/{id}` | Delivery detail | admin, driver (own), customer (own) |
| POST | `/deliveries/{id}/complete` | Mark delivered/partial/failed + upload proof (photo/signature) | driver |
| POST | `/deliveries/{id}/expenses` | Log trip expense (fuel/toll/misc) | driver |

### 2.9 `payment`
| Method | Path | Purpose | Roles |
|---|---|---|---|
| POST | `/payments` | Record a collected payment (cash/UPI/cheque) | driver, cashier |
| GET | `/payments` | List payments (filter by status/customer) | admin, accountant, cashier |
| GET | `/payments/{id}` | Payment detail | admin, accountant, cashier, customer (own) |
| POST | `/payments/{id}/verify` | Verify/reject a submitted collection | cashier |
| POST | `/payments/{id}/post` | Mark posted to Tally ledger (after Tally sync confirms) | accountant, system |

### 2.10 `notifications`
| Method | Path | Purpose | Roles |
|---|---|---|---|
| GET | `/notifications` | List current user's notifications | any authenticated |
| PATCH | `/notifications/{id}/read` | Mark as read | any authenticated |
| GET / PATCH | `/notification-preferences` | View/update channel opt-ins | any authenticated |

### 2.11 Realtime (WebSocket, per Architecture §3.2)
```
WS /ws/orders/{order_id}      — live status updates for one order (customer, salesman)
WS /ws/dispatch-queue         — live today's-queue updates (warehouse)
WS /ws/delivery/{driver_id}   — live assigned-delivery updates (driver)
```

---

## 3. Example: Full Request/Response Shape

To fix the pattern every endpoint follows, one worked example — the core "place an order" flow:

**`POST /api/v1/orders`**

Request:
```json
{
  "items": [
    { "product_id": "b3f1...", "quantity": 24 },
    { "product_id": "a91e...", "quantity": 10 }
  ]
}
```
*(Note: no price fields. Client never sends price — Architecture §8.2.)*

Response `201 Created`:
```json
{
  "data": {
    "id": "e77c...",
    "customer_id": "d21a...",
    "salesman_id": "9fb2...",
    "status": "pending",
    "order_date": "2026-07-18T10:15:00Z",
    "total_amount": 4820.00,
    "items": [
      { "product_id": "b3f1...", "quantity": 24, "price": 180.00, "discount_percent": 0, "line_total": 4320.00 },
      { "product_id": "a91e...", "quantity": 10, "price": 50.00, "discount_percent": 0, "line_total": 500.00 }
    ]
  }
}
```

If credit limit is exceeded (still succeeds — PRD Rule #3, advisory only):
```json
{
  "data": { "...same as above..." },
  "warnings": [
    { "code": "CREDIT_LIMIT_EXCEEDED", "message": "Order exceeds customer credit limit by ₹1,200 — flagged for admin review." }
  ]
}
```

This is the one deliberate addition to the envelope from §1.5: a `warnings` array for exactly this kind of decision-support-not-decision-making case (PRD §1.3) — the request still succeeds (201), the object still gets created, but the caller is told something needs a human's attention.

---

## 4. How this stays correct over time (industry practice)

This is the part that matters more than the endpoint list itself — a contract document is only useful if it doesn't drift from reality. The standard practice:

1. **This document is the design-time contract** — written and reviewed before code, so backend and frontend agree on shape before either starts building.
2. **FastAPI generates the real contract automatically** once built — every route's Pydantic request/response models produce a live OpenAPI spec at `/openapi.json` and a browsable UI at `/docs`. That generated spec is the **actual source of truth once implementation starts** — if this document and the running API ever disagree, the running API's generated spec wins, and this document gets updated to match (not the other way around).
3. **Frontend codegen from the spec** — your brother's Next.js app (and the React Native apps) can generate typed API clients directly from `/openapi.json` (e.g. `openapi-typescript` for both Next.js and React Native, since they share the same TypeScript tooling). This is the industry mechanism that makes "keeping it correct" enforceable rather than a matter of discipline — a breaking backend change breaks the client's type-check, not just its runtime.
4. **Never change a shipped field's meaning or remove a field** — only add optional fields, or introduce a new versioned endpoint. This is what "additive changes don't need a version bump" (§1.1) depends on.
5. **This document gets revisited only when a new module/feature is added** (e.g. Phase 2's Warehouse app expansion) — not for every minor implementation detail, which lives in the generated spec instead.

---

## Document Traceability

| Section | Source |
|---|---|
| Modules, roles | `docs/ARCHITECTURE.md` §5.2, §8.1 |
| Resources, fields | `docs/database_docs/PHASE1_SIMPLE_SCHEMA.md` |
| Business rules behind specific endpoints (advisory alerts, dispatch lock, order-change tracking) | `docs/PRD.md` §7 |
| Tally-async flow (`generate-invoice`, `retry-sync`) | `docs/ARCHITECTURE.md` §6.2–6.3 |

**Next step:** with PRD, schema, architecture, and API contract in place, the remaining pre-code step is **project scaffolding** — repo structure, FastAPI base app wired to these route modules, Next.js base app, React Native base app, and CI basics — after which implementation can start sprint-by-sprint per `docs/phase_1_roadmap.md`.
