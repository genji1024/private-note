import type { Metadata } from "next";
import "./globals.css";
import { supabaseAdmin } from "@/lib/supabase";

export async function generateMetadata(): Promise<Metadata> {
  const { data } = await supabaseAdmin
    .from("settings")
    .select("site_title")
    .eq("id", 1)
    .single();
  const title = data?.site_title || "ちひろノート";
  return {
    title,
    description: "パートナーとの交換日記",
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}