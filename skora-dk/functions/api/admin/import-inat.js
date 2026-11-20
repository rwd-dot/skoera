import { json, num, str, SPECIES } from '../../../lib/util.js';
import { getInat } from '../../../lib/inat.js';
import { kommuneFor } from '../../../lib/places.js';

// POST { inat_id } – gør en iNaturalist-observation til en indberetning, så kommunen kan følge den.
export async function onRequestPost({ request, env, data }) {
  const body = await request.json().catch(() => ({}));
  const inatId = num(body.inat_id, 1, 1e12);
  if (!inatId) return json({ error: 'inat_id mangler' }, 400);
  const exists = await env.DB.prepare('SELECT id FROM reports WHERE inat_id = ?1').bind(inatId).first();
  if (exists) return json({ ok: true, id: exists.id, existed: true });

  const { observations } = await getInat(env).catch(() => ({ observations: [] }));
  let o = (observations || []).find(x => x.id === inatId);
  // Hvis serverens iNaturalist-cache er tom (fx HTTP 429), bruges observationen, som browseren selv har hentet
  const b = body.obs;
  if (!o && b && Number(b.id) === inatId && SPECIES.includes(b.sp) && num(b.lat, -90, 90) !== null && num(b.lon, -180, 180) !== null)
    o = { id: inatId, sp: b.sp, lat: Number(b.lat), lon: Number(b.lon), url: `https://www.inaturalist.org/observations/${inatId}`,
      observedOn: /^\d{4}-\d{2}-\d{2}$/.test(b.observedOn || '') ? b.observedOn : null, place: str(b.place, 200), user: str(b.user, 80),
      photo: /^https:\/\/[a-z0-9.-]*inaturalist[a-z0-9.-]*\.(org|com)\//.test(b.photo || '') ? b.photo : null,
      photoLarge: /^https:\/\/[a-z0-9.-]*inaturalist[a-z0-9.-]*\.(org|com)\//.test(b.photoLarge || '') ? b.photoLarge : null };
  if (!o) return json({ error: 'Observationen blev ikke fundet' }, 404);
  const kommuna = await kommuneFor(o.lat, o.lon);
  if (data.account.kommuna !== '*' && data.account.kommuna !== kommuna)
    return json({ error: `Dette sted hører til ${kommuna || 'en ukendt kommune'}` }, 403);

  const id = crypto.randomUUID(), now = new Date().toISOString();
  const created = o.observedOn ? new Date(o.observedOn + 'T12:00:00Z').toISOString() : now;
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO reports (id, created_at, photo_key, lat, lon, place, description, status, species, kommuna, source, inat_id, photo_url, status_at)
       VALUES (?1, ?2, '', ?3, ?4, ?5, ?6, 'frab', ?7, ?8, 'inat', ?9, ?10, ?2)`
    ).bind(id, created, o.lat, o.lon, (o.place || '').slice(0, 200),
      `iNaturalist: ${o.url}${o.user ? ' (' + o.user + ')' : ''}`, o.sp, kommuna, inatId, o.photoLarge || o.photo),
    env.DB.prepare(`INSERT INTO events (report_id, at, status, by, note) VALUES (?1, ?2, 'frab', ?3, 'Taget ind fra iNaturalist')`)
      .bind(id, created, data.account.name),
  ]);
  return json({ ok: true, id });
}
