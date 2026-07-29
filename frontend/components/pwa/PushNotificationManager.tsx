"use client";

import { useEffect, useState } from "react";
import { subscribeUser, unsubscribeUser } from "@/app/pwa-actions";
import { urlBase64ToUint8Array } from "@/lib/utils/pwa";

// Lets a customer opt in to order-update push notifications from their own
// device. Subscription state lives server-side (see app/pwa-actions.ts).
export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time feature-detection on mount
    setIsSupported(true);
    navigator.serviceWorker.ready.then(async (registration) => {
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    });
  }, []);

  async function subscribeToPush() {
    setIsBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      setSubscription(sub);
      await subscribeUser(JSON.parse(JSON.stringify(sub)));
    } finally {
      setIsBusy(false);
    }
  }

  async function unsubscribeFromPush() {
    if (!subscription) return;
    setIsBusy(true);
    try {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      setSubscription(null);
      await unsubscribeUser(endpoint);
    } finally {
      setIsBusy(false);
    }
  }

  if (!isSupported) return null;

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <h3 className="text-sm font-semibold text-ink">Order notifications</h3>
      <p className="mt-1 text-xs text-ink-muted">
        {subscription
          ? "You'll get push alerts on this device for order and delivery updates."
          : "Turn on push alerts for order and delivery updates on this device."}
      </p>
      <button
        type="button"
        disabled={isBusy}
        onClick={subscription ? unsubscribeFromPush : subscribeToPush}
        className="mt-3 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-soft disabled:opacity-60"
      >
        {subscription ? "Turn off notifications" : "Turn on notifications"}
      </button>
    </div>
  );
}
