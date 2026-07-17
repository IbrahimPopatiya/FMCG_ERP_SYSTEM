Yes. This actually makes the system much cleaner. What you've described changes the business model from Salesman-driven Ordering to Customer-driven Ordering with Salesman Assistance.

That is a much better architecture.

I would redesign Phase 1 around this idea.

Phase 1 Actors

Instead of focusing on employees, focus on who creates information.

Customer
        │
        │
Salesman (optional)
        │
        ▼
Order
        │
        ▼
Sales Manager/Admin
        │
        ▼
Dispatch Planning
        │
        ▼
Warehouse Loading
        │
        ▼
Dispatch Locked
        │
        ▼
Accountant
        │
        ▼
Generate Invoice in Tally
        │
        ▼
Invoice Sync
        │
        ▼
Customer

Notice there is only one Order.

The only difference is who created it.

Two Ways an Order Can Be Created
Method 1 (Preferred)

Customer creates order.

Customer App

↓

Browse Products

↓

Add Cart

↓

Submit Order

Order Source

CUSTOMER
Method 2

Salesman visits customer.

Customer says

"I don't know how to use the app."

Salesman opens Salesman App.

Chooses customer.

Creates order.

Salesman

↓

Select Customer

↓

Create Order

↓

Submit

Order Source

SALESMAN

Backend stores

Created By

Customer

or

Salesman

Everything else remains exactly the same.

Customer Assignment

Every salesman has assigned customers.

Salesman Rahul

↓

ABC Traders

XYZ Traders

PQR Stores

Salesman can only

View assigned customers
Create orders for assigned customers
View their order history
View outstanding
View collections

He cannot access customers belonging to another salesman.

This is a permission rule, not just a UI filter.

Updated Phase 1 Flow
             CUSTOMER APP
                    │
     ┌──────────────┴──────────────┐
     │                             │
Customer places order      Salesman creates order
(if using app)             (on behalf of customer)
     │                             │
     └──────────────┬──────────────┘
                    │
             Order Created
                    │
                    ▼
          Pending Approval
                    │
                    ▼
       Sales Manager / Admin
                    │
     ┌──────────────┴──────────────┐
     │                             │
   Reject                     Approve
                                    │
                                    ▼
                         Wait for Vehicle
                                    │
                                    ▼
                        Warehouse Loading
                                    │
               Loader adjusts quantities
                Add / Remove / Replace
                                    │
                                    ▼
                        Dispatch Completed
                                    │
                                    ▼
                   Accountant Verification
                                    │
                                    ▼
                    Generate Invoice in Tally
                                    │
                                    ▼
                Invoice + Stock + Ledger Updated
                                    │
                                    ▼
               Invoice synced to Customer App
I would also add Order Source

Every order should have

Order ID

Customer

Salesman

Order Source

Created By

Created Time

Status

Example

Order #1001

Customer
ABC Traders

Salesman
Rahul

Source
Customer App

Status
Loading

Another

Order #1002

Customer
XYZ Traders

Salesman
Rahul

Source
Salesman App

Status
Pending Approval

This becomes useful for analytics.

You can answer questions like

How many orders are customers placing themselves?
Which salesmen still create most orders?
Which customers need training to use the app?
Customer App Should Not Stop at Ordering

Most people think the customer app only places orders.

Actually it becomes a self-service portal.

Customer can

✓ Browse Products

✓ Live Prices

✓ Offers

✓ New Arrivals

✓ Place Orders

✓ Repeat Previous Order

✓ Track Order

✓ Download Invoice

✓ View Ledger

✓ Outstanding

✓ Credit Limit

✓ Payment History

✓ Notifications

This reduces phone calls dramatically.

Salesman App

Notice how the salesman app becomes different from the customer app.

It is more of a CRM.

Today's Visits

Assigned Customers

Create Order

Outstanding

Collections

Customer Details

Call Customer

GPS Check-in (Later)

Visit Notes (Later)

So even though both can create orders, the apps serve different purposes.

My suggestion for Phase 1 Modules

Instead of thinking in terms of screens, think in terms of business modules.

Module 1
Authentication

↓

Module 2
Customer Management

↓

Module 3
Product Catalog

↓

Module 4
Order Management

↓

Module 5
Approval Workflow

↓

Module 6
Vehicle Planning

↓

Module 7
Loading & Dispatch

↓

Module 8
Tally Invoice Integration

↓

Module 9
Customer Tracking

↓

Module 10
Reports

This is how enterprise software is planned. Screens are simply interfaces built on top of these business modules.

I also recommend slightly refining one requirement before development begins:

Instead of "Phase 1" meaning "Customer Ordering App," define it as "Order-to-Invoice Digitalization."

That means the complete first release covers the entire business process:

Customer/Salesman creates the order.
Admin approves it.
Warehouse prepares and adjusts the dispatch.
Accountant generates the invoice in Tally with one click.
Invoice and status sync back to the customer.

That is a complete, measurable workflow that eliminates duplicate work while leaving Tally as the accounting system. It provides immediate business value without forcing the client to change their existing financial processes.