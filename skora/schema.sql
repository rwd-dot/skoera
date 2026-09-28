CREATE TABLE IF NOT EXISTS reports (
  id            TEXT PRIMARY KEY,
  created_at    TEXT NOT NULL,
  photo_key     TEXT NOT NULL,
  lat           REAL,
  lon           REAL,
  accuracy      INTEGER,
  place         TEXT,
  description   TEXT,
  ai_name       TEXT,
  ai_latin      TEXT,
  ai_confidence TEXT,
  status        TEXT NOT NULL DEFAULT 'nyggj'
);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status  ON reports(status);
