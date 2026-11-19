'use strict';
// Offline cost estimator + fallback plan builder.
// Used for: the instant preview on the home page, the plan when Gemini is not available,
// and as a sanity baseline for Gemini's numbers.
const DESTS = require('../data/destinations');

const GENERIC = {
  slug: null, name: '', state: '', scene: 'generic', tagline: '', aliases: [], bestTime: 'Check the season before you go',
  ideal: 4, cost: { hotel: 1500, food: 450, local: 400, act: 500, reach: 1500 },
  reachMode: 'Train / Bus', reachDuration: 'varies',
  places: [], foods: [], tips: []
};

const round10 = n => Math.round(n / 10) * 10;
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

function findDest(name) {
  const n = String(name || '').trim().toLowerCase();
  if (!n) return null;
  return (
    DESTS.find(d => d.slug === n || d.name.toLowerCase() === n) ||
    DESTS.find(d => d.aliases.includes(n)) ||
    DESTS.find(d => n.includes(d.name.toLowerCase()) || d.aliases.some(a => n.includes(a))) ||
    null
  );
}

function profileFor(name) {
  const d = findDest(name);
  return d || { ...GENERIC, name: String(name || '').trim() };
}

const STYLE = { budget: { hotel: 1, food: 1 }, comfort: { hotel: 1.6, food: 1.3 } };

function costFor(p, days, travelers, style) {
  const s = STYLE[style] || STYLE.budget;
  const nights = Math.max(days - 1, 0);
  const rooms = Math.ceil(travelers / 2);
  const hotel = round10(nights * p.cost.hotel * rooms * s.hotel);
  const food = round10(days * p.cost.food * travelers * s.food);
  const reach = round10(travelers * p.cost.reach * 2);
  const local = round10(days * p.cost.local * rooms);
  const activities = round10(days * p.cost.act * travelers);
  return { hotel, food, travel: reach + local, reach, local, activities, total: hotel + food + reach + local + activities };
}

// Pick days + style that fit the budget
function fit(p, budget, travelers, wantedDays, wantedStyle) {
  const maxDays = Math.max(p.ideal, 3);
  let style = wantedStyle === 'comfort' ? 'comfort' : 'budget';
  let days;
  if (wantedDays) {
    days = clamp(Math.round(wantedDays), 1, 14);
  } else {
    days = 2;
    for (let d = maxDays; d >= 2; d--) {
      if (costFor(p, d, travelers, 'budget').total <= budget * 0.97) { days = d; break; }
    }
  }
  if (wantedStyle === 'auto' || !wantedStyle) {
    style = costFor(p, days, travelers, 'comfort').total <= budget * 0.97 && days >= Math.min(p.ideal, 3) ? 'comfort' : 'budget';
  }
  return { days, style };
}

function minimumBudget(p, travelers) {
  return costFor(p, 2, travelers, 'budget').total;
}

function estimate(params) {
  const p = profileFor(params.destination);
  const travelers = clamp(parseInt(params.travelers, 10) || 1, 1, 10);
  const budget = params.budget;
  const { days, style } = fit(p, budget, travelers, params.days ? Number(params.days) : 0, params.style);
  const c = costFor(p, days, travelers, style);
  return {
    destination: p.name || params.destination,
    slug: p.slug,
    known: !!p.slug,
    days, nights: Math.max(days - 1, 0), travelers, style,
    breakdown: { hotel: c.hotel, food: c.food, travel: c.travel, activities: c.activities },
    parts: { reach: c.reach, local: c.local },
    total: c.total,
    leftover: Math.max(budget - c.total, 0),
    withinBudget: c.total <= budget,
    minimumBudget: minimumBudget(p, travelers),
    mainTransport: p.reachMode,
    reachDuration: p.reachDuration
  };
}

