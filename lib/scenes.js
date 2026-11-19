'use strict';
// Generates scenic SVG images so the app looks complete without any photo downloads.
// To use real photos: drop public/img/hero.jpg and public/img/dest/<slug>.jpg. They win automatically.

function rng(seed) {
  let s = 7;
  for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  s = s || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}
const f = n => Math.round(n * 10) / 10;

function ridge(r, W, base, amp, steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const peak = i % 2 === 0 ? 0.55 + 0.45 * r() : 0.12 + 0.28 * r();
    pts.push([(W * i) / steps, base - amp * peak]);
  }
  return pts;
}
const poly = (pts, W, H) => `M0 ${H} L${pts.map(p => f(p[0]) + ' ' + f(p[1])).join(' L')} L${W} ${H} Z`;

let uid = 0;
function mountain(pts, W, H, fill, snowY, snowOpacity = 0.95) {
  const d = poly(pts, W, H);
  if (snowY == null) return `<path d="${d}" fill="${fill}"/>`;
  const id = 'c' + ++uid;
  const zig = [];
  const n = 30;
  for (let i = 0; i <= n; i++) zig.push([(W * i) / n, snowY + (i % 2 ? 16 : -8) + (i % 3) * 5]);
  const snow = `M0 0 L${W} 0 L${zig.reverse().map(p => f(p[0]) + ' ' + f(p[1])).join(' L')} Z`;
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${d}" fill="${fill}"/><path clip-path="url(#${id})" d="${snow}" fill="#fff" opacity="${snowOpacity}"/>`;
}
function pine(x, y, h, c) {
  let d = '';
  for (let i = 0; i < 3; i++) {
    const top = y - h + i * h * 0.27, w = h * (0.2 + i * 0.09), hh = h * 0.42;
    d += `M${f(x)} ${f(top)} L${f(x - w)} ${f(top + hh)} L${f(x + w)} ${f(top + hh)} Z `;
  }
  return `<path d="${d}" fill="${c}"/>`;
}
function pines(r, W, y, count, hmin, hmax, c, x0 = 0, x1 = W) {
  let s = '';
  for (let i = 0; i < count; i++) s += pine(x0 + (x1 - x0) * r(), y + 6 * r(), hmin + (hmax - hmin) * r(), c);
  return s;
}
const palm = (x, y, h, c = '#0d2a1c') => {
  let s = `<path d="M${x} ${y} q${h * 0.1} ${-h * 0.5} ${h * 0.02} ${-h}" stroke="#3b2a1d" stroke-width="${h * 0.05}" fill="none"/>`;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI - Math.PI;
    const ex = x + Math.cos(a) * h * 0.45, ey = y - h + Math.sin(a) * h * 0.2 + h * 0.08;
    s += `<path d="M${x} ${y - h} Q${f((x + ex) / 2)} ${f(y - h - h * 0.25)} ${f(ex)} ${f(ey)}" stroke="${c}" stroke-width="${h * 0.07}" fill="none" stroke-linecap="round"/>`;
  }
  return s;
};
const house = (x, y, w, h, wall, roof) =>
  `<rect x="${f(x)}" y="${f(y - h)}" width="${f(w)}" height="${f(h)}" fill="${wall}"/><path d="M${f(x - 3)} ${f(y - h)} L${f(x + w / 2)} ${f(y - h - h * 0.55)} L${f(x + w + 3)} ${f(y - h)} Z" fill="${roof}"/>`;

function sky(a, b, extra = '') {
  return `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>${extra}</defs><rect width="400" height="260" fill="url(#sky)"/>`;
}
const wrap = (inner, W = 400, H = 260) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;

