'use strict';
/* ==========================================================================
   星见岛 · 小信使的春天 —— 核心工具：数学、随机、噪声、画质、几何合并、碰撞
   ========================================================================== */
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let rng = mulberry32(20260403);
const R = (a = 0, b = 1) => a + (b - a) * rng();
const RI = (a, b) => Math.floor(R(a, b + 1));
const pick = (arr) => arr[Math.floor(rng() * arr.length) % arr.length];
const chance = (p) => rng() < p;
function seed(s) { rng = mulberry32(s); }

function hash2(x, y) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return lerp(lerp(hash2(xi, yi), hash2(xi + 1, yi), u), lerp(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), u), v);
}
function fbm(x, y, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f + i * 17.3, y * f - i * 9.1); f *= 2.03; a *= 0.5; } return s / (1 - Math.pow(0.5, o)); }

/* ---------- 偏好存储（失败时静默） ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('hoshimi.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('hoshimi.' + k, JSON.stringify(v)); } catch (e) { } }
};

/* ---------- 画质 ---------- */
const IS_TOUCH = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
const QUALITY = {
  high: { label: '高', pr: 1.75, shadow: 4096, sakura: 1.0, petals: 1800, far: 1600, npc: 160, waves: 1, grass: 1, forest: 1, bloom: true, msaa: 4 },
  mid: { label: '中', pr: 1.35, shadow: 2048, sakura: 0.65, petals: 900, far: 1100, npc: 110, waves: 1, grass: 0.55, forest: 0.6, bloom: true, msaa: 0 },
  low: { label: '低', pr: 1.0, shadow: 0, sakura: 0.4, petals: 350, far: 700, npc: 70, waves: 0, grass: 0.2, forest: 0.35, bloom: false, msaa: 0 }
};
let qName = store.get('quality', IS_TOUCH ? 'low' : 'high');
if (!QUALITY[qName]) qName = 'mid';
let Q = QUALITY[qName];

/* ---------- 渲染器 ---------- */
const canvasEl = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.pr));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.shadowMap.autoUpdate = true;
const MAX_ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 4000);
/* sRGB 十六进制颜色 → 线性颜色（r128 不会自动转换） */
const lin = (c) => new THREE.Color(c).convertSRGBToLinear();
const ASSET_BASE = (window.HOSHIMI_ASSETS || 'assets/');
const MODEL_EXT = window.HOSHIMI_MODEL_EXT || '.glb'; // Artifact 版本用内嵌 glTF（.gltf.json）

/* ---------- Canvas 纹理 ---------- */
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function canvasTex(w, h, fn, o = {}) {
  const c = makeCanvas(w, h); const g = c.getContext('2d'); fn(g, w, h, c);
  const t = new THREE.CanvasTexture(c); t.anisotropy = MAX_ANISO; if (!o.data) t.encoding = THREE.sRGBEncoding;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  if (o.nearest) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; }
  t.needsUpdate = true; return t;
}
function noiseFill(g, w, h, base, amp, scale = 1, seedOff = 0) {
  const img = g.createImageData(w, h); const d = img.data; const c = new THREE.Color(base);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const n = (fbm((x + seedOff) * 0.06 * scale, y * 0.06 * scale, 3) - 0.5) * amp + (hash2(x + seedOff, y) - 0.5) * amp * 0.5;
    const i = (y * w + x) * 4; d[i] = clamp((c.r + n) * 255, 0, 255); d[i + 1] = clamp((c.g + n) * 255, 0, 255); d[i + 2] = clamp((c.b + n) * 255, 0, 255); d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
}
function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const FONT = {
  sans: '"Noto Sans SC","PingFang SC","Microsoft YaHei","WenQuanYi Zen Hei",sans-serif',
  serif: '"Noto Serif SC","Songti SC","SimSun","WenQuanYi Zen Hei",serif',
  brush: '"Ma Shan Zheng","Noto Serif SC","KaiTi","STKaiti",serif',
  round: '"ZCOOL KuaiLe","Noto Sans SC","WenQuanYi Zen Hei",sans-serif',
  wei: '"ZCOOL XiaoWei","Noto Serif SC","Songti SC",serif'
};
function fitText(g, text, maxW, size, font, weight = '700') {
  let s = size; do { g.font = `${weight} ${s}px ${font}`; if (g.measureText(text).width <= maxW) break; s -= 2; } while (s > 8); return s;
}

