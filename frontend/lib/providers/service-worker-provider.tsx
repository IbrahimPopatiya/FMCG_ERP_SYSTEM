"use client";

import { useEffect } from "react";

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Dev cleanup of stale registrations/caches runs earlier, inline in
    // <head> (app/layout.tsx) - by the time this effect runs it's already
    // too late to prevent a blank screen from a stale worker.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  return children;
}
