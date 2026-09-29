import { json, str, num, verifyTurnstile, IMAGE_TYPES, MAX_PHOTO_BYTES } from '../../lib/util.js';

export async function onRequestPost(ctx) {
  const { env } = ctx;
  if (!env.DB) return json({ error: 'Uppseting: D1-binding "DB" manglar (ella ongin nýggj deploy)' }, 500);
  if (!env.PHOTOS) return json({ error: 'Uppseting: R2-binding "PHOTOS" manglar (ella ongin nýggj deploy)' }, 500);
  try {
    return await handle(ctx);
  } catch (e) {
    console.error('report failed', e);
    return json({ error: 'Servarafeilur: ' + (e && e.message ? e.message : String(e)) }, 500);
  }
}

async function handle({ request, env }) {
  let form;
  try { form = await request.formData(); } catch { return json({ error: 'Ógildugur fyrispurningur' }, 400); }

  const ip = request.headers.get('CF-Connecting-IP');
  if (!(await verifyTurnstile(env, form.get('cf-turnstile-response'), ip)))
    return json({ error: 'Trygdarkanningin miseydnaðist. Royn aftur.' }, 403);

  const photo = form.get('photo');
  if (!photo || typeof photo === 'string') return json({ error: 'Mynd manglar' }, 400);
  if (!IMAGE_TYPES.includes(photo.type)) return json({ error: 'Myndaslagið er ikki stuðlað' }, 415);
  if (photo.size > MAX_PHOTO_BYTES) return json({ error: 'Myndin er ov stór' }, 413);

  const lat = num(form.get('lat'), -90, 90);
  const lon = num(form.get('lon'), -180, 180);
  const accuracy = num(form.get('accuracy'), 0, 100000);
  const place = str(form.get('place'), 200);
  const description = str(form.get('description'), 2000);
  if ((lat === null || lon === null) && place.length < 3)
    return json({ error: 'Staður manglar' }, 400);

  const id = crypto.randomUUID();
  const ext = photo.type === 'image/png' ? 'png' : photo.type === 'image/webp' ? 'webp' : 'jpg';
  const key = `${id}.${ext}`;

  await env.PHOTOS.put(key, await photo.arrayBuffer(), { httpMetadata: { contentType: photo.type } });

  await env.DB.prepare(
    `INSERT INTO reports (id, created_at, photo_key, lat, lon, accuracy, place, description, ai_name, ai_latin, ai_confidence, status)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 'nyggj')`
  ).bind(
    id, new Date().toISOString(), key,
    lat, lon, accuracy === null ? null : Math.round(accuracy),
    place, description,
    str(form.get('ai_name'), 120) || null,
    str(form.get('ai_latin'), 120) || null,
    str(form.get('ai_confidence'), 20) || null,
  ).run();

  return json({ ok: true, id });
}
