# FMCG ERP - SALESMAN MOBILE APPLICATION
## MASTER UI / UX + WORKFLOW PROMPT

You are a Senior Product Designer, Senior Flutter Architect, Enterprise ERP UX Designer and Mobile Application Expert.

Your task is to design a complete Salesman Mobile Application for an FMCG Distribution ERP.

This is NOT a demo application.

It should look like a real enterprise application used by companies such as

• Coca-Cola
• Nestle
• ITC
• Britannia
• Parle
• HUL
• Amul

The UI should look premium, modern, production-ready and consistent across every screen.

The design language must match the attached workflow exactly.

DO NOT redesign using your own style.

Maintain the same spacing, cards, colors, typography, navigation, shadows and layout throughout the application.

------------------------------------

# DESIGN SYSTEM

Use Material 3

Primary Color

#0B6B3A

Secondary

#2E7D32

Accent

#FF9800

Danger

#D32F2F

Background

#F5F7FA

Card Background

White

Radius

18px

Padding

16px

Card Spacing

16px

Button Radius

14px

Soft Shadow

Use professional ERP style

Typography

Modern

Minimal

Large titles

Medium subtitles

Small secondary text

Icons

Outlined Material Icons

Professional illustrations

Rounded cards

Consistent margins

No gradients

No glassmorphism

No neumorphism

No dark mode

No fancy animations

Enterprise UI only.

------------------------------------

# APPLICATION FLOW

Salesman Login

↓

Dashboard

↓

Customer

↓

Take Order

↓

Cart

↓

Order Summary

↓

Place Order

↓

Sync Server

↓

Orders

↓

Order Details

↓

Payment Collection

↓

Reports

------------------------------------

# BOTTOM NAVIGATION

Home

Customers

Take Order

Orders

More

Persistent on every screen.

------------------------------------

# SIDE MENU

Profile

Dashboard

Customers

Orders

Payments

Reports

Stock

Settings

Support

Logout

------------------------------------

# SCREEN 1

HOME DASHBOARD

Purpose

Salesman daily overview.

Header

Good Morning

Profile

Notification

Summary Cards

Today's Orders

Today's Sales

Payment Collected

New Customers

Pending Collection

Outstanding Amount

Today's Visit

Quick Actions

Take Order

Customers

Orders

Reports

Recent Orders

Display

Customer

Date

Amount

Status

Confirmed

Pending

Delivered

Cancelled

Floating Button

Take Order

------------------------------------

User Flow

Open App

↓

Dashboard

↓

Click Customer

↓

Customer Screen

------------------------------------

# SCREEN 2

CUSTOMERS

Display

Search

Filter

Tabs

All

My Customers

Recently Added

Outstanding

Each Customer Card

Logo

Name

Owner

Phone

Address

Outstanding Amount

Last Order

Buttons

Take Order

View Details

Call

Navigate

------------------------------------

# PRIVATE CUSTOMER FEATURE

Very Important

Salesman can create PRIVATE customers.

Admin can see every customer.

Salesman can ONLY see

Customers assigned by Admin

+

Customers created by himself.

Other salesmen MUST NOT see those customers.

Business Rule

Salesman A creates

Patel Retail Store

↓

Saved

↓

Visible only to

Salesman A

Admin

↓

Salesman B

Cannot search

Cannot view

Cannot edit

Cannot take order

Cannot access

Only Admin can reassign customer ownership.

------------------------------------

Button

Add Customer / Party

Bottom Sticky Button

Click

↓

Open Add Customer Screen

------------------------------------

# SCREEN

ADD CUSTOMER

Fields

Customer Name

Owner Name

Mobile

Alternate Mobile

GST

PAN

Address

City

Area

Pincode

Credit Limit

Opening Balance

Payment Terms

Category

Retail

Wholesale

Distributor

Upload Shop Photo

Upload GST

Upload PAN

Location Picker

Save Customer

Business Logic

Click Save

↓

Validate

↓

Create Customer

↓

Assign Owner = Logged Salesman

↓

Visibility

Private

↓

Admin receives notification

↓

Customer appears only inside

My Customers

NOT other salesmen

------------------------------------

