/* ==========================================================================
   动漫角色：赛璐璐着色 + 描边，Canvas 绘制可眨眼的脸，独立发丝刘海，多种发型与服装
   ========================================================================== */
const TOON_GRAD = (() => { const d = new Uint8Array([105, 105, 105, 255, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RGBFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })();
const toonMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0, envMapIntensity: 0.7 });
const OUTLINE_U = { uOutline: { value: 0.012 } };
const outlineMat = new THREE.MeshBasicMaterial({ color: 0x2e2228, side: THREE.BackSide });
outlineMat.onBeforeCompile = (sh) => { sh.uniforms.uOutline = OUTLINE_U.uOutline; sh.vertexShader = 'uniform float uOutline;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(normal) * uOutline;'); };
const CHARS = [];

/* --- 小型合并器 --- */
class Parts {
  constructor() { this.p = []; this.n = []; this.c = []; this.i = []; this.k = 0; }
  add(geo, m, col) {
    const P = geo.attributes.position, N = geo.attributes.normal; const nm = new THREE.Matrix3().getNormalMatrix(m); const c = new THREE.Color(col).convertSRGBToLinear(); const b = this.k;
    for (let i = 0; i < P.count; i++) { _v.fromBufferAttribute(P, i).applyMatrix4(m); this.p.push(_v.x, _v.y, _v.z); _v2.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); this.n.push(_v2.x, _v2.y, _v2.z); this.c.push(c.r, c.g, c.b); }
    if (geo.index) for (const ix of geo.index.array) this.i.push(b + ix); else for (let i = 0; i < P.count; i++) this.i.push(b + i);
    this.k += P.count; return this;
  }
  box(w, h, d, x, y, z, col, rx = 0, ry = 0, rz = 0) { return this.add(G.box, MX(x, y, z, ry, w, h, d, rx, rz), col); }
  cyl(rt, rb, h, x, y, z, col, seg = 10, rx = 0, rz = 0, sz = 1) { return this.add(taper(rt, rb, seg), MX(x, y, z, 0, 1, h, sz, rx, rz), col); }
  sph(rx, ry, rz, x, y, z, col, seg = 1) { return this.add(seg ? G.sph16 : G.sph, MX(x, y, z, 0, rx, ry, rz), col); }
  geo(g, x, y, z, col, o = {}) { return this.add(g, MX(x, y, z, o.ry || 0, o.sx || 1, o.sy || 1, o.sz || 1, o.rx || 0, o.rz || 0), col); }
  build() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setIndex(this.i); g.computeBoundingSphere(); return g; }
}
/* 渐细发丝 */
function strandGeo(pts, w0, w1, flat = 0.5) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
  const seg = 7, rad = 4; const g = new THREE.TubeGeometry(curve, seg, 1, rad, false);
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    const ring = Math.floor(i / (rad + 1)); const t = ring / seg; const c = curve.getPointAt(Math.min(1, t));
    const w = lerp(w0, w1, Math.pow(t, 0.8));
    const ox = P.getX(i) - c.x, oy = P.getY(i) - c.y, oz = P.getZ(i) - c.z;
    // 压扁：沿径向（离头心方向）缩小
    const L = Math.hypot(c.x, c.y * 0.3, c.z) || 1; const nx = c.x / L, nz = c.z / L; const dot = ox * nx + oz * nz;
    P.setXYZ(i, c.x + (ox - nx * dot * (1 - flat)) * w, c.y + oy * w, c.z + (oz - nz * dot * (1 - flat)) * w);
  }
  g.computeVertexNormals(); return g;
}
const sp = (r, th, a, k = 1) => [r * k * Math.sin(th) * Math.sin(a), r * k * Math.cos(th), r * k * Math.sin(th) * Math.cos(a)];

/* --- 脸部纹理（两帧：睁眼 / 闭眼） --- */
function faceTexture(o) {
  return canvasTex(512, 256, (g) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 256;
      g.fillStyle = o.skinCss; g.fillRect(ox, 0, 256, 256);
      // 立体感：脸颊与鼻梁的柔和明暗
      const sh = g.createRadialGradient(ox + 128, 150, 30, ox + 128, 160, 150); sh.addColorStop(0, 'rgba(255,240,230,0.18)'); sh.addColorStop(1, 'rgba(90,50,40,0.22)'); g.fillStyle = sh; g.fillRect(ox, 0, 256, 256);
      const eyeY = 146, sep = 36, ew = o.male ? 15 : 16, eh = o.male ? 6.5 : 7.5;
      // 眉毛
      g.strokeStyle = o.browCss; g.lineWidth = o.male ? 4.5 : 3.2; g.lineCap = 'round';
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(ox + 128 + s * (sep - 15), eyeY - 15); g.quadraticCurveTo(ox + 128 + s * (sep + 2), eyeY - 21, ox + 128 + s * (sep + 19), eyeY - 15); g.stroke(); }
      for (const s of [-1, 1]) {
        const ex = ox + 128 + s * sep;
        // 眼窝阴影
        g.fillStyle = 'rgba(120,70,60,0.16)'; g.beginPath(); g.ellipse(ex, eyeY - 2, ew + 6, eh + 6, 0, 0, TAU); g.fill();
        if (f === 0) {
          g.save(); g.beginPath(); g.moveTo(ex - ew, eyeY); g.quadraticCurveTo(ex - 2, eyeY - eh * 1.5, ex + ew, eyeY - 1); g.quadraticCurveTo(ex + 2, eyeY + eh * 1.1, ex - ew, eyeY); g.closePath(); g.clip();
          g.fillStyle = '#efe8e2'; g.fillRect(ex - ew - 2, eyeY - eh * 2, ew * 2 + 4, eh * 4);
          g.fillStyle = o.eyeCss; g.beginPath(); g.arc(ex + s * 0.5, eyeY - 0.5, eh * 1.05, 0, TAU); g.fill();
          g.fillStyle = '#0d0907'; g.beginPath(); g.arc(ex + s * 0.5, eyeY - 0.5, eh * 0.45, 0, TAU); g.fill();
          g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(ex - 2, eyeY - 3, 1.6, 0, TAU); g.fill();
          g.restore();
          g.strokeStyle = 'rgba(35,22,18,0.95)'; g.lineWidth = o.male ? 2.2 : 3; g.beginPath(); g.moveTo(ex - ew, eyeY); g.quadraticCurveTo(ex - 2, eyeY - eh * 1.55, ex + ew + 1, eyeY - 1); g.stroke();
          g.strokeStyle = 'rgba(110,60,50,0.35)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(ex - ew + 3, eyeY - eh * 1.5 - 3); g.quadraticCurveTo(ex, eyeY - eh * 2.2, ex + ew - 2, eyeY - eh * 1.4 - 2); g.stroke();
        } else {
          g.strokeStyle = 'rgba(35,22,18,0.9)'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(ex - ew, eyeY); g.quadraticCurveTo(ex, eyeY + 3, ex + ew, eyeY - 1); g.stroke();
        }
      }
      // 鼻
      g.fillStyle = 'rgba(120,70,55,0.22)'; g.beginPath(); g.ellipse(ox + 134, 172, 5, 16, 0.1, 0, TAU); g.fill();
      g.fillStyle = 'rgba(90,45,35,0.4)'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(ox + 128 + s * 6, 186, 3.2, 1.8, 0, 0, TAU); g.fill(); }
      // 嘴唇
      const lip = o.male ? 'rgba(160,90,80,0.75)' : 'rgba(190,95,95,0.85)';
      g.fillStyle = lip; g.beginPath(); g.moveTo(ox + 113, 207); g.quadraticCurveTo(ox + 121, 202, ox + 128, 204); g.quadraticCurveTo(ox + 135, 202, ox + 143, 207); g.quadraticCurveTo(ox + 128, 216, ox + 113, 207); g.fill();
      g.strokeStyle = 'rgba(90,40,35,0.6)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(ox + 114, 207); g.quadraticCurveTo(ox + 128, o.mouth === 1 ? 211 : 208, ox + 142, 207); g.stroke();
      if (o.glasses) { g.strokeStyle = '#2a2420'; g.lineWidth = 2.5; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(ox + 128 + s * sep, eyeY, ew + 7, eh + 8, 0, 0, TAU); g.stroke(); } g.beginPath(); g.moveTo(ox + 128 - sep + ew + 7, eyeY - 2); g.lineTo(ox + 128 + sep - ew - 7, eyeY - 2); g.stroke(); }
      if (o.wrinkle) { g.strokeStyle = 'rgba(110,60,50,0.35)'; g.lineWidth = 1.5; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(ox + 128 + s * 22, 192); g.quadraticCurveTo(ox + 128 + s * 30, 204, ox + 128 + s * 27, 216); g.stroke(); g.beginPath(); g.moveTo(ox + 128 + s * (sep + 16), eyeY + 4); g.lineTo(ox + 128 + s * (sep + 22), eyeY + 8); g.stroke(); } }
      if (o.male && !o.kid) { g.fillStyle = 'rgba(60,40,35,0.08)'; g.beginPath(); g.ellipse(ox + 128, 214, 34, 22, 0, 0, TAU); g.fill(); }
    }
  });
}

