create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  endpoint text not null,
  keys jsonb not null,
  created_at timestamptz not null default now(),
  unique(endpoint)
);

create index if not exists idx_push_subscriptions_user_id
  on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

drop policy if exists "Users can read own subscriptions" on push_subscriptions;
create policy "Users can read own subscriptions" on push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "Service role can manage all" on push_subscriptions;
create policy "Service role can manage all" on push_subscriptions
  for all using (auth.role() = 'service_role');
