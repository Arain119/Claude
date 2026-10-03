/* ==========================================================================
   地形（扩展后的岛屿：北部星见山、西部田园、东部港口）· 海 · 河 · 天空
   ========================================================================== */
const TOWN_Y = 2;
const RIVER = [[-86, -112], [-82, -98], [-76, -70], [-72, -40], [-70, -5], [-73, 30], [-80, 70], [-92, 110], [-104, 150], [-114, 196]];
const CAPE_PATH = [[100, -82, 2], [90, -96, 5.5], [95, -114, 10], [108, -122, 15], [116, -113, 18.5]];
const CAPE = { x: 118, z: -110, y: 18.5 };
const SHRINE = { x: -40, z: -130, y: 14 };
const WORLD = { x0: -470, x1: 330, z0: -430, z1: 240 };

/* --- 海岸线：保留原来的东侧与南侧，把西北方向向外扩展 --- */
function oldR(th) { const c = Math.cos(th), s = Math.sin(th); const e = 1 / Math.sqrt((c / 215) ** 2 + (s / 178) ** 2); return e * (1 + 0.07 * Math.sin(3 * th + 0.8) + 0.05 * Math.sin(5 * th + 2.1) + 0.03 * Math.sin(9 * th + 0.3)); }
function coastR(th) {
  const d = Math.abs(Math.atan2(Math.sin(th + 3 * Math.PI / 4), Math.cos(th + 3 * Math.PI / 4)));
  const w = d < 1.92 ? Math.cos(d / 1.92 * Math.PI / 2) ** 2 : 0;
  return oldR(th) * (1 + 1.3 * w) + (vnoise(th * 5 + 10, 1.7) - 0.5) * 22 * w;
}
/* 内陆距离（米）/ 200：沿用旧代码里的阈值习惯 */
function islandC(x, z) { return (coastR(Math.atan2(z, x)) - Math.hypot(x, z)) / 200; }
const gauss = (x, z, cx, cz, r, h) => h * Math.exp(-((x - cx) * (x - cx) + (z - cz) * (z - cz)) / (r * r));
function flatW(x, z, x0, x1, z0, z1, m) { return smooth(x0 - m, x0, x) * (1 - smooth(x1, x1 + m, x)) * smooth(z0 - m, z0, z) * (1 - smooth(z1, z1 + m, z)); }
function polyDist(pts, x, z) {
  let best = 1e9, bt = 0, bi = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0], bz = pts[i + 1][1];
    const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / L2, 0, 1);
    const px = ax + dx * t - x, pz = az + dz * t - z; const d = px * px + pz * pz;
    if (d < best) { best = d; bt = t; bi = i; }
  }
  polyDist.i = bi; polyDist.t = bt;
  return Math.sqrt(best);
}
const riverDist = (x, z) => polyDist(RIVER, x, z);

