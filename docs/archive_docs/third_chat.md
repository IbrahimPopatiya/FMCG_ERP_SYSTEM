Actually, this is better than what we assumed earlier. It means you don't have to fight against their existing workflow—you should digitize it first.

From what you've described, their current business process is:

Salesman
     │
     │ Takes order
     ▼
Order Sheet
     │
     ▼
Wait for vehicle assignment
     │
     ▼
Warehouse loads truck
     │
     ├── Increase some items
     ├── Decrease some items
     ├── Remove unavailable items
     ▼
Final Loaded Order
     │
     ▼
Accountant
     │
     ▼
Generate Invoice in Tally
     │
     ▼
Stock Updated

Notice something important:

The customer's original order is NOT the final invoice.

The loaded quantity becomes the invoice.

This is exactly how many FMCG distributors work.

This changes how we should design our application

Instead of thinking

Order
    ↓
Invoice

Think

Order
    ↓
Approval
    ↓
Loading
    ↓
Final Loaded Order
    ↓
Invoice

These are four different business entities.

I would never overwrite the customer's order.

Suppose the customer orders:

Pepsi          10
Coke           20
Sprite         15

Warehouse only has:

Pepsi          8
Coke           20
Sprite         0

And loader adds

Mountain Dew   5

The final dispatch becomes

Pepsi          8
Coke           20
Mountain Dew   5

If you overwrite the original order, you've lost what the customer actually requested.

Instead, keep both.

Customer Order

Pepsi      10
Coke       20
Sprite     15

Dispatch

Pepsi      8
Coke       20
Mountain Dew 5

Invoice

Pepsi      8
Coke       20
Mountain Dew 5

Now you can even show the customer:

"Sprite was unavailable."

This means your Order model should look like this

Instead of

Order

Items

Think

Order

↓

Order Items

↓

Dispatch Items

↓

Invoice Items

Example

Order
----------------
Order No
Customer
Status
Order Item

Pepsi

Ordered Qty = 10
Dispatch Item

Loaded Qty = 8

Reason = Out of Stock
Invoice Item

Invoice Qty = 8

Much more flexible.

What should the Loading Supervisor screen do?

Instead of editing the order directly,

he should see

Ordered

Pepsi      10

Loaded

[ 8 ]

Difference

-2

Reason

Out of Stock

or

Ordered

Pepsi      10

Loaded

[12]

Difference

+2

Reason

Promotion

Now every change is recorded.

Then what goes to Tally?

Only the Dispatch Items.

Customer Order

↓

Loading Complete

↓

Dispatch Locked

↓

Send Dispatch to Tally

↓

Tally creates Invoice

↓

Stock reduced

↓

Invoice Number returned

Exactly what the accountant does today—but automatically.

So do we even need the accountant?

Initially, yes.

Not because Tally requires it, but because the business trusts the accountant to verify invoices.

A good Phase 1 workflow would be:

Loading Completed

↓

Accountant Dashboard

↓

Review Dispatch

↓

Click

Generate Invoice

↓

Backend sends to Tally

↓

Invoice Created

↓

Invoice synced back

The accountant still has control, but they no longer type the invoice manually.

Instead of 10–15 minutes of data entry, it becomes a 10-second verification.

Later (Phase 3 or 4)

Once the client trusts the system:

Loading Completed

↓

Auto Generate Invoice

↓

Tally

↓

Invoice Ready

↓

Customer gets PDF

No accountant intervention required unless there's an exception.

I would also introduce a new concept: "Dispatch"

Your business objects become:

Customer Order
        │
        ▼
Approved Order
        │
        ▼
Dispatch
        │
        ▼
Invoice
        │
        ▼
Delivery
        │
        ▼
Collection

Every stage has a different owner:

Salesman → Order
Admin/Sales Manager → Approval
Warehouse → Dispatch
Accountant → Invoice
Driver → Delivery
Cashier → Collection

This maps almost perfectly to their existing business.

This is what I would pitch to the client

I would not say:

"We are replacing Tally."

I would say:

"Nothing changes in your current process. Your accountant will still generate invoices in Tally. The only difference is that instead of typing every item manually, our system prepares the final dispatch. The accountant reviews it and clicks Generate Invoice. Tally creates the invoice automatically with the exact loaded quantities. Your inventory, ledger, GST, and billing remain exactly as they work today."

That approach is much easier for a business owner to accept because you're removing repetitive work without changing their trusted accounting system. Once they've used this successfully for a few months and gained confidence, you can gradually automate more of the process and eventually consider replacing Tally only if there's a clear business benefit.