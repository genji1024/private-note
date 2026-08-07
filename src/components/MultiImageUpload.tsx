"use client";

import { apiFetch } from "@/lib/api";
import { useState } from "react";
import ImageViewer from "@/components/ImageViewer";

const MAX_IMAGES = 4;

export default function MultiImageUpload({
  images,
  onUpload,
}: {
  images: string[];
  onUpload: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`最大${MAX_IMAGES}枚までです`);
      return;
    }

    const toUpload = files.slice(0, remaining);
    setUploading(true);
    setError("");

    const newUrls: string[] = [];
    for (const file of toUpload) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await apiFetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          newUrls.push(data.url);
        } else {
          const data = await res.json();
          setError(data.error || "アップロードに失敗しました");
          break;
        }
      } catch {
        setError("アップロードに失敗しました");
        break;
      }
    }

    if (newUrls.length > 0) {
      onUpload([...images, ...newUrls]);
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    onUpload(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      {images.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              images.length === 2
                ? "1fr 1fr"
                : images.length >= 3
                  ? "1fr 1fr"
                  : "1fr",
            gap: "0.5rem",
            marginBottom: "0.5rem",
          }}
        >
          {images.map((url, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img
                src={url}
                alt={`画像 ${i + 1}`}
                style={{
                  width: "100%",
                  borderRadius: "6px",
                  aspectRatio: "1",
                  objectFit: "cover",
                }}
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
                aria-label="画像を削除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {images.length < MAX_IMAGES && (
        <div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFile}
            disabled={uploading}
            multiple
            style={{ fontSize: "0.85rem" }}
          />
          {uploading && (
            <p
              style={{
                fontSize: "0.85rem",
                color: "#666",
                marginTop: "0.25rem",
              }}
            >
              アップロード中...
            </p>
          )}
          <p
            style={{ fontSize: "0.8rem", color: "#999", marginTop: "0.25rem" }}
          >
            最大{MAX_IMAGES}枚まで（残り{MAX_IMAGES - images.length}枚）
          </p>
        </div>
      )}
      {error && (
        <p style={{ color: "#e53e3e", fontSize: "0.85rem" }}>{error}</p>
      )}
    </div>
  );
}

// Helper: parse image_url (could be JSON array or single URL string)
export function parseImageUrls(imageUrl: string | null): string[] {
  if (!imageUrl) return [];
  try {
    const parsed = JSON.parse(imageUrl);
    if (Array.isArray(parsed)) return parsed;
    return [imageUrl];
  } catch {
    // Not JSON, treat as single URL
    return [imageUrl];
  }
}

// Helper: serialize array to JSON string for storage
export function serializeImageUrls(urls: string[]): string | null {
  if (urls.length === 0) return null;
  if (urls.length === 1) return urls[0]; // Single image: store as plain URL for backward compat
  return JSON.stringify(urls);
}

// Helper: render image grid based on count
export function ImageGrid({ images, alt }: { images: string[]; alt: string }) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "nowrap",
          gap: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        {images.map((url, i) => (
          <img
            key={i}
            src={url}
            alt={`${alt} ${i + 1}`}
            onClick={() => setViewerIndex(i)}
            style={{
              width: "25%",
              borderRadius: "6px",
              aspectRatio: "1",
              objectFit: "cover",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
      {viewerIndex !== null && (
        <ImageViewer
          images={images}
          currentIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onIndexChange={setViewerIndex}
        />
      )}
    </>
  );
}
