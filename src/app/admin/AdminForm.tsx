"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactionType } from "@/lib/types";

type Settings = {
  site_title: string;
  status_unread: string;
  status_read: string;
  status_done: string;
};

export default function AdminForm({
  settings: initial,
  initialReactionTypes,
}: {
  settings: Settings;
  initialReactionTypes: ReactionType[] | null;
}) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const [reactionTypes, setReactionTypes] = useState<ReactionType[]>(
    initialReactionTypes || []
  );
  const [newReactionType, setNewReactionType] = useState<"emoji" | "image">(
    "emoji"
  );
  const [newReactionValue, setNewReactionValue] = useState("");
  const [newReactionLabel, setNewReactionLabel] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    if (res.ok) {
      setMessage("保存しました");
      router.refresh();
    } else {
      const data = await res.json();
      setMessage(data.error || "エラーが発生しました");
    }
    setSaving(false);
  };

  const handleAddReactionType = async () => {
    if (!newReactionValue.trim()) return;
    const res = await fetch("/api/reactions/types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: newReactionType,
        value: newReactionValue.trim(),
        label: newReactionLabel.trim(),
        sort_order: reactionTypes.length,
      }),
    });
    if (res.ok) {
      const added = await res.json();
      setReactionTypes([...reactionTypes, added]);
      setNewReactionValue("");
      setNewReactionLabel("");
    }
  };

  const handleDeleteReactionType = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    const res = await fetch("/api/reactions/types", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setReactionTypes(reactionTypes.filter((r) => r.id !== id));
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontSize: "0.85rem",
              color: "#666",
            }}
          >
            ページタイトル
          </label>
          <input
            className="input"
            value={settings.site_title}
            onChange={(e) =>
              setSettings({ ...settings, site_title: e.target.value })
            }
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontSize: "0.85rem",
              color: "#666",
            }}
          >
            「未読」の表示テキスト
          </label>
          <input
            className="input"
            value={settings.status_unread}
            onChange={(e) =>
              setSettings({ ...settings, status_unread: e.target.value })
            }
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontSize: "0.85rem",
              color: "#666",
            }}
          >
            「既読」の表示テキスト
          </label>
          <input
            className="input"
            value={settings.status_read}
            onChange={(e) =>
              setSettings({ ...settings, status_read: e.target.value })
            }
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontSize: "0.85rem",
              color: "#666",
            }}
          >
            「読んだ」の表示テキスト
          </label>
          <input
            className="input"
            value={settings.status_done}
            onChange={(e) =>
              setSettings({ ...settings, status_done: e.target.value })
            }
          />
        </div>
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </button>
        {message && (
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.85rem",
              color: message === "保存しました" ? "var(--accent)" : "#e53e3e",
            }}
          >
            {message}
          </p>
        )}
        <button
          className="btn btn--ghost"
          type="button"
          onClick={() => router.push("/")}
          style={{ marginLeft: "0.5rem" }}
        >
          戻る
        </button>
      </form>

      <hr style={{ margin: "2rem 0" }} />

      <h3 style={{ marginBottom: "1rem" }}>リアクション管理</h3>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        {reactionTypes.map((rt) => (
          <div
            key={rt.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem",
              border: "1px solid var(--border)",
              borderRadius: "6px",
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>
              {rt.type === "emoji" ? (
                rt.value
              ) : (
                <img
                  src={rt.value}
                  alt=""
                  style={{
                    width: "24px",
                    height: "24px",
                    objectFit: "contain",
                  }}
                />
              )}
            </span>
            <span style={{ flex: 1, fontSize: "0.9rem" }}>{rt.label}</span>
            <button
              className="btn btn--ghost"
              onClick={() => handleDeleteReactionType(rt.id)}
              style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
            >
              削除
            </button>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <select
          className="input"
          style={{ width: "auto", padding: "0.4rem" }}
          value={newReactionType}
          onChange={(e) =>
            setNewReactionType(e.target.value as "emoji" | "image")
          }
        >
          <option value="emoji">絵文字</option>
          <option value="image">画像</option>
        </select>
        <input
          className="input"
          style={{ width: "auto", flex: 1, minWidth: "120px" }}
          placeholder={newReactionType === "emoji" ? "👍" : "画像URL"}
          value={newReactionValue}
          onChange={(e) => setNewReactionValue(e.target.value)}
        />
        {newReactionType === "image" && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ fontSize: "0.85rem", maxWidth: "140px" }}
              disabled={uploadingImage}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingImage(true);
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch("/api/upload", { method: "POST", body: formData });
                if (res.ok) {
                  const data = await res.json();
                  setNewReactionValue(data.url);
                }
                setUploadingImage(false);
              }}
            />
            {uploadingImage && <span style={{ fontSize: "0.8rem", color: "#666" }}>アップロード中...</span>}
          </div>
        )}
        <input
          className="input"
          style={{ width: "auto", flex: 1, minWidth: "100px" }}
          placeholder="ラベル"
          value={newReactionLabel}
          onChange={(e) => setNewReactionLabel(e.target.value)}
        />
        <button className="btn" onClick={handleAddReactionType}>
          追加
        </button>
      </div>
    </>
  );
}
