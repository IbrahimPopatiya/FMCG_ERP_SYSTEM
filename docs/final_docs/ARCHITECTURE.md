# System Architecture Document
## FMCG Distribution ERP — Phase 1

| | |
|---|---|
| **Document Type** | System/Software Architecture Specification |
| **Based on** | `docs/PRD.md` (Product), `docs/database_docs/PHASE1_SIMPLE_SCHEMA.md` (Data) |
| **Version** | 1.0 |
| **Status** | Draft |
| **Structure used** | Adapted from **arc42** (the industry-standard template for architecture docs, used widely because it answers the questions engineers actually ask, in the order they ask them) |

### Why this document exists (and why it's structured this way)
A PRD says *what* to build and *why*. A schema says *what data looks like*. Neither says **how the pieces of software actually talk to each other, where each concern lives, or what happens when something fails.** That's this document's job — it's the thing you and your brother (and anyone who joins later) read once to understand the whole system's shape before touching code. Every section below answers one specific question an engineer would ask before starting implementation.

We use **arc42**, a widely-adopted architecture documentation template (originated by Gernot Starke / Peter Hruschka, standard in German and increasingly global software engineering practice) because it's lightweight — 12 sections, skip what doesn't apply — and organized around real decisions instead of academic diagram categories. We've trimmed it to what actually matters for a project this size.

---

## 1. Introduction & Goals

### 1.1 What this system does
Digitizes the order-to-cash flow for a single FMCG distribution shop: Customer places an order → Salesman/Admin approves → Warehouse dispatches → Invoice generated in Tally → Delivery → Payment collected. Full detail: `docs/PRD.md`.

### 1.2 Architecture goals, in priority order
For a single shop with ≤1000 customers, these are ranked deliberately — don't over-invest in the bottom ones:

