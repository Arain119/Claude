/* ==========================================================================
   地形 · 海 · 河 · 天空 · 远山
   ========================================================================== */
const TOWN_Y = 2;
const RIVER = [[-82, -98], [-76, -70], [-72, -40], [-70, -5], [-73, 30], [-80, 70], [-92, 110], [-104, 150], [-114, 196]];
const CAPE_PATH = [[100, -82, 2], [90, -96, 5.5], [95, -114, 10], [108, -122, 15], [116, -113, 18.5]];
const CAPE = { x: 118, z: -110, y: 18.5 };
const SHRINE = { x: -40, z: -130, y: 14 };

function islandC(x, z) {
  const a = 215, b = 178, th = Math.atan2(z, x);
  const sr = 1 + 0.07 * Math.sin(3 * th + 0.8) + 0.05 * Math.sin(5 * th + 2.1) + 0.03 * Math.sin(9 * th + 0.3);
  return 1 - Math.hypot(x / a, z / b) / sr;
}
const gauss = (x, z, cx, cz, r, h) => h * Math.exp(-((x - cx) * (x - cx) + (z - cz) * (z - cz)) / (r * r));
function flatW(x, z, x0, x1, z0, z1, m) { return smooth(x0 - m, x0, x) * (1 - smooth(x1, x1 + m, x)) * smooth(z0 - m, z0, z) * (1 - smooth(z1, z1 + m, z)); }
function polyDist(pts, x, z) {
  let best = 1e9, bt = 0, acc = 0, bi = 0;
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

function terrainH(x, z) {
  const c = islandC(x, z);
  let h = lerp(-7, 2.2, smooth(-0.13, 0.09, c));
  const inl = smooth(0.02, 0.2, c);
  h += (fbm(x * 0.012 + 3, z * 0.012 - 7, 3) - 0.5) * 3.0 * inl;
  const hill = gauss(x, z, -60, -152, 62, 17) + gauss(x, z, 25, -165, 55, 13) + gauss(x, z, -140, -118, 55, 15) + gauss(x, z, -184, -58, 38, 13) + gauss(x, z, 152, -64, 34, 14) + gauss(x, z, 92, -142, 40, 9);
  h += hill * inl;
  h += gauss(x, z, CAPE.x, CAPE.z, 34, 17) * smooth(-0.03, 0.05, c);
  // 镇区平整
  let w = flatW(x, z, -112, 108, -84, 72, 14); h = lerp(h, TOWN_Y, w);
  w = flatW(x, z, 100, 129, -34, 64, 6); h = lerp(h, TOWN_Y, w);
  // 南侧沙滩逐渐降低
  h -= smooth(80, 150, z) * smooth(140, 70, Math.abs(x - 10)) * 1.5;
  // 铁路通道
  w = flatW(x, z, -166, 138, -71, -49, 5); h = lerp(h, TOWN_Y, w);
  // 神社台地与参道坡
  w = flatW(x, z, -64, -16, -152, -110, 8); h = lerp(h, SHRINE.y, w);
  const rampY = lerp(TOWN_Y, SHRINE.y, clamp((-86 - z) / 24, 0, 1));
  w = flatW(x, z, -46, -34, -110, -86, 3); h = lerp(h, rampY, w);
  // 灯塔岬小路与平台
  const pd = polyDist(CAPE_PATH, x, z);
  if (pd < 8) { const i = polyDist.i, t = polyDist.t; const py = lerp(CAPE_PATH[i][2], CAPE_PATH[i + 1][2], t); h = lerp(h, py, smooth(6.5, 2.2, pd)); }
  w = smooth(16, 11, Math.hypot(x - CAPE.x, z - CAPE.z)); h = lerp(h, CAPE.y, w);
  // 河道
  const rd = riverDist(x, z);
  if (rd < 10) { const prof = rd < 5 ? -0.9 : lerp(-0.9, h, smooth(5, 8.6, rd)); h = Math.min(h, prof); }
  // 港湾
  w = smooth(127.6, 129, x) * smooth(-31, -27, z) * (1 - smooth(57, 61, z)); h = lerp(h, -4.5, w);
  return h;
}

/* ---------------- 地形网格 ---------------- */
function buildTerrain() {
  const S = 560, N = 280, half = S / 2;
  const g = new THREE.PlaneGeometry(S, S, N, N); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position; const col = new Float32Array(p.count * 3); const uv = g.attributes.uv;
  const cGrassA = new THREE.Color(0x9fc95c), cGrassB = new THREE.Color(0x78ab4a), cDry = new THREE.Color(0xb9c06a), cDirt = new THREE.Color(0xb39a72), cRock = new THREE.Color(0x9b968c), cSand = new THREE.Color(0xf0e2b6), cWet = new THREE.Color(0xc9b588), cDeep = new THREE.Color(0x6aa5a0), cGravel = new THREE.Color(0xd8d2c4), cStoneBank = new THREE.Color(0xa7a399), tmp = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i); const h = terrainH(x, z); p.setY(i, h);
    const e = 1.2; const sx = (terrainH(x + e, z) - terrainH(x - e, z)) / (2 * e), sz = (terrainH(x, z + e) - terrainH(x, z - e)) / (2 * e);
    const slope = Math.hypot(sx, sz);
    const n = fbm(x * 0.05, z * 0.05, 3);
    tmp.copy(cGrassA).lerp(cGrassB, n).lerp(cDry, smooth(0.6, 0.8, fbm(x * 0.02 + 9, z * 0.02, 2)) * 0.5);
    tmp.lerp(cDirt, smooth(0.45, 0.8, slope)); tmp.lerp(cRock, smooth(0.9, 1.4, slope));
    const c = islandC(x, z);
    const sandy = Math.max(smooth(1.25, 0.6, h) * smooth(0.0, 0.2, 0.25 - c * 0.5 + 0.05), smooth(84, 100, z) * smooth(150, 110, Math.abs(x - 10)));
    tmp.lerp(cSand, clamp(sandy, 0, 1));
    tmp.lerp(cWet, smooth(0.35, -0.2, h) * 0.8); tmp.lerp(cDeep, smooth(-0.8, -4, h));
    if (Math.hypot(x - SHRINE.x, z - SHRINE.z + 2) < 26 && Math.abs(h - SHRINE.y) < 0.4) tmp.lerp(cGravel, 0.85);
    if (polyDist(CAPE_PATH, x, z) < 1.8) tmp.lerp(cDirt, 0.75);
    const rd = riverDist(x, z); if (rd < 9 && h > -0.5) tmp.lerp(cStoneBank, 0.85);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
    uv.setXY(i, x / 5, z / 5);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, map: TEX.grass, roughness: 0.95, metalness: 0 });
  const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; mesh.name = 'terrain';
  scene.add(mesh);
}

