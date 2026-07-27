"use client";

import { useEffect, useCallback } from "react";

export default function ImageViewer({
  images,
  currentIndex,
  onClose,
  onIndexChange,
}: {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0)
        onIndexChange(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < images.length - 1)
        onIndexChange(currentIndex + 1);
    },
    [currentIndex, images.length, onClose, onIndexChange]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "zoom-out",
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          background: "rgba(255,255,255,0.2)",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          fontSize: "1.5rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        }}
        aria-label="閉じる"
      >
        ×
      </button>

      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange(currentIndex - 1);
          }}
          style={{
            position: "absolute",
            left: "1rem",
            background: "rgba(255,255,255,0.2)",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            fontSize: "2rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="前の画像"
        >
          ‹
        </button>
      )}

      <img
        src={images[currentIndex]}
        alt={`画像 ${currentIndex + 1}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "90vw",
          maxHeight: "90vh",
          objectFit: "contain",
          borderRadius: "4px",
          cursor: "default",
        }}
      />

      {currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange(currentIndex + 1);
          }}
          style={{
            position: "absolute",
            right: "1rem",
            background: "rgba(255,255,255,0.2)",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            fontSize: "2rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="次の画像"
        >
          ›
        </button>
      )}

      <div
        style={{
          position: "absolute",
          bottom: "1.5rem",
          color: "#fff",
          fontSize: "0.9rem",
          background: "rgba(0,0,0,0.5)",
          padding: "0.25rem 0.75rem",
          borderRadius: "12px",
        }}
      >
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
