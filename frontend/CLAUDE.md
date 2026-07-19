@AGENTS.md

# CLAUDE.md — Frontend
## Team Guidelines — DMS Web App (Next.js)

This file explains **how we build the frontend** — folder layout, coding style, and the conventions we follow. Read this before writing any UI code. It sits alongside the root `../CLAUDE.md` (which covers the whole project and the backend); everything there about our **core philosophy, git workflow, and PR discipline still applies here**. This file only adds the frontend-specific rules.

For **what** we're building and the exact data shapes, see `../final_docs/`:
- `prd.md` — what the product is and why
- `api_reference.md` — every API, its request and response shape (**this is the source of truth for our TypeScript types**)
- `database_schema_docs.markdown` — entities, enums, relationships

> ⚠️ **This is NOT the Next.js you already know.** See `AGENTS.md` (imported above). We're on **Next.js 16 / React 19** with breaking changes from older versions. Before using any framework API (routing, `fetch`/caching, server vs. client components, metadata, fonts, images, params), read the relevant guide in `node_modules/next/dist/docs/`. Do not rely on training-data memory of Next.js — heed deprecation notices.

---

## 1. Core Philosophy (same as root)

- **Keep it simple. Don't overengineer.** Build the screen in front of you, not an imagined design system. No abstractions "just in case."
- **Clean over clever.** If a teammate has to think hard to read your JSX, simplify it.
- **Small, focused pieces.** A component does one thing. A file covers one concern.
- **Reuse only after two real cases.** Don't extract a shared component until two or more places actually need it (root `CLAUDE.md` §2.3).

If you're unsure whether to add an abstraction, ask: **"Do I have two real cases that need this today?"** If not, don't build it yet.

---

## 2. Frontend Engineering Principles We Follow

These are the few rules that keep this app readable and cheap to change. The overriding goal: **a change should touch one place, not ripple across the codebase** — especially the switch from dummy data to real APIs.

| Principle | What it means here |
|---|---|
| **One place to change data access** | Every read/write for a domain goes through **one function** in `lib/<domain>.ts`. The UI calls that function and nothing else. Switching a domain from dummy data to the real API is editing **that one file** — never hunting through components. This is the single most important rule in this app. |
| **Separation of Concerns** | `app/` = routing + layout. `components/` = presentation. `lib/` = data access + logic. `types/` = the API contract. Don't fetch inside a presentational component, and don't put layout inside `lib/`. |
| **Single Responsibility** | A component renders one thing; a `lib/` function does one operation (`getCustomers`, `createCustomer` — not one `handleCustomers()` that does everything). If it's doing five jobs, split it into five. |
| **DRY (one definition each)** | One type per shape (in `types/`), one formatter per format (in `lib/format.ts`), one data function per operation. If you're copy-pasting a `fetch`, a class string, or a mapping, extract it — but only once a second real use exists. |
| **Types are the contract** | `types/` mirrors `api_reference.md` exactly. Write components against the final types now, so wiring the real API later is a body-swap in `lib/`, not a refactor. No `any` — an `any` is a future bug that hides a contract break. |
| **YAGNI** | No generic table framework, no global state library, no abstract "BaseComponent" until we have two real cases that need it. Build the screen in front of you. |
| **Composition over configuration** | Build small components and compose them. Prefer three focused components over one component with 15 boolean props toggling behavior. |
| **Unidirectional data flow** | Data flows down through props; events flow up through callbacks. No hidden global mutation, no component reaching into another's internals. Easy to trace = easy to maintain. |
| **Handle the real states** | Every data-driven screen has a **loading**, **empty**, and **error** state — not just the happy path. With dummy data these are trivial to stub now, so the UI is already correct when real latency and failures arrive. |
| **Fail fast, fail clearly** | Validate user input at the form boundary and show a clear message. Don't let bad input travel silently to the API layer. |

