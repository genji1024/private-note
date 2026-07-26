"use client";

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";

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
      <ImageUpload imageUrl={imageUrl} onUpload={setImageUrl} />
      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? "投稿中..." : "書く"}
      </button>
    </form>
  );
}
