# Manual Testing Guide — Full Order-to-Cash Flow

## How to use this guide

- Start the server: `cd backend && source venv/Scripts/activate && uvicorn main:app --reload`
- Open **`http://localhost:8000/docs`** — every step below is a real endpoint you can run there.
- Follow the steps **in order** — each one produces an `id` (or a token) that a later step needs. Copy every `id` into a scratch note as you go (a text file works fine); you'll paste it back in repeatedly.
- **Authenticating in `/docs`**: after logging in (step 2, 6, or 10), copy the `access_token` from the response, click the padlock icon (top right of the page, or next to each endpoint), and paste it in as `Bearer <token>`. Every call after that uses whoever you last logged in as — **switch logins when the guide tells you to switch role** (admin → salesman → customer → back to admin, etc.), or you'll get 401/403s that aren't bugs, just the wrong token.
- All request bodies below are copy-pasteable JSON — just swap the placeholder `<...>` values for real `id`s from earlier responses.
- Expected status codes are noted for every call — if you get something else, that's the thing to investigate.

---

## Part 1 — Setup (as Admin)

### 1.1 Create the admin user
`POST /api/v1/users`
```json
{
  "full_name": "Admin User",
  "mobile": "9000000001",
  "email": "admin@test.com",
  "password": "admin12345",
  "role": "admin"
}
```
Expect **201**. Note the `id`.

### 1.2 Log in as admin
`POST /api/v1/auth/login`
```json
{ "identifier": "admin@test.com", "password": "admin12345" }
```
Expect **200**, `principal_type: "user"`. Copy `access_token` → authorize in `/docs` with it. **Stay logged in as admin for the rest of Part 1.**

### 1.3 Create a warehouse
`POST /api/v1/warehouses`
```json
{ "name": "Main Warehouse", "address": "Plot 1, MIDC", "state": "Maharashtra" }
```
Expect **201**. Note the `id` → `<warehouse_id>`.

### 1.4 Create a category and brand (optional but realistic)
`POST /api/v1/categories`
```json
{ "name": "Beverages" }
```
`POST /api/v1/brands`
```json
{ "name": "Coca-Cola" }
```
Expect **201** each. Note both `id`s (optional to use later — products can be created without them).

### 1.5 Create two products
`POST /api/v1/products`
```json
{
  "sku": "SKU-COKE-500",
  "barcode": "8901234567890",
  "name": "Coca-Cola 500ml",
  "unit": "bottle",
  "packing": "12 x 500ml",
  "mrp": 40.00,
  "selling_price": 35.00,
  "gst_rate": 18.00,
  "minimum_stock": 50
}
```
Repeat with a second product (different `sku`/`barcode`):
```json
{
  "sku": "SKU-SPRITE-500",
  "barcode": "8901234567891",
  "name": "Sprite 500ml",
  "unit": "bottle",
  "packing": "12 x 500ml",
  "mrp": 40.00,
  "selling_price": 30.00,
  "gst_rate": 18.00,
  "minimum_stock": 50
}
```
Expect **201** each. Note both `id`s → `<product_a_id>` (Coke), `<product_b_id>` (Sprite).

### 1.6 Create a price list with a discount on product A
`POST /api/v1/price-lists`
```json
{ "name": "Wholesale Tier 1" }
```
Expect **201**. Note `id` → `<price_list_id>`.

`POST /api/v1/price-lists/{price_list_id}/items`
```json
{ "product_id": "<product_a_id>", "discount_percent": 10 }
```
Expect **201**. This means product A costs `selling_price - 10%` for any customer on this price list; product B stays full price (no discount row for it).

### 1.7 Create a salesman
`POST /api/v1/users`
```json
{
  "full_name": "Salesman One",
  "mobile": "9000000002",
  "email": "salesman1@test.com",
  "password": "sales12345",
  "role": "salesman"
}
```
Expect **201**. Note `id` → `<salesman_id>`.

### 1.8 Create a driver
`POST /api/v1/users`
```json
{
  "full_name": "Driver One",
  "mobile": "9000000003",
  "email": "driver1@test.com",
  "password": "driver12345",
  "role": "driver"
}
```
Expect **201**. Note `id` → `<driver_id>`.

### 1.9 Create a route, assign the salesman
`POST /api/v1/routes`
```json
{ "name": "Route A", "salesman_id": "<salesman_id>" }
```
Expect **201**. Note `id` → `<route_id>`.

