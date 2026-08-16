"use client";

import { apiFetch } from "@/lib/api";
import type { Thread } from "@/lib/types";
import ThreeDotMenu from "@/components/ThreeDotMenu";

export default function ThreadListItem({
  thread,
  currentUserId,
}: {
  thread: Thread;
  currentUserId: string;
}) {
  const isCreator = thread.created_by === currentUserId;

  const handleDelete = async () => {
    if (!confirm("このスレッドを削除しますか？")) return;
    await apiFetch("/api/threads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: thread.id }),
    });
    window.location.reload();
  };

  return (
    <div
      className="card"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <h3 style={{ marginBottom: "0.25rem", fontSize: "1.1rem" }}>
          {thread.title}
        </h3>
        {thread.description && (
          <p
            style={{
              color: "#555",
              fontSize: "0.85rem",
              marginBottom: "0.25rem",
              whiteSpace: "pre-wrap",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {thread.description}
          </p>
        )}
        <p style={{ color: "#666", fontSize: "0.85rem" }}>
          {thread.author_name} ·{" "}
          {new Date(thread.created_at).toLocaleString("ja-JP")} · コメント{" "}
          {thread.comment_count}件
        </p>
      </div>
      {isCreator && !thread.is_default && (
        <div onClick={(e) => e.stopPropagation()}>
          <ThreeDotMenu onDelete={handleDelete} />
        </div>
      )}
    </div>
  );
}
