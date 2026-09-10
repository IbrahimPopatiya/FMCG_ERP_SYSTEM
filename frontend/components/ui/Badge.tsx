type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "purple";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-primary-soft text-ink-muted",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
};

export function Badge({
  tone = "neutral",
  size = "sm",
  children,
}: {
  tone?: Tone;
  size?: "xs" | "sm";
  children: React.ReactNode;
}) {
  const sizeClasses = size === "xs" ? "px-1.5 py-0.5 text-[10px] leading-none" : "px-2.5 py-0.5 text-xs";
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full font-medium ${sizeClasses} ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}
