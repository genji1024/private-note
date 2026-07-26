-- Threads schema for chihiro-note
-- Run after schema.sql

create table if not exists threads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_by uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_threads_created_at on threads (created_at desc);

create table if not exists thread_comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references threads(id) on delete cascade,
  author_id uuid not null references users(id) on delete cascade,
  body text not null default '',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_thread_comments_thread_id on thread_comments (thread_id, created_at desc);

-- RLS
alter table threads enable row level security;
alter table thread_comments enable row level security;

create policy "Anyone can read threads" on threads
  for select using (true);
create policy "Authenticated can write threads" on threads
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Anyone can read thread_comments" on thread_comments
  for select using (true);
create policy "Authenticated can write thread_comments" on thread_comments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
