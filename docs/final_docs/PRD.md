# Product Requirements Document (PRD)
## FMCG Distribution ERP — Phase 1: Order-to-Invoice Digitalization Platform

| | |
|---|---|
| **Document Type** | Product Requirements Document |
| **Product** | FMCG Distributor ERP |
| **Phase Covered** | Phase 1 (of a 6-phase roadmap) |
| **Version** | 1.0 |
| **Status** | Draft for Client Sign-off |
| **Owner** | Product/Project Lead |
| **Source Documents** | All files in `docs/` — see Section 12 for full traceability |

---

## 1. Overview

### 1.1 What we're building
A connected software platform that digitizes an FMCG distributor's manual order-to-invoice process (currently run over phone/WhatsApp/paper, with an accountant re-typing everything into Tally Prime) — **without replacing Tally**. The platform automates order capture, approval, warehouse dispatch, invoice generation into Tally, delivery tracking, and payment collection.

### 1.2 Why now (Problem Statement)
The distributor's current flow is:

```
Salesman takes order (WhatsApp/Phone/Paper) → manually re-entered → godown prepares stock
→ accountant types bill into Tally → inventory reduces → driver delivers → payment collected
→ accountant enters payment in Tally
```

This produces:
- **Duplicate data entry** — the same order is written down, then re-typed, at least twice.
- **Pricing/stock errors** — no server-side validation of price, discount, or GST at order time.
- **Delayed dispatch** — no visibility into what's approved and ready to load.
- **Poor visibility** — no real-time view of order status, outstanding payments, or delivery state for the owner, salesmen, or customers.

### 1.3 Product Principle (governs every decision below)
> **This is a decision-support system, not a decision-making system.**

Where a business condition could be "blocked" by software (credit limit exceeded, stock shortage at order time), the product raises a **visible alert to the relevant human**, and never auto-rejects the transaction, unless explicitly stated otherwise. The people running the business stay in control; the software removes re-typing and gives them visibility, it doesn't gatekeep them.

### 1.4 Strategic approach: augment first, replace later
Tally Prime remains the **system of record** for Inventory, Ledger, GST, and Invoice numbering throughout Phase 1. The ERP does not attempt to become a full accounting system on day one — that is deliberately deferred to a much later phase (Phase 6), after the operational workflows (ordering, dispatch, delivery, collection) are proven and trusted. This phased approach lets the distributor adopt the platform without any risk to their existing, working accounting process.

---

## 2. Goals & Success Metrics

### 2.1 Goals for Phase 1
| Goal | How we'll know |
|---|---|
| Eliminate duplicate order entry | Every order placed on the Customer/Salesman app reaches Tally as an invoice with zero manual re-typing |
| Give real-time order visibility | Customer and salesman can see live order status (Pending → Approved → Dispatched → Invoiced → Delivered) |
| Capture accurate dispatch quantities | Every quantity variance between ordered and loaded is recorded with a reason, not silently lost |
| Close the cash loop | Every payment collected is tracked from collection → verification → posted to Tally ledger |
| Preserve full history | No business object is ever silently overwritten; every change is a new, auditable record |

### 2.2 Success Metrics / Acceptance Criteria
Phase 1 is considered successful when, for **at least one pilot customer and one pilot salesman**, the following runs end-to-end with no manual double-entry (see Section 9 of `requirements_document.md` for the full checklist):
1. Customer places an order on the mobile app.
2. Salesman/Admin approves it (including at least one demonstrated post-approval Order Change).
3. Admin plans a trip with a real vehicle/driver and attaches the order.
4. Warehouse loads the dispatch with at least one demonstrated quantity variance + reason.
5. Accountant generates a real Tally invoice in one click; invoice number and PDF appear in the customer's app.
6. Driver marks delivery complete with captured proof.
7. Payment is collected, verified, and reflected in the Tally ledger.
8. Every step is visible in the audit trail and produced the expected notification.

---

## 3. Target Users & Personas

