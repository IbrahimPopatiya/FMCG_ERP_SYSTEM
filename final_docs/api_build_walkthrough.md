# How Every API in This Project Is Actually Built
## A Learning Walkthrough — Catalog & Supply Track (Amin)

| | |
|---|---|
| **Purpose** | Explain, in detail, how the APIs built so far (Categories, Brands, Products, Price Lists, Suppliers, Warehouses) actually work — the roles of each file, how they connect, and why they're built this way — so you can build the next domain yourself with real understanding, not by copy-pasting. |
| **Companion docs** | `build_guide.md` (where to write code), `api_reference.md` (exact JSON shapes), `database_schema_docs.markdown` (exact table columns) |
| **Audience** | You, right now, learning backend architecture while building it for real |

---

## 1. What Happens When a Request Arrives

Every single API call in this backend flows through the same five layers, in the same direction, with no shortcuts:

```
HTTP request  →  Route  →  Service  →  Model  →  Postgres
POST /categories   app/api/*.py   app/services/*.py   app/models/*.py   dms_db
```

The request never skips a layer, and it never goes backwards. This is the single most important structural rule in the whole codebase:

- The **route** never touches the database directly, and never contains a business-rule `if`. Its only job is: parse the incoming JSON into a typed object (the schema), hand it to the service, and translate whatever the service returns (or raises) into an HTTP response.
- All of the actual thinking — "does this parent category exist," "is this SKU already taken," "should this return a 404 or a 409" — happens one layer down, in the **service**.

Why bother separating these at all, instead of writing everything in one function? Two concrete reasons you'll feel immediately:

1. **You can read a route file in five seconds** and know exactly what it does, because it's never more than "call the service, handle one or two exceptions."
2. **You can test business logic without running a web server.** A service function takes a plain database session and a plain Python object — you can call it directly in a test, no HTTP client, no JSON parsing involved.

---

## 2. The 5-File Pattern, File by File

Every domain you've built — Categories, Brands, Products, Price Lists, Suppliers, Warehouses — used exactly these five files, and nothing else:

### 2.1 Model — `app/models/<domain>.py`
The database table itself, written as a SQLAlchemy class. Column names, types, and constraints (`nullable`, `unique`, foreign keys) must match `database_schema_docs.markdown` exactly — this file *is* the schema, as far as Postgres is concerned.

### 2.2 Schema — `app/schemas/<domain>.py`
Pydantic classes describing the **JSON shape** — not the database shape, the *wire* shape. This is what makes FastAPI automatically reject a bad request (missing required field, wrong type) with a `422` before any of your code even runs.

### 2.3 Service — `app/services/<domain>.py`
Plain Python functions that do the actual work: look a row up, check a rule, save it, soft-delete it. A service function takes a database `Session` and a schema object in, and returns a model instance (or `None`, or raises an exception) out. This file has zero knowledge that FastAPI, HTTP, or JSON even exist.

### 2.4 Route — `app/api/<domain>.py`
The FastAPI `APIRouter`. One function per endpoint. Declares what it needs via `Depends(...)`, calls exactly one service function, and translates the result (or a caught exception) into an HTTP response.

### 2.5 Register — `main.py`
One import line, one `app.include_router(...)` line. Miss this step and the endpoint silently doesn't exist — FastAPI never complains, `/docs` just won't show it.

---

## 3. Worked Example: Categories, Start to Finish

This is the actual code you shipped. Read it once, top to bottom, and you've effectively read all six domains — they're all the same shape with different nouns.

### 3.1 Model — the table

```python
class Category(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "categories"

    name = Column(String(150), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    image = Column(String(255), nullable=True)
```

Three mixins are glued onto the class:

- `UUIDPKMixin` — gives the table a UUID-v7 `id` primary key, generated in Python before the row is even saved (important for offline-friendly, client-generated IDs per the PRD).
- `TimestampMixin` — gives it `created_at` / `updated_at`, both auto-managed by the database (`server_default=func.now()`, `onupdate=func.now()`).
- `SoftDeleteMixin` — gives it a nullable `deleted_at` column, used instead of ever actually deleting a row.

Every table in this project gets these three mixins for free — you never retype those columns by hand. `parent_id` is a foreign key pointing back at the *same* table (`categories.id`) — that's what makes categories nestable (a category can be its own kind of parent).

### 3.2 Schema — the wire shape