function sceneSVG(type, seed = 'x') {
  const r = rng(seed + type);
  const W = 400, H = 260;
  let s = '';
  switch (type) {
    case 'snow':
    case 'lake': {
      s += sky('#5f93d6', '#dcebf8');
      s += `<circle cx="300" cy="60" r="34" fill="#fff" opacity=".35"/>`;
      s += mountain(ridge(r, W, 150, 120, 8), W, H, '#6c86b0', 88);
      s += mountain(ridge(r, W, 190, 95, 10), W, H, '#445d8a', 120, 0.9);
      if (type === 'lake') {
        s += `<rect y="185" width="400" height="75" fill="#4a86b8"/><path d="M0 200 H400 M0 215 H400 M0 232 H400" stroke="#fff" stroke-opacity=".25"/>`;
        s += `<path d="M150 214 q30 12 60 0 l-8 8 h-44 z" fill="#2a2a2a"/><path d="M180 214 v-16 l14 16" fill="#d94f4f"/>`;
        s += pines(r, W, 200, 14, 22, 40, '#0c2a22', 0, 120) + pines(r, W, 200, 14, 22, 40, '#0c2a22', 290, 400);
      } else {
        s += `<path d="M0 220 Q120 190 220 215 T400 205 V260 H0Z" fill="#eaf2f9"/>`;
        s += pines(r, W, 230, 26, 24, 52, '#0d2b22');
        s += house(250, 238, 40, 22, '#9b5d3c', '#e8eef5') + house(300, 242, 30, 18, '#b5754a', '#e8eef5');
      }
      break;
    }
    case 'ladakh': {
      s += sky('#4d86d1', '#d5e7f7');
      s += mountain(ridge(r, W, 160, 105, 9), W, H, '#a28868', 96, 0.9);
      s += mountain(ridge(r, W, 200, 85, 11), W, H, '#7c6a52', null);
      s += `<path d="M0 205 Q100 190 210 205 T400 198 V260 H0Z" fill="#2f78b3"/><path d="M0 225 Q100 212 200 226 T400 218 V260 H0Z" fill="#1f5f96"/>`;
      s += `<path d="M0 240 Q100 228 210 240 T400 236 V260 H0Z" fill="#8c7757"/>`;
      break;
    }
    case 'hills':
    case 'hills2':
    case 'tea': {
      const cols = type === 'tea' ? ['#cfe0ee', '#4f8a47', '#2f6a35', '#1e4d2a'] : type === 'hills2' ? ['#8fb7e0', '#5f8d73', '#3a6b52', '#1e4535'] : ['#86b4e3', '#5b8aa8', '#3f7157', '#1f4631'];
      s += sky(cols[0], '#eaf3f8');
      s += `<ellipse cx="90" cy="60" rx="60" ry="14" fill="#fff" opacity=".6"/><ellipse cx="300" cy="45" rx="50" ry="10" fill="#fff" opacity=".5"/>`;
      s += mountain(ridge(r, W, 150, 80, 7), W, H, cols[1], type === 'hills' ? null : 110, 0.55);
      s += mountain(ridge(r, W, 195, 60, 9), W, H, cols[2], null);
      if (type === 'tea') {
        for (let i = 0; i < 7; i++) s += `<path d="M0 ${195 + i * 10} Q200 ${180 + i * 10} 400 ${196 + i * 10}" stroke="#2d7a3a" stroke-width="5" opacity=".7" fill="none"/>`;
      } else {
        s += house(60, 225, 30, 22, '#d9b48a', '#b0462f') + house(100, 230, 36, 26, '#e8d0b0', '#8f3a2b') + house(150, 228, 28, 20, '#cfa77c', '#b0462f');
      }
      s += pines(r, W, 245, 24, 28, 58, cols[3]);
      break;
    }
    case 'temple':
    case 'fort': {
      const warm = type === 'fort';
      s += sky(warm ? '#f2a76b' : '#e98f5a', warm ? '#fbe1bd' : '#fcd9a4');
      s += `<circle cx="320" cy="70" r="28" fill="#fff6d8" opacity=".85"/>`;
      const wall = warm ? '#d9776f' : '#e3b25c', dark = warm ? '#9c3d3b' : '#b3772e';
      s += `<path d="M0 200 H400 V260 H0Z" fill="#8a5a3a"/>`;
      s += `<rect x="70" y="120" width="260" height="95" fill="${wall}"/><rect x="70" y="112" width="260" height="10" fill="${dark}"/>`;
      s += `<path d="M150 120 v-45 h100 v45z" fill="${wall}"/><path d="M135 78 q65 -48 130 0z" fill="${dark}"/><path d="M200 30 v-16" stroke="${dark}" stroke-width="3"/><circle cx="200" cy="12" r="4" fill="#f7c95a"/>`;
      for (const x of [78, 110, 270, 302]) s += `<rect x="${x}" y="80" width="20" height="40" fill="${wall}"/><path d="M${x - 3} 82 q13 -24 26 0z" fill="${dark}"/>`;
      for (let i = 0; i < 6; i++) s += `<path d="M${95 + i * 40} 215 v-35 q12 -18 24 0 v35z" fill="${dark}" opacity=".85"/>`;
      s += `<rect x="0" y="215" width="400" height="45" fill="#7a4d30"/>`;
      break;
    }
    case 'beach': {
      s += sky('#ff9a5c', '#ffe0a8');
      s += `<circle cx="280" cy="150" r="40" fill="#fff2c4"/>`;
      s += `<rect y="150" width="400" height="60" fill="#3b86b5"/><path d="M0 162 H400 M0 176 H400 M0 192 H400" stroke="#fff" stroke-opacity=".3"/>`;
      s += `<circle cx="280" cy="150" r="40" fill="#fff2c4" clip-path="inset(0 0 0 0)" opacity=".0"/>`;
      s += `<path d="M0 205 Q100 190 200 205 T400 200 V260 H0Z" fill="#f0d8a0"/><path d="M0 220 H400 V260 H0Z" fill="#e6c98a"/>`;
      s += palm(70, 235, 120) + palm(330, 240, 100) + palm(40, 245, 80);
      s += `<path d="M150 232 l30 -26 l30 26z" fill="#e85c5c"/><rect x="170" y="232" width="20" height="14" fill="#7a4d30"/>`;
      break;
    }
    case 'river': {
      s += sky('#79b0e0', '#e4f0f6');
      s += mountain(ridge(r, W, 150, 90, 8), W, H, '#5f8a9a', 95, 0.6);
      s += mountain(ridge(r, W, 190, 70, 9), W, H, '#2f6a4e', null);
      s += `<path d="M0 205 Q150 190 400 215 V260 H0Z" fill="#5aa8b8"/><path d="M0 225 Q200 208 400 232" stroke="#fff" stroke-opacity=".35" fill="none"/>`;
      s += `<path d="M40 150 Q200 190 360 150" stroke="#222" stroke-width="3" fill="none"/>` + [80, 120, 160, 200, 240, 280, 320].map(x => `<path d="M${x} ${150 + Math.sin((x - 40) / 320 * Math.PI) * 28} v${20}" stroke="#222"/>`).join('');
      s += `<rect x="30" y="140" width="6" height="40" fill="#333"/><rect x="364" y="140" width="6" height="40" fill="#333"/>`;
      s += pines(r, W, 245, 22, 26, 54, '#0f3324');
      break;
    }
    default: {
      s += sky('#5f93d6', '#e4f0f6');
      s += mountain(ridge(r, W, 170, 110, 8), W, H, '#6c86b0', 108);
      s += mountain(ridge(r, W, 210, 80, 10), W, H, '#35507a', null);
      s += pines(r, W, 250, 20, 26, 50, '#10261f');
    }
  }
  return wrap(s, W, H);
}

