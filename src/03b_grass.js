/* ---------------- 草地：玩家周围的 GPU 草叶（新海诚式的草浪） ----------------
   一大片草叶在着色器里绕镜头"循环平铺"，高度与草量取自地形网格，
   被道路、人行道、建筑覆盖的地方（俯视渲染得到的覆盖高度图）不长草。 */
const GRASS = { mesh: null, U: null, size: 56 };

// 俯视渲染整个岛上的"人造物"（地形、水、植被、天空、角色、车辆、透明物除外）
function renderTopDown(N, mat, type, fromBelow) {
  const W = WORLD, sx = W.x1 - W.x0, sz = W.z1 - W.z0;
  const rt = new THREE.WebGLRenderTarget(N, Math.round(N * sz / sx), { type, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false });
  const cam = new THREE.OrthographicCamera(-sx / 2, sx / 2, sz / 2, -sz / 2, 1, 1500);
  cam.position.set((W.x0 + W.x1) / 2, fromBelow ? -700 : 700, (W.z0 + W.z1) / 2); cam.rotation.set(fromBelow ? Math.PI / 2 : -Math.PI / 2, 0, 0); cam.updateMatrixWorld(true);
  scene.updateMatrixWorld(true);
  const skip = new Set([terrainMesh, GRASS.mesh, ...CARD_MESHES, ...FOREST.meshes]);
  const hidden = [];
  const hide = (o) => { if (o && o.visible) { o.visible = false; hidden.push(o); } };
  for (const v of VEHICLES) hide(v.g); for (const c of CHARS) hide(c.root);
  scene.traverse(o => {
    if (o === scene) return;
    if (skip.has(o) || (fromBelow && /^bark\|/.test(o.name)) || o.name === 'sea' || o.name === 'river' || o.name === 'farland' || o.isSprite || o.isPoints || o.isLine || o.isInstancedMesh || o.isSkinnedMesh) { hide(o); return; }
    if (o.isMesh) { const m = o.material; if (!m || m.transparent || (Array.isArray(m) && m.some(x => x.transparent))) hide(o); }
  });
  hide(SKY.sky); hide(SKY.overlay);
  const prevFog = scene.fog, prevC = new THREE.Color(); renderer.getClearColor(prevC); const prevA = renderer.getClearAlpha();
  scene.fog = null; scene.overrideMaterial = mat;
  renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, cam);
  renderer.setRenderTarget(null); scene.overrideMaterial = null; scene.fog = prevFog; renderer.setClearColor(prevC, prevA);
  for (const o of hidden) o.visible = true;
  return rt;
}
// 草地覆盖图：R = 最高人造表面高度，G = 是否有覆盖
function renderGrassCover(N) {
  const mat = new THREE.ShaderMaterial({ side: THREE.DoubleSide,
    vertexShader: 'varying float vY; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vY = w.y; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'varying float vY; void main(){ gl_FragColor = vec4(vY, 1.0, 0.0, 1.0); }' });
  const rt = renderTopDown(N, mat, THREE.HalfFloatType); mat.dispose(); return rt.texture;
}
/* 占用图（CPU 可查询）：道路、人行道、建筑、铁路、栏杆等占据的位置不再种树和灌木 */
const OCC = { data: null, w: 0, h: 0 };
// 从地下往上看，记录每处最低的人造表面高度（16 位编码在 RG 中），再与地形比较：贴地的才算占用
function buildOccupancy() {
  const W = WORLD, sx = W.x1 - W.x0; const N = Math.round(sx / 0.5);
  const mat = new THREE.ShaderMaterial({ side: THREE.DoubleSide,
    vertexShader: 'varying float vY; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vY = w.y; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'varying float vY; void main(){ float v = clamp((vY + 50.0) / 250.0, 0.0, 1.0) * 255.0; gl_FragColor = vec4(floor(v) / 255.0, fract(v), 0.0, 1.0); }' });
  const rt = renderTopDown(N, mat, THREE.UnsignedByteType, true); mat.dispose();
  const w = rt.width, h = rt.height, px = new Uint8Array(w * h * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, w, h, px); rt.dispose();
  OCC.w = w; OCC.h = h; OCC.data = new Uint8Array(w * h);
  const G = TERRAIN_GRID;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = (j * w + i) * 4; if (px[k + 3] < 128) continue;
    const y = (px[k] + px[k + 1] / 255) / 255 * 250 - 50;
    const x = W.x0 + (i + 0.5) / w * sx, z = W.z0 + (j + 0.5) / h * (W.z1 - W.z0);
    const gi = clamp(Math.round((x - G.x0) / G.dx), 0, G.nx - 1), gj = clamp(Math.round((z - G.z0) / G.dz), 0, G.nz - 1);
    const th = G.data[(gj * G.nx + gi) * 4];
    if (y < th + 2.2) OCC.data[j * w + i] = 1;
  }
}
function occAt(x, z) {
  if (!OCC.data) return false; const W = WORLD;
  const i = Math.floor((x - W.x0) / (W.x1 - W.x0) * OCC.w), j = Math.floor((z - W.z0) / (W.z1 - W.z0) * OCC.h);
  if (i < 0 || j < 0 || i >= OCC.w || j >= OCC.h) return false;
  return OCC.data[j * OCC.w + i] === 1;
}
// 以 (x,z) 为圆心、半径 r 内是否有占用（中心 + 两圈采样）
function occNear(x, z, r) {
  if (occAt(x, z)) return true;
  for (const k of [0.5, 1]) for (let a = 0; a < 8; a++) { const t = a / 8 * TAU; if (occAt(x + Math.cos(t) * r * k, z + Math.sin(t) * r * k)) return true; }
  return false;
}

function buildGrass() {
  if (!TERRAIN_GRID || !renderer.capabilities.isWebGL2 || Q.grass < 0.3) return;
  const G = TERRAIN_GRID;
  const field = new THREE.DataTexture(G.data, G.nx, G.nz, THREE.RGBAFormat, THREE.FloatType);
  field.minFilter = field.magFilter = THREE.NearestFilter; field.generateMipmaps = false; field.needsUpdate = true;
  const cover = renderGrassCover(Q.grass >= 1 ? 2048 : 1024);
  const S = GRASS.size = Q.grass >= 1 ? 56 : 42, n = Math.round((Q.grass >= 1 ? 190000 : 80000));
  // 草叶模板：两节 + 尖（5 顶点 3 三角形）
  const TV = [[-1, 0], [1, 0], [-0.75, 0.45], [0.75, 0.45], [0, 1]], TI = [0, 1, 2, 2, 1, 3, 2, 3, 4];
  const pos = new Float32Array(n * 15), bl = new Float32Array(n * 20), idx = new Uint32Array(n * 9);
  const r = mulberry32(777);
  for (let b = 0; b < n; b++) {
    const ox = r() * S, oz = r() * S, r1 = r(), r2 = r();
    for (let v = 0; v < 5; v++) { const k = b * 5 + v; pos[k * 3] = TV[v][0]; pos[k * 3 + 1] = TV[v][1]; bl.set([ox, oz, r1, r2], k * 4); }
    for (let i = 0; i < 9; i++) idx[b * 9 + i] = b * 5 + TI[i];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aBlade', new THREE.BufferAttribute(bl, 4)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const U = GRASS.U = {
    gCam: { value: new THREE.Vector2() }, gSize: { value: S }, gField: { value: field }, gFieldBox: { value: new THREE.Vector4(G.x0, G.z0, G.dx, G.dz) }, gFieldN: { value: new THREE.Vector2(G.nx, G.nz) },
    gCover: { value: cover }, gCoverBox: { value: new THREE.Vector4(WORLD.x0, WORLD.z0, WORLD.x1 - WORLD.x0, WORLD.z1 - WORLD.z0) },
    gH: { value: 0.36 }, gW: { value: 0.028 }, uTime: WIND.uTime, uWind: WIND.uWind, gTex: TERRAIN_U.tGrass
  };
  const m = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = `attribute vec4 aBlade;
      uniform vec2 gCam; uniform float gSize, gH, gW, uTime, uWind; uniform sampler2D gField, gCover; uniform vec4 gFieldBox, gCoverBox; uniform vec2 gFieldN;
      varying float vGT, vGust, vGRand, vGMacro, vFlower; varying vec2 vGXZ;
      vec4 gTexel(vec2 i){ return texture2D(gField, (clamp(i, vec2(0.0), gFieldN - 1.0) + 0.5) / gFieldN); }
      vec4 fieldAt(vec2 p){ vec2 u = (p - gFieldBox.xy) / gFieldBox.zw; vec2 i = floor(u), f = u - i;
        return mix(mix(gTexel(i), gTexel(i + vec2(1.0, 0.0)), f.x), mix(gTexel(i + vec2(0.0, 1.0)), gTexel(i + vec2(1.0, 1.0)), f.x), f.y); }
      float gHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float gNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(gHash(i), gHash(i + vec2(1.0, 0.0)), f.x), mix(gHash(i + vec2(0.0, 1.0)), gHash(i + vec2(1.0, 1.0)), f.x), f.y); }
      ` + sh.vertexShader
      .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = vec3(0.0, 1.0, 0.0);')
      .replace('#include <begin_vertex>', `
        vec2 gwp = gCam + mod(aBlade.xy - gCam + gSize * 0.5, gSize) - gSize * 0.5;
        vec4 gf = fieldAt(gwp);
        vec4 cv = texture2D(gCover, vec2((gwp.x - gCoverBox.x) / gCoverBox.z, (gCoverBox.y + gCoverBox.w - gwp.y) / gCoverBox.w));
        float covered = cv.g > 0.5 && cv.r > gf.x - 0.5 ? 1.0 : 0.0;
        float gd = length(gwp - gCam);
        float macro = gNoise(gwp * 0.07) * 0.7 + gNoise(gwp * 0.31) * 0.3;
        float dens = smoothstep(0.4, 0.8, gf.y) * (1.0 - covered) * (1.0 - smoothstep(gSize * 0.3, gSize * 0.5, gd));
        float keep = step(aBlade.z, dens * mix(0.45, 1.0, macro));
        float meadow = smoothstep(0.45, 0.75, gNoise(gwp * 0.018 + 7.0));
        float hgt = gH * mix(0.55, 1.35, aBlade.w) * mix(0.65, 1.3, macro) * mix(1.0, 1.6, meadow * smoothstep(0.75, 1.0, gf.w)) * gf.w * keep;
        vFlower = step(0.985, fract(aBlade.w * 91.7)) * step(0.3, macro) * step(0.5, gf.w);
        float t = position.y;
        float ang = aBlade.w * 6.2831 + aBlade.z * 3.0;
        vec3 sideV = vec3(cos(ang), 0.0, sin(ang));
        float w = gW * mix(0.75, 1.3, fract(aBlade.z * 7.31)) * mix(0.62, 1.0, gf.w) * (1.0 + smoothstep(10.0, gSize * 0.5, gd) * 1.5);
        // 草浪：沿风向推进的阵风带 + 低频噪声
        float wave = sin(dot(gwp, vec2(0.13, 0.08)) - uTime * 1.7) * 0.5 + 0.5;
        float wn = gNoise(gwp * 0.045 - vec2(uTime * 0.35, uTime * 0.22));
        float gust = clamp(wave * 0.55 + wn * 0.75 - 0.3, 0.0, 1.0) * uWind;
        vec2 wdir = vec2(0.85, 0.53);
        float flutter = sin(uTime * 4.3 + aBlade.z * 40.0) * 0.06;
        vec2 lean = (wdir * (0.12 + gust * 0.8) + vec2(cos(ang * 1.7), sin(ang * 1.7)) * 0.2 + flutter) * t * t * hgt;
        vec3 transformed = vec3(gwp.x, gf.x - 0.03, gwp.y) + sideV * position.x * w * mix(1.0 - t * 0.9, 1.0 + t * 2.2, vFlower) + vec3(lean.x, t * hgt * (1.0 - 0.3 * gust * t), lean.y);
        vGT = t; vGust = gust; vGRand = aBlade.w; vGMacro = macro; vGXZ = gwp;`);
    sh.fragmentShader = `uniform sampler2D gTex; varying float vGT, vGust, vGRand, vGMacro, vFlower; varying vec2 vGXZ;
      ` + sh.fragmentShader.replace('#include <color_fragment>', `
        // 根部取地面草色，向上提亮并偏黄绿；阵风经过的草叶翻出亮面
        vec3 gb = pow(mix(texture2D(gTex, vGXZ / 4.5).rgb, texture2D(gTex, vGXZ / 13.0).rgb, 0.35), vec3(2.2));
        vec3 gc = gb * mix(0.38, 1.28, smoothstep(0.0, 0.9, vGT)) * mix(0.82, 1.15, vGRand) * mix(0.85, 1.12, vGMacro);
        gc = mix(gc, gc * vec3(1.22, 1.12, 0.62), vGT * vGT * 0.55);
        gc = mix(gc, gc * vec3(1.3, 1.25, 0.9), vGust * vGT * 0.7);
        // 零星野花：白、黄、淡紫
        vec3 fc = vGRand < 0.33 ? vec3(0.95, 0.95, 0.9) : vGRand < 0.66 ? vec3(1.0, 0.82, 0.2) : vec3(0.75, 0.6, 0.95);
        gc = mix(gc, fc, vFlower * smoothstep(0.5, 0.7, vGT));
        diffuseColor.rgb *= gc;`);
  };
  const mesh = GRASS.mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false; mesh.name = 'grass';
  scene.add(mesh);
}
const _gFwd = new THREE.Vector3();
function updateGrass() {
  if (!GRASS.mesh) return;
  camera.getWorldDirection(_gFwd); const k = Math.hypot(_gFwd.x, _gFwd.z) || 1; const a = GRASS.size * 0.22;
  GRASS.U.gCam.value.set(camera.position.x + _gFwd.x / k * a, camera.position.z + _gFwd.z / k * a);
  GRASS.mesh.visible = camera.position.y - groundAt(camera.position.x, camera.position.z) < 60;
}
