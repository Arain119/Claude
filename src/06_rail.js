/* ==========================================================================
   铁路：环岛线（复线）
   镇区为直线段（岛式站台的樱丘站、两处平交道、跨河铁桥），其余沿海岸绕岛一周：
   低处填筑路堤、高处开挖路堑；深挖处改为隧道，高填处改为高架桥。与环岛公路在西岸平交。
   ========================================================================== */
const TRACK_Z = [-65, -55]; // 镇区：0 = 外侧（北轨，顺 s 方向），1 = 内侧（南轨，逆 s 方向）
const RAIL_Y = TOWN_Y + 0.2, PLAT_Y = TOWN_Y + 1.3;
const RAIL_X0 = -125, RAIL_X1 = 108;
const CROSSINGS = []; // {id, x, z, s, active, arms:[], lamps:[], t}
const STATION = { x: 61 };
const RAIL_CTRL = [[-125, -60], [-60, -60], [0, -60], [60, -60], [115, -60], [142, -58], [166, -50], [180, -33], [185, -8], [185, 22], [182, 52], [174, 74], [158, 90], [132, 100], [100, 101], [50, 101], [0, 101], [-50, 101], [-100, 101], [-134, 97], [-158, 82], [-174, 58], [-179, 25], [-178, -12], [-170, -38], [-153, -55]];
const RAIL = { pts: [], len: 0, trk: [[], []], townS1: 0, cross: null, stops: [], xings: [] };
// 镇外的人行道口（樱花广场 → 海滩）
const RAIL_XINGS = [{ id: 'B', x: 0, z: 101, w: 6.4 }];
// s 是否靠近镇外道口（公路平交道或人行道口）
function railNearXing(s, d) { const L = RAIL.len; const near = (c) => { const ds = Math.abs(s - c); return Math.min(ds, L - ds) < d; }; return (RAIL.cross && near(RAIL.cross.s)) || RAIL.xings.some(x => near(x.s)); }
const RAIL_G = 0.03; // 最大坡度 30‰（地方线常见）
// 轨面最低高度：跨港口处抬高，让渔船能从桥下进出
function railMinY(x, z) { return x > 124 && z > -40 && z < 66 ? 4.8 : 2.6; }

function closedCatmull(P, spacing) {
  const out = []; const n = P.length;
  for (let i = 0; i < n; i++) {
    const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]); const m = Math.max(2, Math.ceil(L / spacing));
    for (let k = 0; k < m; k++) {
      const t = k / m, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}