/* ---------- 几何合并（按材质 × 区块） ---------- */
const _m4 = new THREE.Matrix4(), _n3 = new THREE.Matrix3(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _c = new THREE.Color();
const MATS = {}; const _white = new THREE.Color(1, 1, 1);
const BATCH = new Map(); const CHUNK = 64; let BATCH_NOCHUNK = false;
function bucketFor(mk, x, z, nochunk) {
  const key = (nochunk || BATCH_NOCHUNK) ? mk + '|g' : mk + '|' + Math.floor(x / CHUNK) + ',' + Math.floor(z / CHUNK);
  let b = BATCH.get(key);
  if (!b) { b = { mk, pos: [], nor: [], uv: [], col: [], idx: [], n: 0 }; BATCH.set(key, b); }
  return b;
}
function addGeo(geo, mk, matrix, color, o = {}) {
  const p = geo.attributes.position, nrm = geo.attributes.normal, uv = geo.attributes.uv;
  const ca = o.vcol ? geo.attributes.color : null;
  _n3.getNormalMatrix(matrix);
  _v.set(0, 0, 0).applyMatrix4(matrix);
  const b = bucketFor(mk, _v.x, _v.z, o.nochunk);
  const base = b.n;
  const col = (color && color.isColor ? _c.copy(color) : _c.set(color == null ? 0xffffff : color)).convertSRGBToLinear();
  const tint = MATS[mk] ? MATS[mk].tint : 1; if (tint < 1) col.lerp(_white, 1 - tint);
  const cr = col.r, cg = col.g, cb = col.b;
  const wuv = o.wuv, uvr = o.uvr, grad = o.grad;
  let ymin = 0, ymax = 1;
  if (grad) { geo.computeBoundingBox(); ymin = geo.boundingBox.min.y; ymax = geo.boundingBox.max.y; }
  for (let i = 0; i < p.count; i++) {
    _v.fromBufferAttribute(p, i);
    const ly = _v.y;
    _v.applyMatrix4(matrix);
    b.pos.push(_v.x, _v.y, _v.z);
    const wx = _v.x, wy = _v.y, wz = _v.z;
    _v2.fromBufferAttribute(nrm, i).applyMatrix3(_n3).normalize();
    b.nor.push(_v2.x, _v2.y, _v2.z);
    if (wuv) {
      const ax = Math.abs(_v2.x), ay = Math.abs(_v2.y), az = Math.abs(_v2.z); let u, v;
      if (ay >= ax && ay >= az) { u = wx; v = wz; } else if (ax >= az) { u = wz; v = wy; } else { u = wx; v = wy; }
      b.uv.push(u * wuv, v * wuv);
    } else if (uv) {
      let u = uv.getX(i), v = uv.getY(i);
      if (uvr) { u = uvr[0] + (uvr[2] - uvr[0]) * u; v = uvr[1] + (uvr[3] - uvr[1]) * v; }
      b.uv.push(u, v);
    } else b.uv.push(0, 0);
    let k = 1;
    if (grad) k = lerp(grad, 1, clamp((ly - ymin) / (ymax - ymin + 1e-6), 0, 1));
    if (ca) b.col.push(ca.getX(i) * cr * k, ca.getY(i) * cg * k, ca.getZ(i) * cb * k);
    else b.col.push(cr * k, cg * k, cb * k);
  }
  if (geo.index) { const ix = geo.index.array; for (let i = 0; i < ix.length; i++) b.idx.push(base + ix[i]); }
  else for (let i = 0; i < p.count; i++) b.idx.push(base + i);
  b.n += p.count;
}
function flushBatches(parent) {
  const out = [];
  for (const [key, b] of BATCH) {
    if (!b.n) continue;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3));
    g.setIndex(b.n > 65535 ? new THREE.Uint32BufferAttribute(b.idx, 1) : new THREE.Uint16BufferAttribute(b.idx, 1));
    g.computeBoundingSphere();
    const m = MATS[b.mk];
    const mesh = new THREE.Mesh(g, m.material);
    mesh.castShadow = m.cast !== false; mesh.receiveShadow = m.receive !== false;
    if (m.depth) mesh.customDepthMaterial = m.depth;
    mesh.matrixAutoUpdate = false; mesh.updateMatrix();
    mesh.name = key;
    parent.add(mesh); out.push(mesh);
  }
  BATCH.clear();
  return out;
}

