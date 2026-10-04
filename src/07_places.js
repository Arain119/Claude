/* ==========================================================================
   地点：樱花广场 · 河堤 · 神社 · 港口 · 灯塔岬 · 沙滩 · 民居区
   ========================================================================== */
const PLAZA = { x: 0, z: 62 };
const WELL = {};

function buildPlaza() {
  const { x: cx, z: cz } = PLAZA; const y = TOWN_Y;
  // 圆形铺装
  const disc = new THREE.CylinderGeometry(19, 19, 0.12, 48);
  WK.geo('paving', disc, cx, y + 0.06, cz, 0xf3ece2, { wuv: 0.45 });
  WK.geo('gravel', new THREE.CylinderGeometry(7.5, 7.5, 0.14, 40), cx, y + 0.07, cz, 0xe6d6bf, { wuv: 0.3 });
  addCollider(cx, cz, 19, 19, 0, y - 1, y + 0.12, { walk: true, round: true });
  // 百年樱花树
  const big = sakuraTree(cx, cz, 2.25, { y: y + 0.14, trunkH: 2.0, r0: 0.3, L1: 3.0, main: 4, cards: 1550, flatY: y + 0.14, cardK: 1.15 });
  TREES[TREES.length - 1].giant = true;
  addCollider(cx, cz, 1.0, 1.0, 0, y, y + 4, 'wall');
  // 环形长椅
  const K = new Kit(cx, y + 0.12, cz, 0);
  const ring = new THREE.CylinderGeometry(2.6, 2.6, 0.08, 40, 1, true);
  K.geo('wood', new THREE.RingGeometry(2.0, 2.6, 40, 1), 0, 0.46, 0, 0xb07a4a, { rx: -Math.PI / 2 });
  K.geo('wood', new THREE.CylinderGeometry(2.0, 2.0, 0.6, 40, 1, true), 0, 0.75, 0, 0x9a6a3e);
  for (let i = 0; i < 12; i++) { const a = i * TAU / 12; K.box('paint', Math.cos(a) * 2.3, 0.22, Math.sin(a) * 2.3, 0.08, 0.44, 0.5, 0x3b4a4a, { ry: -a }); }
  addCollider(cx, cz, 2.6, 2.6, 0, y, y + 0.5, { round: true });
  for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + 0.2; const sx = cx + Math.cos(a) * 2.6, sz = cz + Math.sin(a) * 2.6; const ry = Math.atan2(Math.cos(a), Math.sin(a)); addInteract({ x: sx + Math.cos(a) * 0.4, z: sz + Math.sin(a) * 0.4, r: 1.0, label: () => '坐在樱花树下', act: () => GAME.sit(sx + Math.cos(a) * 0.15, y + 0.6, sz + Math.sin(a) * 0.15, ry) }); }
  // 许愿井
  const wx = cx + 10, wz = cz + 6; const W = new Kit(wx, y + 0.12, wz, 0.3);
  W.geo('stone', new THREE.CylinderGeometry(1.15, 1.25, 0.9, 20, 1, true), 0, 0.45, 0, 0xd8d2c6, { wuv: 0.6 });
  W.geo('stone', new THREE.TorusGeometry(1.18, 0.14, 8, 24), 0, 0.92, 0, 0xcfc8ba, { rx: Math.PI / 2 });
  W.cyl('vcNoShadow', 0, 0.55, 0, 1.05, 0.02, 0x2a5a78, { seg: 24 });
  for (const s of [-1, 1]) W.box('wood', s * 1.0, 1.6, 0, 0.14, 2.0, 0.14, 0x8a5a3a);
  W.geo('roof', PRISM, 0, 2.55, 0, 0x7a3b33, { sx: 2.8, sy: 0.8, sz: 1.8, ry: Math.PI / 2 });
  W.cyl('wood', 0, 2.2, 0, 0.08, 1.9, 0x6a4a2a, { rz: Math.PI / 2 }); W.box('wood', 0, 1.55, 0, 0.3, 0.3, 0.3, 0x8a6a4a);
  addCollider(wx, wz, 1.25, 1.25, 0, y, y + 1.0, { round: true });
  WELL.x = wx; WELL.z = wz; WELL.y = y + 0.7;
  const wUV = allocSign(220, 70, (g, w, h) => { g.fillStyle = '#5a3a20'; g.fillRect(0, 0, w, h); g.fillStyle = '#f6e6c4'; g.font = `400 36px ${FONT.wei}`; g.textAlign = 'center'; g.fillText('星 愿 井', w / 2, 47); });
  W.plane('sign', 0, 0.55, 1.27, 0.9, 0.29, 0xffffff, { uvr: wUV });
  // 花坛与长椅、路灯
  for (let i = 0; i < 6; i++) {
    const a = i * TAU / 6 + 0.5; const fx = cx + Math.cos(a) * 14.5, fz = cz + Math.sin(a) * 14.5;
    if (Math.hypot(fx - wx, fz - wz) < 4) continue;
    const F = new Kit(fx, y + 0.12, fz, -a);
    F.box('stone', 0, 0.25, 0, 3.4, 0.5, 1.4, 0xd8d2c6, { solid: true, wuv: 0.6 });
    F.box('vc', 0, 0.48, 0, 3.2, 0.06, 1.2, 0x6b5040);
    for (let k = 0; k < 26; k++) F.sph('vcNoShadow', R(-1.5, 1.5), 0.6, R(-0.5, 0.5), 0.1, 0.08, 0.1, pick([0xf4c542, 0xffffff, 0xe86a8a, 0xb38be0, 0xff9a5a]), { lo: true });
    for (let k = 0; k < 10; k++) F.sph('vcNoShadow', R(-1.5, 1.5), 0.52, R(-0.5, 0.5), 0.18, 0.08, 0.18, 0x5f9a4a, { lo: true });
    parkBench(cx + Math.cos(a + 0.5) * 12, cz + Math.sin(a + 0.5) * 12, -a - 0.5 - Math.PI / 2, y + 0.12);
  }
  for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + 0.78; streetLampPlaza(cx + Math.cos(a) * 17, cz + Math.sin(a) * 17); }
  // 广场周围的小樱花
  for (let i = 0; i < 5; i++) { const a = i * TAU / 5 + 0.9; sakuraTree(cx + Math.cos(a) * 22, cz + Math.sin(a) * 22, 0.9, { cards: 1400 }); }
  // 广场钟
  const C = new Kit(cx - 12, y + 0.12, cz - 10, 0);
  C.cyl('paint', 0, 1.8, 0, 0.09, 3.6, 0x2f4a4a, { seg: 10 });
  const cUV = allocSignAlpha(128, 128, (g) => { g.fillStyle = '#fffdf6'; g.beginPath(); g.arc(64, 64, 60, 0, TAU); g.fill(); g.strokeStyle = '#2f4a4a'; g.lineWidth = 7; g.stroke(); g.fillStyle = '#2f4a4a'; for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.fillRect(64 + Math.cos(a) * 48 - 3, 64 + Math.sin(a) * 48 - 3, 6, 6); } });
  for (const s of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) C.plane('signCut', Math.sin(s) * 0.26, 3.8, Math.cos(s) * 0.26, 0.5, 0.5, 0xffffff, { uvr: cUV, ry: s });
  C.box('paint', 0, 3.8, 0, 0.5, 0.56, 0.5, 0x2f4a4a);
  addPlace('樱花广场', cx, cz - 10, 0, 'plaza');
  addInteract({ x: wx, z: wz, r: 2.2, label: () => '向星愿井投一枚贝壳币', act: () => GAME.wish() });
  return big;
}
function streetLampPlaza(x, z) {
  const K = new Kit(x, TOWN_Y + 0.12, z, 0);
  K.cyl('paint', 0, 1.9, 0, 0.07, 3.8, 0x2f4a4a, { rt: 0.75, seg: 10 }); K.cyl('paint', 0, 0.2, 0, 0.14, 0.4, 0x2f4a4a, { seg: 10 });
  K.sph('glow', 0, 4.05, 0, 0.3, 0.32, 0.3, 0xfff2d8); K.cyl('paint', 0, 4.42, 0, 0.32, 0.1, 0x2f4a4a, { rt: 0.3, seg: 12 });
  addHalo(x, TOWN_Y + 4.1, z, 4.5, 0xffe6b8); addLightPool(x, TOWN_Y, z, 5, 0xffdcae);
  addCollider(x, z, 0.15, 0.15, 0, TOWN_Y, TOWN_Y + 4, 'wall');
}

