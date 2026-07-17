# Software Requirements Specification (SRS)
## FMCG Distribution ERP — Phase 1: Order-to-Invoice Digitalization Platform

| | |
|---|---|
| **Document Type** | Software Requirements Specification (SRS) / Business Requirements Document (BRD) |
| **Project** | FMCG Distributor ERP |
| **Phase** | Phase 1 |
| **Version** | 1.0 |
| **Status** | Draft for Client Sign-off |
| **Prepared From** | Full architecture & planning discussions — see `docs/` for design history |

---

## 1. Introduction

### 1.1 Purpose
This document specifies the complete functional and non-functional requirements for Phase 1 of the FMCG Distribution ERP. It is written for the client (business owner), the development team, and any QA/testing resource, so that every party shares one unambiguous definition of what is being built, by whom, and to what standard.

### 1.2 Scope
Phase 1 digitizes the distributor's existing manual order-to-invoice process — currently run over phone/WhatsApp/paper with manual Tally entry — into a connected software platform, **without replacing Tally**. Tally remains the system of record for Inventory, Ledger, GST, and Invoice numbering. This system automates order capture, approval, warehouse dispatch, and invoice generation into Tally, plus delivery and payment collection tracking.

Out-of-scope items for Phase 1 are listed explicitly in Section 8.

### 1.3 Intended Audience
- Client / Business Owner (approval and UAT)
- Project Manager
- Backend, Frontend, and Mobile Engineers
- QA/Test Engineers
- Future engineers onboarding onto the project

### 1.4 Definitions, Acronyms, Abbreviations

| Term | Meaning |
|---|---|
| ERP | Enterprise Resource Planning system (this project) |
| SKU | Stock Keeping Unit — one sellable product variant (e.g. Coca-Cola 250ml) |
| GST | Goods and Services Tax |
| HSN | Harmonized System Nomenclature (tax classification code) |
| OTP | One-Time Password (mobile login) |
| POD | Proof of Delivery |
| Dispatch | The actual goods loaded onto a vehicle, which may differ from what was ordered |
| Trip | A scheduled vehicle journey carrying one or more dispatches |
| Source of Truth | The system whose data is authoritative when systems disagree |

---

## 2. Overall Description

### 2.1 Business Context
The client is an FMCG distributor currently operating on Tally Prime for accounting, with orders taken manually by salesmen over phone/WhatsApp and invoices typed into Tally by an accountant after warehouse loading. This causes duplicate data entry, pricing/stock errors, delayed dispatch, and poor visibility into outstanding payments and order status.

### 2.2 Product Perspective
The platform consists of three client applications and one backend, integrated with the client's existing Tally Prime installation:

| Application | Platform | Primary Users |
|---|---|---|
| Customer Ordering App | Flutter (Android/iOS) | Retailers / Shopkeepers (customers) |
| ERP Mobile App | Flutter (Android/iOS), single app, role-based UI | Salesman, Warehouse Supervisor, Loader, Driver, Cashier |
| Admin Web Dashboard | Web (Next.js) | Admin, Sales Manager, Accountant |
| Tally Prime | Existing, unmodified | Accountant (continues normal use) |

### 2.3 Source-of-Truth Policy (applies to every requirement below)
| Data | Owner in Phase 1 |
|---|---|
| Customer profile, Orders, Dispatch, Delivery, Payment records | This ERP |
| Product/Price catalogue | This ERP |
| Inventory/Stock, Customer Ledger, GST, Invoice numbering | Tally Prime |

### 2.4 Design Principle Governing All Requirements
**The system is a decision-support system, not a decision-making system.** Where a business condition could be "blocked" by software (credit limit exceeded, stock shortage), the requirement is to **raise a visible alert to the relevant human role**, never to automatically reject the transaction, unless a future requirement explicitly states otherwise.

### 2.5 Users / Actor Roles

| Role | Description |
|---|---|
| **Customer** | Retailer/shopkeeper who buys from the distributor |
| **Salesman** | Field staff who manages assigned customers, creates/approves orders |
| **Admin** | Full administrative access, override authority |
| **Sales Manager** | Approves orders, manages salesmen and customer assignment |
| **Warehouse Supervisor / Loader** | Prepares and loads dispatch |
| **Accountant** | Generates invoices in Tally, verifies payments |
| **Driver** | Delivers goods, collects payment, captures proof of delivery |
| **Cashier** | Verifies collected payments |