If a proposed change would force edits in many files, stop and ask whether the seam is in the wrong place — usually the fix is to route it through `lib/` or `types/` instead.

---

## 3. Where We Are: Dummy Data Now, APIs Later

We are building the UI **first, against dummy data**, and wiring up the real backend APIs **later**. The whole point of the rules below is that switching from dummy data to the real API should be a **one-file change per domain** — components should never know or care where their data came from.

### 3.1 The Golden Rule
**Components never import dummy data directly, and never call `axios`/`fetch` directly.** They only call functions from the domain data layer in `lib/`. Today those functions return dummy data; tomorrow they call the API. Nothing in `app/` changes when we make that switch.

```
Component  ──▶  lib/<domain>.ts  ──▶  (today)  data/<domain>.ts   ← dummy fixtures
                                 └──▶  (later)  lib/api.ts         ← real backend
```

### 3.2 Folder Layout

```
frontend/
├── app/                    # Next.js App Router — pages, layouts, route segments
│   ├── layout.tsx
│   ├── page.tsx
│   └── <route>/page.tsx
├── components/             # Reusable UI components (created once ≥2 places need them)
│   ├── ui/                 # Generic primitives (Button, Card, Table, Input …)
│   └── <domain>/           # Domain-specific components (e.g. customers/CustomerTable.tsx)
├── lib/                    # Data access + helpers. Components import from here.
│   ├── api.ts              # The shared axios instance (already exists)
│   ├── <domain>.ts         # Data-access functions per domain (getCustomers, getCustomer …)
│   └── format.ts           # Shared formatting helpers (currency, dates, GST) — add when needed
├── types/                  # TypeScript types matching api_reference.md
│   └── <domain>.ts         # e.g. Customer, CustomerCreate, CustomerListResponse
└── data/                   # Dummy fixtures ONLY. Temporary — deleted once APIs are wired.
    └── <domain>.ts         # e.g. dummyCustomers: Customer[]
```

### 3.3 The Data-Access Pattern

Each domain gets one file in `lib/` that exposes typed functions. Today it reads from `data/`; later the body is swapped to hit the API. **The function signatures and return types do not change** — they already match `api_reference.md`, so components are written against the final contract from day one.

```ts
// lib/customers.ts   —  TODAY (dummy)
import { Customer } from "@/types/customer";
import { dummyCustomers } from "@/data/customers";

export async function getCustomers(): Promise<Customer[]> {
  return dummyCustomers;
}

export async function getCustomer(id: string): Promise<Customer | null> {
  return dummyCustomers.find((c) => c.id === id) ?? null;
}
```

```ts
// lib/customers.ts   —  LATER (real API — same signatures, swap the body)
import { api } from "@/lib/api";
import { Customer } from "@/types/customer";

export async function getCustomers(): Promise<Customer[]> {
  const res = await api.get<Customer[]>("/customers");
  return res.data;
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const res = await api.get<Customer>(`/customers/${id}`);
  return res.data;
}
```

- Keep functions **async even while returning dummy data**, so no call sites change when they become real network calls.
- Put dummy fixtures in `data/<domain>.ts`, typed with the real `types/` types — **never `any`, never loose object literals**. If the dummy data can't satisfy the real type, our type is wrong or the fixture is wrong. Fix it now, not later.
- `data/` is temporary. When a domain's APIs are wired, delete its `data/` file — don't leave dead fixtures around (root §2.1: no dead code).

---

## 4. TypeScript Rules

- **`strict` is on. No `any`.** If you don't know a type, model it from `api_reference.md`. Use `unknown` + narrowing only for genuinely dynamic values.
- **One type file per domain** in `types/`, matching the request/response shapes in `api_reference.md` **exactly** — same field names, same enum values, money as `string`/`number` per the API (never invent camelCase if the API sends snake_case).
- Mirror backend enums (order status, payment status, roles) as string-literal unions or TS enums that match `database_schema_docs.markdown` §6. Don't scatter magic strings like `"pending"` through components.
- Prefer `type` for shapes and unions; use `interface` only when you need declaration merging (rare).
- Use the `@/*` path alias for all internal imports (`@/lib/customers`, `@/types/customer`) — no long `../../..` chains.

