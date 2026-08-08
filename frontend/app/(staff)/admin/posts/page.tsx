"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/layout/TopBar";
import { PostCard } from "@/components/posts/PostCard";
import { CreatePostModal } from "@/components/posts/CreatePostModal";
import { PlusIcon } from "@/components/admin/icons";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import { useAdminPosts } from "@/lib/hooks/useAdminPosts";
import { useSetPostStatus, useRepostPosts } from "@/lib/hooks/usePostMutations";
import type { PostResponse } from "@/types/post";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:p-6 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square w-full" />
      ))}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M3 15l5-5 4 4 4-4 5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-ink">No posts yet</h2>
      <p className="max-w-xs text-sm text-ink-muted">
        Create a post to feature a photo at the top of the customer home feed.
      </p>
      <Button type="button" onClick={onCreate} className="mt-1">
        Add post
      </Button>
    </div>
  );
}

export default function AdminPostsPage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useAdminPosts("");
  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), !!hasNextPage);

  const posts = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const setStatus = useSetPostStatus();
  const repost = useRepostPosts();

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

  async function handleRepost() {
    if (selectedIds.size === 0) return;
    await repost.mutateAsync(Array.from(selectedIds));
    exitSelectMode();
  }

  return (
    <div>
      <TopBar title="Posts" subtitle="Feature photos on the customer home feed" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">Posts</h1>
            <p className="mt-0.5 text-sm text-ink-muted">
              {total > 0 ? `${total} post${total === 1 ? "" : "s"}` : "Feature a photo on the customer home feed"}
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
              className="gap-1.5 rounded-full"
              isLoading={repost.isPending}
              disabled={selectMode && selectedIds.size === 0}
              onClick={selectMode ? handleRepost : () => setSelectMode(true)}
            >
              {selectMode ? `Repost${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}` : "Multi repost"}
            </Button>
            {!selectMode && (
              <Button type="button" className="gap-1.5 rounded-full" onClick={() => setIsCreateOpen(true)}>
                <PlusIcon className="h-4 w-4" />
                Add post
              </Button>
            )}
          </div>
        </div>
      </header>

      {isLoading && <SkeletonGrid />}

      {isError && (
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load posts.
            <Button type="button" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && total === 0 && <EmptyState onCreate={() => setIsCreateOpen(true)} />}

      {!isLoading && !isError && total > 0 && (
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                selectMode={selectMode}
                selected={selectedIds.has(post.id)}
                onToggleSelect={toggleSelected}
                onToggleStatus={(p) => setStatus.mutate({ postId: p.id, isActive: !p.is_active })}
              />
            ))}
          </div>

          <div ref={sentinelRef} className="flex justify-center py-6">
            {isFetchingNextPage && <Badge tone="neutral">Loading more…</Badge>}
          </div>
        </div>
      )}

      <CreatePostModal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
