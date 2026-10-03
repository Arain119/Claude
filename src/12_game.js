/* ==========================================================================
   游戏逻辑：时间与光照、玩家控制、相机、交互、信件、商店、收集、事件、存档
   ========================================================================== */
const WEEK = ['周六', '周日', '周一', '周二', '周三', '周四', '周五'];
const GAME = {
  S: null, talkingTo: null, fishing: null, sitting: null, cam: store.get('cam', 'third'), timeScale: 1, timeFlow: store.get('timeFlow', 1),
  started: false, paused: false,
};
function freshState() { return { v: 1, day: 1, min: 9 * 60, coins: 20, inv: {}, letters: [], stamps: [], friends: {}, delivered: 0, story: 0, gotDay: 0, shells: 0, flags: {}, diary: [{ day: 1, t: '09:00', text: '来到星见岛的第一天。邮局的方姐说，从今天起我就是岛上的小信使了。' }], pos: null, melody: 0 }; }
GAME.S = store.get('save', null);
if (!GAME.S || GAME.S.v !== 1) GAME.S = freshState();
const S = () => GAME.S;
GAME.save = () => { S().pos = [PLAYER.pos.x, PLAYER.pos.y, PLAYER.pos.z, PLAYER.yaw]; store.set('save', S()); };
GAME.hour = () => S().min / 60;
const fmtTime = (m) => { const h = Math.floor(m / 60) % 24, mm = Math.floor(m % 60); return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); };
GAME.diary = (text) => { S().diary.push({ day: S().day, t: fmtTime(S().min), text }); if (S().diary.length > 80) S().diary.shift(); };
GAME.addItem = (n, k = 1) => { S().inv[n] = (S().inv[n] || 0) + k; if (S().inv[n] <= 0) delete S().inv[n]; UI.refreshHUD(); };
GAME.has = (n) => (S().inv[n] || 0) > 0;
GAME.coins = (k) => { S().coins += k; UI.refreshHUD(); };
GAME.stamp = (id) => {
  if (S().stamps.includes(id)) return; S().stamps.push(id); const d = STAMP_DEFS.find(s => s.id === id);
  AUDIO.chime(); UI.stampPop(d); GAME.diary('获得邮票「' + d.name + '」——' + d.desc + '。'); refreshHomeBoard(); GAME.save();
};
function refreshHomeBoard() { if (homeBoardCanvas) drawHomeBoard(S().day, S().stamps.map(id => STAMP_DEFS.find(s => s.id === id))); }

/* ---------------- 光照与时间 ---------------- */
const hemi = new THREE.HemisphereLight(0xbcd8ff, 0x6a6458, 0.4); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff4e0, 2.6); sun.castShadow = true; scene.add(sun); scene.add(sun.target);
const amb = new THREE.AmbientLight(0xffffff, 0.0); scene.add(amb);
scene.fog = new THREE.FogExp2(0xc4d8e8, 0.001);
function applyShadowQuality() {
  sun.castShadow = Q.shadow > 0; renderer.shadowMap.enabled = Q.shadow > 0;
  if (Q.shadow) { sun.shadow.mapSize.set(Q.shadow, Q.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  const ext = Q.shadow >= 4096 ? 75 : 55; const sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 400; sc.updateProjectionMatrix();
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; sun.shadow.radius = 2;
  scene.traverse(o => { if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(m => m.needsUpdate = true); } });
}
const KEYS_T = [
  // 时, 太阳色, 太阳强度, 天光, 地光, 半球强度, 雾色, 雾密度, 云亮面, 云暗面, 夜, 曝光, 浑浊度
  [0, 0x9fb4e0, 0.5, 0x405890, 0x161620, 0.55, 0x101a2c, 0.0015, 0x2a3450, 0x10141f, 1, 1.0, 4],
  [4.6, 0x9fb4e0, 0.48, 0x405890, 0x161620, 0.55, 0x141e32, 0.0015, 0x323c5a, 0x141826, 1, 0.8, 4],
  [5.8, 0xffb080, 0.9, 0x8a90b0, 0x4a3c3c, 0.35, 0xd8b0a0, 0.0014, 0xffc8b0, 0x7a6a88, 0.3, 0.85, 7],
  [7.5, 0xfff0dc, 2.4, 0xbcd4f0, 0x6a6458, 0.38, 0xa4c4e6, 0.0013, 0xffffff, 0x9aa4b8, 0, 0.85, 5],
  [15, 0xfff4e6, 2.7, 0xbcd4f0, 0x6a6458, 0.38, 0xa8c8ea, 0.0012, 0xffffff, 0x9aa4b8, 0, 0.85, 5],
  [17.2, 0xffcf98, 2.3, 0xc0b8e0, 0x6a5a50, 0.36, 0xe6ceba, 0.0012, 0xfff0d8, 0xa894b8, 0, 0.88, 6],
  [18.3, 0xff8a50, 1.3, 0xa890c8, 0x504048, 0.34, 0xd89a84, 0.0013, 0xffb078, 0x6e5488, 0.2, 0.95, 9],
  [19.2, 0xb0a0d0, 0.5, 0x5a5a90, 0x2a2438, 0.45, 0x4a4a72, 0.0014, 0x9888b0, 0x3a3a60, 0.7, 0.95, 6],
  [20.5, 0x9fb4e0, 0.5, 0x405890, 0x161620, 0.55, 0x141e32, 0.0015, 0x323c5a, 0x141826, 1, 1.0, 4],
  [24, 0x9fb4e0, 0.5, 0x405890, 0x161620, 0.55, 0x101a2c, 0.0015, 0x2a3450, 0x10141f, 1, 1.0, 4],
];
const _ca = new THREE.Color(), _cb = new THREE.Color();
function lerpHex(a, b, t, out) { _ca.setHex(a).convertSRGBToLinear(); _cb.setHex(b).convertSRGBToLinear(); return out.copy(_ca).lerp(_cb, t); }
const LT = { sun: new THREE.Color(), hs: new THREE.Color(), hg: new THREE.Color(), fog: new THREE.Color(), cl: new THREE.Color(), cs: new THREE.Color() };
const LIGHT_DIR = new THREE.Vector3(0.4, 0.7, 0.3);
function applyTimeOfDay(h) {
  let i = 0; while (i < KEYS_T.length - 2 && h >= KEYS_T[i + 1][0]) i++;
  const A = KEYS_T[i], B = KEYS_T[i + 1]; const t = smooth(0, 1, (h - A[0]) / (B[0] - A[0]));
  lerpHex(A[1], B[1], t, LT.sun); const sunI = lerp(A[2], B[2], t);
  lerpHex(A[3], B[3], t, LT.hs); lerpHex(A[4], B[4], t, LT.hg); const hemiI = lerp(A[5], B[5], t); lerpHex(A[6], B[6], t, LT.fog);
  const fogD = lerp(A[7], B[7], t); lerpHex(A[8], B[8], t, LT.cl); lerpHex(A[9], B[9], t, LT.cs); const night = lerp(A[10], B[10], t);
  const expo = lerp(A[11], B[11], t), turb = lerp(A[12], B[12], t);
  NIGHT.v = night;
  const dayT = (h - 5.6) / (18.9 - 5.6); const isDay = dayT > 0 && dayT < 1;
  const sd = new THREE.Vector3();
  if (isDay) { const az = lerp(-0.35, Math.PI + 0.35, dayT), el = Math.sin(dayT * Math.PI) * 1.0 + 0.02; sd.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el) * 0.75 + 0.25).normalize(); }
  else { const nt = (h < 12 ? h + 24 : h) - 18.9; const el = clamp(Math.sin(nt / 10.7 * Math.PI), 0, 1) * 0.15 - 0.12; sd.set(-0.6, el, 0.5).normalize(); }
  SKY_U.sunDir.value.copy(sd); SKY_U.moonDir.value.set(-0.45, 0.42, 0.62).normalize(); SKY_U.night.value = night;
  if (SKY.sky) { const u = SKY.sky.material.uniforms; u.sunPosition.value.copy(sd).multiplyScalar(4000); u.turbidity.value = turb * 0.7; u.rayleigh.value = lerp(1.1, 2.2, smooth(16.5, 18.6, h) * (1 - night)); u.skyGain.value = lerp(0.42, 0.6, smooth(16.5, 18.8, h)); }
  SKY_U.cloudLit.value.copy(LT.cl).multiplyScalar(lerp(1.4, 0.25, night)); SKY_U.cloudShade.value.copy(LT.cs).multiplyScalar(lerp(1.0, 0.3, night)); SKY_U.cover.value = 0.52;
  sun.color.copy(LT.sun); sun.intensity = sunI; LIGHT_DIR.copy(isDay ? sd : SKY_U.moonDir.value);
  hemi.color.copy(LT.hs); hemi.groundColor.copy(LT.hg); hemi.intensity = hemiI;
  scene.fog.color.copy(LT.fog); scene.fog.density = fogD * (Q === QUALITY.low ? 1.5 : 1);
  SEA_U.sunCol.value.copy(LT.sun).multiplyScalar(isDay ? 1 : 0.3); SEA_U.light.value = lerp(1.0, 0.18, night);
  SEA_U.fogColor.value.copy(LT.fog); SEA_U.fogDensity.value = scene.fog.density;
  PETAL_U.light.value = lerp(1, 0.3, night);
  // 空气透视 / 云影 / 叶片透光
  const dayK = isDay ? smooth(0, 0.12, sd.y) : 0;
  FOGX.sun[0] = sd.x; FOGX.sun[1] = sd.y; FOGX.sun[2] = sd.z;
  FOGX.sunCol[0] = LT.sun.r * 0.55 * dayK; FOGX.sunCol[1] = LT.sun.g * 0.45 * dayK; FOGX.sunCol[2] = LT.sun.b * 0.3 * dayK;
  FOGX.leafCol[0] = LT.sun.r * sunI * 0.22 * dayK; FOGX.leafCol[1] = LT.sun.g * sunI * 0.22 * dayK; FOGX.leafCol[2] = LT.sun.b * sunI * 0.16 * dayK;
  FOGX.p[1] = night; FOGX.p[2] = 2; FOGX.p[3] = 0.4 * dayK * (1 - night);
  if (farMat) farMat.color.copy(LT.fog).multiplyScalar(0.75);
  renderer.toneMappingExposure = expo;
  // 夜灯
  winMat.emissiveIntensity = night * 1.6; signMat.emissiveIntensity = 0.02 + night * 0.9; SAK_M.m.emissiveIntensity = 1 + night * 1.2;
  glowMat.color.setScalar(lerp(0.85, 6, night));
  if (haloPoints) haloPoints.material.uniforms.night.value = smooth(0.25, 0.85, night) * 0.45;
  if (LIGHTHOUSE.beamM) LIGHTHOUSE.beamM.opacity = smooth(0.3, 0.9, night) * 0.5;
  scene.environment && (envIntensity(lerp(1, 0.6, night)));
  if (POOLS.mat) POOLS.mat.opacity = smooth(0.3, 0.85, night) * 0.75;
  if (SKY.cubeRT) updateSkyEnv(false);
}
let _envI = -1; function envIntensity(k) { if (Math.abs(k - _envI) < 0.03) return; _envI = k; for (const key in MATS) { const m = MATS[key].material; if (m.isMeshStandardMaterial) m.envMapIntensity = (m.userData.envBase || (m.userData.envBase = m.envMapIntensity || 1)) * k; } toonMat.envMapIntensity = 0.7 * k; }

