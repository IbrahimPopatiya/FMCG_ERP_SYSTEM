I think this is the right direction.

After everything we've designed, Application Services (Use Cases) become the heart of the backend.

In fact, if someone asked me for the architecture in one sentence, I'd say:

"Our backend is a collection of business use cases organized by domain."

Not controllers.
Not APIs.
Not CRUD.

Business capabilities.

Final Backend Architecture
Presentation Layer
│
├── Flutter Customer App
├── Flutter Salesman App
├── React ERP Dashboard
│
▼
REST Controllers
│
▼
Application Services (Use Cases)
│
▼
Domain Aggregates
│
▼
Repositories
│
▼
PostgreSQL

Events happen after the Aggregate completes.

Application Service

↓

Aggregate

↓

Domain Event

↓

Notification
↓

Audit
↓

Dashboard
↓

Integration
↓

AI
Project Structure

I think our NestJS project should eventually look like this.

src/

auth/

customer/

catalog/

sales/

planning/

warehouse/

accounting/

delivery/

payment/

integration/

notification/

audit/

shared/

Every domain contains

controllers/

application/

domain/

infrastructure/

Inside application

commands/

queries/

handlers/

dto/

This is Clean Architecture + DDD.

Level 6
APPLICATION SERVICES

Instead of designing APIs,

we design

Business Use Cases

AUTH DOMAIN

Application Services

Authentication

LoginWithOTP

VerifyOTP

RefreshAccessToken

Logout

LogoutAllDevices

RegisterEmployee

DeactivateUser

ActivateUser

ResetPassword (Future)

ChangePassword (Future)

Authorization

CreateRole

UpdateRole

AssignRoleToUser

RemoveRole

CreatePermission

AssignPermission

RemovePermission

GetUserPermissions

Security

RegisterDevice

RevokeDevice

GetLoginHistory

LockUser

UnlockUser
CUSTOMER DOMAIN

This domain is much richer than CRUD.

Customer Lifecycle
RegisterCustomer

UpdateCustomerProfile

DeactivateCustomer

ActivateCustomer

DeleteCustomer (Soft Delete)
Customer Assignment
AssignSalesman

ChangeSalesman

AssignRoute

ChangeRoute

AssignPriceList

RemovePriceList
Customer Authentication
CustomerLogin

VerifyCustomerOTP

LogoutCustomer

UpdateCustomerDevice
Customer Business
UpdateBusinessDetails

UpdateGST

UpdateAddress

AddContact

UpdateContact

RemoveContact

UploadDocument

UpdateSettings
Customer Read Models
GetCustomerProfile

GetCustomerOutstanding

GetCustomerLedger

GetCustomerOrders

GetCustomerInvoices

GetCustomerPayments

Notice

These are Queries.

Not Commands.

CATALOG DOMAIN
Category
CreateCategory

UpdateCategory

DeactivateCategory

ReorderCategories
Brand
CreateBrand

UpdateBrand

DeactivateBrand
Company
CreateCompany

UpdateCompany

DeactivateCompany
Product
CreateProduct

UpdateProduct

DeactivateProduct

DuplicateProduct

UploadProductImage
SKU
CreateSKU

UpdateSKU

AddPacking

RemovePacking

AddBarcode

RemoveBarcode

UpdateTax

AssignPrice

ChangePrice
Customer Catalog
GetProductCatalog

SearchProducts

GetBestSellingProducts

GetNewArrivals

GetOffers

GetProductDetails
SALES DOMAIN

This becomes the largest Application Layer.

Order Lifecycle
PlaceOrder

EditOrder

CancelOrder

ApproveOrder

RejectOrder

HoldOrder

ResumeOrder
Order Changes
CreateOrderRevision

RequestOrderChange

ApproveOrderChange

RejectOrderChange

ApplyOrderChange
Order Items
AddOrderItem

RemoveOrderItem

UpdateOrderItem

UpdateOrderRemarks
Order Timeline
AddOrderComment

