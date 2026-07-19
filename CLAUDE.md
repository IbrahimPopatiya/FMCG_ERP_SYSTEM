# CLAUDE.md
## Team Guidelines — Distribution Management System (DMS)

This file explains **how we build this project** — coding style, git workflow, and the engineering principles we follow. Read this before writing code. Keep it simple, keep it clean, don't overengineer.

For **what** we're building, see the docs in `final_docs/`:
- `prd.md` — what the product is and why we're building it
- `database_schema_docs.markdown` — every table, column, and relationship
- `apis_doc.md` / `api_reference.md` — every API, its request and response shape
- `api_work_allocation.md` — who is building which domain
- `build_guide.md` — how to build each API, step by step, file by file
- `project_setup.md` / `local_database_setup.md` — how to get the project running locally

This file (`CLAUDE.md`) is about **how**, not **what**. Both matter — read both.

---

## 1. Our Core Philosophy

- **Keep it simple.** Write the most straightforward code that solves the problem in front of you. Don't build for imagined future requirements.
- **Don't overengineer.** No extra abstractions, no design patterns "just in case," no generic frameworks-within-the-framework. Three similar lines of code are fine. A clever one-liner that's hard to read is not.
- **Clean over clever.** If a teammate has to think hard to understand your code, simplify it — don't add a comment explaining the cleverness, remove the cleverness.
- **Small, focused pieces.** A function does one thing. A file covers one domain. A commit does one change.
- **Working software over perfect architecture.** Ship something correct and simple first. Refactor when a real second use case shows up — not before.

---

## 2. Code Style

### 2.1 General Rules
- Follow the 5-file pattern for every API, described in `build_guide.md` (Model → Schema → Service → Route → Register). Don't invent a new structure per feature.
- Keep routes "thin" — a route function should call a service function and return its result. Business logic belongs in `app/services/`, not in `app/api/`.
- Use clear, descriptive names. `customer_id` not `cid`. `calculate_gst()` not `calc()`.
- No dead code. If it's not used, delete it — don't comment it out "just in case." Git history already remembers it.
- No premature error handling. Only handle errors that can actually happen (bad user input, external API failures). Don't wrap code in `try/except` for things that can't fail.
- Write short functions. If a function is doing five different things, split it into five functions.
- Comments explain **why**, not **what**. Good code with clear names rarely needs comments. Only comment on non-obvious business rules (e.g. "GST is split by comparing warehouse state vs customer state — see schema docs").

### 2.2 Backend (FastAPI / Python)
- Follow PEP 8. Use `snake_case` for variables/functions, `PascalCase` for classes.
- One model class per table, one file per domain (see `app/models/`).
- Pydantic schemas for every request and response — never accept or return raw dictionaries.
- Database changes always go through Alembic migrations. Never hand-edit tables with `psql`.
- Never trust values the frontend sends for money, GST, stock, or status fields the server is supposed to calculate (see `api_reference.md` Section 19 — this is a hard rule, not a suggestion).

### 2.3 Frontend (Next.js / TypeScript)
- Use TypeScript types for every API request/response, matching `api_reference.md`. Don't use `any`.
- Keep API calls in `lib/api.ts` (or one file per domain under `lib/`) — don't call `fetch`/`axios` directly inside components.
- Components should be small and do one thing. If a component file is getting long, split it.
- Reuse components instead of copy-pasting UI — but only extract a shared component once you actually have two or more places that need it, not before.

---

## 3. Software Engineering Principles We Follow

We don't need to name-drop design patterns, but these basic principles keep the codebase healthy:

