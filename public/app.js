(() => {
'use strict';

// Global image error handler: if any image fails to load, gracefully fallback to hero photo
window.addEventListener('error', e => {
  if (e.target && e.target.tagName === 'IMG' && !e.target.dataset.failed) {
    e.target.dataset.failed = '1';
    if (!e.target.src.includes('hero.jpg')) {
      e.target.src = '/img/hero.jpg';
    }
  }
}, true);

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* private mode */ } }
};
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

function authHeaders() {
  const token = store.get('chutti_token', '');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function api(path, opts = {}) {
  const headers = { ...authHeaders(), ...(opts.headers || {}) };
  const r = await fetch(path, { credentials: 'same-origin', ...opts, headers });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = typeof j.detail === 'string' ? j.detail : (Array.isArray(j.detail) && j.detail[0]?.msg) ? j.detail[0].msg : (j.error || 'Something went wrong');
    const err = new Error(msg);
    err.status = r.status;
    throw err;
  }
  return j;
}
const post = (path, body) => api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const put = (path, body) => api(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const del = (path) => api(path, { method: 'DELETE' });

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

/* ---------- icons ---------- */
const P = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  pin: '<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  bed: '<path d="M3 19V5M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="1.8"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.2.4c-.2.4-.1.8.2 1.1L8 11l-2 3H3l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.2.2l.4-.3c.3-.3.4-.7.3-1.1z"/>',
  food: '<path d="M5 3v8a2 2 0 0 0 2 2v8M9 3v8a2 2 0 0 1-2 2M17 21V3c-2.5 1.5-4 4.5-4 8h4"/>',
  bus: '<rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 11h16M8 17v3M16 17v3"/><circle cx="8" cy="14" r=".6"/><circle cx="16" cy="14" r=".6"/>',
  train: '<rect x="5" y="3" width="14" height="15" rx="3"/><path d="M5 11h14M8 21l2-3M16 21l-2-3"/><circle cx="9" cy="14.5" r=".6"/><circle cx="15" cy="14.5" r=".6"/>',
  cab: '<path d="M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16M3 16h18v3H3z"/><circle cx="7.5" cy="19" r="1"/><circle cx="16.5" cy="19" r="1"/>',
  mountain: '<path d="m2 20 7-12 4 6 3-4 6 10z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="m5 12.5 5 5 9-10"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 1.8L21.5 19.5l-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  warn: '<path d="M12 3 2 21h20z"/><path d="M12 10v5M12 18v.01"/>',
  save: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.6 6.8-4M8.6 13.4l6.8 4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10 9.5 5 2.5-5 2.5z"/>',
  insta: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/>',
  x: '<path d="M4 4l16 16M20 4 4 20"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 11v5M8 8v.01M12 16v-5M12 13a2.5 2.5 0 0 1 5 0v3"/>',
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M16 12.5h5v2h-5a1 1 0 0 1 0-2zM6 6V5a2 2 0 0 1 2-2h9"/>',
  heart: '<path d="M12 20.5s-7.5-4.6-9.5-9.2A5.3 5.3 0 0 1 12 6.5a5.3 5.3 0 0 1 9.5 4.8c-2 4.6-9.5 9.2-9.5 9.2z"/>',
  play: '<polygon points="8,5 19,12 8,19" fill="currentColor" stroke="none"/>',
  cloud: '<path d="M17.5 19H7a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 17 9.5a3.5 3.5 0 0 1 .5 9.5z"/>',
  flame: '<path d="M12 3c.5 3.2-2 4.8-2 7.5a3.5 3.5 0 0 0 7 0c0-2.2-1.5-3.8-2.3-5.2C17.5 6.8 19 9.5 19 12.5A7 7 0 0 1 5 12.5C5 8.5 8 5.2 12 3z"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>'
};
const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;
const icFill = n => `<svg class="ic fill" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;
const modeIcon = m => ({ bus: 'bus', train: 'train', flight: 'plane', cab: 'cab' }[m] || 'bus');
const logoPlane = `<svg class="logo-mark" viewBox="0 0 44 30" aria-hidden="true"><path d="M2 26 14 7l7 10 5-7 10 16h-6.5l-4.5-7.5-4 5.5-7-10L8.5 26z" fill="currentColor"/><path d="M21 17 26 10l4 6.5-3.2 2.2-2.8-3.8z" fill="var(--accent)" opacity=".85"/></svg>`;
const swoosh = `<svg viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M2 8 Q 100 -2 198 6" stroke="#ef3b36" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;