/* --- 自然地形（不含河道与道路） --- */
function terrainNatural(x, z) {
  const c = islandC(x, z);
  let h = lerp(-9, 2.2, smooth(-0.13, 0.09, c));
  const inl = smooth(0.02, 0.2, c);
  h += (fbm(x * 0.012 + 3, z * 0.012 - 7, 4) - 0.5) * 4.0 * inl;
  // 原有丘陵
  const hill = gauss(x, z, -60, -152, 62, 17) + gauss(x, z, 25, -165, 55, 13) + gauss(x, z, -140, -118, 55, 15) + gauss(x, z, -184, -58, 38, 13) + gauss(x, z, 152, -64, 34, 14) + gauss(x, z, 92, -142, 40, 9);
  // 星见山与西北山地
  const mtn = gauss(x, z, -205, -255, 105, 80) + gauss(x, z, -110, -290, 65, 26) + gauss(x, z, -285, -150, 85, 36) + gauss(x, z, -10, -250, 60, 22) + gauss(x, z, -310, -275, 70, 26);
  const ridge = (fbm(x * 0.008 + 40, z * 0.008, 4) - 0.45) * 26 * smooth(20, 70, mtn);
  h += (hill + mtn + Math.max(0, ridge)) * inl;
  h += gauss(x, z, CAPE.x, CAPE.z, 34, 17) * smooth(-0.03, 0.05, c);
  // 河源：压低成一片缓坡谷地
  { const vw = smooth(70, 12, Math.hypot(x + 86, z + 112)) * inl; h = lerp(h, Math.min(h, 4 + Math.hypot(x + 86, z + 112) * 0.12), vw); }
  // 西部田园（低平）
  let w = flatW(x, z, -330, -120, -50, 120, 55) * smooth(0.04, 0.12, c); h = lerp(h, 3.2 + (fbm(x * 0.02, z * 0.02, 2) - 0.5) * 0.3, w);
  // 镇区
  w = flatW(x, z, -112, 108, -84, 72, 14); h = lerp(h, TOWN_Y, w);
  w = flatW(x, z, 100, 129, -34, 64, 6); h = lerp(h, TOWN_Y, w);
  h -= smooth(80, 150, z) * smooth(140, 70, Math.abs(x - 10)) * 1.5;
  w = flatW(x, z, -166, 138, -71, -49, 5); h = lerp(h, TOWN_Y, w);
  // 神社
  w = flatW(x, z, -64, -16, -152, -110, 8); h = lerp(h, SHRINE.y, w);
  const rampY = lerp(TOWN_Y, SHRINE.y, clamp((-86 - z) / 24, 0, 1));
  w = flatW(x, z, -46, -34, -110, -86, 3); h = lerp(h, rampY, w);
  // 灯塔岬
  const pd = polyDist(CAPE_PATH, x, z);
  if (pd < 8) { const i = polyDist.i, t = polyDist.t; const py = lerp(CAPE_PATH[i][2], CAPE_PATH[i + 1][2], t); h = lerp(h, py, smooth(6.5, 2.2, pd)); }
  w = smooth(16, 11, Math.hypot(x - CAPE.x, z - CAPE.z)); h = lerp(h, CAPE.y, w);
  return h;
}

/* --- 河道纵断面：从河口往上游，水面单调上升，坡度有上限 --- */
let RIVER_PROF = null;
function riverProfile() {
  if (RIVER_PROF) return RIVER_PROF;
  const n = RIVER.length; const P = new Array(n);
  P[n - 1] = -0.05;
  for (let i = n - 2; i >= 0; i--) {
    const L = Math.hypot(RIVER[i + 1][0] - RIVER[i][0], RIVER[i + 1][1] - RIVER[i][1]);
    const base = terrainNatural(RIVER[i][0], RIVER[i][1]);
    P[i] = Math.max(P[i + 1], Math.min(base - 1.4, P[i + 1] + L * 0.1));
    if (RIVER[i][1] > -100) P[i] = Math.min(P[i], 0.35);
    P[i] = Math.max(P[i], P[i + 1]);
  }
  RIVER_PROF = P; return P;
}
function riverWaterY(i, t) { const P = riverProfile(); return lerp(P[i], P[i + 1], t); }

/* --- 道路栅格（由 02b_roads.js 填写）：高度与权重 --- */
const RG = { cell: 2, x0: WORLD.x0, z0: WORLD.z0, nx: Math.ceil((WORLD.x1 - WORLD.x0) / 2), nz: Math.ceil((WORLD.z1 - WORLD.z0) / 2), h: null, w: null };
RG.h = new Float32Array(RG.nx * RG.nz); RG.w = new Float32Array(RG.nx * RG.nz);
function roadSample(x, z) {
  const fx = (x - RG.x0) / RG.cell - 0.5, fz = (z - RG.z0) / RG.cell - 0.5; const ix = Math.floor(fx), iz = Math.floor(fz);
  if (ix < 0 || iz < 0 || ix >= RG.nx - 1 || iz >= RG.nz - 1) { roadSample.h = 0; return 0; }
  const tx = fx - ix, tz = fz - iz; const k = iz * RG.nx + ix;
  const w00 = RG.w[k], w10 = RG.w[k + 1], w01 = RG.w[k + RG.nx], w11 = RG.w[k + RG.nx + 1];
  const w = lerp(lerp(w00, w10, tx), lerp(w01, w11, tx), tz); if (w <= 0) { roadSample.h = 0; return 0; }
  // 高度按权重加权，避免未覆盖格子拉低道路边缘
  const hw = (RG.h[k] * w00 * (1 - tx) + RG.h[k + 1] * w10 * tx) * (1 - tz) + (RG.h[k + RG.nx] * w01 * (1 - tx) + RG.h[k + RG.nx + 1] * w11 * tx) * tz;
  const ws = (w00 * (1 - tx) + w10 * tx) * (1 - tz) + (w01 * (1 - tx) + w11 * tx) * tz;
  roadSample.h = hw / Math.max(ws, 1e-6); return w;
}

