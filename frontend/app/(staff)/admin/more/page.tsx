"use client";

import Link from "next/link";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { Card } from "@/components/ui/Card";
import { ChevronRightIcon } from "@/components/admin/icons";
import { ADMIN_MORE_LINKS } from "@/components/admin/navItems";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

export default function AdminMorePage() {
  useRoleGuard(["admin", "manager"]);

  return (
    <div className="sm:hidden">
      <AdminTopBar title="More" back />
      <div className="flex flex-col gap-2 p-4">
        {ADMIN_MORE_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="flex items-center gap-3 rounded-2xl">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{link.label}</p>
                  <p className="text-xs text-ink-muted">{link.hint}</p>
                </div>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-muted" />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
