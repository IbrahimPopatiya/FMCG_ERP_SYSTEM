# Driver App Workflow Prompt

## Role

You are a Senior Flutter UI/UX Architect, Product Designer, and Mobile ERP Designer.

Your task is to design a production-ready Driver App for an FMCG Distribution ERP.

The design should look like a premium enterprise application similar to:

- Zoho Inventory
- Odoo Mobile
- Shopify POS
- Oracle Fusion
- SAP Mobile
- Microsoft Dynamics

Do NOT generate simple demo screens.

Everything should look polished and production ready.

---

# Design System

Use Material 3

Primary Color

#0B6B3A

Accent

#FF9800

Background

#F6F8FA

Card Radius

18

Large spacing

Soft shadows

Modern typography

Rounded buttons

Professional icons

Product images

Status chips

Search

Filters

Sticky Bottom Buttons

Responsive Layout

---

# Driver Workflow

Business Flow

Loader

↓

Driver

↓

Customer

↓

Cashier

---

# Screen 1

Driver Dashboard

Display

Good Morning Driver

Today's Summary

• Pending Deliveries

• Completed Deliveries

• Collection Amount

• Return Amount

• Pending Payments

Quick Actions

Today's Orders

Each Order Card contains

Customer Name

Invoice Number

Invoice Date

Delivery Time

Invoice Amount

Item Count

Status Chip

At bottom show TWO buttons

[ Return ]

[ Payment ]

---

# Screen 2

Order Details

Display

Customer Information

Address

Phone

GST Number

Invoice Information

Invoice Number

Order Date

Delivery Date

Product List

Each Product contains

Image

Product Name

Qty

MRP

Selling Price

Total

Bottom Summary

Subtotal

Discount

GST

Grand Total

Sticky Bottom Buttons

Return

Payment

---

# Payment Workflow

Driver clicks Payment.

Open Payment Screen.

Display

Invoice Total

Customer Previous Balance

Received Amount

Remaining Amount

Payment Methods

Cash

UPI

Cheque

Driver can enter

Cash only

UPI only

Cheque only

Cash + UPI

Cash + Cheque

UPI + Cheque

All Three

System automatically calculates

Total Received

Remaining Amount

If Remaining Amount > 0

Automatically add remaining amount to Customer Balance.

Example

Invoice

₹1800

Cash

₹1000

UPI

₹500

Cheque

₹0

Received

₹1500

Remaining

₹300

Customer Balance

Old ₹1200

New ₹1500

Approve Payment

Success Screen

Payment Successful

Payment Breakdown

Cash

UPI

Cheque

Remaining Added

Sync to Cashier

---

# Return Workflow

Driver clicks Return.

First screen shows

Take Product Photo

Large Camera Button

Driver captures product image.

Backend performs

AI Product Detection

Search all customer orders

Find matching product

Check return policy

Check already returned quantity

If eligible

Display

Invoice Number

Purchase Date

Purchased Qty

Already Returned

Allowed Return Qty

Driver enters Return Quantity.

Click Add Return.

Can add multiple products.

Bottom Summary

Total Return Amount

Continue to Payment

---

# Return Payment

Example

Invoice Total

₹1800

Return Amount

₹300

Final Amount

₹1500

Display

Original Total

Return Deduction

Final Payable

Driver enters

Cash

UPI

Cheque

Approve

Sync to Cashier

---

# Data Sent to Cashier

Send

Customer

Invoice

Driver

GPS

Timestamp

Payment

Cash

UPI

Cheque

Remaining Balance

Return Images

Returned Products

Return Qty

Return Amount

Status

Everything syncs instantly.

---

# UI Components

Use

Modern Cards

Summary Cards

Search

Filters

Timeline

Status Chips

Floating Action Button

Confirmation Dialog

Loading State

Success Animation

Error State

Empty State

Professional Product Cards

Responsive Layout

---

# Deliverables

Generate

Complete User Flow

Information Architecture

Wireframes

High Fidelity UI

Flutter Widgets

Flutter Folder Structure

Reusable Components

Riverpod State Management

API Structure

Material 3 Theme

Navigation Flow

Production Ready Flutter UI

Do not skip any screen.

Every screen should feel enterprise-grade and suitable for a commercial FMCG distribution company.