function railSep(s) {
  const L = RAIL.len, a = RAIL.townS1;
  if (s <= a) return 10; if (s < a + 70) return lerp(10, 4, smooth(a, a + 70, s));
  if (s > L - 70) return lerp(4, 10, smooth(L - 70, L, s)); return 4;
}
/* 纵断面、填挖、隧道 / 高架判定，并把路基盖章到道路栅格（必须在地形生成前调用） */
/* 预规划（道路数据之前）：按自然地形求铁路纵断面，并找出与环岛公路的交点，让公路在交点处降到轨面高度 */
function railPrep() {
  const xz = closedCatmull(RAIL_CTRL, 2); const n = xz.length;
  const town = (i) => xz[i][0] > RAIL_X0 - 2 && xz[i][0] < RAIL_X1 + 2 && Math.abs(xz[i][1] + 60) < 0.8;
  let y = xz.map(p => Math.max(railMinY(p[0], p[1]), terrainNatural(p[0], p[1])));
  for (let pass = 0; pass < 4; pass++) { const ny = y.slice(); for (let i = 0; i < n; i++) { let a = 0; for (let k = -30; k <= 30; k++) a += y[(i + k + n) % n]; ny[i] = a / 61; } y = ny; }
  for (let i = 0; i < n; i++) if (town(i)) y[i] = TOWN_Y; else if (railMinY(xz[i][0], xz[i][1]) > 3) y[i] = railMinY(xz[i][0], xz[i][1]);
  const seg = (i, j) => Math.hypot(xz[i][0] - xz[j][0], xz[i][1] - xz[j][1]);
  for (let it = 0; it < 12; it++) {
    for (let k = 1; k <= n; k++) { const i = k % n, j = k - 1; if (town(i)) continue; const d = seg(i, j) * RAIL_G; y[i] = clamp(y[i], y[j] - d, y[j] + d); }
    for (let k = n - 2; k >= -1; k--) { const i = (k + n) % n, j = (k + 1) % n; if (town(i)) continue; const d = seg(i, j) * RAIL_G; y[i] = clamp(y[i], y[j] - d, y[j] + d); }
  }
  const rx = catmull(ringRoadCtrl(), 2); let best = 1e9, bi = -1, rj = -1;
  for (let i = 0; i < n; i++) { if (town(i)) continue; for (let j = 0; j < rx.length; j++) { const d = Math.hypot(rx[j][0] - xz[i][0], rx[j][1] - xz[i][1]); if (d < best) { best = d; bi = i; rj = j; } } }
  RAIL.prep = best < 4 ? { rj, y: Math.max(y[bi], terrainNatural(xz[bi][0], xz[bi][1]) + 0.3) } : null;
}
function buildRailData() {
  const xz = closedCatmull(RAIL_CTRL, 2); const n = xz.length;
  const S = [0]; for (let i = 1; i < n; i++) S.push(S[i - 1] + Math.hypot(xz[i][0] - xz[i - 1][0], xz[i][1] - xz[i - 1][1]));
  const L = S[n - 1] + Math.hypot(xz[0][0] - xz[n - 1][0], xz[0][1] - xz[n - 1][1]);
  const town = (i) => xz[i][0] > RAIL_X0 - 2 && xz[i][0] < RAIL_X1 + 2 && Math.abs(xz[i][1] + 60) < 0.8;
  const gnd = (x, z) => terrainH(x, z); // 已包含道路填挖
  let y = xz.map(p => Math.max(railMinY(p[0], p[1]), gnd(p[0], p[1])));
  for (let pass = 0; pass < 4; pass++) { const ny = y.slice(); for (let i = 0; i < n; i++) { let a = 0; for (let k = -30; k <= 30; k++) a += y[(i + k + n) % n]; ny[i] = a / 61; } y = ny; }
  const fix = new Map(); for (let i = 0; i < n; i++) if (town(i)) fix.set(i, TOWN_Y); else if (railMinY(xz[i][0], xz[i][1]) > 3) fix.set(i, railMinY(xz[i][0], xz[i][1]));
  // 与环岛公路的平交道：轨面与路面同高
  const road = ROADS[0]; let best = 1e9, bi = -1, bp = null;
  for (let i = 0; i < n; i++) { if (town(i)) continue; for (const p of road.pts) { const d = Math.hypot(p[0] - xz[i][0], p[2] - xz[i][1]); if (d < best) { best = d; bi = i; bp = p; } } }
  const seg = (i, j) => Math.hypot(xz[i][0] - xz[j][0], xz[i][1] - xz[j][1]);
  const grade = () => {
    for (const [i, v] of fix) y[i] = v;
    for (let it = 0; it < 12; it++) {
      for (let k = 1; k <= n; k++) { const i = k % n, j = k - 1; if (fix.has(i)) continue; const d = seg(i, j) * RAIL_G; y[i] = clamp(y[i], y[j] - d, y[j] + d); }
      for (let k = n - 2; k >= -1; k--) { const i = (k + n) % n, j = (k + 1) % n; if (fix.has(i)) continue; const d = seg(i, j) * RAIL_G; y[i] = clamp(y[i], y[j] - d, y[j] + d); }
    }
  };
  const y0 = y.slice(); grade();
  // 与公路相交：高差小 → 平交道；公路高 → 铁路从下方隧道穿过；铁路高 → 高架跨越
  let sepType = null;
  if (best < 4) {
    const diff = bp[1] - y[bi];
    if (Math.abs(diff) < 3) { y = y0; for (let k = -5; k <= 5; k++) fix.set((bi + k + n) % n, bp[1]); grade(); RAIL.cross = { i: bi, x: xz[bi][0], z: xz[bi][1], y: bp[1], road: bp }; }
    else sepType = diff > 0 ? 'tun' : 'bri';
  }
  // 结构判定
  const f = []; for (let i = 0; i < n; i++) { const t = gnd(xz[i][0], xz[i][1]); f.push(town(i) ? 'town' : t - y[i] > 7 ? 'tun' : (y[i] - t > 6 || riverDist(xz[i][0], xz[i][1]) < 10) ? 'bri' : 'grd'); }
  const runs = (val, minLen, repl) => { let i = 0; while (i < n) { if (f[i] !== val) { i++; continue; } let j = i; while (j < n && f[j] === val) j++; if (j - i < minLen) for (let k = i; k < j; k++) f[k] = repl; i = j; } };
  if (sepType) { const span = sepType === 'tun' ? 14 : 10; for (let k = -span; k <= span; k++) f[(bi + k + n) % n] = sepType; RAIL.over = { i: bi, type: sepType }; }
  runs('tun', 16, 'grd'); runs('bri', 6, 'grd');
  // 隧道之间过短的明挖段并入隧道
  { let i = 0; while (i < n) { if (f[i] !== 'grd') { i++; continue; } let j = i; while (j < n && f[j] === 'grd') j++; if (j - i < 14 && i > 0 && j < n && f[i - 1] === 'tun' && f[j] === 'tun') for (let k = i; k < j; k++) f[k] = 'tun'; i = j; } }
  for (let i = 0; i < n; i++) {
    const a = xz[(i - 1 + n) % n], b = xz[(i + 1) % n]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    RAIL.pts.push({ x: xz[i][0], y: y[i], z: xz[i][1], tx, tz, lx: tz, lz: -tx, s: S[i], f: f[i] });
  }
  RAIL.len = L;
  { let i = 0; while (i < n && RAIL.pts[i].f === 'town') i++; RAIL.townS1 = RAIL.pts[Math.max(0, i - 1)].s; }
  if (RAIL.cross) RAIL.cross.s = S[RAIL.cross.i];
  for (const x of RAIL_XINGS) { const s0 = railNearestS(x.x, x.z); const p = railAt(s0); RAIL.xings.push(Object.assign({}, x, { s: s0, x: p.x, z: p.z, y: p.y })); }
  // 铁路隧道覆土下限
  for (const p of RAIL.pts) if (p.f === 'tun') addTunnelCover(p.x, p.z, p.y + 9, 7);
  for (const p of RAIL.pts) if (p.f === 'grd') addClearance(p.x, p.z, p.y - 0.32, 5);
  // 路基盖章（镇区、隧道、高架除外）
  for (const p of RAIL.pts) {
    if (p.f !== 'grd') continue;
    const hw = 5, diff = Math.abs(gnd(p.x, p.z) - p.y), R = hw + 3 + diff * 1.6;
    const nearX = RAIL.cross && Math.hypot(p.x - RAIL.cross.x, p.z - RAIL.cross.z) < 14;
    const i0 = Math.floor((p.x - R - RG.x0) / RG.cell), i1 = Math.ceil((p.x + R - RG.x0) / RG.cell);
    const j0 = Math.floor((p.z - R - RG.z0) / RG.cell), j1 = Math.ceil((p.z + R - RG.z0) / RG.cell);
    for (let j = Math.max(0, j0); j <= Math.min(RG.nz - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(RG.nx - 1, i1); i++) {
      const cx = RG.x0 + (i + 0.5) * RG.cell, cz = RG.z0 + (j + 0.5) * RG.cell; const d = Math.hypot(cx - p.x, cz - p.z);
      if (d > R) continue; const w = smooth(R, hw + 0.8, d); const k = j * RG.nx + i;
      if (w > RG.w[k]) { RG.w[k] = w; RG.h[k] = p.y - (nearX ? 0.04 : 0.32); }
    }
  }
  planRailStops();
  // 各轨道中心线（左手通行：0 号轨在 s 方向左侧）
  for (const p of RAIL.pts) { const o = railSep(p.s) / 2; RAIL.trk[0].push([p.x + p.lx * o, p.y, p.z + p.lz * o]); RAIL.trk[1].push([p.x - p.lx * o, p.y, p.z - p.lz * o]); }
}
/* 车站：镇区樱丘站（岛式站台）+ 海边的汐见浜站、水田边的稻穗站（相对式站台），选在平缓的路基段 */
function planRailStops() {
  RAIL.stops.push({ name: '樱丘', roman: 'SAKURAGAOKA', code: 'S07', s: railNearestS(STATION.x, -60), half: 31, island: true });
  for (const [name, roman, code, tx, tz] of [['汐见浜', 'SHIOMIHAMA', 'S08', 60, 101], ['稻穗', 'INAHO', 'S09', -178, 8]]) {
    const P = RAIL.pts, n = P.length; const s0 = railNearestS(tx, tz); let best = null;
    for (let i = 0; i < n; i++) {
      const c = P[i]; const ds = Math.abs(c.s - s0); if (ds > 220) continue;
      let ok = true; for (let k = -18; k <= 18; k++) { const q = P[(i + k + n) % n]; if (q.f !== 'grd' || Math.abs(terrainH(q.x, q.z) - q.y) > 2.5) { ok = false; break; } }
      if (ok && (!best || ds < best.ds)) best = { ds, s: c.s };
    }
    if (best) RAIL.stops.push({ name, roman, code, s: best.s, half: 26, island: false });
  }
}
/* 沿线插值：中心线（k = -1）或某条轨道 */
function railIndex(s) { const P = RAIL.pts; s = ((s % RAIL.len) + RAIL.len) % RAIL.len; let lo = 0, hi = P.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (P[m].s <= s) lo = m; else hi = m - 1; } return [lo, s]; }
function railAt(s, k = -1) {
  const P = RAIL.pts; const [i, ss] = railIndex(s); const j = (i + 1) % P.length; const a = P[i], b = P[j];
  const segL = (j === 0 ? RAIL.len : b.s) - a.s; const t = segL > 0 ? clamp((ss - a.s) / segL, 0, 1) : 0;
  const o = k < 0 ? 0 : (k === 0 ? 1 : -1) * railSep(ss) / 2;
  const lx = lerp(a.lx, b.lx, t), lz = lerp(a.lz, b.lz, t);
  return { x: lerp(a.x, b.x, t) + lx * o, y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) + lz * o, tx: lerp(a.tx, b.tx, t), tz: lerp(a.tz, b.tz, t), lx, lz, f: t < 0.5 ? a.f : b.f };
}
function railNearestS(x, z) { let best = 1e9, bs = 0; for (const p of RAIL.pts) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < best) { best = d; bs = p.s; } } return bs; }

