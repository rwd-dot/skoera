-- Invasive Planter (dansk udgave): fuldt skema. Kør én gang i D1 → Console på en ny database.
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
  status        TEXT NOT NULL DEFAULT 'frab',      -- frab | byrj | burt
  species       TEXT NOT NULL DEFAULT 'ukent',     -- bjorneklo | rose | pileurt | ukent
  kommuna       TEXT,                              -- fx "Aarhus Kommune"
  source        TEXT NOT NULL DEFAULT 'borgari',   -- borgari | inat
  inat_id       INTEGER,
  photo_url     TEXT,
  status_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status  ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_kommuna ON reports(kommuna);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_inat ON reports(inat_id) WHERE inat_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id  TEXT NOT NULL,
  at         TEXT NOT NULL,
  status     TEXT NOT NULL,
  by         TEXT NOT NULL,
  note       TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_report ON events(report_id, at);
