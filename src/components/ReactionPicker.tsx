"use client";

import { useState, useRef, useEffect } from "react";
import type { ReactionType } from "@/lib/types";

export default function ReactionPicker({
  types,
  selectedTypeId,
  onSelect,
  onRemove,
  onClose,
}: {
  types: ReactionType[];
  selectedTypeId: number | null;
  onSelect: (typeId: number) => void;
  onRemove?: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        display: "flex",
        gap: "0.25rem",
        padding: "0.5rem",
        background: "#fff",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        zIndex: 100,
      }}
    >
      {types.map((t) => (
        <button
          key={t.id}
          onClick={() => {
            if (onRemove && selectedTypeId === t.id) {
              onRemove();
            } else {
              onSelect(t.id);
            }
          }}
          style={{
            fontSize: "1.25rem",
            padding: "0.3rem",
            cursor: "pointer",
            background:
              selectedTypeId === t.id ? "var(--accent-bg, #e2e8f0)" : "none",
            border:
              selectedTypeId === t.id
                ? "2px solid var(--accent)"
                : "2px solid transparent",
            borderRadius: "6px",
            lineHeight: 1,
          }}
          title={t.label}
        >
          {t.type === "emoji" ? (
            t.value
          ) : (
            <img
              src={t.value}
              alt={t.label}
              style={{ width: "24px", height: "24px", objectFit: "contain" }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
