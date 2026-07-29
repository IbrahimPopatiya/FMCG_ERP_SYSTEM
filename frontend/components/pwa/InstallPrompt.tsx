"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Chromium supports a native install button via `beforeinstallprompt`; Safari
// on iOS never fires that event, so iOS users get a manual "Add to Home
// Screen" instruction instead.
export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of platform/display-mode on mount
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window));
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  if (isStandalone) return null;
  if (!isIOS && !installEvent) return null;

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <h3 className="text-sm font-semibold text-ink">Install the app</h3>
      {installEvent ? (
        <>
          <p className="mt-1 text-xs text-ink-muted">
            Add Zaid Traders to your home screen for quick, full-screen access.
          </p>
          <button
            type="button"
            onClick={async () => {
              await installEvent.prompt();
              const choice = await installEvent.userChoice;
              if (choice.outcome === "accepted") setInstallEvent(null);
            }}
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            Add to Home Screen
          </button>
        </>
      ) : (
        <p className="mt-1 text-xs text-ink-muted">
          To install this app, tap the Share icon ⎋ in Safari, then &quot;Add to Home Screen&quot; ➕.
        </p>
      )}
    </div>
  );
}
