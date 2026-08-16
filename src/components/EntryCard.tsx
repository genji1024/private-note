"use client";

import { apiFetch } from "@/lib/api";
import { useState } from "react";
import type { Entry } from "@/lib/types";
import MultiImageUpload, {
  parseImageUrls,
  serializeImageUrls,
  ImageGrid,
} from "@/components/MultiImageUpload";
import { PencilIcon, TrashIcon } from "@/components/Icons";

export default function EntryCard({
  entry,
  currentUserId,
}: {
  entry: Entry;
  currentUserId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const [body, setBody] = useState(entry.body);
  const [images, setImages] = useState<string[]>(
    parseImageUrls(entry.image_url)
  );
  const [read, setRead] = useState(entry.read_by_me);

  const isAuthor = entry.author_id === currentUserId;
  const displayImages = parseImageUrls(entry.image_url);

  const handleUpdate = async () => {
    await apiFetch("/api/entries", {
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
    await apiFetch("/api/entries", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry.id }),
    });
    window.location.reload();
  };

  const handleRead = async () => {
    await apiFetch("/api/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entry_id: entry.id }),
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
          <p style={{ whiteSpace: "pre-wrap" }}>{entry.body}</p>
          <ImageGrid images={displayImages} alt={entry.title || "日記画像"} />
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
                <span className="read-badge">既読</span>
              ) : (
                <span className="read-badge">未読</span>
              )
            ) : read ? (
              <span className="read-badge">読んだ</span>
            ) : (
              <button className="btn btn--ghost" onClick={handleRead}>
                読んだ
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
