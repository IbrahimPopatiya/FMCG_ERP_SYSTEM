# Frontend Plan — DMS (Complete)

**One document covering everything about the frontend:** what to build, how it should look and feel, and the order we build it in. Replaces the earlier separate docs (`ui_ux_functional_requirements.md`, `ui_design_spec.md`, `designer_requirement_brief.md`, `frontend_build_plan.md`) — those now just point here.

**Audience:** anyone building the frontend, or a designer making screens for it.

**Main goal, repeated everywhere in this doc:** every task should take about **2–3 taps**, not a long form. See §3 for the decision on how.

---

## 1. What We're Building

A **Distribution Management System (DMS)** — software for FMCG wholesale distributors in India. The backend and all APIs are already built. It covers a distributor's daily cycle:

**Take an order → approve it → invoice it (with GST) → deliver it → collect payment.**
Also: buying stock from suppliers, handling returns, and tracking inventory — all with a full audit trail.

Today this is run on paper or spreadsheets. We want real-time stock visibility, automatic GST calculation, a traceable record of every stock/money movement, and a fast, forgiving experience for field staff on their phones.

---

## 2. Three Surfaces, One App

| Surface | Who | Device | Feel |
|---|---|---|---|
| **Back-office** | Admin, Manager, Cashier, Dispatcher | Desktop-first | Tables, filters, data entry |
| **Field** | Salesman, Driver | Phone-first | Big buttons, one-handed, camera + GPS |
| **Customer Portal** | External shop owners | Phone + desktop | Much simpler — only their own data |

Built as **one responsive website**, not three separate apps or a native app — one Next.js project, one deployment, shared login and components. The Customer Portal should still feel noticeably lighter than the staff side, since it's a different, non-power-user audience.

### Who Uses It

**Corrected against the backend** (`app/core/enums.py` → `UserRole`): the six actual staff logins are **Admin, Manager, Salesman, Driver, Dispatcher, Cashier**. There is no separate "Warehouse" login role — "Warehouse" is a place (a master-data record orders/stock belong to), not a person who logs in. Warehouse-floor work (loading orders, receiving purchases, adjusting stock, processing returns) is done by whichever role is actually given that job day to day — in practice **Dispatcher**, sometimes Admin/Manager. The design should use the role name **Dispatcher** for this, not invent a "Warehouse" role that doesn't exist in the login system.

| Role | Device | Main job |
|---|---|---|
| Admin | Desktop | Manage everything — master data, staff, settings |
| Manager | Desktop | Approve orders, oversee operations, view reports |
| Salesman | Phone | Take orders at the shop, fast |
| Driver | Phone | Deliver, collect payment |
| Cashier | Desktop | Verify payments, reconcile invoices, track dues |
| Dispatcher | Desktop/tablet | Assign deliveries, and (today) also the warehouse-floor jobs: receive purchases, load vans, process returns, adjust/transfer stock |
| Customer (Shop) — external | Phone/desktop | Place their own orders, track their own data |

Each role only sees the menu items they're allowed to use. A salesman never sees purchasing; a driver's app is basically "my deliveries today."

**Important gap found while reviewing the backend:** today the API only checks *"is this a logged-in staff member"* (`require_staff`), not *which* role. Any staff login can currently call any staff endpoint — there's no per-role check like "only Manager can approve" enforced server-side yet. So hiding menu items by role in the frontend is a UX nicety today, **not** a security boundary — a determined user could still hit another role's screen directly by URL. This should be flagged back to the backend team; the frontend should still hide/guard by role (good practice, good UX), just don't present it as "secure" until the backend adds real per-role checks.

---

## 3. Design Goal & Decision: Version B — "Smart One Screen"

We compared three ways to hit the "2–3 taps" goal, and picked one. Kept here for context, since it shapes every screen below.

### The three options we compared