/* 深度贴图（供海面浅滩与泡沫） */
let DEPTH_TEX;
function buildDepthTex() {
  const N = 384, S = 640; const data = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = -S / 2 + (i + 0.5) * S / N, z = -S / 2 + (j + 0.5) * S / N; const h = terrainH(x, z);
    const d = clamp(-h / 8, 0, 1); const k = (j * N + i) * 4; data[k] = d * 255; data[k + 1] = h > 0 ? 255 : 0; data[k + 2] = 0; data[k + 3] = 255;
  }
  DEPTH_TEX = new THREE.DataTexture(data, N, N, THREE.RGBAFormat); DEPTH_TEX.magFilter = THREE.LinearFilter; DEPTH_TEX.minFilter = THREE.LinearFilter; DEPTH_TEX.needsUpdate = true;
  DEPTH_TEX.userData = { S };
}

/* ---------------- 海 ---------------- */
const SEA_U = {
  time: { value: 0 }, depthTex: { value: null }, depthS: { value: 640 }, sunDir: { value: new THREE.Vector3(0.4, 0.6, 0.3) },
  sunCol: { value: new THREE.Color(1, 0.95, 0.85) }, skyCol: { value: new THREE.Color(0x9fd2ee) }, deepCol: { value: new THREE.Color(0x1e6aa6) },
  shallowCol: { value: new THREE.Color(0x58d1c9) }, foamCol: { value: new THREE.Color(1, 1, 1) }, light: { value: 1 }, waves: { value: 1 },
  fogColor: { value: new THREE.Color() }, fogNear: { value: 100 }, fogFar: { value: 1000 }, moonDir: { value: new THREE.Vector3(0, 0.5, -1) }, night: { value: 0 }
};
const WATER_COMMON = `
  float wh(vec2 p, float t){ return sin(p.x*0.07+t*0.9)*0.35 + sin(p.y*0.09-t*1.1)*0.28 + sin((p.x+p.y)*0.21+t*1.7)*0.08; }
  vec3 wnorm(vec2 p, float t){
    float e=0.4; vec2 q=p;
    float h=sin(q.x*0.5+t*1.5)*0.6+sin(q.y*0.63-t*1.2)*0.5+sin((q.x-q.y)*1.31+t*2.4)*0.25+sin((q.x*0.8+q.y*1.7)*2.3-t*3.1)*0.12;
    float hx=cos(q.x*0.5+t*1.5)*0.3+cos((q.x-q.y)*1.31+t*2.4)*0.33+cos((q.x*0.8+q.y*1.7)*2.3-t*3.1)*0.22;
    float hz=-cos(q.y*0.63-t*1.2)*0.32-cos((q.x-q.y)*1.31+t*2.4)*0.33+cos((q.x*0.8+q.y*1.7)*2.3-t*3.1)*0.47;
    return normalize(vec3(-hx*0.18,1.0,-hz*0.18));
  }`;
