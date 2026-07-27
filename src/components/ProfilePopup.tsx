"use client";

import { useEffect, useState } from "react";
import ImageViewer from "@/components/ImageViewer";

type UserProfile = {
  display_name: string;
  profile_image_url: string | null;
  created_at: string;
};

export default function ProfilePopup({
  user,
  onClose,
}: {
  user: UserProfile;
  onClose: () => void;
}) {
  const [imageViewerOpen, setImageViewerOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const joinedDate = new Date(user.created_at).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "2rem",
            minWidth: "280px",
            maxWidth: "360px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "0.75rem",
              right: "0.75rem",
              background: "none",
              border: "none",
              fontSize: "1.25rem",
              cursor: "pointer",
              color: "#999",
            }}
            aria-label="閉じる"
          >
            ×
          </button>

          <div style={{ textAlign: "center" }}>
            {user.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt={user.display_name}
                onClick={() => setImageViewerOpen(true)}
                style={{
                  width: "96px",
                  height: "96px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  cursor: "pointer",
                  marginBottom: "0.75rem",
                }}
              />
            ) : (
              <div
                style={{
                  width: "96px",
                  height: "96px",
                  borderRadius: "50%",
                  background: "#e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  color: "#666",
                  margin: "0 auto 0.75rem",
                }}
              >
                {user.display_name.charAt(0)}
              </div>
            )}
            <h3 style={{ marginBottom: "0.25rem" }}>{user.display_name}</h3>
            <p style={{ fontSize: "0.85rem", color: "#999" }}>
              参加日: {joinedDate}
            </p>
          </div>
        </div>
      </div>

      {imageViewerOpen && user.profile_image_url && (
        <ImageViewer
          images={[user.profile_image_url]}
          currentIndex={0}
          onClose={() => setImageViewerOpen(false)}
          onIndexChange={() => {}}
        />
      )}
    </>
  );
}
