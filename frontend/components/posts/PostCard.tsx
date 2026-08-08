import { memo } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import type { PostResponse } from "@/types/post";

interface PostCardProps {
  post: PostResponse;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (post: PostResponse) => void;
  onToggleStatus?: (post: PostResponse) => void;
}

function PostCardBase({ post, selectMode = false, selected = false, onToggleSelect, onToggleStatus }: PostCardProps) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
        selectMode && selected ? "border-primary ring-2 ring-primary-soft" : "border-border"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggleSelect?.(post)}
        disabled={!selectMode}
        className="relative block aspect-square w-full bg-surface disabled:cursor-default"
      >
        {post.image ? (
          <Image src={post.image} alt={post.product_name} fill sizes="(min-width: 640px) 200px, 50vw" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-xs font-medium text-ink-muted">No image</span>
        )}

        <div className="absolute left-2 top-2">
          <Badge tone={post.is_active ? "success" : "neutral"}>{post.is_active ? "Live" : "Inactive"}</Badge>
        </div>

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

      <div className="flex items-center justify-between gap-2 p-3">
        <p className="line-clamp-1 text-sm font-medium text-ink">{post.product_name}</p>
        {!selectMode && (
          <button
            type="button"
            onClick={() => onToggleStatus?.(post)}
            className="shrink-0 text-xs font-medium text-primary hover:text-primary-hover"
          >
            {post.is_active ? "Hide" : "Unhide"}
          </button>
        )}
      </div>
    </div>
  );
}

export const PostCard = memo(PostCardBase);