| | A — Wizard | **B — Smart One Screen (chosen)** | C — Shortcuts |
|---|---|---|---|
| How it works | One question per screen, step by step | One screen, mostly pre-filled with smart guesses; user only touches what's different | One-tap "repeat last" buttons that skip the form entirely |
| Best for | First-time tasks | Routine daily tasks | Daily repeat tasks |
| Typical taps | 3–4 | 2–3 | 1–2 |
| Trade-off | More screens to move through | Feels empty with no history yet | Only helps repeat work, needs a fallback underneath |

### Decision

**Every "create/do something" screen is one smart, pre-filled screen (Version B).** If there's no history to guess from (e.g. a brand-new customer's first order), the same screen just opens empty instead of pre-filled — same layout, not a different flow, so people aren't learning two versions of one screen.

**How Version B works, in general:**
1. Screen opens already filled in with the most likely values — last customer/product used, usual quantity, today's date, default warehouse, invoice's outstanding amount, etc.
2. The user only edits what's different from usual (tap a +/− stepper, swap a product, change a date).
3. One clear button at the bottom, always visible, to finish (Submit / Save / Complete).

**Example — Salesman creates an order:**
1. Screen opens with the customer's usual products already listed at qty 1 (or their last order's quantities).
2. User adjusts with +/− or adds/removes a product.
3. Live total shown at the bottom.
4. Tap "Submit Order." Done. (~2–3 taps for a routine order.)

