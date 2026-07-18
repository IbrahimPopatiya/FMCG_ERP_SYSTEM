# Project Setup & Scaffolding Document
## FMCG Distribution ERP — Phase 1

| | |
|---|---|
| **Document Type** | Project Setup / Scaffolding Specification |
| **Based on** | `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md` |
| **Version** | 1.0 |
| **Status** | Draft — last document before implementation begins |

### Why this document exists
Every document so far answered *what* and *how it fits together*. This one answers the boring-but-critical question every engineer hits on day one of coding: **where does the first line of code actually go?** Repo layout, folder structure, environment config, and tooling decided now — once, deliberately — save weeks of "wait, where does this file belong" friction later. This is standard industry practice: scaffolding is decided and reviewed *before* feature work starts, not improvised feature-by-feature.

---

## 1. Repository strategy

**Decision: three repositories (polyrepo), not one monorepo.**

| Repo | Owner | Contents |
|---|---|---|
| `fmcg-backend` | You | FastAPI app, Celery workers, DB migrations |
| `fmcg-admin-web` | Your brother | Next.js admin dashboard |
| `fmcg-mobile` | You (with your brother able to contribute — same JS/TS stack as admin web) | React Native (Expo) app (Customer + ERP, single codebase, role-based) |

**Why not a monorepo:** monorepos pay off when tooling (shared build pipeline, shared types across languages) or a large team justifies the setup cost. Here you have two languages (Python for the backend, TypeScript/JavaScript for both frontend and mobile now that mobile is React Native instead of Flutter), two developers, and the API contract (not shared code) is what actually connects them. Three simple repos, each with its own clean CI, is less overhead than monorepo tooling (Nx/Turborepo/workspaces) for this team size. Since admin web and mobile now share a language, a monorepo for just those two (sharing types/utils) is a reasonable future upgrade — but not needed to start; revisit if code duplication between them becomes a real pain point.

**Shared reference:** the `FMCG_Product` repo you're in now (this `docs/` folder) stays the **documentation source of truth** — PRD, schema, architecture, API contract — referenced by all three code repos, not duplicated into them.

---

## 2. Backend — `fmcg-backend` (FastAPI)

### 2.1 Folder structure
Organized by **domain module** (matches `ARCHITECTURE.md` §5.2), not by technical layer (no top-level `models/`, `views/`, `controllers/` dumping ground) — this is what keeps "everything about orders" in one place instead of scattered across three folders.

```
fmcg-backend/
├── app/
│   ├── main.py                  # FastAPI app instance, router registration, startup/shutdown
│   ├── core/
│   │   ├── config.py             # Settings (env vars via pydantic-settings)
│   │   ├── database.py           # SQLModel engine/session
│   │   ├── security.py           # JWT encode/decode, password/OTP hashing
│   │   └── celery_app.py         # Celery instance + config
│   ├── shared/
│   │   ├── dependencies.py       # get_current_user, require_role(), pagination dep
│   │   ├── history.py            # record_transition() — shared status_history writer
│   │   ├── exceptions.py         # Custom exception classes → consistent error envelope
│   │   └── schemas.py            # Common Pydantic shapes (PaginatedResponse, ErrorResponse)
│   ├── auth/
│   │   ├── models.py             # (uses users table from Customer/Auth as appropriate)
│   │   ├── schemas.py
│   │   ├── service.py
│   │   └── router.py
│   ├── customers/
│   │   ├── models.py             # Customer
│   │   ├── schemas.py
│   │   ├── service.py
│   │   └── router.py
│   ├── catalog/                  # Product
│   ├── orders/                   # Order, OrderItem
│   ├── planning/                 # Vehicle, Trip, TripOrder
│   ├── warehouse/                # Dispatch, DispatchItem
│   ├── accounting/                # Invoice (reference only)
│   ├── delivery/                 # Delivery
│   ├── payment/                  # Payment
│   ├── notifications/
│   └── integration/              # Tally XML/ODBC client — the ONLY module touching Tally
│       ├── tally_client.py
│       ├── tasks.py               # Celery tasks (retry-safe)
│       └── router.py              # /invoices/{id}/retry-sync etc.
├── alembic/
│   ├── versions/                 # One migration per schema change, timestamped
│   └── env.py
├── tests/
│   ├── conftest.py                # Shared fixtures (test DB, test client)
│   ├── auth/
│   ├── orders/
│   └── ...                       # mirrors app/ structure 1:1
├── scripts/
│   └── seed.py                    # Seed roles, sample catalogue, sample customers for local dev
├── .env.example
├── .env                          # gitignored
├── docker-compose.yml             # postgres + redis + api + celery worker, for local dev
├── Dockerfile
├── requirements.txt / pyproject.toml
├── alembic.ini
└── README.md
```

