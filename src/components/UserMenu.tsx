"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function UserMenu({
  displayName,
  profileImageUrl,
  username,
}: {
  displayName: string;
  profileImageUrl: string | null;
  username?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };

  const initial = displayName.charAt(0) || "?";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: "2px solid var(--border)",
          overflow: "hidden",
          cursor: "pointer",
          padding: 0,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#e2e8f0",
        }}
        aria-label="メニュー"
      >
        {profileImageUrl ? (
          <img
            src={profileImageUrl}
            alt={displayName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: "0.85rem", color: "#666" }}>{initial}</span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "42px",
            right: 0,
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            minWidth: "160px",
            zIndex: 100,
          }}
        >
          <div
            style={{
              padding: "0.75rem 1rem",
              fontSize: "0.85rem",
              color: "#666",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {displayName}
          </div>
          <button
            onClick={() => router.push("/profile")}
            style={{
              display: "block",
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
            プロフィール
          </button>
          {username === "genji" && (
            <button
              onClick={() => router.push("/admin")}
              style={{
                display: "block",
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
              Admin
            </button>
          )}
          <button
            onClick={handleLogout}
            style={{
              display: "block",
              width: "100%",
              padding: "0.6rem 1rem",
              background: "none",
              border: "none",
              borderTop: "1px solid var(--border)",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "0.95rem",
              color: "var(--fg)",
            }}
          >
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
}
