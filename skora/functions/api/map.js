import { json } from '../../lib/util.js';

// Almenn kortdáta: bert slag, stað, kommuna og støða. Myndir, frágreiðingar og staðarnøvn verða ikki víst almenna.
export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT id, species, lat, lon, kommuna, status, status_at, created_at, source, inat_id
       FROM reports WHERE lat IS NOT NULL ORDER BY created_at DESC LIMIT 5000`
  ).all();
  return new Response(JSON.stringify({
    reports: results.map(r => ({ ...r, lat: Math.round(r.lat * 1e4) / 1e4, lon: Math.round(r.lon * 1e4) / 1e4 })),
  }), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60' } });
}
