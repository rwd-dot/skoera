-- Innræsnar Plantur: fleiri sløg, kommunur, støðusøga og iNaturalist.
-- Koyr hetta EINA FERÐ í D1 → skora → Console, áðrenn nýggja koden verður deployað.

ALTER TABLE reports ADD COLUMN species  TEXT NOT NULL DEFAULT 'skora';  -- skora | apu | folfod | ukent
ALTER TABLE reports ADD COLUMN kommuna  TEXT;
ALTER TABLE reports ADD COLUMN source   TEXT NOT NULL DEFAULT 'borgari'; -- borgari | inat
ALTER TABLE reports ADD COLUMN inat_id  INTEGER;
ALTER TABLE reports ADD COLUMN photo_url TEXT;                          -- mynd frá iNaturalist
ALTER TABLE reports ADD COLUMN status_at TEXT;                          -- seinasta støðubroyting

-- Nýggjar støður: frab (fráboðað), byrj (týning byrjað), burt (burturbeint)
UPDATE reports SET status = CASE status WHEN 'burtur' THEN 'burt' ELSE 'frab' END
  WHERE status IN ('nyggj', 'kannad', 'burtur');
UPDATE reports SET status_at = created_at WHERE status_at IS NULL;

CREATE TABLE IF NOT EXISTS events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id  TEXT NOT NULL,
  at         TEXT NOT NULL,
  status     TEXT NOT NULL,
  by         TEXT NOT NULL,
  note       TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_report ON events(report_id, at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_inat ON reports(inat_id) WHERE inat_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_kommuna ON reports(kommuna);

-- Søga fyri tær fráboðanir, sum longu eru til
INSERT INTO events (report_id, at, status, by)
  SELECT id, created_at, 'frab', 'Borgari' FROM reports;
INSERT INTO events (report_id, at, status, by)
  SELECT id, created_at, 'burt', 'Admin' FROM reports WHERE status = 'burt';
