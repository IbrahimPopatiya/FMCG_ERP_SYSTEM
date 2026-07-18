Perfect. Now we're entering what I consider the **core business domain** of the ERP.

After reviewing everything we've discussed—from Tally integration, customer ordering, salesman assignment, routes, price lists, ledger linkage, OTP login, and future ERP migration—I would actually redesign the Customer Domain differently than most ERP systems.

Most ERPs treat a customer as a single table.

I don't.

I think **Customer** is one of the richest aggregates in this project because almost every module touches it.

---

# CUSTOMER DOMAIN

## Domain Purpose

The Customer Domain manages the **business identity** of every customer.

It does **NOT** own:

* Orders
* Invoices
* Payments
* Ledger
* Stock

It only owns the customer's business profile and relationships.

It answers questions like:

* Who is this customer?
* Which ledger does this customer belong to?
* Which salesman handles this customer?
* Which route is assigned?
* Which price list applies?
* Can the customer log in?
* Which GST belongs to this customer?
* Which warehouse serves this customer?
* Which company supplies this customer?

---

# Domain Responsibilities

```text
Customer Domain
│
├── Business Identity
├── Customer Login
├── Business Details
├── Contact Details
├── Address
├── GST Information
├── Assigned Salesman
├── Assigned Route
├── Customer Price List
├── Customer Settings
├── Credit Snapshot
├── Tally Mapping
└── Customer Documents
```

Notice

**Credit Snapshot**

NOT

Customer Ledger.

Ledger belongs to Accounting.

---

# Aggregate Root

```text
Customer
│
├── Login
├── Business Profile
├── Address
├── Contacts
├── GST
├── Route
├── Salesman
├── Price List
├── Settings
├── Ledger Mapping
└── Documents
```

Everything belongs to Customer.

---

# Customer Domain Tables

I recommend **12 tables**.

```text
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

---

# Domain Relationship

```text
Customer
│
├── CustomerAuth
├── Address
├── Contact
├── Documents
├── Activity
├── Settings
├── Price List
├── Salesman
├── Route
├── Credit Snapshot
└── Ledger Mapping
```

---

# TABLE 1

# customer_customers

This is the Aggregate Root.

Everything starts here.

---

Purpose

Represents one business customer.

One customer

↓

One Ledger

↓

Many Orders

↓

Many Deliveries

↓

Many Payments

---

Fields

| Field              | Type         | Description             |
| ------------------ | ------------ | ----------------------- |
| id                 | UUID         | PK                      |
| customer_code      | VARCHAR(30)  | Internal ERP Code       |
| tally_ledger_name  | VARCHAR(255) | Ledger Name in Tally    |
| business_name      | VARCHAR(255) | Shop Name               |
| owner_name         | VARCHAR(150) | Proprietor              |
| gst_number         | VARCHAR(20)  | GST                     |
| pan_number         | VARCHAR(20)  | Optional                |
| mobile             | VARCHAR(20)  | Login Mobile            |
| alternate_mobile   | VARCHAR(20)  |                         |
| email              | VARCHAR(150) |                         |
| business_type      | ENUM         | Retailer/Wholesaler/etc |
| customer_category  | ENUM         | A/B/C                   |
| status             | ENUM         | Active/Inactive/Blocked |
| onboarding_date    | DATE         |                         |
| preferred_language | VARCHAR(20)  |                         |
| notes              | TEXT         |                         |
| created_at         | TIMESTAMP    |                         |
| updated_at         | TIMESTAMP    |                         |
| created_by         | UUID         | FK auth_users           |
| updated_by         | UUID         | FK auth_users           |

Indexes

```text
customer_code UNIQUE

mobile UNIQUE

gst_number UNIQUE

