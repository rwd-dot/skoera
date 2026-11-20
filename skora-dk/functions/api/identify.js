import { json, toBase64, IMAGE_TYPES, MAX_PHOTO_BYTES } from '../../lib/util.js';

const PROMPT = `The attached photo was taken in Denmark by someone reporting an invasive plant.
The invasive species we track are: Heracleum mantegazzianum (kæmpe-bjørneklo), Rosa rugosa (rynket rose) and Reynoutria japonica / Fallopia japonica (japansk pileurt).
Be careful with look-alikes: native hogweed (Heracleum sphondylium, almindelig bjørneklo) is much smaller and must not be confused with giant hogweed;
other roses (e.g. Rosa canina, hunde-rose) have smooth, not wrinkled, leaves; Reynoutria sachalinensis and the hybrid R. × bohemica are close relatives of Japanese knotweed.
Identify the plant. Be honest about uncertainty.
Reply with only JSON, no other text:
{"latin": string, "name_fo": string (Danish name if you know it, else ""), "name_en": string,
 "species": "bjorneklo"|"rose"|"pileurt"|"ukent" (which tracked invasive species it is, or "ukent" if none or unsure),
 "invasive": "ja"|"nei"|"óvist",
 "confidence": "høj"|"middel"|"lav",
 "note_fo": string (one or two short sentences in Danish: what you see, which features you used, and if unsure say so plainly)}`;

export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'AI er ikke sat op' }, 404);

  let form;
  try { form = await request.formData(); } catch { return json({ error: 'Ugyldig forespørgsel' }, 400); }
  const photo = form.get('photo');
  if (!photo || typeof photo === 'string' || !IMAGE_TYPES.includes(photo.type) || photo.size > MAX_PHOTO_BYTES)
    return json({ error: 'Ugyldigt billede' }, 400);

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
  if (!r.ok) return json({ error: 'AI-tjenesten svarede ikke' }, 502);

  const data = await r.json();
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  try {
    const out = JSON.parse(text.slice(a, b + 1));
    return json({
      latin: String(out.latin || ''), name_fo: String(out.name_fo || ''), name_en: String(out.name_en || ''),
      confidence: String(out.confidence || ''), note_fo: String(out.note_fo || ''),
      species: ['bjorneklo', 'rose', 'pileurt'].includes(out.species) ? out.species : 'ukent',
      invasive: ['ja', 'nei', 'óvist'].includes(out.invasive) ? out.invasive : 'óvist',
    });
  } catch {
    return json({ error: 'Planten kunne ikke genkendes' }, 502);
  }
}
