import { json } from '../../../lib/util.js';

// Alle indloggede ser alle indberetninger (så kommuner kan hjælpe hinanden). Ændringer kræver den rigtige kommune.
export async function onRequestGet({ env }) {
  const [reports, events] = await env.DB.batch([
    env.DB.prepare('SELECT * FROM reports ORDER BY created_at DESC LIMIT 2000'),
    env.DB.prepare('SELECT report_id, at, status, by, note FROM events ORDER BY at ASC'),
  ]);
  const byReport = {};
  for (const e of events.results) (byReport[e.report_id] ||= []).push(e);
  return json({ reports: reports.results.map(r => ({ ...r, events: byReport[r.id] || [] })) });
}
