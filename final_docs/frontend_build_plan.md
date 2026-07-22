# Frontend Build Plan — DMS (Next.js)

| | |
|---|---|
| **Purpose** | How we will build the frontend, in what order, screen by screen, so the MVP is usable end-to-end. |
| **Status** | Decisions locked (see §1). Ready to start Phase 0. |
| **Based on** | `ui_ux_functional_requirements.md` (what to build), `prd.md` (why), `api_reference.md` (exact payloads), `database_schema_docs.markdown` (enums/status), current `backend/` (all APIs already built), current `frontend/` (empty Next.js 16 + Tailwind 4 + axios scaffold). |
| **Philosophy** | Same as `CLAUDE.md`: keep it simple, don't overengineer, build what's needed for the MVP today, not a component library for imagined future needs. |

---

## 1. Decisions (Locked)

The requirements describe three surfaces: back-office (desktop), field (mobile), customer portal (mobile+desktop). Decision: **one Next.js app, two route groups, responsive web (no native wrapper), one deployment.**

```
app/
  (staff)/         → admin, manager, salesman, driver, cashier, warehouse
  (portal)/        → customer self-service
  login/
```

**Why one app, not separate apps/repos:** shared auth, shared API client, shared UI primitives (buttons, status pills, forms), one deploy. Field screens (salesman order-taking, driver delivery) are just mobile-optimized layouts inside `(staff)` — Tailwind responsive classes handle this, no separate codebase needed. Splitting into multiple apps is the kind of premature structure `CLAUDE.md` tells us to avoid — we don't have two real deployment needs today.

### 1.2 Role-based rendering, not role-based apps
One shell (`(staff)/layout.tsx`) reads the logged-in user's role and renders nav items conditionally (per §5 Navigation Map in the UI/UX doc). A salesman never sees a "Purchases" link — not because it's a different app, but because the nav array is filtered by role. Route-level guards (middleware or a layout check) block direct URL access too, not just hide the link.

### 1.3 State/data-fetching approach
Given YAGNI: no Redux, no heavyweight state library. Recommend:
- **Server data:** a small fetch wrapper around `axios` (already in `lib/api.ts`) + React Query (`@tanstack/react-query`) for caching, loading/error states, and refetch-after-mutation. This directly solves the repeated "loading / empty / error" pattern required in §3.11 of the UX doc, instead of hand-rolling it per screen.
- **Auth/session state:** a single React context (`AuthProvider`) holding the logged-in principal (user or customer) + token, backed by an httpOnly-cookie or localStorage token (see §2).
- **Form state:** plain React state or `react-hook-form` for anything with >3 fields (order line items, product forms) — avoids boilerplate without pulling in a heavy form framework.

Decision: `@tanstack/react-query` and `react-hook-form` are the only two new dependencies beyond the current scaffold.

### 1.4 Styling
Tailwind 4 is already installed. Decision: a tiny set of hand-built primitives in `app/_components/ui/` (Button, Input, Select, StatusPill, Table, Modal, EmptyState, Spinner) — no component library (shadcn/MUI). The UX doc wants clean/minimal, and hand-built primitives keep the dependency count at zero for UI, matching `CLAUDE.md`'s non-bloated-dependency rule.

### 1.5 Web responsive, not native
Decision: no native app (React Native/Flutter) and no "wrap the web app in a WebView" step for MVP. One responsive Next.js site serves desktop (staff back-office) and mobile (salesman/driver/customer) from the same codebase and deployment, the way most mobile-web commerce sites work. Native wrapping is deferred — see §5 (PWA/offline).

