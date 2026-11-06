import { json } from '../../../lib/util.js';
import { nearestKommuna } from '../../../lib/places.js';

// Allir innritaðir síggja allar fráboðanir (so kommunur kunnu hjálpast at). Broytingar krevja rætta kommunu.
export async function onRequestGet({ env }) {
  // Eldri fráboðanir uttan kommunu fáa kommunu út frá GPS (bert fyrstu ferð)
  const { results: missing } = await env.DB.prepare('SELECT id, lat, lon FROM reports WHERE kommuna IS NULL AND lat IS NOT NULL LIMIT 500').all();
  const fixes = missing.map(r => [r.id, nearestKommuna(r.lat, r.lon)]).filter(([, k]) => k);
  if (fixes.length) await env.DB.batch(fixes.map(([id, k]) => env.DB.prepare('UPDATE reports SET kommuna = ?1 WHERE id = ?2').bind(k, id)));

  const [reports, events] = await env.DB.batch([
    env.DB.prepare('SELECT * FROM reports ORDER BY created_at DESC LIMIT 2000'),
    env.DB.prepare('SELECT report_id, at, status, by, note FROM events ORDER BY at ASC'),
  ]);
  const byReport = {};
  for (const e of events.results) (byReport[e.report_id] ||= []).push(e);
  return json({ reports: reports.results.map(r => ({ ...r, events: byReport[r.id] || [] })) });
}
