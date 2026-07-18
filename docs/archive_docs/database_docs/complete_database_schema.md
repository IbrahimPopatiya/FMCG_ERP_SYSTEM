# FMCG ERP — Complete Database Schema (Phase 1)

## How to Read This Document

This is the single source of truth for the Phase 1 database. It consolidates everything decided across every planning chat (roadmap, business objects, lifecycle, aggregate boundaries, business rules, commands/events, state machines) into one implementable schema.

Guiding rules carried into every table below:

- **Objects are never overwritten into the next stage — they create the next object.** Order → Dispatch → Invoice → Delivery → Payment are separate aggregates, each with its own table family, linked by foreign keys, never merged.
- **Tally remains the source of truth for Phase 1** for Inventory, Ledger, GST, and Invoice numbering. Our tables that touch these areas are explicitly **snapshots/references**, refreshed by the Integration Domain — never edited by users directly.
- **The ERP is a Decision Support System, not a Decision-Making System.** Credit limits, stock shortages, etc. produce `alert_*` rows, not blocked transactions.
- **Every mutable business action is a Command → Event.** Tables that represent a lifecycle include a `status` enum plus a companion `*_history` or `*_timeline` table so state transitions are never lost.
- **Standard audit columns** (`created_at`, `updated_at`, `created_by`, `updated_by`) are implied on every table unless noted otherwise, even where not repeated in the field list, to save space. `created_by` / `updated_by` are FKs to `auth_users.id` unless stated.
- **UUID primary keys** everywhere for merge-safety across offline-first mobile clients.
- Soft-delete via `status`/`active` flags, not row deletion, for anything customer- or finance-adjacent.

## Domain Map (13 Domains)

```
1. Auth            – identity, roles, permissions, sessions
2. Customer        – business identity of buyers
3. Catalog         – products, SKUs, pricing
4. Sales           – Order aggregate (demand capture)
5. Planning        – Trip, Vehicle, Route, Driver assignment
6. Warehouse       – Dispatch aggregate (loading)
7. Accounting      – Invoice reference, ledger/GST snapshot (Tally-owned)
8. Delivery        – physical handover, POD
9. Payment         – collection & settlement
10. Notification   – outbound messaging
11. Audit          – system-wide audit trail
12. Integration    – Tally sync (XML/ODBC), queues, mapping
13. Alert          – business alerts (advisory layer)
```

Business-object flow that these domains implement:

```
Customer ──▶ Order ──▶ Approval ──▶ DispatchPlan(Trip) ──▶ Dispatch ──▶ Invoice(Tally) ──▶ Delivery ──▶ Payment
```

Each arrow is an **event boundary** — the next table family is *created*, never a mutation of the previous one.

---

# 1. AUTH DOMAIN

## Purpose
Identity, authentication, authorization for **internal users only** (Admin, Salesman, Warehouse, Accountant, Driver, Cashier, Purchase Manager). Customers are **not** here — see Customer Domain.

## Aggregate Root
`auth_users`

## Tables (10)
```
auth_users
auth_roles
auth_permissions
auth_role_permissions
auth_user_roles
auth_sessions
auth_devices
auth_otps
auth_refresh_tokens
auth_login_history
```

### auth_users
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| employee_code | VARCHAR(30) | UNIQUE |
| first_name | VARCHAR(100) | |
| last_name | VARCHAR(100) | |
| full_name | VARCHAR(200) | |
| mobile | VARCHAR(20) | UNIQUE, login identifier |
| email | VARCHAR(150) | optional |
| password_hash | TEXT | future password login |
| profile_photo | TEXT | URL |
| status | ENUM UserStatus | ACTIVE/INACTIVE/SUSPENDED/LOCKED |
| last_login_at | TIMESTAMP | |
| failed_login_count | INTEGER | |
| otp_enabled | BOOLEAN | |
| two_factor_enabled | BOOLEAN | future |
| branch_id | UUID | future multi-branch |
| company_id | UUID | future multi-company |
| timezone | VARCHAR | |
| language | VARCHAR | |

Indexes: `mobile` UNIQUE, `employee_code` UNIQUE, `status`, `company_id`

### auth_roles
| Field | Type |
|---|---|
| id | UUID PK |
| code | VARCHAR(50) UNIQUE |
| name | VARCHAR(100) |
| description | TEXT |
| is_system | BOOLEAN |
| status | ENUM |

Example rows: `ADMIN`, `SALESMAN`, `WAREHOUSE_SUPERVISOR`, `LOADER`, `ACCOUNTANT`, `DRIVER`, `CASHIER`, `PURCHASE_MANAGER`.

### auth_permissions
| Field | Type |
|---|---|
| id | UUID PK |
| module | VARCHAR |
| action | VARCHAR |
| permission_key | VARCHAR UNIQUE |
| description | TEXT |

Granular, e.g. `order.create`, `order.approve`, `dispatch.edit`, `invoice.generate`, `customer.edit`.

### auth_role_permissions
`role_id` FK, `permission_id` FK. Unique(`role_id`,`permission_id`).

### auth_user_roles
`user_id` FK, `role_id` FK, `assigned_by` FK auth_users, `assigned_at`. Supports multiple roles per user.

### auth_sessions
| Field | Type |
|---|---|
| id | UUID PK |
| user_id | UUID FK auth_users |
| device_id | UUID FK auth_devices |
| ip_address | VARCHAR |
| login_time / logout_time / expires_at | TIMESTAMP |
| status | ENUM SessionStatus |

### auth_devices
| Field | Type |
|---|---|
| id | UUID PK |
| user_id | UUID FK |
| device_uuid | VARCHAR |
| device_name / os / app_version | VARCHAR |
| firebase_token | TEXT |
| last_seen | TIMESTAMP |
| is_trusted | BOOLEAN |

