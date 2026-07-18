Excellent. This is exactly how I would build it.

We're not designing a **User table**.

We're designing the **Authentication & Authorization Domain**.

Enterprise architects don't start with columns. They start with responsibilities and relationships, then derive tables.

---

# AUTH DOMAIN

## 1. Domain Purpose

The **Auth Domain** is responsible for **identity**, **authentication**, **authorization**, and **access control** across the ERP.

It answers questions like:

* Who is this user?
* Can this user login?
* What role does this user have?
* What permissions does this user have?
* Which branch/company does this user belong to?
* Which device is logged in?
* Is the JWT still valid?
* Was OTP verified?

It is **NOT** responsible for:

* Customer Orders
* Products
* Dispatch
* Accounting
* Business Data

Those belong to their own domains.

---

# 2. Responsibilities

```
Authentication
│
├── Login
├── Logout
├── OTP Verification
├── JWT
├── Refresh Token
├── Device Management
├── Session Management
└── Password (Future)

Authorization
│
├── Role Management
├── Permission Management
├── User Roles
├── Feature Access
├── API Authorization
└── Screen Visibility

Security
│
├── Login History
├── Failed Login
├── OTP Logs
├── Device Tracking
├── Token Revocation
└── Audit
```

---

# 3. Aggregate

The Aggregate Root is

```
User
│
├── Roles
├── Sessions
├── Devices
├── OTP
├── Tokens
└── Login History
```

Everything revolves around User.

---

# 4. Domain Tables

I recommend **10 tables**.

```
AUTH DOMAIN

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

Notice

There is **no Admin table**.

There is **no Salesman table**.

There is only

```
User
```

Roles define behavior.

---

# DOMAIN RELATIONSHIP

```
User

↓

UserRole

↓

Role

↓

RolePermission

↓

Permission
```

Another side

```
User

↓

Session

↓

Device

↓

Refresh Token
```

---

# AUTH_USERS

This is the heart of authentication.

---

Purpose

Represents every person who can login.

Includes

```
Admin

Salesman

Warehouse

Accountant

Driver

Cashier

Purchase Manager
```

NOT Customers.

Customer login belongs to Customer Domain because customers are business entities, not employees.

This separation is very important.

---

Fields

| Field              | Type         | Description                 |
| ------------------ | ------------ | --------------------------- |
| id                 | UUID         | Primary Key                 |
| employee_code      | VARCHAR(30)  | Internal employee code      |
| first_name         | VARCHAR(100) |                             |
| last_name          | VARCHAR(100) |                             |
| full_name          | VARCHAR(200) | Computed / stored           |
| mobile             | VARCHAR(20)  | Login Mobile                |
| email              | VARCHAR(150) | Optional                    |
| password_hash      | TEXT         | Future login                |
| profile_photo      | TEXT         | URL                         |
| status             | ENUM         | Active / Suspended / Locked |
| last_login_at      | TIMESTAMP    |                             |
| failed_login_count | INTEGER      |                             |
| otp_enabled        | BOOLEAN      |                             |
| two_factor_enabled | BOOLEAN      | Future                      |
| branch_id          | UUID         | Future                      |
| company_id         | UUID         | Future                      |
| timezone           | VARCHAR      |                             |
| language           | VARCHAR      |                             |
| created_at         | TIMESTAMP    |                             |
| updated_at         | TIMESTAMP    |                             |
| created_by         | UUID         | FK User                     |
| updated_by         | UUID         | FK User                     |

Indexes

```
mobile UNIQUE

employee_code UNIQUE

status

company_id
```

---

# AUTH_ROLES

Purpose

Defines business roles.

Example

```
Admin

Salesman

Warehouse Supervisor

Loader

Accountant

Driver

Cashier

Purchase Manager
```

Fields

| Field       | Type         |
| ----------- | ------------ |
| id          | UUID         |
| code        | VARCHAR(50)  |
| name        | VARCHAR(100) |
| description | TEXT         |
| is_system   | BOOLEAN      |
| status      | ENUM         |
| created_at  | TIMESTAMP    |
| updated_at  | TIMESTAMP    |

Indexes

```
code UNIQUE
```

---

# AUTH_PERMISSIONS

Purpose

Defines atomic permissions.

Never create permissions like

```
Admin Access
```

Instead

```
order.create

order.edit

order.approve

dispatch.create

dispatch.edit

invoice.generate

customer.view

customer.edit

product.view

product.edit
```

Very granular.

Fields

| Field          | Type      |
| -------------- | --------- |
| id             | UUID      |
| module         | VARCHAR   |
| action         | VARCHAR   |
| permission_key | VARCHAR   |
| description    | TEXT      |
| created_at     | TIMESTAMP |

Example

```
Module

Sales

Action

Approve

Key

sales.order.approve
```

Indexes

```
permission_key UNIQUE
```

---

# AUTH_ROLE_PERMISSIONS

Many-to-Many

```
Role

↓

