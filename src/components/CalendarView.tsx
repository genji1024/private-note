"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type {
  CalendarEvent,
  CalendarEventException,
  CalendarEventInstance,
} from "@/lib/types";
import {
  expandEventsForMonth,
  getMaxDisplayMonth,
  parseRecurrenceRule,
} from "@/lib/recurrence";
import ThreeDotMenu from "@/components/ThreeDotMenu";

export default function CalendarView({
  initialEvents,
  initialExceptions,
  currentUserId,
}: {
  initialEvents: CalendarEvent[];
  initialExceptions: CalendarEventException[];
  currentUserId: string;
}) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [exceptions, setExceptions] =
    useState<CalendarEventException[]>(initialExceptions);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingInstance, setDeletingInstance] =
    useState<CalendarEventInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const listRef = useRef<HTMLDivElement>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
        setExceptions(data.exceptions);
      }
    } catch {
      // ignore
    }
  }, []);

  async function handleDelete(instance: CalendarEventInstance) {
    if (instance.is_recurring) {
      setDeletingInstance(instance);
      return;
    }
    if (!confirm("この予定を削除しますか？")) return;
    try {
      const res = await fetch("/api/calendar/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: instance.id }),
      });
      if (!res.ok) throw new Error("削除に失敗しました");
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    }
  }

  async function handleDeleteRecurring(mode: "single" | "future" | "all") {
    if (!deletingInstance) return;
    try {
      const res = await fetch("/api/calendar/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deletingInstance.parent_id,
          delete_mode: mode,
          occurrence_date: deletingInstance.start_at,
        }),
      });
      if (!res.ok) throw new Error("削除に失敗しました");
      setDeletingInstance(null);
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    }
  }

  const now = useMemo(() => new Date(), []);
  const isCurrentMonth =
    viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    "ja-JP",
    { year: "numeric", month: "long" }
  );

  const maxDisplayMonth = useMemo(
    () => getMaxDisplayMonth(events, now),
    [events, now]
  );
  const canGoNext = !(
    viewYear === maxDisplayMonth.year && viewMonth === maxDisplayMonth.month
  );

  function goToMonth(delta: number) {
    if (delta > 0 && !canGoNext) return;
    let year = viewYear;
    let month = viewMonth + delta;
    if (month < 0) {
      month += 12;
      year -= 1;
    } else if (month > 11) {
      month -= 12;
      year += 1;
    }
    setViewYear(year);
    setViewMonth(month);
  }

  const monthEvents = useMemo(
    () => expandEventsForMonth(events, exceptions, viewYear, viewMonth),
    [events, exceptions, viewYear, viewMonth]
  );

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    const nowTime = Date.now();
    const firstUnfinished = monthEvents.find((event) => {
      const end = event.end_at
        ? new Date(event.end_at)
        : new Date(event.start_at);
      return end.getTime() >= nowTime;
    });
    const target = firstUnfinished
      ? listEl.querySelector<HTMLElement>(
          `[data-event-id="${firstUnfinished.id}"]`
        )
      : null;
    (target ?? listEl).scrollIntoView({ block: "start" });
  }, [monthEvents]);

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

      <MonthNav
        monthLabel={monthLabel}
        isCurrentMonth={isCurrentMonth}
        canGoNext={canGoNext}
        onPrev={() => goToMonth(-1)}
        onNext={() => goToMonth(1)}
        onReset={() => {
          setViewYear(now.getFullYear());
          setViewMonth(now.getMonth());
        }}
      />

      {error && (
        <div
          style={{ color: "red", fontSize: "0.85rem", marginBottom: "0.5rem" }}
        >
          {error}
        </div>
      )}

      {monthEvents.length === 0 ? (
        <p style={{ color: "#999", fontSize: "0.9rem" }}>
          {isCurrentMonth ? "予定はまだありません" : "この月の予定はありません"}
        </p>
      ) : (
        <div
          ref={listRef}
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {monthEvents.map((instance) => (
            <EventCard
              key={instance.id}
              instance={instance}
              finished={isEventFinished(instance, now)}
              currentUserId={currentUserId}
              onEdit={() => {
                if (instance.is_recurring) {
                  const parent = events.find(
                    (e) => e.id === instance.parent_id
                  );
                  setEditingEvent(parent || null);
                } else {
                  setEditingEvent(instance);
                }
                setShowForm(true);
              }}
              onDelete={() => handleDelete(instance)}
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

      {deletingInstance && (
        <DeleteConfirmPopup
          instance={deletingInstance}
          onConfirm={handleDeleteRecurring}
          onClose={() => setDeletingInstance(null)}
        />
      )}
    </div>
  );
}

function isEventFinished(event: CalendarEventInstance, now: Date): boolean {
  const end = event.end_at ? new Date(event.end_at) : new Date(event.start_at);
  return end.getTime() < now.getTime();
}

function MonthNav({
  monthLabel,
  isCurrentMonth,
  canGoNext,
  onPrev,
  onNext,
  onReset,
}: {
  monthLabel: string;
  isCurrentMonth: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.5rem",
        marginBottom: "1rem",
      }}
    >
      <button className="btn btn--ghost" onClick={onPrev}>
        ◀ 先月
      </button>
      <div style={{ textAlign: "center", flex: 1 }}>
        <div style={{ fontWeight: "bold", fontSize: "1.05rem" }}>
          {monthLabel}
        </div>
        {!isCurrentMonth && (
          <button
            onClick={onReset}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent)",
              cursor: "pointer",
              fontSize: "0.75rem",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            今月へ
          </button>
        )}
      </div>
      <button
        className="btn btn--ghost"
        onClick={onNext}
        disabled={!canGoNext}
        style={{
          opacity: canGoNext ? 1 : 0.4,
          cursor: canGoNext ? "pointer" : "not-allowed",
        }}
      >
        来月 ▶
      </button>
    </div>
  );
}

