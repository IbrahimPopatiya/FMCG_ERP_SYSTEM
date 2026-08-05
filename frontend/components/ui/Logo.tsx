import Image from "next/image";
import { BRAND } from "@/lib/branding";

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src={BRAND.logoPath}
      alt={BRAND.name}
      width={BRAND.logoWidth}
      height={BRAND.logoHeight}
      className={className}
      priority
    />
  );
}
