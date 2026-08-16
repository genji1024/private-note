"use client";

import { apiFetch } from "@/lib/api";
import {
  validateImageFile,
  IMAGE_TRANSFER_TOO_LARGE_MESSAGE,
} from "@/lib/imageValidation";
import { compressImageIfNeeded } from "@/lib/imageCompression";
import { useState } from "react";

export default function ImageUpload({
  imageUrl,
  onUpload,
}: {
  imageUrl: string;
  onUpload: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError("");

    const fileToUpload = await compressImageIfNeeded(file);

    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      const res = await apiFetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onUpload(data.url);
      } else {
        let errorMessage = "アップロードに失敗しました";
        try {
          const data = await res.json();
          errorMessage = data.error || errorMessage;
        } catch {
          if (res.status === 413) {
            errorMessage = IMAGE_TRANSFER_TOO_LARGE_MESSAGE;
          }
        }
        setError(errorMessage);
      }
    } catch {
      setError("アップロードに失敗しました");
    }

    setUploading(false);
  };

  return (
    <div>
      {imageUrl ? (
        <div style={{ position: "relative", marginBottom: "0.5rem" }}>
          <img
            src={imageUrl}
            alt="アップロード画像"
            style={{
              width: "100%",
              borderRadius: "6px",
              marginBottom: "0.5rem",
            }}
          />
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => onUpload("")}
            style={{ fontSize: "0.85rem" }}
          >
            画像を削除
          </button>
        </div>
      ) : (
        <div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFile}
            disabled={uploading}
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
        </div>
      )}
      {error && (
        <p style={{ color: "#e53e3e", fontSize: "0.85rem" }}>{error}</p>
      )}
    </div>
  );
}