/* ---------------- 玩家 ---------------- */
const PLAYER = { pos: new THREE.Vector3(), vy: 0, yaw: Math.PI / 2, camYaw: Math.PI / 2, camPitch: 0.16, onGround: true, mode: 'walk', speed: 0, fly: false, stepT: 0, camDist: 4.2 };
let playerChar, playerHolder, lanternLight, lanternSprite, rod, fishLine, bobber;
function initPlayer() {
  playerChar = makeCharacter({ gender: 'f', age: 'teen', scale: 0.9, outfit: 'messenger', hat: 'messenger', hair: 'bob', hairCol: 0x6b4a3a, eye: EYES[0], mouth: 1, skin: 0xf9d2bc });
  playerHolder = new THREE.Group(); playerHolder.add(playerChar.root); scene.add(playerHolder);
  // 狐火灯笼（夜里发光）
  lanternLight = new THREE.PointLight(0x9fd8ff, 0, 10, 1.8); lanternLight.position.set(0.35, 1.0, 0.3); playerHolder.add(lanternLight);
  lanternSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX_HALO, color: 0x9fd8ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); lanternSprite.scale.set(1.2, 1.2, 1); lanternSprite.position.set(0.35, 1.0, 0.3); playerHolder.add(lanternSprite);
  // 钓竿
  rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.016, 1.8, 6), new THREE.MeshToonMaterial({ color: 0x6a4a2a, gradientMap: TOON_GRAD })); rod.geometry.translate(0, 0.9, 0); rod.visible = false; scene.add(rod);
  fishLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })); fishLine.visible = false; fishLine.frustumCulled = false; scene.add(fishLine);
  bobber = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshToonMaterial({ color: 0xff4a3a, gradientMap: TOON_GRAD })); bobber.visible = false; scene.add(bobber);
  const p = S().pos;
  if (p && isFinite(p[0])) { PLAYER.pos.set(p[0], p[1], p[2]); PLAYER.yaw = p[3] || 0; PLAYER.camYaw = PLAYER.yaw; }
  else { PLAYER.pos.set(HOME.door[0] - 1.6, TOWN_Y, HOME.door[2]); PLAYER.yaw = -Math.PI / 2; PLAYER.camYaw = -Math.PI / 2; }
  PLAYER.pos.y = groundAt(PLAYER.pos.x, PLAYER.pos.z, PLAYER.pos.y + 1);
}

