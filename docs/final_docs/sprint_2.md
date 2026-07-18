# Sprint 2 — Catalog Domain: Products
## FMCG Distribution ERP — Phase 1

| | |
|---|---|
| **Document Type** | Sprint Plan |
| **Based on** | `PRD.md`, `PHASE1_SIMPLE_SCHEMA.md`, `ARCHITECTURE.md`, `API_CONTRACT.md`, `PROJECT_SETUP.md`, `sprint_1.md` |
| **Sprint** | 2 of 11 |
| **Duration** | Suggested: 3–5 days (much smaller than Sprint 1 — the hard scaffolding work is already done) |
| **Depends on** | Sprint 1 (auth, folder pattern, response envelope, `require_role()` all reused as-is) |
| **Team model** | Same as Sprint 1: **backend together first**, then **frontend together**, mobile as a parallel-safe stretch phase. Task-level ownership and dependencies below. |

### Why Sprint 2 looks like this
Orders can't exist without products to order. Catalog has no dependency on Customers or Sales, so it's next in the dependency chain (matches `ARCHITECTURE.md` §5.2's module list and the FK direction in `PHASE1_SIMPLE_SCHEMA.md` — `order_items.product_id → products.id`). This sprint is also the first real proof that the Sprint 1 pattern (module folder shape, auth guard, error envelope, contract-sync habit, and the backend-then-frontend team workflow itself) actually holds up unchanged for a second module — if it doesn't, that's worth catching now, not five sprints in.

---

## 1. Sprint Goal

By the end of this sprint:
- Admin can add/edit products (name, brand, category, unit, price, GST%, image) on the Next.js dashboard.
- Any authenticated user (any role) can browse/search the catalogue.
- Products list on the React Native shell too, proving the mobile app can read real data through the same API.

**Demo checkpoint:**
> Admin logs into the dashboard, adds 3 real products with prices and GST%, uploads an image for one. Log into the React Native shell as a Salesman → see the same 3 products, searchable by name, with the image loading.

---

## 2. Scope

### 2.1 In scope
- `products` table (per `PHASE1_SIMPLE_SCHEMA.md` §3).
- Product CRUD (create/edit by Admin only; read by everyone).
- Search/filter by name, brand, category.
- Image upload (S3-compatible storage, per `ARCHITECTURE.md` §3.2 tech context).
- Admin Web: product management screens (list, add, edit).
- React Native: read-only product list/search screen (first real screen beyond the login shell).

### 2.2 Explicitly out of scope
- Multiple price lists / customer-specific pricing — one price per product, per the simplified schema. Add a `customer_prices` override table later only if the business actually needs it.
- Barcodes, product attributes/variants, packing configurations — the full 83-table design split these out; we don't need that granularity at this scale. If a product genuinely needs packing variants (e.g. "loose" vs "carton of 24"), model that as two separate `products` rows for now — simpler than a variant system, revisit only if it becomes a real pain point.
- Category/brand as separate management tables — per the simplified schema, `brand` and `category` are plain text columns on `products`, not their own tables with CRUD. Don't build category management screens this sprint.
- Stock/inventory quantities — explicitly Tally's domain, never touched here (PRD §4.2).

---

## 3. Database

One table this sprint, exactly as defined in `PHASE1_SIMPLE_SCHEMA.md`:

### `products`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | VARCHAR | |
| brand | VARCHAR | plain text, not a FK |
| category | VARCHAR | plain text, not a FK |
| unit | VARCHAR | `pcs` / `box` / `carton` / `kg` / … |
| price | DECIMAL(14,2) | never `FLOAT` — matches `ARCHITECTURE.md`/schema money-type standard |
| gst_percent | DECIMAL(5,2) | |
| image_url | TEXT | nullable, points to S3-compatible storage |
| active | BOOLEAN | default true — soft "delete" via deactivation, never a hard delete |
| created_at | TIMESTAMPTZ | default now() |
| updated_at | TIMESTAMPTZ | auto-updated |

**Migration:** `002_products`, depends on nothing but the baseline (`002` is correct sequence, immediately after `001_users_and_auth`).

**Seed data** (extend `scripts/seed.py`): 10–15 real or realistic products across a few brands/categories, so Sprint 4 (Orders) has believable data to order against.

---

## 4. Task Breakdown

Legend: **[Solo]** = one person can do this alone once its dependency is met · **[Pair]** = do this one together · **[Parallel-safe]** = no dependency on any in-progress task, safe to split off immediately.

### 4.1 Phase A — Backend (both together)

Folder shape — identical pattern to `auth/` from Sprint 1, per `PROJECT_SETUP.md` §2.1:
```
app/catalog/
├── models.py     # Product
├── schemas.py    # ProductCreate, ProductUpdate, ProductRead
├── service.py    # create/update/search logic
└── router.py
```

| ID | Task | Owner | Depends on | Notes |
|---|---|---|---|---|
| B1 | `catalog/models.py` — `Product` SQLModel class matching §3 | You | Sprint 1 Phase A DoD | |
| B2 | Alembic migration `002_products` | You | B1 | |
| B3 | `catalog/schemas.py` — `ProductCreate`, `ProductUpdate`, `ProductRead` | Brother | B1 | **[Parallel-safe with B2]** — schemas only need the model shape (B1), not the migration running. |
| B4 | `catalog/service.py` — `create_product`, `update_product`, `list_products` (filters + pagination per `API_CONTRACT.md` §1.6), `get_product` | Brother | B2, B3 | Needs the migrated table (B2) to actually query against, and the schemas (B3) to type against. |
| B5 | `catalog/router.py` — 4 endpoints per `API_CONTRACT.md` §2.3 (`GET /products`, `GET /products/{id}`, `POST /products` [`require_role("admin")`], `PATCH /products/{id}` [`require_role("admin")`]) | **Pair** | B4 | Reuses `require_role()` from Sprint 1 (B8) — first real test that pattern holds for a second module. |
| B6 | Image upload — `POST /products/{id}/image` (or multipart on `PATCH`), uploads to S3-compatible storage, sets `image_url` | You | B5 | One image per product, no gallery/variants — matches the project's "no premature complexity" rule. |
| B7 | Search — simple `ILIKE '%q%'` on `name` (optionally `brand`) inside B4's `list_products` | Brother | B4 | **[Parallel-safe with B5]** — touches `service.py` only, doesn't block on the router. Don't reach for full-text search/Elasticsearch yet. |
| B8 | Tests (`tests/catalog/`) — create/update as Admin succeeds; as non-Admin returns 403; search returns correct filtered results; pagination shape matches envelope | **Pair** | B5, B6, B7 | |

**Definition of Done — Phase A (backend):**
- All 4 endpoints match `API_CONTRACT.md` §2.3 exactly.
- Non-Admin roles can `GET` but never `POST`/`PATCH` — verified by test (B8), not just by eye.
- Image upload round-trips: upload → `image_url` returned → URL is publicly loadable.
- Swagger UI at `/docs` shows the new endpoints correctly typed.
- Tests pass in CI.

### 4.2 Phase B — Frontend (both together, once Phase A's Definition of Done is met)

Folder shape mirrors the pattern from `PROJECT_SETUP.md` §3.1:
```
app/(dashboard)/catalog/
├── page.tsx          # Product list, search box, filter by category/brand
├── new/page.tsx       # Add product form
└── [id]/page.tsx      # Edit product form
lib/api/catalog.ts     # listProducts(), getProduct(), createProduct(), updateProduct()
```

| ID | Task | Owner | Depends on | Notes |
|---|---|---|---|---|
| F1 | Re-run `openapi-typescript` against the updated backend spec | You | Phase A DoD | First real re-use of the Sprint 1 habit (F3) — confirms it's a repeatable step, not a one-off. |
| F2 | `lib/api/catalog.ts` — API call wrappers | You | F1 | |
| F3 | Product list page — table, search box, category/brand filters, pagination | Brother | F1 | **[Parallel-safe with F2]** — needs the generated types (F1), not the wrapper functions (F2), since it can call the API directly while F2 is being built, or the two of you agree F2 lands first — your call in the moment. |
| F4 | Add product form — all fields, image upload input, calls `POST /products` | Brother | F2, F3 | |
| F5 | Edit product form — pre-filled from `GET /products/{id}`, calls `PATCH /products/{id}` | You | F2, F3 | **[Parallel-safe with F4]** — separate route/page, both only need F2+F3 done. Natural split point. |
| F6 | Active/inactive toggle on the list — quick `PATCH` with just `{ "active": false }`, no full edit form | **Pair** | F3 | Small, do together as a quick sanity check that the list (F3) and mutation pattern (F2) connect cleanly. |

**Definition of Done — Phase B (frontend):**
- Admin can add, edit, deactivate a product through the UI, and it's reflected in `GET /products` immediately.
- Non-Admin logins never see the "Add Product" / edit controls (role-gated in UI, on top of the backend's own 403 enforcement — belt and suspenders, matches PRD Rule #7).
- Search/filter work against real backend data, not mocked.

### 4.3 Phase C — Mobile (either of you, parallel-safe alongside Phase B once Phase A is done)

```
src/features/<role or shared>/catalog/
├── ProductListScreen.tsx
└── components/ProductCard.tsx
src/core/api/catalogApi.ts   # listProducts(), getProduct()
```

| ID | Task | Owner | Depends on | Notes |
|---|---|---|---|---|
| M1 | `catalogApi.ts` — calls `GET /products` with search param | Whoever is free | Phase A DoD | Only depends on the backend, not on Phase B — can run alongside F1–F6. |
| M2 | Product list screen — `ProductCard` components: image, name, brand, price, unit | Whoever did M1 | M1 | |
| M3 | Search bar wired to `?q=` | Whoever is free | M2 | |

**Definition of Done — Phase C (mobile):**
- Product list loads real data from the local backend on a device/emulator.
- Search filters the list correctly.
- Image loads (or shows a sensible placeholder if `image_url` is null).
- Read-only — no add/edit UI on mobile (that's Admin Web's job per PRD §6.3).

---

## 5. Task-dependency map (quick visual reference)

```
Sprint 1 Phase A DoD
        │
        ▼
B1 ── B2 ─┬── B4 ─┬── B5 (Pair) ── B6 ─┐
      B3 ─┘       └── B7 ────────────┴── B8 (Pair)
                                          │
                              Phase A Definition of Done
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                                            ▼
F1 ──┬── F2 ──┬── F4 ─┐                                  M1 ── M2 ── M3
     └── F3 ──┴── F5 ─┴── F6 (Pair)
```

---

## 6. Cross-cutting notes

- **Confirms the Sprint 1 workflow holds**: same folder shape, same `require_role()` usage, same response envelope, same contract-sync step, and now — same backend-together-then-frontend-together team model. If any of these felt awkward to reuse this sprint, raise it now before four more sprints copy the same friction forward.
- **Money/decimal handling**: `price` and `gst_percent` are the first real money-shaped fields in the system — confirm both backend (DECIMAL, not float) and frontend (careful with JS number precision on money — consider formatting/rounding consistently) get this right now, since Orders (Sprint 4) will build directly on it.

---

## 7. Risks / things to agree on before starting

1. **S3-compatible storage provider** — pick one (AWS S3, Cloudflare R2, MinIO for local dev) and get credentials/bucket set up before B6 starts, so it's not a mid-sprint blocker.
2. **Who owns product data entry for the pilot** — not a code decision, but worth confirming with the client early: will they hand you a spreadsheet of real products to seed, or do you build against placeholder data until closer to pilot (PRD §11 already flags catalogue seeding as a client dependency)?
3. **Pairing logistics for B5, B8, F6** — same note as Sprint 1 §7.4: agree whether "Pair" means literal pair programming or draft-then-same-day-review, so it doesn't silently become "whoever gets to it first."

---

## Document Traceability

| Section | Source |
|---|---|
| Catalog endpoints, response shapes | `API_CONTRACT.md` §2.3 |
| `products` table | `PHASE1_SIMPLE_SCHEMA.md` |
| Catalog module placement | `ARCHITECTURE.md` §5.2 |
| Folder structure, contract-sync habit | `PROJECT_SETUP.md` §2, §3 |
| Reused patterns (auth guard, envelope, folder shape, team workflow) | `sprint_1.md` §4, §5 |

**Next:** `sprint_3.md` covers the Customer domain — the last dependency before Orders (Sprint 4) can be built.
