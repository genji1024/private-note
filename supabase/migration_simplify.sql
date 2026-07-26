-- Migration: Simplify DB structure (Issue #11)
-- Run in Supabase Dashboard SQL Editor
-- WARNING: This migration is DESTRUCTIVE to the `entries` table.
-- Back up data before running.

BEGIN;

-- 1. Add is_default column to threads (for the diary default thread)
alter table threads add column if not exists is_default boolean not null default false;

-- 2. Add title column to thread_comments (for diary entries that have titles)
alter table thread_comments add column if not exists title text not null default '';

-- 3. Create the default '日記' thread if it doesn't exist
insert into threads (title, created_by, is_default)
select '日記', (select id from users limit 1), true
where not exists (select 1 from threads where is_default = true);

-- 4. Migrate entries data to thread_comments
-- Get the default diary thread id
do $$
declare
  v_diary_thread_id uuid;
begin
  select id into v_diary_thread_id from threads where is_default = true limit 1;

  -- Migrate all entries to thread_comments under the diary thread
  insert into thread_comments (thread_id, author_id, title, body, image_url, created_at, updated_at)
  select
    v_diary_thread_id,
    e.author_id,
    e.title,
    e.body,
    e.image_url,
    e.created_at,
    e.updated_at
  from entries e
  where not exists (
    select 1 from thread_comments tc
    where tc.thread_id = v_diary_thread_id
      and tc.author_id = e.author_id
      and tc.body = e.body
      and tc.created_at = e.created_at
  );

  -- Migrate read_status from entries to thread_comments
  insert into comment_read_status (comment_id, reader_id, read_at)
  select
    tc.id,
    rs.reader_id,
    rs.read_at
  from read_status rs
  join entries e on e.id = rs.entry_id
  join thread_comments tc on tc.thread_id = v_diary_thread_id
    and tc.author_id = e.author_id
    and tc.body = e.body
    and tc.created_at = e.created_at
  where not exists (
    select 1 from comment_read_status crs
    where crs.comment_id = tc.id and crs.reader_id = rs.reader_id
  );
end $$;

-- 5. Create comment_read_status table (replaces read_status)
create table if not exists comment_read_status (
  comment_id uuid not null references thread_comments(id) on delete cascade,
  reader_id uuid not null references users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (comment_id, reader_id)
);

alter table comment_read_status enable row level security;

create policy "Anyone can read comment_read_status"
  on comment_read_status for select using (true);
create policy "Authenticated can write comment_read_status"
  on comment_read_status for all
  to authenticated
  using (true) with check (true);

-- 6. Drop old tables (DISABLED for safety — keep entries/read_status as backup)
-- To complete the migration after verifying data, uncomment:
-- drop table if exists read_status;
-- drop table if exists entries;

COMMIT;

-- Updated functions

-- Replace get_entries_with_read_status with get_diary_entries_with_read_status
create or replace function get_diary_entries_with_read_status(p_current_user_id uuid)
returns table (
  id uuid,
  author_id uuid,
  author_name text,
  title text,
  body text,
  image_url text,
  created_at timestamptz,
  updated_at timestamptz,
  read_by_me boolean,
  read_by_partner boolean
)
language sql
security definer
as $$
  select
    tc.id,
    tc.author_id,
    u.display_name as author_name,
    tc.title,
    tc.body,
    tc.image_url,
    tc.created_at,
    tc.updated_at,
    exists(
      select 1 from comment_read_status crs
      where crs.comment_id = tc.id and crs.reader_id = p_current_user_id
    ) as read_by_me,
    exists(
      select 1 from comment_read_status crs
      where crs.comment_id = tc.id and crs.reader_id != p_current_user_id
    ) as read_by_partner
  from thread_comments tc
  join users u on u.id = tc.author_id
  join threads t on t.id = tc.thread_id
  where t.is_default = true
  order by tc.created_at desc;
$$;

-- Update get_thread_comments to include title
create or replace function get_thread_comments(p_thread_id uuid)
returns table (
  id uuid,
  thread_id uuid,
  author_id uuid,
  author_name text,
  title text,
  body text,
  image_url text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
as $$
  select
    tc.id,
    tc.thread_id,
    tc.author_id,
    u.display_name as author_name,
    tc.title,
    tc.body,
    tc.image_url,
    tc.created_at,
    tc.updated_at
  from thread_comments tc
  join users u on u.id = tc.author_id
  where tc.thread_id = p_thread_id
  order by tc.created_at asc;
$$;

-- Update get_threads to include is_default
create or replace function get_threads()
returns table (
  id uuid,
  title text,
  created_by uuid,
  author_name text,
  comment_count bigint,
  is_default boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
as $$
  select
    t.id,
    t.title,
    t.created_by,
    u.display_name as author_name,
    (select count(*) from thread_comments tc where tc.thread_id = t.id) as comment_count,
    t.is_default,
    t.created_at,
    t.updated_at
  from threads t
  join users u on u.id = t.created_by
  order by t.is_default desc, t.created_at desc;
$$;