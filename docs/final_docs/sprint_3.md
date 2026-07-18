# Sprint 3 — Customer Domain
## FMCG Distribution ERP — Phase 1

| | |
|---|---|
| **Document Type** | Sprint Plan |
| **Based on** | `PRD.md`, `PHASE1_SIMPLE_SCHEMA.md`, `ARCHITECTURE.md`, `API_CONTRACT.md`, `PROJECT_SETUP.md`, `sprint_1.md`, `sprint_2.md` |
| **Sprint** | 3 of 11 |
| **Duration** | Suggested: 4–6 days (bigger than Sprint 2 — two separate login flows: staff-managed customer records + a second, customer-facing OTP auth flow) |
| **Depends on** | Sprint 1 (auth pattern, `require_role()`, response envelope), Sprint 2 (module/task-breakdown pattern proven twice now) |
| **Team model** | Same as Sprints 1–2: **backend together first**, then **frontend together**, mobile parallel-safe once backend's done. |

### Why Sprint 3 looks like this
This is the **last dependency before Orders can exist** — `sales_orders.customer_id → customers.id` (per `PHASE1_SIMPLE_SCHEMA.md`) means Sprint 4 can't start until customers are real. It's a bigger sprint than Catalog because Customer isn't just a CRUD table like Product — it introduces a **second authentication audience** (customers log in separately from staff, per `API_CONTRACT.md` §1.8 and §2.2), which is new plumbing, not just a new module copied on the Sprint 1/2 pattern.

---

## 1. Sprint Goal

By the end of this sprint:
- Admin/Sales Manager can register a customer (shop name, mobile, address, assigned salesman, credit limit) on the Next.js dashboard.
- A registered customer can log in via mobile + OTP on the React Native Customer app shell and see their own profile.
- Salesman can see the list of customers assigned to them.

**Demo checkpoint:**
> Admin registers a new customer ("Sharma General Store") and assigns them to a Salesman, on the dashboard. That customer logs in on the React Native app with their own mobile number + OTP → sees their shop name and address. The Salesman logs into their app/dashboard view → sees "Sharma General Store" in their assigned customer list.

---

## 2. Scope