/* 输入 */
const KEYS = new Set(); const INPUT = { mx: 0, my: 0, lookX: 0, lookY: 0, jump: false, run: false, touchRun: false };
addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
  const k = e.key.toLowerCase(); if (!GAME.started) return;
  if (UI.modalOpen()) { if (k === 'escape' || k === 'b' || k === 'j' || k === 'tab') { e.preventDefault(); UI.closeAll(); } return; }
  if (UI.dialogOpen()) { if (k === 'e' || k === ' ' || k === 'enter') { e.preventDefault(); UI.dialogAdvance(); } if (k === 'escape') UI.closeDialog(); return; }
  KEYS.add(k);
  if (k === ' ') { e.preventDefault(); INPUT.jump = true; }
  if (k === 'e') GAME.interact();
  if (k === 'f') GAME.vehicleKey();
  if (k === 'h') { if (DRIVE.v) AUDIO.horn && AUDIO.horn(1); else UI.toggleHUD(); }
  if (k === 'u') UI.toggleHUD();
  if (k === 'm') AUDIO.setMuted(!AUDIO.muted), UI.toast(AUDIO.muted ? '已静音' : '声音已开启');
  if (k === 't') GAME.cycleTime();
  if (k === 'b') UI.openPanel('bag');
  if (k === 'j') UI.openPanel('journal');
  if (k === 'tab') { e.preventDefault(); UI.openPanel('map'); }
  if (k === 'escape') UI.openPanel('settings');
  if (/^[1-9]$/.test(k)) GAME.teleport(+k - 1);
});
addEventListener('keyup', (e) => KEYS.delete(e.key.toLowerCase()));
addEventListener('blur', () => KEYS.clear());
let pointerLocked = false;
document.addEventListener('pointerlockchange', () => { pointerLocked = document.pointerLockElement === canvasEl; });
canvasEl.addEventListener('click', () => { if (!GAME.started || IS_TOUCH || UI.anyOpen()) return; if (!pointerLocked && canvasEl.requestPointerLock) { try { const r = canvasEl.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (e) { } } });
let dragLook = null;
canvasEl.addEventListener('mousedown', (e) => { if (!pointerLocked && !IS_TOUCH) dragLook = { x: e.clientX, y: e.clientY }; });
addEventListener('mouseup', () => dragLook = null);
addEventListener('mousemove', (e) => {
  if (!GAME.started) return;
  const sens = store.get('sens', 1) * 0.0024;
  if (pointerLocked) { INPUT.lookX += e.movementX * sens; INPUT.lookY += e.movementY * sens; }
  else if (dragLook) { INPUT.lookX += (e.clientX - dragLook.x) * sens * 1.4; INPUT.lookY += (e.clientY - dragLook.y) * sens * 1.4; dragLook = { x: e.clientX, y: e.clientY }; }
});
canvasEl.addEventListener('wheel', (e) => { PLAYER.camDist = clamp(PLAYER.camDist + Math.sign(e.deltaY) * 0.5, 2.2, 9); }, { passive: true });
/* 触屏：左半屏移动，右半屏环顾 */
const TOUCH = { move: null, look: null };
canvasEl.addEventListener('touchstart', (e) => {
  if (!GAME.started) return;
  for (const t of e.changedTouches) {
    if (t.clientX < innerWidth / 2 && !TOUCH.move) { TOUCH.move = { id: t.identifier, x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY }; UI.joy(true, t.clientX, t.clientY); }
    else if (!TOUCH.look) TOUCH.look = { id: t.identifier, x: t.clientX, y: t.clientY };
  }
  e.preventDefault();
}, { passive: false });
canvasEl.addEventListener('touchmove', (e) => {
  for (const t of e.changedTouches) {
    if (TOUCH.move && t.identifier === TOUCH.move.id) { TOUCH.move.x = t.clientX; TOUCH.move.y = t.clientY; UI.joyMove(TOUCH.move); }
    if (TOUCH.look && t.identifier === TOUCH.look.id) { INPUT.lookX += (t.clientX - TOUCH.look.x) * 0.0058; INPUT.lookY += (t.clientY - TOUCH.look.y) * 0.0058; TOUCH.look.x = t.clientX; TOUCH.look.y = t.clientY; }
  }
  e.preventDefault();
}, { passive: false });
const endTouch = (e) => { for (const t of e.changedTouches) { if (TOUCH.move && t.identifier === TOUCH.move.id) { TOUCH.move = null; UI.joy(false); } if (TOUCH.look && t.identifier === TOUCH.look.id) TOUCH.look = null; } };
canvasEl.addEventListener('touchend', endTouch); canvasEl.addEventListener('touchcancel', endTouch);

GAME.vehicleKey = () => { if (DRIVE.v) { exitVehicle(); return; } if (GAME.sitting || GAME.fishing) return; const v = nearestVehicle(PLAYER.pos); if (v) enterVehicle(v); else UI.toast('附近没有可以驾驶的车辆。'); };
GAME.cycleTime = () => { const presets = [[15 * 60, '下午'], [18 * 60, '黄昏'], [21 * 60, '夜樱']]; const h = S().min; let i = presets.findIndex(p => p[0] > h + 1); if (i < 0) i = 0; GAME.setTime(presets[i][0]); UI.toast('时间来到「' + presets[i][1] + '」'); };
GAME.setTime = (m) => { if (m < S().min - 60 && m < 6 * 60) { } S().min = m; UI.refreshHUD(); };
GAME.teleport = (i) => { const p = PLACES[i]; if (!p) return; GAME.standUp(); PLAYER.fly = false; PLAYER.pos.set(p.x, 0, p.z); PLAYER.pos.y = groundAt(p.x, p.z, terrainH(p.x, p.z) + 1.5); PLAYER.yaw = p.ry; PLAYER.camYaw = p.ry; PLAYER.vy = 0; UI.toast('来到「' + p.name + '」'); UI.closeAll(); };

/* ---------------- 坐下 / 起身 ---------------- */
GAME.sit = (x, y, z, ry, onLeave, attach) => {
  if (GAME.fishing) return;
  GAME.sitting = { x, y, z, ry, onLeave, attach, prev: PLAYER.pos.clone() };
  PLAYER.pos.set(x, y, z); PLAYER.yaw = ry; PLAYER.fly = false;
  if (attach) { attach.add(playerHolder); playerHolder.position.set(0, -2.0 + 0.03, 0); playerHolder.rotation.set(0, 0, 0); }
  UI.toast('坐下了。时间会流逝得快一些。按空格或移动起身。');
  if (CAPE && Math.hypot(x - CAPE.x, z - CAPE.z) < 22) { const h = GAME.hour(); if (h >= 17 && h < 18.8) GAME.stamp('sunset'); }
};
GAME.standUp = () => {
  const s = GAME.sitting; if (!s) return; GAME.sitting = null;
  if (s.attach) { scene.add(playerHolder); playerHolder.position.copy(PLAYER.pos); }
  const fx = Math.sin(s.ry), fz = Math.cos(s.ry);
  PLAYER.pos.set(s.x + fx * 0.7, 0, s.z + fz * 0.7); PLAYER.pos.y = groundAt(PLAYER.pos.x, PLAYER.pos.z, s.y + 0.3);
  if (s.onLeave) s.onLeave();
};

/* ---------------- 交互 ---------------- */
let currentInteract = null;
function findInteract() {
  const p = PLAYER.pos; let best = null, bd = 1e9;
  if (GAME.sitting || DRIVE.v) return null;
  { const v = nearestVehicle(p, 2.6); if (v) { const d = Math.hypot(v.x - p.x, v.z - p.z) - v.M.halfW; best = { kind: 'veh', v, label: '驾驶「' + v.T.name + '」', key: 'F' }; bd = d + 0.6; } }
  // 居民
  for (const n of NPCS) {
    if (!n.holder.visible || !n.holder.parent) continue; const d = Math.hypot(n.pos.x - p.x, n.pos.z - p.z);
    if (d < 2.2 && Math.abs(n.pos.y - p.y) < 2 && d < bd) { bd = d; best = { kind: 'npc', n, label: '和 ' + n.name + ' 聊天' + (letterFor(n.id) ? '（有TA的信）' : '') }; }
  }
  if (CAT.obj && CAT.obj.root.visible) { const d = Math.hypot(CAT.pos.x - p.x, CAT.pos.z - p.z); if (d < 1.6 && d < bd) { bd = d; best = { kind: 'cat', label: CAT.follow ? '摸摸橘子' : '和橘猫打招呼' }; } }
  if (FOX.obj && FOX.obj.root.visible) { const d = Math.hypot(FOX.pos.x - p.x, FOX.pos.z - p.z); if (d < 2.2 && d < bd) { bd = d; best = { kind: 'fox', label: '靠近发光的白狐' }; } }
  for (const it of INTERACT) {
    if (it.cond && !it.cond()) continue; const d = Math.hypot(it.x - p.x, it.z - p.z);
    if (d < it.r && d < bd + 0.4 && (it.y == null || Math.abs(it.y - p.y) < 2.5)) { bd = d; best = { kind: 'it', it, label: it.label() }; }
  }
  return best;
}
GAME.interact = () => {
  if (GAME.fishing) { GAME.fish(); return; }
  if (GAME.sitting) { GAME.standUp(); return; }
  if (DRIVE.v) { exitVehicle(); return; }
  const c = currentInteract; if (!c) return; AUDIO.click();
  if (c.kind === 'npc') openNpcDialog(c.n);
  else if (c.kind === 'cat') catInteract();
  else if (c.kind === 'fox') foxInteract();
  else if (c.kind === 'veh') enterVehicle(c.v);
  else c.it.act();
};

/* ---------------- 信件 ---------------- */
function letterFor(id) { return S().letters.find(l => l.to === id); }
function recipientName(l) { if (l.mailbox) return l.mailbox + ' 宅'; const n = NPC_DEFS.find(d => d.id === l.to); return n ? n.name : l.to; }
function dealLetters() {
  const st = S(); const out = [];
  if (st.story < STORY.length && st.day >= STORY[st.story].day && !st.letters.some(l => l.story != null)) { const s = STORY[st.story]; out.push(Object.assign({ story: st.story, uid: 'S' + st.story }, s)); }
  const pool = LETTER_POOL.slice(); for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const used = new Set(out.map(l => l.to)); const famUsed = new Set();
  const fams = MAILBOXES.filter(m => m.name !== '灯塔' && m.name !== '小信使');
  for (const l of pool) {
    if (out.length >= 4) break;
    if (l.mailbox) { const m = fams.filter(f => !famUsed.has(f.name)); if (!m.length) continue; const f = m[Math.floor(Math.random() * m.length)]; famUsed.add(f.name); out.push(Object.assign({}, l, { mailbox: f.name, uid: 'M' + Math.random() })); }
    else if (!used.has(l.to)) { used.add(l.to); out.push(Object.assign({}, l, { uid: 'L' + Math.random() })); }
  }
  st.letters.push(...out); st.gotDay = st.day;
  return out;
}
function deliverLetter(l, npc) {
  const st = S(); st.letters = st.letters.filter(x => x !== l); st.delivered++;
  GAME.coins(l.tip || 4); AUDIO.chime();
  GAME.diary('把「' + l.title + '」送到了' + recipientName(l) + '手里。');
  if (st.delivered === 1) GAME.stamp('first');
  if (st.delivered === 10) GAME.stamp('busy');
  if (npc) { const f = st.friends[npc.id] || 0; st.friends[npc.id] = Math.min(10, f + 1); }
  if (l.story != null) { st.story = l.story + 1; if (st.story >= STORY.length) GAME.stamp('story'); }
  if (l.bottle) GAME.stamp('bottle');
  UI.refreshHUD(); GAME.save();
}
function mailboxInteractables() {
  for (const m of MAILBOXES) {
    addInteract({ x: m.x, z: m.z, r: 1.6, cond: () => S().letters.some(l => l.mailbox === m.name), label: () => '把信投进「' + m.name + ' 宅」的信箱', act: () => { const l = S().letters.find(x => x.mailbox === m.name); deliverLetter(l); UI.toast('「' + l.title + '」投递成功！ +' + l.tip + ' 贝壳币'); } });
  }
}

/* ---------------- 对话 ---------------- */
function openNpcDialog(n) {
  GAME.talkingTo = n; const st = S(); const id = n.id;
  const opts = [];
  const l = letterFor(id);
  if (id === 'fang' && st.gotDay !== st.day) opts.push(['领取今天的信件', () => { const ls = dealLetters(); UI.say(n, '今天一共 ' + ls.length + ' 封：\n' + ls.map(x => '· 「' + x.title + '」→ ' + recipientName(x)).join('\n') + '\n\n地图上会标出收件人的位置。路上小心哦！', [['出发！', () => UI.closeDialog()]]); GAME.diary('从方姐那里领到了 ' + ls.length + ' 封信。'); UI.refreshHUD(); }]);
  if (l) opts.push(['把「' + l.title + '」交给' + (n.d.title.length < 6 ? 'TA' : 'TA'), () => { deliverLetter(l, n); UI.say(n, l.react || '谢谢你！', [['不客气', () => endTalk(n)]]); if (l.story === 2) GAME.diary('小满约林澈今晚九点在樱花树下见面。我也想去看看……'); }]);
  if (Object.keys(st.inv).filter(k => !k.startsWith('#')).length) opts.push(['送礼物', () => giftMenu(n)]);
  // 特殊居民
  if (id === 'chen' && st.letters.some(x => x.bottle)) { }
  if (DATE.active && (id === 'xiaoman' || id === 'linche')) { dateScene(); return; }
  opts.push(['聊聊天', () => { const line = npcLine(n); if (n.talkedDay !== st.day) { n.talkedDay = st.day; st.friends[id] = Math.min(10, (st.friends[id] || 0) + 0.5); } UI.say(n, line, [['再聊一会儿', () => UI.say(n, npcLine(n), [['好', () => endTalk(n)]])], ['再见', () => endTalk(n)]]); }]);
  opts.push(['再见', () => endTalk(n)]);
  UI.say(n, greet(n), opts);
}
function endTalk(n) { UI.closeDialog(); GAME.talkingTo = null; }
function greet(n) {
  const h = GAME.hour(); const f = S().friends[n.id] || 0;
  const hi = h < 10 ? '早上好' : h < 17 ? '你好' : h < 19 ? '傍晚好' : '晚上好';
  if (n.id === 'fang' && S().gotDay !== S().day) return hi + '，小信使！今天的信件都整理好了，过来拿吧。';
  if (f >= 6) return hi + '！见到你真开心。';
  return hi + (f >= 2 ? '，又见面了。' : '。');
}
function npcLine(n) {
  const h = GAME.hour(); const L = n.d.lines.slice();
  if (h >= 19) L.push('天黑了，早点回家哦。', '晚上的风有樱花的味道。');
  if (n.id === 'linche' && S().story >= 1 && S().story < 3) L.push('那封信……你知道是谁寄的吗？不，不用告诉我。');
  if (n.id === 'xiaoman' && S().story >= 2 && S().story < 3) L.push('海石竹的花语是「体谅」。他是不是在说，他什么都明白？');
  if (n.id === 'chen' && S().flags.bottleRead) L.push('那封信，我放在了店里最高的柜子上。');
  return pick(L);
}
function giftMenu(n) {
  const items = Object.keys(S().inv).filter(k => S().inv[k] > 0 && !k.startsWith('#'));
  UI.say(n, '要送什么给 ' + n.name + ' 呢？', items.slice(0, 7).map(it => [it + ' ×' + S().inv[it], () => {
    GAME.addItem(it, -1); const likes = n.d.likes || []; const st = S();
    const love = likes.includes(it); const once = n.giftDay !== st.day; n.giftDay = st.day;
    st.friends[n.id] = Math.min(10, (st.friends[n.id] || 0) + (once ? (love ? 2 : 1) : 0.3));
    const r = love ? pick(['哇！这是我最喜欢的！谢谢你！', '你怎么知道我喜欢这个？！', '……（她/他开心得说不出话）']) : pick(['谢谢你的心意。', '诶，送给我的？谢谢！', '我会好好收着的。']);
    if (n.id === 'xiaoman' && it === '小花束' && S().story >= 2) GAME.diary('送了小满一束花。她说要把它放在面包房的橱窗里。');
    UI.say(n, r, [['不客气', () => endTalk(n)]]); AUDIO.pick(); UI.refreshHUD(); GAME.save();
  }]).concat([['算了', () => openNpcDialog(n)]]));
}

/* ---------------- 商店 ---------------- */
function shopInteractables() {
  for (const sh of SHOPS) {
    const id = sh.def.id; const goods = SHOP_GOODS[id];
    const p = sh.door || [sh.x, 0, sh.z];
    addInteract({ x: (sh.x + p[0]) / 2, z: (sh.z + p[2]) / 2, r: 2.0, label: () => (sh.open(GAME.hour()) ? (goods ? '光顾「' : '看看「') : '「') + sh.def.cn + (sh.open(GAME.hour()) ? '」' : '」已打烊'), act: () => {
      if (!sh.open(GAME.hour())) { UI.toast(sh.def.cn + ' 已经打烊了，营业时间 ' + (sh.def.hours || [8, 20]).join(':00 - ') + ':00'); return; }
      if (id === 'post') { const f = NPC_BY('fang'); if (f && f.holder.visible) openNpcDialog(f); else UI.toast('邮局的柜台后没有人。'); return; }
      if (goods || id === 'fish') UI.openShop(sh, goods || []); else UI.toast(SHOP_FLAVOR[id] || ('「' + sh.def.cn + '」里很安静。'));
    } });
  }
}
const SHOP_FLAVOR = {
  cycle: '车行里飘着机油味，墙上挂满了内胎。阿树在哼歌。', pharma: '药局的柜台上摆着一罐薄荷糖，「请随意取用」。你拿了一颗。', barber: '理发店的转灯在慢慢转，老板正在给一位老爷爷修胡子。',
  photo: '照相馆墙上挂着几十年来岛上人家的全家福。', clock: '满屋子的钟走着同一个时间，滴答声像下雨。', grocer: '青柠蔬果今天的草莓特价，红得发亮。',
  laundry: '洗衣机咕噜咕噜地转，橘猫招牌在窗边打盹。', hardware: '五金店里什么都有：钉子、风铃、渔网，还有一把旧吉他。', izakaya: '居酒屋还在备菜，老板说：「小孩子要等长大了再来哦。」',
};
GAME.buy = (item) => {
  const [name, price, desc, kind] = item; if (S().coins < price) { UI.toast('贝壳币不够……还差 ' + (price - S().coins) + ' 枚'); return; }
  GAME.coins(-price); AUDIO.coin();
  if (kind === 'eat') { UI.toast('「' + name + '」好吃得让人想哭。'); GAME.diary('吃了一碗' + name + '。'); }
  else { GAME.addItem(name); UI.toast('买下了「' + name + '」'); if (name.startsWith('唱片')) { AUDIO.melody = 1; store.set('melody', 1); UI.toast('八音盒换成了《星见夜曲》'); } }
  GAME.save();
};
const FISH_KINDS = [['小竹荚鱼', 3, 0.5], ['青花鱼', 5, 0.3], ['真鲷', 12, 0.08], ['小章鱼', 6, 0.12]];
GAME.sellFish = () => { let total = 0; for (const [n, p] of FISH_KINDS) { const c = S().inv[n] || 0; if (c) { total += c * p; GAME.addItem(n, -c); } } if (total) { GAME.coins(total); AUDIO.coin(); UI.toast('卖掉了鱼，得到 ' + total + ' 贝壳币'); } else UI.toast('背包里没有鱼。'); };

/* ---------------- 钓鱼 ---------------- */
GAME.fish = () => {
  const F = GAME.fishing;
  if (!F) {
    const p = HARBOR.fish; GAME.fishing = { t: R(3, 8), bite: 0 };
    PLAYER.pos.set(p.x + 0.4, p.y + 0.05, p.z); PLAYER.yaw = Math.PI / 2; PLAYER.fly = false;
    rod.visible = fishLine.visible = bobber.visible = true; AUDIO.splash(); UI.toast('抛竿……等浮标沉下去时按 E 收竿');
    return;
  }
  if (F.bite > 0) {
    let r = Math.random(); let got = FISH_KINDS[0]; for (const k of FISH_KINDS) { if (r < k[2]) { got = k; break; } r -= k[2]; }
    GAME.addItem(got[0]); AUDIO.pick(); UI.toast('钓到了「' + got[0] + '」！'); GAME.diary('在栈桥钓到一条' + got[0] + '。'); GAME.stamp('fish');
  } else UI.toast('收竿了。');
  GAME.fishing = null; rod.visible = fishLine.visible = bobber.visible = false; UI.bite(false);
};
function updateFishing(dt, t) {
  const F = GAME.fishing; if (!F) return;
  const hand = new THREE.Vector3(); playerChar.arms[1].el.getWorldPosition(hand);
  rod.position.copy(hand); rod.rotation.set(0, 0, -1.0); rod.rotation.order = 'YXZ'; rod.rotation.y = PLAYER.yaw - Math.PI / 2;
  const tip = new THREE.Vector3(0, 1.8, 0).applyEuler(rod.rotation).add(rod.position);
  const bp = new THREE.Vector3(HARBOR.fish.x + 4.2, 0.05 + Math.sin(t * 2) * 0.03 - (F.bite > 0 ? 0.12 : 0), HARBOR.fish.z + 0.6);
  bobber.position.copy(bp);
  fishLine.geometry.setFromPoints([tip, bp]);
  if (F.bite > 0) { F.bite -= dt; if (F.bite <= 0) { UI.toast('鱼跑掉了……'); F.t = R(3, 8); UI.bite(false); } }
  else { F.t -= dt; if (F.t <= 0) { F.bite = 1.3; AUDIO.splash(); UI.bite(true); } }
}

/* ---------------- 收集与小事件 ---------------- */
GAME.pickShell = (sh) => { sh.got = true; sh.m.visible = false; S().shells++; const kinds = ['樱贝', '白蛤壳', '螺壳', '扇贝壳']; GAME.addItem(pick(kinds)); AUDIO.pick(); UI.toast('捡到一枚贝壳（已收集 ' + S().shells + ' 枚）'); if (S().shells >= 5) GAME.stamp('shell'); };
GAME.bottle = () => { BEACH.bottle.visible = false; S().flags.bottle = true; AUDIO.pick(); S().letters.push({ uid: 'B', bottle: true, from: '五十年前的阿岩', to: 'chen', title: '漂流瓶里的旧信', tip: 10, react: '这是……阿岩的字。\n五十年前，他说要乘船去对岸，然后就再也没有回来。\n「阿菊，如果这只瓶子漂回了星见岛，说明海也想让我们重逢。」\n（陈奶奶把信纸贴在脸上，笑着哭了）\n谢谢你，孩子。原来他一直记得。' }); S().flags.bottleRead = true; UI.toast('漂流瓶里有一封泛黄的信，收件人写着「阿菊」……听说陈奶奶的小名就叫阿菊。'); GAME.diary('在沙滩捡到一只漂流瓶，里面有封写给「阿菊」的信。'); UI.refreshHUD(); };
const FORTUNES = ['大吉：今天遇见的人，会成为重要的人。', '中吉：把想说的话写下来，就已经成功了一半。', '小吉：迷路的时候，跟着花瓣走。', '吉：好事会像潮水一样，慢慢地来。', '末吉：先吃饱，再烦恼。', '大吉：今晚抬头，会看见流星。'];
GAME.wish = () => { if (S().coins < 1) { UI.toast('口袋里没有贝壳币了。'); return; } GAME.coins(-1); AUDIO.bellRing(); sparkle(WELL.x, WELL.y, WELL.z); const f = pick(FORTUNES); UI.toast('扑通——' + f); GAME.diary('在星愿井许了个愿。' + f.split('：')[0] + '。'); GAME.stamp('wish'); };
GAME.pray = () => { AUDIO.bellRing(); UI.toast('铃——铃——你双手合十。抽到的签上写着：' + pick(FORTUNES)); };


/* 闪光粒子 */
const SPARKS = [];
function sparkle(x, y, z, col = 0xffe8a0, n = 40) {
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX_HALO, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.position.set(x, y, z); s.scale.setScalar(0.35); scene.add(s); SPARKS.push({ s, v: new THREE.Vector3(R(-1, 1), R(1.5, 4), R(-1, 1)), life: R(1.2, 2.2) }); }
}
function updateSparks(dt) { for (let i = SPARKS.length - 1; i >= 0; i--) { const p = SPARKS[i]; p.life -= dt; p.v.y -= 2.5 * dt; p.s.position.addScaledVector(p.v, dt); p.s.material.opacity = clamp(p.life, 0, 1); if (p.life <= 0) { scene.remove(p.s); p.s.material.dispose(); SPARKS.splice(i, 1); } } }