function terrainH(x, z) {
  let h = terrainNatural(x, z);
  // 河道
  const rd = riverDist(x, z);
  if (rd < 80) { const wy = riverWaterY(polyDist.i, polyDist.t); const bed = wy - 1.25; const over = Math.max(0, h - wy - 2); const reach = 9.5 + over * 2.4;
    if (rd < reach) { const prof = rd < 5 ? bed : lerp(bed, h, smooth(5, reach, rd)); h = Math.min(h, prof); } }
  // 道路（填挖）
  const rw = roadSample(x, z); if (rw > 0) h = lerp(h, roadSample.h, rw);
  // 港湾
  const w = smooth(127.6, 129, x) * smooth(-31, -27, z) * (1 - smooth(57, 61, z)); h = lerp(h, -4.5, w);
  return h;
}

/* ---------------- 地形网格（四层照片纹理混合） ---------------- */
const TERRAIN_U = { tGrass: { value: TEX.grass }, tDirt: { value: TEX.ground }, tRock: { value: TEX.rock }, tSand: { value: TEX.sand } };
let terrainMesh, TERRAIN_GRID = null;
function buildTerrain() {
  const sx = WORLD.x1 - WORLD.x0, sz = WORLD.z1 - WORLD.z0, step = 2.5;
  const nx = Math.round(sx / step), nz = Math.round(sz / step);
  const g = new THREE.PlaneGeometry(sx, sz, nx, nz); g.rotateX(-Math.PI / 2); g.translate((WORLD.x0 + WORLD.x1) / 2, 0, (WORLD.z0 + WORLD.z1) / 2);
  const p = g.attributes.position; const col = new Float32Array(p.count * 3); const spl = new Float32Array(p.count * 4);
  const H = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) { H[i] = terrainH(p.getX(i), p.getZ(i)); p.setY(i, H[i]); }
  const row = nx + 1; const tmp = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), h = H[i]; const ix = i % row, iz = Math.floor(i / row);
    const hx = H[i + (ix < nx ? 1 : -1)] - h, hz = H[i + (iz < nz ? row : -row)] - h; const slope = Math.hypot(hx, hz) / step;
    const c = islandC(x, z); const n = fbm(x * 0.03, z * 0.03, 3);
    let gr = 1, di = 0, ro = 0, sa = 0;
    di = smooth(0.35, 0.75, slope) * 0.9 + smooth(0.55, 0.8, n) * 0.35;
    ro = smooth(0.7, 1.15, slope);
    const beach = Math.max(smooth(1.4, 0.5, h) * smooth(0.0, 0.2, 0.3 - c), smooth(84, 100, z) * smooth(150, 110, Math.abs(x - 10)));
    sa = clamp(beach, 0, 1) + smooth(0.2, -0.6, h);
    if (Math.hypot(x - SHRINE.x, z - SHRINE.z + 2) < 26 && Math.abs(h - SHRINE.y) < 0.4) di = 1;
    if (polyDist(CAPE_PATH, x, z) < 1.8) di = 1;
    const rd = riverDist(x, z); if (rd < 9.5) { ro = Math.max(ro, smooth(9.5, 6, rd)); }
    const rw = roadSample(x, z); di = Math.max(di, rw * 0.8);
    if (h > 25) { di = Math.max(di, smooth(0.4, 0.8, n) * 0.6); }
    gr = Math.max(0, 1 - di - ro - sa);
    spl.set([gr, di, ro, sa], i * 4);
    // 色调：高处偏暗绿、低处偏黄绿
    tmp.setRGB(1, 1, 1).lerp(new THREE.Color(0.8, 0.88, 0.75), smooth(10, 60, h)).lerp(new THREE.Color(1.05, 1.0, 0.85), smooth(0.65, 0.8, fbm(x * 0.01 + 5, z * 0.01, 2)) * 0.5);
    tmp.multiplyScalar(lerp(1, 0.55, smooth(0.3, -2.5, h)));
    col.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('splat', new THREE.BufferAttribute(spl, 4));
  // 供草地着色器采样的高度 / 草量网格
  { const F = new Float32Array(p.count * 4); for (let i = 0; i < p.count; i++) { F[i * 4] = H[i]; F[i * 4 + 1] = spl[i * 4]; F[i * 4 + 2] = col[i * 3 + 1]; F[i * 4 + 3] = 1; }
    const x0 = p.getX(0), z0 = p.getZ(0);
    TERRAIN_GRID = { nx: nx + 1, nz: nz + 1, x0, z0, dx: (p.getX(nx) - x0) / nx, dz: (p.getZ(row * nz) - z0) / nz, data: F }; }
  g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, TERRAIN_U);
    sh.vertexShader = 'attribute vec4 splat; varying vec4 vSplat; varying vec3 vWPos; varying vec3 vWN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvSplat = splat; vWPos = (modelMatrix * vec4(position, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * normal);');
    sh.fragmentShader = 'uniform sampler2D tGrass, tDirt, tRock, tSand; varying vec4 vSplat; varying vec3 vWPos; varying vec3 vWN;\n' +
      'vec3 tx(sampler2D t, vec2 uv){ return pow(texture2D(t, uv).rgb, vec3(2.2)); }\n' +
      'vec3 tri(sampler2D t, vec3 p, vec3 n, float s){ vec3 b = pow(abs(n), vec3(4.0)); b /= (b.x + b.y + b.z); return tx(t, p.zy / s) * b.x + tx(t, p.xz / s) * b.y + tx(t, p.xy / s) * b.z; }\n' + sh.fragmentShader.replace('#include <map_fragment>', `
      vec2 wuv = vWPos.xz;
      float macro = texture2D(tGrass, wuv / 61.0).g;
      vec3 cg = mix(tx(tGrass, wuv / 4.5), tx(tGrass, wuv / 13.0), 0.35) * mix(0.8, 1.15, macro);
      vec3 wn = normalize(vWN);
      vec3 cd = tri(tDirt, vWPos, wn, 4.0);
      vec3 cr = mix(tri(tRock, vWPos, wn, 6.0), tri(tRock, vWPos, wn, 19.0), 0.4);
      vec3 cs = tx(tSand, wuv / 4.0);
      vec4 w = max(vSplat, 0.0); w /= max(dot(w, vec4(1.0)), 1e-3);
      diffuseColor.rgb *= cg * w.x + cd * w.y + cr * w.z + cs * w.w;`);
  };
  terrainMesh = new THREE.Mesh(g, m); terrainMesh.receiveShadow = true; terrainMesh.name = 'terrain';
  scene.add(terrainMesh);
}

