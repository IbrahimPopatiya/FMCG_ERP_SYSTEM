# Loading Supervisor App - Implementation Prompt




Design an enterprise-grade Loading Supervisor module for FMCG DMS based
on the provided reference.

## Mobile Workflow

1.  Dashboard
2.  Orders (Pending/Loading/Loaded)
3.  Multi-select Orders
4.  Vehicle Assignment with capacity validation
5.  Create Trip
6.  Start Loading
7.  Product Checklist with checkbox, qty edit, barcode scan,
    shortage/damage reason
8.  Loading Complete -\> Out for Delivery
9.  Driver automatically receives trip
10. Purchase Receiving


### Dashboard

KPIs: Total Orders, Total LC, Assigned LC, Loaded LC. Today's Trips,
Pending Orders, Quick Actions.

### Orders

Checkbox list, LC, filters, search.

### Vehicle

Show capacity gauge, available capacity, assigned driver.

### Trip

Driver, vehicle, route, selected orders, LC summary.

### Loading

Large product cards, image, SKU, ordered qty, loaded qty, +/- editor,
checkbox.

### Purchase Receiving

Supplier, barcode scan, received qty, damaged qty, shortage, photos.

## Desktop

Left sidebar, top appbar. Three-panel layout: Orders \| Loading
Checklist \| Vehicle/Trip Summary. Data tables, sticky action buttons,
responsive cards.

## UI

Green (#0B6B3A), white, rounded cards, Inter font, soft shadows,
Figma-quality. Blinkit/Zepto inspired enterprise ERP.

## Interactions

Real-time status updates: Pending→Assigned→Loading→Loaded→Out for
Delivery→Delivered. Capacity validation. Driver sync after trip
creation. Audit logs. Offline support.