/* ---------------- 橘猫 & 白狐 ---------------- */
const CAT = { obj: null, pos: new THREE.Vector3(118, TOWN_Y, 22), follow: false, yaw: 0 };
const FOX = { obj: null, pos: new THREE.Vector3() };
function initAnimals() {
  CAT.obj = makeCat(0xf0a050); scene.add(CAT.obj.root); CAT.follow = !!S().flags.cat;
  if (CAT.follow) CAT.pos.set(PLAYER.pos.x + 1, PLAYER.pos.y, PLAYER.pos.z + 1);
  FOX.obj = makeCat(0xf6f4ff); FOX.obj.root.scale.setScalar(1.6); scene.add(FOX.obj.root);
  FOX.obj.root.traverse(o => { if (o.material && o.material.isMeshToonMaterial && !o.material.map) { o.material = o.material.clone(); o.material.emissive = new THREE.Color(0x6a8aff); o.material.emissiveIntensity = 0.5; } });
  FOX.pos.set(SHRINE.x + 2.5, SHRINE.y, SHRINE.z - 1.5);
  FOX.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX_HALO, color: 0x9fb8ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); FOX.glow.scale.set(3, 3, 1); scene.add(FOX.glow);
}
function catInteract() {
  if (CAT.follow) { UI.toast('橘子眯起眼睛，发出呼噜呼噜的声音。'); AUDIO.pick(); return; }
  const food = ['小鱼干', '小竹荚鱼', '青花鱼', '真鲷', '小章鱼'].find(f => GAME.has(f));
  if (food) { GAME.addItem(food, -1); CAT.follow = true; S().flags.cat = true; AUDIO.pick(); UI.toast('橘猫吃掉了' + food + '，决定跟着你走。你给它取名叫「橘子」。'); GAME.diary('在港口交到了一个朋友：一只叫橘子的橘猫。'); GAME.stamp('cat'); }
  else UI.toast('橘猫看了你一眼，又看了看你空空的手。（也许需要小鱼干？）');
}
function foxInteract() {
  if (S().flags.fox) { UI.toast('白狐蹭了蹭你的手心，化作一缕青色的狐火，绕着你转了一圈。'); return; }
  if (GAME.has('油豆腐')) { GAME.addItem('油豆腐', -1); S().flags.fox = true; GAME.addItem('#狐火灯笼'); sparkle(FOX.pos.x, FOX.pos.y + 0.6, FOX.pos.z, 0x9fd8ff, 60); AUDIO.bellRing(); UI.toast('白狐叼走了油豆腐。你的灯笼里亮起了一团青色的狐火——夜里它会为你照路。'); GAME.diary('夜里在神社遇见了传说中的白狐。它送了我一团狐火。'); GAME.stamp('fox'); }
  else UI.toast('一只发着微光的白狐，静静地看着你。它似乎在等什么好吃的。');
}
function updateAnimals(dt, t, hour) {
  // 猫
  const k = CAT.obj; let moving = false;
  if (CAT.follow && !insideHome(PLAYER.pos.x, PLAYER.pos.z) || CAT.follow && insideHome(CAT.pos.x, CAT.pos.z)) {
    const tx = PLAYER.pos.x - Math.sin(PLAYER.yaw) * 1.2 + Math.cos(PLAYER.yaw) * 0.7, tz = PLAYER.pos.z - Math.cos(PLAYER.yaw) * 1.2 - Math.sin(PLAYER.yaw) * 0.7;
    const dx = tx - CAT.pos.x, dz = tz - CAT.pos.z, d = Math.hypot(dx, dz);
    if (d > 25) { CAT.pos.set(tx, PLAYER.pos.y, tz); }
    else if (d > 0.6) { const sp = Math.min(d * 2.2, 8); CAT.pos.x += dx / d * sp * dt; CAT.pos.z += dz / d * sp * dt; CAT.yaw = Math.atan2(dx, dz); moving = true; }
  }
  CAT.pos.y = groundAt(CAT.pos.x, CAT.pos.z, CAT.pos.y + 0.5);
  k.root.position.copy(CAT.pos); k.root.rotation.y += (Math.atan2(Math.sin(CAT.yaw - k.root.rotation.y), Math.cos(CAT.yaw - k.root.rotation.y))) * Math.min(1, dt * 8);
  poseCat(k, dt, moving, t);
  if (CAT.follow && Math.hypot(CAT.pos.x - PLAYER.pos.x, CAT.pos.z - PLAYER.pos.z) < 3) { }
  // 白狐（夜里）
  const night = hour >= 20 || hour < 4.5;
  FOX.obj.root.visible = night; FOX.glow.visible = night;
  if (night) { FOX.obj.root.position.set(FOX.pos.x, FOX.pos.y + Math.sin(t * 1.5) * 0.05, FOX.pos.z); FOX.obj.root.rotation.y = Math.PI * 0.9 + Math.sin(t * 0.4) * 0.3; poseCat(FOX.obj, dt, false, t); FOX.glow.position.set(FOX.pos.x, FOX.pos.y + 0.6, FOX.pos.z); FOX.glow.material.opacity = 0.5 + Math.sin(t * 2) * 0.15; }
}

