"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { usePosts } from "@/lib/hooks/usePosts";
import { formatCurrency } from "@/lib/utils/format";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-3 p-4 sm:p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 5h16v12H8l-4 4V5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-ink">No posts yet</h2>
      <p className="max-w-xs text-sm text-ink-muted">
        Create a post to promote a product on the customer home feed.
      </p>
      <Link href="/admin/posts/new">
        <Button type="button" className="mt-1">
          Create your first post
        </Button>
      </Link>
    </div>
  );
}

export default function AdminPostsPage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const { data, isLoading, isError, refetch } = usePosts();
  const posts = data ?? [];

  return (
    <div>
      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">Posts</h1>
            <p className="mt-0.5 text-sm text-ink-muted">
              {posts.length > 0
                ? `${posts.length} post${posts.length === 1 ? "" : "s"} promoted on the customer home feed`
                : "Promote products on the customer home feed"}
            </p>
          </div>
          <Link href="/admin/posts/new">
            <Button type="button" className="w-full sm:w-auto">
              + Add Post
            </Button>
          </Link>
        </div>
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

      {!isLoading && !isError && posts.length === 0 && <EmptyState />}

      {!isLoading && !isError && posts.length > 0 && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {posts.map((post) => (
            <Card key={post.id} className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface">
                {post.image ? (
                  <Image src={post.image} alt={post.product_name} fill sizes="64px" className="object-cover" />
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
              <Badge tone={post.is_active ? "success" : "neutral"}>
                {post.is_active ? "Active" : "Inactive"}
              </Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
