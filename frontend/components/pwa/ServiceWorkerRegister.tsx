"use client";

import { useEffect } from "react";

// Registers the service worker (public/sw.js) app-wide so it's active
// before any page-specific push UI (see PushNotificationManager) needs it.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // best-effort — app still works without the service worker
    });
  }, []);

  return null;
}
