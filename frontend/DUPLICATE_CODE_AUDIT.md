# Duplicate Code Audit — Frontend

This document lists concrete, line-level code duplication found across the frontend, primarily between the customer (`app/(customer)`) and salesman (`app/salesman`) role areas, plus a handful of cross-domain patterns (status badges, forms, menus) repeated many times under `components/`. Nothing here has been changed — this is a candidate list for future extraction into shared components/hooks, ordered roughly by impact (lines × files affected).

---

## 1. Cart page (customer vs salesman)

**Files:**
- `app/salesman/cart/page.tsx` (204 lines)
- `app/(customer)/cart/page.tsx` (181 lines)

**What's duplicated:** Entire page: cart item list, qty steppers, remove-confirmation dialog, error-message mapping from API errors, "place order" mutation + navigation, empty-cart state, free-delivery/total summary footer.

**Est. duplicated lines:** ~170 lines shared structure per file, ~340 total.

**Notes:** Salesman version adds a `CustomerSelect` + selected-customer banner and blocks placing an order until a customer is chosen (`customerId` from `useSelectedCustomer`); it also has a 403 "wrong route" error case and posts `customer_id` in the payload. Text differs ("My Cart" vs "Order Bag", "your cart" vs "the bag"). A shared component would need props for: base path (`/cart` vs `/salesman/cart`), optional customer-picker slot, optional extra payload fields, and copy strings.

---

## 2. Products listing page (customer vs salesman)

**Files:**
- `app/salesman/products/page.tsx` (186 lines)
- `app/(customer)/products/page.tsx` (186 lines)

**What's duplicated:** Search/sort/category-filter state and logic, infinite-scroll product query wiring, `handleQtyChange` cart callback, grid rendering of product cards, loading/empty/error states.

**Est. duplicated lines:** ~160 lines per file, ~320 total.

**Notes:** Salesman renders `SalesmanProductCard` + `CustomerSelect` banner and gates `disabled={!customerId}`; customer renders `CustomerProductCard` + a "Products" header block instead of the customer-select widget. A shared component would need a props-driven header slot and a `disabled`/`onDisabledReason` pass-through to the card.

---

## 3. Product detail page (customer vs salesman)

**Files:**
- `app/salesman/products/[productId]/page.tsx` (149 lines)
- `app/(customer)/products/[productId]/page.tsx` (136 lines)

**What's duplicated:** Product fetch/loading/error/not-found states, image/gallery layout, price/MRP/box-qty display, qty stepper + "Add to cart" / "Go to cart" flow.

**Est. duplicated lines:** ~120 lines per file, ~240 total.

**Notes:** Salesman disables "Add to cart" and shows a "select a customer first" notice when `!customerId`; links point at `/salesman/products`, `/salesman/cart` instead of `/products`, `/cart`. Same shape as finding #4 in `HomeFeed.tsx` (already extracted) — `cartDisabled` / `cartDisabledMessage` / `basePath` props would cover it.

---

## 4. Home feed reel — customer vs salesman

**Status: Already extracted** into `components/shared/HomeFeed.tsx` (this session). Listed here only for completeness/history — previously `app/(customer)/home/page.tsx` and `app/salesman/home/page.tsx` were ~520 lines each, ~95% identical (reel slides, like/save/share/add-to-bag rail, product detail sheet, search/filter bar).

---

## 5. Product card — Customer vs Salesman

**Files:**
- `components/products/CustomerProductCard.tsx` (70 lines)
- `components/products/SalesmanProductCard.tsx` (70 lines)

**What's duplicated:** Card markup, image, name/price row, qty stepper vs. "Add to bag" button switch, `memo()` wrap.

**Est. duplicated lines:** ~66 of 70 lines per file, ~132 total.

**Notes:** Only real differences: link target (`/products/:id` vs `/salesman/products/:id`), an added `disabled` prop on the salesman card, and the corresponding `disabled:*` Tailwind classes on the add-to-bag button. `components/products/AdminProductCard.tsx` (76 lines) is a third, looser variant (different action — edit/view rather than add-to-cart) and shares less; worth a look but not as clean a merge as the customer/salesman pair.

