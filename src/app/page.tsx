import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  calendarEventExceptions,
  calendarEvents,
  settings as settingsTable,
  todoItems,
  todoLists,
  users,
} from "@/db/schema";
import type {
  Thread,
  ThreadComment,
  UserProfile,
  TodoList,
  TodoItem,
  CalendarEvent,
  CalendarEventException,
} from "@/lib/types";
import UserMenu from "@/components/UserMenu";
import HomePageClient from "@/components/HomePageClient";

/** Convert a Postgres timestamptz value (Date or ISO string) to the ISO string
 *  client components receive today, so the client-facing shape is unchanged. */
function toIso(value: string | Date | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return new Date(value).toISOString();
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id as string;
  const displayName =
    ((session.user as any).display_name as string) || session.user?.name || "";
  const profileImageUrl = (session.user as any).profile_image_url as
    string | null;
  const username = (session.user as any).username as string;

  const settingsRows = await getDb()
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.id, 1))
    .limit(1);
  const row = settingsRows[0];
  const siteTitle = row?.site_title || "ちひろノート";

  const userRows = await getDb()
    .select({
      id: users.id,
      display_name: users.display_name,
      profile_image_url: users.profile_image_url,
      created_at: users.created_at,
      last_login_at: users.last_login_at,
    })
    .from(users);
  const userProfiles: Record<string, UserProfile> = {};
  for (const u of userRows || []) {
    userProfiles[u.id] = {
      display_name: u.display_name,
      profile_image_url: u.profile_image_url,
      created_at: new Date(u.created_at).toISOString(),
      last_login_at: u.last_login_at
        ? new Date(u.last_login_at).toISOString()
        : null,
    };
  }

  // Fetch all threads (diary thread has is_default=true)
  const threadsResult = await getDb().execute(sql`select * from get_threads()`);
  // get_threads returns comment_count as bigint; node-postgres exposes the raw
  // value as a string, while Supabase/PostgREST exposed it as a JSON number.
  // Normalize it back to a number to keep the exact response shape.
  const threads: Thread[] = ((threadsResult.rows as Thread[]) || []).map(
    (t) => ({
      ...t,
      comment_count: Number(t.comment_count),
      created_at: toIso(t.created_at) as string,
      updated_at: toIso(t.updated_at) as string,
    })
  );

  const diaryThread = threads.find((t: Thread) => t.is_default) || null;
  const otherThreads = threads.filter((t: Thread) => !t.is_default) || [];

  // Fetch diary entries (comments in the diary thread)
  let diaryEntries: ThreadComment[] = [];
  if (diaryThread) {
    const result = await getDb().execute(
      sql`select * from get_diary_entries_with_read_status(${userId})`
    );
    diaryEntries = ((result.rows as ThreadComment[]) || []).map((c) => ({
      ...c,
      created_at: toIso(c.created_at) as string,
      updated_at: toIso(c.updated_at) as string,
    }));
  }

  // Fetch comments for each non-default thread
  const threadsWithComments: { thread: Thread; comments: ThreadComment[] }[] =
    [];
  for (const t of otherThreads) {
    const result = await getDb().execute(
      sql`select * from get_thread_comments(${t.id})`
    );
    const comments = ((result.rows as ThreadComment[]) || []).map((c) => ({
      ...c,
      created_at: toIso(c.created_at) as string,
      updated_at: toIso(c.updated_at) as string,
    }));
    threadsWithComments.push({
      thread: t,
      comments,
    });
  }

  // Fetch todo lists with items
  const todoListsRaw = await getDb()
    .select({
      id: todoLists.id,
      title: todoLists.title,
      created_by: todoLists.created_by,
      created_at: todoLists.created_at,
      updated_at: todoLists.updated_at,
    })
    .from(todoLists)
    .orderBy(asc(todoLists.created_at));

  const todoListsWithItems: (TodoList & { items: TodoItem[] })[] = [];
  for (const list of todoListsRaw || []) {
    const items = await getDb()
      .select({
        id: todoItems.id,
        todo_list_id: todoItems.todo_list_id,
        title: todoItems.title,
        done: todoItems.done,
        done_by: todoItems.done_by,
        done_at: todoItems.done_at,
        created_by: todoItems.created_by,
        created_at: todoItems.created_at,
        updated_at: todoItems.updated_at,
      })
      .from(todoItems)
      .where(eq(todoItems.todo_list_id, list.id))
      .orderBy(asc(todoItems.created_at));

    todoListsWithItems.push({
      id: list.id,
      title: list.title,
      created_by: list.created_by,
      created_at: toIso(list.created_at) as string,
      updated_at: toIso(list.updated_at) as string,
      items: (items || []).map((item) => ({
        id: item.id,
        todo_list_id: item.todo_list_id,
        title: item.title,
        done: item.done,
        done_by: item.done_by,
        done_at: toIso(item.done_at),
        created_by: item.created_by,
        created_at: toIso(item.created_at) as string,
        updated_at: toIso(item.updated_at) as string,
      })),
    });
  }

  // Fetch calendar events
  const calendarEventsData = await getDb()
    .select({
      id: calendarEvents.id,
      author_id: calendarEvents.author_id,
      title: calendarEvents.title,
      location: calendarEvents.location,
      start_at: calendarEvents.start_at,
      end_at: calendarEvents.end_at,
      image_url: calendarEvents.image_url,
      recurrence_rule: calendarEvents.recurrence_rule,
      created_at: calendarEvents.created_at,
      updated_at: calendarEvents.updated_at,
    })
    .from(calendarEvents)
    .orderBy(asc(calendarEvents.start_at));
  const calendarEventsList = (
    (calendarEventsData as unknown as CalendarEvent[]) || []
  ).map((e) => ({
    ...e,
    start_at: toIso(e.start_at) as string,
    end_at: toIso(e.end_at),
    created_at: toIso(e.created_at) as string,
    updated_at: toIso(e.updated_at) as string,
  }));

  const calendarExceptionsData = await getDb()
    .select({
      id: calendarEventExceptions.id,
      event_id: calendarEventExceptions.event_id,
      exception_date: calendarEventExceptions.exception_date,
      created_at: calendarEventExceptions.created_at,
    })
    .from(calendarEventExceptions);
  const calendarExceptions = (
    (calendarExceptionsData as unknown as CalendarEventException[]) || []
  ).map((ex) => ({
    ...ex,
    exception_date: toIso(ex.exception_date) as string,
    created_at: toIso(ex.created_at) as string,
  }));

  // settings テーブルに tab_calendar 列は無い（schema.ts に無い）ため
  // tabCalendar は常に固定値 "カレンダー" を渡す。
  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "1.5rem" }}>{siteTitle}</h2>
        <UserMenu
          displayName={displayName}
          profileImageUrl={profileImageUrl}
          username={username}
        />
      </div>

      <HomePageClient
        diaryThread={diaryThread}
        diaryEntries={diaryEntries}
        threadsWithComments={threadsWithComments}
        currentUserId={userId}
        statusUnread={row?.status_unread || "未読"}
        statusRead={row?.status_read || "既読"}
        statusDone={row?.status_done || "読んだ"}
        userProfiles={userProfiles}
        tabDiary={row?.tab_diary || "日記"}
        tabNotes={row?.tab_notes || "ノート"}
        tabTodo={row?.tab_todo || "TO-DO"}
        tabCalendar="カレンダー"
        todoLists={todoListsWithItems}
        calendarEvents={calendarEventsList}
        calendarExceptions={calendarExceptions}
      />
    </div>
  );
}
