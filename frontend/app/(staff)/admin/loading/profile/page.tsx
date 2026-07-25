"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Card } from "@/components/ui/Card";
import { useCurrentUser } from "@/lib/hooks/useUsers";
import { clearSession } from "@/lib/auth/session";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

export default function LoadingProfilePage() {
  useRoleGuard(["admin", "dispatcher", "manager", "driver"]);

  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();

  function handleLogout() {
    clearSession();
    queryClient.clear();
    router.push("/login");
  }

  return (
    <div>
      <AdminTopBar title="Profile" back />

      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <Card className="flex items-center gap-3 p-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary">
            {currentUser.data?.full_name?.charAt(0).toUpperCase() ?? "L"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{currentUser.data?.full_name ?? "Loading Supervisor"}</p>
            <p className="truncate text-xs text-ink-muted">{currentUser.data?.mobile}</p>
            <p className="truncate text-xs text-ink-muted">{currentUser.data?.email}</p>
          </div>
        </Card>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm font-semibold text-danger"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
