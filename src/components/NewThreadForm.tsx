"use client";

import { useState } from "react";

export default function NewThreadForm() {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    setTitle("");
    setSubmitting(false);
    window.location.reload();
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <input
        className="input"
        placeholder="スレッド名（例：旅行、釣り）"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? "作成中..." : "スレッドを作成"}
      </button>
    </form>
  );
}