| Persona | Role | Primary Need |
|---|---|---|
| **Retailer / Shopkeeper** | Customer | Order stock quickly, track status, see invoices/outstanding without calling anyone |
| **Salesman** | Field staff | Take/approve orders for assigned customers, see their customers' credit and history |
| **Sales Manager** | Internal | Approve orders, manage salesman-customer assignment, oversee pipeline |
| **Admin / Business Owner** | Internal | Full visibility and override authority across the whole flow |
| **Warehouse Supervisor / Loader** | Internal | Load real stock against orders, record what actually went out |
| **Accountant** | Internal | Generate Tally invoices with one click instead of retyping; verify payments |
| **Driver** | Internal | See delivery route, mark delivered/failed, collect payment, log trip expenses |
| **Cashier** | Internal | Verify cash/UPI/cheque collections before they're considered final |

---

## 4. Product Scope

### 4.1 In Scope — Phase 1
The order-to-cash cycle, end to end:

```
Customer/Salesman → Order → Approval → Trip Planning → Warehouse Dispatch
      → Invoice (generated INTO Tally) → Delivery → Payment Collection
```

Supporting capabilities: authentication & role-based permissions, customer management, product catalogue, notifications, alerts, audit trail, and baseline reporting.

### 4.2 Out of Scope — Phase 1
Deferred to later phases (see Section 8 below and Section 8 of `requirements_document.md`):
- Inventory/stock/batch/expiry management in the ERP (Tally remains authoritative).
- Purchase order and supplier management.
- Full in-house accounting/ledger engine (Tally replacement).
- AI-based demand forecasting, reorder suggestions, churn prediction.
- Multi-branch/multi-company workflow (schema reserves the fields, feature not built).
- Route optimization / GPS-based delivery sequencing.

### 4.3 Source-of-Truth Policy
| Data | Owner |
|---|---|
| Customer profile, Orders, Dispatch, Delivery, Payment records | **This ERP** |
| Product/Price catalogue | **This ERP** |
| Inventory/Stock, Customer Ledger, GST, Invoice numbering | **Tally Prime** |

---

## 5. Product Surfaces (Applications)

| Application | Platform | Users | Why separate |
|---|---|---|---|
| **Customer Ordering App** | React Native (Android/iOS) | Retailers/shopkeepers | External trust boundary, shopping-app UX |
| **ERP Mobile App** | React Native, single codebase, role-based UI | Salesman, Warehouse Supervisor, Loader, Driver, Cashier | Same login/permission system; screen shown depends on role, not a separate build |
| **Admin Web Dashboard** | Next.js (web) | Admin, Sales Manager, Accountant | Desktop-heavy workflows (approval queues, reports, invoice review, catalogue management) |
| **Tally Prime** | Existing, unmodified | Accountant (continues normal use) | System of record for inventory/ledger/GST/invoicing |

All three built surfaces talk to **one backend**, one auth/permission model — never one backend per app.

---

## 6. Features by Application

### 6.1 Customer Ordering App
1. OTP-based login.
2. Browse catalogue by category/brand with images, packing, pricing.
3. Search and filter products.
4. Add to cart and place an order.
5. Repeat a previous order in one tap.
6. Real-time order status tracking (Pending → Approved → Dispatched → Invoiced → Delivered).
7. View/download invoices once generated.
8. View outstanding balance and payment history (read-only, synced from Tally).
9. Push/WhatsApp/SMS notifications at key milestones.
10. Notification preferences and app language.

### 6.2 ERP Mobile App (role-based)
**Salesman:** view assigned customers, create orders on their behalf, approve/reject/request changes, view outstanding & history, receive credit/order-change alerts.

**Warehouse Supervisor / Loader:** today's dispatch queue by trip, enter loaded vs. ordered quantity with mandatory reason codes for shortfalls, submit change requests for approval, lock dispatch on completion.

**Driver:** view assigned trip/delivery sequence, mark Delivered/Partial/Failed with signature/photo proof, collect cash/UPI/cheque and submit for verification, log trip expenses (fuel/toll/parking).

