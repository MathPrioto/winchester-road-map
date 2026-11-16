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
const isMapped = e => e.lat != null && (e.showOnMap || (e.confidence !== 'low' && e.confidence !== 'unknown'));
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
    ${notes ? `<div class="note">${esc(notes)}</div>` : ''}${e.showOnMap && e.note ? `<div class="note">${esc(e.note)}</div>` : ''}${credit}</div></div>`;
}

// ---------- markers ----------
const pinIcon = (e, n) => L.divIcon({
  className: 'pin-wrap', iconSize: [30, 30], iconAnchor: [15, 15],
  html: `<div class="num-pin${e.locationType === 'real' ? '' : ' approx'}">${n}</div>`
});
const pinEl = id => markers.get(id)?.getElement()?.firstElementChild;

function select(id, {fly = false} = {}) {
  pinEl(selectedId)?.classList.remove('sel');
  selectedId = id;
  document.querySelectorAll('.ep').forEach(b => b.setAttribute('aria-current', b.dataset.id === id ? 'true' : 'false'));
  const m = markers.get(id);
  if (!m) return;
  pinEl(id)?.classList.add('sel');
  m.setZIndexOffset(1000);
  if (fly) map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 6), {duration: reduceMotion ? 0 : .8});
  if (narrow()) {
    const e = episodes.find(x => x.id === id);
    $('detail').innerHTML = `<button class="close" aria-label="Close details">&times;</button>${card(e)}`;
    $('panel').scrollTop = 0;
  } else {
    if (fly) setTimeout(() => { if (selectedId === id) m.openPopup(); }, reduceMotion ? 0 : 900);
    const li = document.querySelector(`.ep[data-id="${id}"]`);
    if (li) li.scrollIntoView({block: 'nearest'});
  }
}

// ---------- route animation ----------
const CAR_SVG = `<svg viewBox="0 0 48 22" width="40" height="18" aria-hidden="true">
  <path d="M3 15c0-3 1-4 4-5l6-1 5-5c1-1 3-1.500 5-1.500h8c2 0 3.500.5 5 2l4 4.500 5 1c2 .5 3 1.500 3 3.500v2c0 1-1 2-2 2H5c-1.500 0-2-1-2-2z" fill="#0d0b0a" stroke="#e8963a" stroke-width="1.500"/>
  <path d="M17 9l4-3.500h7l5 3.500z" fill="#e8963a" opacity=".55"/>
  <circle cx="14" cy="18" r="3.500" fill="#14110f" stroke="#e8963a" stroke-width="1.500"/>
  <circle cx="35" cy="18" r="3.500" fill="#14110f" stroke="#e8963a" stroke-width="1.500"/>
