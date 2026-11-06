import { json } from './util.js';

// Almennar iNaturalist-observatiónir í Føroyum fyri tey innræsnu sløgini.
// Goymt í R2 í ein tíma, so iNaturalist verður spurdur í mesta lagi ~24 ferðir um dagin.
export const TAXA = [
  ['skora', 'Alchemilla mollis'],
  ['apu', 'Erythranthe guttata'],
  ['folfod', 'Tussilago farfara'],
];
const BBOX = { swlat: '61.3', swlng: '-7.8', nelat: '62.45', nelng: '-6.2' };
const CACHE_KEY = 'cache/inat-ip.json';
const TTL_MS = 60 * 60 * 1000;
const MAX_PAGES = 3; // per slag, 3 x 200

export async function getInat(env, force = false) {
  if (!force) {
    const cached = await env.PHOTOS.get(CACHE_KEY);
    if (cached && Date.now() - Number(cached.customMetadata?.fetchedAt || 0) < TTL_MS)
      return { ...(await cached.json()), cached: true };
  }
  try {
    const observations = [];
    for (const [sp, name] of TAXA) observations.push(...(await fetchTaxon(sp, name)));
    const body = { fetchedAt: new Date().toISOString(), observations };
    await env.PHOTOS.put(CACHE_KEY, JSON.stringify(body), {
      httpMetadata: { contentType: 'application/json' },
      customMetadata: { fetchedAt: String(Date.now()) },
    });
    return { ...body, cached: false };
  } catch (e) {
    const stale = await env.PHOTOS.get(CACHE_KEY);
    if (stale) return { ...(await stale.json()), cached: true, stale: true };
    throw e;
  }
}

export async function inatResponse(env, request) {
  const force = new URL(request.url).searchParams.get('refresh') === '1';
  try { return json(await getInat(env, force)); }
  catch (e) { return json({ error: 'iNaturalist svaraði ikki: ' + (e?.message || e) }, 502); }
}

async function fetchTaxon(sp, name) {
  const out = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const q = new URLSearchParams({ taxon_name: name, ...BBOX, per_page: '200', page: String(page), order_by: 'observed_on', order: 'desc' });
    const r = await fetch('https://api.inaturalist.org/v1/observations?' + q, {
      headers: { 'User-Agent': 'ip.dagsins.fo (Innraesnar Plantur, Faroe Islands)', Accept: 'application/json' },
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    for (const o of d.results || []) {
      const c = o.geojson?.coordinates;
      if (!c) continue;
      const photo = o.photos?.[0]?.url || null;
      out.push({
        id: o.id, sp,
        url: o.uri || `https://www.inaturalist.org/observations/${o.id}`,
        lat: c[1], lon: c[0],
        obscured: Boolean(o.obscured || o.geoprivacy === 'obscured'),
        observedOn: o.observed_on || null,
        grade: o.quality_grade || null,
        taxon: o.taxon?.name || null,
        user: o.user?.login || null,
        place: o.place_guess || null,
        photo: photo ? photo.replace('/square.', '/small.') : null,
        photoLarge: photo ? photo.replace('/square.', '/medium.') : null,
      });
    }
    if (page * 200 >= (d.total_results || 0)) break;
    await new Promise(res => setTimeout(res, 1100));
  }
  return out;
}