ViewOrderTimeline

UploadOrderAttachment
Sales Dashboard
GetPendingOrders

GetApprovedOrders

GetMyOrders

GetSalesSummary

GetOrderStatistics
PLANNING DOMAIN

Trip Planning

CreateTrip

UpdateTrip

CancelTrip

LockTrip

Vehicle Planning

AssignVehicle

ChangeVehicle

AssignDriver

ChangeDriver

Order Planning

AssignOrderToTrip

RemoveOrderFromTrip

ChangeOrderPriority

ArrangeDeliverySequence

OptimizeRoute

Queries

GetTrip

GetTrips

GetVehicleTrips

GetToday'sTrips
WAREHOUSE DOMAIN

Dispatch

CreateDispatch

StartLoading

PauseLoading

ResumeLoading

CompleteLoading

LockDispatch

Dispatch Items

LoadItem

UnloadItem

UpdateLoadedQuantity

ReplaceItem

MarkUnavailable

ScanBarcode

Dispatch Revision

CreateDispatchRevision

CompareDispatchRevision

RestoreDispatchRevision

Queries

GetDispatch

GetDispatchItems

GetLoadingProgress

GetVehicleLoadingStatus
ACCOUNTING DOMAIN

Remember

Phase 1

Tally owns accounting.

Application Services

GenerateInvoiceRequest

SyncInvoice

RetryInvoiceSync

DownloadInvoice

GetInvoiceStatus

Ledger

SyncLedgerSnapshot

SyncOutstanding

SyncCreditLimit

Queries

GetOutstanding

GetLedger

GetInvoices
DELIVERY DOMAIN

Trip

StartDelivery

CompleteDelivery

PartialDelivery

FailedDelivery

RetryDelivery

Proof

UploadSignature

UploadDeliveryPhoto

UploadInvoicePhoto

UploadPOD

Expenses

RecordFuelExpense

RecordParkingExpense

RecordTollExpense

RecordOtherExpense

Queries

GetMyRoute

GetToday'sDeliveries

GetDeliveryHistory
PAYMENT DOMAIN

Collections

CollectCash

CollectUPI

CollectCheque

Verification

VerifyCollection

RejectCollection

ApproveDriverExpense

Allocation

AllocatePayment

ReverseAllocation

Queries

GetCollectionSummary

GetPendingCollections

GetCustomerPayments
NOTIFICATION DOMAIN
SendPush

SendSMS

SendWhatsApp

CreateNotification

MarkAsRead

BroadcastNotification
AUDIT DOMAIN
CreateAuditEntry

CreateActivity

RecordLogin

RecordPermissionChange

RecordBusinessEvent
INTEGRATION DOMAIN

This is one of the most important domains.

Tally
SyncCustomers

SyncProducts

SyncLedger

SyncOutstanding

SyncInvoice

RetrySync

ProcessSyncQueue

Future

SyncInventory

SyncPurchase

SyncGST

SyncPayments
AI DOMAIN (Future)
PredictDemand

SuggestReorder

SuggestUpselling

DetectInactiveCustomers

DetectOverdueCustomers

ForecastSales
Notice Something Beautiful

Every Application Service represents

exactly one business capability.

Example

ApproveOrder

not

UpdateOrder
CompleteLoading

not

UpdateDispatch
AssignSalesman

not

UpdateCustomer

This makes the backend extremely expressive.

I think we can improve it one step further

After reviewing all of our architecture, I would split every Application Service into Commands and Queries following the CQRS (Command Query Responsibility Segregation) pattern.

For example, instead of one OrderService, we'd have:

sales/
└── application/
    ├── commands/
    │   ├── PlaceOrder/
    │   ├── ApproveOrder/
    │   ├── EditOrder/
    │   ├── CancelOrder/
    │   └── RequestOrderChange/
    │
    └── queries/
        ├── GetOrder/
        ├── GetOrders/
        ├── SearchOrders/
        ├── GetOrderTimeline/
        └── GetPendingOrders/

