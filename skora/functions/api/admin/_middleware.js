import { json } from '../../../lib/util.js';

export async function onRequest({ request, env, next }) {
  const auth = request.headers.get('Authorization') || '';
  if (!env.ADMIN_TOKEN || auth !== `Bearer ${env.ADMIN_TOKEN}`) return json({ error: 'unauthorized' }, 401);
  return next();
}
