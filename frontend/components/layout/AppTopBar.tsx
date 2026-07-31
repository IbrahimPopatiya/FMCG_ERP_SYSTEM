// iOS-style top navigation bar: translucent blurred background, a hairline
// bottom border, and a centered title — matches the native "large title"
// nav bar look rather than a plain left-aligned web header. Mounted once in
// the customer layout so every storefront screen keeps the app identity
// while each page's own sub-header handles screen-specific context.
export function AppTopBar({
  title,
  leading,
  trailing,
}: {
  title: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <header
      className="sticky top-0 z-10 shrink-0 border-b border-border/70 bg-white/80 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="relative flex h-14 items-center justify-center px-14">
        {leading && <div className="absolute left-2 flex items-center">{leading}</div>}
        <h1 className="truncate text-[22px] font-bold tracking-tight text-ink">{title}</h1>
        {trailing && <div className="absolute right-2 flex items-center">{trailing}</div>}
      </div>
    </header>
  );
}