### 1.6 Folder structure
```
frontend/
  app/                    → routes only (pages, layouts) — thin, compose from features/
    (staff)/
    (portal)/
    login/
  features/               → one folder per domain, mirrors backend app/api/ domains
    orders/
      components/         → OrderForm, OrderSummary, OrderLineItemRow — used only within this feature
      hooks/               → useOrders(), useOrder(id), useCreateOrder() (React Query hooks wrapping services/orders.ts)
    customers/
    products/
    ...
  components/ui/          → the shared primitives from §3 (Button, DataTable, StatusPill, Money, etc.) — cross-domain only
  services/                → one file per domain, all axios calls live here (see §1.7) — never called directly from components
    orders.ts
    customers.ts
    products.ts
  lib/
    api.ts                 → axios instance + interceptors (auth header, 401 handling)
    queryClient.ts
  types/                   → one file per domain, matching api_reference.md request/response shapes
  hooks/                   → cross-domain hooks only (useAuth, useGeolocation) — domain hooks live in features/<domain>/hooks
  constants/               → roles.ts, statuses.ts, routes.ts, permissions.ts (see §9)
  utils/                   → formatCurrency, formatDate, formatPhone, formatStatus (see §9)
```
Rule: a component that's only used inside one domain lives in `features/<domain>/components/`; once a second domain needs it, promote it to `components/ui/`. Don't pre-promote.

### 1.7 API abstraction layer
No component calls `axios`/`api.get(...)` directly. Every domain gets one file in `services/` exporting plain async functions matching the backend's shape one-to-one, e.g. `services/customers.ts`:
```ts
export const getCustomers = (params: CustomerListParams) => api.get<CustomerListResponse>('/customers', { params }).then(r => r.data)
export const getCustomer = (id: string) => api.get<Customer>(`/customers/${id}`).then(r => r.data)
export const createCustomer = (data: CustomerCreate) => api.post<Customer>('/customers', data).then(r => r.data)
export const updateCustomer = (id: string, data: CustomerUpdate) => api.patch<Customer>(`/customers/${id}`, data).then(r => r.data)
```
`features/<domain>/hooks/` wraps these in React Query (`useQuery`/`useMutation`) — that's the only layer components import from. Components never know an endpoint path or HTTP verb. This also means `types/` (request/response shapes) has exactly one source of truth per domain, reused by the service, the hook, and the form.

### 1.8 React Query policy (decide once, not per-screen)
Default rule: **mutate → invalidate the relevant list/detail query → refetch.** Simple, correct, and matches CLAUDE.md's "don't overengineer" — optimistic updates are a targeted exception, not the default, because getting them wrong causes exactly the stale-data bugs they're meant to prevent.

- **Refetch (default for everything):** create/update/delete on Products, Customers, Orders, Purchases, Returns, Invoices, Deliveries, Payments — anything server-calculated (money, GST, stock) must come back from the server, never be guessed optimistically.
- **Optimistic update (named exceptions only):** simple status toggles with no server-calculated side effects and low failure odds — e.g. Customer active/inactive, User active/inactive, Vehicle status. Roll back on mutation error.
- If a screen isn't listed above, default to refetch. Add a new named exception here (don't decide ad hoc per-component) if a case for optimistic update comes up later.

### 1.9 Forms standard
One `<Form>` wrapper (`components/ui/Form.tsx`) built on `react-hook-form`, used by every create/edit screen — not a fresh pattern per page:
- Labeled field + inline validation message (fail at the field, per UX doc §3.5).
- Server error display: a single "submit error" banner that maps FastAPI's 422/409 response body to field-level errors where the field name matches, and shows the raw `detail` message otherwise.
- Consistent submit-button state: `idle` → `submitting` (disabled + spinner) → `success` (toast, per §3) / `error` (banner stays, form data preserved — no wipe on failure).
- Read-only computed fields (§3.7 in the UX doc) render via the same `<Form>` primitives as a distinct locked/grey field type, never a plain input.

### 1.10 Naming & route conventions
Every domain follows the same route shape: `orders/`, `orders/new`, `orders/[id]`, `orders/[id]/edit`. No domain invents its own pattern (e.g. no `orders/create` in one place and `products/new` in another).