---

## 6. Storefront desktop sidebar — Customer vs Salesman

**Files:**
- `components/customer/CustomerShell.tsx` — `CustomerDesktopSidebar` (111 lines)
- `components/salesman/SalesmanShell.tsx` — `SalesmanDesktopSidebar` (107 lines)

**What's duplicated:** Whole sidebar: profile header block (avatar-initial circle, name, subtitle), nav item list with active-state styling, secondary "menu items" list, cart-summary/footer link.

**Est. duplicated lines:** ~95 lines per file, ~190 total.

**Notes:** Data source differs (`useCurrentCustomer` vs `useCurrentUser`), nav item arrays differ (`CUSTOMER_NAV_ITEMS`/`CUSTOMER_MENU_ITEMS` vs `SALESMAN_NAV_ITEMS`/`SALESMAN_MENU_ITEMS`), profile subtitle text differs, and hrefs are prefixed differently (`/account`, `/cart` vs `/salesman/account`, `/salesman/cart`). A shared `DesktopSidebar` would take: nav item arrays, profile display (avatar letter + title + subtitle), account href, cart href.

---

## 7. Mobile hamburger drawer — Admin / Salesman / Customer menus

**Files:**
- `components/layout/AdminMenu.tsx` (114 lines)
- `components/salesman/SalesmanMenu.tsx` (124 lines)
- `components/customer/CustomerMenu.tsx` (126 lines)

**What's duplicated:** Context + provider scaffold for a slide-out drawer (`isOpen` state, backdrop button, `translate-x` transition panel), header row with close button, `nav` list mapping items to `Link`s with active-state styling, footer action button (profile link / logout), and a `*MenuButton` trigger component with the same hamburger-icon button shape.

**Est. duplicated lines:** ~70 lines of structural/animation code per file, ~210 total across 3 files.

**Notes:** Real differences are content-level: item source (`NAV_ICON_BY_HREF`+`NavItem[]` prop vs `SALESMAN_MENU_ITEMS` vs presumably `CUSTOMER_MENU_ITEMS`), header content (logo+brand vs user-avatar-and-name vs likely similar), footer action (profile link vs logout button), and small style differences (rounded corners, drawer width, active-state color). A shared `SlideOutMenu` would need: `items`, a `header` render prop/slot, a `footer` render prop/slot, and width/rounding style props.

---

## 8. Status badge components (8 files share one shape; 4 are byte-identical logic)

**Files (byte-identical "active/inactive" logic — 4 files):**
- `components/products/ProductStatusBadge.tsx`
- `components/suppliers/SupplierStatusBadge.tsx`
- `components/users/UserStatusBadge.tsx`
- `components/warehouses/WarehouseStatusBadge.tsx`

**What's duplicated:** All four are the exact same 11-line component: `<Badge tone={status === "active" ? "success" : "neutral"}>{status === "active" ? "Active" : "Inactive"}</Badge>`, differing only in the imported `*Status` type.

**Est. duplicated lines:** ~9 lines × 4 files = ~36 lines (small per-file, but a clean 1:1 mergeable pattern — e.g. a single `<ActiveStatusBadge status={status} />` generic over any two-value status union).

**Files (same `Record<Status, tone> → <Badge>` shape, different maps — 7 more files):**
- `components/creditNotes/CreditNoteStatusBadge.tsx`
- `components/customers/CustomerStatusBadge.tsx`
- `components/deliveries/DeliveryStatusBadge.tsx`
- `components/invoices/PaymentStatusBadge.tsx`
- `components/orders/OrderStatusBadge.tsx`
- `components/payments/PaymentRecordStatusBadge.tsx`
- `components/purchases/PurchaseStatusBadge.tsx`
- `components/returns/ReturnStatusBadge.tsx`
- `components/vehicles/VehicleStatusBadge.tsx`

**What's duplicated:** Same 3-line pattern in every file: a `const TONE: Record<StatusType, Tone> = {...}` map plus `<Badge tone={TONE[status]}>{toTitleCase(status)}</Badge>` (or a custom `LABEL` map for `OrderStatusBadge`/`CustomerStatusBadge`).

