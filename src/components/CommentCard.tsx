"use client";

import { useState } from "react";
import type { ThreadComment, UserProfile } from "@/lib/types";
import ProfilePopup from "@/components/ProfilePopup";
import MultiImageUpload, {
  parseImageUrls,
  serializeImageUrls,
  ImageGrid,
} from "@/components/MultiImageUpload";
import { PencilIcon, TrashIcon } from "@/components/Icons";

export default function CommentCard({
  comment,
  currentUserId,
  userProfiles,
}: {
  comment: ThreadComment;
  currentUserId: string;
  userProfiles: Record<string, UserProfile>;
}) {
  const [profilePopup, setProfilePopup] = useState(false);
  const profile = userProfiles[comment.author_id];
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const [images, setImages] = useState<string[]>(
    parseImageUrls(comment.image_url)
  );

  const isAuthor = comment.author_id === currentUserId;
  const displayImages = parseImageUrls(comment.image_url);

  const handleUpdate = async () => {
    await fetch(`/api/threads/${comment.thread_id}/comments`, {
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
          <button className="btn" onClick={handleUpdate}>
            保存
          </button>{" "}
          <button className="btn btn--ghost" onClick={() => setEditing(false)}>
            キャンセル
          </button>
        </>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              color: "#666",
              fontSize: "0.85rem",
              marginBottom: "0.5rem",
            }}
          >
            {profile && (
              <img
                src={profile.profile_image_url || ""}
                alt={profile.display_name}
                onClick={() => setProfilePopup(true)}
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  cursor: "pointer",
                  flexShrink: 0,
                  background: "#e2e8f0",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <span
              onClick={() => setProfilePopup(true)}
              style={{ cursor: "pointer" }}
            >
              {comment.author_name}
            </span>
            {" · "}
            <span>{new Date(comment.created_at).toLocaleString("ja-JP")}</span>
          </div>
          {profilePopup && profile && (
            <ProfilePopup
              user={profile}
              onClose={() => setProfilePopup(false)}
            />
          )}
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