| Principle | What it means here |
|---|---|
| **Single Responsibility** | A service function does one job (e.g. `create_order()` doesn't also send SMS notifications — that's a separate function/service). |
| **DRY (Don't Repeat Yourself)** | If two places need the same stock-update logic, both call the same `record_movement()` function — never copy-paste it (see `build_guide.md` Section 4.10). |
| **Separation of Concerns** | Routes handle HTTP. Services handle business logic. Models handle data. Don't mix them. |
| **YAGNI (You Aren't Gonna Need It)** | Don't build a generic plugin system, a config-driven rules engine, or an abstract base class for something we only have one version of. Build what's needed today. |
| **Fail Fast, Fail Clearly** | Validate input early (Pydantic schemas do this for us) and return clear error messages, instead of letting bad data quietly cause problems later. |

If you're ever unsure whether to add an abstraction, ask: **"Do I have two real cases that need this today?"** If not, don't build it yet.

---

## 4. Configuration, Environment Variables & Secrets

**Never hardcode values that can change between environments or that are sensitive.** This includes: database URLs, passwords, API keys, secret keys, port numbers, external service URLs.

### 4.1 Rules
- All configuration lives in `.env` (backend) and `.env.local` (frontend) — never directly in code.
- Backend reads config through `app/core/config.py` (`pydantic-settings`) — never call `os.environ` directly all over the codebase. One place reads the environment; everything else imports `settings` from there.
- Frontend reads config through `process.env.NEXT_PUBLIC_*` — only variables prefixed `NEXT_PUBLIC_` are usable in browser code; keep anything private (e.g. real secrets) out of the frontend entirely.
- `.env` and `.env.local` are **never committed to Git** (already handled by `.gitignore`). Only commit `.env.example` with placeholder values, so teammates know what variables exist.
- If you add a new environment variable, update `.env.example` in the same commit — otherwise your teammate won't know it exists.

### 4.2 Enums Instead of Magic Strings
Don't scatter string literals like `"pending"`, `"active"`, `"cancelled"` across the codebase — a typo in one place silently breaks logic.

- Define fixed value sets (order status, payment status, roles, etc.) as Python `Enum` classes in one place, e.g. `app/core/enums.py`, and reuse them everywhere.
- The allowed values for every enum field are already listed in `database_schema_docs.markdown` Section 6 — use that as the source of truth.

```python
# app/core/enums.py
from enum import Enum

class OrderStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    LOADED = "loaded"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
```

Then use `OrderStatus.PENDING` instead of typing `"pending"` by hand wherever order status is checked or set.

### 4.3 Secrets
- `SECRET_KEY` (used for login tokens), database passwords, and any third-party API keys are secrets — treat them like passwords.
- Never paste a real secret into a commit, a Slack message, or this documentation. Use `.env` locally, and a proper secrets manager when we deploy.
- If a secret is ever accidentally committed, rotate it (generate a new one) — don't just delete the commit, assume it's compromised.

---

## 5. Git Version Control & Branching

### 5.1 Branch Structure
- **`main`** — always stable, always deployable. Nothing broken ever sits on `main`.
- **`develop`** — the shared integration branch. Feature branches merge here first.
- **Feature branches** — one branch per feature/domain, created off `develop`.

### 5.2 Branch Naming
Use this pattern: `type/short-description`

| Type | Use for |
|---|---|
| `feature/` | New functionality (e.g. `feature/products-api`, `feature/sales-order-approve`) |
| `fix/` | Bug fixes (e.g. `fix/gst-rounding`) |
| `chore/` | Non-functional changes — config, docs, dependency updates (e.g. `chore/update-gitignore`) |
| `refactor/` | Code cleanup with no behavior change |

Examples matching our `api_work_allocation.md` split:
```
feature/products-api
feature/price-lists-api
feature/sales-orders-api
feature/deliveries-api
```

### 5.3 Everyday Workflow
```bash
git checkout develop
git pull
git checkout -b feature/products-api

# ... do your work, commit as you go ...

git push -u origin feature/products-api
# open a Pull Request into develop
```

### 5.4 Commit Messages
Keep commits small and focused — one logical change per commit. Write commit messages that explain **why**, not just what changed.

Format:
```
<type>: <short summary>

<optional longer explanation, if needed>
```

Examples:
```
feat: add product create and update APIs
fix: correct CGST/SGST split when warehouse and customer share a state
chore: add price-lists table to .env.example note
```

### 5.5 Pull Requests
- Every feature branch is merged via a Pull Request — never push directly to `develop` or `main`.
- Keep PRs small and scoped to one domain (matches `api_work_allocation.md` — this also avoids both teammates touching the same files).
- The other person reviews before merging, even briefly. A second pair of eyes catches typos, hardcoded values, and missing validation.
- Merge `develop` into `main` only when a milestone (see `prd.md` Section 11) is complete and tested.

### 5.6 Migrations & Git
- Always commit your Alembic migration files (`backend/alembic/versions/`) together with the model change that caused them, in the same commit/PR.
- If you pull and see a new migration file, run `alembic upgrade head` before continuing work (see `local_database_setup.md`).
- If two people generate migrations at the same time and get a conflict, talk to each other before resolving it — don't just pick one side blindly, since both might be needed.

---

## 6. Writing Test Cases

Every API we build needs simple, clean test cases. Tests aren't optional polish — they're how we (and our teammate) know an API still works after someone else changes something nearby.

### 6.1 Keep Tests Simple
- One test = one behavior. Don't cram five checks into one test function.
- Test names should describe what they check, in plain English: `test_create_product_returns_201`, not `test1`.
- No clever test helpers or shared magic setup unless the same setup is genuinely repeated many times. A little repetition in tests is fine and keeps them easy to read.
- Tests live in `backend/tests/`, one file per domain, matching the API file: `app/api/products.py` → `tests/test_products.py`.

### 6.2 Tooling
- Use `pytest` with FastAPI's `TestClient` for API tests.
- Use a separate test database (not your local dev `dms_db`) so running tests never wipes real data. Point `DATABASE_URL` to a `dms_test_db` when running tests, or use a fixture that creates/drops tables around the test run.

```bash
pip install pytest httpx
```

### 6.3 What Every API's Tests Should Cover
For each endpoint, write tests for these four things — this is the minimum, not the ceiling:

1. **Happy path** — valid input returns the expected status code and response shape.
2. **Validation** — missing/invalid required fields return a `422` (FastAPI does this automatically via Pydantic — just confirm it).
3. **Business rule** — the specific logic for that API (e.g. GST split, stock movement, payment status calculation).
4. **Not found / conflict** — acting on a record that doesn't exist (`404`), or violating a unique constraint (duplicate `sku`, duplicate `mobile`, etc.).

### 6.4 Example: Testing the Products API

```python
# backend/tests/test_products.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_create_product_returns_created_product():
    payload = {
        "sku": "SKU-TEST-001",
        "barcode": "1234567890123",
        "name": "Test Product",
        "category_id": "...",
        "brand_id": "...",
        "unit": "piece",
        "packing": "1 x 1",
        "mrp": 100.00,
        "selling_price": 90.00,
        "gst_rate": 18.00,
        "minimum_stock": 10,
    }
    response = client.post("/api/v1/products", json=payload)
    assert response.status_code == 201
    assert response.json()["sku"] == "SKU-TEST-001"


def test_create_product_missing_required_field_returns_422():
    response = client.post("/api/v1/products", json={"name": "Missing Fields"})
    assert response.status_code == 422


def test_create_product_duplicate_sku_returns_409():
    payload = {"sku": "SKU-DUPLICATE", "barcode": "1112223334445", "name": "A", ...}
    client.post("/api/v1/products", json=payload)
    response = client.post("/api/v1/products", json=payload)
    assert response.status_code == 409


def test_get_product_not_found_returns_404():
    response = client.get("/api/v1/products/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
```

### 6.5 Example: Testing Business Logic (Sales Orders)

Business-rule tests matter more than CRUD tests here — this is where real bugs hide.

```python
def test_order_calculates_cgst_sgst_when_same_state():
    # warehouse and customer both in Maharashtra
    response = client.post("/api/v1/orders", json=order_payload_same_state)
    body = response.json()
    assert body["igst"] == 0
    assert body["cgst"] > 0
    assert body["sgst"] > 0


def test_order_calculates_igst_when_different_state():
    # warehouse in Maharashtra, customer in Karnataka
    response = client.post("/api/v1/orders", json=order_payload_different_state)
    body = response.json()
    assert body["cgst"] == 0
    assert body["sgst"] == 0
    assert body["igst"] > 0


def test_approve_order_reserves_stock():
    # approve should create a "reserved" inventory movement and raise reserved_stock
    ...


def test_load_order_reduces_physical_stock():
    # loading should create a "sold_out" movement and reduce physical_stock + reserved_stock
    ...
```

### 6.6 Running Tests
```bash
cd backend
pytest
```
Run this before every Pull Request — see the checklist below.

---

## 7. Before You Open a Pull Request — Checklist

- [ ] No hardcoded secrets, URLs, or config values — everything comes from `.env` / `settings`
- [ ] No magic strings for status/role/enum-like fields — using the shared `Enum` classes
- [ ] Business logic lives in `app/services/`, not in the route file
- [ ] New database fields match `database_schema_docs.markdown` exactly
- [ ] Request/response shapes match `api_reference.md` exactly
- [ ] Migration file committed alongside the model change
- [ ] No dead code, no commented-out blocks, no leftover debug prints
- [ ] Ran and tested the API locally via `/docs` before pushing
- [ ] Wrote tests covering happy path, validation, business rule, and not-found/conflict cases (Section 6)
- [ ] `pytest` passes locally

---

*Keep this file updated as our practices evolve. If we agree on a new rule as a team, write it down here — don't let it live only in someone's memory.*