/* ---------------- 樱花之约（主线结局） ---------------- */
const DATE = { active: false, done: false, lanterns: [] };
function updateDate(dt, t, hour) {
  const st = S(); const want = st.story >= 3 && !st.flags.date && hour >= 20.9 && hour < 23.5;
  const after = st.flags.date && hour >= 20.9 && hour < 23 && st.flags.dateDay === st.day;
  const xm = NPC_BY('xiaoman'), lc = NPC_BY('linche');
  if (want || after) {
    DATE.active = want;
    const a = 2.6; const px = PLAZA.x + Math.cos(a) * 3.6, pz = PLAZA.z + Math.sin(a) * 3.6;
    xm.override = { pos: [px, TOWN_Y + 0.12, pz], yaw: Math.atan2(0.9, -0.6), mode: 'idle', active: true };
    lc.override = { pos: [px + 0.9, TOWN_Y + 0.12, pz - 0.6], yaw: Math.atan2(-0.9, 0.6), mode: 'idle', active: true };
  } else { DATE.active = false; if (xm && xm.override) xm.override = null; if (lc && lc.override) lc.override = null; }
  for (let i = DATE.lanterns.length - 1; i >= 0; i--) { const L = DATE.lanterns[i]; L.t += dt; L.s.position.y += (0.6 + L.k) * dt; L.s.position.x += Math.sin(t * 0.5 + L.ph) * 0.15 * dt + 0.25 * dt; L.s.material.opacity = clamp(L.t * 0.5, 0, 1) * clamp((90 - L.t) / 20, 0, 1); if (L.t > 90) { scene.remove(L.s); DATE.lanterns.splice(i, 1); } }
}
function dateScene() {
  const xm = NPC_BY('xiaoman'), lc = NPC_BY('linche');
  const lines = [[lc, '……你真的来了。'], [xm, '是你先写信给我的。……不对，是我先写的。'], [lc, '每天早上六点，我从灯塔上都能看见面包房的灯亮起来。'], [xm, '每天晚上九点，我从面包房的窗户都能看见灯塔的光转过来。'], [lc, '那我们……算不算，每天都见面了？'], [xm, '（她笑了）笨蛋。'], [xm, '小信使，谢谢你。这些信，只有你送才行。']];
  let i = 0;
  const next = () => { if (i >= lines.length) { finishDate(); return; } const [n, txt] = lines[i++]; GAME.talkingTo = n; UI.say(n, txt, [['……', next]]); };
  next();
}
function finishDate() {
  UI.closeDialog(); GAME.talkingTo = null; const st = S(); if (st.flags.date) return; st.flags.date = true; st.flags.dateDay = st.day;
  const tex = canvasTex(64, 96, (g) => { const gr = g.createLinearGradient(0, 0, 0, 96); gr.addColorStop(0, '#ffefc8'); gr.addColorStop(1, '#ff9a5a'); g.fillStyle = gr; rrect(g, 12, 10, 40, 74, 14); g.fill(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(18, 20, 6, 50); });
  for (let i = 0; i < 70; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 })); const a = R(0, TAU), r = R(2, 18);
    s.position.set(PLAZA.x + Math.cos(a) * r, TOWN_Y + R(1, 4), PLAZA.z + Math.sin(a) * r); s.scale.set(0.45, 0.65, 1); scene.add(s);
    DATE.lanterns.push({ s, t: -R(0, 12), k: R(0, 0.6), ph: R(0, TAU) });
  }
  sparkle(PLAZA.x, TOWN_Y + 4, PLAZA.z, 0xffd0e0, 80); AUDIO.bellRing();
  GAME.diary('樱花树下，灯塔守人和面包房的小满终于见面了。天空飘满了孔明灯。'); GAME.stamp('date');
  UI.toast('天灯一盏一盏升起来，像是整座岛都在为他们点灯。');
}

