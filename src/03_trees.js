/* ==========================================================================
   樱花树（染井吉野）· 绿树 · 松 · 灌木 · 草 · 落花
   ========================================================================== */
const WIND = { uTime: { value: 0 }, uWind: { value: 1 } };
const TREES = []; // {x,z,r,kind}

/* --- 花簇卡片图集 2×2 --- */
function drawBlossom(g, x, y, r, rot, open = 1) {
  g.save(); g.translate(x, y); g.rotate(rot);
  for (let i = 0; i < 5; i++) {
    g.save(); g.rotate(i * TAU / 5 + R(-0.08, 0.08));
    const L = r * R(0.92, 1.05), W = r * 0.58;
    const gr = g.createLinearGradient(0, 0, 0, -L); gr.addColorStop(0, '#f2a9bd'); gr.addColorStop(0.35, '#fbd9e2'); gr.addColorStop(1, '#fff6f8');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0);
    g.bezierCurveTo(W * 0.9, -L * 0.25, W * 0.85, -L * 0.95, W * 0.22, -L);
    g.lineTo(0, -L * 0.86); g.lineTo(-W * 0.22, -L);
    g.bezierCurveTo(-W * 0.85, -L * 0.95, -W * 0.9, -L * 0.25, 0, 0); g.fill();
    g.strokeStyle = 'rgba(220,140,165,0.35)'; g.lineWidth = Math.max(1, r * 0.025); g.beginPath(); g.moveTo(0, -L * 0.15); g.lineTo(0, -L * 0.7); g.stroke();
    g.restore();
  }
  const cg = g.createRadialGradient(0, 0, 0, 0, 0, r * 0.38); cg.addColorStop(0, '#c2335a'); cg.addColorStop(1, 'rgba(230,110,140,0)');
  g.fillStyle = cg; g.beginPath(); g.arc(0, 0, r * 0.38, 0, TAU); g.fill();
  g.strokeStyle = '#d96f8a'; g.lineWidth = Math.max(1, r * 0.03);
  for (let i = 0; i < 14; i++) { const a = R(0, TAU), l = r * R(0.22, 0.42); g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * l, Math.sin(a) * l); g.stroke(); g.fillStyle = '#f2d16f'; g.beginPath(); g.arc(Math.cos(a) * l, Math.sin(a) * l, r * 0.04, 0, TAU); g.fill(); }
  g.restore();
}
const TEX_SAKURA = canvasTex(1024, 1024, (g) => {
  g.clearRect(0, 0, 1024, 1024);
  for (let cell = 0; cell < 4; cell++) {
    const ox = (cell % 2) * 512, oy = Math.floor(cell / 2) * 512;
    g.save(); g.translate(ox, oy);
    // 柔和粉色底
    for (let i = 0; i < 26; i++) { const a = R(0, TAU), d = R(0, 150); g.fillStyle = `rgba(${R(238, 248) | 0},${R(196, 214) | 0},${R(208, 222) | 0},1)`; g.beginPath(); g.arc(256 + Math.cos(a) * d, 256 + Math.sin(a) * d, R(45, 90), 0, TAU); g.fill(); }
    // 花朵
    const n = 11 + cell * 2;
    for (let i = 0; i < n; i++) { const a = R(0, TAU), d = R(0, 175); drawBlossom(g, 256 + Math.cos(a) * d, 256 + Math.sin(a) * d, R(42, 68), R(0, TAU)); }
    for (let i = 0; i < 6; i++) { const a = R(0, TAU), d = R(120, 200); g.fillStyle = '#e57f9c'; g.beginPath(); g.ellipse(256 + Math.cos(a) * d, 256 + Math.sin(a) * d, 9, 14, a, 0, TAU); g.fill(); }
    g.restore();
  }
});
const TEX_LEAF = canvasTex(1024, 1024, (g) => {
  g.clearRect(0, 0, 1024, 1024);
  const leaf = (x, y, s, a, c) => { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = c; g.beginPath(); g.moveTo(0, -s); g.quadraticCurveTo(s * 0.55, 0, 0, s); g.quadraticCurveTo(-s * 0.55, 0, 0, -s); g.fill(); g.restore(); };
  for (let cell = 0; cell < 4; cell++) {
    const ox = (cell % 2) * 512, oy = Math.floor(cell / 2) * 512;
    g.save(); g.translate(ox, oy);
    if (cell < 2) {
      for (let i = 0; i < 18; i++) { const a = R(0, TAU), d = R(0, 140); g.fillStyle = cell ? '#cfe3a8' : '#d9e9b2'; g.beginPath(); g.arc(256 + Math.cos(a) * d, 256 + Math.sin(a) * d, R(50, 85), 0, TAU); g.fill(); }
      for (let i = 0; i < 260; i++) { const a = R(0, TAU), d = Math.sqrt(R()) * 210; const k = R(0.8, 1.05); leaf(256 + Math.cos(a) * d, 256 + Math.sin(a) * d, R(18, 32), R(0, TAU), `rgb(${225 * k | 0},${240 * k | 0},${200 * k | 0})`); }
    } else if (cell === 2) { // 松针
      for (let k = 0; k < 9; k++) { const cx = 256 + R(-150, 150), cy = 256 + R(-90, 90); g.strokeStyle = '#e8f0e0'; g.lineWidth = 4; for (let i = 0; i < 60; i++) { const a = R(-Math.PI, 0), l = R(40, 95); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l * 0.6); g.stroke(); } }
    } else { // 杜鹃灌木
      for (let i = 0; i < 300; i++) { const a = R(0, TAU), d = Math.sqrt(R()) * 220; leaf(256 + Math.cos(a) * d, 256 + Math.sin(a) * d, R(14, 24), R(0, TAU), '#dfeccf'); }
      for (let i = 0; i < 40; i++) { const a = R(0, TAU), d = Math.sqrt(R()) * 200; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(256 + Math.cos(a) * d, 256 + Math.sin(a) * d, R(8, 14), 0, TAU); g.fill(); }
    }
    g.restore();
  }
});
const TEX_GRASS = canvasTex(256, 256, (g) => {
  g.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) { const x = R(10, 246), h = R(90, 240), b = R(-40, 40); g.strokeStyle = `rgb(${R(200, 255) | 0},${R(230, 255) | 0},${R(200, 235) | 0})`; g.lineWidth = R(3, 6); g.beginPath(); g.moveTo(x, 256); g.quadraticCurveTo(x + b * 0.3, 256 - h * 0.6, x + b, 256 - h); g.stroke(); }
  for (let i = 0; i < 5; i++) { g.fillStyle = pick(['#fff8a8', '#ffffff', '#f7c6dc']); g.beginPath(); g.arc(R(20, 236), R(30, 120), 7, 0, TAU); g.fill(); }
});
const TEX_PETALS_GROUND = canvasTex(512, 512, (g) => {
  g.clearRect(0, 0, 512, 512);
  for (let i = 0; i < 420; i++) { const x = R(0, 512), y = R(0, 512); g.save(); g.translate(x, y); g.rotate(R(0, TAU)); g.fillStyle = pick(['#fbd3dd', '#f7c0cf', '#fde6ec', '#f3b2c4']); g.beginPath(); g.ellipse(0, 0, R(4, 7), R(2.5, 4), 0, 0, TAU); g.fill(); g.restore(); }
});
TEX_PETALS_GROUND.wrapS = TEX_PETALS_GROUND.wrapT = THREE.RepeatWrapping;
const TEX_BARK = canvasTex(128, 256, (g, w, h) => {
  noiseFill(g, w, h, 0x8a7c7c, 0.18, 2.5, 51);
  for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(230,215,205,0.45)'; g.fillRect(R(0, w), R(0, h), R(8, 22), 2); }
  for (let i = 0; i < 20; i++) { g.fillStyle = 'rgba(40,30,30,0.35)'; g.fillRect(R(0, w), 0, 2, h); }
}, { repeat: true });
regMat('bark', stdMat({ map: TEX_BARK }));