---

## 3. Functional Requirements

Requirements are grouped by domain/module. Each requirement has an ID, description, and the actor(s) who trigger it. Priority: **M** = Must-have (Phase 1 blocking), **S** = Should-have.

### 3.1 Authentication & Access Control (AUTH)

| ID | Requirement | Actor | Priority |
|---|---|---|---|
| FR-AUTH-001 | The system shall allow internal users (Salesman, Admin, Warehouse, Accountant, Driver, Cashier) to log in using mobile number + OTP. | All internal users | M |
| FR-AUTH-002 | The system shall issue a JWT access token and refresh token on successful login, and support token refresh without re-entering OTP. | System | M |
| FR-AUTH-003 | The system shall support assigning one or more roles to a user. | Admin | M |
| FR-AUTH-004 | The system shall enforce access to every feature and screen through granular permissions (e.g. `order.approve`, `dispatch.edit`), not hardcoded role checks. | System | M |
| FR-AUTH-005 | The system shall track logged-in devices per user and allow logout from a specific device or all devices. | User, Admin | S |
| FR-AUTH-006 | The system shall record every login attempt (success/failure/locked) for security audit. | System | M |
| FR-AUTH-007 | The system shall lock a user's account after a configurable number of failed OTP attempts. | System | S |
| FR-AUTH-008 | The system shall allow an Admin to activate, deactivate, or lock any internal user account. | Admin | M |

### 3.2 Customer Management (CUST)

| ID | Requirement | Actor | Priority |
|---|---|---|---|
| FR-CUST-001 | The system shall allow Admin/Sales Manager to register a new customer with business name, GST, mobile, and address. | Admin | M |
| FR-CUST-002 | The system shall allow a customer to log in to the Customer App using mobile number + OTP, independent of the internal Auth system. | Customer | M |
| FR-CUST-003 | The system shall allow assigning one or more salesmen to a customer, with one marked primary. | Admin, Sales Manager | M |
| FR-CUST-004 | The system shall restrict a salesman to only viewing and creating orders for customers explicitly assigned to them. | System | M |
| FR-CUST-005 | The system shall allow a customer to have multiple addresses (billing, shipping, shop) and multiple contacts. | Admin, Customer | M |
| FR-CUST-006 | The system shall allow assigning a customer to a delivery route and a price list. | Admin | M |
| FR-CUST-007 | The system shall display a read-only credit/outstanding snapshot for each customer, synced from Tally, never editable within the ERP. | System | M |
| FR-CUST-008 | The system shall allow uploading and storing customer KYC documents (GST certificate, PAN, shop license, photos). | Admin | S |
| FR-CUST-009 | The system shall record a business activity log per customer (registered, salesman changed, route changed, etc.). | System | S |

### 3.3 Product Catalogue (CATALOG)

| ID | Requirement | Actor | Priority |
|---|---|---|---|
| FR-CAT-001 | The system shall allow Admin to manage a hierarchy of Company → Brand → Category → Product → SKU. | Admin | M |
| FR-CAT-002 | The system shall treat each sellable variant (e.g. Coca-Cola 250ml) as a distinct SKU, separate from its parent Product. | System | M |
| FR-CAT-003 | The system shall support multiple packing configurations per SKU (e.g. 24 Bottles/Crate, 12 Bottles/Box). | Admin | M |
| FR-CAT-004 | The system shall support multiple price lists, with a specific price list assignable per customer. | Admin | M |
| FR-CAT-005 | The system shall store GST percentage and HSN code per SKU. | Admin | M |
| FR-CAT-006 | The system shall support multiple images per SKU, with one marked primary. | Admin | S |
| FR-CAT-007 | The system shall support barcode(s) per SKU for future scanning use cases. | Admin | S |
| FR-CAT-008 | The system shall allow marking products/SKUs as active, discontinued, featured, new-arrival, or bestseller. | Admin | S |
| FR-CAT-009 | The system shall allow customers to search and filter the catalogue by category, brand, and keyword. | Customer | M |
| FR-CAT-010 | The Catalog domain shall never store stock/inventory quantities — those remain in Tally. | System | M |

