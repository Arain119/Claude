/* ==========================================================================
   材质与程序化纹理
   ========================================================================== */
function stdMat(o) { return new THREE.MeshStandardMaterial(Object.assign({ vertexColors: true, roughness: 0.9, metalness: 0 }, o)); }
/* tint：顶点色对照片纹理的染色强度（0 = 保持照片原色，1 = 完全染色） */
function regMat(key, material, extra = {}) { MATS[key] = Object.assign({ material, tint: 1 }, extra); return material; }

/* --- 照片纹理（由生图 API 生成，构建时加载；法线贴图由亮度实时推导） --- */
const PHOTOS = [];
function photo(name, o = {}) {
  const t = new THREE.Texture(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = MAX_ANISO; t.encoding = o.data ? THREE.LinearEncoding : THREE.sRGBEncoding;
  const entry = { name, tex: t, file: o.file || (name + '.jpg'), normal: null, nStrength: o.normal || 0 };
  if (o.normal) { entry.normal = new THREE.Texture(); entry.normal.wrapS = entry.normal.wrapT = THREE.RepeatWrapping; entry.normal.anisotropy = MAX_ANISO; }
  PHOTOS.push(entry); t._entry = entry; return t;
}
function normalFromImage(img, strength) {
  const w = Math.min(512, img.width), h = Math.min(512, img.height); const c = makeCanvas(w, h); const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
  const src = g.getImageData(0, 0, w, h).data; const L = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) L[i] = (src[i * 4] * 0.3 + src[i * 4 + 1] * 0.59 + src[i * 4 + 2] * 0.11) / 255;
  const out = g.createImageData(w, h); const d = out.data; const at = (x, y) => L[((y + h) % h) * w + ((x + w) % w)];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
    const dy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
    let nx = -dx * strength, ny = dy * strength, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const i = (y * w + x) * 4; d[i] = (nx * 0.5 + 0.5) * 255; d[i + 1] = (ny * 0.5 + 0.5) * 255; d[i + 2] = (nz * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  g.putImageData(out, 0, 0); return c;
}
function loadImage(url) { return new Promise((res, rej) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = () => rej(new Error('无法加载 ' + url)); im.src = url; }); }
async function loadPhotos(onProgress) {
  let n = 0;
  await Promise.all(PHOTOS.map(async (e) => {
    const img = await loadImage(ASSET_BASE + 'tex/' + e.file);
    e.tex.image = img; e.tex.needsUpdate = true;
    if (e.normal) { e.normal.image = normalFromImage(img, e.nStrength); e.normal.needsUpdate = true; }
    onProgress && onProgress(++n / PHOTOS.length);
  }));
}
const TEX = {
  plaster: photo('plaster', { normal: 1.2 }), siding: photo('siding', { normal: 2.0 }), brick: photo('brick', { normal: 2.5 }), tile: photo('tilewall', { normal: 2.0 }),
  wood: photo('planks', { normal: 2.0 }), woodwall: photo('woodwall', { normal: 2.0 }), roof: photo('roof', { normal: 3.0 }), metal: photo('metalroof', { normal: 3.0 }),
  concrete: photo('concrete', { normal: 1.5 }), asphalt: photo('asphalt', { normal: 2.0 }), paving: photo('sidewalk', { normal: 2.5 }), gravel: photo('gravel', { normal: 3.0 }),
  ballast: photo('ballast', { normal: 3.0 }), stone: photo('stonewall', { normal: 3.0 }), grass: photo('grass', { normal: 1.0 }), sand: photo('sand', { normal: 1.5 }),
  ground: photo('ground', { normal: 2.0 }), rock: photo('rock', { normal: 3.0 }), paddy: photo('paddy'), bark: photo('bark', { normal: 3.0 }),
  sakura: photo('sakura', { file: 'sakura.png' }), leaves: photo('leaves', { file: 'leaves.png' }), pine: photo('pine', { file: 'pine.png' }),
};
const N = (t) => t._entry && t._entry.normal;
TEX.tactile = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#e9b800'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h);
  for (let i = 0; i < 4; i++) { g.fillStyle = '#ffd21f'; g.fillRect(i * 32 + 12, 8, 8, h - 16); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(i * 32 + 20, 8, 2, h - 16); }
}, { repeat: true });
const pm = (map, o = {}) => { const { ns = 0.8, ...rest } = o; const m = stdMat(Object.assign({ map, normalScale: new THREE.Vector2(ns, ns) }, rest)); if (N(map)) m.normalMap = N(map); return m; };

