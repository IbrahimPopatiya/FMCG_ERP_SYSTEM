"use client";

import { useRouter } from "next/navigation";
import { CheckIcon } from "@/components/customer/icons";
import { getStaffRole, setStaffRole } from "@/lib/auth/session";
import type { UserRole } from "@/types/users";

// A real admin taking orders themselves (no separate salesman phone/login)
// can switch between the admin back office and the salesman ordering screens
// from their own profile - same account, same login, just a different view.
// `dms_staff_role` (getStaffRole/setStaffRole) already drives proxy.ts's
// routing and every role guard, so "switching" is just updating that cookie
// and navigating to the other view's home; the backend still authorizes
// every request off the account's real DB role (always "admin" here), so
// nothing on the server needs to know this happened.
//
// Only ever shown to a real admin (`realRole === "admin"`) - a genuine
// salesman has no second persona to switch to.
const ROLE_HOME: Record<"admin" | "salesman", string> = {
  admin: "/admin/dashboard",
  salesman: "/salesman/home",
};

export function RoleSwitchCards({ fullName, realRole }: { fullName: string; realRole: UserRole }) {
  const router = useRouter();

  if (realRole !== "admin") return null;

  const activeRole = getStaffRole() ?? "admin";

  function handleSwitch(role: "admin" | "salesman") {
    if (role === activeRole) return;
    setStaffRole(role);
    router.push(ROLE_HOME[role]);
  }

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-ink">Switch View</h2>
      <div className="flex flex-col gap-2">
        {(["admin", "salesman"] as const).map((role) => {
          const active = activeRole === role;
          return (
            <button
              key={role}
              type="button"
              onClick={() => handleSwitch(role)}
              className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${
                active ? "border-primary bg-primary-soft" : "border-border bg-white hover:bg-surface"
              }`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-base font-semibold text-primary">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{fullName}</p>
                <p className="truncate text-xs capitalize text-ink-muted">{role}</p>
              </div>
              {active && (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
