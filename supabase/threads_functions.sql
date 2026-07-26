-- Thread helper functions

create or replace function get_threads()
returns table (
  id uuid,
  title text,
  created_by uuid,
  author_name text,
  comment_count bigint,
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
    t.created_at,
    t.updated_at
  from threads t
  join users u on u.id = t.created_by
  order by t.created_at desc;
$$;

create or replace function get_thread_comments(p_thread_id uuid)
returns table (
  id uuid,
  thread_id uuid,
  author_id uuid,
  author_name text,
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
    tc.body,
    tc.image_url,
    tc.created_at,
    tc.updated_at
  from thread_comments tc
  join users u on u.id = tc.author_id
  where tc.thread_id = p_thread_id
  order by tc.created_at asc;
$$;