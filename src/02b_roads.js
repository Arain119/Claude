/* ==========================================================================
   环岛公路：控制点 → 平滑曲线 → 纵断面（限坡）→ 填挖地形 → 路面 / 标线 / 护栏 / 路灯
   ========================================================================== */
const ROAD_DEFS = [
  { id: 'ring', w: 7.4, pts: [[100, -84], [100, -98], [92, -122], [80, -152], [52, -196], [18, -232], [-30, -262], [-100, -292], [-180, -318], [-250, -300], [-305, -252], [-335, -180], [-342, -100], [-326, -24], [-296, 46], [-240, 92], [-170, 98], [-122, 72], [-100, 46], [-90, 40]] },
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
function buildRoadData() {
  for (const def of ROAD_DEFS) {
    const xz = catmull(def.pts, 2); const n = xz.length;
    let y = xz.map(p => Math.max(1.6, terrainNatural(p[0], p[1])));
    // 平滑
    for (let pass = 0; pass < 4; pass++) { const ny = y.slice(); for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let k = -18; k <= 18; k++) { const j = clamp(i + k, 0, n - 1); s += y[j]; c++; } ny[i] = s / c; } y = ny; }
    // 两端接回镇区高度
    for (let i = 0; i < n; i++) { const e = Math.min(i, n - 1 - i); const k = smooth(28, 6, e); y[i] = lerp(y[i], TOWN_Y, k); }
    // 坡度上限 7%
    const G = 0.07; for (let i = 1; i < n; i++) { const d = Math.hypot(xz[i][0] - xz[i - 1][0], xz[i][1] - xz[i - 1][1]); y[i] = clamp(y[i], y[i - 1] - G * d, y[i - 1] + G * d); }
    for (let i = n - 2; i >= 0; i--) { const d = Math.hypot(xz[i][0] - xz[i + 1][0], xz[i][1] - xz[i + 1][1]); y[i] = clamp(y[i], y[i + 1] - G * d, y[i + 1] + G * d); }
    const pts = []; let s = 0;
    for (let i = 0; i < n; i++) {
      const a = xz[Math.max(0, i - 1)], b = xz[Math.min(n - 1, i + 1)]; let tx = b[0] - a[0], tz = b[1] - a[1]; const L = Math.hypot(tx, tz) || 1; tx /= L; tz /= L;
      if (i) s += Math.hypot(xz[i][0] - xz[i - 1][0], xz[i][1] - xz[i - 1][1]);
      pts.push([xz[i][0], y[i], xz[i][1], tx, tz, s]);
    }
    const road = { def, pts, len: s, hw: def.w / 2 }; ROADS.push(road);
    // 盖章到道路栅格
    for (const p of pts) {
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
    if (o.dash && Math.floor(p[5] / o.dash[0]) % o.dash[1] !== 0) { k = 0; continue; }
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
    ribbon(road, hw + 1.4, hw, 0.0, 'gravel', 0xc8c2b6, { wuv: 0.4 }); ribbon(road, -hw, -hw - 1.4, 0.0, 'gravel', 0xc8c2b6, { wuv: 0.4 });
    ribbon(road, hw - 0.2, hw - 0.35, 0.06, 'marking', 0xf2f2ee); ribbon(road, -hw + 0.35, -hw + 0.2, 0.06, 'marking', 0xf2f2ee);
    ribbon(road, 0.08, -0.08, 0.06, 'marking', 0xf2f2ee, { dash: [3, 3] });
    // 护栏、路灯、电线杆、视线诱导标
    const P = road.pts; let lastLamp = -99, lastPole = -99, lastRail = -99, poles = [];
    for (let i = 4; i < P.length - 4; i++) {
      const p = P[i]; const lx = p[4], lz = -p[3]; const s = p[5];
      if (s < 40 || s > road.len - 40) continue;
      const dl = terrainNatural(p[0] + lx * (hw + 5), p[2] + lz * (hw + 5)) - p[1], dr = terrainNatural(p[0] - lx * (hw + 5), p[2] - lz * (hw + 5)) - p[1];
      const seaSide = islandC(p[0] + lx * 30, p[2] + lz * 30) < islandC(p[0] - lx * 30, p[2] - lz * 30) ? 1 : -1;
      // 护栏：低的一侧或靠海一侧
      if (s - lastRail >= 4) {
        lastRail = s;
        for (const side of [1, -1]) {
          const drop = side > 0 ? dl : dr;
          if (drop < -1.0 || side === seaSide) {
            const ox = p[0] + lx * side * (hw + 0.9), oz = p[2] + lz * side * (hw + 0.9); const ry = Math.atan2(p[3], p[4]);
            WK.box('rail', ox, p[1] + 0.45, oz, 0.1, 0.9, 0.1, 0x9aa0a6);
            WK.box('rail', ox, p[1] + 0.72, oz, 0.04, 0.32, 4.05, 0xd0d4d8, { ry: Math.atan2(p[3], p[4]) });
            addCollider(ox, oz, 0.06, 2.05, Math.atan2(p[3], p[4]), p[1], p[1] + 0.9, 'wall');
          }
        }
      }
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
    for (let i = 0; i < poles.length - 1; i++) for (const o of [-0.5, 0, 0.5]) addWire([poles[i][0] + o * 0.3, poles[i][1], poles[i][2] + o], [poles[i + 1][0] + o * 0.3, poles[i + 1][1], poles[i + 1][2] + o], 0.7, 8);
    // 道路标志
    roadSigns(road);
  }
}
const ROAD_LIGHTS = [];
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
