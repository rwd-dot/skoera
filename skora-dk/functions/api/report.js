import { json, str, num, verifyTurnstile, IMAGE_TYPES, MAX_PHOTO_BYTES, SPECIES } from '../../lib/util.js';
import { kommuneFor } from '../../lib/places.js';

export async function onRequestPost(ctx) {
  const { env } = ctx;
  if (!env.DB) return json({ error: 'Opsætning: D1-binding "DB" mangler (eller ingen ny deploy)' }, 500);
  if (!env.PHOTOS) return json({ error: 'Opsætning: R2-binding "PHOTOS" mangler (eller ingen ny deploy)' }, 500);
  try {
    return await handle(ctx);
  } catch (e) {
    console.error('report failed', e);
    return json({ error: 'Serverfejl: ' + (e && e.message ? e.message : String(e)) }, 500);
  }
}

async function handle({ request, env }) {
  let form;
  try { form = await request.formData(); } catch { return json({ error: 'Ugyldig forespørgsel' }, 400); }

  const ip = request.headers.get('CF-Connecting-IP');
  if (!(await verifyTurnstile(env, form.get('cf-turnstile-response'), ip)))
    return json({ error: 'Sikkerhedstjekket mislykkedes. Prøv igen.' }, 403);

  const photo = form.get('photo');
  if (!photo || typeof photo === 'string') return json({ error: 'Billede mangler' }, 400);
  if (!IMAGE_TYPES.includes(photo.type)) return json({ error: 'Billedformatet understøttes ikke' }, 415);
  if (photo.size > MAX_PHOTO_BYTES) return json({ error: 'Billedet er for stort' }, 413);

  const lat = num(form.get('lat'), -90, 90);
  const lon = num(form.get('lon'), -180, 180);
  const accuracy = num(form.get('accuracy'), 0, 100000);
  const place = str(form.get('place'), 200);
  const description = str(form.get('description'), 2000);
  if ((lat === null || lon === null) && place.length < 3)
    return json({ error: 'Sted mangler' }, 400);

  const species = SPECIES.includes(form.get('species')) ? form.get('species') : 'ukent';
  const kommuna = await kommuneFor(lat, lon);
  const now = new Date().toISOString();

  const id = crypto.randomUUID();
  const ext = photo.type === 'image/png' ? 'png' : photo.type === 'image/webp' ? 'webp' : 'jpg';
  const key = `${id}.${ext}`;

  await env.PHOTOS.put(key, await photo.arrayBuffer(), { httpMetadata: { contentType: photo.type } });

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO reports (id, created_at, photo_key, lat, lon, accuracy, place, description, ai_name, ai_latin, ai_confidence,
                            status, species, kommuna, source, status_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 'frab', ?12, ?13, 'borgari', ?2)`
    ).bind(
      id, now, key,
      lat, lon, accuracy === null ? null : Math.round(accuracy),
      place, description,
      str(form.get('ai_name'), 120) || null,
      str(form.get('ai_latin'), 120) || null,
      str(form.get('ai_confidence'), 20) || null,
      species, kommuna,
    ),
    env.DB.prepare(`INSERT INTO events (report_id, at, status, by) VALUES (?1, ?2, 'frab', 'Borger')`).bind(id, now),
  ]);

  return json({ ok: true, id, kommuna });
}
