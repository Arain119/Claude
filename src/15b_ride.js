/* ==========================================================================
   乘降：可乘坐的环岛电车与循环巴士
   GAME.ride = { kind:'train'|'bus', ... } — 乘车中 playerHolder 挂在车厢/车身上，
   相机为靠窗座位的自由环视视角；到站开门时按 F/E 下车。
   ========================================================================== */
GAME.ride = null;
const _rideV = new THREE.Vector3(), _rideL = new THREE.Vector3();
function boardTrain(T, si) {
  let carIdx = 0, bd = 1e9;
  for (let i = 0; i < T.cars.length; i++) { const b = T.boxes[i]; const d = Math.hypot(b.x - PLAYER.pos.x, b.z - PLAYER.pos.z); if (d < bd) { bd = d; carIdx = i; } }
  const car = T.cars[carIdx], side = T.doorSide;
  GAME.standUp();
  GAME.ride = { kind: 'train', T, car: carIdx, side, boardSi: si, lastState: 'stop', seat: [1.6, 1.56, side * 1.02], eye: [1.6, 2.12, side * 0.92] };
  car.g.add(playerHolder); playerHolder.position.set(1.6, 1.56, side * 1.02); playerHolder.rotation.set(0, side > 0 ? 0 : Math.PI, 0); playerHolder.scale.setScalar(0.9); playerHolder.visible = true;
  PLAYER.camYaw = car.g.rotation.y + (side > 0 ? 0 : Math.PI); PLAYER.camPitch = 0.02;
  UI.toast('你坐上了窗边的座位。列车各站停车，到站开门时按 F 下车。');
  GAME.diary('坐上了环岛线的电车。');
}
function boardBus(v, si) {
  GAME.standUp();
  GAME.ride = { kind: 'bus', v, side: -1, boardSi: si, lastDwell: true, seat: [0.62, 1.05, -0.9], eye: [0.62, 1.62, -0.9] };
  v.g.add(playerHolder); playerHolder.position.set(0.62, 1.05, -0.9); playerHolder.rotation.set(0, 0, 0); playerHolder.scale.setScalar(0.9); playerHolder.visible = true;
  PLAYER.camYaw = v.yaw; PLAYER.camPitch = 0.04;
  UI.toast('你上了巴士。沿途各站停靠，到站停稳后按 F 下车。');
  GAME.diary('坐上了岛内循环巴士。');
}
function leaveRide() {
  const r = GAME.ride; if (!r) return;
  let wp = null;
  if (r.kind === 'train') {
    const T = r.T; if (T.state !== 'stop') { UI.toast('列车行驶中——到站开门后再下车。'); return; }
    wp = T.cars[r.car].g.localToWorld(new THREE.Vector3(0, 1.0, r.side * 2.4));
  } else {
    const v = r.v; if (!(v.dwell > 0)) { UI.toast('巴士行驶中——到站停稳后再下车。'); return; }
    wp = v.g.localToWorld(new THREE.Vector3(v.M.halfW + 0.5, 0.9, 0.8));
  }
  scene.add(playerHolder); playerHolder.scale.setScalar(1); playerHolder.rotation.set(0, 0, 0); playerHolder.visible = true;
  GAME.ride = null;
  PLAYER.pos.set(wp.x, 0, wp.z); PLAYER.pos.y = groundAt(wp.x, wp.z, wp.y + 0.5); PLAYER.onGround = true;
  UI.toast('下车了。');
}
function updateRide(dt, t) {
  const r = GAME.ride; if (!r) return;
  const g = r.kind === 'train' ? r.T.cars[r.car].g : r.v.g;
  _rideV.set(r.seat[0], r.seat[1], r.seat[2]); g.localToWorld(_rideV); PLAYER.pos.set(_rideV.x, _rideV.y - 0.5, _rideV.z); // 同步坐标供地图/存档
  poseCharacter(playerChar, dt, 'sit', 0, t);
  if (r.kind === 'train') {
    const T = r.T;
    if (r.lastState !== T.state) {
      r.lastState = T.state;
      const st = RAIL.stops[T.next];
      if (T.state === 'stop') { UI.toast('到站：' + st.name + '站。按 F 下车。'); AUDIO.trainChime && AUDIO.trainChime(); }
      else UI.toast('发车了。下一站：' + st.name + '站。');
    }
  } else {
    const v = r.v;
    if ((v.dwell > 0) !== r.lastDwell) {
      r.lastDwell = v.dwell > 0;
      if (v.dwell > 0 && v.atStop != null) UI.toast('到站：' + BUS_STOPS[v.atStop].name + '。按 F 下车。');
      else if (!(v.dwell > 0)) UI.toast('发车了。下一站：' + BUS_STOPS[v.nextStop].name + '。');
    }
  }
}
/* 乘车视角：相机固定在窗边座位，鼠标自由环视 */
function updateRideCam(dt) {
  const r = GAME.ride; const g = r.kind === 'train' ? r.T.cars[r.car].g : r.v.g;
  const P = PLAYER;
  if (INPUT.lookX || INPUT.lookY) { P.camYaw -= INPUT.lookX; P.camPitch = clamp(P.camPitch + INPUT.lookY * (store.get('invertY', false) ? -1 : 1), -1.1, 1.1); INPUT.lookX = INPUT.lookY = 0; }
  _rideV.set(r.eye[0], r.eye[1], r.eye[2]); g.localToWorld(_rideV);
  camera.position.lerp(_rideV, Math.min(1, dt * 10));
  const cy = Math.cos(P.camPitch);
  _rideL.set(_rideV.x + Math.sin(P.camYaw) * cy, _rideV.y - Math.sin(P.camPitch), _rideV.z + Math.cos(P.camYaw) * cy);
  camera.lookAt(_rideL);
  if (Math.abs(62 - camera.fov) > 0.05) { camera.fov += (62 - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix(); }
}
/* 站台候车交互：sd=0 岛式站台（双向），±1 相对式站台（一侧服务一个方向） */
function trainServing(si, sd) {
  for (const T of TRAINS) {
    if (sd === 0 || (sd > 0 ? T.dir > 0 : T.dir < 0)) if (T.state === 'stop' && T.next === si) return T;
  }
  return null;
}
function trainETA(si, sd) {
  let best = 1e9;
  for (const T of TRAINS) {
    if (sd !== 0 && (sd > 0 ? T.dir < 0 : T.dir > 0)) continue;
    const d = T.dir > 0 ? loopD(T.s, RAIL.stops[si].s) : loopD(RAIL.stops[si].s, T.s);
    best = Math.min(best, d / Math.max(T.v, 6) + (T.state === 'stop' ? T.timer : 0));
  }
  return best > 900 ? 0 : best;
}
function initTrainBoarding() {
  RAIL.stops.forEach((st, si) => {
    const p = railAt(st.s);
    if (st.island) {
      addInteract({ x: p.x, z: p.z, y: p.y + 1.3, r: 26, label: () => trainServing(si, 0) ? '乘电车（' + st.name + ' 停靠中）' : '等电车（约 ' + Math.ceil(trainETA(si, 0)) + ' 秒进站）', act: () => { const T = trainServing(si, 0); if (T) boardTrain(T, si); else UI.toast('还没有列车进站。'); } });
    } else for (const sd of [1, -1]) {
      const lat = sd * (railSep(st.s) / 2 + 3.0);
      addInteract({
        x: p.x + p.lx * lat, z: p.z + p.lz * lat, y: p.y + 1.3, r: st.half,
        label: () => trainServing(si, sd) ? '乘电车（' + st.name + ' 停靠中）' : '等电车（约 ' + Math.ceil(trainETA(si, sd)) + ' 秒进站）',
        act: () => { const T = trainServing(si, sd); if (T) boardTrain(T, si); else UI.toast('还没有列车进站。'); }
      });
    }
  });
}

/* ---------------- 环岛巴士 ----------------
   站前 → 沿海南路 → 环岛公路一圈 → 回到站前。每个站牌停靠约 9 秒。 */
const BUS_PATH = { loop: true, pts: [] };
const BUS_STOPS = []; // {name, s, x, z, sx, sz}
function busNearestS(x, z) { let best = 1e9, bs = 0; for (const q of BUS_PATH.pts2 || []) { const d = (q.x - x) ** 2 + (q.z - z) ** 2; if (d < best) { best = d; bs = q.s; } } return bs; }
function busStopSign(x, z, ry, name) {
  const g = new THREE.Group(); g.position.set(x, groundAt(x, z, terrainH(x, z) + 2), z); g.rotation.y = ry;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 8), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.6, metalness: 0.5 })); pole.position.y = 1.3; pole.castShadow = true; g.add(pole);
  const uv = allocSign(150, 150, (c, w, h) => {
    c.fillStyle = '#f6d04d'; c.beginPath(); c.arc(75, 75, 72, 0, TAU); c.fill(); c.strokeStyle = '#2c5aa0'; c.lineWidth = 8; c.stroke();
    c.fillStyle = '#2c5aa0'; c.font = `900 ${name.length > 3 ? 24 : 30}px ${FONT.sans}`; c.textAlign = 'center'; c.fillText(name, 75, 70); c.font = '700 14px ' + FONT.sans; c.fillText('岛内循环巴士', 75, 98);
  });
  const geo = new THREE.PlaneGeometry(0.6, 0.6); const uvA = geo.attributes.uv;
  for (let i = 0; i < uvA.count; i++) uvA.setXY(i, uv[0] + uvA.getX(i) * (uv[2] - uv[0]), uv[1] + uvA.getY(i) * (uv[3] - uv[1]));
  const mat = new THREE.MeshStandardMaterial({ map: TEX_SIGN, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 });
  for (const s of [0, Math.PI]) { const disc = new THREE.Mesh(geo, mat); disc.rotation.y = s; disc.position.y = 2.5; g.add(disc); }
  scene.add(g);
}
function initBus() {
  const ring = TRAFFIC_PATHS.ringF; if (!ring) return;
  TRAFFIC_PATHS.bus = BUS_PATH;
  // 站前 ↔ 港口的城里联络段 + 完整环线
  BUS_PATH.pts = [[12, 44.6], [60, 44.2], [96, 43.2]].concat(ring.pts, [[96, 43.2], [60, 44.2]]);
  // 逐点累计里程，供站牌定位与 ETA
  BUS_PATH.pts2 = []; let s = 0; const P = BUS_PATH.pts;
  for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; BUS_PATH.pts2.push({ x: a[0], z: a[1], s }); s += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  BUS_PATH.L = s;
  // 站牌：樱丘站前复用已有道具，其余新建站牌
  for (const [name, ax, az, old] of [['樱丘站前', 12.5, 44.6, true], ['星见港', 101.5, 12, false], ['汐见浜', 62, 96, false], ['田园', -160, 10, false], ['北町', -40, -78.2, false], ['灯塔岬口', 98, -74, false]]) {
    const ss = busNearestS(ax, az); const p = pathAt(BUS_PATH, ss);
    const sx = p[0] + Math.cos(p[2]) * 3.4, sz = p[1] - Math.sin(p[2]) * 3.4; // 行进方向左侧
    const st = { name, s: ss, x: p[0], z: p[1], sx, sz }; const idx = BUS_STOPS.length; BUS_STOPS.push(st);
    if (!old) busStopSign(sx, sz, Math.atan2(-Math.cos(p[2]), Math.sin(p[2])), name);
    addInteract({
      x: sx, z: sz, r: 2.6,
      label: () => busAtStop(idx) ? '乘巴士（' + name + ' 停靠中）' : '等巴士（下一班约 ' + busETA(st) + ' 秒）',
      act: () => { const v = busAtStop(idx); if (v) boardBus(v, idx); else UI.toast('还没有巴士进站。'); }
    });
  }
  TEX_SIGN.needsUpdate = true; // 新站牌已画进图集
  // 两辆错开半环的巴士
  for (const s of [BUS_PATH.L * 0.05, BUS_PATH.L * 0.55]) {
    const p = pathAt(BUS_PATH, s);
    const v = spawnVehicle('bus', p[0], p[1], p[2], { ai: 'bus', s, vmax: 8.5, driverLook: { gender: 'm', age: 'adult', top: 0x2c5aa0, hair: 'short' } });
    if (v) { v.bus = true; v.nextStop = busNextStop(s); v.busHook = busHook; }
  }
}
function busNextStop(s) { const L = BUS_PATH.L; let bi = 0, bd = 1e9; BUS_STOPS.forEach((b, i) => { const d = ((b.s - s) % L + L) % L; if (d > 0.5 && d < bd) { bd = d; bi = i; } }); return bi; }
function busAtStop(i) { for (const v of VEHICLES) if (v.bus && v.dwell > 0 && v.atStop === i) return v; return null; }
function busETA(st) {
  let best = 1e9; for (const v of VEHICLES) { if (!v.bus) continue; const d = ((st.s - v.s) % BUS_PATH.L + BUS_PATH.L) % BUS_PATH.L; best = Math.min(best, d / Math.max(v.v, 7) + (v.dwell || 0)); }
  return best > 900 ? 0 : Math.ceil(best);
}
/* 巴士停靠决策：挂在 updateTraffic 上（v.busHook(v, dt) 返回目标车速） */
function busHook(v, dt) {
  if (v.dwell > 0) { v.dwell -= dt; if (v.dwell < 0) v.dwell = 0; return 0; }
  const st = BUS_STOPS[v.nextStop]; const L = BUS_PATH.L;
  const ahead = ((st.s - v.s) % L + L) % L;
  if (ahead < 16) {
    if (ahead < 1.4 || (ahead < 4 && v.v < 1.6)) { v.dwell = 9; v.atStop = v.nextStop; v.nextStop = busNextStop(st.s + 1); return 0; }
    return Math.max(0.6, ahead * 0.4);
  }
  v.atStop = null; return 99;
}
