These are exactly the kinds of questions that shape a good ERP. I actually want you to challenge every assumption because we're not designing for "correct software"; we're designing for how this distributor actually operates.

After hearing your scenario, I would change one of my earlier recommendations.

Question 1: Should Order be editable after approval?

Initially I said No.

After understanding your business better, my answer becomes:

Yes, but under controlled rules.

The reason is that approval does not mean warehouse starts immediately.

Example:

Monday

Customer places order

↓

Admin approves

↓

Truck available on Wednesday

On Tuesday the customer calls:

"Please add 5 cartons of Coke."

This is completely normal in FMCG.

So we shouldn't lock the order immediately.

I think we need to redefine what "Approved" means.

Currently we assumed:

Pending

↓

Approved

↓

Loading

I don't think that's enough.

Instead:

Pending

↓

Approved

↓

Planned

↓

Loading Started

↓

Loading Completed

Now the rules become much clearer.

Pending

Can edit?

✅ Yes

Who?

Customer
Salesman
Admin
Approved

Can edit?

✅ Yes

Who?

Salesman
Admin

(Customer maybe through edit request, depending on business.)

Planned (Truck Assigned)

Can edit?

✅ Yes

But...

Every edit must notify warehouse.

Because truck planning may change.

Loading Started

Now things change.

Can edit?

⚠️ Maybe

Small changes only.

Because loaders are already picking goods.

Loading Completed

Can edit?

❌ No

Now dispatch is locked.

Invoice comes next.

I think Loading Started should be the true lock point, not Approval.

But I wouldn't overwrite the order.

This is very important.

Instead of

Order

Pepsi = 10

↓

Edit

Pepsi = 15

I'd do

Order

Version 1

Pepsi = 10

↓

Salesman edits

↓

Version 2

Pepsi = 15

Only Version 2 is active.

Version 1 remains in history.

Why?

Because later the client may ask:

"Who added those 5 cartons?"

You'll know.

Question 2

Who should be allowed to add products during loading?

This is actually a business policy question.

Let's examine each role.

Salesman

Should he add items?

I think

Yes.

Why?

Customer called him.

Customer trusts him.

He knows what customer wants.

Admin

Should Admin add items?

Definitely yes.

Admin should always have override permissions.

Loading Supervisor

This one is tricky.

Let's think.

Warehouse receives

Pepsi 10

Coke 20

Loader notices

Truck has empty space.

Should loader decide

"Let's add 5 cartons of Sprite."

I don't think so.

Why?

Loader doesn't know

customer demand
pricing
schemes
customer credit limit

Warehouse shouldn't make sales decisions.

So what should Loading Supervisor do?

Instead of

Add Product

I would create

Suggest Change

Example

Loader sees

Pepsi unavailable

He clicks

Suggest Replacement

↓

Mountain Dew

or

Stock unavailable

↓

Request Approval

Salesman/Admin approves.

Then it becomes part of dispatch.

Better Workflow
Warehouse

↓

Need change

↓

Create Change Request

↓

Salesman/Admin

↓

Approve

↓

Dispatch updated

This keeps warehouse from making business decisions.

But...

There is one exception.

Suppose client says

"Warehouse manager has authority to change."

Then we simply configure permissions.

Instead of hardcoding

Loader

Cannot add.

We create permissions.

Can Edit Dispatch

Can Add Product

Can Replace Product

Can Change Quantity

Can Remove Product

Roles get permissions.

For example

Permission	Salesman	Admin	Loading Supervisor
Increase Qty	✅	✅	Configurable
Decrease Qty	✅	✅	✅
Remove Item	✅	✅	✅
Add New Item	✅	✅	Configurable
Replace Item	✅	✅	Configurable

This is much more flexible.

I think we need another object

After hearing these scenarios, I believe we need one more business object.

Not

Order

↓

Dispatch

But

Order

↓

Order Change

↓

Dispatch

Order Change records

Who changed?

Why?

Old Qty

New Qty

Old Product

New Product

Approved By

Timestamp

Now we have

Order

↓

Version 1

↓

Change

↓

Version 2

↓

Change

↓

Version 3

↓

Dispatch

This is exactly how enterprise ERPs preserve auditability while allowing business flexibility.

My recommendation

I would not allow anyone—including Admin—to directly edit the OrderItem rows after approval.

Instead, I'd expose an "Edit Order" action in the UI that internally creates an Order Change (or a new order revision). The user experiences it as "editing the order," but the system preserves the original values, who made the change, when, and why.

That gives you the flexibility your client needs without sacrificing traceability.

I also think we should do one thing before the Event Storming session:

Create a Business Rules document.

Not technical rules, but operational rules like:

When can an order be edited?
Who can edit it?
When does it become immutable?
Who can change dispatch quantities?
When is a new approval required?
When is Tally allowed to generate an invoice?

These rules become the foundation for permissions, workflows, validation, and event design. Once they're agreed upon, the Event Storming board becomes much clearer and much closer to the client's real-world operations.