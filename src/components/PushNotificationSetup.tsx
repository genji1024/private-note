"use client";

import { apiFetch, apiUrl } from "@/lib/api";
import { useEffect } from "react";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    arr[i] = rawData.charCodeAt(i);
  }
  return arr;
}

export default function PushNotificationSetup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (!vapidPublicKey) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          apiUrl("/sw.js")
        );
        const sub = await registration.pushManager.getSubscription();
        if (sub) return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            vapidPublicKey
          ) as unknown as BufferSource,
        });

        await apiFetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });
      } catch {
        // Notification permission denied or not supported
      }
    };

    register();
  }, []);

  return null;
}
