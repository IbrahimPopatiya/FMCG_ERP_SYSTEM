"use client";

import dynamic from "next/dynamic";

// Loaded on demand instead of shipped in every page's initial bundle - this
// banner renders nothing for most visits (already installed, already
// dismissed, or a platform that can't install at all), so there's no reason
// to block hydration on its code.
export const InstallAppBannerLazy = dynamic(
  () => import("@/components/pwa/InstallAppBanner").then((m) => m.InstallAppBanner),
  { ssr: false }
);