### 1.10 Create a customer on that route, with the discounted price list
`POST /api/v1/customers`
```json
{
  "customer_code": "CUST-001",
  "business_name": "Sharma General Store",
  "owner_name": "Anil Sharma",
  "mobile": "9876500001",
  "address": "Shop 12, Market Road",
  "city": "Pune",
  "state": "Maharashtra",
  "pincode": "411001",
  "credit_limit": 50000.00,
  "payment_terms": 15,
  "route_id": "<route_id>",
  "price_list_id": "<price_list_id>",
  "password": "customer12345"
}
```
Expect **201**. Note `id` → `<customer_id>`. Every customer gets portal login enabled by default — that password is real.

### 1.11 Put stock into the warehouse (so orders can later be loaded)
`POST /api/v1/inventory/adjustments`
```json
{
  "warehouse_id": "<warehouse_id>",
  "product_id": "<product_a_id>",
  "quantity": 100,
  "reason": "Initial stock load"
}
```
Repeat for product B:
```json
{
  "warehouse_id": "<warehouse_id>",
  "product_id": "<product_b_id>",
  "quantity": 100,
  "reason": "Initial stock load"
}
```
Expect **201** each. Check `GET /api/v1/inventory?warehouse_id=<warehouse_id>` — both products should show `physical_stock: 100`.

---

## Part 2 — Catalog check (both roles, quick contrast)

### 2.1 As admin, browse the catalog
`GET /api/v1/products` (still logged in as admin)
Expect **200**, product A's `effective_price` = `35.00` (full price — staff sees base price).

### 2.2 Log in as the customer
`POST /api/v1/auth/login`
```json
{ "identifier": "9876500001", "password": "customer12345" }
```
Expect **200**, `principal_type: "customer"`. Authorize `/docs` with this token. **Stay logged in as customer.**

### 2.3 As customer, browse the catalog
`GET /api/v1/products`
Expect **200**, product A's `effective_price` = `31.50` (35.00 − 10%). Product B stays `30.00` (no discount). This confirms price-list discounting is working per-customer.

---

## Part 3 — Customer places their own order

### 3.1 Place an order (no `customer_id` needed — comes from your token)
`POST /api/v1/orders`
```json
{
  "remarks": "Please deliver in the evening",
  "items": [
    { "product_id": "<product_a_id>", "ordered_qty": 2 },
    { "product_id": "<product_b_id>", "ordered_qty": 1 }
  ]
}
```
Expect **201**. Check the response: `order_source: "customer"`, `salesman_id: null`, `status: "pending"`. Note `id` → `<customer_order_id>`, and each line's `id` → `<co_item_a_id>`, `<co_item_b_id>`.

### 3.2 Edit your own pending order
`PATCH /api/v1/orders/{customer_order_id}`
```json
{ "remarks": "Actually, deliver in the morning" }
```
Expect **200**.

### 3.3 Try to view another customer's order (should fail cleanly)
`GET /api/v1/orders/<any-random-uuid>` → expect **404** (never 403 — the system doesn't reveal whether an order exists if it isn't yours).

### 3.4 Cancel this order (so it doesn't interfere with Part 4 — or skip cancelling if you'd rather carry it forward)
`POST /api/v1/orders/{customer_order_id}/cancel` → expect **200**, `status: "cancelled"`.

---

## Part 4 — Salesman places an order on the customer's behalf

### 4.1 Log in as the salesman
`POST /api/v1/auth/login`
```json
{ "identifier": "salesman1@test.com", "password": "sales12345" }
```
Authorize `/docs` with this token. **Stay logged in as salesman.**

### 4.2 Create an order for the customer
`POST /api/v1/orders`
```json
{
  "customer_id": "<customer_id>",
  "items": [
    { "product_id": "<product_a_id>", "ordered_qty": 5 },
    { "product_id": "<product_b_id>", "ordered_qty": 3 }
  ]
}
```
Expect **201**. Response: `order_source: "salesman"`, `salesman_id` = your id, `status: "pending"`. Check `cgst`/`sgst` are non-zero and `igst` is `0` (same-state — Maharashtra warehouse, Maharashtra customer). Note `id` → `<order_id>`, item ids → `<item_a_id>`, `<item_b_id>`.

