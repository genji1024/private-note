import { API_BASE } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase";

const DEFAULT_SITE_TITLE = "ちひろノート";

export const dynamic = "force-dynamic";

async function getSiteTitle(): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from("settings")
      .select("site_title")
      .eq("id", 1)
      .single();
    return data?.site_title || DEFAULT_SITE_TITLE;
  } catch {
    return DEFAULT_SITE_TITLE;
  }
}

export async function GET() {
  const siteTitle = await getSiteTitle();

  const manifest = {
    name: siteTitle,
    short_name: siteTitle,
    description: "パートナーとの交換日記",
    start_url: `${API_BASE}/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4f46e5",
    icons: [
      {
        src: `${API_BASE}/icons/icon-192x192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `${API_BASE}/icons/icon-512x512.png`,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: `${API_BASE}/icons/icon.svg`,
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
