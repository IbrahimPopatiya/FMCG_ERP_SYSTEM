// The login screen (splash + card) owns its entire viewport background and
// layout itself - unlike a plain form page, it isn't a card centered on a
// neutral background, so this layout stays a passthrough instead of adding
// the padding/background a typical auth page would want.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-dvh w-full overflow-hidden">{children}</div>;
}