/* --- 角色构建 --- */
const SKINS = [0xe8c0a4, 0xdfb393, 0xd4a483, 0xecc8ae, 0xc8987a];
const HAIRS = [0x1c1714, 0x241c18, 0x2e231d, 0x3b2c22, 0x171515, 0x4a3628, 0x2a201c];
const EYES = [[0x3a2418, '#1c120c', '#3e2a1e', '#5a3e2c'], [0x2a2018, '#140e0a', '#33251b', '#4a3626'], [0x4a3020, '#22150e', '#4f3523', '#6b4a32'], [0x3a2a20, '#1a1410', '#3a2c22', '#55402f'], [0x2e2420, '#16100c', '#30241c', '#4a382b']];
function css(c) { return '#' + new THREE.Color(c).getHexString(); }
function makeCharacter(o) {
  o = Object.assign({ gender: 'f', age: 'teen', outfit: 'casual', hair: 'long', mouth: 0 }, o);
  { const M = CHAR_MODELS[lookToType(o)]; if (M) { const c = makeModelCharacter(M); c.o = o; return c; } }
  const male = o.gender === 'm', kid = o.age === 'kid', old = o.age === 'old';
  const S = o.scale || (kid ? 0.74 : o.age === 'adult' ? (male ? 1.06 : 1.0) : old ? 0.94 : (male ? 1.0 : 0.95));
  const skin = o.skin || pick(SKINS), hairC = o.hairCol != null ? o.hairCol : (old ? 0xd8d4cf : pick(HAIRS));
  const eye = o.eye || pick(EYES);
  const top = o.top != null ? o.top : pick([0xf4b8c8, 0x9fd2ee, 0xf6e08c, 0xc9e2b0, 0xffffff, 0xe8d6c0, 0xb8a8e0, 0xf39a3d]);
  const bottom = o.bottom != null ? o.bottom : pick([0x3d4f7a, 0x6b5a4a, 0xe8e2d6, 0x2f3a33, 0x8fa8c8]);
  const R0 = kid ? 0.112 : 0.106; // 头半径（写实比例约 7.5 头身）
  const root = new THREE.Group(); root.scale.setScalar(S);
  const meshes = [];
  const mk = (parts, parent, pos = [0, 0, 0]) => { const geo = parts.build(); const m = new THREE.Mesh(geo, toonMat); m.castShadow = true; m.receiveShadow = true; m.position.set(...pos); parent.add(m); meshes.push(m); return m; };
  const grp = (parent, pos) => { const g = new THREE.Group(); g.position.set(...pos); parent.add(g); return g; };
  const hipY = kid ? 0.6 : 0.9; const legL = hipY / 2 + 0.01;
  const hips = grp(root, [0, hipY, 0]);
  const spine = grp(hips, [0, 0.0, 0]);
  const torsoH = kid ? 0.36 : 0.5;
  const outfit = o.outfit;
  const C = {
    top: outfit === 'sailor' ? 0xf8f8f6 : outfit === 'blazer' ? (male ? 0x2a3550 : 0x2a3550) : outfit === 'miko' ? 0xfbfbf8 : outfit === 'messenger' ? 0xfbfbf6 : outfit === 'suit' ? 0x26375e : outfit === 'fisher' ? 0x3a5a7a : top,
    sleeve: outfit === 'sailor' ? 0xf8f8f6 : outfit === 'blazer' ? 0x2a3550 : outfit === 'messenger' ? 0xfbfbf6 : outfit === 'suit' ? 0x26375e : outfit === 'fisher' ? 0x3a5a7a : (o.sleeve != null ? o.sleeve : top),
    bottom: outfit === 'sailor' ? 0x26375e : outfit === 'blazer' ? (male ? 0x55585e : 0x6a5560) : outfit === 'miko' ? 0xd23a3a : outfit === 'messenger' ? 0x2f3d5e : outfit === 'suit' ? 0x26375e : outfit === 'fisher' ? 0x2a3a4a : bottom,
    shoe: outfit === 'fisher' ? 0xe2b42a : (outfit === 'sailor' || outfit === 'blazer' || outfit === 'messenger') ? 0x5a3a2a : pick([0xffffff, 0x5a3a2a, 0x2a2a2a, 0xd9483b]),
    sock: outfit === 'sailor' ? 0x26375e : outfit === 'blazer' ? 0xf4f4f0 : outfit === 'messenger' ? 0xffffff : skin,
  };
  const skirt = !male && (outfit === 'sailor' || outfit === 'blazer' || outfit === 'miko' || (outfit === 'casual' && o.skirt !== false && (o.skirt || chance(0.6))) || outfit === 'apron');
  // 骨盆
  const pv = new Parts();
  if (skirt) {
    const long = outfit === 'miko' || old; const len = long ? 0.62 : (kid ? 0.22 : 0.3);
    const sk = new THREE.CylinderGeometry(0.135, long ? 0.25 : 0.24, len, 20, 1, true); const P = sk.attributes.position;
    for (let i = 0; i < P.count; i++) { const a = Math.atan2(P.getZ(i), P.getX(i)); const k = 1 + (Math.round(a / (TAU / 20)) % 2 ? 0.07 : 0) * (P.getY(i) < 0 ? 1 : 0); P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k * 0.85); }
    sk.computeVertexNormals(); pv.geo(sk, 0, 0.06 - len / 2, 0, C.bottom);
    pv.add(new THREE.CircleGeometry(0.24, 20).rotateX(Math.PI / 2), MX(0, 0.06 - len + 0.002, 0, 0, long ? 1.04 : 1, 1, 0.85), new THREE.Color(C.bottom).multiplyScalar(0.6));
  } else pv.cyl(0.14, 0.13, 0.2, 0, 0.0, 0, C.bottom, 12, 0, 0, 0.8);
  pv.cyl(0.14, 0.14, 0.05, 0, 0.08, 0, outfit === 'blazer' || outfit === 'suit' ? 0x2a2a2a : C.bottom, 12, 0, 0, 0.8);
  if (outfit === 'apron' || o.apron) pv.box(0.3, 0.45, 0.02, 0, -0.15, 0.12, o.apronCol || 0xf6efe0);
  mk(pv, hips);
  // 躯干
  const tp = new Parts();
  tp.add(taper(male ? 0.17 : 0.15, 0.13, 14), MX(0, torsoH / 2 + 0.04, 0, 0, 1, torsoH, 0.72), C.top);
  if (!male && !kid) tp.sph(0.13, 0.08, 0.06, 0, torsoH * 0.62, 0.065, C.top);
  tp.sph(male ? 0.17 : 0.155, 0.06, 0.12, 0, torsoH + 0.03, 0, C.top);
  tp.cyl(0.045, 0.05, 0.1, 0, torsoH + 0.08, 0, skin, 8);
  if (outfit === 'sailor') {
    tp.box(0.32, 0.2, 0.02, 0, torsoH - 0.07, -0.105, 0x26375e, 0.1); tp.box(0.3, 0.012, 0.022, 0, torsoH - 0.14, -0.108, 0xffffff, 0.1);
    for (const s of [-1, 1]) tp.box(0.03, 0.2, 0.02, s * 0.07, torsoH - 0.05, 0.1, 0x26375e, -0.2, 0, s * 0.45);
    tp.sph(0.045, 0.035, 0.03, 0, torsoH - 0.12, 0.115, 0xd9483b, 0); tp.box(0.03, 0.12, 0.012, -0.02, torsoH - 0.2, 0.115, 0xd9483b, 0, 0, 0.2); tp.box(0.03, 0.12, 0.012, 0.02, torsoH - 0.2, 0.115, 0xd9483b, 0, 0, -0.2);
  } else if (outfit === 'blazer' || outfit === 'suit') {
    tp.box(0.09, 0.2, 0.02, 0, torsoH - 0.1, 0.106, 0xfbfbf8, -0.1); tp.box(0.03, 0.17, 0.012, 0, torsoH - 0.13, 0.118, male || outfit === 'suit' ? 0x8a2a3a : 0xd9483b, -0.1);
    if (outfit === 'blazer') tp.sph(0.03, 0.03, 0.01, 0.08, torsoH - 0.12, 0.11, 0xd9b45a, 0);
  } else if (outfit === 'messenger') {
    tp.box(0.3, torsoH * 0.82, 0.02, 0, torsoH * 0.5, 0.1, 0x3d6b45, -0.05); tp.box(0.09, torsoH * 0.6, 0.025, 0, torsoH * 0.55, 0.112, 0xfbfbf6, -0.05);
    tp.add(taper(0.06, 0.01, 3), MX(0, torsoH - 0.08, 0.12, 0, 1, 0.12, 0.3, Math.PI), 0xd9483b);
    tp.box(0.04, 0.6, 0.02, 0.0, torsoH * 0.55, 0.0, 0x7a4a2a, 0, 0, 0.75); // 斜挎带
  } else if (outfit === 'miko') {
    tp.box(0.02, 0.24, 0.01, 0.0, torsoH - 0.1, 0.112, 0xd23a3a, 0, 0, 0.3);
  } else if (outfit === 'fisher') {
    tp.box(0.3, 0.12, 0.01, 0, torsoH * 0.3, 0.105, 0xe2b42a);
  } else if (o.cardigan) { tp.box(0.1, torsoH * 0.8, 0.012, 0, torsoH * 0.5, 0.108, o.inner || 0xffffff); }
  if (outfit === 'apron' || o.apron) tp.box(0.24, torsoH * 0.55, 0.02, 0, torsoH * 0.35, 0.108, o.apronCol || 0xf6efe0);
  mk(tp, spine);
  // 头
  const head = grp(spine, [0, torsoH + 0.13 + R0 * 0.85, 0]);
  const hp = new Parts();
  hp.sph(R0, R0 * 1.06, R0 * 1.0, 0, 0, 0, skin);
  hp.sph(R0 * 0.6, R0 * 0.45, R0 * 0.6, 0, -R0 * 0.55, R0 * 0.28, skin);
  for (const s of [-1, 1]) hp.sph(0.025, 0.04, 0.02, s * R0 * 0.98, -0.01, 0, skin);
  // 头发
  const hc = hairC, hcD = new THREE.Color(hairC).multiplyScalar(0.8).getHex();
  hp.add(new THREE.SphereGeometry(R0 * 1.09, 22, 12, 0, TAU, 0, 1.3), MX(0, 0.012, -0.006), hc);
  const style = o.hair;
  // 刘海
  const nB = male ? 7 : 9;
  for (let i = 0; i < nB; i++) {
    const a = lerp(-0.95, 0.95, i / (nB - 1)) + R(-0.04, 0.04); const len = (male ? 1.2 : 1.32) + (i % 2 ? -0.08 : 0.04) + R(-0.04, 0.04);
    const pts = [sp(R0, 0.38, a * 0.7, 1.08), sp(R0, 0.85, a * 0.9, 1.13), sp(R0, len - 0.12, a * 0.95, 1.1), sp(R0, len, a * 0.92 - Math.sign(a) * 0.05, 1.07)];
    hp.add(strandGeo(pts, 0.042, 0.006, 0.45), new THREE.Matrix4(), i % 3 === 1 ? hcD : hc);
  }
  // 侧发
  for (const s of [-1, 1]) {
    const len = style === 'short' || style === 'spiky' ? 1.75 : 2.35;
    hp.add(strandGeo([sp(R0, 0.6, s * 1.25, 1.08), sp(R0, 1.3, s * 1.32, 1.12), sp(R0, len, s * 1.28, 1.08), sp(R0, len + 0.25, s * 1.22, 1.0)], 0.05, 0.008, 0.5), new THREE.Matrix4(), hc);
  }
  if (style === 'long' || style === 'bob' || style === 'twin' || style === 'pony' || style === 'bun' || style === 'old') {
    hp.add(new THREE.SphereGeometry(R0 * 1.1, 20, 12, Math.PI - 0.4, Math.PI + 0.8, 0.5, style === 'bob' || style === 'long' ? 1.9 : 1.7), MX(0, 0.01, -0.01), hc);
  }
  if (style === 'long' || style === 'bob') {
    const n = 13, endY = style === 'long' ? -0.5 : -0.13;
    for (let i = 0; i < n; i++) {
      const a = lerp(1.6, TAU - 1.6, i / (n - 1)) + R(-0.05, 0.05); const r1 = R0 * 1.15, r2 = R0 * (style === 'long' ? 1.3 : 1.2);
      const pts = [sp(R0, 0.9, a, 1.1), [Math.sin(a) * r1, -0.02, Math.cos(a) * r1], [Math.sin(a) * r2, endY * 0.6, Math.cos(a) * r2], [Math.sin(a) * r2 * (style === 'bob' ? 0.82 : 0.95), endY + R(-0.03, 0.03), Math.cos(a) * r2 * (style === 'bob' ? 0.82 : 0.95)]];
      hp.add(strandGeo(pts, 0.075, 0.012, 0.4), new THREE.Matrix4(), i % 2 ? hc : hcD);
    }
  }
  if (style === 'short' || style === 'spiky') {
    for (let i = 0; i < 11; i++) { const a = lerp(1.4, TAU - 1.4, i / 10); hp.add(strandGeo([sp(R0, 0.7, a, 1.09), sp(R0, 1.4, a, 1.12), sp(R0, 1.9, a + R(-0.1, 0.1), 1.02)], 0.06, 0.01, 0.4), new THREE.Matrix4(), i % 2 ? hc : hcD); }
    if (style === 'spiky') for (let i = 0; i < 6; i++) { const a = R(0, TAU); hp.add(strandGeo([sp(R0, 0.3, a, 1.05), sp(R0, 0.5, a, 1.25), sp(R0, 0.7, a, 1.35)], 0.05, 0.005, 0.5), new THREE.Matrix4(), hc); }
  }
  if (style === 'bun' || style === 'old') { hp.sph(0.075, 0.07, 0.075, 0, 0.1, -R0 * 1.0, hc); hp.cyl(0.006, 0.006, 0.18, 0.03, 0.12, -R0 * 1.05, 0x8a5a3a, 6, 0, 0.8); }
  if (false && o.ahoge) hp.add(strandGeo([sp(R0, 0.05, 0, 1.05), [0, R0 * 1.35, 0.01], [0, R0 * 1.45, 0.06], [0, R0 * 1.35, 0.1]], 0.02, 0.004, 0.6), new THREE.Matrix4(), hc);
  // 帽子 / 发饰
  if (o.hat === 'messenger') { hp.add(new THREE.SphereGeometry(R0 * 1.16, 18, 10, 0, TAU, 0, 1.25), MX(0, 0.03, -0.005), 0x3d6b45); hp.box(0.2, 0.012, 0.1, 0, R0 * 0.45, R0 * 1.02, 0x2f5236, 0.25); hp.box(0.05, 0.05, 0.01, 0, R0 * 0.82, R0 * 0.85, 0xf6d04d, -0.6); }
  if (o.hat === 'cap') { hp.add(new THREE.SphereGeometry(R0 * 1.15, 18, 10, 0, TAU, 0, 1.2), MX(0, 0.03, 0), o.hatCol || 0x26375e); hp.box(0.2, 0.012, 0.11, 0, R0 * 0.5, R0 * 1.0, 0x1a1a1a, 0.2); }
  if (o.hat === 'towel') { hp.add(new THREE.TorusGeometry(R0 * 1.06, 0.022, 6, 20), MX(0, R0 * 0.45, 0, 0, 1, 1, 1, Math.PI / 2 + 0.15), 0xffffff); }
  if (o.ribbon) { for (const s of [-1, 1]) hp.add(G.cone4, MX(s * 0.05, R0 * 0.9, -R0 * 0.55, 0, 0.04, 0.06, 0.015, 0, s * Math.PI / 2), o.ribbon); hp.sph(0.02, 0.02, 0.02, 0, R0 * 0.9, -R0 * 0.55, o.ribbon, 0); }
  if (o.clip) hp.box(0.05, 0.012, 0.012, R0 * 0.62, R0 * 0.55, R0 * 0.78, o.clip, 0, 0.5, 0.4);
  const headMesh = mk(hp, head);
  // 脸
  const faceO = { skinCss: css(skin), browCss: css(new THREE.Color(hairC).multiplyScalar(0.85)), eyeCss: eye[2], eyeDark: eye[1], eyeLight: eye[3], male, kid, mouth: o.mouth, glasses: o.glasses, wrinkle: old };
  const ftex = faceTexture(faceO); ftex.repeat.set(0.5, 1);
  const fmat = new THREE.MeshStandardMaterial({ map: ftex, roughness: 0.62 });
  const fgeo = new THREE.SphereGeometry(R0 * 1.012, 24, 16, Math.PI / 2 - 0.95, 1.9, 0.92, 1.3);
  const face = new THREE.Mesh(fgeo, fmat); head.add(face);
  // 马尾 / 双马尾（链式）
  const tails = [];
  const makeTail = (pos, len, n, dir) => {
    let parent = grp(head, pos); const tie = new Parts(); tie.add(new THREE.TorusGeometry(0.026, 0.01, 6, 12), MX(0, 0, 0, 0, 1, 1, 1, Math.PI / 2), o.tieCol || 0xd9483b); mk(tie, parent);
    const chain = [parent];
    for (let k = 0; k < n; k++) {
      const seg = new Parts(); const L = len / n; const w0 = 0.07 * (1 - k * 0.22), w1 = 0.07 * (1 - (k + 1) * 0.22) + 0.012;
      for (let s = 0; s < 5; s++) { const a = s * TAU / 5; const ox = Math.cos(a) * w0 * 0.35, oz = Math.sin(a) * w0 * 0.35; seg.add(strandGeo([[ox, 0, oz], [ox * 1.2 + dir * 0.01, -L * 0.5, oz * 1.2], [ox * 0.9, -L - 0.01, oz * 0.9]], w0 * 0.7, w1 * 0.5, 0.8), new THREE.Matrix4(), s % 2 ? hc : hcD); }
      const g2 = grp(parent, k === 0 ? [0, 0, 0] : [0, -len / n, 0]); mk(seg, g2); chain.push(g2); parent = g2;
    }
    tails.push(chain);
  };
  if (style === 'pony') makeTail([0, 0.04, -R0 * 1.06], 0.42, 3, 0);
  if (style === 'twin') { makeTail([R0 * 0.82, 0.06, -R0 * 0.35], 0.4, 3, 1); makeTail([-R0 * 0.82, 0.06, -R0 * 0.35], 0.4, 3, -1); }
  // 手臂
  const shoulderY = torsoH - 0.02, sw = male ? 0.2 : 0.18;
  const arms = [];
  for (const s of [1, -1]) {
    const sh = grp(spine, [s * sw, shoulderY, 0]); sh.rotation.z = s * 0.1;
    const ua = new Parts(); const wide = outfit === 'miko';
    ua.cyl(0.05, 0.045, 0.27, 0, -0.13, 0, C.sleeve, 10);
    ua.sph(0.055, 0.055, 0.055, 0, 0, 0, C.sleeve, 0);
    if (wide) ua.box(0.04, 0.32, 0.2, s * 0.03, -0.18, -0.02, 0xfbfbf8);
    if (outfit === 'sailor') ua.cyl(0.048, 0.048, 0.03, 0, -0.25, 0, 0x26375e, 10);
    const short = outfit === 'casual' && o.shortSleeve;
    mk(ua, sh);
    const el = grp(sh, [0, -0.27, 0]);
    const fa = new Parts(); fa.cyl(0.04, 0.034, 0.24, 0, -0.12, 0, (outfit === 'casual' && short) || outfit === 'messenger' ? skin : C.sleeve, 10); fa.sph(0.042, 0.05, 0.035, 0, -0.27, 0.0, skin, 0);
    if (outfit === 'messenger') fa.cyl(0.042, 0.042, 0.06, 0, -0.02, 0, 0xfbfbf6, 10);
    mk(fa, el);
    arms.push({ sh, el, s });
  }
  // 腿
  const legs = [];
  for (const s of [1, -1]) {
    const hip = grp(hips, [s * 0.075, -0.02, 0]);
    const th = new Parts(); const pants = !skirt && outfit !== 'messenger';
    if (outfit === 'messenger') { th.cyl(0.072, 0.064, legL * 0.48, 0, -legL * 0.24, 0, C.bottom, 10); th.cyl(0.06, 0.055, legL * 0.54, 0, -legL * 0.73, 0, skin, 10); }
    else th.cyl(0.07, 0.055, legL, 0, -legL / 2, 0, pants ? C.bottom : skin, 10);
    mk(th, hip);
    const kn = grp(hip, [0, -legL, 0]);
    const sh2 = new Parts(); const sockHigh = outfit === 'sailor' || outfit === 'messenger';
    sh2.cyl(0.054, 0.04, legL - 0.05, 0, -(legL - 0.05) / 2, 0, pants ? C.bottom : skin, 10);
    if (!pants) sh2.cyl(0.056, 0.042, sockHigh ? legL * (outfit === 'messenger' ? 0.42 : 0.72) : 0.12, 0, -(legL - 0.05) + (sockHigh ? legL * (outfit === 'messenger' ? 0.42 : 0.72) : 0.12) / 2, 0, C.sock, 10);
    sh2.box(0.09, 0.07, 0.2, 0, -legL + 0.02, 0.035, C.shoe); sh2.sph(0.045, 0.035, 0.05, 0, -legL + 0.03, 0.13, C.shoe, 0);
    mk(sh2, kn);
    legs.push({ hip, kn, s });
  }
  // 背包 / 包
  let bag = null;
  if (outfit === 'messenger') { const bp = new Parts(); bp.box(0.26, 0.2, 0.08, 0, 0, 0, 0x8a5a3a); bp.box(0.26, 0.09, 0.085, 0, 0.07, 0.003, 0x6a4028); bp.box(0.04, 0.03, 0.01, 0, 0.03, 0.046, 0xd9b45a); bag = mk(bp, hips, [-0.17, 0.0, 0.06]); bag.rotation.y = -0.4; }
  else if (outfit === 'sailor' || outfit === 'blazer') { if (chance(0.7)) { const bp = new Parts(); bp.box(0.3, 0.22, 0.08, 0, 0, 0, 0x2a2a2a); bp.box(0.02, 0.3, 0.02, 0, 0.25, 0, 0x2a2a2a); bag = mk(bp, arms[1].el, [0, -0.38, 0.05]); } }
  const c = { root, hips, spine, head, arms, legs, tails, face, ftex, meshes, S, phase: R(0, TAU), blinkT: R(1, 4), blink: 0, hipY, legL, look: 0, lookT: R(2, 6), headYaw: 0, o, bike: null };
  CHARS.push(c);
  return c;
}