function foliageMat(map, opts = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, map, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1, metalness: 0, emissive: opts.emissive || 0x000000 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = WIND.uTime; sh.uniforms.uWind = WIND.uWind;
    sh.vertexShader = 'attribute float sway;\nuniform float uTime; uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float ph = position.x*0.35 + position.z*0.27;
      float sw = sway*uWind;
      transformed.x += (sin(uTime*1.7+ph)*0.06 + sin(uTime*0.6+ph*0.31)*0.12)*sw;
      transformed.z += (cos(uTime*1.3+ph*1.1)*0.05 + cos(uTime*0.5+ph*0.2)*0.08)*sw;
      transformed.y += sin(uTime*2.3+ph*1.7)*0.025*sw;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', 'float faceDirection = gl_FrontFacing ? 1.0 : -1.0;\nvec3 normal = normalize( vNormal );\nvec3 geometryNormal = normal;');
  };
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.5 });
  return { m, depth };
}
const SAK_M = foliageMat(TEX_SAKURA, { emissive: 0x1c0d10 });
const LEAF_M = foliageMat(TEX_LEAF);
const GRASS_M = foliageMat(TEX_GRASS);
regMat('petalGround', new THREE.MeshStandardMaterial({ map: TEX_PETALS_GROUND, transparent: true, alphaTest: 0.35, depthWrite: false, roughness: 1, metalness: 0, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), { cast: false });

/* --- 卡片累加器（带 sway 属性与乱序索引，便于按画质截断） --- */
const CARD_BUCKETS = new Map();
function cardBucket(kind, x, z) {
  const key = kind + '|' + Math.floor(x / 90) + ',' + Math.floor(z / 90);
  let b = CARD_BUCKETS.get(key); if (!b) { b = { kind, pos: [], nor: [], uv: [], col: [], sway: [], q: 0 }; CARD_BUCKETS.set(key, b); } return b;
}
const _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _nn = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
function addCard(b, cx, cy, cz, nx, ny, nz, size, cell, col, sway, lnx, lny, lnz, aspect = 1, spin = null) {
  _nn.set(nx, ny, nz).normalize();
  _t1.set(R(-1, 1), R(-1, 1), R(-1, 1)).cross(_nn).normalize();
  if (spin != null) { _t1.set(Math.cos(spin), 0, Math.sin(spin)).cross(_nn).normalize(); }
  _t2.copy(_nn).cross(_t1).normalize();
  const hw = size / 2, hh = size * aspect / 2;
  const u0 = (cell % 2) * 0.5, v0 = cell < 2 ? 0.5 : 0; // canvas 顶部 = v 1
  const corners = [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]];
  for (const c of corners) {
    b.pos.push(cx + _t1.x * c[0] * hw + _t2.x * c[1] * hh, cy + _t1.y * c[0] * hw + _t2.y * c[1] * hh, cz + _t1.z * c[0] * hw + _t2.z * c[1] * hh);
    b.nor.push(lnx, lny, lnz); b.uv.push(u0 + c[2] * 0.5, v0 + c[3] * 0.5); b.col.push(col.r, col.g, col.b); b.sway.push(sway);
  }
  b.q++;
}
const CARD_MESHES = [];
function flushCards() {
  for (const [key, b] of CARD_BUCKETS) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3));
    g.setAttribute('sway', new THREE.Float32BufferAttribute(b.sway, 1));
    const order = Array.from({ length: b.q }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = order[i]; order[i] = order[j]; order[j] = t; }
    const idx = new Uint32Array(b.q * 6);
    order.forEach((q, k) => { const o = q * 4; idx.set([o, o + 1, o + 2, o, o + 2, o + 3], k * 6); });
    g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere();
    const M = b.kind === 'sakura' ? SAK_M : b.kind === 'grass' ? GRASS_M : LEAF_M;
    const mesh = new THREE.Mesh(g, M.m); mesh.customDepthMaterial = M.depth;
    mesh.castShadow = b.kind !== 'grass'; mesh.receiveShadow = true; mesh.userData.quads = b.q; mesh.userData.kind = b.kind;
    mesh.matrixAutoUpdate = false; scene.add(mesh); CARD_MESHES.push(mesh);
  }
  CARD_BUCKETS.clear(); applyFoliageQuality();
}
function applyFoliageQuality() {
  for (const m of CARD_MESHES) { const f = m.userData.kind === 'grass' ? Q.grass : (m.userData.kind === 'sakura' ? Q.sakura : Math.max(0.55, Q.sakura)); m.geometry.setDrawRange(0, Math.max(1, Math.floor(m.userData.quads * f)) * 6); }
}

