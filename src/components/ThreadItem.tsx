"use client";

import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Thread } from "@/lib/types";

export default function ThreadItem({
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
    <div className="card">
      <Link
        href={`/threads/${thread.id}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <h3 style={{ marginBottom: "0.5rem" }}>{thread.title}</h3>
      </Link>
      <p style={{ color: "#666", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
        {thread.author_name} ·{" "}
        {new Date(thread.created_at).toLocaleString("ja-JP")} · コメント{" "}
        {thread.comment_count}件
      </p>
      {isCreator && (
        <button className="btn btn--ghost" onClick={handleDelete}>
          削除
        </button>
      )}
    </div>
  );
}