/* --- 姿态动画 --- */
function poseCharacter(c, dt, state, speed = 0, t = 0) {
  const A = c.arms, L = c.legs;
  // 眨眼
  c.blinkT -= dt; if (c.blinkT < 0) { c.blink = 0.13; c.blinkT = R(1.8, 5.0); }
  if (c.blink > 0) c.blink -= dt; c.ftex.offset.x = c.blink > 0 ? 0.5 : 0;
  // 看向
  c.lookT -= dt; if (c.lookT < 0) { c.look = chance(0.5) ? 0 : R(-0.6, 0.6); c.lookT = R(2, 6); }
  let hipY = c.hipY, spX = 0, spY = 0, hdX = 0, hdY = c.look * (state === 'walk' ? 0.3 : 1);
  const set = (a, sx, sz, ex) => { a.sh.rotation.x = sx; a.sh.rotation.z = a.s * sz; a.el.rotation.x = ex; };
  const leg = (l, tx, kx, tz = 0) => { l.hip.rotation.x = tx; l.hip.rotation.z = l.s * tz; l.kn.rotation.x = kx; };
  if (state === 'walk' || state === 'run') {
    const run = state === 'run';
    c.phase += dt * speed / (run ? 1.7 : 1.15) * TAU / 2;
    const p = c.phase; const amp = run ? 0.75 : 0.5;
    for (const l of L) { const lp = p + (l.s > 0 ? 0 : Math.PI); leg(l, -Math.sin(lp) * amp, Math.max(0, Math.cos(lp - 0.3)) * (run ? 1.3 : 0.85) + 0.05); }
    for (const a of A) { const lp = p + (a.s > 0 ? 0 : Math.PI); set(a, Math.sin(lp) * (run ? 0.8 : 0.42), 0.12, -0.25 - (run ? 0.9 : 0.15) - Math.max(0, -Math.sin(lp)) * 0.25); }
    hipY += Math.cos(p * 2) * (run ? 0.04 : 0.022) - (run ? 0.03 : 0);
    spY = Math.sin(p) * 0.08; spX = run ? 0.18 : 0.04; hdY += -Math.sin(p) * 0.05;
  } else if (state === 'sit') {
    for (const l of L) leg(l, -1.45, 1.45, 0.06);
    for (const a of A) set(a, -0.35, 0.05, -0.75);
    hipY = 0.0; spX = -0.05;
  } else if (state === 'bike') {
    c.phase += dt * speed * 1.6;
    for (const l of L) { const lp = c.phase + (l.s > 0 ? 0 : Math.PI); leg(l, -1.05 + Math.sin(lp) * 0.32, 1.1 + Math.cos(lp) * 0.35, 0.05); }
    for (const a of A) set(a, -0.95, 0.15, -0.35);
    hipY = 0.0; spX = 0.32;
  } else if (state === 'pray') {
    for (const l of L) leg(l, 0, 0);
    for (const a of A) { a.sh.rotation.x = -0.75; a.sh.rotation.z = -a.s * 0.42; a.el.rotation.x = -1.35; }
    spX = 0.12 + Math.max(0, Math.sin(t * 0.6)) * 0.1; hdX = 0.35; hdY = 0;
  } else if (state === 'talk') {
    for (const l of L) leg(l, 0, 0.02);
    const g = Math.sin(t * 2.2 + c.phase);
    set(A[0], -0.1, 0.12, -0.25); set(A[1], -0.45 - Math.max(0, g) * 0.35, 0.18, -1.05 - g * 0.25);
    hdX = Math.sin(t * 3.1 + c.phase) * 0.06; spY = Math.sin(t * 0.7 + c.phase) * 0.08;
  } else if (state === 'wave') {
    for (const l of L) leg(l, 0, 0.02);
    set(A[0], 0, 0.12, -0.2); A[1].sh.rotation.x = -0.2; A[1].sh.rotation.z = A[1].s * 2.5; A[1].el.rotation.x = 0; A[1].el.rotation.z = Math.sin(t * 9) * 0.4;
    hdX = -0.05;
  } else if (state === 'phone') {
    for (const l of L) leg(l, 0, 0.02);
    set(A[0], -0.3, 0.1, -1.7); set(A[1], -0.15, 0.1, -1.3); hdX = 0.4; hdY = 0;
  } else if (state === 'paint') {
    for (const l of L) leg(l, 0, 0.02);
    set(A[0], -0.2, 0.15, -0.6); set(A[1], -1.1 + Math.sin(t * 1.3) * 0.15, 0.25, -0.5 + Math.sin(t * 2.1) * 0.2);
  } else if (state === 'fish') {
    for (const l of L) leg(l, -1.45, 1.45, 0.08);
    for (const a of A) set(a, -1.0, 0.2, -0.5);
    hipY = 0.0;
  } else { // idle
    const b = Math.sin(t * 1.6 + c.phase);
    for (const l of L) leg(l, 0, 0.02, 0.02);
    for (const a of A) set(a, 0.04 + b * 0.02, 0.1, -0.12);
    spX = b * 0.015; hipY += b * 0.004;
  }
  if (A[1].el.rotation.z && state !== 'wave') A[1].el.rotation.z = 0;
  c.hips.position.y = hipY; c.spine.rotation.x = spX; c.spine.rotation.y = spY;
  c.headYaw += (hdY - c.headYaw) * Math.min(1, dt * 4);
  c.head.rotation.y = c.headYaw; c.head.rotation.x = hdX;
  // 发尾摆动
  for (const ch of c.tails) for (let k = 1; k < ch.length; k++) {
    const sw = (state === 'walk' || state === 'run') ? Math.sin(c.phase * 2 - k * 0.6) * 0.12 * k : Math.sin(t * 1.4 + k) * 0.03;
    ch[k].rotation.x = 0.25 + sw * 0.6 + (state === 'run' ? 0.5 : 0) / k; ch[k].rotation.z = Math.sin(c.phase - k * 0.5) * 0.08;
  }
}
function setOutline(c, on) { }