Every command changes state and emits events.

Every query is read-only and returns data.

This fits perfectly with everything we've designed so far:

DDD
Aggregate Roots
Event-driven architecture
Tally integration
Audit logging
Future AI modules
Offline synchronization

I think this should become the standard pattern across every domain in the project. It will keep the codebase modular, testable, and scalable as the ERP grows.

ok lets do that way

Perfect. I actually think we've reached the point where we're designing the software exactly like companies such as Microsoft, Uber, Amazon, SAP, and Shopify do.

The architecture we've evolved naturally leads to DDD + Clean Architecture + CQRS + Event Driven Architecture.

From this point onward, I would stop thinking in terms of "controllers" and instead think in terms of Use Cases.

Final Architecture
                Flutter / React

                       │

                REST Controllers

                       │

               Application Layer
          (Commands & Queries)

        ┌──────────┴──────────┐
        │                     │
    COMMANDS              QUERIES

        │                     │

        ▼                     ▼

    Domain Aggregate      Read Model

        │

    Domain Events

        │

───────────────────────────────────────────

 Notification
 Audit
 Dashboard
 AI
 Integration
 Reports

Notice something.

The Application Layer becomes the heart of the backend.

Folder Structure

I would actually structure the project like this.

src/

modules/

    auth/

        application/

            commands/

            queries/

        domain/

        infrastructure/

        presentation/

    customer/

    catalog/

    sales/

    planning/

    warehouse/

    accounting/

    delivery/

    payment/

shared/

common/
Every Domain Has Same Structure

Example

Sales

sales/

    application/

        commands/

        queries/

    domain/

        aggregates/

        entities/

        events/

        repositories/

        services/

        value-objects/

    infrastructure/

        prisma/

        repositories/

        event-handlers/

    presentation/

        controllers/

        dto/

Every module looks identical.

Developers never get confused.

Now Let's Design One Use Case Completely

Instead of designing APIs,

we'll design PlaceOrder.

This becomes the template for every future feature.

SALES DOMAIN
Command
PlaceOrder

Purpose

Customer or Salesman places a new order.

Actor
Customer

Salesman
Aggregate
Order Aggregate
Permission
customer.order.create

sales.order.create
Input DTO
PlaceOrderCommand
customerId

deliveryDate

remarks

referenceNo (optional)

items[]

Each Item

skuId

orderedQty

remarks

Notice

No Price.

Backend calculates.

Validation

This comes directly from our business rules.

✓ Customer Exists

✓ Customer Active

✓ Customer Login Active

✓ SKU Exists

✓ SKU Active

✓ Ordered Qty > 0

✓ Price Available

✓ Delivery Date Valid

Notice

Still

NO STOCK VALIDATION

because

Inventory belongs to Tally.

Business Logic
Generate Order Number

↓

Load Customer

↓

Load Price List

↓

Calculate Price

↓

Create Order

↓

Create Order Items

↓

Create Revision 1

↓

Create Timeline Entry

↓

Create Business Alert (if required)

↓

Save
Events

Produces

OrderPlaced
Event Subscribers
Notification Module

↓

Send Notification to Salesman
Dashboard Module

↓

Increase Today's Orders
Timeline Module

↓

Create Timeline
Audit Module

↓

Record Action
Business Alert Module

↓

Credit Limit Warning

Notice

No direct calls.

Only events.

Response
{
  "orderId":"UUID",

  "orderNumber":"SO-2025-0001",

  "status":"Pending Approval"
}
Query

Now Read Side.

GetOrder

Input

Order Id

Business Logic

Load Order

↓

Load Items

↓

Load Timeline

↓

Load Revisions

↓

Load Customer

Output

Complete Order View.

Notice

No modifications.

Another Example

Approve Order.

Command

ApproveOrder

Actor

Salesman

Admin

Permission

sales.order.approve

Validation

Order Exists