function buildSea() {
  const g = new THREE.PlaneGeometry(4000, 4000, 160, 160); g.rotateX(-Math.PI / 2);
  SEA_U.depthTex.value = DEPTH_TEX;
  const m = new THREE.ShaderMaterial({
    uniforms: SEA_U, fog: false, transparent: false,
    vertexShader: `uniform float time; uniform float waves; varying vec3 vW; varying float vDist; ${WATER_COMMON}
      void main(){ vec4 w=modelMatrix*vec4(position,1.0); float d=length(w.xz); w.y+= wh(w.xz,time)*waves*0.12; vW=w.xyz; vec4 mv=viewMatrix*w; vDist=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float time; uniform sampler2D depthTex; uniform float depthS; uniform vec3 sunDir,sunCol,skyCol,deepCol,shallowCol,foamCol,fogColor,moonDir; uniform float light,fogNear,fogFar,night;
      varying vec3 vW; varying float vDist; ${WATER_COMMON}
      void main(){
        vec2 duv=vW.xz/depthS+0.5; vec4 dt=texture2D(depthTex,duv); float depth=dt.r*8.0;
        if(duv.x<0.0||duv.x>1.0||duv.y<0.0||duv.y>1.0) depth=8.0;
        vec3 n=wnorm(vW.xz*0.6,time); n=normalize(mix(n,vec3(0.0,1.0,0.0),smoothstep(40.0,260.0,vDist)*0.85)); vec3 v=normalize(cameraPosition-vW);
        float fr=pow(1.0-max(dot(n,v),0.0),3.0);
        vec3 base=mix(shallowCol,deepCol,smoothstep(0.2,5.5,depth));
        vec3 col=mix(base*light, skyCol, fr*0.75+0.08);
        vec3 h=normalize(sunDir+v); float sp=pow(max(dot(n,h),0.0),180.0); col+=sunCol*sp*2.2*(1.0-night);
        float glit=step(0.985,fract(sin(dot(floor(vW.xz*3.0),vec2(12.9898,78.233)))*43758.5453)) * pow(max(dot(n,h),0.0),40.0);
        col+=sunCol*glit*1.2*(1.0-night)*smoothstep(220.0,60.0,vDist);
        vec3 hm=normalize(moonDir+v); col+=vec3(0.75,0.82,1.0)*pow(max(dot(n,hm),0.0),120.0)*night*1.4;
        float shore=1.0-smoothstep(0.0,0.55,depth);
        float bands=smoothstep(0.55,0.75,sin(depth*26.0-time*1.8+sin(vW.x*0.15)*2.0)*0.5+0.5)*smoothstep(1.2,0.15,depth);
        float foam=clamp(shore*0.85+bands*0.6,0.0,1.0)*(0.75+0.25*sin(time*2.0+vW.x*0.3));
        col=mix(col,foamCol*light*1.05,foam*0.85);
        float fog=smoothstep(fogNear,fogFar,vDist); col=mix(col,fogColor,fog);
        gl_FragColor=vec4(col,1.0);
      }`
  });
  const sea = new THREE.Mesh(g, m); sea.frustumCulled = false; sea.renderOrder = -1; sea.name = 'sea'; scene.add(sea);
  return sea;
}

