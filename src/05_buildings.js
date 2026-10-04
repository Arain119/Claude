/* ==========================================================================
   民居 · 小信使的家（可进入） · 学校 · 小公园
   ========================================================================== */
const MAILBOXES = []; // {name, x, z} 投递用
const FAMILY = ['林', '苏', '陈', '周', '许', '江', '夏', '白', '顾', '叶', '方', '沈', '唐', '宋', '程', '温', '季', '洛'];
function nameplate(K, x, y, z, fam) {
  const uv = allocSign(90, 40, (g, w, h) => { g.fillStyle = '#efe6d4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7a5a3a'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4); g.fillStyle = '#3a2a1a'; g.font = `400 26px ${FONT.brush}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(fam + ' 宅', w / 2, h / 2 + 1); });
  K.plane('sign', x, y, z, 0.42, 0.19, 0xffffff, { uvr: uv });
}
function houseMailbox(K, x, z, fam) {
  K.box('paint', x, 1.05, z, 0.36, 0.42, 0.22, pick([0x2f6b8f, 0xb84a3a, 0x3d6b45, 0x8a7a6a, 0xe9e2d0]));
  K.box('vc', x, 1.12, z + 0.115, 0.26, 0.03, 0.01, 0x222222);
  K.box('vc', x, 0.42, z, 0.06, 0.84, 0.06, 0x666666);
  const p = K.w(x, 0, z + 0.5); MAILBOXES.push({ name: fam, x: p[0], z: p[2] });
}

function buildHouse(x, z, ry, o = {}) {
  const w = o.w || R(7, 9), d = o.d || R(6.5, 8), F = 2.8;
  const K0 = new Kit(x, 0, z, ry);
  // 地基高度
  let y = -1e9; for (const [a, b] of [[-w / 2, 0], [w / 2, 0], [-w / 2, -d], [w / 2, -d], [0, -d / 2]]) { const p = K0.w(a, 0, b); y = Math.max(y, terrainH(p[0], p[2])); }
  const K = new Kit(x, y, z, ry);
  const wallMat = o.wall || pick(['siding', 'plaster', 'siding', 'tile']);
  const wc = new THREE.Color(o.wc || pick([0xf2ede2, 0xe6ddd0, 0xdfe6e8, 0xf0e6dc, 0xe9eedf, 0xf6efe8, 0xd8d0c4]));
  const fam = o.fam || pick(FAMILY);
  K.box('concrete', 0, -1.15, -d / 2, w + 0.3, 2.7, d + 0.3, 0xaca89e, { wuv: 0.5 });
  K.box(wallMat, 0, F, -d / 2, w, F * 2, d, wc, { solid: true, wuv: 0.45 });
  K.box('vc', 0, F + 0.02, -d / 2, w + 0.06, 0.12, d + 0.06, wc.clone().multiplyScalar(0.85));
  const roofCol = o.roof || pick([0x4a5568, 0x5a4a44, 0x3f5a5a, 0x6b4f45, 0x2f3a4a, 0x7a3b33, 0x556b5a]);
  const rh = R(1.6, 2.2);
  if (chance(0.7)) gableRoof(K, 0, F * 2, -d / 2, w, d, rh, roofCol, 0, 0.5);
  else { K.geo('roof', PRISM, 0, F * 2, -d / 2, roofCol, { sx: w + 1, sy: 1.6, sz: d + 1, wuv: 1 }); }
  // 山墙封檐板：两个山墙面的斜边包一条板，遮掉墙-屋顶的裸几何边
  {
    const slope = Math.atan2(rh, d / 2), rl = Math.hypot(d / 2, rh) + 0.5, bc = new THREE.Color(roofCol).multiplyScalar(0.72);
    for (const sx of [-1, 1]) {
      K.box('roof', sx * (w / 2 + 0.03), F * 2 + rh / 2 + 0.04, -d / 4, 0.1, 0.22, rl, bc, { rx: slope });
      K.box('roof', sx * (w / 2 + 0.03), F * 2 + rh / 2 + 0.04, -d * 3 / 4, 0.1, 0.22, rl, bc, { rx: -slope });
    }
    // 檐沟 + 一角下水管（70% 的宅子有）
    if (chance(0.7)) {
      const gc = 0x9aa2a8;
      K.box('metal', 0, F * 2 - 0.04, 0.42, w + 0.35, 0.09, 0.13, gc);
      const gx = (chance(0.5) ? 1 : -1) * (w / 2 - 0.12);
      K.box('metal', gx, F, 0.42, 0.1, F * 2 - 0.4, 0.1, gc);
      K.box('metal', gx, F * 2 - 0.14, 0.37, 0.1, 0.08, 0.18, gc);
    }
  }
  antenna(K, R(-w / 4, w / 4), F * 2 + 1.4, -d / 2, R(0, 1));
  // 墙角包边：四个转角各一条浅于墙色的立板，破掉盒子的硬转角
  const trim = wc.clone().multiplyScalar(1.12);
  for (const cx of [-1, 1]) for (const cz of [0, -d]) K.box('vc', cx * (w / 2 + 0.02), F, cz, 0.14, F * 2, 0.14, trim);
  // 门与雨棚
  const dx = o.doorX != null ? o.doorX : (chance(0.5) ? -w / 4 : w / 4);
  K.box('wood', dx, 1.05, 0.03, 0.95, 2.1, 0.08, pick([0x6b4a35, 0x8a6a4a, 0x3d4a55, 0xb08560]));
  K.box('vc', dx + 0.32, 1.05, 0.09, 0.05, 0.25, 0.05, 0xc9a25c);
  K.box('vc', dx, 2.35, 0.45, 1.6, 0.08, 0.95, 0x8a8f94);
  K.box('concrete', dx, 0.12, 0.6, 1.6, 0.24, 1.2, 0xc8c4bc, { solid: true });
  nameplate(K, dx - 0.75, 1.5, 0.02, fam);
  // 窗
  const nw = Math.max(1, Math.floor(w / 2.6));
  for (let f = 0; f < 2; f++) for (let i = 0; i < nw; i++) {
    const wx = -w / 2 + (i + 0.5) * w / nw; if (f === 0 && Math.abs(wx - dx) < 1.2) continue;
    windowAt(K, wx, f * F + 1.5, 0, 1.3, 1.2);
    if (f === 1 && chance(0.3)) acUnit(K, wx + 0.4, F + 0.55, 0.2);
  }
  for (let f = 0; f < 2; f++) { windowAt(K, -w / 2 - 0.0, f * F + 1.5, -d / 2, 1.0, 1.0, 0xe6e3dc, { ry: -Math.PI / 2 }); windowAt(K, w / 2, f * F + 1.5, -d / 2 + R(-1, 1), 1.0, 1.0, 0xe6e3dc, { ry: Math.PI / 2 }); }
  for (let i = 0; i < nw; i++) windowAt(K, -w / 2 + (i + 0.5) * w / nw, F + 1.5, -d, 1.2, 1.1, 0xe6e3dc, { ry: Math.PI });
  // 二楼阳台
  if (o.balcony !== false && chance(0.6)) { balcony(K, -dx * 0.6, F + 0.05, 0, Math.min(3.4, w - 2.5)); if (chance(0.75)) laundry(K, -dx * 0.6, F + 1.95, 0.5, Math.min(3.0, w - 2.8)); }
  // 院墙与绿篱
  const yard = o.yard != null ? o.yard : 2.4;
  if (yard > 0) {
    const fz = yard; const gw = 1.6;
    const wallCol = pick([0xcfc8bc, 0xd8d2c8, 0xbdb6aa]);
    const seg = (x0, x1, zz) => { if (x1 - x0 > 0.1) K.box('concrete', (x0 + x1) / 2, 0.55, zz, x1 - x0, 1.1, 0.15, wallCol, { solid: true, wuv: 0.5 }); };
    seg(-w / 2 - 0.6, dx - gw / 2, fz); seg(dx + gw / 2, w / 2 + 0.6, fz);
    for (const s of [-1, 1]) K.box('concrete', s * (w / 2 + 0.6), 0.55, (fz - d - 0.6) / 2, 0.15, 1.1, fz + d + 0.6, wallCol, { solid: true, wuv: 0.5 });
    K.box('concrete', 0, 0.55, -d - 0.6, w + 1.2, 1.1, 0.15, wallCol, { solid: true, wuv: 0.5 });
    for (const s of [-1, 1]) K.box('concrete', dx + s * gw / 2, 0.7, fz, 0.3, 1.4, 0.3, 0xb8b0a4);
    K.box('paving', dx, 0.03, fz / 2 + 0.6, 1.4, 0.06, fz - 0.9, 0xe0d8cc, { wuv: 0.5 });
    houseMailbox(K, dx + gw / 2 + 0.35, fz + 0.15, fam);
    // 花木
    const gx = dx > 0 ? -w / 4 : w / 4;
    if (chance(0.5)) shrub(...K.w(gx, 0, fz - 0.8).filter((_, i) => i !== 1), R(0.8, 1.2), pick([0, 0xf28ab2, 0xffffff]), y);
    if (chance(0.45)) { const p = K.w(gx * 1.2, 0, fz - 1.1); if (o.tree === 'sakura') sakuraTree(p[0], p[2], 0.75, { y, cards: 1100 }); else greenTree(p[0], p[2], 0.6, { y, cards: 500 }); }
    for (let i = 0; i < 3; i++) potPlant(K, dx + gw / 2 + 0.3 + i * 0.5, 0.5);
    if (chance(0.5)) bicycleStatic(K, -dx * 0.9, 1.2, 0.2, pick([0xd9483b, 0x2c5aa0, 0xffffff, 0xe48fa6]));
  }
  const glowP = K.w(dx, 2.2, 0.6); addHalo(glowP[0], glowP[1], glowP[2], 1.5, 0xffe2b0);
  K.box('glow', dx, 2.25, 0.25, 0.25, 0.12, 0.1, 0xfff0cf);
  // 接地阴影：房子 + 院墙范围贴一块软性 AO，消除浮感
  const sp = K.w(0, 0, (2.8 - d) / 2 - 0.2); addGroundShadow(sp[0], sp[2], w + 3.2, d + 4.4, ry, 0.85);
  // 墙面过渡：四面墙脚潮气带 + 前后檐口阴带
  for (const [lx, lz, wry, ww] of [[0, 0.03, 0, w], [0, -d - 0.03, 0, w], [-w / 2 - 0.03, -d / 2, Math.PI / 2, d], [w / 2 + 0.03, -d / 2, Math.PI / 2, d]]) {
    const p = K.w(lx, 0.5, lz); addWallFade(p[0], p[1], p[2], ww * 0.98, 1.0, ry + wry, 0.5, 0);
  }
  for (const lz of [0.03, -d - 0.03]) { const p = K.w(0, F * 2 - 0.35, lz); addWallFade(p[0], p[1], p[2], w * 0.98, 0.85, ry, 0.4, 1); }
  return { y, fam, K };
}

/* ---------------- 小信使的家（可进入） ---------------- */
const HOME = { x: 0, z: 0 };
let homeBoardTex, homeBoardCanvas, homeDoor, homeLight;
function buildHome() { // 自宅也用 buildHouse 同款接地阴影（在 buildHome 末尾贴）
  const x = 27.6, z = -20, ry = -Math.PI / 2; const y = TOWN_Y;
  const K = new Kit(x, y, z, ry); const w = 8, d = 7, F = 2.9, fl = 0.35;
  const wc = new THREE.Color(0xf6efe2), trim = 0x7d5c45;
  HOME.x = x; HOME.z = z; HOME.K = K; HOME.y = y + fl;
  K.box('concrete', 0, fl / 2 - 0.3, -d / 2, w + 0.3, fl + 0.6, d + 0.3, 0xbcb6aa, { wuv: 0.5 });
  K.box('wood', 0, fl / 2, -d / 2, w - 0.3, fl, d - 0.3, 0xd2a77a, { wuv: 0.7, solid: { walk: true } });
  const t = 0.18, dx = -2.2, dw = 1.1;
  // 前墙（带门洞）
  const fw = (x0, x1) => K.box('siding', (x0 + x1) / 2, fl + F / 2, -t / 2, x1 - x0, F, t, wc, { solid: 'wall', wuv: 0.45 });
  fw(-w / 2, dx - dw / 2); fw(dx + dw / 2, w / 2);
  K.box('siding', dx, fl + F - 0.35, -t / 2, dw, 0.7, t, wc, { wuv: 0.45 });
  // 侧墙、后墙
  K.box('siding', -w / 2 + t / 2, fl + F / 2, -d / 2, t, F, d, wc, { solid: 'wall', wuv: 0.45 });
  K.box('siding', w / 2 - t / 2, fl + F / 2, -d / 2, t, F, d, wc, { solid: 'wall', wuv: 0.45 });
  K.box('siding', 0, fl + F / 2, -d + t / 2, w, F, t, wc, { solid: 'wall', wuv: 0.45 });
  // 天花板 + 二层外壳 + 屋顶
  K.box('wood', 0, fl + F + 0.05, -d / 2, w, 0.1, d, 0xf3e7d3);
  K.box('siding', 0, fl + F + 1.25, -d / 2, w, 2.3, d, wc, { wuv: 0.45 });
  gableRoof(K, 0, fl + F + 2.4, -d / 2, w, d, 2.0, 0x8a3b33, 0, 0.55);
  antenna(K, 1.5, fl + F + 4.1, -d / 2, 0.4);
  // 室内墙面（暖色）
  const inW = 0xfbf3e4;
  K.plane('vc', 0, fl + F / 2, -d + t + 0.01, w - 2 * t, F, inW);
  K.plane('vc', -w / 2 + t + 0.01, fl + F / 2, -d / 2, d - 2 * t, F, inW, { ry: Math.PI / 2 });
  K.plane('vc', w / 2 - t - 0.01, fl + F / 2, -d / 2, d - 2 * t, F, inW, { ry: -Math.PI / 2 });
  K.plane('vc', 1.4, fl + F / 2, -t - 0.01, 5.2, F, inW, { ry: Math.PI });
  K.box('wood', 0, fl + 0.06, -d / 2, w - 2 * t, 0.1, d - 2 * t, 0xffffff, { wuv: 0.9 });
  // 窗
  windowAt(K, 1.6, fl + 1.6, 0, 1.6, 1.2, 0xffffff, { v: 4 });
  windowAt(K, -1.8, fl + 1.6, -d, 1.4, 1.1, 0xffffff, { v: 0, ry: Math.PI });
  windowAt(K, 1.8, fl + F + 1.2, 0, 1.4, 1.0); windowAt(K, -1.6, fl + F + 1.2, 0, 1.4, 1.0, 0xe6e3dc, { v: 6 });
  // 门（可转动）
  const doorG = new THREE.Group(); const dp = K.w(dx - dw / 2, fl, -t / 2); doorG.position.set(dp[0], dp[1], dp[2]); doorG.rotation.y = ry;
  const dm = new THREE.Mesh(new THREE.BoxGeometry(dw, 2.2, 0.06), new THREE.MeshStandardMaterial({ color: 0x5c7c8a, roughness: 0.7 })); dm.position.set(dw / 2, 1.1, 0); dm.castShadow = true;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshStandardMaterial({ color: 0xd9b45a, roughness: 0.3 })); knob.position.set(dw - 0.12, 1.0, 0.05);
  const dwin = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), MATS.glass.material); dwin.position.set(dw / 2, 1.6, 0.035);
  doorG.add(dm, knob, dwin); scene.add(doorG); homeDoor = { g: doorG, open: 0 };
  K.box('wood', dx, 2.35 + fl, 0.6, 1.8, 0.08, 1.1, 0x7d5c45);
  K.box('concrete', dx, 0.1, 0.55, 1.5, 0.2, 1.0, 0xcfc8bc, { solid: true });
  nameplate(K, dx + 0.9, fl + 1.5, 0.02, '小信使');
  // 门牌信箱
  K.box('paint', dx - 0.95, fl + 1.1, 0.1, 0.36, 0.42, 0.2, 0x3d6b45);
  // —— 家具 ——
  // 床
  K.box('wood', 2.6, fl + 0.25, -5.6, 1.6, 0.4, 2.2, 0x9a7050, { solid: true });
  K.box('vc', 2.6, fl + 0.52, -5.6, 1.5, 0.18, 2.1, 0xfaf6ee);
  K.box('vc', 2.6, fl + 0.62, -5.3, 1.52, 0.1, 1.5, 0xf2a9b8);
  K.box('vc', 2.6, fl + 0.68, -6.35, 0.9, 0.14, 0.45, 0xffffff);
  K.box('wood', 2.6, fl + 0.7, -6.72, 1.6, 1.0, 0.08, 0x8a6040);
  // 书桌与台灯
  K.box('wood', -2.8, fl + 0.75, -6.4, 1.5, 0.06, 0.7, 0xb8875a); for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.box('wood', -2.8 + sx * 0.68, fl + 0.37, -6.4 + sz * 0.3, 0.05, 0.74, 0.05, 0x8a6040);
  addCollider(...K.w(-2.8, 0, -6.4).filter((_, i) => i !== 1), 0.75, 0.35, ry, y + fl, y + fl + 0.78, 'wall');
  K.cyl('vc', -3.3, fl + 0.95, -6.55, 0.03, 0.4, 0x333333); K.cyl('glow', -3.3, fl + 1.18, -6.55, 0.16, 0.14, 0xfff0c8, { rt: 0.5, seg: 12 });
  K.box('vcNoShadow', -2.6, fl + 0.8, -6.35, 0.45, 0.02, 0.32, 0xffffff); K.box('vcNoShadow', -2.2, fl + 0.82, -6.3, 0.25, 0.05, 0.18, 0xe9d6a8);
  K.box('wood', -2.8, fl + 0.45, -5.6, 0.45, 0.06, 0.45, 0xb8875a); K.box('wood', -2.8, fl + 0.75, -5.38, 0.45, 0.6, 0.05, 0xb8875a);
  // 书架
  K.box('wood', -3.6, fl + 1.0, -3.5, 0.4, 2.0, 1.4, 0x9a7050, { solid: true });
  for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) K.box('vcNoShadow', -3.45, fl + 0.2 + r * 0.48, -4.1 + i * 0.14, 0.1, R(0.25, 0.38), 0.11, pick([0x3a5a8c, 0xc8352e, 0xe8d6a8, 0x3d6b45, 0xf2a9b8, 0x6b4a35]));
  // 地毯、小桌、坐垫
  K.box('vcNoShadow', 0.2, fl + 0.12, -3.4, 2.6, 0.02, 1.9, 0xe7c6a6); K.box('vcNoShadow', 0.2, fl + 0.13, -3.4, 2.2, 0.02, 1.5, 0xf3dcc2);
  K.cyl('wood', 0.2, fl + 0.4, -3.4, 0.55, 0.06, 0xc79a6a, { seg: 20 }); K.cyl('wood', 0.2, fl + 0.25, -3.4, 0.08, 0.3, 0x8a6040);
  K.cyl('vcNoShadow', 0.2, fl + 0.46, -3.35, 0.06, 0.1, 0xffffff, { seg: 10 });
  for (const s of [-1, 1]) K.box('vcNoShadow', 0.2 + s * 0.9, fl + 0.18, -3.4, 0.5, 0.1, 0.5, 0x8fb0c8);
  // 小厨房
  K.box('vc', 3.4, fl + 0.45, -2.0, 0.6, 0.9, 1.8, 0xe8e2d6, { solid: true }); K.box('vc', 3.4, fl + 0.92, -2.0, 0.64, 0.05, 1.84, 0x9aa0a6);
  K.cyl('vcNoShadow', 3.4, fl + 1.02, -1.6, 0.12, 0.16, 0xd9483b, { seg: 12 });
  // 绿植
  potPlant(K, 3.5, -0.6); potPlant(K, -0.6, -6.6);
  // 墙上：日历 + 邮票墙（动态）
  homeBoardCanvas = makeCanvas(512, 256); homeBoardTex = new THREE.CanvasTexture(homeBoardCanvas); homeBoardTex.anisotropy = MAX_ANISO;
  const bm = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshStandardMaterial({ map: homeBoardTex, roughness: 0.9 }));
  const bp = K.w(0.2, fl + 1.75, -d + t + 0.03); bm.position.set(bp[0], bp[1], bp[2]); bm.rotation.y = ry; scene.add(bm);
  // 室内灯
  K.cyl('glow', 0.2, fl + F - 0.08, -3.4, 0.35, 0.08, 0xfff4dc, { seg: 20 });
  homeLight = new THREE.PointLight(0xffd9a8, 0.0, 9, 1.6); const lp = K.w(0.2, fl + F - 0.4, -3.4); homeLight.position.set(lp[0], lp[1], lp[2]); scene.add(homeLight);
  // 院子
  K.box('paving', dx, 0.02, 1.6, 1.4, 0.04, 1.6, 0xe0d8cc, { wuv: 0.5 });
  shrub(...K.w(1.8, 0, 1.4).filter((_, i) => i !== 1), 0.9, 0xf28ab2, y);
  bicycleStatic(K, 3.2, 1.2, 0, 0x3d6b45);
  const bed = K.w(2.6, 0, -4.3), desk = K.w(-2.8, 0, -5.4), inside = K.w(0, 0, -3.5), door = K.w(dx, 0, 0.9);
  HOME.bed = bed; HOME.desk = desk; HOME.inside = inside; HOME.door = door; HOME.doorIn = K.w(dx, 0, -0.9); HOME.ry = ry;
  HOME.box = { K, hw: w / 2 - 0.2, d };
  addPlace('小信使的家', door[0] - 1.2, door[2], Math.PI / 2, 'home');
  const sp = K.w(0, 0, -d / 2 + 0.4); addGroundShadow(sp[0], sp[2], w + 2.6, d + 3.0, ry, 0.8);
}
function insideHome(x, z) { if (!HOME.K) return false; const K = HOME.K; const dx = x - K.x, dz = z - K.z; const lx = dx * K.c - dz * K.s, lz = dx * K.s + dz * K.c; return Math.abs(lx) < HOME.box.hw && lz < -0.1 && lz > -HOME.box.d; }
function drawHomeBoard(day, stamps) {
  const g = homeBoardCanvas.getContext('2d'); const W = 512, H = 256;
  g.fillStyle = '#c9a77c'; g.fillRect(0, 0, W, H); g.fillStyle = '#e8d3b2'; g.fillRect(6, 6, W - 12, H - 12);
  // 日历
  g.fillStyle = '#fff'; g.fillRect(20, 20, 150, 210); g.fillStyle = '#e48fa6'; g.fillRect(20, 20, 150, 40);
  g.fillStyle = '#fff'; g.font = `700 20px ${FONT.sans}`; g.textAlign = 'center'; g.fillText('四月', 95, 48);
  g.fillStyle = '#333'; g.font = `900 78px ${FONT.wei}`; g.fillText(String(day), 95, 150);
  g.font = `500 16px ${FONT.sans}`; g.fillStyle = '#7a5a3a'; g.fillText('星见岛 · 第 ' + day + ' 天', 95, 200);
  // 邮票墙
  g.fillStyle = '#3a2a1a'; g.font = `400 20px ${FONT.wei}`; g.textAlign = 'left'; g.fillText('我的邮票', 200, 42);
  for (let i = 0; i < 12; i++) {
    const cx = 200 + (i % 6) * 50, cy = 60 + Math.floor(i / 6) * 80;
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(cx + 3, cy + 3, 40, 52);
    if (stamps[i]) drawStamp(g, cx, cy, 40, 52, stamps[i]); else { g.strokeStyle = 'rgba(90,60,30,0.4)'; g.setLineDash([4, 4]); g.strokeRect(cx, cy, 40, 52); g.setLineDash([]); }
  }
  homeBoardTex.needsUpdate = true;
}
function drawStamp(g, x, y, w, h, s) {
  g.fillStyle = '#fffdf6'; g.fillRect(x, y, w, h);
  g.fillStyle = s.col || '#e48fa6'; g.fillRect(x + 4, y + 4, w - 8, h - 8);
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.font = `400 ${Math.floor(w * 0.45)}px ${FONT.wei}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(s.ch || '★', x + w / 2, y + h / 2 + 1); g.textBaseline = 'alphabetic';
  g.fillStyle = '#fffdf6'; for (let i = 0; i <= w; i += 6) { g.beginPath(); g.arc(x + i, y, 2, 0, TAU); g.arc(x + i, y + h, 2, 0, TAU); g.fill(); } for (let i = 0; i <= h; i += 6) { g.beginPath(); g.arc(x, y + i, 2, 0, TAU); g.arc(x + w, y + i, 2, 0, TAU); g.fill(); }
}

/* ---------------- 学校 ---------------- */
function buildSchool() {
  const K = new Kit(-42, TOWN_Y, -40, Math.PI); // 正面朝南（局部 +z → 世界 -z？）——用 ry=0 让正面朝 +z
  K.set(-42, TOWN_Y, -34, 0);
  const w = 24, d = 9, F = 3.4, n = 3;
  K.box('plaster', 0, F * n / 2, -d / 2, w, F * n, d, 0xf3efe6, { solid: true, wuv: 0.4 });
  for (let f = 0; f < n; f++) { K.box('vc', 0, f * F + 0.05, 0.05, w + 0.1, 0.12, 0.2, 0xe2ddd2); for (let i = 0; i < 8; i++) windowAt(K, -w / 2 + 1.5 + i * 3, f * F + 1.8, 0, 2.2, 1.6, 0xd9dde0, { v: [1, 5, 3, 7][(i + f) % 4] }); }
  K.box('concrete', 0, F * n + 0.4, -d / 2, w, 0.8, d, 0xdcd8d0, { wuv: 0.5 });
  // 中央钟楼
  K.box('plaster', 0, F * n + 1.6, -1.0, 4, 3.2, 2.4, 0xf3efe6, { wuv: 0.4 });
  addGroundShadow(-42, -34 - 4.5, w + 3.5, d + 3.5, 0, 0.75);
  const cUV = allocSignAlpha(160, 160, (g) => { g.fillStyle = '#fffdf6'; g.beginPath(); g.arc(80, 80, 76, 0, TAU); g.fill(); g.strokeStyle = '#26375e'; g.lineWidth = 8; g.stroke(); g.fillStyle = '#26375e'; for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.fillRect(80 + Math.cos(a) * 60 - 4, 80 + Math.sin(a) * 60 - 4, 8, 8); } });
  K.plane('signCut', 0, F * n + 1.9, 0.22, 1.8, 1.8, 0xffffff, { uvr: cUV });
  const hands = new THREE.Group(); const hp = K.w(0, F * n + 1.9, 0.26); hands.position.set(hp[0], hp[1], hp[2]);
  const hm = new THREE.MeshBasicMaterial({ color: 0x26375e }); const hh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.02), hm); hh.geometry.translate(0, 0.25, 0); const mh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.75, 0.02), hm); mh.geometry.translate(0, 0.37, 0);
  hands.add(hh, mh); scene.add(hands); SCHOOL_CLOCK.h = hh; SCHOOL_CLOCK.m = mh;
  const sUV = allocSign(600, 90, (g, w2, h2) => { g.fillStyle = '#26375e'; g.fillRect(0, 0, w2, h2); g.fillStyle = '#fffdf6'; g.font = `400 54px ${FONT.wei}`; g.textAlign = 'center'; g.fillText('星 见 岛 学 园', w2 / 2, 62); });
  K.plane('sign', 0, F + 0.3, 0.2, 6, 0.9, 0xffffff, { uvr: sUV });
  K.box('vc', 0, 1.3, 0.8, 5, 0.15, 1.8, 0xdcd8d0); K.box('glass', 0, 1.2, 0.02, 3.6, 2.4, 0.05, 0xffffff);
  // 校园、围栏、校门
  K.box('gravel', 0, 0.02, 5.25, w + 2, 0.04, 10.5, 0xe6d9c0, { wuv: 0.3 });
  for (let i = 0; i < 26; i++) K.box('vc', -w / 2 - 1 + i * 1.04, 0.9, 10.5, 0.05, 1.8, 0.05, 0x5d6b58);
  K.box('vc', 0, 1.75, 10.5, w + 2, 0.06, 0.06, 0x5d6b58); K.box('vc', 0, 0.3, 10.5, w + 2, 0.06, 0.06, 0x5d6b58);
  addCollider(...K.w(-5, 0, 10.5).filter((_, i) => i !== 1), w / 2 - 4, 0.1, 0, TOWN_Y, TOWN_Y + 1.8, 'wall');
  for (const s of [-1, 1]) K.box('stone', 7.6 + s * 1.6, 0.9, 10.5, 0.5, 1.8, 0.5, 0xd8d2c8, { solid: true });
  const gUV = allocSign(60, 160, (g, w2, h2) => { g.fillStyle = '#f3efe6'; g.fillRect(0, 0, w2, h2); g.fillStyle = '#26375e'; g.font = `400 26px ${FONT.wei}`; g.textAlign = 'center'; [...'星见岛学园'].forEach((c, i) => g.fillText(c, w2 / 2, 28 + i * 28)); });
  K.plane('sign', 6.0, 1.0, 10.76, 0.3, 0.8, 0xffffff, { uvr: gUV });
  for (const sx of [-9, -3, 3]) sakuraTree(...K.w(sx, 0, 7.8).filter((_, i) => i !== 1), 0.95, { cards: 1400 });
  // 单杠与长椅
  for (let i = 0; i < 3; i++) { K.box('vc', -6 + i * 1.2, 0.9 + i * 0.2, 4, 0.05, 1.8 + i * 0.4, 0.05, 0x9aa0a6); }
  K.box('vc', -5.4, 1.6, 4, 1.4, 0.04, 0.04, 0x9aa0a6);
  addPlace('星见岛学园', -42, -21.5, Math.PI, 'school');
}
const SCHOOL_CLOCK = {};