regMat('vc', stdMat({ roughness: 0.85 }));
regMat('vcNoShadow', stdMat({ roughness: 0.85 }), { cast: false });
regMat('blob', stdMat({ emissive: 0x2a1a1e }));
regMat('paint', stdMat({ roughness: 0.35, metalness: 0.15, envMapIntensity: 1.2 }));
regMat('chrome', stdMat({ roughness: 0.2, metalness: 0.9, envMapIntensity: 1.3 }));
regMat('plaster', pm(TEX.plaster, { roughness: 0.92 }), { tint: 0.9 });
regMat('siding', pm(TEX.siding, { roughness: 0.8 }), { tint: 0.75 });
regMat('brick', pm(TEX.brick, { roughness: 0.9 }), { tint: 0.25 });
regMat('tile', pm(TEX.tile, { roughness: 0.55 }), { tint: 0.5 });
regMat('wood', pm(TEX.wood, { roughness: 0.85 }), { tint: 0.55 });
regMat('woodwall', pm(TEX.woodwall, { roughness: 0.85 }), { tint: 0.4 });
regMat('roof', pm(TEX.roof, { roughness: 0.5, envMapIntensity: 1.1 }), { tint: 0.45 });
regMat('metal', pm(TEX.metal, { roughness: 0.45, metalness: 0.45 }), { tint: 0.6 });
regMat('concrete', pm(TEX.concrete, { roughness: 0.92 }), { tint: 0.35 });
regMat('asphalt', pm(TEX.asphalt, { roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), { cast: false, tint: 0 });
regMat('paving', pm(TEX.paving, { roughness: 0.9 }), { cast: false, tint: 0.25 });
regMat('tactile', stdMat({ map: TEX.tactile, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), { cast: false });
regMat('gravel', pm(TEX.gravel, { roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), { cast: false, tint: 0.2 });
regMat('ballast', pm(TEX.ballast, { roughness: 1 }), { cast: false, tint: 0 });
regMat('stone', pm(TEX.stone, { roughness: 0.92 }), { tint: 0.3 });
regMat('sandMat', pm(TEX.sand, { roughness: 1 }), { cast: false, tint: 0.2 });
regMat('rockMat', pm(TEX.rock, { roughness: 0.95 }), { tint: 0.3 });
regMat('paddyMat', stdMat({ map: TEX.paddy, roughness: 0.25, envMapIntensity: 1.4 }), { cast: false, tint: 0 });
regMat('glass', new THREE.MeshStandardMaterial({ color: lin(0xa9c4cf), roughness: 0.03, metalness: 0.1, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.6 }), { cast: false, receive: false });
/* 发光体（灯泡、灯笼）：夜里亮度超过 1，交给辉光 */
const glowMat = regMat('glow', new THREE.MeshBasicMaterial({ vertexColors: true, color: 0xcfcfcf }), { cast: false, receive: false });
/* 道路标线 */
regMat('paint2d', stdMat({ transparent: true, alphaTest: 0.4, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, depthWrite: false }), { cast: false });

/* --- 窗户图集：白天 map + 夜晚 emissiveMap --- */
const WIN_N = 4; // 4×4
const winDay = makeCanvas(1024, 1024), winNight = makeCanvas(1024, 1024);
(function drawWindows() {
  const gd = winDay.getContext('2d'), gn = winNight.getContext('2d');
  gn.fillStyle = '#000'; gn.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 16; i++) {
    const cx = (i % 4) * 256, cy = Math.floor(i / 4) * 256; const kind = i % 8; const lit = i < 12;
    // 白天：天空反射
    const gr = gd.createLinearGradient(cx, cy, cx + 256, cy + 256);
    gr.addColorStop(0, '#3b4650'); gr.addColorStop(0.5, '#2a333b'); gr.addColorStop(1, '#1d242a');
    gd.fillStyle = gr; gd.fillRect(cx, cy, 256, 256);
    
    // 夜晚：暖光
    if (lit) { const ng = gn.createRadialGradient(cx + 128, cy + 90, 10, cx + 128, cy + 128, 200); const warm = ['#ffd58a', '#ffe6b0', '#ffc878', '#fff0cf'][i % 4]; ng.addColorStop(0, warm); ng.addColorStop(1, '#b8743a'); gn.fillStyle = ng; gn.fillRect(cx, cy, 256, 256); }
    const curtain = ['#f4e3c8', '#e8c9c9', '#cfe0d0', '#ffffff', '#d8d0ea', '#f0d9a8', '#cfd8e0', '#f5f5f0'][kind];
    const both = (fn) => { fn(gd, false); fn(gn, true); };
    if (kind === 0 || kind === 4) both((g, n) => { g.fillStyle = n ? 'rgba(120,60,20,0.55)' : curtain; g.fillRect(cx, cy, 70, 256); g.fillRect(cx + 186, cy, 70, 256); });
    if (kind === 1 || kind === 5) both((g, n) => { for (let y = 0; y < 256; y += 14) { g.fillStyle = n ? 'rgba(90,50,20,0.45)' : 'rgba(250,250,245,0.92)'; g.fillRect(cx, cy + y, 256, 9); } });
    if (kind === 2) both((g, n) => { g.fillStyle = n ? 'rgba(60,30,10,0.7)' : '#5c8a4a'; for (let k = 0; k < 7; k++) { g.beginPath(); g.ellipse(cx + 60 + k * 22, cy + 200 - (k % 3) * 18, 22, 30, 0, 0, TAU); g.fill(); } g.fillStyle = n ? 'rgba(60,30,10,0.8)' : '#b0704a'; g.fillRect(cx + 50, cy + 220, 160, 36); });
    if (kind === 3) both((g, n) => { g.fillStyle = n ? 'rgba(255,240,210,0.6)' : 'rgba(255,255,255,0.75)'; g.fillRect(cx, cy, 256, 256); });
    if (kind === 6) both((g, n) => { g.fillStyle = n ? 'rgba(80,40,20,0.6)' : curtain; g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + 120, cy + 120, cx + 30, cy + 256); g.lineTo(cx, cy + 256); g.fill(); g.beginPath(); g.moveTo(cx + 256, cy); g.quadraticCurveTo(cx + 136, cy + 120, cx + 226, cy + 256); g.lineTo(cx + 256, cy + 256); g.fill(); });
    if (kind === 7) both((g, n) => { g.fillStyle = n ? 'rgba(70,40,20,0.5)' : 'rgba(255,255,255,0.8)'; g.fillRect(cx, cy, 256, 120); if (!n) { g.fillStyle = '#e2b7c0'; g.beginPath(); g.arc(cx + 70, cy + 190, 26, 0, TAU); g.fill(); } });
    // 窗格
    both((g, n) => { g.fillStyle = n ? '#2a1c12' : '#e9e6df'; g.fillRect(cx + 124, cy, 8, 256); g.fillRect(cx, cy, 256, 6); g.fillRect(cx, cy + 250, 256, 6); g.fillRect(cx, cy, 6, 256); g.fillRect(cx + 250, cy, 6, 256); });
  }
})();
const TEX_WIN = new THREE.CanvasTexture(winDay); TEX_WIN.anisotropy = MAX_ANISO; TEX_WIN.encoding = THREE.sRGBEncoding;
const TEX_WIN_N = new THREE.CanvasTexture(winNight); TEX_WIN_N.encoding = THREE.sRGBEncoding;
const winMat = regMat('win', new THREE.MeshStandardMaterial({ vertexColors: true, map: TEX_WIN, emissiveMap: TEX_WIN_N, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.04, metalness: 0.2, envMapIntensity: 1.8 }), { cast: false });
function winUV(i) { const cx = i % 4, cy = Math.floor(i / 4); const e = 0.004; return [cx / 4 + e, 1 - (cy + 1) / 4 + e, (cx + 1) / 4 - e, 1 - cy / 4 - e]; }

/* --- 招牌图集（动态装箱） --- */
const SIGN_W = 4096, SIGN_H = 3072;
const signCanvas = makeCanvas(SIGN_W, SIGN_H); const sg = signCanvas.getContext('2d');
sg.fillStyle = '#777'; sg.fillRect(0, 0, SIGN_W, SIGN_H);
const signPack = { shelves: [], y: 0 };
/* 按高度分层的货架装箱：高度相近的条目放在同一层，减少浪费 */
function allocSign(w, h, draw) {
  w = Math.ceil(w); h = Math.ceil(h);
  let sh = signPack.shelves.find(s => h <= s.h && h >= s.h * 0.6 && s.x + w + 2 <= SIGN_W);
  if (!sh) {
    if (signPack.y + h > SIGN_H) { console.warn('sign atlas full'); signPack.shelves = []; signPack.y = 0; }
    sh = { y: signPack.y, h, x: 0 }; signPack.shelves.push(sh); signPack.y += h + 2;
  }
  const x = sh.x, y = sh.y; sh.x += w + 2;
  sg.save(); sg.translate(x, y); sg.beginPath(); sg.rect(0, 0, w, h); sg.clip(); draw(sg, w, h); sg.restore();
  return [x / SIGN_W, 1 - (y + h) / SIGN_H, (x + w) / SIGN_W, 1 - y / SIGN_H];
}
const TEX_SIGN = new THREE.CanvasTexture(signCanvas); TEX_SIGN.anisotropy = MAX_ANISO; TEX_SIGN.encoding = THREE.sRGBEncoding;
const signMat = regMat('sign', new THREE.MeshStandardMaterial({ vertexColors: true, map: TEX_SIGN, emissiveMap: TEX_SIGN, emissive: 0xffffff, emissiveIntensity: 0.0, roughness: 0.6, metalness: 0 }));
const signCutMat = regMat('signCut', new THREE.MeshStandardMaterial({ vertexColors: true, map: TEX_SIGN, alphaTest: 0.5, transparent: false, side: THREE.DoubleSide, roughness: 0.8, metalness: 0 }));
// 透明招牌需要带 alpha 的画布：图集底色设为透明区域时使用 clearRect
function allocSignAlpha(w, h, draw) { return allocSign(w, h, (g, W, H) => { g.clearRect(0, 0, W, H); draw(g, W, H); }); }

/* --- 遮阳篷图集：上 3/4 为斜面条纹，下 1/4 为扇形垂边 --- */
const AWN_SCHEMES = [['#d9483b', '#fff6ea'], ['#2f7d5b', '#f6f1e3'], ['#2c5aa0', '#f4f4f0'], ['#e98a2b', '#fff3d9'], ['#7a4b33', '#efe0c6'], ['#e48fa6', '#fff6f6'], ['#26375e', '#eef0f4'], ['#e8c33a', '#fffbe8'], ['#2a8f8f', '#f0fbf8'], ['#8d3b5a', '#f9eef2']];
const awnCanvas = makeCanvas(512, 1280);
(function drawAwnings() {
  const g = awnCanvas.getContext('2d'); g.clearRect(0, 0, 512, 1280);
  AWN_SCHEMES.forEach((s, i) => {
    const y0 = i * 128;
    for (let x = 0; x < 512; x += 32) { g.fillStyle = (x / 32) % 2 ? s[1] : s[0]; g.fillRect(x, y0, 32, 92); }
    const shade = g.createLinearGradient(0, y0, 0, y0 + 92); shade.addColorStop(0, 'rgba(0,0,0,0.12)'); shade.addColorStop(1, 'rgba(255,255,255,0.05)'); g.fillStyle = shade; g.fillRect(0, y0, 512, 92);
    // 垂边
    for (let x = 0; x < 512; x += 32) {
      g.fillStyle = (x / 32) % 2 ? s[1] : s[0];
      g.beginPath(); g.moveTo(x, y0 + 96); g.lineTo(x + 32, y0 + 96); g.lineTo(x + 32, y0 + 112); g.arc(x + 16, y0 + 112, 16, 0, Math.PI); g.closePath(); g.fill();
    }
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, y0 + 96, 512, 3);
  });
})();
const TEX_AWN = new THREE.CanvasTexture(awnCanvas); TEX_AWN.anisotropy = MAX_ANISO; TEX_AWN.encoding = THREE.sRGBEncoding; TEX_AWN.wrapS = THREE.RepeatWrapping;
regMat('awning', new THREE.MeshStandardMaterial({ vertexColors: true, map: TEX_AWN, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85, metalness: 0 }), { depth: new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: TEX_AWN, alphaTest: 0.5 }) });
function awnUV(i, part, rep) { const y0 = i * 128; if (part === 0) return [0, 1 - (y0 + 92) / 1280, rep, 1 - y0 / 1280]; return [0, 1 - (y0 + 128) / 1280, rep, 1 - (y0 + 96) / 1280]; }