/* ---------------- 河堤与桥 ---------------- */
function riverPoint(t) { const i = Math.min(RIVER.length - 2, Math.floor(t)); const f = t - i; return [lerp(RIVER[i][0], RIVER[i + 1][0], f), lerp(RIVER[i][1], RIVER[i + 1][1], f), RIVER[i + 1][0] - RIVER[i][0], RIVER[i + 1][1] - RIVER[i][1]]; }
function riverAtZ(z) { for (let i = 0; i < RIVER.length - 1; i++) { const a = RIVER[i], b = RIVER[i + 1]; if ((z - a[1]) * (z - b[1]) <= 0) return lerp(a[0], b[0], (z - a[1]) / (b[1] - a[1])); } return RIVER[0][0]; }
function buildRiverbanks() {
  // 石砌护岸（沿河道两侧）
  for (let i = 0; i < RIVER.length - 1; i++) {
    const a = RIVER[i], b = RIVER[i + 1]; const dx = b[0] - a[0], dz = b[1] - a[1]; const L = Math.hypot(dx, dz); const nx = -dz / L, nz = dx / L;
    const ry = Math.atan2(dx, dz);
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    if (mz > 128 || mz < -100) continue;
    for (const s of [-1, 1]) {
      const top = Math.min(terrainH(mx + nx * s * 9, mz + nz * s * 9), TOWN_Y);
      const hgt = top + 0.9;
      WK.box('stone', mx + nx * s * 6.9, -0.9 + hgt / 2, mz + nz * s * 6.9, 0.6, hgt, L + 0.6, 0xc9c2b4, { ry, rz: s * 0.32, wuv: 0.4 });
      // 堤岸栏杆与河堤步道：遇到公路桥、铁路桥处断开
      if (top > 1.5) {
        const N = Math.max(1, Math.floor(L / 2.5)); const runs = []; let cur = null;
        for (let k = 0; k <= N; k++) {
          const t = k / N; const px = a[0] + dx * t + nx * s * 8.5, pz = a[1] + dz * t + nz * s * 8.5;
          if (crossBlocked(px, pz)) { cur = null; continue; }
          if (!cur) { cur = []; runs.push(cur); } cur.push([px, pz, t]);
        }
        for (const r of runs) {
          for (const q of r) WK.box('paint', q[0], top + 0.45, q[1], 0.08, 0.9, 0.08, 0x5d6b58);
          if (r.length < 2) continue;
          const q0 = r[0], q1 = r[r.length - 1]; const cx = (q0[0] + q1[0]) / 2, cz = (q0[1] + q1[1]) / 2, len = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]);
          WK.box('paint', cx, top + 0.88, cz, 0.07, 0.07, len, 0x5d6b58, { ry, noCol: true });
          WK.box('paint', cx, top + 0.5, cz, 0.05, 0.05, len, 0x5d6b58, { ry, noCol: true });
          addCollider(cx, cz, 0.08, len / 2 + 0.05, ry, top, top + 1, 'wall');
          const t0 = q0[2], t1 = q1[2]; const wx = a[0] + dx * (t0 + t1) / 2 + nx * s * 11, wz = a[1] + dz * (t0 + t1) / 2 + nz * s * 11;
          WK.box('gravel', wx, top + 0.02, wz, 4, 0.04, len + 2.5, 0xead9c0, { ry, wuv: 0.35, noCol: true });
        }
      }
    }
  }
  // 河源：混凝土涵洞出水口
  { const [x0, z0] = RIVER[0], [x1, z1] = RIVER[1]; const ry = Math.atan2(x1 - x0, z1 - z0); const wy = riverProfile()[0]; const K = new Kit(x0, wy - 1.3, z0, ry);
    K.box('concrete', 0, 3.2, -1.2, 16, 6.4, 1.6, 0xb8b4ac, { wuv: 0.4 }); K.box('concrete', 0, 6.5, -1.0, 16.6, 0.4, 2.2, 0xa8a49c);
    for (const sx of [-1, 1]) K.box('concrete', sx * 7.6, 3.0, 3, 1.2, 6, 8, 0xb8b4ac, { wuv: 0.4 });
    K.box('vcNoShadow', 0, 1.9, -0.35, 6.2, 3.0, 0.2, 0x0b0c0e); K.geo('concrete', new THREE.TorusGeometry(3.1, 0.35, 8, 24, Math.PI), 0, 1.9, -0.3, 0xa8a49c);
    K.box('paint', 0, 7.2, -0.2, 16, 0.08, 0.08, 0x8a9096); for (let i = 0; i <= 8; i++) K.box('paint', -8 + i * 2, 6.95, -0.2, 0.06, 0.5, 0.06, 0x8a9096); }
  // 樱花隧道：东岸两排、西岸一排
  for (let z = -42; z <= 82; z += 9.5) {
    const rx = riverAtZ(z); if (Math.abs(z + 20) < 4 || Math.abs(z - 40) < 4) continue;
    for (const [ox, oz, sc] of [[9.0, R(-1, 1), R(1.0, 1.15)], [13.4, 4.5 + R(-1, 1), R(0.95, 1.1)], [-9.6, 2 + R(-1, 1), R(0.95, 1.1)]]) {
      const tx = rx + ox, tz = z + oz; if (crossBlocked(tx, tz) || occNear(tx, tz, 2.5)) continue; sakuraTree(tx, tz, sc);
    }
    // 灯笼
    if (Math.round(z) % 2 === 0) for (const s of [1, -1]) { const lx = rx + s * 11.2, lz = z + 2.2; if (!crossBlocked(lx, lz)) bankLantern(lx, lz); }
  }
  // 桥
  bridge(-20, 6.0); bridge(40, 7.6);
  addPlace('樱川河堤', riverAtZ(10) + 11, 10, Math.PI, 'river');
}
// 河岸设施是否会挡住桥（公路桥面或铁路）
function crossBlocked(x, z) {
  if (roadSample(x, z) > 0.02) return true;
  for (const r of ROADS) for (let i = 0; i < r.pts.length; i += 2) { const p = r.pts[i]; if (Math.hypot(p[0] - x, p[2] - z) < r.hw + 2.5) return true; }
  for (let i = 0; i < RAIL.pts.length; i += 2) { const p = RAIL.pts[i]; if (Math.hypot(p.x - x, p.z - z) < railSep(p.s) / 2 + 4.5) return true; }
  return false;
}
function bankLantern(x, z) {
  const y = groundAt(x, z); const K = new Kit(x, y, z, 0);
  K.box('wood', 0, 1.0, 0, 0.1, 2.0, 0.1, 0x5a3a20);
  K.box('wood', 0.25, 2.0, 0, 0.6, 0.06, 0.06, 0x5a3a20);
  K.cyl('glow', 0.45, 1.72, 0, 0.16, 0.42, 0xfff0d8, { seg: 12 }); K.cyl('vc', 0.45, 1.95, 0, 0.12, 0.05, 0x222222, { seg: 12 }); K.cyl('vc', 0.45, 1.49, 0, 0.12, 0.05, 0x222222, { seg: 12 });
  const p = K.w(0.45, 1.72, 0); addHalo(p[0], p[1], p[2], 2.6, 0xffd8a8); addLightPool(p[0], y, p[2], 2.8, 0xffc890);
}
function bridge(z, width) {
  const rx = riverAtZ(z); const span = 19;
  const K = new Kit(rx, TOWN_Y, z, 0);
  K.box('concrete', 0, -0.25, 0, span, 0.5, width, 0xc4beb2, { solid: { walk: true }, wuv: 0.5 });
  K.box('paving', 0, 0.02, 0, span, 0.04, width - 0.4, 0xd9cfc0, { wuv: 0.5 });
  for (const s of [-1, 1]) {
    K.box('paint', 0, 0.55, s * (width / 2 - 0.1), span, 0.08, 0.12, 0xc8352e);
    K.box('paint', 0, 0.95, s * (width / 2 - 0.1), span, 0.1, 0.16, 0xc8352e);
    for (let i = 0; i <= 10; i++) K.box('paint', -span / 2 + i * span / 10, 0.5, s * (width / 2 - 0.1), 0.14, 1.0, 0.14, 0xc8352e);
    for (const e of [-1, 1]) { K.box('stone', e * span / 2, 0.75, s * (width / 2 - 0.1), 0.4, 1.5, 0.4, 0xd8d2c6); K.sph('stone', e * span / 2, 1.6, s * (width / 2 - 0.1), 0.22, 0.25, 0.22, 0xd8d2c6); }
    addCollider(rx, z + s * (width / 2 - 0.1), span / 2, 0.12, 0, TOWN_Y, TOWN_Y + 1, 'wall');
  }
  K.box('concrete', 0, -1.4, 0, 1.2, 2.4, width - 1, 0xb5b0a6);
  const nUV = allocSign(200, 60, (g, w, h) => { g.fillStyle = '#7a6a58'; g.fillRect(0, 0, w, h); g.fillStyle = '#f6efe0'; g.font = `400 34px ${FONT.wei}`; g.textAlign = 'center'; g.fillText(z < 0 ? '樱 川 桥' : '花 筏 桥', w / 2, 42); });
  K.plane('sign', span / 2 + 0.21, 1.05, width / 2 - 0.1, 0.5, 0.16, 0xffffff, { uvr: nUV, ry: Math.PI / 2 });
  // 通往桥的路
  WK.box('paving', rx + 20, TOWN_Y + 0.03, z, 22, 0.06, width - 1, 0xe5dccd, { wuv: 0.5 });
  WK.box('paving', rx - 20, TOWN_Y + 0.03, z, 22, 0.06, width - 1, 0xe5dccd, { wuv: 0.5 });
}

