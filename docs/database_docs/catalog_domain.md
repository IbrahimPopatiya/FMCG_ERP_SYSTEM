Excellent. Now we're designing the **Catalog Domain**, and I think this is where we should make one of the biggest architectural improvements compared to most FMCG ERPs.

---

# Before Designing Tables

Most ERP systems have something like this:

```text
Category
Brand
Product
```

This works for a retail POS.

**It is not enough for an FMCG Distributor.**

Let's think about your client's business.

Example:

```
Coca Cola

↓

Coca Cola 250ml

↓

Glass Bottle

↓

24 Bottles / Crate

↓

MRP

↓

Distributor Price

↓

Retailer Price

↓

Special Customer Price

↓

Barcode

↓

GST

↓

HSN

↓

Current Stock
```

Notice something.

The customer never buys

> Coca Cola

He buys

> Coca Cola 250ml Glass Bottle 24 Bottles/Crate

That's the actual sellable product.

This means we need to separate

* Brand
* Product
* SKU

Most ERPs don't.

We should.

---

# CATALOG DOMAIN

## Domain Purpose

The Catalog Domain owns everything related to **sellable products**.

It answers:

* What products exist?
* Which category?
* Which brand?
* Which company?
* Which SKU?
* Which packing?
* Which unit?
* Which barcode?
* Which tax?
* Which images?
* Which prices?

It does **NOT** own:

* Stock
* Inventory
* Warehouse
* Orders
* Discounts
* Dispatch

---

# Responsibilities

```text
Catalog Domain
│
├── Category
├── Brand
├── Company
├── Product Master
├── Product SKU
├── Product Packing
├── Product Images
├── Product Pricing
├── Product Barcode
├── Product Tax
├── Product Attributes
└── Product Visibility
```

---

# Biggest Architectural Decision

Instead of

```text
Product
```

I propose

```text
Product

↓

SKU

↓

Price
```

Exactly like Amazon.

Example

```
Coca Cola
```

is Product.

```
250 ml

500 ml

1 L

2 L
```

are SKUs.

Later

```
24 Bottle Box

12 Bottle Box
```

becomes Packaging.

This architecture will never need redesign.

---

# Aggregate Root

```
Product
│
├── SKU
├── Images
├── Packing
├── Barcode
├── Prices
├── Tax
└── Attributes
```

---

# Tables

I recommend **13 tables**.

```
catalog_categories

catalog_brands

catalog_companies

catalog_products

catalog_product_skus

catalog_product_packings

catalog_product_prices

catalog_product_images

catalog_product_barcodes

catalog_product_taxes

catalog_product_attributes

catalog_product_attribute_values

catalog_product_visibility
```

---

# Domain Relationship

```
Company

↓

Brand

↓

Product

↓

SKU

↓

Packing

↓

Price

↓

Barcode
```

Notice

Everything flows from Product.

---

# TABLE 1

# catalog_categories

Purpose

Organize products.

Example

```
Beverages

Confectionery

Sweets

Biscuits

Namkeen

Bakery

Chocolate

General Merchandise
```

Fields

| Field              | Type      |
| ------------------ | --------- |
| id                 | UUID      |
| parent_category_id | UUID      |
| category_code      | VARCHAR   |
| name               | VARCHAR   |
| slug               | VARCHAR   |
| image_url          | TEXT      |
| display_order      | INTEGER   |
| active             | BOOLEAN   |
| created_at         | TIMESTAMP |
| updated_at         | TIMESTAMP |

Relationship

```
Category

↓

Many Products
```

Supports

Subcategories.

---

# TABLE 2

# catalog_companies

Purpose

Manufacturer.

Example

```
Parle

ITC

HUL

Coca Cola

PepsiCo
```

Fields

