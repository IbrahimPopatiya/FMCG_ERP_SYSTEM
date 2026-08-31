"use client";

import { useLayoutEffect, useState } from "react";
import Image from "next/image";
import { BRAND } from "@/lib/branding";

const SPLASH_DURATION_MS = 1000;
const SLIDE_OUT_MS = 1000;
const SESSION_KEY = "dms_splash_shown";

// Module-scope, not React state - survives React Strict Mode's dev-only
// double-invoke of effects (setup -> cleanup -> setup again on mount).
// Without this, the second setup pass reads back the sessionStorage flag
// the first pass just wrote and immediately dismisses the splash, making it
// vanish almost instantly in dev.
let claimedThisPageLoad = false;

function claimSplashForThisSession(): boolean {
  if (claimedThisPageLoad) return false;
  if (sessionStorage.getItem(SESSION_KEY)) return false;
  sessionStorage.setItem(SESSION_KEY, "1");
  claimedThisPageLoad = true;
  return true;
}

// App-wide launch splash - shown once per real app session (closing the PWA/
// tab and reopening it starts a new sessionStorage, replaying the splash; a
// mid-session refresh does not). Mounted once in the root layout so it
// overlays whatever page the user actually lands on (login, or straight to
// their role's home if already authenticated - proxy.ts's redirect already
// happened server-side before this ever renders), then slides away to
// reveal it. Defaults to visible on every render (including the server
// render) so a fresh launch never flashes the underlying page first; the
// sessionStorage check only ever *skips* it, via a synchronous
// useLayoutEffect that runs before paint.
export function AppSplash() {
  const [visible, setVisible] = useState(true);
  const [dismissing, setDismissing] = useState(false);

  useLayoutEffect(() => {
    if (!claimSplashForThisSession()) {
      setVisible(false);
      return;
    }

    const dismissTimer = window.setTimeout(() => setDismissing(true), SPLASH_DURATION_MS);
    const removeTimer = window.setTimeout(() => setVisible(false), SPLASH_DURATION_MS + SLIDE_OUT_MS);
    return () => {
      window.clearTimeout(dismissTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      // Mobile-only - tablet/desktop go straight to the split-panel login
      // screen (app/(auth)/login) with no splash/animation step.
      className="fixed inset-0 z-[999] bg-[#080b18] sm:hidden"
      style={{
        transform: dismissing ? "translateX(-100%)" : "translateX(0)",
        opacity: dismissing ? 0 : 1,
        transition: `transform ${SLIDE_OUT_MS}ms cubic-bezier(.76,0,.24,1), opacity 500ms ease`,
        pointerEvents: dismissing ? "none" : "auto",
      }}
    >
      <Image
        src="/login/splash-preview.webp"
        alt={`${BRAND.name} - Wholesale Distributor`}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      <div className="absolute bottom-10 left-1/2 w-[70%] -translate-x-1/2 text-center text-white">
        <div className="h-[4px] overflow-hidden rounded-full bg-white/15">
          <span
            className="block h-full rounded-full"
            style={{
              background: "linear-gradient(90deg,#7137ff,#c064ff)",
              animation: `login-loading-bar ${SPLASH_DURATION_MS}ms ease-in-out forwards`,
            }}
          />
        </div>
        <p className="mt-3 text-sm opacity-90">Loading your experience...</p>
      </div>
    </div>
  );
}
