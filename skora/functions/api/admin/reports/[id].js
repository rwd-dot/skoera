import { json } from '../../../../lib/util.js';

const STATUSES = ['nyggj', 'kannad', 'burtur'];

export async function onRequestPatch({ request, env, params }) {
  const body = await request.json().catch(() => ({}));
  if (!STATUSES.includes(body.status)) return json({ error: 'Ógildug støða' }, 400);
  const r = await env.DB.prepare('UPDATE reports SET status = ?1 WHERE id = ?2').bind(body.status, params.id).run();
  return r.meta.changes ? json({ ok: true }) : json({ error: 'Ikki funnin' }, 404);
}

export async function onRequestDelete({ env, params }) {
  const row = await env.DB.prepare('SELECT photo_key FROM reports WHERE id = ?1').bind(params.id).first();
  if (!row) return json({ error: 'Ikki funnin' }, 404);
  await env.PHOTOS.delete(row.photo_key);
  await env.DB.prepare('DELETE FROM reports WHERE id = ?1').bind(params.id).run();
  return json({ ok: true });
}
