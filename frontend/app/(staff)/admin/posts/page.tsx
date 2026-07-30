"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminPosts } from "@/lib/hooks/usePosts";
import { useRepostPost, useSetPostStatus } from "@/lib/hooks/usePostMutations";
import { formatCurrency } from "@/lib/utils/format";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import type { PostResponse } from "@/types/post";

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-3 p-4 sm:p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 5h16v12H8l-4 4V5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-ink">{hasSearch ? "No posts found" : "No posts yet"}</h2>
      <p className="max-w-xs text-sm text-ink-muted">
        {hasSearch
          ? "Try a different search term."
          : "Create a post to promote a product on the customer home feed."}
      </p>
      {!hasSearch && (
        <Link href="/admin/posts/new">
          <Button type="button" className="mt-1">
            Create your first post
          </Button>
        </Link>
      )}
    </div>
  );
}

function PostRow({ post }: { post: PostResponse }) {
  const setStatus = useSetPostStatus();
  const repost = useRepostPost();

  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface">
        {post.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.image} alt={post.product_name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-medium text-ink-muted">No image</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{post.product_name}</p>
        <p className="mt-0.5 text-sm text-ink-muted">
          {formatCurrency(post.price)}{" "}
          {post.mrp > post.price && (
            <span className="ml-1 text-ink-muted/70 line-through">{formatCurrency(post.mrp)}</span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-ink-muted">Box of {post.quantity_in_box}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          isLoading={repost.isPending}
          onClick={() => repost.mutate(post.id)}
        >
          Repost
        </Button>
        <button
          type="button"
          disabled={setStatus.isPending}
          onClick={() => setStatus.mutate({ postId: post.id, isActive: !post.is_active })}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
            post.is_active
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-red-200 text-ink-muted hover:bg-border"
          }`}
        >
          {post.is_active ? "Active" : "Inactive"}
        </button>
      </div>
    </Card>
  );
}

export default function AdminPostsPage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const { data, isLoading, isError, refetch } = useAdminPosts();
  const [search, setSearch] = useState("");

  const posts = useMemo(() => {
    const all = data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter((post) => post.product_name.toLowerCase().includes(term));
  }, [data, search]);

  return (
    <div>
      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">Posts</h1>
            <p className="mt-0.5 text-sm text-ink-muted">
              {(data ?? []).length > 0
                ? `${(data ?? []).length} post${(data ?? []).length === 1 ? "" : "s"} promoted on the customer home feed`
                : "Promote products on the customer home feed"}
            </p>
          </div>
          <Link href="/admin/posts/new">
            <Button type="button" className="w-full sm:w-auto">
              + Add Post
            </Button>
          </Link>
        </div>

        <Input
          id="post-search"
          placeholder="Search posts by product name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      {isLoading && <SkeletonRows />}

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

      {!isLoading && !isError && posts.length === 0 && <EmptyState hasSearch={search.trim().length > 0} />}

      {!isLoading && !isError && posts.length > 0 && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {posts.map((post) => (
            <PostRow key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