</svg>`;
const anim = {list: [], cum: [], idx: 0, t: 0, dwell: 0, playing: false, speed: 1, raf: 0, last: 0, car: null, trail: null, facing: 1};
const DWELL_MS = 2600;

const km = (a, b) => {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};
const legMs = i => Math.min(5000, Math.max(1500, km(anim.list[i], anim.list[i + 1]) * 3.2)) ;
const lerp = (a, b, t) => [a.lat + (b.lat - a.lat) * t, a.lng + (b.lng - a.lng) * t];
const ease = t => t < .5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;

function setupAnim(list) {
  stopAnim();
  Object.assign(anim, {list, idx: 0, t: 0, dwell: 0, cum: [0]});
  for (let i = 1; i < list.length; i++) anim.cum[i] = anim.cum[i - 1] + km(list[i - 1], list[i]);
  const has = list.length > 1;
  $('player').hidden = !has;
  if (!has) return;
  anim.trail = L.polyline([[list[0].lat, list[0].lng]], {color: '#ffd9a8', weight: 3.5, opacity: .95, interactive: false}).addTo(layer);
  anim.car = L.marker([list[0].lat, list[0].lng], {
    icon: L.divIcon({className: 'car-wrap', iconSize: [40, 18], iconAnchor: [20, 9], html: `<div class="car">${CAR_SVG}</div>`}),
    interactive: false, keyboard: false, zIndexOffset: 2000
  }).addTo(layer);
  hud();
}

function hud() {
  const i = anim.idx, n = anim.list.length;
  const d = anim.cum[i] + (i < n - 1 ? (anim.cum[i + 1] - anim.cum[i]) * ease(anim.t) : 0);
  $('hud').textContent = `${i + 1}/${n} · ${Math.round(d * .6214).toLocaleString('en-US')} mi (${Math.round(d).toLocaleString('en-US')} km)`;
  const playing = anim.playing, done = !playing && i === n - 1 && n > 1;
  $('play').textContent = playing ? 'Pause' : done ? 'Replay' : (i === 0 && anim.t === 0 ? 'Play route' : 'Resume');
  $('play').setAttribute('aria-pressed', playing);
}

function placeCar(i, t) {
  const a = anim.list[i], b = anim.list[Math.min(i + 1, anim.list.length - 1)];
  const pos = lerp(a, b, ease(t));
  anim.car.setLatLng(pos);
  const dir = b.lng < a.lng ? -1 : 1;
  if (t > 0 && dir !== anim.facing) { anim.facing = dir; anim.car.getElement()?.firstElementChild.style.setProperty('--dir', dir); }
  anim.trail.setLatLngs([...anim.list.slice(0, i + 1).map(e => [e.lat, e.lng]), pos]);
  if (!map.getBounds().pad(-.15).contains(pos)) map.panTo(pos, {animate: !reduceMotion, duration: .6});
  hud();
}

function arrive(i) {
  anim.idx = i; anim.t = 0; anim.dwell = DWELL_MS;
  placeCar(i, 0);
  const e = anim.list[i];
  select(e.id);
  if (!narrow()) markers.get(e.id)?.openPopup();
  if (i >= anim.list.length - 1) { pauseAnim(); }
}

function tick(now) {
  if (!anim.playing) return;
  const dt = (now - anim.last) * anim.speed; anim.last = now;
  if (anim.dwell > 0) {
    anim.dwell -= dt;
    if (anim.dwell <= 0) map.closePopup();
  } else {
    anim.t += dt / legMs(anim.idx);
    if (anim.t >= 1) { arrive(anim.idx + 1); } else placeCar(anim.idx, anim.t);
  }
  if (anim.playing) anim.raf = requestAnimationFrame(tick);
}

function playAnim() {
  if (anim.list.length < 2) return;
  if (anim.idx >= anim.list.length - 1) { anim.idx = 0; anim.t = 0; anim.dwell = 0; placeCar(0, 0); }
  anim.playing = true; anim.last = performance.now();
  if (anim.idx === 0 && anim.t === 0 && !anim.dwell) arrive(0);
  hud();
  cancelAnimationFrame(anim.raf);
  anim.raf = requestAnimationFrame(tick);
}
function pauseAnim() { anim.playing = false; cancelAnimationFrame(anim.raf); hud(); }
function stopAnim() { anim.playing = false; cancelAnimationFrame(anim.raf); anim.car = anim.trail = null; }
function jumpTo(id) {
  const i = anim.list.findIndex(e => e.id === id);
  if (i < 0 || !anim.car) return;
  pauseAnim(); anim.idx = i; anim.t = 0; anim.dwell = 0; placeCar(i, 0);
}

function buildPlayer() {
  const Player = L.Control.extend({
    options: {position: 'bottomleft'},
    onAdd() {
      const div = L.DomUtil.create('div', 'player'); div.id = 'player'; div.hidden = true;
      div.innerHTML = `<button id="play" type="button" aria-pressed="false">Play route</button>
        <button id="restart" type="button" aria-label="Back to the first episode" title="Restart">&#x21BA;</button>
        <label class="speed"><span class="sr">Speed</span>
          <select id="speed" aria-label="Animation speed"><option value="0.5">0.5x</option><option value="1" selected>1x</option><option value="2">2x</option><option value="4">4x</option></select></label>
        <span id="hud" class="hud" aria-live="off"></span>`;
      L.DomEvent.disableClickPropagation(div);
      return div;
    }
  });
  map.addControl(new Player());
  $('play').onclick = () => anim.playing ? pauseAnim() : playAnim();
  $('restart').onclick = () => { pauseAnim(); anim.idx = 0; anim.t = 0; anim.dwell = 0; map.closePopup(); placeCar(0, 0); select(anim.list[0].id); };
  $('speed').onchange = e => { anim.speed = +e.target.value; };
}

// ---------- render ----------
function render(season) {
  stopAnim();
  layer.clearLayers(); markers.clear(); selectedId = null; $('detail').innerHTML = '';
  const list = episodes
    .filter(isMapped)
    .filter(e => season === 'all' || e.season === +season)
    .sort((a, b) => a.season - b.season || a.episode - b.episode);

  $('panel-title').textContent = season === 'all' ? 'All seasons' : `Season ${season}`;
  $('panel-count').textContent = `${list.length} episodes on the map`;
  $('episode-list').innerHTML = list.map((e, i) => `<li><button class="ep" data-id="${e.id}" aria-current="false">
      <span class="code">${i + 1}</span>
      <span class="name">${esc(e.title)}</span>
      <span class="place">${code(e)} · ${esc(place(e))}${e.showOnMap ? '<span class="badge">uncertain</span>' : kind(e) ? `<span class="badge">${esc(kind(e))}</span>` : ''}</span>
    </button></li>`).join('');

  if (list.length > 1)
    L.polyline(list.map(e => [e.lat, e.lng]), {color: '#e8963a', weight: 2, opacity: .5, className: 'route', interactive: false}).addTo(layer);

  list.forEach((e, i) => {
    const m = L.marker([e.lat, e.lng], {icon: pinIcon(e, i + 1), title: `${i + 1}. ${e.title}`, alt: `${i + 1}. ${e.title}`}).addTo(layer);
    if (!narrow()) m.bindPopup(card(e), {closeButton: true, autoPanPaddingTopLeft: [20, 70], autoPanPaddingBottomRight: [20, 20], offset: [0, -8]});
    if (canHover && !narrow()) m.bindTooltip(card(e), {direction: 'top', offset: [0, -14], className: 'card-tip', opacity: 1});
    m.on('click', () => { m.closeTooltip(); select(e.id); jumpTo(e.id); });
    m.on('popupopen', () => select(e.id));
    markers.set(e.id, m);
  });
  if (list.length) map.fitBounds(list.map(e => [e.lat, e.lng]), {padding: [50, 50]});
  setupAnim(list);
}

function renderInfo(list) {
  $('info-count').textContent = list.length ? `(${list.length})` : '';
  const seasons = [...new Set(list.map(e => e.season))].sort((x, y) => x - y);
  $('view-info').innerHTML = `<div class="info-wrap">
    <h2>Unconfirmed locations</h2>
    <p class="lead">These episodes are not on the map because their location could not be confirmed. Shown for information only.</p>
    ${seasons.map((n, i) => {
      const eps = list.filter(e => e.season === n);
      return `<details class="season-group"${i === 0 ? ' open' : ''}>
        <summary><span>Season ${n}</span><span class="count-pill">${eps.length}</span></summary>
        ${eps.map(e => `<article class="info-card"><h3>${esc(e.title)}</h3>
          <div class="meta">${code(e)} · ${esc(place(e))}</div>
          <p>${esc(e.summary)}</p>${e.note ? `<p class="note">${esc(e.note)}</p>` : ''}</article>`).join('')}
      </details>`;
    }).join('')}</div>`;
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
  if (b) { select(b.dataset.id, {fly: true}); jumpTo(b.dataset.id); }
});

fetch('data/episodes.json').then(r => r.json()).then(data => {
  episodes = data;
  renderInfo(data.filter(e => !isMapped(e)));
  const sel = $('season-filter');
  [...new Set(data.map(e => e.season))].sort((a, b) => a - b)
    .forEach(s => sel.add(new Option('Season ' + s, s)));
  sel.addEventListener('change', () => render(sel.value));
  buildPlayer();
  sel.value = sel.options[1].value;   // open on the first season
  render(sel.value);
}).catch(() => {
  $('panel-count').textContent = 'Could not load episode data.';
});
