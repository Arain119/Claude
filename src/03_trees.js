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
const TEX_GRASS = canvasTex(256, 256, (g) => {
  g.clearRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) { const x = R(10, 246), h = R(90, 240), b = R(-40, 40); g.strokeStyle = `rgb(${R(150, 215) | 0},${R(190, 235) | 0},${R(120, 170) | 0})`; g.lineWidth = R(3, 6); g.beginPath(); g.moveTo(x, 256); g.quadraticCurveTo(x + b * 0.3, 256 - h * 0.6, x + b, 256 - h); g.stroke(); }
  for (let i = 0; i < 3; i++) { g.fillStyle = pick(['#f4e9a0', '#ffffff', '#e9c6e6']); g.beginPath(); g.arc(R(20, 236), R(30, 120), 4, 0, TAU); g.fill(); }
});
const TEX_PETALS_GROUND = canvasTex(512, 512, (g) => {
  g.clearRect(0, 0, 512, 512);
  for (let i = 0; i < 420; i++) { const x = R(0, 512), y = R(0, 512); g.save(); g.translate(x, y); g.rotate(R(0, TAU)); g.fillStyle = pick(['#fbd3dd', '#f7c0cf', '#fde6ec', '#f3b2c4']); g.beginPath(); g.ellipse(0, 0, R(4, 7), R(2.5, 4), 0, 0, TAU); g.fill(); g.restore(); }
});
TEX_PETALS_GROUND.wrapS = TEX_PETALS_GROUND.wrapT = THREE.RepeatWrapping;
regMat('bark', pm(TEX.bark, { roughness: 0.95, ns: 1.2 }), { tint: 0.55 });

