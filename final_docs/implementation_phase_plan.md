# Implementation Phase Plan

Based on `role_based_frontend_plan.md`. Each phase is small, ships something usable, and follows the existing 5-file pattern / file-per-domain conventions in `CLAUDE.md`. Do phases in order — later phases depend on earlier ones.

## Phase 0 — Backend prerequisites ✅ DONE

Goal: close the gaps that block role gating and missing list screens, before building UI on top of them.

- ✅ Added `require_role(*roles)` dependency in `app/core/deps.py` — wraps `require_staff`, checks `current_user.role` against the passed `UserRole` values, 403s otherwise. Not yet wired into any route (that's Phase 3's job — this phase only makes the tool available).
- ✅ Added `GET` list endpoints (service function + route, following the existing `list_active_products`-style pattern) for every domain that only had mutation endpoints: `suppliers`, `warehouses`, `routes`, `price_lists`, `credit_notes`, `invoices`, `purchases`, `vehicles`, `payments`, `deliveries`, `returns`. All filter `deleted_at.is_(None)` where the model has `SoftDeleteMixin` (suppliers, warehouses, routes, price_lists, invoices, purchases, vehicles, returns); `credit_notes`, `payments`, `deliveries` have no soft-delete column so list everything.
- ✅ Verified order scoping by role — already implemented (`list_orders_for_principal` in `app/services/sales_order.py`: customers see their own orders, staff see orders for customers on their route). No change needed.
- No Alembic migration needed — this was route/service work only, no schema changes.
- Verified: `main.py` imports cleanly and registers all routes (25 routers) with no errors.

Exit criteria: every domain has a list endpoint the frontend can call; `require_role` exists. — **met**.

## Phase 1 — Foundations shared by both apps

Goal: the plumbing every later phase needs, no visible feature yet.

- `frontend/lib/auth/session.ts` — persist `role` (staff) from `/auth/login` response, already returned by the API but not stored.
- `frontend/lib/nav/roleNav.ts` — flat map `{ role → nav items + home route }` for the 6 staff roles + admin.
- `frontend/lib/hooks/useRoleGuard.ts` — redirect to role's home if `user.role` not allowed on current page.
- No page changes yet — this phase is infrastructure only, tested via one throwaway page or a unit test on the hook.

Exit criteria: logging in as any staff role stores the role and the hook correctly redirects on a test route.

## Phase 2 — ERP: fill in missing pages (uses existing patterns, mostly independent of Phase 0/1)

Goal: every domain that has a backend API has a frontend screen, before layering role gating on top.

Order (simplest/least blocked first):
1. `brands/` page — CRUD already fully exists, no backend work needed.
2. `categories/` page — CRUD already fully exists, no backend work needed.
3. `warehouses/` page — needs Phase 0's list endpoint.
4. `routes/` (sales routes) page — needs Phase 0's list endpoint.
5. `price-lists/` page — needs Phase 0's list endpoint.
6. `credit-notes/` page (list + approve/reject) — needs Phase 0's list endpoint.
7. Audit and fix list population on `invoices`, `returns`, `purchases`, `suppliers`, `vehicles`, `deliveries`, `payments` pages — confirm they now use the new Phase 0 list endpoints instead of any workaround.

Exit criteria: every ERP domain has a working list + detail/CRUD screen, still visible to all staff (role gating comes next).

## Phase 3 — ERP: role-based nav + page gating

Goal: apply Phase 1's plumbing across every ERP page now that Phase 2 has no missing pages left.

- Wire `roleNav.ts` into `DesktopSidebar` / `MobileBottomNav` so each role sees only their nav items (per the per-role screen lists in `role_based_frontend_plan.md` §5).
- Add `useRoleGuard([...])` to every `(staff)/admin/*/page.tsx`, using the allowed-roles list from the plan.
- Wire Phase 0's `require_role()` into the corresponding backend routes so gating is enforced server-side, not just client-side redirects.
- Manually test each of the 6 roles end-to-end: login → correct home page → correct nav → blocked from hidden pages (both via redirect and via direct URL entry).

Exit criteria: each role's screen set matches `role_based_frontend_plan.md` §5 exactly, enforced on both frontend and backend.

## Phase 4 — Customer app: Blinkit-style upgrade

Goal: turn the working but plain customer flow into the Blinkit-like experience. Independent of Phases 0–3 (different route group), can run in parallel once Phase 0 is stable.

1. Home/landing screen (`(customer)/page.tsx`) — banners + category grid + reorder-last-basket.
2. Category browsing UI using the existing `GET /categories` endpoint.
3. Search on the product listing (confirm/add a backend search param on `GET /products` if none exists).
4. Persistent floating cart bar across customer screens.
5. Order-tracking stepper on order detail, driven by `OrderStatus` + `DeliveryStatus`.
6. Dues/credit view — either on `account/page.tsx` or a new `dues/page.tsx`.
7. Confirm product pricing already reflects the customer's assigned price list; fix if it's showing flat catalog price.

Exit criteria: customer can land on a home feed, search/browse by category, see a running cart bar, track an order's status visually, and see their dues.

## Phase 5 — Cleanup (optional, do last)

- Rename `(staff)/admin/` to `(staff)/app/` or `(staff)/erp/` for naming clarity — small isolated PR, no functional change.
- Remove any now-dead workaround code from Phase 2 step 7 once real list endpoints are confirmed in place everywhere.

## Summary table

| Phase | Scope | Depends on |
|---|---|---|
| 0 | Backend: `require_role`, missing list endpoints, order scoping | — |
| 1 | Frontend: role session storage, nav map, guard hook | — |
| 2 | ERP: build missing domain pages | Phase 0 (for 4 of 6 new pages) |
| 3 | ERP: apply role-based nav + page + backend gating | Phases 0, 1, 2 |
| 4 | Customer app: Blinkit-style UX upgrade | Phase 0 (search endpoint only) |
| 5 | Naming cleanup, dead code removal | Phases 2, 3 |
