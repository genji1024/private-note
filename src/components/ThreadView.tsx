"use client";

import { useState } from "react";
import type { ThreadComment } from "@/lib/types";
import { PencilIcon, TrashIcon } from "@/components/Icons";
import MultiImageUpload, {
  parseImageUrls,
  serializeImageUrls,
  ImageGrid,
} from "@/components/MultiImageUpload";

export default function ThreadView({
  comments,
  currentUserId,
  threadId,
}: {
  comments: ThreadComment[];
  currentUserId: string;
  threadId: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);

    await fetch(`/api/threads/${threadId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread_id: threadId,
        body,
        image_url: serializeImageUrls(images),
      }),
    });

    setBody("");
    setImages([]);
    setShowForm(false);
    setSubmitting(false);
    window.location.reload();
  };

  return (
    <>
      {showForm ? (
        <form className="card" onSubmit={handleSubmit}>
          <textarea
            className="textarea"
            placeholder="コメントを書く..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <MultiImageUpload images={images} onUpload={setImages} />
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "投稿中..." : "コメントする"}
          </button>{" "}
          <button
            className="btn btn--ghost"
            type="button"
            onClick={() => setShowForm(false)}
          >
            キャンセル
          </button>
        </form>
      ) : (
        <button
          className="btn"
          onClick={() => setShowForm(true)}
          style={{ width: "100%", marginBottom: "1rem" }}
        >
          + コメントする
        </button>
      )}

      {comments.length > 0 ? (
        comments.map((comment) => (
          <ThreadCommentCard
            key={comment.id}
            comment={comment}
            currentUserId={currentUserId}
            threadId={threadId}
          />
        ))
      ) : (
        <p style={{ color: "#999", textAlign: "center" }}>
          まだコメントがありません
        </p>
      )}
    </>
  );
}

function ThreadCommentCard({
  comment,
  currentUserId,
  threadId,
}: {
  comment: ThreadComment;
  currentUserId: string;
  threadId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const [images, setImages] = useState<string[]>(
    parseImageUrls(comment.image_url)
  );

  const isAuthor = comment.author_id === currentUserId;
  const displayImages = parseImageUrls(comment.image_url);

  const handleUpdate = async () => {
    await fetch(`/api/threads/${threadId}/comments`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: comment.id,
        body,
        image_url: serializeImageUrls(images),
      }),
    });
    setEditing(false);
    window.location.reload();
  };

  const handleDelete = async () => {
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/threads/${threadId}/comments`, {
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
          <button className="btn" onClick={handleUpdate}>
            保存
          </button>{" "}
          <button className="btn btn--ghost" onClick={() => setEditing(false)}>
            キャンセル
          </button>
        </>
      ) : (
        <>
          <p
            style={{
              color: "#666",
              fontSize: "0.85rem",
              marginBottom: "0.5rem",
            }}
          >
            {comment.author_name} ·{" "}
            {new Date(comment.created_at).toLocaleString("ja-JP")}
          </p>
          <ImageGrid images={displayImages} alt="添付画像" />
          <p style={{ whiteSpace: "pre-wrap" }}>{comment.body}</p>
          {isAuthor && (
            <div
              style={{ marginTop: "0.75rem", display: "flex", gap: "0.75rem" }}
            >
              <button
                className="btn btn--ghost"
                onClick={() => setEditing(true)}
                style={{
                  padding: "0.4rem",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label="編集"
              >
                <PencilIcon />
              </button>
              <button
                className="btn btn--ghost"
                onClick={handleDelete}
                style={{
                  padding: "0.4rem",
                  display: "flex",
                  alignItems: "center",
                }}
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