/* ---------------- 每日循环 ---------------- */
GAME.sleep = (nap) => {
  const st = S();
  UI.fade(() => {
    if (nap) { st.min = Math.min(st.min + 120, 23 * 60); UI.toast('小睡了两个小时。'); }
    else { st.day++; st.min = 7 * 60; for (const s of SHELLS) { s.got = false; s.m.visible = true; } GAME.diary('第 ' + st.day + ' 天。窗外有鸟叫。'); UI.toast('第 ' + st.day + ' 天 · ' + WEEK[(st.day - 1) % 7] + '。新的一天开始了。'); refreshHomeBoard(); }
    PLAYER.pos.set(HOME.bed[0], HOME.y, HOME.bed[2]); PLAYER.pos.y = groundAt(PLAYER.pos.x, PLAYER.pos.z, HOME.y + 1); GAME.save(); UI.refreshHUD();
  });
};
function homeInteractables() {
  addInteract({ x: HOME.bed[0], z: HOME.bed[2], r: 1.8, label: () => GAME.hour() >= 18 || GAME.hour() < 5 ? '上床睡觉（保存并进入新的一天）' : '在床上小睡一会儿', act: () => GAME.sleep(!(GAME.hour() >= 18 || GAME.hour() < 5)) });
  addInteract({ x: HOME.desk[0], z: HOME.desk[2], r: 1.6, label: () => '打开手账', act: () => UI.openPanel('journal') });
}