```python
class CategoryCreate(BaseModel):
    name: str
    parent_id: Optional[uuid.UUID] = None
    image: Optional[str] = None

class CategoryUpdate(BaseModel):        # every field Optional — PATCH sends only what changed
    name: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    image: Optional[str] = None

class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    parent_id: Optional[uuid.UUID]
    image: Optional[str]

    model_config = ConfigDict(from_attributes=True)   # lets it read straight off the SQLAlchemy object
```

Three schema shapes, one job each:

- **`...Create`** — the shape of a `POST` request body. Required fields have no default; optional fields default to `None`.
- **`...Update`** — the shape of a `PATCH` request body. *Every* field is `Optional` here, because a `PATCH` only sends the fields the caller actually wants to change — this is what makes `data.model_dump(exclude_unset=True)` in the service work correctly (more on that below).
- **`...Response`** — the shape of what goes back to the client. `model_config = ConfigDict(from_attributes=True)` is the one line of "magic" — it tells Pydantic it's allowed to read this shape directly off a SQLAlchemy model instance (`category.name`, `category.id`, etc.) instead of requiring a plain dict.

This schema layer is also your validation layer, for free: send a `POST /categories` with no `name` field, and FastAPI returns a `422 Unprocessable Entity` — your route function's body never even starts executing.

### 3.3 Service — the business logic

```python
class ParentCategoryNotFoundError(Exception):
    """Raised when parent_id doesn't point to an existing, non-deleted category."""


def get_category(db: Session, category_id: uuid.UUID) -> Category | None:
    return db.query(Category).filter(
        Category.id == category_id, Category.deleted_at.is_(None)
    ).first()


def _check_parent_exists(db: Session, parent_id: uuid.UUID | None) -> None:
    if parent_id is not None and get_category(db, parent_id) is None:
        raise ParentCategoryNotFoundError("Parent category not found")


def create_category(db: Session, data: CategoryCreate) -> Category:
    _check_parent_exists(db, data.parent_id)

    category = Category(name=data.name, parent_id=data.parent_id, image=data.image)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(db: Session, category_id: uuid.UUID, data: CategoryUpdate) -> Category | None:
    category = get_category(db, category_id)
    if category is None:
        return None

    updates = data.model_dump(exclude_unset=True)   # only fields the caller actually sent
    if "parent_id" in updates:
        _check_parent_exists(db, updates["parent_id"])

    for field, value in updates.items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)
    return category


def soft_delete_category(db: Session, category_id: uuid.UUID) -> Category | None:
    category = get_category(db, category_id)
    if category is None:
        return None

    category.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(category)
    return category
```

A few things worth understanding line by line:

- **`get_category` always filters `deleted_at.is_(None)`.** This is how soft-delete actually works in practice — a "deleted" row is never queried by normal code, so it's invisible everywhere *except* if you deliberately query without that filter. Nothing is ever physically removed from the table.
- **The one real business rule Categories has** is `_check_parent_exists` — if you hand it a `parent_id`, that parent has to actually exist as a real, non-deleted row. This is expressed as a raised Python exception (`ParentCategoryNotFoundError`), *not* as an HTTP status code — the service layer has no concept of HTTP. That separation is exactly what lets you call `create_category(db, data)` directly in a test and assert on the exception, with zero HTTP machinery involved.
- **`update_category` uses `exclude_unset=True`.** This is the mechanism that makes `PATCH` a true partial update: if the caller only sent `{"name": "New Name"}`, `data.model_dump(exclude_unset=True)` returns `{"name": "New Name"}` only — `parent_id` and `image`, even though they exist on the schema as `None`-defaulted fields, are *not* included, so they're never overwritten with `None` by accident.
- **`db.commit()` then `db.refresh()`** is the standard SQLAlchemy save pattern: `commit()` writes the transaction to Postgres, `refresh()` reloads the object's fields from the database (picking up anything the database itself computed, like `created_at`'s default).

### 3.4 Route — HTTP in, HTTP out

```python
router = APIRouter(prefix="/categories", tags=["categories"])


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return category_service.create_category(db, data)
    except ParentCategoryNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        category = category_service.update_category(db, category_id, data)
    except ParentCategoryNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


@router.delete("/{category_id}", response_model=CategoryDeleteResponse)
def delete_category(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = category_service.soft_delete_category(db, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category
```

Notice how little logic is actually here — four or five lines per endpoint. Each function:

1. Declares what it needs as parameters with `Depends(...)` defaults — FastAPI resolves those *before* your function body runs.
2. Calls exactly one service function.
3. Has zero, one, or two `except` clauses translating a named business exception into the right `HTTPException`.
4. Returns either the service's result directly (FastAPI serializes it through `response_model=...` automatically) or raises.

