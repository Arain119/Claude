/* ==========================================================================
   载具：Tripo 生成的写实车辆（GLB）→ 归一化 → 拆出车轮 → AI 交通 / 玩家驾驶
   ========================================================================== */
const VEH_TYPES = {
  kei: { len: 3.4, front: 'x', wheelR: 0.29, mass: 0.8, vmax: 33, acc: 6.5, name: '轻型车' },
  sedan: { len: 4.65, front: 'x', wheelR: 0.31, mass: 1.2, vmax: 46, acc: 8.0, name: '轿车' },
  minivan: { len: 4.7, front: 'x', wheelR: 0.32, mass: 1.4, vmax: 40, acc: 7.0, name: '小型厢式车' },
  keitruck: { len: 3.4, front: 'x', wheelR: 0.28, mass: 0.9, vmax: 30, acc: 6.0, name: '轻型卡车' },
  taxi: { len: 4.7, front: 'x', wheelR: 0.31, mass: 1.25, vmax: 44, acc: 7.6, name: '出租车' },
  bus: { len: 7.2, front: 'x', wheelR: 0.45, mass: 3.5, vmax: 24, acc: 3.2, name: '社区巴士' },
  scooter: { len: 1.85, front: 'auto', wheelR: 0, mass: 0.3, vmax: 22, acc: 7.5, name: '邮政摩托', bike: true },
  boat: { len: 9.5, front: 'x', wheelR: 0, mass: 5, vmax: 0, acc: 0, name: '渔船' },
};
const MODELS = {};
function loadModels(onProgress) {
  if (!THREE.GLTFLoader) return Promise.resolve();
  const loader = new THREE.GLTFLoader(); const names = Object.keys(VEH_TYPES); let n = 0;
  return Promise.all(names.map(name => new Promise((res) => {
    loader.load(ASSET_BASE + 'models/' + name + '.glb', (gltf) => { try { MODELS[name] = prepareModel(name, gltf.scene); } catch (e) { console.warn('model', name, e); } onProgress && onProgress(++n / names.length); res(); },
      undefined, (e) => { console.warn('无法加载模型', name, e); onProgress && onProgress(++n / names.length); res(); });
  })));
}
/* 把模型烘焙到「车头 +z、地面 y=0、居中」的坐标系，再拆出四个车轮 */
function prepareModel(name, root) {
  const T = VEH_TYPES[name];
  root.updateMatrixWorld(true);
  const geos = []; let mat = null;
  root.traverse(o => { if (o.isMesh) { const g = flatGeo(o.geometry); g.applyMatrix4(o.matrixWorld); geos.push(g); mat = mat || o.material; } });
  let geo = geos.length === 1 ? geos[0] : mergeSimple(geos);
  geo.computeBoundingBox(); let bb = geo.boundingBox; const sx = bb.max.x - bb.min.x, sz = bb.max.z - bb.min.z;
  let front = T.front; if (front === 'auto') front = sz >= sx ? 'z' : 'x';
  if (front === 'x') geo.rotateY(-Math.PI / 2);
  geo.computeBoundingBox(); bb = geo.boundingBox;
  const k = T.len / (bb.max.z - bb.min.z);
  geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2); geo.scale(k, k, k);
  geo.computeBoundingBox(); bb = geo.boundingBox;
  if (mat) { mat.envMapIntensity = 1.3; if (mat.metalness === 1 && !mat.metalnessMap) mat.metalness = 0.4; }
  const out = { name, geo, mat, wheels: [], halfW: (bb.max.x - bb.min.x) / 2, H: bb.max.y, L: bb.max.z - bb.min.z };
  if (T.wheelR) splitWheels(out, T.wheelR);
  return out;
}
/* 去索引并转成普通 Float32 属性（兼容交错存储与归一化整型） */
function flatGeo(src) {
  const out = new THREE.BufferGeometry(); const idx = src.index; const n = idx ? idx.count : src.attributes.position.count;
  for (const key of ['position', 'normal', 'uv']) {
    const A = src.attributes[key]; if (!A) continue; const sz = A.itemSize; const arr = new Float32Array(n * sz);
    const norm = A.normalized ? (A.array instanceof Uint8Array ? 255 : A.array instanceof Int8Array ? 127 : A.array instanceof Uint16Array ? 65535 : A.array instanceof Int16Array ? 32767 : 1) : 1;
    for (let i = 0; i < n; i++) { const j = idx ? idx.getX(i) : i; arr[i * sz] = A.getX(j) / norm; if (sz > 1) arr[i * sz + 1] = A.getY(j) / norm; if (sz > 2) arr[i * sz + 2] = A.getZ(j) / norm; if (sz > 3) arr[i * sz + 3] = A.getW(j) / norm; }
    out.setAttribute(key, new THREE.BufferAttribute(arr, sz));
  }
  if (!out.attributes.normal) out.computeVertexNormals();
  return out;
}
function mergeSimple(geos) {
  const total = geos.reduce((a, g) => a + g.attributes.position.count, 0); const out = new THREE.BufferGeometry();
  for (const key of Object.keys(geos[0].attributes)) { const sz = geos[0].attributes[key].itemSize; const arr = new Float32Array(total * sz); let o = 0; for (const g of geos) { if (!g.attributes[key]) continue; arr.set(g.attributes[key].array, o); o += g.attributes[key].count * sz; } out.setAttribute(key, new THREE.BufferAttribute(arr, sz)); }
  return out;
}
function splitWheels(M, r) {
  const g = M.geo; const P = g.attributes.position; const hw = M.halfW;
  // 用接地点附近的顶点估计前后轮中心
  const zs = { f: [], b: [] };
  for (let i = 0; i < P.count; i++) { const y = P.getY(i), x = P.getX(i), z = P.getZ(i); if (y < r * 0.35 && Math.abs(x) > hw * 0.55) (z > 0 ? zs.f : zs.b).push(z); }
  if (zs.f.length < 10 || zs.b.length < 10) return;
  const mid = (a) => { a.sort((p, q) => p - q); return a[Math.floor(a.length / 2)]; };
  const centers = [mid(zs.f), mid(zs.b)];
  const attrs = Object.keys(g.attributes); const body = {}, wheels = [{}, {}, {}, {}]; attrs.forEach(a => { body[a] = []; wheels.forEach(w => w[a] = []); });
  const tri = P.count / 3; const rr = (r * 1.06) ** 2;
  for (let t = 0; t < tri; t++) {
    let cx = 0, cy = 0, cz = 0; for (let k = 0; k < 3; k++) { cx += P.getX(t * 3 + k); cy += P.getY(t * 3 + k); cz += P.getZ(t * 3 + k); } cx /= 3; cy /= 3; cz /= 3;
    let target = body;
    if (Math.abs(cx) > hw * 0.58) for (let w = 0; w < 2; w++) { const dz = cz - centers[w], dy = cy - r; if (dz * dz + dy * dy < rr) { target = wheels[w * 2 + (cx > 0 ? 0 : 1)]; break; } }
    for (const a of attrs) { const A = g.attributes[a]; for (let k = 0; k < 3; k++) for (let c = 0; c < A.itemSize; c++) target[a].push(A.array[(t * 3 + k) * A.itemSize + c]); }
  }
  const mkGeo = (data, pivot) => { const ng = new THREE.BufferGeometry(); for (const a of attrs) ng.setAttribute(a, new THREE.Float32BufferAttribute(data[a], g.attributes[a].itemSize)); if (pivot) ng.translate(-pivot[0], -pivot[1], -pivot[2]); ng.computeBoundingSphere(); return ng; };
  const wout = [];
  for (let w = 0; w < 4; w++) { const n = wheels[w].position.length / 9; if (n < 30) return; const zc = centers[w >> 1], xs = (w & 1) ? -1 : 1; wout.push({ geo: mkGeo(wheels[w], [xs * hw * 0.8, r, zc]), pos: [xs * hw * 0.8, r, zc], front: w < 2 }); }
  M.geo = mkGeo(body); M.wheels = wout;
}