# SCREEN

CUSTOMER DETAILS

Display

Profile

Ledger

Outstanding

Credit Limit

Previous Orders

Payment History

Buttons

Take Order

Collect Payment

View Ledger

Edit

------------------------------------

# SCREEN

TAKE ORDER

Display

Selected Customer

Search Products

Categories

Grid Products

Each Product

Image

Name

MRP

Selling Price

Stock

Add Button

Cart Floating Summary

Business Flow

Customer Selected

↓

Search Product

↓

Click Add

↓

Increase Quantity

↓

Update Cart

↓

Cart Amount

Live Update

------------------------------------

# SCREEN

CART

Display

Customer

Products

Qty

Increase

Decrease

Delete

Discount

Scheme

Notes

Subtotal

GST

Grand Total

Bottom Button

Proceed

------------------------------------

Flow

Proceed

↓

Summary Screen

------------------------------------

# SCREEN

ORDER SUMMARY

Display

Customer

Items

Delivery Date

Payment Mode

Notes

Invoice Summary

Discount

GST

Grand Total

Buttons

Edit

Confirm Order

------------------------------------

Business Logic

Click Confirm

↓

Validation

↓

Save Order

↓

Generate Order Number

↓

Sync Server

↓

Success Screen

↓

Open Order Detail

------------------------------------

# SCREEN

ORDER DETAILS

Display

Order Status

Customer

Products

Invoice

Amount

Timeline

Buttons

Duplicate

Print

Share

Collect Payment

------------------------------------

# PAYMENT COLLECTION

Open Payment

Display

Invoice Amount

Outstanding

Received

Remaining

Payment Methods

Cash

UPI

Cheque

Driver enters

Cash

UPI

Cheque

Live Calculation

Remaining

If Remaining

>

0

Move Remaining

Customer Ledger

Save Payment

↓

Sync

↓

Admin

↓

Cashier

↓

Success

------------------------------------

# REPORTS

Daily Sales

Customer Report

Product Report

Collection Report

Outstanding Report

Visit Report

Monthly Sales

Charts

Tables

Export

PDF

Excel

------------------------------------

# OFFLINE MODE

Application works offline.

Orders stored locally.

Internet Available

↓

Auto Sync

No duplicate orders.

------------------------------------

# SEARCH

Every screen supports

Search

Sort

Filter

------------------------------------

# STATUS COLORS

Confirmed

Blue

Delivered

Green

Pending

Orange

Cancelled

Red

Outstanding

Red

Paid

Green

------------------------------------

# COMPONENTS

Use

Summary Cards

Product Cards

Customer Cards

Search Bars

Sticky Buttons

Professional Forms

Confirmation Dialogs

Loading

Skeleton

Empty State

Error State

Bottom Sheets

Modern Tables

Professional Charts

Timeline Cards

------------------------------------

# NAVIGATION FLOW

Home

↓

Customers

↓

Customer Detail

↓

Take Order

↓

Cart

↓

Summary

↓

Confirm

↓

Order Detail

↓

Payment

↓

Reports

------------------------------------

# DELIVERABLES

Generate

1. Complete Information Architecture

2. User Journey

3. Screen Flow

4. Mobile Wireframes

5. High Fidelity UI

6. Production-ready Flutter UI

7. Flutter Widget Tree

8. Folder Structure

9. Riverpod State Management

10. API Integration

11. Database Schema

12. Component Library

13. Material 3 Theme

14. Responsive Layout

15. Complete Navigation

16. Every Button OnClick Flow

17. Validation Rules

18. Error States

19. Loading States

20. Success States

21. Offline Sync Logic

22. Customer Visibility Rules

23. Business Rules

24. Production Quality Screens

------------------------------------

IMPORTANT

The generated design MUST closely match the enterprise workflow style shown in the reference:

• Dark green app bar
• White rounded cards
• Dashboard summary cards
• Large product grid with images
• Bottom navigation
• Professional ERP spacing
• Workflow presentation style
• Clean typography
• Consistent icons
• Premium enterprise mobile UI

Do not redesign with a different visual language.

Maintain the same look and feel across every screen while implementing all workflows and business rules described above.