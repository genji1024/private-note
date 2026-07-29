"use client";

import { useState } from "react";
import type { TodoList, TodoItem } from "@/lib/types";
import ThreeDotMenu from "@/components/ThreeDotMenu";

export default function TodoView({
  initialLists,
  currentUserId,
}: {
  initialLists: (TodoList & { items: TodoItem[] })[];
  currentUserId: string;
}) {
  const [lists, setLists] = useState(initialLists);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [newListTitle, setNewListTitle] = useState("");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListTitle, setEditingListTitle] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemTitle, setEditingItemTitle] = useState("");
  const [showListForm, setShowListForm] = useState(false);

  const activeList = lists.find((l) => l.id === activeListId) || null;

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    const res = await fetch("/api/todos/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newListTitle }),
    });

    if (res.ok) {
      const list = await res.json();
      setLists([...lists, { ...list, items: [] }]);
      setNewListTitle("");
    }
  };

  const handleUpdateList = async (listId: string) => {
    if (!editingListTitle.trim()) return;

    const res = await fetch(`/api/todos/lists/${listId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editingListTitle }),
    });

    if (res.ok) {
      setLists(
        lists.map((l) =>
          l.id === listId ? { ...l, title: editingListTitle.trim() } : l
        )
      );
      setEditingListId(null);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm("リストを削除しますか？")) return;

    const res = await fetch(`/api/todos/lists/${listId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setLists(lists.filter((l) => l.id !== listId));
      if (activeListId === listId) setActiveListId(null);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !activeListId) return;

    const res = await fetch(`/api/todos/lists/${activeListId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newItemTitle }),
    });

    if (res.ok) {
      const item = await res.json();
      setLists(
        lists.map((l) =>
          l.id === activeListId ? { ...l, items: [...l.items, item] } : l
        )
      );
      setNewItemTitle("");
    }
  };

  const handleToggleItem = async (item: TodoItem) => {
    const res = await fetch(`/api/todos/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !item.done }),
    });

    if (res.ok) {
      const updated = await res.json();
      setLists(
        lists.map((l) =>
          l.id === activeListId
            ? {
                ...l,
                items: l.items.map((i) => (i.id === item.id ? updated : i)),
              }
            : l
        )
      );
    }
  };

  const handleUpdateItem = async (itemId: string) => {
    if (!editingItemTitle.trim()) return;

    const res = await fetch(`/api/todos/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editingItemTitle }),
    });

    if (res.ok) {
      const updated = await res.json();
      setLists(
        lists.map((l) =>
          l.id === activeListId
            ? {
                ...l,
                items: l.items.map((i) => (i.id === itemId ? updated : i)),
              }
            : l
        )
      );
      setEditingItemId(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("この項目を削除しますか？")) return;

    const res = await fetch(`/api/todos/items/${itemId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setLists(
        lists.map((l) =>
          l.id === activeListId
            ? { ...l, items: l.items.filter((i) => i.id !== itemId) }
            : l
        )
      );
    }
  };

  const pendingItems = activeList?.items.filter((i) => !i.done) || [];
  const doneItems = activeList?.items.filter((i) => i.done) || [];

  if (activeList) {
    return (
      <>
        <button
          className="btn btn--ghost"
          onClick={() => setActiveListId(null)}
          style={{ marginBottom: "1rem" }}
        >
          ← リスト一覧に戻る
        </button>

        <div className="card" style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            {editingListId === activeList.id ? (
              <input
                className="input"
                value={editingListTitle}
                onChange={(e) => setEditingListTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateList(activeList.id);
                  if (e.key === "Escape") setEditingListId(null);
                }}
                autoFocus
              />
            ) : (
              <h3 style={{ margin: 0 }}>{activeList.title}</h3>
            )}
            {activeList.created_by === currentUserId && (
              <ThreeDotMenu
                onEdit={() => {
                  setEditingListId(activeList.id);
                  setEditingListTitle(activeList.title);
                }}
                onDelete={() => handleDeleteList(activeList.id)}
              />
            )}
          </div>
        </div>

        <form onSubmit={handleCreateItem} style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              className="input"
              placeholder="新しいタスク..."
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
            />
            <button
              className="btn"
              type="submit"
              disabled={!newItemTitle.trim()}
            >
              追加
            </button>
          </div>
        </form>

        {pendingItems.map((item) => (
          <TodoItemCard
            key={item.id}
            item={item}
            currentUserId={currentUserId}
            onToggle={handleToggleItem}
            onDelete={handleDeleteItem}
            editingItemId={editingItemId}
            setEditingItemId={setEditingItemId}
            editingItemTitle={editingItemTitle}
            setEditingItemTitle={setEditingItemTitle}
            onUpdate={handleUpdateItem}
          />
        ))}

        {doneItems.length > 0 && (
          <>
            <h4
              style={{
                fontSize: "0.85rem",
                color: "#999",
                marginTop: "1.5rem",
                marginBottom: "0.5rem",
              }}
            >
              完了済み
            </h4>
            {doneItems.map((item) => (
              <TodoItemCard
                key={item.id}
                item={item}
                currentUserId={currentUserId}
                onToggle={handleToggleItem}
                onDelete={handleDeleteItem}
                editingItemId={editingItemId}
                setEditingItemId={setEditingItemId}
                editingItemTitle={editingItemTitle}
                setEditingItemTitle={setEditingItemTitle}
                onUpdate={handleUpdateItem}
              />
            ))}
          </>
        )}

        {activeList.items.length === 0 && (
          <p style={{ color: "#999", textAlign: "center" }}>
            タスクがありません
          </p>
        )}
      </>
    );
  }

  return (
    <>
      {!showListForm ? (
        <button
          className="btn"
          onClick={() => setShowListForm(true)}
          style={{ width: "100%", marginBottom: "1rem" }}
        >
          + リスト
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            handleCreateList(e);
            setShowListForm(false);
          }}
          style={{ marginBottom: "1rem" }}
        >
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              className="input"
              placeholder="新しいリスト..."
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              autoFocus
            />
            <button
              className="btn"
              type="submit"
              disabled={!newListTitle.trim()}
            >
              作成
            </button>
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => {
                setShowListForm(false);
                setNewListTitle("");
              }}
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {lists.length > 0 ? (
        lists.map((list) => (
          <div
            key={list.id}
            className="card"
            style={{
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            onClick={() => setActiveListId(list.id)}
          >
            <span>
              {list.title}
              <span
                style={{
                  color: "#999",
                  fontSize: "0.85rem",
                  marginLeft: "0.5rem",
                }}
              >
                {list.items.filter((i) => !i.done).length}/{list.items.length}
              </span>
            </span>
            {list.created_by === currentUserId && (
              <div onClick={(e) => e.stopPropagation()}>
                <ThreeDotMenu onDelete={() => handleDeleteList(list.id)} />
              </div>
            )}
          </div>
        ))
      ) : (
        <p style={{ color: "#999", textAlign: "center" }}>リストがありません</p>
      )}
    </>
  );
}