---

## 5. Components

- **Default to Server Components.** Only add `"use client"` when the component genuinely needs interactivity, browser APIs, state, or effects. Keep client components small and push them to the leaves of the tree.
- Data fetching for a page happens in the **Server Component** (call the `lib/<domain>.ts` function directly in an async component) unless the data is interactive/client-side. Read `node_modules/next/dist/docs/` for the current data-fetching + caching guidance before choosing.
- **Small and single-purpose.** If a component file is getting long or doing multiple jobs, split it. A table, its row, and its toolbar can be three components.
- **Colocate first, promote later.** A component used by one page can live next to that page. Move it to `components/` only when a second place needs it.
- Keep business/display logic out of JSX where it hurts readability — compute values above the `return`, or in a `lib/` helper if it's reused.
- Name components in `PascalCase`, files matching the component (`CustomerTable.tsx`). Hooks are `useSomething`, files `use-something.ts` or `useSomething.ts` (pick one and stay consistent).

---

## 6. Styling (Tailwind v4)

- Use **Tailwind utility classes** for styling — that's our system. Don't add a separate CSS-in-JS library.
- Global styles and theme tokens live in `app/globals.css`. Component-specific one-offs stay inline as utilities.
- Support **light and dark** (`dark:` variants) — the starter already sets this up. Don't hardcode a single theme.
- Don't copy-paste the same long class string across many elements — once it repeats, extract a small component (§1: after two real cases), not a global CSS class.

---

## 7. Configuration & Secrets (same rules as root §4)

- All config comes from env vars — **never hardcode** API URLs, keys, or ports.
- Only variables prefixed **`NEXT_PUBLIC_`** are usable in browser code. Anything secret must NOT be in the frontend at all.
- The API base URL is `NEXT_PUBLIC_API_BASE_URL`, read once in `lib/api.ts`. Don't read `process.env` scattered across components.
- If you add a new env var, add it to `.env.example` in the same commit (root §4.1). `.env.local` is never committed.

---

## 8. Data & Money Correctness

- The **frontend never computes** money, GST, stock, totals, or payment status — those are server-derived (root §2.2, `prd.md` §8). The UI **displays** what the API returns; it doesn't recalculate it. (While on dummy data, put the already-calculated values in the fixture — don't fake the math in a component.)
- Format money and dates for display through a shared helper (`lib/format.ts`), so ₹/GST/date formatting is consistent everywhere. Add it when the second screen needs it, not before.

---

## 9. Git & PRs (see root §5 — same workflow)

- Feature branches off `develop`, one domain per branch/PR (`feature/customers-ui`, etc.). Never push directly to `develop`/`main`.
- Small, focused commits — one logical change each. Commit messages explain **why** (root §5.4).
- Frontend and its types/fixtures land together in the same PR.

---

## 10. Before You Open a Pull Request — Checklist

- [ ] No `any`; types match `api_reference.md`
- [ ] Components import data only from `lib/<domain>.ts` — no direct `data/` imports, no direct `axios`/`fetch` in components
- [ ] Dummy fixtures are typed with the real `types/` types (swapping to the API needs no component changes)
- [ ] No hardcoded URLs/config — everything from `NEXT_PUBLIC_*` via `lib/api.ts`
- [ ] No magic status strings — using shared enums/unions from `types/`
- [ ] Server vs. client component choice is deliberate (`"use client"` only where needed)
- [ ] No dead code, no leftover fixtures for wired domains, no `console.log`
- [ ] `npm run lint` passes
- [ ] Checked `node_modules/next/dist/docs/` for any Next.js 16 API used

---

*Keep this file updated as our frontend practices evolve. If we agree on a new rule as a team, write it down here.*
