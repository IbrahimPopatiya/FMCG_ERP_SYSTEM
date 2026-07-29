"use server";

import webpush, { type PushSubscription } from "web-push";

webpush.setVapidDetails(
  "mailto:support@zaidtraders.example",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// In-memory store for demo purposes. A production build should persist
// subscriptions per-user in the database (e.g. a push_subscriptions table
// keyed by customer/user id) so they survive server restarts and can be
// targeted individually.
let subscriptions: PushSubscription[] = [];

export async function subscribeUser(sub: PushSubscription) {
  subscriptions = subscriptions.filter((s) => s.endpoint !== sub.endpoint);
  subscriptions.push(sub);
  return { success: true };
}

export async function unsubscribeUser(endpoint: string) {
  subscriptions = subscriptions.filter((s) => s.endpoint !== endpoint);
  return { success: true };
}

export async function sendNotification(message: string) {
  if (subscriptions.length === 0) {
    throw new Error("No subscription available");
  }

  const payload = JSON.stringify({
    title: "Zaid Traders",
    body: message,
    icon: "/icons/icon-192x192.png",
    url: "/home",
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) => webpush.sendNotification(sub, payload))
  );
  const failed = results.filter((r) => r.status === "rejected").length;
  return { success: failed < results.length, sent: results.length - failed, failed };
}
