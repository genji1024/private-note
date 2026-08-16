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

CREATE POLICY "Users can read all todo_lists"
  ON todo_lists FOR SELECT
  USING (true);

CREATE POLICY "Users can insert todo_lists"
  ON todo_lists FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own todo_lists"
  ON todo_lists FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own todo_lists"
  ON todo_lists FOR DELETE
  USING (created_by = auth.uid());

CREATE POLICY "Users can read all todo_items"
  ON todo_items FOR SELECT
  USING (true);

CREATE POLICY "Users can insert todo_items"
  ON todo_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update any todo_items"
  ON todo_items FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete their own todo_items"
  ON todo_items FOR DELETE
  USING (created_by = auth.uid());