function TodoItemCard({
  item,
  currentUserId,
  onToggle,
  onDelete,
  editingItemId,
  setEditingItemId,
  editingItemTitle,
  setEditingItemTitle,
  onUpdate,
}: {
  item: TodoItem;
  currentUserId: string;
  onToggle: (item: TodoItem) => void;
  onDelete: (id: string) => void;
  editingItemId: string | null;
  setEditingItemId: (id: string | null) => void;
  editingItemTitle: string;
  setEditingItemTitle: (v: string) => void;
  onUpdate: (id: string) => void;
}) {
  const isEditing = editingItemId === item.id;

  return (
    <div
      className="card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        opacity: item.done ? 0.6 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={item.done}
        onChange={() => onToggle(item)}
        style={{
          width: "1.1rem",
          height: "1.1rem",
          cursor: "pointer",
          flexShrink: 0,
        }}
      />
      {isEditing ? (
        <input
          className="input"
          value={editingItemTitle}
          onChange={(e) => setEditingItemTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onUpdate(item.id);
            if (e.key === "Escape") setEditingItemId(null);
          }}
          autoFocus
          style={{ flex: 1 }}
        />
      ) : (
        <span
          style={{
            flex: 1,
            textDecoration: item.done ? "line-through" : "none",
            color: item.done ? "#999" : "inherit",
          }}
        >
          {item.title}
        </span>
      )}
      {item.created_by === currentUserId && (
        <div style={{ flexShrink: 0 }}>
          <ThreeDotMenu
            onEdit={() => {
              setEditingItemId(item.id);
              setEditingItemTitle(item.title);
            }}
            onDelete={() => onDelete(item.id)}
          />
        </div>
      )}
    </div>
  );
}
