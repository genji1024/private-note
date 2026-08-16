"use client";

import { useState } from "react";
import type { ReactionType, CommentReaction, UserProfile } from "@/lib/types";

export default function ReactionDisplay({
  reactions,
  types,
  currentUserId,
  userProfiles,
}: {
  reactions: CommentReaction[];
  types: ReactionType[];
  currentUserId: string;
  userProfiles?: Record<string, UserProfile>;
}) {
  const [tooltipUserId, setTooltipUserId] = useState<string | null>(null);

  if (reactions.length === 0) return null;

  const typeMap = new Map(types.map((t) => [t.id, t]));

  return (
    <div
      style={{
        display: "flex",
        gap: "0.3rem",
        flexWrap: "wrap",
        marginTop: "0.5rem",
      }}
    >
      {reactions.map((r) => {
        const rt = typeMap.get(r.reaction_type_id);
        if (!rt) return null;
        const isMine = r.user_id === currentUserId;
        const profile = userProfiles?.[r.user_id];
        const userName = profile?.display_name || r.user_id;
        return (
          <span
            key={r.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.2rem",
              padding: "0.15rem 0.4rem",
              fontSize: "0.85rem",
              background: isMine ? "var(--accent-bg, #e2e8f0)" : "#f7f7f7",
              border: isMine
                ? "1px solid var(--accent)"
                : "1px solid var(--border)",
              borderRadius: "12px",
              lineHeight: 1.3,
              cursor: "default",
              position: "relative",
            }}
            title={userName}
            onMouseEnter={() => setTooltipUserId(r.user_id)}
            onMouseLeave={() => setTooltipUserId(null)}
          >
            {rt.type === "emoji" ? (
              <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>
                {rt.value}
              </span>
            ) : (
              <img
                src={rt.value}
                alt={rt.label}
                style={{
                  width: "22px",
                  height: "22px",
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
              />
            )}
            {tooltipUserId === r.user_id && (
              <span
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#333",
                  color: "#fff",
                  padding: "0.3rem 0.6rem",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  whiteSpace: "nowrap",
                  marginBottom: "4px",
                  zIndex: 50,
                  pointerEvents: "none",
                }}
              >
                {userName}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
