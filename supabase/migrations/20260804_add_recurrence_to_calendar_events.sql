ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS recurrence_rule TEXT;

CREATE TABLE IF NOT EXISTS calendar_event_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  exception_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, exception_date)
);

CREATE INDEX IF NOT EXISTS idx_calendar_event_exceptions_event_id
  ON calendar_event_exceptions (event_id);

ALTER TABLE calendar_event_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read calendar_event_exceptions"
  ON calendar_event_exceptions;
CREATE POLICY "Anyone can read calendar_event_exceptions"
  ON calendar_event_exceptions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can write calendar_event_exceptions"
  ON calendar_event_exceptions;
CREATE POLICY "Authenticated can write calendar_event_exceptions"
  ON calendar_event_exceptions
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
