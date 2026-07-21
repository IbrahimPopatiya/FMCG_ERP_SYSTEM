# UI/UX Design Specification — DMS

| | |
|---|---|
| **Purpose** | The exact visual and interaction spec — every button, state, hover, and transition — so any of us can build a screen without guessing. |
| **Audience** | Whoever is writing the frontend code. |
| **Based on** | `ui_ux_functional_requirements.md` (what must exist), `frontend_build_plan.md` (build order, component list, folder structure), `api_reference.md` (fields), and established design practice cited inline (Material Design 3, Apple HIG, Nielsen Norman Group heuristics, and the dense/fast admin style used by Linear, Stripe Dashboard, and Notion — chosen because this is a B2B tool where speed and scanability beat visual richness, matching the UX doc's brief of "clean, minimal, fast, friendly"). |
| **Status** | Draft for review — every page has a "Design Review" note showing what I reconsidered and rejected. Mark up anything you'd change. |
| **Scope note** | This defines **look, feel, and interaction**. It does not repeat the *functional* requirements already in `ui_ux_functional_requirements.md` — read that alongside this. |

---

## 0. How to Read This Doc

1. **§1–4** define the design system once — colors, type, spacing, motion, and every shared component's states. Build these first (they map directly to `frontend_build_plan.md` §3 and Phase 0).
2. **§5** defines the three app shells (staff desktop, staff/field mobile, customer portal).
3. **§6** applies the system to every page, module by module, in the same phase order as the build plan. Each module starts from one of three **templates** (List, Detail, Form — defined once in §4) and only lists the *deltas*: which fields, which actions, which states differ. This avoids re-describing "a table with search and pagination" eighteen times.
4. Each page/module ends with a **Design Review** callout — a deliberate self-check ("does this button need to exist, is this the right place for it") rather than a rubber-stamp. Treat these as things to argue with, not settled facts.

---

## 1. Design Foundations (Tokens)

### 1.1 Color

Two color needs: **neutral UI chrome** (backgrounds, text, borders) and **semantic status color** (drives 90% of the visual decisions in this app, per UX doc §3.6). Keep the palette small — a B2B tool used all day should not fight the eye.

**Neutrals** (slate-based, works in light and dark):

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg-canvas` | `#F8F9FB` | `#0F1115` | Page background |
| `bg-surface` | `#FFFFFF` | `#1A1D23` | Cards, tables, modals |
| `bg-surface-sunken` | `#F1F2F5` | `#12141A` | Input backgrounds, table header row |
| `border-default` | `#E3E5E9` | `#2A2D35` | Dividers, table borders, input borders |
| `border-strong` | `#C8CBD1` | `#3D4048` | Focus rings' outer edge, active tab underline |
| `text-primary` | `#14161A` | `#F2F3F5` | Headings, body |
| `text-secondary` | `#63666E` | `#9AA0AB` | Labels, meta text, placeholders |
| `text-disabled` | `#A6A9B0` | `#5C6068` | Disabled text |
| `brand-primary` | `#2563EB` (blue-600) | `#3B82F6` | Primary actions, links, active nav |
| `brand-primary-hover` | `#1D4ED8` | `#60A5FA` | Hover state of the above |

**Semantic status colors** — one fixed mapping, reused by every `<StatusPill>` everywhere (never re-chosen per screen):

| Status family | Color | Hex (bg-tint / text / dot) |
|---|---|---|
| Pending / draft / requested / unpaid | Amber | `#FEF3C7` / `#92400E` / `#F59E0B` |
| Approved / active / cleared / in_use / paid | Green | `#DCFCE7` / `#166534` / `#22C55E` |
| Loaded / out_for_delivery / partial / available | Blue | `#DBEAFE` / `#1E40AF` / `#3B82F6` |
| Delivered / completed / received / synced | Teal | `#CCFBF1` / `#115E59` / `#14B8A6` |
| Cancelled / rejected / bounced / failed / blocked / maintenance / inactive | Red | `#FEE2E2` / `#991B1B` / `#EF4444` |

Rule: color + text label + dot, never color alone (colorblind-safe, per WCAG — a pill always reads e.g. "● Pending", not just a colored chip).

### 1.2 Typography

One typeface (system font stack: `-apple-system, "Segoe UI", Inter, sans-serif` — no webfont download cost, matches CLAUDE.md's "no unnecessary dependency"). Scale:

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `text-xs` | 12/16px | 500 | Table meta, timestamps, helper text |
| `text-sm` | 14/20px | 400 | Body default, table cells, inputs |
| `text-base` | 16/24px | 400 | Form field values, list titles |
| `text-lg` | 18/28px | 600 | Section headers, card titles |
| `text-xl` | 22/28px | 600 | Page titles |
| `text-2xl` | 28/34px | 700 | Dashboard headline numbers, money summary totals |

Mobile note: bump body from `text-sm`→`text-base` on field/portal screens (salesman, driver, customer) — smaller text is a desktop-density trade-off that doesn't belong on a phone used one-handed in the field.

### 1.3 Spacing & Radius

8px base grid: `4, 8, 12, 16, 24, 32, 48, 64`. Card/input radius `8px`; buttons `6px`; pills fully rounded (`999px`); modals `12px`.

### 1.4 Elevation (shadow)

Flat design by default (borders, not shadows, separate content — matches the "clean, minimal" brief and avoids a heavy skeuomorphic feel). Shadow reserved for things that **float above** the page:

| Token | Value | Use |
|---|---|---|
| `shadow-none` | — | Cards, table rows (border only) |
| `shadow-sm` | `0 1px 2px rgba(0,0,0,.06)` | Dropdowns, popovers |
| `shadow-md` | `0 4px 16px rgba(0,0,0,.10)` | Modal, toast |
| `shadow-lg` | `0 12px 32px rgba(0,0,0,.16)` | Bottom sheet (mobile), FAB |

### 1.5 Motion

Consistent timing so the app feels like one system, not a pile of components each animating on its own clock. Grounded in Material Design 3's motion guidance (short duration for small elements, standard easing that decelerates into place).

| Token | Duration | Easing | Use |
|---|---|---|---|
| `motion-instant` | 100ms | linear | Hover color/background changes, button press |
| `motion-fast` | 150ms | ease-out | Dropdown/tooltip open, input focus ring |
| `motion-standard` | 200ms | cubic-bezier(0.2, 0, 0, 1) | Modal/sheet open-close, page section expand/collapse |
| `motion-slow` | 300ms | cubic-bezier(0.2, 0, 0, 1) | Route transitions (page fade), toast slide-in |

**Rule: motion communicates, it never decorates.** Every animated transition below exists to answer "where did this come from / where did this go" (e.g., a modal scales from the button that opened it) or to soften a state change (skeleton→content). No animation is added purely for flourish — that's the kind of overengineering CLAUDE.md warns against, applied to design instead of code. If you can't say what question a motion answers, cut it.

**Reduced motion:** respect `prefers-reduced-motion` — collapse all `motion-standard`/`motion-slow` transitions to an instant cross-fade at `motion-instant`.

---

## 2. Component Library — States & Interactions

Every component below is built **once** (`components/ui/`, per `frontend_build_plan.md` §1.6) and reused everywhere. This section is the literal implementation spec — the "where should hover/slide be" the request asked for.

### 2.1 Button

Four variants, three sizes. One shared state machine.

| Variant | Use | Default | Hover | Active/Press | Disabled |
|---|---|---|---|---|---|
| **Primary** | The one main action per screen (Save, Submit, Approve) | `bg-brand-primary`, white text | `bg-brand-primary-hover`, 100ms | `scale(0.98)`, 100ms — gives tactile "pressed" feedback | `bg-text-disabled` bg, no hover/press response, cursor `not-allowed` |
| **Secondary** | Supporting action next to primary (Cancel, Back) | `border-default` border, transparent bg, `text-primary` | `bg-surface-sunken` fill fades in, 100ms | `scale(0.98)` | same disabled treatment |
| **Danger** | Destructive (Delete, Reject, Cancel Order, Mark Bounced) | `border` red, red text, transparent bg | fills solid red bg, white text, 100ms | `scale(0.98)` | disabled |
| **Ghost/Text** | Low-emphasis inline action (table row "View", "Edit" link) | no border/bg, `brand-primary` text | `bg-surface-sunken` bg fades in behind text, 100ms | `scale(0.98)` | disabled, text→`text-disabled` |

Sizes: `sm` (32px height, table row actions), `md` (40px, default), `lg` (48px, mobile primary actions — meets the 44×48px minimum touch target per Apple HIG/Material guidance for field/portal screens).

**Loading state** (any button triggering a mutation): label replaced by a spinner of the same color as the label, button width does not shrink (reserve width so nothing reflows), button becomes non-interactive during the request. On success: brief checkmark flash (200ms) before the button either disappears (if the action navigates away) or reverts to default (if it stays, e.g. "Save" on a form that stays open).

**Focus:** every interactive element gets a visible focus ring (`2px brand-primary`, 2px offset) on keyboard focus only (`:focus-visible`, not `:focus`, so mouse clicks don't show a ring) — accessibility requirement, not optional polish.

**Design Review:** I considered a 5th variant ("icon-only button" for table row actions) but folded it into Ghost at `sm` size instead — a separate variant would be one more thing to maintain for a difference that's really just "no label, has an icon." Rejected.

### 2.2 Input / Select / Textarea

- **Default:** `bg-surface-sunken`, `border-default` 1px, `text-primary`, 40px height, 12px horizontal padding.
- **Focus:** border becomes `brand-primary` 2px, background lightens to `bg-surface`, 150ms transition (`motion-fast`).
- **Error:** border becomes red, a red `text-xs` message appears **below** the field with an 8px slide-down + fade-in (150ms) — never a floating tooltip (those get missed on mobile), always inline and persistent until fixed.
- **Disabled / read-only-computed** (§3.7 rule — money/GST/stock fields): `bg-surface-sunken` with a visibly different lighter look, a small lock icon at the field's right edge, `text-secondary` value color, cursor `not-allowed`. This is the one visual pattern that must look identical on every screen so users learn instantly "this number is calculated, don't try to edit it."
- **Select:** native `<select>` styled to match, chevron icon rotates 180° on open (`motion-fast`).
- **Label position:** always above the field (not floating/inline) — floating labels save vertical space but hurt scanability on dense forms; this app has many multi-field forms (product create, customer create), so a static label wins for clarity over the small space savings.

### 2.3 StatusPill

Rounded-full pill, dot + label, colors from §1.1. Fixed height 24px, `text-xs` weight 600. No hover state (it's not clickable — status changes happen through explicit action buttons, not by clicking the pill) — this matters: **don't make the pill itself an implicit action trigger**, it's purely informational.

### 2.4 DataTable

The single most-reused component (every list screen). Behavior:

- **Row hover:** `bg-surface-sunken` fade-in, 100ms, entire row is a click target (not just a "view" link) — navigates to detail. Cursor becomes pointer over the row.
- **Row with quick actions** (e.g. order row with an inline "Approve" button): the quick-action button sits at the row's right edge, `stopPropagation` on click so it doesn't also trigger row navigation.
- **Sortable header:** click toggles asc/desc, an arrow icon fades in/rotates (150ms) next to the active sort column; only one column sortable at a time (keep it simple — multi-column sort is a power-user feature this MVP doesn't need, YAGNI).
- **Search box:** top-left, debounced 300ms before firing the query — avoids a request per keystroke.
- **Filters:** top-right, dropdown chips; an active filter shows as a removable tag below the search bar (`× Route: North` — click × to clear that one filter, 100ms fade-out).
- **Pagination:** bottom, page-number style for desktop (dense back-office use expects jump-to-page), **infinite scroll** for any list a salesman/driver/customer will scroll on mobile (field/portal screens) — same underlying paginated API, different UI pattern per context, because "which of these is right" depends on device, not on data.
- **Empty state:** centered icon + one-line message + primary "Create new" button. Two variants: *true empty* ("No customers yet — add your first one") vs *filtered empty* ("No results match your filters — [Clear filters]") — these need different copy and different CTA, a common mistake is showing "create new" when the real issue is an over-narrow filter.
- **Loading state:** skeleton rows (gray animated-pulse bars matching the column layout) — never a spinner replacing the whole table, since that causes layout jump when data arrives. Skeleton "shimmer" is a left-to-right gradient sweep, 1.2s loop, `ease-in-out`.

**Design Review:** I initially had checkboxes + bulk-action toolbar on every table (bulk-activate, bulk-delete). Cut it for MVP — none of the UX doc's module descriptions (§4.2–§4.16) ask for bulk operations, and adding it "because tables usually have it" is exactly the imagined-future-requirement CLAUDE.md tells us to avoid. Revisit only if a real workflow (e.g., "deactivate 40 customers on a closed route") comes up.

### 2.5 DetailLayout

- **Header block:** entity name/number (large, `text-xl`), StatusPill next to it, primary action button(s) top-right (the action(s) valid for the *current* status only — per UX doc §3.4, e.g. a `pending` order shows Approve+Cancel, nothing else).
- **Status timeline:** horizontal stepper on desktop (Pending ● — Approved ● — Loaded ● — Invoiced ●), collapses to a vertical list with timestamps on mobile. Completed steps solid-filled, current step pulses gently (2s loop opacity 1↔0.6 — a subtle "this is where we are" cue, not distracting), future steps outlined/gray.
- **Tabs for related items** (e.g. Order detail → Line Items / History tabs): underline-style tab, active tab's underline slides between tabs on click (`motion-standard`, 200ms transform) rather than an abrupt swap — this is the one "slide" effect worth having, because it shows spatial relationship between tabs.
- **Line items table:** reuses DataTable in a compact, non-paginated mode (no search/filter needed inside a single record's item list).

### 2.6 Form (Create/Edit)

- Single column on mobile; **two-column grid on desktop** for short fields (name/mobile/email side by side), full-width for long fields (address, remarks) and for anything with inline validation likely (keeps error messages from feeling cramped).
- **Sticky footer action bar** on long forms (Save / Cancel), so the user never has to scroll to find Save — especially important on the product/customer create forms with 10+ fields.
- **Unsaved-changes guard:** if the user navigates away with a dirty form, show a confirm dialog ("Discard changes?") — prevents silent data loss, a common and painful gap.
- **Submit sequence:** button → loading state (§2.1) → on success, toast ("Customer created") + navigate to the new record's detail page; on server error, banner at the top of the form (not just a toast, which can be missed) + preserve all entered values (per `frontend_build_plan.md` §1.9).

### 2.7 Modal / ConfirmDialog

- **Open:** background dims (`rgba(0,0,0,.4)`, fades in 150ms) + modal scales in from 96%→100% opacity 0→1, 200ms, anchored to page center (desktop) or slides up from the bottom edge as a **bottom sheet** on mobile (thumb-reachable, matches native mobile app conventions rather than a centered modal that's awkward to dismiss one-handed).
- **Close:** reverse of open, 150ms (closing is snappier than opening — standard motion convention, exit is quicker than entrance).
- **Dismiss:** click outside, `Esc` key, or explicit close button — all three, always.
- **ConfirmDialog** (destructive actions, §3.11): title states the action plainly ("Cancel this order?"), body states the consequence ("This cannot be undone."), two buttons — Danger-variant "Cancel Order" and Secondary "Keep Order" — **danger action is never the button that's easiest to hit by accident**: place the safe/dismiss option in the position a thumb naturally lands (bottom-right on desktop dialogs by OS convention; on mobile bottom sheets, the destructive action is never the top-most/first-reached button).

### 2.8 Toast

Bottom-right on desktop, bottom-center (above any bottom nav) on mobile. Slides in from off-screen edge + fades, `motion-slow` (300ms), auto-dismisses after 4s with a thin progress-bar underline draining left-to-right so the user can see time remaining, pauses drain on hover. Stacks (max 3 visible, older pushed up/out).

### 2.9 PhotoCapture

Tap target opens: **camera directly** on mobile (`<input type="file" capture>"`), file picker on desktop. Flow: tap → native capture UI → preview thumbnail appears with a small × to remove and a "retake" ghost button → upload starts automatically in background with a thin progress bar under the thumbnail → on success, thumbnail gets a small green check badge (bottom-right corner, matches StatusPill green) → on failure, red retry icon overlays the thumbnail, tap to retry. Never blocks the rest of the form — upload happens async while the user keeps filling other fields.

### 2.10 Signature Pad (Delivery completion)

Full-width canvas, light gray "Sign here" placeholder text/line that disappears on first touch. "Clear" ghost-button below it. Captures as an image, uploaded the same way as PhotoCapture on save.

### 2.11 Navigation

- **Desktop sidebar (staff):** fixed left, 240px, sections grouped by domain (matches nav map in UX doc §5). Active item: `bg-surface-sunken` pill behind the label + `brand-primary` text/icon, no hover-slide gimmick — just an immediate background fade (100ms) on hover for inactive items.
- **Mobile bottom nav (field/portal):** 4–5 icons max (more than that and icons+labels stop being legible at thumb-size) — for salesman: Home, Customers, New Order (center, visually raised as the primary action per the "optimize hard for speed" brief), Orders, Profile. Active icon fills solid + label appears below it in `brand-primary`; inactive icons are outline-only with `text-secondary` label. Tap gives a quick 100ms scale-bounce (0.9→1) for tactile feedback.
- **Top bar (both):** current page title, global search (desktop only — mobile search lives inside the relevant list screen instead, since a global search bar competing with a 5-icon bottom nav on a small screen is clutter), user avatar/menu (role name to make login-context always visible, per UX doc §3.2) with a dropdown for Logout.

**Design Review:** I looked at a hamburger-drawer nav for mobile (common on admin dashboards) instead of bottom-nav — rejected for the field roles specifically, because a driver/salesman needs one-thumb, no-look access mid-task (holding a delivery box, standing in a shop); a drawer requires a two-step reveal-then-tap. Desktop sidebar stays a sidebar (no collapse-to-icons toggle) — that's a common "space-saving" feature that adds a stateful UI toggle for a screen size (desktop) where space usually isn't the constraint. Cut.

---

## 3. Global Interaction & Loading Rules

Applies to every page in §6 — stated once here instead of repeated per page.

1. **Loading:** first load of a page → skeleton matching the eventual layout (never a centered spinner covering the whole page — that's a bigger layout jump when content lands). Subsequent refetch (e.g. after a mutation) → keep old content visible, small inline spinner near the affected area only.
2. **Optimistic vs. refetch:** per `frontend_build_plan.md` §1.8 — most actions show the loading state and wait; only the named-exception status toggles (customer/user/vehicle active-inactive) flip instantly and roll back with a toast if the server rejects it.
3. **Error:** inline retry for list/detail fetch failures (a small banner with a "Retry" ghost button, not a full error page — the rest of the app shell stays usable). Form submit errors: banner inside the form (§2.6), not a toast.
4. **Every destructive/status-changing action** (cancel, reject, mark bounced, delete) goes through ConfirmDialog (§2.7) — no destructive action fires directly off a single tap, this is non-negotiable per UX doc §3.11.
5. **Page transitions:** simple 150ms cross-fade between routes (Next.js route change) — no slide/parallax between full pages, that's a mobile-native-app affordation this responsive web app doesn't need and would fight the browser's own back/forward gesture expectations.

---

## 4. Page Templates (defined once, applied in §6)

### Template A — List Screen
`[Page title] [+ Create button, top-right]`
`[Search box] [Filter chips] [Sort via column headers]`
`<DataTable>` (§2.4) with status pill column, row-click→detail
`[Pagination footer]`

### Template B — Detail Screen
`[Back arrow] [Entity title] [StatusPill] ................ [Status-appropriate action buttons]`
`[Status timeline]` (if entity has a lifecycle)
`[Key info panel — 2-column key/value grid]`
`[Tabs for related data]` (line items / history / linked records)
`[Money/summary panel, read-only, visually distinct]` (if applicable, per §3.7 rule)

### Template C — Create/Edit Form
`[Back arrow] [Page title: "New Customer" / "Edit Customer"]`
`[Grouped fields — 2-col desktop / 1-col mobile]`
`[Read-only computed panel]` (if applicable)
`[Sticky footer: Cancel (secondary) — Save (primary)]`

---

## 5. App Shells

### 5.1 Staff Desktop Shell
```
┌─────────────────────────────────────────────────────┐
│ Top bar: [Page title]        [search]   [User ▾]    │
├───────────┬───────────────────────────────────────────┤
│ Sidebar   │                                           │
│ (240px)   │        Page content (Template A/B/C)      │
│ - Dashboard│                                          │
│ - Customers│                                          │
│ - Products │                                          │
│ - Orders   │                                          │
│ - ...      │                                          │
└───────────┴───────────────────────────────────────────┘
```
Sidebar sections filtered by role per `permissions.ts` (§9 of build plan). Collapses to the mobile shell below `768px` — but desktop-primary roles (Admin, Manager, Cashier) are not expected to use it there; it's a graceful-degradation safety net, not a designed-for path.

### 5.2 Field/Mobile Shell (Salesman, Driver, and staff on small screens)
```
┌───────────────────┐
│ Top bar: title, ⋮  │
├───────────────────┤
│                    │
│   Page content     │
│  (single column)   │
│                    │
├───────────────────┤
│ 🏠  👥  ➕  📦  👤 │  ← bottom nav, center item raised
└───────────────────┘
```

### 5.3 Customer Portal Shell
Same bottom-nav pattern as §5.2 but only 4 items: **Home, Catalogue/Order, My Orders, Profile** — deliberately fewer than staff nav, since the portal is "a distinct, minimal surface" per UX doc §4.18. No sidebar variant needed even on desktop — a centered, max-width-720px single column reads better for a shop owner than a sidebar built for the staff's dozen modules; this is a case where we deliberately don't reuse the staff shell.

---

## 6. Page-by-Page Specification

Organized to match `frontend_build_plan.md`'s phase order. Each entry: **Template used**, **fields/columns** (from `api_reference.md`), **actions & where they sit**, **states**, **mobile delta**, **Design Review**.

### 6.1 Login (`/login`) — Phase 0

Not a template A/B/C — one-off, deliberately minimal:
```
[Logo/App name]
[Mobile number]
[Password]           [Show/hide eye icon]
[Log in]  ← primary, full-width, lg size
```
- Centered card, max-width 400px, on `bg-canvas`.
- Field errors inline (§2.2) under the relevant field; a wrong-credentials error is a form-level banner ("Mobile number or password is incorrect") since the server can't say *which* field is wrong (security — don't reveal if the mobile number exists).
- Submit → button loading state → success navigates by `principal_type` (staff → dashboard, customer → portal home) per `frontend_build_plan.md` §2.
- No "remember me" (session persists via localStorage token until logout or 401, per the build plan's confirmed stateless-JWT design) — one less control to design/explain.

**Design Review:** Considered a split-screen marketing-style login (image + form) common on SaaS landing pages — rejected; this app has no public visitors, every user already knows what it is, so a plain centered form gets people working faster. Decorative imagery here would be exactly the "richness over speed" tradeoff the UX brief explicitly says to avoid.

### 6.2 Dashboards (role home) — Phase 6, built last per build plan §4

Per-role card grid, Template-agnostic (a dashboard is its own pattern: a grid of stat cards + a couple of mini-lists, not a table or form).

| Role | Cards shown |
|---|---|
| Admin/Manager | Today's orders (count), Pending approvals (count, links to filtered order list), Outstanding dues (₹, links to reports), Low-stock alerts (count), Deliveries in progress (count) |
| Salesman | My route's customers (count), My orders today (count), **large "New Order" button** (not a card — a full-width `lg` primary button pinned near the top, this is the one thing a salesman opens the app to do) |
| Driver | Today's deliveries list (not a stat card — directly the list, sorted by "next stop") |
| Cashier | Payments to verify (count), Outstanding invoices (₹), Cheques pending/bounced (count) |
| Warehouse | Purchases to receive (count), Orders to load (count), Returns to process (count), Low stock (count) |
| Customer (portal) | **"Place an Order" CTA** (large, top), Recent orders (mini-list, 3 items, "View all" link), Outstanding dues (₹, one line) |

Each stat card is clickable → navigates to that list pre-filtered (e.g. "Pending approvals: 4" → Orders list filtered to `status=pending`). Cards use `bg-surface`, no shadow (flat, per §1.4), hover: subtle `border-strong` border + `translateY(-1px)` (100ms) — signals clickability without a heavy shadow-pop effect.

**Design Review:** Rejected auto-refreshing dashboard data (polling every N seconds) for MVP — adds complexity (background refetch, "data updated" indicators) for a need not stated in the UX doc; a manual pull-to-refresh (mobile) / refresh icon (desktop) is enough for v1. Revisit if daily use shows staff leaving the dashboard open all day expecting live counts.

### 6.3 Users (Staff) — Phase 1, Admin only

- **List (A):** columns Name, Mobile, Role (as a plain badge, not StatusPill — role isn't a lifecycle status), Status pill (active/inactive), row action: quick-toggle Activate/Deactivate icon-button at row-end (uses the optimistic-update exception, §1.8 of build plan).
- **Form (C):** Name, Mobile, Email, Password (create only — never shown/editable in edit mode, a separate "Reset password" secondary action instead), Role (select).
- **Design Review:** No "Delete" button on the list row — soft-delete is a Detail-page action (behind a ConfirmDialog), not a one-click row icon, since it's the most destructive action in this module and shouldn't sit next to the low-stakes Activate/Deactivate toggle.

### 6.4 Routes — Phase 1, Admin/Manager

- **List (A):** Name, Assigned Salesman, Status.
- **Form (C):** Name, Salesman (select, searchable if list is long).
- No separate "Assign salesman" screen — it's just the salesman field on the same edit form (matches YAGNI — a whole reassignment workflow isn't needed for a single dropdown).

### 6.5 Customers — Phase 1, Admin/Manager/Salesman

- **List (A):** Business Name, Owner, Mobile, Route, Status pill (active/inactive/**blocked** — blocked renders red like cancelled, distinct enough from inactive gray... actually per §1.1 inactive uses the same red family as blocked/cancelled since both are "stop" states; use the **StatusPill label text** to disambiguate, not a 4th color family — keeps the palette from sprawling).
- **Detail (B):** key info grid (business/owner/contacts/GST/address/credit limit/payment terms/route/price list), a small embedded map pin (static map image, not an interactive map, for the saved GPS location — interactive maps are heavier than a detail page needs), tabs: **Orders** (recent, mini-DataTable), **Outstanding Dues** (a single highlighted ₹ figure + link to invoices).
- **Form (C):** grouped fields — "Business Details," "Contact," "Commercial" (credit limit, payment terms, route, price list), "Location" (address fields + a **"Use my current location"** button next to a map, mobile-critical per UX doc §3.10 — tapping it fills lat/long silently behind the scenes and drops a pin on the embedded map, no manual lat/long typing ever exposed to the user).
- Status change (active/inactive/blocked) is a **select dropdown next to the StatusPill on the detail page**, not a form field — changing it is a distinct, confirmed action (ConfirmDialog for "blocked" specifically, since that has business consequences like halting orders — not for the routine active/inactive toggle).

**Design Review:** Considered putting GPS capture inline in the create form directly — kept, but flagged that "use current location" only works meaningfully in the field (salesman on-site), so on desktop (admin creating a customer from an office) it should gracefully offer manual lat/long entry as a fallback text pair, hidden by default behind a "enter manually" link — avoids a broken-looking button when geolocation permission is unavailable on a desktop.

### 6.6 Categories / Brands / Products — Phase 1, Admin

- **Categories/Brands List (A):** Name, Image thumbnail (32px), Status. Categories list shows nesting as an indented row (simple indent, not a collapsible tree — v1 doesn't need collapse/expand for what's likely a shallow hierarchy; add later if category depth grows).
- **Products List (A):** Image thumbnail, Name + SKU (two-line cell: name bold, SKU as `text-xs text-secondary` below), Category, Brand, MRP, Selling Price, Status. Search covers name/SKU/barcode (per UX doc §4.5) — search box placeholder says "Search by name, SKU, or barcode" so users know what's searchable without guessing.
- **Form (C):** grouped "Identity" (SKU, barcode, name, image via PhotoCapture), "Classification" (category, brand, unit, packing), "Pricing & Tax" (MRP, selling price, GST rate — all plain editable inputs here, since these ARE the source values, not computed ones; §3.7's read-only rule applies to order/invoice totals, not to a product's own master-data price fields), "Stock" — **deliberately absent**: no stock field anywhere on this form, with a small `text-secondary` note under the Stock section header: "Stock is managed in Inventory" linking there, so users don't go looking for a field that's intentionally not here (turns a potential confusion into an explicit, friendly redirect).

**Design Review:** This is the module where the "no button should be there" instinct matters most — I explicitly removed any stock-editing UI from this form per UX doc §4.5's "never show editable stock" rule, and added the redirect note above instead of just omitting silently, because a missing expected field is worse UX than an explained absence.

### 6.7 Price Lists — Phase 1, Admin

- **List (A):** Name, Description, # products priced, Status.
- **Detail (B) — the "bulk-manage many prices" screen** flagged in UX doc §4.6: a DataTable of **all products**, with an inline-editable price cell per row (click cell → becomes an input → blur/enter saves that one row via its own small mutation, not a full-form submit) and a search/filter identical to the product list. A row with no override shows its default selling price in `text-secondary` (italic) with a small "Using default" label instead of a blank cell, and a "+ Set custom price" ghost link appears on row hover — makes the fallback rule from UX doc §4.6 visible without extra explanation text.
- **Design Review:** Considered a full-form "select products, enter prices, submit all at once" pattern (matches Template C) — rejected in favor of the inline-per-row-save pattern above: this screen can have hundreds of products, and a single giant form risks losing all edits if one field fails validation. Inline autosave-per-row isolates failures to one row and matches how spreadsheet-literate users (this audience) already expect bulk price editing to feel.

### 6.8 Warehouses / Suppliers / Vehicles — Phase 1, Admin

Straightforward List (A) + Form (C), nothing unusual — Warehouses form includes State (GST-relevant, shown with a small `text-secondary` hint: "Used to calculate CGST/SGST vs IGST"). Vehicles list shows Driver + Status pill (available/in_use/maintenance); status change is a select next to the pill on detail, same pattern as Customers §6.5 — reusing that pattern here rather than inventing a new one is deliberate consistency, not laziness.

### 6.9 Sales Orders — Phase 2A (Salesman order create is the flagship screen)

**Order Create (Salesman, mobile-first) — the one screen to over-invest in:**
```
[Customer picker — search-as-you-type, shows recent/route customers first]
─────────────────────────────
[+ Add Product] → opens a full-screen product picker (search / barcode scan icon / browse by category-brand chips)
─────────────────────────────
[Line item list — each row: product name, qty stepper (− 3 +), line total]
─────────────────────────────
[Live summary panel — sticky at bottom, always visible while scrolling the item list]
  Subtotal   ₹...
  GST        ₹...
  Total      ₹...  (text-2xl, bold — the one number a salesman glances at before hitting submit)
[Remarks — optional, collapsed by default, "+ Add note"]
[Expected delivery date]
[Submit Order] ← primary, lg, full-width, sticky above bottom nav
```
- Product picker: barcode scan icon opens device camera via a barcode-scan library, falls back to search if unavailable — this directly serves the "must be quick and possible on weak signal" journey in UX doc §6.1.
- Qty stepper: tap +/− gives instant local UI update (not waiting on a server round-trip) — the running total recalculates from a **client-side estimate immediately**, then reconciles with the server's authoritative calculation on submit; label this transitional total subtly (e.g., "≈ ₹1,240" with the ≈ removed once server-confirmed) so it's never presented as final before submit — this is the one place client math is shown at all, and it must be visually distinct from the server-confirmed read-only figures everywhere else (§3.7).
- Offline: if submit fails due to network, the line items stay on screen, a persistent amber banner reads "Not sent — will retry" with a manual "Retry" button (per build plan §5), rather than losing the work.
- **Design Review:** The live-estimate-total above is a deliberate, narrow exception to "never show client-calculated money" — flagging this explicitly since it could look like it violates §3.7. The distinction: it's a *provisional* UI-only estimate clearly marked with `≈`, shown only during entry, and is fully replaced by the server figure the instant a response comes back; it is never what gets submitted or stored. Worth re-confirming this is acceptable before building — if not, the alternative is a simple running item *count* instead of a running total, with no total shown until server-confirmed.

**Order List (A) / Order Detail (B):** standard patterns. Detail shows the timeline (§2.5) and a per-line table with three quantity columns (Ordered / Approved / Loaded) — a column only populates once that stage has happened, blank/dash before then, not a zero (zero could be misread as "approved to none").

**Edit/Cancel:** Edit only available (button rendered at all) when status is `pending` — not shown-but-disabled for other statuses, per the Template B rule "actions available for current status only," so a loaded order's detail page has zero ambiguity about what's still possible.

### 6.10 Order Approval — Phase 2B, Manager

Detail-page action: "Approve" button opens a modal/bottom-sheet listing each line item with an editable "Approved Qty" input defaulting to the ordered qty, and a small stock-availability hint next to any line where approved qty would exceed sellable stock (`text-xs` amber warning, not a hard block — manager can still approve a partial amount, the UI surfaces the constraint rather than deciding for them, matching UX doc's "surface any stock constraints"). Confirm button in the sheet says "Approve Order" (primary) — this is a state-changing action so it always goes through this explicit review step, never a single-tap blind "Approve" on the list row.

### 6.11 Warehouse Loading — Phase 2C

Same pattern as 6.10: "Load" opens a sheet with per-line "Loaded Qty" inputs defaulting to approved qty. Large tap targets since Warehouse/Dispatcher may use this on a tablet on the floor, not just a desktop — treat this one screen as mobile/tablet-first even though the rest of that role's screens are desktop-first.

### 6.12 Invoices — Phase 2D

- **List (A):** Invoice #, Customer, Date, Total, Payment-status pill (unpaid/partial/paid).
- **Detail (B):** the "clean, printable/shareable" layout the UX doc asks for — a distinct print-optimized view (`@media print` CSS: hides the app shell/nav entirely, shows only the invoice card at full width, adds a "Print / Save as PDF" button that calls `window.print()`) rather than building a separate PDF-generation feature — the browser's native print-to-PDF covers this need without new dependencies (YAGNI).
- GST breakdown block is visually the most prominent panel on the page (bordered card, `text-lg` labels) since that's the field customers/auditors scrutinize most.

### 6.13 Inventory — Phase 2E

- **Stock Summary (A, read-only variant — no "+ Create" button, since stock rows aren't manually created):** Product, Warehouse, Physical, Reserved, Damaged, Expiry-flagged, **Sellable** (computed, bold, the number everyone actually cares about). Low-stock rows (below minimum) get a left-edge amber accent bar on the row (4px, full row height) rather than a text warning — visible at a glance scanning down a long list without adding a column.
- **Adjustment / Transfer (C):** two separate small forms (not tabs of one form — they're conceptually different actions: adjustment is one warehouse correcting itself, transfer moves between two). Both require a Reason field (required, not optional, since UX doc explicitly requires a reason) — Save button stays disabled until Reason has content, a subtle but important guard against silent unexplained stock changes.

### 6.14 Purchases — Phase 4

Standard List (A)/Detail (B)/Form (C). "Receive" action mirrors the Approve/Load sheet pattern (§6.10/6.11) — per-line "Received Qty" defaulting to ordered qty. Draft-only Edit/Cancel, same current-status-gated action visibility rule as Orders.

### 6.15 Deliveries — Phase 3, Driver mobile-first

**Driver's list:** not a generic DataTable — a card list (bigger touch targets, one delivery = one tappable card showing customer name, address, amount to collect, status pill), sorted with "next stop" pinned/highlighted at the top with a subtle `border-strong` + `bg-surface-sunken` treatment so it's unmistakable which shop is next without reading every card.

**Delivery detail/progress:** a single vertical action flow, one primary button whose label changes with status: `Start Delivery` → `Mark Arrived` → `Complete Delivery`. Only one primary button ever visible (the one valid next action) — this is the mobile equivalent of the Template B "status-appropriate actions" rule taken to its simplest form, because a driver mid-task should never have to choose between multiple buttons.

**Complete Delivery** opens a full-screen step flow (not one giant form): Step 1 Signature (§2.10) → Step 2 Photo (optional, PhotoCapture, §2.9) → Step 3 Payment (cash/UPI amount inputs + optional UPI screenshot) → Step 4 Review & Confirm. A step progress dots indicator at the top (● ● ○ ○) — breaking this into steps (rather than one long scroll) matches the UX doc's ask to "design it as a single clear complete-delivery flow" while still keeping each individual screen simple/glanceable on a small phone.

**Fail delivery:** a secondary, less prominent "Can't complete?" link near (not competing with) the primary button, opens a small reason-select sheet.

### 6.16 Payments — Phase 3, Cashier desktop / Driver inline

Cashier's List (A): filter by status, driver, date; Verify/Mark Bounced are row-level quick actions (small ghost buttons, each behind its own ConfirmDialog since both have financial consequences). "Record Payment" form embedded contextually — either as a step inside Delivery-Complete (§6.15) or, for Cashier, as a modal launched from an Invoice detail page showing the invoice's outstanding amount prominently at the top of the modal so the cashier never has to tab away to check it.

### 6.17 Returns — Phase 4

Standard List (A)/Detail (B). Create form includes PhotoCapture (damage evidence) and a per-line-item reason select in addition to the overall reason — Detail page's "Complete" action shows a small explanatory line per item: "→ back to sellable stock" / "→ damaged stock" / "→ written off" driven by that item's reason, directly answering the UX doc's ask to "make the reason → stock outcome understandable."

### 6.18 Tally Sync — Phase 6, deliberately unprominent

A single simple status page (not in the primary nav — tucked under a settings/utilities menu per UX doc's "not prominent" instruction): three stat counts (pending/synced/failed) and a failed-items list with a per-row "Retry" ghost button. No fancy visualization — this is explicitly low-frequency utility, over-designing it would be effort spent against the grain of its own requirement.

### 6.19 Reports — Phase 6

A handful of stat cards (reused from the dashboard pattern, §6.2) plus 2–3 simple charts (line for sales-over-time, bar for orders-by-status) — using a lightweight charting lib added only at this phase (per build plan §4, "not upfront"). No interactive drill-down/pivot-table features for v1; each chart's card has a "View details" link into the relevant filtered list instead of building custom report-specific UI.

### 6.20 Customer Portal — Phase 5

- **Home:** the same dashboard-card pattern (§6.2) but only 3 elements, "Place an Order" as the dominant full-width CTA at the very top.
- **Catalogue browse:** grid of product cards (image, name, their price, in-stock indicator) rather than a dense DataTable — a shop owner browsing on a phone wants to scan visually like a small storefront, not read a spreadsheet; this is the one place in the whole app where a card grid beats a table, precisely because the audience and device differ from every staff list screen.
- **Place order:** identical interaction pattern to Salesman Order Create (§6.9) minus the customer picker (always self) — reuses the same line-item/summary/submit components, per build plan §1 rationale.
- **My Orders / My Invoices / My Deliveries:** simple card lists (not DataTables — no need for column sorting/dense filtering at this small personal-record-count scale), status pill prominent on each card.
- **Profile:** Template C form, but only rendering the fields confirmed editable in `frontend_build_plan.md` §9 (contact/shop info) — the staff-only fields (GST number, credit limit, route, price list) shown as plain read-only text lower on the page under a "Managed by your distributor" label, so the customer understands why they can't edit them rather than wondering if it's a bug.

---

## 7. Summary Checklist (use before marking any page "done")

Beyond `frontend_build_plan.md` §8's functional Definition of Done, each page should also pass:

- [ ] Every button on the page is one of the 4 defined variants (§2.1) — no one-off button styles.
- [ ] Every status shown uses `<StatusPill>` with the fixed color mapping (§1.1) — no ad hoc colored badges.
- [ ] Loading/empty/error states are all designed, not just the happy path (§3).
- [ ] Every destructive action sits behind ConfirmDialog (§2.7).
- [ ] Mobile-first pages (salesman/driver/portal) hit ≥44px touch targets and use the bottom-sheet/card patterns, not desktop modals/tables verbatim.
- [ ] Read-only computed fields (money/GST/stock) use the locked-field visual treatment (§2.2) everywhere they appear.
- [ ] Any new pattern not covered by §2–4 is flagged for review before building — don't invent a 5th button variant or a new modal style mid-implementation.