/* --- 枝条生长 --- */
function growBranches(kit, p, az, el, len, r, depth, P, tips) {
  const dir = (a, e) => [Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)];
  const d0 = dir(az, el);
  const elMid = el - P.droop * (depth + 1) * 0.5;
  const d1 = dir(az + R(-0.15, 0.15), elMid);
  const mid = [p[0] + d0[0] * len * 0.5, p[1] + d0[1] * len * 0.5, p[2] + d0[2] * len * 0.5];
  const end = [mid[0] + d1[0] * len * 0.5, mid[1] + d1[1] * len * 0.5, mid[2] + d1[2] * len * 0.5];
  kit.rod('bark', p, mid, r, P.bark, { rt: 0.86, seg: depth < 1 ? 8 : 5 });
  kit.rod('bark', mid, end, r * 0.86, P.bark, { rt: 0.8, seg: depth < 1 ? 8 : 5 });
  if (depth >= P.depth) { tips.push({ p: end, az, el: elMid, depth }); return; }
  if (depth >= P.depth - 1) tips.push({ p: mid, az, el: elMid, depth: depth + 0.5, small: true });
  const n = depth === 0 ? RI(2, 3) : RI(2, 3);
  for (let i = 0; i < n; i++) {
    const a = az + (i - (n - 1) / 2) * P.spread + R(-0.25, 0.25);
    const e = elMid * P.flatten + R(-0.12, 0.22) - P.droop * depth * 0.6;
    growBranches(kit, end, a, e, len * P.lenK * R(0.85, 1.1), r * 0.62, depth + 1, P, tips);
  }
}

