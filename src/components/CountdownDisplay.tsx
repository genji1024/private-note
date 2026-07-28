"use client";

import { useState, useEffect } from "react";
import type { CalendarEvent } from "@/lib/types";

function calcCountdown(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export default function CountdownDisplay({
  events: initialEvents,
}: {
  events: CalendarEvent[];
}) {
  const [events] = useState(initialEvents);
  const [showPopup, setShowPopup] = useState(false);

  const now = new Date();
  const upcoming =
    events
      .map((e) => ({ event: e, startAt: new Date(e.start_at) }))
      .filter(({ startAt }) => startAt > now)
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())[0] || null;

  if (!upcoming) return null;

  return (
    <>
      <CountdownFloat
        event={upcoming.event}
        startAt={upcoming.startAt}
        onClick={() => setShowPopup(true)}
      />
      {showPopup && (
        <CountdownPopup
          event={upcoming.event}
          startAt={upcoming.startAt}
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  );
}

function CountdownFloat({
  event,
  startAt,
  onClick,
}: {
  event: CalendarEvent;
  startAt: Date;
  onClick: () => void;
}) {
  const [countdown, setCountdown] = useState(() => calcCountdown(startAt));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calcCountdown(startAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [startAt]);

  if (!countdown) return null;

  return (
    <div
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        background: "var(--accent)",
        color: "#fff",
        borderRadius: "12px",
        padding: "0.75rem 1rem",
        cursor: "pointer",
        zIndex: 999,
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        fontSize: "0.85rem",
        textAlign: "center",
        minWidth: "120px",
      }}
    >
      <div
        style={{ fontSize: "0.7rem", opacity: 0.8, marginBottom: "0.15rem" }}
      >
        {event.title}
      </div>
      <div style={{ fontWeight: "bold", fontVariantNumeric: "tabular-nums" }}>
        {countdown.days > 0 && `${countdown.days}日 `}
        {String(countdown.hours).padStart(2, "0")}:
        {String(countdown.minutes).padStart(2, "0")}:
        {String(countdown.seconds).padStart(2, "0")}
      </div>
    </div>
  );
}

function CountdownPopup({
  event,
  startAt,
  onClose,
}: {
  event: CalendarEvent;
  startAt: Date;
  onClose: () => void;
}) {
  const [countdown, setCountdown] = useState(() => calcCountdown(startAt));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calcCountdown(startAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [startAt]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: event.image_url
            ? `url(${event.image_url}) center/cover no-repeat`
            : "rgba(0,0,0,0.8)",
        }}
      />
      {!event.image_url && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
          }}
        />
      )}
      <div
        style={{
          position: "relative",
          textAlign: "center",
          color: "#fff",
          padding: "2rem",
        }}
      >
        <div
          style={{ fontSize: "1.1rem", marginBottom: "0.5rem", opacity: 0.9 }}
        >
          {event.title}
        </div>
        {countdown ? (
          <div
            style={{
              fontSize: "clamp(2rem, 8vw, 5rem)",
              fontWeight: "bold",
              fontVariantNumeric: "tabular-nums",
              textShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            {countdown.days > 0 && `${countdown.days}日 `}
            {String(countdown.hours).padStart(2, "0")}:
            {String(countdown.minutes).padStart(2, "0")}:
            {String(countdown.seconds).padStart(2, "0")}
          </div>
        ) : (
          <div style={{ fontSize: "2rem" }}>終了しました</div>
        )}
        <div style={{ fontSize: "0.85rem", marginTop: "1rem", opacity: 0.7 }}>
          {startAt.toLocaleString("ja-JP")}
        </div>
        <button
          onClick={onClose}
          style={{
            marginTop: "1.5rem",
            padding: "0.5rem 1.5rem",
            border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: "6px",
            background: "rgba(255,255,255,0.15)",
            color: "#fff",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