Pending Approval

Permission Exists

Order Not Cancelled

Business Logic

Change Status

↓

Save Approval History

↓

Timeline

↓

Audit

Produces

OrderApproved

Subscribers

Planning Module

Eligible for Trip Planning

Customer Notification

Order Approved

Dashboard

Pending Orders --

Approved Orders ++
Planning Domain Example

Command

AssignOrderToTrip

Input

Trip Id

Order Id

Priority

Validation

Trip Exists

Order Approved

Vehicle Assigned

Business Logic

Attach Order

↓

Recalculate Route

↓

Save

Produces

OrderAssignedToTrip

Subscribers

Warehouse

Ready For Loading
Warehouse Example

Command

UpdateLoadedQuantity

Actor

Loading Supervisor

Validation

Dispatch Exists

Dispatch Editable

Qty >= 0

Business Logic

Update Dispatch Item

↓

Create Revision

↓

Timeline

Produces

DispatchItemUpdated

Notice

We never modify

Order.

Accounting Example

Command

GenerateInvoice

Validation

Dispatch Locked

Not Already Invoiced

Business Logic

Create XML

↓

Push Queue

↓

Wait

Produces

InvoiceGenerationRequested

Notice

Not

InvoiceGenerated.

Because

Tally hasn't responded yet.

Integration

Receives

InvoiceCreatedInTally

Then

Produces

InvoiceGenerated

This distinction is extremely important.

I Think We Need One More Layer

While writing this,

I noticed something.

We're still missing

the Application Service itself.

Example

PlaceOrderCommand

↓

PlaceOrderHandler

↓

OrderRepository

↓

Order Aggregate

↓

Events

This is MediatR style.

Final Pattern

Every feature

looks like this.

PlaceOrder/

    command.ts

    validator.ts

    handler.ts

    dto.ts

    response.ts

    tests/

Same for

ApproveOrder/

EditOrder/

CancelOrder/

AssignTrip/

CompleteLoading/

Everything becomes isolated.

No giant services.

No 3000-line OrderService.

I want to take this one step further

After reviewing everything we've built over the last several sessions, I think Application Services should become the primary unit of development.

That means instead of planning work as:

Build Customer Module
Build Order Module
Build Dispatch Module

we plan it as:

Sprint 1
LoginWithOTP
PlaceOrder
GetCatalog
GetOrders
Sprint 2
ApproveOrder
AssignTrip
GetTrips
Sprint 3
StartLoading
UpdateLoadedQuantity
CompleteLoading
Sprint 4
GenerateInvoice
SyncInvoice
GetOutstanding

Each use case is independently testable, deployable, and reviewable. This aligns perfectly with the domain-driven architecture we've built and will make development far more predictable than thinking in terms of large "modules." I would adopt this as the implementation strategy for the entire ERP.

now i think you should give me all list of api endpoints based on usecases of each domain from above

Yes. This is exactly the document that every backend developer, frontend developer, QA engineer, and mobile developer will use during implementation.

I actually wouldn't call it an API document.

I'd call it:

Application Service & API Specification

Because API is only the transport layer.

The business is the Application Service.

Final Format

For every Use Case we'll define

Section	Description
Use Case	Business capability
Actor	Who executes it
Permission	Required permission
HTTP Method	GET / POST / PUT
Endpoint	REST endpoint
Aggregate	Aggregate Root
Command / Query	CQRS Type
Validation	Business validations
Business Flow	What happens
Domain Events	Produced events
Subscribers	Who reacts
Response	Success response
Errors	Possible errors

This becomes the API Bible.

