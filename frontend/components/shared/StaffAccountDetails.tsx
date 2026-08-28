"use client";

import { LogoutIcon } from "@/components/customer/icons";
import { getStaffRole } from "@/lib/auth/session";
import type { UserResponse } from "@/types/users";

// Shared "Account Details" block + Log Out button used by both the admin
// Profile screen and the salesman Account screen, so switching between them
// (see RoleSwitchCards) shows the exact same account UI either way. Role
// shown here is the currently active VIEW (getStaffRole()), not necessarily
// the account's real DB role - an admin viewing as salesman sees "Salesman"
// here, matching the identity card they just tapped.
export function StaffAccountDetails({
  user,
  onLogout,
}: {
  user: UserResponse;
  onLogout: () => void;
}) {
  const activeRole = getStaffRole() ?? user.role;

  return (
    <>
      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink">Account Details</h2>
        <div className="divide-y divide-border rounded-xl border border-border bg-white">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <p className="text-sm font-medium text-ink-muted">Mobile</p>
            <p className="text-sm font-medium text-ink">{user.mobile}</p>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <p className="text-sm font-medium text-ink-muted">Email</p>
            <p className="truncate text-sm font-medium text-ink">{user.email}</p>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <p className="text-sm font-medium text-ink-muted">Role</p>
            <p className="text-sm font-medium capitalize text-ink">{activeRole}</p>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <p className="text-sm font-medium text-ink-muted">Status</p>
            <p className="text-sm font-medium capitalize text-ink">{user.status}</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="flex items-center justify-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger hover:opacity-90"
      >
        <LogoutIcon className="h-4 w-4" />
        Log Out
      </button>
    </>
  );
}
