"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { clearSession } from "@/lib/auth/session";
import { useCurrentUser } from "@/lib/hooks/useUsers";

export function TopBar({ title }: { title: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();

  function handleLogout() {
    clearSession();
    queryClient.clear();
    router.push("/login");
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4">
      <h1 className="text-base font-semibold text-ink">{title}</h1>
      <div className="flex items-center gap-3">
        {currentUser.data && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
            {currentUser.data.full_name}
          </span>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
}
