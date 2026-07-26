-- Account migration for chihiro-note
-- Run after threads_functions.sql

-- Add profile_image_url column to users
alter table users add column if not exists profile_image_url text;

-- Add update_password function
create or replace function update_password(
  p_user_id uuid,
  p_new_password text
)
returns void
language sql
security definer
as $$
  update users
  set password_hash = crypt(p_new_password, gen_salt('bf'))
  where id = p_user_id;
$$;

-- Delete existing g-ohara account
delete from users where username = 'g-ohara';

-- Create genji and chihiro accounts (password = username)
insert into users (username, password_hash, display_name)
values
  ('genji', crypt('genji', gen_salt('bf')), 'genji'),
  ('chihiro', crypt('chihiro', gen_salt('bf')), 'chihiro')
on conflict (username) do nothing;
