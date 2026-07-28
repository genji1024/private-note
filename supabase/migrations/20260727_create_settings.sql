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

INSERT INTO settings (id, site_title, tab_diary, tab_notes, tab_todo, status_unread, status_read, status_done)
VALUES (1, 'ちひろノート', '日記', 'ノート', 'TO-DO', '未読', '既読', '読んだ')
ON CONFLICT (id) DO NOTHING;