/* ---------------- 小鸟公园 ---------------- */
function buildPark() {
  const cx = 66, cz = 12; const K = new Kit(cx, TOWN_Y, cz, 0);
  K.box('gravel', 0, 0.02, 0, 22, 0.04, 18, 0xe8dcc4, { wuv: 0.3 });
  // 秋千
  K.rod('paint', [-4, 0, -3], [-3, 2.6, -3], 0.06, 0xd9483b); K.rod('paint', [-2, 0, -3], [-3, 2.6, -3], 0.06, 0xd9483b);
  K.rod('paint', [2, 0, -3], [1, 2.6, -3], 0.06, 0xd9483b); K.rod('paint', [0, 0, -3], [1, 2.6, -3], 0.06, 0xd9483b);
  K.box('paint', -1, 2.6, -3, 4.2, 0.1, 0.1, 0xd9483b);
  const swings = [];
  for (const sx of [-2, 0]) {
    const g = new THREE.Group(); const p = K.w(sx, 2.55, -3); g.position.set(p[0], p[1], p[2]);
    const ropeM = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0, roughness: 0.6 });
    for (const s of [-0.22, 0.22]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.02, 2.0, 0.02), ropeM); r.position.set(s, -1.0, 0); g.add(r); }
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.25), new THREE.MeshStandardMaterial({ color: 0xf6d04d, roughness: 0.6 })); seat.position.y = -2.0; seat.castShadow = true; g.add(seat);
    scene.add(g); swings.push(g);
  }
  PARK.swings = swings;
  onUpdate((dt, t) => { swings.forEach((g, i) => { g.rotation.x = Math.sin(t * 1.6 + i * 1.3) * (PARK.swingAmp[i] || 0.05); }); });
  // 滑梯
  K.box('paint', 5, 1.0, -3, 1.0, 0.08, 1.0, 0x2c7bd8); for (const s of [-1, 1]) for (const z of [-1, 1]) K.box('paint', 5 + s * 0.45, 0.5, -3 + z * 0.45, 0.08, 1.0, 0.08, 0x2c7bd8);
  K.box('paint', 5, 0.5, -1.4, 0.8, 0.06, 2.4, 0xf6d04d, { rx: 0.45 });
  for (let i = 0; i < 4; i++) K.box('paint', 5, 0.2 + i * 0.24, -4.0 - i * 0.05, 0.7, 0.05, 0.12, 0x2c7bd8);
  // 沙坑
  K.box('wood', -3, 0.1, 4, 3.4, 0.2, 3.4, 0xb08560); K.box('sandMat', -3, 0.12, 4, 3.0, 0.2, 3.0, 0xffffff, { wuv: 0.5 });
  // 长椅
  for (const p of [[6, 5, -Math.PI / 2], [-8, -1, Math.PI / 2], [0, 7, Math.PI]]) parkBench(p[0] + cx, p[1] + cz, p[2]);
  // 树
  sakuraTree(cx - 8, cz + 6, 1.0, { cards: 1400 }); greenTree(cx + 8, cz - 6, 0.9); greenTree(cx + 9, cz + 7, 0.75);
  for (let i = 0; i < 6; i++) shrub(cx - 10 + i * 4, cz - 8.5, 0.7, i % 2 ? 0xf28ab2 : 0);
  const sUV = allocSign(220, 80, (g, w, h) => { g.fillStyle = '#7a5a3a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f6efe0'; g.font = `400 34px ${FONT.wei}`; g.textAlign = 'center'; g.fillText('小鸟公园', w / 2, 46); g.font = `500 12px ${FONT.sans}`; g.fillText('请爱护花草', w / 2, 68); });
  K.plane('sign', -10, 1.0, 9.1, 1.1, 0.4, 0xffffff, { uvr: sUV, ry: Math.PI / 2 }); K.box('wood', -10.05, 0.5, 9.1, 0.08, 1.0, 0.08, 0x5a3a20);
  vendingMachine(new Kit(cx + 10.5, TOWN_Y, cz - 4, -Math.PI / 2), 0, 0, 0, 0x7ab648);
  addPlace('小鸟公园', cx - 2, cz + 4, 0, 'park');
  addInteract({ x: cx - 2, z: cz - 3, r: 1.3, label: () => '荡秋千', act: () => { PARK.swingAmp[0] = 0.55; GAME.sit(K.w(-2, 0, -3)[0], TOWN_Y + 0.55, K.w(-2, 0, -3)[2], 0, () => { PARK.swingAmp[0] = 0.05; }, PARK.swings[0]); } });
}
const PARK = { swingAmp: [0.05, 0.08] };
function parkBench(x, z, ry, y) {
  y = y != null ? y : groundAt(x, z);
  const K = new Kit(x, y, z, ry);
  for (let i = 0; i < 3; i++) K.box('wood', 0, 0.45, -0.15 + i * 0.15, 1.7, 0.05, 0.12, 0xb07a4a);
  for (let i = 0; i < 2; i++) K.box('wood', 0, 0.68 + i * 0.16, -0.28, 1.7, 0.1, 0.04, 0xb07a4a, { rx: -0.12 });
  for (const s of [-1, 1]) { K.box('paint', s * 0.75, 0.22, 0, 0.06, 0.44, 0.45, 0x3b4a4a); K.box('paint', s * 0.75, 0.62, -0.28, 0.06, 0.5, 0.06, 0x3b4a4a); }
  addCollider(x, z, 0.85, 0.3, ry, y, y + 0.48, true);
  const seat = K.w(0, 0, 0.0);
  addInteract({ x: seat[0], z: seat[2], r: 1.3, label: () => '坐一会儿', act: () => GAME.sit(seat[0], y + 0.48, seat[2], ry) });
}