/* --- 光晕精灵（夜间） --- */
const TEX_HALO = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.25, 'rgba(255,210,140,0.55)'); gr.addColorStop(1, 'rgba(255,180,100,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const haloGroup = new THREE.Group(); scene.add(haloGroup);
const HALOS = [];
const haloMatProto = new THREE.SpriteMaterial({ map: TEX_HALO, color: 0xffd9a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
/* 使用点精灵批量绘制光晕 */
const haloPos = [], haloCol = [], haloSize = [];
function addHalo(x, y, z, size = 2.2, color = 0xffd49a) { const c = new THREE.Color(color); haloPos.push(x, y, z); haloCol.push(c.r, c.g, c.b); haloSize.push(size); }
let haloPoints = null;
function buildHalos() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(haloPos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(haloCol, 3));
  g.setAttribute('size', new THREE.Float32BufferAttribute(haloSize, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { map: { value: TEX_HALO }, night: { value: 0 }, scale: { value: 600 } },
    vertexShader: `attribute float size; attribute vec3 color; varying vec3 vC; varying float vF; uniform float scale;
      void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv; float d=-mv.z; gl_PointSize=clamp(size*scale/d,0.0,160.0); vF=smoothstep(600.0,150.0,d);} `,
    fragmentShader: `uniform sampler2D map; uniform float night; varying vec3 vC; varying float vF; void main(){ vec4 t=texture2D(map,gl_PointCoord); gl_FragColor=vec4(vC*t.rgb, t.a*night*vF); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  haloPoints = new THREE.Points(g, m); haloPoints.frustumCulled = false; haloPoints.renderOrder = 5; scene.add(haloPoints);
}

/* --- 夜间地面光斑（廉价的路灯投光） --- */
const POOLS = { pos: [], mat: null };
function addLightPool(x, y, z, r = 6, col = 0xffd8a0) { POOLS.pos.push([x, y, z, r, new THREE.Color(col)]); }
function buildPools() {
  const tex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }, { data: true });
  const pos = [], uv = [], col = [], idx = [];
  for (const [x, y, z, r, c] of POOLS.pos) { const b = pos.length / 3; for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { const px = x + (u - 0.5) * 2 * r, pz = z + (v - 0.5) * 2 * r; pos.push(px, groundAt(px, pz, y + 1) + 0.06, pz); uv.push(u, v); col.push(c.r, c.g, c.b); } idx.push(b, b + 2, b + 1, b, b + 3, b + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
  POOLS.mat = new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6, fog: true });
  const m = new THREE.Mesh(g, POOLS.mat); m.renderOrder = 3; m.frustumCulled = false; scene.add(m);
}
/* --- 电线 --- */
const wirePos = [];
function addWire(a, b, sag = 0.6, seg = 10) {
  for (let i = 0; i < seg; i++) {
    const t0 = i / seg, t1 = (i + 1) / seg;
    const p = (t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t) - Math.sin(t * Math.PI) * sag, lerp(a[2], b[2], t)];
    wirePos.push(...p(t0), ...p(t1));
  }
}
function buildWires() {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(wirePos, 3));
  const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x2b2a33, transparent: true, opacity: 0.85 })); l.frustumCulled = false; scene.add(l);
}