---

## 2. Authentication Flow (build first — everything else depends on it)

Matches `api_reference.md` §1 and UX doc §3.1.

1. **Single `/login` screen.** Mobile number + password. Calls `POST /auth/login`.
2. Response has `principal_type`: `user` → route to `/dashboard` (staff shell); `customer` → route to `/portal` (customer shell).
3. Store `{ token, principal_type, user | customer }` in `AuthContext`, persisted in `localStorage`. Confirmed against `backend/app/api/auth.py`: `/auth/login` returns a bearer JWT (`TokenResponse.access_token`) — no cookie is set, so bearer-token-in-header + localStorage is the only option, not a choice.
4. Axios instance attaches `Authorization: Bearer <token>` on every request; a 401 response clears session and redirects to `/login` with a "session expired, please log in again" message (UX doc §3.1).
5. `AuthProvider` exposes `useAuth()` → `{ principal, role, logout() }`, used by layouts to filter nav and guard routes.

**Logout:** confirmed there is no `/auth/logout` endpoint in the backend — the JWT is stateless (`create_access_token`, no server-side session/blacklist). Logout is purely client-side: drop the token from `AuthContext`/`localStorage` and redirect to `/login`. No API call needed.

---

## 3. Shared Patterns — Build Once, Reuse Everywhere

Per UX doc §3.3–§3.11, these five patterns cover ~80% of every screen. Build them first as small reusable pieces, then every module screen below is mostly composition:

| Pattern | What it is | Used by |
|---|---|---|
| `<DataTable>` | search box + filter dropdowns + sortable headers + pagination + status pill column + row-click-to-detail + empty state | every list screen (customers, products, orders, invoices, etc.) |
| `<StatusPill>` | one component, color-coded by status string, covers every enum in UX doc §3.6 | everywhere |
| `<DetailLayout>` | header block + tabs/sections for "related items" + status/history timeline | order/invoice/purchase/return/delivery detail |
| `<Form>` primitives | labeled field, inline validation message, read-only computed-value display (visually distinct — grey background, lock icon) for §3.7 server-calculated fields | every create/edit screen |
| `<PhotoCapture>` | file input that opens camera on mobile, shows preview, uploads via `POST /files/upload` (check `file_uploads.py`), returns path, shows progress/retry | customer shop image, product image, delivery signature/photo, return photo |

Also build once: `<Toast>`/confirmation banners, `<ConfirmDialog>` (for destructive actions §3.11), a `<Money>` formatter component (₹, 2 decimals, per §3.8), and a GPS-capture hook (`useGeolocation()`) for §3.10.

---

## 4. Build Order (Phased)

I'm sequencing this by **dependency and daily-use value**, not by the module list order in the docs — auth and master data must exist before orders can be tested, and the salesman order flow is the single most important screen per the UX doc ("optimize hard for speed").

### Phase 0 — Foundation (no user-visible screens yet)
- Axios client with auth interceptor, `AuthProvider`, `/login` screen, route guards.
- Shared UI primitives (§3 above).
- App shell layouts: `(staff)` shell with role-filtered sidebar/topbar, `(portal)` shell (simpler, bottom-nav-style for mobile).

### Phase 1 — Core Master Data (Admin, desktop-first)
Needed before any order can reference real data.
- Users (staff) — list, create, edit, activate/deactivate, soft-delete.
- Routes — list, create/edit, assign salesman.
- Customers — list/search/filter, create/edit (incl. GPS capture + map), status change, soft-delete.
- Categories, Brands, Products — list, create/edit (incl. image upload), activate/deactivate.
- Price Lists — list, create/edit, manage per-product price items.
- Warehouses, Suppliers, Vehicles — list, create/edit, status changes.

### Phase 2 — Core Selling Flow (the MVP heart)
Original Phase 2 bundled orders, approval, warehouse loading, invoicing, and inventory into one phase — too large a unit to call "done" (easily multi-week). Split into sub-phases so each ships as its own usable milestone, still built in this exact order since each depends on the previous existing:

- **Phase 2A — Sales Orders.** Order create (Salesman, mobile-first: customer picker → fast product search/add → live server-calculated summary → remarks/date → submit — the flow to polish most), plus order list + detail (filters, status pill, line items, money breakdown) and edit/cancel (pending-only).
- **Phase 2B — Approval.** Order approve (Manager) — per-line approved qty, stock-constraint surfacing.
- **Phase 2C — Warehouse Loading.** Order load (Warehouse) — per-line loaded qty.
- **Phase 2D — Invoicing.** Invoice generation trigger + invoice list/detail (Cashier/Manager/Admin) — GST breakdown, printable layout.
- **Phase 2E — Inventory.** Stock summary view (read first) → adjustment + transfer forms.

At the end of Phase 2E you have a working order → approve → load → invoice → stock-visible loop, testable end to end on staff side. See §8 for the "done" bar each sub-phase must clear before moving to the next.

### Phase 3 — Delivery & Payment (closes the cash loop)
- Deliveries: assign (Dispatcher, desktop), driver's mobile delivery list + detail (start/arrive/complete-with-signature-photo-GPS/fail).
- Payments: record payment (Driver inline during delivery-complete, Cashier standalone), payment list/reconciliation, verify/mark-bounced.

### Phase 4 — Buying & Returns
- Purchases: create (draft), list/detail, edit draft, receive, cancel.
- Returns: create against invoice (with photo), list/detail, approve/reject, complete.

### Phase 5 — Customer Self-Service Portal
Built after the staff order flow exists and is tested, since it feeds the same backend flow and reuses the product-catalogue and order-summary components already built for the salesman flow.
- Portal home (place order CTA, recent orders, dues).
- Catalogue browse (own prices only).
- Place order (cart-style, same summary component as salesman flow, different customer-selection — none, it's always "self").
- My orders (list/detail, edit/cancel while pending).
- My invoices & dues (read-only).
- My deliveries (read-only tracking).
- Profile (view, limited edit — **confirm with you** which fields a customer may edit vs. staff-only).

### Phase 6 — Admin Utilities & Reporting (last, lowest daily-use urgency)
- Tally Sync status view + retry (UX doc explicitly says "low-frequency, keep it simple, not prominent").
- Reports/dashboards: sales over time, orders by status, outstanding dues, low-stock, delivery performance. Build as a handful of numbers + simple charts (recommend a lightweight chart lib only when we get here, not upfront).
- Role dashboards/home screens (§4.1 of UX doc) — I'm deliberately placing these last even though users "land" here, because a dashboard is just a read-only aggregation view over data/screens that need to exist first (pending orders, dues, low stock, deliveries-in-progress). Building it last means it displays real data from day one instead of placeholders.

---

## 5. Offline Consideration (Salesman & Driver)

UX doc §3.12 asks for offline tolerance. Scoping this honestly for MVP: full offline sync (service worker, local queue, conflict resolution) is a substantial feature on its own. Recommend for MVP:
- Client-generates UUIDs for orders/deliveries (backend already supports this per PRD §7).
- On submit failure due to network, keep the form data in memory/localStorage and show a "not sent — will retry" state with a manual retry button, rather than building a full background-sync queue.
- Treat true offline-first (service worker + IndexedDB queue) as a **Phase 7 / post-MVP** item, not blocking initial launch — a conscious scope call, not a silent gap.
- Decision: no native app wrapper for MVP (§1.5). If an app-like install/home-screen experience is wanted later, add a PWA manifest + service worker on top of this same responsive site (config layer, not a rewrite) — still Phase 7/post-MVP, not a blocker.

---

## 6. Testing Plan

The original draft had no testing plan — regressions would otherwise pile up silently as later phases touch shared primitives (§3) that earlier phases depend on. Keep it lightweight, not a heavy E2E suite:

- **Smoke checklist, run manually after every phase**, before calling it done — a fixed script, not ad hoc clicking:
  ✓ Login (staff + customer) → ✓ Logout → ✓ Create/edit/list the domain(s) that phase added → ✓ Every prior phase's core action still works (e.g. once Phase 2B ships, re-check Phase 2A's order create still works before moving to 2C).