| Field          | Type    |
| -------------- | ------- |
| id             | UUID    |
| company_code   | VARCHAR |
| company_name   | VARCHAR |
| gst_number     | VARCHAR |
| contact_person | VARCHAR |
| mobile         | VARCHAR |
| email          | VARCHAR |
| website        | VARCHAR |
| logo           | TEXT    |
| active         | BOOLEAN |

---

# TABLE 3

# catalog_brands

Purpose

Brand belongs to Company.

Example

```
Company

↓

Coca Cola

↓

Brands

Coke

Sprite

Thums Up

Fanta
```

Fields

| Field       | Type    |
| ----------- | ------- |
| id          | UUID    |
| company_id  | UUID    |
| brand_code  | VARCHAR |
| brand_name  | VARCHAR |
| logo        | TEXT    |
| description | TEXT    |
| active      | BOOLEAN |

Relationship

```
Company

1

↓

Many Brands
```

---

# TABLE 4

# catalog_products

This is Product Master.

Not SKU.

Example

```
Coca Cola
```

Fields

| Field        | Type      |
| ------------ | --------- |
| id           | UUID      |
| product_code | VARCHAR   |
| company_id   | UUID      |
| brand_id     | UUID      |
| category_id  | UUID      |
| product_name | VARCHAR   |
| short_name   | VARCHAR   |
| description  | TEXT      |
| product_type | ENUM      |
| active       | BOOLEAN   |
| searchable   | BOOLEAN   |
| featured     | BOOLEAN   |
| new_arrival  | BOOLEAN   |
| bestseller   | BOOLEAN   |
| created_at   | TIMESTAMP |
| updated_at   | TIMESTAMP |

Relationship

```
Brand

↓

Many Products
```

---

# TABLE 5

# catalog_product_skus

This is the most important table.

Every sellable item.

Example

```
Product

Coca Cola

↓

SKU

250ml Bottle

↓

SKU

500ml Bottle

↓

SKU

2L Bottle
```

Fields

| Field          | Type    |
| -------------- | ------- |
| id             | UUID    |
| sku_code       | VARCHAR |
| product_id     | UUID    |
| sku_name       | VARCHAR |
| hsn_code       | VARCHAR |
| gst_percentage | DECIMAL |
| mrp            | DECIMAL |
| default_unit   | VARCHAR |
| weight         | DECIMAL |
| volume         | DECIMAL |
| barcode        | VARCHAR |
| active         | BOOLEAN |

Relationship

```
Product

↓

Many SKU
```

---

# TABLE 6

# catalog_product_packings

Client requirement

```
12 Bottle Box

24 Bottle Box

48 Pieces

10 Kg Bag
```

Packing is not SKU.

Packing changes.

Fields

| Field        | Type    |
| ------------ | ------- |
| id           | UUID    |
| sku_id       | UUID    |
| packing_name | VARCHAR |
| quantity     | DECIMAL |
| unit         | VARCHAR |
| display_text | VARCHAR |
| sort_order   | INTEGER |
| active       | BOOLEAN |

Example

```
Quantity

24

Unit

Bottle

Display

24 Bottles/Crate
```

---

# TABLE 7

# catalog_product_prices

One SKU

↓

Many Prices.

Example

```
MRP

Distributor

Retailer

Wholesale

Special

Festival
```

Fields

| Field          | Type    |
| -------------- | ------- |
| id             | UUID    |
| sku_id         | UUID    |
| price_list_id  | UUID    |
| selling_price  | DECIMAL |
| minimum_price  | DECIMAL |
| effective_from | DATE    |
| effective_to   | DATE    |
| active         | BOOLEAN |

Notice

We don't store one price.

We support

Unlimited Price Lists.

---

# TABLE 8

# catalog_product_images

Fields

| Field      | Type    |
| ---------- | ------- |
| id         | UUID    |
| sku_id     | UUID    |
| image_url  | TEXT    |
| is_primary | BOOLEAN |
| sort_order | INTEGER |

---

# TABLE 9

# catalog_product_barcodes

Why separate?

One SKU

may have