/* ---------------- 载具实例 ---------------- */
const VEHICLES = [];
const _hl = new THREE.SpriteMaterial({ map: TEX_HALO, color: 0xfff2d8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
const _tl = new THREE.SpriteMaterial({ map: TEX_HALO, color: 0xff3020, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
function spawnVehicle(type, x, z, yaw, o = {}) {
  const M = MODELS[type]; if (!M) return null; const T = VEH_TYPES[type];
  const g = new THREE.Group(); const body = new THREE.Mesh(M.geo, M.mat); body.castShadow = true; body.receiveShadow = true; g.add(body);
  const wheels = M.wheels.map(w => { const m = new THREE.Mesh(w.geo, M.mat); m.position.set(...w.pos); m.castShadow = true; const piv = new THREE.Group(); piv.position.copy(m.position); m.position.set(0, 0, 0); piv.add(m); g.add(piv); return { piv, m, front: w.front }; });
  const lights = [];
  if (!T.bike && type !== 'boat') for (const s of [-1, 1]) {
    const h = new THREE.Sprite(_hl); h.scale.setScalar(1.4); h.position.set(s * M.halfW * 0.7, M.H * 0.42, M.L / 2 + 0.05); g.add(h);
    const t = new THREE.Sprite(_tl); t.scale.setScalar(0.8); t.position.set(s * M.halfW * 0.75, M.H * 0.45, -M.L / 2 - 0.05); g.add(t); lights.push(h, t);
  }
  scene.add(g);
  const v = { type, T, M, g, body, wheels, lights, x, z, y: groundAt(x, z, TOWN_Y + 3), yaw, v: 0, steer: 0, pitch: 0, roll: 0, ai: o.ai || null, s: o.s || 0, vmax: o.vmax || R(8, 11), parked: !o.ai, brake: 0, honked: false, driver: null };
  if (o.driverLook) { const c = makeCharacter(o.driverLook); c.root.scale.multiplyScalar(0.95); g.add(c.root); c.root.position.set(T.bike ? 0 : -0.36, T.bike ? 0.55 : 0.4, T.bike ? -0.15 : 0.05); poseCharacter(c, 0, T.bike ? 'bike' : 'sit', 0, 0); v.driver = c; }
  placeVehicle(v, 1); VEHICLES.push(v); return v;
}
function placeVehicle(v, dt) {
  const c = Math.cos(v.yaw), s = Math.sin(v.yaw); const fx = s, fz = c, rx = c, rz = -s;
  const hl = v.M.L * 0.38, hw = v.M.halfW * 0.8; const h0 = v.y + 0.6;
  const gf = groundAt(v.x + fx * hl, v.z + fz * hl, h0), gb = groundAt(v.x - fx * hl, v.z - fz * hl, h0), gl = groundAt(v.x + rx * hw, v.z + rz * hw, h0), gr = groundAt(v.x - rx * hw, v.z - rz * hw, h0);
  const gy = (gf + gb + gl + gr) / 4; v.y = v.y + (gy - v.y) * Math.min(1, dt * 12);
  const tp = Math.atan2(gb - gf, hl * 2), tr = Math.atan2(gl - gr, hw * 2) * (v.T.bike ? 0 : 1);
  v.pitch += (tp - v.pitch) * Math.min(1, dt * 8); v.roll += (tr - v.roll) * Math.min(1, dt * 8);
  v.g.position.set(v.x, v.y, v.z); v.g.rotation.set(v.pitch, v.yaw, v.roll, 'YXZ');
  if (v.T.bike) v.g.rotation.z = -v.steer * clamp(v.v / 10, 0, 1) * 0.6;
  for (const w of v.wheels) { w.m.rotation.x += v.v * dt / v.T.wheelR; if (w.front) w.piv.rotation.y = v.steer * 0.9; }
  const night = NIGHT.v > 0.35 && (v.ai || v === DRIVE.v); for (const l of v.lights) l.material.opacity = night ? 0.85 : (l.material === _tl && v.brake > 0.1 ? 0.6 : 0);
}

/* ---------------- 交通路径 ---------------- */
const CAR_PATH = { loop: true, pts: [[-1.7, 41.8], [-1.7, -78.5], [1.5, -81.8], [98.5, -81.8], [101.8, -78.5], [101.8, 38.5], [98.5, 41.8], [1.6, 41.8]] };
const CAR_STOPS = [{ x: -1.7, z: -47.4, cx: 0 }, { x: 101.8, z: -72.6, cx: 100 }, { x: 98.2, z: -47.4, cx: 100 }];
const TRAFFIC_PATHS = {};
function buildTrafficPaths() {
  TRAFFIC_PATHS.town = CAR_PATH;
  const ring = ROADS.find(r => r.def.id === 'ring'); if (!ring) return;
  const fw = roadLane(ring, 0, false), rv = roadLane(ring, 0, true);
  TRAFFIC_PATHS.ringF = { loop: true, pts: [[98.2, 36], [98.2, -60], ...fw.slice(2), [-84, 38.2], [-60, 38.2], [60, 38.2], [95.5, 38.2]] };
  TRAFFIC_PATHS.ringR = { loop: true, pts: [[95.5, 41.8], [-60, 41.8], [-84, 41.8], ...rv.slice(0, -2), [101.8, -66], [101.8, 36]] };
}
function spawnTraffic() {
  buildTrafficPaths();
  const looks = () => ({ gender: chance(0.5) ? 'm' : 'f', age: pick(['adult', 'adult', 'old']), top: pick([0x3a4a5a, 0xe8e2d6, 0x6a5a4a, 0x2a2a2a, 0x8fa8c8]), hair: pick(['short', 'bob', 'short']) });
  const add = (pathKey, types, n) => { const P = TRAFFIC_PATHS[pathKey]; if (!P) return; const L = pathLen(P); for (let i = 0; i < n; i++) { const s = (i + R(0, 0.4)) * L / n; const p = pathAt(P, s); const v = spawnVehicle(pick(types), p[0], p[1], p[2], { ai: pathKey, s, vmax: R(9, 12.5) * (pathKey === 'town' ? 0.8 : 1), driverLook: looks() }); } };
  add('town', ['kei', 'taxi', 'keitruck', 'minivan'], 4);
  add('ringF', ['sedan', 'kei', 'minivan', 'keitruck', 'taxi'], 5);
  add('ringR', ['sedan', 'kei', 'minivan', 'bus', 'taxi'], 5);
  // 停放的车辆（可驾驶）
  const parked = [['scooter', HOME.door[0] - 2.2, HOME.door[2] + 3.2, Math.PI], ['kei', 40, -42.2, Math.PI / 2], ['sedan', 63, -42.2, -Math.PI / 2], ['keitruck', 116, 8, 0], ['minivan', 116, 44, Math.PI], ['taxi', 30, -45.5, Math.PI / 2], ['sedan', -40, 47.2, Math.PI / 2], ['kei', 18, 47.2, -Math.PI / 2]];
  for (const [t, x, z, yaw] of parked) spawnVehicle(t, x, z, yaw);
  if (typeof _laterVeh !== 'undefined') for (const [t, x, z, yaw] of _laterVeh) spawnVehicle(t, x, z, yaw);
}
function updateTraffic(dt, ppos) {
  for (const v of VEHICLES) {
    if (v === DRIVE.v) continue;
    if (!v.ai) { v.v *= Math.max(0, 1 - dt * 2); if (Math.abs(v.v) > 0.05) { v.x += Math.sin(v.yaw) * v.v * dt; v.z += Math.cos(v.yaw) * v.v * dt; } if (v.g.visible) placeVehicle(v, dt); continue; }
    const P = TRAFFIC_PATHS[v.ai]; const L = P.L || pathLen(P);
    let target = v.vmax; const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
    // 弯道减速：看前方 14m 的转角
    const p1 = pathAt(P, v.s + 14); let turn = Math.abs(Math.atan2(Math.sin(p1[2] - v.yaw), Math.cos(p1[2] - v.yaw))); target = Math.min(target, lerp(v.vmax, 4.5, smooth(0.15, 1.2, turn)));
    // 前方障碍：其他车、玩家
    for (const o of VEHICLES) { if (o === v) continue; const dx = o.x - v.x, dz = o.z - v.z; const ah = dx * fx + dz * fz, lat = Math.abs(dx * fz - dz * fx); if (ah > 0 && ah < 16 && lat < 2.2) target = Math.min(target, Math.max(0, (ah - (o.M.L + v.M.L) / 2 - 1.8) * 1.4)); }
    { const dx = ppos.x - v.x, dz = ppos.z - v.z; const ah = dx * fx + dz * fz, lat = Math.abs(dx * fz - dz * fx); if (!DRIVE.v && ah > 0 && ah < 11 && lat < 1.9 && Math.abs(ppos.y - v.y) < 3) { target = Math.min(target, Math.max(0, (ah - v.M.L / 2 - 1.5) * 1.5)); if (ah < v.M.L / 2 + 2.5 && !v.honked) { v.honked = true; AUDIO.horn && AUDIO.horn(0.6); } } else if (ah > 14) v.honked = false; }
    // 道口
    for (const st of CAR_STOPS) { const C = CROSSINGS.find(k => k.x === st.cx); if (!C) continue; const dx = st.x - v.x, dz = st.z - v.z; const ah = dx * fx + dz * fz, lat = Math.abs(dx * fz - dz * fx); if (lat < 2 && ah > -0.5 && ah < 32 && (C.active || C.arm > 0.02)) target = Math.min(target, Math.max(0, (ah - v.M.L / 2 - 0.3) * 1.2)); }
    const prevV = v.v; v.v += clamp(target - v.v, -7 * dt, 2.2 * dt); v.v = Math.max(0, v.v); v.brake = prevV - v.v > 0.02 ? 1 : 0;
    v.s = (v.s + v.v * dt) % L;
    const q = pathAt(P, v.s); v.x = q[0]; v.z = q[1];
    let dy = q[2] - v.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); v.steer = clamp(dy * 3, -0.5, 0.5); v.yaw += dy * Math.min(1, dt * 6);
    const far = Math.hypot(v.x - ppos.x, v.z - ppos.z) > Q.far * 0.55; v.g.visible = !far;
    if (!far) placeVehicle(v, dt); else v.y = groundAt(v.x, v.z, v.y + 2);
  }
}

/* ---------------- 玩家驾驶 ---------------- */
const DRIVE = { v: null, cam: 0, enterT: 0 };
function nearestVehicle(p, maxD = 3.6) { let best = null, bd = maxD; for (const v of VEHICLES) { if (v.type === 'boat' || v.type === 'bus') continue; const d = Math.hypot(v.x - p.x, v.z - p.z) - v.M.halfW; if (d < bd) { bd = d; best = v; } } return best; }
function enterVehicle(v) {
  DRIVE.v = v; v.ai = null; v.parked = false; if (v.driver) { v.g.remove(v.driver.root); v.driver = null; }
  GAME.standUp && GAME.standUp();
  if (v.T.bike) { v.g.add(playerHolder); playerHolder.position.set(0, 0.55, -0.15); playerHolder.rotation.set(0, 0, 0); playerHolder.visible = true; }
  else { v.g.add(playerHolder); playerHolder.position.set(-0.36, 0.4, 0.05); playerHolder.rotation.set(0, 0, 0); playerHolder.scale.setScalar(0.95); playerHolder.visible = true; }
  AUDIO.engine && AUDIO.engine(true);
  UI.toast('驾驶「' + v.T.name + '」：W 油门 · S 刹车/倒车 · A D 转向 · 空格手刹 · H 喇叭 · F 下车');
}
function exitVehicle() {
  const v = DRIVE.v; if (!v) return; if (Math.abs(v.v) > 4) { UI.toast('车速太快了，先停下来再下车。'); return; }
  DRIVE.v = null; v.parked = true; AUDIO.engine && AUDIO.engine(false);
  scene.add(playerHolder); playerHolder.scale.setScalar(1); playerHolder.rotation.set(0, 0, 0);
  playerHolder.visible = true;
  const s = v.T.bike ? 1.0 : v.M.halfW + 0.7; const lx = Math.cos(v.yaw), lz = -Math.sin(v.yaw);
  let ox = v.x - lx * s, oz = v.z - lz * s; if (blockedAt(ox, v.y + 1, oz)) { ox = v.x + lx * s; oz = v.z + lz * s; } // 右舵车：从右侧下车
  PLAYER.pos.set(ox, 0, oz); PLAYER.pos.y = groundAt(ox, oz, v.y + 1.5); PLAYER.yaw = v.yaw; PLAYER.camYaw = v.yaw; PLAYER.onGround = true;
}
const _cp = { x: 0, z: 0 };
function updateDriving(dt, t) {
  const v = DRIVE.v; if (!v) return; const T = v.T;
  let thr = 0, br = 0, st = 0;
  if (KEYS.has('w') || KEYS.has('arrowup')) thr = 1; if (KEYS.has('s') || KEYS.has('arrowdown')) br = 1;
  if (KEYS.has('a') || KEYS.has('arrowleft')) st += 1; if (KEYS.has('d') || KEYS.has('arrowright')) st -= 1;
  if (TOUCH.move) { const dx = TOUCH.move.x - TOUCH.move.x0, dy = TOUCH.move.y - TOUCH.move.y0; if (dy < -15) thr = clamp(-dy / 60, 0, 1); if (dy > 15) br = clamp(dy / 60, 0, 1); st = clamp(-dx / 60, -1, 1); }
  const hand = KEYS.has(' ');
  const vmax = T.vmax; const fwd = v.v;
  if (thr) v.v += (fwd < -0.5 ? 14 : T.acc * (1 - Math.pow(Math.max(0, fwd) / vmax, 2))) * thr * dt;
  if (br) v.v -= (fwd > 0.5 ? 14 : 4.5) * br * dt;
  if (br && fwd < 0 && v.v < -9) v.v = -9;
  v.v -= Math.sign(v.v) * (0.4 + Math.abs(v.v) * 0.012) * dt * (thr || br ? 0.3 : 1);
  if (hand) v.v *= Math.max(0, 1 - dt * 2.2);
  if (!thr && !br && Math.abs(v.v) < 0.3) v.v = 0;
  v.brake = br && fwd > 0.5 ? 1 : 0;
  const steerMax = lerp(0.62, 0.16, clamp(Math.abs(v.v) / 30, 0, 1));
  v.steer += (st * steerMax - v.steer) * Math.min(1, dt * (st ? 5 : 8));
  const wb = v.M.L * 0.62; let yawRate = v.v / wb * Math.tan(v.steer); if (hand && Math.abs(v.v) > 5) yawRate *= 1.6;
  v.yaw += yawRate * dt;
  const ox = v.x, oz = v.z; v.x += Math.sin(v.yaw) * v.v * dt; v.z += Math.cos(v.yaw) * v.v * dt;
  // 碰撞：沿车身的三个圆
  const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw); let hit = false; const rad = v.M.halfW * 0.95;
  for (const k of [-0.32, 0, 0.32]) {
    _cp.x = v.x + fx * v.M.L * k; _cp.z = v.z + fz * v.M.L * k; const bx = _cp.x, bz = _cp.z;
    if (pushOut(_cp, rad, v.y + 0.3, 1.2)) { v.x += _cp.x - bx; v.z += _cp.z - bz; hit = true; }
  }
  for (const o of VEHICLES) { if (o === v) continue; const dx = v.x - o.x, dz = v.z - o.z, d = Math.hypot(dx, dz), m = (v.M.halfW + o.M.halfW) * 1.05 + Math.min(v.M.L, o.M.L) * 0.18; if (d < m && d > 0.01) { v.x += dx / d * (m - d); v.z += dz / d * (m - d); hit = true; if (o.ai) o.v = 0; } }
  if (terrainH(v.x, v.z) < -0.4 && !groundAt.floor || islandC(v.x, v.z) < -0.15) { v.x = ox; v.z = oz; hit = true; }
  if (hit) { const imp = Math.abs(v.v); v.v *= 0.45; if (imp > 6) { AUDIO.crash && AUDIO.crash(Math.min(1, imp / 25)); CAMSHAKE.t = Math.min(0.5, imp / 40); } }
  if (TRAIN.box) { const b = TRAIN.box; if (v.x > b.x0 - 1 && v.x < b.x1 + 1 && v.z > b.z0 - 1 && v.z < b.z1 + 1) { v.z = v.z < (b.z0 + b.z1) / 2 ? b.z0 - 1.2 : b.z1 + 1.2; v.v = 0; CAMSHAKE.t = 0.5; AUDIO.crash && AUDIO.crash(1); } }
  placeVehicle(v, dt);
  PLAYER.pos.set(v.x, v.y, v.z); PLAYER.yaw = v.yaw;
  playerChar.root.position.y = 0; if (T.bike) poseCharacter(playerChar, dt, 'bike', Math.abs(v.v) * 0.3, t); else poseCharacter(playerChar, dt, 'sit', 0, t);
  AUDIO.engineUpdate && AUDIO.engineUpdate(Math.abs(v.v) / vmax, thr, T.bike);
}
const CAMSHAKE = { t: 0 };