/* --- 自行车（随角色移动） --- */
function makeBike(col) {
  const g = new THREE.Group(); const fm = new THREE.MeshStandardMaterial({ color: lin(col), roughness: 0.35, metalness: 0.3 }); const dm = new THREE.MeshStandardMaterial({ color: lin(0x2a2a2a), roughness: 0.6 });
  const wheels = [];
  for (const z of [-0.52, 0.52]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.025, 6, 22), dm); w.position.set(0, 0.35, z); w.rotation.y = Math.PI / 2; g.add(w); wheels.push(w); const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.62, 4), dm); sp.rotation.x = Math.PI / 2; w.add(sp); const sp2 = sp.clone(); sp2.rotation.y = Math.PI / 2; w.add(sp2); }
  const rod = (a, b, r, m) => { const d = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)); const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 6), m); mesh.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(mesh); };
  rod([0, 0.35, -0.52], [0, 0.42, 0], 0.022, fm); rod([0, 0.42, 0], [0, 0.88, 0.42], 0.022, fm); rod([0, 0.85, -0.15], [0, 0.88, 0.42], 0.022, fm); rod([0, 0.35, -0.52], [0, 0.85, -0.15], 0.022, fm); rod([0, 0.35, 0.52], [0, 1.0, 0.45], 0.02, dm);
  const hb = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.035, 0.035), dm); hb.position.set(0, 1.0, 0.45); g.add(hb);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.25), dm); seat.position.set(0, 0.92, -0.17); g.add(seat);
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.28), new THREE.MeshStandardMaterial({ color: lin(0xb8bcc0), roughness: 0.4, metalness: 0.6 })); basket.position.set(0, 0.88, 0.62); g.add(basket);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { g, wheels };
}

