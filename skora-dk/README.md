# Invasive Planter (dansk udgave)

Dansk udgave af det færøske elevprojekt *Innræsnar Plantur* (mappen `skora/`).
Borgere tager et billede af en invasiv plante – **kæmpe-bjørneklo, rynket rose eller japansk pileurt** –
GPS-placeringen kommer med, og indberetningen havner hos den kommune, stedet ligger i.

Forsiden har tre dele: *Indberet*, *Kort* (offentligt kort med status og iNaturalist-fund i Danmark) og *Kend planten*.
`/admin` er for kommunerne: hver kommune logger ind med sin egen nøgle og opdaterer status på sine steder
(indberettet → bekæmpelse i gang → fjernet). Fjernede steder markeres „følg op“ efter et år.
Alle kommuner ser alt, men kan kun ændre deres egne.

**Stack:** Cloudflare Pages + Pages Functions, D1 (data), R2 (billeder), valgfrit Turnstile (spam) og Claude API (genkend planten).

```
public/              statisk side (index.html, admin.html, shared.js, ip.css, img/)
functions/api/       API (Pages Functions)
  report.js            POST  – ny indberetning (kommune findes via OpenStreetMap/Nominatim)
  map.js, inat.js      GET   – offentlige kortdata og iNaturalist-fund (cache 1 time i R2)
  identify.js          POST  – AI genkender planten (valgfrit)
  admin/...            GET/PATCH/DELETE – kræver nøgle
lib/                 fælles hjælpefunktioner (util.js, places.js, inat.js)
schema.sql           fuldt D1-skema
```

## Opsætning (Cloudflare dashboard)

1. **D1:** Storage & Databases → D1 → Create → navn `invasive-dk`. Åbn *Console* og kør indholdet af `schema.sql`.
2. **R2:** R2 → Create bucket → navn `invasive-dk-photos` (ingen offentlig adgang).
3. **Pages:** Workers & Pages → Create → Pages → Connect to Git → repo `rwd-dot/skoera`.
   - Framework preset: *None*, Build command: *(tom)*, **Root directory: `skora-dk`**, Build output directory: `public`
4. **Bindings** (Settings → Bindings), både Production og Preview:
   - D1 database → `DB` → `invasive-dk`
   - R2 bucket → `PHOTOS` → `invasive-dk-photos`
5. **Variables and Secrets:**
   - `ADMIN_TOKEN` (Secret) – lang tilfældig streng, fx `openssl rand -hex 32`
   - `KOMMUNA_TOKENS` (Secret) – JSON, fx `{"Aarhus Kommune":"…","Odense Kommune":"…"}`.
     Navnet skal skrives som i OpenStreetMap, fx „Københavns Kommune“, „Bornholms Regionskommune“.
   - `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET` – valgfrit, anbefales
   - `ANTHROPIC_API_KEY` (Secret) – valgfrit; uden den skjules knappen „Hvilken plante er det?“
6. **Redeploy**, så bindings og variabler kommer med.
7. **Custom domain** under Pages → Custom domains.

## Bemærk

- Kommunen findes ved indberetning via Nominatim (OpenStreetMap). Ligger stedet ikke i en dansk kommune (fx på havet), står den som „Ukendt kommune“, og admin kan rette den.
- iNaturalist: Danmark (`place_id=8051`), taxa 1557658 (kæmpe-bjørneklo-gruppen), 83653 (rynket rose), 914922 (japansk pileurt). Op til 1000 nyeste fund pr. art.
- Plantebillederne på „Kend planten“ hentes fra iNaturalist (CC-licenser), og fotograf og licens står under billederne.
- Teksterne bygger på Miljøstyrelsens *Invasive arter – grundbog* (2025).

Udviklet og støttet af Regin W. Dalsgaard.
