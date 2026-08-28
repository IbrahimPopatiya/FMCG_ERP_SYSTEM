interface NoProductImageProps {
  className?: string;
}

// Shown in every product/post image slot when no image has been uploaded yet
// — replaces the old random stock-photo fallback so the UI is honest about
// missing images instead of showing an unrelated picture.
export function NoProductImage({ className }: NoProductImageProps) {
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-1.5 ${className ?? ""}`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-8 w-8 text-ink-muted/50"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M21 15l-5-5-9 9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-xs font-medium text-ink-muted/70">No image of product</span>
    </div>
  );
}
