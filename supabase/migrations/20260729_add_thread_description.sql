-- Add description column to threads table
alter table threads add column if not exists description text not null default '';

-- Update get_threads to include description
drop function if exists get_threads();
create or replace function get_threads()
returns table (
  id uuid,
  title text,
  description text,
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
    t.description,
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
