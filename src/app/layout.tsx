import type { Metadata } from "next";
import "./globals.css";
import { supabaseAdmin } from "@/lib/supabase";
import { API_BASE } from "@/lib/api";
import AuthProvider from "@/components/AuthProvider";
import PushNotificationSetup from "@/components/PushNotificationSetup";

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await supabaseAdmin
    .from("settings")
    .select("site_title")
    .eq("id", 1)
    .single();
  const title = data?.site_title || "ノート";
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