/* ---------------- 神社 ---------------- */
function buildShrine() {
  const { x: sx, z: sz, y: sy } = SHRINE;
  // 参道坡与石阶
  addRamp(-40, -98, 2.6, 12, 0, SHRINE.y, TOWN_Y);
  for (let i = 0; i < 24; i++) { const z = -86.5 - i; const y = lerp(TOWN_Y, SHRINE.y, (i + 0.5) / 24); WK.box('stone', -40, y - 0.25, z, 4.6, 0.5, 1.02, 0xd2ccbf, { wuv: 0.6 }); }
  for (const s of [-1, 1]) WK.box('stone', -40 + s * 2.55, (TOWN_Y + SHRINE.y) / 2 - 0.2, -98, 0.4, 1, 24.5, 0xbdb6a8, { rx: Math.atan2(SHRINE.y - TOWN_Y, 24), wuv: 0.5 });
  // 大鸟居（参道下）
  torii(-40, -85, TOWN_Y, 1.35, 0xd8432f);
  crowAt(-40 + 1.5, TOWN_Y + 7.05, -85, 0.4);
  // 千本鸟居
  for (let i = 0; i < 11; i++) { const z = -88.5 - i * 2.1; torii(-40, z, groundAt(-40, z) - 0.05, 0.62, new THREE.Color(0xe0502f).multiplyScalar(R(0.82, 1.06)).getHex(), true); }
  // 台地：砂石、石灯笼、狐狸像
  WK.box('gravel', sx, sy + 0.02, sz + 4, 44, 0.04, 40, 0xe8e1d4, { wuv: 0.3 });
  WK.box('stone', sx, sy + 0.04, sz + 6, 3.2, 0.06, 26, 0xd9d2c4, { wuv: 0.5 });
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) stoneLantern(sx + s * 3.6, sz + 16 - i * 6.5, sy);
  for (const s of [-1, 1]) foxStatue(sx + s * 2.8, sz + 0, sy, s);
  // 拜殿
  const H = new Kit(sx, sy, sz - 8, 0);
  H.box('stone', 0, 0.3, 0, 12, 0.6, 9, 0xcdc6b8, { solid: true, wuv: 0.5 });
  for (let i = 0; i < 3; i++) H.box('stone', 0, 0.1 + i * 0.2, 5 + 0.4 * (2 - i), 4, 0.2, 0.4, 0xd5cec0, { solid: true });
  for (const px of [-4.6, -1.6, 1.6, 4.6]) for (const pz of [-3.4, 3.4]) H.cyl('wood', px, 2.4, pz, 0.22, 3.6, 0xc23a2a, { seg: 10 });
  H.box('wood', 0, 1.9, -3.6, 9.2, 2.6, 0.2, 0xf3ece0, { solid: true }); for (const s of [-1, 1]) H.box('wood', s * 4.6, 1.9, 0, 0.2, 2.6, 7, 0xf3ece0, { solid: true });
  H.box('wood', 0, 1.9, -3.5, 3, 2.4, 0.1, 0x3a2a1a);
  H.box('wood', 0, 4.25, 0, 10.2, 0.4, 7.6, 0xc23a2a);
  H.box('wood', 0, 4.5, 0, 10.6, 0.2, 8, 0xe9e2d4);
  // 铜绿屋顶（曲面近似：两段坡）
  const roofC = 0x5fa596;
  for (const s of [-1, 1]) { H.box('roof', 0, 5.2, s * 2.6, 12.4, 0.22, 5.8, roofC, { rx: s * 0.42, wuv: 1 }); H.box('roof', 0, 4.65, s * 4.9, 12.6, 0.18, 1.6, roofC, { rx: s * 0.18, wuv: 1 }); }
  H.box('roof', 0, 6.35, 0, 12.6, 0.35, 0.5, 0x4d8a7d);
  // 千木与鲣木
  for (const e of [-1, 1]) for (const s of [-1, 1]) H.box('wood', e * 6.1, 7.0, s * 0.35, 0.16, 1.6, 0.16, 0x4d8a7d, { rx: s * 0.6 });
  for (let i = 0; i < 5; i++) H.cyl('wood', -3.2 + i * 1.6, 6.65, 0, 0.17, 1.0, 0xd9b45a, { rx: Math.PI / 2, seg: 10 });
  // 注连绳、铃、赛钱箱
  H.cyl('vc', 0, 3.9, 3.6, 0.13, 6.2, 0xe8d9a8, { rz: Math.PI / 2, seg: 8 });
  for (let i = 0; i < 5; i++) H.box('vcNoShadow', -2.4 + i * 1.2, 3.55, 3.62, 0.18, 0.5, 0.02, 0xffffff);
  H.sph('paint', 0, 3.45, 3.4, 0.28, 0.3, 0.28, 0xd9b45a); H.cyl('vc', 0, 2.3, 3.4, 0.04, 2.0, 0xd84a4a, { seg: 6 });
  H.box('wood', 0, 1.0, 4.4, 1.8, 0.8, 0.9, 0x7a4a2a, { solid: true });
  for (let i = 0; i < 6; i++) H.box('wood', -0.75 + i * 0.3, 1.42, 4.4, 0.12, 0.05, 0.85, 0x5a3a20);
  const sUV = allocSign(140, 300, (g, w, h) => { g.fillStyle = '#2a1f18'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d9b45a'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12); g.fillStyle = '#f6e6c4'; g.font = `400 60px ${FONT.brush}`; g.textAlign = 'center'; [...'狐守社'].forEach((c, i) => g.fillText(c, w / 2, 80 + i * 78)); });
  H.plane('sign', 0, 4.1, 3.85, 0.55, 1.15, 0xffffff, { uvr: sUV });
  // 手水舍
  const T = new Kit(sx + 9, sy, sz + 5, -0.3);
  T.box('stone', 0, 0.45, 0, 2.2, 0.9, 1.1, 0xbdb6a8, { solid: true, wuv: 0.6 }); T.box('vcNoShadow', 0, 0.91, 0, 1.9, 0.02, 0.8, 0x4a8aa8);
  for (const px of [-1.2, 1.2]) for (const pz of [-0.8, 0.8]) T.cyl('wood', px, 1.4, pz, 0.1, 2.8, 0xc23a2a, { seg: 8 });
  T.geo('roof', PRISM, 0, 2.8, 0, 0x5fa596, { sx: 3.2, sy: 0.9, sz: 2.4, ry: 0 });
  for (let i = 0; i < 3; i++) T.cyl('wood', -0.5 + i * 0.5, 1.0, 0.2, 0.05, 0.05, 0xb08560, { seg: 8 });
  // 绘马挂架
  const E = new Kit(sx - 9, sy, sz + 3, 0.35);
  for (const s of [-1, 1]) E.box('wood', s * 1.5, 0.9, 0, 0.12, 1.8, 0.12, 0x6a4a2a);
  E.box('wood', 0, 1.7, 0, 3.2, 0.1, 0.1, 0x6a4a2a); E.box('wood', 0, 1.25, 0, 3.2, 0.06, 0.06, 0x6a4a2a);
  E.geo('roof', PRISM, 0, 1.85, 0, 0x5a3a20, { sx: 3.6, sy: 0.35, sz: 0.7 });
  const wishes = ['希望奶奶身体健康', '考上海对岸的大学！', '想和他一起看烟火', '小鱼干天天有', '愿灯塔永远亮着', '新店开张大吉', '希望能再见到你', '钓到大鱼', '画完一百张樱花', '和好朋友永远在一起', '春天快点来', '平安喜乐'];
  for (let i = 0; i < 20; i++) {
    const w = wishes[i % wishes.length];
    const uv = allocSign(70, 54, (g, W2, H2) => { g.fillStyle = '#e6c9a0'; g.beginPath(); g.moveTo(0, 14); g.lineTo(14, 0); g.lineTo(W2 - 14, 0); g.lineTo(W2, 14); g.lineTo(W2, H2); g.lineTo(0, H2); g.fill(); g.fillStyle = '#c23a2a'; g.fillRect(4, 16, 10, 10); g.fillStyle = '#3a2a1a'; g.font = `400 9px ${FONT.brush}`; const lines = [w.slice(0, 7), w.slice(7)]; lines.forEach((l, k) => g.fillText(l, 18, 26 + k * 12)); });
    const row = i < 10 ? 1.42 : 1.0; E.plane('signCut', -1.35 + (i % 10) * 0.3, row - 0.15, 0.06 + (i % 2) * 0.01, 0.26, 0.2, 0xffffff, { uvr: uv, rz: R(-0.15, 0.15) });
  }
  addInteract({ x: E.w(0, 0, 0.8)[0], z: E.w(0, 0, 0.8)[2], r: 1.8, label: () => '读读绘马上的愿望', act: () => UI.toast('绘马上写着：「' + pick(wishes) + '」') });
  // 地藏
  for (let i = 0; i < 3; i++) jizo(sx - 13 + i * 0.9, sz - 4, sy);
  // 神木
  const tk = new Kit(sx + 12, sy, sz - 6, 0);
  greenTree(sx + 12, sz - 6, 1.8, { y: sy, cards: 900, hue: 0.8 });
  tk.cyl('vc', 0, 1.6, 0, 0.62, 0.12, 0xe8d9a8, { seg: 16 }); for (let i = 0; i < 4; i++) tk.box('vcNoShadow', Math.cos(i * 1.6) * 0.62, 1.38, Math.sin(i * 1.6) * 0.62, 0.12, 0.35, 0.02, 0xffffff, { ry: -i * 1.6 });
  addCollider(sx + 12, sz - 6, 0.6, 0.6, 0, sy, sy + 4, 'wall');
  sakuraTree(sx - 14, sz + 12, 1.1, { y: sy, cards: 1500 }); sakuraTree(sx + 15, sz + 14, 1.0, { y: sy, cards: 1400 });
  for (let i = 0; i < 8; i++) greenTree(sx - 20 + i * 5.6, sz - 20 + R(-2, 2), R(0.9, 1.3), { y: groundAt(sx - 20 + i * 5.6, sz - 20) });
  SHRINE.box = [sx, sz - 3.5]; SHRINE.hall = H.w(0, 0, 5.2);
  addPlace('狐守神社', -40, -110, Math.PI, 'shrine');
  addInteract({ x: SHRINE.hall[0], z: SHRINE.hall[2], r: 2.0, label: () => '摇铃参拜', act: () => GAME.pray() });
}
function torii(x, z, y, s, col, small) {
  const K = new Kit(x, y, z, 0); const w = 4.6 * s, h = 5.0 * s;
  for (const e of [-1, 1]) { K.cyl('paint', e * w / 2, h / 2, 0, 0.22 * s, h, col, { rt: 0.85, seg: 12 }); K.cyl('vc', e * w / 2, 0.25 * s, 0, 0.26 * s, 0.5 * s, 0x2a2a2a, { seg: 12 }); if (!small) addCollider(x + e * w / 2, z, 0.3, 0.3, 0, y, y + h, 'wall'); }
  K.box('paint', 0, h - 0.9 * s, 0, w + 0.6 * s, 0.3 * s, 0.32 * s, col);
  K.box('paint', 0, h + 0.05 * s, 0, w + 1.6 * s, 0.35 * s, 0.45 * s, col, { rz: 0 });
  K.box('vc', 0, h + 0.3 * s, 0, w + 1.9 * s, 0.18 * s, 0.5 * s, 0x2a2a2a);
  if (!small) { K.box('vc', 0, h - 0.45 * s, 0.17 * s, 0.6 * s, 0.75 * s, 0.05, 0x2a2a2a); const uv = allocSign(60, 80, (g, w2, h2) => { g.fillStyle = '#2a2a2a'; g.fillRect(0, 0, w2, h2); g.fillStyle = '#d9b45a'; g.font = `400 28px ${FONT.brush}`; g.textAlign = 'center'; g.fillText('狐', w2 / 2, 34); g.fillText('守', w2 / 2, 68); }); K.plane('sign', 0, h - 0.45 * s, 0.2 * s, 0.5 * s, 0.66 * s, 0xffffff, { uvr: uv }); }
}
function crowAt(x, y, z, ry) { // 停栖的乌鸦（电线、鸟居上）
  const k = new Kit(x, y, z, ry);
  k.sph('vcNoShadow', 0, 0.09, 0, 0.09, 0.11, 0.13, 0x1c1c22, { lo: true });
  k.sph('vcNoShadow', 0, 0.19, 0.06, 0.06, 0.07, 0.07, 0x1c1c22, { lo: true });
  k.box('vcNoShadow', 0, 0.19, 0.13, 0.03, 0.03, 0.07, 0xe8b040);
  k.box('vcNoShadow', 0, 0.07, -0.15, 0.06, 0.03, 0.16, 0x1c1c22);
}
function stoneLantern(x, z, y) {
  const K = new Kit(x, y, z, 0);
  K.box('stone', 0, 0.15, 0, 0.8, 0.3, 0.8, 0xc9c2b4); K.cyl('stone', 0, 0.8, 0, 0.16, 1.0, 0xc9c2b4, { seg: 8 });
  K.box('stone', 0, 1.35, 0, 0.7, 0.12, 0.7, 0xc9c2b4); K.box('stone', 0, 1.65, 0, 0.5, 0.5, 0.5, 0xd2ccbf);
  K.box('glow', 0, 1.65, 0, 0.3, 0.25, 0.52, 0xfff0c8); K.cyl('stone', 0, 2.05, 0, 0.55, 0.3, 0xc9c2b4, { rt: 0.15, seg: 6 });
  K.sph('stone', 0, 2.3, 0, 0.1, 0.14, 0.1, 0xc9c2b4);
  addHalo(x, y + 1.65, z, 2.2, 0xffd49a); addCollider(x, z, 0.4, 0.4, 0, y, y + 2.3, 'wall');
}
function foxStatue(x, z, y, s) {
  const K = new Kit(x, y, z, s > 0 ? -0.3 : 0.3);
  K.box('stone', 0, 0.6, 0, 0.9, 1.2, 0.9, 0xbdb6a8, { solid: true });
  K.sph('stone', 0, 1.65, -0.05, 0.3, 0.42, 0.3, 0xe8e2d8);
  K.sph('stone', 0, 2.2, 0.08, 0.2, 0.2, 0.22, 0xe8e2d8); K.cyl('stone', 0, 2.17, 0.3, 0.07, 0.25, 0xe8e2d8, { rt: 0.4, rx: Math.PI / 2, seg: 8 });
  for (const e of [-1, 1]) K.cyl('stone', e * 0.1, 2.42, 0.06, 0.07, 0.22, 0xe8e2d8, { rt: 0.05, seg: 6 });
  K.cyl('vcNoShadow', 0, 1.95, 0.1, 0.19, 0.18, 0xd84a4a, { rt: 0.6, seg: 10 });
  K.sph('stone', s * 0.22, 1.5, -0.3, 0.12, 0.35, 0.12, 0xe8e2d8, { rz: s * 0.6 });
}
function jizo(x, z, y) {
  const K = new Kit(x, y, z, Math.PI);
  K.box('stone', 0, 0.15, 0, 0.6, 0.3, 0.6, 0xbdb6a8); K.cyl('stone', 0, 0.6, 0, 0.22, 0.6, 0xc9c2b4, { rt: 0.8, seg: 10 }); K.sph('stone', 0, 1.02, 0, 0.17, 0.19, 0.17, 0xc9c2b4);
  K.cyl('vcNoShadow', 0, 0.78, 0.04, 0.24, 0.22, 0xd84a4a, { rt: 0.7, seg: 10 }); K.cyl('vcNoShadow', 0, 1.18, 0, 0.17, 0.08, 0xd84a4a, { seg: 10 });
}

/* ---------------- 港口 ---------------- */
const BOATS = [];
function buildHarbor() {
  // 护岸
  WK.box('concrete', 128, -1.2, 15, 1.2, 6.4, 88, 0xc9c5bd, { wuv: 0.4 });
  WK.box('concrete', 152, -1.2, -28, 48, 6.4, 1.2, 0xc9c5bd, { wuv: 0.4 }); WK.box('concrete', 152, -1.2, 58, 48, 6.4, 1.2, 0xc9c5bd, { wuv: 0.4 });
  WK.box('concrete', 117, TOWN_Y + 0.02, 15, 22, 0.04, 88, 0xd8d4cc, { wuv: 0.3 });
  addCollider(128.4, 15, 0.3, 44, 0, -5, TOWN_Y + 0.25, 'wall');
  for (let z = -24; z <= 54; z += 6) { WK.cyl('paint', 127.2, TOWN_Y + 0.3, z, 0.18, 0.6, 0x2a2a2a, { seg: 10 }); WK.sph('paint', 127.2, TOWN_Y + 0.62, z, 0.22, 0.12, 0.22, 0x2a2a2a); }
  WK.box('vcNoShadow', 127.4, TOWN_Y + 0.045, 15, 0.15, 0.01, 88, 0xf6d04d);
  // 栈桥
  const pz = 15;
  WK.box('wood', 150, TOWN_Y - 0.1, pz, 44, 0.3, 4, 0xb08560, { solid: { walk: true }, wuv: 0.6 });
  for (let x = 130; x <= 172; x += 3) for (const s of [-1, 1]) WK.cyl('wood', x, -1.5, pz + s * 1.8, 0.16, 7, 0x6a4a2a, { seg: 8 });
  for (const s of [-1, 1]) { WK.box('wood', 150, TOWN_Y + 0.6, pz + s * 1.95, 44, 0.08, 0.08, 0x8a6a4a); for (let x = 129; x <= 172; x += 2.2) WK.box('wood', x, TOWN_Y + 0.3, pz + s * 1.95, 0.08, 0.6, 0.08, 0x8a6a4a); addCollider(150, pz + s * 1.95, 22, 0.08, 0, TOWN_Y, TOWN_Y + 0.7, 'wall'); }
  addCollider(172.1, pz, 0.08, 2, 0, TOWN_Y, TOWN_Y + 0.7, 'wall');
  WK.box('wood', 171, TOWN_Y + 0.25, pz, 0.6, 0.2, 0.6, 0x8a6a4a);
  HARBOR.fish = { x: 170.5, z: pz, y: TOWN_Y + 0.05 };
  addInteract({ x: 170.5, z: pz, r: 2.0, label: () => GAME.fishing ? '收竿！' : '在栈桥尽头钓鱼', act: () => GAME.fish() });
  // 防波堤与红灯塔
  WK.box('concrete', 150, TOWN_Y - 1, -25.5, 46, 6, 4, 0xc9c5bd, { solid: { walk: true }, wuv: 0.4 });
  for (let i = 0; i < 22; i++) WK.geo('concrete', new THREE.TetrahedronGeometry(1.4), 130 + i * 2.1, R(0, 0.8), -22.5 + R(-0.3, 0.3), 0xd2cec6, { rx: R(0, 3), ry: R(0, 3) });
  const L = new Kit(171, TOWN_Y, -25.5, 0);
  L.cyl('paint', 0, 3, 0, 1.0, 6, 0xd8432f, { rt: 0.75, seg: 16 }); L.cyl('paint', 0, 6.3, 0, 0.9, 0.6, 0xffffff, { seg: 16 }); L.cyl('glow', 0, 7.0, 0, 0.5, 0.8, 0xffd8c8, { seg: 12 }); L.cyl('paint', 0, 7.6, 0, 0.75, 0.3, 0xd8432f, { rt: 0.2, seg: 12 });
  addHalo(171, TOWN_Y + 7.0, -25.5, 6, 0xff8870); addCollider(171, -25.5, 1, 1, 0, TOWN_Y, TOWN_Y + 7, 'wall');
  // 渔船
  for (const [x, z, ry] of [[134, 22, 0], [138, 8, Math.PI], [145, 30, 0.2], [156, 4, Math.PI - 0.1], [142, 44, 0.1], [160, 26, -0.15]]) BOATS.push(fishingBoat(x, z, ry));
  // 外海锚泊船与航道浮标
  for (const [bx, bz, bry] of [[64, 168, 0.7], [-48, 172, 2.5], [208, 58, -0.8], [98, 185, 1.9]]) BOATS.push(fishingBoat(bx, bz, bry));
  for (const [bx, bz] of [[156, 60], [170, 76], [190, 42], [74, 148], [-28, 152], [198, 26], [120, 152]]) {
    const K2 = new Kit(bx, -0.15, bz, R(0, TAU));
    K2.cyl('paint', 0, 0.5, 0, 0.55, 1.0, pick([0xd8432f, 0x2f7d5b, 0xe8c33a]), { rt: 0.72, seg: 10 });
    K2.cyl('paint', 0, 1.12, 0, 0.4, 0.3, 0xffffff, { seg: 10 });
    K2.cyl('vc', 0, 1.55, 0, 0.06, 0.85, 0x555555, { seg: 6 });
    K2.sph('glow', 0, 1.95, 0, 0.13, 0.13, 0.13, 0xffd8a0, { lo: true });
  }
  // 渔协市场棚
  const M = new Kit(116, TOWN_Y, 30, Math.PI / 2);
  for (const px of [-7, -2.3, 2.3, 7]) for (const pz of [-3, 3]) M.cyl('paint', px, 2.3, pz, 0.12, 4.6, 0x8a9aa8, { seg: 8 });
  M.box('metal', 0, 4.65, 0, 16, 0.12, 7.6, 0x7fa3b8, { rx: 0.08, wuv: 1 });
  for (let i = 0; i < 4; i++) { const tx = -5 + i * 3.3; M.box('vc', tx, 0.45, 0, 2.4, 0.9, 1.2, 0xd8dde0); for (let k = 0; k < 6; k++) { M.box('vcNoShadow', tx - 0.9 + (k % 3) * 0.9, 0.95, (k < 3 ? -0.3 : 0.3), 0.75, 0.15, 0.5, 0xffffff); M.sph('vcNoShadow', tx - 0.9 + (k % 3) * 0.9, 1.05, (k < 3 ? -0.3 : 0.3), 0.3, 0.06, 0.1, pick([0x9aa8b8, 0xd88a6a, 0x6f8fa8, 0xe2b0a0]), { lo: true }); } }
  for (let i = 0; i < 12; i++) M.box('vc', R(-7, 7), 0.25 + Math.floor(i / 6) * 0.42, R(3.6, 5), 0.6, 0.4, 0.45, pick([0x2c7bd8, 0xd9483b, 0xf6d04d, 0xffffff]));
  const fsUV = drawShopSign({ id: 'fish', cn: '蓝鲸鱼铺', en: 'BLUE WHALE FISH', tel: '0898-25-1170', font: 'round', bg: '#2c6ea0', fg: '#ffffff', ac: '#9fd2ee' }, 600, 100);
  M.box('vc', 0, 5.3, -3.9, 6.2, 1.0, 0.12, 0x333333); M.plane('sign', 0, 5.3, -3.83, 6, 0.95, 0xffffff, { uvr: fsUV });
  SHOPS.push({ def: { id: 'fish', cn: '蓝鲸鱼铺', hours: [6, 18] }, x: 112, z: 30, door: [113, 0, 30], ry: -Math.PI / 2, open(h) { return h >= 6 && h < 18; } });
  // 仓库
  warehouse(122, -8, 0x6f8fa8, '星见渔协 1号'); warehouse(122, 52, 0xb86a4a, '海风仓库');
  // 浮标、渔网、木箱
  for (let i = 0; i < 10; i++) WK.sph('paint', R(132, 175), 0.1, R(-15, 50), 0.35, 0.35, 0.35, pick([0xf39a3d, 0xd9483b, 0xffffff]));
  for (let i = 0; i < 8; i++) WK.box('wood', R(118, 125), TOWN_Y + 0.3, R(-20, 50), 0.9, 0.6, 0.6, 0xa07850, { ry: R(0, 1), solid: true });
  for (let i = 0; i < 3; i++) WK.sph('vc', R(118, 124), TOWN_Y + 0.2, R(0, 40), 1.2, 0.3, 0.9, 0x3d6b5a, { lo: true });
  // 堆场作业面：集装箱垛、蟹笼、缆绳盘、托盘——码头不是空场
  { const CS = new Kit(124, TOWN_Y, 44, 0.06);
    for (const [cx, cz, lv, c] of [[0, 0, 0, 0x3a6ea8], [0, 0, 1, 0xb8443a], [6.4, 0.3, 0, 0x3f7d5a], [3.2, 0.15, 1, 0x8a9096]]) CS.box('vc', cx, 1.3 + lv * 2.6, cz, 6, 2.6, 2.4, c);
    addCollider(124, 44, 5, 2, 0.05, TOWN_Y, TOWN_Y + 5.2, 'wall'); }
  for (let i = 0; i < 6; i++) { const px = 120 + (i % 3) * 1.5, pz = -16 + Math.floor(i / 3) * 1.5;
    WK.box('wood', px, TOWN_Y + 0.45, pz, 1.3, 0.9, 1.3, 0x4a3c2a, { wuv: 1.2 });
    WK.box('vcNoShadow', px, TOWN_Y + 0.45, pz, 1.34, 0.1, 1.34, 0x2a2018); }
  for (const [rx, rz] of [[126, 20], [125, 22.2], [109, 46]]) { WK.geo('wood', new THREE.TorusGeometry(0.7, 0.28, 8, 18), rx, TOWN_Y + 0.28, rz, 0x7a6a4a, { rx: Math.PI / 2 }); }
  for (const [px, pz] of [[112, 52], [113.2, 52], [112.6, 53.4]]) { WK.box('wood', px, TOWN_Y + 0.12, pz, 1.1, 0.12, 1.3, 0xb0956a); WK.box('wood', px, TOWN_Y + 0.3, pz, 1.1, 0.12, 1.3, 0xa08858); }
  // 码头面轮胎痕与压痕（深色长条贴片，两处转弯位）
  for (const [tx, tz, tl, ta] of [[115, 8, 14, 0.15], [113, 36, 10, -0.2]]) WK.plane('vcNoShadow', tx, TOWN_Y + 0.045, tz, 0.9, tl, 0x3c3a38, { rx: -Math.PI / 2, ry: ta });
  addPlace('星见港', 122, 15, -Math.PI / 2, 'harbor');
}
const HARBOR = {};
function warehouse(x, z, col, label) {
  const K = new Kit(x, TOWN_Y, z, Math.PI / 2); const w = 18, d = 12, h = 7;
  K.box('metal', 0, h / 2, -d / 2, w, h, d, col, { solid: true, wuv: 0.5 });
  gableRoof(K, 0, h, -d / 2, w, d, 1.5, 0x8a959e, 0, 0.3);
  K.box('vc', 0, 2.5, 0.05, 6, 5, 0.1, 0x55606a);
  const uv = allocSign(400, 70, (g, W, H) => { g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, W, H); g.fillStyle = '#26375e'; g.font = `400 40px ${FONT.wei}`; g.textAlign = 'center'; g.fillText(label, W / 2, 50); });
  K.plane('sign', 0, 5.8, 0.06, 5, 0.9, 0xffffff, { uvr: uv });
}
function fishingBoat(x, z, ry) {
  if (MODELS.boat) { const M = MODELS.boat; if (!M.toon) M.toon = animeToon(M.mat, false); const g = new THREE.Mesh(M.geo, M.toon); addOutline(g, 0.02); g.castShadow = true; g.receiveShadow = true; g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); return { g, x, z, ry, ph: R(0, TAU), sink: 0.75 }; }
  const g = buildLocal(() => {
    const K = new Kit(0, 0, 0, 0);
    const hull = new THREE.Shape(); hull.moveTo(-4, 1.4); hull.lineTo(4.6, 1.6); hull.quadraticCurveTo(4.2, 0.2, 2.5, -0.4); hull.lineTo(-3.6, -0.4); hull.lineTo(-4, 1.4);
    const geo = new THREE.ExtrudeGeometry(hull, { depth: 2.6, bevelEnabled: true, bevelSize: 0.3, bevelThickness: 0.3, bevelSegments: 2 }); geo.translate(0, 0, -1.3);
    const c = pick([0xffffff, 0x9fd2ee, 0xf4efe4]);
    K.geo('paint', geo, 0, 0, 0, c);
    K.box('paint', 0, 0.4, 0, 8, 0.25, 3.4, pick([0x2c6ea0, 0xd9483b, 0x2f7d5b]));
    K.box('wood', 0, 1.55, 0, 8.2, 0.08, 2.6, 0xc9a06a);
    K.box('paint', -1.5, 2.6, 0, 2.2, 2.0, 2.0, 0xf4f1ea); K.box('paint', -1.5, 3.65, 0, 2.5, 0.12, 2.3, 0x2c6ea0);
    K.plane('glass', -0.39, 2.9, 0, 1.6, 0.7, 0xffffff, { ry: Math.PI / 2 });
    K.cyl('vc', -1.5, 4.8, 0, 0.06, 2.4, 0xdddddd, { seg: 6 }); K.box('vc', -1.5, 5.5, 0, 0.05, 0.05, 1.6, 0xdddddd);
    K.cyl('glow', -1.5, 4.1, 0.9, 0.1, 0.2, 0xffeedd, { seg: 8 });
    for (let i = 0; i < 4; i++) K.sph('glow', 1.2 + i * 0.9, 3.0, 0, 0.18, 0.24, 0.18, 0xfff4d0, { lo: true });
    K.box('vc', 1.2 + 1.35, 3.25, 0, 3.0, 0.03, 0.03, 0x555555);
  });
  g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  return { g, x, z, ry, ph: R(0, TAU) };
}

