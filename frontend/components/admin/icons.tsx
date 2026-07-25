// Hand-written line icons for the Admin workflow, matching the rest of the
// app's inline-SVG convention (no icon library dependency). Mirrors
// components/salesman/icons.tsx so admin and salesman share one visual
// language on the same green theme.
type IconProps = { className?: string };

export function DashboardIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.5" />
      <rect x="13" y="10" width="7.5" height="10.5" rx="1.5" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}

export function SalesOrdersIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 4h2l2.4 12.2a2 2 0 002 1.8h7.7a2 2 0 002-1.6L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </svg>
  );
}

export function PurchaseIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 16V6a1 1 0 011-1h9v11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 9h4l4 4v3a1 1 0 01-1 1h-1" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7.5" cy="18.5" r="1.7" />
      <circle cx="17" cy="18.5" r="1.7" />
    </svg>
  );
}

export function PaymentsIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" strokeLinecap="round" />
      <path d="M7 14.5h4" strokeLinecap="round" />
    </svg>
  );
}

export function CashBankIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10l9-6 9 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 10V19a1 1 0 001 1H18.5a1 1 0 001-1v-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 20v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function VehicleIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 16V9a1 1 0 011-1h9l4 4h2a1 1 0 011 1v3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 16h1M17 16H8" strokeLinecap="round" />
      <circle cx="7" cy="17.5" r="1.7" />
      <circle cx="17.5" cy="17.5" r="1.7" />
    </svg>
  );
}

export function InventoryIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8l9-5 9 5-9 5-9-5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 8v9l9 5 9-5V8M12 13v9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UsersIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c.9-3 3-4.5 5.5-4.5s4.6 1.5 5.5 4.5" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M16 14.3c1.7.2 3.3 1.5 4 3.7" strokeLinecap="round" />
    </svg>
  );
}

export function LedgerIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3h11a1 1 0 011 1v16a1 1 0 01-1 1H6a2 2 0 01-2-2V5a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8h6M8 12h6M8 16h3" strokeLinecap="round" />
    </svg>
  );
}

export function MoreIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PlusIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function SearchIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

export function FilterIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5h16M7 12h10M10 19h4" strokeLinecap="round" />
    </svg>
  );
}

export function BellIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 18a2 2 0 004 0" strokeLinecap="round" />
    </svg>
  );
}

export function PhoneIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2a1 1 0 011-.25c1.1.36 2.3.56 3.6.56a1 1 0 011 1V20a1 1 0 01-1 1C10.6 21 3 13.4 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.3.2 2.5.56 3.6a1 1 0 01-.25 1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRightIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