### 3.4 Order Management (SALES)

| ID | Requirement | Actor | Priority |
|---|---|---|---|
| FR-SALES-001 | The system shall allow a customer to browse the catalogue, add items to a cart, and place an order from the Customer App. | Customer | M |
| FR-SALES-002 | The system shall allow a salesman to create an order on behalf of an assigned customer. | Salesman | M |
| FR-SALES-003 | The system shall record the source of every order (Customer App or Salesman App) and who created it. | System | M |
| FR-SALES-004 | The system shall calculate price, discount, and GST for every order item server-side, never trusting client-submitted values. | System | M |
| FR-SALES-005 | The system shall not validate stock availability at order placement — stock belongs to Tally and is checked later at dispatch. | System | M |
| FR-SALES-006 | The system shall route every placed order to Pending Approval status. | System | M |
| FR-SALES-007 | The system shall allow Salesman/Admin to approve or reject a pending order, recording who approved it and when. | Salesman, Admin | M |
| FR-SALES-008 | If a customer's outstanding balance exceeds their credit limit, the system shall raise an alert to Salesman and Admin but shall still allow the order to be placed and processed. | System | M |
| FR-SALES-009 | The system shall allow an order to be edited after approval only via a tracked "Order Change" request, never by direct overwrite. | Salesman, Admin, Customer, Warehouse | M |
| FR-SALES-010 | The system shall record who requested a change, the reason (customer request, sales suggestion, promotion, stock issue, correction), and who approved or rejected it. | System | M |
| FR-SALES-011 | The system shall preserve every prior version of an order as an immutable revision, never deleting or overwriting history. | System | M |
| FR-SALES-012 | The system shall prevent any further edits to an order once its associated dispatch has started loading. | System | M |
| FR-SALES-013 | The system shall maintain a timeline of every event on an order (placed, approved, changed, etc.), viewable by authorized roles. | System | M |
| FR-SALES-014 | The system shall allow a customer to view their order history, current order status, and repeat a previous order. | Customer | M |
| FR-SALES-015 | The system shall provide a dashboard of pending, approved, and today's orders for Sales Manager/Admin. | Sales Manager, Admin | S |

### 3.5 Trip & Dispatch Planning (PLANNING)

| ID | Requirement | Actor | Priority |
|---|---|---|---|
| FR-PLAN-001 | The system shall allow Admin/Dispatcher to create a Trip and assign a vehicle, driver, and route to it. | Admin | M |
| FR-PLAN-002 | The system shall allow attaching one or more approved orders to a Trip. | Admin | M |
| FR-PLAN-003 | The system shall maintain a master list of vehicles and drivers with basic details (registration number, capacity, license). | Admin | M |
| FR-PLAN-004 | The system shall maintain delivery routes and the sequence of customers on each route. | Admin | S |
| FR-PLAN-005 | The system shall track a Trip's own lifecycle (Planning, Ready, Loading, Dispatched, Completed) independently of any single order's status. | System | M |

### 3.6 Warehouse Dispatch (WAREHOUSE)

| ID | Requirement | Actor | Priority |
|---|---|---|---|
| FR-WH-001 | The system shall generate a Dispatch record for each order attached to a Trip once loading begins. | System | M |
| FR-WH-002 | The system shall display, for each dispatch item, the originally ordered quantity alongside an editable loaded quantity. | Warehouse | M |
| FR-WH-003 | The system shall require a reason code (out of stock, promotion, substitution, damage, other) whenever loaded quantity differs from ordered quantity. | Warehouse | M |
| FR-WH-004 | The system shall not allow a Loader to unilaterally add or replace items — such changes shall be submitted as a Change Request requiring Sales/Admin approval, unless explicitly permitted by configured permission. | System | M |
| FR-WH-005 | The system shall preserve a full loading history (who changed what quantity, when) per dispatch. | System | M |
| FR-WH-006 | The system shall lock a Dispatch once loading is marked complete, preventing further quantity changes. | System | M |
| FR-WH-007 | The system shall never modify the original Order when dispatch quantities differ — both records remain independently visible. | System | M |