### 4.3 Negative test — try creating an order for a customer NOT on your route
First (as admin) create a second customer with no `route_id`, then (as salesman) try:
`POST /api/v1/orders`
```json
{ "customer_id": "<other_customer_id>", "items": [{ "product_id": "<product_a_id>", "ordered_qty": 1 }] }
```
Expect **403** — proves route-based authorization is enforced.

---

## Part 5 — Approve and load the order (as Admin, uses Amin's Inventory)

### 5.1 Log back in as admin (§1.2), authorize `/docs`.

### 5.2 Approve the order
`POST /api/v1/orders/{order_id}/approve`
```json
{
  "items": [
    { "item_id": "<item_a_id>", "approved_qty": 5 },
    { "item_id": "<item_b_id>", "approved_qty": 3 }
  ]
}
```
Expect **200**, `status: "approved"`. Check `GET /api/v1/inventory?warehouse_id=<warehouse_id>&product_id=<product_a_id>` — `reserved_stock` should now be `5`.

### 5.3 Load the order
`POST /api/v1/orders/{order_id}/load`
```json
{
  "items": [
    { "item_id": "<item_a_id>", "loaded_qty": 5 },
    { "item_id": "<item_b_id>", "loaded_qty": 3 }
  ]
}
```
Expect **200**, `status: "loaded"`. Check inventory again — `physical_stock` for product A dropped from `100` to `95`, `reserved_stock` back to `0`.

---

## Part 6 — Generate the invoice

`POST /api/v1/orders/{order_id}/invoice`
No body needed. Expect **201**. Response includes `invoice_number`, `place_of_supply: "Maharashtra"`, totals matching the order, `payment_status: "unpaid"`, `tally_sync_status: "pending"`. Note `id` → `<invoice_id>`.

Negative test: call it again → expect **409** (one invoice per order).

---

## Part 7 — Delivery (as Admin or Driver — any staff token works today)

### 7.1 Create the delivery
`POST /api/v1/deliveries`
```json
{ "invoice_id": "<invoice_id>", "vehicle_id": null, "driver_id": "<driver_id>" }
```
Expect **201**, `status: "pending"`. Note `id` → `<delivery_id>`.

### 7.2 Start it
`POST /api/v1/deliveries/{delivery_id}/start`
```json
{}
```
Expect **200**, `status: "out_for_delivery"`.

### 7.3 Mark arrival
`POST /api/v1/deliveries/{delivery_id}/arrive`
```json
{ "latitude": 18.5204303, "longitude": 73.8567437 }
```
Expect **200**, `arrival_time` populated.

### 7.4 Complete it — collect partial cash on the spot
Work out the invoice total first (`GET /api/v1/invoices` isn't built as a list endpoint — use the number from step 6's response, e.g. if total was `495.00`, collect less than that to see a `partial` status):
`POST /api/v1/deliveries/{delivery_id}/complete`
```json
{
  "status": "delivered",
  "latitude": 18.5204303,
  "longitude": 73.8567437,
  "remarks": "Delivered successfully",
  "cash_received": 200.00,
  "upi_received": 0
}
```
Expect **200**. Response includes `payment_id` and `invoice_payment_status`. If you collected less than the full total, expect `"partial"`. Note `payment_id` → `<delivery_payment_id>`.

Check `GET /api/v1/orders/{order_id}` (as the salesman who owns the route, or 404 if you're on the wrong token) — `status` should now be `"delivered"`.

---

## Part 8 — Payments (collecting the rest, standalone)

### 8.1 Record the remaining payment (e.g. a cheque for the balance)
`POST /api/v1/payments`
```json
{
  "invoice_id": "<invoice_id>",
  "cheque_amount": 295.00,
  "reference_number": "CHQ-00123"
}
```
Expect **201**, `status: "pending"`. Note `id` → `<payment_id>`.

### 8.2 Verify it (cashier confirms the cheque cleared)
`POST /api/v1/payments/{payment_id}/verify`
Expect **200**, `status: "cleared"`. Check the invoice's `payment_status` is now `"paid"` (query it indirectly — generate a fresh invoice elsewhere, or check via `db`/logs; there's no `GET /invoices/{id}` list endpoint built yet, worth noting as a gap).

### 8.3 Negative test — bounce scenario (use a fresh payment)
`POST /api/v1/payments` with a small cheque amount again → then:
`POST /api/v1/payments/{new_payment_id}/bounce`
```json
{ "reason": "Insufficient funds" }
```
Expect **200**, `status: "bounced"`.