/* 樱花树 */
function sakuraTree(x, z, s = 1, o = {}) {
  const y = o.y != null ? o.y : groundAt(x, z);
  const kit = new Kit(x, y, z, 0);
  const P = { droop: 0.14, spread: 0.85, flatten: 0.62, lenK: 0.68, depth: 3, bark: new THREE.Color(0x6a5656).multiplyScalar(R(0.85, 1.05)) };
  const trunkH = (o.trunkH || 1.7) * s, r0 = (o.r0 || 0.2) * s;
  const lean = R(-0.12, 0.12), leanA = R(0, TAU);
  const top = [Math.cos(leanA) * lean * trunkH, trunkH, Math.sin(leanA) * lean * trunkH];
  kit.rod('bark', [0, -0.3, 0], [top[0] * 0.5, trunkH * 0.5, top[2] * 0.5], r0 * 1.15, P.bark, { rt: 0.92, seg: 10 });
  kit.rod('bark', [top[0] * 0.5, trunkH * 0.5, top[2] * 0.5], top, r0 * 1.05, P.bark, { rt: 0.9, seg: 10 });
  // 根部隆起
  for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + R(-0.3, 0.3); kit.rod('bark', [0, 0.25 * s, 0], [Math.cos(a) * r0 * 2.6, -0.05, Math.sin(a) * r0 * 2.6], r0 * 0.45, P.bark, { rt: 0.4, seg: 5 }); }
  const tips = [];
  const nMain = o.main || RI(3, 4); const a0 = R(0, TAU);
  for (let i = 0; i < nMain; i++) {
    const az = a0 + i * TAU / nMain + R(-0.3, 0.3);
    growBranches(kit, top, az, R(0.55, 0.9), (o.L1 || 2.6) * s, r0 * 0.72, 0, P, tips);
  }
  // 树冠
  let cxs = 0, cys = 0, czs = 0; tips.forEach(t => { cxs += t.p[0]; cys += t.p[1]; czs += t.p[2]; });
  const cc = [cxs / tips.length, cys / tips.length, czs / tips.length];
  let crown = 0; tips.forEach(t => crown = Math.max(crown, Math.hypot(t.p[0] - cc[0], t.p[2] - cc[2])));
  const total = Math.round((o.cards || 1500) * s * s);
  const b = cardBucket('sakura', x, z); const col = new THREE.Color();
  const tint = R(-0.03, 0.03);
  for (const t of tips) {
    const k = t.small ? 0.55 : 1; const n = Math.round(total / tips.length * k);
    const rc = 1.05 * s * (t.small ? 0.75 : 1);
    const ccx = t.p[0] + Math.cos(t.az) * 0.25 * s, ccy = t.p[1] + 0.3 * s, ccz = t.p[2] + Math.sin(t.az) * 0.25 * s;
    for (let i = 0; i < n; i++) {
      const u = R(-1, 1), th = R(0, TAU), rr = rc * (0.45 + 0.55 * Math.sqrt(R()));
      const sq = Math.sqrt(1 - u * u);
      const ox = sq * Math.cos(th) * rr, oy = u * rr * 0.62, oz = sq * Math.sin(th) * rr;
      const px = ccx + ox, py = ccy + oy, pz = ccz + oz;
      // 光照法线：相对于整体树冠中心向外
      const lx = px - cc[0], ly = (py - cc[1]) * 1.3 + 0.8 * s, lz = pz - cc[2]; const L = Math.hypot(lx, ly, lz) || 1;
      const outward = clamp(Math.hypot(px - cc[0], pz - cc[2]) / (crown + rc), 0, 1);
      const hgt = clamp((py - (cc[1] - rc)) / (rc * 2.2), 0, 1);
      const bright = clamp(0.25 + 0.45 * hgt + 0.35 * outward, 0, 1);
      col.setRGB(lerp(0.86, 1.0, bright), lerp(0.62, 0.95, bright) + tint, lerp(0.70, 0.96, bright) + tint);
      const sz = R(0.5, 0.82) * Math.sqrt(s) * (o.cardK || 1);
      addCard(b, x + px, y + py, z + pz, ox + R(-0.4, 0.4), oy + 0.5, oz + R(-0.4, 0.4), sz, RI(0, 3), col, clamp(outward * 1.2, 0.15, 1), lx / L, ly / L, lz / L);
    }
    if (!t.small) kit.sph('blob', ccx, ccy - 0.2 * s, ccz, rc * 0.3, rc * 0.2, rc * 0.3, 0xeec0cb, { lo: true });
  }
  // 落花地毯
  const rr = crown + 1.6 * s;
  for (let i = 0; i < Math.round(10 + rr * rr * 0.25); i++) {
    const a = R(0, TAU), d = Math.sqrt(R()) * rr; const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
    const gy = o.flatY != null ? o.flatY : groundAt(px, pz, y + 2);
    WK.plane('petalGround', px, gy + 0.035, pz, R(1.4, 2.4), R(1.4, 2.4), 0xffffff, { rx: -Math.PI / 2, ry: R(0, TAU), uvr: [R(0, 0.5), R(0, 0.5), R(0.5, 1), R(0.5, 1)] });
  }
  TREES.push({ x, z, r: crown + 1.2 * s, kind: 'sakura', y });
  return { crown, cc: [x + cc[0], y + cc[1], z + cc[2]] };
}