### 3.7 Invoice Generation / Tally Integration (ACCOUNTING & INTEGRATION)

| ID | Requirement | Actor | Priority |
|---|---|---|---|
| FR-ACC-001 | The system shall allow an Accountant to trigger invoice generation for a locked Dispatch with a single action. | Accountant | M |
| FR-ACC-002 | The system shall send the exact loaded quantities (not ordered quantities) to Tally when generating an invoice. | System | M |
| FR-ACC-003 | The system shall never directly modify stock, ledger, or GST records in Tally — it shall only create the standard Sales Invoice transaction, exactly as an accountant would. | System | M |
| FR-ACC-004 | The system shall store the invoice number, invoice date, and invoice PDF returned by Tally, associated with the originating dispatch. | System | M |
| FR-ACC-005 | If Tally is unreachable (closed or offline), the system shall queue the invoice request and retry automatically without losing the request. | System | M |
| FR-ACC-006 | The system shall allow manual retry of a failed invoice sync from the Admin/Accountant dashboard. | Accountant, Admin | M |
| FR-ACC-007 | The system shall sync customer ledger balance and outstanding amount from Tally on a scheduled interval, storing it as a read-only snapshot. | System | M |
| FR-ACC-008 | The system shall notify the customer automatically once an invoice is generated and synced. | System | M |

### 3.8 Delivery (DELIVERY)

| ID | Requirement | Actor | Priority |
|---|---|---|---|
| FR-DEL-001 | The system shall allow a Driver to mark a delivery as Out for Delivery, Delivered, Partial, or Failed. | Driver | M |
| FR-DEL-002 | The system shall allow capturing a customer signature and/or delivery photo as proof of delivery. | Driver | M |
| FR-DEL-003 | The system shall allow retrying delivery after a Failed status without losing the original delivery record. | Driver | M |
| FR-DEL-004 | The system shall keep the delivery status independent of invoice status — a failed delivery shall not delete or affect the invoice or the outstanding amount. | System | M |
| FR-DEL-005 | The system shall allow drivers to record trip-related expenses (fuel, toll, parking). | Driver | S |

### 3.9 Payment Collection (PAYMENT)

| ID | Requirement | Actor | Priority |
|---|---|---|---|
| FR-PAY-001 | The system shall allow recording payment collection via Cash, UPI, or Cheque. | Driver, Cashier | M |
| FR-PAY-002 | The system shall allow attaching a photo (cash) or screenshot (UPI) as collection proof. | Driver, Cashier | M |
| FR-PAY-003 | The system shall require a Cashier/Accountant to verify a collected payment before it is considered final. | Cashier, Accountant | M |
| FR-PAY-004 | The system shall allow one payment to be allocated across multiple outstanding invoices. | Cashier, Accountant | S |
| FR-PAY-005 | The system shall post verified payments back to the Tally ledger as a receipt entry. | System | M |
| FR-PAY-006 | The system shall never allow a Payment record to modify or delete an Invoice — payments only reference invoices. | System | M |

### 3.10 Notifications (NOTIFICATION)

| ID | Requirement | Actor | Priority |
|---|---|---|---|
| FR-NOTIF-001 | The system shall send a notification to the customer when their order is approved, invoiced, and delivered. | System | M |
| FR-NOTIF-002 | The system shall send a notification to the salesman when a new order is placed by their assigned customer. | System | M |
| FR-NOTIF-003 | The system shall support push notification, SMS, and WhatsApp as delivery channels. | System | S |
| FR-NOTIF-004 | The system shall allow a user to view a list of their notifications and mark them as read. | All users | S |

### 3.11 Alerts (ALERT)

| ID | Requirement | Actor | Priority |
|---|---|---|---|
| FR-ALERT-001 | The system shall raise a visible alert (not a block) for: credit limit exceeded, order changed after planning, invoice sync failure, and duplicate order suspicion. | System | M |
| FR-ALERT-002 | The system shall route each alert to the relevant role(s) (e.g. credit alerts to Salesman + Admin). | System | M |
| FR-ALERT-003 | The system shall allow a recipient to acknowledge or resolve an alert. | Salesman, Admin | S |

