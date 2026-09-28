# Skøra – fráboðanir

Fólk taka mynd av skøru, GPS-staðið verður tikið við, og fráboðanin verður goymd.
Admin-síðan (`/admin`) vísir allar fráboðanir á korti og í lista.

**Stack:** Cloudflare Pages + Pages Functions, D1 (dátur), R2 (myndir), Turnstile (spam), valfrítt Claude API (kenna plantuna).

```
public/            statiska síðan (index.html, admin.html, style.css, _headers)
functions/         API (Pages Functions)
  api/report.js        POST  – nýggj fráboðan
  api/identify.js      POST  – AI kennir plantuna (valfrítt)
  api/config.js        GET   – Turnstile-lykil og um AI er tøkt
  api/admin/...        GET/PATCH/DELETE – krevur ADMIN_TOKEN
  photo/[key].js       GET   – vísir mynd úr R2
lib/util.js        felags hjálparfunktiónir
schema.sql         D1-talvan
```

## Uppseting (alt í Cloudflare dashboard)

1. **D1:** Storage & Databases → D1 → Create → navn `skora`. Opna *Console* og koyr innihaldið í `schema.sql`.
2. **R2:** R2 → Create bucket → navn `skora-photos`. Eingin almenn atgongd (myndirnar verða vístar gjøgnum `/photo/`).
3. **Pages:** Workers & Pages → Create → Pages → Connect to Git → vel repo.
   - Framework preset: *None*, Build command: *(tómt)*, Build output directory: `public`
4. **Bindings** (Pages-verkætlanin → Settings → Bindings), bæði Production og Preview:
   - D1 database → Variable name `DB` → `skora`
   - R2 bucket → Variable name `PHOTOS` → `skora-photos`
5. **Variables and Secrets** (Settings → Variables and Secrets):
   - `ADMIN_TOKEN` (Secret) – langur tilvildarligur strongur, t.d. `openssl rand -hex 32`
   - `TURNSTILE_SITE_KEY` (Text) og `TURNSTILE_SECRET` (Secret) – úr Turnstile → Add widget við tínum domeni. *Mælt verður til.*
   - `ANTHROPIC_API_KEY` (Secret) – valfrítt; uttan hann verður knøttin "Hvat planta er hetta?" goymd.
   - `AI_MODEL` (Text) – valfrítt, sjálvsett `claude-haiku-4-5-20251001`.
6. **Redeploy** (Deployments → Retry deployment), so bindings og variablar koma við.
7. **Custom domain:** Pages → Custom domains, t.d. `skora.fo`.

## Trygd

- **Rate limiting:** Security → WAF → Rate limiting rules. Frí útgávan loyvir eini reglu:
  `URI Path starts with /api/` → t.d. 20 fyrispurningar per 10 sek per IP → Block. Serliga umráðandi um AI er tendrað, tí hvør kenning kostar pening.
- **Admin:** `/admin` krevur ADMIN_TOKEN. Vilt tú eisini hava innritan við telduposti, kanst tú leggja Cloudflare Access (Zero Trust, ókeypis upp til 50 brúkarar) á `/admin*` og `/api/admin*`.
- Myndir hava tilvildarligt UUID-navn og kunnu ikki gitast, men hava ikki innritan. Tak tað við í roknskapin, um myndir kunnu vísa persónar.

## Myndir og GPS

Myndin verður minkað í telefonini (max 1600 px, JPEG) áðrenn upplød. Canvas strikar EXIF, so eingin GPS-metadata verður goymd í myndini; staðið verður goymt sær í D1.
