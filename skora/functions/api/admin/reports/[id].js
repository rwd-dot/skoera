import { json, str, canEdit, STATUSES, SPECIES } from '../../../../lib/util.js';

// PATCH { status?, note?, species?, kommuna? }
// status (+ note) skrivar eina linju í søguna. species/kommuna kunnu rættast av somu kommunu ella admin.
export async function onRequestPatch({ request, env, params, data }) {
  const acc = data.account;
  const body = await request.json().catch(() => ({}));
  const row = await env.DB.prepare('SELECT id, kommuna FROM reports WHERE id = ?1').bind(params.id).first();
  if (!row) return json({ error: 'Ikki funnin' }, 404);
  if (!canEdit(acc, row)) return json({ error: `Hetta stað hoyrir til ${row.kommuna || 'ókenda kommunu'}` }, 403);

  const now = new Date().toISOString();
  const stmts = [];
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return json({ error: 'Ógildug støða' }, 400);
    stmts.push(env.DB.prepare('UPDATE reports SET status = ?1, status_at = ?2 WHERE id = ?3').bind(body.status, now, row.id));
    stmts.push(env.DB.prepare('INSERT INTO events (report_id, at, status, by, note) VALUES (?1, ?2, ?3, ?4, ?5)')
      .bind(row.id, now, body.status, acc.name, str(body.note, 300) || null));
  }
  if (body.species !== undefined) {
    if (!SPECIES.includes(body.species)) return json({ error: 'Ógildugt slag' }, 400);
    stmts.push(env.DB.prepare('UPDATE reports SET species = ?1 WHERE id = ?2').bind(body.species, row.id));
  }
  if (body.kommuna !== undefined) {
    const k = str(body.kommuna, 80);
    if (!k) return json({ error: 'Kommuna manglar' }, 400);
    stmts.push(env.DB.prepare('UPDATE reports SET kommuna = ?1 WHERE id = ?2').bind(k, row.id));
  }
  if (!stmts.length) return json({ error: 'Einki at broyta' }, 400);
  await env.DB.batch(stmts);
  return json({ ok: true, at: now });
}

export async function onRequestDelete({ env, params, data }) {
  const row = await env.DB.prepare('SELECT photo_key, kommuna FROM reports WHERE id = ?1').bind(params.id).first();
  if (!row) return json({ error: 'Ikki funnin' }, 404);
  if (!canEdit(data.account, row)) return json({ error: 'Tú kanst bert strika tínar egnu fráboðanir' }, 403);
  if (row.photo_key) await env.PHOTOS.delete(row.photo_key);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM events WHERE report_id = ?1').bind(params.id),
    env.DB.prepare('DELETE FROM reports WHERE id = ?1').bind(params.id),
  ]);
  return json({ ok: true });
}
