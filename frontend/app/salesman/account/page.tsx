"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
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
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-base font-bold text-primary">
              {user.data.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user.data.full_name}</p>
              <p className="truncate text-xs text-ink-muted capitalize">{user.data.role}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 text-sm text-ink-muted">
            <div className="flex items-center justify-between">
              <span>Mobile</span>
              <span className="text-ink">{user.data.mobile}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Email</span>
              <span className="text-ink">{user.data.email}</span>
            </div>
          </div>
        </div>
      )}

      <Button type="button" variant="secondary" className="w-full bg-red-200 text-red-600" onClick={handleLogout}>
        Log out
      </Button>
    </div>
  );
}
