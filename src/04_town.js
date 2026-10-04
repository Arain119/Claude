/* ==========================================================================
   商店街「海风通」：店铺、招牌、遮阳篷、街道设施
   ========================================================================== */
const SW_Y = TOWN_Y + 0.15; // 人行道顶面
const SHOP_GOODS = {
  bakery: [['牛角面包', 5, '刚出炉，酥得掉渣。'], ['红豆面包', 4, '小满的招牌。'], ['樱花吐司', 8, '限定款，粉粉的。']],
  cafe: [['热拿铁', 8, '拉花是一只海鸥。'], ['樱花拿铁', 10, '春季限定。']],
  wagashi: [['樱饼', 6, '用盐渍樱叶包着。'], ['三色团子', 5, '粉、白、绿。']],
  flower: [['小花束', 12, '雏菊和满天星。'], ['一枝玫瑰', 6, '用牛皮纸包好。']],
  udon: [['油豆腐', 3, '甜甜的，据说狐狸最爱。'], ['月见乌冬', 9, '当场吃掉。', 'eat']],
  ramen: [['潮汐拉面', 9, '当场吃掉。', 'eat']],
  mart: [['饭团', 3, '梅子馅。'], ['牛奶', 2, '小岛牧场产。'], ['明信片', 2, '印着灯塔。']],
  books: [['小诗集', 15, '《海风写给你的信》'], ['岛屿图鉴', 12, '记录岛上的花鸟鱼虫。']],
  stationery: [['信纸', 3, '带樱花水印。'], ['邮票', 1, '面值一枚贝壳。']],
  ice: [['海盐冰淇淋', 4, '咸咸甜甜。']],
  fish: [['小鱼干', 2, '猫咪零食。']],
  records: [['唱片《星见夜曲》', 20, '买下后八音盒会换一首曲子。']],
};
/* 店铺定义（E=东侧面朝西，W=西侧面朝东） */
const SHOP_DEFS = [
  { side: 'E', z0: -44, z1: -37, id: 'mart', cn: '灯塔便利店', en: 'LIGHTHOUSE MART', tel: '0898-21-0024', font: 'sans', bg: '#ffffff', fg: '#1d5aa6', ac: '#f2a33a', disp: 'vending', floors: 2, wall: 'tile', wc: 0xe9ecef, awn: -1, hours: [0, 24] },
  { side: 'E', z0: -37, z1: -30, id: 'cycle', cn: '风车单车行', en: 'WINDMILL CYCLES', tel: '0898-21-4410', font: 'round', bg: '#2f7d5b', fg: '#fffbe8', ac: '#f6d04d', disp: 'bikes', floors: 2, wall: 'siding', wc: 0xdfe9df, awn: 1, vsign: true },
  { side: 'E', z0: -30, z1: -23, id: 'pharma', cn: '海岛药局', en: 'ISLAND PHARMACY', tel: '0898-22-1189', font: 'sans', bg: '#e8f5f2', fg: '#127a6a', ac: '#e0505a', disp: 'boxes', floors: 3, wall: 'plaster', wc: 0xf3efe6, awn: 8 },
  { side: 'E', z0: -17, z1: -9.5, id: 'post', cn: '星见岛邮局', en: 'HOSHIMI ISLAND POST', tel: '0898-20-0001', font: 'wei', bg: '#c8352e', fg: '#ffffff', ac: '#ffe08a', disp: 'postbox', floors: 2, wall: 'brick', wc: 0xf0e2d6, awn: -1 },
  { side: 'E', z0: -9.5, z1: -3, id: 'books', cn: '拾页书店', en: 'PAGE & PEBBLE BOOKS', tel: '0898-21-7788', font: 'serif', bg: '#26375e', fg: '#f6efe0', ac: '#d9b46a', disp: 'magazines', floors: 3, wall: 'siding', wc: 0xe9e2d4, awn: 6, vsign: true },
  { side: 'E', z0: -3, z1: 5, id: 'cafe', cn: '星屑咖啡', en: 'STARDUST CAFÉ', tel: '0898-23-5150', font: 'wei', bg: '#3b2a24', fg: '#f7e7cf', ac: '#e9b86c', disp: 'cafe', floors: 2, wall: 'wood', wc: 0xd9c2a2, awn: 4, roofCol: 0x55606e },
  { side: 'E', z0: 5, z1: 11, id: 'barber', cn: '云朵理发', en: 'CLOUD BARBER', tel: '0898-21-3030', font: 'round', bg: '#eef4fb', fg: '#2c5aa0', ac: '#d9483b', disp: 'barber', floors: 2, wall: 'tile', wc: 0xdfe8f2, awn: 2 },
  { side: 'E', z0: 11, z1: 18.5, id: 'bakery', cn: '小满面包房', en: 'XIAOMAN BAKERY', tel: '0898-21-6262', font: 'round', bg: '#fff3dc', fg: '#9a5a2b', ac: '#e48fa6', disp: 'bread', floors: 2, wall: 'plaster', wc: 0xfbe9cf, awn: 5, roofCol: 0xb5584a, vsign: true },
  { side: 'E', z0: 18.5, z1: 26.5, id: 'flower', cn: '花信风花店', en: 'FLOWER BREEZE', tel: '0898-24-8701', font: 'serif', bg: '#f4f1e6', fg: '#3d6b45', ac: '#e48fa6', disp: 'flowers', floors: 3, wall: 'siding', wc: 0xeef3ea, awn: 1 },
  { side: 'E', z0: 26.5, z1: 34, id: 'photo', cn: '光影照相馆', en: 'LUMEN PHOTO STUDIO', tel: '0898-21-9191', font: 'serif', bg: '#1f1f24', fg: '#f0e6d2', ac: '#c9a25c', disp: 'photo', floors: 3, wall: 'tile', wc: 0xd8d4cc, awn: -1 },
  { side: 'W', z0: -44, z1: -37.5, id: 'ramen', cn: '潮汐拉面', en: 'TIDE RAMEN', tel: '0898-21-3345', font: 'brush', bg: '#1d1d1f', fg: '#ffffff', ac: '#d9483b', disp: 'sample', floors: 2, wall: 'wood', wc: 0xb89a7a, awn: -1, noren: ['拉', '面'], norenCol: '#1f2a44', roofCol: 0x3d3f46, vsign: true },
  { side: 'W', z0: -37.5, z1: -29.5, id: 'izakaya', cn: '渔火居酒屋', en: 'GYOBI IZAKAYA', tel: '0898-22-7110', font: 'brush', bg: '#f3e6c8', fg: '#2a1f18', ac: '#c8352e', disp: 'izakaya', floors: 2, wall: 'wood', wc: 0xa98a6a, awn: -1, noren: ['渔', '火', '酒'], norenCol: '#7a1f1f', roofCol: 0x3a3a40, hours: [17, 24] },
  { side: 'W', z0: -29.5, z1: -23, id: 'clock', cn: '小时光钟表', en: 'TICK-TOCK CLOCKS', tel: '0898-21-1201', font: 'serif', bg: '#eadcc0', fg: '#4a3420', ac: '#2b5d7a', disp: 'clock', floors: 3, wall: 'brick', wc: 0xe3d2c2, awn: 7 },
  { side: 'W', z0: -17, z1: -9, id: 'grocer', cn: '青柠蔬果', en: 'LIME GREENGROCER', tel: '0898-23-0831', font: 'round', bg: '#7ab648', fg: '#ffffff', ac: '#f6d04d', disp: 'fruit', floors: 2, wall: 'siding', wc: 0xf1f0e4, awn: 3 },
  { side: 'W', z0: -9, z1: -2, id: 'wagashi', cn: '春堂和菓子', en: 'HARUDO SWEETS', tel: '0898-21-5402', font: 'brush', bg: '#f7efe6', fg: '#7a2f45', ac: '#7da35a', disp: 'wagashi', floors: 2, wall: 'plaster', wc: 0xf4ecdf, awn: -1, noren: ['和', '菓', '子'], norenCol: '#7a2f45', roofCol: 0x3f4a44 },
  { side: 'W', z0: -2, z1: 4.5, id: 'stationery', cn: '贝壳文具', en: 'SHELL STATIONERY', tel: '0898-22-4646', font: 'round', bg: '#ffe9ef', fg: '#c25478', ac: '#3a8fb7', disp: 'capsule', floors: 3, wall: 'tile', wc: 0xf6e8ec, awn: 9 },
  { side: 'W', z0: 4.5, z1: 12, id: 'udon', cn: '月光乌冬', en: 'MOONLIGHT UDON', tel: '0898-21-8008', font: 'brush', bg: '#26304d', fg: '#f8e7a8', ac: '#f8e7a8', disp: 'sample', floors: 2, wall: 'wood', wc: 0xbfa585, awn: -1, noren: ['乌', '冬'], norenCol: '#26304d', roofCol: 0x46413c, vsign: true },
  { side: 'W', z0: 12, z1: 19, id: 'records', cn: '海风唱片', en: 'SEABREEZE RECORDS', tel: '0898-24-3377', font: 'wei', bg: '#2a8f8f', fg: '#fff6e0', ac: '#e98a2b', disp: 'records', floors: 3, wall: 'siding', wc: 0xe0ecea, awn: 0 },
  { side: 'W', z0: 19, z1: 27, id: 'laundry', cn: '橘猫洗衣房', en: 'ORANGE CAT LAUNDRY', tel: '0898-22-0505', font: 'round', bg: '#f39a3d', fg: '#ffffff', ac: '#ffffff', disp: 'laundry', floors: 2, wall: 'tile', wc: 0xf4efe4, awn: -1, hours: [6, 23] },
  { side: 'W', z0: 27, z1: 34, id: 'hardware', cn: '小岛五金', en: 'ISLAND HARDWARE', tel: '0898-21-2299', font: 'sans', bg: '#f6d04d', fg: '#2a2a2a', ac: '#2a2a2a', disp: 'hardware', floors: 2, wall: 'metal', wc: 0xc9d1d6, awn: 7, roofCol: 0x5d6b78 },
];
const SHOPS = []; // 运行时：{def, x, z, ry, front:[x,z]}