### 2.1 In scope
- `customers` table (per `PHASE1_SIMPLE_SCHEMA.md` §2).
- **Customer OTP login** — a second, separate auth flow and JWT audience from staff login (Sprint 1's `auth` module), per `API_CONTRACT.md` §1.8/§2.2. This reuses the *pattern* from Sprint 1 (OTP request/verify/JWT/refresh) but is a distinct `customer_auth` module — customers are never rows in `users`, and a customer token can never hit a staff-only endpoint.
- Customer registration/edit (Admin, Sales Manager only).
- Customer list filtered by assigned salesman (for Salesman role) or by status (for Admin).
- `GET /customers/{id}/outstanding` — **stubbed this sprint**: returns a hardcoded/zero placeholder shape, since it's a Tally-synced read-model that doesn't have real data until the Accounting/Integration domain exists (Sprint 8). Building the real endpoint shape now means Sprint 8 only has to fill in real data, not invent the contract.
- Admin Web: customer list, add/edit customer form.
- React Native: customer login screen + own-profile screen (Customer app); assigned-customer list screen (Salesman/ERP app).

### 2.2 Explicitly out of scope
- Customer document upload (GST/PAN/shop license) — not in the simplified 14-table schema; add only if the pilot customer genuinely needs KYC document storage before go-live.
- Customer-specific pricing — flagged already in Sprint 2 as a possible later addition, still not needed here.
- Real credit/outstanding calculation — that's Accounting/Integration's job (Sprint 8); this sprint only builds the `credit_limit` field (a plain number Admin sets) and the stubbed outstanding endpoint shape.
- Route/delivery-day assignment — not part of the simplified schema; `assigned_salesman_id` is the only relationship this sprint builds.

---

## 3. Database

One table this sprint, plus the customer-auth support tables (same shape as Sprint 1's `otps`/`refresh_tokens`, scoped to customers instead of staff):

### `customers`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | VARCHAR | contact person's name |
| shop_name | VARCHAR | |
| mobile | VARCHAR, UNIQUE | login identifier |
| address | TEXT | |
| gst_number | VARCHAR, nullable | |
| assigned_salesman_id | UUID FK → users, nullable | nullable because a customer can be registered before a salesman is assigned |
| credit_limit | DECIMAL(14,2) | |
| status | VARCHAR | `active` / `inactive` |
| created_at | TIMESTAMPTZ | default now() |

### `customer_otps` / `customer_refresh_tokens`
Same shape as Sprint 1's `otps`/`refresh_tokens` (§3 of `sprint_1.md`), but `user_id` → `customer_id`. Kept as **separate tables**, not shared with the staff ones — this is what makes "a customer token can never authenticate a staff endpoint" true at the data level, not just in application logic.

**Migration:** `003_customers`, depends on `001_users_and_auth` (for the `assigned_salesman_id` FK) and `002_products` only in sequence order, not in actual dependency — customers don't reference products.

**Seed data** (extend `scripts/seed.py`): 5–10 customers, spread across the seeded salesmen from Sprint 1, with real/testable mobile numbers.

---

## 4. Task Breakdown

Legend: **[Pair]** = do together · **[Parallel-safe]** = no dependency on any in-progress task.

### 4.1 Phase A — Backend (both together)

```
app/customers/
├── models.py     # Customer, CustomerOTP, CustomerRefreshToken
├── schemas.py    # CustomerCreate, CustomerUpdate, CustomerRead
├── service.py    # CRUD + customer OTP logic
└── router.py     # both /customers/* and /customer-auth/* endpoints
```

| ID | Task | Owner | Depends on | Notes |
|---|---|---|---|---|
| B1 | `customers/models.py` — `Customer`, `CustomerOTP`, `CustomerRefreshToken` matching §3 | You | Sprint 2 Phase A DoD | |
| B2 | Alembic migration `003_customers` | You | B1 | |
| B3 | `customers/schemas.py` — `CustomerCreate`, `CustomerUpdate`, `CustomerRead`, plus `CustomerOTPRequest`/`CustomerOTPVerify`/`CustomerTokenResponse` | Brother | B1 | **[Parallel-safe with B2]** — schemas need the model shape, not the migration running. |
| B4 | `customers/service.py` — customer OTP flow (`request_otp`, `verify_otp`, `refresh_access_token`) — **copy the exact pattern from Sprint 1's `auth/service.py`**, scoped to `Customer`/`customer_otps`/`customer_refresh_tokens` | Brother | B2, B3 | This is intentionally a near-duplicate of Sprint 1 B9 — resist the urge to "cleverly" unify staff and customer auth into one generic service. Keeping them structurally separate is what makes the two-audience boundary hard to accidentally break later. |
| B5 | `customers/service.py` — CRUD (`create_customer`, `update_customer`, `list_customers` with `?salesman_id=&status=` filters, `get_customer`) | You | B2, B3 | **[Parallel-safe with B4]** — different functions in the same file; agree who commits first to avoid a merge conflict, or literally pair on this one file. |
| B6 | `customers/router.py` — customer-auth endpoints: `POST /customer-auth/otp/request`, `POST /customer-auth/otp/verify` (public) | You | B4 | |
| B7 | `customers/router.py` — staff-facing endpoints: `GET /customers` (`admin`, `sales_manager`, `salesman` — salesman sees only their own assigned customers), `POST /customers` (`admin`, `sales_manager`), `GET /customers/{id}`, `PATCH /customers/{id}` (`admin`, `sales_manager`) | Brother | B5 | **[Parallel-safe with B6]** — different endpoints in the same router file; same merge-conflict note as B5. |
| B8 | New dependency: `get_current_customer` in `shared/dependencies.py` — decodes a customer JWT, distinct from `get_current_user` (Sprint 1 B8), rejects staff tokens outright | **Pair** | B6 | This is the actual enforcement point for the two-audience rule — worth doing together since it's a security boundary, not routine CRUD. |
| B9 | `GET /customers/{id}/outstanding` — stub returning `{ "outstanding_amount": 0, "as_of": null, "source": "not_yet_synced" }` shape, `require_role("admin", "accountant")` or `get_current_customer` for self | You | B7, B8 | Small, but establishes the exact response shape Sprint 8 will fill in for real — worth getting the shape right now with both of you glancing at it, even though one person writes it. |
| B10 | Tests (`tests/customers/`): customer OTP login works and issues a customer-scoped token; that token is rejected on staff-only routes and vice versa; salesman only sees their assigned customers; non-Admin/Sales-Manager can't create/edit | **Pair** | B8, B9 | The cross-audience rejection test is the most important one this sprint — don't skip it. |

**Definition of Done — Phase A (backend):**
- All endpoints match `API_CONTRACT.md` §2.2 exactly.
- A customer JWT and a staff JWT are verifiably interchangeable-proof: a customer token on `POST /customers` → 401/403; a staff token on a customer-only endpoint → 401/403 (whichever your `API_CONTRACT.md` §1.7 convention specifies — confirm and use consistently).
- Salesman's `GET /customers` returns only their assigned customers; Admin's returns all.
- Swagger UI shows all new endpoints correctly typed.
- Tests pass in CI.

### 4.2 Phase B — Frontend (both together, once Phase A's Definition of Done is met)

```
app/(dashboard)/customers/
├── page.tsx          # Customer list (filtered by role — salesman sees own, admin sees all)
├── new/page.tsx       # Register customer form
└── [id]/page.tsx      # Edit customer form
lib/api/customers.ts   # listCustomers(), getCustomer(), createCustomer(), updateCustomer()
```

| ID | Task | Owner | Depends on | Notes |
|---|---|---|---|---|
| F1 | Re-run `openapi-typescript` against the updated backend spec | You | Phase A DoD | Third repetition of this habit now — should be automatic. |
| F2 | `lib/api/customers.ts` — API call wrappers | You | F1 | |
| F3 | Customer list page — table (name, shop name, mobile, assigned salesman, status), filtered server-side by the logged-in user's role | Brother | F1 | **[Parallel-safe with F2]** — needs generated types, not the wrapper functions yet. |
| F4 | Register customer form — all fields, salesman assignment dropdown (fetches Sprint 1 seeded users filtered to `role=salesman`), calls `POST /customers` | Brother | F2, F3 | |
| F5 | Edit customer form — pre-filled, calls `PATCH /customers/{id}` | You | F2, F3 | **[Parallel-safe with F4]** — separate route, same dependency set. |

**Definition of Done — Phase B (frontend):**
- Admin/Sales Manager can register and edit a customer through the UI.
- Salesman logging into the dashboard sees only their assigned customers in the list (if Salesman gets dashboard access this early — otherwise this is verified via API/mobile instead, confirm with §6 risk 1).
- Non-Admin/Sales-Manager roles never see the "Register Customer" control.

### 4.3 Phase C — Mobile (both — this sprint's mobile work is real feature work, not a stretch shell, since Customer login is core to the Customer app)

```
src/features/customer/auth/
├── LoginScreen.tsx        # reuses UI pattern from Sprint 1's staff login, different endpoint
└── ProfileScreen.tsx
src/features/salesman/customers/
└── CustomerListScreen.tsx
src/core/api/customerAuthApi.ts
src/core/api/customersApi.ts
```

| ID | Task | Owner | Depends on | Notes |
|---|---|---|---|---|
| M1 | `customerAuthApi.ts` — calls `/customer-auth/otp/*`, stores a **separate token slot** from the staff token (a device could theoretically have both, if Customer and ERP apps are unified — confirm against your `PROJECT_SETUP.md` §4.1/§4.2 decision) | Whoever is free | Phase A DoD | |
| M2 | Customer login screen + profile screen (shows shop name, address, assigned salesman) | Whoever did M1 | M1 | |
| M3 | Salesman's assigned-customer list screen | Whoever is free | Phase A DoD | **[Parallel-safe with M1/M2]** — different feature area (`salesman/`, not `customer/`), only needs the backend, not M1/M2. |

**Definition of Done — Phase C (mobile):**
- A seeded customer can log in with their own mobile+OTP and see their own profile.
- A seeded salesman sees exactly their assigned customers, no one else's.

---

## 5. Task-dependency map (quick visual reference)

```
Sprint 2 Phase A DoD
        │
        ▼
B1 ── B2 ─┬── B4 ── B6 ─┐
      B3 ─┴── B5 ── B7 ─┴── B8 (Pair) ── B9 ── B10 (Pair)
                                              │
                                  Phase A Definition of Done
                                              │
                    ┌──────────────────────────┼──────────────────────────┐
                    ▼                                                      ▼
F1 ──┬── F2 ──┬── F4                                          M1 ── M2
     └── F3 ──┴── F5                                          M3 (parallel-safe with M1/M2)
```

---

## 6. Risks / things to agree on before starting

1. **Does Salesman get Admin-Web dashboard access, or only mobile?** Your PRD lists Salesman under the "ERP Mobile App" surface, not Admin Web — if that's the final call, F3's "salesman sees own customers" behavior is actually verified through Phase C (M3), not Phase B, and Phase B's customer list is Admin/Sales-Manager-only. Confirm before F3 starts so it isn't built for a role that never opens that screen.
2. **One-device-two-audiences question** — if Customer App and ERP App end up as one React Native project (per the still-open `PROJECT_SETUP.md` §4.1/§4.2 decision), M1's "separate token slot" design needs to be settled now, since it's much harder to retrofit once both flows exist in the same app.
3. **`credit_limit` entry** — is this a number Admin manually types per customer at registration, or does it come from the client's existing records? Same category of question as Sprint 2's product-seeding risk — confirm with the client if it affects registration-form UX.

---

## Document Traceability

| Section | Source |
|---|---|
| Customer endpoints, response shapes, two-audience auth rule | `API_CONTRACT.md` §1.8, §2.2 |
| `customers` table | `PHASE1_SIMPLE_SCHEMA.md` |
| Customer module placement | `ARCHITECTURE.md` §5.2, §8.1 |
| Folder structure, contract-sync habit | `PROJECT_SETUP.md` §2, §3 |
| Reused patterns (auth guard, envelope, folder shape, team workflow) | `sprint_1.md` §4, §5; `sprint_2.md` §4 |
| Salesman-as-mobile-only surface | `PRD.md` §5, §6.2 |

**Next:** `sprint_4.md` covers Sales Domain Part A — customers can finally place real orders against real products.
