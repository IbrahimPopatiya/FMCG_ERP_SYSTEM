# Sprint 1 — Foundation: Project Skeleton + Auth
## FMCG Distribution ERP — Phase 1

| | |
|---|---|
| **Document Type** | Sprint Plan |
| **Based on** | `PRD.md`, `PHASE1_SIMPLE_SCHEMA.md`, `ARCHITECTURE.md`, `API_CONTRACT.md`, `PROJECT_SETUP.md` |
| **Sprint** | 1 of 11 |
| **Duration** | Suggested: 1–1.5 weeks (this sprint is bigger than later ones — it's also where all the shared scaffolding gets built once) |
| **Depends on** | Nothing — this is the foundation everything else builds on |
| **Team model** | Both developers work the **backend together first**, then both work the **frontend together** — per team decision. Task-level ownership and dependencies are called out explicitly below (see §4) so both of you always know who's doing what and what's safe to start in parallel. |

### Why Sprint 1 looks like this
Nothing in Sprint 2 onward can start until three things exist: a backend that runs, a database that's migrated, and a way to prove "I am logged in as X role." So Sprint 1 is really two things bundled together: **one-time project scaffolding** (per `PROJECT_SETUP.md`) and **the first real feature** (staff login). Every later sprint is a copy of the pattern established here — same folder shape, same auth guard, same response envelope — so it's worth taking the extra day here to get it right instead of rushing to "Sprint 2."

### Why the task list looks like a dependency graph, not just a checklist
This is standard practice on any team bigger than one person: a flat checklist doesn't tell two developers who can start *right now* versus who has to wait. Every task below has an **ID**, an **owner**, and an explicit **"Depends on"** field — the same shape as a Jira/Linear sprint board. The rule to follow while executing this sprint:

> **Before starting any task, check its "Depends on" column. If that task isn't marked done, either help finish it or pick a different task that has no open dependency.**

Tasks with no dependency on each other (marked "Can run in parallel" below) are exactly the ones where you and your brother should split up and work simultaneously; tasks that depend on something not yet done are where you should pair up instead of blocking.

---

## 1. Sprint Goal

By the end of this sprint:
- The backend repo (`fmcg-backend`) and admin web repo (`fmcg-admin-web`) both exist, run locally with one command, and are connected to each other.
- A staff member (Admin, Salesman, Warehouse, Accountant, Driver, or Cashier) can log in via mobile number + OTP, on both the Admin Web dashboard and a bare-bones React Native (Expo) shell, and land on a screen that shows **their own name and role** — proving the whole chain works end to end: Postgres → FastAPI → JWT → Next.js/React Native.
- Nothing product-specific yet (no orders, no customers) — this sprint is entirely foundation.

**Demo checkpoint (what you show each other / the client at sprint end):**
> Log in as an Admin user on the Next.js dashboard → see "Welcome, [Name] — Role: Admin". Log in as a Salesman on the React Native app shell (Expo Go, or a device build) → see "Welcome, [Name] — Role: Salesman". Two different people, two different roles, same backend, same login flow.

---

## 2. Scope

### 2.1 In scope
- Repo + folder scaffolding for backend and admin web (per `PROJECT_SETUP.md` §2, §3).
- `users` table + Alembic baseline migration.
- OTP-based login flow (request OTP → verify OTP → JWT issued).
- JWT auth dependency (`get_current_user`, `require_role()`) — reused by every future sprint.
- Shared response envelope + error handling (per `API_CONTRACT.md` §1.5–1.7) — built once, reused everywhere.
- `GET /health` endpoint.
- Next.js: login page + one protected page showing current user.
- React Native (Expo): login screen + one protected shell screen showing current user (mobile scaffolding only — full mobile feature build starts once web-side patterns are proven).
- CI: lint + test running on both repos.

### 2.2 Explicitly out of scope (comes in later sprints)
- Customers, products, orders — nothing business-domain yet.
- Roles/permissions as database tables — **not needed**. Per `PHASE1_SIMPLE_SCHEMA.md`, `users.role` is a plain column (`admin` / `sales_manager` / `salesman` / `warehouse` / `accountant` / `driver` / `cashier`), not a separate RBAC table system. `require_role()` checks this column directly.
- Password login — OTP only, per PRD.
- Real SMS/WhatsApp OTP delivery — use a mocked/logged OTP in local dev (see §7); wiring a real provider is a small task you can slot in here or defer, your call.

---

## 3. Database

Only one table this sprint, exactly as defined in `PHASE1_SIMPLE_SCHEMA.md`:

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | VARCHAR | |
| mobile | VARCHAR, UNIQUE | login identifier |
| role | ENUM/VARCHAR | `admin`, `sales_manager`, `salesman`, `warehouse`, `accountant`, `driver`, `cashier` |
| status | VARCHAR | `active` / `inactive` |
| created_at | TIMESTAMPTZ | default now() |

Plus two small **auth-support tables** not in the original 14 (needed to make OTP + refresh tokens work safely — small, additive, doesn't violate the "keep it simple" schema, just makes login real):

### `otps`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | |
| code_hash | VARCHAR | never store the raw OTP |
| purpose | VARCHAR | `login` (only purpose needed in Phase 1) |
| status | VARCHAR | `pending` / `verified` / `expired` |
| expires_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

### `refresh_tokens`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users | |
| token_hash | VARCHAR | never store the raw token |
| revoked | BOOLEAN | default false |
| expires_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

**Migration:** one Alembic migration, `001_users_and_auth`, creating all three tables together (they're one cohesive feature).

**Seed data** (`scripts/seed.py`): one user per role, real mobile numbers you and your brother can actually test OTP login with.

---

## 4. Task Breakdown

Legend: **[Solo]** = one person can do this alone once its dependency is met · **[Pair]** = do this one together, it sets a convention the whole project follows · **[Parallel-safe]** = no dependency on any in-progress task, safe to split off immediately.

### 4.1 Phase A — Backend (both together)

Per the team's decision, backend comes first, built by both of you. Within that phase, tasks still split where they don't depend on each other — "build it together" doesn't mean "sit on the same file," it means "no one starts frontend until this phase's Definition of Done is met."

| ID | Task | Owner | Depends on | Notes |
|---|---|---|---|---|
| B1 | Repo scaffold: `docker-compose.yml` (Postgres+Redis+API), `.env.example`, base FastAPI app, empty folder tree per `PROJECT_SETUP.md` §2.1 | **Pair** | — | Do this one together — every folder-naming and config decision made here is copied by every later sprint. Don't split it. |
| B2 | `core/config.py` — settings via `pydantic-settings` | You | B1 | |
| B3 | `core/database.py` — SQLModel engine + session dependency | You | B2 | |
| B4 | `core/security.py` — JWT encode/decode, OTP hashing | Brother | B2 | **[Parallel-safe with B3]** — different file, both only need B2 done first. Good place to split up right after B1. |
| B5 | `shared/exceptions.py` + FastAPI exception handlers → global error envelope (`API_CONTRACT.md` §1.5) | Brother | B1 | **[Parallel-safe with B2/B3/B4]** — touches no file B2–B4 touch. Can start immediately after B1, doesn't need B2. |
| B6 | `auth/models.py` — `User`, `OTP`, `RefreshToken` SQLModel classes (§3) | You | B3 | Needs the DB session convention from B3 to be settled first. |
| B7 | Alembic init + first migration `001_users_and_auth` | You | B6 | |
| B8 | `shared/dependencies.py` — `get_current_user`, `require_role()` | Brother | B4, B6 | Needs both the JWT logic (B4) and the `User` model (B6) to exist. **If B6 isn't done yet, help finish it rather than idling.** |
| B9 | `auth/service.py` — `request_otp`, `verify_otp`, `refresh_access_token`, `logout` | You | B4, B7 | Needs OTP hashing (B4) and the migrated tables (B7). |
| B10 | `auth/router.py` — 5 endpoints per `API_CONTRACT.md` §2.1 (`/auth/otp/request`, `/auth/otp/verify`, `/auth/refresh`, `/auth/logout`, `/auth/me`) | **Pair** | B8, B9 | This is where the auth dependency (B8) and the service logic (B9) actually get wired together — do this one together to catch integration mistakes immediately instead of finding them separately. |
| B11 | `GET /health` | Brother | B1 | **[Parallel-safe]** — trivial, no real dependency beyond the app existing. Good filler task if one of you finishes an earlier task first. |
| B12 | `scripts/seed.py` — insert seed users from §3 | You | B7 | **[Parallel-safe with B8]** — only needs the migration, not the auth dependency logic. |
| B13 | CI setup: ruff → mypy (optional) → pytest → docker build | Brother | B1 | **[Parallel-safe]** — can be set up early against an empty test suite, doesn't block on auth work. |
| B14 | Tests (`tests/auth/`): OTP request/verify happy path, expired OTP rejected, wrong role rejected on a dummy route, refresh flow | **Pair** | B10 | |

**Definition of Done — Phase A (backend) — must be true before Phase B starts:**
- `docker compose up` brings up Postgres + Redis + API with zero manual steps.
- `alembic upgrade head` creates all 3 tables cleanly on an empty DB.
- `POST /auth/otp/request` → `POST /auth/otp/verify` returns a working JWT, verified via `GET /auth/me`.
- All endpoints match `API_CONTRACT.md` §2.1 exactly (path, method, response envelope, status codes).
- Swagger UI at `/docs` shows all 5 auth endpoints correctly typed.
- Tests (B14) pass in CI (B13).

### 4.2 Phase B — Frontend (both together, once Phase A's Definition of Done is met)

Do not start Phase B tasks against a mocked API — the whole point of building backend-first together is that Phase B is wired to the *real* running backend from its first commit.

| ID | Task | Owner | Depends on | Notes |
|---|---|---|---|---|
| F1 | Repo scaffold: `create-next-app` (App Router, TS, Tailwind), `.env.local.example` | **Pair** | Phase A DoD | Same reasoning as B1 — shared convention, do it together once. |
| F2 | `lib/api/client.ts` — fetch wrapper, attaches JWT, 401 → refresh → redirect | Brother | F1 | |
| F3 | Run `openapi-typescript` against local `/openapi.json` → `lib/api/generated/` | You | F1 | **[Parallel-safe with F2]** — different concern, both only need F1. Establishes the contract-sync habit from this sprint, per `PROJECT_SETUP.md` §3.2. |
| F4 | Login page: mobile input → send OTP → OTP input → verify → store tokens → redirect | You | F2, F3 | Needs the client (F2) and generated types (F3) to build against real shapes, not guesses. |
| F5 | Dashboard shell (`(dashboard)/layout.tsx`) — checks token on load via `/auth/me`, redirects to `/login` if missing | Brother | F2 | **[Parallel-safe with F4]** — different route group, both only need F2. Good split point. |
| F6 | Dashboard home page — calls `GET /auth/me`, renders "Welcome, {name} — Role: {role}" | Brother | F5 | |
| F7 | Logout button — calls `POST /auth/logout`, clears token, redirects | **Pair** | F4, F6 | Quick, do it together as the final wiring step — confirms the whole loop (login → protected page → logout) in one sitting. |
| F8 | CI: eslint → tsc → build | You | F1 | **[Parallel-safe]** — can be set up any time after F1. |

**Definition of Done — Phase B (frontend):**
- `npm run dev` connects to the local backend from Phase A with zero code changes, just env var pointing at `localhost:8000`.
- Full login flow works against the real backend (not mocked).
- Refreshing the dashboard page after login keeps the user logged in.
- Logout actually invalidates the session (refresh token revoked server-side, verified by trying to reuse it).

### 4.3 Phase C — Mobile shell (either of you, can run in parallel with Phase B once Phase A is done)

React Native being the same language as the admin dashboard means this doesn't have to be sequential after Phase B — it only depends on Phase A (the backend), not on Phase B (the admin web app). If one of you is free while the other is mid-way through a Phase B task, this is the natural thing to pick up.

| ID | Task | Owner | Depends on | Notes |
|---|---|---|---|---|
| M1 | Scaffold React Native (Expo) project per `PROJECT_SETUP.md` §4 | Whoever is free first | Phase A DoD | |
| M2 | `src/core/api/apiClient.ts` — same 401→refresh pattern as F2 | Whoever did M1 | M1 | Can copy the *pattern* from F2 once it exists, but doesn't have to wait for it — same backend contract either way. |
| M3 | Login screen — mobile + OTP input | Whoever is free | M2 | |
| M4 | Protected shell screen — "Welcome, {name} — Role: {role}" | Whoever is free | M3 | |

**Definition of Done — Phase C (mobile):**
- Login flow works against the same local backend, from a real device or emulator.
- Logging in as different seeded users (e.g. Salesman vs Driver) shows their correct name/role.

---

## 5. Cross-cutting: what gets established here for good

These decisions, once made in Sprint 1, should **not** be re-litigated per sprint — every later sprint inherits them:

| Established in Sprint 1 | Task | Reused by |
|---|---|---|
| Response envelope (`{"data": ...}`, `{"error_code", "message"}`) | B5 | Every endpoint, every sprint |
| `get_current_user` / `require_role()` dependency pattern | B8 | Every protected endpoint from Sprint 2 onward |
| Module folder shape (`models.py`/`schemas.py`/`service.py`/`router.py`) | B1 | Every backend domain module |
| JWT + refresh token flow (both web and mobile clients) | B9, B10 | No auth work needed again until a real bug shows up |
| `openapi-typescript` generation habit | F3 | Keeps `API_CONTRACT.md` honest from day one, per that doc's §4 |

---

## 6. Task-dependency map (quick visual reference)

```
B1 ──┬── B2 ── B3 ── B6 ── B7 ─┬── B9 ─┐
     │                        │       ├── B10 (Pair) ── B14 (Pair)
     ├── B4 ─────────────────┬┴── B8 ─┘
     ├── B5                  │
     ├── B11                 └── B12
     └── B13
                                          │
                              Phase A Definition of Done
                                          │
                                          ▼
F1 (Pair) ──┬── F2 ──┬── F4 ─┐
            ├── F3 ──┘       ├── F7 (Pair)
            └── F8           │
            F2 ── F5 ── F6 ──┘

                Phase A DoD
                     │
                     ▼
              M1 ── M2 ── M3 ── M4   (parallel-safe alongside Phase B)
```

---

## 7. Risks / things to agree on before starting

1. **OTP delivery in local dev** — don't wire a real SMS provider yet unless you want to; log the OTP to the console/response in local/dev environments only (never in production). Saves both of you from being blocked by a third-party account setup this early.
2. **Token storage on web** — httpOnly cookie (more secure, slightly more setup) vs. localStorage (simpler, fine for an internal admin tool at this scale). Pick one together before F2 starts — it affects `lib/api/client.ts` design and can't easily change after F4–F7 are built on top of it.
3. **One React Native (Expo) app or two** — flagged in `PROJECT_SETUP.md` §4.2, decide before M1 starts.
4. **Pairing logistics** — "Pair" tasks (B1, B10, B14, F1, F7) work best as either real pair programming (one keyboard, two people) or a tight review loop (one drafts, the other reviews same-day before moving on) — agree which mode you're using before the sprint starts so "pair" doesn't silently become "whoever gets to it first."

---

## Document Traceability

| Section | Source |
|---|---|
| Auth endpoints, response shapes | `API_CONTRACT.md` §2.1 |
| `users` table | `PHASE1_SIMPLE_SCHEMA.md` |
| Auth module placement, `require_role()` pattern | `ARCHITECTURE.md` §5.2, §8.1 |
| Folder structure, tooling, bootstrap order | `PROJECT_SETUP.md` §2, §3, §4, §6 |

**Next:** once this sprint's demo checkpoint passes, `sprint_2.md` covers the Catalog module (products) — the next dependency in the chain before Orders can exist.
