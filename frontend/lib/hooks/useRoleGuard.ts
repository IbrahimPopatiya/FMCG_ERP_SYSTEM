import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStaffRole } from "@/lib/auth/session";
import { getRoleNav } from "@/lib/nav/roleNav";
import type { UserRole } from "@/types/users";

// Client-side redirect only - the backend gate is app.core.deps.require_role,
// wired into routes in Phase 3. Don't treat this hook as real access control.
export function useRoleGuard(allowedRoles: UserRole[]) {
  const router = useRouter();

  useEffect(() => {
    const role = getStaffRole();
    if (role && !allowedRoles.includes(role)) {
      router.replace(getRoleNav(role).home);
    }
  }, [allowedRoles, router]);
}
