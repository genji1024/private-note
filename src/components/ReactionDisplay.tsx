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
  const [tooltipTypeId, setTooltipTypeId] = useState<number | null>(null);

  if (reactions.length === 0) return null;

  const typeMap = new Map(types.map((t) => [t.id, t]));
  const myReaction = reactions.find((r) => r.user_id === currentUserId);

  const grouped = new Map<number, CommentReaction[]>();
  for (const r of reactions) {
    const list = grouped.get(r.reaction_type_id) || [];
    list.push(r);
    grouped.set(r.reaction_type_id, list);
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "0.3rem",
        flexWrap: "wrap",
        marginTop: "0.5rem",
      }}
    >
      {Array.from(grouped.entries()).map(([typeId, groupReactions]) => {
        const rt = typeMap.get(typeId);
        if (!rt) return null;
        const isMine = myReaction?.reaction_type_id === typeId;
        const userNames = groupReactions
          .map((r) => {
            const profile = userProfiles?.[r.user_id];
            return profile?.display_name || r.user_id;
          })
          .join(", ");
        return (
          <span
            key={typeId}
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
            title={userNames}
            onMouseEnter={() => setTooltipTypeId(typeId)}
            onMouseLeave={() => setTooltipTypeId(null)}
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
            {tooltipTypeId === typeId && userNames && (
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
                {userNames}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