/* 局部合并：把 fn 中加入的几何合并成一个 Group（用于可移动物体） */
function buildLocal(fn) {
  const saved = new Map(BATCH); BATCH.clear(); const savedNC = BATCH_NOCHUNK; BATCH_NOCHUNK = true;
  fn(); const g = new THREE.Group(); flushBatches(g);
  BATCH_NOCHUNK = savedNC; for (const [k, v] of saved) BATCH.set(k, v);
  return g;
}
/* 共享单位几何 */
const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  plane: new THREE.PlaneGeometry(1, 1),
  cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
  cyl12: new THREE.CylinderGeometry(1, 1, 1, 12),
  cyl16: new THREE.CylinderGeometry(1, 1, 1, 16),
  cyl24: new THREE.CylinderGeometry(1, 1, 1, 24),
  sph: new THREE.SphereGeometry(1, 12, 8),
  sph16: new THREE.SphereGeometry(1, 16, 12),
  ico: new THREE.IcosahedronGeometry(1, 1),
  cone8: new THREE.ConeGeometry(1, 1, 8),
  cone4: new THREE.ConeGeometry(1, 1, 4),
};
const _geoCache = new Map();
function taper(rt, rb, seg = 8) {
  const k = rt.toFixed(3) + '/' + rb.toFixed(3) + '/' + seg;
  let g = _geoCache.get(k); if (!g) { g = new THREE.CylinderGeometry(rt, rb, 1, seg); _geoCache.set(k, g); } return g;
}
function MX(x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) {
  _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e);
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.clone(), new THREE.Vector3(sx, sy, sz));
}
/* 局部坐标系建造器 —— F 只含平移与绕 Y 旋转 */
class Kit {
  constructor(x = 0, y = 0, z = 0, ry = 0) { this.set(x, y, z, ry); }
  set(x, y, z, ry) { this.x = x; this.y = y; this.z = z; this.ry = ry; this.F = MX(x, y, z, ry); this.c = Math.cos(ry); this.s = Math.sin(ry); return this; }
  w(lx, ly, lz) { return [this.x + lx * this.c + lz * this.s, this.y + ly, this.z - lx * this.s + lz * this.c]; }
  _m(x, y, z, o, sx, sy, sz) { return this.F.clone().multiply(MX(x, y, z, o.ry || 0, sx, sy, sz, o.rx || 0, o.rz || 0)); }
  box(mk, x, y, z, w, h, d, col, o = {}) {
    addGeo(G.box, mk, this._m(x, y, z, o, w, h, d), col, o);
    if (o.solid) { const p = this.w(x, y, z); addCollider(p[0], p[2], w / 2, d / 2, this.ry + (o.ry || 0), p[1] - h / 2, p[1] + h / 2, o.solid); }
  }
  boxB(mk, x, y, z, w, h, d, col, o = {}) { this.box(mk, x, y + h / 2, z, w, h, d, col, o); }
  cyl(mk, x, y, z, r, h, col, o = {}) {
    const geo = o.rt != null ? taper(o.rt * r, r, o.seg || 12) : (o.seg === 6 ? taper(1, 1, 6) : o.seg === 8 ? G.cyl8 : o.seg === 16 ? G.cyl16 : o.seg === 24 ? G.cyl24 : G.cyl12);
    const sc = o.rt != null ? 1 : r;
    addGeo(geo, mk, this._m(x, y, z, o, sc * (o.sx || 1), h, sc * (o.sz || 1)), col, o);
    if (o.solid) { const p = this.w(x, y, z); addCollider(p[0], p[2], r, r, 0, p[1] - h / 2, p[1] + h / 2, o.solid); }
  }
  sph(mk, x, y, z, rx, ry, rz, col, o = {}) { addGeo(o.lo ? G.sph : G.sph16, mk, this._m(x, y, z, o, rx, ry, rz), col, o); }
  plane(mk, x, y, z, w, h, col, o = {}) { addGeo(G.plane, mk, this._m(x, y, z, o, w, h, 1), col, o); }
  geo(mk, geo, x, y, z, col, o = {}) { addGeo(geo, mk, this._m(x, y, z, o, o.sx || 1, o.sy || 1, o.sz || 1), col, o); }
  /* 两点之间的圆柱（局部坐标） */
  rod(mk, a, b, r, col, o = {}) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]; const L = Math.hypot(dx, dy, dz);
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    _v.set(dx, dy, dz).normalize(); _q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _v);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(...mid), _q.clone(), new THREE.Vector3(r, L, r));
    const geo = o.rt != null ? taper(o.rt, 1, o.seg || 6) : (o.seg === 8 ? G.cyl8 : taper(1, 1, o.seg || 6));
    addGeo(geo, mk, this.F.clone().multiply(m), col, o);
  }
}
const WK = new Kit(); // 世界坐标建造器