// Big hero picture (1600x640): snowy peaks, pines, lake, rock and a hiker seen from behind.
function heroSVG() {
  const r = rng('hero');
  const W = 1600, H = 640;
  let s = `<defs>
  <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d3a63"/><stop offset=".55" stop-color="#6f93bd"/><stop offset="1" stop-color="#d4e0ec"/></linearGradient>
  <linearGradient id="lk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ec0d6"/><stop offset="1" stop-color="#4c7894"/></linearGradient>
  <filter id="bl"><feGaussianBlur stdDeviation="22"/></filter></defs>
  <rect width="${W}" height="${H}" fill="url(#sk)"/>
  <g filter="url(#bl)" fill="#fff" opacity=".45"><ellipse cx="520" cy="130" rx="260" ry="34"/><ellipse cx="1180" cy="90" rx="300" ry="30"/><ellipse cx="900" cy="230" rx="220" ry="24"/></g>`;
  // far peaks: one huge peak around x=1000
  const big = [[0, 380], [160, 300], [300, 340], [520, 230], [700, 300], [860, 190], [1000, 70], [1090, 170], [1200, 250], [1330, 310], [1460, 300], [1600, 330]];
  s += mountain(big, W, H, '#5b6f95', 230, 0.96);
  s += mountain(ridge(r, W, 400, 150, 14), W, H, '#3d5379', 320, 0.8);
  s += mountain(ridge(r, W, 470, 90, 16), W, H, '#26403f', null);
  s += `<path d="M1000 500 Q1200 470 1600 505 V560 H1000Z" fill="url(#lk)"/>`;
  s += pines(r, W, 520, 60, 40, 90, '#10261d', 0, 900) + pines(r, W, 530, 40, 40, 80, '#10261d', 1250, 1600);
  s += pines(r, W, 640, 30, 90, 190, '#0a1a14', 0, 520);
  // rock
  s += `<path d="M760 640 L840 540 Q960 500 1100 520 Q1260 520 1380 560 L1500 640Z" fill="#3a3d43"/><path d="M860 560 Q1000 520 1120 535 Q1250 540 1350 575" stroke="#5a5f68" stroke-width="5" fill="none" opacity=".7"/>`;
  // hiker, from behind
  s += `<g transform="translate(1108 640) scale(.78) translate(-1108 -640)">`;
  s += `<path d="M1010 540 q-10 -90 25 -160 q15 -30 55 -34 q50 -4 82 30 q38 70 22 160 z" fill="#15171c"/>`; // torso/jacket
  s += `<rect x="1030" y="360" width="150" height="190" rx="42" fill="#0d0f13"/><rect x="1048" y="380" width="114" height="60" rx="22" fill="#1b1e25"/><path d="M1068 340 q-14 70 -6 150 M1150 340 q14 70 6 150" stroke="#2a2e38" stroke-width="7" fill="none"/>`; // backpack + straps
  s += `<circle cx="1108" cy="318" r="34" fill="#2a1e1a"/><path d="M1074 316 q34 -44 68 0 q-4 -24 -34 -26 q-30 2 -34 26z" fill="#1a1210"/>`; // head + hair
  s += `<path d="M1000 548 q-30 40 -10 92 h190 q22 -50 -6 -92z" fill="#101216"/>`; // legs
  s += `</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMaxYMid slice">${s}</svg>`;
}

module.exports = { sceneSVG, heroSVG };
