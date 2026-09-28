import { json } from '../../lib/util.js';

export const onRequestGet = ({ env }) =>
  json({
    turnstileSiteKey: env.TURNSTILE_SITE_KEY || null,
    aiEnabled: Boolean(env.ANTHROPIC_API_KEY),
  });
