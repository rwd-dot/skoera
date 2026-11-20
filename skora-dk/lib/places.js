// Finder kommunen ud fra GPS via OpenStreetMap (Nominatim). Returnerer fx "Aarhus Kommune",
// eller null hvis stedet ikke ligger i en dansk kommune (fx på havet) eller opslaget fejler.
export async function kommuneFor(lat, lon) {
  if (lat == null || lon == null) return null;
  try {
    const q = new URLSearchParams({ lat: String(lat), lon: String(lon), format: 'jsonv2', zoom: '10', 'accept-language': 'da' });
    const r = await fetch('https://nominatim.openstreetmap.org/reverse?' + q, {
      headers: { 'User-Agent': 'Invasive Planter (invasive plant reporting, Denmark)', Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!r.ok) return null;
    const d = await r.json();
    const a = d.address || {};
    if (a.country_code && a.country_code !== 'dk') return null;
    const k = a.municipality || null;
    return k && /kommune/i.test(k) ? k : null;
  } catch { return null; }
}