/* 绿树（樟树、榉树） */
function greenTree(x, z, s = 1, o = {}) {
  const y = o.y != null ? o.y : groundAt(x, z);
  const kit = new Kit(x, y, z, 0);
  const P = { droop: 0.02, spread: 0.7, flatten: 0.85, lenK: 0.66, depth: 2, bark: new THREE.Color(0x6e6150) };
  const trunkH = 2.2 * s, r0 = 0.22 * s;
  kit.rod('bark', [0, -0.3, 0], [0, trunkH, 0], r0, P.bark, { rt: 0.75, seg: 8 });
  const tips = []; const n = RI(3, 4); const a0 = R(0, TAU);
  for (let i = 0; i < n; i++) growBranches(kit, [0, trunkH, 0], a0 + i * TAU / n, R(0.8, 1.1), 2.2 * s, r0 * 0.6, 0, P, tips);
  const b = cardBucket('leaf', x, z); const col = new THREE.Color(); const hue = o.hue || R(0, 1);
  const base = new THREE.Color().setHSL(lerp(0.24, 0.3, hue), 0.5, 0.42);
  const lite = new THREE.Color().setHSL(lerp(0.2, 0.25, hue), 0.62, 0.62);
  let cy = 0; tips.forEach(t => cy += t.p[1]); cy /= tips.length;
  const per = Math.round((o.cards || 700) * s * s / tips.length);
  for (const t of tips) {
    const rc = 1.5 * s;
    for (let i = 0; i < per; i++) {
      const u = R(-1, 1), th = R(0, TAU), rr = rc * (0.4 + 0.6 * Math.sqrt(R())); const sq = Math.sqrt(1 - u * u);
      const ox = sq * Math.cos(th) * rr, oy = u * rr * 0.75 + 0.4 * s, oz = sq * Math.sin(th) * rr;
      const px = t.p[0] + ox, py = t.p[1] + oy, pz = t.p[2] + oz;
      const lx = px, ly = (py - cy) * 1.2 + 1.0 * s, lz = pz; const L = Math.hypot(lx, ly, lz) || 1;
      const bright = clamp(0.3 + 0.5 * (py - cy + rc) / (rc * 2.2) + 0.25 * Math.hypot(px, pz) / (rc * 2.4), 0, 1);
      col.copy(base).lerp(lite, bright);
      addCard(b, x + px, y + py, z + pz, ox, oy + 0.4, oz, R(0.7, 1.1) * Math.sqrt(s), RI(0, 1), col, clamp(Math.hypot(px, pz) / (rc * 2.5), 0.1, 0.8), lx / L, ly / L, lz / L);
    }
    kit.sph('vc', t.p[0], t.p[1] + 0.3 * s, t.p[2], rc * 0.75, rc * 0.6, rc * 0.75, base.clone().multiplyScalar(0.8), { lo: true });
  }
  TREES.push({ x, z, r: 2.5 * s, kind: 'green', y });
}

