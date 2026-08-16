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