status
```

---

# TABLE 2

# customer_auth

We separated this from Auth Domain.

Purpose

Customer Login.

Fields

| Field          | Type      |
| -------------- | --------- |
| id             | UUID      |
| customer_id    | UUID      |
| mobile         | VARCHAR   |
| otp_verified   | BOOLEAN   |
| last_login     | TIMESTAMP |
| login_attempts | INTEGER   |
| account_status | ENUM      |
| firebase_token | TEXT      |
| device_id      | VARCHAR   |
| created_at     | TIMESTAMP |

Relationship

```text
Customer

1

↓

1

CustomerAuth
```

---

# TABLE 3

# customer_addresses

Because customers may have

Billing

Shipping

Warehouse

Branch

Store

Addresses.

Fields

| Field         | Type    |
| ------------- | ------- |
| id            | UUID    |
| customer_id   | UUID    |
| address_type  | ENUM    |
| address_line1 | VARCHAR |
| address_line2 | VARCHAR |
| landmark      | VARCHAR |
| city          | VARCHAR |
| district      | VARCHAR |
| state         | VARCHAR |
| country       | VARCHAR |
| pincode       | VARCHAR |
| latitude      | DECIMAL |
| longitude     | DECIMAL |
| is_default    | BOOLEAN |

Relationship

```text
Customer

↓

Many Addresses
```

GPS is important

Future Route Optimization.

---

# TABLE 4

# customer_contacts

One shop

may have

Owner

Manager

Cashier

Purchase Manager

Fields

| Field       | Type    |
| ----------- | ------- |
| id          | UUID    |
| customer_id | UUID    |
| name        | VARCHAR |
| designation | VARCHAR |
| mobile      | VARCHAR |
| email       | VARCHAR |
| whatsapp    | VARCHAR |
| is_primary  | BOOLEAN |

---

# TABLE 5

# customer_salesmen

Very important.

Remember

One salesman manages many customers.

Sometimes multiple salesmen share customers.

So

Don't store salesmanId directly.

Use mapping.

Fields

| Field            | Type    |
| ---------------- | ------- |
| id               | UUID    |
| customer_id      | UUID    |
| salesman_user_id | UUID    |
| assigned_date    | DATE    |
| is_primary       | BOOLEAN |
| active           | BOOLEAN |

Relationship

```text
Customer

↓

CustomerSalesman

↓

AuthUser
```

---

# TABLE 6

# customer_routes

One customer belongs to one delivery route.

Fields

| Field           | Type    |
| --------------- | ------- |
| id              | UUID    |
| customer_id     | UUID    |
| route_id        | UUID    |
| sequence        | INTEGER |
| delivery_day    | ENUM    |
| visit_frequency | ENUM    |
| active          | BOOLEAN |

Notice

We don't store Route Name.

Route belongs to Planning Domain.

---

# TABLE 7

# customer_price_lists

Very important.

Client requested

Multiple price lists.

Fields

| Field          | Type    |
| -------------- | ------- |
| id             | UUID    |
| customer_id    | UUID    |
| price_list_id  | UUID    |
| effective_from | DATE    |
| effective_to   | DATE    |
| active         | BOOLEAN |

Future

One customer

↓

Multiple seasonal price lists.

---

# TABLE 8

# customer_credit_snapshot

Remember

Accounting lives in Tally.

This table is

Snapshot only.

Fields

| Field              | Type      |
| ------------------ | --------- |
| id                 | UUID      |
| customer_id        | UUID      |
| outstanding_amount | DECIMAL   |
| credit_limit       | DECIMAL   |
| available_credit   | DECIMAL   |
| overdue_amount     | DECIMAL   |
| last_sync          | TIMESTAMP |

Never modify manually.

Updated from Tally.

---

# TABLE 9

# customer_ledger_mapping

Critical.

This table connects ERP

↓

Tally.

Fields

| Field       | Type      |
| ----------- | --------- |
| id          | UUID      |
| customer_id | UUID      |
| tally_guid  | VARCHAR   |
| ledger_name | VARCHAR   |
| ledger_code | VARCHAR   |
| sync_status | ENUM      |
| last_sync   | TIMESTAMP |

This becomes the bridge.

---

# TABLE 10

# customer_documents

Purpose

Store

GST

PAN

License

Shop Photos

Fields

| Field         | Type      |
| ------------- | --------- |
| id            | UUID      |
| customer_id   | UUID      |
| document_type | ENUM      |
| file_url      | TEXT      |
| uploaded_by   | UUID      |
| uploaded_at   | TIMESTAMP |

---

# TABLE 11

# customer_settings

Every customer

has preferences.

Fields

| Field                | Type    |
| -------------------- | ------- |
| id                   | UUID    |
| customer_id          | UUID    |
| notification_enabled | BOOLEAN |
| whatsapp_enabled     | BOOLEAN |
| sms_enabled          | BOOLEAN |
| push_enabled         | BOOLEAN |
| app_language         | VARCHAR |
| theme                | VARCHAR |

---

# TABLE 12

# customer_activity

This is not Audit.

Business Activity.

Fields

| Field         | Type      |
| ------------- | --------- |
| id            | UUID      |
| customer_id   | UUID      |
| activity_type | ENUM      |
| description   | TEXT      |
| activity_date | TIMESTAMP |
| performed_by  | UUID      |

Example

```text
Customer Registered

