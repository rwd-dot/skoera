export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

export const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const num = (v, min, max) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_PHOTO_BYTES = 3_000_000;

export async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true; // Turnstile not configured
  if (!token) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const out = await r.json().catch(() => ({}));
  return out.success === true;
}

export function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export const SPECIES = ['skora', 'apu', 'folfod', 'ukent'];
export const STATUSES = ['frab', 'byrj', 'burt'];

// Innritan: ADMIN_TOKEN gevur atgongd til allar kommunur ('*').
// KOMMUNA_TOKENS (Secret) er JSON: {"Tórshavnar kommuna":"langur-lykil", ...}
export function accountFor(env, request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return null;
  if (env.ADMIN_TOKEN && token === env.ADMIN_TOKEN) return { kommuna: '*', name: 'Admin' };
  try {
    const map = JSON.parse(env.KOMMUNA_TOKENS || '{}');
    for (const [kommuna, t] of Object.entries(map)) if (t && t === token) return { kommuna, name: kommuna };
  } catch {}
  return null;
}
export const canEdit = (acc, report) => acc && (acc.kommuna === '*' || acc.kommuna === report.kommuna);