/* ---------------- 灯塔岬 ---------------- */
const LIGHTHOUSE = {};
function buildCape() {
  const { x, z, y } = CAPE;
  const K = new Kit(x + 2, y, z - 3, 0);
  K.cyl('plaster', 0, 0.5, 0, 3.0, 1.0, 0xe9e4da, { seg: 24 });
  K.cyl('plaster', 0, 7, 0, 2.2, 12, 0xfbfaf6, { rt: 0.72, seg: 24 });
  K.cyl('paint', 0, 13.1, 0, 2.2, 0.3, 0x2a3a4a, { seg: 24 });
  for (let i = 0; i < 24; i++) { const a = i * TAU / 24; K.box('paint', Math.cos(a) * 2.05, 13.65, Math.sin(a) * 2.05, 0.05, 0.8, 0.05, 0x2a3a4a); }
  K.geo('paint', new THREE.TorusGeometry(2.05, 0.04, 6, 32), 0, 14.05, 0, 0x2a3a4a, { rx: Math.PI / 2 });
  K.cyl('glass', 0, 14.2, 0, 1.15, 2.0, 0xffffff, { seg: 16 });
  K.cyl('glow', 0, 14.2, 0, 0.55, 1.0, 0xfff6d8, { seg: 12 });
  K.cyl('paint', 0, 15.5, 0, 1.4, 0.8, 0x2a3a4a, { rt: 0.2, seg: 16 }); K.sph('paint', 0, 16.0, 0, 0.2, 0.2, 0.2, 0x2a3a4a);
  for (let i = 0; i < 4; i++) windowAt(K, 0, 3 + i * 2.6, 0, 0.5, 0.7, 0x2a3a4a, { v: 3 });
  K.box('wood', 0, 1.2, 1.9, 1.1, 2.0, 0.6, 0x2a3a4a);
  addCollider(x + 2, z - 3, 2.6, 2.6, 0, y, y + 15, { round: true, noFloor: true });
  addHalo(x + 2, y + 14.2, z - 3, 14, 0xfff2c8);
  // 旋转光束
  const beamTex = canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,245,210,0.55)'); gr.addColorStop(1, 'rgba(255,245,210,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const beamG = new THREE.ConeGeometry(6, 70, 24, 1, true); beamG.translate(0, -35, 0); beamG.rotateZ(Math.PI / 2);
  const beamM = new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0 });
  const beam = new THREE.Group(); const b1 = new THREE.Mesh(beamG, beamM); const b2 = b1.clone(); b2.rotation.y = Math.PI; beam.add(b1, b2);
  beam.position.set(x + 2, y + 14.2, z - 3); scene.add(beam);
  LIGHTHOUSE.beam = beam; LIGHTHOUSE.beamM = beamM;
  // 守塔人小屋
  const C = new Kit(x - 8, y, z + 4, 0.4);
  C.box('plaster', 0, 1.4, -2.5, 6, 2.8, 5, 0xf6f1e6, { solid: true, wuv: 0.4 });
  gableRoof(C, 0, 2.8, -2.5, 6, 5, 1.6, 0x2c5aa0, 0, 0.4);
  C.box('wood', 1.4, 1.0, 0.02, 0.9, 2.0, 0.08, 0x2c5aa0); windowAt(C, -1.3, 1.6, 0, 1.2, 1.0);
  C.cyl('vc', 2.4, 3.6, -3.4, 0.25, 1.4, 0x8a8f94, { seg: 8 });
  houseMailbox(C, 2.6, 1.0, '林');
  MAILBOXES[MAILBOXES.length - 1].name = '灯塔';
  // 悬崖栅栏与长椅
  for (let a = -2.4; a <= 0.9; a += 0.18) { const r = 15.5; const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; WK.box('wood', px, groundAt(px, pz) + 0.5, pz, 0.1, 1.0, 0.1, 0x8a6a4a); }
  for (let a = -2.4; a < 0.9; a += 0.36) { const r = 15.5; const a2 = a + 0.36; const p1 = [x + Math.cos(a) * r, z + Math.sin(a) * r], p2 = [x + Math.cos(a2) * r, z + Math.sin(a2) * r]; const m = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]; const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]); const ry = Math.atan2(p2[0] - p1[0], p2[1] - p1[1]); WK.box('wood', m[0], groundAt(m[0], m[1]) + 0.85, m[1], 0.06, 0.06, L, 0x8a6a4a, { ry }); addCollider(m[0], m[1], 0.1, L / 2, ry, y - 5, y + 1, 'wall'); }
  parkBench(x + 9, z - 8, Math.atan2(1, -0.6) + 0.4, y);
  parkBench(x + 4, z + 8, Math.atan2(0.8, 0.9), y);
  // 小路标识与松树
  for (const [px, pz] of [[x - 12, z - 10], [x - 14, z + 2], [x + 6, z + 12], [x - 4, z - 14]]) pineTree(px, pz, R(0.9, 1.2));
  for (let i = 0; i < 4; i++) { const p = CAPE_PATH[i]; pineTree(p[0] + R(4, 7), p[1] + R(-3, 3), R(0.8, 1.1)); }
  for (let i = 0; i < 14; i++) { const t = R(0, CAPE_PATH.length - 1.01); const k = Math.floor(t), f = t - k; const px = lerp(CAPE_PATH[k][0], CAPE_PATH[k + 1][0], f) + R(-1.6, 1.6), pz = lerp(CAPE_PATH[k][1], CAPE_PATH[k + 1][1], f) + R(-1.6, 1.6); WK.box('wood', px, groundAt(px, pz) + 0.08, pz, 1.2, 0.12, 0.35, 0x8a6a4a, { ry: R(0, 3) }); }
  const sUV = allocSign(220, 120, (g, w, h) => { g.fillStyle = '#7a5a3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f6efe0'; g.font = `400 30px ${FONT.wei}`; g.textAlign = 'center'; g.fillText('↑ 星见灯塔', w / 2, 48); g.font = `500 16px ${FONT.sans}`; g.fillText('观景台 · 300m', w / 2, 88); });
  const sk = new Kit(100.5, TOWN_Y, -86, -0.6); sk.box('wood', 0, 0.8, 0, 0.1, 1.6, 0.1, 0x5a3a20); sk.plane('sign', 0, 1.5, 0.06, 1.0, 0.55, 0xffffff, { uvr: sUV });
  LIGHTHOUSE.door = C.w(1.4, 0, 1.0);
  addPlace('星见灯塔', x - 2, z + 6, -0.6, 'cape');
}