/* ---------------- 河 ---------------- */
const RIVER_U = { time: SEA_U.time, light: SEA_U.light, skyCol: SEA_U.skyCol, sunDir: SEA_U.sunDir, sunCol: SEA_U.sunCol, fogColor: SEA_U.fogColor, fogNear: SEA_U.fogNear, fogFar: SEA_U.fogFar, night: SEA_U.night };
function buildRiver() {
  const pts = []; const total = RIVER.length - 1;
  for (let i = 0; i < total; i++) for (let k = 0; k < 8; k++) { const t = k / 8; pts.push([lerp(RIVER[i][0], RIVER[i + 1][0], t), lerp(RIVER[i][1], RIVER[i + 1][1], t), i + t]); }
  pts.push([RIVER[total][0], RIVER[total][1], total]);
  const pos = [], uv = [], idx = []; let acc = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let dx = b[0] - a[0], dz = b[1] - a[1]; const L = Math.hypot(dx, dz); dx /= L; dz /= L;
    if (i > 0) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const y = lerp(0.35, -0.05, smooth(total - 1.6, total - 0.4, pts[i][2]));
    const W = 6.2; pos.push(pts[i][0] - dz * W, y, pts[i][1] + dx * W, pts[i][0] + dz * W, y, pts[i][1] - dx * W); uv.push(0, acc, 1, acc);
    if (i < pts.length - 1) { const o = i * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    uniforms: RIVER_U,
    vertexShader: `varying vec3 vW; varying vec2 vUv; varying float vDist; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; vec4 mv=viewMatrix*w; vDist=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float time,light,fogNear,fogFar,night; uniform vec3 skyCol,sunDir,sunCol,fogColor; varying vec3 vW; varying vec2 vUv; varying float vDist; ${WATER_COMMON}
      void main(){ vec3 n=wnorm(vec2(vUv.x*6.0,vUv.y*0.8-time*1.6),time*0.6); vec3 v=normalize(cameraPosition-vW);
        float fr=pow(1.0-max(dot(n,v),0.0),3.0); float edge=smoothstep(0.0,0.12,vUv.x)*smoothstep(1.0,0.88,vUv.x);
        vec3 base=mix(vec3(0.36,0.55,0.48),vec3(0.27,0.55,0.62),edge)*light;
        vec3 col=mix(base,skyCol,fr*0.7+0.12); vec3 h=normalize(sunDir+v); col+=sunCol*pow(max(dot(n,h),0.0),160.0)*1.6*(1.0-night);
        float ripple=smoothstep(0.93,1.0,sin(vUv.y*2.5-time*2.4+sin(vUv.x*9.0)*1.5))*0.15; col+=ripple*light;
        col=mix(col,vec3(0.9,0.95,0.95)*light,(1.0-edge)*0.35);
        col=mix(col,fogColor,smoothstep(fogNear,fogFar,vDist)); gl_FragColor=vec4(col,1.0);} `
  });
  const mesh = new THREE.Mesh(g, m); mesh.name = 'river'; scene.add(mesh);
}