Multiple Barcodes.

Fields

| Field        | Type    |
| ------------ | ------- |
| id           | UUID    |
| sku_id       | UUID    |
| barcode      | VARCHAR |
| barcode_type | ENUM    |
| active       | BOOLEAN |

Future

QR

EAN13

UPC

---

# TABLE 10

# catalog_product_taxes

Purpose

GST may change.

Keep separate.

Fields

| Field          | Type    |
| -------------- | ------- |
| id             | UUID    |
| sku_id         | UUID    |
| gst            | DECIMAL |
| cess           | DECIMAL |
| effective_from | DATE    |
| effective_to   | DATE    |

---

# TABLE 11

# catalog_product_attributes

Generic attributes.

Example

```
Flavor

Color

Weight

Material

Size
```

Fields

| Field          | Type    |
| -------------- | ------- |
| id             | UUID    |
| attribute_name | VARCHAR |
| data_type      | ENUM    |

---

# TABLE 12

# catalog_product_attribute_values

Example

```
Flavor

↓

Orange

Cola

Mango
```

Fields

| Field        | Type    |
| ------------ | ------- |
| id           | UUID    |
| sku_id       | UUID    |
| attribute_id | UUID    |
| value        | VARCHAR |

---

# TABLE 13

# catalog_product_visibility

Purpose

Future Feature.

Hide products

for certain customers.

Fields

| Field       | Type    |
| ----------- | ------- |
| id          | UUID    |
| sku_id      | UUID    |
| customer_id | UUID    |
| visible     | BOOLEAN |

---

# ER Diagram

```text
                 CATALOG DOMAIN

Company
    │
    ▼
Brand
    │
    ▼
Category ─────────────┐
                      │
                      ▼
                 Product Master
                      │
                ┌─────┴──────┐
                ▼            ▼
             Product SKU   Images
                │
      ┌─────────┼─────────────┐
      ▼         ▼             ▼
 Packing     Prices      Barcodes
      │         │             │
      ▼         ▼             ▼
Attributes   Taxes      Visibility
```

---

# Relationships with Other Domains

```
CUSTOMER DOMAIN

Customer

↓

Price List

↓

Catalog Prices

────────────────────────

SALES DOMAIN

Order Item

↓

SKU

────────────────────────

WAREHOUSE DOMAIN

Dispatch Item

↓

SKU

────────────────────────

ACCOUNTING DOMAIN

Invoice Item

↓

SKU

────────────────────────

INVENTORY DOMAIN (Future)

Stock

↓

SKU

↓

Batch

────────────────────────

AI DOMAIN

Demand Forecast

↓

SKU
```

---

# Business Enums

### ProductType

```
FINISHED_GOOD

SERVICE

FREE_ITEM

SCHEME_ITEM
```

---

### BarcodeType

```
EAN13

UPC

QR

CUSTOM
```

---

### Unit

```
PCS

BOX

CARTON

BOTTLE

PACK

BAG

KG

GRAM

LITER

ML
```

---

# One architectural improvement after reviewing the whole project

This is probably the **most important improvement** we've made so far.

Earlier, we discussed keeping **stock** inside the Product/Catalog module. After analyzing your client's workflow with Tally, warehouse loading, and future ERP migration, I would **remove every stock-related field** from the Catalog Domain.

That means **no**:

* `available_stock`
* `reserved_stock`
* `warehouse_stock`
* `batch_number`
* `expiry_date`

inside any catalog table.

Instead:

* **Catalog Domain** answers: *"What is this product?"*
* **Inventory Domain** (Phase 2/3) answers: *"How much stock do we have?"*
* **Integration Domain** (Phase 1) answers: *"What stock snapshot came from Tally?"*

This separation is critical. It means the Product Master never changes because of stock movement, purchase, dispatch, or sales. Inventory becomes a completely independent domain, which is exactly what you'll want when you later replace Tally with your own inventory engine.