`response_model=CategoryResponse` is doing real work here too: even if the service accidentally returned extra internal fields, FastAPI would only serialize the fields declared on `CategoryResponse` — it's a security boundary as much as a documentation aid.

### 3.5 Register — plugging it in

```python
# main.py
from app.api import health, users, routes, customers, categories, brands, products, price_lists, suppliers, warehouses
...
app.include_router(categories.router, prefix="/api/v1")
```

`router = APIRouter(prefix="/categories", ...)` set the *domain* prefix; `include_router(..., prefix="/api/v1")` adds the *API version* prefix in front. Together: `POST /api/v1/categories` — matching `api_reference.md` exactly. If you forget this one line, everything else you wrote compiles fine and simply isn't reachable.

---

## 4. The Wiring: How Files Actually Connect

Two mechanisms do essentially all of the "connecting" across this entire backend. Understand these two and you understand the architecture.

### 4.1 Dependency Injection — `Depends(...)`

Every route function lists what it needs as function arguments with a default of `Depends(something)`. FastAPI calls `something` first, and hands your route function whatever it returns:

| Dependency | Defined in | What it does |
|---|---|---|
| `Depends(get_db)` | `app/db/session.py` | Opens one SQLAlchemy `Session` for this single request; closes it automatically once the request finishes (even if it errored) |
| `Depends(get_current_user)` | `app/core/deps.py` | Reads the `Authorization: Bearer <token>` header, decodes and verifies the JWT, loads the matching `User` row from the database — or raises `401 Unauthorized` **before your route body ever executes** |

This is the real connective tissue of the whole backend: every protected route across every domain says

```python
current_user: User = Depends(get_current_user)
```

and none of them know or care *how* login actually works internally. If the auth mechanism ever changes (say, switching from JWT to session cookies), you change it once, in `app/core/deps.py`, and every domain stays correctly protected without a single other file being touched.

> **Why services take a raw `Session` instead of calling `get_db()` themselves:** it makes them trivially testable. `tests/conftest.py` swaps in a real *test* database session via `app.dependency_overrides[get_db]`, and every service function — written against nothing more specific than "some `Session`" — doesn't notice the swap at all. This is the practical payoff of keeping services decoupled from FastAPI.

### 4.2 Shared Enums — `app/core/enums.py`

Every status-like field (`active`/`inactive`, `active`/`inactive`/`blocked`, etc.) is defined once as a Python `Enum` in `app/core/enums.py` — `ProductStatus`, `SupplierStatus`, `WarehouseStatus`, and so on — and imported wherever that field is used, in both the schema (so FastAPI validates it) and, where relevant, the service. This is what stops a typo like `"actve"` from ever silently reaching the database — Pydantic rejects anything that isn't a real enum value with a `422`.

---

## 5. Turning Business Rules into HTTP Responses

There's exactly one recurring pattern for "this write would violate a rule," reused across every domain that has a uniqueness constraint (Products' `sku`/`barcode`, Suppliers' `supplier_code`, Price List Items' one-price-per-product-per-list):

```python
# in the service module
class DuplicateProductError(Exception):
    """Raised when sku or barcode is already used by another product."""

def create_product(db: Session, data: ProductCreate) -> Product:
    product = Product(**data.model_dump())
    db.add(product)
    try:
        db.commit()
    except IntegrityError:            # Postgres rejected the duplicate sku/barcode
        db.rollback()
        raise DuplicateProductError("A product with this sku or barcode already exists")
    db.refresh(product)
    return product
```

```python
# in the route module
@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(data: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        return product_service.create_product(db, data)
    except DuplicateProductError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
```

The key idea: **the database's own unique constraint is the source of truth for "is this a duplicate,"** not a separate `SELECT ... WHERE sku = ...` query beforehand (which would have a race condition anyway — two requests could both pass that check simultaneously). Postgres enforces the constraint, SQLAlchemy surfaces the failure as `IntegrityError`, the service catches it and re-raises it as a *named, domain-specific* exception (`DuplicateProductError`), and the route catches that specific named exception and maps it to `409 Conflict`.

The "not found" case follows the same shape without needing an exception at all — a service function that can't find a row simply returns `None`, and the route checks `if x is None: raise HTTPException(404, ...)`.

---

## 6. What's Identical vs. What Changes, Across All Six Domains

