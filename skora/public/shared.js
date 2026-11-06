// Felags fyri forsíðuna og admin-síðuna: sløg, støður, plantulýsingar og kort.
window.IP = (() => {
  const SPECIES = {
    skora:  { fo: 'Garðaskøra', la: 'Alchemilla mollis', img: ['gardaskora-bour', 'gardaskora-vegur', 'gardaskora-naert'] },
    apu:    { fo: 'Apublóma', la: 'Mimulus guttatus (Erythranthe guttata)', img: ['apubloma-bour', 'apubloma-naert'] },
    folfod: { fo: 'Loðið hóvblað', la: 'Tussilago farfara', img: ['folfod-blomur', 'folfod-blod', 'folfod-fraeboll'] },
    ukent:  { fo: 'Veit ikki', la: '', img: [] },
  };
  const STATUS = { frab: 'Fráboðað', byrj: 'Týning byrjað', burt: 'Burturbeint' };
  const FOLLOW_UP_DAYS = 365; // burturbeint stað skal kannast aftur eftir so nógvar dagar

  // Tekstir frá verkætlanini (nov. 2026)
  const GUIDE = [
    { k: 'skora',
      lead: 'Í Føroyum vaksa sjey sløg av skøru, men bara garðaskøran er innræsin.',
      looks: [
        'Garðaskøra hevur stór, bleyt, loðin og skarðut bløð, sum vaksa í tyssum – nógv saman á somu plantu. Ofta savnast vatn- og døggdropar í miðjuni, ið síggja út sum perlur.',
        'Har ein veksur, vaksa skjótt fleiri, tí hon breiðir seg skjótt bæði við rótskotum og við fræi frá blómunum.',
        'Garðaskøran verður munandi størri enn hini skørusløgini, ofta millum 30 og 50 cm høg.',
        'Blómurnar eru heilt smáar, gulgrønar ella gular og vaksa nógvar saman á blómustelkunum, ið røkka upp um bløðini.',
      ],
      facts: [['Hædd', '30–50 cm'], ['Blómar', 'Juni–september']],
      where: 'Garðaskøran er harðfør og trívst næstan allastaðni. Hon veksur fram við vegum og gøtum, men eisini í haga og bøi, fram við áum, á fløtum og óbygdum grundstykkjum – og enntá í bergi.',
      spread: 'Hon er sera trupul at køva og krevur afturvendandi átøk í fleiri ár, skal hon doyggja.' },
    { k: 'folfod',
      lead: 'Loðið hóvblað hevur verið í Føroyum í nógv ár, men er seinastu árini farið at breiða seg – serliga har nýggj grundstykki verða gjørd, har útgrevstur er og har fólk á annan hátt gera seg inn á náttúruna.',
      looks: [
        'Loðið hóvblað er ein lágvaksin planta við sterkt gulum blómum, ið minna um várhagasólju. Tá ið hon er um at verða avblómað, verður blóman hvít og „ullin“.',
        'Stelkurin er tjúkkur, sterkur og trupul at slíta.',
        'Bløðini eru mestsum hjartaskapað, myrkagrøn og loðin. Tey breiða seg skjótt yvir stór øki. Bløðini síggjast sjáldan samstundis sum sjálv blóman, tí tey koma ikki, fyrr enn plantan er avblómað aftur.',
      ],
      facts: [['Blómar', 'Mars–apríl'], ['Bløð', 'Juli–september']],
      where: 'Hon er harðfør og trívist í vátari og kleiggjutari mold, í skugga eins væl og í sól, og í bøi eins væl og í haga. Hon veksur eisini væl í skervi og í økjum, har maskinur hava arbeitt og t.d. grivið út.',
      spread: 'Hon breiðir seg bæði við rótskotum undir jørð og við fræum frá blómunum – og er tí sera trupul at fáa bilbukt við.' },
    { k: 'apu',
      lead: 'Eisini nevnd laurusa blomstur.',
      looks: [
        'Blómurnar eru stórar, skreytmiklar og ofta gular ella reyðar á liti – heilt frá ljósagulum og yvir í myrkareytt. Tær hava ofta blettir inni í blómuni.',
        'Tær hava tvær „varrar“, har niðara „vørrin“ er størri. Inni í blómuni eru ofta reyðir ella brúnir blettir og smá hár. Tí verður hon eisini kallað blettut apublóma.',
        'Bløðini eru upp eftir stelkinum og fylgjast at, tvey og tvey uppeftir. Tey eru grøn og ovalskapað við takkutum kanti, og tey síggjast áðrenn blómurnar.',
        'Plantan kann verða millum 20 og 60 cm høg.',
      ],
      facts: [['Hædd', '20–60 cm'], ['Blómar', 'Mai–september']],
      where: 'Apublómuni dámar best vátt lendi og trívist serstakliga væl fram við áum, veitum, mýrilendi og har væta kemur úr jørðini. Hon sæst ofta, har mýrisólja og gloym meg ei vaksa. Hon er tó eisini funnin í turrum bøi, haga og enntá í bergi. Hon tolir væl bæði kulda og vind.',
      spread: 'Hon fræar seg sjálva og breiðir seg eisini við rótskotum.' },
  ];

  const img = n => `/img/${n}.jpg`;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = s => s ? new Date(s).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const isFylg = r => r.status === 'burt' && r.status_at && (Date.now() - new Date(r.status_at)) > FOLLOW_UP_DAYS * 864e5;
  const key = r => isFylg(r) ? 'fylg' : (STATUS[r.status] ? r.status : 'frab');
  const pill = r => { const k = key(r); return `<span class="pill p-${k}">${k === 'fylg' ? 'Fylg upp' : STATUS[k]}</span>`; };
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  // Grundkort: vanligt kort, satellit og topografi
  function baseMap(el, { layers = false } = {}) {
    const m = L.map(el, { zoomSnap: .25, minZoom: 7 }).setView([62.05, -6.95], 8.5);
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
    if (layers) {
      const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Esri, Maxar, Earthstar Geographics' });
      const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: '© OpenStreetMap, SRTM · © OpenTopoMap (CC-BY-SA)' });
      L.control.layers({ 'Kort': osm, 'Satellit': sat, 'Topografi': topo }, null, { position: 'topright' }).addTo(m);
    }
    return m;
  }
  // Prikkur við lit eftir støðu; stikkaður ringur um tað skal fylgjast upp
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
        <div class="body">
          <div class="stack">
            <div><h3>${s.fo}</h3><div class="latin">${s.la}</div></div>
            <p>${g.lead}</p>
            <div><h4>Hvussu sær hon út</h4><ul class="looks">${g.looks.map(x => `<li>${x}</li>`).join('')}</ul></div>
          </div>
          <div class="stack">
            <dl class="facts">${g.facts.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>
            <div class="box"><b>Hvar veksur hon</b>${g.where}</div>
            <div class="box"><b>Hvussu breiðir hon seg</b>${g.spread}</div>
            <div class="acts"><a class="btn sm" href="#boda" data-sp="${g.k}">Boða frá</a><a class="btn sm ghost" href="#kort" data-f="${g.k}">Sí á kortinum</a></div>
          </div>
        </div></article>`;
    }).join('');
  }
  return { SPECIES, STATUS, GUIDE, FOLLOW_UP_DAYS, img, esc, fmt, isFylg, key, pill, css, baseMap, marker, inatMarker, guideHtml };
})();
