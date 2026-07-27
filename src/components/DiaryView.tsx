"use client";

import { useState } from "react";
import type { ThreadComment } from "@/lib/types";
import { PencilIcon, TrashIcon } from "@/components/Icons";
import MultiImageUpload, {
  parseImageUrls,
  serializeImageUrls,
  ImageGrid,
} from "@/components/MultiImageUpload";

export default function DiaryView({
  entries,
  currentUserId,
  diaryThreadId,
  statusUnread,
  statusRead,
  statusDone,
}: {
  entries: ThreadComment[];
  currentUserId: string;
  diaryThreadId: string;
  statusUnread: string;
  statusRead: string;
  statusDone: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    await fetch(`/api/threads/${diaryThreadId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread_id: diaryThreadId,
        title,
        body,
        image_url: serializeImageUrls(images),
      }),
    });

    setTitle("");
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
          <input
            className="input"
            placeholder="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="textarea"
            placeholder="今日のこと..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <MultiImageUpload images={images} onUpload={setImages} />
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "投稿中..." : "書く"}
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
          + 日記を書く
        </button>
      )}

      {entries.length > 0 ? (
        entries.map((entry) => (
          <DiaryEntry
            key={entry.id}
            entry={entry}
            currentUserId={currentUserId}
            diaryThreadId={diaryThreadId}
            statusUnread={statusUnread}
            statusRead={statusRead}
            statusDone={statusDone}
          />
        ))
      ) : (
        <p style={{ color: "#999", textAlign: "center" }}>
          まだ日記がありません
        </p>
      )}
    </>
  );
}

function DiaryEntry({
  entry,
  currentUserId,
  diaryThreadId,
  statusUnread,
  statusRead,
  statusDone,
}: {
  entry: ThreadComment;
  currentUserId: string;
  diaryThreadId: string;
  statusUnread: string;
  statusRead: string;
  statusDone: string;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const [body, setBody] = useState(entry.body);
  const [images, setImages] = useState<string[]>(
    parseImageUrls(entry.image_url)
  );
  const [read, setRead] = useState(entry.read_by_me ?? false);

  const isAuthor = entry.author_id === currentUserId;
  const displayImages = parseImageUrls(entry.image_url);

  const handleUpdate = async () => {
    await fetch(`/api/threads/${diaryThreadId}/comments`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: entry.id,
        title,
        body,
        image_url: serializeImageUrls(images),
      }),
    });
    setEditing(false);
    window.location.reload();
  };

  const handleDelete = async () => {
    if (!confirm("削除しますか？")) return;
    await fetch(`/api/threads/${diaryThreadId}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry.id }),
    });
    window.location.reload();
  };

  const handleRead = async () => {
    await fetch("/api/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment_id: entry.id }),
    });
    setRead(true);
  };

  return (
    <div className="card">
      {editing ? (
        <>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
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
          <h3 style={{ marginBottom: "0.5rem" }}>
            {entry.title || "（無題）"}
          </h3>
          <p
            style={{
              color: "#666",
              fontSize: "0.85rem",
              marginBottom: "0.5rem",
            }}
          >
            {entry.author_name} ·{" "}
            {new Date(entry.created_at).toLocaleString("ja-JP")}
          </p>
          <ImageGrid images={displayImages} alt={entry.title || "日記画像"} />
          <p style={{ whiteSpace: "pre-wrap" }}>{entry.body}</p>
          <div
            style={{
              marginTop: "0.75rem",
              display: "flex",
              gap: "1rem",
              alignItems: "center",
            }}
          >
            {isAuthor ? (
              entry.read_by_partner ? (
                <span className="read-badge">{statusRead}</span>
              ) : (
                <span className="read-badge">{statusUnread}</span>
              )
            ) : read ? (
              <span className="read-badge">{statusDone}</span>
            ) : (
              <button className="btn btn--ghost" onClick={handleRead}>
                {statusDone}
              </button>
            )}
            {isAuthor && (
              <>
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
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
