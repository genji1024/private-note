import webpush from "web-push";
import { supabaseAdmin } from "./supabase";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function sendPushNotification({
  userIds,
  title,
  body,
  url,
}: {
  userIds: string[];
  title: string;
  body: string;
  url?: string;
}) {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  const { data: subscriptions } = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint, keys")
    .in("user_id", userIds);

  if (!subscriptions || subscriptions.length === 0) return;

  const payload = JSON.stringify({ title, body, url: url || "/" });

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys as webpush.PushSubscription["keys"],
          },
          payload
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
        }
      }
    })
  );
}

export async function notifyOtherUsers({
  authorId,
  title,
  body,
  url,
}: {
  authorId: string;
  title: string;
  body: string;
  url?: string;
}) {
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id")
    .neq("id", authorId);

  if (!users || users.length === 0) return;

  await sendPushNotification({
    userIds: users.map((u) => u.id),
    title,
    body,
    url,
  });
}
