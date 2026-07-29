"use client";

import { useState, useEffect, useCallback } from "react";
import type { CalendarEvent, UserProfile } from "@/lib/types";
import ThreeDotMenu from "@/components/ThreeDotMenu";

export default function CalendarView({
  initialEvents,
  currentUserId,
}: {
  initialEvents: CalendarEvent[];
  currentUserId: string;
}) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch {
      // ignore
    }
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("この予定を削除しますか？")) return;
    try {
      const res = await fetch("/api/calendar/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("削除に失敗しました");
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    }
  }

  return (
    <div>
      <button
        className="btn"
        onClick={() => {
          setEditingEvent(null);
          setShowForm(true);
        }}
        style={{ width: "100%", marginBottom: "1rem" }}
      >
        + 予定
      </button>

      {error && (
        <div
          style={{ color: "red", fontSize: "0.85rem", marginBottom: "0.5rem" }}
        >
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <p style={{ color: "#999", fontSize: "0.9rem" }}>
          予定はまだありません
        </p>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              currentUserId={currentUserId}
              onEdit={() => {
                setEditingEvent(event);
                setShowForm(true);
              }}
              onDelete={() => handleDelete(event.id)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <EventFormPopup
          event={editingEvent}
          onClose={() => {
            setShowForm(false);
            setEditingEvent(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingEvent(null);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}

function EventCard({
  event,
  currentUserId,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  currentUserId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isOwner = event.author_id === currentUserId;
  const startDate = new Date(event.start_at);
  const endDate = event.end_at ? new Date(event.end_at) : null;

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "0.75rem",
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          textAlign: "center",
          minWidth: "3rem",
          padding: "0.25rem",
        }}
      >
        <div style={{ fontSize: "0.7rem", color: "#999" }}>
          {startDate.toLocaleDateString("ja-JP", { month: "short" })}
        </div>
        <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
          {startDate.getDate()}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>
          {event.title}
        </div>
        {event.location && (
          <div
            style={{ fontSize: "0.8rem", color: "#999", marginTop: "0.15rem" }}
          >
            {event.location}
          </div>
        )}
        <div
          style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.25rem" }}
        >
          {startDate.toLocaleString("ja-JP", {
            month: "long",
            day: "numeric",
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {endDate &&
            ` - ${endDate.toLocaleString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
            })}`}
        </div>
      </div>
      {isOwner && <ThreeDotMenu onEdit={onEdit} onDelete={onDelete} />}
    </div>
  );
}

function EventFormPopup({
  event,
  onClose,
  onSaved,
}: {
  event: CalendarEvent | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(event?.title || "");
  const [location, setLocation] = useState(event?.location || "");
  const [startAt, setStartAt] = useState(
    event ? new Date(event.start_at).toISOString().slice(0, 16) : ""
  );
  const [endAt, setEndAt] = useState(
    event?.end_at ? new Date(event.end_at).toISOString().slice(0, 16) : ""
  );
  const [imageUrl, setImageUrl] = useState<string | null>(
    event?.image_url || null
  );
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("JPEG/PNG/GIF/WebPのみアップロード可能です");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("ファイルサイズは5MB以下にしてください");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "アップロードに失敗しました");
      }
      const data = await res.json();
      setImageUrl(data.url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "アップロードに失敗しました"
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startAt) {
      setError("予定名と開始日時は必須です");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const body = {
        ...(event ? { id: event.id } : {}),
        title: title.trim(),
        location: location.trim(),
        start_at: new Date(startAt).toISOString(),
        end_at: endAt ? new Date(endAt).toISOString() : null,
        image_url: imageUrl,
      };

      const method = event ? "PUT" : "POST";
      const res = await fetch("/api/calendar/events", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "保存に失敗しました");
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "1.5rem",
          width: "90%",
          maxWidth: "400px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>
          {event ? "予定を編集" : "新しい予定"}
        </h3>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <div>
            <label
              style={{
                fontSize: "0.85rem",
                color: "#666",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              予定名 <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="予定名を入力"
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontSize: "0.9rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: "0.85rem",
                color: "#666",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              場所
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="場所を入力"
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontSize: "0.9rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: "0.85rem",
                color: "#666",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              開始日時 <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontSize: "0.9rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: "0.85rem",
                color: "#666",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              終了日時
            </label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontSize: "0.9rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: "0.85rem",
                color: "#666",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              画像（1枚まで）
            </label>
            {imageUrl ? (
              <div style={{ position: "relative", display: "inline-block" }}>
                <img
                  src={imageUrl}
                  alt=""
                  style={{
                    width: "100%",
                    maxHeight: "150px",
                    objectFit: "cover",
                    borderRadius: "6px",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setImageUrl(null)}
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px dashed var(--border)",
                  borderRadius: "6px",
                  padding: "1rem",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  color: "#999",
                }}
              >
                {uploading ? "アップロード中..." : "画像を選択"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
              </label>
            )}
          </div>

          {error && (
            <div style={{ color: "red", fontSize: "0.85rem" }}>{error}</div>
          )}

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "flex-end",
              marginTop: "0.5rem",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.5rem 1rem",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                background: "#fff",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "6px",
                background: "var(--accent)",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.9rem",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "保存中..." : event ? "更新" : "作成"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
