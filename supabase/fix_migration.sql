-- ============================================================
-- Migration Fix Script
-- Run this in Supabase Dashboard > SQL Editor if `supabase db push`
-- fails with:
--   Applying migration 20260727_add_tab_names.sql...
--   Failed to execute statement
--   At statement: 3
--   INSERT INTO supabase_migrations.schema_migrations(...)
-- ============================================================

-- Step 1: Remove stuck migration entry (if exists)
DELETE FROM supabase_migrations.schema_migrations
WHERE version = '20260727_add_tab_names';

-- Step 2: Ensure settings table has tab columns
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tab_diary TEXT NOT NULL DEFAULT '日記';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tab_notes TEXT NOT NULL DEFAULT 'ノート';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tab_todo TEXT NOT NULL DEFAULT 'TO-DO';

-- Step 3: Register the migration as completed so supabase doesn't retry
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
SELECT '20260727_add_tab_names', 'add tab names to settings table', 2
WHERE NOT EXISTS (
  SELECT 1 FROM supabase_migrations.schema_migrations
  WHERE version = '20260727_add_tab_names'
);

-- After running this script, run:
--   supabase db push
-- It should now only apply 20260728_create_calendar_events.sql