/* ---------------- 招牌绘制 ---------------- */
function drawLogo(g, id, x, y, r, col, bg) {
  g.save(); g.translate(x, y); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = r * 0.12;
  g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.fillStyle = bg; g.strokeStyle = bg;
  const s = r * 0.55;
  switch (id) {
    case 'post': g.fillRect(-s, -s * 0.6, s * 2, s * 1.3); g.strokeStyle = col; g.lineWidth = r * 0.1; g.beginPath(); g.moveTo(-s, -s * 0.6); g.lineTo(0, s * 0.15); g.lineTo(s, -s * 0.6); g.stroke(); g.fillStyle = '#ffe08a'; star(g, s * 0.75, -s * 0.85, s * 0.35); break;
    case 'cafe': g.beginPath(); g.arc(0, s * 0.1, s * 0.75, 0, Math.PI); g.fill(); g.fillRect(-s * 0.75, -s * 0.2, s * 1.5, s * 0.35); g.lineWidth = r * 0.1; g.beginPath(); g.arc(s * 0.9, s * 0.15, s * 0.3, -1.2, 1.2); g.stroke(); star(g, 0, -s * 0.75, s * 0.3); break;
    case 'bakery': g.beginPath(); g.ellipse(0, 0, s * 1.05, s * 0.6, -0.3, 0, TAU); g.fill(); g.strokeStyle = col; g.lineWidth = r * 0.07; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * s * 0.4 - s * 0.15, -s * 0.35); g.lineTo(i * s * 0.4 + s * 0.15, s * 0.35); g.stroke(); } break;
    case 'flower': for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(Math.cos(i * TAU / 5) * s * 0.5, Math.sin(i * TAU / 5) * s * 0.5, s * 0.42, s * 0.28, i * TAU / 5, 0, TAU); g.fill(); } g.fillStyle = col; g.beginPath(); g.arc(0, 0, s * 0.25, 0, TAU); g.fill(); break;
    case 'mart': g.fillRect(-s * 0.18, -s * 0.2, s * 0.36, s * 1.1); g.beginPath(); g.moveTo(-s * 0.4, -s * 0.2); g.lineTo(0, -s * 0.95); g.lineTo(s * 0.4, -s * 0.2); g.fill(); g.fillStyle = '#f2a33a'; g.beginPath(); g.moveTo(0, -s * 0.6); g.lineTo(s * 1.1, -s * 0.9); g.lineTo(s * 1.1, -s * 0.3); g.fill(); break;
    default: star(g, 0, 0, s * 0.95);
  }
  g.restore();
}
function star(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
function drawShopSign(d, W, H) {
  return allocSign(W, H, (g, w, h) => {
    g.fillStyle = d.bg; g.fillRect(0, 0, w, h);
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, 'rgba(255,255,255,0.12)'); grd.addColorStop(1, 'rgba(0,0,0,0.12)'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.strokeStyle = d.ac; g.lineWidth = 5; g.strokeRect(7, 7, w - 14, h - 14);
    drawLogo(g, d.id, h * 0.55, h * 0.5, h * 0.3, d.ac, d.bg);
    const left = h * 1.0, right = w - h * 0.25;
    g.fillStyle = d.fg; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    const fs = fitText(g, d.cn, (right - left) * 0.98, h * 0.5, FONT[d.font], d.font === 'brush' ? '400' : '900');
    g.fillText(d.cn, left, h * 0.58);
    g.font = `700 ${h * 0.15}px ${FONT.sans}`; g.fillStyle = d.ac; g.letterSpacing = '2px';
    g.fillText(d.en, left + 2, h * 0.82);
    g.textAlign = 'right'; g.fillStyle = d.fg; g.globalAlpha = 0.85; g.font = `500 ${h * 0.13}px ${FONT.sans}`;
    g.fillText('☎ ' + d.tel, right, h * 0.82); g.globalAlpha = 1;
  });
}
function drawVerticalSign(d, W, H) {
  return allocSign(W, H, (g, w, h) => {
    g.fillStyle = d.bg; g.fillRect(0, 0, w, h); g.strokeStyle = d.ac; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
    const chars = [...d.cn]; const cs = Math.min(w * 0.72, (h - w * 0.9) / chars.length);
    g.fillStyle = d.fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${d.font === 'brush' ? 400 : 900} ${cs}px ${FONT[d.font]}`;
    chars.forEach((c, i) => g.fillText(c, w / 2, w * 0.25 + cs * (i + 0.55)));
    g.fillStyle = d.ac; g.font = `700 ${w * 0.16}px ${FONT.sans}`; g.fillText(d.tel.slice(-4), w / 2, h - w * 0.3);
  });
}
function drawNoren(d, W, H) {
  return allocSignAlpha(W, H, (g, w, h) => {
    const n = d.noren.length; const pw = w / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle = d.norenCol; g.fillRect(i * pw + 3, 0, pw - 6, h);
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(i * pw + 3, 0, pw - 6, h * 0.12);
      g.fillStyle = '#fbf6ec'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `400 ${Math.min(pw * 0.75, h * 0.6)}px ${FONT.brush}`;
      g.fillText(d.noren[i], i * pw + pw / 2, h * 0.55);
    }
  });
}

/* --- 通用小件 --- */
function acUnit(kit, x, y, z, ry = 0) {
  kit.box('vc', x, y, z, 0.8, 0.6, 0.3, 0xe8e6df, { ry });
  kit.cyl('vc', x - 0.1, y, z + 0.16, 0.2, 0.02, 0x6a6e72, { rx: Math.PI / 2, ry, seg: 12 });
  kit.box('vc', x + 0.38, y - 0.55, z, 0.05, 0.6, 0.05, 0xd6d3c8, { ry });
  const sp = kit.w(x, y - 0.85, z + 0.03); addWallFade(sp[0], sp[1], sp[2], 0.55, 1.1, kit.ry + ry, 0.3, 1); // 冷凝水痕
}
function antenna(kit, x, y, z, ry = 0) {
  kit.box('vc', x, y + 1.2, z, 0.05, 2.4, 0.05, 0x8d9096);
  for (let i = 0; i < 6; i++) kit.box('vc', x, y + 2.0 + (i % 2) * 0.02, z - 0.6 + i * 0.22, 0.9 - i * 0.07, 0.03, 0.03, 0x8d9096, { ry });
  kit.box('vc', x, y + 2.0, z, 0.03, 0.03, 1.4, 0x8d9096, { ry });
}
function laundry(kit, x, y, z, w) {
  kit.box('vc', x, y, z, w, 0.04, 0.04, 0xbfc3c8);
  const cols = [0xffffff, 0xf3b7c6, 0x9cc7e8, 0xf6e08c, 0xb8dca8, 0xffffff, 0xe6a87c];
  let px = x - w / 2 + 0.3;
  while (px < x + w / 2 - 0.3) {
    const cw = R(0.35, 0.7), ch = R(0.4, 0.8); const c = pick(cols);
    if (chance(0.25)) { kit.box('vc', px + cw / 2, y - 0.45, z, cw, 0.7, 0.03, c); kit.box('vc', px + cw / 2, y - 0.2, z, cw + 0.3, 0.25, 0.03, c); }
    else kit.box('vc', px + cw / 2, y - ch / 2 - 0.03, z, cw, ch, 0.02, c);
    px += cw + R(0.08, 0.2);
  }
}
function balcony(kit, x, y, z, w, deep = 0.9, col = 0xd8d8d2) {
  kit.box('concrete', x, y, z + deep / 2, w, 0.15, deep, col);
  kit.box('vc', x, y + 0.55, z + deep - 0.03, w, 0.06, 0.06, 0x8b8f94);
  for (let i = 0; i <= Math.floor(w / 0.12); i++) kit.box('vc', x - w / 2 + i * 0.12, y + 0.32, z + deep - 0.03, 0.025, 0.5, 0.025, 0x8b8f94);
  kit.box('vc', x - w / 2, y + 0.32, z + deep / 2, 0.025, 0.5, deep, 0x8b8f94); kit.box('vc', x + w / 2, y + 0.32, z + deep / 2, 0.025, 0.5, deep, 0x8b8f94);
}
function windowAt(kit, x, y, z, w, h, frame = 0xe6e3dc, o = {}) {
  kit.plane('win', x, y, z + 0.02, w, h, 0xffffff, { uvr: winUV(o.v != null ? o.v : RI(0, 15)) });
  const f = 0.07;
  kit.box('vc', x, y + h / 2, z + 0.04, w + f * 2, f, 0.08, frame); kit.box('vc', x, y - h / 2, z + 0.06, w + f * 2 + 0.1, f, 0.14, frame);
  kit.box('vc', x - w / 2, y, z + 0.04, f, h, 0.08, frame); kit.box('vc', x + w / 2, y, z + 0.04, f, h, 0.08, frame);
  // 窗台下沿的水痕（沿该面墙的外法向贴出）
  const or_ = o.ry || 0, nx = Math.sin(or_) * 0.028, nz = Math.cos(or_) * 0.028;
  const sp = kit.w(x + nx, y - h / 2 - 0.4, z + nz); addWallFade(sp[0], sp[1], sp[2], w * 0.5, 0.75, kit.ry + or_, 0.26, 1);
}
/* 三棱柱屋顶（单位：宽 1 × 高 1 × 深 1，屋脊沿 x） */
const PRISM = (() => {
  const s = new THREE.Shape(); s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0, 1); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }); g.translate(0, 0, -0.5); g.rotateY(Math.PI / 2); return g;
})();
function gableRoof(kit, x, y, z, w, d, h, col, ry = 0, over = 0.45) {
  // 屋脊沿局部 x；两侧坡面用薄板，带出檐
  const half = d / 2 + over; const slope = Math.atan2(h, d / 2); const L = Math.hypot(half, h * half / (d / 2));
  kit.geo('plaster', PRISM, x, y, z, 0xf0ece4, { sx: w, sy: h, sz: d, ry });
  for (const s of [-1, 1]) {
    const cz = s * (half / 2), cy = y + h - (h * (half / 2)) / (d / 2) + 0.06;
    kit.box('roof', x, cy, z + cz, w + over * 2, 0.12, L, col, { rx: s * slope, ry, wuv: 1.2 });
  }
  kit.box('roof', x, y + h + 0.06, z, w + over * 2, 0.18, 0.3, new THREE.Color(col).multiplyScalar(0.8), { ry });
}

/* ---------------- 店铺建造 ---------------- */
function buildShop(d) {
  const w = d.z1 - d.z0, zc = (d.z0 + d.z1) / 2, E = d.side === 'E';
  const fx = E ? 7 : -7, ry = E ? -Math.PI / 2 : Math.PI / 2;
  const K = new Kit(fx, SW_Y, zc, ry);
  const D = 11, F0 = 3.5, FU = 3.0, n = d.floors, H = F0 + (n - 1) * FU, RD = 1.4;
  const wall = new THREE.Color(d.wc);
  const hw = w / 2 - 0.05;
  // 侧墙（贯通）与后部
  K.box(d.wall, -hw + 0.25, F0 / 2, -D / 2, 0.5, F0, D, wall, { solid: true, wuv: 0.5 });
  K.box(d.wall, hw - 0.25, F0 / 2, -D / 2, 0.5, F0, D, wall, { solid: true, wuv: 0.5 });
  K.box(d.wall, 0, F0 / 2, -D + 2.5, w - 1.0, F0, 5, wall, { solid: true, wuv: 0.5 });
  // 上层主体
  K.box(d.wall, 0, F0 + (H - F0) / 2 - 0.15, -D / 2, w - 0.1, H - F0 + 0.3, D, wall, { solid: true, wuv: 0.5 });
  // 凹入店面天花与地面
  K.box('vc', 0, F0 - 0.15, -RD / 2, w - 1.0, 0.3, RD, wall.clone().multiplyScalar(0.92));
  K.box('tile', 0, 0.01, -RD / 2 - 1.5, w - 1.0, 0.04, RD + 3, 0xd9d4cb, { wuv: 1.2 });
  // 室内（透过玻璃可见）
  const inner = new THREE.Color(pick([0xf6ead8, 0xf3f0ea, 0xe9e1d6, 0xf7e9e2]));
  K.box('wood', 0, 0.02, -RD - 2.6, w - 1.0, 0.04, 5.2, 0xd8b48a, { wuv: 0.8 });
  K.plane('vc', 0, F0 / 2, -D + 5.01, w - 1.0, F0, inner);
  K.plane('glow', 0, F0 - 0.31, -RD - 2.6, w - 1.6, 0.25, 0xfff3d6, { rx: Math.PI / 2 });
  // 货架
  const shelfCols = { bakery: [0xe0a35c, 0xc98546, 0xf1d3a0], flower: [0xe86a8a, 0xf4c542, 0xffffff, 0x9fd26a], books: [0x3a5a8c, 0xc8352e, 0xe8d6a8, 0x3d6b45], mart: [0xe9483b, 0x2c7bd8, 0xf6d04d, 0xffffff], records: [0x222222, 0xe98a2b, 0x2a8f8f] };
  const pal = shelfCols[d.id] || [0xc9b28a, 0x8fb0c8, 0xe2a3a3, 0xb8d0a0];
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 - 0.85);
    K.box('wood', x, 1.0, -RD - 2.8, 0.5, 2.0, 3.8, 0x9a7a58);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) K.box('vcNoShadow', x - sx * 0.27, 0.35 + r * 0.45, -RD - 1.2 - k * 0.6, 0.06, R(0.2, 0.32), 0.45, pick(pal));
  }
  K.box('wood', 0, 0.5, -D + 5.8, Math.min(2.4, w - 3), 1.0, 0.6, 0xb08560);
  K.box('vcNoShadow', 0, 1.25, -D + 5.8, 0.4, 0.3, 0.3, 0x4a4a52);
  // 店面玻璃
  const gw = w - 1.0;
  K.box('vc', 0, 0.22, -RD, gw, 0.44, 0.15, 0x3e3f44);
  K.plane('glass', 0, 0.45 + (F0 - 1.25) / 2, -RD + 0.02, gw, F0 - 1.25, 0xffffff);
  K.box('vc', 0, F0 - 0.65, -RD, gw, 0.3, 0.12, 0x3e3f44);
  for (let i = 0; i <= 3; i++) K.box('vc', -gw / 2 + i * gw / 3, (F0 - 0.5) / 2, -RD, 0.07, F0 - 0.5, 0.1, 0x55575d);
  addCollider(...K.w(0, 0, -RD - 0.05).filter((_, i) => i !== 1), gw / 2, 0.15, ry, SW_Y, SW_Y + F0, 'wall');
  // 招牌
  // 接地阴影：沿街立面的落地感
  const sp = K.w(0, 0, -D / 2 - 0.4); addGroundShadow(sp[0], sp[2], w + 1.8, D + 2.2, ry, 0.55, 1.0);
  // 墙面过渡：后墙与山墙的墙脚潮气带
  for (const [lx, lz, wry, ww] of [[0, -D - 0.03, 0, w - 1], [-w / 2 - 0.53, -D / 2, Math.PI / 2, D], [w / 2 + 0.53, -D / 2, Math.PI / 2, D]]) { const p = K.w(lx, 0.45, lz); addWallFade(p[0], p[1], p[2], ww, 0.9, ry + wry, 0.45, 0); }
  const sW = w - 0.3; const sUV = drawShopSign(d, sW * 110, 1.05 * 110);
  K.box('vc', 0, F0 + 0.35, 0.1, sW + 0.1, 1.15, 0.2, 0x3a3a3e);
  K.plane('sign', 0, F0 + 0.35, 0.205, sW, 1.05, 0xffffff, { uvr: sUV });
  // 遮阳篷 / 雨棚
  if (d.awn >= 0) {
    const aw = w - 0.4, rep = aw / 8;
    K.plane('awning', 0, F0 - 0.62, 0.75, aw, 1.6, 0xffffff, { rx: -1.22, uvr: awnUV(d.awn, 0, rep) });
    K.plane('awning', 0, F0 - 1.12, 1.5, aw, 0.4, 0xffffff, { uvr: awnUV(d.awn, 1, rep) });
    for (const s of [-1, 1]) K.box('vc', s * aw / 2, F0 - 0.6, 0.75, 0.03, 0.03, 1.6, 0x6b6b6b, { rx: -0.35 });
  } else if (!d.noren) {
    K.box('metal', 0, F0 - 0.25, 0.6, w - 0.4, 0.08, 1.3, 0xc8ccd0, { wuv: 1 });
  } else {
    K.box('wood', 0, F0 - 0.2, 0.45, w - 0.3, 0.1, 1.0, 0x6b4a35);
  }
  // 暖帘
  if (d.noren) { const nw = Math.min(2.2, w - 2.5); const nUV = drawNoren(d, nw * 120, 1.0 * 120); K.plane('signCut', 0, F0 - 1.05, -RD + 0.2, nw, 1.0, 0xffffff, { uvr: nUV }); K.box('wood', 0, F0 - 0.52, -RD + 0.2, nw + 0.3, 0.05, 0.05, 0x5a3a20); }
  // 袖看板
  if (d.vsign) { const vUV = drawVerticalSign(d, 0.6 * 110, 2.4 * 110); for (const s of [-1, 1]) K.plane('sign', hw - 0.5 + s * 0.08, F0 + 1.9, 0.75, 0.6, 2.4, 0xffffff, { ry: s * Math.PI / 2, uvr: vUV }); K.box('vc', hw - 0.5, F0 + 1.9, 0.75, 0.14, 2.5, 0.68, 0x333333); K.box('vc', hw - 0.5, F0 + 1.9, 0.25, 0.06, 0.06, 0.6, 0x777777); }
  // 上层窗户、空调、阳台
  const nWin = Math.max(1, Math.floor((w - 1.2) / 2.3));
  for (let f = 1; f < n; f++) {
    const y = F0 + (f - 1) * FU + 1.55; const hasBal = f === n - 1 && n >= 3 && chance(0.6);
    for (let i = 0; i < nWin; i++) {
      const x = -w / 2 + (i + 0.5) * (w / nWin);
      if (d.vsign && Math.abs(x - (hw - 0.5)) < 1.0) continue;
      windowAt(K, x, y, 0.0, 1.45, 1.45);
      if (!hasBal && f > 1 && chance(0.35)) acUnit(K, x + 0.3, y - 1.15, 0.2); // f=1 层空调会压到招牌带，只许上层放
    }
    if (hasBal) { balcony(K, 0, F0 + (f - 1) * FU + 0.2, 0, w - 0.6); acUnit(K, -w / 2 + 0.8, F0 + (f - 1) * FU + 0.62, 0.45); if (chance(0.8)) laundry(K, 0.4, F0 + (f - 1) * FU + 2.1, 0.55, w - 2.2); }
  }
  // 屋顶
  if (n >= 3 || chance(0.4)) {
    K.box('concrete', 0, H + 0.25, -D / 2, w - 0.1, 0.5, D, 0xd8d6d0, { wuv: 0.5 });
    K.box('concrete', 0, H + 0.4, -0.1, w - 0.1, 0.8, 0.2, 0xcfcac2);
    antenna(K, R(-w / 4, w / 4), H + 0.4, -D / 2 + R(-2, 2), R(-0.4, 0.4));
    if (chance(0.4)) { K.cyl('vc', w / 4, H + 1.3, -D + 2, 0.7, 1.6, 0xd0d3d6, { seg: 12 }); }
  } else {
    gableRoof(K, 0, H, -D / 2, w - 0.1, D, 2.0, d.roofCol || pick([0x4a5568, 0x6b4f45, 0x3f5a5a, 0x5a5048]), Math.PI / 2, 0.35);
    antenna(K, 0, H + 1.6, -D / 2, R(-0.4, 0.4));
  }
  // 背面
  for (let f = 0; f < n; f++) for (let i = 0; i < nWin; i++) if (chance(0.7)) windowAt(K, -w / 2 + (i + 0.5) * (w / nWin), f * FU + 1.8, -D - 0.01, 1.1, 1.0, 0xd8d5ce, { ry: Math.PI });
  K.box('vc', w / 2 - 0.4, H / 2, -D - 0.12, 0.12, H, 0.12, 0x9aa0a6);
  // 店前展示
  shopDisplay(d, K, w);
  const front = K.w(0, 0, 0.8); const door = K.w(0, 0, -RD + 0.2);
  const shop = { def: d, x: front[0], z: front[2], ry, door, open(h) { const hr = d.hours || [8, 20]; return h >= hr[0] && h < hr[1]; } };
  SHOPS.push(shop);
  if (d.id === 'post') addPlace('海风通 · 邮局', front[0] + (E ? -2.2 : 2.2), front[2], E ? Math.PI / 2 : -Math.PI / 2, 'post');
  // 夜灯
  const s1 = K.w(0, F0 + 0.35, 0.6); addHalo(s1[0], s1[1], s1[2], 3.0, 0xfff0d0);
  return shop;
}

/* 店前展示 */
function shopDisplay(d, K, w) {
  const disp = d.disp;
  const z0 = 0.9; // 人行道上距门面
  if (disp === 'fruit') {
    for (let t = 0; t < 3; t++) { K.box('wood', 0, 0.25 + t * 0.32, z0 + 0.9 - t * 0.35, w - 2.2, 0.08, 0.5, 0x9b7653); }
    K.box('wood', -(w - 2.2) / 2, 0.5, z0 + 0.55, 0.06, 1.0, 1.2, 0x7e5e40); K.box('wood', (w - 2.2) / 2, 0.5, z0 + 0.55, 0.06, 1.0, 1.2, 0x7e5e40);
    const fruits = [0xe2352f, 0xf39a3d, 0xf6d04d, 0x7ab648, 0x8e3b8a, 0xf6c6a0];
    for (let t = 0; t < 3; t++) for (let i = 0; i < Math.floor((w - 2.4) / 0.62); i++) {
      const x = -(w - 2.4) / 2 + i * 0.62 + 0.3, y = 0.33 + t * 0.32, z = z0 + 0.9 - t * 0.35; const c = pick(fruits);
      K.box('wood', x, y + 0.05, z, 0.56, 0.12, 0.42, 0xc9a06a);
      for (let k = 0; k < 6; k++) K.sph('vcNoShadow', x + (k % 3 - 1) * 0.16, y + 0.15, z + (k < 3 ? -0.09 : 0.09), 0.08, 0.075, 0.08, c, { lo: true });
      const pUV = allocSign(48, 28, (g, W, H) => { g.fillStyle = '#fff8e0'; g.fillRect(0, 0, W, H); g.fillStyle = '#c8352e'; g.font = `900 20px ${FONT.sans}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(RI(1, 6) * 50 + '', W / 2, H / 2 + 1); });
      K.plane('sign', x, y + 0.28, z + 0.22, 0.2, 0.12, 0xffffff, { uvr: pUV, rx: -0.4 });
    }
  } else if (disp === 'magazines') {
    K.box('vc', 0, 0.75, z0 + 0.4, 2.0, 1.5, 0.08, 0x4b5563, { rx: -0.25 });
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) {
      const cUV = allocSign(44, 60, (g, W, H) => { const c = pick(['#e9483b', '#2c7bd8', '#f6d04d', '#7ab648', '#e48fa6', '#26375e', '#ffffff']); g.fillStyle = c; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(4, 4, W - 8, 10); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(6, 20, W - 12, 26); g.fillStyle = '#222'; g.font = `900 9px ${FONT.sans}`; g.fillText(pick(['海岛周刊', '春日', '少女', '钓鱼', '料理', '猫']), 6, 13); });
      K.plane('sign', -0.85 + i * 0.34, 0.35 + r * 0.45, z0 + 0.46 - r * 0.11, 0.3, 0.4, 0xffffff, { rx: -0.25, uvr: cUV });
    }
    K.box('wood', -w / 2 + 1.2, 0.45, z0 + 0.3, 0.9, 0.9, 0.5, 0x8a6a4a);
  } else if (disp === 'sample') {
    K.box('vc', w / 2 - 1.5, 0.45, z0 - 0.2, 1.6, 0.9, 0.6, 0x5a4636);
    K.box('vc', w / 2 - 1.5, 1.3, z0 - 0.2, 1.6, 0.04, 0.6, 0x5a4636);
    K.plane('glass', w / 2 - 1.5, 1.1, z0 + 0.1, 1.6, 0.4, 0xffffff);
    for (let i = 0; i < 3; i++) {
      const x = w / 2 - 2.0 + i * 0.5; K.cyl('vcNoShadow', x, 0.97, z0 - 0.2, 0.18, 0.12, 0x2b2b2b, { rt: 0.13 / 0.18, seg: 16 });
      K.cyl('vcNoShadow', x, 1.04, z0 - 0.2, 0.15, 0.02, d.id === 'udon' ? 0xf2e9d0 : 0xd99a4a, { seg: 16 });
      K.sph('vcNoShadow', x + 0.05, 1.07, z0 - 0.15, 0.05, 0.03, 0.05, d.id === 'udon' ? 0xf6c04a : 0xf6efe0, { lo: true });
      K.box('vcNoShadow', x - 0.05, 1.06, z0 - 0.25, 0.12, 0.02, 0.05, 0xc85a5a);
    }
    lanternRed(K, -w / 2 + 0.8, F0Of() - 1.0, 0.5);
  } else if (disp === 'izakaya') {
    lanternRed(K, -w / 2 + 0.8, 2.4, 0.5); lanternRed(K, w / 2 - 0.8, 2.4, 0.5);
    for (let i = 0; i < 3; i++) K.box('vc', w / 2 - 1.4, 0.2 + i * 0.32, z0 + 0.1, 0.5, 0.3, 0.38, 0xd9483b);
    K.box('vc', -w / 2 + 1.6, 0.5, z0 + 0.2, 0.6, 1.0, 0.05, 0x2a2a2a, { rx: -0.2 });
  } else if (disp === 'cafe') {
    const bUV = allocSign(120, 160, (g, W, H) => { g.fillStyle = '#2f3a33'; g.fillRect(0, 0, W, H); g.strokeStyle = '#8a6a4a'; g.lineWidth = 8; g.strokeRect(0, 0, W, H); g.fillStyle = '#f6efe0'; g.font = `400 20px ${FONT.wei}`; g.textAlign = 'center'; g.fillText('今日推荐', W / 2, 32); g.font = `400 15px ${FONT.wei}`; g.fillText('樱花拿铁', W / 2, 62); g.fillText('海盐司康', W / 2, 86); g.fillStyle = '#f4b8c8'; g.fillText('♡ 10 贝', W / 2, 118); g.fillStyle = '#e9b86c'; g.fillText('～ 星屑 ～', W / 2, 146); });
    for (const s of [-1, 1]) K.plane('sign', -w / 2 + 1.3, 0.55, z0 + 0.3 + s * 0.18, 0.55, 0.75, 0xffffff, { uvr: bUV, rx: -s * 0.25, ry: s < 0 ? Math.PI : 0 });
    K.cyl('wood', w / 2 - 1.6, 0.36, z0 + 0.3, 0.32, 0.04, 0x8a6a4a, { seg: 16 }); K.cyl('vc', w / 2 - 1.6, 0.18, z0 + 0.3, 0.04, 0.36, 0x333333);
    potPlant(K, -w / 2 + 0.5, -0.4); potPlant(K, w / 2 - 0.5, -0.4);
  } else if (disp === 'bread') {
    K.box('wood', w / 2 - 1.6, 0.4, z0, 1.3, 0.8, 0.6, 0xb08560);
    for (let i = 0; i < 3; i++) { K.cyl('wood', w / 2 - 2.0 + i * 0.4, 0.84, z0, 0.17, 0.08, 0xd9b27a, { seg: 12 }); for (let k = 0; k < 3; k++) K.sph('vcNoShadow', w / 2 - 2.05 + i * 0.4 + (k - 1) * 0.07, 0.92, z0 + (k - 1) * 0.06, 0.08, 0.05, 0.06, pick([0xd9913a, 0xc77b30, 0xeab36a]), { lo: true }); }
    const bUV = allocSign(120, 150, (g, W, H) => { g.fillStyle = '#fff6e8'; g.fillRect(0, 0, W, H); g.strokeStyle = '#e48fa6'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6); g.fillStyle = '#9a5a2b'; g.textAlign = 'center'; g.font = `400 22px ${FONT.round}`; g.fillText('刚出炉', W / 2, 40); g.font = `400 16px ${FONT.round}`; g.fillText('牛角面包', W / 2, 75); g.fillText('红豆面包', W / 2, 100); g.fillStyle = '#e48fa6'; g.fillText('樱花吐司', W / 2, 125); });
    for (const s of [-1, 1]) K.plane('sign', -w / 2 + 1.3, 0.55, z0 + 0.3 + s * 0.18, 0.55, 0.7, 0xffffff, { uvr: bUV, rx: -s * 0.25, ry: s < 0 ? Math.PI : 0 });
  } else if (disp === 'flowers') {
    for (let t = 0; t < 3; t++) K.box('wood', 0, 0.2 + t * 0.3, z0 + 0.7 - t * 0.35, w - 1.8, 0.06, 0.4, 0x8a6a4a);
    const fc = [0xe86a8a, 0xf4c542, 0xffffff, 0xd75a9a, 0xf39a3d, 0xb38be0, 0xff8fa8];
    for (let t = 0; t < 3; t++) for (let i = 0; i < Math.floor((w - 2) / 0.45); i++) {
      const x = -(w - 2) / 2 + 0.22 + i * 0.45, y = 0.23 + t * 0.3, z = z0 + 0.7 - t * 0.35;
      K.cyl('vc', x, y + 0.14, z, 0.14, 0.28, pick([0x5f7a8c, 0x8a9aa8, 0x3f6f8f]), { rt: 0.85, seg: 10 });
      const c = pick(fc); for (let k = 0; k < 7; k++) K.sph('vcNoShadow', x + R(-0.12, 0.12), y + R(0.42, 0.6), z + R(-0.1, 0.1), 0.06, 0.05, 0.06, c, { lo: true });
      K.sph('vcNoShadow', x, y + 0.38, z, 0.13, 0.08, 0.12, 0x5f9a4a, { lo: true });
    }
  } else if (disp === 'barber') {
    const pole = new THREE.Group(); const tex = canvasTex(64, 128, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 128); for (let i = -2; i < 8; i++) { g.fillStyle = i % 2 ? '#d9483b' : '#2c5aa0'; g.beginPath(); g.moveTo(0, i * 32); g.lineTo(64, i * 32 - 40); g.lineTo(64, i * 32 - 24); g.lineTo(0, i * 32 + 16); g.fill(); } }, { repeat: true });
    const cylM = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.9, 20, 1, true), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 0.3 }));
    const glassM = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.95, 20, 1, true), MATS.glass.material);
    const p = K.w(-w / 2 + 0.7, 1.55, 0.25); pole.position.set(p[0], p[1], p[2]); pole.add(cylM, glassM); scene.add(pole);
    K.cyl('vc', -w / 2 + 0.7, 2.05, 0.25, 0.17, 0.08, 0xdedede, { seg: 16 }); K.cyl('vc', -w / 2 + 0.7, 1.05, 0.25, 0.17, 0.08, 0xdedede, { seg: 16 });
    K.box('vc', -w / 2 + 0.7, 1.55, 0.1, 0.06, 0.06, 0.3, 0x999999);
    onUpdate((dt, t) => { tex.offset.y = (t * 0.35) % 1; cylM.material.emissiveIntensity = 0.25 + NIGHT.v * 0.8; });
  } else if (disp === 'bikes') {
    for (let i = 0; i < 4; i++) bicycleStatic(K, -w / 2 + 1.0 + i * 0.75, z0 + 0.2, Math.PI / 2 + R(-0.1, 0.1), pick([0xd9483b, 0x2c5aa0, 0xf6d04d, 0x2f7d5b, 0xffffff, 0xe48fa6]));
  } else if (disp === 'vending') {
    vendingMachine(K, w / 2 - 0.9, -0.2, 0, 0xd9483b, 'COLD'); vendingMachine(K, w / 2 - 2.0, -0.2, 0, 0x2c7bd8, 'COLD');
    K.box('vc', -w / 2 + 0.9, 0.45, 0.2, 0.9, 0.9, 0.5, 0x7a8a96); K.box('vc', -w / 2 + 0.9, 0.95, 0.2, 0.95, 0.1, 0.55, 0x5f6e7a);
  } else if (disp === 'postbox') {
    K.cyl('paint', w / 2 - 1.0, 0.7, z0 + 0.1, 0.28, 1.2, 0xc8352e, { seg: 16 }); K.sph('paint', w / 2 - 1.0, 1.32, z0 + 0.1, 0.3, 0.14, 0.3, 0xc8352e);
    K.box('vc', w / 2 - 1.0, 1.0, z0 + 0.38, 0.3, 0.05, 0.02, 0x222222);
    K.box('vc', w / 2 - 1.0, 0.04, z0 + 0.1, 0.5, 0.08, 0.5, 0x777777);
    potPlant(K, -w / 2 + 0.6, -0.3);
  } else if (disp === 'wagashi') {
    K.box('vc', w / 2 - 1.7, 0.45, z0 + 0.1, 1.6, 0.06, 0.5, 0xc8352e); for (const s of [-1, 1]) K.box('wood', w / 2 - 1.7 + s * 0.7, 0.22, z0 + 0.1, 0.06, 0.44, 0.45, 0x5a3a20);
    K.cyl('vc', w / 2 - 1.7, 1.3, z0 + 0.1, 0.03, 2.6, 0x8a6a4a); K.cyl('vc', w / 2 - 1.7, 2.4, z0 + 0.1, 1.1, 0.25, 0xc8352e, { rt: 0.04 / 1.1, seg: 16 });
    potPlant(K, -w / 2 + 0.6, -0.3);
  } else if (disp === 'capsule') {
    for (let i = 0; i < 3; i++) { const x = -w / 2 + 0.9 + i * 0.55; K.box('vc', x, 0.35, z0 - 0.3, 0.5, 0.7, 0.45, pick([0xe48fa6, 0x3a8fb7, 0xf6d04d])); K.box('glass', x, 0.95, z0 - 0.3, 0.46, 0.5, 0.42, 0xffffff); for (let k = 0; k < 5; k++) K.sph('vcNoShadow', x + R(-0.12, 0.12), 0.8 + R(0, 0.2), z0 - 0.3 + R(-0.12, 0.12), 0.07, 0.07, 0.07, pick([0xff6b6b, 0x6bc5ff, 0xffe66b, 0xffffff]), { lo: true }); }
  } else if (disp === 'records') {
    for (let i = 0; i < 2; i++) { const x = w / 2 - 1.4 - i * 0.9; K.box('wood', x, 0.4, z0, 0.7, 0.8, 0.4, 0x7a5a3a); for (let k = 0; k < 8; k++) K.box('vcNoShadow', x - 0.3 + k * 0.08, 0.95, z0, 0.02, 0.32, 0.32, pick([0x222222, 0xe98a2b, 0x2a8f8f, 0xd9483b, 0xf6efe0])); }
  } else if (disp === 'laundry') {
    for (let i = 0; i < 3; i++) { const x = -w / 2 + 1.5 + i * 1.0; K.box('vcNoShadow', x, 0.55, -RD_IN(), 0.8, 1.1, 0.7, 0xf2f2f2); K.cyl('vcNoShadow', x, 0.6, -RD_IN() + 0.36, 0.25, 0.04, 0x8fb0c8, { rx: Math.PI / 2, seg: 16 }); }
    K.box('vc', w / 2 - 1.1, 0.4, z0 - 0.4, 1.2, 0.08, 0.35, 0x8a6a4a); for (const s of [-1, 1]) K.box('vc', w / 2 - 1.1 + s * 0.5, 0.2, z0 - 0.4, 0.05, 0.4, 0.3, 0x555555);
  } else if (disp === 'hardware') {
    for (let i = 0; i < 5; i++) K.cyl('vc', -w / 2 + 0.9 + i * 0.32, 0.18, z0, 0.14, 0.36, pick([0x2c7bd8, 0xd9483b, 0x7ab648, 0xf6d04d]), { rt: 1.15, seg: 12 });
    for (let i = 0; i < 4; i++) { K.cyl('wood', w / 2 - 1.2 + i * 0.18, 0.75, -0.2, 0.025, 1.5, 0xb08560, { rz: 0.12 }); K.box('vcNoShadow', w / 2 - 1.2 + i * 0.18 + 0.1, 0.12, -0.2, 0.25, 0.25, 0.06, 0xd9b45a, { rz: 0.12 }); }
  } else if (disp === 'boxes') {
    K.box('wood', w / 2 - 1.5, 0.3, z0, 1.6, 0.6, 0.5, 0xffffff);
    for (let i = 0; i < 8; i++) K.box('vcNoShadow', w / 2 - 2.1 + (i % 4) * 0.38, 0.72 + Math.floor(i / 4) * 0.25, z0, 0.32, 0.22, 0.25, pick([0xffffff, 0x8fd3c7, 0xf4c6c6, 0xf6e08c]));
  } else if (disp === 'clock') {
    const cUV = allocSign(128, 128, (g, W, H) => { g.fillStyle = '#f6efe0'; g.beginPath(); g.arc(64, 64, 60, 0, TAU); g.fill(); g.strokeStyle = '#4a3420'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#4a3420'; for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.fillRect(64 + Math.cos(a) * 48 - 3, 64 + Math.sin(a) * 48 - 3, 6, 6); } g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 28); g.moveTo(64, 64); g.lineTo(88, 72); g.stroke(); });
    K.plane('signCut', w / 2 - 0.7, 4.9, 0.25, 0.8, 0.8, 0xffffff, { uvr: cUV }); K.cyl('vc', w / 2 - 0.7, 4.9, 0.2, 0.44, 0.08, 0x2b5d7a, { rx: Math.PI / 2, seg: 24 });
  } else if (disp === 'photo') {
    const fUV = allocSign(160, 120, (g, W, H) => { g.fillStyle = '#e9e1d3'; g.fillRect(0, 0, W, H); for (let i = 0; i < 4; i++) { const x = 10 + (i % 2) * 75, y = 10 + Math.floor(i / 2) * 55; g.fillStyle = '#fff'; g.fillRect(x, y, 65, 48); const gr = g.createLinearGradient(0, y, 0, y + 40); gr.addColorStop(0, ['#9fd2ee', '#f4b8c8', '#c9e2b0', '#f7d9a8'][i]); gr.addColorStop(1, '#ffffff'); g.fillStyle = gr; g.fillRect(x + 4, y + 4, 57, 36); } });
    K.plane('sign', -w / 2 + 1.4, 1.3, -0.2, 1.4, 1.05, 0xffffff, { uvr: fUV }); K.box('vc', -w / 2 + 1.4, 1.3, -0.25, 1.5, 1.15, 0.06, 0x1f1f24);
  }
}
function F0Of() { return 3.5; }
function RD_IN() { return 2.6; }
function potPlant(K, x, z) { K.cyl('vc', x, 0.22, z, 0.22, 0.44, 0xb0704a, { rt: 1.2, seg: 10 }); K.sph('vc', x, 0.7, z, 0.32, 0.38, 0.32, 0x5e9a4e, { lo: true }); }
function lanternRed(K, x, y, z) {
  K.sph('glow', x, y, z, 0.24, 0.34, 0.24, 0xe8483b); K.box('vc', x, y + 0.36, z, 0.2, 0.06, 0.2, 0x222222); K.box('vc', x, y - 0.36, z, 0.2, 0.06, 0.2, 0x222222);
  const p = K.w(x, y, z); addHalo(p[0], p[1], p[2], 1.8, 0xff7a50);
}
function vendingMachine(K, x, z, ry, col, label) {
  K.box('paint', x, 0.92, z, 1.0, 1.84, 0.75, col, { ry, solid: true });
  K.plane('glow', x, 1.25, z + 0.38, 0.86, 0.8, 0xf2f6ff, { ry });
  for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) K.cyl('vcNoShadow', x - 0.35 + i * 0.14, 0.98 + r * 0.26, z + 0.4, 0.04, 0.16, pick([0xd9483b, 0x2c7bd8, 0xf6d04d, 0x7ab648, 0x8a5a3a, 0xffffff]), { seg: 8, ry });
  K.box('vc', x, 0.45, z + 0.38, 0.86, 0.3, 0.02, 0x222222, { ry });
  const p = K.w(x, 1.25, z + 0.5); addHalo(p[0], p[1], p[2], 1.6, 0xdde8ff);
}
function bicycleStatic(K, x, z, ry, col) {
  const k = new Kit(...K.w(x, 0, z), K.ry + ry);
  for (const s of [-0.5, 0.5]) { k.geo('vc', new THREE.TorusGeometry(0.33, 0.025, 6, 20), s, 0.35, 0, 0x222222); }
  k.rod('vc', [-0.5, 0.35, 0], [0, 0.4, 0], 0.025, col); k.rod('vc', [0, 0.4, 0], [0.45, 0.85, 0], 0.025, col); k.rod('vc', [-0.15, 0.85, 0], [0.45, 0.85, 0], 0.025, col);
  k.rod('vc', [-0.5, 0.35, 0], [-0.15, 0.85, 0], 0.025, col); k.rod('vc', [0.5, 0.35, 0], [0.45, 1.0, 0], 0.025, 0x888888);
  k.box('vc', 0.45, 1.0, 0, 0.04, 0.04, 0.55, 0x333333); k.box('vc', -0.15, 0.9, 0, 0.25, 0.06, 0.12, 0x222222);
  k.box('vc', 0.62, 0.85, 0, 0.3, 0.2, 0.36, 0x8a8f94);
}