function foliageMat(map, opts = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, map, alphaTest: opts.body ? 0 : 0.45, side: opts.body ? THREE.FrontSide : THREE.DoubleSide, roughness: 0.8, metalness: 0, emissive: opts.emissive || 0x000000, envMapIntensity: 0.6 });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = WIND.uTime; sh.uniforms.uWind = WIND.uWind; sh.uniforms.folSun = { value: FOGX.sun }; sh.uniforms.folCol = { value: FOGX.leafCol };
    sh.vertexShader = 'attribute float sway;\nuniform float uTime; uniform float uWind; varying vec3 vFolW;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
      { vec4 fw = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
        fw = instanceMatrix * fw;
        #endif
        vFolW = (modelMatrix * fw).xyz; }`).replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
      float ph = instanceMatrix[3].x*0.35 + instanceMatrix[3].z*0.27 + position.y*0.2;
      #else
      float ph = position.x*0.35 + position.z*0.27;
      #endif
      float sw = sway*uWind;
      transformed.x += (sin(uTime*1.7+ph)*0.06 + sin(uTime*0.6+ph*0.31)*0.12)*sw;
      transformed.z += (cos(uTime*1.3+ph*1.1)*0.05 + cos(uTime*0.5+ph*0.2)*0.08)*sw;
      transformed.y += sin(uTime*2.3+ph*1.7)*0.025*sw;`);
    sh.fragmentShader = 'uniform vec3 folSun; uniform vec3 folCol; varying vec3 vFolW;\n' + sh.fragmentShader.replace('#include <normal_fragment_begin>', 'float faceDirection = gl_FrontFacing ? 1.0 : -1.0;\nvec3 normal = normalize( vNormal );\nvec3 geometryNormal = normal;')
      .replace('#include <output_fragment>', `
      // 新海诚式树冠：暗部偏冷蓝绿、亮部偏暖黄绿，逆光时叶片透亮，外缘有轮廓光
      { vec3 sunV = normalize((viewMatrix * vec4(folSun, 0.0)).xyz);
        float ndl = dot(normal, sunV) * (gl_FrontFacing ? 1.0 : -1.0);
        float lit = smoothstep(-0.25, 0.3, ndl) * smoothstep(-0.05, 0.1, folSun.y);
        vec3 cool = outgoingLight * vec3(0.5, 0.68, 0.98), warm = outgoingLight * vec3(1.18, 1.08, 0.74);
        outgoingLight = mix(cool, warm, lit);
        vec3 V = normalize(vFolW - cameraPosition);
        float back = pow(max(dot(V, normalize(folSun)), 0.0), 3.0);
        float rim = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.5);
        outgoingLight += diffuseColor.rgb * folCol * (back * 1.6 + rim * 0.35); }
      #include <output_fragment>`);
  };
  const depth = opts.body ? null : new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.45 });
  return { m, depth };
}
/* --- 程序绘制的叶片图集（2×2 格，每格一小簇完整的叶 / 花 / 针叶，边缘留透明，不会被卡片边缘切断） --- */
function paintAtlas(fn) {
  return canvasTex(1024, 1024, (g) => { g.clearRect(0, 0, 1024, 1024); for (let c = 0; c < 4; c++) { g.save(); g.translate((c & 1) * 512, (c >> 1) * 512); g.beginPath(); g.rect(0, 0, 512, 512); g.clip(); fn(g, 512, c); g.restore(); } });
}
function leafShape(g, L, W) { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(W * 0.9, -L * 0.18, W * 0.75, -L * 0.8, 0, -L); g.bezierCurveTo(-W * 0.75, -L * 0.8, -W * 0.9, -L * 0.18, 0, 0); }
const TEX_LEAF_ATLAS = paintAtlas((g, C) => {
  const cx = C / 2, cy = C / 2;
  g.strokeStyle = 'rgb(120,110,80)'; g.lineCap = 'round';
  for (let i = 0; i < 5; i++) { const a = R(0, TAU); g.lineWidth = R(3, 5); g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + Math.cos(a + 0.4) * C * 0.15, cy + Math.sin(a + 0.4) * C * 0.15, cx + Math.cos(a) * C * 0.3, cy + Math.sin(a) * C * 0.3); g.stroke(); }
  const leaves = []; for (let i = 0; i < 34; i++) { const a = R(0, TAU), d = Math.sqrt(R()) * C * 0.3; leaves.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d, a + R(-0.7, 0.7) + Math.PI / 2, d]); }
  leaves.sort((p, q) => q[3] - p[3]);
  for (const [x, y, a] of leaves) {
    const L = R(0.15, 0.21) * C, W = L * R(0.38, 0.5), k = R(0.72, 1.0), wy = R(-8, 10);
    g.save(); g.translate(x, y); g.rotate(a);
    leafShape(g, L, W); const gr = g.createLinearGradient(0, 0, W * 0.5, -L);
    gr.addColorStop(0, `rgb(${185 * k | 0},${205 * k | 0},${165 * k | 0})`); gr.addColorStop(1, `rgb(${Math.min(255, 250 * k + wy) | 0},${Math.min(255, 255 * k) | 0},${Math.min(255, 215 * k - wy) | 0})`);
    g.fillStyle = gr; g.fill(); g.lineWidth = 2.2; g.strokeStyle = `rgba(70,90,60,0.55)`; g.stroke();
    g.strokeStyle = 'rgba(255,255,235,0.45)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, -L * 0.05); g.quadraticCurveTo(W * 0.08, -L * 0.5, 0, -L * 0.9); g.stroke();
    g.restore();
  }
});
const TEX_SAK_ATLAS = paintAtlas((g, C) => {
  const cx = C / 2, cy = C / 2;
  g.strokeStyle = 'rgb(90,70,72)'; g.lineCap = 'round';
  for (let i = 0; i < 4; i++) { const a = R(0, TAU); g.lineWidth = R(4, 7); g.beginPath(); g.moveTo(cx + Math.cos(a + Math.PI) * C * 0.1, cy + Math.sin(a + Math.PI) * C * 0.1); g.lineTo(cx + Math.cos(a) * C * 0.3, cy + Math.sin(a) * C * 0.3); g.stroke(); }
  const fl = []; for (let i = 0; i < 15; i++) { const a = R(0, TAU), d = Math.sqrt(R()) * C * 0.3; fl.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d, d]); }
  fl.sort((p, q) => q[2] - p[2]);
  for (const [x, y] of fl) { if (chance(0.15)) { g.fillStyle = '#e7849f'; g.beginPath(); g.ellipse(x, y, C * 0.03, C * 0.045, R(0, 3), 0, TAU); g.fill(); continue; } drawBlossom(g, x, y, C * R(0.075, 0.1), R(0, TAU)); }
});
const TEX_PINE_ATLAS = paintAtlas((g, C) => {
  const cx = C / 2, cy = C / 2; g.lineCap = 'round';
  g.strokeStyle = 'rgb(110,90,70)'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx - C * 0.3, cy + C * 0.12); g.quadraticCurveTo(cx, cy - C * 0.02, cx + C * 0.3, cy - C * 0.08); g.stroke();
  for (let t = 0; t < 7; t++) {
    const u = t / 6, tx = cx - C * 0.28 + u * C * 0.56, ty = cy + C * 0.1 - u * C * 0.16 + R(-C * 0.06, C * 0.06);
    for (let i = 0; i < 46; i++) { const a = -Math.PI / 2 + R(-1.5, 1.5), L = R(0.09, 0.16) * C, k = R(0.6, 1); g.strokeStyle = `rgb(${170 * k | 0},${215 * k | 0},${190 * k | 0})`; g.lineWidth = R(2, 3.4); g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + Math.cos(a) * L, ty + Math.sin(a) * L); g.stroke(); }
  }
});
const SAK_M = foliageMat(TEX_SAK_ATLAS, { emissive: 0x150a0c });
const LEAF_M = foliageMat(TEX_LEAF_ATLAS);
const PINE_M = foliageMat(TEX_PINE_ATLAS);
const GRASS_M = foliageMat(TEX_GRASS);
/* 簇体的平铺纹理：密密的花 / 叶 / 针叶（不透明），让簇体近看也是一团花叶而不是光滑的球 */
function paintMass(bg, fn) {
  return canvasTex(512, 512, (g) => { g.fillStyle = bg; g.fillRect(0, 0, 512, 512); const draw = (x, y, f) => { for (const ox of [-512, 0, 512]) for (const oy of [-512, 0, 512]) { g.save(); g.translate(x + ox, y + oy); f(g); g.restore(); } }; fn(g, draw); }, { repeat: true });
}
const TEX_SAK_MASS = paintMass('#d9b3c0', (g, draw) => { for (let i = 0; i < 150; i++) { const x = R(0, 512), y = R(0, 512), r = R(18, 26), rot = R(0, TAU), k = R(0.82, 1.0); draw(x, y, (gg) => { gg.globalAlpha = 1; drawBlossom(gg, 0, 0, r, rot); if (k < 0.9) { gg.fillStyle = 'rgba(150,100,130,0.25)'; gg.beginPath(); gg.arc(0, 0, r, 0, TAU); gg.fill(); } }); } });
const TEX_LEAF_MASS = paintMass('#5f7550', (g, draw) => { for (let i = 0; i < 260; i++) { const x = R(0, 512), y = R(0, 512), a = R(0, TAU), L = R(34, 48), k = R(0.62, 1.0); draw(x, y, (gg) => { gg.rotate(a); leafShape(gg, L, L * 0.45); gg.fillStyle = `rgb(${200 * k | 0},${225 * k | 0},${170 * k | 0})`; gg.fill(); gg.lineWidth = 1.6; gg.strokeStyle = 'rgba(60,80,50,0.6)'; gg.stroke(); }); } });
const TEX_PINE_MASS = paintMass('#4c6658', (g, draw) => { g.lineCap = 'round'; for (let i = 0; i < 900; i++) { const x = R(0, 512), y = R(0, 512), a = -Math.PI / 2 + R(-1.4, 1.4), L = R(18, 30), k = R(0.6, 1); draw(x, y, (gg) => { gg.strokeStyle = `rgb(${165 * k | 0},${210 * k | 0},${185 * k | 0})`; gg.lineWidth = 2.2; gg.beginPath(); gg.moveTo(0, 0); gg.lineTo(Math.cos(a) * L, Math.sin(a) * L); gg.stroke(); }); } });
const BODY_S = foliageMat(TEX_SAK_MASS, { body: true }), BODY_L = foliageMat(TEX_LEAF_MASS, { body: true }), BODY_P = foliageMat(TEX_PINE_MASS, { body: true });
regMat('leafBodyS', BODY_S.m); regMat('leafBodyL', BODY_L.m); regMat('leafBodyP', BODY_P.m);
regMat('petalGround', new THREE.MeshStandardMaterial({ map: TEX_PETALS_GROUND, transparent: true, alphaTest: 0.35, depthWrite: false, roughness: 1, metalness: 0, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), { cast: false });

/* --- 卡片累加器（带 sway 属性与乱序索引，便于按画质截断） --- */
const CARD_BUCKETS = new Map();
let CARD_STORE = null; // 原型树构建时临时接管
function cardBucket(kind, x, z) {
  const store = CARD_STORE || CARD_BUCKETS;
  const key = CARD_STORE ? kind : kind + '|' + Math.floor(x / 90) + ',' + Math.floor(z / 90);
  let b = store.get(key); if (!b) { b = { kind, pos: [], nor: [], uv: [], col: [], sway: [], q: 0 }; store.set(key, b); } return b;
}
const _cl = new THREE.Color();
const _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _nn = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
function addCard(b, cx, cy, cz, nx, ny, nz, size, cell, col, sway, lnx, lny, lnz, aspect = 1, spin = null, uvr = null) {
  _nn.set(nx, ny, nz).normalize();
  _t1.set(R(-1, 1), R(-1, 1), R(-1, 1)).cross(_nn).normalize();
  if (spin != null) { _t1.set(Math.cos(spin), 0, Math.sin(spin)).cross(_nn).normalize(); }
  _t2.copy(_nn).cross(_t1).normalize();
  const hw = size / 2, hh = size * aspect / 2;
  const fu = cell & 1, fv = cell & 2; _cl.copy(col).convertSRGBToLinear();
  const corners = [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]];
  for (const c of corners) {
    b.pos.push(cx + _t1.x * c[0] * hw + _t2.x * c[1] * hh, cy + _t1.y * c[0] * hw + _t2.y * c[1] * hh, cz + _t1.z * c[0] * hw + _t2.z * c[1] * hh);
    let u = fu ? 1 - c[2] : c[2], v = fv ? 1 - c[3] : c[3]; if (uvr) { u = uvr[0] + (uvr[2] - uvr[0]) * u; v = uvr[1] + (uvr[3] - uvr[1]) * v; }
    b.nor.push(lnx, lny, lnz); b.uv.push(u, v); b.col.push(_cl.r, _cl.g, _cl.b); b.sway.push(sway);
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
    const M = b.kind === 'sakura' ? SAK_M : b.kind === 'grass' ? GRASS_M : b.kind === 'pine' ? PINE_M : LEAF_M;
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

/* ---------------- 树冠：簇体 + 贴在簇表面的叶片卡 ----------------
   每个簇是一个微微起伏的椭球（不透明，填满叶片之间的空隙，压出暗部），表面再贴一层按真实尺寸缩放的叶片卡。
   光照法线在“簇自身的法线”与“整个树冠的法线”之间混合：远看明暗成大块（新海诚式），近看每一簇仍有体积。 */
const ICO1 = new THREE.IcosahedronGeometry(1, 1).attributes.position.array.slice(), ICO0 = new THREE.IcosahedronGeometry(1, 0).attributes.position.array.slice();
const CROP4 = [[0, 0, 0.5, 0.5], [0.5, 0, 1, 0.5], [0, 0.5, 0.5, 1], [0.5, 0.5, 1, 1]];
const _cA = new THREE.Color(), _cB = new THREE.Color();
function clusterTips(pts, rad) {
  const out = [];
  for (const p of pts) {
    let best = null, bd = rad; for (const c of out) { const d = Math.hypot(c.x / c.n - p[0], (c.y / c.n - p[1]) * 1.4, c.z / c.n - p[2]); if (d < bd) { bd = d; best = c; } }
    if (best) { best.x += p[0]; best.y += p[1]; best.z += p[2]; best.n++; } else out.push({ x: p[0], y: p[1], z: p[2], n: 1 });
  }
  return out.map(c => ({ x: c.x / c.n, y: c.y / c.n, z: c.z / c.n, n: c.n }));
}
// clumps: [{x, y, z, r, sq}]（相对于树根）；o: {kind, base, lite, shade, card, dens, crop, body, inner, local, sway}
function canopy(kit, ox, oy, oz, clumps, o) {
  const b = cardBucket(o.kind, ox, oz);
  let cx = 0, cy = 0, cz = 0, W = 0; for (const c of clumps) { const w = c.r ** 3; cx += c.x * w; cy += c.y * w; cz += c.z * w; W += w; } cx /= W; cy /= W; cz /= W;
  let ext = 0.5, y0 = 1e9, y1 = -1e9; for (const c of clumps) { ext = Math.max(ext, Math.hypot(c.x - cx, c.z - cz) + c.r); y0 = Math.min(y0, c.y - c.r * c.sq); y1 = Math.max(y1, c.y + c.r * c.sq); }
  const ey = Math.max(0.5, (y1 - y0) / 2), loc = o.local != null ? o.local : 0.45;
  const N = [0, 0, 0];
  const light = (px, py, pz, dx, dy, dz) => {
    let gx = (px - cx) / ext, gy = (py - cy) / ey * 0.8 + 0.3, gz = (pz - cz) / ext; const gl = Math.hypot(gx, gy, gz) || 1;
    let nx = dx * loc + gx / gl * (1 - loc), ny = dy * loc + gy / gl * (1 - loc) + 0.12, nz = dz * loc + gz / gl * (1 - loc); const l = Math.hypot(nx, ny, nz) || 1;
    N[0] = nx / l; N[1] = ny / l; N[2] = nz / l;
    // 环境遮蔽：树冠内部、底部与朝内的面更暗
    const out = clamp(Math.hypot(px - cx, pz - cz) / ext, 0, 1), h = clamp((py - y0) / (y1 - y0 + 1e-3), 0, 1);
    const face = (dx * gx + dy * gy + dz * gz) / gl;
    return clamp(0.32 + 0.38 * h + 0.2 * out + 0.22 * face, 0.22, 1);
  };
  const sh = o.shade || o.base;
  for (const c of clumps) {
    const sq = c.sq, r = c.r;
    if (o.body) {
      const ICO = o.lo ? ICO0 : ICO1;
      const n = ICO.length / 3, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = new Float32Array(n * 2); const ph = R(0, 100), ts = o.kind === 'sakura' ? 1 / 0.9 : 1 / 1.1;
      for (let i = 0; i < n; i++) {
        const ux = ICO[i * 3], uy = ICO[i * 3 + 1], uz = ICO[i * 3 + 2];
        const k = o.body * (1 + (vnoise(ux * 2.3 + ph, uz * 2.3 + uy * 1.7, 1) - 0.5) * 0.55);
        const px = c.x + ux * r * k, py = c.y + uy * r * k * sq, pz = c.z + uz * r * k;
        let dx = ux, dy = uy / sq, dz = uz; const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
        const a = lerp(o.bodyMin || 0, 1, light(px, py, pz, dx, dy, dz)) * 0.84;
        _cA.copy(sh).lerp(o.base, clamp(a * 1.2 - 0.1, 0, 1)).multiplyScalar(a).convertSRGBToLinear();
        pos.set([px, py, pz], i * 3); nor.set(N, i * 3); col.set([_cA.r, _cA.g, _cA.b], i * 3);
        // 按簇自身法线做三向投影（每个三角形取其主轴，避免拉伸）
        const fi = i - i % 3;
        if (i % 3 === 0) { let sx = 0, sy = 0, sz = 0; for (let q = 0; q < 3; q++) { sx += Math.abs(ICO[(fi + q) * 3]); sy += Math.abs(ICO[(fi + q) * 3 + 1]) / sq; sz += Math.abs(ICO[(fi + q) * 3 + 2]); } canopy._ax = sy >= sx && sy >= sz ? 1 : sx >= sz ? 0 : 2; }
        const A = canopy._ax; uv[i * 2] = (A === 1 ? px + ox : A === 0 ? pz + oz : px + ox) * ts; uv[i * 2 + 1] = (A === 1 ? pz + oz : py + oy) * ts;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      kit.geo(o.kind === 'sakura' ? 'leafBodyS' : o.kind === 'pine' ? 'leafBodyP' : 'leafBodyL', g, 0, 0, 0, 0xffffff, { vcol: true });
    }
    const area = 4 * Math.PI * r * r * (0.45 + 0.55 * sq); const nC = Math.max(6, Math.round(area / (o.card * o.card) * o.dens));
    for (let k = 0; k < nC; k++) {
      let ux = R(-1, 1), uy = R(-1, 1), uz = R(-1, 1); let ul = Math.hypot(ux, uy, uz); if (ul > 1 || ul < 0.05) { k--; continue; } ux /= ul; uy /= ul; uz /= ul;
      if (uy < -0.4 && rng() < 0.55) continue; // 底面稀一些
      const inner = rng() < (o.inner || 0);
      const rr = r * (inner ? R(0.35, 0.8) : R(0.9, 1.08));
      const px = c.x + ux * rr, py = c.y + uy * rr * sq, pz = c.z + uz * rr;
      const a = light(px, py, pz, ux, uy / sq, uz) * (inner ? 0.75 : 1);
      const h = clamp((py - y0) / (y1 - y0 + 1e-3), 0, 1);
      _cB.copy(o.base).lerp(o.lite, clamp(h * 0.55 + R(-0.15, 0.3), 0, 1)); _cA.copy(sh).lerp(_cB, clamp(a * 1.25 - 0.1, 0, 1)).multiplyScalar(lerp(0.55, 1.05, a));
      const sz = o.card * R(0.8, 1.2);
      addCard(b, ox + px, oy + py, oz + pz, ux + R(-0.5, 0.5), uy + R(-0.3, 0.6), uz + R(-0.5, 0.5), sz, RI(0, 3), _cA, clamp(o.sway * (0.3 + 0.7 * Math.hypot(px, pz) / (ext + 1)), 0.05, 1), N[0], N[1], N[2], 1, null, o.crop ? CROP4[RI(0, 3)] : null);
    }
  }
  return { cx, cy, cz, ext };
}

/* 樱花树（染井吉野）：伞形树冠，深色弯曲枝干，花簇扁平成层 */
const SAK_BASE = new THREE.Color(0xfbe9ec), SAK_LITE = new THREE.Color(0xffffff), SAK_SHADE = new THREE.Color(0xc79db0);
function sakuraTree(x, z, s = 1, o = {}) {
  const y = o.y != null ? o.y : groundAt(x, z);
  const kit = new Kit(x, y, z, 0);
  const P = { droop: 0.16, spread: 0.85, flatten: 0.6, lenK: 0.7, depth: 3, bark: new THREE.Color(0x5e4f52).multiplyScalar(R(0.85, 1.05)) };
  const trunkH = (o.trunkH || 1.7) * s, r0 = (o.r0 || 0.2) * s;
  const lean = R(-0.12, 0.12), leanA = R(0, TAU);
  const top = [Math.cos(leanA) * lean * trunkH, trunkH, Math.sin(leanA) * lean * trunkH];
  kit.rod('bark', [0, -0.3, 0], [top[0] * 0.5, trunkH * 0.5, top[2] * 0.5], r0 * 1.15, P.bark, { rt: 0.92, seg: 10 });
  kit.rod('bark', [top[0] * 0.5, trunkH * 0.5, top[2] * 0.5], top, r0 * 1.05, P.bark, { rt: 0.9, seg: 10 });
  for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + R(-0.3, 0.3); kit.rod('bark', [0, 0.25 * s, 0], [Math.cos(a) * r0 * 2.6, -0.05, Math.sin(a) * r0 * 2.6], r0 * 0.45, P.bark, { rt: 0.4, seg: 5 }); }
  const tips = [];
  const nMain = o.main || RI(3, 4); const a0 = R(0, TAU);
  for (let i = 0; i < nMain; i++) growBranches(kit, top, a0 + i * TAU / nMain + R(-0.3, 0.3), R(0.5, 0.85), (o.L1 || 2.6) * s, r0 * 0.72, 0, P, tips);
  const cl = clusterTips(tips.map(t => [t.p[0] + Math.cos(t.az) * 0.3 * s, t.p[1] + 0.25 * s, t.p[2] + Math.sin(t.az) * 0.3 * s]), 1.05 * s);
  const clumps = cl.map(c => ({ x: c.x, y: c.y, z: c.z, r: (0.85 + 0.12 * Math.min(c.n, 4)) * s, sq: R(0.55, 0.68) }));
  const tint = R(-0.02, 0.02); const base = SAK_BASE.clone().offsetHSL(tint, 0, 0);
  const C = canopy(kit, x, y, z, clumps, { kind: 'sakura', base, lite: SAK_LITE, shade: SAK_SHADE, card: 0.4 * Math.sqrt(s) * (o.cardK || 1), dens: 2.1 * (o.cards || 1400) / 1400, crop: true, body: 0.74, bodyMin: 0.7, inner: 0.3, local: 0.4, sway: 0.7 });
  let crown = C.ext;
  // 落花地毯
  const rr = crown + 1.2 * s;
  for (let i = 0; i < Math.round(10 + rr * rr * 0.25); i++) {
    const a = R(0, TAU), d = Math.sqrt(R()) * rr; const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
    const gy = o.flatY != null ? o.flatY : groundAt(px, pz, y + 2);
    WK.plane('petalGround', px, gy + 0.035, pz, R(1.4, 2.4), R(1.4, 2.4), 0xffffff, { rx: -Math.PI / 2, ry: R(0, TAU), uvr: [R(0, 0.5), R(0, 0.5), R(0.5, 1), R(0.5, 1)] });
  }
  TREES.push({ x, z, r: crown + 0.8 * s, kind: 'sakura', y });
  return { crown, cc: [x + C.cx, y + C.cy, z + C.cz] };
}

/* 绿树（樟树、榉树）：圆润的大树冠，几团叶簇叠在一起 */
function greenTree(x, z, s = 1, o = {}) {
  const y = o.y != null ? o.y : groundAt(x, z);
  const kit = new Kit(x, y, z, 0);
  const P = { droop: 0.02, spread: 0.7, flatten: 0.85, lenK: 0.68, depth: 2, bark: new THREE.Color(0x6e6150) };
  const trunkH = 2.2 * s, r0 = 0.22 * s;
  kit.rod('bark', [0, -0.3, 0], [0, trunkH, 0], r0, P.bark, { rt: 0.75, seg: 8 });
  const tips = []; const n = RI(3, 4); const a0 = R(0, TAU);
  for (let i = 0; i < n; i++) growBranches(kit, [0, trunkH, 0], a0 + i * TAU / n, R(0.8, 1.1), 2.2 * s, r0 * 0.6, 0, P, tips);
  const cl = clusterTips(tips.map(t => [t.p[0], t.p[1] + 0.45 * s, t.p[2]]), 1.5 * s);
  const clumps = cl.map(c => ({ x: c.x, y: c.y, z: c.z, r: (1.15 + 0.12 * Math.min(c.n, 4)) * s, sq: R(0.72, 0.85) }));
  // 顶部再加一簇，让树冠更饱满
  let tx = 0, tz = 0, ty = 0; for (const c of clumps) { tx += c.x; tz += c.z; ty = Math.max(ty, c.y); } clumps.push({ x: tx / clumps.length, y: ty + 0.7 * s, z: tz / clumps.length, r: 1.3 * s, sq: 0.75 });
  const hue = o.hue != null ? o.hue : R(0, 1);
  const base = new THREE.Color().setHSL(lerp(0.24, 0.3, hue), 0.42, 0.36), lite = new THREE.Color().setHSL(lerp(0.17, 0.22, hue), 0.55, 0.62), shade = new THREE.Color().setHSL(0.42, 0.3, 0.2);
  const C = canopy(kit, x, y, z, clumps, { kind: 'leaf', base, lite, shade, card: (o.proto ? 0.85 : 0.62) * Math.sqrt(s), dens: 1.5 * (o.cards || 700) / 700, crop: true, body: 0.86, inner: o.proto ? 0 : 0.12, local: 0.45, sway: 0.5, lo: o.proto });
  TREES.push({ x, z, r: C.ext, kind: 'green', y });
}

/* 黑松：弯曲的树干，枝端是一层层扁平的针叶团 */
function pineTree(x, z, s = 1, o = {}) {
  const y = o.y != null ? o.y : groundAt(x, z);
  const kit = new Kit(x, y, z, 0); const bark = new THREE.Color(0x5e4b3c);
  let p = [0, -0.3, 0]; let a = R(0, TAU); const pts = [p];
  for (let i = 0; i < 4; i++) { const np = [p[0] + Math.cos(a) * 0.6 * s, p[1] + 1.4 * s, p[2] + Math.sin(a) * 0.6 * s]; kit.rod('bark', p, np, 0.2 * s * (1 - i * 0.18), bark, { rt: 0.85, seg: 7 }); p = np; pts.push(np); a += R(-1.2, 1.2); }
  const clumps = [];
  for (let i = 1; i < pts.length; i++) {
    const nb = i === pts.length - 1 ? 1 : 2;
    for (let k = 0; k < nb; k++) {
      const ba = R(0, TAU), bl = (i === pts.length - 1 ? 0.3 : R(1.2, 2.2)) * s * (1 - i * 0.1);
      const e = [pts[i][0] + Math.cos(ba) * bl, pts[i][1] + R(-0.2, 0.3), pts[i][2] + Math.sin(ba) * bl];
      if (bl > 0.5) kit.rod('bark', pts[i], e, 0.07 * s, bark, { rt: 0.5, seg: 5 });
      clumps.push({ x: e[0], y: e[1] + 0.25 * s, z: e[2], r: R(1.0, 1.4) * s * (1 - i * 0.06), sq: 0.36 });
    }
  }
  canopy(kit, x, y, z, clumps, { kind: 'pine', base: new THREE.Color(0x3f5c48), lite: new THREE.Color(0x8aa874), shade: new THREE.Color(0x1f3436), card: (o.proto ? 0.8 : 0.6) * Math.sqrt(s), dens: o.proto ? 1.0 : 1.6, crop: true, body: 0.8, inner: o.proto ? 0 : 0.1, local: 0.6, sway: 0.3, lo: o.proto });
  TREES.push({ x, z, r: 2.5 * s, kind: 'pine', y });
}

/* 灌木（杜鹃、黄杨）：两三团贴地的叶簇，可带花 */
function shrub(x, z, s = 1, flowers = 0, y) {
  y = y != null ? y : groundAt(x, z);
  const kit = new Kit(x, y, z, 0);
  const clumps = []; const n = RI(2, 3);
  for (let i = 0; i < n; i++) { const a = R(0, TAU), d = R(0.15, 0.4) * s; clumps.push({ x: Math.cos(a) * d, y: 0.45 * s, z: Math.sin(a) * d, r: R(0.5, 0.65) * s, sq: 0.8 }); }
  canopy(kit, x, y, z, clumps, { kind: 'leaf', base: new THREE.Color(0x4f7a40), lite: new THREE.Color(0x9cc070), shade: new THREE.Color(0x24403a), card: 0.3, dens: 1.7, crop: true, body: 0.88, local: 0.5, sway: 0.15 });
  if (!BATCH_NOCHUNK) addCollider(x, z, 0.65 * s, 0.65 * s, 0, y, y + 0.9 * s, { round: true, noFloor: true });
  if (flowers) for (let i = 0; i < 22 * s; i++) { const th = R(0, TAU), u = R(0.1, 1), rr = Math.sqrt(1 - u * u) * 0.75 * s; WK.sph('vcNoShadow', x + Math.cos(th) * rr, y + 0.45 * s + u * 0.5 * s, z + Math.sin(th) * rr, 0.07, 0.05, 0.07, flowers, { lo: true }); }
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

/* ---------------- 实例化森林：少量原型树 × 数千实例 ---------------- */
function sugiTree(x, z, s = 1, o = {}) {
  const y = o.y != null ? o.y : groundAt(x, z); const kit = new Kit(x, y, z, 0); const H = 15 * s;
  kit.cyl('bark', 0, H * 0.45, 0, 0.32 * s, H * 0.9, 0x8a7060, { rt: 0.25, seg: 8 });
  // 杉：沿主干一层层的锥形针叶团
  const clumps = [];
  for (let h = 4.4 * s; h < H; h += 1.7 * s) {
    const t = (h - 4.4 * s) / (H - 4.4 * s); const r = lerp(2.5, 0.6, Math.pow(t, 0.9)) * s; const n = t > 0.6 ? 1 : 2; const a0 = R(0, TAU);
    for (let k = 0; k < n; k++) { const a = a0 + k * Math.PI, d = n > 1 ? r * 0.3 : 0; clumps.push({ x: Math.cos(a) * d, y: h, z: Math.sin(a) * d, r: n > 1 ? r * 0.82 : r, sq: 0.62 }); }
  }
  canopy(kit, x, y, z, clumps, { kind: 'pine', base: new THREE.Color(0x3c5a40), lite: new THREE.Color(0x7d9c64), shade: new THREE.Color(0x1c3032), card: 1.2 * s, dens: 0.8, crop: true, body: 0.86, local: 0.5, sway: 0.25, lo: o.proto });
  if (!o.proto) TREES.push({ x, z, r: 3 * s, kind: 'sugi', y });
}
const FOREST = { meshes: [] };
// 树干碰撞：所有单独种下的树（森林实例在 buildForest 里单独处理）
function addTreeColliders() {
  for (const t of TREES) { if (t.forest || t._col) continue; t._col = true;
    const r = t.giant ? 1.3 : clamp(t.r * 0.09, 0.16, 0.45);
    addCollider(t.x, t.z, r, r, 0, t.y - 0.5, t.y + 3.5, { round: true, noFloor: true }); }
}
function makeProto(fn) {
  const saved = CARD_STORE; CARD_STORE = new Map(); const savedTrees = TREES.length;
  const group = buildLocal(fn); const store = CARD_STORE; CARD_STORE = saved; TREES.length = savedTrees;
  const fol = [];
  for (const [kind, b] of store) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(b.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(b.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(b.col, 3)); g.setAttribute('sway', new THREE.Float32BufferAttribute(b.sway, 1));
    const idx = []; for (let q = 0; q < b.q; q++) { const o = q * 4; idx.push(o, o + 1, o + 2, o, o + 2, o + 3); } g.setIndex(idx); g.computeBoundingSphere();
    fol.push({ g, M: kind === 'sakura' ? SAK_M : kind === 'pine' ? PINE_M : LEAF_M });
  }
  const solids = []; group.children.forEach(m => solids.push({ g: m.geometry, m: m.material }));
  return { fol, solids };
}
function buildForest() {
  seed(99);
  const protos = {
    broad: [makeProto(() => greenTree(0, 0, 1.25, { y: 0, cards: 420, hue: 0.2, proto: true })), makeProto(() => greenTree(0, 0, 1.0, { y: 0, cards: 380, hue: 0.7, proto: true }))],
    sugi: [makeProto(() => sugiTree(0, 0, 1.0, { y: 0, proto: true })), makeProto(() => sugiTree(0, 0, 0.8, { y: 0, proto: true }))],
    pine: [makeProto(() => pineTree(0, 0, 1.1, { y: 0, proto: true }))],
  };
  const lists = { broad: [[], []], sugi: [[], []], pine: [[]] };
  let placed = 0;
  const trail = (typeof VIEW_TRAIL !== 'undefined' && VIEW_TRAIL) || [];
  for (let i = 0; i < 40000 && placed < 2400; i++) {
    const x = R(WORLD.x0 + 10, WORLD.x1 - 10), z = R(WORLD.z0 + 10, WORLD.z1 - 10); const c = islandC(x, z); if (c < 0.035) continue;
    if (x > -116 && x < 132 && z > -92 && z < 96) continue; // 镇区
    if (Math.abs(x + 40) < 25 && z < -100 && z > -151) continue; // 神社台地
    if (Math.hypot(x - CAPE.x, z - CAPE.z) < 20 || polyDist(CAPE_PATH, x, z) < 4.5) continue;
    if (FARM.paddy(x, z) || (x < -112 && x > -158 && z > -50 && z < 92)) continue;
    if (roadSample(x, z) > 0.02 || riverDist(x, z) < 11) continue;
    if (trail.length && polyDist(trail, x, z) < 3.2) continue;
    const h = terrainH(x, z); if (h < 2.2 || occNear(x, z, 3.4)) continue;
    const coast = c < 0.13; // 海岸防风林
    const dens = coast ? 0.75 : smooth(3.5, 12, h) * 0.95 + smooth(0.45, 0.7, fbm(x * 0.02 + 7, z * 0.02, 3)) * 0.3; if (rng() > dens) continue;
    const kind = coast ? 'pine' : (h > 16 ? (chance(0.6) ? 'sugi' : 'broad') : (chance(0.25) ? 'sugi' : 'broad'));
    const sc = R(0.8, 1.2) * (coast ? R(0.85, 1.1) : 1); const arr = lists[kind]; arr[RI(0, arr.length - 1)].push([x, h - 0.2, z, R(0, TAU), sc]);
    addCollider(x, z, (kind === 'sugi' ? 0.3 : 0.24) * sc, (kind === 'sugi' ? 0.3 : 0.24) * sc, 0, h - 0.5, h + 4, { round: true, noFloor: true });
    placed++;
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (const kind in protos) protos[kind].forEach((proto, pi) => {
    const L = lists[kind][pi]; if (!L.length) return;
    const parts = proto.solids.map(s => ({ g: s.g, m: s.m, solid: true })).concat(proto.fol.map(f => ({ g: f.g, m: f.M.m, depth: f.M.depth })));
    for (const part of parts) {
      const im = new THREE.InstancedMesh(part.g, part.m, L.length);
      L.forEach((t, k) => { q.setFromAxisAngle(up, t[3]); ps.set(t[0], t[1], t[2]); sc.setScalar(t[4]); m4.compose(ps, q, sc); im.setMatrixAt(k, m4); });
      im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.castShadow = true; im.receiveShadow = true; if (part.depth) im.customDepthMaterial = part.depth;
      im.userData.total = L.length; scene.add(im); FOREST.meshes.push(im);
    }
    for (const t of L) TREES.push({ x: t[0], z: t[2], r: 2.5 * t[4], kind, y: t[1], forest: true });
  });
  applyForestQuality();
}
function applyForestQuality() { for (const m of FOREST.meshes) { m.count = Math.max(1, Math.floor(m.userData.total * Q.forest)); m.castShadow = Q.shadow >= 4096; } }
