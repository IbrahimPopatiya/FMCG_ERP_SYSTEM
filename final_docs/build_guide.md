# Build Guide — How to Build Each API
## Distribution Management System (DMS)

| | |
|---|---|
| **Purpose** | Step-by-step guide for building each API: which database table, which files, what order, what business logic |
| **Audience** | Beginners building their first backend project |
| **Related Docs** | `database_schema_docs.markdown`, `api_reference.md`, `api_work_allocation.md`, `project_setup.md` |

---

## 1. The Golden Rule

**Every single API follows the same 5-step pattern.** Once you understand this pattern, you can build any API in this project — you're just repeating it for a different table.

```
1. MODEL     → app/models/<domain>.py       (the database table)
2. SCHEMA    → app/schemas/<domain>.py      (the request/response shape)
3. SERVICE   → app/services/<domain>.py     (the business logic)
4. ROUTE     → app/api/<domain>.py          (the actual API endpoint)
5. REGISTER  → main.py (backend root)        (plug the route into the app)
```

Read this once, then use it as a checklist for every domain below. If you ever feel lost while building an API, come back to this section.

---

## 2. What Each File Does (In Plain English)

### 2.1 Model (`app/models/<domain>.py`)
This is the **database table**, written as Python code (SQLAlchemy). It must match the table exactly as described in `database_schema_docs.markdown` — same columns, same types, same constraints (PK, FK, UQ, NOT NULL).

Example — `PRODUCTS` table becomes:
```python
# app/models/product.py
import uuid
from sqlalchemy import Column, String, Numeric, Integer, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base
from app.db.mixins import TimestampMixin, SoftDeleteMixin

class Product(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sku = Column(String(80), unique=True, nullable=False)
    barcode = Column(String(80), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"))
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id"))
    unit = Column(String(50), nullable=False)
    packing = Column(String(50), nullable=False)
    mrp = Column(Numeric(12, 2), nullable=False)
    selling_price = Column(Numeric(12, 2), nullable=False)
    gst_rate = Column(Numeric(5, 2), nullable=False)
    minimum_stock = Column(Integer, nullable=False)
    image = Column(String(255), nullable=True)
    status = Column(String(20), nullable=False, default="active")
```

> **Tip:** Build the `TimestampMixin` (`created_at`, `updated_at`) and `SoftDeleteMixin` (`deleted_at`) once in `app/db/mixins.py` — every table needs them, so don't repeat the columns in every model.

### 2.2 Schema (`app/schemas/<domain>.py`)
This is the **shape of the request and response JSON** (Pydantic models). It must match what's documented in `api_reference.md` for that API — nothing more, nothing less.

```python
# app/schemas/product.py
from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal
from typing import Optional

class ProductCreate(BaseModel):
    sku: str
    barcode: str
    name: str
    category_id: UUID
    brand_id: UUID
    unit: str
    packing: str
    mrp: Decimal
    selling_price: Decimal
    gst_rate: Decimal
    minimum_stock: int
    image: Optional[str] = None

class ProductResponse(BaseModel):
    id: UUID
    sku: str
    name: str
    status: str

    class Config:
        from_attributes = True
```

Rule of thumb: one `...Create` schema for `POST`, an `...Update` schema (all fields optional) for `PATCH`, and a `...Response` schema for what you return.

### 2.3 Service (`app/services/<domain>.py`)
This is where the **business logic** lives — anything that isn't "just save this to the database." Examples: calculating GST, checking stock before approving an order, deriving payment status.

```python
# app/services/product.py
from sqlalchemy.orm import Session
from app.models.product import Product
from app.schemas.product import ProductCreate

def create_product(db: Session, data: ProductCreate) -> Product:
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product
```

Keep routes "thin" and services "smart" — the route should just call the service, not contain the logic itself.

### 2.4 Route (`app/api/<domain>.py`)
This is the actual **API endpoint** — it receives the HTTP request, calls the service, and returns the response.

```python
# app/api/products.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.product import ProductCreate, ProductResponse
from app.services import product as product_service

router = APIRouter(prefix="/products", tags=["products"])

@router.post("", response_model=ProductResponse)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    return product_service.create_product(db, data)
```

### 2.5 Register (`main.py`, at the `backend/` root)
Every new router must be added here, or FastAPI will never know it exists.

```python
from app.api import products

app.include_router(products.router, prefix="/api/v1")
```

---

## 3. Before You Touch Any Domain — One-Time Setup

Do these once, before building any domain-specific API. They are shared by everything.

