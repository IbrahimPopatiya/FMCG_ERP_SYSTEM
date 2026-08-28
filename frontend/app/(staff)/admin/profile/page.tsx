"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/layout/TopBar";
import { RoleSwitchCards } from "@/components/shared/RoleSwitchCards";
import { StaffAccountDetails } from "@/components/shared/StaffAccountDetails";
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
          {currentUser.data.role === "admin" ? (
            <RoleSwitchCards fullName={currentUser.data.full_name} realRole={currentUser.data.role} />
          ) : (
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary">
                {currentUser.data.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-ink">{currentUser.data.full_name}</p>
                <p className="mt-0.5 truncate text-sm capitalize text-ink-muted">{currentUser.data.role}</p>
              </div>
            </div>
          )}

          <StaffAccountDetails user={currentUser.data} onLogout={handleLogout} />
        </div>
      )}
    </div>
  );
}
