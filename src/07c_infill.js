/* ==========================================================================
   填空：沿道路补齐住宅、便利店、船屋等，让镇子没有空地
   每块地先检查占地范围内没有道路、铁路、河道、水田与已有建筑，再盖房子
   ========================================================================== */
function lotFree(x, z, ry, w, d, yard, margin = 0.8) {
  const K = new Kit(x, 0, z, ry);
  for (let lx = -w / 2 - 0.6 - margin; lx <= w / 2 + 0.6 + margin + 1e-3; lx += 1.5) for (let lz = -d - 0.6 - margin; lz <= yard + margin + 1e-3; lz += 1.5) {
    const [px, , pz] = K.w(lx, 0, lz);
    if (islandC(px, pz) < 0.07 || roadSample(px, pz) > 0.6 || riverDist(px, pz) < 12 || FARM.paddy(px, pz)) return false;
    if (polyDist(CAPE_PATH, px, pz) < 3 || (VIEW_TRAIL && polyDist(VIEW_TRAIL, px, pz) < 3) || (Math.abs(px + 40) < 6 && pz < -82 && pz > -114)) return false;
    if (Math.hypot(px - PLAZA.x, pz - PLAZA.z) < 25) return false;
    for (let i = 0; i < RAIL.pts.length; i += 2) { const p = RAIL.pts[i]; if (Math.abs(p.x - px) < 12 && Math.abs(p.z - pz) < 12 && Math.hypot(p.x - px, p.z - pz) < railSep(p.s) / 2 + 5.5) return false; }
    for (const c of nearCols(px, pz)) {
      if (c.walk || c.ramp || c.y1 - c.y0 < 0.4) continue;
      const l = localOf(c, px, pz); if (c.round ? Math.hypot(l[0], l[1]) <= c.hw + 0.3 : Math.abs(l[0]) <= c.hw + 0.3 && Math.abs(l[1]) <= c.hd + 0.3) return false;
    }
  }
  return true;
}
// 沿一条直线排一列房子（正面朝 +z 方向的局部坐标 → 由 ry 决定）
function houseRow(x0, x1, z, ry, o = {}) {
  const step = o.step || 12; let n = 0;
  for (let x = x0; x <= x1; x += step) {
    const w = R(8, 10), d = R(7, 8.5), yard = o.yard != null ? o.yard : 2.2;
    const px = ry === 0 || ry === Math.PI ? x : z, pz = ry === 0 || ry === Math.PI ? z : x;
    if (!lotFree(px, pz, ry, w, d, yard)) continue;
    buildHouse(px, pz, ry, Object.assign({ w, d, yard, tree: chance(0.35) ? 'sakura' : 'green' }, o.house || {}));
    n++;
  }
  return n;
}
/* 便利店：平顶、整面玻璃、招牌色带、门口停车格与垃圾桶 */
function convenienceStore(x, z, ry) {
  const K = new Kit(x, TOWN_Y, z, ry); const w = 14, d = 10;
  K.box('concrete', 0, 0.05, 2.5, w + 6, 0.1, 5, 0xc8c4bc, { wuv: 0.3, noCol: true });
  for (let i = -3; i <= 3; i++) K.box('marking', i * 2.6, 0.11, 2.6, 0.1, 0.01, 4.2, 0xf2f2ee);
  K.box('plaster', 0, 2.1, -d / 2, w, 4.2, d, 0xf6f4ef, { solid: true, wuv: 0.4 });
  K.box('vc', 0, 4.3, -d / 2, w + 0.3, 0.2, d + 0.3, 0xdedbd4);
  for (const [c, y] of [[0x2a9a5a, 3.55], [0xf2f2f0, 3.25], [0x2c6ea0, 2.98]]) K.box('vc', 0, y, 0.03, w, 0.28, 0.08, c);
  K.plane('glass', 0, 1.35, 0.06, w - 1.2, 2.3, 0xffffff); K.box('glow', 0, 2.62, -0.4, w - 1.5, 0.05, 0.5, 0xffffff);
  for (let i = 0; i < 5; i++) K.box('vcNoShadow', -5 + i * 2.5, 0.85, -1.6, 1.8, 1.5, 0.5, pick([0xf6d04d, 0x2c7bd8, 0xe9483b, 0xffffff, 0x7ac27a]));
  const uv = allocSign(700, 110, (g, W, H) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.fillStyle = '#2a9a5a'; g.font = `900 64px ${FONT.sans}`; g.textAlign = 'center'; g.fillText('海风便利店  24H', W / 2, 80); });
  K.plane('sign', 0, 3.25, 0.09, 7, 1.1, 0xffffff, { uvr: uv });
  for (const sx of [5.2, 6.0]) K.box('paint', sx, 0.5, 0.6, 0.6, 1.0, 0.5, sx < 5.5 ? 0x3a7a4a : 0x2c6ea0);
  vendingMachine(new Kit(...K.w(-6.4, 0, 0.5), K.ry), 0, 0, 0, 0xd9483b);
  const hp = K.w(0, 3.0, 0.8); addHalo(hp[0], hp[1], hp[2], 5, 0xf4f8ff); addLightPool(hp[0], TOWN_Y, hp[2] + 2, 7, 0xf0f6ff);
  bicycleStatic(K, -4, 1.4, 0.3, 0xffffff); bicycleStatic(K, -3.2, 1.4, 0.3, 0xd9483b);
}
/* 船屋：海边的木结构棚子，里面放着小船与渔具 */
function boatShed(x, z, ry) {
  const K = new Kit(x, groundAt(x, z), z, ry);
  K.box('concrete', 0, 0.1, -4, 9, 0.2, 9, 0xc4c0b8, { solid: { walk: true }, wuv: 0.4 });
  for (const sx of [-4.2, 4.2]) K.box('woodwall', sx, 1.8, -4, 0.15, 3.6, 8.6, 0x8a7a66, { solid: true, wuv: 0.5 });
  K.box('woodwall', 0, 1.8, -8.2, 8.6, 3.6, 0.15, 0x8a7a66, { solid: true, wuv: 0.5 });
  gableRoof(K, 0, 3.6, -4, 8.6, 8.6, 1.4, 0x6a7a86, 0, 0.4);
  const hs = new THREE.Shape(); hs.moveTo(-2.4, 0.6); hs.lineTo(2.6, 0.7); hs.quadraticCurveTo(2.4, 0, 1.4, -0.25); hs.lineTo(-2.2, -0.25); hs.lineTo(-2.4, 0.6);
  const g = new THREE.ExtrudeGeometry(hs, { depth: 1.5, bevelEnabled: false }); g.translate(0, 0, -0.75);
  K.geo('paint', g, 0, 0.6, -4, 0xf2f2f0, { ry: Math.PI / 2 }); K.box('wood', 0, 1.15, -4, 1.3, 0.06, 4.4, 0xc9a06a);
  for (let i = 0; i < 4; i++) K.box('wood', R(-3.5, 3.5), 0.35, R(-1, 0.6), 0.8, 0.5, 0.55, 0xa07850, { solid: true });
  for (let i = 0; i < 6; i++) K.sph('paint', R(-3.8, -2.8), 0.3 + i * 0.2, -7.6, 0.25, 0.25, 0.25, pick([0xf39a3d, 0xd9483b, 0xffffff]));
  K.sph('vc', 3, 0.3, -7, 1.1, 0.3, 0.8, 0x3d6b5a, { lo: true });
}
function buildInfill() {
  seed(4242);
  // 北路北侧：背靠神社后山的住宅（前院朝南，对着北路）
  houseRow(-114, 94, -93, 0, { step: 12.5 });
  // 广场东侧：南路以南一排朝北、海岸路以北一排朝南，中间夹一家便利店
  if (lotFree(36, 56, Math.PI, 14, 10, 4.5)) convenienceStore(36, 56, Math.PI);
  houseRow(26, 94, 51.5, Math.PI, { step: 11.5 });
  houseRow(26, 94, 78.5, 0, { step: 11.5 });
  // 广场西侧（加油站以外的空地）
  houseRow(-60, -24, 51.5, Math.PI, { step: 11.5 });
  // 港口东南角：几户渔家与船屋
  houseRow(110, 160, 70, 0, { step: 13, house: { wall: 'woodwall', balcony: false } });
  for (const [x, z, ry] of [[150, 64, Math.PI], [166, 66, Math.PI]]) if (lotFree(x, z, ry, 9, 9, 0)) boatShed(x, z, ry);
  // 港口北侧、灯塔岬下：渔协宿舍与住宅
  houseRow(108, 132, -86, 0, { step: 12 });
}