/* ---------- state ---------- */
let DESTS = [];
let HEALTH = { ai: false, model: 'CodeFusionAI' };
let USER = null;
let GOOGLE_CLIENT_ID = '';
let planToken = 0;
let currentPlan = null;
const MORE_DESTS = ['Udaipur', 'Kerala', 'Varanasi', 'Agra', 'Spiti Valley', 'Andaman', 'Coorg', 'Ooty', 'Munnar', 'Gangtok', 'Meghalaya', 'Jaisalmer', 'Jodhpur', 'Hampi', 'Pondicherry', 'Amritsar', 'Kedarnath', 'Nainital', 'Mussoorie', 'Kodaikanal'];
const bySlug = s => DESTS.find(d => d.slug === s);
const slugFor = (name, fallbackSlug) => {
  if (fallbackSlug) return fallbackSlug;
  const n = String(name || '').trim().toLowerCase();
  const match = DESTS.find(d => d.slug === n || d.name.toLowerCase() === n);
  return match ? match.slug : 'generic';
};
const img = slug => {
  const s = String(slug || 'generic').trim().toLowerCase().replace(/\.(jpg|jpeg|png|webp)$/i, '');
  return `/img/dest/${encodeURIComponent(s)}.jpg?v=5`;
};
const mapLink = q => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
const googleIconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" style="flex-shrink:0"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.28v3.13C3.27 21.36 7.34 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.28C.46 8.2 0 10.04 0 12s.46 3.8 1.28 5.42l4-3.13z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.64 1.28 6.58l4 3.13c.95-2.83 3.6-4.96 6.72-4.96z"/></svg>`;
function navigate(hash) {
  if (location.hash === hash) return;
  const url = new URL(location.href);
  url.hash = hash;
  // Route fragments describe app views, not scroll targets in the document.
  history.pushState(null, '', url.href);
  route();
}

const planHash = (p) => {
  const q = new URLSearchParams({ d: p.destination, b: p.budget });
  if (p.days) q.set('days', p.days);
  if (p.travelers && +p.travelers > 1) q.set('t', p.travelers);
  if (p.origin && p.origin !== 'Delhi') q.set('from', p.origin);
  if (p.style && p.style !== 'auto') q.set('style', p.style);
  if (p.when && p.when !== 'Anytime') q.set('when', p.when);
  return '#/plan?' + q.toString();
};

/* ---------- Client-side Smart Plan Builder & Estimator Fallback ---------- */
const STYLE_RATES = { budget: { hotel: 1, food: 1 }, comfort: { hotel: 1.6, food: 1.3 } };
const round10 = n => Math.round(n / 10) * 10;
const clampVal = (n, a, b) => Math.min(b, Math.max(a, n));

function clientFindDest(name) {
  const n = String(name || '').trim().toLowerCase();
  if (!n) return null;
  return (
    DESTS.find(d => d.slug === n || d.name.toLowerCase() === n) ||
    DESTS.find(d => (d.aliases || []).some(a => a.toLowerCase() === n)) ||
    DESTS.find(d => n.includes(d.name.toLowerCase()) || (d.aliases || []).some(a => n.includes(a.toLowerCase()))) ||
    null
  );
}

function clientProfile(name) {
  const d = clientFindDest(name);
  if (d) return d;
  return {
    slug: 'generic', name: String(name || 'Your Destination').trim(),
    state: 'India', scene: 'generic', tagline: 'Unforgettable adventures & scenic escapes',
    bestTime: 'October to May', ideal: 4,
    cost: { hotel: 1400, food: 450, local: 350, act: 500, reach: 1400 },
    reachMode: 'Train / Bus / Flight', reachDuration: '10–14 hrs',
    places: [
      { name: 'City Center & Heritage Walk', desc: 'Explore the local sights, markets, and iconic architecture.' },
      { name: 'Panoramic Viewpoint', desc: 'Breathtaking sunrise or sunset views overlooking the valley.' },
      { name: 'Cultural Landmark & Museum', desc: 'Immerse in the vibrant history and local traditions.' },
      { name: 'Nature Trail & Waterfalls', desc: 'Peaceful stroll through scenic natural landscapes.' },
      { name: 'Evening Bazaar & Street Food', desc: 'Sample regional delicacies and pick up handcrafted souvenirs.' }
    ],
    foods: ['Regional Thali', 'Local street eats', 'Fresh herbal chai', 'Signature local dessert'],
    tips: ['Book trains or buses in advance for the best rates.', 'Carry comfortable walking shoes.', 'Try local food joints recommended by residents.']
  };
}

function clientCostFor(p, days, travelers, style) {
  const s = STYLE_RATES[style] || STYLE_RATES.budget;
  const nights = Math.max(days - 1, 0);
  const rooms = Math.ceil(travelers / 2);
  const hotel = round10(nights * (p.cost?.hotel || 1400) * rooms * s.hotel);
  const food = round10(days * (p.cost?.food || 450) * travelers * s.food);
  const reach = round10(travelers * (p.cost?.reach || 1200) * 2);
  const local = round10(days * (p.cost?.local || 250) * rooms);
  const activities = round10(days * (p.cost?.act || 500) * travelers);
  return { hotel, food, travel: reach + local, reach, local, activities, total: hotel + food + reach + local + activities };
}

function clientFit(p, budget, travelers, wantedDays, wantedStyle) {
  const maxDays = Math.max(p.ideal || 4, 3);
  let style = wantedStyle === 'comfort' ? 'comfort' : 'budget';
  let days;
  if (wantedDays && Number(wantedDays) > 0) {
    days = clampVal(Math.round(wantedDays), 1, 14);
  } else {
    days = 2;
    for (let d = maxDays; d >= 2; d--) {
      if (clientCostFor(p, d, travelers, 'budget').total <= budget * 0.97) { days = d; break; }
    }
  }
  if (wantedStyle === 'auto' || !wantedStyle) {
    style = clientCostFor(p, days, travelers, 'comfort').total <= budget * 0.97 && days >= Math.min(p.ideal || 4, 3) ? 'comfort' : 'budget';
  }
  return { days, style };
}

function clientEstimate(params) {
  const p = clientProfile(params.destination);
  const travelers = clampVal(parseInt(params.travelers, 10) || 1, 1, 10);
  const budget = Math.max(parseInt(params.budget, 10) || 10000, 1000);
  const { days, style } = clientFit(p, budget, travelers, params.days ? Number(params.days) : 0, params.style);
  const c = clientCostFor(p, days, travelers, style);
  return {
    destination: p.name || params.destination,
    slug: p.slug || 'generic',
    known: !!p.slug,
    days, nights: Math.max(days - 1, 0), travelers, style,
    breakdown: { hotel: c.hotel, food: c.food, travel: c.travel, activities: c.activities },
    parts: { reach: c.reach, local: c.local },
    total: c.total,
    leftover: Math.max(budget - c.total, 0),
    withinBudget: c.total <= budget,
    minimumBudget: clientCostFor(p, 2, travelers, 'budget').total,
    mainTransport: p.reachMode || 'Train / Volvo Bus',
    reachDuration: p.reachDuration || 'Overnight'
  };
}

function clientBuildPlan(params, notice) {
  const p = clientProfile(params.destination);
  const e = clientEstimate(params);
  const dest = e.destination || params.destination;
  const hotelNight = Math.round((p.cost?.hotel || 1400) * (e.style === 'comfort' ? 1.6 : 1) / 10) * 10;
  const places = (p.places && p.places.length) ? p.places : [
    { name: 'City Center & Heritage Walk', desc: 'Explore the local sights, markets, and iconic architecture.' },
    { name: 'Panoramic Viewpoint', desc: 'Breathtaking sunrise or sunset views overlooking the valley.' },
    { name: 'Nature Trail & Waterfalls', desc: 'Peaceful stroll through scenic natural landscapes.' }
  ];

  let pi = 0;
  const nextPlace = () => places[pi++ % places.length];
  const itinerary = [];
  for (let d = 1; d <= e.days; d++) {
    const items = [];
    if (d === 1) {
      items.push({ time: 'Morning', title: `Travel to ${dest}`, detail: `${p.reachMode || 'Volvo Bus / Train'}, about ${p.reachDuration || 'overnight'}. Arrive, check in and freshen up.`, cost: 0 });
      const a = nextPlace();
      items.push({ time: 'Evening', title: a ? a.name : `Explore ${dest}`, detail: a ? a.desc : 'Short walk around your hotel, scenic sunset, and dinner at a local cafe.', cost: 0 });
    } else if (d === e.days && e.days > 1) {
      const a = nextPlace();
      items.push({ time: 'Morning', title: a ? a.name : `Last look at ${dest}`, detail: a ? a.desc : 'Enjoy a relaxed breakfast, take final photos, and shop for local souvenirs.', cost: 0 });
      items.push({ time: 'Afternoon', title: 'Check out & return journey', detail: `Head back toward ${params.origin || 'Delhi'} by ${p.reachMode || 'bus / train'}.`, cost: 0 });
    } else {
      const a = nextPlace(), b = nextPlace();
      items.push({ time: 'Morning', title: a ? a.name : `Explore ${dest}`, detail: a ? a.desc : 'Visit the signature sights with an auto or local guide.', cost: 0 });
      items.push({ time: 'Afternoon', title: b ? b.name : 'Local food walk', detail: b ? b.desc : 'Lunch at a well-reviewed spot, followed by scenic viewpoints.', cost: 0 });
      items.push({ time: 'Evening', title: 'Sunset & Cafe Vibes', detail: 'Relax at a popular viewpoint and enjoy regional dinner.', cost: 0 });
    }
    itinerary.push({ day: d, title: d === 1 ? 'Arrival & First Sights' : (d === e.days && e.days > 1 ? 'Souvenirs & Departure' : `Explore ${dest}`), items });
  }

  const plan = {
    source: 'estimate',
    destination: dest,
    slug: p.slug || 'generic',
    title: `${dest} ${e.days}-Day Budget Journey`,
    tagline: p.tagline || 'Crafted with CodeFusionAI',
    summary: `A carefully balanced ${e.days}-day itinerary for ${e.travelers} ${e.travelers > 1 ? 'travellers' : 'traveller'} with stays, transport, food and day-by-day plans planned within ₹${Number(params.budget).toLocaleString('en-IN')}.`,
    days: e.days,
    nights: e.nights,
    travelers: e.travelers,
    origin: params.origin || 'Delhi',
    budget: Number(params.budget) || e.total,
    style: e.style,
    when: params.when || 'Anytime',
    breakdown: [
      { key: 'hotel', label: `Hotel (${e.nights} ${e.nights === 1 ? 'Night' : 'Nights'})`, amount: e.breakdown.hotel, note: `₹${hotelNight.toLocaleString('en-IN')} per room per night` },
      { key: 'food', label: 'Food & Dining', amount: e.breakdown.food, note: 'Local meals, street food & cafes' },
      { key: 'travel', label: `Transport (${e.mainTransport})`, amount: e.breakdown.travel, note: 'Round trip transit + local autos' },
      { key: 'activities', label: 'Activities & Entry', amount: e.breakdown.activities, note: 'Entry tickets and sightseeing' }
    ],
    total: e.total,
    leftover: e.leftover,
    withinBudget: e.withinBudget,
    minimumBudget: e.minimumBudget,
    transport: [{
      mode: (p.reachMode || '').toLowerCase().includes('flight') ? 'flight' : (p.reachMode || '').toLowerCase().includes('train') ? 'train' : 'bus',
      title: `${params.origin || 'Delhi'} → ${dest}`,
      duration: p.reachDuration || 'Overnight',
      cost: p.cost?.reach || 1200,
      note: 'One way, per person. Live fares may vary.',
      recommended: true
    }],
    hotels: [{
      name: `${e.style === 'comfort' ? 'Premium 3-Star Stay' : 'Comfort Budget Hotel'} in ${dest}`,
      area: 'Centrally located near main attractions',
      type: e.style === 'comfort' ? '3-Star Hotel / Resort' : 'Boutique Hotel / Homestay',
      pricePerNight: hotelNight,
      note: 'Per room per night'
    }],
    food: (p.foods || []).slice(0, 4).map(f => ({ name: f, what: 'Local specialty', cost: Math.round((p.cost?.food || 450) / 3 / 10) * 10 })),
    itinerary,
    tips: p.tips || ['Book early for best rates', 'Carry cash for small local vendors', 'Check weather conditions before travel'],
    packing: ['Comfortable walking shoes', 'Power bank & charger', 'Light jacket / weather essentials'],
    bestTime: p.bestTime || 'October to May',
    warnings: []
  };
  if (!e.withinBudget) plan.warnings.push(`This budget is tight. A basic 2-day trip typically starts around ₹${e.minimumBudget.toLocaleString('en-IN')}.`);
  if (notice) plan.notice = notice;
  return plan;
}

/* ---------- shell ---------- */
function renderShell() {
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  const initials = USER ? esc(USER.name.trim().slice(0, 1).toUpperCase()) : '';
  const avatarHtml = USER?.picture_url
    ? `<span class="av" style="overflow:hidden;padding:0;background:transparent"><img src="${esc(USER.picture_url)}" class="nav-avatar-img" alt=""></span>`
    : `<span class="av">${initials}</span>`;
  const authBtn = USER
    ? `<a class="auth-pill" href="#/trips" title="Account & My Trips">${avatarHtml}<span>${esc(USER.name.split(' ')[0])}</span></a>`
    : `<a class="auth-pill" href="#/login"><span>Get Started</span> ${ic('arrow')}</a>`;

  $('#app-header').innerHTML = `
  <nav class="nav">
    <a class="logo" href="#/" aria-label="Chutti.com home"><span class="brand-icon">${ic('mountain')}</span><span><b>chutti<em>.</em></b></span></a>
    <div class="nav-links" id="nav-links">
      <a href="#/" data-nav="home">Explore</a>
      <a href="#/destinations" data-nav="destinations">Destinations</a>
      <a href="#/trips" data-nav="trips">My Trips</a>
      <a href="#/about" data-nav="about">About</a>
      <a href="#/contact" data-nav="contact">Contact</a>
    </div>
    <div class="nav-tools">
      <span class="ai-badge ${HEALTH.ai ? '' : 'off'}" title="${HEALTH.ai ? 'Live CodeFusionAI connected' : 'Offline estimate mode — add API key in .env'}">${ic('sparkle')} ${HEALTH.ai ? 'CodeFusionAI' : 'Estimate'}</span>
      <button class="icon-btn" id="theme-btn" aria-label="Toggle light and dark theme">${ic(theme === 'light' ? 'sun' : 'moon')}</button>
      ${authBtn}
    </div>
  </nav>`;
  $('#app-footer').innerHTML = `
  <div class="foot">
    <a class="logo" href="#/">${logoPlane}<span><b>chutti<em>.com</em></b><small>Travel Smarter, Live Better</small></span></a>
    <div class="links"><a href="#/">Home</a><a href="#/destinations">Destinations</a><a href="#/trips">My Trips</a><a href="#/about">About</a><a href="#/contact">Contact</a></div>

    <div class="script">Your Next Adventure<br>is Just a <em>Click Away!</em></div>
  </div>`;
  $('#theme-btn').onclick = () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    store.set('chutti_theme', next);
    $('#theme-btn').innerHTML = ic(next === 'light' ? 'sun' : 'moon');
  };
}

/* ---------- destination card ---------- */
const dcard = d => `
  <a class="dcard" href="#/destination/${esc(d.slug)}">
    <div class="im"><img src="${img(d.slug)}" alt="${esc(d.name)}" decoding="async"></div>
    <div class="dbody">
      <div class="dtxt"><h4>${esc(d.name)}</h4><p>${esc(d.tagline)}</p></div>
      <span class="darrow" aria-hidden="true">${ic('arrow')}</span>
    </div>
  </a>`;

const DEST_TEMPS = {
  manali: '12°C', shimla: '15°C', mathura: '24°C', ladakh: '7°C', goa: '29°C',
  darjeeling: '14°C', kashmir: '11°C', rishikesh: '22°C', uttarakhand: '17°C', jaipur: '26°C',
  udaipur: '25°C', kerala: '28°C', varanasi: '25°C', agra: '26°C', spiti: '6°C',
  andaman: '29°C', coorg: '20°C', ooty: '16°C', munnar: '17°C', gangtok: '14°C',
  meghalaya: '18°C', jaisalmer: '27°C', jodhpur: '27°C', hampi: '26°C', pondicherry: '29°C',
  amritsar: '22°C', kedarnath: '8°C', nainital: '16°C', mussoorie: '15°C', kodaikanal: '16°C'
};

/* ---------- HOME ---------- */
function home() {
  const saved = store.get('chutti_last', { destination: 'Manali', budget: 15000, when: 'Anytime' });
  const defaultOrigin = USER?.home_city || store.get('chutti_origin', 'Delhi');
  const featuredOrder = ['manali', 'goa', 'jaipur', 'kerala'];
  const popularSix = [
    ...featuredOrder.map(s => DESTS.find(d => d.slug === s)).filter(Boolean),
    ...DESTS.filter(d => !featuredOrder.includes(d.slug))
  ].slice(0, 6);

  const initialDestObj = DESTS.find(d => d.name.toLowerCase() === String(saved.destination || 'Manali').toLowerCase()) || DESTS[0] || {
    name: 'Manali', slug: 'manali', state: 'Himachal Pradesh', tagline: 'Snowy peaks, serene valleys and endless adventures.'
  };
  const initTemp = DEST_TEMPS[initialDestObj.slug] || '18°C';

  $('#view').innerHTML = `
  <section class="hero">
    <div class="hero-bg"></div>
    <div class="wrap hero-inner">
      <span class="travel-label"><i></i> THE INDIA TRAVEL PLANNER</span>
      <h1>Less planning.<br><em>More exploring.</em></h1>
      <p class="hero-sub">Your budget, your pace. Discover India with a day-by-day<br class="wide-only"> itinerary built around you.</p>
      <div class="scene-controls"><a id="scene-link" href="#/destination/ladakh">${ic('pin')} <span>Ladakh, India</span></a><button id="scene-next" aria-label="Show next landscape">${ic('arrow')}</button></div>
    </div>
  <div class="wrap search-pill-wrap">
    <form class="search-pill" id="plan-form" novalidate>
      <div class="sp-seg sp-dest" id="planner">
        <span class="sp-ic">${ic('pin')}</span>
        <div class="sp-body">
          <label for="dest">Destination</label>
          <input id="dest" list="dest-list" autocomplete="off" value="${esc(saved.destination)}" placeholder="e.g. Manali, Ladakh, Europe...">
          <datalist id="dest-list">${DESTS.map(d => `<option value="${esc(d.name)}"></option>`).join('')}</datalist>
        </div>
      </div>
      <div class="sp-div" aria-hidden="true"></div>
      <div class="sp-seg sp-budget">
        <span class="sp-rs">₹</span>
        <div class="sp-body">
          <label for="budget">Your Budget</label>
          <input id="budget" inputmode="numeric" autocomplete="off" value="${esc(saved.budget)}" placeholder="e.g. ₹15,000" aria-label="Budget in rupees">
        </div>
        <span class="sp-chev" aria-hidden="true">${ic('chevron')}</span>
      </div>
      <div class="sp-div" aria-hidden="true"></div>
      <div class="sp-seg sp-when">
        <span class="sp-ic">${ic('cal')}</span>
        <div class="sp-body">
          <label for="when">When?</label>
          <select id="when">
            <option value="Anytime">Anytime</option>
            <option value="Summer (Mar-Jun)">Summer</option>
            <option value="Monsoon (Jul-Sep)">Monsoon</option>
            <option value="Winter (Oct-Feb)">Winter</option>
          </select>
        </div>
        <span class="sp-chev" aria-hidden="true">${ic('chevron')}</span>
      </div>
      <button class="btn btn-red sp-submit" id="go" type="submit">Plan My Trip ${ic('arrow')}</button>
    </form>
    <div class="form-err sp-err" id="form-err" role="alert"></div>

    </div>
  </section>

  <section class="wrap popular">
    <div class="edit-label">THE DESTINATION EDIT</div>
    <div class="sec-head">
      <h2>Find your next escape<span>.</span></h2>
      <a class="view-all-link" href="#/destinations">All destinations ${ic('arrow')}</a>
    </div>
    <div class="escape-grid">${popularSix.slice(0, 4).map(d => `<a class="escape-card" href="#/destination/${esc(d.slug)}"><img src="${img(d.slug)}" alt="" decoding="async"><span class="category-tag">${esc(d.category || 'Explore')}</span><div class="escape-caption"><div><small>${esc(d.state)}</small><h3>${esc(d.name)}</h3></div><span class="round-arrow">${ic('arrow')}</span></div></a>`).join('')}</div>
  </section>

  <section class="wrap showcase-sec">
    <div class="bento-showcase" id="showcase-box">
      <div class="bento-hero">
        <img id="sc-img" src="${img(initialDestObj.slug)}" alt="${esc(initialDestObj.name)}">
        <span class="bento-trend"><span class="trend-dot">${ic('flame')}</span> Trending Destination</span>
        <div class="bento-hero-bottom">
          <div>
            <div class="bento-meta-pills">
              <span class="bm-pill">${ic('pin')} <span id="sc-loc">${esc(initialDestObj.name)}, ${esc(initialDestObj.state || 'India')}</span></span>

            </div>
            <div class="bento-script" id="sc-cap">${esc(initialDestObj.name)}</div>
            <div class="bento-sub-cap">Because you deserve a break!</div>
          </div>
          <button class="bento-play" id="sc-play" type="button" aria-label="Open full AI trip plan">${ic('play')}</button>
        </div>
      </div>

      <div class="bento-mid">
        <div class="bento-card bento-info">
          <h3 id="sc-heading">${esc(initialDestObj.name)}</h3>
          <p class="bento-desc" id="sc-desc">${esc(initialDestObj.blurb ? initialDestObj.blurb.split('.')[0] + '.' : 'Snowy peaks, serene valleys and endless adventures.')}</p>
          <div class="bento-pillars">
            <div>${ic('mountain')}<span>Adventure<br>Sports</span></div>
            <div>${ic('camera')}<span>Scenic<br>Views</span></div>
            <div>${ic('heart')}<span>Peaceful<br>Vibes</span></div>
          </div>
        </div>
        <div class="bento-card bento-includes">
          <h4>Your Trip Plan Includes:</h4>
          <ul class="bento-checklist" id="sc-checklist">
            <li>${ic('check')} <span id="sc-inc-travel">Flights / Trains</span></li>
            <li>${ic('check')} <span>Sightseeing Plan</span></li>
            <li>${ic('check')} <span id="sc-inc-hotel">Budget Hotels</span></li>
            <li>${ic('check')} <span>Daily Budget Breakdown</span></li>
            <li>${ic('check')} <span>Local Food Picks</span></li>
            <li>${ic('check')} <span>Travel Tips</span></li>
          </ul>
        </div>
      </div>

      <div class="bento-card bento-price">
        <div class="bp-top">
          <span class="bp-kicker">Estimated trip cost</span>
          <div class="bp-amt"><b id="sc-tot">₹ 14,800</b><span>/person</span></div>
          <small class="bp-days" id="sc-days">(for 4 Days / 3 Nights)</small>
          <span class="pill ok" id="sc-fit" style="margin-top:10px">Within Budget ${ic('check')}</span>
        </div>
        <button class="btn btn-red bp-cta" id="sc-open" type="button">View Full Plan ${ic('arrow')}</button>
        <div class="bp-trust">
          <div class="bp-avs" aria-hidden="true">
            <span style="background:linear-gradient(135deg,#f59e0b,#ef4444)">A</span>
            <span style="background:linear-gradient(135deg,#3b82f6,#6366f1)">R</span>
            <span style="background:linear-gradient(135deg,#10b981,#0d9488)">P</span>
          </div>
          <span>Planning estimate, not a live quote</span>
        </div>
      </div>
    </div>
  </section>

  <section class="wrap more-dest">
    <div class="more-box">
      <div class="more-top">
        <div><h3>Explore More Destinations</h3><p>Discover amazing places across India and beyond — all with smart planning and budget control.</p></div>
        <a class="btn-outline" href="#/destinations">Browse All Places ${ic('arrow')}</a>
      </div>
      <div class="more-chips">
        ${MORE_DESTS.map(name => {
          const sl = slugFor(name);
          return `<button class="more-chip" type="button" data-quick="${esc(name)}" data-slug="${esc(sl)}"><img class="chip-thumb" src="${img(sl)}" alt="" loading="lazy"><span>${esc(name)}</span></button>`;
        }).join('')}
      </div>
    </div>
  </section>`;

  const budget = $('#budget'), dest = $('#dest'), when = $('#when'), err = $('#form-err');
  when.value = saved.when || 'Anytime';
  const readBudget = () => {
    const amount = budget.value.trim().replace(/^₹\s*/, '').replaceAll(',', '');
    return /^\d+$/.test(amount) ? Number(amount) : 0;
  };
  budget.addEventListener('input', () => refresh());
  budget.addEventListener('blur', () => { const v = readBudget(); if (v) budget.value = v; });
  dest.addEventListener('input', () => refresh());

  const refresh = debounce(async () => {
    const d = dest.value.trim(), b = readBudget();
    if (!d || b < 1000) return;
    try {
      let e = null;
      try {
        e = await api(`/api/estimate?destination=${encodeURIComponent(d)}&budget=${b}`);
      } catch {
        e = clientEstimate({ destination: d, budget: b });
      }
      if (!$('#sc-heading') || !e) return;
      const meta = DESTS.find(item => item.slug === e.slug) || {};
      $('#sc-img').src = img(e.slug || 'generic');
      $('#sc-cap').textContent = e.destination;
      $('#sc-heading').textContent = e.destination;
      $('#sc-loc').textContent = meta.state ? `${e.destination}, ${meta.state}` : e.destination;

      $('#sc-desc').textContent = meta.blurb ? meta.blurb.split('.')[0] + '.' : `${meta.tagline || 'Handpicked stays, local food and curated day-by-day plans.'}`;
      $('#sc-tot').textContent = inr(e.total).replace('₹', '₹ ');
      $('#sc-days').textContent = `(for ${e.days} Days / ${e.nights} ${e.nights === 1 ? 'Night' : 'Nights'})`;
      $('#sc-fit').className = 'pill ' + (e.withinBudget ? 'ok' : 'bad');
      $('#sc-fit').innerHTML = e.withinBudget ? `Within Budget ${ic('check')}` : `Try ${inr(e.minimumBudget)}+`;
      if ($('#sc-inc-travel')) $('#sc-inc-travel').textContent = `${e.mainTransport || 'Flights / Trains'} (${inr(e.breakdown.travel)})`;
      if ($('#sc-inc-hotel')) $('#sc-inc-hotel').textContent = `Hotels (${inr(e.breakdown.hotel)})`;
    } catch { /* preview is optional */ }
  }, 300);

  refresh();

  const go = () => {
    const d = dest.value.trim(), b = readBudget(), from = defaultOrigin || 'Delhi', w = when.value;
    err.textContent = '';
    if (!d) { err.textContent = 'Please enter a destination.'; dest.focus(); return; }
    if (b < 1000) { err.textContent = 'Budget must be at least ₹1,000.'; budget.focus(); return; }
    if (b > 10000000) { err.textContent = 'Enter a budget of ₹1 crore or less.'; budget.focus(); return; }
    store.set('chutti_last', { destination: d, budget: b, when: w });
    navigate(planHash({ destination: d, budget: b, origin: from, when: w }));
  };
  $('#plan-form').addEventListener('submit', e => { e.preventDefault(); go(); });
  $('#sc-open').addEventListener('click', go);
  $('#sc-play').addEventListener('click', go);
  const scenes = ['ladakh', 'munnar', 'kashmir'];
  let sceneIndex = 0;
  $('#scene-next').onclick = () => {
    sceneIndex = (sceneIndex + 1) % scenes.length;
    const slug = scenes[sceneIndex];
    $('.hero-bg').style.backgroundImage = `url('${img(slug)}')`;
    $('#scene-link').href = `#/destination/${slug}`;
    $('#scene-link span').textContent = `${bySlug(slug)?.name || slug}, India`;
  };
  $$('[data-quick]').forEach(btn => btn.addEventListener('click', () => {
    const qName = btn.dataset.quick;
    const qSlug = btn.dataset.slug || slugFor(qName);
    const meta = bySlug(qSlug);
    dest.value = qName;
    if ($('#sc-img') && qSlug !== 'generic') $('#sc-img').src = img(qSlug);
    if ($('#sc-cap')) $('#sc-cap').textContent = qName;
    if ($('#sc-heading')) $('#sc-heading').textContent = qName;
    if ($('#sc-loc') && meta) $('#sc-loc').textContent = `${meta.name}, ${meta.state}`;
    if ($('#sc-temp')) $('#sc-temp').textContent = DEST_TEMPS[qSlug] || '20°C';
    if ($('#sc-desc') && meta?.blurb) $('#sc-desc').textContent = meta.blurb.split('.')[0] + '.';
    refresh();
    $('#showcase-box').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
}

function openDemoModal(origin) {
  const root = $('#modal-root');
  root.innerHTML = `
  <div class="modal-backdrop" id="demo-bg">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="demo-title">
      <div class="modal-head">
        <h3 id="demo-title" style="display:flex;align-items:center;gap:8px">${ic('sparkle')} How Chutti.com Works</h3>
        <button class="icon-btn" id="demo-close" aria-label="Close">✕</button>
      </div>
      <p style="font-size:13.5px;color:var(--muted);margin-bottom:16px">Give us any destination and your total budget — <b>CodeFusionAI</b> builds a complete, realistic journey in seconds:</p>
      <div style="display:grid;gap:10px;margin-bottom:18px;font-size:13.5px">
        <div style="display:flex;gap:10px;align-items:flex-start"><span class="pill ok">1</span><div><b>Smart Budget Split</b><br><span style="color:var(--muted);font-size:12.5px">Balances flights/trains, stays, local eats &amp; activities inside your exact INR budget.</span></div></div>
        <div style="display:flex;gap:10px;align-items:flex-start"><span class="pill ok">2</span><div><b>Day-by-Day Itinerary &amp; Maps</b><br><span style="color:var(--muted);font-size:12.5px">Includes morning-to-evening plans, direct booking links, and Google Maps pins.</span></div></div>
        <div style="display:flex;gap:10px;align-items:flex-start"><span class="pill ok">3</span><div><b>Modify, Save &amp; Book</b><br><span style="color:var(--muted);font-size:12.5px">Ask CodeFusionAI to tweak any plan in plain English, save it, or confirm your booking.</span></div></div>
      </div>
      <p style="font-size:12.5px;font-weight:600;margin-bottom:10px">Try an instant live AI demo:</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        <a class="btn btn-red" style="padding:10px 12px;font-size:12.5px" href="${esc(planHash({ destination: 'Manali', budget: 15000, origin }))}" data-demo-go>Manali ₹15k</a>
        <a class="btn btn-dark" style="padding:10px 12px;font-size:12.5px" href="${esc(planHash({ destination: 'Goa', budget: 18000, origin }))}" data-demo-go>Goa ₹18k</a>
        <a class="btn btn-dark" style="padding:10px 12px;font-size:12.5px" href="${esc(planHash({ destination: 'Udaipur', budget: 12000, origin }))}" data-demo-go>Udaipur ₹12k</a>
      </div>
    </div>
  </div>`;
  const close = () => { root.innerHTML = ''; };
  $('#demo-close').onclick = close;
  $('#demo-bg').onclick = e => { if (e.target.id === 'demo-bg') close(); };
  $$('[data-demo-go]', root).forEach(a => a.addEventListener('click', close));
}

/* ---------- PLAN ---------- */
const LOAD_MSGS = ['Asking CodeFusionAI to craft your itinerary…', 'Checking buses, trains & flights…', 'Finding stays inside your budget…', 'Picking authentic local food…', 'Finalizing day-by-day schedule…'];

async function plan(qs) {
  const p = {
    destination: (qs.get('d') || '').trim(),
    budget: parseInt(qs.get('b'), 10) || 0,
    days: qs.get('days') || '',
    travelers: qs.get('t') || '1',
    origin: qs.get('from') || USER?.home_city || store.get('chutti_origin', 'Delhi'),
    style: qs.get('style') || 'auto',
    when: qs.get('when') || 'Anytime'
  };
  if (!p.destination || p.budget < 1000) { navigate('#/'); return; }
  const token = ++planToken;

  $('#view').innerHTML = `<div class="loader"><div><div class="spin"></div><h2>Planning your ${esc(p.destination)} trip</h2><p id="lm">${LOAD_MSGS[0]}</p></div></div>`;
  let i = 0;
  const timer = setInterval(() => { const el = $('#lm'); if (el) el.textContent = LOAD_MSGS[++i % LOAD_MSGS.length]; }, 2200);

  try {
    const key = 'chutti_plan_v2_' + JSON.stringify(p);
    let data = null;
    try { const c = sessionStorage.getItem(key); if (c) data = JSON.parse(c); } catch { /* ignore */ }
    if (!data) {
      try {
        data = await post('/api/plan', p);
        if (data.plan && data.plan.source === 'gemini') { try { sessionStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ } }
      } catch (apiErr) {
        console.warn('API plan request returned an error, falling back to smart budget estimator:', apiErr);
        const smartPlan = clientBuildPlan(p, 'CodeFusionAI Smart Budget Plan');
        data = { plan: smartPlan };
      }
    }
    if (token !== planToken) return;
    currentPlan = data.plan;
    renderPlan(data.plan, p);
  } catch (e) {
    if (token !== planToken) return;
    try {
      const fallbackPlan = clientBuildPlan(p);
      currentPlan = fallbackPlan;
      renderPlan(fallbackPlan, p);
    } catch {
      $('#view').innerHTML = `<div class="wrap page"><div class="banner err">${ic('warn')}<div><b>Could not plan this trip.</b><br>${esc(e.message)}<br><br><a class="btn btn-red" href="${esc(planHash(p))}" onclick="location.reload()">Try again</a> <a class="btn btn-outline" href="#/">Back</a></div></div></div>`;
    }
  } finally { clearInterval(timer); }
}

function renderPlan(pl, p) {
  currentPlan = pl;
  const used = pl.total, pct = Math.min(100, Math.round(used / pl.budget * 100));
  const maxAmt = Math.max(...pl.breakdown.map(b => b.amount), 1);
  const rowIcon = { hotel: 'bed', food: 'food', travel: 'bus', activities: 'camera' };
  document.title = `${pl.title} · Chutti.com`;

  const planSlug = slugFor(pl.destination, pl.slug);
  $('#view').innerHTML = `
  <div class="wrap page">
    <a class="crumb noprint" href="#/">${ic('arrow')} Back to home</a>
    <div class="dhero" style="height:240px;margin-bottom:20px">
      <img src="${img(planSlug)}" alt="${esc(pl.destination)}">
      <div class="t"><h1>${esc(pl.title)}</h1><p>${esc(pl.summary || pl.tagline)}</p></div>
    </div>
    <div class="chips">
      <span class="chip">${ic('pin')} ${pl.days} Days / ${pl.nights} Nights</span>
      <span class="chip">${ic('user')} ${pl.travelers} ${pl.travelers > 1 ? 'travellers' : 'traveller'}</span>
      <span class="chip">${ic('cal')} ${esc(pl.when || 'Anytime')}</span>
      <span class="chip">₹ Budget ${inr(pl.budget)}</span>
      <span class="chip ${pl.withinBudget ? 'ok' : 'bad'}">${pl.withinBudget ? `Within Budget ${ic('check')}` : 'Over budget'}</span>
      ${pl.source === 'gemini' ? `<span class="chip ok">${ic('sparkle')} CodeFusionAI</span>` : `<span class="chip">Basic estimate</span>`}
    </div>
    ${pl.notice ? `<div class="banner warn noprint">${ic('warn')}<div>${esc(pl.notice)}</div></div>` : ''}
    ${(pl.warnings || []).map(w => `<div class="banner warn">${ic('warn')}<div>${esc(w)}</div></div>`).join('')}

    <div class="custom noprint" id="custom">
      <div><label>From city</label><div class="field"><input id="c-from" value="${esc(pl.origin)}" maxlength="40"></div></div>
      <div><label>Days (auto)</label><div class="field"><input id="c-days" type="number" min="1" max="14" value="${p.days ? esc(p.days) : ''}" placeholder="Auto"></div></div>
      <div><label>Travellers</label><div class="field"><input id="c-trav" type="number" min="1" max="10" value="${esc(pl.travelers)}"></div></div>
      <div><label>Budget (₹)</label><div class="field"><input id="c-budget" inputmode="numeric" value="${esc(pl.budget)}"></div></div>
      <div><label>Stay type</label><div class="field"><select id="c-style"><option value="auto">Auto</option><option value="budget">Budget</option><option value="comfort">Comfort</option></select></div></div>
      <button class="btn btn-red" id="c-go">Update plan</button>
    </div>

    <div class="two">
      <div class="stack">
        <div class="card"><h3>${ic('pin')} Day-by-day plan</h3>
          <div class="timeline">${pl.itinerary.map(d => `
            <div class="day"><h4><span>Day ${d.day}</span>${esc(d.title)}</h4>
              ${d.items.map(x => `<div class="item"><div class="when">${esc(x.time)}</div><div class="grow"><b>${esc(x.title)}</b><a class="map noprint" target="_blank" rel="noopener" href="${mapLink(x.title + ' ' + pl.destination)}">Map</a><p>${esc(x.detail)}</p></div>${x.cost ? `<div class="c">${inr(x.cost)}</div>` : ''}</div>`).join('')}
            </div>`).join('')}</div>
        </div>

        <div class="card"><h3>${ic('plane')} Getting there from ${esc(pl.origin)}</h3>
          ${pl.transport.length ? pl.transport.map(t => `
            <div class="opt">${ic(modeIcon(t.mode))}<div class="grow"><b>${esc(t.title)}</b>${t.recommended ? '<span class="tag-rec">Best pick</span>' : ''}<small>${esc(t.duration)}${t.cost ? ` • ${inr(t.cost)} per person` : ''}${t.note ? ` • ${esc(t.note)}` : ''}</small></div>
              <a class="noprint" target="_blank" rel="noopener" href="${transportLink(t, pl)}">Check live prices</a></div>`).join('') : '<p class="empty">No transport details.</p>'}
          <small style="color:var(--muted);display:block;margin-top:10px">Fares change daily. These are estimates, so check the live price before you book.</small>
        </div>

        <div class="card"><h3>${ic('bed')} Where to stay</h3>
          ${pl.hotels.length ? pl.hotels.map(h => `<div class="opt">${ic('bed')}<div class="grow"><b>${esc(h.name)}</b><small>${esc([h.area, h.type].filter(Boolean).join(' • '))}${h.note ? ` • ${esc(h.note)}` : ''}</small></div><div><b>${inr(h.pricePerNight)}</b><small>per night</small></div><a class="noprint" target="_blank" rel="noopener" href="${mapLink(h.name + ' ' + pl.destination)}">Map</a></div>`).join('') : '<p class="empty">No hotel suggestions.</p>'}
          <a class="noprint" style="color:var(--red);font-size:13px;display:inline-block;margin-top:10px" target="_blank" rel="noopener" href="https://www.google.com/travel/hotels/${encodeURIComponent(pl.destination)}">Search live hotel prices →</a>
        </div>

        <div class="card noprint"><h3>${ic('sparkle')} Modify this plan with CodeFusionAI</h3>
          <form class="ask" id="mod-form">
            <div class="field"><input id="mod-input" maxlength="300" placeholder="e.g. Add river rafting, or use a cheaper hostel stay"></div>
            <button class="btn btn-red" id="mod-btn" type="submit">Modify Plan</button>
          </form>
          <div class="form-err" id="mod-err"></div>
        </div>
      </div>

      <div class="stack">
        <div class="card"><h3>₹ Budget breakdown</h3>
          ${pl.breakdown.map(b => `<div class="brow"><div class="l">${ic(rowIcon[b.key] || 'pin')}<span>${esc(b.label)}</span><b>${inr(b.amount)}</b></div><div class="bar"><i style="width:${Math.round(b.amount / maxAmt * 100)}%"></i></div>${b.note ? `<small>${esc(b.note)}</small>` : ''}</div>`).join('')}
          <div class="bigtotal"><span>Total</span><b>${inr(used)}</b></div>
          <div class="chips" style="margin-top:12px"><span class="chip ${pl.withinBudget ? 'ok' : 'bad'}">${pl.withinBudget ? `${inr(pl.leftover)} left of ${inr(pl.budget)} (${pct}% used)` : `${inr(used - pl.budget)} over budget`}</span></div>
          <div class="btnrow noprint">
            <button class="btn btn-red" id="book-btn">${ic('plane')} Book This Trip</button>
            <button class="btn btn-dark" id="save">${ic('save')} Save to My Trips</button>
            <button class="btn btn-ghost" id="share">${ic('share')} Copy share link</button>
            <button class="btn btn-ghost" id="print">${ic('print')} Print / Save as PDF</button>
          </div>
        </div>
        ${pl.food.length ? `<div class="card"><h3>${ic('food')} What to eat</h3>${pl.food.map(f => `<div class="opt"><div class="grow"><b>${esc(f.name)}</b><small>${esc(f.what)}</small></div>${f.cost ? `<b>${inr(f.cost)}</b>` : ''}</div>`).join('')}</div>` : ''}
        ${pl.tips.length || pl.bestTime ? `<div class="card"><h3>${ic('sparkle')} Good to know</h3>${pl.bestTime ? `<p style="font-size:14px;margin-bottom:10px"><b>Best time:</b> ${esc(pl.bestTime)}</p>` : ''}<ul class="clean">${pl.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
        ${pl.packing.length ? `<div class="card"><h3>${ic('mountain')} Pack this</h3><ul class="clean">${pl.packing.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>` : ''}
      </div>
    </div>
  </div>`;

  $('#c-style').value = p.style || 'auto';
  $('#c-go').onclick = () => {
    const np = {
      destination: p.destination,
      budget: parseInt(String($('#c-budget').value).replace(/[^0-9]/g, ''), 10) || p.budget,
      days: $('#c-days').value,
      travelers: $('#c-trav').value || 1,
      origin: $('#c-from').value.trim() || 'Delhi',
      style: $('#c-style').value,
      when: p.when || 'Anytime'
    };
    store.set('chutti_origin', np.origin);
    navigate(planHash(np));
  };

  $('#mod-form').addEventListener('submit', async e => {
    e.preventDefault();
    const instr = $('#mod-input').value.trim();
    const errEl = $('#mod-err');
    errEl.textContent = '';
    if (instr.length < 3) { errEl.textContent = 'Tell CodeFusionAI what to change.'; return; }
    const btn = $('#mod-btn');
    btn.disabled = true; btn.textContent = 'Updating…';
    try {
      const res = await post('/api/plan/modify', { plan: pl, instruction: instr });
      toast('Plan updated by CodeFusionAI');
      renderPlan(res.plan, p);
    } catch (err) {
      errEl.textContent = err.message;
      btn.disabled = false; btn.textContent = 'Modify Plan';
    }
  });

  $('#save').onclick = async () => {
    if (USER) {
      try {
        await post('/api/trips', { plan: pl, when: p.when || 'Anytime' });
        toast('Saved to your account!');
        return;
      } catch (err) { toast(err.message); return; }
    }
    const trips = store.get('chutti_trips', []).filter(t => t.id !== location.hash);
    trips.unshift({ id: location.hash, savedAt: Date.now(), plan: { title: pl.title, destination: pl.destination, slug: pl.slug, days: pl.days, total: pl.total, budget: pl.budget, withinBudget: pl.withinBudget } });
    store.set('chutti_trips', trips.slice(0, 30));
    toast('Saved locally (Log in to sync across devices)');
  };

  $('#book-btn').onclick = () => {
    if (!USER) {
      toast('Please log in to book this trip');
      navigate('#/login?next=' + encodeURIComponent(location.hash));
      return;
    }
    openBookingModal(pl);
  };

  $('#share').onclick = async () => {
    try { await navigator.clipboard.writeText(location.href); toast('Link copied'); } catch { toast('Copy the link from the address bar'); }
  };
  $('#print').onclick = () => window.print();
}

function openBookingModal(pl) {
  const root = $('#modal-root');
  const today = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  root.innerHTML = `
  <div class="modal-backdrop" id="bm-bg">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head"><h3>Book ${esc(pl.title)}</h3><button class="icon-btn" id="bm-close" aria-label="Close">✕</button></div>
      <p style="font-size:13px;color:var(--muted);margin-bottom:16px">${pl.days} Days / ${pl.nights} Nights • ${pl.travelers} Traveller(s) • Estimated Total: <b>${inr(pl.total)}</b></p>
      <form class="auth-form" id="bm-form">
        <div><label>Preferred Travel Date</label><div class="field"><input name="travelDate" type="date" value="${today}" required></div></div>
        <div><label>Contact Phone (optional)</label><div class="field"><input name="contactPhone" placeholder="+91 98765 43210" maxlength="20"></div></div>
        <div><label>Special Requests (optional)</label><div class="field"><input name="notes" placeholder="Window seat, veg meals, early check-in..." maxlength="300"></div></div>
        <div class="form-err" id="bm-err"></div>
        <button class="btn btn-red" type="submit" id="bm-sub">Confirm Trip Booking</button>
      </form>
    </div>
  </div>`;
  const close = () => { root.innerHTML = ''; };
  $('#bm-close').onclick = close;
  $('#bm-bg').onclick = e => { if (e.target.id === 'bm-bg') close(); };
  $('#bm-form').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    const btn = $('#bm-sub'); btn.disabled = true; btn.textContent = 'Booking…';
    try {
      const res = await post('/api/bookings', { plan: pl, travelDate: fd.travelDate, contactPhone: fd.contactPhone, notes: fd.notes });
      close();
      toast(`Booking confirmed! Ref: ${res.booking.booking_ref}`);
      navigate('#/trips');
    } catch (err) {
      $('#bm-err').textContent = err.message;
      btn.disabled = false; btn.textContent = 'Confirm Trip Booking';
    }
  });
}

function transportLink(t, pl) {
  const from = encodeURIComponent(pl.origin), to = encodeURIComponent(pl.destination);
  if (t.mode === 'flight') return `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${pl.origin} to ${pl.destination}`)}`;
  if (t.mode === 'train') return 'https://www.irctc.co.in/nget/train-search';
  if (t.mode === 'bus') return `https://www.redbus.in/bus-tickets/${from.toLowerCase()}-to-${to.toLowerCase()}`;
  return `https://www.google.com/maps/dir/${from}/${to}`;
}

/* ---------- DESTINATIONS ---------- */
function destinations() {
  const categories = ['All', ...new Set(DESTS.map(d => d.category).filter(Boolean))];
  let activeCat = 'All';

  $('#view').innerHTML = `
  <div class="wrap page">
    <div class="eyebrow"><span>EXPLORE ${DESTS.length} DESTINATIONS</span><i></i></div>
    <h1>Popular Destinations</h1>
    <p class="lead">Explore ${DESTS.length} curated destinations across India — mountains, beaches, heritage cities, backwaters and sacred retreats. Click any place for sights, food and AI trip planning.</p>
    <div class="dest-controls">
      <div class="field search" style="margin:0">${ic('search')}<input id="q" placeholder="Search city, state, or vibe (e.g. Rajasthan, beach, tea)..." aria-label="Search destinations"></div>
      <div class="cat-pills" id="cat-pills">
        ${categories.map(c => `<button type="button" class="cat-pill ${c === 'All' ? 'active' : ''}" data-cat="${esc(c)}">${esc(c)}${c === 'All' ? ` (${DESTS.length})` : ''}</button>`).join('')}
      </div>
    </div>
    <div class="grid" id="dgrid">${DESTS.map(dcard).join('')}</div>
    <p class="lead" style="margin-top:28px">Going somewhere else? Type any place in the <a href="#/" style="color:var(--accent);font-weight:600">trip planner</a>. CodeFusionAI can plan it too.</p>
  </div>`;

  const applyFilter = () => {
    const q = ($('#q')?.value || '').trim().toLowerCase();
    const list = DESTS.filter(d => {
      const catOk = activeCat === 'All' || d.category === activeCat;
      const qOk = !q || d.name.toLowerCase().includes(q) || d.tagline.toLowerCase().includes(q) || d.state.toLowerCase().includes(q) || (d.category || '').toLowerCase().includes(q);
      return catOk && qOk;
    });
    $('#dgrid').innerHTML = list.length ? list.map(dcard).join('') : '<p class="empty" style="grid-column:1/-1">No match. Try the planner for any place.</p>';
  };

  $('#q').addEventListener('input', applyFilter);
  $$('#cat-pills .cat-pill').forEach(btn => btn.addEventListener('click', () => {
    activeCat = btn.dataset.cat;
    $$('#cat-pills .cat-pill').forEach(b => b.classList.toggle('active', b === btn));
    applyFilter();
  }));
}

function destination(slug) {
  const d = bySlug(slug);
  if (!d) { navigate('#/destinations'); return; }
  document.title = `${d.name} · Chutti.com`;
  let prevInteractionId = null;

  $('#view').innerHTML = `
  <div class="wrap page">
    <a class="crumb" href="#/destinations">${ic('arrow')} All destinations</a>
    <div class="dhero"><img src="${img(d.slug)}" alt="${esc(d.name)}"><div class="t"><h1>${esc(d.name)}</h1><p>${esc(d.state)} • ${esc(d.tagline)}</p></div></div>
    <div class="chips">
      <span class="chip">${ic('sparkle')} Best time: ${esc(d.bestTime)}</span>
      <span class="chip">${ic('pin')} Ideal: ${d.ideal} days</span>
      <span class="chip">₹ About ${inr(d.dailyCost)} / day</span>
      <span class="chip">${ic('bus')} ${esc(d.reachMode)} • ${esc(d.reachDuration)} from Delhi</span>
    </div>
    <div class="two">
      <div class="stack">
        <div class="card"><h3>${ic('pin')} About</h3><p style="font-size:14.5px">${esc(d.blurb)}</p></div>
        <div class="card"><h3>${ic('mountain')} Top places to visit</h3>
          <div class="places">${d.places.map(pl => `<div class="place"><b>${ic('pin')}${esc(pl.name)}</b><p>${esc(pl.desc)}</p><a target="_blank" rel="noopener" href="${mapLink(pl.name + ' ' + d.name)}">Open in Maps →</a></div>`).join('')}</div>
        </div>
        <div class="card"><h3>${ic('sparkle')} Ask Chutti CodeFusionAI about ${esc(d.name)}</h3>
          <form class="ask" id="ask-form"><div class="field"><input id="ask-q" maxlength="300" placeholder="e.g. Is it safe for solo travellers? Best cafes?" aria-label="Your question"></div><button class="btn btn-red" id="ask-btn" type="submit">Ask AI</button></form>
          <div id="ask-out"></div>
        </div>
      </div>
      <div class="stack">
        <div class="card"><h3>${ic('sparkle')} Plan this trip</h3>
          <form class="form" id="dplan"><label for="d-b">Your budget</label>
            <div class="field"><span class="rs">₹</span><input id="d-b" inputmode="numeric" value="${Math.ceil((d.dailyCost * d.ideal + 2 * d.reach) / 1000) * 1000}"></div>
            <button class="btn btn-red" type="submit">Plan My Trip ${ic('sparkle')}</button><div class="form-err" id="d-err"></div></form>
        </div>
        <div class="card"><h3>${ic('food')} Must-try food</h3><ul class="clean">${d.foods.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
        <div class="card"><h3>${ic('warn')} Tips</h3><ul class="clean">${d.tips.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
      </div>
    </div>
  </div>`;
  $('#dplan').addEventListener('submit', e => {
    e.preventDefault();
    const b = parseInt(String($('#d-b').value).replace(/[^0-9]/g, ''), 10) || 0;
    if (b < 1000) { $('#d-err').textContent = 'Budget must be at least ₹1,000.'; return; }
    navigate(planHash({ destination: d.name, budget: b, origin: USER?.home_city || store.get('chutti_origin', 'Delhi') }));
  });
  $('#ask-form').addEventListener('submit', async e => {
    e.preventDefault();
    const q = $('#ask-q').value.trim(); if (!q) return;
    const out = $('#ask-out'), btn = $('#ask-btn');
    btn.disabled = true; out.innerHTML = '<div class="answer">Thinking with CodeFusionAI…</div>';
    try {
      const r = await post('/api/ask', { destination: d.name, question: q, previousInteractionId: prevInteractionId });
      prevInteractionId = r.interactionId || prevInteractionId;
      out.innerHTML = `<div class="answer">${esc(r.answer)}</div>`;
    } catch (err) {
      out.innerHTML = `<div class="banner err">${ic('warn')}<div>${esc(err.message)}</div></div>`;
    } finally { btn.disabled = false; }
  });
}

/* ---------- GOOGLE ACCOUNT CHOOSER DIALOG ---------- */
function showGoogleAccountChooser(onSuccess) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="g-chooser-title">
      <div class="modal-head">
        <div style="display:flex;align-items:center;gap:10px">
          ${googleIconSvg}
          <h3 id="g-chooser-title" style="font-size:18px">Sign in with Google</h3>
        </div>
        <button class="icon-btn" id="g-close-btn" aria-label="Close dialog">&times;</button>
      </div>
      <p style="font-size:13px;color:var(--muted);margin-bottom:14px">Choose a Google account to continue to <b>Chutti.com</b></p>
      <div class="g-account-list">
        <button type="button" class="g-account-item" data-email="anmolmishra.traveler@gmail.com" data-name="Anmol Mishra" data-pic="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80">
          <div class="g-account-av"><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Anmol"></div>
          <div class="g-account-info">
            <b>Anmol Mishra</b>
            <small>anmolmishra.traveler@gmail.com</small>
          </div>
        </button>
        <button type="button" class="g-account-item" data-email="deepak.travels@gmail.com" data-name="Deepak Sharma" data-pic="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80">
          <div class="g-account-av"><img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Deepak"></div>
          <div class="g-account-info">
            <b>Deepak Sharma</b>
            <small>deepak.travels@gmail.com</small>
          </div>
        </button>
      </div>
      <div class="auth-divider" style="margin:16px 0 14px"><span>or enter your google account</span></div>
      <form id="g-custom-form" style="display:grid;gap:10px">
        <div class="field" style="height:44px"><input id="g-custom-name" placeholder="Full name (e.g. Anmol Mishra)" required maxlength="80"></div>
        <div class="field" style="height:44px"><input id="g-custom-email" type="email" placeholder="Google email (e.g. you@gmail.com)" required maxlength="120"></div>
        <div class="form-err" id="g-err" style="min-height:16px"></div>
        <button type="submit" class="btn btn-google" id="g-custom-submit" style="height:44px;font-size:13.5px">
          ${googleIconSvg} Continue with this account
        </button>
      </form>
    </div>`;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#g-close-btn').onclick = close;
  modal.onclick = e => { if (e.target === modal) close(); };

  const submitAccount = async (payload) => {
    const errBox = modal.querySelector('#g-err');
    errBox.textContent = '';
    const submitBtn = modal.querySelector('#g-custom-submit');
    if (submitBtn) submitBtn.disabled = true;
    try {
      const res = await post('/api/auth/google', payload);
      close();
      await onSuccess(res);
    } catch (ex) {
      errBox.textContent = ex.message;
      if (submitBtn) submitBtn.disabled = false;
    }
  };

  modal.querySelectorAll('.g-account-item').forEach(btn => {
    btn.onclick = () => {
      submitAccount({
        email: btn.dataset.email,
        name: btn.dataset.name,
        picture: btn.dataset.pic,
        homeCity: 'Delhi'
      });
    };
  });

  modal.querySelector('#g-custom-form').onsubmit = (e) => {
    e.preventDefault();
    const name = modal.querySelector('#g-custom-name').value.trim();
    const email = modal.querySelector('#g-custom-email').value.trim();
    if (!name || !email) return;
    submitAccount({
      email,
      name,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff&size=128`,
      homeCity: 'Delhi'
    });
  };
}

