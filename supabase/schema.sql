-- Supabase schema for chihiro-note
-- Run: supabase db push

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references users(id) on delete cascade,
  title text not null default '',
  body text not null default '',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_entries_created_at on entries (created_at desc);
create index if not exists idx_entries_author_id on entries (author_id);

create table if not exists read_status (
  entry_id uuid not null references entries(id) on delete cascade,
  reader_id uuid not null references users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (entry_id, reader_id)
);

-- RLS
alter table entries enable row level security;
alter table read_status enable row level security;

drop policy if exists "Anyone can read entries" on entries;
create policy "Anyone can read entries" on entries
  for select using (true);
drop policy if exists "Authenticated can write entries" on entries;
create policy "Authenticated can write entries" on entries
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "Anyone can read read_status" on read_status;
create policy "Anyone can read read_status" on read_status
  for select using (true);
drop policy if exists "Authenticated can write read_status" on read_status;
create policy "Authenticated can write read_status" on read_status
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