/* 沿路径扫掠截面（分段写入批次，便于视锥剔除）；prof = [[横向 u（左为正）, 竖向 v], ...] */
function sweep(path, prof, mk, col, o = {}) {
  const CH = 40; const E = o.closed ? prof.length : prof.length - 1;
  for (let c0 = 0; c0 < path.length - 1; c0 += CH) {
    const c1 = Math.min(path.length - 1, c0 + CH); const org = path[c0];
    const pos = [], idx = [];
    for (let e = 0; e < E; e++) {
      const pa = prof[e], pb = prof[(e + 1) % prof.length]; const base = pos.length / 3;
      for (let i = c0; i <= c1; i++) { const q = path[i]; for (const pr of [pa, pb]) pos.push(q.x + q.lx * pr[0] - org.x, q.y + pr[1] - org.y, q.z + q.lz * pr[0] - org.z); }
      for (let i = 0; i < c1 - c0; i++) { const a0 = base + i * 2, a1 = a0 + 1, b0 = a0 + 2, b1 = a0 + 3; idx.push(a0, b0, a1, a1, b0, b1); }
    }
    if (o.double) { const nv = pos.length / 3, ni = idx.length; for (let k = 0; k < nv * 3; k++) pos.push(pos[k]); for (let k = 0; k < ni; k += 3) idx.push(idx[k] + nv, idx[k + 2] + nv, idx[k + 1] + nv); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    addGeo(g, mk, new THREE.Matrix4().makeTranslation(org.x, org.y, org.z), col, Object.assign({ wuv: 0.5 }, o));
  }
}
const rect = (u0, u1, v0, v1) => [[u0, v0], [u0, v1], [u1, v1], [u1, v0]]; // 外法线朝外的闭合矩形截面
const railPath = (k, i0, i1, lat = 0) => { const out = []; const P = RAIL.pts, n = P.length; for (let i = i0; i <= i1; i++) { const p = P[(i + n) % n]; const o = (k < 0 ? 0 : (k === 0 ? 1 : -1) * railSep(p.s) / 2) + lat; out.push({ x: p.x + p.lx * o, y: p.y, z: p.z + p.lz * o, lx: p.lx, lz: p.lz, tx: p.tx, tz: p.tz, s: p.s, f: p.f }); } return out; };
// 连续区段 [[i0, i1, f]]
function railRuns() { const P = RAIL.pts, out = []; let i = 0; while (i < P.length) { let j = i; while (j + 1 < P.length && P[j + 1].f === P[i].f) j++; out.push([i, j, P[i].f]); i = j + 1; } return out; }

function buildTracks() {
  const P = RAIL.pts, n = P.length;
  const townGaps = [[-4.6, 4.6], [95.4, 104.6], [22.6, 26.6]];
  const inGap = (p) => (p.f === 'town' && townGaps.some(g => p.x > g[0] && p.x < g[1])) || (RAIL.cross && Math.abs(p.s - RAIL.cross.s) < 6.5) || RAIL.xings.some(x => Math.abs(p.s - x.s) < x.w / 2 + 0.2);
  for (const k of [0, 1]) {
    const path = railPath(k, 0, n); // 闭合：多取一个点
    // 道砟（梯形截面）
    sweep(path, [[-2.0, -0.45], [-1.45, 0.02], [1.45, 0.02], [2.0, -0.45]], 'ballast', 0xffffff, { wuv: 0.6 });
    // 钢轨
    for (const r of [-0.533, 0.533]) { sweep(path, [[r - 0.035, 0.08], [r - 0.035, 0.2], [r + 0.035, 0.2], [r + 0.035, 0.08]], 'rail', 0x8d8682, { wuv: 0 }); }
    // 枕木
    let acc = 0;
    for (let i = 0; i < n; i++) {
      const a = path[i], b = path[i + 1]; const L = Math.hypot(b.x - a.x, b.z - a.z);
      for (; acc < L; acc += 0.62) {
        const t = acc / L; const x = lerp(a.x, b.x, t), z = lerp(a.z, b.z, t), y = lerp(a.y, b.y, t);
        const p = P[i]; if (inGap({ x, f: p.f, s: p.s + acc })) continue;
        addGeo(G.box, 'concrete', MX(x, y + 0.06, z, Math.atan2(-a.tz, a.tx), 0.22, 0.1, 2.1), 0xc4c0b8);
      }
      acc -= L;
    }
  }
  // 镇区道口铺板
  for (const g of townGaps) { const cx = (g[0] + g[1]) / 2, w = g[1] - g[0]; WK.box('concrete', cx, RAIL_Y - 0.1, -60, w, 0.2, 13.5, 0xb9b5ad, { wuv: 0.6, solid: { walk: true } }); for (const tz of TRACK_Z) for (const s of [-0.62, 0.62]) WK.box('vcNoShadow', cx, RAIL_Y + 0.001, tz + s * 0.9, w, 0.01, 0.12, 0x3a3a3a); }
  // 跨河铁桥（镇区）
  const bx = -74.8;
  WK.box('concrete', bx, TOWN_Y - 0.35, -60, 20, 0.5, 15, 0xb5b0a6, { solid: { walk: true }, wuv: 0.5 });
  for (const s of [-1, 1]) { WK.box('paint', bx, TOWN_Y - 0.9, -60 + s * 7.3, 20, 1.2, 0.3, 0x3f6b5a); WK.box('paint', bx, TOWN_Y + 0.7, -60 + s * 7.4, 20, 0.08, 0.08, 0x3f6b5a); for (let i = 0; i < 11; i++) WK.box('paint', bx - 10 + i * 2, TOWN_Y + 0.35, -60 + s * 7.4, 0.08, 0.7, 0.08, 0x3f6b5a); }
  for (const s of [-1, 1]) WK.box('concrete', bx + s * 9.8, TOWN_Y - 1.6, -60, 1.6, 3.4, 16, 0xa9a49a, { wuv: 0.5 });
  // 隧道与高架
  for (const [i0, i1, f] of railRuns()) {
    if (f === 'tun') buildRailTunnel(i0, i1);
    else if (f === 'bri') buildRailViaduct(i0, i1);
  }
  // 环岛公路平交道
  if (RAIL.cross) {
    const c = RAIL.cross, p = railAt(c.s);
    const K = new Kit(c.x, c.y, c.z, Math.atan2(-p.tz, p.tx));
    K.box('concrete', 0, 0.1, 0, 12.5, 0.2, railSep(c.s) + 7, 0xb9b5ad, { wuv: 0.6, solid: { walk: true } });
    for (const sd of [-1, 1]) for (const r of [-0.62, 0.62]) K.box('vcNoShadow', 0, 0.205, sd * railSep(c.s) / 2 + r * 0.9, 12.5, 0.01, 0.12, 0x3a3a3a);
    buildCrossingAt('W', c.x, c.y, c.z, Math.atan2(-p.tz, p.tx), railSep(c.s) / 2 + 4.2, 4.6, c.s);
  }
  // 人行道口：铺板 + 警报器 + 栏杆
  for (const c of RAIL.xings) {
    const p = railAt(c.s); const ry = Math.atan2(-p.tz, p.tx); const K = new Kit(c.x, c.y, c.z, ry);
    K.box('concrete', 0, 0.1, 0, c.w, 0.2, railSep(c.s) + 6, 0xb9b5ad, { wuv: 0.6, solid: { walk: true } });
    for (const sd of [-1, 1]) for (const r of [-0.62, 0.62]) K.box('vcNoShadow', 0, 0.205, sd * railSep(c.s) / 2 + r * 0.9, c.w, 0.01, 0.12, 0x3a3a3a);
    buildCrossingAt(c.id, c.x, c.y, c.z, ry, railSep(c.s) / 2 + 3.2, c.w / 2 + 0.3, c.s);
  }
  buildRailStations();
  buildCatenary();
  buildRailFences();
}
/* 隧道：两端洞门 + 洞内暗色拱壁（双面），不对地形盖章，山体自然遮住列车 */
function buildRailTunnel(i0, i1) {
  const path = railPath(-1, i0, i1);
  sweep(path, [[-5.2, -0.5], [-5.2, 4.8], [-3.6, 6.6], [0, 7.3], [3.6, 6.6], [5.2, 4.8], [5.2, -0.5]].reverse(), 'vcNoShadow', 0x16171a, { wuv: 0 }); // 法线朝内：只从洞内可见
  sweep(path, [[-6.0, -6], [-6.0, 5.0], [-3.9, 7.3], [0, 8.0], [3.9, 7.3], [6.0, 5.0], [6.0, -6]], 'concrete', 0xb9b5ab, { wuv: 0.4 }); // 外壳（露出山体时为明洞）
  const P = RAIL.pts, n = P.length;
  for (const [i, sign] of [[i0, 1], [i1, -1]]) {
    const p = P[(i + n) % n]; const tx = p.tx * sign, tz = p.tz * sign; // 指向隧道内
    tunnelPortalAt(p.x, p.y - 0.45, p.z, Math.atan2(-tx, -tz), sign > 0 ? '潮 见 隧 道' : '星 见 隧 道');
  }
}
function tunnelPortalAt(x, y, z, ry, name) {
  const K = new Kit(x, y, z, ry);
  const sh = new THREE.Shape(); sh.moveTo(-12, 0); sh.lineTo(12, 0); sh.lineTo(12, 12); sh.lineTo(-12, 12); sh.closePath();
  const h = new THREE.Path(); h.moveTo(-5.2, 0); h.lineTo(5.2, 0); h.lineTo(5.2, 4.8); h.absarc(0, 4.8, 5.2, 0, Math.PI, false); h.lineTo(-5.2, 0); sh.holes.push(h);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 1.4, bevelEnabled: false }); g.translate(0, 0, -1.4);
  K.geo('stone', g, 0, 0, 0, 0xc8c2b6, { wuv: 0.35 });
  K.box('concrete', 0, 12.3, -0.4, 25, 0.6, 2.0, 0xb8b2a6);
  for (const s of [-1, 1]) K.box('stone', s * 12.6, 5, 1.2, 1.2, 10, 5, 0xbdb7aa, { wuv: 0.35, ry: s * 0.35 });
  const uv = allocSign(220, 60, (g2, w, hh) => { g2.fillStyle = '#e9e4d8'; g2.fillRect(0, 0, w, hh); g2.fillStyle = '#3a3a3a'; g2.font = `400 34px ${FONT.wei}`; g2.textAlign = 'center'; g2.fillText(name, w / 2, 42); });
  K.plane('sign', 0, 10.6, 0.02, 3.4, 0.95, 0xffffff, { uvr: uv });
}
/* 高架：箱梁 + 桥墩 + 栏板 */
function buildRailViaduct(i0, i1) {
  const path = railPath(-1, i0 - 2, i1 + 2);
  sweep(path, rect(-4.8, 4.8, -1.9, -0.45), 'concrete', 0xc2bdb3, { wuv: 0.4, closed: true });
  for (const sd of [-1, 1]) sweep(path, sd > 0 ? rect(4.6, 4.9, -0.5, 0.9) : rect(-4.9, -4.6, -0.5, 0.9), 'concrete', 0xcfcac0, { wuv: 0.4, closed: true });
  let last = -99;
  for (const q of path) {
    if (q.s - last < 20) continue; last = q.s;
    const gy = terrainH(q.x, q.z); const top = q.y - 1.9; if (top - gy < 1) continue;
    const K = new Kit(q.x, gy, q.z, Math.atan2(-q.tz, q.tx));
    K.box('concrete', 0, (top - gy + 1) / 2 - 1, 0, 1.6, top - gy + 1, 6.5, 0xb8b3a9, { wuv: 0.4, solid: true });
    K.box('concrete', 0, top - gy - 0.5, 0, 2.2, 1.0, 9.4, 0xb8b3a9, { wuv: 0.4 });
  }
}
/* 接触网：门型支柱（两侧立柱 + 横梁），每条轨道上方吊挂承力索与接触线 */
function buildCatenary() {
  const attach = [[], []]; let last = -99;
  for (const p of RAIL.pts) {
    if (p.s - last < 42) continue;
    if (p.f === 'tun') { last = p.s; attach[0].push(null); attach[1].push(null); continue; }
    if (p.f === 'town' && (Math.abs(p.x) < 7 || Math.abs(p.x - 100) < 7 || Math.abs(p.x - 24.6) < 5 || Math.abs(p.x + 74.8) < 12)) continue;
    if (railNearXing(p.s, 10)) continue;
    last = p.s;
    const half = railSep(p.s) / 2 + 2.6; const K = new Kit(p.x, p.y, p.z, Math.atan2(-p.tz, p.tx));
    for (const sd of [-1, 1]) { K.cyl('concrete', 0, 3.6, sd * half, 0.16, 7.2, 0xc9c9c4, { rt: 0.75, seg: 8 }); }
    K.box('paint', 0, 6.6, 0, 0.14, 0.14, half * 2, 0x7d8a8f);
    for (const k of [0, 1]) { const o = (k === 0 ? -1 : 1) * railSep(p.s) / 2; K.box('vc', 0, 6.0, o, 0.05, 1.2, 0.05, 0x7d8a8f); attach[k].push(K.w(0, 0, o)); }
  }
  for (const k of [0, 1]) {
    const A = attach[k];
    for (let i = 0; i < A.length; i++) {
      const a = A[i], b = A[(i + 1) % A.length]; if (!a || !b) continue;
      if (Math.hypot(a[0] - b[0], a[2] - b[2]) > 60) continue;
      addWire([a[0], a[1] + 5.3, a[2]], [b[0], b[1] + 5.3, b[2]], 0.02, 2); addWire([a[0], a[1] + 6.1, a[2]], [b[0], b[1] + 6.1, b[2]], 0.35, 6);
    }
  }
}
/* 相对式站台的小站：两侧站台、坡道、候车棚、站名牌、长椅、灯 */
function buildRailStations() {
  RAIL.stops.forEach((st, si) => {
    if (st.island) return;
    const [ic] = railIndex(st.s); const P = RAIL.pts, n = P.length; const span = Math.round(st.half / 2);
    const mid = P[ic]; const ry = Math.atan2(-mid.tz, mid.tx);
    const prev = RAIL.stops[(si - 1 + RAIL.stops.length) % RAIL.stops.length], next = RAIL.stops[(si + 1) % RAIL.stops.length];
    for (const sd of [1, -1]) {
      const lat = sd * (railSep(st.s) / 2 + 1.6 + 1.4);
      const path = railPath(-1, ic - span, ic + span, lat);
      sweep(path, rect(-1.4, 1.4, -8, 1.3), 'concrete', 0xc9c5bd, { wuv: 0.5, closed: true }); // 站台挡土墙一直落到地面
      sweep(path, [[-1.38, 1.31], [1.38, 1.31]], 'paving', 0xe9e5dc, { wuv: 0.45 });
      const e = -sd; // 靠轨道一侧
      sweep(path, [[e > 0 ? 1.2 : -1.38, 1.325], [e > 0 ? 1.38 : -1.2, 1.325]], 'vcNoShadow', 0xf4f4f0, { wuv: 0 });
      sweep(path, [[e > 0 ? 0.55 : -0.85, 1.33], [e > 0 ? 0.85 : -0.55, 1.33]], 'tactile', 0xffffff, { wuv: 1 });
      for (let i = 0; i < path.length - 1; i += 2) { const a = path[i], b = path[Math.min(path.length - 1, i + 2)]; addCollider((a.x + b.x) / 2, (a.z + b.z) / 2, Math.hypot(b.x - a.x, b.z - a.z) / 2 + 0.05, 1.4, Math.atan2(-a.tz, a.tx), a.y - 0.7, a.y + 1.3); }
      // 坡道：选站台两端中与地面高差较小的一端，沿线路方向下到地面；高差过大（悬崖）则不设
      const ends = [[path[path.length - 1], 1], [path[0], -1]].map(([e, d]) => { const g = terrainH(e.x + e.tx * d * 9, e.z + e.tz * d * 9); return { e, d, g, dh: Math.abs(e.y + 1.3 - g) }; }).sort((a, b) => a.dh - b.dh);
      const { e: end0, d: dirE, g, dh } = ends[0];
      if (dh <= 3.2) {
        const end = Object.assign({}, end0, { tx: end0.tx * dirE, tz: end0.tz * dirE }); const top = end.y + 1.3;
        const rx = end.x + end.tx * 4.6, rz = end.z + end.tz * 4.6;
        const KR = new Kit(rx, (top + g) / 2, rz, Math.atan2(-end.tz, end.tx));
        KR.box('concrete', 0, -0.15, 0, 9.2, 0.3, 2.6, 0xc9c5bd, { rz: -Math.atan2(top - g, 9.2), wuv: 0.5, noCol: true });
        for (const r of [-1, 1]) KR.box('vc', 0, 0.75, r * 1.25, 9.2, 0.05, 0.05, 0x9aa0a6, { rz: -Math.atan2(top - g, 9.2), noCol: true });
        addRamp(rx, rz, 1.3, 4.6, Math.atan2(end.tx, end.tz), top, g);
      }
      // 候车棚、站名牌、长椅、灯
      const c = path[Math.floor(path.length / 2)]; const K = new Kit(c.x, c.y + 1.3, c.z, ry);
      const back = sd * 1.05; // 远离轨道一侧
      for (const x of [-3, 3]) K.box('paint', x, 1.3, back, 0.12, 2.6, 0.12, 0x7d8a8f);
      K.box('metal', 0, 2.65, sd * 0.55, 7, 0.08, 1.9, 0xd6dbe0, { rx: -sd * 0.08, noCol: true });
      K.box('paint', 0, 1.25, back + sd * 0.1, 6.4, 2.2, 0.05, 0x9fb2bd);
      for (const x of [-1.6, 1.6]) { const B = new Kit(...K.w(x, 0, sd * 0.6), ry + (sd > 0 ? Math.PI : 0)); for (let i = 0; i < 3; i++) B.box('paint', -0.5 + i * 0.5, 0.45, 0, 0.44, 0.06, 0.42, 0x3a8fb7); B.box('vc', 0, 0.22, 0, 1.5, 0.06, 0.1, 0x777777); }
      const uv = allocSign(560, 220, (g2, w, h) => {
        g2.fillStyle = '#ffffff'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#e48fa6'; g2.fillRect(0, 150, w, 70);
        g2.fillStyle = '#222'; g2.font = `900 ${st.name.length > 2 ? 76 : 92}px ${FONT.sans}`; g2.textAlign = 'center'; g2.fillText(st.name.split('').join(' '), w / 2, 100);
        g2.font = `700 24px ${FONT.sans}`; g2.fillText(st.roman, w / 2, 135);
        g2.fillStyle = '#fff'; g2.font = `700 22px ${FONT.sans}`; g2.textAlign = 'left'; g2.fillText('← ' + prev.name, 16, 190); g2.textAlign = 'right'; g2.fillText(next.name + ' →', w - 16, 190);
        g2.fillStyle = '#26375e'; g2.beginPath(); g2.arc(w - 50, 50, 28, 0, TAU); g2.fill(); g2.fillStyle = '#fff'; g2.font = `900 22px ${FONT.sans}`; g2.textAlign = 'center'; g2.fillText(st.code, w - 50, 58);
      });
      for (const x of [-8, 8]) { for (const f of [-1, 1]) K.plane('sign', x, 2.0, f * 0.04, 2.4, 0.94, 0xffffff, { uvr: uv, ry: f > 0 ? 0 : Math.PI }); K.box('vc', x, 2.0, 0, 2.5, 1.04, 0.06, 0x5a6670); for (const r of [-1, 1]) K.box('vc', x + r * 1.1, 0.75, 0, 0.08, 1.5, 0.08, 0x5a6670); }
      for (const x of [-12, 0, 12]) { K.cyl('paint', x, 1.8, back, 0.06, 3.6, 0x5a6670, { seg: 8 }); K.box('glow', x, 3.55, back - sd * 0.3, 0.5, 0.06, 0.16, 0xfafafa); const hp = K.w(x, 3.4, back - sd * 0.3); addHalo(hp[0], hp[1], hp[2], 1.8, 0xf2f6ff); const lp = K.w(x, 0, back - sd * 0.6); addLightPool(lp[0], c.y + 1.3, lp[2], 3.5, 0xe8f0ff); }
    }
    const pl = railAt(st.s); const inl = islandC(pl.x + pl.lx * 20, pl.z + pl.lz * 20) > islandC(pl.x - pl.lx * 20, pl.z - pl.lz * 20) ? 1 : -1; // 放在岛内一侧
    addPlace(st.name + '站', pl.x + pl.lx * inl * (railSep(st.s) / 2 + 6.5), pl.z + pl.lz * inl * (railSep(st.s) / 2 + 6.5), Math.atan2(-pl.lx * inl, -pl.lz * inl), 'station2');
  });
}
/* 线路两侧的防护栅栏（镇外、路基段），在道口与车站处断开 */
function buildRailFences() {
  for (const [i0, i1, f] of railRuns()) {
    if (f !== 'grd') continue;
    for (const sd of [-1, 1]) {
      let last = -99, prev = null;
      for (let i = i0; i <= i1; i++) {
        const p = RAIL.pts[i]; if (p.s - last < 3) continue;
        if (railNearXing(p.s, 12)) { prev = null; continue; }
        if (RAIL.stops.some(st => Math.abs(p.s - st.s) < st.half + 6)) { prev = null; continue; }
        last = p.s; const o = sd * (railSep(p.s) / 2 + 3.4); const x = p.x + p.lx * o, z = p.z + p.lz * o; const y = terrainH(x, z);
        WK.cyl('paint', x, y + 0.6, z, 0.035, 1.2, 0x6d7a72, { seg: 6 });
        if (prev) { const dx = x - prev[0], dz = z - prev[2], L = Math.hypot(dx, dz); const K = new Kit((x + prev[0]) / 2, (y + prev[1]) / 2, (z + prev[2]) / 2, Math.atan2(-dz, dx));
          K.box('vcNoShadow', 0, 1.1, 0, L, 0.04, 0.04, 0x6d7a72); K.box('vcNoShadow', 0, 0.55, 0, L, 0.04, 0.04, 0x6d7a72, { rz: Math.atan2(y - prev[1], L) }); }
        prev = [x, y, z];
      }
    }
  }
}

