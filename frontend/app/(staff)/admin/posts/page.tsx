"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { NoProductImage } from "@/components/ui/NoProductImage";
import { TopBar } from "@/components/layout/TopBar";
import { SearchIcon, PlusIcon } from "@/components/admin/icons";

const PostForm = dynamic(() => import("@/components/posts/PostForm").then((m) => m.PostForm), {
  ssr: false,
});

import { useAllPosts } from "@/lib/hooks/usePosts";
import { useCreatePost, useRepostPost, useRepostPosts, useSetPostStatus } from "@/lib/hooks/usePostMutations";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { formatCurrency } from "@/lib/utils/format";
import type { PostResponse } from "@/types/post";

const PAGE_SIZE = 12;

function EmptyState({ onAdd, hasSearch }: { onAdd: () => void; hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <h2 className="text-base font-semibold text-ink">{hasSearch ? "No posts match your search" : "No posts yet"}</h2>
      <p className="max-w-sm text-sm text-ink-muted">
        Create a post to feature it at the top of the customer home feed.
      </p>
      {!hasSearch && (
        <Button type="button" className="mt-1" onClick={onAdd}>
          New post
        </Button>
      )}
    </div>
  );
}

function PostCard({
  post,
  selectMode,
  selected,
  onToggleSelect,
}: {
  post: PostResponse;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (post: PostResponse) => void;
}) {
  const setStatus = useSetPostStatus();
  const repost = useRepostPost();

  return (
    <Card
      className={`flex flex-col gap-3 overflow-hidden p-0 ${
        selectMode && selected ? "border-primary ring-2 ring-primary-soft" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => selectMode && onToggleSelect(post)}
        disabled={!selectMode}
        className="relative block h-40 w-full bg-surface disabled:cursor-default"
      >
        {post.image ? (
          <Image
            src={post.image}
            alt={post.product_name}
            fill
            sizes="(min-width: 640px) 33vw, 100vw"
            className="object-cover"
          />
        ) : (
          <NoProductImage />
        )}
        {!selectMode && (
          <div className="absolute right-2 top-2">
            <Badge tone={post.is_active ? "success" : "neutral"}>{post.is_active ? "Active" : "Inactive"}</Badge>
          </div>
        )}
        {selectMode && (
          <div
            className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
              selected ? "border-primary bg-primary text-white" : "border-white bg-white/70 text-transparent"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 12l5 5 9-9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </button>

      <div className="flex flex-col gap-2 px-4 pb-4">
        {!post.is_standalone && (
          <>
            <p className="line-clamp-3 text-sm font-semibold text-ink">{post.product_name}</p>
            {post.price > 0 && (
              <div className="flex items-baseline gap-1.5 text-sm">
                <span className="font-semibold text-ink">{formatCurrency(post.price)}</span>
                {post.mrp > post.price && (
                  <span className="text-xs text-ink-muted line-through">{formatCurrency(post.mrp)}</span>
                )}
              </div>
            )}
          </>
        )}

        {!selectMode && (
          <div className="mt-1 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-9 flex-1 px-3 text-xs"
              isLoading={setStatus.isPending && setStatus.variables?.postId === post.id}
              onClick={() => setStatus.mutate({ postId: post.id, isActive: !post.is_active })}
            >
              {post.is_active ? "Deactivate" : "Activate"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-9 flex-1 px-3 text-xs"
              isLoading={repost.isPending && repost.variables === post.id}
              onClick={() => repost.mutate(post.id)}
            >
              Repost
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function PostsPage() {
  useRoleGuard(["admin"]);

  const [isFormOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const posts = useAllPosts({ page, pageSize: PAGE_SIZE, search: debouncedSearch.trim() });
  const createPost = useCreatePost();
  const repostMany = useRepostPosts();

  const rows = posts.data?.items ?? [];
  const total = posts.data?.total ?? 0;
  const hasNextPage = page * PAGE_SIZE < total;

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggleSelected(post: PostResponse) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(post.id)) next.delete(post.id);
      else next.add(post.id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  async function handleRepostSelected() {
    if (selectedIds.size === 0) return;
    await repostMany.mutateAsync(Array.from(selectedIds));
    exitSelectMode();
  }

  return (
    <div>
      <TopBar title="Posts" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Posts</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {total > 0 ? `${total} post${total === 1 ? "" : "s"}` : "Featured posts on the customer home feed"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectMode && (
            <button
              type="button"
              onClick={exitSelectMode}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface hover:text-ink"
            >
              Cancel
            </button>
          )}
          <Button
            type="button"
            variant={selectMode ? "primary" : "secondary"}
            className="gap-1.5 flex-1 w-full"
            isLoading={repostMany.isPending}
            disabled={selectMode && selectedIds.size === 0}
            onClick={selectMode ? handleRepostSelected : () => setSelectMode(true)}
          >
            {selectMode ? `Repost${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}` : "Multiple Repost"}
          </Button>
          {!selectMode && (
            <Button type="button" className="flex-1 w-full sm:w-auto" onClick={() => setFormOpen(true)}>
              <PlusIcon className="h-4 w-4" />
              New post
            </Button>
          )}
        </div>
      </header>

      <div className="px-4 py-3 sm:px-6">
        <div className="flex h-11 items-center gap-2 rounded-xl border border-border px-3.5">
          <SearchIcon className="h-4 w-4 shrink-0 text-ink-muted" />
          <input
            type="search"
            placeholder="Search posts…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-full w-full bg-transparent text-sm text-ink placeholder:text-ink-muted/60 outline-none"
          />
        </div>
      </div>

      {posts.isLoading && (
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      )}

      {posts.isError && (
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load posts.
            <Button type="button" variant="secondary" onClick={() => posts.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!posts.isLoading && !posts.isError && rows.length === 0 && (
        <EmptyState onAdd={() => setFormOpen(true)} hasSearch={!!debouncedSearch.trim()} />
      )}

      {!posts.isLoading && !posts.isError && rows.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            {rows.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                selectMode={selectMode}
                selected={selectedIds.has(post.id)}
                onToggleSelect={toggleSelected}
              />
            ))}
          </div>

          {(page > 1 || hasNextPage) && (
            <div className="flex items-center justify-center gap-3 pb-6">
              <Button type="button" variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-ink-muted">Page {page}</span>
              <Button type="button" variant="secondary" disabled={!hasNextPage} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <Modal open={isFormOpen} onClose={() => setFormOpen(false)} title="New post">
        <PostForm onSubmit={(payload) => createPost.mutateAsync(payload)} onSuccess={() => setFormOpen(false)} />
      </Modal>
    </div>
  );
}