/* 黑松 */
function pineTree(x, z, s = 1, o = {}) {
  const y = o.y != null ? o.y : groundAt(x, z);
  const kit = new Kit(x, y, z, 0); const bark = new THREE.Color(0x5e4b3c);
  let p = [0, -0.3, 0]; let a = R(0, TAU); const pts = [p];
  for (let i = 0; i < 4; i++) { const np = [p[0] + Math.cos(a) * 0.6 * s, p[1] + 1.4 * s, p[2] + Math.sin(a) * 0.6 * s]; kit.rod('bark', p, np, 0.2 * s * (1 - i * 0.18), bark, { rt: 0.85, seg: 7 }); p = np; pts.push(np); a += R(-1.2, 1.2); }
  const b = cardBucket('leaf', x, z); const col = new THREE.Color();
  for (let i = 1; i < pts.length; i++) {
    const nb = i === pts.length - 1 ? 1 : 2;
    for (let k = 0; k < nb; k++) {
      const ba = R(0, TAU), bl = R(1.2, 2.4) * s * (1 - i * 0.12);
      const e = [pts[i][0] + Math.cos(ba) * bl, pts[i][1] + R(-0.2, 0.3), pts[i][2] + Math.sin(ba) * bl];
      kit.rod('bark', pts[i], e, 0.07 * s, bark, { rt: 0.5, seg: 5 });
      const rc = R(1.0, 1.5) * s;
      for (let j = 0; j < 55 * s; j++) {
        const th = R(0, TAU), rr = Math.sqrt(R()) * rc; const px = e[0] + Math.cos(th) * rr, pz = e[2] + Math.sin(th) * rr, py = e[1] + R(-0.15, 0.35) * s;
        const bright = R(0.25, 0.75) + (py - e[1]) * 0.5; col.setRGB(lerp(0.28, 0.5, bright), lerp(0.45, 0.66, bright), lerp(0.36, 0.44, bright));
        addCard(b, x + px, y + py, z + pz, R(-0.4, 0.4), 1, R(-0.4, 0.4), R(0.8, 1.15) * s, RI(0, 1), col, 0.3, (px - e[0]) * 0.3, 1, (pz - e[2]) * 0.3, 0.7);
      }
    }
  }
  TREES.push({ x, z, r: 2.5 * s, kind: 'pine', y });
}

/* 灌木 */
function shrub(x, z, s = 1, flowers = 0, y) {
  y = y != null ? y : groundAt(x, z);
  const b = cardBucket('leaf', x, z); const col = new THREE.Color();
  const n = Math.round(30 * s * s);
  for (let i = 0; i < n; i++) {
    const th = R(0, TAU), u = R(0, 1), rr = Math.sqrt(R()) * s;
    const px = Math.cos(th) * rr, pz = Math.sin(th) * rr, py = 0.35 * s + u * 0.55 * s;
    const bright = 0.3 + u * 0.6; col.setRGB(lerp(0.26, 0.55, bright), lerp(0.42, 0.72, bright), lerp(0.26, 0.4, bright));
    if (flowers) col.lerp(new THREE.Color(flowers), 0.0);
    addCard(b, x + px, y + py, z + pz, px, 1, pz, R(0.5, 0.75) * s, flowers ? 3 : 1, col, 0.2, px, 1, pz);
  }
  WK.sph('vc', x, y + 0.42 * s, z, s * 0.85, s * 0.45, s * 0.85, 0x4d7a45, { lo: true });
  if (flowers) for (let i = 0; i < 10 * s; i++) { const th = R(0, TAU), rr = R(0.3, 0.9) * s; WK.sph('vcNoShadow', x + Math.cos(th) * rr, y + R(0.6, 0.95) * s, z + Math.sin(th) * rr, 0.09, 0.07, 0.09, flowers, { lo: true }); }
}

