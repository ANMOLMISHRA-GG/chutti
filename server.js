'use strict';
require('./lib/env');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { configured, generatePlan, ask } = require('./lib/gemini');
const { estimate, buildFallbackPlan, findDest, DESTS } = require('./lib/estimator');
const { sceneSVG, heroSVG } = require('./lib/scenes');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const PUBLIC = path.join(__dirname, 'public');
const DATA = path.join(__dirname, 'data');
const RATE = parseInt(process.env.RATE_LIMIT_PER_MIN, 10) || 10;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8'
};

// ---------- helpers ----------
const send = (res, code, obj) => {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
};

function readBody(req, limit = 20000) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error('Request too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
      catch { reject(Object.assign(new Error('Invalid JSON'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

const hits = new Map();
function limited(req) {
  const ip = req.socket.remoteAddress || 'x';
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 60000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > RATE;
}

const cache = new Map();
const TTL = 60 * 60 * 1000;
const cacheGet = k => { const e = cache.get(k); if (e && Date.now() - e.t < TTL) return e.v; cache.delete(k); return null; };
const cacheSet = (k, v) => { if (cache.size > 300) cache.delete(cache.keys().next().value); cache.set(k, { t: Date.now(), v }); };

const clean = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f<>{}`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

function parseParams(src) {
  const destination = clean(src.destination, 60);
  const budget = Math.round(Number(String(src.budget).replace(/[^0-9.]/g, '')));
  if (!destination) return { error: 'Please enter a destination.' };
  if (!Number.isFinite(budget) || budget < 1000) return { error: 'Budget must be at least ₹1,000.' };
  if (budget > 10000000) return { error: 'Budget is too large.' };
  const days = src.days ? Math.round(Number(src.days)) : 0;
  if (src.days && (!Number.isFinite(days) || days < 1 || days > 14)) return { error: 'Days must be between 1 and 14.' };
  const travelers = src.travelers ? Math.round(Number(src.travelers)) : 1;
  if (!Number.isFinite(travelers) || travelers < 1 || travelers > 10) return { error: 'Travellers must be between 1 and 10.' };
  const style = ['budget', 'comfort', 'auto'].includes(src.style) ? src.style : 'auto';
  return { params: { destination, budget, days: days || 0, travelers, origin: clean(src.origin, 40) || 'Delhi', style } };
}

function serveImage(res, base, fallbackSvg) {
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
    const file = base + ext;
    if (fs.existsSync(file)) {
      res.writeHead(200, { 'Content-Type': MIME[ext], 'Cache-Control': 'public, max-age=86400' });
      return fs.createReadStream(file).pipe(res);
    }
  }
  res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' });
  res.end(fallbackSvg());
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      // single-page app: unknown non-file paths go to index
      if (!path.extname(rel)) return serveStatic(req, res, '/');
      res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
}

const publicDest = d => ({
  slug: d.slug, name: d.name, state: d.state, tagline: d.tagline, blurb: d.blurb, bestTime: d.bestTime, ideal: d.ideal,
  dailyCost: d.cost.hotel + d.cost.food + d.cost.local + d.cost.act, reach: d.cost.reach,
  reachMode: d.reachMode, reachDuration: d.reachDuration, places: d.places, foods: d.foods, tips: d.tips
});

// ---------- routes ----------
async function api(req, res, u) {
  const p = u.pathname;

  if (req.method === 'GET' && p === '/api/health') return send(res, 200, { ok: true, ai: configured() });

  if (req.method === 'GET' && p === '/api/destinations') return send(res, 200, { destinations: DESTS.map(publicDest) });

  if (req.method === 'GET' && p === '/api/estimate') {
    const v = parseParams({ destination: u.searchParams.get('destination'), budget: u.searchParams.get('budget'), days: u.searchParams.get('days'), travelers: u.searchParams.get('travelers') });
    if (v.error) return send(res, 400, { error: v.error });
    return send(res, 200, estimate(v.params));
  }

  if (req.method === 'POST' && p === '/api/plan') {
    const v = parseParams(await readBody(req));
    if (v.error) return send(res, 400, { error: v.error });
    const params = v.params;
    const key = JSON.stringify(params).toLowerCase();
    const hit = cacheGet(key);
    if (hit) return send(res, 200, { plan: hit, cached: true });

    if (!configured()) {
      return send(res, 200, { plan: buildFallbackPlan(params, 'AI is not switched on yet. Add GEMINI_API_KEY to the .env file to get a full AI plan. This is a basic estimate.') });
    }
    if (limited(req)) return send(res, 429, { error: 'Too many requests. Please wait a minute and try again.' });
    try {
      const plan = await generatePlan(params);
      cacheSet(key, plan);
      return send(res, 200, { plan });
    } catch (e) {
      console.error('[plan] Gemini failed:', e.message);
      const hint = e.status === 400 || e.status === 403 ? 'The Gemini key looks invalid.' : e.status === 429 ? 'Gemini quota is used up for now.' : 'Gemini is not responding right now.';
      return send(res, 200, { plan: buildFallbackPlan(params, `${hint} Showing a basic estimate instead.`) });
    }
  }

  if (req.method === 'POST' && p === '/api/ask') {
    const b = await readBody(req);
    const question = clean(b.question, 300);
    const destination = clean(b.destination, 60);
    if (!question || !destination) return send(res, 400, { error: 'Ask a question about a destination.' });
    if (!configured()) return send(res, 503, { error: 'AI is not switched on yet. Add GEMINI_API_KEY to the .env file.' });
    if (limited(req)) return send(res, 429, { error: 'Too many requests. Please wait a minute.' });
    try { return send(res, 200, { answer: await ask(destination, question) }); }
    catch (e) { console.error('[ask]', e.message); return send(res, 502, { error: 'Gemini is not responding. Try again.' }); }
  }

  if (req.method === 'POST' && p === '/api/contact') {
    const b = await readBody(req, 5000);
    const name = clean(b.name, 80), email = clean(b.email, 120), message = clean(b.message, 1500);
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || message.length < 5) return send(res, 400, { error: 'Fill in name, a valid email and a message.' });
    if (limited(req)) return send(res, 429, { error: 'Too many messages. Try later.' });
    fs.appendFileSync(path.join(DATA, 'messages.jsonl'), JSON.stringify({ at: new Date().toISOString(), name, email, message }) + '\n');
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: 'Not found' });
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://localhost');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (u.pathname.startsWith('/api/')) return await api(req, res, u);

    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    if (u.pathname === '/img/hero') return serveImage(res, path.join(PUBLIC, 'img', 'hero'), heroSVG);
    const m = u.pathname.match(/^\/img\/dest\/([a-z0-9-]+)$/);
    if (m) {
      const d = DESTS.find(x => x.slug === m[1]);
      return serveImage(res, path.join(PUBLIC, 'img', 'dest', m[1]), () => sceneSVG(d ? d.scene : 'generic', m[1]));
    }
    return serveStatic(req, res, u.pathname);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) send(res, e.status || 500, { error: e.status ? e.message : 'Something went wrong' });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`chutti.com running on http://localhost:${PORT}`);
    console.log(configured() ? `AI: Gemini (${process.env.GEMINI_MODEL || 'gemini-2.5-flash'})` : 'AI: OFF. Add GEMINI_API_KEY to .env for full AI plans (basic estimates are used until then).');
  });
}
module.exports = server;