Permission
```

Fields

| Field         | Type      |
| ------------- | --------- |
| id            | UUID      |
| role_id       | UUID      |
| permission_id | UUID      |
| created_at    | TIMESTAMP |

Unique

```
role_id

permission_id
```

---

# AUTH_USER_ROLES

Supports multiple roles.

Example

Warehouse Manager

may also be

Loader.

Fields

| Field       | Type      |
| ----------- | --------- |
| id          | UUID      |
| user_id     | UUID      |
| role_id     | UUID      |
| assigned_by | UUID      |
| assigned_at | TIMESTAMP |

---

# AUTH_SESSIONS

Purpose

Track active login.

Fields

| Field       | Type      |
| ----------- | --------- |
| id          | UUID      |
| user_id     | UUID      |
| device_id   | UUID      |
| ip_address  | VARCHAR   |
| login_time  | TIMESTAMP |
| logout_time | TIMESTAMP |
| expires_at  | TIMESTAMP |
| status      | ENUM      |

---

# AUTH_DEVICES

Purpose

Track trusted devices.

Fields

| Field          | Type      |
| -------------- | --------- |
| id             | UUID      |
| user_id        | UUID      |
| device_uuid    | VARCHAR   |
| device_name    | VARCHAR   |
| os             | VARCHAR   |
| app_version    | VARCHAR   |
| firebase_token | TEXT      |
| last_seen      | TIMESTAMP |
| is_trusted     | BOOLEAN   |

Why?

Push Notifications.

Device Management.

Logout specific device.

---

# AUTH_OTPS

Purpose

OTP verification.

Fields

| Field       | Type      |
| ----------- | --------- |
| id          | UUID      |
| mobile      | VARCHAR   |
| otp_code    | VARCHAR   |
| purpose     | ENUM      |
| expires_at  | TIMESTAMP |
| verified_at | TIMESTAMP |
| attempts    | INTEGER   |
| status      | ENUM      |

Purpose Enum

```
LOGIN

PASSWORD_RESET

MOBILE_CHANGE
```

---

# AUTH_REFRESH_TOKENS

Purpose

JWT Refresh.

Fields

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| user_id    | UUID      |
| session_id | UUID      |
| token_hash | TEXT      |
| expires_at | TIMESTAMP |
| revoked_at | TIMESTAMP |

Never store raw token.

Store hash.

---

# AUTH_LOGIN_HISTORY

Purpose

Security.

Fields

| Field        | Type      |
| ------------ | --------- |
| id           | UUID      |
| user_id      | UUID      |
| device_id    | UUID      |
| ip_address   | VARCHAR   |
| login_time   | TIMESTAMP |
| logout_time  | TIMESTAMP |
| login_result | ENUM      |
| reason       | TEXT      |

Enum

```
SUCCESS

FAILED

LOCKED

OTP_FAILED
```

---

# ER Diagram

```
                     AUTH DOMAIN

                 ┌──────────────┐
                 │ auth_users   │
                 └──────┬───────┘
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
 auth_user_roles   auth_sessions   auth_devices
        │               │                │
        ▼               │                ▼
 auth_roles            │         auth_refresh_tokens
        │               │
        ▼               │
auth_role_permissions   │
        │               │
        ▼               │
auth_permissions        │
                        │
                        ▼
               auth_login_history

(auth_otps is independent and linked by mobile/user flow)
```

---

# Domain Relationships

```
AUTH

↓

CUSTOMER

(Admin creates customers)

────────────────────────

AUTH

↓

SALES

(User creates orders)

────────────────────────

AUTH

↓

WAREHOUSE

(User loads dispatch)

────────────────────────

AUTH

↓

ACCOUNTING

(User generates invoice)

────────────────────────

AUTH

↓

AUDIT

(All actions recorded)
```

Every domain references

```
created_by

updated_by
```

which points to

```
auth_users.id
```

---

# Enums

## UserStatus

```
ACTIVE

INACTIVE

SUSPENDED

LOCKED
```

---

## SessionStatus

```
ACTIVE

EXPIRED

LOGGED_OUT

REVOKED
```

---

## OTPStatus

```
PENDING

VERIFIED

EXPIRED

FAILED
```

---

# One important architectural change from our earlier discussion

After revisiting all our previous conversations, I would **not** keep customers inside the Auth Domain.

Initially, it seems tempting because both employees and customers log in with OTP.

However, their responsibilities are fundamentally different:

* **Internal Users** (Admin, Salesman, Driver, Warehouse, Accountant) are system operators. They need roles, permissions, sessions, devices, and audit.
* **Customers** are business entities. Their identity is tied to a customer ledger, GST, addresses, price lists, assigned salesman, and business relationships.

So I recommend two separate identity models:

```
AUTH DOMAIN
────────────
auth_users
(authenticate employees)

CUSTOMER DOMAIN
───────────────
customers
(customer business identity)

customer_auth
(customer login credentials & OTP state)
```

Both can use the same OTP service, but they remain separate aggregates. This separation will make permissions, APIs, Tally synchronization, and future B2B customer features much cleaner and aligns with the domain model we've developed throughout our discussions.
