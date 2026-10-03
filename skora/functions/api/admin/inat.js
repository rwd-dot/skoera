import { json } from '../../../lib/util.js';

// Read-only iNaturalist layer: public observations of the genus Alchemilla in the Faroe Islands.
// Cached in R2 for an hour so iNaturalist is hit at most ~24 times a day.
const TAXON = 'Alchemilla';
const BBOX = { swlat: 61.3, swlng: -7.8, nelat: 62.45, nelng: -6.2 }; // Faroe Islands
const CACHE_KEY = 'cache/inat-alchemilla.json';
const TTL_MS = 60 * 60 * 1000;
const MAX_PAGES = 5; // 5 x 200 = 1000 observations

export async function onRequestGet({ env, request }) {
  const force = new URL(request.url).searchParams.get('refresh') === '1';

  if (!force) {
    const cached = await env.PHOTOS.get(CACHE_KEY);
    if (cached) {
      const fetchedAt = Number(cached.customMetadata?.fetchedAt || 0);
      if (Date.now() - fetchedAt < TTL_MS) {
        return json({ ...(await cached.json()), cached: true });
      }
    }
  }

  try {
    const observations = await fetchAll();
    const body = { fetchedAt: new Date().toISOString(), taxon: TAXON, observations };
    await env.PHOTOS.put(CACHE_KEY, JSON.stringify(body), {
      httpMetadata: { contentType: 'application/json' },
      customMetadata: { fetchedAt: String(Date.now()) },
    });
    return json({ ...body, cached: false });
  } catch (e) {
    // iNaturalist down or slow: serve stale cache if we have one
    const stale = await env.PHOTOS.get(CACHE_KEY);
    if (stale) return json({ ...(await stale.json()), cached: true, stale: true });
    return json({ error: 'iNaturalist svaraði ikki: ' + (e?.message || e) }, 502);
  }
}

async function fetchAll() {
  const out = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const q = new URLSearchParams({
      taxon_name: TAXON, ...Object.fromEntries(Object.entries(BBOX).map(([k, v]) => [k, String(v)])),
      per_page: '200', page: String(page), order_by: 'observed_on', order: 'desc',
    });
    const r = await fetch('https://api.inaturalist.org/v1/observations?' + q, {
      headers: { 'User-Agent': 'skoera.pages.dev (Skøra reporting, Faroe Islands)', Accept: 'application/json' },
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    for (const o of d.results || []) {
      const c = o.geojson?.coordinates;
      if (!c) continue;
      const photo = o.photos?.[0]?.url || null;
      out.push({
        id: o.id,
        url: o.uri || `https://www.inaturalist.org/observations/${o.id}`,
        lat: c[1], lon: c[0],
        obscured: Boolean(o.obscured || o.geoprivacy === 'obscured'),
        observedOn: o.observed_on || null,
        grade: o.quality_grade || null, // research | needs_id | casual
        taxon: o.taxon?.name || null,
        rank: o.taxon?.rank || null,
        common: o.taxon?.preferred_common_name || null,
        user: o.user?.login || null,
        place: o.place_guess || null,
        photo: photo ? photo.replace('/square.', '/small.') : null,
        photoLarge: photo ? photo.replace('/square.', '/medium.') : null,
      });
    }
    if (page * 200 >= (d.total_results || 0)) break;
    await new Promise(res => setTimeout(res, 1100)); // be polite: ~1 request/second
  }
  return out;
}