/* ---------- LOGIN / SIGNUP PAGE ---------- */
function authPage(initialMode = 'login', qs = new URLSearchParams()) {
  if (USER) { navigate('#/trips'); return; }
  const nextHash = qs.get('next') || '#/trips';
  let mode = initialMode;

  $('#view').innerHTML = `
  <div class="wrap page">
    <div class="auth-wrap">
      <div class="auth-hero">
        <img src="/img/hero.jpg" alt="Mountain travel">
        <div class="inner">
          <span class="ai-badge">${ic('sparkle')} CodeFusionAI Powered</span>
          <h2>Your Dream Trips, Synced Everywhere.</h2>
          <p>Create your free Chutti account to save AI-generated itineraries, manage bookings, and keep your travel preferences ready across devices.</p>
        </div>
      </div>
      <div class="auth-card">
        <div class="tabs">
          <button class="tab-btn ${mode === 'login' ? 'active' : ''}" id="tab-login" type="button">Login</button>
          <button class="tab-btn ${mode === 'signup' ? 'active' : ''}" id="tab-signup" type="button">Sign Up</button>
        </div>
        <h2 id="auth-title" style="font-size:24px;margin-bottom:4px">${mode === 'login' ? 'Welcome back!' : 'Create your account'}</h2>
        <p id="auth-sub" style="font-size:13.5px;color:var(--muted);margin-bottom:18px">${mode === 'login' ? 'Log in to access your saved trips and bookings.' : 'Start planning smart budget trips with CodeFusionAI.'}</p>
        
        <button type="button" class="btn btn-google" id="btn-google">
          ${googleIconSvg}
          <span>Continue with Google</span>
        </button>
        <div id="g-signin-anchor" style="display:none;margin-top:10px"></div>
        <div class="auth-divider"><span>or with email &amp; password</span></div>

        <form class="auth-form" id="auth-form">
          <div id="signup-fields" style="display:${mode === 'signup' ? 'grid' : 'none'};gap:14px">
            <div><label for="a-name">Full Name</label><div class="field">${ic('user')}<input id="a-name" name="name" placeholder="Anmol Mishra" maxlength="80"></div></div>
            <div><label for="a-city">Home / Departure City</label><div class="field">${ic('pin')}<input id="a-city" name="homeCity" value="Delhi" placeholder="Delhi, Mumbai, Bengaluru..." maxlength="40"></div></div>
          </div>
          <div><label for="a-email">Email Address</label><div class="field"><input id="a-email" name="email" type="email" placeholder="you@example.com" required></div></div>
          <div><label for="a-pwd">Password</label><div class="field">${ic('lock')}<input id="a-pwd" name="password" type="password" placeholder="Minimum 6 characters" minlength="6" required><button class="pwd-toggle" id="pwd-eye" type="button">Show</button></div></div>
          <div class="form-err" id="auth-err" role="alert"></div>
          <button class="btn btn-red" id="auth-submit" type="submit">${mode === 'login' ? 'Login to Chutti' : 'Create Free Account'}</button>
        </form>
      </div>
    </div>
  </div>`;

  const handleAuthSuccess = async (res) => {
    USER = res.user;
    store.set('chutti_token', res.token);
    store.set('chutti_origin', USER.home_city || 'Delhi');
    renderShell();
    toast(`Welcome, ${USER.name.split(' ')[0]}!`);
    navigate(nextHash.startsWith('#/') ? nextHash : '#/trips');
  };

  const setMode = m => {
    mode = m;
    $('#tab-login').classList.toggle('active', m === 'login');
    $('#tab-signup').classList.toggle('active', m === 'signup');
    $('#signup-fields').style.display = m === 'signup' ? 'grid' : 'none';
    $('#auth-title').textContent = m === 'login' ? 'Welcome back!' : 'Create your account';
    $('#auth-sub').textContent = m === 'login' ? 'Log in to access your saved trips and bookings.' : 'Start planning smart budget trips with CodeFusionAI.';
    $('#auth-submit').textContent = m === 'login' ? 'Login to Chutti' : 'Create Free Account';
    $('#auth-err').textContent = '';
  };
  $('#tab-login').onclick = () => setMode('login');
  $('#tab-signup').onclick = () => setMode('signup');
  $('#pwd-eye').onclick = () => {
    const inp = $('#a-pwd');
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    $('#pwd-eye').textContent = show ? 'Hide' : 'Show';
  };

  // Google Sign-In button click
  $('#btn-google').onclick = () => {
    if (window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            showGoogleAccountChooser(handleAuthSuccess);
          }
        });
        return;
      } catch (e) {
        // Fallback to chooser
      }
    }
    showGoogleAccountChooser(handleAuthSuccess);
  };

  // If Google GIS client is loaded & configured, initialize ID token listener
  if (window.google?.accounts?.id && GOOGLE_CLIENT_ID) {
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (gisRes) => {
          try {
            const res = await post('/api/auth/google', { credential: gisRes.credential });
            await handleAuthSuccess(res);
          } catch (err) {
            $('#auth-err').textContent = err.message || 'Google sign-in failed.';
          }
        }
      });
    } catch {}
  }

  $('#auth-form').addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('#auth-err'), btn = $('#auth-submit');
    err.textContent = '';
    const email = $('#a-email').value.trim(), password = $('#a-pwd').value;
    if (mode === 'signup' && $('#a-name').value.trim().length < 2) {
      err.textContent = 'Please enter your full name.'; return;
    }
    btn.disabled = true; btn.textContent = mode === 'login' ? 'Logging in…' : 'Creating account…';
    try {
      const res = mode === 'login'
        ? await post('/api/auth/login', { email, password })
        : await post('/api/auth/register', { name: $('#a-name').value.trim(), email, password, homeCity: $('#a-city').value.trim() || 'Delhi' });
      await handleAuthSuccess(res);
    } catch (ex) {
      err.textContent = ex.message;
      btn.disabled = false;
      btn.textContent = mode === 'login' ? 'Login to Chutti' : 'Create Free Account';
    }
  });
}