/* ---------------- 站台与车站 ---------------- */
function buildStation() {
  const x0 = 30, x1 = 92, zN = -63.3, zS = -56.7, cx = (x0 + x1) / 2, cz = (zN + zS) / 2;
  WK.box('concrete', cx, (TOWN_Y - 0.3 + PLAT_Y) / 2, cz, x1 - x0, PLAT_Y - TOWN_Y + 0.3, zS - zN, 0xc9c5bd, { solid: true, wuv: 0.5 });
  WK.box('paving', cx, PLAT_Y + 0.01, cz, x1 - x0 - 0.2, 0.02, zS - zN - 0.2, 0xe9e5dc, { wuv: 0.45 });
  for (const s of [-1, 1]) {
    const ez = s < 0 ? zN : zS;
    WK.box('vcNoShadow', cx, PLAT_Y + 0.025, ez - s * 0.15, x1 - x0, 0.01, 0.3, 0xf4f4f0);
    WK.box('tactile', cx, PLAT_Y + 0.03, ez - s * 0.95, x1 - x0, 0.012, 0.3, 0xffffff, { wuv: 1 });
  }
  // 坡道（西端）→ 构内道口
  addRamp(26.8, -60, 1.1, 3.2, Math.PI / 2, RAIL_Y, PLAT_Y);
  WK.box('concrete', 26.8, (RAIL_Y + PLAT_Y) / 2 - 0.35, -60, 6.4, 0.6, 2.2, 0xc9c5bd, { rz: Math.atan2(PLAT_Y - RAIL_Y, 6.4), wuv: 0.5 });
  for (const s of [-1, 1]) WK.box('vc', 26.8, PLAT_Y - 0.1, -60 + s * 1.15, 6.4, 0.06, 0.06, 0x9aa0a6, { rz: Math.atan2(PLAT_Y - RAIL_Y, 6.4) });
  WK.box('concrete', 24.6, RAIL_Y - 0.05, -60, 1.0, 0.1, 2.2, 0xb9b5ad, { solid: { walk: true } });
  WK.box('paving', 24.6, TOWN_Y + 0.05, -51.5, 4, 0.1, 3, 0xe0d8cc, { wuv: 0.5 });
  // 雨棚
  const cy = PLAT_Y + 3.2;
  for (let x = 38; x <= 84; x += 6.5) { WK.cyl('paint', x, (PLAT_Y + cy) / 2, cz, 0.12, cy - PLAT_Y, 0x7d8a8f, { seg: 10 }); addCollider(x, cz, 0.15, 0.15, 0, PLAT_Y, cy, 'wall'); WK.box('paint', x, cy - 0.15, cz, 0.12, 0.2, 4.6, 0x7d8a8f); }
  for (const s of [-1, 1]) WK.box('metal', 61, cy + 0.12 + 0.12, cz + s * 1.3, 48, 0.08, 2.75, 0xd6dbe0, { rx: s * 0.09, wuv: 0.8 });
  for (let x = 40; x <= 82; x += 6.5) for (const s of [-1, 1]) { WK.box('glow', x + 3, cy - 0.05, cz + s * 1.4, 1.6, 0.05, 0.12, 0xfafafa); addHalo(x + 3, cy - 0.3, cz + s * 1.4, 2.0, 0xf2f6ff); addLightPool(x + 3, PLAT_Y, cz + s * 1.4, 4, 0xe8f0ff); }
  // 站名牌
  for (const x of [46, 76]) stationNameBoard(x, cz);
  const hUV = allocSign(400, 80, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#e48fa6'; g.fillRect(0, h - 12, w, 12); g.fillStyle = '#222'; g.font = `900 40px ${FONT.sans}`; g.textAlign = 'center'; g.fillText('樱丘  SAKURAGAOKA', w / 2, 50); });
  for (const s of [-1, 1]) WK.plane('sign', 61 + s * 0.01, cy - 0.65, cz, 3.2, 0.64, 0xffffff, { uvr: hUV, ry: s * Math.PI / 2 + Math.PI / 2 });
  // 挂钟
  const cUV = allocSignAlpha(128, 128, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 60, 0, TAU); g.fill(); g.strokeStyle = '#333'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#333'; for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.fillRect(64 + Math.cos(a) * 48 - 3, 64 + Math.sin(a) * 48 - 3, 6, 6); } });
  for (const s of [-1, 1]) WK.plane('signCut', 52.5, cy - 0.7, cz + s * 0.05, 0.6, 0.6, 0xffffff, { uvr: cUV, ry: s > 0 ? 0 : Math.PI });
  WK.box('vc', 52.5, cy - 0.3, cz, 0.04, 0.5, 0.04, 0x333333);
  // 长椅、自动售货机、候车室
  for (const x of [42, 57, 70]) for (const s of [-1, 1]) platformBench(x, cz + s * 1.2, s < 0 ? Math.PI : 0);
  vendingMachine(new Kit(80, PLAT_Y, cz + 0.4, Math.PI / 2), 0, 0, 0, 0xd9483b); vendingMachine(new Kit(80, PLAT_Y, cz - 0.7, Math.PI / 2), 0, 0, 0, 0x2a8f8f);
  const wr = new Kit(64, PLAT_Y, cz, 0);
  wr.box('vc', 0, 1.2, 0, 4, 0.06, 2.4, 0x7d8a8f); wr.box('vc', 0, 2.5, 0, 4.1, 0.1, 2.5, 0x7d8a8f);
  wr.box('glass', 0, 1.25, 1.2, 4, 2.5, 0.05, 0xffffff); wr.box('glass', 0, 1.25, -1.2, 4, 2.5, 0.05, 0xffffff); wr.box('glass', 2, 1.25, 0, 0.05, 2.5, 2.4, 0xffffff);
  addCollider(64, cz + 1.2, 2, 0.08, 0, PLAT_Y, PLAT_Y + 2.5, 'wall'); addCollider(64, cz - 1.2, 2, 0.08, 0, PLAT_Y, PLAT_Y + 2.5, 'wall'); addCollider(66, cz, 0.08, 1.2, 0, PLAT_Y, PLAT_Y + 2.5, 'wall');
  wr.box('wood', 0.5, 0.45, 0.7, 2.5, 0.08, 0.5, 0xb07a4a);
  // 时刻表与海报
  const ttUV = allocSign(180, 220, (g, w, h) => { g.fillStyle = '#fbfbf7'; g.fillRect(0, 0, w, h); g.fillStyle = '#26375e'; g.fillRect(0, 0, w, 30); g.fillStyle = '#fff'; g.font = `700 16px ${FONT.sans}`; g.fillText('樱丘站 时刻表', 10, 21); g.fillStyle = '#333'; g.font = `500 13px ${FONT.sans}`; for (let i = 0; i < 9; i++) g.fillText(`${(6 + i * 2).toString().padStart(2, '0')}  05 25 45   ${i % 2 ? '星见港' : '潮见崎'}`, 10, 52 + i * 19); });
  WK.plane('sign', 84.5, PLAT_Y + 1.5, cz, 0.9, 1.1, 0xffffff, { uvr: ttUV, ry: -Math.PI / 2 }); WK.box('vc', 84.55, PLAT_Y + 1.5, cz, 0.05, 1.2, 1.0, 0x555555); WK.box('vc', 84.6, PLAT_Y + 0.5, cz, 0.06, 1.0, 0.06, 0x555555);
  // 车站建筑
  const B = new Kit(48, TOWN_Y, -47.6, 0);
  B.box('plaster', 0, 2, -2.2, 16, 4, 4.4, 0xf3ebe0, { solid: true, wuv: 0.4 });
  gableRoof(B, 0, 4, -2.2, 16, 4.4, 1.4, 0x3f5a6b, 0, 0.6);
  B.box('vc', 0, 3.0, 0.7, 8, 0.12, 1.6, 0x7d8a8f); for (const s of [-1, 1]) B.box('vc', s * 3.8, 1.5, 1.4, 0.12, 3.0, 0.12, 0x7d8a8f);
  const bUV = allocSign(640, 110, (g, w, h) => { g.fillStyle = '#26375e'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = `400 62px ${FONT.wei}`; g.textAlign = 'center'; g.fillText('樱 丘 站', w / 2 - 80, 72); g.font = `700 22px ${FONT.sans}`; g.fillStyle = '#f4b8c8'; g.fillText('SAKURAGAOKA STA.', w / 2 + 170, 66); });
  B.plane('sign', 0, 3.55, 0.02, 6.4, 1.1, 0xffffff, { uvr: bUV });
  B.box('vc', -1.5, 1.2, 0.05, 3, 2.4, 0.1, 0x3a3f46); B.plane('glass', -1.5, 1.2, 0.12, 2.8, 2.2, 0xffffff);
  B.box('vc', 2.5, 0.7, 0.3, 1.2, 1.4, 0.5, 0x9aa8b2); B.plane('glow', 2.5, 1.1, 0.56, 0.9, 0.5, 0xd8ecff);
  for (let i = 0; i < 4; i++) windowAt(B, -7 + i * 1.6 + (i > 1 ? 9 : 0), 2.2, 0, 1.0, 1.0);
  // 站前自行车停放
  for (let i = 0; i < 8; i++) bicycleStatic(new Kit(30 + i * 0.8, TOWN_Y, -45.2, 0), 0, 0, Math.PI / 2, pick([0xd9483b, 0x2c5aa0, 0xffffff, 0xe48fa6, 0x2f7d5b, 0x222222]));
  WK.box('paving', 46, TOWN_Y + 0.03, -43.5, 46, 0.06, 7, 0xe8e0d4, { wuv: 0.45 });
  addPlace('樱丘站', 26, -47, Math.PI, 'station');
  addPlace('樱丘站 站台', 50, -60, -Math.PI / 2, 'platform');
}
function stationNameBoard(x, cz) {
  const uv = allocSign(560, 220, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e48fa6'; g.fillRect(0, 150, w, 70);
    g.fillStyle = '#222'; g.font = `900 92px ${FONT.sans}`; g.textAlign = 'center'; g.fillText('樱 丘', w / 2, 100);
    g.font = `700 24px ${FONT.sans}`; g.fillText('SAKURAGAOKA', w / 2, 135);
    g.fillStyle = '#fff'; g.font = `700 22px ${FONT.sans}`; g.textAlign = 'left'; g.fillText('← 星见港', 16, 182); g.font = `500 14px ${FONT.sans}`; g.fillText('HOSHIMIKŌ', 30, 204);
    g.textAlign = 'right'; g.font = `700 22px ${FONT.sans}`; g.fillText('潮见崎 →', w - 16, 182); g.font = `500 14px ${FONT.sans}`; g.fillText('SHIOMISAKI', w - 30, 204);
    g.fillStyle = '#26375e'; g.beginPath(); g.arc(w - 50, 50, 28, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.font = `900 22px ${FONT.sans}`; g.textAlign = 'center'; g.fillText('S07', w - 50, 58);
  });
  for (const s of [-1, 1]) WK.plane('sign', x, PLAT_Y + 2.0, cz + s * 0.04, 2.4, 0.94, 0xffffff, { uvr: uv, ry: s > 0 ? 0 : Math.PI });
  WK.box('vc', x, PLAT_Y + 2.0, cz, 2.5, 1.04, 0.06, 0x5a6670);
  for (const s of [-1, 1]) WK.box('vc', x + s * 1.1, PLAT_Y + 0.75, cz, 0.08, 1.5, 0.08, 0x5a6670);
}
function platformBench(x, z, ry) {
  const K = new Kit(x, PLAT_Y, z, ry);
  for (let i = 0; i < 4; i++) { K.box('paint', -0.75 + i * 0.5, 0.45, 0, 0.44, 0.06, 0.42, 0x3a8fb7); K.box('paint', -0.75 + i * 0.5, 0.72, -0.2, 0.44, 0.4, 0.05, 0x3a8fb7, { rx: -0.15 }); }
  K.box('vc', 0, 0.22, 0, 2.0, 0.06, 0.1, 0x777777); for (const s of [-1, 1]) K.box('vc', s * 0.9, 0.22, 0, 0.06, 0.44, 0.35, 0x777777);
  const seat = K.w(-0.5, 0, 0);
  addInteract({ x: seat[0], z: seat[2], r: 1.0, label: () => '在长椅上等车', act: () => GAME.sit(seat[0], PLAT_Y + 0.48, seat[2], ry) });
}

/* ---------------- 平交道 ---------------- */
const TEX_STRIPE = canvasTex(128, 32, (g, w, h) => { g.fillStyle = '#f6d04d'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; for (let x = -32; x < w + 32; x += 32) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 16, 0); g.lineTo(x + 32, 0); g.lineTo(x + 16, h); g.fill(); } }, { repeat: true });
const stripeMat = new THREE.MeshStandardMaterial({ map: TEX_STRIPE, roughness: 0.6 });
function buildCrossing(cx) { return buildCrossingAt(cx, cx, TOWN_Y, -60, 0, 9.2, 4.3, railNearestS(cx, -60)); }
/* 通用平交道：局部 x 沿铁路方向，警报柱位于道路两侧（lat = 离铁路中心线距离，along = 离道路中心线距离） */
function buildCrossingAt(id, cx, cy, cz, ry, lat, along, s) {
  const C = { id, x: cx, z: cz, s, active: false, t: 0, arm: 0, arms: [], lamps: [] };
  const K0 = new Kit(cx, cy, cz, ry);
  const setups = [[K0.w(-along, 0, lat), 1, ry], [K0.w(along, 0, -lat), 1, ry + Math.PI]];
  for (const [pp0, ad, fry] of setups) {
    const K = new Kit(pp0[0], cy, pp0[2], fry);
    K.cyl('vc', 0, 1.8, 0, 0.07, 3.6, 0xffffff, { seg: 10 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.6, 12), stripeMat); const pp = K.w(0, 0.8, 0); post.position.set(pp[0], pp[1], pp[2]); post.castShadow = true; scene.add(post);
    const xUV = allocSignAlpha(200, 200, (g, w, h) => { g.translate(100, 100); for (const a of [0.7, -0.7]) { g.save(); g.rotate(a); g.fillStyle = '#1a1a1a'; g.fillRect(-98, -16, 196, 32); g.fillStyle = '#f6d04d'; g.fillRect(-94, -12, 188, 24); g.restore(); } });
    for (const sd of [-1, 1]) K.plane('signCut', 0, 3.75, sd * 0.06, 1.1, 1.1, 0xffffff, { uvr: xUV, ry: sd > 0 ? 0 : Math.PI });
    K.box('vc', 0, 3.0, 0, 1.2, 0.12, 0.12, 0x222222);
    for (const sd of [-1, 1]) for (const f of [1, -1]) {
      K.cyl('vc', sd * 0.45, 3.0, f * 0.12, 0.2, 0.08, 0x111111, { rx: Math.PI / 2, seg: 16 });
      const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.15, 20), new THREE.MeshBasicMaterial({ color: 0x401010 }));
      const lp = K.w(sd * 0.45, 3.0, f * 0.17); lamp.position.set(lp[0], lp[1], lp[2]); lamp.rotation.y = fry + (f < 0 ? Math.PI : 0); scene.add(lamp);
      C.lamps.push({ m: lamp, s: sd });
      K.box('vc', sd * 0.45, 3.2, f * 0.22, 0.42, 0.04, 0.16, 0x222222, { rx: f * 0.4 });
    }
    K.box('vc', 0, 2.55, 0.08, 0.5, 0.2, 0.08, 0x111111); K.cyl('vc', 0, 4.45, 0, 0.14, 0.18, 0x222222, { seg: 12 });
    K.box('paint', 0.4 * ad, 0.6, 0.3, 0.35, 1.2, 0.35, 0xf2f2f0);
    const pivot = new THREE.Group(); const pv = K.w(0.4 * ad, 1.05, 0.55); pivot.position.set(pv[0], pv[1], pv[2]); pivot.rotation.y = fry; scene.add(pivot);
    const armLen = along + 0.1;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(armLen, 0.09, 0.09), stripeMat); arm.position.x = ad * (armLen / 2 + 0.1); arm.castShadow = true;
    const inner = new THREE.Group(); inner.add(arm); pivot.add(inner);
    C.arms.push({ g: inner, ad });
  }
  CROSSINGS.push(C);
  return C;
}
function updateCrossings(dt, t) {
  for (const C of CROSSINGS) {
    const want = trainsWantCross(C.s);
    if (want) C.t += dt; else C.t = 0;
    C.active = want;
    const target = want && C.t > 1.6 ? 1 : 0;
    C.arm += clamp(target - C.arm, -dt / 3.5, dt / 3.5);
    for (const a of C.arms) a.g.rotation.z = a.ad * (1 - C.arm) * 1.48;
    const blink = want ? (Math.floor(t * 2.4) % 2) : -1;
    for (const l of C.lamps) l.m.material.color.setHex(want && ((l.s > 0) === (blink === 1)) ? 0xff3322 : 0x401010);
  }
}

