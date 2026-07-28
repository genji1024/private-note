"use client";

import type { ReactionType, CommentReaction } from "@/lib/types";

export default function ReactionDisplay({
  reactions,
  types,
  currentUserId,
}: {
  reactions: CommentReaction[];
  types: ReactionType[];
  currentUserId: string;
}) {
  if (reactions.length === 0) return null;

  const typeMap = new Map(types.map((t) => [t.id, t]));
  const myReaction = reactions.find((r) => r.user_id === currentUserId);

  const grouped = new Map<number, number>();
  for (const r of reactions) {
    grouped.set(r.reaction_type_id, (grouped.get(r.reaction_type_id) || 0) + 1);
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
      {Array.from(grouped.entries()).map(([typeId, count]) => {
        const rt = typeMap.get(typeId);
        if (!rt) return null;
        const isMine = myReaction?.reaction_type_id === typeId;
        return (
          <span
            key={typeId}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.2rem",
              padding: "0.15rem 0.4rem",
              fontSize: "0.8rem",
              background: isMine ? "var(--accent-bg, #e2e8f0)" : "#f7f7f7",
              border: isMine
                ? "1px solid var(--accent)"
                : "1px solid var(--border)",
              borderRadius: "12px",
              lineHeight: 1.3,
            }}
            title={`${rt.label}${count > 1 ? ` (${count})` : ""}`}
          >
            {rt.type === "emoji" ? (
              rt.value
            ) : (
              <img
                src={rt.value}
                alt={rt.label}
                style={{
                  width: "16px",
                  height: "16px",
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
              />
            )}
            {count > 1 && <span style={{ color: "#666" }}>{count}</span>}
          </span>
        );
      })}
    </div>
  );
}