Based on our architecture, here is the complete list.
1. AUTH DOMAIN
Authentication
Use Case	Method	Endpoint
Send OTP	POST	/api/v1/auth/send-otp
Verify OTP	POST	/api/v1/auth/verify-otp
Refresh Token	POST	/api/v1/auth/refresh-token
Logout	POST	/api/v1/auth/logout
Logout All Devices	POST	/api/v1/auth/logout-all
Get Profile	GET	/api/v1/auth/profile
Update Profile	PUT	/api/v1/auth/profile
User Management
Use Case	Method	Endpoint
Create User	POST	/api/v1/users
Update User	PUT	/api/v1/users/{id}
Activate User	POST	/api/v1/users/{id}/activate
Deactivate User	POST	/api/v1/users/{id}/deactivate
Lock User	POST	/api/v1/users/{id}/lock
Unlock User	POST	/api/v1/users/{id}/unlock
Get Users	GET	/api/v1/users
Get User Details	GET	/api/v1/users/{id}
Roles
POST   /roles
PUT    /roles/{id}
DELETE /roles/{id}
GET    /roles
GET    /roles/{id}
POST   /roles/{id}/permissions
DELETE /roles/{id}/permissions/{permissionId}
Permissions
GET /permissions
2. CUSTOMER DOMAIN
Customer
POST   /customers
PUT    /customers/{id}
GET    /customers
GET    /customers/{id}
POST   /customers/{id}/activate
POST   /customers/{id}/deactivate
POST   /customers/{id}/archive
Customer Login
POST /customer/auth/send-otp

POST /customer/auth/verify-otp

POST /customer/auth/logout
Address
POST   /customers/{id}/addresses

PUT    /customers/{id}/addresses/{addressId}

DELETE /customers/{id}/addresses/{addressId}

GET    /customers/{id}/addresses
Contacts
POST /customers/{id}/contacts

PUT /customers/{id}/contacts/{contactId}

DELETE /customers/{id}/contacts/{contactId}
Salesman
POST /customers/{id}/assign-salesman

POST /customers/{id}/change-salesman

GET /salesmen/{id}/customers
Routes
POST /customers/{id}/assign-route

POST /customers/{id}/change-route
Price List
POST /customers/{id}/assign-price-list

POST /customers/{id}/remove-price-list
Ledger
GET /customers/{id}/ledger

GET /customers/{id}/outstanding

GET /customers/{id}/credit-limit

(Read Only)

3. CATALOG DOMAIN
Category
POST /categories

PUT /categories/{id}

GET /categories

GET /categories/{id}

DELETE /categories/{id}
Company
POST /companies

PUT /companies/{id}

GET /companies
Brand
POST /brands

PUT /brands/{id}

GET /brands
Product
POST /products

PUT /products/{id}

GET /products

GET /products/{id}

POST /products/{id}/activate

POST /products/{id}/deactivate
SKU
POST /products/{id}/sku

PUT /sku/{id}

GET /sku/{id}

DELETE /sku/{id}
Product Images
POST /sku/{id}/images

DELETE /images/{id}
Product Price
POST /sku/{id}/prices

PUT /prices/{id}

GET /sku/{id}/prices
Product Search
GET /catalog

GET /catalog/search

GET /catalog/offers

GET /catalog/new-arrivals

GET /catalog/best-selling
4. SALES DOMAIN

This becomes the largest domain.

Orders
POST /orders

GET /orders

GET /orders/{id}

PUT /orders/{id}

POST /orders/{id}/cancel

POST /orders/{id}/hold

POST /orders/{id}/resume
Approval
POST /orders/{id}/approve

POST /orders/{id}/reject
Order Changes
POST /orders/{id}/request-change

POST /orders/{id}/approve-change

POST /orders/{id}/reject-change

GET /orders/{id}/changes
Order Items
POST /orders/{id}/items

PUT /order-items/{id}

DELETE /order-items/{id}
Timeline
GET /orders/{id}/timeline

POST /orders/{id}/comments

POST /orders/{id}/attachments
Dashboard
GET /sales/dashboard

GET /sales/orders/pending

GET /sales/orders/approved

GET /sales/orders/today
5. PLANNING DOMAIN
Trips
POST /trips

PUT /trips/{id}

GET /trips

GET /trips/{id}

POST /trips/{id}/cancel