| # | What | File | Why |
|---|---|---|---|
| 1 | Confirm DB connection works | `app/db/session.py` (already created) | Already done in project setup — confirm `alembic upgrade head` runs without error |
| 2 | Create shared mixins | `app/db/mixins.py` | `created_at`, `updated_at`, `deleted_at` — reused by every model |
| 3 | Create the base response envelope (optional but recommended) | `app/schemas/common.py` | A shared error/response shape so every API returns errors the same way |
| 4 | Create the Audit Log model + a `log_action()` helper | `app/models/audit_log.py`, `app/services/audit.py` | Every financial/stock write should call this — build once, use everywhere |
| 5 | Create the auth dependency (`get_current_user`) | `app/core/security.py` | Needed by every protected route once Auth & Users is built |

**Do not skip step 4.** If you build it after 5 domains are already done, you'll have to go back and add audit logging to all of them.

---

## 4. Domain-by-Domain Build Steps

For each domain below: **build the Model → run a migration → build the Schema → build the Service → build the Route → register it → test it in `/docs`.** Test each domain before moving to the next — don't build all models first and all routes later.

> Tables and fields for each domain are in `database_schema_docs.markdown` Section 3. Full request/response JSON for each API is in `api_reference.md`. This guide tells you *where* to write the code — go to those two docs for the exact *field names and JSON shapes*.

---

### 4.1 Auth & Users — Build First, Always

**Tables:** `USERS`
**Files to create:**
- `app/models/user.py` — the `USERS` table
- `app/schemas/user.py` — `UserCreate`, `UserUpdate`, `UserResponse`, `LoginRequest`, `LoginResponse`
- `app/services/user.py` — create user, hash password, verify login
- `app/services/auth.py` — generate JWT token, verify token
- `app/core/security.py` — `hash_password()`, `verify_password()`, `get_current_user()` dependency
- `app/api/auth.py` — `POST /auth/login`, `POST /auth/logout`
- `app/api/users.py` — `POST/PATCH /users`, `PATCH /users/{id}/status`, `DELETE /users/{id}`

**Business logic to write:**
- Password must be hashed before saving (`passlib`) — never store plain text.
- Login checks mobile + password, then issues a JWT token.
- `get_current_user()` reads the token from the request header and loads the user — every other protected route will depend on this function.

**Migration command:**
```bash
alembic revision --autogenerate -m "add users table"
alembic upgrade head
```

**Test it:** Create a user via `/docs`, then log in and confirm you get a token back. Keep this token — you'll need it to test every other API (once auth is enforced).

---

### 4.2 Routes

**Tables:** `ROUTES`
**Files:** `app/models/route.py`, `app/schemas/route.py`, `app/services/route.py`, `app/api/routes.py`
**Depends on:** `USERS` (a route has a `salesman_id`)
**Business logic:** None beyond basic create/update — this is simple master data.

---

### 4.3 Customers

