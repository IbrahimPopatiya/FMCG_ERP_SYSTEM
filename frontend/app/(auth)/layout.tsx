export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-surface px-4 py-12 sm:px-6">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
