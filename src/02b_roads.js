/* ==========================================================================
   环岛公路：控制点 → 平滑曲线 → 纵断面（限坡）→ 填挖地形 → 路面 / 标线 / 护栏 / 路灯
   ========================================================================== */
const ROAD_DEFS = [
  { id: 'ring', w: 7.4, auto: true, pts: [] },
];
const ROADS = []; // {def, pts:[[x,y,z,tx,tz,s]], len}
function catmull(pts, spacing) {
  const out = []; const P = pts;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]); const n = Math.max(2, Math.ceil(L / spacing));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(P[P.length - 1].slice()); return out;
}
/* 环岛公路：从镇北路西端出发，过樱川、在西北角穿过铁路，沿水田西侧南下，再沿海岸向东（铁路外侧临海），最后接回港口路南端 */
function ringRoadCtrl() {
  return [[-46, -80], [-62, -80], [-86, -80], [-110, -79], [-130, -72], [-146, -58], [-158, -40], [-162, -14], [-162, 20], [-160, 50], [-150, 70], [-130, 82], [-100, 86], [-60, 86], [-20, 86], [20, 86], [60, 86], [84, 84], [97, 75], [100, 62], [100, 47]];
}
function buildRoadData() {
  for (const def of ROAD_DEFS) {
    if (def.auto) def.pts = ringRoadCtrl();
    const xz = catmull(def.pts, 2); const n = xz.length;
    let y = xz.map(p => clamp(terrainNatural(p[0], p[1]), 1.6, 24)); // 高处以隧道穿过，不再翻山
    // 平滑
    // 平滑窗口 ±20 m：贴合地形起伏，避免远处山体把路面整体抬高成巨大路堤
    for (let pass = 0; pass < 3; pass++) { const ny = y.slice(); for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let k = -10; k <= 10; k++) { const j = clamp(i + k, 0, n - 1); s += y[j]; c++; } ny[i] = s / c; } y = ny; }
    // 两端接回镇区高度
    for (let i = 0; i < n; i++) { const e = Math.min(i, n - 1 - i); const k = smooth(28, 6, e); y[i] = lerp(y[i], TOWN_Y, k); }
    // 与铁路平交处：路面降到轨面高度（前后各 12 m 保持平直）
    const fixed = new Set(); if (def.auto && RAIL.prep) for (let k = -6; k <= 6; k++) { const i = RAIL.prep.rj + k; if (i >= 0 && i < n) { y[i] = RAIL.prep.y; fixed.add(i); } }
    // 坡度上限 8%
    const G = 0.08;
    for (let it = 0; it < 4; it++) {
      for (let i = 1; i < n; i++) { if (fixed.has(i)) continue; const d = Math.hypot(xz[i][0] - xz[i - 1][0], xz[i][1] - xz[i - 1][1]); y[i] = clamp(y[i], y[i - 1] - G * d, y[i - 1] + G * d); }
      for (let i = n - 2; i >= 0; i--) { if (fixed.has(i)) continue; const d = Math.hypot(xz[i][0] - xz[i + 1][0], xz[i][1] - xz[i + 1][1]); y[i] = clamp(y[i], y[i + 1] - G * d, y[i + 1] + G * d); }
    }
    // 结构：深挖 → 隧道，高填 → 桥
    const f = xz.map((p, i) => { const t = terrainNatural(p[0], p[1]); return t - y[i] > 8 ? 'tun' : (y[i] - t > 7 || riverDist(p[0], p[1]) < 9.5) ? 'bri' : 'grd'; });
    const runs = (val, minLen, repl) => { let i = 0; while (i < n) { if (f[i] !== val) { i++; continue; } let j = i; while (j < n && f[j] === val) j++; if (j - i < minLen) for (let k = i; k < j; k++) f[k] = repl; i = j; } };
    runs('tun', 14, 'grd'); runs('bri', 5, 'grd');
    { let i = 0; while (i < n) { if (f[i] !== 'grd') { i++; continue; } let j = i; while (j < n && f[j] === 'grd') j++; if (j - i < 12 && i > 0 && j < n && f[i - 1] === f[j] && f[j] !== 'grd') for (let k = i; k < j; k++) f[k] = f[j]; i = j; } }
    const pts = []; let s = 0;
    for (let i = 0; i < n; i++) {
      const a = xz[Math.max(0, i - 1)], b = xz[Math.min(n - 1, i + 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const L = Math.hypot(tx, tz) || 1; tx /= L; tz /= L;
      if (i) s += Math.hypot(xz[i][0] - xz[i - 1][0], xz[i][1] - xz[i - 1][1]);
      pts.push([xz[i][0], y[i], xz[i][1], tx, tz, s, f[i]]);
    }
    const road = { def, pts, len: s, hw: def.w / 2 }; ROADS.push(road);
    // 盖章到道路栅格
    // 隧道覆土下限（路堑在洞门处截止，隧道上方保留山体）
    for (const q of pts) if (q[6] === 'tun') addTunnelCover(q[0], q[2], q[1] + 8.6, road.hw + 2.6);
    for (const q of pts) if (q[6] === 'grd') addClearance(q[0], q[2], q[1] - 0.04, road.hw + 1.4);
    for (const p of pts) {
      if (p[6] !== 'grd') continue;
      const diff = Math.abs(terrainNatural(p[0], p[2]) - p[1]); const R = road.hw + 6 + diff * 1.9;
      const i0 = Math.floor((p[0] - R - RG.x0) / RG.cell), i1 = Math.ceil((p[0] + R - RG.x0) / RG.cell);
      const j0 = Math.floor((p[2] - R - RG.z0) / RG.cell), j1 = Math.ceil((p[2] + R - RG.z0) / RG.cell);
      for (let j = Math.max(0, j0); j <= Math.min(RG.nz - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(RG.nx - 1, i1); i++) {
        const cx = RG.x0 + (i + 0.5) * RG.cell, cz = RG.z0 + (j + 0.5) * RG.cell; const d = Math.hypot(cx - p[0], cz - p[2]);
        if (d > R) continue; const w = smooth(R, road.hw + 1.3, d); const k = j * RG.nx + i;
        if (w > RG.w[k]) { RG.w[k] = w; RG.h[k] = p[1] - 0.04; }
      }
    }
  }
}
regMat('marking', stdMat({ roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), { cast: false });
regMat('rail', stdMat({ roughness: 0.35, metalness: 0.6, envMapIntensity: 1.2 }), { tint: 1 });
function ribbon(road, off0, off1, dy, mk, col, o = {}) {
  const pos = [], idx = []; const P = road.pts; const step = o.step || 1;
  let k = 0;
  for (let i = 0; i < P.length; i += step) {
    const p = P[i]; const lx = p[4], lz = -p[3]; // 左法线
    if ((o.dash && Math.floor(p[5] / o.dash[0]) % o.dash[1] !== 0) || (o.only && !o.only(p))) { k = 0; continue; }
    pos.push(p[0] + lx * off0, p[1] + dy, p[2] + lz * off0, p[0] + lx * off1, p[1] + dy, p[2] + lz * off1);
    const v = pos.length / 3 - 2; if (k > 0) idx.push(v - 2, v - 1, v, v - 1, v + 1, v); k++;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2));
  // 法线统一朝上，避免由于索引方向导致翻转
  const nm = g.attributes.normal; for (let i = 0; i < nm.count; i++) nm.setXYZ(i, 0, 1, 0);
  addGeo(g, mk, new THREE.Matrix4(), col, Object.assign({ nochunk: false }, o));
}
function buildRoadMeshes() {
  for (const road of ROADS) {
    const hw = road.hw;
    ribbon(road, hw, -hw, 0.05, 'asphalt', 0xffffff, { wuv: 0.22 });
    const grd = (p) => p[6] === 'grd' || p[6] == null;
    ribbon(road, hw + 1.4, hw, 0.0, 'gravel', 0xc8c2b6, { wuv: 0.4, only: grd }); ribbon(road, -hw, -hw - 1.4, 0.0, 'gravel', 0xc8c2b6, { wuv: 0.4, only: grd });
    ribbon(road, hw - 0.2, hw - 0.35, 0.06, 'marking', 0xf2f2ee); ribbon(road, -hw + 0.35, -hw + 0.2, 0.06, 'marking', 0xf2f2ee);
    ribbon(road, 0.08, -0.08, 0.06, 'marking', 0xf2f2ee, { dash: [3, 3] });
    // 轮胎磨黑的双带：车道中央偏亮、轮迹偏暗（比贴花便宜）
    for (const s of [-1, 1]) ribbon(road, s * hw * 0.66, s * hw * 0.34, 0.055, 'marking', 0x4a4e52);
    // 病害贴花与水洼：井盖 ~40m、雨水篦 ~55m、裂缝/补丁随机、水洼待雨
    let lastMH = -20, lastDR = -30, lastCK = 0, lastPT = 0, lastPD = -5;
    for (let i = 4; i < road.pts.length - 4; i++) {
      const p = road.pts[i]; if (!(p[6] === 'grd' || p[6] == null)) continue;
      const s = p[5], lx = p[4], lz = -p[3], ry = Math.atan2(-p[4], p[3]);
      if (s - lastMH > 40) { lastMH = s; const o = (R() < 0.5 ? -1 : 1) * hw * 0.45; addDecal(p[0] + lx * o, p[2] + lz * o, 0.9, 0.9, ry, DC.manhole, 0.9); }
      if (s - lastDR > 55) { lastDR = s; const o = (R() < 0.5 ? -1 : 1) * (hw - 0.55); addDecal(p[0] + lx * o, p[2] + lz * o, 1.5, 0.55, ry, DC.grate, 0.85); }
      if (s - lastCK > 14 + R(0, 14)) { lastCK = s; const o = R(-hw * 0.5, hw * 0.5); addDecal(p[0] + lx * o, p[2] + lz * o, R(2, 5), R(1, 2.5), ry + R(-0.4, 0.4), DC.crack, R(0.4, 0.7)); }
      if (s - lastPT > 80 + R(0, 60)) { lastPT = s; const o = R(-1, 1); addDecal(p[0] + lx * o, p[2] + lz * o, R(3, 5), R(1.6, 3), ry, DC.patch, 0.85); }
      if (s - lastPD > 22 + R(0, 16) && chance(0.5)) { lastPD = s; const o = R(-hw * 0.55, hw * 0.55); addPuddle(p[0] + lx * o, p[2] + lz * o, R(1, 2.6), R(0.6, 1.4), ry); }
    }
    // 护栏、路灯、电线杆、视线诱导标
    const P = road.pts; let lastLamp = -99, lastPole = -99, poles = []; const needRail = [new Uint8Array(P.length), new Uint8Array(P.length)];
    for (let i = 4; i < P.length - 4; i++) {
      const p = P[i]; const lx = p[4], lz = -p[3]; const s = p[5];
      if (s < 40 || s > road.len - 40) continue;
      if (!grd(p)) continue;
      const dl = terrainNatural(p[0] + lx * (hw + 5), p[2] + lz * (hw + 5)) - p[1], dr = terrainNatural(p[0] - lx * (hw + 5), p[2] - lz * (hw + 5)) - p[1];
      const seaSide = islandC(p[0] + lx * 30, p[2] + lz * 30) < islandC(p[0] - lx * 30, p[2] - lz * 30) ? 1 : -1;
      // 护栏：低的一侧或靠海一侧
      for (const side of [1, -1]) { const drop = side > 0 ? dl : dr; if (drop < -1.0 || side === seaSide) needRail[side > 0 ? 0 : 1][i] = 1; }
      if (s - lastLamp >= 42) {
        lastLamp = s; const side = -seaSide; const ox = p[0] + lx * side * (hw + 1.2), oz = p[2] + lz * side * (hw + 1.2);
        const K = new Kit(ox, p[1], oz, Math.atan2(lx * side, lz * side));
        K.cyl('paint', 0, 4.2, 0, 0.09, 8.4, 0x8a9096, { rt: 0.6, seg: 10 });
        K.rod('paint', [0, 8.2, 0], [0, 8.5, -1.8], 0.05, 0x8a9096);
        K.box('paint', 0, 8.45, -2.0, 0.35, 0.12, 0.7, 0x6a7076); K.box('glow', 0, 8.38, -2.0, 0.26, 0.03, 0.55, 0xfff1d6);
        const hp = K.w(0, 8.2, -2.0); addHalo(hp[0], hp[1], hp[2], 6, 0xffe2b8); ROAD_LIGHTS.push(hp); addLightPool(hp[0], p[1], hp[2], 9, 0xffd29a);
        addCollider(ox, oz, 0.15, 0.15, 0, p[1], p[1] + 8, 'wall');
      }
      if (s - lastPole >= 36) {
        lastPole = s; const side = seaSide; const ox = p[0] + lx * side * (hw + 2.2), oz = p[2] + lz * side * (hw + 2.2);
        const gy = terrainH(ox, oz);
        WK.cyl('concrete', ox, gy + 5, oz, 0.16, 10, 0xc9c9c4, { rt: 0.7, seg: 8 });
        WK.box('vc', ox, gy + 9.1, oz, 1.4, 0.1, 0.1, 0x707478, { ry: Math.atan2(p[3], p[4]) });
        poles.push([ox, gy + 9.15, oz]);
        addCollider(ox, oz, 0.2, 0.2, 0, gy, gy + 10, 'wall');
      }
      // 视线诱导标（反光柱）
      if (i % 9 === 0 && Math.abs(dl) + Math.abs(dr) > 0.5) for (const side of [1, -1]) { const ox = p[0] + lx * side * (hw + 0.5), oz = p[2] + lz * side * (hw + 0.5); WK.box('vcNoShadow', ox, p[1] + 0.45, oz, 0.08, 0.9, 0.08, 0xf2f2f2); WK.box('glow', ox, p[1] + 0.82, oz, 0.085, 0.1, 0.085, 0xff9a40); }
    }
    buildGuardrails(road, needRail);
    buildRoadStructures(road);
    for (let i = 0; i < poles.length - 1; i++) for (const o of [-0.5, 0, 0.5]) addWire([poles[i][0] + o * 0.3, poles[i][1], poles[i][2] + o], [poles[i + 1][0] + o * 0.3, poles[i + 1][1], poles[i + 1][2] + o], 0.7, 8);
    // 道路标志
    roadSigns(road);
  }
}
const ROAD_LIGHTS = [];
const roadPath = (road, i0, i1, lat) => { const out = []; for (let i = i0; i <= i1; i++) { const p = road.pts[i]; const lx = p[4], lz = -p[3]; out.push({ x: p[0] + lx * lat, y: p[1], z: p[2] + lz * lat, lx, lz, tx: p[3], tz: p[4], s: p[5] }); } return out; };
/* 波形护栏（日本常见的白色 W 型钢板护栏）：连续扫掠的波形梁 + 圆立柱 + 端部外弯 */
function buildGuardrails(road, need) {
  const P = road.pts, hw = road.hw;
  for (const side of [0, 1]) {
    const sg = side === 0 ? 1 : -1; const N = need[side];
    // 填补短缺口，连续成段
    for (let i = 0; i < P.length; i++) if (!N[i]) { let j = i; while (j < P.length && !N[j]) j++; if (i > 0 && j < P.length && j - i < 6) for (let k = i; k < j; k++) N[k] = 1; i = j; }
    let i = 0;
    while (i < P.length) {
      if (!N[i]) { i++; continue; } let j = i; while (j + 1 < P.length && N[j + 1]) j++;
      if (j - i >= 3) {
        const lat = sg * (hw + 0.85); const path = roadPath(road, i, j, lat);
        // 端部向外弯折
        for (const [k, dir] of [[0, -1], [path.length - 1, 1]]) { const q = path[k]; path[k] = Object.assign({}, q, { x: q.x + q.lx * sg * 0.45, z: q.z + q.lz * sg * 0.45 }); }
        const u = sg; // 梁朝向道路一侧的波形
        const W = [[0, 0.5], [-0.05 * u, 0.55], [0, 0.6], [-0.05 * u, 0.66], [0, 0.72], [-0.05 * u, 0.8]];
        sweep(path, sg > 0 ? W : W.slice().reverse(), 'rail', 0xf1f2f0, { wuv: 0, double: true });
        let last = -99;
        for (const q of path) { if (q.s - last < 4) continue; last = q.s; const gy = terrainH(q.x, q.z);
          WK.cyl('paint', q.x + q.lx * sg * 0.12, (Math.min(gy, q.y) + q.y + 0.78) / 2, q.z + q.lz * sg * 0.12, 0.07, q.y + 0.78 - Math.min(gy, q.y), 0xe8eaea, { seg: 10, noCol: true });
          WK.box('paint', q.x + q.lx * sg * 0.06, q.y + 0.64, q.z + q.lz * sg * 0.06, 0.1, 0.14, 0.12, 0xd8dada, { ry: Math.atan2(-q.tz, q.tx), noCol: true }); }
        for (let k = 0; k < path.length - 1; k += 2) { const a = path[k], b = path[Math.min(path.length - 1, k + 2)]; addCollider((a.x + b.x) / 2, (a.z + b.z) / 2, Math.hypot(b.x - a.x, b.z - a.z) / 2, 0.12, Math.atan2(-a.tz, a.tx), a.y, a.y + 0.85, 'wall'); }
      }
      i = j + 1;
    }
  }
}
/* 公路隧道与桥：隧道（洞门、洞内拱壁、照明、地面）与桥（箱梁、桥墩、栏杆、地面） */
function buildRoadStructures(road) {
  const P = road.pts, hw = road.hw;
  let i = 0;
  while (i < P.length) {
    const f = P[i][6]; if (f !== 'tun' && f !== 'bri') { i++; continue; }
    let j = i; while (j + 1 < P.length && P[j + 1][6] === f) j++;
    const path = roadPath(road, Math.max(0, i - 1), Math.min(P.length - 1, j + 1), 0);
    // 可站立的路面（地形之下）
    for (let k = 0; k < path.length - 1; k += 2) { const a = path[k], b = path[Math.min(path.length - 1, k + 2)]; addCollider((a.x + b.x) / 2, (a.z + b.z) / 2, Math.hypot(b.x - a.x, b.z - a.z) / 2 + 0.1, hw + 1.2, Math.atan2(-a.tz, a.tx), Math.min(a.y, b.y) - 0.6, (a.y + b.y) / 2 + 0.05, { under: true }); }
    if (f === 'tun') {
      const W = hw + 1.6;
      sweep(path, [[-W, -0.3], [-W, 4.6], [-W * 0.6, 6.3], [0, 6.8], [W * 0.6, 6.3], [W, 4.6], [W, -0.3]].reverse(), 'concrete', 0x9a9890, { wuv: 0.4 });
      // 外壳：山体较薄处露出的部分像海岸的混凝土明洞（棚洞）
      sweep(path, [[-W - 0.8, -6], [-W - 0.8, 4.8], [-W * 0.62, 7.0], [0, 7.6], [W * 0.62, 7.0], [W + 0.8, 4.8], [W + 0.8, -6]], 'concrete', 0xb9b5ab, { wuv: 0.4 });
      // 洞内两侧检修步道与路缘
      sweep(path, [[hw - 0.02, 0.2], [W, 0.2]], 'concrete', 0xb4b0a8, { wuv: 0.5 }); sweep(path, [[hw - 0.02, -0.3], [hw - 0.02, 0.2]], 'concrete', 0xc8c4bc, { wuv: 0.5 });
      sweep(path, [[-W, 0.2], [-hw + 0.02, 0.2]], 'concrete', 0xb4b0a8, { wuv: 0.5 }); sweep(path, [[-hw + 0.02, 0.2], [-hw + 0.02, -0.3]], 'concrete', 0xc8c4bc, { wuv: 0.5 });
      sweep(path, [[-W + 0.05, 0.0], [-W + 0.05, 1.0]].reverse(), 'vcNoShadow', 0x4a4c50, { wuv: 0 });
      sweep(path, [[W - 0.05, 0.0], [W - 0.05, 1.0]], 'vcNoShadow', 0x4a4c50, { wuv: 0 });
      for (let k = 0; k < path.length - 1; k += 2) { const a = path[k], b = path[Math.min(path.length - 1, k + 2)]; for (const sg of [-1, 1]) addCollider((a.x + b.x) / 2 + a.lx * sg * (W + 0.2), (a.z + b.z) / 2 + a.lz * sg * (W + 0.2), Math.hypot(b.x - a.x, b.z - a.z) / 2 + 0.1, 0.3, Math.atan2(-a.tz, a.tx), a.y - 0.5, a.y + 6.5, 'wall'); }
      let last = -99; for (const q of path) { if (q.s - last < 12) continue; last = q.s; for (const sg of [-1, 1]) WK.box('glow', q.x + q.lx * sg * (W - 0.3), q.y + 4.7, q.z + q.lz * sg * (W - 0.3), 1.2, 0.12, 0.18, 0xffc27a, { ry: Math.atan2(-q.tz, q.tx), noCol: true }); }
      for (const [k, sign] of [[0, 1], [path.length - 1, -1]]) {
        const q = path[k]; const tx = q.tx * sign, tz = q.tz * sign; const K = new Kit(q.x, q.y - 0.3, q.z, Math.atan2(-tx, -tz));
        const sh = new THREE.Shape(); sh.moveTo(-W - 3, 0); sh.lineTo(W + 3, 0); sh.lineTo(W + 3, 9.5); sh.lineTo(-W - 3, 9.5); sh.closePath();
        const h = new THREE.Path(); h.moveTo(-W, 0); h.lineTo(W, 0); h.lineTo(W, 4.6); h.quadraticCurveTo(W, 6.8, 0, 6.9); h.quadraticCurveTo(-W, 6.8, -W, 4.6); h.lineTo(-W, 0); sh.holes.push(h);
        const g = new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: false }); g.translate(0, 0, -1.2);
        K.geo('concrete', g, 0, 0, 0, 0xc4c0b6, { wuv: 0.35 });
        K.box('concrete', 0, 9.8, -0.3, 2 * W + 7, 0.6, 1.8, 0xb8b4aa);
        const uv = allocSign(260, 64, (g2, w2, h2) => { g2.fillStyle = '#1f5fae'; g2.fillRect(0, 0, w2, h2); g2.fillStyle = '#fff'; g2.font = `700 30px ${FONT.sans}`; g2.textAlign = 'center'; g2.fillText(sign > 0 ? '星见隧道' : '潮风隧道', w2 / 2, 42); });
        K.plane('sign', 0, 7.9, 0.03, 3.0, 0.75, 0xffffff, { uvr: uv });
      }
    } else {
      sweep(path, rect(-hw - 1.0, hw + 1.0, -1.6, -0.02), 'concrete', 0xc2bdb3, { wuv: 0.4, closed: true });
      for (const sg of [-1, 1]) sweep(path, sg > 0 ? rect(hw + 0.6, hw + 1.0, -0.02, 0.95) : rect(-hw - 1.0, -hw - 0.6, -0.02, 0.95), 'concrete', 0xd2cec6, { wuv: 0.4, closed: true });
      for (let k = 0; k < path.length - 1; k += 2) { const a = path[k], b = path[Math.min(path.length - 1, k + 2)]; for (const sg of [-1, 1]) addCollider((a.x + b.x) / 2 + a.lx * sg * (hw + 0.8), (a.z + b.z) / 2 + a.lz * sg * (hw + 0.8), Math.hypot(b.x - a.x, b.z - a.z) / 2, 0.2, Math.atan2(-a.tz, a.tx), a.y, a.y + 1.0, 'wall'); }
      let last = -99; for (const q of path) { if (q.s - last < 18) continue; last = q.s; const gy = terrainH(q.x, q.z); if (q.y - 1.6 - gy < 0.8) continue; const K = new Kit(q.x, gy, q.z, Math.atan2(-q.tz, q.tx)); K.box('concrete', 0, (q.y - 1.6 - gy) / 2 - 0.5, 0, 1.4, q.y - 1.6 - gy + 1, 4, 0xb8b3a9, { wuv: 0.4 }); }
    }
    i = j + 1;
  }
}
function roadSigns(road) {
  const P = road.pts; const at = (s) => P[Math.min(P.length - 1, Math.round(s / 2))];
  const sign = (s, side, draw, w, h, post = 2.4) => {
    const p = at(s); const lx = p[4], lz = -p[3]; const ox = p[0] + lx * side * (road.hw + 1.6), oz = p[2] + lz * side * (road.hw + 1.6);
    const K = new Kit(ox, p[1], oz, Math.atan2(-p[3], -p[4]));
    K.cyl('paint', 0, post / 2, 0, 0.04, post, 0x9aa0a6, { seg: 8 });
    const uv = allocSign(Math.round(w * 120), Math.round(h * 120), draw); K.plane('sign', 0, post + h / 2 - 0.1, 0.05, w, h, 0xffffff, { uvr: uv }); K.box('vc', 0, post + h / 2 - 0.1, 0.0, w + 0.04, h + 0.04, 0.05, 0x9aa0a6);
  };
  const limit = (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#d32f2f'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 2, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 14, 0, TAU); g.fill(); g.fillStyle = '#1f3c88'; g.font = `900 ${w * 0.45}px ${FONT.sans}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('40', w / 2, h / 2 + 3); };
  const guide = (a, b) => (g, w, h) => { g.fillStyle = '#1f5fae'; g.fillRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 4; g.strokeRect(5, 5, w - 10, h - 10); g.fillStyle = '#fff'; g.font = `700 ${h * 0.24}px ${FONT.sans}`; g.textAlign = 'left'; g.fillText(a, 16, h * 0.42); g.textAlign = 'right'; g.fillText(b, w - 16, h * 0.82); };
  for (let s = 120; s < road.len - 80; s += 260) sign(s, 1, limit, 0.6, 0.6);
  sign(60, 1, guide('← 樱丘町 1 km', '星见山 观景台 →'), 2.6, 1.0, 3.2);
  sign(road.len - 70, -1, guide('← 星见港 3 km', '樱丘町 →'), 2.6, 1.0, 3.2);
}
/* 车道（日本左侧通行）：forward = 沿控制点顺序 */
function roadLane(road, side, reverse) {
  const out = []; const P = road.pts; const off = 1.85;
  for (let i = 0; i < P.length; i += 2) { const p = P[i]; const lx = p[4], lz = -p[3]; const sgn = reverse ? -1 : 1; out.push([p[0] + lx * off * sgn, p[2] + lz * off * sgn]); }
  if (reverse) out.reverse();
  return out;
}
