import { API_BASE } from "@/lib/api";

export function GET() {
  const manifest = {
    name: "ちひろノート",
    short_name: "ちひろノート",
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