/* ---------- 碰撞（OBB + 坡道）与空间哈希 ---------- */
const COLS = []; const CELL = 8; const GRID = new Map();
function addCollider(x, z, hw, hd, rot, y0, y1, kind = true) {
  const c = { x, z, hw, hd, c: Math.cos(rot), s: Math.sin(rot), y0, y1, ramp: null, noFloor: kind === 'wall' };
  if (typeof kind === 'object') Object.assign(c, kind);
  COLS.push(c);
  const r = Math.hypot(hw, hd);
  for (let gx = Math.floor((x - r) / CELL); gx <= Math.floor((x + r) / CELL); gx++)
    for (let gz = Math.floor((z - r) / CELL); gz <= Math.floor((z + r) / CELL); gz++) {
      const k = gx * 10007 + gz; let a = GRID.get(k); if (!a) GRID.set(k, a = []); a.push(c);
    }
  return c;
}
/* 坡道：局部 z 从 -hd 到 +hd，高度从 ya 到 yb */
function addRamp(x, z, hw, hd, rot, ya, yb) { return addCollider(x, z, hw, hd, rot, Math.min(ya, yb) - 0.5, Math.max(ya, yb), { ramp: [ya, yb], walk: true }); }
function nearCols(x, z) { return GRID.get(Math.floor(x / CELL) * 10007 + Math.floor(z / CELL)) || []; }
function localOf(c, x, z) { const dx = x - c.x, dz = z - c.z; return [dx * c.c - dz * c.s, dx * c.s + dz * c.c]; }
function colTop(c, lz) { return c.ramp ? lerp(c.ramp[0], c.ramp[1], clamp((lz + c.hd) / (2 * c.hd), 0, 1)) : c.y1; }
const STEP = 0.5;
/* 地面高度：地形与可站立物体中，不高于 feetY+STEP 的最高者 */
function groundAt(x, z, feetY = 1e9) {
  let h = terrainH(x, z), floor = false;
  const list = nearCols(x, z);
  for (let i = 0; i < list.length; i++) {
    const c = list[i]; if (c.noFloor) continue;
    const l = localOf(c, x, z);
    if (c.round ? (l[0] * l[0] + l[1] * l[1] <= c.hw * c.hw) : (Math.abs(l[0]) <= c.hw && Math.abs(l[1]) <= c.hd)) {
      const t = colTop(c, l[1]);
      if (t <= feetY + STEP && t > h - 0.01) { h = t; floor = true; }
    }
  }
  groundAt.floor = floor;
  return h;
}
/* 圆形角色与障碍物的推出 */
function pushOut(p, r, feetY, height = 1.5) {
  const list = nearCols(p.x, p.z);
  let hit = false;
  for (let i = 0; i < list.length; i++) {
    const c = list[i]; if (c.ramp) continue;
    if (c.y1 <= feetY + STEP && !c.noFloor) continue;
    if (c.y1 <= feetY + 0.05) continue;
    if (c.y0 >= feetY + height) continue;
    const l = localOf(c, p.x, p.z);
    if (c.round) {
      const d = Math.hypot(l[0], l[1]); if (d >= c.hw + r) continue;
      const k = (c.hw + r - d) / (d || 1); p.x += (p.x - c.x) * k; p.z += (p.z - c.z) * k; hit = true; continue;
    }
    const qx = clamp(l[0], -c.hw, c.hw), qz = clamp(l[1], -c.hd, c.hd);
    let dx = l[0] - qx, dz = l[1] - qz; let d2 = dx * dx + dz * dz;
    if (d2 > r * r) continue;
    let nx, nz, push;
    if (d2 < 1e-8) {
      const px = c.hw - Math.abs(l[0]), pz = c.hd - Math.abs(l[1]);
      if (px < pz) { nx = Math.sign(l[0]) || 1; nz = 0; push = px + r; } else { nx = 0; nz = Math.sign(l[1]) || 1; push = pz + r; }
    } else { const d = Math.sqrt(d2); nx = dx / d; nz = dz / d; push = r - d; }
    // 局部 → 世界
    const wx = nx * c.c + nz * c.s, wz = -nx * c.s + nz * c.c;
    p.x += wx * push; p.z += wz * push; hit = true;
  }
  return hit;
}
/* 视线阻挡（相机避让），粗略步进 */
function blockedAt(x, y, z) {
  const list = nearCols(x, z);
  for (let i = 0; i < list.length; i++) {
    const c = list[i]; if (c.ramp || c.thin) continue;
    if (y < c.y0 || y > c.y1) continue;
    const l = localOf(c, x, z);
    if (c.round ? Math.hypot(l[0], l[1]) <= c.hw + 0.15 : (Math.abs(l[0]) <= c.hw + 0.15 && Math.abs(l[1]) <= c.hd + 0.15)) return true;
  }
  return y < terrainH(x, z) + 0.2;
}

/* ---------- 动态更新 & 交互注册 ---------- */
const UPDATERS = [];
function onUpdate(fn) { UPDATERS.push(fn); }
const INTERACT = [];
function addInteract(o) { INTERACT.push(o); return o; }
const PLACES = []; // 传送点与地图标注
function addPlace(name, x, z, ry, key) { PLACES.push({ name, x, z, ry, key }); }
const NIGHT = { v: 0 }; // 0 白天 → 1 深夜（灯光）
