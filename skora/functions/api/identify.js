import { json, toBase64, IMAGE_TYPES, MAX_PHOTO_BYTES } from '../../lib/util.js';

const PROMPT = `The attached photo was taken in the Faroe Islands by someone reporting an invasive weed that locals call "skøra".
Identify the plant. Reply with only JSON, no other text:
{"latin": string, "name_fo": string (Faroese name if you know it, else ""), "name_en": string,
 "confidence": "høg"|"miðal"|"lág",
 "note_fo": string (one short sentence in Faroese about what you see and whether it looks invasive; say plainly if the photo is unclear)}`;

export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'AI er ikki sett upp' }, 404);

  let form;
  try { form = await request.formData(); } catch { return json({ error: 'Ógildugur fyrispurningur' }, 400); }
  const photo = form.get('photo');
  if (!photo || typeof photo === 'string' || !IMAGE_TYPES.includes(photo.type) || photo.size > MAX_PHOTO_BYTES)
    return json({ error: 'Ógildug mynd' }, 400);

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: env.AI_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: photo.type, data: toBase64(await photo.arrayBuffer()) } },
          { type: 'text', text: PROMPT },
        ],
      }],
    }),
  });
  if (!r.ok) return json({ error: 'AI-tænastan svaraði ikki' }, 502);

  const data = await r.json();
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  try {
    const out = JSON.parse(text.slice(a, b + 1));
    return json({
      latin: String(out.latin || ''), name_fo: String(out.name_fo || ''), name_en: String(out.name_en || ''),
      confidence: String(out.confidence || ''), note_fo: String(out.note_fo || ''),
    });
  } catch {
    return json({ error: 'Plantan kundi ikki kennast' }, 502);
  }
}