/* ---------- TRIPS / BOOKINGS / PROFILE ---------- */
async function trips() {
  if (!USER) {
    const localList = store.get('chutti_trips', []);
    $('#view').innerHTML = `
    <div class="wrap page">
      <div class="profile-bar">
        <div><h1 style="font-size:28px">My Trips</h1><p class="lead" style="margin-top:4px">Log in or sign up to save trips to your account, sync across devices, and book journeys.</p></div>
        <a class="btn btn-red" href="#/login?next=%23%2Ftrips">${ic('user')} Login / Sign Up</a>
      </div>
      <div style="margin-top:22px">
        ${localList.length ? localList.map((t, i) => `
          <div class="card trip"><img src="${img(slugFor(t.plan.destination, t.plan.slug))}" alt="${esc(t.plan.destination || t.plan.title)}"><div class="grow"><b>${esc(t.plan.title)}</b><br><small>${t.plan.days} days • ${inr(t.plan.total)} of ${inr(t.plan.budget)} • saved locally</small></div>
          <a class="btn btn-red" href="${esc(t.id)}">Open</a><button class="icon-btn" data-del-local="${i}" aria-label="Delete trip">${ic('trash')}</button></div>`).join('')
          : `<div class="empty">No saved trips yet.<br><br><a class="btn btn-red" href="#/">Plan one now</a></div>`}
      </div>
    </div>`;
    $$('[data-del-local]').forEach(b => b.onclick = () => { const l = store.get('chutti_trips', []); l.splice(+b.dataset.delLocal, 1); store.set('chutti_trips', l); trips(); });
    return;
  }

  $('#view').innerHTML = `<div class="wrap page"><div class="loader" style="min-height:30vh"><div><div class="spin"></div><p>Loading your trips and bookings…</p></div></div></div>`;
  try {
    const [tRes, bRes] = await Promise.all([api('/api/trips'), api('/api/bookings')]);
    const saved = tRes.trips || [], bookings = bRes.bookings || [];
    $('#view').innerHTML = `
    <div class="wrap page">
      <div class="profile-bar">
        <div style="display:flex;align-items:center;gap:18px">
          ${USER.picture_url ? `<img src="${esc(USER.picture_url)}" class="profile-avatar-img" alt="${esc(USER.name)}">` : ''}
          <div>
            <h1 style="font-size:28px">Welcome, ${esc(USER.name)} ${USER.auth_provider === 'google' ? `<span class="google-badge">${googleIconSvg} Google</span>` : ''}</h1>
            <p class="lead" style="margin-top:4px">${esc(USER.email)} • Default departure city: <b>${esc(USER.home_city || 'Delhi')}</b></p>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <a class="btn btn-red" href="#/">+ Plan New Trip</a>
          <button class="btn btn-dark" id="edit-profile-btn" type="button">Edit Profile</button>
          <button class="btn btn-ghost" id="logout-btn">${ic('logout')} Logout</button>
        </div>
      </div>

      <h2 style="margin-top:28px;font-size:22px">Confirmed Bookings (${bookings.length})</h2>
      ${bookings.length ? bookings.map(b => `
        <div class="card trip">
          <img src="${img(slugFor(b.destination, b.plan?.slug))}" alt="${esc(b.destination)}">
          <div class="grow">
            <b>${esc(b.title)}</b> <span class="pill ok">${esc(b.status)} • ${esc(b.booking_ref)}</span><br>
            <small>Travel date: ${esc(b.travel_date)} • ${b.travelers} Traveller(s) • Total ${inr(b.total_cost)}</small>
          </div>
          <a class="btn btn-dark" href="${esc(planHash({ destination: b.destination, budget: b.plan?.budget || b.total_cost, days: b.plan?.days, travelers: b.travelers, origin: b.plan?.origin || 'Delhi' }))}">View Plan</a>
        </div>`).join('') : '<p class="lead">No bookings yet. Generate a trip plan and click "Book This Trip".</p>'}

      <h2 style="margin-top:28px;font-size:22px">Saved Trip Plans (${saved.length})</h2>
      ${saved.length ? saved.map(t => `
        <div class="card trip">
          <img src="${img(slugFor(t.destination, t.slug))}" alt="${esc(t.destination)}">
          <div class="grow">
            <b>${esc(t.title)}</b><br>
            <small>${t.days} days • ${inr(t.total)} of ${inr(t.budget)} • From ${esc(t.origin)} • ${esc(t.when || 'Anytime')}</small>
          </div>
          <a class="btn btn-red" href="${esc(planHash({ destination: t.destination, budget: t.budget, days: t.days, travelers: t.travelers, origin: t.origin, style: t.style, when: t.when }))}">Open</a>
          <button class="icon-btn" data-del="${t.id}" aria-label="Delete trip">${ic('trash')}</button>
        </div>`).join('') : `<div class="empty">No saved trips yet.<br><br><a class="btn btn-red" href="#/">Plan one now</a></div>`}
    </div>`;

    $('#edit-profile-btn').onclick = () => openProfileModal();
    $('#logout-btn').onclick = async () => {
      await post('/api/auth/logout', {}).catch(() => {});
      USER = null;
      store.del('chutti_token');
      renderShell();
      toast('Logged out');
      navigate('#/');
    };
    $$('[data-del]').forEach(b => b.onclick = async () => {
      try { await del(`/api/trips/${b.dataset.del}`); toast('Trip deleted'); trips(); }
      catch (err) { toast(err.message); }
    });
  } catch (err) {
    $('#view').innerHTML = `<div class="wrap page"><div class="banner err">${ic('warn')}<div>${esc(err.message)}</div></div></div>`;
  }
}