/* 深度贴图（供海面浅滩与泡沫） */
let DEPTH_TEX;
function buildDepthTex() {
  const N = 512, S = 960; const data = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = -S / 2 - 70 + (i + 0.5) * S / N, z = -S / 2 - 90 + (j + 0.5) * S / N; const h = terrainNatural(x, z) - (smooth(127.6, 129, x) * smooth(-31, -27, z) * (1 - smooth(57, 61, z))) * 6;
    const d = clamp(-h / 10, 0, 1); const k = (j * N + i) * 4; data[k] = d * 255; data[k + 1] = h > 0 ? 255 : 0; data[k + 2] = 0; data[k + 3] = 255;
  }
  DEPTH_TEX = new THREE.DataTexture(data, N, N, THREE.RGBAFormat); DEPTH_TEX.magFilter = THREE.LinearFilter; DEPTH_TEX.minFilter = THREE.LinearFilter; DEPTH_TEX.needsUpdate = true;
}

/* ---------------- 天空：物理大气（Preetham）+ 云层 + 星空 ---------------- */
const SKY = { sky: null, skyB: null, overlay: null, overlayB: null, scene: new THREE.Scene(), cubeRT: null, cubeCam: null, pmrem: null, envRT: null, lastSun: new THREE.Vector3(), lastNight: -1 };
const SKY_U = {
  time: { value: 0 }, sunDir: { value: new THREE.Vector3(0.3, 0.6, 0.4) }, moonDir: { value: new THREE.Vector3(-0.4, 0.45, 0.6) }, night: { value: 0 },
  cloudLit: { value: new THREE.Color(1, 1, 1) }, cloudShade: { value: new THREE.Color(0.6, 0.65, 0.75) }, cover: { value: 0.5 }
};
function buildSky() {
  if (!THREE.Sky.SkyShader.fragmentShader.includes('skyGain')) { const S = THREE.Sky.SkyShader; S.uniforms.skyGain = { value: 0.5 }; S.fragmentShader = 'uniform float skyGain;\n' + S.fragmentShader.replace('gl_FragColor = vec4( retColor, 1.0 );', `
      // 动漫天空：提高饱和度，天顶更深的钴蓝，地平线偏青白
      float sl = dot(retColor, vec3(0.299, 0.587, 0.114)); vec3 sc = mix(vec3(sl), retColor, 1.45);
      float up = clamp(direction.y, 0.0, 1.0); sc *= mix(vec3(1.0), vec3(0.78, 0.92, 1.18), smoothstep(0.05, 0.7, up));
      gl_FragColor = vec4( max(sc, 0.0) * skyGain, 1.0 );`); }
  const mk = () => { const s = new THREE.Sky(); s.scale.setScalar(9000); const u = s.material.uniforms; u.turbidity.value = 3.5; u.rayleigh.value = 1.2; u.mieCoefficient.value = 0.003; u.mieDirectionalG.value = 0.8; s.frustumCulled = false; s.renderOrder = -10; return s; };
  SKY.sky = mk(); scene.add(SKY.sky); SKY.skyB = mk(); SKY.skyB.material = SKY.sky.material; SKY.scene.add(SKY.skyB);
  const om = new THREE.ShaderMaterial({
    uniforms: SKY_U, transparent: true, depthWrite: false, side: THREE.BackSide,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: `uniform vec3 sunDir, moonDir, cloudLit, cloudShade; uniform float time, night, cover; varying vec3 vDir;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 6; i++) { s += a * noise(p); p = p * 2.07 + vec2(1.7, 9.2); a *= 0.5; } return s; }
      void main(){
        vec3 d = normalize(vDir); float y = d.y; vec3 col = vec3(0.0); float a = 0.0;
        if (night > 0.01) {
          vec2 sp = vec2(atan(d.z, d.x) * 90.0, d.y * 140.0); vec2 cell = floor(sp); float h = hash(cell);
          float st = step(0.988, h) * smoothstep(0.4, 0.0, length(fract(sp) - 0.5)) * smoothstep(0.0, 0.2, y);
          col += vec3(0.85, 0.9, 1.0) * st * night * (0.5 + 0.5 * sin(time * 2.0 + h * 50.0)) * 2.0; a = max(a, st * night);
          float md = dot(d, normalize(moonDir)); float disc = smoothstep(0.99955, 0.9997, md);
          col += vec3(1.0, 0.97, 0.9) * disc * night * 3.0; a = max(a, disc * night);
          float halo = pow(max(md, 0.0), 80.0) * 0.35 * night; col += vec3(0.6, 0.7, 0.9) * halo; a = max(a, halo);
        }
        if (y > 0.0) {
          vec2 uv = d.xz / (y + 0.12) * 1.3 + vec2(time * 0.004, time * 0.0015);
          vec2 w = vec2(fbm(uv * 0.7), fbm(uv * 0.7 + 5.2));
          float c = fbm(uv * 1.2 + w * 1.1); float c2 = fbm(uv * 1.2 + w * 1.1 + normalize(sunDir.xz + 0.0001) * 0.06);
          // 动漫积云：边缘清晰、受光面亮白、背光面偏蓝紫，靠近太阳处有亮边
          float puff = c + (fbm(uv * 3.1 + w * 0.6) - 0.5) * 0.12;
          float dens = smoothstep(cover, cover + 0.07, puff) * smoothstep(0.0, 0.15, y);
          float lit = smoothstep(0.3, 0.6, (c - c2) * 5.0 + 0.5 + (puff - cover) * 0.5);
          float sd = max(dot(d, normalize(sunDir)), 0.0);
          float rim = (1.0 - smoothstep(cover + 0.02, cover + 0.12, puff)) * pow(sd, 3.0);
          vec3 shade = mix(cloudShade, cloudShade * vec3(0.86, 0.9, 1.12), 1.0 - night);
          vec3 cc = mix(shade, cloudLit * 1.08, lit) + cloudLit * (pow(sd, 8.0) * 0.5 + rim * 1.4) * (1.0 - night);
          col = mix(col, cc, dens); a = max(a, dens);
        }
        gl_FragColor = vec4(col, a);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`
  });
  const og = new THREE.SphereGeometry(4000, 48, 24);
  SKY.overlay = new THREE.Mesh(og, om); SKY.overlay.frustumCulled = false; SKY.overlay.renderOrder = -9; scene.add(SKY.overlay);
  SKY.overlayB = new THREE.Mesh(og, om); SKY.scene.add(SKY.overlayB);
  SKY.cubeRT = new THREE.WebGLCubeRenderTarget(128, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
  SKY.cubeCam = new THREE.CubeCamera(1, 10000, SKY.cubeRT); SKY.scene.add(SKY.cubeCam);
  SKY.pmrem = new THREE.PMREMGenerator(renderer);
}
/* 太阳方向或昼夜明显变化时，重新烘焙环境光（反射 + 漫反射） */
function updateSkyEnv(force) {
  const sd = SKY_U.sunDir.value; const n = SKY_U.night.value;
  if (!force && sd.distanceTo(SKY.lastSun) < 0.035 && Math.abs(n - SKY.lastNight) < 0.06) return;
  SKY.lastSun.copy(sd); SKY.lastNight = n;
  const tm = renderer.toneMapping; renderer.toneMapping = THREE.NoToneMapping;
  SKY.cubeCam.update(renderer, SKY.scene);
  if (SKY.envRT) SKY.envRT.dispose();
  SKY.envRT = SKY.pmrem.fromCubemap(SKY.cubeRT.texture);
  renderer.toneMapping = tm;
  scene.environment = SKY.envRT.texture;
  SEA_U.envCube.value = SKY.cubeRT.texture;
}

/* ---------------- 海 ---------------- */
const SEA_U = {
  time: { value: 0 }, depthTex: { value: null }, depthS: { value: 960 }, depthO: { value: new THREE.Vector2(-70, -90) }, sunDir: SKY_U.sunDir,
  sunCol: { value: new THREE.Color(1, 0.95, 0.85) }, deepCol: { value: lin(0x0f3f63) }, shallowCol: { value: lin(0x2a9a9a) }, foamCol: { value: new THREE.Color(0.9, 0.95, 0.95) },
  light: { value: 1 }, waves: { value: 1 }, envCube: { value: null }, night: SKY_U.night,
  fogColor: { value: new THREE.Color() }, fogDensity: { value: 0.001 }
};
const WATER_COMMON = `
  float wh(vec2 p, float t){ return sin(p.x*0.07+t*0.9)*0.35 + sin(p.y*0.09-t*1.1)*0.28 + sin((p.x+p.y)*0.21+t*1.7)*0.08; }
  vec3 wnorm(vec2 p, float t){
    vec2 q = p; vec2 g = vec2(0.0);
    float a = 0.22; float f = 0.35; vec2 dir = vec2(1.0, 0.3);
    for (int i = 0; i < 7; i++) {
      dir = vec2(dir.x * 0.8 - dir.y * 0.6, dir.x * 0.6 + dir.y * 0.8);
      float ph = dot(dir, q) * f + t * sqrt(9.8 * f) * 0.55;
      g += dir * cos(ph) * a * f;
      a *= 0.62; f *= 1.75;
    }
    return normalize(vec3(-g.x, 1.0, -g.y));
  }`;
function buildSea() {
  const g = new THREE.PlaneGeometry(6000, 6000, 200, 200); g.rotateX(-Math.PI / 2);
  SEA_U.depthTex.value = DEPTH_TEX;
  const m = new THREE.ShaderMaterial({
    uniforms: SEA_U,
    vertexShader: `uniform float time; uniform float waves; varying vec3 vW; varying float vDist; ${WATER_COMMON}
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); w.y += wh(w.xz, time) * waves * 0.1; vW = w.xyz; vec4 mv = viewMatrix * w; vDist = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float time, light, night, fogDensity; uniform sampler2D depthTex; uniform float depthS; uniform vec2 depthO; uniform vec3 sunDir, sunCol, deepCol, shallowCol, foamCol, fogColor; uniform samplerCube envCube;
      varying vec3 vW; varying float vDist; ${WATER_COMMON}
      void main(){
        vec2 duv = (vW.xz - depthO) / depthS + 0.5; float depth = texture2D(depthTex, duv).r * 10.0;
        if (duv.x < 0.0 || duv.x > 1.0 || duv.y < 0.0 || duv.y > 1.0) depth = 10.0;
        vec3 n = wnorm(vW.xz, time); n = normalize(mix(n, vec3(0.0, 1.0, 0.0), smoothstep(25.0, 350.0, vDist) * 0.93));
        vec3 v = normalize(cameraPosition - vW);
        float fr = 0.02 + 0.98 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
        vec3 r = reflect(-v, n); r.y = abs(r.y);
        vec3 refl = textureCube(envCube, r).rgb;
        float sss = smoothstep(0.0, 1.0, wh(vW.xz, time) * 0.5 + 0.5) * 0.25;
        vec3 body = mix(shallowCol, deepCol, smoothstep(0.3, 7.0, depth)) * (0.35 + 0.65 * light) + shallowCol * sss * light;
        vec3 col = mix(body, refl, fr);
        vec3 h = normalize(sunDir + v); float sp = (pow(max(dot(n, h), 0.0), 600.0) * 40.0) * smoothstep(400.0, 60.0, vDist) + pow(max(dot(n, h), 0.0), 120.0) * 0.5;
        col += sunCol * sp * (1.0 - night) * smoothstep(-0.05, 0.1, sunDir.y);
        float shore = 1.0 - smoothstep(0.0, 0.5, depth);
        float bands = smoothstep(0.6, 0.85, sin(depth * 24.0 - time * 1.6 + sin(vW.x * 0.13) * 2.0) * 0.5 + 0.5) * smoothstep(1.4, 0.15, depth);
        float foam = clamp(shore * 0.8 + bands * 0.5, 0.0, 1.0) * (0.7 + 0.3 * sin(time * 2.0 + vW.x * 0.3));
        col = mix(col, foamCol * (0.25 + 0.75 * light), foam * 0.75);
        float fogF = 1.0 - exp(-fogDensity * fogDensity * vDist * vDist);
        col = mix(col, fogColor, fogF);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`
  });
  const sea = new THREE.Mesh(g, m); sea.frustumCulled = false; sea.renderOrder = -1; sea.name = 'sea'; scene.add(sea);
  return sea;
}

/* ---------------- 河 ---------------- */
function buildRiver() {
  const prof = riverProfile();
  const pts = []; const total = RIVER.length - 1;
  for (let i = 0; i < total; i++) { const L = Math.hypot(RIVER[i + 1][0] - RIVER[i][0], RIVER[i + 1][1] - RIVER[i][1]); const n = Math.max(4, Math.round(L / 4)); for (let k = 0; k < n; k++) { const t = k / n; pts.push([lerp(RIVER[i][0], RIVER[i + 1][0], t), lerp(RIVER[i][1], RIVER[i + 1][1], t), lerp(prof[i], prof[i + 1], t)]); } }
  pts.push([RIVER[total][0], RIVER[total][1], prof[total]]);
  const pos = [], uv = [], idx = []; let acc = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let dx = b[0] - a[0], dz = b[1] - a[1]; const L = Math.hypot(dx, dz); dx /= L; dz /= L;
    if (i > 0) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const y = pts[i][2]; const W = pts[i][1] < -100 ? 4.6 : 6.2;
    pos.push(pts[i][0] - dz * W, y, pts[i][1] + dx * W, pts[i][0] + dz * W, y, pts[i][1] - dx * W); uv.push(0, acc, 1, acc);
    if (i < pts.length - 1) { const o = i * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    uniforms: SEA_U,
    vertexShader: `varying vec3 vW; varying vec2 vUv; varying float vDist; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vDist = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float time, light, night, fogDensity; uniform vec3 sunDir, sunCol, fogColor; uniform samplerCube envCube; varying vec3 vW; varying vec2 vUv; varying float vDist; ${WATER_COMMON}
      void main(){ vec3 n = wnorm(vec2(vUv.x * 9.0, vUv.y * 1.2 - time * 2.2), time * 0.5); n = normalize(mix(n, vec3(0.0, 1.0, 0.0), 0.35)); vec3 v = normalize(cameraPosition - vW);
        float fr = 0.02 + 0.98 * pow(1.0 - max(dot(n, v), 0.0), 5.0); vec3 r = reflect(-v, n); r.y = abs(r.y);
        vec3 refl = textureCube(envCube, r).rgb;
        float edge = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
        vec3 body = mix(vec3(0.05, 0.09, 0.07), vec3(0.03, 0.08, 0.09), edge) * (0.3 + 0.7 * light);
        vec3 col = mix(body, refl, fr * 0.9); vec3 h = normalize(sunDir + v); col += sunCol * pow(max(dot(n, h), 0.0), 400.0) * 20.0 * (1.0 - night);
        col = mix(col, vec3(0.5, 0.52, 0.48) * light, (1.0 - edge) * 0.25);
        col = mix(col, fogColor, 1.0 - exp(-fogDensity * fogDensity * vDist * vDist));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`
  });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'river'; scene.add(mesh);
}

/* ---------------- 远方的岛影 ---------------- */
let farMat;
function buildFarLand() {
  farMat = new THREE.MeshStandardMaterial({ color: lin(0x5f7a6a), roughness: 1, fog: true });
  const group = new THREE.Group();
  const spots = [[-0.4, 1600, 170, 380], [0.2, 1750, 120, 300], [1.1, 1500, 80, 220], [2.2, 1900, 220, 420], [2.9, 1550, 90, 260], [3.6, 1700, 140, 320], [4.4, 2000, 260, 460], [5.2, 1600, 110, 280], [5.8, 1800, 180, 360]];
  for (const s of spots) {
    const geo = new THREE.ConeGeometry(s[3], s[2], 40, 8, true); const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const a = Math.atan2(z, x); const k = 1 + (fbm(a * 2 + s[0] * 10, y * 0.02, 3) - 0.5) * 0.6; p.setX(i, x * k); p.setZ(i, z * k * 0.7); }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, farMat); mesh.position.set(Math.cos(s[0]) * s[1], s[2] / 2 - 22, Math.sin(s[0]) * s[1]); mesh.scale.set(1.6, 1, 1); mesh.rotation.y = s[0]; group.add(mesh);
  }
  group.name = 'farland'; scene.add(group);
}
