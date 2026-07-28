-- ============================================================
-- 全マイグレーション統合セットアップ
-- Supabase Dashboard > SQL Editor で実行してください
-- すべての SQL は IF NOT EXISTS / ON CONFLICT DO NOTHING で
-- べき等性を保証しています。再実行しても安全です。
-- ============================================================

-- ============================================================
-- 1. users テーブルに last_login_at カラム追加
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- ============================================================
-- 2. push_subscriptions テーブル作成
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  endpoint text not null,
  keys jsonb not null,
  created_at timestamptz not null default now(),
  unique(endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON push_subscriptions (user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own subscriptions" ON push_subscriptions;
CREATE POLICY "Users can read own subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all" ON push_subscriptions;
CREATE POLICY "Service role can manage all" ON push_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 3. reaction_types / comment_reactions テーブル作成
-- ============================================================
CREATE TABLE IF NOT EXISTS reaction_types (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('emoji', 'image')),
  value TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comment_reactions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES thread_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type_id BIGINT NOT NULL REFERENCES reaction_types(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (comment_id, user_id)
);

ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reaction_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read reactions" ON comment_reactions;
CREATE POLICY "Anyone can read reactions" ON comment_reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert/delete reactions" ON comment_reactions;
CREATE POLICY "Authenticated users can insert/delete reactions" ON comment_reactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own reactions" ON comment_reactions;
CREATE POLICY "Users can delete own reactions" ON comment_reactions
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read reaction types" ON reaction_types;
CREATE POLICY "Anyone can read reaction types" ON reaction_types
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only genji can manage reaction types" ON reaction_types;
CREATE POLICY "Only genji can manage reaction types" ON reaction_types
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND username = 'genji')
  );

INSERT INTO reaction_types (type, value, label, sort_order) VALUES
  ('emoji', '👍', 'いいね', 1),
  ('emoji', '❤️', 'ハート', 2),
  ('emoji', '😊', 'スマイル', 3),
  ('emoji', '🎉', 'おめでとう', 4),
  ('emoji', '😢', '悲しい', 5)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. settings テーブル作成（タブ名カラム含む）
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id BIGINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_title TEXT NOT NULL DEFAULT 'ちひろノート',
  tab_diary TEXT NOT NULL DEFAULT '日記',
  tab_notes TEXT NOT NULL DEFAULT 'ノート',
  tab_todo TEXT NOT NULL DEFAULT 'TO-DO',
  status_unread TEXT NOT NULL DEFAULT '未読',
  status_read TEXT NOT NULL DEFAULT '既読',
  status_done TEXT NOT NULL DEFAULT '読んだ',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 既存テーブルにカラム追加（後方互換性）
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tab_diary TEXT NOT NULL DEFAULT '日記';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tab_notes TEXT NOT NULL DEFAULT 'ノート';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tab_todo TEXT NOT NULL DEFAULT 'TO-DO';

INSERT INTO settings (id, site_title, tab_diary, tab_notes, tab_todo, status_unread, status_read, status_done)
VALUES (1, 'ちひろノート', '日記', 'ノート', 'TO-DO', '未読', '既読', '読んだ')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. todo_lists / todo_items テーブル作成
-- ============================================================
CREATE TABLE IF NOT EXISTS todo_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS todo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_list_id UUID NOT NULL REFERENCES todo_lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  done_by UUID REFERENCES users(id),
  done_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE todo_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read all todo_lists" ON todo_lists;
CREATE POLICY "Users can read all todo_lists" ON todo_lists FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert todo_lists" ON todo_lists;
CREATE POLICY "Users can insert todo_lists" ON todo_lists FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update their own todo_lists" ON todo_lists;
CREATE POLICY "Users can update their own todo_lists" ON todo_lists FOR UPDATE
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "Users can delete their own todo_lists" ON todo_lists;
CREATE POLICY "Users can delete their own todo_lists" ON todo_lists FOR DELETE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can read all todo_items" ON todo_items;
CREATE POLICY "Users can read all todo_items" ON todo_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert todo_items" ON todo_items;
CREATE POLICY "Users can insert todo_items" ON todo_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update any todo_items" ON todo_items;
CREATE POLICY "Users can update any todo_items" ON todo_items FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Users can delete their own todo_items" ON todo_items;
CREATE POLICY "Users can delete their own todo_items" ON todo_items FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================
-- 6. calendar_events テーブル作成
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_start_at ON calendar_events (start_at ASC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_author_id ON calendar_events (author_id);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read calendar_events" ON calendar_events;
CREATE POLICY "Anyone can read calendar_events" ON calendar_events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can write calendar_events" ON calendar_events;
CREATE POLICY "Authenticated can write calendar_events" ON calendar_events
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 7. 全マイグレーションを完了済みとして登録
-- ============================================================
INSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES
  ('20260727_add_last_login', 'add last login', 1),
  ('20260727_add_tab_names', 'add tab names to settings table', 2),
  ('20260727_create_push_subscriptions', 'create push subscriptions', 3),
  ('20260727_create_reactions', 'create reactions', 5),
  ('20260727_create_settings', 'create settings table', 2),
  ('20260727_create_todos', 'create todos', 4),
  ('20260728_create_calendar_events', 'create calendar events', 3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 完了！ supabase db push は不要になりました。
-- ============================================================