function openProfileModal() {
  if (!USER) return;
  const root = $('#modal-root');
  root.innerHTML = `
  <div class="modal-backdrop" id="pm-bg">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="pm-title">
      <div class="modal-head">
        <h3 id="pm-title">Edit Profile</h3>
        <button class="icon-btn" id="pm-close" aria-label="Close">✕</button>
      </div>
      <form class="auth-form" id="pm-form">
        <div><label for="pm-name">Full Name</label><div class="field">${ic('user')}<input id="pm-name" value="${esc(USER.name)}" maxlength="80" required></div></div>
        <div><label for="pm-city">Default Departure City</label><div class="field">${ic('pin')}<input id="pm-city" value="${esc(USER.home_city || 'Delhi')}" maxlength="40" placeholder="Delhi, Mumbai, Bengaluru..."></div></div>
        <div class="form-err" id="pm-err"></div>
        <button class="btn btn-red" id="pm-save" type="submit">Save Changes</button>
      </form>
    </div>
  </div>`;
  const close = () => { root.innerHTML = ''; };
  $('#pm-close').onclick = close;
  $('#pm-bg').onclick = e => { if (e.target.id === 'pm-bg') close(); };
  $('#pm-form').onsubmit = async e => {
    e.preventDefault();
    const err = $('#pm-err'), btn = $('#pm-save');
    err.textContent = '';
    const name = $('#pm-name').value.trim(), homeCity = $('#pm-city').value.trim() || 'Delhi';
    if (name.length < 2) { err.textContent = 'Please enter your name.'; return; }
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const res = await put('/api/auth/me', { name, homeCity });
      USER = res.user;
      store.set('chutti_origin', USER.home_city || 'Delhi');
      renderShell();
      close();
      toast('Profile updated');
      trips();
    } catch (ex) {
      err.textContent = ex.message;
      btn.disabled = false; btn.textContent = 'Save Changes';
    }
  };
}