function buildItinerary(p, days, dest) {
  const places = p.places.length ? p.places : [];
  const out = [];
  let pi = 0;
  const nextPlace = () => (places.length ? places[pi++ % places.length] : null);
  for (let d = 1; d <= days; d++) {
    const items = [];
    if (d === 1) {
      items.push({ time: 'Morning', title: `Travel to ${dest}`, detail: `${p.reachMode || 'Train / Bus'}, about ${p.reachDuration || 'check timings'}. Then check in and rest.`, cost: 0 });
      const a = nextPlace();
      items.push({ time: 'Evening', title: a ? a.name : `Explore ${dest}`, detail: a ? a.desc : 'Short walk around your hotel and a local dinner.', cost: 0 });
    } else if (d === days && days > 1) {
      const a = nextPlace();
      items.push({ time: 'Morning', title: a ? a.name : `Last look at ${dest}`, detail: a ? a.desc : 'Local breakfast and some shopping.', cost: 0 });
      items.push({ time: 'Afternoon', title: 'Check out and return journey', detail: `Head back by ${p.reachMode || 'train / bus'}.`, cost: 0 });
    } else {
      const a = nextPlace(), b = nextPlace();
      items.push({ time: 'Morning', title: a ? a.name : `Explore ${dest}`, detail: a ? a.desc : 'Visit the main sights with a local guide or auto.', cost: 0 });
      items.push({ time: 'Afternoon', title: b ? b.name : 'Local food walk', detail: b ? b.desc : 'Lunch at a well-reviewed local place.', cost: 0 });
      items.push({ time: 'Evening', title: 'Free time', detail: 'Local market and dinner.', cost: 0 });
    }
    out.push({ day: d, title: d === 1 ? 'Arrival' : d === days && days > 1 ? 'Return' : `Explore ${dest}`, items });
  }
  return out;
}

// Full plan object in the same shape as a Gemini plan
function buildFallbackPlan(params, notice) {
  const p = profileFor(params.destination);
  const e = estimate(params);
  const dest = e.destination || params.destination;
  const hotelNight = Math.round(p.cost.hotel * (e.style === 'comfort' ? STYLE.comfort.hotel : 1) / 10) * 10;
  const plan = {
    source: 'estimate',
    destination: dest, slug: e.slug,
    title: `${dest} Trip`,
    tagline: p.tagline || '',
    summary: `A ${e.days}-day ${dest} trip for ${e.travelers} ${e.travelers > 1 ? 'people' : 'person'} using typical prices. This is a basic estimate, not a full AI plan.`,
    days: e.days, nights: e.nights, travelers: e.travelers,
    origin: params.origin || 'Delhi', budget: params.budget, style: e.style,
    breakdown: [
      { key: 'hotel', label: `Hotel (${e.nights} ${e.nights === 1 ? 'Night' : 'Nights'})`, amount: e.breakdown.hotel, note: `About ${'₹' + hotelNight.toLocaleString('en-IN')} per room per night` },
      { key: 'food', label: 'Food', amount: e.breakdown.food, note: 'Local meals and cafes' },
      { key: 'travel', label: `Travel (${e.mainTransport})`, amount: e.breakdown.travel, note: 'Round trip + local transport' },
      { key: 'activities', label: 'Activities', amount: e.breakdown.activities, note: 'Entry fees and adventure' }
    ],
    total: e.total, leftover: e.leftover, withinBudget: e.withinBudget, minimumBudget: e.minimumBudget,
    transport: [{ mode: guessMode(e.mainTransport), title: `${origin(params)} → ${dest}`, duration: p.reachDuration, cost: p.cost.reach, note: 'One way, per person. Prices change. Check live fares.', recommended: true }],
    hotels: [{ name: `Budget stay in ${dest}`, area: 'Near the main market', type: e.style === 'comfort' ? '3-star' : 'Hostel / homestay', pricePerNight: hotelNight, note: 'Per room per night' }],
    food: (p.foods || []).slice(0, 4).map(f => ({ name: f, what: 'Local favourite', cost: Math.round(p.cost.food / 3 / 10) * 10 })),
    itinerary: buildItinerary(p, e.days, dest),
    tips: p.tips || [],
    packing: [],
    bestTime: p.bestTime,
    warnings: []
  };
  if (!e.withinBudget) plan.warnings.push(`This budget is too low. A basic 2-day trip needs about ₹${e.minimumBudget.toLocaleString('en-IN')}.`);
  if (!e.known) plan.warnings.push('This place is not in our built-in list, so these numbers are generic guesses.');
  if (notice) plan.notice = notice;
  return plan;
}

function origin(params) { return params.origin || 'Delhi'; }
function guessMode(s) {
  s = String(s || '').toLowerCase();
  if (s.includes('flight')) return 'flight';
  if (s.includes('train')) return 'train';
  if (s.includes('bus')) return 'bus';
  return 'cab';
}

module.exports = { findDest, profileFor, estimate, buildFallbackPlan, buildItinerary, clamp, DESTS };