### 3.12 Audit Trail (AUDIT)

| ID | Requirement | Actor | Priority |
|---|---|---|---|
| FR-AUDIT-001 | The system shall record who performed every create/update/status-change action, when, and the before/after values. | System | M |
| FR-AUDIT-002 | The system shall record the IP address and device used for every sensitive action. | System | S |
| FR-AUDIT-003 | The system shall provide Admin with a searchable audit log by entity or by user. | Admin | S |

### 3.13 Reporting (REPORT)

| ID | Requirement | Actor | Priority |
|---|---|---|---|
| FR-REP-001 | The system shall provide sales reports by customer, product, brand, and vehicle. | Admin, Sales Manager | S |
| FR-REP-002 | The system shall provide a collections report and an outstanding-by-customer report. | Admin, Accountant | S |
| FR-REP-003 | The system shall provide an order pipeline report (pending, approved, dispatched, invoiced, delivered counts). | Admin | S |

---

## 4. Feature List (Product View)

This section restates the requirements above as user-facing features, grouped by application, in the way a product backlog would present them.

### 4.1 Customer Ordering App
1. OTP-based login for registered customers.
2. Browse product catalogue by category/brand, with images, packing, and pricing.
3. Search and filter products.
4. Add products to cart and place an order.
5. Repeat a previous order in one tap.
6. Track current order status in real time (Pending → Approved → Dispatched → Invoiced → Delivered).
7. View and download invoices once generated.
8. View outstanding balance and payment history (read-only, synced from Tally).
9. Receive push/WhatsApp/SMS notifications at key order milestones.
10. Manage notification preferences and app language.

### 4.2 ERP Mobile App (role-based: Salesman / Warehouse / Driver / Cashier)
**Salesman view**
1. View assigned customers and create orders on their behalf.
2. Approve, reject, or request changes to pending/approved orders.
3. View customer outstanding and order history.
4. Receive credit-limit and order-change alerts for their customers.

**Warehouse Supervisor / Loader view**
5. View today's dispatch queue by trip.
6. Enter loaded quantity against ordered quantity per item, with mandatory reason codes for shortfalls.
7. Submit change requests (add/replace/remove item) for Sales/Admin approval.
8. Lock a dispatch once loading is complete.

**Driver view**
9. View assigned trip and delivery sequence.
10. Mark deliveries as Delivered/Partial/Failed, capturing signature/photo proof.
11. Collect cash/UPI/cheque payment and submit for verification.
12. Record trip expenses (fuel, toll, parking).

**Cashier view**
13. Review and verify/reject submitted payment collections.
14. View pending collections summary.

### 4.3 Admin Web Dashboard
1. Full product catalogue management (Company/Brand/Category/Product/SKU/Pricing).
2. Customer management: registration, salesman/route/price-list assignment, document upload.
3. User & role management with granular permission assignment.
4. Order approval queue and order timeline view.
5. Trip planning board: assign vehicles/drivers, attach approved orders.
6. Dispatch/loading review and invoice generation trigger.
7. Invoice sync status monitor with manual retry.
8. Payment verification and collections dashboard.
9. Business alerts dashboard (credit, stock, sync failures).
10. Audit log viewer.
11. Sales, collections, outstanding, and order-pipeline reports.

---

## 5. Key Business Rules (Cross-Cutting)

