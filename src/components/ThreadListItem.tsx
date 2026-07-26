"use client";

import type { Thread } from "@/lib/types";
import { TrashIcon } from "@/components/Icons";

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
    await fetch("/api/threads", {
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
        <p style={{ color: "#666", fontSize: "0.85rem" }}>
          {thread.author_name} ·{" "}
          {new Date(thread.created_at).toLocaleString("ja-JP")} · コメント{" "}
          {thread.comment_count}件
        </p>
      </div>
      {isCreator && !thread.is_default && (
        <button
          className="btn btn--ghost"
          onClick={handleDelete}
          style={{ padding: "0.4rem", display: "flex", alignItems: "center" }}
          aria-label="削除"
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
}