Every module folder (`orders/`, `warehouse/`, etc.) has the same 4 files (`models.py`, `schemas.py`, `service.py`, `router.py`) — the "predictability across modules matters more than any one module's elegance" rule from `ARCHITECTURE.md` §5.3, applied literally to the file tree.

### 2.2 Environment configuration
`.env.example` (committed, no real secrets) documents every variable; `.env` (gitignored) holds real values per environment:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/fmcg
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=
JWT_ACCESS_EXPIRE_MINUTES=30
JWT_REFRESH_EXPIRE_DAYS=7
TALLY_XML_ENDPOINT=
TALLY_SYNC_ENABLED=true
SMS_PROVIDER_API_KEY=
WHATSAPP_PROVIDER_API_KEY=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
ENVIRONMENT=local   # local | staging | production
```
Loaded via `pydantic-settings` in `core/config.py` — never `os.environ.get()` scattered through the codebase.

### 2.3 Local dev environment
`docker-compose.yml` brings up Postgres + Redis + the API + a Celery worker with one command (`docker compose up`) — nobody needs Postgres installed natively. This is the standard "onboard a new dev in 10 minutes" pattern.

### 2.4 Tooling
| Concern | Tool | Why |
|---|---|---|
| Dependency management | `uv` or `poetry` | Reproducible installs, lockfile |
| Formatting | `black` | No style debates |
| Linting | `ruff` | Fast, replaces flake8+isort+more |
| Type checking | `mypy` (or rely on Pydantic + FastAPI's own checks) | Catch shape mismatches early |
| Testing | `pytest` + `httpx` (async test client) | Standard FastAPI testing stack |
| Migrations | `alembic` | Standard for SQLAlchemy/SQLModel |
| Pre-commit | `pre-commit` hooks running black+ruff | Catches formatting before it hits CI |

### 2.5 Naming conventions (Python side)
`snake_case` for files/functions/variables, `PascalCase` for classes (SQLModel/Pydantic models) — mirrors the DB naming standard already set in `PHASE1_SIMPLE_SCHEMA.md`, so a `sales_order_items` row maps predictably to an `OrderItem` class in `orders/models.py`.

---

## 3. Admin Web — `fmcg-admin-web` (Next.js)

### 3.1 Folder structure
Uses Next.js App Router (current standard), organized by **feature/domain** to mirror the backend, so your brother's folders map 1:1 onto the API modules he's calling:

```
fmcg-admin-web/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar/nav shell, role-gated
│   │   ├── orders/
│   │   │   ├── page.tsx             # Approval queue / list
│   │   │   └── [id]/page.tsx        # Order detail + timeline
│   │   ├── customers/
│   │   ├── catalog/
│   │   ├── trips/
│   │   ├── dispatches/
│   │   ├── invoices/
│   │   ├── payments/
│   │   └── reports/
│   └── layout.tsx                   # Root layout
├── components/
│   ├── ui/                          # Generic, reusable (Button, Table, Modal…)
│   └── domain/                       # Feature-specific composed components
├── lib/
│   ├── api/
│   │   ├── client.ts                 # Base fetch/axios wrapper, attaches JWT
│   │   ├── generated/                # Auto-generated types from /openapi.json — see §3.2
│   │   └── orders.ts, customers.ts…  # Thin per-module API call wrappers
│   ├── auth.ts                       # Token storage, refresh logic
│   └── utils.ts
├── hooks/                             # React Query hooks per resource
├── .env.local.example
├── next.config.js
├── package.json
└── README.md
```

### 3.2 Contract sync (this is the part that keeps `API_CONTRACT.md` honest)
```bash
npx openapi-typescript https://api.<env>.com/openapi.json -o lib/api/generated/schema.d.ts
```
Run this whenever the backend contract changes (manually now; a CI job later). This is the mechanism referenced in `API_CONTRACT.md` §4 — TypeScript types generated straight from the running FastAPI backend, so a backend field rename breaks the Next.js **type-check**, not a page in production.

### 3.3 Tooling
| Concern | Tool |
|---|---|
| Styling | Tailwind CSS (fast to build internal dashboards with) |
| Data fetching/caching | TanStack Query (React Query) |
| Forms/validation | React Hook Form + Zod |
| Linting/formatting | ESLint + Prettier |
| Type checking | TypeScript strict mode |

---

## 4. Mobile — `fmcg-mobile` (React Native + Expo)

**Why React Native over Flutter:** neither developer knows Dart/Flutter. React Native uses JavaScript/TypeScript and React — the same language and mental model your brother already uses on the Next.js admin dashboard, and close enough to your own backend-adjacent JS familiarity that you're not starting from zero either. Expo is used on top of bare React Native because it removes almost all native-build ceremony (no need to touch Xcode/Android Studio config directly for most of Phase 1) and still supports real offline-capable local storage (Expo SQLite, or WatermelonDB if sync conflict-handling gets more complex later).

### 4.1 Folder structure
One codebase, role-based UI (per `PRD.md` §5), organized by feature — same organizing principle as the Flutter version this replaces, just in TypeScript:

```
fmcg-mobile/
├── App.tsx
├── src/
│   ├── core/
│   │   ├── api/
│   │   │   ├── apiClient.ts           # fetch/axios client, attaches JWT
│   │   │   └── generated/             # openapi-typescript output — same tool your brother uses on Next.js
│   │   ├── auth/                      # Token storage (expo-secure-store), refresh, role detection
│   │   ├── db/                        # Expo SQLite / WatermelonDB setup — offline queue
│   │   └── theme/
│   ├── features/
│   │   ├── customer/                   # Customer-facing screens
│   │   │   ├── catalog/
│   │   │   ├── cart/
│   │   │   └── orderTracking/
│   │   ├── salesman/
│   │   ├── warehouse/
│   │   ├── driver/
│   │   └── cashier/
│   ├── components/                     # Shared, reusable UI components
│   └── navigation/
│       └── AppNavigator.tsx             # Role-based route gating (React Navigation)
├── __tests__/                            # mirrors src/features structure
├── .env.example
├── app.json                              # Expo config
├── package.json
├── tsconfig.json
└── README.md
```

**Role-based entry:** `App.tsx` reads the authenticated user's role after login and routes into `features/<role>/`, per `PRD.md` §5 ("screen shown depends on role, not a separate build"). The `customer` feature tree is the exception — it's a fully separate login flow (separate JWT audience per `API_CONTRACT.md` §1.8) but ships from the same React Native codebase/app if that's the final call, or as a second Expo app sharing `core/` if Customer and Staff should be two separate installable apps. *(Confirm this with the client before scaffolding — PRD §5 lists "Customer Ordering App" and "ERP Mobile App" as two separate apps sharing one backend; scaffold as two Expo projects sharing a `packages/core` if so — see §4.2.)*

### 4.2 If Customer App and ERP Mobile App are genuinely separate apps
Per `PRD.md` §5 they're listed as two distinct apps. Recommended structure: a small **monorepo** using Turborepo or Yarn/npm workspaces (this is a natural fit now — plain JS/TS tooling, and possibly the same monorepo tooling your brother's Next.js repo could eventually join, per §1's note):
```
fmcg-mobile/
├── apps/
│   ├── customer-app/
│   └── erp-app/
├── packages/
│   └── core/            # Shared: API client, auth, theme, common components
```

### 4.3 Tooling
| Concern | Tool |
|---|---|
| Framework | React Native + Expo (managed workflow) |
| State management | Zustand or Redux Toolkit (pick one, stay consistent — Zustand is the simpler default for a project this size) |
| Navigation | React Navigation |
| Local DB (offline-first) | Expo SQLite (start here) → WatermelonDB if sync/conflict handling outgrows it |
| HTTP | Axios (or native `fetch`) |
| Linting/formatting | ESLint + Prettier — same config philosophy as `fmcg-admin-web`, so your brother's tooling knowledge transfers directly |
| Type checking | TypeScript strict mode |

---

## 5. Cross-repo conventions

### 5.1 Git branching
Simple trunk-based flow, appropriate for a 2-person team:
- `main` — always deployable.
- `feature/<short-name>` branches off `main`, PR back into `main`.
- No long-lived `develop` branch — unnecessary ceremony at this team size.

### 5.2 Commit messages
Conventional Commits format (`feat:`, `fix:`, `chore:`, `docs:`) — lightweight, machine-parseable, and gives you free changelog generation later if needed.

### 5.3 CI (per repo, kept minimal)
GitHub Actions, one workflow per repo:
- **Backend:** lint (ruff) → type-check (mypy) → test (pytest) → build Docker image.
- **Admin web:** lint (eslint) → type-check (tsc) → build.
- **Mobile:** eslint → tsc → jest tests → EAS build (Expo's build service, only on release tags, to save CI minutes/build credits).

No deployment automation yet in Phase 1 scaffolding — manual deploy is fine until the pilot (PRD §2.2) is close, at which point add a deploy step to the same workflow.

### 5.4 Secrets
Never committed. Local: `.env` files (gitignored). Staging/production: environment variables set on the host or in GitHub Actions secrets — not decided yet which hosting provider, revisit at deployment time (`ARCHITECTURE.md` §7 already flags the Tally-LAN-reachability decision as pending).

---

## 6. What gets built first (bootstrapping order)

Matches `ARCHITECTURE.md` §5.2 module list and `phase_1_roadmap.md`'s dependency order — scaffolding should stand up in this sequence, not all at once:

1. **Backend skeleton** — `main.py`, `core/` (config, database, security), empty `shared/`, docker-compose up with Postgres+Redis reachable, health-check endpoint (`GET /health`) returning 200. This alone is "hello world" and should be the first PR.
2. **Auth module** — real OTP login working end-to-end (staff), since every other module depends on `get_current_user`.
3. **Alembic baseline migration** — all 14 tables from `PHASE1_SIMPLE_SCHEMA.md` created in one initial migration.
4. **Admin web skeleton** — Next.js app, login page wired to `/auth/otp/*`, one protected dashboard page proving the JWT round-trip works.
5. **React Native (Expo) skeleton** — same proof: OTP login screen wired to the same auth endpoints.
6. From here, build one module at a time (`catalog` → `customers` → `orders` → …) — each module's backend router + admin page + mobile screen together, so nothing sits unverified for long. This is the vertical-slice approach `phase_1_roadmap.md` already commits to.

---

## Document Traceability

| Section | Source |
|---|---|
| Module boundaries mirrored in folder structure | `docs/ARCHITECTURE.md` §5.2 |
| Contract-sync mechanism | `docs/API_CONTRACT.md` §4 |
| Role-based mobile routing | `docs/PRD.md` §5, §6.2 |
| Build order | `docs/phase_1_roadmap.md` |

**Next step:** with setup decided, implementation starts — Step 1 of §6 above (backend skeleton + health check) is the first real commit.
