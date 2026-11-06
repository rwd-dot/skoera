import { json, toBase64, IMAGE_TYPES, MAX_PHOTO_BYTES } from '../../lib/util.js';

const PROMPT = `The attached photo was taken in the Faroe Islands by someone reporting an invasive plant.
The invasive species we track are: Alchemilla mollis (garðaskøra), Erythranthe/Mimulus guttatus (apublóma) and Tussilago farfara (loðið hóvblað).
Seven Alchemilla species grow in the Faroes; only A. mollis is invasive.
A. mollis is markedly larger than the other Alchemilla species (often 30–50 cm), with large, soft, hairy leaves in dense clumps
and many tiny yellow-green flowers on stalks above the leaves. The native Alchemilla species must NOT be removed.
Identify the plant. Be honest about uncertainty: telling Alchemilla species apart from a photo is often not possible.
Reply with only JSON, no other text:
{"latin": string, "name_fo": string (Faroese name if you know it, else ""), "name_en": string,
 "species": "skora"|"apu"|"folfod"|"ukent" (which tracked invasive species it is, or "ukent" if none or unsure),
 "invasive": "ja"|"nei"|"óvist",
 "confidence": "høg"|"miðal"|"lág",
 "note_fo": string (one or two short sentences in Faroese: what you see, which features you used, and if unsure say so plainly)}`;

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
      species: ['skora', 'apu', 'folfod'].includes(out.species) ? out.species : 'ukent',
      invasive: ['ja', 'nei', 'óvist'].includes(out.invasive) ? out.invasive : 'óvist',
    });
  } catch {
    return json({ error: 'Plantan kundi ikki kennast' }, 502);
  }
}
