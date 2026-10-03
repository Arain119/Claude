/* ==========================================================================
   材质与程序化纹理
   ========================================================================== */
function stdMat(o) { return new THREE.MeshStandardMaterial(Object.assign({ vertexColors: true, roughness: 0.9, metalness: 0 }, o)); }
function regMat(key, material, extra = {}) { MATS[key] = Object.assign({ material }, extra); return material; }

/* --- 平铺纹理（灰度为主，由顶点色染色） --- */
const TEX = {};
TEX.plaster = canvasTex(256, 256, (g, w, h) => { noiseFill(g, w, h, 0xeeeeee, 0.09, 1.4, 3); }, { repeat: true });
TEX.siding = canvasTex(256, 256, (g, w, h) => {
  noiseFill(g, w, h, 0xf2f2f2, 0.05, 2, 5);
  for (let y = 0; y < h; y += 32) { g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(0, y, w, 3); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, y + 3, w, 2); }
}, { repeat: true });
TEX.brick = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#cfc6bd'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) {
    const x = c * 64 + (r % 2) * 32, y = r * 32; const k = 0.82 + hash2(r, c) * 0.25;
    g.fillStyle = `rgb(${255 * k | 0},${232 * k | 0},${222 * k | 0})`; g.fillRect(x + 3, y + 3, 58, 26);
  }
}, { repeat: true });
TEX.tile = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#d9d9d9'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) { const k = 0.9 + hash2(x + 40, y) * 0.12; g.fillStyle = `rgb(${250 * k | 0},${250 * k | 0},${250 * k | 0})`; g.fillRect(x * 32 + 1, y * 16 + 1, 30, 14); }
}, { repeat: true });
TEX.wood = canvasTex(256, 256, (g, w, h) => {
  for (let i = 0; i < 8; i++) { const k = 0.82 + hash2(i, 7) * 0.2; g.fillStyle = `rgb(${255 * k | 0},${245 * k | 0},${230 * k | 0})`; g.fillRect(0, i * 32, w, 32); g.fillStyle = 'rgba(60,30,10,0.25)'; g.fillRect(0, i * 32, w, 2); }
  g.globalAlpha = 0.12; for (let i = 0; i < 160; i++) { g.fillStyle = '#5a3a20'; g.fillRect(R(0, w), R(0, h), R(10, 60), 1); } g.globalAlpha = 1;
}, { repeat: true });
TEX.roof = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 32) { const gr = g.createLinearGradient(x, 0, x + 32, 0); gr.addColorStop(0, '#9a9a9a'); gr.addColorStop(0.45, '#ffffff'); gr.addColorStop(1, '#8a8a8a'); g.fillStyle = gr; g.fillRect(x, 0, 32, h); }
  for (let y = 0; y < h; y += 42) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, y, w, 4); }
}, { repeat: true });
TEX.metal = canvasTex(128, 128, (g, w, h) => {
  for (let x = 0; x < w; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, '#b8b8b8'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, '#a8a8a8'); g.fillStyle = gr; g.fillRect(x, 0, 16, h); }
}, { repeat: true });
TEX.concrete = canvasTex(256, 256, (g, w, h) => { noiseFill(g, w, h, 0xdadada, 0.12, 2.2, 11); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h); }, { repeat: true });
TEX.asphalt = canvasTex(256, 256, (g, w, h) => {
  noiseFill(g, w, h, 0x8a8c92, 0.1, 3, 17);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${hash2(i, 1) > 0.5 ? '255,255,255' : '0,0,0'},0.12)`; g.fillRect(R(0, w), R(0, h), 2, 2); }
}, { repeat: true });
TEX.paving = canvasTex(256, 256, (g, w, h) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    const k = 0.86 + hash2(x + 3, y + 9) * 0.16; g.fillStyle = `rgb(${255 * k | 0},${250 * k | 0},${244 * k | 0})`; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
  }
  g.fillStyle = 'rgba(120,110,105,0.22)'; for (let i = 0; i <= 4; i++) { g.fillRect(i * 64 - 1, 0, 2, h); g.fillRect(0, i * 64 - 1, w, 2); }
}, { repeat: true });
TEX.tactile = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#f1c400'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h);
  for (let i = 0; i < 4; i++) { g.fillStyle = '#ffde4a'; g.fillRect(i * 32 + 12, 8, 8, h - 16); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(i * 32 + 20, 8, 2, h - 16); }
}, { repeat: true });
TEX.gravel = canvasTex(256, 256, (g, w, h) => {
  noiseFill(g, w, h, 0xd8d2c8, 0.06, 3, 23);
  for (let i = 0; i < 2600; i++) { const k = 0.7 + hash2(i, 3) * 0.45; g.fillStyle = `rgb(${245 * k | 0},${238 * k | 0},${228 * k | 0})`; g.beginPath(); g.ellipse(R(0, w), R(0, h), R(1, 3), R(1, 2.5), R(0, 3), 0, TAU); g.fill(); }
}, { repeat: true });
TEX.ballast = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#8a8580'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 3500; i++) { const k = 0.6 + hash2(i, 13) * 0.6; g.fillStyle = `rgb(${190 * k | 0},${180 * k | 0},${172 * k | 0})`; g.fillRect(R(0, w), R(0, h), R(2, 5), R(2, 4)); }
}, { repeat: true });
TEX.stone = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#9c968e'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 6; r++) for (let c = -1; c < 5; c++) {
    const x = c * 60 + (r % 2) * 30 + R(-4, 4), y = r * 44 + R(-3, 3); const k = 0.85 + hash2(r + 5, c) * 0.25;
    g.fillStyle = `rgb(${236 * k | 0},${232 * k | 0},${224 * k | 0})`; rrect(g, x + 3, y + 3, 54, 38, 8); g.fill();
  }
}, { repeat: true });
TEX.grass = canvasTex(256, 256, (g, w, h) => {
  noiseFill(g, w, h, 0xe8e8e8, 0.16, 1.2, 31);
  for (let i = 0; i < 1600; i++) { g.strokeStyle = `rgba(${hash2(i, 9) > 0.5 ? '255,255,255' : '60,90,30'},0.25)`; const x = R(0, w), y = R(0, h); g.beginPath(); g.moveTo(x, y); g.lineTo(x + R(-2, 2), y - R(3, 8)); g.stroke(); }
}, { repeat: true });
TEX.sand = canvasTex(256, 256, (g, w, h) => {
  noiseFill(g, w, h, 0xf2ece0, 0.07, 2, 41);
  for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(${hash2(i, 5) > 0.5 ? '255,255,255' : '120,100,80'},0.2)`; g.fillRect(R(0, w), R(0, h), 1.5, 1.5); }
}, { repeat: true });