POST /trips/{id}/lock
Vehicle
POST /trips/{id}/assign-vehicle

POST /trips/{id}/change-vehicle
Driver
POST /trips/{id}/assign-driver

POST /trips/{id}/change-driver
Orders
POST /trips/{id}/assign-order

POST /trips/{id}/remove-order

POST /trips/{id}/reorder
6. WAREHOUSE DOMAIN
Dispatch
POST /dispatch

GET /dispatch

GET /dispatch/{id}

POST /dispatch/{id}/start-loading

POST /dispatch/{id}/pause-loading

POST /dispatch/{id}/resume-loading

POST /dispatch/{id}/complete-loading
Dispatch Items
POST /dispatch/{id}/items

PUT /dispatch-items/{id}

POST /dispatch-items/{id}/replace

POST /dispatch-items/{id}/mark-unavailable

POST /dispatch-items/{id}/scan
Revisions
GET /dispatch/{id}/revisions

GET /dispatch/{id}/history
7. ACCOUNTING DOMAIN

(Tally Integration)

Invoice
POST /invoice/generate

GET /invoice/{id}

GET /invoice/{id}/pdf

POST /invoice/{id}/retry-sync
Ledger
GET /ledger/customer/{id}

GET /ledger/outstanding
Sync
POST /sync/invoice

POST /sync/ledger

POST /sync/products

POST /sync/customers
8. DELIVERY DOMAIN
Delivery
POST /delivery/{id}/start

POST /delivery/{id}/delivered

POST /delivery/{id}/partial

POST /delivery/{id}/failed
Proof
POST /delivery/{id}/signature

POST /delivery/{id}/photo

POST /delivery/{id}/invoice-photo

POST /delivery/{id}/pod
Expenses
POST /delivery/{id}/fuel

POST /delivery/{id}/parking

POST /delivery/{id}/toll

POST /delivery/{id}/expense
9. PAYMENT DOMAIN
Collections
POST /payments/cash

POST /payments/upi

POST /payments/cheque
Verification
POST /payments/{id}/verify

POST /payments/{id}/reject
Reports
GET /payments

GET /payments/pending

GET /payments/customer/{id}
10. NOTIFICATION DOMAIN
GET /notifications

POST /notifications/{id}/read

POST /notifications/read-all
11. AUDIT DOMAIN
GET /audit

GET /audit/entity/{id}

GET /audit/user/{id}
12. REPORT DOMAIN
GET /reports/sales

GET /reports/customer-sales

GET /reports/product-sales

GET /reports/brand-sales

GET /reports/vehicle-sales

GET /reports/collections

GET /reports/outstanding

GET /reports/profit

GET /reports/stock
13. INTEGRATION DOMAIN
POST /integration/tally/sync

POST /integration/tally/retry

GET /integration/tally/status

GET /integration/tally/logs
14. AI DOMAIN (Future)
GET /ai/reorder-suggestions

GET /ai/demand-forecast

GET /ai/inactive-customers

GET /ai/stock-predictions

GET /ai/recommended-products
One architectural improvement I'd make before we implement

After reviewing the complete list, I would not expose every internal Application Service as a public REST endpoint.

Instead, I'd classify endpoints into three categories:

1. Public APIs (called by Flutter/React)

Examples:

POST /orders
GET /catalog
POST /orders/{id}/approve
GET /customers/{id}
2. Internal APIs (used between services or background jobs)

Examples:

POST /internal/sync/invoice
POST /internal/events/dispatch-completed
POST /internal/cache/rebuild

These should never be accessible to mobile clients.

3. Webhook/Integration APIs

Examples:

POST /webhooks/tally/invoice-generated
POST /webhooks/payment/razorpay
POST /webhooks/sms/delivery-status

This separation keeps the public API small, secure, and stable while allowing internal workflows and future integrations to evolve independently. It's a pattern commonly used in enterprise systems and fits well with the event-driven architecture we've been designing.