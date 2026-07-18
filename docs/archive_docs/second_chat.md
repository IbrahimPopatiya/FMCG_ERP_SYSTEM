i want you to  clarify my doubt. we have build pase 1 or 2 so can we directly from our  system can connect tally? if user  gives order and approved by admin/salesman then automatically stock can updated in tally? or we need to genrate bill and then manually do in tally?


This is one of the most important architectural decisions. The short answer is:

Yes, you can connect directly to Tally. You do not need someone to manually enter the same order into Tally, provided you build the integration correctly.

However, there are different levels of integration.

Option 1: Order Only (Recommended for Phase 1)

Workflow:

Customer App

↓

Place Order

↓

Your Database

↓

Admin Reviews

↓

Approved

At this point nothing goes to Tally yet.

The warehouse prepares the order.

When the order is actually ready to invoice,

Approved

↓

Generate Sales Invoice in Tally

↓

Tally reduces stock

↓

Invoice Number returned

↓

Sync invoice back to your app

Here, Tally automatically updates inventory because inventory changes when a Sales Invoice is created.

This is the safest approach.

Option 2: Create Sales Order in Tally

Many businesses use Sales Orders before invoicing.

Workflow

Customer

↓

Order

↓

Approved

↓

Create Sales Order in Tally

↓

Warehouse loads

↓

Convert Sales Order

↓

Sales Invoice

↓

Stock Updated

This is even better because Tally knows which stock is reserved.

If your client already uses Sales Orders in Tally, this is the ideal integration.

Option 3: Direct Invoice Creation

Workflow

Customer

↓

Order

↓

Approved

↓

Your backend sends XML

↓

Tally creates Invoice

↓

Stock reduced

↓

Ledger updated

↓

GST updated

No manual work.

Your backend simply tells Tally:

Create Invoice

Customer = ABC Traders

Item A = 10

Item B = 5

GST = 18%

Discount = 2%

Tally generates the invoice exactly as if the accountant had entered it manually.

How does Tally reduce stock?

A common misunderstanding is:

"Can I update stock directly?"

Technically yes.

But you should not.

A normal distributor's stock changes because of business transactions, not because someone edits stock quantities.

For example:

Purchase Invoice
        +
Sales Invoice
        +
Stock Journal
        +
Physical Stock Adjustment

These transactions affect stock.

You should avoid directly modifying stock quantities.

Instead, create the appropriate transaction (such as a Sales Invoice), and Tally updates stock automatically.

Example

Suppose Tally has

Pepsi 250ml

Current Stock

500 bottles

Customer orders

100 bottles

Your app approves the order.

Your backend sends this to Tally:

Sales Invoice

Customer

ABC Traders

Item

Pepsi

Qty

100

Rate

20

Tally saves it.

Stock automatically becomes

400 bottles

Your app then syncs back

Invoice No

SI-2026-155

PDF

Outstanding

Remaining Stock

No manual intervention.

But what if the warehouse finds only 90 bottles?

This is why you should not create the invoice immediately after approval.

A better workflow is:

Customer Order

↓

Approved

↓

Warehouse Loading

↓

Actual Loaded Quantity

↓

Create Invoice in Tally

↓

Stock Reduced

Suppose the customer ordered

Pepsi 100

Coke 50

Warehouse loads

Pepsi 90

Coke 50

Now send 90 Pepsi and 50 Coke to Tally.

The invoice matches reality.

Who should generate the invoice?

Your application or Tally?

Think of it this way:

Your App

↓

Sends invoice data

↓

Tally

↓

Generates official invoice

↓

Returns invoice number

So Tally is still generating the invoice.

Your application is only triggering that process programmatically.

This keeps GST, ledger, stock valuation, and accounting consistent.

Where does the XML come in?

Your backend sends a request like this:

Your Backend

↓

XML Request

↓

Tally

↓

Creates Voucher

↓

Returns Success

Something conceptually like:

<SalesInvoice>
    Customer : ABC Traders
    Item : Pepsi
    Qty : 100
    Rate : 20
</SalesInvoice>

Your backend doesn't simulate keyboard input. It uses Tally's XML interface.

Can invoices be created automatically?

Yes.

Customer Order

↓

Approved

↓

Loading Completed

↓

Backend calls Tally

↓

Invoice Generated

↓

Stock Updated

↓

Ledger Updated

↓

Customer gets notification

No accountant needs to re-enter the invoice.

What if Tally is closed?

This is an important edge case.

Order Approved

↓

Send to Queue

↓

Try Tally

↓

Failed?

↓

Retry after 5 minutes

↓

Success

Never lose orders.

This is why a queue (BullMQ, RabbitMQ, etc.) is recommended instead of making Tally calls directly from the API request.

What if Tally is offline for a whole day?

Your system should continue working.

Orders

✓ Stored

↓

Warehouse

✓ Works

↓

Driver

✓ Works

↓

Queue

↓

Waiting

↓

Tally comes online

↓

Automatically sync all pending invoices

No data loss.

My recommendation

I would not create invoices immediately after order approval.

Instead, I would use this lifecycle:

Customer places order
        ↓
Salesman/Admin approves
        ↓
Warehouse verifies stock
        ↓
Loading completed
        ↓
Final quantities confirmed
        ↓
Backend automatically creates Sales Invoice in Tally
        ↓
Tally updates:
    • Inventory
    • Customer Ledger
    • GST
    • Outstanding Amount
        ↓
Invoice number and PDF sync back to your application

This mirrors how most FMCG distributors operate. It also minimizes discrepancies between ordered quantities and dispatched quantities while allowing Tally to remain the financial and inventory source of truth until your ERP is mature enough to take over.