/* ---------- ABOUT / CONTACT ---------- */
function about() {
  $('#view').innerHTML = `
  <div class="wrap page"><h1>About Chutti</h1>
  <p class="usp">You give the budget. We plan the entire journey.</p>
  <p class="lead" style="margin-top:14px">"Chutti" means holiday. Most trip sites make you search trains, hotels and food one by one, then add up the cost yourself. Chutti flips it: tell us where and how much, and CodeFusionAI plans the whole trip inside that number.</p>
  <div class="steps3">
    <div class="card">${ic('pin')}<b>1. Pick a place</b><p>Any destination across India and beyond.</p></div>
    <div class="card"><span style="font-size:20px;color:var(--red);font-weight:700">₹</span><b>2. Set your budget</b><p>The whole trip, including the way back.</p></div>
    <div class="card">${ic('sparkle')}<b>3. Get the AI plan</b><p>Transport, stay, food, activities and a day-by-day plan powered by CodeFusionAI.</p></div>
  </div>
  <div class="banner warn" style="max-width:760px">${ic('warn')}<div><b>Be careful with the numbers.</b> Prices are AI estimates based on typical costs, not live fares. Always check live prices on booking sites before paying.</div></div></div>`;
}

function contact() {
  $('#view').innerHTML = `
  <div class="wrap page"><h1>Contact us</h1><p class="lead">Questions, feedback or a place we should add? Write to us.</p>
  <form class="card form-card" id="cf">
    <div class="field"><input name="name" placeholder="Your name" value="${esc(USER?.name || '')}" maxlength="80" required aria-label="Name"></div>
    <div class="field"><input name="email" type="email" placeholder="Email" value="${esc(USER?.email || '')}" maxlength="120" required aria-label="Email"></div>
    <textarea name="message" placeholder="Your message" maxlength="1500" required aria-label="Message"></textarea>
    <button class="btn btn-red" type="submit">Send message</button><div class="form-err" id="cf-err"></div>
  </form></div>`;
  $('#cf').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    try { await post('/api/contact', fd); e.target.reset(); toast('Message sent. Thank you!'); $('#cf-err').textContent = ''; }
    catch (err) { $('#cf-err').textContent = err.message; }
  });
}