1. **Tally remains the source of truth** for Inventory, Ledger, GST, and Invoice numbering throughout Phase 1.
2. **No object is ever overwritten into its next stage.** Order → Dispatch → Invoice → Delivery → Payment are always separate, permanent records.
3. **Credit limit and stock shortages are advisory alerts, never automatic blocks.**
4. **All pricing, discount, GST, and credit calculations happen server-side.** The client is never trusted with these values.
5. **An order can be edited after approval, but only through a tracked, approved Order Change — never a silent overwrite.**
6. **A Dispatch is locked once loading is complete; only the Dispatch (not the original Order) feeds the Invoice.**
7. **Every role only sees the data and actions relevant to it**, enforced by granular permissions, not just UI hiding.

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Catalogue browsing and order placement shall respond within 2 seconds under normal load. |
| **Availability** | The backend shall remain operational and continue accepting orders even when Tally is offline; sync resumes automatically when Tally is available. |
| **Offline Support** | Warehouse, Salesman, and Driver mobile flows shall continue to function (queued locally) during temporary loss of connectivity, syncing once reconnected. |
| **Security** | All API traffic shall use HTTPS/TLS. Passwords/tokens are never stored in plaintext. Every endpoint enforces authentication and permission checks. |
| **Data Integrity** | All financially significant transitions (order approval, dispatch lock, invoice generation, payment verification) shall be atomic — partial writes are not acceptable. |
| **Auditability** | Every state-changing action must be traceable to a specific user, timestamp, and before/after value. |
| **Scalability** | The system shall support growth from a single distributor branch to multiple branches/companies without a schema redesign (fields reserved: `branch_id`, `company_id`). |
| **Usability** | Customer-facing screens shall be usable by non-technical shopkeepers with minimal literacy assumptions (icon-first, simple flows). |
| **Localization** | The system shall support a configurable app language per user/customer. |
| **Compatibility** | Mobile apps shall support Android and iOS via a single Flutter codebase. |

---

## 7. Assumptions & Dependencies

- The client's Tally Prime installation supports XML-based API access (or ODBC, as fallback) for the transactions required (Sales Invoice creation, ledger/stock queries).
- The client will provide a stable local network/middleware host through which the Tally XML/ODBC interface can be reached.
- Initial product catalogue and customer master data will be provided by the client for seeding.
- SMS/WhatsApp Business API and push notification provider accounts will be set up by the client or provisioned as part of the project.
- The client will designate at least one pilot customer and one pilot salesman for Sprint 11 (User Acceptance Testing).

## 8. Out of Scope for Phase 1

- Inventory/stock/batch/expiry management within the ERP (remains in Tally).
- Purchase order management and supplier management.
- Full in-house accounting/ledger engine (Tally replacement).
- AI-based demand forecasting, reorder suggestions, and customer churn prediction.
- Multi-branch/multi-company operation (schema reserves fields for it, but workflow is not built in Phase 1).
- Route optimization / GPS-based delivery sequencing (data fields reserved, feature deferred).

## 9. Acceptance Criteria (Phase 1 Sign-off)

Phase 1 is accepted when, for at least one pilot customer and one pilot salesman, the following can be demonstrated end-to-end without manual double-entry:

1. Customer places an order on the mobile app.
2. Salesman/Admin approves it (with at least one demonstrated Order Change after approval).
3. Admin plans a trip with a real vehicle/driver and attaches the order.
4. Warehouse loads the dispatch with at least one demonstrated quantity variance and reason.
5. Accountant generates a real Tally invoice with one click; invoice number and PDF appear in the customer's app.
6. Driver marks the delivery complete with captured proof.
7. Payment is collected, verified, and reflected in the Tally ledger.
8. Every step above is visible in the audit trail and produced the expected notification.

---

## 10. Document Traceability

| Section of this SRS | Source Design Document |
|---|---|
| Business Context, Source-of-Truth Policy | `roadmap_from_first_chat.md`, `second_chat.md` |
| Actor Roles, Order/Dispatch separation | `third_chat.md`, `fourth_chat.md` |
| Functional Requirements structure | `fifth_chat_great_roadmap.md`, `sixth_chat_bussiness_objects.md` |
| Business Rules (Sec. 5) | `nineth_chat_bussiness_rules_doc.md`, `eight_chat_aggregate_boundries_and_ownership.md` |
| State machines behind FR-SALES/WH/DEL requirements | `last_couple_of_chat.md` |
| Use case / endpoint mapping | `13_chat_api_by_domain_usecase.md` |
| Table/field-level detail behind every FR | `database_docs/complete_database_schema.md` |
| Build sequence to satisfy these requirements | `phase_1_roadmap.md` |

This SRS is the requirements contract for Phase 1. Any new feature request during development should be checked against this document first — if it isn't listed here, it is a change request requiring a documented amendment, not an assumed addition.