/* ---------------- 天空 ---------------- */
const SKY_U = {
  time: SEA_U.time, sunDir: SEA_U.sunDir, moonDir: SEA_U.moonDir, night: SEA_U.night,
  topCol: { value: new THREE.Color(0x3f8fe0) }, horCol: { value: new THREE.Color(0xcfe8f6) }, botCol: { value: new THREE.Color(0xe6f1f6) },
  cloudLit: { value: new THREE.Color(0xffffff) }, cloudShade: { value: new THREE.Color(0xa9b4d6) }, sunGlow: { value: new THREE.Color(0xfff2d6) }, cover: { value: 0.52 }
};
function buildSky() {
  const g = new THREE.SphereGeometry(2600, 48, 24);
  const m = new THREE.ShaderMaterial({
    uniforms: SKY_U, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir=normalize(position); vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position=p.xyww; }`,
    fragmentShader: `uniform vec3 sunDir,moonDir,topCol,horCol,botCol,cloudLit,cloudShade,sunGlow; uniform float time,night,cover; varying vec3 vDir;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
      float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<5;i++){ s+=a*noise(p); p=p*2.03+vec2(1.7,9.2); a*=0.5;} return s; }
      void main(){
        vec3 d=normalize(vDir); float y=d.y;
        vec3 col=mix(horCol,topCol,pow(smoothstep(0.0,0.75,y),0.7));
        col=mix(col,botCol,smoothstep(0.02,-0.12,y));
        float sd=max(dot(d,normalize(sunDir)),0.0);
        col+=sunGlow*(pow(sd,8.0)*0.35+pow(sd,64.0)*0.5)*(1.0-night*0.9);
        col+=vec3(1.0,0.98,0.9)*smoothstep(0.9993,0.9997,sd)*(1.0-night);
        // 星星与月亮
        if(night>0.01){ vec2 sp=vec2(atan(d.z,d.x)*60.0,d.y*90.0); vec2 cell=floor(sp); float h=hash(cell); float st=step(0.985,h)*smoothstep(0.35,0.0,length(fract(sp)-0.5))*smoothstep(0.0,0.25,y);
          col+=vec3(0.9,0.95,1.0)*st*night*(0.6+0.4*sin(time*3.0+h*40.0));
          float md=dot(d,normalize(moonDir)); col+=vec3(1.0,0.97,0.88)*smoothstep(0.99955,0.9997,md)*night; col+=vec3(0.5,0.6,0.85)*pow(max(md,0.0),60.0)*0.25*night; }
        // 云
        if(y>0.0){
          vec2 uv=d.xz/(y+0.18)*1.6 + vec2(time*0.006,time*0.002);
          vec2 w=vec2(fbm(uv*0.8),fbm(uv*0.8+5.2));
          float c=fbm(uv*1.1+w*0.9); float c2=fbm(uv*1.1+w*0.9+normalize(sunDir.xz+0.001)*0.08);
          float dens=smoothstep(cover,cover+0.16,c); float lit=clamp((c-c2)*6.0+0.55,0.0,1.0);
          vec3 cc=mix(cloudShade,cloudLit,smoothstep(0.35,0.65,lit)); cc+=sunGlow*pow(sd,6.0)*0.35;
          dens*=smoothstep(0.0,0.12,y);
          col=mix(col,cc,dens*0.95);
        }
        gl_FragColor=vec4(col,1.0);
      }`
  });
  const sky = new THREE.Mesh(g, m); sky.frustumCulled = false; sky.renderOrder = -10; sky.name = 'sky'; scene.add(sky);
  return sky;
}

/* ---------------- 远山与远岛 ---------------- */
let farMat;
function buildFarLand() {
  farMat = new THREE.MeshBasicMaterial({ color: 0x8fb0c8, fog: true });
  const group = new THREE.Group();
  const spots = [[-0.4, 1000, 170, 260], [0.2, 1150, 120, 220], [1.1, 900, 80, 160], [2.2, 1250, 220, 300], [2.9, 950, 90, 180], [3.6, 1100, 140, 240], [4.4, 1300, 260, 340], [5.2, 980, 110, 200], [5.8, 1200, 180, 260]];
  for (const s of spots) {
    const geo = new THREE.ConeGeometry(s[3], s[2], 28, 6, true);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const a = Math.atan2(z, x); const k = 1 + (vnoise(a * 3 + s[0] * 10, y * 0.02) - 0.5) * 0.5; p.setX(i, x * k); p.setZ(i, z * k * 0.7); }
    const mesh = new THREE.Mesh(geo, farMat);
    mesh.position.set(Math.cos(s[0]) * s[1], s[2] / 2 - 18, Math.sin(s[0]) * s[1]); mesh.scale.set(1.6, 1, 1);
    mesh.rotation.y = s[0]; group.add(mesh);
  }
  scene.add(group);
}
