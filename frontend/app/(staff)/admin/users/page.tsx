"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { TopBar } from "@/components/layout/TopBar";
import { UserForm } from "@/components/users/UserForm";
import { UserStatusBadge } from "@/components/users/UserStatusBadge";
import {
  useCreateUser,
  useDeleteUser,
  useSetUserStatus,
  useStaffDirectory,
} from "@/lib/hooks/useUsers";
import { toTitleCase } from "@/lib/utils/format";
import type { UserResponse } from "@/types/users";

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm10 3v6m-3-3h6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-ink">No staff accounts yet</h2>
      <p className="max-w-sm text-sm text-ink-muted">
        Add logins for salesmen, drivers, managers and other staff so they can sign in to the app.
      </p>
      <Button type="button" className="mt-1" onClick={onAdd}>
        Add staff user
      </Button>
    </div>
  );
}

export default function UsersPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<UserResponse | null>(null);
  const directory = useStaffDirectory();
  const createUser = useCreateUser();
  const setStatus = useSetUserStatus();
  const removeUser = useDeleteUser();

  const users = directory.data ?? [];

  function handleConfirmRemoval() {
    if (!pendingRemoval) return;
    removeUser.mutate(pendingRemoval.id, { onSuccess: () => setPendingRemoval(null) });
  }

  return (
    <div>
      <TopBar title="Users" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Staff accounts</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {users.length > 0
              ? `${users.length} staff account${users.length === 1 ? "" : "s"}`
              : "Create logins for salesmen, drivers, managers and more"}
          </p>
        </div>
        <Button type="button" className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
          Add staff user
        </Button>
      </header>

      {directory.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {directory.isError && (
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load staff accounts.
            <Button type="button" variant="secondary" onClick={() => directory.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!directory.isLoading && !directory.isError && users.length === 0 && (
        <EmptyState onAdd={() => setFormOpen(true)} />
      )}

      {!directory.isLoading && !directory.isError && users.length > 0 && (
        <div className="p-4 sm:p-6">
          {/* Desktop: full data table */}
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <Table<UserResponse>
                rowKey={(u) => u.id}
                rows={users}
                columns={[
                  {
                    header: "Name",
                    render: (u) => (
                      <div>
                        <p className="font-medium text-ink">{u.full_name}</p>
                        <p className="text-xs text-ink-muted">{u.email}</p>
                      </div>
                    ),
                  },
                  { header: "Mobile", render: (u) => u.mobile },
                  { header: "Role", render: (u) => <Badge tone="neutral">{toTitleCase(u.role)}</Badge> },
                  { header: "Status", render: (u) => <UserStatusBadge status={u.status} /> },
                  {
                    header: "",
                    render: (u) => (
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-9 px-3 text-xs"
                          isLoading={setStatus.isPending && setStatus.variables?.userId === u.id}
                          onClick={() =>
                            setStatus.mutate({
                              userId: u.id,
                              status: u.status === "active" ? "inactive" : "active",
                            })
                          }
                        >
                          {u.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          className="h-9 px-3 text-xs"
                          onClick={() => setPendingRemoval(u)}
                        >
                          Remove
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>

          {/* Mobile: simplified card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {users.map((u) => (
              <Card key={u.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{u.full_name}</p>
                    <p className="truncate text-xs text-ink-muted">{u.email}</p>
                    <p className="text-xs text-ink-muted">{u.mobile}</p>
                  </div>
                  <UserStatusBadge status={u.status} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="neutral">{toTitleCase(u.role)}</Badge>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-9 px-3 text-xs"
                      onClick={() =>
                        setStatus.mutate({
                          userId: u.id,
                          status: u.status === "active" ? "inactive" : "active",
                        })
                      }
                    >
                      {u.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      className="h-9 px-3 text-xs"
                      onClick={() => setPendingRemoval(u)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal open={isFormOpen} onClose={() => setFormOpen(false)} title="Add staff user">
        <UserForm
          onSubmit={(payload) => createUser.mutateAsync(payload)}
          onSuccess={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={pendingRemoval !== null}
        title="Remove staff account"
        message={
          pendingRemoval
            ? `This removes ${pendingRemoval.full_name}'s account. They will no longer be able to sign in.`
            : ""
        }
        confirmLabel="Remove"
        tone="danger"
        isConfirming={removeUser.isPending}
        onConfirm={handleConfirmRemoval}
        onCancel={() => setPendingRemoval(null)}
      />
    </div>
  );
}