/* ---------------- 玩家更新 ---------------- */
const _fw = new THREE.Vector3();
function updatePlayer(dt, t) {
  const P = PLAYER;
  // 移动输入
  let mx = 0, mz = 0;
  if (KEYS.has('w') || KEYS.has('arrowup')) mz += 1; if (KEYS.has('s') || KEYS.has('arrowdown')) mz -= 1;
  if (KEYS.has('a') || KEYS.has('arrowleft')) mx += 1; if (KEYS.has('d') || KEYS.has('arrowright')) mx -= 1;
  if (TOUCH.move) { const dx = TOUCH.move.x - TOUCH.move.x0, dy = TOUCH.move.y - TOUCH.move.y0; const L = Math.hypot(dx, dy); if (L > 8) { mx -= dx / Math.max(L, 60); mz -= dy / Math.max(L, 60); } INPUT.touchRun = L > 70; }
  const run = KEYS.has('shift') || INPUT.touchRun || INPUT.forceRun;
  const moving = Math.hypot(mx, mz) > 0.1;
  if (GAME.fishing && (moving || INPUT.jump)) { GAME.fishing = null; rod.visible = fishLine.visible = bobber.visible = false; UI.bite(false); }
  if (GAME.sitting) {
    if (moving || INPUT.jump) { INPUT.jump = false; GAME.standUp(); }
    else {
      const s = GAME.sitting;
      if (s.attach) { const wp = new THREE.Vector3(); s.attach.updateMatrixWorld(); playerHolder.getWorldPosition(wp); P.pos.copy(wp); playerHolder.rotation.y = s.ry; }
      else { playerHolder.position.copy(P.pos); playerHolder.rotation.y = P.yaw; }
      playerChar.root.position.y = 0; poseCharacter(playerChar, dt, 'sit', 0, t); return;
    }
  }
  if (GAME.fishing) { playerHolder.position.copy(P.pos); playerHolder.rotation.y = P.yaw; playerChar.root.position.y = 0; poseCharacter(playerChar, dt, 'fish', 0, t); INPUT.jump = false; return; }
  const fx = Math.sin(P.camYaw), fz = Math.cos(P.camYaw);
  let vx = (fx * mz + fz * mx), vz = (fz * mz - fx * mx); const vl = Math.hypot(vx, vz); if (vl > 1) { vx /= vl; vz /= vl; }
  if (P.fly) {
    const sp = run ? 26 : 11; const cp = Math.cos(P.camPitch);
    P.pos.x += (fx * mz * cp + fz * mx) * sp * dt; P.pos.z += (fz * mz * cp - fx * mx) * sp * dt; P.pos.y += (-Math.sin(P.camPitch) * mz) * sp * dt;
    if (KEYS.has(' ')) P.pos.y += sp * 0.6 * dt; if (KEYS.has('c') || KEYS.has('control')) P.pos.y -= sp * 0.6 * dt;
    const r = Math.hypot(P.pos.x, P.pos.z); if (r > 330) { P.pos.x *= 330 / r; P.pos.z *= 330 / r; }
    P.pos.y = clamp(P.pos.y, terrainH(P.pos.x, P.pos.z) + 0.5, 180); INPUT.jump = false;
    if (moving) P.yaw = Math.atan2(vx, vz);
    P.speed = 0;
  } else {
    const sp = run ? 7.2 : 4.0; const ox = P.pos.x, oz = P.pos.z;
    const nx = P.pos.x + vx * sp * dt, nz = P.pos.z + vz * sp * dt;
    const ok = (x, z) => { const g = groundAt(x, z, P.pos.y); return (terrainH(x, z) > -0.35 || groundAt.floor) && islandC(x, z) > -0.2 && g < P.pos.y + 0.55; };
    if (ok(nx, nz)) { P.pos.x = nx; P.pos.z = nz; } else if (ok(nx, oz)) P.pos.x = nx; else if (ok(ox, nz)) P.pos.z = nz;
    pushOut(P.pos, 0.3, P.pos.y);
    if (!ok(P.pos.x, P.pos.z) && terrainH(P.pos.x, P.pos.z) < -0.35 && !groundAt.floor) { P.pos.x = ox; P.pos.z = oz; }
    // 列车 / 汽车
    if (TRAIN.box) { const b = TRAIN.box; if (P.pos.x > b.x0 && P.pos.x < b.x1 && P.pos.z > b.z0 && P.pos.z < b.z1 && P.pos.y < RAIL_Y + 3.8) { const zc = (b.z0 + b.z1) / 2; P.pos.z = P.pos.z < zc ? b.z0 - 0.05 : b.z1 + 0.05; if (TRAIN.v > 1) UI.toast('危险！请离铁轨远一点。'); } }
    for (const c of VEHICLES) { const dx = P.pos.x - c.x, dz = P.pos.z - c.z; const cs = Math.cos(c.yaw), sn = Math.sin(c.yaw); const lx = dx * cs - dz * sn, lz = dx * sn + dz * cs; const hw = c.M.halfW + 0.3, hl = c.M.L / 2 + 0.3; if (Math.abs(lx) < hw && Math.abs(lz) < hl && P.pos.y < c.y + c.M.H) { const px = hw - Math.abs(lx), pz = hl - Math.abs(lz); if (px < pz) { const s = Math.sign(lx) || 1; P.pos.x += cs * s * px; P.pos.z += -sn * s * px; } else { const s = Math.sign(lz) || 1; P.pos.x += sn * s * pz; P.pos.z += cs * s * pz; } if (c.ai && c.v > 4) UI.toast('小心车辆！'); } }
    // 垂直
    const g = groundAt(P.pos.x, P.pos.z, P.pos.y);
    if (P.onGround) { if (g < P.pos.y - 0.6) P.onGround = false; else { P.pos.y = g; P.vy = 0; } }
    if (INPUT.jump && P.onGround) { P.vy = 6.6; P.onGround = false; }
    INPUT.jump = false;
    if (!P.onGround) { P.vy -= 20 * dt; P.pos.y += P.vy * dt; const g2 = groundAt(P.pos.x, P.pos.z, P.pos.y - P.vy * dt); if (P.pos.y <= g2) { P.pos.y = g2; P.vy = 0; P.onGround = true; } }
    if (moving) { const want = Math.atan2(vx, vz); let dy = want - P.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); P.yaw += dy * Math.min(1, dt * 12); }
    P.speed = moving ? sp : 0;
    if (moving && P.onGround) { P.stepT -= dt * sp; if (P.stepT < 0) { P.stepT = 1.4; AUDIO.step(run ? 1.2 : 0.8); } }
  }
  playerHolder.position.copy(P.pos); playerHolder.rotation.y = P.yaw; playerChar.root.position.y = 0;
  poseCharacter(playerChar, dt, P.fly ? 'idle' : !P.onGround ? 'run' : moving ? (run ? 'run' : 'walk') : 'idle', P.speed, t);
  if (!P.onGround && !P.fly) { for (const l of playerChar.legs) { l.hip.rotation.x = -0.6 * (l.s > 0 ? 1 : 0.2); l.kn.rotation.x = 0.9; } }
}
const _camT = new THREE.Vector3(), _camP = new THREE.Vector3();
/* GTA 式第三人称相机：鼠标自由环绕，停手后自动回到身后；驾驶时追尾并随车速拉远 */
const CAM = { lastLook: -10, fov: 58, T: 0 };
const _side = new THREE.Vector3();
function updateCamera(dt) {
  const P = PLAYER; const v = DRIVE.v; CAM.T += dt;
  if (INPUT.lookX || INPUT.lookY) { CAM.lastLook = CAM.T; P.camYaw -= INPUT.lookX; P.camPitch = clamp(P.camPitch + INPUT.lookY * (store.get('invertY', false) ? -1 : 1), -0.9, 1.2); INPUT.lookX = INPUT.lookY = 0; }
  const idle = CAM.T - CAM.lastLook > (v ? 1.2 : 2.2);
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  if (v) {
    if (idle && Math.abs(v.v) > 1.5) { const want = v.v >= 0 ? v.yaw : v.yaw + Math.PI; P.camYaw += wrap(want - P.camYaw) * Math.min(1, dt * 2.6); P.camPitch += (0.2 - P.camPitch) * Math.min(1, dt * 1.5); }
  } else if (idle && P.speed > 0.5) { P.camYaw += wrap(P.yaw - P.camYaw) * Math.min(1, dt * 0.9); P.camPitch += (0.16 - P.camPitch) * Math.min(1, dt * 0.8); }
  const inside = insideHome(P.pos.x, P.pos.z);
  playerHolder.visible = !v || v.T.bike;
  let dist, th;
  if (v) { const sp = Math.abs(v.v); dist = v.M.L * 1.05 + 3.2 + sp * 0.06; th = v.M.H * 0.85 + 0.5; }
  else { dist = inside ? Math.min(P.camDist, 2.4) : P.camDist; if (GAME.sitting) dist = Math.max(dist, 3.4); th = GAME.sitting ? 1.15 : 1.5; }
  _camT.set(P.pos.x, P.pos.y + th, P.pos.z);
  const cy = Math.cos(P.camPitch);
  const dir = new THREE.Vector3(Math.sin(P.camYaw) * cy, -Math.sin(P.camPitch), Math.cos(P.camYaw) * cy);
  // 越肩偏移（步行时）
  if (!v && !inside) { _side.set(-Math.cos(P.camYaw), 0, Math.sin(P.camYaw)).multiplyScalar(0.38); _camT.add(_side); }
  let d = 0.4; const step = 0.25;
  while (d < dist) { const x = _camT.x - dir.x * d, y = _camT.y - dir.y * d + 0.15, z = _camT.z - dir.z * d; if (blockedAt(x, y, z)) break; d += step; }
  d = Math.max(0.8, d - 0.25);
  _camP.set(_camT.x - dir.x * d, _camT.y - dir.y * d + 0.15, _camT.z - dir.z * d);
  const tg = terrainH(_camP.x, _camP.z) + 0.4; if (_camP.y < tg) _camP.y = tg;
  camera.position.lerp(_camP, Math.min(1, dt * (v ? 10 : 14)));
  if (CAMSHAKE.t > 0) { CAMSHAKE.t -= dt; camera.position.x += R(-1, 1) * CAMSHAKE.t * 0.4; camera.position.y += R(-1, 1) * CAMSHAKE.t * 0.4; }
  camera.lookAt(_camT);
  const fov = v ? 58 + clamp(Math.abs(v.v) * 0.45, 0, 16) : 58; if (Math.abs(fov - camera.fov) > 0.05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix(); }
}
