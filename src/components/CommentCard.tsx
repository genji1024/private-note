"use client";

import { useState } from "react";
import type { ThreadComment } from "@/lib/types";
import MultiImageUpload, { parseImageUrls, serializeImageUrls, ImageGrid } from "@/components/MultiImageUpload";
import { PencilIcon, TrashIcon } from "@/components/Icons";

export default function CommentCard({
  comment,
  currentUserId,
}: {
  comment: ThreadComment;
  currentUserId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const [images, setImages] = useState<string[]>(parseImageUrls(comment.image_url));

  const isAuthor = comment.author_id === currentUserId;
  const displayImages = parseImageUrls(comment.image_url);

  const handleUpdate = async () => {
    await fetch(`/api/threads/${comment.thread_id}/comments`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: comment.id, body, image_url: serializeImageUrls(images) }),
    });
    setEditing(false);
    window.location.reload();
  };

  const handleDelete = async () => {
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/threads/${comment.thread_id}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: comment.id }),
    });
    window.location.reload();
  };

  return (
    <div className="card">
      {editing ? (
        <>
          <textarea
            className="textarea"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <MultiImageUpload images={images} onUpload={setImages} />
          <button className="btn" onClick={handleUpdate}>保存</button>{" "}
          <button className="btn btn--ghost" onClick={() => setEditing(false)}>
            キャンセル
          </button>
        </>
      ) : (
        <>
          <p style={{ color: "#666", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            {comment.author_name} · {new Date(comment.created_at).toLocaleString("ja-JP")}
          </p>
          <ImageGrid images={displayImages} alt="添付画像" />
          <p style={{ whiteSpace: "pre-wrap" }}>{comment.body}</p>
          {isAuthor && (
            <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.75rem" }}>
              <button
                className="btn btn--ghost"
                onClick={() => setEditing(true)}
                style={{ padding: "0.4rem", display: "flex", alignItems: "center" }}
                aria-label="編集"
              >
                <PencilIcon />
              </button>
              <button
                className="btn btn--ghost"
                onClick={handleDelete}
                style={{ padding: "0.4rem", display: "flex", alignItems: "center" }}
                aria-label="削除"
              >
                <TrashIcon />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}