Salesman Assigned

Price List Changed

Route Changed

Customer Activated
```

---

# ER Diagram

```text
                           CUSTOMER DOMAIN

                    customer_customers
                            │
 ┌──────────┬────────┬──────┼──────┬────────┬────────┬────────┐
 │          │        │      │      │        │        │        │
 ▼          ▼        ▼      ▼      ▼        ▼        ▼        ▼
auth   addresses contacts salesmen routes prices credit ledger docs
 │                                                            │
 ▼                                                            ▼
customer_auth                                         customer_settings
                            │
                            ▼
                    customer_activity
```

---

# Relationships with Other Domains

```text
AUTH DOMAIN
───────────
auth_users
      │
      ├── created_by
      ├── updated_by
      ├── salesman_user_id
      └── uploaded_by

────────────────────────────

SALES DOMAIN

Customer

1

↓

Many Orders

────────────────────────────

PLANNING DOMAIN

Customer

↓

Route

↓

Trip

────────────────────────────

CATALOG DOMAIN

Customer

↓

Price List

↓

Product Price

────────────────────────────

ACCOUNTING DOMAIN

Customer

↓

Ledger Mapping

↓

Credit Snapshot

↓

Invoice Reference

────────────────────────────

DELIVERY DOMAIN

Customer

↓

Delivery

────────────────────────────

PAYMENT DOMAIN

Customer

↓

Payment
```

---

# Business Enums

### CustomerStatus

```text
ACTIVE

INACTIVE

BLOCKED

SUSPENDED
```

---

### BusinessType

```text
RETAILER

WHOLESALER

DISTRIBUTOR

MODERN_TRADE

INSTITUTION
```

---

### CustomerCategory

```text
A

B

C

VIP
```

---

### AddressType

```text
BILLING

SHIPPING

SHOP

WAREHOUSE
```

---

### DocumentType

```text
GST

PAN

SHOP_LICENSE

AADHAR

PHOTO
```

---

# One architectural improvement after reviewing our discussions

After revisiting everything we've designed, I would make one change that will significantly improve long-term scalability.

Instead of treating `customer_credit_snapshot` and `customer_ledger_mapping` as purely Customer Domain tables, I would classify them as **read models** sourced from the Accounting/Integration domains.

The ownership would look like this:

* **Customer Domain owns:** identity, addresses, contacts, salesman assignments, routes, settings, documents, login.
* **Accounting Domain owns:** ledger, outstanding, credit limit.
* **Integration Domain synchronizes:** ledger information from Tally into snapshot tables.

The Customer Domain simply **reads** those snapshots to display ledger balances and available credit in the app. This keeps ownership aligned with the domain-driven architecture we've established and will make replacing Tally with your own accounting engine in a later phase much easier without redesigning the Customer aggregate.
