"use client";

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";

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
        <input
          className="input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="表示名"
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
          プロフィール画像
        </label>
        {profileImage && (
          <img
            src={profileImage}
            alt="プロフィール画像"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: "0.5rem",
            }}
          />
        )}
        <ImageUpload imageUrl={profileImage} onUpload={setProfileImage} />
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
          パスワード（変更する場合のみ入力）
        </label>
        <input
          className="input"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="新しいパスワード"
        />
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
