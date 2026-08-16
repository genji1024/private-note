"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  SmilePlusIcon,
} from "@/components/Icons";

export default function ThreeDotMenu({
  onEdit,
  onDelete,
  onReact,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  onReact?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "0.4rem",
          display: "flex",
          alignItems: "center",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#999",
          borderRadius: "4px",
        }}
        aria-label="メニュー"
      >
        <MoreHorizontalIcon />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            minWidth: "160px",
            zIndex: 100,
          }}
        >
          {onReact && (
            <MenuItem
              icon={<SmilePlusIcon />}
              label="リアクション"
              onClick={() => {
                setOpen(false);
                onReact();
              }}
            />
          )}
          {onEdit && (
            <MenuItem
              icon={<PencilIcon />}
              label="編集"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            />
          )}
          {onDelete && (
            <MenuItem
              icon={<TrashIcon />}
              label="削除"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        width: "100%",
        padding: "0.6rem 1rem",
        background: "none",
        border: "none",
        textAlign: "left",
        cursor: "pointer",
        fontSize: "0.95rem",
        color: "var(--fg)",
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
