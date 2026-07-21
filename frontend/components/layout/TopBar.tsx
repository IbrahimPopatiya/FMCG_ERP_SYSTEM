export function TopBar({ title }: { title: string }) {
  return (
    <header className="flex h-14 items-center border-b border-zinc-200 bg-white px-4">
      <h1 className="text-base font-semibold text-zinc-900">{title}</h1>
    </header>
  );
}