---

## Part 9 — Returns and Credit Notes

### 9.1 Create a return with mixed reasons (realistic — customer returns 1 damaged, 1 just doesn't want)
`POST /api/v1/returns`
```json
{
  "invoice_id": "<invoice_id>",
  "warehouse_id": "<warehouse_id>",
  "reason": "damaged",
  "remarks": "Customer reported issues on delivery",
  "items": [
    { "product_id": "<product_a_id>", "quantity": 1, "reason": "damaged" },
    { "product_id": "<product_b_id>", "quantity": 1, "reason": "not_needed" }
  ]
}
```
Expect **201**, `status: "requested"`. Note `id` → `<return_id>`.

### 9.2 Approve it
`POST /api/v1/returns/{return_id}/approve` → expect **200**, `status: "approved"`.

### 9.3 Complete it
`POST /api/v1/returns/{return_id}/complete`
Expect **200**, `movements_created: 2`. Note `credit_note_id`.

Check inventory: product A's `damaged_stock` went up by 1; product B's `physical_stock` went up by 1 (it came back sellable). Different buckets — this is the mixed-reason behavior working correctly.

### 9.4 Approve the credit note (as the route salesman)
Log back in as the salesman (§4.1). `POST /api/v1/credit-notes/{credit_note_id}/approve` → expect **200**, `status: "approved"`.

### 9.5 Negative test — a different salesman can't approve it
As admin, create a second salesman (a different `mobile`/`email`, `role: "salesman"`) who is **not** assigned to `<route_id>`. Repeat steps 9.1–9.3 once more (a fresh return, approve, complete) to get a second `credit_note_id` still tied to the same customer/route. Log in as this *second, unrelated* salesman and call `POST /api/v1/credit-notes/{new_credit_note_id}/approve` → expect **403**. Then log back in as admin and call the same endpoint → expect **200** (admin override works, proving the check is "route salesman OR admin," not "route salesman only").

### 9.6 Rejection path (alternate scenario, use a fresh return)
Repeat 9.1–9.2 with a new return, then:
`POST /api/v1/returns/{new_return_id}/reject`
```json
{ "reason": "No proof of damage provided" }
```
Expect **200**, `status: "rejected"` — and note you can't `/complete` a rejected return (try it → expect **409**).

---

## Part 10 — File uploads (any logged-in role)

`POST /api/v1/files` — this one isn't JSON, it's `multipart/form-data`. In `/docs`, the request body will show a file picker and a `category` text field.
- `file`: pick any small image/PDF from your machine
- `category`: `deliveries`

Expect **201**, response `{ "file_url": "deliveries/2026/<random>.jpg" }`. Check the file actually landed at `backend/uploads/deliveries/2026/...` on disk.

---

## Part 11 — Negative/security checklist (run these anywhere, they should all fail the same way every time)

| Scenario | How to trigger | Expected |
|---|---|---|
| No token at all | Remove the Authorization header, call any protected endpoint | `401` or `403` |
| Customer token on a staff-only endpoint | While logged in as customer, call `POST /orders/{id}/approve` | `403` |
| Wrong/expired token | Paste garbage into the Authorization header | `401` |
| Missing required field | `POST /customers` with an empty body | `422` |
| Duplicate unique field | `POST /products` twice with the same `sku` | `409` |
| Acting on a nonexistent id | `GET`/`PATCH`/`POST` any endpoint with a random UUID | `404` |
| Wrong-state action | `POST /orders/{id}/load` on a still-`pending` order | `409` |
| Customer trying another customer's order | `GET /orders/{id}` for an order that isn't yours | `404` (not 403 — no existence leak) |

---

## What this guide does **not** cover (known gaps, not bugs)

- `POST /auth/logout` — not built yet (client-side token discard is the current behavior).
- `GET /invoices/{id}`, `GET /invoices` — no dedicated invoice read/list endpoint exists yet; you can only see invoice data from the `POST /orders/{id}/invoice` response at creation time.
- Any endpoint to see a customer's total approved credit balance — credit notes are stored (§9) but there's no "sum my credits" endpoint yet.
- Amin's **Tally Sync** domain — not built.
- Detailed delivery outcomes (`partial`/`customer_closed`/`customer_refused`) — `/complete` only supports a clean `"delivered"` outcome today; use `/fail` for a failed delivery instead.
