# DMS Frontend

Frontend for the Distribution Management System (DMS) — a Next.js app serving two kinds of users:

- **Customers** (shopkeepers) — browse products and place orders, mobile-first.
- **Staff** (admin, sales, manager, dispatcher, cashier, driver) — manage products, customers, orders, deliveries, invoices, payments, and returns, on both mobile and desktop.

See `../UI_UX_REQUIREMENTS.md` for the design brief and `../CLAUDE.md` for team-wide engineering principles (both apply here).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL` to point at the backend.

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/                  # login — bare layout, no nav
│   │   ├── layout.tsx
│   │   └── login/page.tsx
│   │
│   ├── (customer)/              # shopkeeper-facing routes
│   │   ├── layout.tsx           # mobile-first shell: bottom nav, no dashboard
│   │   ├── products/            # browse products
│   │   ├── cart/                # review order before placing it
│   │   ├── orders/               # order history + status
│   │   └── account/
│   │
│   ├── (staff)/                 # internal staff routes
│   │   ├── layout.tsx           # sidebar on desktop, simplified nav on mobile
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── customers/
│   │   ├── orders/
│   │   ├── deliveries/
│   │   ├── invoices/
│   │   ├── payments/
│   │   ├── returns/
│   │   ├── purchases/
│   │   ├── suppliers/
│   │   ├── inventory/
│   │   ├── vehicles/
│   │   └── users/
│   │
│   ├── layout.tsx               # root layout: <html>/<body>, fonts, providers only
│   └── page.tsx                 # redirects to /login, /products, or /dashboard based on session
│
├── proxy.ts                     # route guarding by auth/role (Next.js 16's replacement for middleware.ts)
│
├── components/
│   ├── ui/                      # generic design-system primitives (Button, Input, Card, Badge, Table, Modal)
│   ├── layout/                  # MobileBottomNav, DesktopSidebar, TopBar
│   └── <domain>/                # feature-specific components, e.g. products/ProductCard.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts            # one axios instance — auth header + error interceptor
│   │   └── <domain>.ts          # one file per backend domain (products.ts, orders.ts, ...)
│   ├── auth/
│   │   └── session.ts           # read/store session token, get current role
│   ├── hooks/
│   │   └── use<Domain>.ts       # React Query hooks wrapping lib/api calls
│   └── utils/
│       └── format.ts            # currency, date, status-label formatting
│
└── types/
    └── <domain>.ts              # TS types matching api_reference.md request/response shapes
```

## Conventions

- **Routes stay thin.** A `page.tsx` composes components and calls a `lib/hooks/use<Domain>` hook — no business logic, no raw `fetch`/`axios` inside a page or component. All API calls live in `lib/api/`.
- **One file per backend domain** in `lib/api/`, `lib/hooks/`, and `types/` — mirrors the backend's own domain split, so a new screen's data layer lives where you'd expect.
- **Route groups own layout, not URLs.** `(customer)` and `(staff)` each get their own shell (nav style, what's visible on mobile vs desktop); shared UI still comes from one `components/ui/`.
- **`components/ui/` stays small and boring.** A component only moves there once a second domain genuinely needs it — don't pre-build a generic component library.
- **No `any`.** Every API request/response has a matching type in `types/`.
- **Server state via React Query**, not manual `useEffect` + `useState` fetching, and not a global store (no Redux) — this is the one state-management dependency we add on top of plain React.
- **`proxy.ts` is the only place auth redirects happen** — pages assume they're already authorized to render.

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- Axios + TanStack React Query for data fetching
- ESLint

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
