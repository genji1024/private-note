"use client";

import { apiFetch } from "@/lib/api";
import { useState } from "react";
import MultiImageUpload, {
  serializeImageUrls,
} from "@/components/MultiImageUpload";

export default function NewEntryForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    await apiFetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body,
        image_url: serializeImageUrls(images),
      }),
    });

    setTitle("");
    setBody("");
    setImages([]);
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
      <MultiImageUpload images={images} onUpload={setImages} />
      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? "投稿中..." : "書く"}
      </button>
    </form>
  );
}
