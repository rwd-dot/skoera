export async function onRequestGet({ params, env }) {
  const key = String(params.key || '');
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key)) return new Response('Not found', { status: 404 });
  const obj = await env.PHOTOS.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  return new Response(obj.body, {
    headers: {
      'content-type': obj.httpMetadata?.contentType || 'image/jpeg',
      'cache-control': 'private, max-age=86400',
      'x-content-type-options': 'nosniff',
    },
  });
}