- **Automated:** component tests (Vitest + React Testing Library) for the shared primitives in §3 only (`DataTable`, `Form`, `StatusPill`, `Money`) — these are reused everywhere, so a regression there breaks every screen silently. Don't write component tests per-domain-screen at MVP stage; that's over-testing thin composition code.
- **Automated:** one integration test per critical mutation hook in `features/*/hooks/` (React Query mutations) verifying it calls the right service function and invalidates the right query key — catches the §1.8 policy being violated by accident.
- Full browser E2E (Playwright) is a post-MVP addition once the phase list above is stable — not needed to ship Phase 0–5.

---

## 7. Global Constants & Utilities

- **Env config:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_NAME` in `.env.local` / `.env.example`, read only through `lib/api.ts` (matches `CLAUDE.md` §4 — no scattered `process.env` reads).
- **Constants (`constants/`):** `roles.ts`, `statuses.ts` (every enum in UX doc §3.6 — order/purchase/delivery/payment/return/customer/vehicle/user status), `routes.ts` (path constants, not hand-typed strings), `permissions.ts` (role → allowed-nav-items map used by §1.2 role-based rendering). No magic strings for any of these, same rule `CLAUDE.md` §4.2 applies to backend enums.
- **Utils (`utils/`):** `formatCurrency` (₹, 2 decimals, per UX doc §3.8), `formatDate`, `formatPhone`, `formatStatus` (maps a status enum to its `<StatusPill>` label/color) — built once, imported everywhere, never re-implemented per screen.

---

## 8. Definition of Done (per phase/sub-phase)

A phase is **not** done at "the happy path works." Before moving to the next phase or sub-phase, it must clear:
- Every CRUD operation for that phase's domain(s) works (create, edit, list, detail, soft-delete/status-change where applicable).
- Validation works (422 surfaces as inline field errors, per §1.9).
- Search, filters, sorting, and pagination work on every list screen added (UX doc §3.3).
- Role/permission checks work — the right roles see it, the wrong roles are blocked at the route level, not just hidden from nav (§1.2).
- Mobile layout verified on an actual small viewport for any screen flagged mobile-first (salesman, driver, customer portal), not just resized desktop.
- Smoke checklist (§6) passes, including re-running every previous phase's checklist items.

This is the guard against "90% done" — a phase isn't a milestone until this list is clean, even if it takes a bit longer.

---

## 9. Open Question — Customer Profile Edit (Phase 5)

Checked `backend/app/schemas/customer.py`: there's a single `CustomerUpdate` schema (business_name, mobile, gst_number, address, credit_limit, route_id, price_list_id, login_enabled, etc.) with **no field-level split between staff-editable and self-editable** — the backend doesn't restrict this, so it's purely a frontend/product decision.

Recommendation: let a customer self-edit contact/shop info only — `business_name`, `owner_name`, `mobile`, `alternate_mobile`, `address`, `city`, `state`, `pincode`. Keep `gst_number`, `credit_limit`, `payment_terms`, `route_id`, `price_list_id`, `login_enabled` staff-only (these drive GST, credit, and routing logic and shouldn't be self-serve). The **portal UI simply won't render inputs for the staff-only fields** — needs your confirmation before Phase 5, not blocking Phases 0–4.

---

## 10. Status

Decisions in §1 are locked; Phase 0 (auth + shell + shared primitives) can start now. Only open item is §9 (customer self-edit scope), needed before Phase 5, not before starting.
