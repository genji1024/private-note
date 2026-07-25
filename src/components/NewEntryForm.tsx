"use client";

import { useState } from "react";

export default function NewEntryForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, image_url: imageUrl || null }),
    });

    setTitle("");
    setBody("");
    setImageUrl("");
    setSubmitting(false);
    window.location.reload();
  };

  return (
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
      <input
        className="input"
        placeholder="画像URL（任意）"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />
      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? "投稿中..." : "書く"}
      </button>
    </form>
  );
}