1. **Simplicity / maintainability** — two developers (you + your brother) must be able to hold the whole system in their heads. This beats theoretical scalability every time at this size.
2. **Correctness of money and stock-adjacent data** — orders, invoices, payments must never be lost, double-counted, or silently overwritten (per PRD Rule #2).
3. **Never block on Tally** — Tally being closed/offline must never stop someone from placing an order.
4. **Reasonable responsiveness** — PRD's 2-second target for catalogue/order actions. Not a high-scale performance goal, just "doesn't feel slow."
5. **Room to grow, not room pre-built** — the schema and this architecture should not actively block scaling later (multi-branch, more integrations), but we don't build for that scale now.

### 1.3 Explicit non-goals for Phase 1
- High concurrency / thousands of simultaneous users (not needed at this scale).
- Multi-region, multi-branch, or high-availability clustering.
- Replacing Tally as the accounting system of record.

---

## 2. Constraints

| Constraint | Detail | Source |
|---|---|---|
| Team | 2 developers: backend+mobile (you), frontend (your brother) | team reality |
| Backend language | Python (FastAPI) — chosen because it's your strongest language | stack decision |
| Frontend | Next.js/React — your brother's strongest stack | stack decision |
| Mobile | React Native (Expo), single codebase, role-based UI, offline-first (Expo SQLite/WatermelonDB) | PRD §5, §9 |
| External system | Tally Prime — must remain system of record for Inventory/Ledger/GST/Invoice numbering; connects via XML API (ODBC fallback) | PRD §4.3, §11 |
| Deployment environment | Client's local network/middleware host must be able to reach Tally's XML/ODBC interface | PRD §11 |
| Scale ceiling | ≤1000 customers, single shop, single warehouse | product decision |

---

## 3. System Scope & Context

### 3.1 Business context — who/what the system talks to

```
                    ┌──────────────────────┐
   Retailer/Shop  → │                       │ ← Salesman/Warehouse/
   (Customer App)   │                       │    Driver/Cashier
                     │   FMCG ERP Backend    │    (ERP Mobile App)
   Admin/Sales Mgr → │      (FastAPI)        │
   /Accountant       │                       │
   (Next.js Admin) → │                       │
                     └──────────┬────────────┘
                                │ XML API / ODBC
                                ▼
                     ┌──────────────────────┐
                     │   Tally Prime         │
                     │  (existing, external, │
                     │   unmodified)         │
                     └──────────────────────┘
```

### 3.2 Technical context — protocols in play

| From | To | Protocol | Notes |
|---|---|---|---|
| Customer App (React Native) | Backend | HTTPS/REST (+ WebSocket for live status) | Public-facing, OTP-authenticated |
| ERP Mobile App (React Native) | Backend | HTTPS/REST (+ WebSocket) | Staff-authenticated, offline-first sync |
| Admin Web (Next.js) | Backend | HTTPS/REST (+ WebSocket) | Staff-authenticated |
| Backend | PostgreSQL | SQL (SQLModel/SQLAlchemy) | Primary data store |
| Backend | Redis | Redis protocol | Cache + Celery broker |
| Backend (Integration module only) | Tally Prime | XML over HTTP, or ODBC fallback | Only place in the whole system allowed to know Tally exists |
| Celery workers | Tally Prime | via Integration module | Async, retry-safe |

---

## 4. Solution Strategy

The core architectural decisions, and why:

1. **One backend, one API, three clients.** FastAPI is the single source of truth for business logic. The Customer app, ERP mobile app, and Admin dashboard are all "dumb" clients calling the same REST API — no client re-implements pricing, GST, or credit logic (PRD Rule #4: nothing client-side is trusted).
2. **Layered/modular monolith, not microservices.** One deployable FastAPI application, internally organized into modules mirroring the schema's domains (auth, customers, catalog, orders, planning, warehouse, accounting, delivery, payment). Microservices would add network calls, deployment complexity, and operational overhead this team and this scale don't need. A modular monolith gets you clean separation *inside* one codebase, with the option to split a module out later if it ever justifies it.
3. **Async queue isolates Tally.** All Tally communication goes through Celery + Redis, never inline in a request. If Tally is offline, orders/invoices queue and retry — nothing in the customer-facing flow ever waits on Tally (PRD §10, Availability).
4. **Flat schema, no premature abstraction.** Matches `PHASE1_SIMPLE_SCHEMA.md` — 14 tables, no RBAC tables, no multi-price-lists, no polymorphic audit log. Architecture follows data: fewer moving parts end to end.
5. **Contract-first development.** Section 8 (API design) is written and agreed before implementation starts, so backend (you) and frontend (your brother) can build in parallel without blocking each other.
6. **Offline-first only where the business needs it.** Warehouse/Driver/Salesman flows can happen with poor connectivity (a warehouse floor, a delivery route) — React Native apps queue writes locally (Expo SQLite/WatermelonDB) and sync on reconnect. The Admin dashboard and Customer app assume normal connectivity — no need to over-engineer offline support where it isn't a real problem.

---

## 5. Building Block View

### 5.1 Level 1 — Top-level components

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Customer App     │   │  ERP Mobile App   │   │  Admin Web        │
│  (React Native)   │   │  (React Native)   │   │  (Next.js)        │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                       │
         └──────────────────────┼───────────────────────┘
                                 │  REST + WebSocket (HTTPS)
                                 ▼
                  ┌───────────────────────────────┐
                  │        FastAPI Backend           │
                  │  (modular monolith, see 5.2)     │
                  └───────┬─────────────────┬───────┘
                          │                 │
                          ▼                 ▼
                 ┌────────────────┐  ┌──────────────┐
                 │  PostgreSQL      │  │  Redis          │
                 │  (data store)    │  │ (cache+queue)   │
                 └────────────────┘  └───────┬──────────┘
                                              ▼
                                     ┌──────────────────┐
                                     │  Celery Workers     │
                                     │ (async jobs, incl.  │
                                     │  Tally sync)        │
                                     └────────┬───────────┘
                                              ▼
                                     ┌──────────────────┐
                                     │  Tally Prime         │
                                     │  (external, via XML) │
                                     └──────────────────┘
```

### 5.2 Level 2 — Backend internal modules

One FastAPI project, organized by business domain (mirrors the schema, not a generic MVC split):

| Module | Owns | Talks to Tally? |
|---|---|---|
| `auth` | Staff login/session (JWT), OTP | No |
| `customers` | Customer profiles, OTP login | No |
| `catalog` | Products, pricing | No |
| `orders` | Orders, order items, approval | No |
| `planning` | Vehicles, trips, trip-order assignment | No |
| `warehouse` | Dispatches, dispatch items, load variance | No |
| `accounting` | Invoice **references** (not real invoices — see below) | No (reads via `integration`) |
| `delivery` | Delivery status, proof of delivery | No |
| `payment` | Payment collection, verification | No |
| `integration` | **The only module that talks to Tally.** XML/ODBC calls, retry queue, sync status | Yes — exclusively |
| `notifications` | Push/SMS/WhatsApp sends, triggered by domain events | No |
| `shared` | Common utilities: DB session, auth dependency, status_history writer | No |

**Rule enforced by this structure:** if any module other than `integration` imports something Tally-related, that's an architecture violation — same rule your PRD already states in §9.

### 5.3 Level 3 — Example: Order module internals
- `models.py` — SQLModel classes (`Order`, `OrderItem`) — maps 1:1 to schema tables
- `schemas.py` — Pydantic request/response models (the API contract shapes)
- `service.py` — business logic (pricing calc, status transitions, credit-limit *alerting*, never blocking per PRD Rule #3)
- `router.py` — FastAPI route handlers, thin — call `service.py`, no logic in routes
- `events.py` — emits domain events (`OrderApproved`, etc.) that `notifications` and `status_history` subscribe to

Every module follows this same 5-file shape. Predictability across modules matters more than any one module's internal elegance.

---

## 6. Runtime View — Key Scenarios

### 6.1 Place an order (Customer App)
```
Customer App → POST /orders → orders.router → orders.service
  → validate items against catalog.service (server-side price/GST/discount)
  → check customer credit via customers.service (ADVISORY ONLY — never blocks, PRD Rule #3)
  → write Order + OrderItems + status_history row (status=PENDING)
  → emit OrderCreated event → notifications module sends confirmation
  → return 201 with order id
```
No Tally involvement at this stage — matches "Option 1: Order Only" integration approach already agreed for Phase 1 (see `docs/second_chat.md`).

### 6.2 Generate invoice (Accountant, Admin Web)
```
Admin Web → POST /dispatches/{id}/generate-invoice
  → warehouse.service confirms dispatch is LOCKED
  → accounting.service creates local invoice reference row (status=WAITING)
  → enqueues Celery task → integration.tally_client sends XML "create invoice"
  → [async, may retry if Tally offline]
  → on success: invoice reference updated with Tally invoice number + PDF, status=SYNCED
  → emit InvoiceGenerated event → notifications informs customer, delivery module unlocked
```
This is the one flow where async matters most — it's exactly why Tally calls never happen inline in a request.

### 6.3 Tally offline scenario
```
Celery task fails (connection refused) → task retried with backoff (e.g. 1m, 5m, 15m)
  → invoice reference stays status=WAITING
  → alert raised to Accountant/Admin: "Invoice sync pending" (visible in Admin dashboard)
  → order placement, dispatch, delivery all continue normally — nothing blocked
```

---

## 7. Deployment View

Kept intentionally simple for this scale — one environment, no orchestration platform needed yet.

```
┌─────────────────────────────────────────────┐
│              Single server / VM                │
│                                                  │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │ FastAPI app  │  │ Celery       │  │ Redis      │ │
│  │ (uvicorn/    │  │ worker(s)    │  │            │ │
│  │  gunicorn)   │  │              │  │            │ │
│  └────────────┘  └────────────┘  └──────────┘ │
│  ┌────────────┐                                  │
│  │ PostgreSQL   │                                  │
│  └────────────┘                                  │
└─────────────────────────────────────────────┘
         ▲                              ▲
         │ HTTPS                        │ XML/ODBC (local network)
         │                              │
┌──────────────────┐          ┌──────────────────┐
│  Next.js Admin      │          │  Client's Tally     │
│  (Vercel or same     │          │  Prime installation  │
│  server)             │          │  (on client's LAN)   │
└──────────────────┘          └──────────────────┘

  React Native apps (Customer, ERP Mobile) — distributed via
  Play Store / App Store, talk to the server over HTTPS
```

**Key constraint:** since Tally lives on the client's local network (PRD §11), the backend (or at minimum the `integration` module / a lightweight middleware bridge) needs network reachability to that LAN — either the server is hosted on-premise, or a small local relay service forwards Tally calls. This is a deployment decision to confirm with the client before go-live, not a Phase-1 blocker.

**Environments:** `local` (dev, docker-compose: Postgres+Redis+API), `staging` (pilot testing), `production`. No need for more than this at current scale.

---

## 8. Cross-Cutting Concepts

### 8.1 Authentication & Authorization
- **Staff (auth module):** mobile-number + OTP → JWT access token (short-lived) + refresh token. `role` column on `users` (per simplified schema) drives what each endpoint allows — enforced via a FastAPI dependency (`require_role("admin")`), not by hiding UI.
- **Customers:** separate OTP login flow, JWT scoped to customer-only endpoints. Customers can never hit staff endpoints, enforced at the router level, not just by not showing the button.

### 8.2 Server-side trust boundary (PRD Rule #4)
Every price, discount %, GST, and credit check is computed in `catalog.service` / `customers.service` on the backend. Clients send product IDs and quantities — never prices. Any price sent by a client is ignored and recalculated.

### 8.3 Audit trail
Every state-changing action on `orders`, `dispatches`, `deliveries`, `payments` writes a `status_history` row (per schema) via a shared `shared.history.record_transition()` helper — one call, same shape, everywhere. This is what keeps PRD's auditability requirement (§10) from becoming inconsistent across modules.

### 8.4 Error handling & idempotency
- All Tally-bound Celery tasks are idempotent (retry-safe) — a task checks "is this already synced?" before acting, so a retry after a partial failure never double-creates an invoice.
- API errors return consistent shape: `{ "error_code": "...", "message": "..." }` — same contract across all endpoints so both React Native and Next.js clients handle errors uniformly.

### 8.5 Offline support (mobile only)
Warehouse/Salesman/Driver flows in the ERP Mobile App write to local Expo SQLite/WatermelonDB first, queue a sync job, and reconcile with the backend on reconnect. Conflict rule: server is always authoritative on reconnect (last-write-wins is not used for financial data — conflicting local writes are flagged for manual review, never silently merged).

### 8.6 Notifications
Domain modules emit events (`OrderApproved`, `InvoiceGenerated`, `DeliveryCompleted`, …); the `notifications` module subscribes and sends Push/SMS/WhatsApp. Domain modules never call a notification provider directly — keeps `orders.service` free of messaging-provider concerns.

---

## 9. Architecture Decisions (ADR summary)

| # | Decision | Alternative considered | Why this one |
|---|---|---|---|
| 1 | FastAPI backend | NestJS (original draft) | Team's strongest language is Python |
| 2 | Modular monolith | Microservices | Team of 2, single shop scale — microservices add ops overhead with no benefit here |
| 3 | Next.js admin dashboard | Django Admin | Dedicated frontend engineer (brother) available — real frontend beats a customized admin panel |
| 4 | Celery + Redis for Tally sync | Inline synchronous calls | Tally can be offline; must never block order placement (PRD §10 Availability) |
| 5 | Flat 14-table schema | 83-table DDD schema | Matches actual scale (≤1000 customers); avoid premature complexity |
| 6 | Single deployable backend | Separate service per domain | Same reasoning as #2 |
| 7 | React Native (Expo) for mobile | Flutter | Neither developer knows Dart/Flutter; React Native reuses the team's existing React/JS knowledge (your brother's frontend skill transfers directly), and Expo SQLite/WatermelonDB still gives real offline storage — unlike a wrapped-website (Capacitor) approach, which was also considered and rejected for weaker offline reliability |
| 8 | JWT auth, role column (not full RBAC tables) | Roles/permissions tables | Handful of staff; add RBAC tables only if that changes |

---

## 10. Risks & Technical Debt (accepted for Phase 1)

| Risk/Debt | Why accepted | Revisit when |
|---|---|---|
| Single server, no HA/failover | Cost/complexity not justified at this scale | Customer count or uptime requirements grow significantly |
| No RBAC table system | `role` column is enough for current staff count | Staff roles need custom, overlapping permission sets |
| Modular monolith, not services | Simpler to build/deploy/debug for 2 devs | A specific module's load or team ownership genuinely diverges |
| Tally LAN reachability | Depends on client's on-prem setup, not fully resolved | Before production deployment — must confirm with client (PRD §11 dependency) |

---

## 11. Glossary

| Term | Meaning |
|---|---|
| Dispatch | What actually left the warehouse for an order — may differ from what was ordered |
| Invoice reference | Our local pointer to a Tally-generated invoice; Tally holds the real financial record |
| Modular monolith | One deployable application, internally split into domain modules with enforced boundaries |
| status_history | Shared table logging every status transition across orders/dispatches/deliveries/payments |
| Integration module | The one backend module permitted to talk to Tally |

---

## Document Traceability

| Section | Source |
|---|---|
| Goals, constraints | `docs/PRD.md` §1–2, §10–11 |
| Data shapes referenced throughout | `docs/database_docs/PHASE1_SIMPLE_SCHEMA.md` |
| Tally integration options | `docs/second_chat.md` |
| Stack decisions | This conversation (FastAPI/Next.js/React Native/Celery) |

**Next step:** Section 8's API-contract-first approach means the next document to write is the **API Contract** — endpoint list per module, request/response shapes — so you and your brother can start building in parallel against a shared, agreed interface.
