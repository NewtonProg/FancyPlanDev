import fs from 'node:fs';
import path from 'node:path';

const WORK = path.resolve('c:/Users/hwleo/Documents/Daten/Shop/Pro/FancyPlan/FancyPlanWebDev/assets/mobile-icons/_work');
const OUT  = path.resolve('c:/Users/hwleo/Documents/Daten/Shop/Pro/FancyPlan/FancyPlanWebDev/assets/mobile-icons/vector');
fs.mkdirSync(OUT, { recursive: true });

const txt = fs.readFileSync(path.join(WORK, 'alpha_grid.txt'), 'utf8').split(/\r?\n/);
const [W, H] = txt[0].split(' ').map(Number);
const rows = txt.slice(1, 1 + H);
const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : (rows[y][x] === '1' ? 1 : 0);

// midpoints keyed by integer (coord*2)
const key = (x, y) => `${Math.round(x * 2)}_${Math.round(y * 2)}`;
const segs = [];
const pushSeg = (p, q) => segs.push([p, q]);
const T = (cx, cy) => [cx + 0.5, cy];
const R = (cx, cy) => [cx + 1, cy + 0.5];
const B = (cx, cy) => [cx + 0.5, cy + 1];
const L = (cx, cy) => [cx, cy + 0.5];

for (let cy = 0; cy < H - 1; cy++) {
  for (let cx = 0; cx < W - 1; cx++) {
    const a = at(cx, cy), b = at(cx + 1, cy), c = at(cx + 1, cy + 1), d = at(cx, cy + 1);
    const code = (a << 3) | (b << 2) | (c << 1) | d;
    switch (code) {
      case 0: case 15: break;
      case 1:  pushSeg(L(cx,cy), B(cx,cy)); break;
      case 2:  pushSeg(B(cx,cy), R(cx,cy)); break;
      case 3:  pushSeg(L(cx,cy), R(cx,cy)); break;
      case 4:  pushSeg(T(cx,cy), R(cx,cy)); break;
      case 5:  pushSeg(T(cx,cy), R(cx,cy)); pushSeg(B(cx,cy), L(cx,cy)); break; // saddle: 1s at TR,BL
      case 6:  pushSeg(T(cx,cy), B(cx,cy)); break;
      case 7:  pushSeg(T(cx,cy), L(cx,cy)); break;
      case 8:  pushSeg(T(cx,cy), L(cx,cy)); break;
      case 9:  pushSeg(T(cx,cy), B(cx,cy)); break;
      case 10: pushSeg(T(cx,cy), L(cx,cy)); pushSeg(R(cx,cy), B(cx,cy)); break; // saddle: 1s at TL,BR
      case 11: pushSeg(T(cx,cy), R(cx,cy)); break;
      case 12: pushSeg(L(cx,cy), R(cx,cy)); break;
      case 13: pushSeg(B(cx,cy), R(cx,cy)); break;
      case 14: pushSeg(L(cx,cy), B(cx,cy)); break;
    }
  }
}

// adjacency: pointKey -> list of {segIdx, otherPoint}
const adj = new Map();
segs.forEach((s, i) => {
  for (const [p, o] of [[s[0], s[1]], [s[1], s[0]]]) {
    const k = key(p[0], p[1]);
    if (!adj.has(k)) adj.set(k, []);
    adj.get(k).push({ i, p, o });
  }
});

const used = new Array(segs.length).fill(false);
const loops = [];
for (let i = 0; i < segs.length; i++) {
  if (used[i]) continue;
  const loop = [];
  let cur = segs[i][0], next = segs[i][1];
  used[i] = true;
  loop.push(cur);
  let guard = 0;
  while (guard++ < segs.length + 5) {
    loop.push(next);
    const cand = (adj.get(key(next[0], next[1])) || []).find(e => !used[e.i]);
    if (!cand) break;
    used[cand.i] = true;
    cur = next;
    next = cand.o;
    if (key(next[0], next[1]) === key(loop[0][0], loop[0][1])) { loop.push(next); break; }
  }
  if (loop.length >= 4) loops.push(loop);
}

// Ramer-Douglas-Peucker
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  let dmax = 0, idx = 0;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1e-9;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i];
    const dist = Math.abs((px - ax) * dy - (py - ay) * dx) / len;
    if (dist > dmax) { dmax = dist; idx = i; }
  }
  if (dmax > eps) {
    const left = rdp(pts.slice(0, idx + 1), eps);
    const right = rdp(pts.slice(idx), eps);
    return left.slice(0, -1).concat(right);
  }
  return [pts[0], pts[pts.length - 1]];
}

// RDP for a closed loop (loop[0] == loop[last]): split at farthest point to avoid degenerate baseline
function rdpClosed(loop, eps) {
  let pts = loop.slice();
  if (pts.length > 1 && key(pts[0][0], pts[0][1]) === key(pts[pts.length - 1][0], pts[pts.length - 1][1])) pts = pts.slice(0, -1);
  if (pts.length < 4) return pts;
  let far = 0, dm = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
    if (d > dm) { dm = d; far = i; }
  }
  const A = pts.slice(0, far + 1);
  const B = pts.slice(far).concat([pts[0]]);
  const ra = rdp(A, eps), rb = rdp(B, eps);
  return ra.slice(0, -1).concat(rb.slice(0, -1));
}

const EPS = 1.2;
const f = (n) => (Math.round(n * 10) / 10).toString();
let totalPts = 0;
const pathData = loops.map(loop => {
  const pts = rdpClosed(loop, EPS);
  totalPts += pts.length;
  if (pts.length < 3) return '';
  return 'M' + pts.map((p, i) => `${i ? 'L' : ''}${f(p[0])} ${f(p[1])}`).join(' ') + 'Z';
}).filter(Boolean).join(' ');

const BLUE = '#5271FF';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <path fill="${BLUE}" fill-rule="evenodd" d="${pathData}"/>
</svg>
`;
fs.writeFileSync(path.join(OUT, 'fp-logo-mono.svg'), svg);

const vd = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="${W}"
    android:viewportHeight="${H}">
    <path
        android:fillColor="${BLUE}"
        android:fillType="evenOdd"
        android:pathData="${pathData}"/>
</vector>
`;
fs.writeFileSync(path.join(OUT, 'fp_topbar.xml'), vd);

console.log(`loops=${loops.length} totalPoints=${totalPts} pathChars=${pathData.length}`);