regMat('vc', stdMat({}));
regMat('vcNoShadow', stdMat({}), { cast: false });
regMat('blob', stdMat({ emissive: 0x3a2228 }));
regMat('paint', stdMat({ roughness: 0.45 }));
regMat('plaster', stdMat({ map: TEX.plaster }));
regMat('siding', stdMat({ map: TEX.siding }));
regMat('brick', stdMat({ map: TEX.brick }));
regMat('tile', stdMat({ map: TEX.tile }));
regMat('wood', stdMat({ map: TEX.wood }));
regMat('roof', stdMat({ map: TEX.roof, roughness: 0.7 }));
regMat('metal', stdMat({ map: TEX.metal, roughness: 0.55 }));
regMat('concrete', stdMat({ map: TEX.concrete }));
regMat('asphalt', stdMat({ map: TEX.asphalt, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), { cast: false });
regMat('paving', stdMat({ map: TEX.paving }), { cast: false });
regMat('tactile', stdMat({ map: TEX.tactile, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), { cast: false });
regMat('gravel', stdMat({ map: TEX.gravel, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), { cast: false });
regMat('ballast', stdMat({ map: TEX.ballast }), { cast: false });
regMat('stone', stdMat({ map: TEX.stone }));
regMat('sandMat', stdMat({ map: TEX.sand }), { cast: false });
regMat('glass', new THREE.MeshStandardMaterial({ color: 0xbfe0ee, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }), { cast: false, receive: false });
/* 发光体（灯泡、灯笼）：夜里提亮 */
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
    gr.addColorStop(0, '#d9ecf6'); gr.addColorStop(0.45, '#8fb2c8'); gr.addColorStop(0.55, '#a9c6d6'); gr.addColorStop(1, '#5e7d92');
    gd.fillStyle = gr; gd.fillRect(cx, cy, 256, 256);
    gd.fillStyle = 'rgba(255,255,255,0.35)'; gd.beginPath(); gd.moveTo(cx + 30, cy + 256); gd.lineTo(cx + 120, cy); gd.lineTo(cx + 150, cy); gd.lineTo(cx + 60, cy + 256); gd.fill();
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
const TEX_WIN = new THREE.CanvasTexture(winDay); TEX_WIN.anisotropy = MAX_ANISO;
const TEX_WIN_N = new THREE.CanvasTexture(winNight);
const winMat = regMat('win', new THREE.MeshStandardMaterial({ vertexColors: true, map: TEX_WIN, emissiveMap: TEX_WIN_N, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.25, metalness: 0 }), { cast: false });
function winUV(i) { const cx = i % 4, cy = Math.floor(i / 4); const e = 0.004; return [cx / 4 + e, 1 - (cy + 1) / 4 + e, (cx + 1) / 4 - e, 1 - cy / 4 - e]; }

/* --- 招牌图集（动态装箱） --- */
const SIGN_W = 4096, SIGN_H = 2048;
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
const TEX_SIGN = new THREE.CanvasTexture(signCanvas); TEX_SIGN.anisotropy = MAX_ANISO;
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
const TEX_AWN = new THREE.CanvasTexture(awnCanvas); TEX_AWN.anisotropy = MAX_ANISO; TEX_AWN.wrapS = THREE.RepeatWrapping;
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
