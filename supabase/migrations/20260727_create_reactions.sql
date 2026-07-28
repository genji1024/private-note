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

CREATE POLICY "Anyone can read reactions" ON comment_reactions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert/delete reactions" ON comment_reactions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete own reactions" ON comment_reactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read reaction types" ON reaction_types
  FOR SELECT USING (true);

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
