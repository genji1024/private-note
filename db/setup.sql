-- ============================================================
-- db/setup.sql — Plain-Postgres setup for private-note
--
-- Mirror of the Supabase SQL in supabase/*.sql with all
-- auth.role() / auth.uid() / auth.jwt() / RLS references removed
-- (plain Postgres has no auth schema). Semantics are preserved.
--
-- PREREQUISITE: the 14 tables must already exist (drizzle-kit
-- migrations, generated from src/db/schema.ts) — the functions
-- below reference tables (users, threads, thread_comments,
-- comment_read_status, reaction_types, settings) and will ERROR
-- if they are missing when invoked/created.
--
-- Implementation notes:
--   * Functions are PL/pgSQL per the migration plan.
--   * `SECURITY INVOKER`: plain Postgres has no RLS, so the owner
--     connection (the app user, who owns all tables) executes them
--     directly. No SECURITY DEFINER elevation is needed.
--   * Read-only functions are marked STABLE.
--
-- Idempotent: safe to re-run. All inserts are guarded by
-- ON CONFLICT / NOT EXISTS; functions use CREATE OR REPLACE
-- (DROP guards included where the return type was changed by
-- later supabase/migrations — mirror of migration_simplify.sql).
-- ============================================================

-- 1. pgcrypto provides crypt() / gen_salt() for password hashing
--    (gen_random_uuid() is built-in on PG13+).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 2. User seeds: genji / chihiro (password = username)
--    (supabase/account_migration.sql)
--    username is UNIQUE, so ON CONFLICT (username) dedupes on re-run.
-- ============================================================
INSERT INTO users (username, password_hash, display_name)
VALUES
  ('genji',  crypt('genji',  gen_salt('bf')), 'genji'),
  ('chihiro', crypt('chihiro', gen_salt('bf')), 'chihiro')
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- 3. Function: verify_user
--    Source: supabase/migration_simplify.sql (final version
--    includes profile_image_url). Successor of the functions.sql
--    version (which lacked profile_image_url).
-- ============================================================
DROP FUNCTION IF EXISTS verify_user(text, text);
CREATE OR REPLACE FUNCTION verify_user(
  p_username text,
  p_password text
)
RETURNS TABLE (
  id uuid,
  username text,
  display_name text,
  profile_image_url text
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
  RETURN QUERY
    SELECT u.id, u.username, u.display_name, u.profile_image_url
    FROM users u
    WHERE u.username = p_username
      AND u.password_hash = crypt(p_password, u.password_hash);
END;
$$;

-- ============================================================
-- 4. Function: update_password
--    Source: supabase/account_migration.sql.
-- ============================================================
CREATE OR REPLACE FUNCTION update_password(
  p_user_id uuid,
  p_new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE users
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE id = p_user_id;
END;
$$;

-- ============================================================
-- 5. Function: get_threads
--    Source: supabase/migrations/20260729_add_thread_description.sql
--    (final version includes description + is_default).
-- ============================================================
DROP FUNCTION IF EXISTS get_threads();
CREATE OR REPLACE FUNCTION get_threads()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  created_by uuid,
  author_name text,
  comment_count bigint,
  is_default boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
  RETURN QUERY
    SELECT
      t.id,
      t.title,
      t.description,
      t.created_by,
      u.display_name AS author_name,
      (SELECT count(*) FROM thread_comments tc WHERE tc.thread_id = t.id) AS comment_count,
      t.is_default,
      t.created_at,
      t.updated_at
    FROM threads t
    JOIN users u ON u.id = t.created_by
    ORDER BY t.is_default DESC, t.created_at DESC;
END;
$$;

-- ============================================================
-- 6. Function: get_thread_comments
--    Source: supabase/migration_simplify.sql (includes title).
-- ============================================================
DROP FUNCTION IF EXISTS get_thread_comments(uuid);
CREATE OR REPLACE FUNCTION get_thread_comments(p_thread_id uuid)
RETURNS TABLE (
  id uuid,
  thread_id uuid,
  author_id uuid,
  author_name text,
  title text,
  body text,
  image_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
  RETURN QUERY
    SELECT
      tc.id,
      tc.thread_id,
      tc.author_id,
      u.display_name AS author_name,
      tc.title,
      tc.body,
      tc.image_url,
      tc.created_at,
      tc.updated_at
    FROM thread_comments tc
    JOIN users u ON u.id = tc.author_id
    WHERE tc.thread_id = p_thread_id
    ORDER BY tc.created_at ASC;
END;
$$;

-- ============================================================
-- 7. Function: get_diary_entries_with_read_status
--    Source: supabase/migration_simplify.sql.
--    Successor of get_entries_with_read_status (entries table -> 
--    thread_comments, read_status -> comment_read_status).
-- ============================================================
DROP FUNCTION IF EXISTS get_diary_entries_with_read_status(uuid);
CREATE OR REPLACE FUNCTION get_diary_entries_with_read_status(p_current_user_id uuid)
RETURNS TABLE (
  id uuid,
  author_id uuid,
  author_name text,
  title text,
  body text,
  image_url text,
  created_at timestamptz,
  updated_at timestamptz,
  read_by_me boolean,
  read_by_partner boolean
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
  RETURN QUERY
    SELECT
      tc.id,
      tc.author_id,
      u.display_name AS author_name,
      tc.title,
      tc.body,
      tc.image_url,
      tc.created_at,
      tc.updated_at,
      EXISTS(
        SELECT 1 FROM comment_read_status crs
        WHERE crs.comment_id = tc.id AND crs.reader_id = p_current_user_id
      ) AS read_by_me,
      EXISTS(
        SELECT 1 FROM comment_read_status crs
        WHERE crs.comment_id = tc.id AND crs.reader_id != p_current_user_id
      ) AS read_by_partner
    FROM thread_comments tc
    JOIN users u ON u.id = tc.author_id
    JOIN threads t ON t.id = tc.thread_id
    WHERE t.is_default = true
    ORDER BY tc.created_at DESC;
END;
$$;

-- ============================================================
-- 8. reaction_types seed (5 emoji rows)
--    Source: supabase/setup_all.sql / 20260727_create_reactions.sql
--    (values 👍/❤️/😊/🎉/😢 — the original has no 😮).
--
--    NOTE: the original used `ON CONFLICT DO NOTHING`, which is NOT
--    idempotent here: reaction_types has no UNIQUE column and its PK is
--    GENERATED ALWAYS AS IDENTITY, so re-running would insert duplicate
--    rows. Use NOT EXISTS guard instead so re-runs are safe.
-- ============================================================
INSERT INTO reaction_types (type, value, label, sort_order)
SELECT v.type, v.value, v.label, v.sort_order
FROM (VALUES
  ('emoji', '👍',  'いいね',     1),
  ('emoji', '❤️',  'ハート',     2),
  ('emoji', '😊',  'スマイル',   3),
  ('emoji', '🎉',  'おめでとう', 4),
  ('emoji', '😢',  '悲しい',     5)
) AS v(type, value, label, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM reaction_types rt
  WHERE rt.type = v.type AND rt.value = v.value
);

-- ============================================================
-- 9. settings seed (single row, id = 1)
--    Source: supabase/setup_all.sql / 20260727_create_settings.sql.
-- ============================================================
INSERT INTO settings (id, site_title, tab_diary, tab_notes, tab_todo, status_unread, status_read, status_done)
VALUES (1, 'ちひろノート', '日記', 'ノート', 'TO-DO', '未読', '既読', '読んだ')
ON CONFLICT (id) DO NOTHING;