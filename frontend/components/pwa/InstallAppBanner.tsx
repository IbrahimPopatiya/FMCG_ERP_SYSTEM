"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useInstallPrompt } from "@/lib/hooks/useInstallPrompt";

const DISMISSED_KEY = "dms_install_dismissed";

function readDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(DISMISSED_KEY) === "1";
}

function StepIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
      {children}
    </span>
  );
}

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-4.5 w-4.5",
};

function ShareIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 15V4" />
      <path d="M8 8l4-4 4 4" />
      <rect x="5" y="11" width="14" height="9" rx="2" />
    </svg>
  );
}

function AddSquareIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

const STEPS = [
  { icon: <ShareIcon />, text: "Tap the Share icon in Safari" },
  { icon: <AddSquareIcon />, text: "Tap “Add to Home Screen”" },
  { icon: <CheckIcon />, text: "Tap “Add” to finish" },
];

export function InstallAppBanner() {
  const { canInstall, isIOS, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(readDismissed);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  if (dismissed || (!canInstall && !isIOS)) return null;

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border bg-primary-soft px-4 py-2.5 sm:px-6">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-white">
          DMS
        </div>
        <p className="min-w-0 flex-1 text-sm font-medium text-ink">Install the app</p>
        <Button
          type="button"
          className="h-8 shrink-0 px-3 text-xs"
          onClick={canInstall ? promptInstall : () => setShowIOSSteps(true)}
        >
          Install
        </Button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 text-lg leading-none text-ink-muted hover:text-ink"
        >
          &times;
        </button>
      </div>

      <Modal open={showIOSSteps} onClose={() => setShowIOSSteps(false)} title="Install DMS">
        <div className="flex flex-col gap-5 py-1">
          {STEPS.map((step) => (
            <div key={step.text} className="flex items-center gap-3.5">
              <StepIcon>{step.icon}</StepIcon>
              <p className="text-base text-ink">{step.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 border-t border-border pt-3 text-xs text-ink-muted">
          Only Safari can add apps to your home screen on iPhone.
        </p>
      </Modal>
    </>
  );
}
