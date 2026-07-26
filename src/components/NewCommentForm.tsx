"use client";

import { useState } from "react";
import MultiImageUpload, { serializeImageUrls } from "@/components/MultiImageUpload";

export default function NewCommentForm({ threadId }: { threadId: string }) {
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
      body: JSON.stringify({ thread_id: threadId, body, image_url: serializeImageUrls(images) }),
    });

    setBody("");
    setImages([]);
    setSubmitting(false);
    window.location.reload();
  };

  return (
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
      </button>
    </form>
  );
}