### auth_otps
| Field | Type |
|---|---|
| id | UUID PK |
| mobile | VARCHAR |
| otp_code | VARCHAR |
| purpose | ENUM (LOGIN, PASSWORD_RESET, MOBILE_CHANGE) |
| expires_at / verified_at | TIMESTAMP |
| attempts | INTEGER |
| status | ENUM OTPStatus |

### auth_refresh_tokens
`user_id` FK, `session_id` FK, `token_hash` TEXT (never store raw), `expires_at`, `revoked_at`.

### auth_login_history
`user_id` FK, `device_id` FK, `ip_address`, `login_time`, `logout_time`, `login_result` ENUM(SUCCESS/FAILED/LOCKED/OTP_FAILED), `reason`.

### Relationships
```
auth_users 1─▶N auth_user_roles N─▶1 auth_roles 1─▶N auth_role_permissions N─▶1 auth_permissions
auth_users 1─▶N auth_sessions N─▶1 auth_devices
auth_sessions 1─▶N auth_refresh_tokens
auth_users 1─▶N auth_login_history
```
Every other domain's `created_by`/`updated_by`/`*_by` columns FK into `auth_users.id`.

### Enums
`UserStatus{ACTIVE,INACTIVE,SUSPENDED,LOCKED}` · `SessionStatus{ACTIVE,EXPIRED,LOGGED_OUT,REVOKED}` · `OTPStatus{PENDING,VERIFIED,EXPIRED,FAILED}`

---

# 2. CUSTOMER DOMAIN

## Purpose
Business identity of every customer: profile, login, addresses, contacts, salesman/route/price-list assignment, and **read-only snapshots** of ledger/credit (owned by Accounting, synced by Integration).

## Aggregate Root
`customer_customers`

## Tables (12)
```
customer_customers
customer_auth
customer_addresses
customer_contacts
customer_salesmen
customer_routes
customer_price_lists
customer_credit_snapshot
customer_ledger_mapping
customer_documents
customer_settings
customer_activity
```

### customer_customers
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| customer_code | VARCHAR(30) UNIQUE | internal ERP code |
| tally_ledger_name | VARCHAR(255) | |
| business_name | VARCHAR(255) | |
| owner_name | VARCHAR(150) | |
| gst_number | VARCHAR(20) UNIQUE | |
| pan_number | VARCHAR(20) | |
| mobile | VARCHAR(20) UNIQUE | |
| alternate_mobile | VARCHAR(20) | |
| email | VARCHAR(150) | |
| business_type | ENUM BusinessType | |
| customer_category | ENUM CustomerCategory | A/B/C/VIP |
| status | ENUM CustomerStatus | |
| onboarding_date | DATE | |
| preferred_language | VARCHAR(20) | |
| notes | TEXT | |

### customer_auth
`customer_id` FK (1:1), `mobile`, `otp_verified` BOOLEAN, `last_login`, `login_attempts`, `account_status` ENUM, `firebase_token`, `device_id`.

### customer_addresses
`customer_id` FK, `address_type` ENUM(BILLING/SHIPPING/SHOP/WAREHOUSE), `address_line1/2`, `landmark`, `city`, `district`, `state`, `country`, `pincode`, `latitude`, `longitude`, `is_default`.

### customer_contacts
`customer_id` FK, `name`, `designation`, `mobile`, `email`, `whatsapp`, `is_primary`.

### customer_salesmen
`customer_id` FK, `salesman_user_id` FK auth_users, `assigned_date`, `is_primary`, `active`. Many-to-many mapping (supports shared customers).

### customer_routes
`customer_id` FK, `route_id` FK `planning_routes` (route master lives in Planning Domain), `sequence`, `delivery_day` ENUM, `visit_frequency` ENUM, `active`.

### customer_price_lists
`customer_id` FK, `price_list_id` FK `catalog_price_lists`, `effective_from`, `effective_to`, `active`.

### customer_credit_snapshot  *(read model — synced from Accounting/Integration, never user-edited)*
`customer_id` FK, `outstanding_amount`, `credit_limit`, `available_credit`, `overdue_amount` DECIMAL, `last_sync` TIMESTAMP.

### customer_ledger_mapping  *(bridge to Tally)*
`customer_id` FK, `tally_guid`, `ledger_name`, `ledger_code`, `sync_status` ENUM, `last_sync`.

### customer_documents
`customer_id` FK, `document_type` ENUM(GST/PAN/SHOP_LICENSE/AADHAR/PHOTO), `file_url`, `uploaded_by` FK auth_users, `uploaded_at`.

### customer_settings
`customer_id` FK, `notification_enabled`, `whatsapp_enabled`, `sms_enabled`, `push_enabled` BOOLEAN, `app_language`, `theme`.

### customer_activity
`customer_id` FK, `activity_type` ENUM, `description` TEXT, `activity_date`, `performed_by` FK auth_users.

### Relationships
```
customer_customers 1─▶1 customer_auth
customer_customers 1─▶N (addresses, contacts, documents, activity)
customer_customers 1─▶N customer_salesmen N─▶1 auth_users
customer_customers 1─▶N customer_routes N─▶1 planning_routes
customer_customers 1─▶N customer_price_lists N─▶1 catalog_price_lists
customer_customers 1─▶1 customer_credit_snapshot
customer_customers 1─▶1 customer_ledger_mapping
```
Cross-domain: `sales_orders.customer_id`, `delivery_deliveries.customer_id`, `payment_payments.customer_id` all FK here.

### Enums
`CustomerStatus{ACTIVE,INACTIVE,BLOCKED,SUSPENDED}` · `BusinessType{RETAILER,WHOLESALER,DISTRIBUTOR,MODERN_TRADE,INSTITUTION}` · `CustomerCategory{A,B,C,VIP}` · `AddressType{BILLING,SHIPPING,SHOP,WAREHOUSE}` · `DocumentType{GST,PAN,SHOP_LICENSE,AADHAR,PHOTO}`

---

# 3. CATALOG DOMAIN