/* --- 橘猫 --- */
function makeCat(col = 0xf0a050) {
  const root = new THREE.Group(); const P = new Parts(); const white = 0xfff8f0;
  P.sph(0.13, 0.11, 0.24, 0, 0.22, 0, col); P.sph(0.1, 0.08, 0.1, 0, 0.2, 0.12, white);
  const body = new THREE.Mesh(P.build(), toonMat); body.castShadow = true; root.add(body);
  const head = new THREE.Group(); head.position.set(0, 0.34, 0.22); root.add(head);
  const H = new Parts(); H.sph(0.1, 0.09, 0.09, 0, 0, 0, col); H.sph(0.05, 0.035, 0.03, 0, -0.025, 0.07, white);
  for (const s of [-1, 1]) H.add(G.cone4, MX(s * 0.06, 0.09, -0.01, Math.PI / 4, 0.045, 0.07, 0.03, 0, s * 0.25), col);
  const hm = new THREE.Mesh(H.build(), toonMat); hm.castShadow = true; head.add(hm);
  const ftex = canvasTex(128, 64, (g) => { for (let f = 0; f < 2; f++) { const ox = f * 64; g.fillStyle = css(col); g.fillRect(ox, 0, 64, 64); g.fillStyle = '#fff8f0'; g.beginPath(); g.ellipse(ox + 32, 44, 16, 12, 0, 0, TAU); g.fill(); for (const s of [-1, 1]) { if (f === 0) { g.fillStyle = '#3a6a3a'; g.beginPath(); g.ellipse(ox + 32 + s * 12, 30, 5, 7, 0, 0, TAU); g.fill(); g.fillStyle = '#111'; g.fillRect(ox + 31 + s * 12, 25, 2, 10); g.fillStyle = '#fff'; g.fillRect(ox + 30 + s * 12, 27, 2, 2); } else { g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.beginPath(); g.arc(ox + 32 + s * 12, 28, 5, 0.2, Math.PI - 0.2); g.stroke(); } } g.fillStyle = '#e88a9a'; g.beginPath(); g.moveTo(ox + 29, 38); g.lineTo(ox + 35, 38); g.lineTo(ox + 32, 42); g.fill(); g.strokeStyle = '#3a2a1a'; g.lineWidth = 1.5; g.beginPath(); g.arc(ox + 29, 43, 3, 0, Math.PI); g.arc(ox + 35, 43, 3, 0, Math.PI); g.stroke(); } });
  ftex.repeat.set(0.5, 1);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.101, 16, 10, Math.PI / 2 - 0.8, 1.6, 0.9, 1.1), new THREE.MeshStandardMaterial({ map: ftex, roughness: 0.7 })); face.scale.set(1, 0.9, 0.9); head.add(face);
  const legs = [];
  for (const [x, z] of [[0.07, 0.15], [-0.07, 0.15], [0.07, -0.15], [-0.07, -0.15]]) { const l = new THREE.Group(); l.position.set(x, 0.18, z); const lp = new Parts(); lp.cyl(0.03, 0.028, 0.18, 0, -0.09, 0, col, 6); lp.sph(0.032, 0.025, 0.04, 0, -0.18, 0.01, white, 0); const lm = new THREE.Mesh(lp.build(), toonMat); lm.castShadow = true; l.add(lm); root.add(l); legs.push(l); }
  const tail = []; let par = root; let pos = [0, 0.27, -0.22];
  for (let i = 0; i < 4; i++) { const g = new THREE.Group(); g.position.set(...pos); par.add(g); const tp = new Parts(); tp.cyl(0.025, 0.022, 0.1, 0, 0.05, 0, i === 3 ? white : col, 6); const tm = new THREE.Mesh(tp.build(), toonMat); g.add(tm); tail.push(g); par = g; pos = [0, 0.1, 0]; }
  tail[0].rotation.x = -0.7;
  return { root, head, legs, tail, ftex, blinkT: 2, phase: 0 };
}
function poseCat(k, dt, moving, t) {
  k.blinkT -= dt; if (k.blinkT < 0) { k.blinkT = R(2, 5); k.bl = 0.15; } if (k.bl > 0) k.bl -= dt; k.ftex.offset.x = k.bl > 0 ? 0.5 : 0;
  k.phase += dt * (moving ? 9 : 0);
  k.legs.forEach((l, i) => { l.rotation.x = moving ? Math.sin(k.phase + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.6 : 0; });
  k.tail.forEach((g, i) => { if (i) g.rotation.x = 0.25 + Math.sin(t * 2 + i) * 0.12; g.rotation.z = Math.sin(t * 1.5 - i * 0.6) * 0.25; });
  k.head.rotation.y = Math.sin(t * 0.5) * 0.3;
}

/* ==========================================================================
   写实角色：Tripo 生成的 T-pose 模型 → 按身体部位切分 → 挂到同一套骨架上播放步行等动画
   ========================================================================== */
const CHAR_TYPES = { player: 1.6, sailor: 1.57, blazer: 1.7, suit: 1.73, casualF: 1.6, casualM: 1.74, oldF: 1.5, oldM: 1.64, fisher: 1.7, miko: 1.6, apron: 1.6, kid: 1.25 };
const CHAR_MODELS = {};
// 裙摆下沿（占身高比例）：裙子部分随胯部整体移动，避免被腿撕裂
const CHAR_SKIRT = { sailor: 0.4, casualF: 0.1, oldF: 0.12, miko: 0.06 };
function loadCharModels(onProgress) {
  if (!THREE.GLTFLoader) return Promise.resolve();
  const loader = new THREE.GLTFLoader(); const names = Object.keys(CHAR_TYPES); let n = 0;
  return Promise.all(names.map(name => new Promise((res) => {
    loader.load(ASSET_BASE + 'chars/' + name + MODEL_EXT, (g) => { try { CHAR_MODELS[name] = rigModel(name, g.scene); } catch (e) { console.warn('rig', name, e); } onProgress && onProgress(++n / names.length); res(); },
      undefined, () => { onProgress && onProgress(++n / names.length); res(); });
  })));
}
function rigModel(name, root) {
  root.updateMatrixWorld(true); const geos = []; let mat = null;
  root.traverse(o => { if (o.isMesh) { const g = flatGeo(o.geometry); g.applyMatrix4(o.matrixWorld); geos.push(g); mat = mat || o.material; } });
  const geo = geos.length === 1 ? geos[0] : mergeSimple(geos);
  geo.computeBoundingBox(); let bb = geo.boundingBox;
  if (bb.max.z - bb.min.z > bb.max.x - bb.min.x) geo.rotateY(Math.PI / 2);
  geo.computeBoundingBox(); bb = geo.boundingBox;
  const P = geo.attributes.position; const Hraw = bb.max.y - bb.min.y; const k = CHAR_TYPES[name] / Hraw;
  geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2); geo.scale(k, k, k);
  const H = CHAR_TYPES[name];
  // 朝向：脚尖指向前方
  let toe = 0, tn = 0, shin = 0, sn = 0;
  for (let i = 0; i < P.count; i++) { const y = P.getY(i); if (y < H * 0.035) { toe += P.getZ(i); tn++; } else if (y > H * 0.12 && y < H * 0.22) { shin += P.getZ(i); sn++; } }
  if (tn && sn && toe / tn < shin / sn) geo.rotateY(Math.PI);
  // 关键高度
  const hipY = H * 0.52, kneeY = H * 0.28; let neckY = H * 0.845;
  let shoulderX = 0, handX = 0, armYs = 0, armN = 0, legX = 0, legN = 0;
  for (let i = 0; i < P.count; i++) { const x = Math.abs(P.getX(i)), y = P.getY(i); if (y > H * 0.53 && y < H * 0.63) shoulderX = Math.max(shoulderX, x); if (y > H * 0.55) handX = Math.max(handX, x); }
  shoulderX = clamp(shoulderX * 1.05, H * 0.1, H * 0.14);
  // 腋下：从躯干向外扫描，手臂区域的最低点明显高于胸腰
  { const NB = 48, x0 = H * 0.04, x1 = Math.max(handX, x0 + 0.1), mn = new Float32Array(NB).fill(9);
    let hy = 0, hn = 0; for (let i = 0; i < P.count; i++) { const y = P.getY(i); if (Math.abs(P.getX(i)) > handX * 0.8 && y > H * 0.55) { hy += y; hn++; } }
    const yLo = Math.max(H * 0.5, (hn ? hy / hn : H * 0.8) - H * 0.15);
    for (let i = 0; i < P.count; i++) { const y = P.getY(i), x = Math.abs(P.getX(i)); if (y < yLo || y > H * 0.95 || x < x0 || x >= x1) continue; const b = Math.floor((x - x0) / (x1 - x0) * NB); if (y < mn[b]) mn[b] = y; }
    const ref = mn[Math.floor(NB * 0.66)], thr = (yLo + ref) / 2;
    if (ref < 9 && ref > yLo + H * 0.03) for (let b = 0; b < NB; b++) if (mn[b] < 9 && mn[b] > thr) { const ax = x0 + b / NB * (x1 - x0); if (ax > H * 0.08 && ax < Math.min(handX * 0.7, H * 0.15)) shoulderX = ax; break; } }
  // 脖子：肩宽以内轮廓最窄处（动漫角色头身比各不相同）
  { const NB = 40, y0 = H * (H < 1.4 ? 0.74 : 0.79), y1 = H * 0.93, w = new Float32Array(NB);
    for (let i = 0; i < P.count; i++) { const y = P.getY(i), x = Math.abs(P.getX(i)); if (y < y0 || y >= y1 || x > shoulderX) continue; const b = Math.floor((y - y0) / (y1 - y0) * NB); if (x > w[b]) w[b] = x; }
    let bi = -1, bw = 1e9; for (let b = 2; b < NB - 2; b++) if (w[b] > 0 && w[b] < bw) { bw = w[b]; bi = b; }
    if (bi >= 0) neckY = clamp(y0 + (bi + 0.5) / NB * (y1 - y0), y0 + H * 0.02, H * 0.9); }
  for (let i = 0; i < P.count; i++) { const x = Math.abs(P.getX(i)), y = P.getY(i); if (x > shoulderX * 1.3 && y > H * 0.6) { armYs += y; armN++; } if (y > kneeY && y < hipY - 0.05 * H) { legX += x; legN++; } }
  const armY = armN ? armYs / armN : H * 0.8; legX = legN ? legX / legN : H * 0.06;
  const armLen = Math.max(0.2, handX - shoulderX); const elbowX = shoulderX + armLen * 0.47;
  const tPose = handX > shoulderX * 1.8;
  // 切分
  const attrs = Object.keys(geo.attributes); const parts = {}; const mk = () => { const o = {}; attrs.forEach(a => o[a] = []); return o; };
  ['hips', 'torso', 'head', 'uaL', 'faL', 'uaR', 'faR', 'thL', 'shL', 'thR', 'shR'].forEach(p => parts[p] = mk());
  const tri = P.count / 3;
  for (let t = 0; t < tri; t++) {
    let cx = 0, cy = 0; for (let j = 0; j < 3; j++) { cx += P.getX(t * 3 + j); cy += P.getY(t * 3 + j); } cx /= 3; cy /= 3;
    const s = cx >= 0 ? 'L' : 'R'; let part;
    const hem = CHAR_SKIRT[name] ? CHAR_SKIRT[name] * H : 0;
    if (tPose && Math.abs(cx) > shoulderX && cy > H * 0.6) part = (Math.abs(cx) < elbowX ? 'ua' : 'fa') + s;
    else if (hem && cy < hipY && cy > hem) part = 'hips';
    else if (cy > neckY) part = 'head';
    else if (cy > hipY) part = 'torso';
    else if (cy > hipY - H * 0.05 && Math.abs(cx) < legX * 0.6) part = 'hips';
    else part = (cy > kneeY ? 'th' : 'sh') + s;
    const D = parts[part]; for (const a of attrs) { const A = geo.attributes[a]; for (let j = 0; j < 3; j++) for (let c = 0; c < A.itemSize; c++) D[a].push(A.array[(t * 3 + j) * A.itemSize + c]); }
  }
  const build = (D, pivot, rotZ) => { const g = new THREE.BufferGeometry(); for (const a of attrs) g.setAttribute(a, new THREE.Float32BufferAttribute(D[a], geo.attributes[a].itemSize)); g.translate(-pivot[0], -pivot[1], -pivot[2]); if (rotZ) g.rotateZ(rotZ); g.computeBoundingSphere(); return g; };
  const drop = Math.PI / 2; // T-pose 手臂放下
  // 手臂半径：肘部附近顶点的竖直范围
  let aLo = 1e9, aHi = -1e9; for (let i = 0; i < P.count; i++) { if (Math.abs(Math.abs(P.getX(i)) - elbowX) < 0.03) { const y = P.getY(i); if (y > H * 0.6) { aLo = Math.min(aLo, y); aHi = Math.max(aHi, y); } } }
  const armR = aHi > aLo ? Math.min(0.07, (aHi - aLo) / 2) : 0.045;
  const out = { name, mat, H, hipY, kneeY, neckY, shoulderX, armY, elbowX, legX, armLen, armR, g: {} };
  out.g.hips = build(parts.hips, [0, hipY, 0]); out.g.torso = build(parts.torso, [0, hipY, 0]); out.g.head = build(parts.head, [0, neckY, 0]);
  for (const [s, sg] of [['L', 1], ['R', -1]]) {
    out.g['ua' + s] = build(parts['ua' + s], [sg * shoulderX, armY, 0], -sg * drop); out.g['ua' + s].translate(sg * armR * 0.6, 0, 0);
    out.g['fa' + s] = build(parts['fa' + s], [sg * elbowX, armY, 0], -sg * drop); out.g['fa' + s].translate(sg * armR * 0.6, 0, 0);
    out.g['th' + s] = build(parts['th' + s], [sg * legX, hipY, 0]);
    out.g['sh' + s] = build(parts['sh' + s], [sg * legX, kneeY, 0]);
  }
  if (mat) { mat.envMapIntensity = 0.8; mat.roughness = Math.max(mat.roughness || 0.8, 0.6); if (mat.metalness > 0.2 && !mat.metalnessMap) mat.metalness = 0; }
  return out;
}
function lookToType(o) {
  if (o.outfit === 'messenger') return 'player';
  if (o.age === 'kid') return 'kid';
  if (o.outfit === 'miko') return 'miko'; if (o.outfit === 'fisher') return 'fisher'; if (o.outfit === 'suit') return 'suit';
  if (o.outfit === 'sailor') return 'sailor'; if (o.outfit === 'blazer') return o.gender === 'm' ? 'blazer' : 'sailor';
  if (o.age === 'old') return o.gender === 'm' ? 'oldM' : 'oldF';
  if (o.apron && o.gender !== 'm') return 'apron';
  return o.gender === 'm' ? 'casualM' : 'casualF';
}
function makeModelCharacter(M) {
  if (!M.skinGeo) { M.skinGeo = buildSkinGeo(M); M.toon = animeToon(M.mat, true); M.toonStatic = animeToon(M.mat, false); M.line = animeOutline(0.0075, true); }
  const root = new THREE.Group();
  const bone = (parent, pos) => { const b = new THREE.Bone(); b.position.set(...pos); if (parent) parent.add(b); return b; };
  const hips = bone(null, [0, M.hipY, 0]); const spine = bone(hips, [0, 0, 0]); const head = bone(spine, [0, M.neckY - M.hipY, 0]);
  const bones = [hips, spine, head]; const arms = [], legs = [];
  for (const sg of [1, -1]) {
    const sh = bone(spine, [sg * M.shoulderX, M.armY - M.hipY, 0]); const el = bone(sh, [0, -(M.elbowX - M.shoulderX), 0]);
    const hip = bone(hips, [sg * M.legX, 0, 0]); const kn = bone(hip, [0, M.kneeY - M.hipY, 0]);
    bones.push(sh, el, hip, kn); arms.push({ sh, el, s: sg }); legs.push({ hip, kn, s: sg });
  }
  const mesh = new THREE.SkinnedMesh(M.skinGeo, M.toon); mesh.castShadow = true; mesh.receiveShadow = true; mesh.add(hips); root.add(mesh);
  root.updateMatrixWorld(true); const skel = new THREE.Skeleton(bones); mesh.bind(skel);
  const line = new THREE.SkinnedMesh(M.skinGeo, M.line); line.bind(skel, mesh.bindMatrix); line.castShadow = false; root.add(line);
  for (const a of arms) a.sh.rotation.z = a.s * 0.1;
  const c = { root, hips, spine, head, arms, legs, tails: [], face: null, ftex: { offset: { x: 0 } }, meshes: [mesh], S: 1, phase: R(0, TAU), blinkT: 3, blink: 0, hipY: M.hipY, legL: M.hipY / 2, look: 0, lookT: R(2, 6), headYaw: 0, o: {}, bike: null, model: M.name };
  CHARS.push(c); return c;
}
// 头像：用主渲染器把模型头肩渲染到画布（按模型缓存）
function charPortrait(c) {
  if (!c) return null;
  if (!c.model) return { img: c.ftex.image, sx: 30, sy: 60, sw: 196, sh: 196, proc: true };
  const M = CHAR_MODELS[c.model]; if (M.portrait) return M.portrait;
  const S = 256, sc = new THREE.Scene();
  const add = (g, y) => { const m = new THREE.Mesh(g, M.toonStatic || M.mat); m.position.y = y; sc.add(m); const o = new THREE.Mesh(g, animeOutline(0.004, false)); o.position.y = y; sc.add(o); };
  add(M.g.head, M.neckY); add(M.g.torso, M.hipY);
  sc.add(new THREE.HemisphereLight(0xfff4e8, 0x6a5a50, 1.3)); const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(0.6, 1.2, 1.5); sc.add(dl);
  const headTop = M.H, cy = (M.neckY + headTop) / 2 - 0.02;
  const cam = new THREE.PerspectiveCamera(28, 1, 0.05, 10); cam.position.set(0.12, cy + 0.03, 0.85); cam.lookAt(0, cy - 0.02, 0);
  const rt = new THREE.WebGLRenderTarget(S, S); rt.texture.encoding = THREE.sRGBEncoding;
  const prevC = new THREE.Color(); renderer.getClearColor(prevC); const prevA = renderer.getClearAlpha(); const env = sc.environment = scene.environment;
  renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(sc, cam);
  const px = new Uint8Array(S * S * 4); renderer.readRenderTargetPixels(rt, 0, 0, S, S, px);
  renderer.setRenderTarget(null); renderer.setClearColor(prevC, prevA); rt.dispose();
  const cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d'); const id = g.createImageData(S, S);
  for (let y = 0; y < S; y++) id.data.set(px.subarray((S - 1 - y) * S * 4, (S - y) * S * 4), y * S * 4);
  g.putImageData(id, 0, 0);
  return (M.portrait = { img: cv, sx: 0, sy: 0, sw: S, sh: S });
}
