import { json, accountFor } from '../../../lib/util.js';

export async function onRequest({ request, env, next, data }) {
  const acc = accountFor(env, request);
  if (!acc) return json({ error: 'unauthorized' }, 401);
  data.account = acc;
  return next();
}
