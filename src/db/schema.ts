// Drizzle schema for private-note (plain Postgres).
//
// Reproduces every table from supabase/schema.sql, supabase/threads_schema.sql,
// supabase/setup_all.sql and supabase/migrations/*.sql (combined with
// supabase/migration_simplify.sql) 1:1: column names, types, nullability,
// defaults, PKs, UNIQUE constraints, CHECK constraints and FK ON DELETE rules.
//
// Column order follows the final physical order after all ALTER TABLE ... ADD
// COLUMN migrations.

import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// 1. users
// schema.sql + setup_all.sql (last_login_at) + account_migration.sql (profile_image_url)
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  display_name: text("display_name").notNull().default(""),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  last_login_at: timestamp("last_login_at", { withTimezone: true }),
  profile_image_url: text("profile_image_url"),
});

// ---------------------------------------------------------------------------
// 2. entries (old diary, kept as backup; used by /api/entries)
// ---------------------------------------------------------------------------
export const entries = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    author_id: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""),
    image_url: text("image_url"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_entries_created_at").on(table.created_at.desc()),
    index("idx_entries_author_id").on(table.author_id),
  ]
);

// ---------------------------------------------------------------------------
// 3. read_status (compound PK)
// ---------------------------------------------------------------------------
export const readStatus = pgTable(
  "read_status",
  {
    entry_id: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    reader_id: uuid("reader_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    read_at: timestamp("read_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.entry_id, table.reader_id] })]
);

// ---------------------------------------------------------------------------
// 4. threads
// threads_schema.sql + migration_simplify.sql (is_default) + 20260729 (description)
// ---------------------------------------------------------------------------
export const threads = pgTable(
  "threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    created_by: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    is_default: boolean("is_default").notNull().default(false),
  },
  (table) => [index("idx_threads_created_at").on(table.created_at.desc())]
);

// ---------------------------------------------------------------------------
// 5. thread_comments (shared diary/comment entity)
// threads_schema.sql + migration_simplify.sql (title)
// NOTE: image_url holds a single URL string OR a JSON array string (mixed) — text.
// ---------------------------------------------------------------------------
export const threadComments = pgTable(
  "thread_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    thread_id: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    author_id: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""),
    image_url: text("image_url"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_thread_comments_thread_id").on(
      table.thread_id,
      table.created_at.desc()
    ),
  ]
);

// ---------------------------------------------------------------------------
// 6. comment_read_status (compound PK, replaces read_status)
// ---------------------------------------------------------------------------
export const commentReadStatus = pgTable(
  "comment_read_status",
  {
    comment_id: uuid("comment_id")
      .notNull()
      .references(() => threadComments.id, { onDelete: "cascade" }),
    reader_id: uuid("reader_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    read_at: timestamp("read_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.comment_id, table.reader_id] })]
);

// ---------------------------------------------------------------------------
// 7. calendar_events
// threads_schema.sql + 20260804 (recurrence_rule)
// ---------------------------------------------------------------------------
export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    author_id: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    location: text("location").notNull().default(""),
    start_at: timestamp("start_at", { withTimezone: true }).notNull(),
    end_at: timestamp("end_at", { withTimezone: true }),
    image_url: text("image_url"),
    recurrence_rule: text("recurrence_rule"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_calendar_events_start_at").on(table.start_at.asc()),
    index("idx_calendar_events_author_id").on(table.author_id),
  ]
);

// ---------------------------------------------------------------------------
// 8. calendar_event_exceptions — UNIQUE(event_id, exception_date)
// ---------------------------------------------------------------------------
export const calendarEventExceptions = pgTable(
  "calendar_event_exceptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    event_id: uuid("event_id")
      .notNull()
      .references(() => calendarEvents.id, { onDelete: "cascade" }),
    exception_date: timestamp("exception_date", {
      withTimezone: true,
    }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("calendar_event_exceptions_event_id_exception_date_unique").on(
      table.event_id,
      table.exception_date
    ),
    index("idx_calendar_event_exceptions_event_id").on(table.event_id),
  ]
);

// ---------------------------------------------------------------------------
// 9. push_subscriptions — UNIQUE(endpoint), keys jsonb
// ---------------------------------------------------------------------------
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    keys: jsonb("keys").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("push_subscriptions_endpoint_unique").on(table.endpoint),
    index("idx_push_subscriptions_user_id").on(table.user_id),
  ]
);

// ---------------------------------------------------------------------------
// 10. reaction_types — id bigint IDENTITY, CHECK(type IN ('emoji', 'image'))
// ---------------------------------------------------------------------------
export const reactionTypes = pgTable(
  "reaction_types",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    type: text("type").notNull(),
    value: text("value").notNull(),
    label: text("label").notNull().default(""),
    sort_order: integer("sort_order").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      "reaction_types_type_check",
      sql`${table.type} IN ('emoji', 'image')`
    ),
  ]
);

// ---------------------------------------------------------------------------
// 11. comment_reactions — id bigint IDENTITY, UNIQUE(comment_id, user_id)
// ---------------------------------------------------------------------------
export const commentReactions = pgTable(
  "comment_reactions",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    comment_id: uuid("comment_id")
      .notNull()
      .references(() => threadComments.id, { onDelete: "cascade" }),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reaction_type_id: bigint("reaction_type_id", { mode: "number" })
      .notNull()
      .references(() => reactionTypes.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    unique("comment_reactions_comment_id_user_id_unique").on(
      table.comment_id,
      table.user_id
    ),
  ]
);

// ---------------------------------------------------------------------------
// 12. settings — id bigint fixed 1, CHECK(id = 1)
// ---------------------------------------------------------------------------
export const settings = pgTable(
  "settings",
  {
    id: bigint("id", { mode: "number" }).primaryKey().default(1),
    site_title: text("site_title").notNull().default("ちひろノート"),
    tab_diary: text("tab_diary").notNull().default("日記"),
    tab_notes: text("tab_notes").notNull().default("ノート"),
    tab_todo: text("tab_todo").notNull().default("TO-DO"),
    status_unread: text("status_unread").notNull().default("未読"),
    status_read: text("status_read").notNull().default("既読"),
    status_done: text("status_done").notNull().default("読んだ"),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [check("settings_id_check", sql`${table.id} = 1`)]
);

// ---------------------------------------------------------------------------
// 13. todo_lists
// NOTE: created_by FK has NO ON DELETE (default NO ACTION) in the SQL.
// ---------------------------------------------------------------------------
export const todoLists = pgTable("todo_lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  created_by: uuid("created_by")
    .notNull()
    .references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// 14. todo_items
// NOTE: done_by / created_by FKs have NO ON DELETE (default NO ACTION).
// ---------------------------------------------------------------------------
export const todoItems = pgTable("todo_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  todo_list_id: uuid("todo_list_id")
    .notNull()
    .references(() => todoLists.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  done: boolean("done").notNull().default(false),
  done_by: uuid("done_by").references(() => users.id),
  done_at: timestamp("done_at", { withTimezone: true }),
  created_by: uuid("created_by")
    .notNull()
    .references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
