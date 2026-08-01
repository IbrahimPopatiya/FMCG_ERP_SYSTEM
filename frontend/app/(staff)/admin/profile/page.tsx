"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/layout/TopBar";
import { LogoutIcon } from "@/components/customer/icons";
import { clearSession } from "@/lib/auth/session";
import { useCurrentUser } from "@/lib/hooks/useUsers";

export default function AdminProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();

  function handleLogout() {
    clearSession();
    queryClient.clear();
    router.push("/login");
  }

  return (
    <div className="flex flex-col">
      <TopBar title="Profile" backHref="/admin/dashboard" />

      {currentUser.isLoading && (
        <div className="flex flex-col gap-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {currentUser.isError && (
        <div className="p-4">
          <div className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
            Couldn&apos;t load your profile.
          </div>
        </div>
      )}

      {currentUser.data && (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 pb-8 md:p-8">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary">
              {currentUser.data.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-ink">{currentUser.data.full_name}</p>
              <p className="mt-0.5 truncate text-sm capitalize text-ink-muted">{currentUser.data.role}</p>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-ink">Account Details</h2>
            <div className="divide-y divide-border rounded-xl border border-border bg-white">
              <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                <p className="text-sm font-medium text-ink-muted">Mobile</p>
                <p className="text-sm font-medium text-ink">{currentUser.data.mobile}</p>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                <p className="text-sm font-medium text-ink-muted">Email</p>
                <p className="truncate text-sm font-medium text-ink">{currentUser.data.email}</p>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                <p className="text-sm font-medium text-ink-muted">Role</p>
                <p className="text-sm font-medium capitalize text-ink">{currentUser.data.role}</p>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                <p className="text-sm font-medium text-ink-muted">Status</p>
                <p className="text-sm font-medium capitalize text-ink">{currentUser.data.status}</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger hover:opacity-90"
          >
            <LogoutIcon className="h-4 w-4" />
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
