import { json } from '../../../lib/util.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM reports ORDER BY created_at DESC LIMIT 1000'
  ).all();
  return json({ reports: results });
}