**Est. duplicated lines:** ~10 lines of boilerplate (imports + component wrapper) × 9 files = ~90 lines; the actual per-status tone/label maps are legitimately different data, not duplicated logic.

**Notes:** A single generic `StatusBadge<T extends string>({ status, toneMap, labelMap? })` component (or a `makeStatusBadge(toneMap, labelMap?)` factory) would collapse all 13 files down to one component plus 13 one-line map declarations.

---

## 9. CRUD form shell (Brand/Category/Warehouse/Supplier/Vehicle/Route/User/Customer forms)

**Files:**
- `components/brands/BrandForm.tsx` (48 lines)
- `components/categories/CategoryForm.tsx` (60 lines)
- `components/warehouses/WarehouseForm.tsx` (73 lines)
- `components/suppliers/SupplierForm.tsx` (122 lines)
- `components/vehicles/VehicleForm.tsx` (95 lines)
- `components/routes/RouteForm.tsx` (61 lines)
- `components/users/UserForm.tsx` (139 lines)
- `components/customers/CustomerForm.tsx` (203 lines)

**What's duplicated:** The same "shell" logic repeated in every form: `isSubmitting`/`error` state, an async `handleSubmit` that calls `event.preventDefault()`, wraps `onSubmit(payload)` in try/catch, resets fields and calls `onSuccess()` on success, sets a generic "Something went wrong saving this X" message on failure, and always resets `isSubmitting` in `finally`. Every form also renders the same error box markup (`rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700`) and the same submit-button row (`<div className="flex justify-end pt-1"><Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">…`).

**Est. duplicated lines:** ~20-25 lines of shell boilerplate per file × 8 files = ~170-190 lines (the field-specific JSX in between is legitimately unique per form and should stay as-is).

**Notes:** A shared pattern here isn't a single wrapping component (each form's fields differ too much for one generic form), but a small reusable **hook** (e.g. `useFormSubmit(onSubmit, onSuccess, errorMessage)` returning `{ isSubmitting, error, handleSubmit }`) plus a shared `<FormErrorBanner>` and `<FormSubmitRow label=.../>` pair of tiny components would remove the repeated boilerplate while leaving each form's actual fields untouched.

---

## 10. Orders list page (customer vs salesman)

**Files:**
- `app/salesman/orders/page.tsx` (84 lines)
- `app/(customer)/orders/page.tsx` (81 lines)

**What's duplicated:** Order list fetch/loading/error/empty states, each order row card (order number, status badge, date, total), "browse products" empty-state CTA link.

**Est. duplicated lines:** ~65 lines per file, ~130 total.

**Notes:** Salesman row additionally shows `order.customer_name`; link targets and copy differ (`/salesman/orders/:id` vs `/orders/:id`, "Your Orders" vs "Orders"). Small, easy merge with a `customerNameVisible`/basePath prop.

---

## Summary table

| # | Pattern | Files affected | Est. total duplicated lines |
|---|---|---|---|
| 1 | Cart page | 2 | ~340 |
| 2 | Products listing page | 2 | ~320 |
| 3 | Product detail page | 2 | ~240 |
| 4 | Home feed reel (already fixed) | 2 | ~490 (resolved) |
| 6 | Storefront desktop sidebar | 2 | ~190 |
| 9 | CRUD form shell | 8 | ~170-190 |
| 7 | Mobile hamburger drawer | 3 | ~210 |
| 10 | Orders list page | 2 | ~130 |
| 5 | Product card (Customer/Salesman) | 2 | ~132 |
| 8 | Status badge components | 13 | ~126 |

**Not yet counted above but worth a follow-up look:** `components/products/AdminProductCard.tsx` vs the Customer/Salesman cards (looser overlap); `components/customer/CustomerMenu.tsx` header content vs `SalesmanMenu.tsx` (only diffed 2 of the 3 menu files in detail); `app/(customer)/account/page.tsx` vs `app/salesman/account/page.tsx` (checked — genuinely different enough, not worth merging as-is).
