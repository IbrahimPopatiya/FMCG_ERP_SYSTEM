# UI/UX Requirements Document
## Distribution Management System (DMS) — Frontend Design Brief

This document is for our UI/UX designer. It explains, in plain language, what we are building, who will use it, and what the screens need to look and feel like. Please create 2-3 design variations based on this brief so we can pick one direction to move forward with.

---

## 1. What This Application Is

This is a Distribution Management System for an FMCG (fast-moving consumer goods) distribution business. It handles the full flow of a distributor's daily work: managing products, taking orders from shops/customers, approving and delivering those orders, billing, collecting payments, and handling returns.

---

## 2. Who Will Use This Application

There are two broad groups of users, and they need different experiences:

### Group A: Customers (Shop Owners)
- These are the shopkeepers/retailers who buy products from the distributor.
- They will use the app mainly to **browse products and place orders**.
- They will almost always use this on their **mobile phone**.
- Many may not be very tech-savvy — the ordering flow must be extremely simple.

### Group B: Internal Staff (Admin, Sales, Manager, Dispatcher, Cashier, Driver)
- These are our own team members who run the business day to day.
- Their work includes: managing the product catalog, managing customers, approving orders, tracking deliveries, generating invoices, collecting payments, and handling returns.
- They will use this app on **both mobile phones and desktop/laptop computers**, depending on the role and where they are (e.g., a salesman on the move vs. an admin sitting at a desk).

---

## 3. Overall Design Approach

### 3.1 Mobile-First, But Not Mobile-Only
- The app must work and look great on a phone, since that is how most people — especially customers and field staff — will use it.
- On a **desktop/laptop screen**, we want to make good use of the extra space — e.g., showing a dashboard with summaries, charts, and more information at once.
- On a **mobile screen**, we want to keep things minimal — e.g., the dashboard/summary view can be simplified or hidden, and the focus should be on quick actions (place an order, check an order status, approve something).

### 3.2 Keep It Simple — No Fancy Extras (For Now)
We are intentionally keeping the first version simple. Please do **not** design for:
- Live GPS tracking maps
- Camera/photo capture features
- Complex animations or heavy graphics
- Anything that requires special phone permissions

Focus purely on clean, simple, functional screens that are easy to use.

### 3.3 Professional and Clean
- The look and feel should be **professional and business-like** — this is a B2B/trade tool, not a consumer lifestyle app.
- Avoid clutter. Avoid unnecessary colors, icons, or decorations that don't serve a purpose.
- Use a simple, limited color palette (a primary brand color, plus neutral grays, plus clear red/green for errors/success).
- Text should be easy to read — good font size, especially important since many users will use this on a small phone screen, possibly in bright sunlight (shop environments).

---

## 4. Navigation — Keep It Easy to Find Things

- Every screen should make it obvious **where the user is** and **how to get back**.
- Use a simple, consistent navigation pattern:
  - On mobile: a bottom navigation bar or a simple hamburger menu with few, clearly labeled options.
  - On desktop: a left-side menu that stays visible.
- Avoid deep menus — a user should never need more than 2-3 taps/clicks to reach any common action.
- The most frequently used actions (e.g., "Place Order" for customers, "New Order"/"Approve Orders" for sales staff) should be front and center, not buried in menus.

---

## 5. Priority Screens — Design These with Extra Care

Two flows matter the most and deserve the most design attention:

### 5.1 Product Management (Internal Staff)
Used by admin/staff to view, add, and edit products.
- A clean list/grid of products, with search and simple filters (by category, brand, status).
- Simple, clearly labeled forms to add or edit a product (name, SKU, category, brand, price, GST rate, stock unit, etc.) — no overwhelming, over-long forms. Group related fields together.
- Clear indication of stock status (e.g., low stock, out of stock) using color or simple tags — not complicated charts.
- This screen will mostly be used on desktop, but should still work reasonably on a tablet/phone for quick checks.

### 5.2 Customer Ordering Flow (Customers, Mobile-First)
This is the most important flow in the whole app, since customers will use it the most, and it must be foolproof simple.
- **Step 1 — Browse Products:** Simple product listing with images (if available), name, price, and pack size. Easy search and category filters. Big, clear "Add to Order" buttons — this must work well with a thumb on a small screen.
- **Step 2 — Review Order (Cart):** A simple summary screen showing what's been added, quantity adjustments (simple +/- buttons), and a running total. Easy to remove items.
- **Step 3 — Confirm Order:** One clear "Place Order" button. Show a simple order summary before confirming (no surprise steps).
- **Step 4 — Confirmation & Order Status:** A simple confirmation screen after placing the order, and a simple way to check status later (e.g., Pending, Approved, Out for Delivery, Delivered).
- Throughout this flow: minimize typing, favor tapping/selecting. Avoid multi-page long forms. The customer should be able to place a repeat order in under a minute.

---

## 6. Other Core Screens (Design Simply, Following the Same Principles)

These don't need the same level of design exploration as Section 5, but should follow the same clean, simple approach:

- **Login** (staff and customer — simple, single screen, minimal fields)
- **Dashboard** (desktop: shows summary cards/numbers like today's orders, pending approvals, low stock alerts; mobile: simplified or hidden, replaced by quick action buttons)
- **Order Management** (list of orders with status, simple filters, tap/click to view details and approve/reject)
- **Customer Management** (list of customers, simple add/edit form)
- **Delivery Tracking** (simple list — no maps — showing delivery status: Pending, Out for Delivery, Delivered, Failed)
- **Invoices** (simple list, view/download invoice, clear payment status tag: Unpaid/Partial/Paid)
- **Payments** (simple list of payments received, simple form to record a payment)
- **Returns & Credit Notes** (simple list and simple approve/reject actions)

---

## 7. Responsive Behavior Summary (Please Follow This Rule Consistently)

| Element | Mobile View | Desktop View |
|---|---|---|
| Dashboard/summary widgets | Hidden or minimized, replaced with quick action buttons | Full dashboard with cards/summary numbers |
| Navigation | Bottom bar or simple menu | Left-side persistent menu |
| Data tables (e.g. product/order lists) | Simplified list/card view | Full table with more columns visible |
| Forms | One field per row, large touch-friendly inputs | Can use multi-column layout for related fields |

---

## 8. What We'd Like From the Designer

- Please prepare **2-3 different visual style directions** (e.g., different color schemes, layout styles, typography choices) for the following screens, in both mobile and desktop sizes:
  1. Customer ordering flow (product browsing → cart → confirm order)
  2. Product management screen (internal staff)
  3. Dashboard (desktop version) and its simplified mobile equivalent
  4. Login screen
- We will review the variations together and choose one direction to apply across the rest of the application.
- Please keep every variation aligned with the principles above: simple, clean, professional, mobile-first, easy navigation.

---

## 9. Non-Goals (Please Do Not Design For These Right Now)

- GPS/map-based delivery tracking
- Camera or photo/document upload features
- Offline mode
- Multi-language support
- Dark mode (unless it comes naturally/easily — not a requirement)

---

*This document describes requirements and intent only — no visual design decisions have been made yet. All final colors, fonts, and layouts are up to the designer to propose within these guidelines.*
