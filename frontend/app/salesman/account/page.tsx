"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/Skeleton";
import { RoleSwitchCards } from "@/components/shared/RoleSwitchCards";
import { StaffAccountDetails } from "@/components/shared/StaffAccountDetails";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { clearSession } from "@/lib/auth/session";

export default function SalesmanAccountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useCurrentUser();

  function handleLogout() {
    clearSession();
    queryClient.clear();
    router.push("/login");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Account</h1>
      </header>

      {user.isLoading && <Skeleton className="h-24 w-full rounded-xl" />}

      {user.data && (
        <>
          {user.data.role === "admin" ? (
            <RoleSwitchCards fullName={user.data.full_name} realRole={user.data.role} />
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-white p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-base font-bold text-primary">
                {user.data.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{user.data.full_name}</p>
                <p className="truncate text-xs text-ink-muted capitalize">{user.data.role}</p>
              </div>
            </div>
          )}

          <StaffAccountDetails user={user.data} onLogout={handleLogout} />
        </>
      )}
    </div>
  );
}
