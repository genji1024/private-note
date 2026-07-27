"use client";

import { useState } from "react";
import type { Thread, ThreadComment, UserProfile } from "@/lib/types";
import DiaryView from "@/components/DiaryView";
import ThreadView from "@/components/ThreadView";
import NewThreadForm from "@/components/NewThreadForm";
import ThreadListItem from "@/components/ThreadListItem";

export default function HomePageClient({
  diaryThread,
  diaryEntries,
  threadsWithComments,
  currentUserId,
  statusUnread,
  statusRead,
  statusDone,
  userProfiles,
}: {
  diaryThread: Thread | null;
  diaryEntries: ThreadComment[];
  threadsWithComments: { thread: Thread; comments: ThreadComment[] }[];
  currentUserId: string;
  statusUnread: string;
  statusRead: string;
  statusDone: string;
  userProfiles: Record<string, UserProfile>;
}) {
  const [activeTab, setActiveTab] = useState<string>("diary");
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);

  return (
    <>
      {/* Tab menu */}
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
          日記
        </TabButton>
        {threadsWithComments.map(({ thread }) => (
          <TabButton
            key={thread.id}
            active={activeTab === thread.id}
            onClick={() => setActiveTab(thread.id)}
          >
            {thread.title}
          </TabButton>
        ))}
        <TabButton
          active={activeTab === "new"}
          onClick={() => {
            setActiveTab("new");
            setShowNewThreadForm(true);
          }}
        >
          +
        </TabButton>
      </div>

      {/* Tab content */}
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

      {activeTab === "new" && showNewThreadForm && <NewThreadForm />}

      {threadsWithComments.map(({ thread, comments }) =>
        activeTab === thread.id ? (
          <ThreadView
            key={thread.id}
            comments={comments}
            currentUserId={currentUserId}
            threadId={thread.id}
            userProfiles={userProfiles}
          />
        ) : null
      )}

      {/* Thread management list (shown when no specific thread is active) */}
      {activeTab === "new" && threadsWithComments.length > 0 && (
        <>
          <h3
            style={{
              fontSize: "1rem",
              color: "#666",
              marginTop: "1.5rem",
              marginBottom: "0.75rem",
            }}
          >
            スレッド一覧
          </h3>
          {threadsWithComments.map(({ thread }) => (
            <ThreadListItem
              key={thread.id}
              thread={thread}
              currentUserId={currentUserId}
            />
          ))}
        </>
      )}
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
