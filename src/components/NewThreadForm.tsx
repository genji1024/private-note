"use client";

import { apiFetch } from "@/lib/api";
import { useState } from "react";

export default function NewThreadForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    await apiFetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });

    setTitle("");
    setDescription("");
    setSubmitting(false);
    window.location.reload();
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <input
        className="input"
        placeholder="ノート名（例：旅行、釣り）"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="textarea"
        placeholder="概要（任意）"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? "作成中..." : "ノートを作成"}
      </button>
    </form>
  );
}
