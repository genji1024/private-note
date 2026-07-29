"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  ThreadComment,
  UserProfile,
  ReactionType,
  CommentReaction,
} from "@/lib/types";
import ProfilePopup from "@/components/ProfilePopup";
import MultiImageUpload, {
  parseImageUrls,
  serializeImageUrls,
  ImageGrid,
} from "@/components/MultiImageUpload";
import ThreeDotMenu from "@/components/ThreeDotMenu";
import ReactionPicker from "@/components/ReactionPicker";
import ReactionDisplay from "@/components/ReactionDisplay";

export default function ThreadView({
  comments,
  currentUserId,
  threadId,
  userProfiles,
}: {
  comments: ThreadComment[];
  currentUserId: string;
  threadId: string;
  userProfiles: Record<string, UserProfile>;
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
            userProfiles={userProfiles}
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
  userProfiles,
}: {
  comment: ThreadComment;
  currentUserId: string;
  threadId: string;
  userProfiles: Record<string, UserProfile>;
}) {
  const [profilePopup, setProfilePopup] = useState(false);
  const profile = userProfiles[comment.author_id];
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const [images, setImages] = useState<string[]>(
    parseImageUrls(comment.image_url)
  );
  const [reactions, setReactions] = useState<CommentReaction[]>([]);
  const [reactionTypes, setReactionTypes] = useState<ReactionType[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const isAuthor = comment.author_id === currentUserId;
  const displayImages = parseImageUrls(comment.image_url);

  const fetchReactions = useCallback(async () => {
    const res = await fetch(`/api/comments/${comment.id}/reactions`);
    const data = await res.json();
    setReactions(data.reactions || []);
    setReactionTypes(data.types || []);
  }, [comment.id]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

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

  const handleReact = async (typeId: number) => {
    await fetch(`/api/comments/${comment.id}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reaction_type_id: typeId }),
    });
    setShowPicker(false);
    fetchReactions();
  };

  const handleRemoveReaction = async () => {
    await fetch(`/api/comments/${comment.id}/reactions`, {
      method: "DELETE",
    });
    fetchReactions();
  };

  const myReaction = reactions.find((r) => r.user_id === currentUserId);

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
            <div style={{ marginLeft: "auto" }}>
              <ThreeDotMenu
                onEdit={isAuthor ? () => setEditing(true) : undefined}
                onDelete={isAuthor ? handleDelete : undefined}
                onReact={() => setShowPicker(!showPicker)}
              />
            </div>
          </div>
          {profilePopup && profile && (
            <ProfilePopup
              user={profile}
              onClose={() => setProfilePopup(false)}
            />
          )}
          {showPicker && (
            <div style={{ marginBottom: "0.5rem" }}>
              <ReactionPicker
                types={reactionTypes}
                selectedTypeId={myReaction?.reaction_type_id ?? null}
                onSelect={handleReact}
                onRemove={handleRemoveReaction}
                onClose={() => setShowPicker(false)}
              />
            </div>
          )}
          <ImageGrid images={displayImages} alt="添付画像" />
          <p style={{ whiteSpace: "pre-wrap" }}>{comment.body}</p>
          <ReactionDisplay
            reactions={reactions}
            types={reactionTypes}
            currentUserId={currentUserId}
            userProfiles={userProfiles}
          />
        </>
      )}
    </div>
  );
}
