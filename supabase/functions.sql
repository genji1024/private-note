-- helper functions for auth & read status

create or replace function verify_user(
  p_username text,
  p_password text
) returns table (
  id uuid,
  username text,
  display_name text
)
language sql
security definer
as $$
  select id, username, display_name
  from users
  where username = p_username
    and password_hash = crypt(p_password, password_hash);
$$;

create or replace function get_entries_with_read_status(p_current_user_id uuid)
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
    e.id,
    e.author_id,
    u.display_name as author_name,
    e.title,
    e.body,
    e.image_url,
    e.created_at,
    e.updated_at,
    exists(
      select 1 from read_status rs
      where rs.entry_id = e.id and rs.reader_id = p_current_user_id
    ) as read_by_me,
    exists(
      select 1 from read_status rs
      where rs.entry_id = e.id and rs.reader_id != p_current_user_id
    ) as read_by_partner
  from entries e
  join users u on u.id = e.author_id
  order by e.created_at desc;
$$;

-- seed first user
insert into users (username, password_hash, display_name)
values ('g-ohara', crypt('changeme', gen_salt('bf')), 'g-ohara')
on conflict (username) do nothing;