**Tables:** `CUSTOMERS`
**Files:** `app/models/customer.py`, `app/schemas/customer.py`, `app/services/customer.py`, `app/api/customers.py`
**Depends on:** `ROUTES`, `PRICE_LISTS` (build the customer model even if `PRICE_LISTS` doesn't exist yet — just don't enforce the foreign key relationship in code until Price Lists is ready, or build Price Lists first if you're doing this solo)
**Business logic:**
- `customer_code` and `mobile` must be unique (partial unique index — ignore soft-deleted rows).
- `PATCH /customers/{id}/location` just updates lat/long — no complex logic.

---

### 4.4 Categories & Brands

**Tables:** `CATEGORIES`, `BRANDS`
**Files:**
- `app/models/category.py`, `app/schemas/category.py`, `app/api/categories.py`
- `app/models/brand.py`, `app/schemas/brand.py`, `app/api/brand.py`
**Business logic:** `CATEGORIES` is self-referencing (`parent_id` points back to `CATEGORIES.id`) — handle `parent_id = null` as "top-level category."

---

### 4.5 Products

**Tables:** `PRODUCTS`
**Files:** `app/models/product.py`, `app/schemas/product.py`, `app/services/product.py`, `app/api/products.py`
**Depends on:** `CATEGORIES`, `BRANDS` (build those first)
**Business logic:**
- `sku` and `barcode` must be unique.
- This API never touches stock — stock lives only in `INVENTORY` / `INVENTORY_MOVEMENTS` (see 4.9).

---

### 4.6 Price Lists

**Tables:** `PRICE_LISTS`, `PRICE_LIST_ITEMS`
**Files:**
- `app/models/price_list.py` — both `PriceList` and `PriceListItem` classes can live in this one file
- `app/schemas/price_list.py`, `app/services/price_list.py`, `app/api/price_lists.py`
**Depends on:** `PRODUCTS`
**Business logic:** One price per product per list (`price_list_id` + `product_id` unique together). This is the table the Sales Order service will read from later.

---

### 4.7 Warehouses

**Tables:** `WAREHOUSES`
**Files:** `app/models/warehouse.py`, `app/schemas/warehouse.py`, `app/api/warehouses.py`
**Business logic:** The `state` field is important — it's compared against the customer's state later to decide CGST+SGST vs IGST. Don't skip it.

---

### 4.8 Suppliers

**Tables:** `SUPPLIERS`
**Files:** `app/models/supplier.py`, `app/schemas/supplier.py`, `app/api/suppliers.py`
**Business logic:** None beyond basic CRUD.

---

### 4.9 Vehicles

**Tables:** `VEHICLES`
**Files:** `app/models/vehicle.py`, `app/schemas/vehicle.py`, `app/api/vehicles.py`
**Depends on:** `USERS` (driver), `WAREHOUSES` (home warehouse)
**Business logic:** None beyond basic CRUD.

---

### 4.10 Inventory

**Tables:** `INVENTORY` (summary), `INVENTORY_MOVEMENTS` (ledger)
**Files:**
- `app/models/inventory.py` — both `Inventory` and `InventoryMovement` classes
- `app/schemas/inventory.py`
- `app/services/inventory.py` — **this is the most important service file in the whole project**
- `app/api/inventory.py` — `POST /inventory/adjustments`, `POST /inventory/transfers`, `GET /inventory`

**Business logic — build this as one reusable function, e.g. `record_movement()`:**
```python
def record_movement(db, warehouse_id, product_id, movement_type, quantity, reference_type=None, reference_id=None, user_id=None):
    # 1. Insert a row into INVENTORY_MOVEMENTS
    # 2. Update (or create) the matching row in INVENTORY
    # 3. Return the new balance
```
Every other domain that changes stock (Orders, Purchases, Returns) will call this **same function** — never write stock-updating code separately in another service file. This is what keeps the ledger accurate.

---

### 4.11 Sales Orders

**Tables:** `SALES_ORDERS`, `SALES_ORDER_ITEMS`
**Files:** `app/models/sales_order.py`, `app/schemas/sales_order.py`, `app/services/sales_order.py`, `app/api/orders.py`
**Depends on:** `CUSTOMERS`, `PRODUCTS`, `PRICE_LISTS`, `WAREHOUSES` — **build all of those first.**
**Business logic (the core of the whole system):**
- `POST /orders`: look up each product's price from the customer's price list, calculate line totals, decide CGST+SGST vs IGST by comparing warehouse state vs customer state, calculate `subtotal`, `discount`, `round_off`, `total`. Do this in the service layer, never trust prices from the request.
- `POST /orders/{id}/approve`: calls `record_movement()` with `movement_type="reserved"`.
- `POST /orders/{id}/load`: calls `record_movement()` with `movement_type="sold_out"`.
- `POST /orders/{id}/cancel`: if stock was reserved, calls `record_movement()` to release it back.
- Wrap each of these in one database transaction — the order/status change and the stock movement must succeed or fail together.

---

### 4.12 Invoices

**Tables:** `INVOICES`
**Files:** `app/models/invoice.py`, `app/schemas/invoice.py`, `app/services/invoice.py`, `app/api/invoices.py`
**Depends on:** `SALES_ORDERS`
**Business logic:** `POST /orders/{id}/invoice` copies the order's totals/GST into a new invoice row, generates an `invoice_number`, and sets `payment_status = "unpaid"`. No manual editing of invoice totals is ever allowed.

---

### 4.13 Purchases

**Tables:** `PURCHASES`, `PURCHASE_ITEMS`
**Files:** `app/models/purchase.py`, `app/schemas/purchase.py`, `app/services/purchase.py`, `app/api/purchases.py`
**Depends on:** `SUPPLIERS`, `WAREHOUSES`, `PRODUCTS`, and the `record_movement()` function from Inventory.
**Business logic:** `POST /purchases/{id}/receive` calls `record_movement()` with `movement_type="purchase_in"` for each item, then updates the purchase status to `received`.

---

### 4.14 Delivery / Driver

**Tables:** `DELIVERIES`
**Files:** `app/models/delivery.py`, `app/schemas/delivery.py`, `app/services/delivery.py`, `app/api/deliveries.py`
**Depends on:** `INVOICES`, `VEHICLES`, `USERS` (driver)
**Business logic:** `POST /deliveries/{id}/complete` is the biggest one — inside one transaction it must: save GPS/time, create a Payment record (call the Payments service, see 4.15), update the invoice's `payment_status`, and update the order status.

---

### 4.15 Payments

**Tables:** `PAYMENTS`
**Files:** `app/models/payment.py`, `app/schemas/payment.py`, `app/services/payment.py`, `app/api/payments.py`
**Depends on:** `INVOICES`
**Business logic:**
- `total_amount` = `cash_amount + upi_amount + cheque_amount`, calculated server-side.
- After saving a payment, recalculate the invoice's `payment_status`: sum all valid payments for that invoice, compare to invoice `total`, set `unpaid` / `partial` / `paid`. Write this as a small reusable function since Deliveries also needs to call it.

---

### 4.16 Returns

**Tables:** `RETURNS`, `RETURN_ITEMS`
**Files:** `app/models/return_.py` (avoid naming the file `return.py` — `return` is a Python keyword), `app/schemas/return_.py`, `app/services/return_.py`, `app/api/returns.py`
**Depends on:** `INVOICES`, `WAREHOUSES`, `PRODUCTS`, and `record_movement()` from Inventory.
**Business logic:** `POST /returns/{id}/complete` loops through each return item and calls `record_movement()` with the matching type: `returned_in` (good stock), `damaged`, or `expired`, based on the item's reason.

---

### 4.17 File Uploads

**Tables:** None (no dedicated table — the returned path gets stored in whichever business table needs it, e.g. `DELIVERIES.customer_signature`)
**Files:** `app/services/file_storage.py`, `app/api/files.py`
**Business logic:** `POST /files` accepts a file, uploads it to object storage (or local disk for early development), and returns the path/URL. Keep this simple at first — even saving to a local `uploads/` folder is fine for development before wiring real cloud storage.

---

### 4.18 Tally Sync

**Tables:** None owned — reads from `INVOICES`, `PAYMENTS`, `RETURNS` and updates their `tally_sync_status`
**Files:** `app/services/tally.py`, `app/api/tally.py`
**Depends on:** Invoices, Payments, Returns must already exist and have data.
**Business logic:** Loop through records where `tally_sync_status = "pending"`, attempt to push each one, and set `synced` or `failed` accordingly. Keep the actual Tally connection logic isolated in one function so it's easy to swap/fix later.

---

## 5. Audit Log — Wire It Into Every Write

You built `app/services/audit.py` in Section 3. Now, every service function that creates/updates/deletes a financial or stock record should call it, e.g.:

```python
audit.log_action(db, user_id=current_user.id, action="create", entity_type="sales_orders", entity_id=order.id, new_values=order_dict)
```

Do this **inside the same service function**, right after the main save — not as a separate API call from the frontend.

---

## 6. Suggested Order to Actually Build In

This matches `api_work_allocation.md`. Follow it top to bottom within your track; don't jump ahead to a domain whose dependencies aren't built yet.

```
Shared foundation (once):
  DB connection → mixins → Audit Log service → Auth & Users

Amin's track (Catalog & Supply):
  Categories & Brands → Products → Price Lists
  → Warehouses → Suppliers → Vehicles
  → Inventory
  → Purchases
  → Tally Sync (last)

Ibrahim's track (Selling & Operations):
  Routes → Customers
  → File Uploads (any time, independent)
  → Sales Orders (needs Amin's Products/Price Lists/Warehouses)
  → Invoices
  → Deliveries (needs Amin's Vehicles)
  → Payments
  → Returns (needs Amin's Warehouses + Inventory)
```

---

## 7. Testing Checklist for Every API You Build

Before marking a domain "done," confirm:

- [ ] Migration ran without errors (`alembic upgrade head`)
- [ ] You can create a record via `/docs` (Swagger UI) and see it in the database
- [ ] Required fields actually reject missing data (try submitting without them)
- [ ] Unique fields actually reject duplicates
- [ ] The response JSON matches what's documented in `api_reference.md`
- [ ] If the API touches stock or money, an Audit Log row was created
- [ ] Soft delete: after `DELETE`, the record still exists in the table but has `deleted_at` set, and no longer shows up in normal `GET` lists

---

*This guide tells you where to write code and in what order. For exact field names, refer to `database_schema_docs.markdown`. For exact request/response JSON, refer to `api_reference.md`. Keep all three in sync as the project grows.*