## Purpose
Everything about **sellable products**: Company → Brand → Product → SKU → Packing → Price → Barcode → Tax → Attributes. Owns nothing about stock (that's a future Inventory Domain) or orders.

## Aggregate Root
`catalog_products` (with `catalog_product_skus` as the actual sellable unit)

## Tables (13)
```
catalog_categories
catalog_companies
catalog_brands
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
Also included in this domain for FK completeness: `catalog_price_lists` (referenced by `customer_price_lists` and `catalog_product_prices`).

### catalog_categories
`id`, `parent_category_id` (self FK, subcategories), `category_code`, `name`, `slug`, `image_url`, `display_order`, `active`.

### catalog_companies
`id`, `company_code`, `company_name`, `gst_number`, `contact_person`, `mobile`, `email`, `website`, `logo`, `active`.

### catalog_brands
`id`, `company_id` FK, `brand_code`, `brand_name`, `logo`, `description`, `active`.

### catalog_products
`id`, `product_code`, `company_id` FK, `brand_id` FK, `category_id` FK, `product_name`, `short_name`, `description`, `product_type` ENUM, `active`, `searchable`, `featured`, `new_arrival`, `bestseller`.

### catalog_product_skus  *(the actual sellable item)*
`id`, `sku_code`, `product_id` FK, `sku_name`, `hsn_code`, `gst_percentage`, `mrp`, `default_unit` ENUM Unit, `weight`, `volume`, `barcode`, `active`.

### catalog_product_packings
`id`, `sku_id` FK, `packing_name`, `quantity`, `unit`, `display_text`, `sort_order`, `active`. e.g. "24 Bottles/Crate".

### catalog_price_lists  *(master, referenced by customer & pricing)*
`id`, `price_list_code`, `price_list_name`, `description`, `active`.

### catalog_product_prices
`id`, `sku_id` FK, `price_list_id` FK `catalog_price_lists`, `selling_price`, `minimum_price` DECIMAL, `effective_from`, `effective_to`, `active`.

### catalog_product_images
`id`, `sku_id` FK, `image_url`, `is_primary`, `sort_order`.

### catalog_product_barcodes
`id`, `sku_id` FK, `barcode`, `barcode_type` ENUM(EAN13/UPC/QR/CUSTOM), `active`.

### catalog_product_taxes
`id`, `sku_id` FK, `gst`, `cess` DECIMAL, `effective_from`, `effective_to`.

### catalog_product_attributes
`id`, `attribute_name`, `data_type` ENUM.

### catalog_product_attribute_values
`id`, `sku_id` FK, `attribute_id` FK, `value`.

### catalog_product_visibility
`id`, `sku_id` FK, `customer_id` FK `customer_customers`, `visible` BOOLEAN. (Future per-customer catalog restriction.)

### Relationships
```
catalog_companies 1─▶N catalog_brands 1─▶N catalog_products 1─▶N catalog_product_skus
catalog_product_skus 1─▶N (packings, prices, images, barcodes, taxes, attribute_values, visibility)
catalog_price_lists 1─▶N catalog_product_prices
catalog_price_lists 1─▶N customer_price_lists   (cross-domain)
```
Cross-domain: `sales_order_items.sku_id`, `warehouse_dispatch_items.sku_id`, `accounting_invoice_items.sku_id` all FK `catalog_product_skus.id`.

### Enums
`ProductType{FINISHED_GOOD,SERVICE,FREE_ITEM,SCHEME_ITEM}` · `BarcodeType{EAN13,UPC,QR,CUSTOM}` · `Unit{PCS,BOX,CARTON,BOTTLE,PACK,BAG,KG,GRAM,LITER,ML}`

---

# 4. SALES DOMAIN (Order Aggregate)

## Purpose
Captures **customer demand** and its lifecycle up to approval. Owns Order, Order Items, Order Revisions/Changes, Approval. Knows nothing about Vehicle, Loading, Invoice, Driver — those belong to Planning/Warehouse/Accounting/Delivery.

Per the business-rules chat: an order **can** be edited after approval (business reality), but never by direct mutation — every edit creates an immutable **Order Change** record and bumps a **revision number**. Locking happens at `Loading Started`, not at `Approved`.

## Aggregate Root
`sales_orders`

## Tables (7)
```
sales_orders
sales_order_items
sales_order_revisions
sales_order_changes
sales_order_change_items
sales_approvals
sales_order_timeline
```

### sales_orders
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| order_number | VARCHAR(30) UNIQUE | human-readable, e.g. ORD-2026-1001 |
| customer_id | UUID FK customer_customers | |
| salesman_user_id | UUID FK auth_users | nullable — who it's assigned to |
| order_source | ENUM OrderSource | CUSTOMER_APP / SALESMAN_APP |
| created_by_user_id | UUID FK auth_users | nullable if customer-created |
| created_by_customer_id | UUID FK customer_customers | nullable if salesman-created |
| status | ENUM OrderStatus | see state machine below |
| current_revision | INTEGER | points to active `sales_order_revisions.revision_number` |
| requested_delivery_date | DATE | |
| priority | ENUM Priority | NORMAL/HIGH/URGENT |
| remarks | TEXT | |
| credit_check_status | ENUM (OK/WARNING) | advisory only, never blocks |
| locked_at | TIMESTAMP | set when Loading Started |

State machine (`OrderStatus`): `DRAFT → SUBMITTED → PENDING_APPROVAL → APPROVED → TRIP_ASSIGNED → LOADING_STARTED → LOADING_COMPLETED → INVOICED → DELIVERED → COMPLETED`, with `CANCELLED`/`REJECTED` side branches.

### sales_order_items
`id`, `order_id` FK, `sku_id` FK catalog_product_skus, `ordered_qty` DECIMAL, `unit`, `rate`, `discount_percentage`, `discount_amount`, `gst_percentage`, `scheme_code`, `remarks`, `revision_number` (which revision this row belongs to).

### sales_order_revisions
`id`, `order_id` FK, `revision_number` INTEGER, `is_active` BOOLEAN, `created_reason` ENUM(INITIAL, CUSTOMER_REQUEST, SALES_SUGGESTION, PROMOTION, STOCK_ISSUE, MANUAL_CORRECTION), `created_by`, `created_at`. One immutable snapshot per version — never delete old revisions.

### sales_order_changes  *(the "Order Change" object from the business-rules chat)*
| Field | Type |
|---|---|
| id | UUID PK |
| order_id | UUID FK |
| requested_by_type | ENUM(CUSTOMER, SALESMAN, ADMIN, WAREHOUSE) |
| requested_by_id | UUID | polymorphic — auth_users.id or customer_customers.id |
| reason | ENUM(CUSTOMER_REQUEST, SALES_SUGGESTION, PROMOTION, STOCK_ISSUE, MANUAL_CORRECTION) |
| status | ENUM(PENDING, APPROVED, REJECTED, APPLIED) |
| approved_by | UUID FK auth_users | nullable |
| approved_at | TIMESTAMP | |

### sales_order_change_items
`id`, `order_change_id` FK, `sku_id` FK, `change_type` ENUM(ADD, REMOVE, INCREASE_QTY, DECREASE_QTY, REPLACE), `old_qty`, `new_qty`, `replaced_by_sku_id` (nullable).

### sales_approvals  *(Approval is its own entity, not just a status)*
`id`, `order_id` FK, `approved_by` FK auth_users, `decision` ENUM(APPROVED, REJECTED), `remarks`, `priority_set` ENUM, `approved_at`.

### sales_order_timeline
`id`, `order_id` FK, `event_type` VARCHAR (e.g. `OrderPlaced`, `OrderApproved`, `OrderChanged`), `description`, `performed_by`, `occurred_at`.

### Edit permission matrix (enforced in service layer, not schema, but documented here)
| State | Customer | Salesman | Admin |
|---|---|---|---|
| Draft / Pending Approval | ✅ direct edit | ✅ direct edit | ✅ direct edit |
| Approved | ⚠️ via Order Change | ✅ via Order Change | ✅ via Order Change |
| Trip Assigned / Loading Started | ❌ | Order Change (notifies warehouse) | Order Change |
| Loading Completed+ | ❌ | ❌ | ❌ |

### Relationships
```
customer_customers 1─▶N sales_orders
sales_orders 1─▶N sales_order_items
sales_orders 1─▶N sales_order_revisions
sales_orders 1─▶N sales_order_changes 1─▶N sales_order_change_items
sales_orders 1─▶N sales_approvals
sales_orders 1─▶N sales_order_timeline
sales_orders 1─▶1 planning_trip_orders (created after approval)   [cross-domain]
```

### Enums
`OrderStatus{DRAFT,SUBMITTED,PENDING_APPROVAL,APPROVED,REJECTED,TRIP_ASSIGNED,LOADING_STARTED,LOADING_COMPLETED,INVOICED,DELIVERED,COMPLETED,CANCELLED}` · `OrderSource{CUSTOMER_APP,SALESMAN_APP}` · `Priority{NORMAL,HIGH,URGENT}`

---

# 5. PLANNING DOMAIN (Trip Aggregate)

## Purpose
Everything between "order approved" and "warehouse starts loading": Vehicle assignment, Route, Delivery date/priority scheduling. This domain was *discovered*, not requested — it exists because approved orders wait for a truck.

## Aggregate Root
`planning_trips`

## Tables (8)
```
planning_vehicles
planning_drivers
planning_routes
planning_trips
planning_trip_orders
planning_trip_status_history
planning_vehicle_documents
planning_route_sequences
```

### planning_vehicles
`id`, `vehicle_code`, `registration_number` UNIQUE, `vehicle_type` ENUM(TRUCK, TEMPO, VAN, BIKE), `capacity_kg`, `capacity_volume`, `owner_type` ENUM(OWNED, LEASED, THIRD_PARTY), `status` ENUM(ACTIVE, MAINTENANCE, INACTIVE), `current_driver_id` FK planning_drivers (nullable).

### planning_drivers
`id`, `user_id` FK auth_users (nullable — driver may or may not have app login), `driver_name`, `license_number`, `license_expiry`, `mobile`, `status` ENUM(ACTIVE, INACTIVE), `assigned_vehicle_id` FK planning_vehicles.

### planning_routes
`id`, `route_code`, `route_name`, `area_covered`, `default_vehicle_id` FK (nullable), `active`. Referenced by `customer_routes.route_id`.

### planning_route_sequences
`id`, `route_id` FK, `customer_id` FK customer_customers, `sequence_order` INTEGER. Delivery-order optimization per route.

### planning_trips
| Field | Type |
|---|---|
| id | UUID PK |
| trip_number | VARCHAR UNIQUE |
| route_id | UUID FK planning_routes |
| vehicle_id | UUID FK planning_vehicles |
| driver_id | UUID FK planning_drivers |
| trip_date | DATE |
| status | ENUM TripStatus |
| locked_at | TIMESTAMP |

State machine (`TripStatus`): `PLANNING → READY → LOADING → DISPATCHED → COMPLETED → CLOSED`.

### planning_trip_orders  *(mapping — one trip carries many orders)*
`id`, `trip_id` FK, `order_id` FK sales_orders, `sequence_in_trip` INTEGER, `added_at`.

### planning_trip_status_history
`id`, `trip_id` FK, `from_status`, `to_status`, `changed_by`, `changed_at`.

### planning_vehicle_documents
`id`, `vehicle_id` FK, `document_type` ENUM(RC, INSURANCE, PERMIT, FITNESS), `file_url`, `expiry_date`.

### Relationships
```
sales_orders (OrderApproved event) ─▶ planning_trip_orders ◀─N─1 planning_trips
planning_trips N─▶1 planning_vehicles
planning_trips N─▶1 planning_drivers
planning_routes 1─▶N planning_trips
planning_routes 1─▶N planning_route_sequences N─▶1 customer_customers
planning_trips 1─▶N warehouse_dispatches   [cross-domain: Trip creates Dispatch]
```

### Enums
`TripStatus{PLANNING,READY,LOADING,DISPATCHED,COMPLETED,CLOSED}` · `VehicleType{TRUCK,TEMPO,VAN,BIKE}` · `VehicleStatus{ACTIVE,MAINTENANCE,INACTIVE}`

---

# 6. WAREHOUSE DOMAIN (Dispatch Aggregate)

## Purpose
"What actually left the warehouse" — independent from what the customer ordered. Owns Dispatch, Dispatch Items, Loading history, and warehouse-initiated change requests (which must be approved by Sales/Admin, never decided unilaterally by loaders).

## Aggregate Root
`warehouse_dispatches`

## Tables (6)
```
warehouse_dispatches
warehouse_dispatch_items
warehouse_dispatch_change_requests
warehouse_dispatch_change_request_items
warehouse_loading_history
warehouse_dispatch_timeline
```

### warehouse_dispatches
| Field | Type |
|---|---|
| id | UUID PK |
| dispatch_number | VARCHAR UNIQUE |
| trip_id | UUID FK planning_trips |
| order_id | UUID FK sales_orders |
| status | ENUM DispatchStatus |
| loading_supervisor_id | UUID FK auth_users |
| loading_started_at | TIMESTAMP |
| loading_completed_at | TIMESTAMP |
| locked_at | TIMESTAMP |

State machine (`DispatchStatus`): `CREATED → PICKING → LOADING → REVIEW → LOCKED → INVOICED`.

### warehouse_dispatch_items
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| dispatch_id | UUID FK | |
| order_item_id | UUID FK sales_order_items | traceability to what was ordered |
| sku_id | UUID FK catalog_product_skus | |
| ordered_qty | DECIMAL | copied for convenience |
| loaded_qty | DECIMAL | |
| difference | DECIMAL | computed: loaded - ordered |
| reason | ENUM(OUT_OF_STOCK, PROMOTION, SUBSTITUTION, DAMAGE, OTHER) | |
| loader_id | UUID FK auth_users | |
| loaded_at | TIMESTAMP | |

### warehouse_dispatch_change_requests  *(loader can suggest, not decide)*
`id`, `dispatch_id` FK, `requested_by` FK auth_users, `request_type` ENUM(ADD_ITEM, REPLACE_ITEM, REDUCE_QTY, REMOVE_ITEM), `status` ENUM(PENDING, APPROVED, REJECTED), `decided_by` FK auth_users, `decided_at`.

### warehouse_dispatch_change_request_items
`id`, `change_request_id` FK, `sku_id` FK, `requested_qty`, `replacement_sku_id` (nullable).

### warehouse_loading_history
`id`, `dispatch_id` FK, `dispatch_item_id` FK (nullable), `action` VARCHAR, `old_value`, `new_value`, `performed_by`, `performed_at`.

### warehouse_dispatch_timeline
`id`, `dispatch_id` FK, `event_type` (e.g. `DispatchCreated`, `LoadingStarted`, `DispatchItemUpdated`, `LoadingCompleted`), `performed_by`, `occurred_at`.

### Relationships
```
planning_trips 1─▶N warehouse_dispatches
sales_orders 1─▶N warehouse_dispatches   (one order → one dispatch typically; supports many-to-one for combined loads)
warehouse_dispatches 1─▶N warehouse_dispatch_items N─▶1 catalog_product_skus
warehouse_dispatches 1─▶N warehouse_dispatch_change_requests 1─▶N warehouse_dispatch_change_request_items
warehouse_dispatches 1─▶1 accounting_invoice_references   [cross-domain: Dispatch creates Invoice]
```

### Enums
`DispatchStatus{CREATED,PICKING,LOADING,REVIEW,LOCKED,INVOICED}` · `DispatchItemReason{OUT_OF_STOCK,PROMOTION,SUBSTITUTION,DAMAGE,OTHER}`

---

# 7. ACCOUNTING DOMAIN (Invoice Reference — Tally-owned)

## Purpose
Invoice, Ledger, GST, and Outstanding are **owned by Tally** in Phase 1. This domain stores references/snapshots only — never the authoritative financial record. No complex state machine needed since Tally is the real owner; only `WAITING → GENERATED → SYNCED → CANCELLED`.

## Aggregate Root
`accounting_invoice_references`

## Tables (5)
```
accounting_invoice_references
accounting_invoice_items
accounting_ledger_snapshot
accounting_gst_summary
accounting_outstanding_snapshot
```

### accounting_invoice_references
| Field | Type | Notes |
|---|---|---|
| id | UUID PK | |
| dispatch_id | UUID FK warehouse_dispatches | |
| customer_id | UUID FK customer_customers | |
| tally_invoice_guid | VARCHAR | Tally's internal GUID |
| invoice_number | VARCHAR | returned by Tally |
| invoice_date | DATE | |
| invoice_pdf_url | TEXT | |
| total_amount | DECIMAL | |
| gst_amount | DECIMAL | |
| status | ENUM InvoiceStatus | WAITING/GENERATED/SYNCED/CANCELLED |
| generated_by | UUID FK auth_users | accountant who clicked Generate |
| generated_at | TIMESTAMP | |

### accounting_invoice_items
`id`, `invoice_reference_id` FK, `sku_id` FK catalog_product_skus, `qty`, `rate`, `discount`, `gst_percentage`, `line_total`. Mirrors `warehouse_dispatch_items` at the point of invoicing — immutable copy.

### accounting_ledger_snapshot  *(synced from Tally by Integration Domain)*
`id`, `customer_id` FK, `tally_guid`, `opening_balance`, `closing_balance`, `last_sync`.

### accounting_gst_summary
`id`, `invoice_reference_id` FK, `hsn_code`, `taxable_amount`, `cgst`, `sgst`, `igst`, `cess`.

### accounting_outstanding_snapshot  *(feeds customer_credit_snapshot)*
`id`, `customer_id` FK, `total_outstanding`, `overdue_amount`, `as_of_date`, `last_sync`.

### Relationships
```
warehouse_dispatches 1─▶1 accounting_invoice_references
accounting_invoice_references 1─▶N accounting_invoice_items N─▶1 catalog_product_skus
accounting_invoice_references 1─▶N accounting_gst_summary
customer_customers 1─▶1 accounting_ledger_snapshot
customer_customers 1─▶1 accounting_outstanding_snapshot ──▶ feeds customer_credit_snapshot (Customer Domain read model)
accounting_invoice_references 1─▶1 delivery_deliveries   [cross-domain: Invoice creates Delivery]
```

### Enums
`InvoiceStatus{WAITING,GENERATED,SYNCED,CANCELLED}`

---

# 8. DELIVERY DOMAIN

## Purpose
Physical handover of goods to the customer. Independent of Invoice — a delivery can fail/partial without the invoice disappearing (outstanding still exists).

## Aggregate Root
`delivery_deliveries`

## Tables (4)
```
delivery_deliveries
delivery_proof
delivery_status_history
delivery_expenses
```

### delivery_deliveries
| Field | Type |
|---|---|
| id | UUID PK |
| invoice_reference_id | UUID FK accounting_invoice_references |
| trip_id | UUID FK planning_trips |
| customer_id | UUID FK customer_customers |
| driver_id | UUID FK planning_drivers |
| status | ENUM DeliveryStatus |
| assigned_at / out_for_delivery_at / delivered_at | TIMESTAMP |

State machine (`DeliveryStatus`): `ASSIGNED → OUT_FOR_DELIVERY → DELIVERED / PARTIAL / FAILED → RETURNED`, with `FAILED → OUT_FOR_DELIVERY` retry loop.

### delivery_proof
`id`, `delivery_id` FK, `proof_type` ENUM(SIGNATURE, PHOTO, GPS), `file_url`, `latitude`, `longitude`, `captured_at`.

### delivery_status_history
`id`, `delivery_id` FK, `from_status`, `to_status`, `remarks`, `changed_by`, `changed_at`.

### delivery_expenses
`id`, `trip_id` FK planning_trips, `expense_type` ENUM(FUEL, TOLL, MISC), `amount`, `receipt_url`, `submitted_by`, `submitted_at`.

### Relationships
```
accounting_invoice_references 1─▶1 delivery_deliveries
planning_trips 1─▶N delivery_deliveries
planning_trips 1─▶N delivery_expenses
delivery_deliveries 1─▶N delivery_proof
delivery_deliveries 1─▶N delivery_status_history
delivery_deliveries 1─▶1 payment_payments   [cross-domain: Delivery creates/triggers Payment]
```

### Enums
`DeliveryStatus{ASSIGNED,OUT_FOR_DELIVERY,DELIVERED,PARTIAL,FAILED,RETURNED}` · `ProofType{SIGNATURE,PHOTO,GPS}`

---

# 9. PAYMENT DOMAIN (Collection)

## Purpose
Money collected against invoices. References Invoice; never modifies it. Supports partial settlement and multi-invoice allocation (one payment can settle several invoices — common when a customer clears old dues alongside a fresh delivery).

## Aggregate Root
`payment_payments`

## Tables (5)
```
payment_payments
payment_allocations
payment_receipts
payment_verifications
payment_status_history
```

### payment_payments
| Field | Type |
|---|---|
| id | UUID PK |
| customer_id | UUID FK customer_customers |
| delivery_id | UUID FK delivery_deliveries | nullable — payment can also be collected independently of a delivery |
| collected_by | UUID FK auth_users | driver/cashier |
| payment_mode | ENUM PaymentMode | CASH/UPI/CHEQUE/BANK_TRANSFER |
| amount | DECIMAL | |
| status | ENUM PaymentStatus | PENDING/COLLECTED/VERIFIED/POSTED |
| collected_at | TIMESTAMP | |

### payment_allocations  *(settle multiple invoices with one payment)*
`id`, `payment_id` FK, `invoice_reference_id` FK accounting_invoice_references, `allocated_amount` DECIMAL.

### payment_receipts
`id`, `payment_id` FK, `receipt_number`, `photo_url` (cash photo / UPI screenshot), `cheque_number` (nullable), `bank_name` (nullable).

### payment_verifications
`id`, `payment_id` FK, `verified_by` FK auth_users (cashier/accountant), `verification_status` ENUM(APPROVED, REJECTED), `remarks`, `verified_at`.

### payment_status_history
`id`, `payment_id` FK, `from_status`, `to_status`, `changed_by`, `changed_at`.

### Relationships
```
delivery_deliveries 1─▶1 payment_payments (typical case)
payment_payments 1─▶N payment_allocations N─▶1 accounting_invoice_references
payment_payments 1─▶1 payment_receipts
payment_payments 1─▶N payment_verifications
payment_payments 1─▶N payment_status_history
payment_payments (PaymentVerified event) ──▶ integration_tally_sync_queue (post receipt to Tally ledger)
```

### Enums
`PaymentMode{CASH,UPI,CHEQUE,BANK_TRANSFER}` · `PaymentStatus{PENDING,COLLECTED,VERIFIED,POSTED}`

---

# 10. NOTIFICATION DOMAIN

## Purpose
Outbound messaging triggered by business events (`OrderPlaced`, `OrderApproved`, `InvoiceGenerated`, `DeliveryCompleted`, etc.). Fully decoupled — this domain only **listens**, it never gets called directly by Sales/Warehouse/Accounting code.

## Tables (4)
```
notification_templates
notification_logs
notification_preferences
notification_channels
```

### notification_templates
`id`, `template_code` UNIQUE, `event_type` (e.g. `OrderApproved`), `channel` ENUM, `subject`, `body_template`, `active`.

### notification_channels
`id`, `channel_code` ENUM(PUSH, SMS, WHATSAPP, EMAIL), `provider_name`, `config_json`, `active`.

### notification_logs
`id`, `recipient_type` ENUM(CUSTOMER, USER), `recipient_id` UUID (polymorphic), `event_type`, `channel`, `status` ENUM(QUEUED, SENT, FAILED, DELIVERED), `payload`, `sent_at`, `error_message`.

### notification_preferences  *(system-side; customer-side already in customer_settings)*
`id`, `user_id` FK auth_users, `event_type`, `channel`, `enabled` BOOLEAN.

### Relationships
```
Any domain event (OrderPlaced, OrderApproved, LoadingCompleted, InvoiceGenerated, DeliveryCompleted, PaymentVerified)
        ─▶ notification_logs (consumer, references recipient polymorphically)
notification_templates 1─▶N notification_logs
```

### Enums
`NotificationChannel{PUSH,SMS,WHATSAPP,EMAIL}` · `NotificationStatus{QUEUED,SENT,FAILED,DELIVERED}`

---

# 11. AUDIT DOMAIN

## Purpose
System-wide, technical audit trail (who/when/old value/new value/IP/device) — distinct from the business timelines already embedded per-domain (`sales_order_timeline`, `warehouse_dispatch_timeline`, etc.), which capture *business* narrative. Audit Domain captures *technical* field-level change history for compliance.

## Tables (2)
```
audit_logs
audit_activity_feed
```

### audit_logs
| Field | Type |
|---|---|
| id | UUID PK |
| entity_type | VARCHAR | e.g. `sales_orders` |
| entity_id | UUID | |
| action | ENUM(CREATE, UPDATE, DELETE, STATUS_CHANGE) | |
| old_value | JSONB | |
| new_value | JSONB | |
| performed_by | UUID FK auth_users | |
| ip_address | VARCHAR | |
| device_info | VARCHAR | |
| occurred_at | TIMESTAMP | |

### audit_activity_feed  *(cross-domain aggregated feed for dashboards)*
`id`, `entity_type`, `entity_id`, `summary_text`, `occurred_at`. Denormalized union of all `*_timeline` tables for a single "recent activity" dashboard query.

### Relationships
Polymorphic — `entity_type` + `entity_id` can reference any aggregate root across all domains. No hard FK (by design, since it spans domains).

---

# 12. INTEGRATION DOMAIN (Tally Sync)

## Purpose
The only domain allowed to talk to Tally. Nothing else in the system knows Tally exists. Owns the sync queue, retry logic, GUID mapping, and error tracking discussed at length in the early architecture chats (queue-based, never lose an order if Tally is offline).

## Tables (4)
```
integration_tally_sync_queue
integration_tally_sync_log
integration_tally_mapping
integration_tally_config
```

### integration_tally_sync_queue
| Field | Type |
|---|---|
| id | UUID PK |
| sync_type | ENUM(INVOICE, LEDGER, STOCK, PAYMENT_RECEIPT) |
| reference_entity | VARCHAR | e.g. `warehouse_dispatches` |
| reference_id | UUID | |
| payload | JSONB | the XML/request body to send |
| status | ENUM(PENDING, PROCESSING, SUCCESS, FAILED) |
| retry_count | INTEGER | |
| next_retry_at | TIMESTAMP | |
| last_error | TEXT | |

### integration_tally_sync_log
`id`, `queue_id` FK, `attempt_number`, `request_xml`, `response_xml`, `status`, `attempted_at`.

### integration_tally_mapping  *(GUID bridge, generalized across entities)*
`id`, `entity_type` ENUM(CUSTOMER, PRODUCT, INVOICE), `local_id` UUID, `tally_guid`, `tally_name`, `last_sync`.

### integration_tally_config
`id`, `config_key`, `config_value`, `description`. Company/server connection settings (XML endpoint, ODBC DSN, sync interval).

### Relationships
```
warehouse_dispatches (DispatchLocked event) ─▶ integration_tally_sync_queue (INVOICE) ─▶ Tally
                                                       │
                                                       ▼
                                        accounting_invoice_references (InvoiceGenerated event)

payment_verifications (PaymentVerified event) ─▶ integration_tally_sync_queue (PAYMENT_RECEIPT) ─▶ Tally

integration_tally_mapping.local_id ─▶ customer_customers.id / catalog_products.id / accounting_invoice_references.id
```
This is the only place where `customer_ledger_mapping`, `accounting_ledger_snapshot`, and stock/price sync (future Inventory Domain) get their data from.

### Enums
`TallySyncType{INVOICE,LEDGER,STOCK,PAYMENT_RECEIPT}` · `TallySyncStatus{PENDING,PROCESSING,SUCCESS,FAILED}`

---

# 13. ALERT DOMAIN (Business Alerts — Advisory Layer)

## Purpose
Implements the "Decision Support, not Decision Making" philosophy. Anything that in a stricter ERP would *block* a transaction instead becomes a visible, assignable alert here: credit exceeded, stock shortage, order changed after planning, vehicle overloaded, invoice sync failed, duplicate order, high outstanding.

## Tables (3)
```
alert_types
alert_alerts
alert_recipients
```

### alert_types
`id`, `code` UNIQUE (e.g. `CREDIT_LIMIT_EXCEEDED`, `STOCK_SHORTAGE`, `ORDER_CHANGED`, `VEHICLE_OVERLOADED`, `INVOICE_SYNC_FAILED`, `DUPLICATE_ORDER`, `HIGH_OUTSTANDING`, `PAYMENT_PENDING`), `default_severity` ENUM(INFO, WARNING, CRITICAL), `description`.

### alert_alerts
| Field | Type |
|---|---|
| id | UUID PK |
| alert_type_id | UUID FK alert_types |
| entity_type | VARCHAR | e.g. `sales_orders` |
| entity_id | UUID | polymorphic reference |
| severity | ENUM(INFO, WARNING, CRITICAL) | |
| message | TEXT | |
| status | ENUM(OPEN, ACKNOWLEDGED, RESOLVED, IGNORED) | |
| raised_at | TIMESTAMP | |
| resolved_at | TIMESTAMP | |

### alert_recipients
`id`, `alert_id` FK, `user_id` FK auth_users, `acknowledged` BOOLEAN, `acknowledged_at`.

### Relationships
Polymorphic on `entity_type`/`entity_id`, same pattern as Audit Domain — deliberately loose coupling since alerts can be raised by any domain (Sales for credit, Warehouse for stock, Integration for sync failures, Planning for overloaded vehicles).

```
sales_orders (credit check) ─▶ alert_alerts (CREDIT_LIMIT_EXCEEDED) ─▶ alert_recipients ─▶ auth_users (Salesman, Admin)
integration_tally_sync_queue (FAILED) ─▶ alert_alerts (INVOICE_SYNC_FAILED)
planning_trips (over capacity) ─▶ alert_alerts (VEHICLE_OVERLOADED)
```

### Enums
`AlertSeverity{INFO,WARNING,CRITICAL}` · `AlertStatus{OPEN,ACKNOWLEDGED,RESOLVED,IGNORED}`

---

# Master Cross-Domain Relationship Diagram

```
AUTH ──────────────────────────────────────────────────────────────┐
  │ (created_by / updated_by / *_user_id everywhere)               │
  ▼                                                                │
CUSTOMER ──▶ SALES (Order) ──▶ PLANNING (Trip) ──▶ WAREHOUSE (Dispatch)
  │                                                        │
  │                                                        ▼
  │                                          ACCOUNTING (Invoice Ref, Tally-owned)
  │                                                        │
  │                                                        ▼
  │                                            DELIVERY (POD, GPS)
  │                                                        │
  │                                                        ▼
  └────────────────────────────────────────────▶ PAYMENT (Collection)

Supporting, event-driven, cross-cutting (no domain calls these directly):
  NOTIFICATION   ← listens to every event above
  AUDIT          ← logs every mutation across every domain
  ALERT          ← raised by Sales/Warehouse/Planning/Integration, never blocks
  INTEGRATION    ← the only bridge to Tally (Invoice generation, Ledger sync, Payment posting)
  CATALOG        ← referenced by Sales/Warehouse/Accounting for SKU/price/tax, owned independently
```

## Cross-domain Foreign Key Summary

| From Table | Column | To Table |
|---|---|---|
| customer_salesmen | salesman_user_id | auth_users |
| customer_routes | route_id | planning_routes |
| customer_price_lists | price_list_id | catalog_price_lists |
| sales_orders | customer_id | customer_customers |
| sales_orders | salesman_user_id | auth_users |
| sales_order_items | sku_id | catalog_product_skus |
| planning_trip_orders | order_id | sales_orders |
| warehouse_dispatches | trip_id | planning_trips |
| warehouse_dispatches | order_id | sales_orders |
| warehouse_dispatch_items | order_item_id | sales_order_items |
| warehouse_dispatch_items | sku_id | catalog_product_skus |
| accounting_invoice_references | dispatch_id | warehouse_dispatches |
| accounting_invoice_references | customer_id | customer_customers |
| accounting_invoice_items | sku_id | catalog_product_skus |
| delivery_deliveries | invoice_reference_id | accounting_invoice_references |
| delivery_deliveries | trip_id | planning_trips |
| delivery_deliveries | driver_id | planning_drivers |
| payment_payments | delivery_id | delivery_deliveries |
| payment_payments | customer_id | customer_customers |
| payment_allocations | invoice_reference_id | accounting_invoice_references |
| integration_tally_mapping | local_id | customer_customers / catalog_products / accounting_invoice_references |
| alert_alerts | entity_id | (polymorphic — any aggregate root) |
| audit_logs | entity_id | (polymorphic — any aggregate root) |

---

# Table Count Summary

| Domain | Tables |
|---|---|
| Auth | 10 |
| Customer | 12 |
| Catalog | 13 (incl. price_lists) |
| Sales | 7 |
| Planning | 8 |
| Warehouse | 6 |
| Accounting | 5 |
| Delivery | 4 |
| Payment | 5 |
| Notification | 4 |
| Audit | 2 |
| Integration | 4 |
| Alert | 3 |
| **Total** | **83** |

Deliberately excluded from Phase 1 (future domains, per roadmap): **Inventory** (stock/batch/expiry, Phase 2–4), full **Accounting/Ledger engine** (Phase 6, only after Tally is optionally replaced), **Purchase** domain (Phase 5).

---

# Global Conventions Reference

- **Primary keys:** UUID v4 everywhere.
- **Audit columns:** `created_at`, `updated_at` on every table; `created_by`/`updated_by` FK → `auth_users.id` on every business/master table (omitted from customer-generated tables where `created_by_customer_id` applies instead).
- **Soft delete:** use `status`/`active` enums; no hard deletes on Customer, Order, Dispatch, Invoice, Payment tables.
- **Money fields:** DECIMAL(14,2) minimum precision.
- **Enums:** implemented as native PostgreSQL ENUM types per the enum lists documented under each domain, or as lookup tables (`alert_types`, `catalog_categories`) where the list is expected to grow without a migration.
- **Immutability rule:** `sales_order_revisions`, `warehouse_loading_history`, `accounting_invoice_items`, and all `*_timeline`/`*_history` tables are append-only — no UPDATE, no DELETE, ever.
- **Polymorphic references** (`entity_type` + `entity_id`) are used only in Audit and Alert domains, intentionally, since those two are the only tables designed to reference *any* aggregate root across all 13 domains.

This document is the direct implementation source for the Prisma schema / PostgreSQL migrations — every table above maps 1:1 to a Prisma model.
