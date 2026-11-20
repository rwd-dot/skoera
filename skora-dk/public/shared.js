// Fælles for forsiden og admin-siden: arter, status, plantebeskrivelser og kort.
window.IP = (() => {
  // Billeder fra iNaturalist (CC-licens), vist med fotograf og licens
  const P = (id, ext, c) => ({ u: `https://inaturalist-open-data.s3.amazonaws.com/photos/${id}/medium.${ext}`, c });
  const SPECIES = {
    bjorneklo: { fo: 'Kæmpe-bjørneklo', la: 'Heracleum mantegazzianum', img: [
      P(319710749, 'jpg', 'F. Bemmerlein-Lux, CC BY'), P(86523769, 'jpg', 'Valerii Darmostuk, CC BY'), P(260155592, 'jpeg', 'Felix Riegel, CC BY-NC')] },
    rose:      { fo: 'Rynket rose', la: 'Rosa rugosa', img: [
      P(4292051, 'jpg', 'S. Rae, CC BY'), P(397901731, 'jpeg', 'Tom Norton, CC BY'), P(394868328, 'jpg', 'Emily, CC BY-NC')] },
    pileurt:   { fo: 'Japansk pileurt', la: 'Reynoutria japonica', img: [
      P(74418856, 'jpg', 'AnRo0002, public domain'), P(263534145, 'jpg', 'Douglas Goldman, CC BY-SA'), P(96900463, 'jpg', 'yell, CC BY-NC')] },
    ukent:     { fo: 'Ved ikke', la: '', img: [] },
  };
  const STATUS = { frab: 'Indberettet', byrj: 'Bekæmpelse i gang', burt: 'Fjernet' };
  const FOLLOW_UP_DAYS = 365; // et sted, hvor planten er fjernet, skal tjekkes igen efter så mange dage

  // Tekster baseret på Miljøstyrelsens grundbog om invasive arter
  const GUIDE = [
    { k: 'bjorneklo',
      lead: 'Danmarks mest kendte invasive plante. Den står på EU’s liste over invasive arter, og mange kommuner har en indsatsplan mod den.',
      looks: [
        'En kæmpe skærmplante, ofte 2–3 meter høj og nogle gange højere.',
        'Stænglen er tyk og hul med rødlilla pletter og stive hår.',
        'Bladene er meget store – over 1 meter – og dybt indskårne.',
        'De hvide blomster sidder i store, flade skærme, der kan blive op mod en halv meter brede.',
      ],
      facts: [['Højde', '2–4 m'], ['Blomstrer', 'Juni–august']],
      where: 'Langs vandløb og grøfter, ved veje og jernbaner, på braklagte marker og i haver.',
      spread: 'Den spreder sig kun med frø – titusindvis fra én plante – og frøene kan spire i jorden i flere år. Planten dør, når den har sat frø.',
      warn: 'Saften er giftig i sollys og kan give blærer og forbrændinger. Rør aldrig planten med bare hænder, og hold børn væk.' },
    { k: 'rose',
      lead: 'Rynket rose danner tætte krat langs kysterne og fortrænger klitternes og strandengenes egne planter. Det har været forbudt at sælge den siden 2022.',
      looks: [
        'En busk på 1–2 meter med mange tynde, skarpe torne.',
        'Bladene er mørkegrønne, blanke og tydeligt rynkede.',
        'Store, duftende lyserøde eller hvide blomster.',
        'Store, runde, røde hyben om efteråret.',
      ],
      facts: [['Højde', '1–2 m'], ['Blomstrer', 'Juni–september']],
      where: 'I klitter, på strandvolde og langs kysten, men også ved veje, i hegn og på brakarealer. Den tåler salt, vind og sand.',
      spread: 'Den breder sig med rodskud under jorden, og fugle og havet spreder frøene fra hybenene.' },
    { k: 'pileurt',
      lead: 'En af de sværeste invasive planter at bekæmpe. Den vokser meget hurtigt, danner tætte bevoksninger og kan endda presse sig op gennem asfalt.',
      looks: [
        'Bliver 2–3 meter høj på en enkelt sommer.',
        'Hule, leddelte stængler, der minder om bambus, med røde prikker. Stænglen går i zigzag.',
        'Store, næsten trekantede blade med en lige afskåret bund.',
        'Små hvidlige blomster i aks sidst på sommeren.',
      ],
      facts: [['Højde', '2–3 m'], ['Blomstrer', 'August–oktober']],
      where: 'Langs vandløb, veje og jernbaner, i haver, på byggegrunde og overalt, hvor jord er blevet flyttet.',
      spread: 'Næsten kun med jordstængler – selv et lille stykke kan blive til en ny plante. Flyt eller kompostér aldrig haveaffald eller jord med pileurt.' },
  ];
  const SOURCE = 'https://sgavmst.dk/media/zlsnxtqb/2025_invasivearter-grundbog-25-web.pdf';

  const img = n => typeof n === 'string' ? n : n.u;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = s => s ? new Date(s).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const isFylg = r => r.status === 'burt' && r.status_at && (Date.now() - new Date(r.status_at)) > FOLLOW_UP_DAYS * 864e5;
  const key = r => isFylg(r) ? 'fylg' : (STATUS[r.status] ? r.status : 'frab');
  const pill = r => { const k = key(r); return `<span class="pill p-${k}">${k === 'fylg' ? 'Følg op' : STATUS[k]}</span>`; };
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  // Grundkort: almindeligt kort, satellit og topografi
  function baseMap(el, { layers = false } = {}) {
    const m = L.map(el, { zoomSnap: .25, minZoom: 6 }).setView([56.1, 10.9], 6.75);
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
    if (layers) {
      const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Esri, Maxar, Earthstar Geographics' });
      const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: '© OpenStreetMap, SRTM · © OpenTopoMap (CC-BY-SA)' });
      L.control.layers({ 'Kort': osm, 'Satellit': sat, 'Topografi': topo }, null, { position: 'topright' }).addTo(m);
    }
    return m;
  }
  // Prik med farve efter status; stiplet ring, hvis stedet skal følges op
  function marker(r, layer, { selected = false, onClick } = {}) {
    const col = { frab: css('--s-frab'), byrj: css('--s-byrj'), burt: css('--s-burt') };
    if (isFylg(r)) L.circleMarker([r.lat, r.lon], { radius: selected ? 17 : 14, color: col.burt, weight: 2.5, dashArray: '4 3', fill: false, interactive: false }).addTo(layer);
    const m = L.circleMarker([r.lat, r.lon], { radius: selected ? 11 : 8, color: '#22281E', weight: selected ? 3 : 1.5, fillColor: col[r.status] || col.frab, fillOpacity: 1 }).addTo(layer);
    if (onClick) m.on('click', () => onClick(r));
    return m;
  }
  function inatMarker(o, layer) {
    return L.circleMarker([o.lat, o.lon], { radius: 6, color: css('--heather'), weight: 2.5, dashArray: o.grade === 'research' ? null : '3 3', fillColor: '#FFFFFF', fillOpacity: .85 }).addTo(layer);
  }
  function guideHtml() {
    return GUIDE.map(g => {
      const s = SPECIES[g.k], im = s.img.map(img);
      return `<article class="card sp" id="sp-${g.k}">
        <div class="gal"><img src="${im[0]}" alt="${s.fo}" loading="lazy">${im.length > 1 ? `<div class="side${im.length === 2 ? ' one' : ''}">${im.slice(1).map(x => `<img src="${x}" alt="${s.fo}" loading="lazy">`).join('')}</div>` : ''}</div>
        <div class="credit">Fotos: ${s.img.map(x => esc(x.c)).join(' · ')} · via iNaturalist</div>
        <div class="body">
          <div class="stack">
            <div><h3>${s.fo}</h3><div class="latin">${s.la}</div></div>
            <p>${g.lead}</p>
            <div><h4>Sådan ser den ud</h4><ul class="looks">${g.looks.map(x => `<li>${x}</li>`).join('')}</ul></div>
          </div>
          <div class="stack">
            <dl class="facts">${g.facts.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>
            ${g.warn ? `<div class="box warnbox"><b>Pas på!</b>${g.warn}</div>` : ''}
            <div class="box"><b>Hvor vokser den</b>${g.where}</div>
            <div class="box"><b>Hvordan spreder den sig</b>${g.spread}</div>
            <div class="acts"><a class="btn sm" href="#boda" data-sp="${g.k}">Indberet</a><a class="btn sm ghost" href="#kort" data-f="${g.k}">Se på kortet</a></div>
          </div>
        </div></article>`;
    }).join('') + `<p class="hint">Kilde: <a href="${SOURCE}" target="_blank" rel="noopener">Miljøstyrelsen – Invasive arter, grundbog</a></p>`;
  }
  // iNaturalist: prøv serverens cache først; svarer den ikke (fx HTTP 429), hentes fundene direkte fra iNaturalist i browseren
  const INAT_TAXA = [['bjorneklo', 1557658], ['rose', 83653], ['pileurt', 914922]];
  async function loadInat(server) {
    try { const r = await server(); if (r.ok) { const d = await r.json(); if ((d.observations || []).length) return d.observations; } } catch {}
    const out = [];
    for (const [sp, id] of INAT_TAXA) {
      try {
        const q = new URLSearchParams({ taxon_id: id, place_id: 8051, per_page: 200, order_by: 'observed_on', order: 'desc' });
        const d = await (await fetch('https://api.inaturalist.org/v1/observations?' + q)).json();
        for (const o of d.results || []) {
          const c = o.geojson?.coordinates; if (!c) continue;
          const p = o.photos?.[0]?.url || null;
          out.push({ id: o.id, sp, url: o.uri || `https://www.inaturalist.org/observations/${o.id}`, lat: c[1], lon: c[0],
            obscured: Boolean(o.obscured || o.geoprivacy === 'obscured'), observedOn: o.observed_on || null, grade: o.quality_grade || null,
            taxon: o.taxon?.name || null, user: o.user?.login || null, place: o.place_guess || null,
            photo: p ? p.replace('/square.', '/small.') : null, photoLarge: p ? p.replace('/square.', '/medium.') : null });
        }
      } catch {}
    }
    return out;
  }
  return { SPECIES, STATUS, GUIDE, FOLLOW_UP_DAYS, img, esc, fmt, isFylg, key, pill, css, baseMap, marker, inatMarker, guideHtml, loadInat };
})();