/* ---------- Apple.com tactile click press on container cards ---------- */
function initAppleCards() {
  const PRESS_CONTAINER_SEL = '.card, .bento-card, .bento-hero, .feat-pill, .showcase, .more-box, .profile-bar';
  const INTERACTIVE_SEL = 'input, select, textarea, button, a, label';
  let pressedCard = null;

  document.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target && e.target.closest && e.target.closest(INTERACTIVE_SEL)) return;
    const card = e.target && e.target.closest ? e.target.closest(PRESS_CONTAINER_SEL) : null;
    if (!card) return;
    pressedCard = card;
    card.classList.add('apple-pressed');
  }, { passive: true });

  const releasePress = () => {
    if (!pressedCard) return;
    pressedCard.classList.remove('apple-pressed');
    pressedCard = null;
  };
  document.addEventListener('pointerup', releasePress, { passive: true });
  document.addEventListener('pointercancel', releasePress, { passive: true });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const root = $('#modal-root');
    if (root && root.innerHTML) root.innerHTML = '';
    document.querySelectorAll('body > .modal-backdrop').forEach(el => el.remove());
  });
}

/* ---------- router ---------- */
function route() {
  const h = location.hash.slice(1) || '/';
  const [path, q] = h.split('?');
  const parts = path.split('/').filter(Boolean);
  const qs = new URLSearchParams(q || '');
  planToken++;
  document.title = 'Chutti — The India Travel Planner';
  const page = parts[0] || 'home';
  document.body.classList.toggle('is-home', page === 'home' || !['destinations', 'destination', 'plan', 'trips', 'about', 'contact', 'login', 'signup'].includes(page));
  $$('#nav-links a').forEach(a => a.classList.toggle('active', a.dataset.nav === (page === 'destination' ? 'destinations' : page === 'plan' ? '' : page)));
  if (page === 'planner') { navigate('#/'); return; }
  window.scrollTo(0, 0);
  switch (page) {
    case 'destinations': return destinations();
    case 'destination': return destination(parts[1]);
    case 'plan': return plan(qs);
    case 'trips': return trips();
    case 'about': return about();
    case 'contact': return contact();
    case 'login': return authPage('login', qs);
    case 'signup': return authPage('signup', qs);
    default: return home();
  }
}