/* ---------------- 沙滩 ---------------- */
const SHELLS = [];
function buildBeach() {
  // 广场 → 沙滩台阶
  for (let i = 0; i < 6; i++) { const z = 105.5 + i * 0.9; const y = groundAt(0, z + 0.45); WK.box('stone', 0, y - 0.2, z + 0.45, 6, 0.4, 0.9, 0xd8d2c6, { wuv: 0.5 }); }
  // 木栈道
  for (let i = 0; i < 18; i++) { const x = -30 + i * 3.4; const z = 112; const y = groundAt(x, z) + 0.25; WK.box('wood', x, y, z, 3.3, 0.12, 2.0, 0xc9a06a, { wuv: 0.6, solid: { walk: true } }); WK.box('wood', x, y - 0.4, z + 0.9, 0.12, 0.8, 0.12, 0x8a6a4a); }
  // 冰室小屋（海盐冰室）
  const K = new Kit(26, groundAt(26, 117), 117, Math.PI);
  K.box('wood', 0, 1.4, 1.5, 5, 2.8, 3, 0xf4f1ea, { solid: true, wuv: 0.5 });
  K.box('vc', 0, 2.9, 0.6, 5.6, 0.12, 2.6, 0x2a8f8f, { rx: 0.15 });
  K.box('wood', 0, 1.0, -0.05, 4, 0.1, 0.6, 0xc9a06a);
  const iUV = drawShopSign({ id: 'ice', cn: '海盐冰室', en: 'SEA SALT ICE', tel: '0898-25-0808', font: 'round', bg: '#9fd2ee', fg: '#26375e', ac: '#ffffff' }, 480, 90);
  K.plane('sign', 0, 2.45, 0.01 + 0.0, 4.2, 0.78, 0xffffff, { uvr: iUV });
  K.cyl('vc', -2.2, 1.1, -0.6, 0.18, 0.5, 0xf4c27a, { rt: 0.02 / 0.18, seg: 12, rx: Math.PI }); K.sph('vc', -2.2, 1.45, -0.6, 0.22, 0.22, 0.22, 0xf8f4f0);
  SHOPS.push({ def: { id: 'ice', cn: '海盐冰室', hours: [10, 19] }, x: 26, z: 115.5, door: K.w(0, 0, -0.5), ry: 0, open(h) { return h >= 10 && h < 19; } });
  // 遮阳伞、躺椅
  for (const [x, z] of [[-20, 126], [-8, 131], [8, 128], [42, 129], [54, 124]]) {
    const y = groundAt(x, z); const U = new Kit(x, y, z, R(0, 3));
    U.cyl('vc', 0, 1.3, 0, 0.04, 2.6, 0xffffff, { seg: 6, rz: 0.1 });
    const cone = new THREE.ConeGeometry(1.6, 0.6, 12, 1, true);
    U.geo('paint', cone, 0.2, 2.55, 0, pick([0xe48fa6, 0x2a8f8f, 0xf6d04d, 0xd9483b]), { rz: 0.1 });
    U.box('wood', 1.4, 0.25, 0.4, 0.7, 0.06, 1.8, 0xffffff, { rx: 0.1 });
  }
  // 海之家：木板平台、苇帘、桌椅、旗子与冲脚水龙头
  { const hx = -52, hz = 117; const y = groundAt(hx, hz); const H = new Kit(hx, y, hz, Math.PI);
    H.box('wood', 0, 0.35, 0, 12, 0.3, 8, 0xc9a06a, { solid: { walk: true }, wuv: 0.6 });
    for (const [px, pz] of [[-5.8, -3.8], [5.8, -3.8], [-5.8, 3.8], [5.8, 3.8], [0, -3.8], [0, 3.8]]) H.box('wood', px, 1.7, pz, 0.16, 2.7, 0.16, 0x8a6a4a);
    H.box('vc', 0, 3.1, 0, 12.6, 0.12, 8.6, 0x2a8f8f, { rx: 0.06 }); H.box('vc', 0, 2.9, 4.2, 12.6, 0.4, 0.06, 0xf4f1ea);
    H.box('wood', 0, 1.7, -3.9, 12, 2.6, 0.08, 0xd8c8a0); // 后墙（苇帘）
    for (let i = 0; i < 4; i++) { const tx = -4.2 + i * 2.8; H.box('wood', tx, 1.05, 1, 1.6, 0.06, 0.9, 0xf2f2f0); H.box('vc', tx, 0.75, 1, 0.08, 0.7, 0.08, 0x777777); for (const sz of [0.2, 1.8]) H.box('paint', tx, 0.75, sz, 0.5, 0.06, 0.4, pick([0xe9483b, 0x2c7bd8, 0xf6d04d])); }
    H.box('wood', -3, 1.0, -3.0, 5, 1.0, 0.8, 0xb08a60); for (let i = 0; i < 5; i++) H.box('vcNoShadow', -5 + i, 1.65, -3.2, 0.5, 0.3, 0.4, pick([0xf6d04d, 0xffffff, 0xe48fa6]));
    const hUV = allocSign(400, 90, (g, w, h2) => { g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, w, h2); g.fillStyle = '#d9483b'; g.font = `900 58px ${FONT.sans}`; g.textAlign = 'center'; g.fillText('海之家 · 汐风', w / 2, 68); });
    H.plane('sign', 0, 2.85, 4.24, 5.4, 1.2, 0xffffff, { uvr: hUV });
    for (const fx of [-7.5, 7.5]) { H.cyl('vc', fx, 1.6, 4.5, 0.03, 3.2, 0xdddddd, { seg: 6 }); H.box('vcNoShadow', fx + 0.4, 2.7, 4.5, 0.75, 1.2, 0.02, fx < 0 ? 0xd9483b : 0x2c6ea0); }
    for (let i = 0; i < 6; i++) H.box('paint', -5 + i * 2, 0.9, -4.3, 0.55, 1.4, 0.1, pick([0x2c7bd8, 0xf6d04d, 0xe9483b, 0x7ac27a]), { rz: 0.15 });
    const sh = H.w(9, 0, 1); WK.cyl('paint', sh[0], y + 1.2, sh[2], 0.05, 2.4, 0x9aa0a6, { seg: 8 }); WK.box('paint', sh[0], y + 2.35, sh[2] + 0.25, 0.1, 0.1, 0.5, 0x9aa0a6); WK.box('concrete', sh[0], y + 0.06, sh[2], 1.6, 0.12, 1.6, 0xd8d4cc); }
  // 沙滩上的浴巾与凉鞋
  for (const [x, z] of [[-14, 129], [2, 133], [36, 132], [50, 127]]) { WK.box('vcNoShadow', x, groundAt(x, z) + 0.02, z, 0.9, 0.01, 1.8, pick([0xe48fa6, 0xf6d04d, 0x9fd2ee, 0xffffff]), { ry: R(-0.4, 0.4), noCol: true }); }
  // 救生塔、小船
  const T = new Kit(64, groundAt(64, 128), 128, Math.PI);
  for (const sx of [-0.7, 0.7]) for (const sz of [-0.7, 0.7]) T.box('wood', sx, 1.2, sz, 0.12, 2.4, 0.12, 0xffffff);
  T.box('wood', 0, 2.4, 0, 1.6, 0.1, 1.6, 0xffffff); T.box('paint', 0, 2.8, 0.75, 1.6, 0.5, 0.06, 0xd9483b); T.box('vc', 0, 3.6, 0, 2.0, 0.08, 2.0, 0xd9483b);
  const rb = buildLocal(() => { const k = new Kit(0, 0, 0, 0); const hs = new THREE.Shape(); hs.moveTo(-2, 0.6); hs.lineTo(2.2, 0.7); hs.quadraticCurveTo(2, 0, 1.2, -0.2); hs.lineTo(-1.8, -0.2); hs.lineTo(-2, 0.6); const g = new THREE.ExtrudeGeometry(hs, { depth: 1.2, bevelEnabled: false }); g.translate(0, 0, -0.6); k.geo('paint', g, 0, 0, 0, 0x2c6ea0); k.box('wood', 0, 0.45, 0, 3.8, 0.06, 1.1, 0xc9a06a); });
  rb.position.set(-34, groundAt(-34, 118) + 0.2, 118); rb.rotation.set(0.05, 0.6, 0.12); scene.add(rb);
  // 漂流木与贝壳
  for (let i = 0; i < 6; i++) { const x = R(-60, 80), z = R(128, 140); WK.cyl('bark', x, groundAt(x, z) + 0.12, z, 0.15, R(1.5, 3), 0xb8a890, { rz: Math.PI / 2, ry: R(0, 3), seg: 6 }); }
  for (let i = 0; i < 14; i++) {
    let x, z, tries = 0; do { x = R(-70, 90); z = R(108, 150); tries++; } while ((terrainH(x, z) < 0.15 || terrainH(x, z) > 1.4) && tries < 40);
    const y = terrainH(x, z); const col = pick([0xfbe3d6, 0xf8d0dc, 0xffffff, 0xf6e2b8]);
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, emissive: col, emissiveIntensity: 0.15 }));
    m.scale.set(1, 0.5, 0.8); m.position.set(x, y + 0.02, z); m.rotation.y = R(0, 3); scene.add(m);
    const sh = { m, x, z, got: false };
    SHELLS.push(sh);
    addInteract({ x, z, r: 1.3, cond: () => !sh.got, label: () => '捡起贝壳', act: () => GAME.pickShell(sh) });
  }
  // 漂流瓶
  const bx = -48, bz = 132; const by = groundAt(bx, bz);
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.32, 10), new THREE.MeshStandardMaterial({ color: 0x9fd8c8, transparent: true, opacity: 0.75, roughness: 0.15, emissive: 0x2a6a5a, emissiveIntensity: 0.3 }));
  bottle.position.set(bx, by + 0.08, bz); bottle.rotation.z = Math.PI / 2 - 0.2; scene.add(bottle);
  BEACH.bottle = bottle;
  addInteract({ x: bx, z: bz, r: 1.4, cond: () => bottle.visible, label: () => '捡起漂流瓶', act: () => GAME.bottle() });
  addPlace('月牙沙滩', 10, 118, Math.PI, 'beach');
}
const BEACH = {};