**Cashier:** review/verify/reject submitted payment collections, view pending collections summary.

### 6.3 Admin Web Dashboard
1. Full catalogue management (Company/Brand/Category/Product/SKU/Pricing).
2. Customer management: registration, salesman/route/price-list assignment, document upload.
3. User & role management with granular permission assignment.
4. Order approval queue and full order timeline view.
5. Trip planning board: assign vehicles/drivers, attach approved orders.
6. Dispatch/loading review and invoice-generation trigger.
7. Invoice sync status monitor with manual retry.
8. Payment verification and collections dashboard.
9. Business alerts dashboard (credit, stock, sync failures).
10. Audit log viewer.
11. Sales, collections, outstanding, and order-pipeline reports.

*(Full requirement-level detail — IDs, priorities, actors — lives in `requirements_document.md`, Section 3.)*

---

## 7. Key Product/Business Rules (Cross-Cutting)

These rules override any individual feature detail if there's ever a conflict:

1. **Tally is the source of truth** for Inventory, Ledger, GST, and Invoice numbering — for all of Phase 1.
2. **No object is ever overwritten into its next stage.** Order → Dispatch → Invoice → Delivery → Payment are always separate, permanent records, linked but never merged.
3. **Credit limit and stock shortages are advisory alerts, never automatic blocks.**
4. **All pricing, discount, GST, and credit calculations happen server-side** — the client is never trusted with these values.
5. **An order can be edited after approval only through a tracked, approved Order Change** — never a silent overwrite. Full revision history is preserved.
6. **A Dispatch is locked once loading is complete;** only the Dispatch (not the original Order) feeds the Invoice, since it reflects what actually left the warehouse.
7. **Every role sees only the data and actions relevant to it**, enforced by granular permissions (e.g. `order.approve`, `dispatch.edit`), not just UI hiding.

---

## 8. Roadmap Beyond Phase 1

Phase 1 is step one of a longer, deliberately sequenced transformation. Presenting it this way to the client de-risks adoption — the business keeps running on Tally at every step until the ERP has proven itself.

| Phase | Focus | Duration (est.) | Tally's role |
|---|---|---|---|
| **1** | Customer Ordering, Salesman App, Admin Dashboard, Catalogue, Order Management | 6–8 weeks | Master for inventory, billing, ledgers |
| **2** | Warehouse Loading, Vehicle Assignment, Dispatch Tracking | 4–6 weeks | Bills/stock still in Tally |
| **3** | Driver App, Collections, Delivery Proof, Cash Verification | 4 weeks | Collections sync back to Tally |
| **4** | Live Stock, Batch & Expiry Visibility, Multiple Price Lists | 6 weeks | Tally still controls inventory; frequent sync |
| **5** | Purchase Management, Supplier Portal, Warehouse Transfers | 6–8 weeks | Purchases synced to Tally |
| **6** | Full Accounting, Financial Reports, GST, optional Tally replacement | 10–16 weeks | ERP may become primary system |

Design principle behind the roadmap: **"augment first, replace later."** Treat Tally as the trusted financial system while the app delivers immediate operational wins (digital ordering, workflow automation, warehouse efficiency, delivery tracking). Only once those are stable does ownership progressively shift from Tally to the ERP.

---

## 9. Technical Approach (Summary)

Full detail lives in `phase_1_roadmap.md`; summarized here for product-level context.

