/* ==========================================================================
   铁路：双轨、平交道、岛式站台车站、两节通勤列车、隧道、铁桥、接触网
   ========================================================================== */
const TRACK_Z = [-65, -55]; // 0 = 东行（北轨），1 = 西行（南轨）
const RAIL_Y = TOWN_Y + 0.2, PLAT_Y = TOWN_Y + 1.3;
const RAIL_X0 = -178, RAIL_X1 = 150;
const CROSSINGS = []; // {x, active, arms:[], lamps:[], t}
const STATION = { x: 61 };

function buildTracks() {
  const gaps = [[-4.6, 4.6], [95.4, 104.6], [22.6, 26.6]];
  const inGap = (x) => gaps.some(g => x > g[0] && x < g[1]);
  for (const tz of TRACK_Z) {
    // 道砟
    for (let x0 = RAIL_X0; x0 < RAIL_X1; x0 += 40) {
      const x1 = Math.min(RAIL_X1, x0 + 40);
      WK.box('ballast', (x0 + x1) / 2, TOWN_Y - 0.1, tz, x1 - x0, 0.24, 3.4, 0xffffff, { wuv: 0.6 });
    }
    // 枕木
    for (let x = RAIL_X0; x < RAIL_X1; x += 0.62) if (!inGap(x)) WK.box('concrete', x, TOWN_Y + 0.06, tz, 0.22, 0.1, 2.1, 0xc4c0b8);
    // 钢轨
    for (const s of [-0.533, 0.533]) { WK.box('vc', (RAIL_X0 + RAIL_X1) / 2, RAIL_Y - 0.05, tz + s, RAIL_X1 - RAIL_X0, 0.1, 0.07, 0x7d7672); WK.box('vcNoShadow', (RAIL_X0 + RAIL_X1) / 2, RAIL_Y + 0.003, tz + s, RAIL_X1 - RAIL_X0, 0.012, 0.05, 0xd6d6d6); }
  }
  // 道口铺板
  for (const g of gaps) { const cx = (g[0] + g[1]) / 2, w = g[1] - g[0]; WK.box('concrete', cx, RAIL_Y - 0.1, -60, w, 0.2, 13.5, 0xb9b5ad, { wuv: 0.6, solid: { walk: true } }); for (const tz of TRACK_Z) for (const s of [-0.62, 0.62]) WK.box('vcNoShadow', cx, RAIL_Y + 0.001, tz + s * 0.9, w, 0.01, 0.12, 0x3a3a3a); }
  // 铁桥（跨河）
  const bx = -74.8;
  WK.box('concrete', bx, TOWN_Y - 0.35, -60, 20, 0.5, 15, 0xb5b0a6, { solid: { walk: true }, wuv: 0.5 });
  for (const s of [-1, 1]) { WK.box('paint', bx, TOWN_Y - 0.9, -60 + s * 7.3, 20, 1.2, 0.3, 0x3f6b5a); WK.box('paint', bx, TOWN_Y + 0.7, -60 + s * 7.4, 20, 0.08, 0.08, 0x3f6b5a); for (let i = 0; i < 11; i++) WK.box('paint', bx - 10 + i * 2, TOWN_Y + 0.35, -60 + s * 7.4, 0.08, 0.7, 0.08, 0x3f6b5a); }
  for (const s of [-1, 1]) WK.box('concrete', bx + s * 9.8, TOWN_Y - 1.6, -60, 1.6, 3.4, 16, 0xa9a49a, { wuv: 0.5 });
  // 隧道口
  tunnelPortal(-166, 1); tunnelPortal(138.5, -1);
  // 接触网
  for (let x = -158; x <= 132; x += 30) {
    if (Math.abs(x) < 7 || Math.abs(x - 100) < 7 || Math.abs(x - 24) < 5 || (x > 34 && x < 88)) continue;
    catenaryPole(x);
  }
  for (const x of [36, 61, 86]) catenaryPole(x, true);
  for (const tz of TRACK_Z) {
    for (let x = RAIL_X0 + 10; x < RAIL_X1 - 10; x += 30) { addWire([x, RAIL_Y + 5.3, tz], [x + 30, RAIL_Y + 5.3, tz], 0.02, 2); addWire([x, RAIL_Y + 6.1, tz], [x + 30, RAIL_Y + 6.1, tz], 0.35, 6); }
  }
}
function catenaryPole(x, short) {
  for (const z of [-68.6, -51.4]) { if (short && z > -60) continue; WK.cyl('concrete', x, TOWN_Y + 3.6, z, 0.16, 7.2, 0xc9c9c4, { rt: 0.75, seg: 8 }); addCollider(x, z, 0.2, 0.2, 0, TOWN_Y, TOWN_Y + 7, 'wall'); }
  WK.box('paint', x, RAIL_Y + 6.6, short ? -64.5 : -60, 0.14, 0.14, short ? 8.4 : 17.4, 0x7d8a8f);
  for (const tz of TRACK_Z) { if (short && tz > -60) continue; WK.box('vc', x, RAIL_Y + 6.0, tz, 0.05, 1.2, 0.05, 0x7d8a8f); }
}
function tunnelPortal(x, face) {
  const K = new Kit(x, TOWN_Y - 0.4, -60, face > 0 ? Math.PI / 2 : -Math.PI / 2);
  const sh = new THREE.Shape(); sh.moveTo(-11, 0); sh.lineTo(11, 0); sh.lineTo(11, 11); sh.lineTo(-11, 11); sh.closePath();
  for (const ox of [-5, 5]) { const h = new THREE.Path(); h.moveTo(ox - 2.4, 0); h.lineTo(ox + 2.4, 0); h.lineTo(ox + 2.4, 4.6); h.absarc(ox, 4.6, 2.4, 0, Math.PI, false); h.lineTo(ox - 2.4, 0); sh.holes.push(h); }
  const g = new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: false }); g.translate(0, 0, -1.2);
  K.geo('stone', g, 0, 0, 0, 0xc8c2b6, { wuv: 0.35 });
  K.box('concrete', 0, 11.3, -0.3, 23, 0.6, 1.8, 0xb8b2a6);
  // 黑暗内部
  for (const ox of [-5, 5]) K.box('vcNoShadow', ox, 3.5, -16, 5, 7.5, 30, 0x0a0a0c);
  // 两侧挡土墙
  for (const s of [-1, 1]) K.box('stone', s * 11.5, 4, -0.6, 1.2, 9, 2.4, 0xbdb7aa, { wuv: 0.35 });
  const uv = allocSign(200, 60, (g2, w, h) => { g2.fillStyle = '#e9e4d8'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#3a3a3a'; g2.font = `400 34px ${FONT.wei}`; g2.textAlign = 'center'; g2.fillText(face > 0 ? '樱 丘 隧 道' : '潮 见 隧 道', w / 2, 42); });
  K.plane('sign', 0, 9.2, 0.02, 3.2, 0.95, 0xffffff, { uvr: uv });
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
function buildCrossing(cx) {
  const C = { x: cx, active: false, t: 0, arm: 0, arms: [], lamps: [] };
  const setups = [ // [postX, postZ, armDir(+1 → +x), facing ry]
    [cx - 4.3, -50.8, 1, 0], [cx + 4.3, -69.2, 1, Math.PI],
  ];
  for (const [px, pz, ad, ry] of setups) {
    const K = new Kit(px, TOWN_Y, pz, ry);
    // 信号柱
    K.cyl('vc', 0, 1.8, 0, 0.07, 3.6, 0xffffff, { seg: 10 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 1.6, 12), stripeMat); const pp = K.w(0, 0.8, 0); post.position.set(pp[0], pp[1], pp[2]); post.castShadow = true; scene.add(post);
    // 交叉标志
    const xUV = allocSignAlpha(200, 200, (g, w, h) => { g.translate(100, 100); for (const a of [0.7, -0.7]) { g.save(); g.rotate(a); g.fillStyle = '#1a1a1a'; g.fillRect(-98, -16, 196, 32); g.fillStyle = '#f6d04d'; g.fillRect(-94, -12, 188, 24); g.restore(); } });
    for (const s of [-1, 1]) K.plane('signCut', 0, 3.75, s * 0.06, 1.1, 1.1, 0xffffff, { uvr: xUV, ry: s > 0 ? 0 : Math.PI });
    // 红灯（两组，双面）
    K.box('vc', 0, 3.0, 0, 1.2, 0.12, 0.12, 0x222222);
    for (const s of [-1, 1]) for (const f of [1, -1]) {
      K.cyl('vc', s * 0.45, 3.0, f * 0.12, 0.2, 0.08, 0x111111, { rx: Math.PI / 2, seg: 16 });
      const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.15, 20), new THREE.MeshBasicMaterial({ color: 0x401010 }));
      const lp = K.w(s * 0.45, 3.0, f * 0.17); lamp.position.set(lp[0], lp[1], lp[2]); lamp.rotation.y = ry + (f < 0 ? Math.PI : 0); scene.add(lamp);
      C.lamps.push({ m: lamp, s });
      K.box('vc', s * 0.45, 3.2, f * 0.22, 0.42, 0.04, 0.16, 0x222222, { rx: f * 0.4 });
    }
    // 方向指示与警铃
    K.box('vc', 0, 2.55, 0.08, 0.5, 0.2, 0.08, 0x111111); K.cyl('vc', 0, 4.45, 0, 0.14, 0.18, 0x222222, { seg: 12 });
    // 栏杆机
    K.box('paint', 0.4 * ad, 0.6, 0.3, 0.35, 1.2, 0.35, 0xf2f2f0);
    const pivot = new THREE.Group(); const pv = K.w(0.4 * ad, 1.05, 0.55); pivot.position.set(pv[0], pv[1], pv[2]); pivot.rotation.y = ry; scene.add(pivot);
    const armLen = 4.4;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(armLen, 0.09, 0.09), stripeMat); arm.position.x = ad * (armLen / 2 + 0.1); arm.castShadow = true;
    const inner = new THREE.Group(); inner.add(arm); pivot.add(inner);
    // 栏杆上的小灯
    C.arms.push({ g: inner, ad });
    addCollider(px, pz, 0.3, 0.3, 0, TOWN_Y, TOWN_Y + 4, 'wall');
  }
  CROSSINGS.push(C);
  return C;
}
function updateCrossings(dt, t) {
  for (const C of CROSSINGS) {
    const want = TRAIN.wantCross(C.x);
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
const TRAIN = { cars: [], x: -200, v: 0, dir: 1, track: 0, state: 'wait', timer: 12, doors: 0, len: 36.4, nextStop: true };
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
  const destTex = canvasTex(256, 48, (c, w, h) => { c.fillStyle = '#0b0b0b'; c.fillRect(0, 0, w, h); c.fillStyle = '#ffae3d'; c.font = `700 26px ${FONT.sans}`; c.textAlign = 'center'; c.fillText('普通  樱丘 ⇄ 星见港', w / 2, 33); });
  for (const e of [-1, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.28), new THREE.MeshBasicMaterial({ map: destTex })); m.position.set(e * 9.1, 3.2, 0); m.rotation.y = e * Math.PI / 2; g.add(m); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  scene.add(g);
  return { g, doors };
}
function buildTrain() {
  for (let i = 0; i < 2; i++) TRAIN.cars.push(buildTrainCar(i === 0, i === 1, i));
  TRAIN.wantCross = (cx) => {
    if (TRAIN.state === 'wait') return false;
    const half = TRAIN.len / 2; const a = TRAIN.x - half, b = TRAIN.x + half;
    if (b > cx - 5 && a < cx + 5) return true;
    const front = TRAIN.x + TRAIN.dir * half; const ahead = (cx - front) * TRAIN.dir;
    if (ahead < 0) return false;
    if (TRAIN.state === 'stop') return TRAIN.timer < 4 && ahead < 40;
    const eta = ahead / Math.max(TRAIN.v, 2);
    return eta < 9 && ahead < 140;
  };
}
function updateTrain(dt) {
  const T = TRAIN; const VMAX = 13, ACC = 0.9, DEC = 1.2;
  if (T.state === 'wait') {
    T.timer -= dt; T.v = 0;
    if (T.timer <= 0) { T.state = 'run'; T.nextStop = true; }
  } else if (T.state === 'run') {
    let target = VMAX;
    if (T.nextStop) { const d = (STATION.x - T.x) * T.dir; target = Math.min(VMAX, Math.sqrt(Math.max(0, 2 * DEC * d))); if (d < 0.08) { T.state = 'stop'; T.timer = 14; T.v = 0; T.nextStop = false; AUDIO.trainChime && AUDIO.trainChime(); } }
    T.v += clamp(target - T.v, -DEC * dt * 1.6, ACC * dt);
    T.x += T.v * T.dir * dt;
    const end = T.dir > 0 ? 182 : -205;
    if (!T.nextStop && (T.x - end) * T.dir > 0) { T.state = 'wait'; T.timer = R(22, 32); T.dir *= -1; T.track = T.dir > 0 ? 0 : 1; T.x = end; }
  } else if (T.state === 'stop') {
    T.timer -= dt;
    T.doors = clamp(T.doors + (T.timer > 2.2 && T.timer < 12.8 ? dt : -dt) * 1.4, 0, 1);
    if (T.timer <= 0) { T.state = 'run'; T.doors = 0; }
  }
  const z = TRACK_Z[T.track]; const vis = T.state !== 'wait';
  for (let i = 0; i < T.cars.length; i++) {
    const car = T.cars[i]; const off = (i === 0 ? 1 : -1) * (TRAIN.len / 4);
    const x = T.x + off * T.dir;
    car.g.position.set(x, RAIL_Y, z); car.g.rotation.y = T.dir > 0 ? 0 : Math.PI;
    car.g.visible = vis && x > -172 && x < 145;
    for (const d of car.doors) d.g.position.x = d.base + (d.side > 0 ? d.half * T.doors * 0.62 : 0);
  }
  // 车体碰撞（简易）：玩家不能穿过车厢
  TRAIN.box = vis ? { x0: T.x - TRAIN.len / 2, x1: T.x + TRAIN.len / 2, z0: z - 1.5, z1: z + 1.5 } : null;
}