/* ---------------- 民居区 ---------------- */
function resLamp(x, z, ry) {
  const k = new Kit(x, SW_Y, z, ry);
  k.cyl('paint', 0, 2.5, 0, 0.06, 5.0, 0x4a5454, { rt: 0.7, seg: 8 });
  k.cyl('paint', 0, 0.22, 0, 0.11, 0.44, 0x4a5454, { seg: 8 });
  k.rod('paint', [0, 4.7, 0], [-0.6, 5.0, 0], 0.03, 0x4a5454);
  k.cyl('glow', -0.62, 4.82, 0, 0.15, 0.3, 0xfff1d0, { rt: 1.2, seg: 10 });
  const p = k.w(-0.62, 4.8, 0); addHalo(p[0], p[1], p[2], 3.4, 0xffe2b0); addLightPool(p[0], SW_Y, p[2], 3.6, 0xffd8a8); addLampCone(p[0], p[1] - 0.05, p[2], SW_Y + 0.05);
  addCollider(x, z, 0.1, 0.1, 0, SW_Y, SW_Y + 4.5, 'wall');
}
function buildResidential() {
  // 主街西侧（学校以南）
  const westLots = [[-46, -8], [-34, -8], [-46, 8], [-34, 8], [-46, 24], [-34, 24]];
  westLots.forEach(([x, z], i) => buildHouse(x, z + 3.5, 0, { w: 9, d: 7, yard: 2.2, tree: i % 2 ? 'sakura' : 'green' }));
  // 东侧后巷（家附近）
  const eastLots = [[30, -34, -Math.PI / 2], [30, 8, -Math.PI / 2], [30, 24, -Math.PI / 2], [44, -32, 0], [44, -12, 0], [56, -30, 0], [80, -30, 0], [84, -10, Math.PI / 2], [86, 28, Math.PI / 2]];
  eastLots.forEach(([x, z, ry], i) => { if (ry === -Math.PI / 2) buildHouse(x - 2.4, z, ry, { w: 8, d: 7, yard: 2.0 }); else buildHouse(x, z, ry, { w: 9, d: 8, yard: 2.4, tree: i % 3 === 0 ? 'sakura' : 'green' }); });
  // 河西民居
  const far = [[-100, -36, Math.PI / 2], [-100, -12, Math.PI / 2], [-100, 12, Math.PI / 2], [-104, 36, Math.PI / 2], [-110, 60, Math.PI / 2]];
  far.forEach(([x, z, ry], i) => buildHouse(x, z, ry, { w: 9, d: 8, yard: 2.6, tree: i % 2 ? 'sakura' : 'green' }));
  // 河西的小路
  WK.box('paving', -96, TOWN_Y + 0.03, 10, 4, 0.06, 110, 0xe5dccd, { wuv: 0.45 });
  // 住宅巷稀疏路灯（主街商店街以外夜里不再全黑）
  for (const [lx, lz, lry] of [[26.5, -36, 0], [21.5, -8, Math.PI], [26.5, 16, 0], [21.5, 30, Math.PI], [-26.5, -6, Math.PI], [-21.5, 12, 0], [-26.5, 28, Math.PI]]) resLamp(lx, lz, lry);
}