- **Architecture:** Domain-Driven Design — each business domain (Auth, Customer, Catalog, Sales, Planning, Warehouse, Accounting, Delivery, Payment, Notification, Audit, Alert, Integration) is an isolated backend module. Nothing outside the **Integration module** is allowed to know Tally exists.
- **Tally connection:** via Tally's XML API, queued through Redis/Celery so orders/invoices are never lost if Tally is closed or offline — retried automatically.
- **Event-driven:** domain actions (e.g. `OrderApproved`) emit events; Notification/Audit/Alert modules subscribe rather than being called directly, so new side effects can be added without touching core logic.
- **Stack:** FastAPI + PostgreSQL + SQLModel/SQLAlchemy + Alembic (backend), React Native + Expo (mobile, offline-first via Expo SQLite/WatermelonDB), Next.js + TypeScript (admin web), Redis + Celery (cache/queue), FastAPI native WebSockets (realtime), S3-compatible storage (documents/photos).
- **Security default:** nothing from the client is trusted — price, discount, GST, credit, and stock warnings are always recalculated server-side.
- **Build sequence:** 11 sprints, ordered by dependency (Auth → Catalog → Customer → Sales → Planning → Warehouse → Integration/Accounting → Delivery/Payment → Notification/Audit/Alert hardening → Client Pilot). Full sprint-by-sprint plan in `phase_1_roadmap.md`.

---

## 10. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Catalogue browsing and order placement respond within 2 seconds under normal load |
| Availability | Backend keeps accepting orders even when Tally is offline; sync auto-resumes |
| Offline Support | Warehouse, Salesman, and Driver flows work offline (queued locally), syncing on reconnect |
| Security | HTTPS/TLS everywhere; no plaintext credentials; every endpoint enforces auth + permission checks |
| Data Integrity | Financially significant transitions (approval, dispatch lock, invoice generation, payment verification) are atomic |
| Auditability | Every state-changing action traceable to user, timestamp, before/after value |
| Scalability | Schema reserves `branch_id`/`company_id` for future multi-branch growth without redesign |
| Usability | Customer-facing screens usable by non-technical shopkeepers — icon-first, simple flows |
| Localization | Configurable app language per user/customer |
| Compatibility | Android + iOS via single React Native (Expo) codebase |

---

## 11. Assumptions, Dependencies & Risks

**Assumptions/Dependencies**
- Client's Tally Prime installation supports XML-based API access (ODBC as fallback).
- Client provides a stable local network/middleware host reaching the Tally XML/ODBC interface.
- Initial product catalogue and customer master data are provided by the client for seeding.
- SMS/WhatsApp Business API and push notification provider accounts are set up/provisioned as part of the project.
- Client designates at least one pilot customer and one pilot salesman for the final pilot sprint (UAT).

**Key Risks**
- **Tally connectivity/reliability** — mitigated by queued, retryable sync (never blocks order placement).
- **Adoption resistance** from staff used to phone/WhatsApp ordering — mitigated by not removing their working channels abruptly; alerts, not blocks, keep humans in control.
- **Data quality** at initial catalogue/customer seeding — flagged as a dependency the client must resource.

---

## 12. Document Traceability

This PRD synthesizes the full design history in `docs/`. For deeper detail on any section:

| Topic | Source Document(s) |
|---|---|
| Full functional requirements (FR-IDs, priorities) | `requirements_document.md` |
| Business context, source-of-truth reasoning, phased roadmap | `roadmap_from_first_chat.md` |
| Actor roles, Order/Dispatch separation | `third_chat.md`, `fourth_chat.md` |
| Requirements structure evolution | `fifth_chat_great_roadmap.md`, `sixth_chat_bussiness_objects.md` |
| Business object lifecycle | `seventh_chat_bussiness_object_lifecyle.md` |
| Aggregate boundaries & ownership | `eight_chat_aggregate_boundries_and_ownership.md` |
| Core business rules | `nineth_chat_bussiness_rules_doc.md` |
| Events & commands | `tenth_chat_bussiness_event_command.md` |
| State machines (Order/Trip/Dispatch/Delivery) | `last_couple_of_chat.md` |
| API/use-case mapping by domain | `13_chat_api_by_domain_usecase.md` |
| Database schema (all domains) | `database_docs/complete_database_schema.md`, `database_docs/auth_domain.md`, `database_docs/customer_domain.md`, `database_docs/catalog_domain.md` |
| Sprint-by-sprint build plan, tech stack, repo structure | `phase_1_roadmap.md` |

**Governance note:** if a new feature idea comes up during development, check it against this PRD and `requirements_document.md` first. If it isn't listed, it's a change request requiring a documented amendment — not an assumed addition.