/* ---------------- 街道 ---------------- */
function buildStreets() {
  const road = (x0, x1, z0, z1, y = TOWN_Y) => WK.box('asphalt', (x0 + x1) / 2, y + 0.02, (z0 + z1) / 2, x1 - x0, 0.04, z1 - z0, 0xffffff, { wuv: 0.25, nochunk: false });
  const walk = (x0, x1, z0, z1, mat = 'paving', col = 0xffffff, h = 0.15) => { WK.box(mat, (x0 + x1) / 2, TOWN_Y + h / 2, (z0 + z1) / 2, x1 - x0, h, z1 - z0, col, { wuv: 0.5, solid: { walk: true } }); };
  // 主街
  road(-3.5, 3.5, -84, 44);
  walk(3.5, 7, -48, 36); walk(-7, -3.5, -48, 36);
  walk(7, 22, -23, -17, 'paving', 0xf2ebe2); walk(-62, -7, -23, -17, 'paving', 0xf2ebe2);
  // 路缘石
  for (const s of [-1, 1]) {
    WK.box('concrete', s * 3.58, TOWN_Y + 0.08, -6, 0.16, 0.17, 84, 0xe6e4df, { wuv: 1 });
    WK.box('tactile', s * 5.2, SW_Y + 0.006, -6, 0.3, 0.012, 84, 0xffffff, { wuv: 1 });
    for (let z = -46; z < 36; z += 6) if (z < -24 || z > -16) WK.box('vc', s * 3.75, TOWN_Y + 0.155, z, 0.28, 0.02, 0.9, 0x55575c);
  }
  // 白色边线
  for (const s of [-1, 1]) WK.box('vcNoShadow', s * 3.2, TOWN_Y + 0.045, -20, 0.12, 0.01, 128, new THREE.Color().setHSL(0.12, 0.02, R(0.76, 0.88)));
  // 北路、港口路、南路
  road(-46, 104, -84, -76); road(96, 104, -76, 44); road(-62, 104, 36, 44);
  walk(104, 108, -76, 46); walk(-62, 104, 44, 47);
  walk(7, 96, 34, 36); walk(-62, -7, 34, 36);
  // 后巷
  road(22, 26, -50, 36); road(-26, -22, -17, 36);
  // 斑马线（磨损做旧：每条明暗/暖度不同）
  const wornW = () => new THREE.Color().setHSL(0.12, R(0.0, 0.05), R(0.7, 0.9));
  const zebra = (cx, cz, w, len, alongX) => { for (let i = 0; i < Math.floor(w / 0.9); i++) { const o = -w / 2 + 0.45 + i * 0.9; WK.box('vcNoShadow', alongX ? cx + o : cx, TOWN_Y + 0.045, alongX ? cz : cz + o, alongX ? 0.45 : len, 0.01, alongX ? len : 0.45, wornW()); } };
  zebra(0, 31, 7, 3, true); zebra(0, -20, 7, 4, true); zebra(100, 48, 8, 3, true);
  // 停止线与「止まれ」
  WK.box('vcNoShadow', -1.6, TOWN_Y + 0.045, -73.5, 3.2, 0.01, 0.4, wornW());
  WK.box('vcNoShadow', -1.6, TOWN_Y + 0.045, -47.2, 3.2, 0.01, 0.4, wornW());
  const tUV = allocSignAlpha(256, 128, (g, w, h) => { g.fillStyle = '#ffffff'; g.font = `900 92px ${FONT.sans}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('止まれ', w / 2, h / 2 + 4); });
  WK.plane('paint2d', -1.6, TOWN_Y + 0.05, -42.5, 2.6, 3.6, 0xffffff, { rx: -Math.PI / 2, rz: 0, ry: 0, uvr: tUV });
  stopSign(-4.2, -46, 0);
  stopSign(24.5, 33, Math.PI);
  // 路灯（装饰）、横幅、灯笼串
  const lampZ = [-44, -30, -12, 2, 16, 30];
  for (const z of lampZ) for (const s of [-1, 1]) streetLamp(s * 3.95, z, s);
  for (let i = 0; i < lampZ.length; i++) lanternString([-3.95, 5.3, lampZ[i]], [3.95, 5.3, lampZ[i]], 1.0);
  for (let i = 0; i < lampZ.length - 1; i++) if (i % 2 === 0) { lanternString([-3.95, 5.3, lampZ[i]], [3.95, 5.3, lampZ[i + 1]], 1.3); }
  // 电线杆与电线
  const poleZ = [-47, -36, -24, -6, 10, 24, 37];
  const tops = { E: [], W: [] };
  for (const z of poleZ) for (const s of [-1, 1]) { const top = utilityPole(s * 4.15, z, s, z === -6); tops[s > 0 ? 'E' : 'W'].push(top); }
  for (const k of ['E', 'W']) for (let i = 0; i < tops[k].length - 1; i++) { const a = tops[k][i], b = tops[k][i + 1]; for (const p of a.wires) { const q = b.wires[a.wires.indexOf(p)]; addWire(p, q, 0.45 + R(0, 0.2)); } }
  for (let i = 0; i < poleZ.length; i += 2) addWire(tops.E[i].wires[3], tops.W[i].wires[3], 0.8);
  // 引入线到楼
  for (let i = 0; i < poleZ.length; i++) for (const k of ['E', 'W']) { const p = tops[k][i].wires[0]; const s = k === 'E' ? 1 : -1; addWire(p, [s * 7.2, 7.4, p[2] + R(-2, 2)], 0.3, 6); }
  // 电线杆广告
  // 巴士站
  busStop(12, 45.8);
}
function stopSign(x, z, ry) {
  const k = new Kit(x, SW_Y, z, ry);
  k.cyl('vc', 0, 1.3, 0, 0.04, 2.6, 0x9aa0a6, { seg: 8 });
  const uv = allocSignAlpha(140, 124, (g, w, h) => { g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(2, 2); g.lineTo(w - 2, 2); g.lineTo(w / 2, h - 2); g.closePath(); g.fill(); g.fillStyle = '#d32f2f'; g.beginPath(); g.moveTo(12, 8); g.lineTo(w - 12, 8); g.lineTo(w / 2, h - 14); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.font = `900 28px ${FONT.sans}`; g.textAlign = 'center'; g.fillText('止まれ', w / 2, 46); });
  k.plane('signCut', 0, 2.4, 0.06, 0.8, 0.7, 0xffffff, { uvr: uv }); k.plane('signCut', 0, 2.4, 0.04, 0.8, 0.7, 0xbbbbbb, { uvr: uv, ry: Math.PI });
}
function streetLamp(x, z, side) {
  const k = new Kit(x, SW_Y, z, side > 0 ? 0 : Math.PI);
  k.cyl('paint', 0, 2.8, 0, 0.07, 5.6, 0x3b4a4a, { rt: 0.7, seg: 10 });
  k.cyl('paint', 0, 0.25, 0, 0.13, 0.5, 0x3b4a4a, { seg: 10 });
  k.rod('paint', [0, 5.2, 0], [-0.7, 5.55, 0], 0.035, 0x3b4a4a);
  k.cyl('paint', -0.75, 5.62, 0, 0.26, 0.12, 0x3b4a4a, { rt: 0.4, seg: 12 });
  k.cyl('glow', -0.75, 5.35, 0, 0.18, 0.42, 0xfff1d0, { rt: 1.2, seg: 12 });
  const p = k.w(-0.75, 5.3, 0); addHalo(p[0], p[1], p[2], 4, 0xffe2b0); addLightPool(p[0], SW_Y, p[2], 4.2, 0xffd8a8);
  // 横幅
  const txt = pick([['樱丘商店街', '海风通'], ['春之樱花祭', '4/1-4/14'], ['欢迎来到星见岛', 'WELCOME']]);
  const uv = allocSign(64, 200, (g, w, h) => { g.fillStyle = '#f7e1e8'; g.fillRect(0, 0, w, h); g.fillStyle = '#d24d73'; g.fillRect(0, 0, w, 14); g.fillRect(0, h - 14, w, 14); for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(232,140,170,0.5)'; g.beginPath(); g.arc(R(0, w), R(20, h - 20), R(4, 8), 0, TAU); g.fill(); } g.fillStyle = '#7a2f45'; g.font = `900 30px ${FONT.wei}`; g.textAlign = 'center'; [...txt[0]].forEach((c, i) => g.fillText(c, w / 2, 48 + i * 30)); g.font = `700 10px ${FONT.sans}`; g.fillText(txt[1], w / 2, h - 20); });
  k.box('paint', 0.35, 4.35, 0, 0.7, 0.03, 0.03, 0x3b4a4a); k.box('paint', 0.35, 2.75, 0, 0.7, 0.03, 0.03, 0x3b4a4a);
  for (const s of [-1, 1]) k.plane('sign', 0.38, 3.55, s * 0.005, 0.56, 1.58, 0xffffff, { uvr: uv, ry: s > 0 ? Math.PI / 2 : -Math.PI / 2 });
  addCollider(...k.w(0, 0, 0).filter((_, i) => i !== 1), 0.12, 0.12, 0, SW_Y, SW_Y + 5, 'wall');
}
function lanternString(a, b, sag) {
  a = [a[0], a[1] + SW_Y, a[2]]; b = [b[0], b[1] + SW_Y, b[2]];
  addWire(a, b, sag, 12);
  const n = Math.floor(Math.hypot(b[0] - a[0], b[2] - a[2]) / 0.85);
  for (let i = 1; i < n; i++) {
    const t = i / n; const x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t) - Math.sin(t * Math.PI) * sag - 0.25, z = lerp(a[2], b[2], t);
    const c = i % 2 ? 0xf05a6a : 0xfff4ea;
    WK.sph('glow', x, y, z, 0.13, 0.19, 0.13, c, { lo: true }); WK.box('vcNoShadow', x, y + 0.2, z, 0.1, 0.04, 0.1, 0x333333);
    if (i % 3 === 0) addHalo(x, y, z, 1.3, i % 2 ? 0xff8a90 : 0xfff0d8);
  }
}
function utilityPole(x, z, side, transformer) {
  const k = new Kit(x, SW_Y, z, side > 0 ? 0 : Math.PI);
  k.cyl('concrete', 0, 5, 0, 0.17, 10, 0xc9c9c4, { rt: 0.7, seg: 10 });
  k.box('vc', 0, 8.95, 0, 1.6, 0.12, 0.12, 0x707478); k.box('vc', 0, 9.55, 0, 1.0, 0.1, 0.1, 0x707478);
  for (const xx of [-0.7, -0.25, 0.25, 0.7]) k.cyl('vc', xx, 9.07, 0, 0.05, 0.16, 0xffffff, { seg: 8 });
  for (let i = 0; i < 8; i++) k.box('vc', (i % 2 ? 0.14 : -0.14), 2.2 + i * 0.5, 0, 0.18, 0.03, 0.03, 0x666666, { ry: i % 2 ? Math.PI / 2 : 0 });
  if (transformer) { k.cyl('vc', -0.45, 7.6, 0, 0.3, 1.0, 0x9aa1a8, { seg: 12 }); k.box('vc', -0.2, 7.6, 0, 0.3, 0.06, 0.06, 0x666666); }
  // 电线杆广告
  if (chance(0.6)) {
    const ad = pick([['拾页书店', '→ 50m', '#26375e'], ['小满面包房', '刚出炉', '#9a5a2b'], ['星见岛邮局', '寄一封信吧', '#c8352e'], ['风车单车行', '修车 · 租车', '#2f7d5b'], ['樱丘诊所', '内科 · 儿科', '#127a6a']]);
    const uv = allocSign(60, 220, (g, w, h) => { g.fillStyle = ad[2]; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = `900 26px ${FONT.sans}`; g.textAlign = 'center'; [...ad[0]].forEach((c, i) => g.fillText(c, w / 2, 34 + i * 28)); g.font = `700 11px ${FONT.sans}`; g.fillText(ad[1], w / 2, h - 12); });
    k.plane('sign', 0, 3.2, 0.18, 0.32, 1.15, 0xffffff, { uvr: uv, ry: Math.PI / 2 * (side > 0 ? -1 : -1) });
  }
  addCollider(x, z, 0.2, 0.2, 0, SW_Y, SW_Y + 10, 'wall');
  return { wires: [k.w(-0.7, 9.13, 0), k.w(-0.25, 9.13, 0), k.w(0.25, 9.13, 0), k.w(0.7, 9.13, 0), k.w(0, 9.65, 0)] };
}
function busStop(x, z) {
  const k = new Kit(x, SW_Y, z, Math.PI);
  k.cyl('vc', 0, 1.3, 0, 0.04, 2.6, 0x9aa0a6, { seg: 8 });
  const uv = allocSign(150, 150, (g, w, h) => { g.fillStyle = '#f6d04d'; g.beginPath(); g.arc(75, 75, 72, 0, TAU); g.fill(); g.strokeStyle = '#2c5aa0'; g.lineWidth = 8; g.stroke(); g.fillStyle = '#2c5aa0'; g.font = `900 30px ${FONT.sans}`; g.textAlign = 'center'; g.fillText('樱丘站前', 75, 70); g.font = `700 14px ${FONT.sans}`; g.fillText('岛内循环巴士', 75, 98); });
  for (const s of [0, Math.PI]) k.plane('signCut', 0, 2.5, s ? -0.01 : 0.01, 0.6, 0.6, 0xffffff, { uvr: uv, ry: s });
  const tt = allocSign(100, 140, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#2c5aa0'; g.fillRect(0, 0, w, 22); g.fillStyle = '#fff'; g.font = `700 12px ${FONT.sans}`; g.fillText('时刻表', 8, 16); g.fillStyle = '#333'; g.font = `500 11px ${FONT.sans}`; ['7  15 45', '8  10 40', '9  20', '10 20', '11 20', '12 20'].forEach((t, i) => g.fillText(t, 8, 40 + i * 16)); });
  k.plane('sign', 0, 1.5, 0.05, 0.35, 0.5, 0xffffff, { uvr: tt });
  k.box('wood', 1.8, 0.42, 0.3, 1.8, 0.06, 0.45, 0x9a7a58); for (const s of [-1, 1]) k.box('vc', 1.8 + s * 0.8, 0.2, 0.3, 0.06, 0.4, 0.4, 0x666666);
  k.box('vc', 1.8, 2.5, 0.1, 2.6, 0.08, 1.4, 0xdfe6ea); for (const s of [-1, 1]) k.box('vc', 1.8 + s * 1.2, 1.25, -0.4, 0.07, 2.5, 0.07, 0x9aa0a6);
  k.plane('glass', 1.8, 1.4, -0.42, 2.4, 1.8, 0xffffff);
  addInteract({ x: x - 1.8, z: z - 0.3, r: 1.6, label: () => '坐在巴士站长椅上', act: () => GAME.sit(x - 1.8, SW_Y + 0.45, z - 0.3, Math.PI) });
}
