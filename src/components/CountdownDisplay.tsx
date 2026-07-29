"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { CalendarEvent } from "@/lib/types";

const STORAGE_KEY = "countdown-position";
const DEFAULT_POSITION = { x: -1, y: -1 };

function loadPosition() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.x === "number" && typeof parsed.y === "number") {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_POSITION;
}

function savePosition(x: number, y: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
  } catch {}
}

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
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  }>({
    dragging: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    moved: false,
  });
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = loadPosition();
    if (saved.x === -1 && saved.y === -1) {
      setPos(null);
    } else {
      setPos(saved);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calcCountdown(startAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [startAt]);

  const resolveOrigin = useCallback(() => {
    const el = elRef.current;
    if (!el) return { origX: 0, origY: 0 };
    const rect = el.getBoundingClientRect();
    return { origX: rect.left, origY: rect.top };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const { origX, origY } = resolveOrigin();
      dragRef.current = {
        dragging: true,
        startX: e.clientX,
        startY: e.clientY,
        origX,
        origY,
        moved: false,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [resolveOrigin]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.dragging) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    const newX = d.origX + dx;
    const newY = d.origY + dy;
    const el = elRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = rect.width;
      const h = rect.height;
      const distTop = newY;
      const distBottom = vh - (newY + h);
      const distLeft = newX;
      const distRight = vw - (newX + w);
      const minDist = Math.min(distTop, distBottom, distLeft, distRight);
      let clampedX = newX;
      let clampedY = newY;
      if (minDist === distBottom) {
        clampedY = vh - h - 8;
        clampedX = Math.max(8, Math.min(newX, vw - w - 8));
      } else if (minDist === distTop) {
        clampedY = 8;
        clampedX = Math.max(8, Math.min(newX, vw - w - 8));
      } else if (minDist === distRight) {
        clampedX = vw - w - 8;
        clampedY = Math.max(8, Math.min(newY, vh - h - 8));
      } else {
        clampedX = 8;
        clampedY = Math.max(8, Math.min(newY, vh - h - 8));
      }
      setPos({ x: clampedX, y: clampedY });
    } else {
      setPos({ x: newX, y: newY });
    }
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      d.dragging = false;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      if (d.moved && pos) {
        savePosition(pos.x, pos.y);
      }
    },
    [pos]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (dragRef.current.moved) {
        e.stopPropagation();
        dragRef.current.moved = false;
        return;
      }
      onClick();
    },
    [onClick]
  );

  if (!countdown) return null;

  const style: React.CSSProperties = {
    position: "fixed",
    background: "var(--accent)",
    color: "#fff",
    borderRadius: "12px",
    padding: "0.75rem 1rem",
    cursor: "grab",
    zIndex: 999,
    boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
    fontSize: "0.85rem",
    textAlign: "center",
    minWidth: "120px",
    touchAction: "none",
    userSelect: "none",
  };

  if (pos) {
    style.left = `${pos.x}px`;
    style.top = `${pos.y}px`;
  } else {
    style.bottom = "1rem";
    style.right = "1rem";
  }

  return (
    <div
      ref={elRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      style={style}
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
