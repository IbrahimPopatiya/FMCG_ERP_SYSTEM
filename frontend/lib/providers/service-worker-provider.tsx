"use client";

import { useEffect } from "react";

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Skipped in dev: Turbopack regenerates JS chunk filenames on nearly
    // every restart, so a cached shell can reference chunks that 404 on the
    // current server - that's what caused the blank screen on iOS.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    } else if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
    }
  }, []);

  return children;
}
