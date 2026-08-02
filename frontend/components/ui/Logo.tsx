import Image from "next/image";

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-mark.png"
      alt="Zaid Traders"
      width={579}
      height={355}
      className={className}
    />
  );
}
