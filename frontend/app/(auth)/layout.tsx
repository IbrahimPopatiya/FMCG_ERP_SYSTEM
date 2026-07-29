export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto bg-surface px-4 py-12 sm:px-6">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