| Domain | Endpoints | Real business rule | What causes a conflict |
|---|---|---|---|
| `categories` | `POST` · `PATCH` · `DELETE` | self-referencing `parent_id` must point to a real category | — (checked by hand, not a DB constraint) |
| `brands` | `POST` · `PATCH` · `DELETE` | none — plain CRUD | — |
| `products` | `POST` · `PATCH` · `PATCH .../status` · `DELETE` | none beyond uniqueness | duplicate `sku` or `barcode` |
| `price_lists` (+ nested `/items`) | `POST`/`PATCH`/`DELETE` on the list, `POST`/`PATCH`/`DELETE` on items | one price per product per list | duplicate `(price_list_id, product_id)` |
| `suppliers` | `POST` · `PATCH` · `PATCH .../status` · `DELETE` | none beyond uniqueness | duplicate `supplier_code` |
| `warehouses` | `POST` · `PATCH` · `PATCH .../status` · `DELETE` | none yet — `state` is just stored, for GST logic Sales Orders will use later | — |

Notice what stays **constant**: five files, `Depends(get_current_user)` on every single route, soft delete via `deleted_at` everywhere, the same `Create`/`Update`/`Response`/`DeleteResponse` schema shape.

What **changes** domain to domain is genuinely small: how many fields the table has, whether there's a uniqueness constraint worth catching, and whether there's one extra hand-written rule (like the category parent check). Once that clicks, a "new" API stops feeling like new work — it's the same shape wearing a different name.

---

## 7. How the Domains Connect to Each Other

Foreign keys are the *real* connections between domains — this is where "the frontend/backend never trusts a client value, the server always looks things up" starts to matter. So far, most of your catalog domains are deliberately standalone:

| This column | Points at | Why |
|---|---|---|
| `products.category_id` | `categories.id` | a product belongs to exactly one category |
| `products.brand_id` | `brands.id` | a product belongs to exactly one brand |
| `price_list_items.product_id` | `products.id` | a price only means something attached to a real product |
| `price_list_items.price_list_id` | `price_lists.id` | which list this price entry belongs to |
| `suppliers`, `warehouses` | *(standalone)* | no incoming or outgoing FK yet — but `warehouses.state` will matter once Sales Orders compares it against a customer's state to decide CGST+SGST vs. IGST |

> **Where this deliberately stopped short:** `create_product` doesn't check that `category_id`/`brand_id` actually point to real rows before saving — same as Price List Items doesn't verify `product_id`. That's a conscious simplicity trade-off, matching `build_guide.md`: only add an explicit existence-check guard when the build guide calls it out as a genuine business rule (like the Categories parent check). Today, a bad foreign key still fails to save — just as a raw Postgres `IntegrityError` (which would currently surface as an unhandled `500`) instead of a clean `404`. Worth tightening later if it ever actually bites in practice, but not something to pre-build for a case that hasn't happened yet (YAGNI, per `CLAUDE.md` §3).

---

## 8. Building the Next One Yourself

**Vehicles** is next in your track (`api_work_allocation.md`), and it's the first domain with *two* real foreign keys — `driver_id → users.id` and `warehouse_id → warehouses.id` — a genuine step up from anything so far. Here's the exact checklist to follow, in order:

1. Read the table definition in `database_schema_docs.markdown` — confirm the model file's columns match (most models already exist; you're rarely starting from a blank file).
2. If the table has a status-like field, add a `*Status` enum to `app/core/enums.py`.
3. Write the schema file: `...Create`, `...Update` (all-Optional), `...StatusUpdate` if relevant, `...Response`, `...DeleteResponse`.
4. Write the service file: `get_x`, `create_x`, `update_x`, `set_x_status` if relevant, `soft_delete_x`. Only add an `IntegrityError` → named-exception catch if there's a genuine unique field to protect.
5. Write the route file: one function per endpoint, `Depends(get_db)` **and** `Depends(get_current_user)` on every single one, translate any caught exceptions into the matching status code.
6. Register the router in `main.py` — one import, one `include_router` line.
7. Write tests, mirroring the structure of an existing test file: happy path (`201`/`200`), missing-auth (`401`/`403`), validation (`422`), the one real business rule if there is one, not-found (`404`), and soft-delete behavior.
8. Run the **full** test suite before calling it done, not just the new file — this is what catches an accidental break somewhere else in the system.

---

*This document explains the code already shipped in this repository as of the Catalog & Supply domains listed above. `build_guide.md`, `api_reference.md`, and `database_schema_docs.markdown` remain the source of truth for exact field names, request/response JSON shapes, and table definitions — update this walkthrough if the underlying pattern itself ever changes.*
