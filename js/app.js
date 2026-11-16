const map = L.map('map').setView([39.5, -98.35], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors', maxZoom: 18
}).addTo(map);

let layer = L.layerGroup().addTo(map);
let episodes = [];

function esc(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

function card(e){
  const img = e.image
    ? `<img src="${esc(e.image.src)}" alt="${esc(e.city)}">`
    : `<div class="img">image coming soon</div>`;
  const credit = e.image
    ? `<br><small class="credit">${e.image.illustrative ? 'Illustrative photo. ' : ''}Photo: ${esc(e.image.author)} (${esc(e.image.license)}), Wikimedia Commons</small>`
    : '';
  const note = (e.locationType === 'real' ? '' : `<br><small>${e.locationType} location</small>`)
    + (e.confidence && e.confidence !== 'high' ? `<br><small>data confidence: ${e.confidence}</small>` : '');
  return `<div class="card">${img}<h3>${esc(e.city)}, ${esc(e.state)}</h3>
    <small>S${String(e.season).padStart(2,'0')}E${String(e.episode).padStart(2,'0')}</small>${note}
    <p><b>${esc(e.title)}</b></p><p>${esc(e.summary)}</p>${credit}</div>`;
}

function renderInfo(list){
  const where = e => e.city ? `${esc(e.city)}${e.state ? ', ' + esc(e.state) : ''}` : 'Location unknown';
  document.getElementById('info').innerHTML =
    `<p class="lead">These episodes are not on the map because their location could not be confirmed. Shown for information only.</p>` +
    list.map(e => `<article><h3>${esc(e.title)}</h3>
      <small>S${String(e.season).padStart(2,'0')}E${String(e.episode).padStart(2,'0')} · ${where(e)}</small>
      <p>${esc(e.summary)}</p><p class="note">${esc(e.note || '')}</p></article>`).join('');
}

function render(season){
  layer.clearLayers();
  const list = episodes
    .filter(e => e.confidence !== 'low' && e.confidence !== 'unknown')
    .filter(e => season === 'all' || e.season === +season)
    .sort((a,b) => a.season - b.season || a.episode - b.episode);
  list.forEach(e => {
    const real = e.locationType === 'real';
    L.circleMarker([e.lat, e.lng], {
      radius: 8, color: '#c0392b', weight: 2, fillOpacity: real ? .8 : .2,
      dashArray: real ? null : '3 3'
    }).bindTooltip(card(e), {sticky: true, direction: 'top'}).addTo(layer);
  });
  if (list.length > 1)
    L.polyline(list.map(e => [e.lat, e.lng]), {color:'#e67e22', weight:2, opacity:.7, dashArray:'6 6'}).addTo(layer);
  if (list.length) map.fitBounds(list.map(e => [e.lat, e.lng]), {padding:[40,40]});
}

fetch('data/episodes.json').then(r => r.json()).then(data => {
  episodes = data;
  renderInfo(data.filter(e => e.confidence === 'low' || e.confidence === 'unknown'));
  const showTab = t => {
    const isMap = t === 'map';
    document.getElementById('map').hidden = !isMap;
    document.getElementById('info').hidden = isMap;
    document.getElementById('season-label').hidden = !isMap;
    document.getElementById('tab-map').classList.toggle('active', isMap);
    document.getElementById('tab-info').classList.toggle('active', !isMap);
    if (isMap) map.invalidateSize();
  };
  document.getElementById('tab-map').onclick = () => showTab('map');
  document.getElementById('tab-info').onclick = () => showTab('info');
  const sel = document.getElementById('season-filter');
  [...new Set(data.map(e => e.season))].sort((a,b)=>a-b)
    .forEach(s => sel.add(new Option('Season ' + s, s)));
  sel.addEventListener('change', () => render(sel.value));
  render('all');
});