/* 草丛卡片 */
function grassPatch(x, z, y, n = 6, spread = 1.2) {
  const b = cardBucket('grass', x, z); const col = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const px = x + R(-spread, spread), pz = z + R(-spread, spread); const py = (y != null ? y : terrainH(px, pz));
    const h = R(0.35, 0.6); const a = R(0, TAU);
    col.setHSL(R(0.21, 0.25), R(0.5, 0.62), R(0.6, 0.74));
    addCard(b, px, py + h * 0.45, pz, Math.cos(a), 0, Math.sin(a), h, 0, col, 0.6, 0, 1, 0, 1, a + Math.PI / 2);
  }
}

/* ---------------- 飘落的花瓣（着色器粒子） ---------------- */
const PETAL_U = { time: WIND.uTime, camPos: { value: new THREE.Vector3() }, density: { value: 1 }, light: { value: 1 }, wind: WIND.uWind };
let petalPoints;
function buildPetals() {
  const N = 2600; const pos = new Float32Array(N * 3), rnd = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { pos[i * 3] = R(0, 1); pos[i * 3 + 1] = R(0, 1); pos[i * 3 + 2] = R(0, 1); rnd[i * 4] = R(); rnd[i * 4 + 1] = R(); rnd[i * 4 + 2] = R(); rnd[i * 4 + 3] = R(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('rnd', new THREE.BufferAttribute(rnd, 4));
  const m = new THREE.ShaderMaterial({
    uniforms: PETAL_U, transparent: true, depthWrite: false,
    vertexShader: `attribute vec4 rnd; uniform float time; uniform vec3 camPos; uniform float wind; varying float vA; varying float vRot; varying float vTone;
      void main(){ vec3 box=vec3(56.0,22.0,56.0);
        float t=time*(0.6+rnd.x*0.5);
        vec3 p=position*box + vec3(t*1.6*wind + sin(t*0.9+rnd.y*6.28)*1.5, -t*(0.9+rnd.z*0.6), t*0.7*wind + cos(t*0.7+rnd.w*6.28)*1.3);
        p = mod(p - camPos + box*0.5, box) - box*0.5 + camPos;
        p.y = camPos.y + mod(p.y - camPos.y + 4.0, 22.0) - 8.0;
        vec4 mv=viewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv; float d=-mv.z;
        gl_PointSize = (0.13+rnd.x*0.06)*720.0/max(d,0.5); vA=smoothstep(30.0,10.0,d)*smoothstep(0.2,1.0,d);
        vRot=t*(1.5+rnd.y*2.0)+rnd.w*6.28; vTone=rnd.z; }`,
    fragmentShader: `uniform float density; uniform float light; varying float vA; varying float vRot; varying float vTone;
      void main(){ vec2 c=gl_PointCoord-0.5; float s=sin(vRot),co=cos(vRot); c=vec2(c.x*co-c.y*s,c.x*s+c.y*co);
        c.y*=1.0+0.6*abs(sin(vRot*0.7)); float e=length(c*vec2(1.0,1.8)); if(e>0.42) discard;
        float notch=smoothstep(0.06,0.0,length(c-vec2(0.0,0.21))); if(notch>0.5) discard;
        vec3 col=mix(vec3(0.99,0.86,0.9),vec3(0.96,0.72,0.8),vTone)*light;
        gl_FragColor=vec4(col, vA*density*0.95); }`
  });
  petalPoints = new THREE.Points(g, m); petalPoints.frustumCulled = false; petalPoints.renderOrder = 6; scene.add(petalPoints);
  applyPetalQuality();
}
function applyPetalQuality() { if (petalPoints) petalPoints.geometry.setDrawRange(0, Q.petals); }
