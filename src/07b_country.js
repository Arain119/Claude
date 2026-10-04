/* ==========================================================================
   西部田园与环岛沿线：水田、农舍、温室、加油站、观景台、路边设施
   ========================================================================== */
const FARM = { cells: [], paddy(x, z) { for (const c of this.cells) if (x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1) return true; return false; } };
regMat('dirt', pm(TEX.ground, { roughness: 1 }), { tint: 0.4 });
regMat('vinyl', new THREE.MeshStandardMaterial({ color: lin(0xeef2f2), roughness: 0.3, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.2 }), { cast: false });
function buildCountryside() {
  seed(314);
  // —— 水田格：环岛公路与河西民居之间 ——
  const W = 17, D = 13;
  for (const x of [-152, -133.8]) for (let z = -46; z < 78; z += D + 1.6) {
    const cx = x + W / 2, cz = z + D / 2;
    if (islandC(cx, cz) < 0.06 || riverDist(cx, cz) < 16) continue;
    let ok = true; for (const [ox, oz] of [[0, 0], [-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2], [0, -D / 2], [0, D / 2]]) { if (roadSample(cx + ox, cz + oz) > 0.3 || (x > -140 && (cz > 64 || cz < -34))) ok = false; }
    if (!ok) continue;
    let y = -1e9; for (const [ox, oz] of [[0, 0], [-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]]) y = Math.max(y, terrainH(cx + ox, cz + oz));
    FARM.cells.push({ x0: x, x1: x + W, z0: z, z1: z + D, y, cx, cz });
  }
  // 两格改成温室
  const gh = [FARM.cells[2], FARM.cells[FARM.cells.length - 3]].filter(Boolean);
  for (const c of FARM.cells) {
    const { cx, cz, y } = c;
    for (const sd of [-1, 1]) { WK.box('dirt', cx, y + 0.12, cz + sd * (D / 2 + 0.4), W + 1.6, 0.36, 0.8, 0xb0a080, { wuv: 0.4, noCol: true }); WK.box('dirt', cx + sd * (W / 2 + 0.4), y + 0.12, cz, 0.8, 0.36, D, 0xb0a080, { wuv: 0.4, noCol: true }); }
    if (gh.includes(c)) {
      for (const oz of [-3.2, 3.2]) {
        const g = new THREE.CylinderGeometry(2.8, 2.8, 15, 16, 1, true, -Math.PI / 2, Math.PI); g.rotateZ(Math.PI / 2);
        WK.geo('vinyl', g, cx, y, cz + oz, 0xffffff);
        for (let i = 0; i <= 5; i++) WK.geo('rail', new THREE.TorusGeometry(2.8, 0.03, 4, 16, Math.PI), cx - 7.5 + i * 3, y, cz + oz, 0xb0b4b8, { ry: Math.PI / 2 });
        // 温室垄行：土垄 + 叶簇（不再是实心绿盒）
        for (let i = 0; i < 3; i++) {
          const rz = cz + oz - 1.6 + i * 1.6;
          WK.box('dirt', cx, y + 0.18, rz, 14, 0.3, 0.55, 0x8a7250, { wuv: 0.4, noCol: true });
          const gb = cardBucket('leaf', cx, rz);
          for (let k = 0; k < 40; k++) {
            const px = cx - 6.7 + k * 0.34 + R(-0.1, 0.1), pz = rz + R(-0.2, 0.2), a = R(0, TAU);
            _cB.setHSL(R(0.24, 0.3), R(0.4, 0.55), R(0.28, 0.4));
            addCard(gb, px, y + 0.48 + R(-0.05, 0.05), pz, Math.cos(a), R(0.15, 0.5), Math.sin(a), R(0.34, 0.5), RI(0, 3), _cB, 0.12, 0, 1, 0, 1, a + Math.PI / 2, CROP4[RI(0, 3)]);
          }
        }
        addCollider(cx, cz + oz, 7.5, 2.8, 0, y, y + 2.8, 'wall');
      }
      WK.box('dirt', cx, y + 0.05, cz, W, 0.1, D, 0xa89878, { wuv: 0.4, noCol: true });
      c.gh = true; continue;
    }
    WK.box('paddyMat', cx, y + 0.07, cz, W, 0.02, D, 0xaccadb, { wuv: 0.18, noCol: true });
    // 秧苗行：网格状的新绿苗撮
    { const pb = cardBucket('grass', cx, cz);
      for (let rx = cx - W / 2 + 1.0; rx < cx + W / 2 - 0.6; rx += 1.1) for (let rz2 = cz - D / 2 + 0.9; rz2 < cz + D / 2 - 0.6; rz2 += 0.85) {
        const a = R(0, TAU); _cB.setHSL(R(0.22, 0.26), R(0.5, 0.62), R(0.4, 0.55));
        addCard(pb, rx + R(-0.12, 0.12), y + 0.3, rz2 + R(-0.1, 0.1), Math.cos(a), R(0.6, 1), Math.sin(a), R(0.26, 0.4), 0, _cB, 0.3, 0, 1, 0, 1, a + Math.PI / 2);
      } }
    addCollider(cx, cz, W / 2, D / 2, 0, y - 1, y + 0.08, { walk: true });
  }
  FARM.cells = FARM.cells.filter(c => !c.gh);
  // 田间小路（农用道）与水渠
  WK.box('gravel', -135.2, 2.42, 16, 1.8, 0.06, 124, 0xd8c8a8, { wuv: 0.35, noCol: true });
  WK.box('concrete', -114.6, 1.9, 16, 1.0, 0.6, 124, 0xb8b4ac, { wuv: 0.5, noCol: true }); WK.box('vcNoShadow', -114.6, 2.18, 16, 0.6, 0.02, 124, 0x5a7a7a, { noCol: true });
  // —— 农舍与仓房 ——
  for (const [x, z, ry] of [[-125, 78, 0], [-125, -35, 0]]) {
    if (roadSample(x, z) > 0.05) continue;
    buildHouse(x, z, ry, { w: 10, d: 8, yard: 2.4, wall: 'woodwall', wc: 0xe8e2d6, roof: 0x3a3f46, balcony: false, tree: 'green' });
  }
  // 地藏小祠与稻草人
  { const x = -116, z = 80; const y = terrainH(x, z); const K = new Kit(x, y, z, Math.PI); K.box('wood', 0, 0.6, 0, 1.4, 1.2, 1.0, 0x6a4a2a); K.geo('roof', PRISM, 0, 1.2, 0, 0x3a3f46, { sx: 1.8, sy: 0.6, sz: 1.4 }); jizo(x, z + 0.1, y + 0.2); }
  for (let i = 0; i < 4; i++) { const c = FARM.cells[RI(0, FARM.cells.length - 1)]; if (!c) break; const x = (c.x0 + c.x1) / 2 + R(-5, 5), z = (c.z0 + c.z1) / 2 + R(-3, 3); const K = new Kit(x, c.y, z, R(0, 3)); K.box('wood', 0, 0.8, 0, 0.08, 1.6, 0.08, 0x8a6a4a); K.box('wood', 0, 1.3, 0, 1.2, 0.07, 0.07, 0x8a6a4a); K.box('vc', 0, 1.15, 0, 0.5, 0.6, 0.25, pick([0x3a5a8a, 0xb84a3a, 0x6a7a4a])); K.sph('vc', 0, 1.62, 0, 0.16, 0.18, 0.16, 0xe8d8b0); K.cyl('vc', 0, 1.78, 0, 0.32, 0.12, 0xd8c890, { rt: 0.1, seg: 10 }); }
  addPlace('稻穗水田', -126, 20, -Math.PI / 2, 'farm');
  buildGasStation();
  buildViewpoint();
  // 环岛公路的巴士站与自动售货机
  const ring = ROADS[0];
  if (ring) for (const s of [ring.len * 0.33, ring.len * 0.72]) {
    let pi = Math.round(s / 2); while (pi < ring.pts.length - 1 && ring.pts[pi][6] !== 'grd') pi++; const p = ring.pts[pi]; const lx0 = p[4], lz0 = -p[3]; const inl = islandC(p[0] + lx0 * 20, p[2] + lz0 * 20) > islandC(p[0] - lx0 * 20, p[2] - lz0 * 20) ? -1 : 1; // 放在岛内一侧（远离海与铁路）
    const lx = lx0 * inl, lz = lz0 * inl; const ox = p[0] - lx * (ring.hw + 2.4), oz = p[2] - lz * (ring.hw + 2.4);
    const K = new Kit(ox, terrainH(ox, oz), oz, Math.atan2(-lx, -lz) + Math.PI);
    K.box('concrete', 0, 0.08, 0, 4, 0.16, 2.2, 0xcfc8bc, { solid: { walk: true } });
    K.box('vc', 0, 2.5, 0, 3.6, 0.08, 1.8, 0x3a6a8a); for (const sx of [-1.6, 1.6]) K.box('vc', sx, 1.25, -0.8, 0.07, 2.5, 0.07, 0x8a9096);
    K.box('wood', 0, 0.45, -0.5, 2.6, 0.06, 0.45, 0xb07a4a); K.plane('glass', 0, 1.4, -0.85, 3.4, 2, 0xffffff);
    vendingMachine(new Kit(...K.w(2.6, 0, -0.3), K.ry), 0, 0, 0, pick([0xd9483b, 0x2c7bd8, 0xf2f2f2]));
  }
}
const _laterVeh = [];
function spawnVehicleLater(t, x, z, yaw) { _laterVeh.push([t, x, z, yaw]); }
function buildGasStation() {
  const ring = ROADS[0]; if (!ring) return;
  // 选在环岛路西南段、靠近镇子的一侧
  let best = null; for (const p of ring.pts) { const d = Math.hypot(p[0] + 44, p[2] - 86); if (!best || d < best.d) best = { p, d }; }
  const p = best.p; const lx = p[4], lz = -p[3]; const side = islandC(p[0] + lx * 20, p[2] + lz * 20) > islandC(p[0] - lx * 20, p[2] - lz * 20) ? 1 : -1;
  const cx = p[0] + lx * side * (ring.hw + 14), cz = p[2] + lz * side * (ring.hw + 14); const y = p[1];
  const ry = Math.atan2(-lx * side, -lz * side); // 正面朝向道路
  const K = new Kit(cx, y, cz, ry);
  K.box('concrete', 0, -0.25, 0, 30, 0.6, 24, 0xc8c4bc, { solid: { walk: true }, wuv: 0.3 });
  K.box('asphalt', 0, 0.06, 0, 30, 0.02, 24, 0xffffff, { wuv: 0.22 });
  // 雨棚
  for (const [px, pz] of [[-6, 2], [6, 2], [-6, 8], [6, 8]]) { K.box('paint', px, 2.6, pz, 0.4, 5.2, 0.4, 0xf2f2f0, { solid: true }); }
  K.box('paint', 0, 5.45, 5, 18, 0.6, 11, 0xf4f4f2); K.box('paint', 0, 5.2, 5, 18.2, 0.12, 11.2, 0xe03a2e);
  K.box('glow', 0, 5.1, 5, 14, 0.04, 8, 0xfff8ec); for (const px of [-5, 0, 5]) { const hp = K.w(px, 4.9, 5); addHalo(hp[0], hp[1], hp[2], 7, 0xf4f6ff); addLightPool(hp[0], y, hp[2], 5.5, 0xf0f4ff); }
  const lUV = allocSign(900, 120, (g, w, h) => { g.fillStyle = '#e03a2e'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = `900 70px ${FONT.sans}`; g.textAlign = 'center'; g.fillText('海风石油  HAIFU OIL', w / 2, 86); });
  K.plane('sign', 0, 5.45, 10.52, 13, 0.55, 0xffffff, { uvr: lUV });
  // 加油机
  for (const px of [-6, 6]) for (const pz of [5]) {
    K.box('concrete', px, 0.15, pz, 1.2, 0.3, 3.2, 0xd8d4cc, { solid: true });
    K.box('paint', px, 1.2, pz, 0.8, 1.9, 0.6, 0xf2f2f0, { solid: true }); K.box('paint', px, 1.7, pz, 0.82, 0.5, 0.62, 0xe03a2e);
    K.box('glow', px, 1.3, pz + 0.31, 0.5, 0.3, 0.02, 0x9fe0ff); K.box('vc', px + 0.42, 1.0, pz, 0.06, 0.6, 0.12, 0x222222);
  }
  // 便利店小楼
  K.box('plaster', 0, 2.0, -6.5, 14, 4, 7, 0xf4f2ee, { solid: true, wuv: 0.4 });
  K.box('vc', 0, 4.2, -6.5, 14.2, 0.4, 7.2, 0xe03a2e);
  K.plane('glass', 0, 1.5, -2.98, 12, 2.6, 0xffffff); K.box('glow', 0, 3.2, -3.4, 11, 0.05, 0.6, 0xffffff);
  for (let i = 0; i < 4; i++) K.box('vcNoShadow', -4.5 + i * 3, 0.9, -5, 2.2, 1.6, 0.6, pick([0xf6d04d, 0x2c7bd8, 0xe9483b, 0xffffff]));
  // 价格牌
  const pUV = allocSign(200, 420, (g, w, h) => { g.fillStyle = '#1c1c1c'; g.fillRect(0, 0, w, h); g.fillStyle = '#e03a2e'; g.fillRect(0, 0, w, 90); g.fillStyle = '#fff'; g.font = `900 34px ${FONT.sans}`; g.textAlign = 'center'; g.fillText('海风石油', w / 2, 58); const rows = [['普通', '168'], ['高级', '179'], ['柴油', '148']]; rows.forEach(([a, b], i) => { g.fillStyle = '#fff'; g.font = `700 26px ${FONT.sans}`; g.textAlign = 'left'; g.fillText(a, 18, 160 + i * 100); g.fillStyle = '#ffb02e'; g.font = `900 52px ${FONT.sans}`; g.textAlign = 'right'; g.fillText(b, w - 16, 170 + i * 100); }); });
  K.box('paint', -13, 3.5, 10.5, 0.3, 7, 0.3, 0x8a9096, { solid: true }); K.box('vc', -13, 6.2, 10.5, 1.8, 3.8, 0.4, 0x1c1c1c); K.plane('sign', -13, 6.2, 10.71, 1.7, 3.6, 0xffffff, { uvr: pUV });
  const ex = K.w(0, 0, -2.4);
  addInteract({ x: ex[0], z: ex[2], r: 2.4, label: () => '走进加油站便利店', act: () => UI.openShop({ def: { id: 'gas', cn: '海风石油 便利店' }, open: () => true }, [['罐装咖啡', 2, '加油站的咖啡，提神。'], ['饭团', 3, '鲑鱼馅。'], ['小鱼干', 2, '路过的猫都认识这个。'], ['油豆腐', 3, '为什么加油站也卖这个？']]) });
  const pv = K.w(-6, 0, 8.5); spawnVehicleLater('sedan', pv[0], pv[2], ry + Math.PI / 2);
  const pl = K.w(0, 0, 14); addPlace('海风石油加油站', pl[0], pl[2], ry + Math.PI, 'gas');
}
let VIEW_TRAIL = null;
function buildViewpoint() {
  // 神社东侧的山道：石阶沿等高线绕上星见山顶
  let pk = [0, 0, -1]; for (let x = -60; x < 30; x += 2) for (let z = -190; z < -130; z += 2) { const h = terrainH(x, z); if (h > pk[2] && islandC(x, z) > 0.08) pk = [x, z, h]; }
  const trail = [[-23, -126], [-12, -134], [-5, -146], [-9, -156], [pk[0] + 6, pk[1] + 4]];
  const pts = catmull(trail, 0.7); let lastY = -1e9; VIEW_TRAIL = pts;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x, z] = pts[i], [x2, z2] = pts[i + 1]; const y = terrainH(x, z); const ry = Math.atan2(x2 - x, z2 - z);
    WK.box('gravel', x, y + 0.02, z, 1.6, 0.05, 0.9, 0xd8cdb8, { ry, wuv: 0.4, noCol: true });
    if (y - lastY > 0.32) { WK.box('wood', x, y + 0.06, z, 1.7, 0.14, 0.14, 0x6a4a2a, { ry, noCol: true }); lastY = y; }
    if (i % 4 === 0) for (const sd of [-1, 1]) { const px = x + Math.cos(ry) * sd * 1.0, pz = z - Math.sin(ry) * sd * 1.0; WK.cyl('wood', px, terrainH(px, pz) + 0.3, pz, 0.05, 0.6, 0x7a5a3a, { seg: 6, noCol: true }); }
  }
  const top = [pk[0], pk[2], pk[1]];
  const cx = pk[0], cz = pk[1]; const ry = Math.atan2(20 - cx, 10 - cz); // 面向镇子
  const lx = Math.sin(ry), lz = Math.cos(ry);
  const K = new Kit(cx, pk[2] + 0.1, cz, ry + Math.PI);
  K.box('wood', 0, -0.2, 0, 9, 0.4, 6, 0xb08a60, { solid: { walk: true }, wuv: 0.6 });
  for (let i = 0; i <= 9; i++) K.box('wood', -4.5 + i, 0.55, -2.95, 0.09, 1.1, 0.09, 0x6a4a2a);
  K.box('wood', 0, 1.1, -2.95, 9, 0.09, 0.12, 0x6a4a2a, { noCol: true }); addCollider(...K.w(0, 0, -2.95).filter((_, i) => i !== 1), 4.5, 0.1, K.ry, pk[2], pk[2] + 1.2, 'wall');
  for (const sd of [-1, 1]) { K.box('wood', sd * 4.45, 1.1, 0, 0.12, 0.09, 6, 0x6a4a2a, { noCol: true }); addCollider(...K.w(sd * 4.45, 0, 0).filter((_, i) => i !== 1), 0.1, 3, K.ry, pk[2], pk[2] + 1.2, 'wall'); }
  const tp = K.w(2, 0, -2.2); const T = new Kit(tp[0], pk[2] + 0.1, tp[2], K.ry); T.cyl('paint', 0, 0.6, 0, 0.08, 1.2, 0x3a6a4a, { seg: 8 }); T.cyl('paint', 0, 1.3, 0.1, 0.12, 0.5, 0x3a6a4a, { rx: 1.3, seg: 10 });
  const b1 = K.w(-2, 0, -1.6); parkBench(b1[0], b1[2], K.ry + Math.PI, pk[2] + 0.1);
  const sUV = allocSign(360, 140, (g, w, h) => { g.fillStyle = '#5a3a20'; g.fillRect(0, 0, w, h); g.fillStyle = '#f6efe0'; g.font = `400 52px ${FONT.wei}`; g.textAlign = 'center'; g.fillText('星见山观景台', w / 2, 70); g.font = `500 20px ${FONT.sans}`; g.fillText('海拔 ' + Math.round(top[1]) + ' m', w / 2, 112); });
  K.box('wood', 3.6, 1.1, 2.4, 0.12, 2.2, 0.12, 0x5a3a20); K.plane('sign', 3.6, 2.0, 2.46, 1.6, 0.62, 0xffffff, { uvr: sUV });
  const pl = K.w(0, 0, 1.2); addPlace('星见山观景台', pl[0], pl[2], K.ry + Math.PI, 'view');
  addInteract({ x: tp[0], z: tp[2], r: 1.6, label: () => '看看投币望远镜', act: () => { if (S().coins < 1) { UI.toast('需要一枚贝壳币。'); return; } GAME.coins(-1); PLAYER.camDist = 9; PLAYER.camYaw = K.ry + Math.PI; PLAYER.camPitch = 0.05; UI.toast('镜头里，樱丘町的屋顶连成一片，电车正沿着海边慢慢开过。'); } });
}
