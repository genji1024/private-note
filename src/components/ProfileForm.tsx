"use client";

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";

function PenButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "2px",
        display: "inline-flex",
        alignItems: "center",
        color: "#999",
      }}
      title="編集"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      </svg>
    </button>
  );
}

export default function ProfileForm({
  initialDisplayName,
  initialProfileImage,
  username,
}: {
  initialDisplayName: string;
  initialProfileImage: string | null;
  username: string;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [profileImage, setProfileImage] = useState(initialProfileImage || "");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const body: Record<string, string> = {
      display_name: displayName,
      profile_image_url: profileImage || "",
    };
    if (newPassword) body.new_password = newPassword;

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    if (res.ok) {
      setMessage("保存しました");
      setNewPassword("");
      setEditingField(null);
    } else {
      const data = await res.json();
      setMessage("エラー: " + (data.error || "保存に失敗しました"));
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.85rem",
            color: "#666",
            marginBottom: "0.25rem",
          }}
        >
          ユーザ名（変更不可）
        </label>
        <input
          className="input"
          value={username}
          disabled
          style={{ opacity: 0.6 }}
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.85rem",
            color: "#666",
            marginBottom: "0.25rem",
          }}
        >
          表示名
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {editingField === "displayName" ? (
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="表示名"
              style={{ marginBottom: 0 }}
              autoFocus
            />
          ) : (
            <span style={{ flex: 1, padding: "0.5rem 0.75rem", fontSize: "1rem" }}>
              {displayName}
            </span>
          )}
          <PenButton onClick={() => setEditingField(editingField === "displayName" ? null : "displayName")} />
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.85rem",
            color: "#666",
            marginBottom: "0.25rem",
          }}
        >
          プロフィール画像
        </label>
        {editingField === "profileImage" ? (
          <ImageUpload imageUrl={profileImage} onUpload={setProfileImage} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {profileImage ? (
              <img
                src={profileImage}
                alt="プロフィール画像"
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundColor: "#e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#999",
                  fontSize: "0.8rem",
                }}
              >
                なし
              </div>
            )}
            <PenButton onClick={() => setEditingField(editingField === "profileImage" ? null : "profileImage")} />
          </div>
        )}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.85rem",
            color: "#666",
            marginBottom: "0.25rem",
          }}
        >
          パスワード
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {editingField === "password" ? (
            <input
              className="input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="新しいパスワード"
              style={{ marginBottom: 0 }}
              autoFocus
            />
          ) : (
            <span style={{ flex: 1, padding: "0.5rem 0.75rem", fontSize: "1rem", color: "#999" }}>
              ********
            </span>
          )}
          <PenButton onClick={() => setEditingField(editingField === "password" ? null : "password")} />
        </div>
      </div>

      {message && (
        <p
          style={{
            color: message.startsWith("エラー") ? "#e53e3e" : "#38a169",
            marginBottom: "0.75rem",
          }}
        >
          {message}
        </p>
      )}

      <button className="btn" type="submit" disabled={saving}>
        {saving ? "保存中..." : "保存"}
      </button>
    </form>
  );
}
