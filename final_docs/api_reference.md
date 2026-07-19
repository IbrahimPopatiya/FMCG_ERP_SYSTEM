# API Reference — Request & Response Details
## Distribution Management System (DMS)

| | |
|---|---|
| **Purpose** | Explain what each API does, and show the exact request body and response body for it. |
| **Base URL** | `/api/v1` |
| **Format** | All requests and responses are JSON. |
| **Related Docs** | `database_schema_docs.markdown`, `apis_doc.md`, `prd.md` |

---

## How to Read This Document

- **What it does** — plain-English explanation of the API.
- **Request** — what the frontend must send.
- **Response** — what the backend sends back.
- Fields marked **required** must always be sent. Fields marked **optional** can be left out.
- `id` fields are always UUIDs (text that looks like `550e8400-e29b-41d4-a716-446655440000`).
- Money fields are always numbers with 2 decimal places (e.g. `1250.50`).
- Dates/times are always in ISO format (e.g. `2026-07-19T10:30:00Z`).
- The server always calculates money, GST, and stock numbers. The frontend never sends these as trusted values unless stated otherwise.
- Every response below shows only the important fields. All records also carry `created_at`, `updated_at`, and (where soft-delete applies) `deleted_at`, even if not shown in every example.

---

## 1. Authentication & Users

### `POST /auth/login`
**What it does:** Logs a user in and returns an access token.

**Request**
```json
{
  "mobile": "9876543210",
  "password": "string"
}
```
| Field | Required | Description |
|---|---|---|
| mobile | required | Registered mobile number |
| password | required | Account password |

