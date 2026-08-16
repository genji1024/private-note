"use client";

import { useState } from "react";
import type {
  Thread,
  ThreadComment,
  UserProfile,
  TodoList,
  TodoItem,
  CalendarEvent,
  CalendarEventException,
} from "@/lib/types";
import DiaryView from "@/components/DiaryView";
import ThreadView from "@/components/ThreadView";
import NewThreadForm from "@/components/NewThreadForm";
import ThreadListItem from "@/components/ThreadListItem";
import TodoView from "@/components/TodoView";
import CalendarView from "@/components/CalendarView";
import CountdownDisplay from "@/components/CountdownDisplay";

export default function HomePageClient({
  diaryThread,
  diaryEntries,
  threadsWithComments,
  currentUserId,
  statusUnread,
  statusRead,
  statusDone,
  userProfiles,
  tabDiary,
  tabNotes,
  tabTodo,
  tabCalendar,
  todoLists,
  calendarEvents,
  calendarExceptions,
}: {
  diaryThread: Thread | null;
  diaryEntries: ThreadComment[];
  threadsWithComments: { thread: Thread; comments: ThreadComment[] }[];
  currentUserId: string;
  statusUnread: string;
  statusRead: string;
  statusDone: string;
  userProfiles: Record<string, UserProfile>;
  tabDiary: string;
  tabNotes: string;
  tabTodo: string;
  tabCalendar: string;
  todoLists: (TodoList & { items: TodoItem[] })[];
  calendarEvents: CalendarEvent[];
  calendarExceptions: CalendarEventException[];
}) {
  const [activeTab, setActiveTab] = useState<string>("diary");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);

  const selectedNote = selectedNoteId
    ? threadsWithComments.find(({ thread }) => thread.id === selectedNoteId)
    : null;

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "0",
          marginBottom: "1rem",
          overflowX: "auto",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <TabButton
          active={activeTab === "diary"}
          onClick={() => setActiveTab("diary")}
        >
          {tabDiary}
        </TabButton>
        <TabButton
          active={activeTab === "notes"}
          onClick={() => {
            setActiveTab("notes");
            setSelectedNoteId(null);
            setShowNewThreadForm(false);
          }}
        >
          {tabNotes}
        </TabButton>
        <TabButton
          active={activeTab === "todo"}
          onClick={() => setActiveTab("todo")}
        >
          {tabTodo}
        </TabButton>
        <TabButton
          active={activeTab === "calendar"}
          onClick={() => setActiveTab("calendar")}
        >
          {tabCalendar}
        </TabButton>
      </div>

      {activeTab === "diary" && diaryThread && (
        <DiaryView
          entries={diaryEntries}
          currentUserId={currentUserId}
          diaryThreadId={diaryThread.id}
          statusUnread={statusUnread}
          statusRead={statusRead}
          statusDone={statusDone}
          userProfiles={userProfiles}
        />
      )}

      {activeTab === "todo" && (
        <TodoView initialLists={todoLists} currentUserId={currentUserId} />
      )}

      {activeTab === "calendar" && (
        <CalendarView
          initialEvents={calendarEvents}
          initialExceptions={calendarExceptions}
          currentUserId={currentUserId}
        />
      )}

      {activeTab === "notes" && (
        <>
          {selectedNote ? (
            <>
              <button
                onClick={() => setSelectedNoteId(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  cursor: "pointer",
                  padding: "0.5rem 0",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                ← {tabNotes}
              </button>
              <ThreadView
                comments={selectedNote.comments}
                currentUserId={currentUserId}
                threadId={selectedNote.thread.id}
                threadDescription={selectedNote.thread.description}
                userProfiles={userProfiles}
              />
            </>
          ) : (
            <>
              <button
                className="btn"
                onClick={() => setShowNewThreadForm(true)}
                style={{ width: "100%", marginBottom: "1rem" }}
              >
                + {tabNotes}
              </button>
              {showNewThreadForm && <NewThreadForm />}
              {threadsWithComments.length > 0 ? (
                threadsWithComments.map(({ thread }) => (
                  <div
                    key={thread.id}
                    onClick={() => setSelectedNoteId(thread.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <ThreadListItem
                      thread={thread}
                      currentUserId={currentUserId}
                    />
                  </div>
                ))
              ) : (
                <p style={{ color: "#999", fontSize: "0.9rem" }}>
                  ノートはまだありません
                </p>
              )}
            </>
          )}
        </>
      )}

      <CountdownDisplay
        events={calendarEvents}
        exceptions={calendarExceptions}
      />
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.5rem 1rem",
        background: active ? "var(--accent)" : "transparent",
        color: active ? "#fff" : "var(--accent)",
        border: "none",
        borderBottom: active
          ? "2px solid var(--accent)"
          : "2px solid transparent",
        cursor: "pointer",
        fontSize: "0.95rem",
        whiteSpace: "nowrap",
        transition: "all 0.2s",
      }}
    >
      {children}
    </button>
  );
}
