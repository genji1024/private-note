import type { Metadata } from "next";
import "./globals.css";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { settings } from "@/db/schema";
import { API_BASE } from "@/lib/api";
import AuthProvider from "@/components/AuthProvider";
import PushNotificationSetup from "@/components/PushNotificationSetup";

export async function generateMetadata(): Promise<Metadata> {
  // `next build` prerenders static routes without a reachable database, so a
  // missing table / unreachable DB must fall back to the default title instead
  // of failing the build.
  let title = "ちひろノート";
  try {
    const rows = await getDb()
      .select({ site_title: settings.site_title })
      .from(settings)
      .where(eq(settings.id, 1))
      .limit(1);
    title = rows[0]?.site_title || "ちひろノート";
  } catch {
    title = "ちひろノート";
  }
  return {
    title,
    description: "パートナーとの交換日記",
    manifest: `${API_BASE}/manifest.webmanifest`,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <PushNotificationSetup />
      </body>
    </html>
  );
}
