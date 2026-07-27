"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Settings = {
  site_title: string;
  status_unread: string;
  status_read: string;
  status_done: string;
};

export default function AdminForm({
  settings: initial,
}: {
  settings: Settings;
}) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

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

  return (
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
  );
}