**Response**
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": "uuid",
    "full_name": "Ramesh Kumar",
    "role": "salesman",
    "status": "active"
  }
}
```

---

### `POST /auth/logout`
**What it does:** Logs the current user out and invalidates their session/token.

**Request:** No body needed. Token sent in the `Authorization` header.

**Response**
```json
{
  "message": "Logged out successfully"
}
```

---

### `POST /users`
**What it does:** Creates a new staff account (salesman, driver, admin, manager, etc.).

**Request**
```json
{
  "full_name": "Ramesh Kumar",
  "mobile": "9876543210",
  "email": "ramesh@example.com",
  "password": "string",
  "role": "salesman"
}
```
| Field | Required | Description |
|---|---|---|
| full_name | required | Person's full name |
| mobile | required | Unique mobile number |
| email | required | Unique email address |
| password | required | Will be stored encrypted |
| role | required | One of: admin, salesman, driver, manager |

**Response**
```json
{
  "id": "uuid",
  "full_name": "Ramesh Kumar",
  "mobile": "9876543210",
  "email": "ramesh@example.com",
  "role": "salesman",
  "status": "active",
  "created_at": "2026-07-19T10:00:00Z"
}
```

---

### `PATCH /users/{id}`
**What it does:** Updates a staff member's profile or role.

**Request** (send only the fields you want to change)
```json
{
  "full_name": "Ramesh K.",
  "email": "new-email@example.com",
  "role": "manager"
}
```
All fields optional — send only what changed.

**Response:** Same shape as the `POST /users` response, with updated values.

---

### `PATCH /users/{id}/status`
**What it does:** Activates or deactivates a user account.

**Request**
```json
{
  "status": "inactive"
}
```
| Field | Required | Description |
|---|---|---|
| status | required | `active` or `inactive` |

**Response**
```json
{
  "id": "uuid",
  "status": "inactive",
  "updated_at": "2026-07-19T10:05:00Z"
}
```

---

### `DELETE /users/{id}`
**What it does:** Soft-deletes a user (hides them from normal use, keeps history intact).

**Request:** No body.

**Response**
```json
{
  "id": "uuid",
  "deleted_at": "2026-07-19T10:10:00Z"
}
```

---

## 2. Routes

### `POST /routes`
**What it does:** Creates a new sales route and assigns a salesman to it.

**Request**
```json
{
  "name": "North Zone Route",
  "salesman_id": "uuid"
}
```
| Field | Required | Description |
|---|---|---|
| name | required | Route name |
| salesman_id | optional | Salesman to assign (can be set later) |

**Response**
```json
{
  "id": "uuid",
  "name": "North Zone Route",
  "salesman_id": "uuid",
  "status": "active"
}
```

---

### `PATCH /routes/{id}`
**What it does:** Updates a route's name or details.

**Request**
```json
{
  "name": "North Zone Route - Extended"
}
```

**Response:** Same shape as `POST /routes` response, updated.

---

### `PATCH /routes/{id}/salesman`
**What it does:** Assigns or changes the salesman for a route.

**Request**
```json
{
  "salesman_id": "uuid"
}
```

**Response**
```json
{
  "id": "uuid",
  "salesman_id": "uuid",
  "updated_at": "2026-07-19T10:15:00Z"
}
```

---

### `DELETE /routes/{id}`
**What it does:** Soft-deletes a route.

**Request:** No body.

**Response**
```json
{
  "id": "uuid",
  "deleted_at": "2026-07-19T10:20:00Z"
}
```

---

## 3. Customers

### `POST /customers`
**What it does:** Registers a new customer (shop).

**Request**
```json
{
  "customer_code": "CUST-001",
  "business_name": "Sharma General Store",
  "owner_name": "Anil Sharma",
  "mobile": "9876500000",
  "alternate_mobile": "9876500001",
  "gst_number": "27ABCDE1234F1Z5",
  "address": "Shop 12, Market Road",
  "city": "Pune",
  "state": "Maharashtra",
  "pincode": "411001",
  "credit_limit": 50000.00,
  "payment_terms": 15,
  "route_id": "uuid",
  "price_list_id": "uuid"
}
```
| Field | Required | Description |
|---|---|---|
| customer_code | required | Unique short code for the shop |
| business_name | required | Shop/business name |
| owner_name | required | Owner's name |
| mobile | required | Primary contact number |
| alternate_mobile | optional | Second contact number |
| gst_number | optional | Customer's GST number |
| address, city, state, pincode | required | Full address details |
| credit_limit | required | Maximum outstanding allowed |
| payment_terms | required | Credit period, in days |
| route_id | required | Which route this customer belongs to |
| price_list_id | required | Which price list applies to this customer |

**Response**
```json
{
  "id": "uuid",
  "customer_code": "CUST-001",
  "business_name": "Sharma General Store",
  "status": "active",
  "created_at": "2026-07-19T10:25:00Z"
}
```

---

### `PATCH /customers/{id}`
**What it does:** Updates any customer detail (address, credit limit, price list, etc.).

**Request:** Any subset of the `POST /customers` fields.

**Response:** Updated customer object, same shape as above.

---

### `PATCH /customers/{id}/status`
**What it does:** Changes a customer's status (e.g. to block a defaulting customer).

**Request**
```json
{
  "status": "blocked"
}
```
| Field | Required | Description |
|---|---|---|
| status | required | One of: active, inactive, blocked |

**Response**
```json
{
  "id": "uuid",
  "status": "blocked",
  "updated_at": "2026-07-19T10:30:00Z"
}
```

---

### `PATCH /customers/{id}/location`
**What it does:** Saves the customer's GPS coordinates (shop location).

**Request**
```json
{
  "latitude": 18.5204303,
  "longitude": 73.8567437
}
```

**Response**
```json
{
  "id": "uuid",
  "latitude": 18.5204303,
  "longitude": 73.8567437,
  "updated_at": "2026-07-19T10:32:00Z"
}
```
> Note: this needs `latitude`/`longitude` columns to be added to the `CUSTOMERS` table — see PRD "Known Gaps".

---

### `DELETE /customers/{id}`
**What it does:** Soft-deletes a customer.

**Response**
```json
{
  "id": "uuid",
  "deleted_at": "2026-07-19T10:35:00Z"
}
```

---

## 4. Categories & Brands

### `POST /categories`
**What it does:** Creates a product category (can be nested under a parent).

**Request**
```json
{
  "name": "Beverages",
  "parent_id": null,
  "image": "categories/beverages.jpg"
}
```
| Field | Required | Description |
|---|---|---|
| name | required | Category name |
| parent_id | optional | Parent category ID, for sub-categories |
| image | optional | Path/URL to a category image |

**Response**
```json
{
  "id": "uuid",
  "name": "Beverages",
  "parent_id": null,
  "image": "categories/beverages.jpg"
}
```

---

### `PATCH /categories/{id}`
**What it does:** Updates a category's name, parent, or image.

**Request:** Any subset of `POST /categories` fields.

**Response:** Updated category object.

---

### `DELETE /categories/{id}`
**What it does:** Soft-deletes a category.

**Response**
```json
{ "id": "uuid", "deleted_at": "2026-07-19T10:40:00Z" }
```

---

### `POST /brands`
**What it does:** Creates a product brand.

**Request**
```json
{
  "name": "Coca-Cola",
  "logo": "brands/coca-cola.png"
}
```

**Response**
```json
{
  "id": "uuid",
  "name": "Coca-Cola",
  "logo": "brands/coca-cola.png"
}
```

---

### `PATCH /brands/{id}`
**What it does:** Updates a brand's name or logo.

**Request:** Any subset of `POST /brands` fields.

**Response:** Updated brand object.

---

### `DELETE /brands/{id}`
**What it does:** Soft-deletes a brand.

**Response**
```json
{ "id": "uuid", "deleted_at": "2026-07-19T10:45:00Z" }
```

---

## 5. Products

### `POST /products`
**What it does:** Adds a new product to the catalogue.

**Request**
```json
{
  "sku": "SKU-1001",
  "barcode": "8901234567890",
  "name": "Coca-Cola 500ml",
  "category_id": "uuid",
  "brand_id": "uuid",
  "unit": "bottle",
  "packing": "12 x 500ml",
  "mrp": 40.00,
  "selling_price": 35.00,
  "gst_rate": 18.00,
  "minimum_stock": 50,
  "image": "products/coke-500ml.jpg"
}
```
| Field | Required | Description |
|---|---|---|
| sku | required | Unique internal product code |
| barcode | required | Unique barcode |
| name | required | Product name |
| category_id, brand_id | required | Links to category and brand |
| unit | required | Selling unit (piece, kg, box) |
| packing | required | Packing description |
| mrp | required | Maximum Retail Price |
| selling_price | required | Default selling price |
| gst_rate | required | GST percentage, e.g. 18.00 |
| minimum_stock | required | Level at which a low-stock alert triggers |
| image | optional | Path/URL to a product image |

**Response**
```json
{
  "id": "uuid",
  "sku": "SKU-1001",
  "name": "Coca-Cola 500ml",
  "status": "active",
  "created_at": "2026-07-19T10:50:00Z"
}
```

---

### `PATCH /products/{id}`
**What it does:** Updates product details (price, packing, category, etc.).

**Request:** Any subset of `POST /products` fields.

**Response:** Updated product object.

---

### `PATCH /products/{id}/status`
**What it does:** Activates or deactivates a product (e.g. to stop it being ordered).

**Request**
```json
{ "status": "inactive" }
```

**Response**
```json
{ "id": "uuid", "status": "inactive", "updated_at": "2026-07-19T10:55:00Z" }
```

---

### `DELETE /products/{id}`
**What it does:** Soft-deletes a product.

**Response**
```json
{ "id": "uuid", "deleted_at": "2026-07-19T11:00:00Z" }
```

> Note: This API never touches stock numbers. Stock is only ever changed through the Inventory APIs (Section 11).

---

## 6. Price Lists

### `POST /price-lists`
**What it does:** Creates a new price list (a named group of product prices).

**Request**
```json
{
  "name": "Wholesale Tier 1",
  "description": "Standard pricing for large-volume customers"
}
```

**Response**
```json
{
  "id": "uuid",
  "name": "Wholesale Tier 1",
  "description": "Standard pricing for large-volume customers"
}
```

---

### `PATCH /price-lists/{id}`
**What it does:** Updates a price list's name or description.

**Request:** Any subset of `POST /price-lists` fields.

**Response:** Updated price list object.

---

### `DELETE /price-lists/{id}`
**What it does:** Soft-deletes a price list.

**Response**
```json
{ "id": "uuid", "deleted_at": "2026-07-19T11:05:00Z" }
```

---

### `POST /price-lists/{id}/items`
**What it does:** Sets a special price for one product inside a price list.

**Request**
```json
{
  "product_id": "uuid",
  "price": 33.00
}
```

**Response**
```json
{
  "id": "uuid",
  "price_list_id": "uuid",
  "product_id": "uuid",
  "price": 33.00
}
```

---

### `PATCH /price-lists/{id}/items/{itemId}`
**What it does:** Changes the price of a product already in the list.

**Request**
```json
{ "price": 34.50 }
```

**Response:** Updated price list item object.

---

### `DELETE /price-lists/{id}/items/{itemId}`
**What it does:** Removes a product's special price from the list (it falls back to the product's default `selling_price`).

**Response**
```json
{ "id": "uuid", "removed": true }
```

---

## 7. Warehouses

### `POST /warehouses`
**What it does:** Creates a new warehouse.

**Request**
```json
{
  "name": "Pune Central Warehouse",
  "address": "Plot 5, Industrial Area",
  "state": "Maharashtra"
}
```
| Field | Required | Description |
|---|---|---|
| name | required | Warehouse name |
| address | required | Full address |
| state | required | Used to decide CGST+SGST vs IGST on orders from this warehouse |

**Response**
```json
{
  "id": "uuid",
  "name": "Pune Central Warehouse",
  "state": "Maharashtra",
  "status": "active"
}
```

---

### `PATCH /warehouses/{id}`
**What it does:** Updates warehouse details.

**Request:** Any subset of `POST /warehouses` fields.

**Response:** Updated warehouse object.

---

### `PATCH /warehouses/{id}/status`
**What it does:** Activates or deactivates a warehouse.

**Request**
```json
{ "status": "inactive" }
```

**Response**
```json
{ "id": "uuid", "status": "inactive" }
```

---

### `DELETE /warehouses/{id}`
**What it does:** Soft-deletes a warehouse.

**Response**
```json
{ "id": "uuid", "deleted_at": "2026-07-19T11:10:00Z" }
```

---

## 8. Suppliers

### `POST /suppliers`
**What it does:** Registers a new supplier.

**Request**
```json
{
  "supplier_code": "SUP-001",
  "name": "ABC Distributors Pvt Ltd",
  "gst_number": "27ABCDE1234F1Z5",
  "mobile": "9876511111",
  "address": "Industrial Estate, Pune"
}
```

**Response**
```json
{
  "id": "uuid",
  "supplier_code": "SUP-001",
  "name": "ABC Distributors Pvt Ltd",
  "status": "active"
}
```

---

### `PATCH /suppliers/{id}`
**What it does:** Updates supplier details.

**Request:** Any subset of `POST /suppliers` fields.

**Response:** Updated supplier object.

---

### `PATCH /suppliers/{id}/status`
**What it does:** Activates or deactivates a supplier.

**Request**
```json
{ "status": "inactive" }
```

**Response**
```json
{ "id": "uuid", "status": "inactive" }
```

---

### `DELETE /suppliers/{id}`
**What it does:** Soft-deletes a supplier.

**Response**
```json
{ "id": "uuid", "deleted_at": "2026-07-19T11:15:00Z" }
```

---

## 9. Vehicles

### `POST /vehicles`
**What it does:** Adds a new delivery vehicle.

**Request**
```json
{
  "vehicle_number": "MH12AB1234",
  "driver_id": "uuid",
  "warehouse_id": "uuid",
  "capacity": 2000.00
}
```

**Response**
```json
{
  "id": "uuid",
  "vehicle_number": "MH12AB1234",
  "status": "available"
}
```

---

### `PATCH /vehicles/{id}`
**What it does:** Updates vehicle details (capacity, home warehouse).

**Request:** Any subset of `POST /vehicles` fields.

**Response:** Updated vehicle object.

---

### `PATCH /vehicles/{id}/driver`
**What it does:** Assigns or changes the driver for a vehicle.

**Request**
```json
{ "driver_id": "uuid" }
```

**Response**
```json
{ "id": "uuid", "driver_id": "uuid" }
```

---

### `PATCH /vehicles/{id}/status`
**What it does:** Changes vehicle status.

**Request**
```json
{ "status": "maintenance" }
```
`status` is one of: `available`, `in_use`, `maintenance`.

**Response**
```json
{ "id": "uuid", "status": "maintenance" }
```

---

### `DELETE /vehicles/{id}`
**What it does:** Soft-deletes a vehicle.

**Response**
```json
{ "id": "uuid", "deleted_at": "2026-07-19T11:20:00Z" }
```

---

## 10. Sales Orders

### `POST /orders`
**What it does:** Creates a new order for a customer, with all its line items, in one step. The server looks up prices from the customer's price list and calculates GST — the frontend does not send prices or totals.

**Request**
```json
{
  "customer_id": "uuid",
  "expected_delivery": "2026-07-20T00:00:00Z",
  "remarks": "Deliver before noon",
  "items": [
    { "product_id": "uuid", "quantity": 10 },
    { "product_id": "uuid", "quantity": 5 }
  ]
}
```
| Field | Required | Description |
|---|---|---|
| customer_id | required | Which customer this order is for |
| expected_delivery | optional | Requested delivery date/time |
| remarks | optional | Free-text note |
| items | required | List of products and quantities requested |
| items[].product_id | required | Product being ordered |
| items[].quantity | required | Quantity requested |

**Response**
```json
{
  "id": "uuid",
  "order_number": "SO-2026-00123",
  "customer_id": "uuid",
  "status": "pending",
  "subtotal": 4500.00,
  "discount": 0.00,
  "cgst": 405.00,
  "sgst": 405.00,
  "igst": 0.00,
  "round_off": 0.00,
  "total": 5310.00,
  "items": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "ordered_qty": 10,
      "approved_qty": 0,
      "loaded_qty": 0,
      "price": 350.00,
      "gst_rate": 18.00,
      "cgst": 315.00,
      "sgst": 315.00,
      "igst": 0.00,
      "line_total": 4130.00
    }
  ],
  "created_at": "2026-07-19T11:25:00Z"
}
```

---

### `PATCH /orders/{id}`
**What it does:** Edits an order that is still `pending` (e.g. change quantities, remarks). Not allowed once approved or loaded.

**Request**
```json
{
  "remarks": "Deliver after 2 PM",
  "items": [
    { "product_id": "uuid", "quantity": 8 }
  ]
}
```

**Response:** Updated order object, same shape as `POST /orders` response.

---

### `POST /orders/{id}/approve`
**What it does:** Approves the requested quantities on an order. This reserves the stock (writes a `reserved` movement and raises `reserved_stock`).

**Request**
```json
{
  "items": [
    { "item_id": "uuid", "approved_qty": 10 },
    { "item_id": "uuid", "approved_qty": 4 }
  ]
}
```
| Field | Required | Description |
|---|---|---|
| items | required | Approved quantity per order line (can be less than ordered) |

**Response**
```json
{
  "id": "uuid",
  "status": "approved",
  "items": [
    { "id": "uuid", "ordered_qty": 10, "approved_qty": 10 }
  ],
  "updated_at": "2026-07-19T11:30:00Z"
}
```

---

### `POST /orders/{id}/load`
**What it does:** Confirms the quantities actually loaded onto the van. This deducts stock (writes a `sold_out` movement, reduces `physical_stock` and `reserved_stock`).

**Request**
```json
{
  "items": [
    { "item_id": "uuid", "loaded_qty": 10 }
  ]
}
```

**Response**
```json
{
  "id": "uuid",
  "status": "loaded",
  "items": [
    { "id": "uuid", "approved_qty": 10, "loaded_qty": 10 }
  ],
  "updated_at": "2026-07-19T11:35:00Z"
}
```

---

### `POST /orders/{id}/cancel`
**What it does:** Cancels an order. If stock was already reserved, it is released back.

**Request**
```json
{
  "reason": "Customer cancelled the order"
}
```
`reason` is optional.

**Response**
```json
{
  "id": "uuid",
  "status": "cancelled",
  "updated_at": "2026-07-19T11:40:00Z"
}
```

---

## 11. Inventory

> The frontend can never set stock numbers directly. All stock changes go through the two APIs below, which always create an Inventory Movement record and update the Inventory summary.

### `POST /inventory/adjustments`
**What it does:** Manually corrects stock at a warehouse (e.g. after a physical stock count finds a mismatch).

**Request**
```json
{
  "warehouse_id": "uuid",
  "product_id": "uuid",
  "quantity": -5,
  "reason": "Physical stock mismatch"
}
```
| Field | Required | Description |
|---|---|---|
| warehouse_id | required | Warehouse where the correction applies |
| product_id | required | Product being corrected |
| quantity | required | Positive to add stock, negative to remove stock |
| reason | required | Why the adjustment was made |

**Response**
```json
{
  "movement_id": "uuid",
  "warehouse_id": "uuid",
  "product_id": "uuid",
  "movement_type": "adjustment",
  "quantity": -5,
  "balance_after": 145,
  "created_at": "2026-07-19T11:45:00Z"
}
```

---

### `POST /inventory/transfers`
**What it does:** Moves stock from one warehouse to another.

**Request**
```json
{
  "from_warehouse_id": "uuid",
  "to_warehouse_id": "uuid",
  "product_id": "uuid",
  "quantity": 100
}
```

**Response**
```json
{
  "transfer_out_movement_id": "uuid",
  "transfer_in_movement_id": "uuid",
  "product_id": "uuid",
  "quantity": 100,
  "created_at": "2026-07-19T11:50:00Z"
}
```

---

### `GET /inventory`
**What it does:** Returns current stock summary, optionally filtered by warehouse or product.

**Request (query parameters):** `?warehouse_id=uuid&product_id=uuid`

**Response**
```json
[
  {
    "warehouse_id": "uuid",
    "product_id": "uuid",
    "physical_stock": 500,
    "reserved_stock": 40,
    "damaged_stock": 5,
    "expiry_stock": 0,
    "sellable_stock": 455
  }
]
```
`sellable_stock` = `physical_stock − reserved_stock − damaged_stock − expiry_stock`.

---

## 12. Purchases

### `POST /purchases`
**What it does:** Creates a draft purchase order to a supplier, with line items.

**Request**
```json
{
  "supplier_id": "uuid",
  "warehouse_id": "uuid",
  "purchase_date": "2026-07-19T00:00:00Z",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 200,
      "purchase_price": 28.00
    }
  ]
}
```

**Response**
```json
{
  "id": "uuid",
  "purchase_number": "PO-2026-00045",
  "status": "draft",
  "subtotal": 5600.00,
  "cgst": 504.00,
  "sgst": 504.00,
  "igst": 0.00,
  "round_off": 0.00,
  "total": 6608.00,
  "items": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "quantity": 200,
      "purchase_price": 28.00,
      "gst_rate": 18.00,
      "total": 6608.00
    }
  ],
  "created_at": "2026-07-19T11:55:00Z"
}
```

---

### `PATCH /purchases/{id}`
**What it does:** Edits a purchase that is still in `draft` status.

**Request:** Any subset of the `POST /purchases` fields.

**Response:** Updated purchase object.

---

### `POST /purchases/{id}/receive`
**What it does:** Marks a purchase as received and adds the stock into the warehouse. Automatically creates `purchase_in` inventory movements and updates the stock summary.

**Request**
```json
{
  "items": [
    { "item_id": "uuid", "received_qty": 200 }
  ]
}
```

**Response**
```json
{
  "id": "uuid",
  "status": "received",
  "movements_created": 1,
  "updated_at": "2026-07-19T12:00:00Z"
}
```

---

### `POST /purchases/{id}/cancel`
**What it does:** Cancels a draft purchase (cannot cancel once received).

**Request**
```json
{ "reason": "Supplier unable to fulfil" }
```

**Response**
```json
{ "id": "uuid", "status": "cancelled" }
```

---

## 13. Invoices

### `POST /orders/{id}/invoice`
**What it does:** Generates the invoice for an approved/loaded order. All totals and GST split are calculated server-side.

**Request:** No body required — invoice is generated from the order.

**Response**
```json
{
  "id": "uuid",
  "sales_order_id": "uuid",
  "invoice_number": "INV-2026-00098",
  "invoice_date": "2026-07-19T12:05:00Z",
  "place_of_supply": "Maharashtra",
  "subtotal": 4500.00,
  "discount": 0.00,
  "cgst": 405.00,
  "sgst": 405.00,
  "igst": 0.00,
  "round_off": 0.00,
  "total": 5310.00,
  "payment_status": "unpaid",
  "tally_sync_status": "pending"
}
```

---

### `POST /invoices/{id}/cancel`
**What it does:** Cancels an invoice, where business rules allow it.

**Request**
```json
{ "reason": "Order returned in full before delivery" }
```

**Response**
```json
{ "id": "uuid", "status": "cancelled", "updated_at": "2026-07-19T12:10:00Z" }
```

> Note: There is no API to directly edit invoice totals. Financial documents are always system-calculated.

---

## 14. Delivery / Driver

### `POST /deliveries`
**What it does:** Creates a delivery record for an invoice and assigns a vehicle/driver.

**Request**
```json
{
  "invoice_id": "uuid",
  "vehicle_id": "uuid",
  "driver_id": "uuid"
}
```

**Response**
```json
{
  "id": "uuid",
  "invoice_id": "uuid",
  "vehicle_id": "uuid",
  "driver_id": "uuid",
  "status": "pending"
}
```

---

### `POST /deliveries/{id}/start`
**What it does:** Marks the van as having left the warehouse for this delivery.

**Request:** No body, or optionally:
```json
{ "departure_time": "2026-07-19T09:00:00Z" }
```

**Response**
```json
{ "id": "uuid", "status": "out_for_delivery", "departure_time": "2026-07-19T09:00:00Z" }
```

---

### `POST /deliveries/{id}/arrive`
**What it does:** Marks that the driver has reached the customer's location.

**Request**
```json
{
  "latitude": 18.5204303,
  "longitude": 73.8567437
}
```

**Response**
```json
{
  "id": "uuid",
  "arrival_time": "2026-07-19T10:15:00Z",
  "latitude": 18.5204303,
  "longitude": 73.8567437
}
```

---

### `POST /deliveries/{id}/complete`
**What it does:** Completes the delivery. This single call saves GPS and time, records the payment collected, updates the invoice's payment status, and updates the order status — all together.

**Request**
```json
{
  "status": "delivered",
  "latitude": 18.5204303,
  "longitude": 73.8567437,
  "customer_signature": "deliveries/2026/signature-abc123.png",
  "remarks": "Delivered successfully",
  "cash_received": 5000.00,
  "upi_received": 2000.00
}
```
| Field | Required | Description |
|---|---|---|
| status | required | Usually `delivered` |
| latitude, longitude | required | GPS at the delivery point |
| customer_signature | optional | Path/URL of the uploaded signature image |
| remarks | optional | Delivery notes |
| cash_received, upi_received | optional | Amount collected, if any |

**Response**
```json
{
  "id": "uuid",
  "status": "delivered",
  "completion_time": "2026-07-19T10:30:00Z",
  "payment_id": "uuid",
  "invoice_payment_status": "paid"
}
```

---

### `POST /deliveries/{id}/fail`
**What it does:** Marks a delivery as unsuccessful.

**Request**
```json
{
  "reason": "Shop closed"
}
```

**Response**
```json
{ "id": "uuid", "status": "failed", "updated_at": "2026-07-19T10:35:00Z" }
```

---

## 15. Payments

### `POST /payments`
**What it does:** Records a payment against an invoice. An invoice can have several payments over time (partial payments).

**Request**
```json
{
  "invoice_id": "uuid",
  "driver_id": "uuid",
  "cash_amount": 3000.00,
  "upi_amount": 2000.00,
  "cheque_amount": 0.00,
  "reference_number": "UPI-REF-998877"
}
```
| Field | Required | Description |
|---|---|---|
| invoice_id | required | Invoice this payment is for |
| driver_id | optional | If collected by a driver in the field |
| cash_amount, upi_amount, cheque_amount | required | At least one must be greater than zero |
| reference_number | optional | UPI or cheque reference |

**Response**
```json
{
  "id": "uuid",
  "invoice_id": "uuid",
  "total_amount": 5000.00,
  "status": "pending",
  "created_at": "2026-07-19T12:15:00Z"
}
```
Note: `total_amount` is calculated by the server as the sum of `cash_amount + upi_amount + cheque_amount`. The frontend never sets `payment_status` on the invoice directly — the server recalculates it from all valid payments.

---

### `POST /payments/{id}/verify`
**What it does:** Cashier confirms a payment has been received/cleared (e.g. cheque cleared).

**Request:** No body required.

**Response**
```json
{ "id": "uuid", "status": "cleared", "updated_at": "2026-07-19T12:20:00Z" }
```

---

### `POST /payments/{id}/bounce`
**What it does:** Marks a payment (typically a cheque) as bounced/failed.

**Request**
```json
{ "reason": "Insufficient funds" }
```

**Response**
```json
{ "id": "uuid", "status": "bounced", "updated_at": "2026-07-19T12:25:00Z" }
```

---

## 16. Returns

### `POST /returns`
**What it does:** Creates a return request against an invoice, with line items.

**Request**
```json
{
  "invoice_id": "uuid",
  "warehouse_id": "uuid",
  "reason": "damaged",
  "remarks": "Box crushed during transit",
  "photo": "returns/2026/photo-xyz.jpg",
  "items": [
    { "product_id": "uuid", "quantity": 5, "reason": "Damaged packaging" }
  ]
}
```
| Field | Required | Description |
|---|---|---|
| invoice_id | required | Invoice the return relates to |
| warehouse_id | required | Where the returned goods will go |
| reason | required | One of: damaged, expired, wrong_item, not_needed |
| remarks | optional | Free-text notes |
| photo | optional | Path/URL to a photo of the goods |
| items | required | List of returned products, quantities, and per-item reason |

**Response**
```json
{
  "id": "uuid",
  "invoice_id": "uuid",
  "status": "requested",
  "items": [
    { "id": "uuid", "product_id": "uuid", "quantity": 5, "reason": "Damaged packaging" }
  ],
  "created_at": "2026-07-19T12:30:00Z"
}
```

---

### `POST /returns/{id}/approve`
**What it does:** Approves a return request.

**Request:** No body required.

**Response**
```json
{ "id": "uuid", "status": "approved", "updated_at": "2026-07-19T12:35:00Z" }
```

---

### `POST /returns/{id}/reject`
**What it does:** Rejects a return request.

**Request**
```json
{ "reason": "No proof of damage provided" }
```

**Response**
```json
{ "id": "uuid", "status": "rejected", "updated_at": "2026-07-19T12:40:00Z" }
```

---

### `POST /returns/{id}/complete`
**What it does:** Marks the return as received and updates stock. Based on each item's reason, stock is added back as good stock (`returned_in`), damaged stock (`damaged`), or expired stock (`expired`).

**Request:** No body required.

**Response**
```json
{
  "id": "uuid",
  "status": "completed",
  "movements_created": 1,
  "updated_at": "2026-07-19T12:45:00Z"
}
```

---

## 17. File Uploads

### `POST /files`
**What it does:** Uploads a file (image, signature, photo) to object storage and returns its path. Use this first, then pass the returned path into the relevant business API (e.g. `customer_signature`, `photo`, `image`).

**Request:** `multipart/form-data` with a single file field, e.g. `file`.

**Response**
```json
{
  "file_url": "deliveries/2026/abc123.jpg"
}
```

---

## 18. Tally Sync

### `POST /tally/sync/invoices`
**What it does:** Pushes all pending invoices to Tally.

**Request:** No body required.

**Response**
```json
{
  "synced_count": 12,
  "failed_count": 1
}
```

---

### `POST /tally/sync/payments`
**What it does:** Pushes all pending payment records to Tally.

**Request:** No body required.

**Response**
```json
{
  "synced_count": 8,
  "failed_count": 0
}
```

---

### `POST /tally/sync/returns`
**What it does:** Pushes all pending sales returns to Tally.

**Request:** No body required.

**Response**
```json
{
  "synced_count": 3,
  "failed_count": 0
}
```

---

### `POST /tally/retry/{entityType}/{id}`
**What it does:** Retries a single failed sync (for one invoice, payment, or return).

**Request:** No body. `entityType` in the URL is one of: `invoice`, `payment`, `return`.

**Response**
```json
{
  "id": "uuid",
  "entity_type": "invoice",
  "tally_sync_status": "synced"
}
```

---

## 19. Common Rules Across All APIs

- **The server always calculates**: prices from price lists, GST (CGST/SGST/IGST), discounts, totals, round-off, stock levels, and payment status. The frontend should never send these as trusted final values.
- **Stock changes only happen through named actions** (order approve/load, purchase receive, return complete, inventory adjustment/transfer) — never through a direct stock edit API.
- **Deletes are soft deletes.** A `DELETE` call sets `deleted_at`; the record is hidden from normal lists but not removed from the database.
- **Every write to a financial or stock table also creates an Audit Log entry** in the background — this is automatic and not something the frontend calls directly.
- **Files are uploaded separately** via `POST /files`, then their returned path is included in the relevant business API call — never send raw file bytes inside a JSON body.

---

*This document should be kept in sync with `apis_doc.md` and `database_schema_docs.markdown`. If a new API is added or a schema field changes, update all three together.*
