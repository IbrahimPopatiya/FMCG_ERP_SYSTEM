import { useSyncExternalStore } from "react";
import { getStaffRole, type StaffRole } from "@/lib/auth/session";

// The staff-role cookie can't be read during SSR (no `document`), so a
// role-dependent value from useState's lazy initializer disagrees between
// server and client on the very first render and breaks hydration (seen on
// the staff shell's theme/nav — see app/(staff)/admin/layout.tsx).
// useSyncExternalStore's getServerSnapshot exists for exactly this: it's the
// value used for both the server render and the client's first render, so
// they always agree, then a re-render (not a hydration mismatch) picks up
// the real value.
function subscribe() {
  return () => {};
}

export function useStaffRole(): StaffRole | null {
  return useSyncExternalStore(subscribe, getStaffRole, () => null);
}
