import { json, str, canEdit, STATUSES, SPECIES } from '../../../../lib/util.js';

// PATCH { status?, note?, species?, kommuna? }
// status (+ note) skriver en linje i historikken. species/kommuna kan rettes af samme kommune eller admin.
export async function onRequestPatch({ request, env, params, data }) {
  const acc = data.account;
  const body = await request.json().catch(() => ({}));
  const row = await env.DB.prepare('SELECT id, kommuna FROM reports WHERE id = ?1').bind(params.id).first();
  if (!row) return json({ error: 'Ikke fundet' }, 404);
  if (!canEdit(acc, row)) return json({ error: `Dette sted hører til ${row.kommuna || 'en ukendt kommune'}` }, 403);

  const now = new Date().toISOString();
  const stmts = [];
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return json({ error: 'Ugyldig status' }, 400);
    stmts.push(env.DB.prepare('UPDATE reports SET status = ?1, status_at = ?2 WHERE id = ?3').bind(body.status, now, row.id));
    stmts.push(env.DB.prepare('INSERT INTO events (report_id, at, status, by, note) VALUES (?1, ?2, ?3, ?4, ?5)')
      .bind(row.id, now, body.status, acc.name, str(body.note, 300) || null));
  }
  if (body.species !== undefined) {
    if (!SPECIES.includes(body.species)) return json({ error: 'Ugyldig art' }, 400);
    stmts.push(env.DB.prepare('UPDATE reports SET species = ?1 WHERE id = ?2').bind(body.species, row.id));
  }
  if (body.kommuna !== undefined) {
    const k = str(body.kommuna, 80);
    if (!k) return json({ error: 'Kommune mangler' }, 400);
    stmts.push(env.DB.prepare('UPDATE reports SET kommuna = ?1 WHERE id = ?2').bind(k, row.id));
  }
  if (!stmts.length) return json({ error: 'Intet at ændre' }, 400);
  await env.DB.batch(stmts);
  return json({ ok: true, at: now });
}

export async function onRequestDelete({ env, params, data }) {
  const row = await env.DB.prepare('SELECT photo_key, kommuna FROM reports WHERE id = ?1').bind(params.id).first();
  if (!row) return json({ error: 'Ikke fundet' }, 404);
  if (!canEdit(data.account, row)) return json({ error: 'Du kan kun slette din egen kommunes indberetninger' }, 403);
  if (row.photo_key) await env.PHOTOS.delete(row.photo_key);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM events WHERE report_id = ?1').bind(params.id),
    env.DB.prepare('DELETE FROM reports WHERE id = ?1').bind(params.id),
  ]);
  return json({ ok: true });
}