function EventCard({
  instance,
  finished,
  currentUserId,
  onEdit,
  onDelete,
}: {
  instance: CalendarEventInstance;
  finished: boolean;
  currentUserId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isOwner = instance.author_id === currentUserId;
  const startDate = new Date(instance.start_at);
  const endDate = instance.end_at ? new Date(instance.end_at) : null;

  return (
    <div
      data-event-id={instance.id}
      style={{
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "0.75rem",
        display: "flex",
        gap: "0.75rem",
        alignItems: "flex-start",
        opacity: finished ? 0.5 : 1,
        filter: finished ? "grayscale(1)" : "none",
      }}
    >
      <div
        style={{ textAlign: "center", minWidth: "3rem", padding: "0.25rem" }}
      >
        <div style={{ fontSize: "0.7rem", color: "#999" }}>
          {startDate.toLocaleDateString("ja-JP", { month: "short" })}
        </div>
        <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
          {startDate.getDate()}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontWeight: "bold",
            fontSize: "0.95rem",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          {instance.title}
          {instance.is_recurring && (
            <span
              style={{
                fontSize: "0.65rem",
                color: "var(--accent)",
                border: "1px solid var(--accent)",
                borderRadius: "4px",
                padding: "0 0.3rem",
                fontWeight: "normal",
              }}
            >
              繰り返し
            </span>
          )}
        </div>
        {instance.location && (
          <div
            style={{ fontSize: "0.8rem", color: "#999", marginTop: "0.15rem" }}
          >
            {instance.location}
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
        {finished && (
          <span
            style={{
              display: "inline-block",
              fontSize: "0.7rem",
              color: "#999",
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "0 0.35rem",
              marginTop: "0.25rem",
            }}
          >
            終了
          </span>
        )}
      </div>
      {isOwner && <ThreeDotMenu onEdit={onEdit} onDelete={onDelete} />}
    </div>
  );
}

function DeleteConfirmPopup({
  instance,
  onConfirm,
  onClose,
}: {
  instance: CalendarEventInstance;
  onConfirm: (mode: "single" | "future" | "all") => void;
  onClose: () => void;
}) {
  const dateStr = new Date(instance.start_at).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const btnStyle: React.CSSProperties = {
    padding: "0.6rem 1rem",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    background: "#fff",
    cursor: "pointer",
    fontSize: "0.9rem",
    textAlign: "left",
    width: "100%",
  };

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
        }}
      >
        <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>
          繰り返し予定の削除
        </h3>
        <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1rem" }}>
          「{instance.title}」({dateStr})の削除範囲を選択してください。
        </p>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <button onClick={() => onConfirm("single")} style={btnStyle}>
            この予定のみ
          </button>
          <button onClick={() => onConfirm("future")} style={btnStyle}>
            この予定以降
          </button>
          <button
            onClick={() => onConfirm("all")}
            style={{ ...btnStyle, color: "#c0392b", borderColor: "#e74c3c" }}
          >
            すべての予定
          </button>
          <button
            onClick={onClose}
            style={{ ...btnStyle, background: "#f5f5f5", textAlign: "center" }}
          >
            キャンセル
          </button>
        </div>
      </div>
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

  const [recurrenceType, setRecurrenceType] = useState<
    "none" | "daily" | "weekly" | "monthly" | "custom"
  >(() => {
    const rule = parseRecurrenceRule(event?.recurrence_rule ?? null);
    if (rule) {
      if (rule.interval === 1 && !rule.until) return rule.frequency;
      return "custom";
    }
    return "none";
  });
  const [customFrequency, setCustomFrequency] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");
  const [customInterval, setCustomInterval] = useState(1);
  const [customUntil, setCustomUntil] = useState("");

  useEffect(() => {
    const rule = parseRecurrenceRule(event?.recurrence_rule ?? null);
    if (rule) {
      setCustomFrequency(rule.frequency);
      setCustomInterval(rule.interval);
      if (rule.until) {
        const d = new Date(rule.until);
        d.setDate(d.getDate() - 1);
        setCustomUntil(d.toISOString().slice(0, 10));
      }
    }
  }, [event]);

  const isRecurring = !!parseRecurrenceRule(event?.recurrence_rule ?? null);

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

  function buildRecurrenceRule(): string | null {
    if (recurrenceType === "daily")
      return JSON.stringify({ frequency: "daily", interval: 1, until: null });
    if (recurrenceType === "weekly")
      return JSON.stringify({ frequency: "weekly", interval: 1, until: null });
    if (recurrenceType === "monthly")
      return JSON.stringify({ frequency: "monthly", interval: 1, until: null });
    if (recurrenceType === "custom") {
      const interval = Math.max(1, customInterval);
      let until: string | null = null;
      if (customUntil) {
        const d = new Date(customUntil + "T00:00:00");
        d.setDate(d.getDate() + 1);
        until = d.toISOString();
      }
      return JSON.stringify({ frequency: customFrequency, interval, until });
    }
    return null;
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
        recurrence_rule: buildRecurrenceRule(),
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

  const labelStyle: React.CSSProperties = {
    fontSize: "0.85rem",
    color: "#666",
    display: "block",
    marginBottom: "0.25rem",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    fontSize: "0.9rem",
    boxSizing: "border-box",
  };

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

        {isRecurring && (
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--accent)",
              background: "rgba(0,0,0,0.03)",
              borderRadius: "6px",
              padding: "0.5rem 0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            この予定は繰り返し予定です。変更はすべての予定に適用されます。
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <div>
            <label style={labelStyle}>
              予定名 <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="予定名を入力"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>場所</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="場所を入力"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              開始日時 <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>終了日時</label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>繰り返し</label>
            <select
              value={recurrenceType}
              onChange={(e) =>
                setRecurrenceType(
                  e.target.value as
                    "none" | "daily" | "weekly" | "monthly" | "custom"
                )
              }
              style={inputStyle}
            >
              <option value="none">繰り返さない</option>
              <option value="daily">毎日</option>
              <option value="weekly">毎週</option>
              <option value="monthly">毎月</option>
              <option value="custom">カスタム</option>
            </select>
          </div>

          {recurrenceType === "custom" && (
            <div
              style={{
                paddingLeft: "0.5rem",
                borderLeft: "2px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div>
                <label style={labelStyle}>周期</label>
                <select
                  value={customFrequency}
                  onChange={(e) =>
                    setCustomFrequency(
                      e.target.value as "daily" | "weekly" | "monthly"
                    )
                  }
                  style={inputStyle}
                >
                  <option value="daily">毎日</option>
                  <option value="weekly">毎週</option>
                  <option value="monthly">毎月</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>間隔</label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={customInterval}
                    onChange={(e) =>
                      setCustomInterval(Math.max(1, Number(e.target.value)))
                    }
                    style={{ ...inputStyle, width: "80px" }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "#666" }}>
                    {customFrequency === "daily"
                      ? "日ごと"
                      : customFrequency === "weekly"
                        ? "週ごと"
                        : "ヶ月ごと"}
                  </span>
                </div>
              </div>
              <div>
                <label style={labelStyle}>終了日（任意）</label>
                <input
                  type="date"
                  value={customUntil}
                  onChange={(e) => setCustomUntil(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>画像（1枚まで）</label>
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