**Applies the same way to:** delivery-complete (pre-fill expected cash amount from the invoice), payment record (pre-fill the invoice's outstanding amount), purchase receive (pre-fill received qty = ordered qty), return line items (pre-fill qty = invoice qty). Anywhere the "obvious" value can be guessed, guess it — the user only touches exceptions.

**Nice-to-have for later (not required in the first build):** one-tap shortcuts on the home screen (Version C's idea) — e.g. "Repeat last order" — that jump straight into an already-filled Version B screen. Easy to add on top later, not a blocker now.

### Rules that apply to every screen, whichever pattern

- **Max 4–5 fields visible at once.** Anything else goes behind a collapsed "More options" link.
- **Big tap targets** on phone screens — thumb-size, not small icons close together.
- **Smart defaults everywhere** — last-used value, most common value, today's date — pre-filled, never left blank if a good guess exists.
- **Pickers, chips, and +/− steppers instead of typing**, wherever the choices are limited.
- **One main button per screen** — always obvious what to tap next.
- **Numbers the system calculates (price, GST, stock) are never typed by the user** — shown read-only, clearly greyed out/locked-looking.

---

## 4. Core Rules That Repeat on Almost Every Screen

- **Login:** one screen (mobile number + password) for both staff and customers — after login, staff go to their role's home, customers go to the portal.
- **Status drives everything.** Nearly every record has a status, and the status decides which action buttons show up (e.g. a `pending` order shows Approve/Cancel; an `approved` order shows Load — never both). One fixed status-color system, used identically everywhere:

  | Meaning | Color | Example statuses |
  |---|---|---|
  | Waiting | 🟡 Amber | pending, unpaid, draft, requested |
  | Good/active | 🟢 Green | approved, active, cleared, paid |
  | In progress | 🔵 Blue | loaded, out_for_delivery, partial, available |
  | Done | 🟦 Teal | delivered, completed, received, synced |
  | Stopped | 🔴 Red | cancelled, rejected, bounced, failed, blocked, inactive |

  Always shown as color + dot + short text label — never color alone.

  **Two corrections after checking the actual backend enums (`app/core/enums.py`):**
  - **Order status** is really `pending → approved → loaded → delivered → cancelled` (yes, orders themselves go all the way to "delivered" — there's no separate "invoiced" order status; the invoice is its own linked record, generated once an order is approved/loaded, with its own payment status). Design the order timeline as these five states, not with "invoiced" as a stop on the order's own status bar.
  - **Delivery status** is only `pending → out_for_delivery → delivered / failed` — there's no formal "arrived" status. Arrival is still a real action the driver taps (it records GPS + a timestamp), it just doesn't move the delivery into its own colored status — show it as a checkpoint inside the "out_for_delivery" stage, not a fifth pill color.

- **Lists:** search box, a few relevant filters, sortable columns, pagination, status shown clearly, tap a row to open its detail, and a clear "nothing here yet" empty state with a way to create the first one. Filtered-empty ("no results for this filter") needs different wording than truly-empty.
- **Detail pages:** the record's info, its current status, a status timeline where relevant, and only the action buttons valid right now.
- **Forms:** short, grouped fields, pre-filled per §3, inline errors shown immediately at the field (not after submit), and never lose what the user typed if saving fails.
- **Money/GST/stock:** always calculated by the server, always shown, never a typed field. Same-state sales show CGST+SGST; cross-state shows IGST — the screen just displays whichever the server sends.
- **Photos, signatures & GPS** are core, quick, in-flow features, not separate chores: shop photos, product/category/brand images, delivery photos, delivery signature (draw on screen), customer location (map + "use my current location"), delivery arrival/completion location.
- **Loading / empty / error:** every data screen needs a design for all three, plus a retry option on error.
- **Confirm before anything risky:** cancel, delete, reject, mark bounced — always ask "are you sure?" first.
- **Works on weak signal:** salesman and driver screens should let the user finish the task even with bad internet, showing "not sent — will retry," and sync automatically later (client-generated IDs support this on the backend already).

---

## 5. Modules & Screens

Standard pattern per module: **List → Detail → Create/Edit**, using the Version B pattern (§3) for anything that "creates or does" something. Fields shown are what the screen needs — see `api_reference.md` for exact payload names.

| Module | Who | Screens & key actions | Key fields |
|---|---|---|---|
| Login | Everyone | One login screen, routes to the right home | Mobile number, password |
| Dashboard | All roles | Role-specific home (see §6) | — |
| Users (staff) | Admin | List, add/edit, turn on/off, soft-delete | Name, mobile, email, role, status |
| Routes | Admin/Manager | List, add/edit, assign a salesman | Name, salesman, status |
| Customers | Admin/Manager/Salesman | List/search, add/edit, status (active/inactive/**blocked**), save GPS location, soft-delete | Business name, owner, mobile, GST, address, credit limit, payment terms, route, price list, location |
| Categories / Brands | Admin | List (categories can nest), add/edit with image, soft-delete | Name, parent (categories), image |
| Products | Admin | List/search by name/SKU/barcode, filter by category/brand/status, add/edit with image, turn on/off. **Never shows an editable stock field** — stock lives only in Inventory | SKU, barcode, name, category, brand, unit, packing, MRP, selling price, GST rate, minimum stock, image |
| Price Lists | Admin | List, add/edit; manage custom prices per product inside a list (can be long — design for comfortable bulk-editing); no override = default price shown | Name, description, per-product price overrides |
| Warehouses / Suppliers | Admin | List, add/edit, turn on/off, soft-delete | Warehouse: name, address, state (GST-relevant). Supplier: code, name, GST, mobile, address |
| Vehicles | Admin/Dispatcher | List, add/edit, assign driver, change status | Vehicle number, driver, warehouse, capacity, status |
| **Sales Orders** — top priority | Salesman (create), Manager (approve), Dispatcher (load) | Create (Version B, mobile-first); list (filter status/customer/route/date); detail (ordered/approved/loaded qty per line, money breakdown, status timeline); edit/cancel (pending only); approve (per-line qty, surfaces stock constraints); load (per-line qty); generate invoice | Customer, line items (product, qty), remarks, delivery date, computed summary |
| Inventory | Dispatcher/Admin | Stock summary (physical/reserved/damaged/expiry/**sellable** per product per warehouse, low-stock flagged); adjustment (required reason); transfer between warehouses. **No free-edit of stock numbers anywhere** | Product, warehouse, quantities, reason |
| Purchases | Dispatcher/Admin | Create draft, list/detail, edit draft, receive (per-line qty, Version B pre-filled = ordered qty), cancel draft | Supplier, warehouse, date, line items, computed GST/total |
| Invoices | Cashier/Manager/Admin | List (filter payment status/date/customer); detail — clean/printable, GST breakdown, payment status, linked order/payments/delivery; cancel where allowed | Invoice #/date, customer, GST breakdown, total, payment status |
| Deliveries | Driver, Dispatcher | Assign (invoice → vehicle+driver); driver's list (today's deliveries, next stop highlighted); detail/progress: Start → Arrive (GPS checkpoint, no separate status color — see §4) → Complete (GPS+signature+photo+payment, one flow, Version B pre-fills expected cash) → or Fail (reason) | Customer, address, amount to collect, status, GPS, signature, photo |
| Payments | Cashier, Driver | Record against invoice (cash/UPI/cheque, partial allowed, Version B pre-fills outstanding amount); list/reconcile (filter status/date/driver); verify; mark bounced (reason) | Amount, method, reference, status |
| Returns | Dispatcher, Manager, Salesman | Create against invoice (reason, remarks, photo, per-line reason, Version B pre-fills qty=invoice qty); list/detail (filter status); approve/reject (reason); complete (stock updates automatically by reason — make the outcome visible). **Completing a return automatically creates a Credit Note** (see next row) | Invoice, line items, reason, photo, status |
| **Credit Notes** — *found in the backend, missing from earlier drafts* | Manager/Admin | A credit note is auto-created (status `pending`) the moment a return is completed — no manual "create" screen needed. Just: list (filter by status), detail (linked return, customer, amount), approve, reject | Return, customer, amount, status |
| Tally Sync | Admin/Cashier | Simple status view (pending/synced/failed counts) + retry. Low-frequency — keep small, not prominent in navigation | Sync status per record |
| Reports | Manager/Admin | A handful of scannable views: sales over time, orders by status, outstanding dues (by customer/route/age), stock on hand/low-stock, delivery performance | — |
| Customer Portal — separate, simpler surface | Customer | Home (place-order CTA, recent orders, dues); browse catalogue (own prices only, no cost prices, no other customers' data); place order (Version B, cart-style); my orders (edit/cancel only while pending); my invoices & dues (read-only); my deliveries (read-only); profile (limited self-edit — contact/shop info only; commercial fields like credit limit/route/price list are staff-managed, shown read-only) | Same as Sales Orders, scoped to self |

**Explicitly not in the Customer Portal:** approvals, loading, invoicing, payment recording/verification, purchases, inventory, returns processing, master data, reports, or any other customer's data.

---

## 6. Home Screen Per Role

| Role | Should show |
|---|---|
| Admin/Manager | Today's orders, pending approvals, outstanding dues, low-stock alerts, deliveries in progress |
| Salesman | My route's customers, my orders today, a large **"New Order"** entry point — the one thing they open the app to do |
| Driver | Today's deliveries with status, a clear next stop — practically the whole app for this role |
| Cashier | Payments to verify, outstanding invoices, cheques pending/bounced |
| Dispatcher | Purchases to receive, orders to load, returns to process, low stock, deliveries to assign |
| Customer (portal) | Prominent **"Place an order"**, recent orders with status, outstanding dues at a glance |

Dashboards are built last in the build order (§9) — a dashboard is just a read-only view over data/screens that need to exist first, so building it last means it shows real numbers from day one instead of placeholders.

---

## 7. Key Journeys — Design & Build These as Flows, Not Isolated Screens

1. **Salesman takes an order** (phone, maybe weak signal): open app → pick customer → add products fast → see live total → submit → confirmation.
2. **Customer places their own order** (portal): log in → browse own prices → add products/qty → review computed total → submit → clear "pending, awaiting approval" message.
3. **Manager approves, dispatcher loads** (desktop): review pending order → approve quantities (stock reserved) → dispatcher confirms loaded quantities → generate invoice.
4. **Driver delivers and collects** (phone): today's route → navigate to next stop → arrive (GPS) → signature/photo → record cash/UPI → complete → next stop.
5. **Cashier reconciles** (desktop): review payments → verify cleared ones → mark bounced cheques → track dues.
6. **Dispatcher receives stock** (desktop): create purchase → receive → stock updates automatically.
7. **Return handling:** raise return with photo → approve → complete → stock adjusts automatically by reason → a credit note is created automatically → manager approves/rejects the credit note.

---

## 8. Look & Feel

### Colors
Plain, light background, white cards, one blue accent for buttons/links/active nav. Status colors fixed per §4's table — never re-chosen per screen. Dark mode considered but not required for v1.

### Typography
One system font (no custom webfont — no added load time). Slightly bigger base text on phone/field/portal screens than dense desktop back-office screens, since phone screens are read at a glance, not studied.

### Buttons — 4 types, used consistently everywhere
- **Primary** (solid blue) — the one main action on a screen.
- **Secondary** (outline) — Cancel/Back.
- **Danger** (red outline, fills solid on hover) — Delete/Reject/Cancel.
- **Text link** (no border/background) — low-importance actions, e.g. "View" in a table row.

Every button needs a clear hover, pressed, disabled, and loading look (label replaced by a spinner, button doesn't change width, brief success flash after).

### Motion
Subtle, purposeful only — a quick fade/slide when something opens or closes. Motion should always answer "where did this come from," never be decoration. Respect reduced-motion accessibility settings.

### Components built once, reused everywhere
Button, Input/Select (with a distinct locked/greyed look for server-calculated fields), Status badge, Data table (search/filter/sort/pagination/empty state), Detail layout (header + status timeline + related-items tabs), Form (grouped fields, inline errors, sticky save bar), Modal/confirm dialog, Toast notification, Photo capture, Signature pad.

### Navigation
- **Staff desktop:** fixed left sidebar, filtered by role.
- **Field (salesman, driver) & Customer Portal:** bottom tab bar, 4–5 items max, thumb-reachable — no hamburger drawer, since field roles need one-handed, no-look access mid-task.
- **Customer Portal:** even simpler than staff nav — fewer items, no sidebar even on desktop, since it's a distinct lightweight surface for a non-power-user audience.

---

## 9. Build Plan

### 9.1 Decisions (Locked)
- One Next.js app, two route groups: `(staff)/`, `(portal)/`, plus `/login`. Shared login, components, one deployment.
- Responsive web only — no native app for MVP. PWA layer (installable, works better offline) can be added later without a rewrite.
- New dependencies: only `@tanstack/react-query` (data fetching/caching) and `react-hook-form` (forms).
- Styling: Tailwind + our own small set of basic components — no big UI library.
- Auth: backend gives a plain token, no cookies/server session — store it in the browser, attach to every request, logout just deletes it locally (no API call needed).

### 9.2 Folder Structure
```
frontend/
  app/                → pages/routes only, kept thin
    (staff)/
    (portal)/
    login/
  features/           → one folder per domain (orders, customers, products...)
    orders/
      components/
      hooks/
  components/ui/      → shared basic components used across domains
  services/           → one file per domain — all API calls live here, e.g. services/orders.ts
  lib/                → axios setup, react-query setup
  types/              → one file per domain, matching the API's data shapes
  hooks/              → shared hooks not tied to one domain (useAuth, useGeolocation)
  constants/          → roles.ts, statuses.ts, routes.ts, permissions.ts
  utils/              → formatCurrency, formatDate, formatPhone, formatStatus
```
Rule: a component used in only one domain lives in that domain's folder. Once a second domain needs it, move it to `components/ui/` — don't move it there "just in case."

### 9.3 How We Call the API
No component calls the API directly. Each domain gets one `services/<domain>.ts` file with plain functions (`getCustomers()`, `createCustomer()`, etc.). Components call a React Query hook that calls the service function — components never see a URL or HTTP verb.

**Data refresh rule:** default is refetch after any change (correct for anything involving money/GST/stock). Exception: simple status toggles with no side effects (customer/user/vehicle active-inactive) update instantly and roll back on error.

### 9.4 Forms
One shared `<Form>` component (react-hook-form) used everywhere — label, inline error, consistent Save button states, server errors shown without wiping typed data, locked look for server-calculated fields.

### 9.5 Naming & Routes
Every module follows the same pattern: `orders/`, `orders/new`, `orders/[id]`, `orders/[id]/edit`. No module invents its own.

### 9.6 Build Order

- **Phase 0 — Foundation:** login, shared components, both app shells. No visible features yet, but everything else needs this.
- **Phase 1 — Master data (Admin, desktop):** Users, Routes, Customers, Categories/Brands/Products, Price Lists, Warehouses, Suppliers, Vehicles.
- **Phase 2 — Core selling flow**, split into smaller milestones instead of one giant phase:
  - **2A — Sales Orders:** create (Version B), list, detail, edit/cancel.
  - **2B — Approval:** manager approves.
  - **2C — Order Loading:** dispatcher confirms loaded qty.
  - **2D — Invoices:** generate and view.
  - **2E — Inventory:** stock view, adjustment, transfer.
- **Phase 3 — Delivery & Payment:** assign deliveries, driver's flow, record/verify payments.
- **Phase 4 — Buying & Returns:** purchases (create/receive/cancel), returns (create/approve/complete), **credit notes** (list/approve/reject — small addition, rides along with returns since one auto-creates the other).
- **Phase 5 — Customer Portal:** built after the staff order flow works (reuses the same catalogue/order-summary pieces, same Version B pattern).
- **Phase 6 — Admin & Reports (last):** Tally sync status, reports/dashboards, role home screens — built last so they show real data, not placeholders.

**A phase is "done" only when:** every basic action (add/edit/list) works, validation works, search/filter/pagination work, the right roles can/can't see it, mobile layout is checked on a real small screen where relevant, and the smoke checklist below passes.

### 9.7 Testing (Simple, Not Heavy)
- **Manual smoke check after every phase:** Login → Logout → do the new phase's main actions → re-check everything from earlier phases still works.
- **Automated tests:** only for shared components (Table, Form, StatusPill, etc.) since a bug there breaks every screen, plus one test per critical data-saving action to confirm it refreshes the right data.
- Full browser automation testing (Playwright) — later addition, not needed to ship the MVP.

### 9.8 Offline (Salesman & Driver)
Full offline mode (zero-signal working + automatic background sync) is a big feature on its own — not building the full version for MVP. For now: if a submit fails from bad signal, keep the entered data on screen, show "not sent — will retry," let the user retry manually. Full offline mode is a later addition.

---

## 10. Open Items & Status

**This document has now been checked directly against the backend code** (`app/core/enums.py`, `app/api/*`, `app/services/*`, `app/core/deps.py`), not just the earlier requirement docs. Corrections made from that review are folded into §2, §4, and §5 above; the ones worth calling out separately:

- **No "Warehouse" login role exists.** Fixed throughout this doc to say **Dispatcher** (the real role that does warehouse-floor work today, per `UserRole` in `app/core/enums.py`).
- **Credit Notes is a real module we'd missed.** Backend auto-creates one every time a return is completed (`app/services/return_.py`) — added to §5 as a small list/approve/reject screen, riding along with Returns in Phase 4.
- **Order status has 5 states, not the "...→ invoiced" flow we first wrote:** `pending → approved → loaded → delivered → cancelled` (`OrderStatus` enum) — invoice is a separate linked record, not a stop on the order's own status bar. Delivery status has no separate "arrived" state either — arrival is a GPS+timestamp checkpoint inside `out_for_delivery`, not its own colored pill. Both corrected in §4.
- **Backend doesn't yet enforce per-role permissions** — only "is this a staff login" (`require_staff` in `app/core/deps.py`), not "is this staff member a Manager." Frontend should still hide nav/guard routes by role (good UX), but this isn't a real security boundary until the backend adds it — flagged for the backend side to pick up.
- **Customer profile editing:** no rule yet for which fields a customer can edit themselves vs. staff-only (confirmed — `CustomerUpdate` schema has no such split). Suggestion: customers edit their own contact info (name, mobile, address); commercial fields (credit limit, price list, route) stay staff-only. Needs sign-off before Phase 5, not before starting.
- **Design approach:** locked — Version B, "Smart One Screen" (§3).
- **Ready to start:** Phase 0 now. No other blockers.