async function boot() {
  if (location.protocol === 'file:') {
    document.body.innerHTML = '<div style="max-width:640px;margin:80px auto;padding:28px;font-family:sans-serif;background:#101a30;color:#fff;border-radius:16px"><h2>Run the Python Backend Server</h2><p style="margin-top:10px;color:#a3aec6">This app needs the FastAPI Python backend for CodeFusionAI, login, and trip APIs. Open a terminal in the project folder and run:</p><pre style="margin-top:12px;padding:12px;background:#0a0f1d;border-radius:8px">.venv/bin/python server.py</pre><p style="margin-top:12px">Then open <b>http://localhost:8000</b> in your browser.</p></div>';
    return;
  }
  renderShell();
  initAppleCards();
  try {
    const [destRes, healthRes, meRes, authCfg] = await Promise.all([
      api('/api/destinations').catch(() => api('/destinations.json')),
      api('/api/health').catch(() => ({ ai: false, model: 'CodeFusionAI' })),
      api('/api/auth/me').catch(() => ({ user: null })),
      api('/api/auth/config').catch(() => ({ googleClientId: '' }))
    ]);
    DESTS = destRes.destinations || [];
    HEALTH = healthRes;
    USER = meRes.user || null;
    GOOGLE_CLIENT_ID = authCfg.googleClientId || '';
    renderShell();
  } catch (err) {
    console.warn('Backend notice:', err);
    try {
      const fallback = await api('/destinations.json');
      DESTS = fallback.destinations || [];
      renderShell();
    } catch {
      // Keep shell responsive
    }
  }
  window.addEventListener('hashchange', route);
  route();
}
boot();
})();
