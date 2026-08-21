import webpush from "web-push";
import { eq, inArray, ne } from "drizzle-orm";
import { getDb } from "./db";
import { pushSubscriptions, users } from "@/db/schema";
import { apiUrl } from "./api";

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

  const db = getDb();
  const subscriptions = await db
    .select({
      endpoint: pushSubscriptions.endpoint,
      keys: pushSubscriptions.keys,
    })
    .from(pushSubscriptions)
    .where(inArray(pushSubscriptions.user_id, userIds));

  if (!subscriptions || subscriptions.length === 0) return;

  const payload = JSON.stringify({ title, body, url: apiUrl(url || "/") });

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
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.endpoint, sub.endpoint));
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
  const db = getDb();
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(ne(users.id, authorId));

  if (!rows || rows.length === 0) return;

  await sendPushNotification({
    userIds: rows.map((u) => u.id),
    title,
    body,
    url,
  });
}