/* ---------------- 列车 ---------------- */
function buildTrainCar(isFront, isRear, idx) {
  const L = 18, W = 2.9, cream = 0xf4efe4, pink = 0xe48fa6, blue = 0x2c6ea0;
  const doors = [];
  const g = buildLocal(() => {
    const K = new Kit(0, 0, 0, 0);
    // 车底与转向架
    K.box('vc', 0, 0.85, 0, L - 0.6, 0.5, W - 0.3, 0x2f3236);
    for (const bx of [-6.3, 6.3]) { K.box('vc', bx, 0.45, 0, 2.6, 0.45, 2.2, 0x26282b); for (const wx of [-0.9, 0.9]) for (const s of [-1, 1]) K.cyl('vc', bx + wx, 0.43, s * 0.6, 0.43, 0.12, 0x3a3a3a, { rx: Math.PI / 2, seg: 14 }); }
    // 地板
    K.box('vc', 0, 1.12, 0, L, 0.08, W, 0x8f8a80);
    // 侧壁
    const doorX = [-5.8, 0, 5.8], dw = 1.3;
    for (const s of [-1, 1]) {
      const z = s * (W / 2 - 0.03);
      K.box('paint', 0, 1.6, z, L, 0.92, 0.06, cream);
      K.box('paint', 0, 1.98, z + s * 0.01, L, 0.1, 0.06, pink); K.box('paint', 0, 1.2, z + s * 0.01, L, 0.08, 0.06, blue);
      K.box('paint', 0, 3.25, z, L, 0.5, 0.06, cream);
      // 窗间立柱
      const posts = [-L / 2 + 0.2, -7.6, -6.45, -5.15, -4.0, -1.85, -0.65, 0.65, 1.85, 4.0, 5.15, 6.45, 7.6, L / 2 - 0.2];
      for (const px of posts) K.box('paint', px, 2.5, z, 0.32, 1.1, 0.06, cream);
      // 车窗
      for (const [a, b] of [[-8.8, -7.6], [-4.0, -1.85], [1.85, 4.0], [7.6, 8.8]]) K.plane('glass', (a + b) / 2, 2.5, z + s * 0.035, b - a, 1.0, 0xffffff, { ry: s > 0 ? 0 : Math.PI });
      for (const dx of doorX) { K.box('vc', dx, 2.03, z + s * 0.01, dw + 0.1, 0.05, 0.08, 0x8a8f94); }
    }
    // 车顶（椭圆半筒）
    const roof = new THREE.CylinderGeometry(1, 1, L, 20, 1, true, 0, Math.PI); roof.rotateZ(Math.PI / 2);
    K.geo('paint', roof, 0, 3.5, 0, 0xe4e1da, { sx: 1, sy: 0.32, sz: W / 2 });
    K.box('vc', 0, 3.47, 0, L, 0.02, W - 0.06, 0xf2f2ee);
    K.box('vc', 0, 3.86, 0, 7, 0.12, 0.8, 0x8a8f94);
    // 车内天花与灯
    K.box('vc', 0, 3.0, 0, L - 0.2, 0.04, W - 0.2, 0xf6f6f2);
    for (const s of [-0.55, 0.55]) K.box('glow', 0, 2.97, s, L - 1.5, 0.03, 0.14, 0xffffff);
    // 座椅（纵向）
    for (const s of [-1, 1]) for (const [a, b] of [[-8.6, -6.6], [-5.0, -0.8], [0.8, 5.0], [6.6, 8.6]]) {
      K.box('vc', (a + b) / 2, 1.52, s * 1.08, b - a, 0.14, 0.5, 0x3a7f7a); K.box('vc', (a + b) / 2, 1.85, s * 1.32, b - a, 0.55, 0.1, 0x3a7f7a);
      K.box('vc', (a + b) / 2, 1.35, s * 1.1, b - a, 0.2, 0.45, 0x55585c);
    }
    // 吊环与扶杆
    for (const s of [-0.75, 0.75]) {
      K.cyl('vc', 0, 2.75, s, 0.018, L - 1, 0xc9cdd1, { rz: Math.PI / 2, seg: 6 });
      for (let x = -8; x <= 8; x += 0.55) { if (Math.abs(x - 5.8) < 0.8 || Math.abs(x) < 0.8 || Math.abs(x + 5.8) < 0.8) continue; K.box('vcNoShadow', x, 2.6, s, 0.02, 0.28, 0.02, 0xf2f2f2); K.geo('vcNoShadow', new THREE.TorusGeometry(0.07, 0.012, 4, 12), x, 2.4, s, 0xf6d04d, { ry: Math.PI / 2 }); }
    }
    for (const dx of doorX) for (const s of [-1, 1]) K.cyl('vc', dx + s * 0.75, 2.05, 0, 0.02, 1.9, 0xc9cdd1, { seg: 6 });
    // 车内广告
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) K.box('vcNoShadow', -7.5 + i * 3, 2.95 - 0.12, s * 1.38, 0.9, 0.22, 0.02, pick([0xf4b8c8, 0x9fd2ee, 0xf6e08c, 0xc9e2b0]));
    // 车端
    for (const e of [-1, 1]) {
      const ex = e * L / 2;
      const isCab = (e > 0 && isFront) || (e < 0 && isRear);
      if (isCab) {
        K.box('paint', ex, 1.6, 0, 0.12, 0.95, W, cream); K.box('paint', ex + e * 0.01, 1.2, 0, 0.1, 0.1, W, blue); K.box('paint', ex + e * 0.01, 1.98, 0, 0.1, 0.12, W, pink);
        K.plane('glass', ex + e * 0.05, 2.5, 0, W - 0.3, 1.05, 0xffffff, { ry: e * Math.PI / 2 });
        K.box('paint', ex, 2.5, 0, 0.1, 1.1, 0.2, cream); K.box('paint', ex, 3.2, 0, 0.12, 0.5, W, cream);
        K.box('vc', ex + e * 0.07, 3.2, 0, 0.04, 0.32, 1.6, 0x111111);
        for (const s of [-1, 1]) { K.cyl('glow', ex + e * 0.07, 1.62, s * 1.0, 0.13, 0.05, 0xfffbe8, { rz: Math.PI / 2, seg: 12 }); K.box('glow', ex + e * 0.07, 1.35, s * 1.0, 0.04, 0.08, 0.25, 0xff3a2a); }
        K.box('vc', ex + e * 0.2, 0.9, 0, 0.4, 0.3, 0.9, 0x222222);
        // 驾驶台
        K.box('vc', ex - e * 0.6, 1.6, 0.4, 1.0, 0.8, 1.6, 0x4a4f55);
      } else {
        K.box('paint', ex, 2.3, 0, 0.1, 2.3, W, cream); K.box('vc', ex + e * 0.25, 2.1, 0, 0.5, 2.0, 1.2, 0x3a3a3a);
      }
    }
  });
  // 车门（可滑动）
  const doorMat = new THREE.MeshStandardMaterial({ color: 0xd9d6cf, roughness: 0.5 });
  for (const dx of [-5.8, 0, 5.8]) for (const s of [-1, 1]) for (const half of [-1, 1]) {
    const leaf = new THREE.Group();
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.64, 1.9, 0.05), doorMat); panel.position.y = 2.05; panel.castShadow = true;
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.75), MATS.glass.material); win.position.set(0, 2.45, s * 0.03); if (s < 0) win.rotation.y = Math.PI;
    leaf.add(panel, win); leaf.position.set(dx + half * 0.33, 0, s * (2.9 / 2 - 0.01)); g.add(leaf);
    doors.push({ g: leaf, base: dx + half * 0.33, half, side: s });
  }
  // 行先显示（前后）
  const destTex = canvasTex(256, 48, (c, w, h) => { c.fillStyle = '#0b0b0b'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffae3d'; c.font = `700 26px ${FONT.sans}`; c.textAlign = 'center'; c.fillText('普通  环岛线', w / 2, 33); });
  for (const e of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.28), new THREE.MeshBasicMaterial({ map: destTex })); m.position.set(e * 9.1, 3.2, 0); m.rotation.y = e * Math.PI / 2; g.add(m); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  scene.add(g);
  return { g, doors };
}
/* 两列车：0 号顺 s 方向走外侧轨，1 号逆 s 方向走内侧轨；各站停车 */
const TRAINS = [];
const TRAIN = { state: 'run', v: 0, x: 0 }; // 兼容旧接口（环境音）
const CAR_GAP = 18.2, TRAIN_HALF = CAR_GAP / 2 + 9.2;
function buildTrain() {
  for (let k = 0; k < 2; k++) {
    const T = { k, dir: k === 0 ? 1 : -1, cars: [], s: 0, v: 0, state: 'run', timer: 0, doors: 0, doorSide: 1, next: 0 };
    for (let i = 0; i < 2; i++) T.cars.push(buildTrainCar(i === 0, i === 1, i));
    // 起始位置：0 号在樱丘以西 120 m，1 号在线路另一侧
    T.s = k === 0 ? RAIL.stops[0].s - 140 : RAIL.stops[0].s + RAIL.len / 2;
    T.next = trainNextStop(T);
    TRAINS.push(T);
  }
}
const loopD = (a, b) => ((b - a) % RAIL.len + RAIL.len) % RAIL.len; // 从 a 沿 s 正向到 b 的距离
function trainNextStop(T) { let best = 1e9, bi = 0; RAIL.stops.forEach((st, i) => { const d = T.dir > 0 ? loopD(T.s, st.s) : loopD(st.s, T.s); if (d > 1 && d < best) { best = d; bi = i; } }); return bi; }
function trainsWantCross(cs) {
  for (const T of TRAINS) {
    const ahead = T.dir > 0 ? loopD(T.s, cs) : loopD(cs, T.s); const behind = RAIL.len - ahead;
    if (behind < TRAIN_HALF + 6 || ahead < TRAIN_HALF + 6) return true; // 列车正在通过
    const a = ahead - TRAIN_HALF; if (a < 0) continue;
    if (T.state === 'stop') { if (T.timer < 4 && a < 40) return true; continue; }
    if (a < 140 && a / Math.max(T.v, 2) < 9) return true;
  }
  return false;
}
function updateTrain(dt) {
  const VMAX = 15, ACC = 0.9, DEC = 1.1;
  for (const T of TRAINS) {
    const st = RAIL.stops[T.next];
    if (T.state === 'run') {
      const d = T.dir > 0 ? loopD(T.s, st.s) : loopD(st.s, T.s);
      let target = Math.min(VMAX, Math.sqrt(Math.max(0, 2 * DEC * d)));
      if (d < 0.1 || d > RAIL.len - 0.5) { T.state = 'stop'; T.timer = 16; T.v = 0; T.doorSide = st.island ? 1 : -1; if (AUDIO.trainChime && Math.hypot(PLAYER.pos.x - railAt(st.s).x, PLAYER.pos.z - railAt(st.s).z) < 120) AUDIO.trainChime(); }
      T.v += clamp(target - T.v, -DEC * dt * 1.6, ACC * dt);
      T.s = (T.s + T.v * T.dir * dt + RAIL.len) % RAIL.len;
    } else {
      T.timer -= dt;
      T.doors = clamp(T.doors + (T.timer > 2.4 && T.timer < 14.6 ? dt : -dt) * 1.4, 0, 1);
      if (T.timer <= 0) { T.state = 'run'; T.doors = 0; T.s = (T.s + T.dir * 0.5 + RAIL.len) % RAIL.len; T.next = trainNextStop(T); }
    }
    T.boxes = [];
    for (let i = 0; i < T.cars.length; i++) {
      const car = T.cars[i]; const sc = T.s + T.dir * (i === 0 ? CAR_GAP / 2 : -CAR_GAP / 2);
      const a = railAt(sc + T.dir * 6.3, T.k), b = railAt(sc - T.dir * 6.3, T.k);
      const fx = a.x - b.x, fz = a.z - b.z, fy = a.y - b.y; const L = Math.hypot(fx, fz) || 1;
      const cx = (a.x + b.x) / 2, cz = (a.z + b.z) / 2, cy = (a.y + b.y) / 2 + 0.2;
      car.g.position.set(cx, cy, cz); car.g.rotation.set(0, Math.atan2(-fz, fx), Math.atan2(fy, L), 'YXZ');
      for (const d of car.doors) d.g.position.x = d.base + (d.side === T.doorSide ? d.half * T.doors * 0.62 : 0);
      T.boxes.push({ x: cx, z: cz, y: cy, c: fx / L, s: fz / L });
    }
  }
  TRAIN.v = Math.max(...TRAINS.map(T => T.v));
}
/* 列车碰撞：返回把 (x,z) 推出车厢所需的位移，未碰撞返回 null */
function trainPush(x, z, y, r) {
  for (const T of TRAINS) for (const b of T.boxes || []) {
    if (y > b.y + 3.8 || y < b.y - 2) continue;
    const dx = x - b.x, dz = z - b.z; const u = dx * b.c + dz * b.s, w = -dx * b.s + dz * b.c;
    if (Math.abs(u) > 9.1 + r || Math.abs(w) > 1.5 + r) continue;
    const pw = (1.5 + r) - Math.abs(w), pu = (9.1 + r) - Math.abs(u);
    if (pw < pu) { const k = Math.sign(w) || 1; return [-b.s * pw * k, b.c * pw * k]; }
    const k = Math.sign(u) || 1; return [b.c * pu * k, b.s * pu * k];
  }
  return null;
}
function nearestTrainDist(x, z) { let m = 1e9; for (const T of TRAINS) for (const b of T.boxes || []) m = Math.min(m, Math.hypot(x - b.x, z - b.z)); return m; }
