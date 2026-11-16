const map = L.map('map', {zoomControl: true}).setView([39.5, -98.35], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 18
}).addTo(map);

const layer = L.layerGroup().addTo(map);
const markers = new Map();           // id -> marker
const canHover = matchMedia('(hover: hover)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = () => matchMedia('(max-width: 820px)').matches;
let episodes = [];
let selectedId = null;

const $ = id => document.getElementById(id);
const esc = s => { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; };
const code = e => `S${String(e.season).padStart(2,'0')}E${String(e.episode).padStart(2,'0')}`;
const isMapped = e => e.confidence !== 'low' && e.confidence !== 'unknown';
const place = e => e.city ? `${e.city}${e.state ? ', ' + e.state : ''}` : 'Location unknown';
const kind = e => e.locationType === 'real' ? '' : e.locationType;

function card(e) {
  const img = e.image
    ? `<img src="${esc(e.image.src)}" alt="${e.image.illustrative ? 'Illustrative photo of the region' : 'Photo of ' + esc(e.city)}" loading="lazy">`
    : `<div class="thumb">Photo coming soon</div>`;
  const credit = e.image
    ? `<div class="credit">${e.image.illustrative ? 'Illustrative photo. ' : ''}Photo: ${esc(e.image.author)} (${esc(e.image.license)}), Wikimedia Commons</div>` : '';
  const notes = [kind(e) ? `${kind(e)} location` : '', e.confidence && e.confidence !== 'high' ? `data confidence: ${e.confidence}` : '']
    .filter(Boolean).join(' · ');
  return `<div class="card">${img}<div class="body">
    <div class="kicker">${code(e)}</div>
    <h3>${esc(e.title)}</h3>
    <div class="place">${esc(place(e))}</div>
    <p>${esc(e.summary)}</p>
    ${notes ? `<div class="note">${esc(notes)}</div>` : ''}${credit}</div></div>`;
}

const style = (e, selected) => ({
  radius: selected ? 11 : 8,
  color: selected ? '#ffd9a8' : '#e8963a',
  weight: selected ? 3 : 2,
  fillColor: '#e8963a',
  fillOpacity: e.locationType === 'real' ? .85 : .2,
  dashArray: e.locationType === 'real' ? null : '3 3'
});

function select(id, {fly = false} = {}) {
  if (selectedId && markers.has(selectedId))
    markers.get(selectedId).setStyle(style(episodes.find(x => x.id === selectedId), false));
  selectedId = id;
  document.querySelectorAll('.ep').forEach(b => b.setAttribute('aria-current', b.dataset.id === id ? 'true' : 'false'));
  const m = markers.get(id);
  if (!m) return;
  m.setStyle(style(episodes.find(x => x.id === id), true)).bringToFront();
  if (fly) map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 6), {duration: reduceMotion ? 0 : .8});
  if (narrow()) {
    const e = episodes.find(x => x.id === id);
    $('detail').innerHTML = `<button class="close" aria-label="Close details">&times;</button>${card(e)}`;
    $('panel').scrollTop = 0;
  } else {
    if (fly) m.openPopup();
    const li = document.querySelector(`.ep[data-id="${id}"]`);
    if (li) li.scrollIntoView({block: 'nearest'});
  }
}

function render(season) {
  layer.clearLayers(); markers.clear(); selectedId = null; $('detail').innerHTML = '';
  const list = episodes
    .filter(isMapped)
    .filter(e => season === 'all' || e.season === +season)
    .sort((a, b) => a.season - b.season || a.episode - b.episode);

  $('panel-title').textContent = season === 'all' ? 'All seasons' : `Season ${season}`;
  $('panel-count').textContent = `${list.length} episodes on the map`;
  $('episode-list').innerHTML = list.map(e => `<li><button class="ep" data-id="${e.id}" aria-current="false">
      <span class="code">${code(e)}</span>
      <span class="name">${esc(e.title)}</span>
      <span class="place">${esc(place(e))}${kind(e) ? `<span class="badge">${esc(kind(e))}</span>` : ''}</span>
    </button></li>`).join('');

  if (list.length > 1)
    L.polyline(list.map(e => [e.lat, e.lng]), {color: '#e8963a', weight: 2, opacity: .55, className: 'route', interactive: false}).addTo(layer);

  list.forEach(e => {
    const m = L.circleMarker([e.lat, e.lng], style(e, false)).addTo(layer);
    if (!narrow()) m.bindPopup(card(e), {closeButton: true, autoPanPaddingTopLeft: [20, 70], autoPanPaddingBottomRight: [20, 20]});
    if (canHover && !narrow()) m.bindTooltip(card(e), {direction: 'top', offset: [0, -8], className: 'card-tip', opacity: 1});
    m.on('click', () => { m.closeTooltip(); select(e.id); });
    m.on('popupopen', () => select(e.id));
    markers.set(e.id, m);
  });
  if (list.length) map.fitBounds(list.map(e => [e.lat, e.lng]), {padding: [50, 50]});
}

function renderInfo(list) {
  $('info-count').textContent = list.length ? `(${list.length})` : '';
  $('view-info').innerHTML = `<div class="info-wrap">
    <h2>Unconfirmed locations</h2>
    <p class="lead">These episodes are not on the map because their location could not be confirmed. Shown for information only.</p>
    ${list.map(e => `<article class="info-card"><h3>${esc(e.title)}</h3>
      <div class="meta">${code(e)} · ${esc(place(e))}</div>
      <p>${esc(e.summary)}</p>${e.note ? `<p class="note">${esc(e.note)}</p>` : ''}</article>`).join('')}</div>`;
}

function showTab(name) {
  const isMap = name === 'map';
  $('view-map').hidden = !isMap;
  $('view-info').hidden = isMap;
  $('season-label').hidden = !isMap;
  for (const [id, on] of [['tab-map', isMap], ['tab-info', !isMap]]) {
    $(id).setAttribute('aria-selected', on);
    $(id).tabIndex = on ? 0 : -1;
  }
  if (isMap) map.invalidateSize();
}

$('tab-map').onclick = () => showTab('map');
$('tab-info').onclick = () => showTab('info');
document.querySelector('.tabs').addEventListener('keydown', ev => {
  if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
  const next = document.activeElement === $('tab-map') ? 'info' : 'map';
  showTab(next); $('tab-' + next).focus();
});
$('detail').addEventListener('click', ev => {
  if (ev.target.closest('.close')) { $('detail').innerHTML = ''; select(null); }
});
$('episode-list').addEventListener('click', ev => {
  const b = ev.target.closest('.ep');
  if (b) select(b.dataset.id, {fly: true});
});

fetch('data/episodes.json').then(r => r.json()).then(data => {
  episodes = data;
  renderInfo(data.filter(e => !isMapped(e)));
  const sel = $('season-filter');
  [...new Set(data.map(e => e.season))].sort((a, b) => a - b)
    .forEach(s => sel.add(new Option('Season ' + s, s)));
  sel.addEventListener('change', () => render(sel.value));
  render('all');
}).catch(() => {
  $('panel-count').textContent = 'Could not load episode data.';
});
