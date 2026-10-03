/* ==========================================================================
   启动：分步构建场景 → 标题飞览 → 主循环
   ========================================================================== */
const tick = () => new Promise(r => setTimeout(r, 0));
function progress(p, text) { $('loadBar').style.width = Math.round(p * 100) + '%'; $('loadText').textContent = text; }
async function loadFonts() {
  if (!document.fonts || !document.fonts.load) return;
  const fams = ['400 32px "ZCOOL XiaoWei"', '900 32px "Noto Sans SC"', '700 32px "Noto Sans SC"', '900 32px "Noto Serif SC"', '400 32px "Ma Shan Zheng"', '400 32px "ZCOOL KuaiLe"'];
  const sample = '星见岛樱丘町潮汐拉面小满面包房灯塔便利店邮局书店花店咖啡和菓子乌冬唱片洗衣五金钟表照相理发单车药局蔬果文具居酒屋渔火止まれ狐守社站学园桥川';
  await Promise.race([Promise.all(fams.map(f => document.fonts.load(f, sample).catch(() => { }))), new Promise(r => setTimeout(r, 3500))]);
}
function scatterNature() {
  seed(77);
  // 山丘上的绿树
  let n = 0;
  for (let i = 0; i < 900 && n < 150; i++) {
    const x = R(-210, 200), z = R(-175, 170); const c = islandC(x, z); if (c < 0.06) continue;
    const h = terrainH(x, z); if (h < 2.6) continue;
    if (x > -116 && x < 112 && z > -88 && z < 76) continue;
    if (Math.abs(z + 60) < 14 && x > -170 && x < 140) continue;
    if (polyDist(CAPE_PATH, x, z) < 4 || Math.hypot(x - CAPE.x, z - CAPE.z) < 18 || (Math.abs(x + 40) < 26 && z < -84 && z > -152)) continue;
    if (chance(0.25)) pineTree(x, z, R(0.9, 1.3)); else greenTree(x, z, R(0.8, 1.4), { cards: 520 });
    n++;
  }
  // 海岸黑松
  for (let i = 0; i < 400 && n < 200; i++) { const a = R(0, TAU); const x = Math.cos(a) * 200 * R(0.8, 0.98), z = Math.sin(a) * 165 * R(0.8, 0.98); const c = islandC(x, z); if (c < 0.03 || c > 0.12) continue; const h = terrainH(x, z); if (h < 0.8) continue; if (z > 80 && Math.abs(x) < 110) continue; if (x > 120 && z > -32 && z < 62) continue; pineTree(x, z, R(0.8, 1.2)); n++; }
  // 草丛与野花
  for (let i = 0; i < 2600; i++) {
    const x = R(-215, 205), z = R(-175, 170); const h = terrainH(x, z); if (h < 1.4) continue;
    const town = (x > -114 && x < 110 && z > -86 && z < 74) || (x > 96 && x < 132 && z > -36 && z < 66) || (z > 84 && Math.abs(x - 10) < 120); if (town && !(riverDist(x, z) > 8.6 && riverDist(x, z) < 15)) continue;
    if (Math.abs(z + 60) < 9 && x > -170 && x < 140) continue;
    if (polyDist(CAPE_PATH, x, z) < 2.2 || (Math.abs(x + 40) < 24 && z < -84 && z > -152 && h > 13)) continue;
    grassPatch(x, z, null, RI(4, 8), 1.4);
  }
  // 镇内的灌木
  for (const [x, z] of [[-20, 40], [20, 40], [-10, 84], [10, 84], [30, -44], [-30, 36], [70, 36], [90, -40], [20, -49], [-60, -44], [-64, 84]]) shrub(x, z, R(0.8, 1.2), pick([0, 0xf28ab2, 0xffffff]));
  // 零散樱花（站前、北路、港口路）
  for (const [x, z, s] of [[36, -42, 0.9], [72, -41, 0.95], [88, -44, 1.0], [-20, -80, 1.0], [-58, -80, 1.05], [20, -88, 1.0], [110, 40, 0.9], [110, -40, 0.95], [-110, -46, 1.0], [-118, 46, 1.0], [-90, 84, 1.0], [-44, 46, 0.9], [44, 50, 0.9]]) sakuraTree(x, z, s, { cards: 1400 });
}
async function build() {
  await loadFonts(); progress(0.05, '正在铺开海与天空……'); await tick();
  buildTerrain(); buildDepthTex(); buildSea(); buildRiver(); buildSky(); buildFarLand();
  progress(0.15, '正在给商店街挂上招牌……'); await tick();
  buildStreets(); SHOP_DEFS.forEach(buildShop);
  progress(0.3, '正在盖房子……'); await tick();
  buildHome(); buildResidential(); buildSchool(); buildPark();
  progress(0.42, '正在铺铁轨、开来电车……'); await tick();
  buildTracks(); buildStation(); buildCrossing(0); buildCrossing(100); buildTrain();
  progress(0.52, '正在种樱花……'); await tick();
  buildPlaza(); buildRiverbanks(); buildShrine();
  progress(0.64, '正在修港口与灯塔……'); await tick();
  buildHarbor(); buildCape(); buildBeach();
  progress(0.72, '正在长出草和树……'); await tick();
  scatterNature();
  progress(0.8, '正在合并网格……'); await tick();
  flushBatches(scene); flushCards(); buildWires(); buildHalos(); buildPetals();
  TEX_SIGN.needsUpdate = true;
  progress(0.88, '居民们正在醒来……'); await tick();
  seed(2024); spawnNPCs(); initPlayer(); initAnimals(); spawnCars();
  mailboxInteractables(); shopInteractables(); homeInteractables();
  const ORDER = ['home', 'post', 'station', 'plaza', 'shrine', 'river', 'harbor', 'cape', 'beach', 'platform', 'park', 'school'];
  PLACES.sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));
  buildMapBase(); refreshHomeBoard(); applyShadowQuality(); setQuality(qName);
  scene.fog.far = Q.far; camera.far = Q.far + 1600; camera.updateProjectionMatrix();
  progress(1, '准备好了。'); $('keysHelp').innerHTML = KEY_HELP;
  const b = $('startBtn'); b.disabled = false; b.focus();
  $('title').style.transition = 'background 1.2s'; $('title').style.background = 'linear-gradient(180deg, rgba(255,233,239,.15), rgba(20,28,51,.45))';
}
function start() {
  GAME.started = true; $('title').hidden = true; $('hud').hidden = false; AUDIO.init(); initUIEvents(); UI.refreshHUD();
  canvasEl.focus();
  if (S().day === 1 && S().gotDay === 0) setTimeout(() => UI.toast('欢迎来到星见岛！先去商店街的邮局找方姐领信吧（地图上的红点）。', 6000), 800);
  if (!IS_TOUCH) setTimeout(() => UI.toast('点一下画面即可用鼠标环顾，按 Esc 释放鼠标。', 5000), 2600);
}
$('startBtn').addEventListener('click', start);

/* ---------------- 主循环 ---------------- */
let last = performance.now(), T = 0, hudT = 0, mmT = 0, saveT = 0, envT = 0; const ENV = { sea: 0, trees: 0, night: 0, crossing: 0, train: 0, trainSpeed: 0, windy: 0.3, height: 0, musicOn: true };
let petalNear = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
  if (!PLAYER.pos || !playerHolder) { renderer.render(scene, camera); return; }
  const st = S();
  if (GAME.started && !UI.modalOpen()) {
    st.min += dt * GAME.timeFlow * (GAME.sitting ? 6 : 1);
    if (st.min >= 24 * 60) { st.min = 24 * 60 - 1; if (!GAME._passing) { GAME._passing = true; UI.toast('太晚了……你迷迷糊糊地回到了家。'); GAME.sleep(false); setTimeout(() => GAME._passing = false, 3000); } }
  }
  const hour = st.min / 60;
  applyTimeOfDay(hour);
  if (GAME.started) {
    if (!UI.modalOpen() && !UI.dialogOpen()) updatePlayer(dt, T); else if (UI.dialogOpen()) { playerHolder.position.copy(PLAYER.pos); poseCharacter(playerChar, dt, GAME.sitting ? 'sit' : 'idle', 0, T); }
    updateCamera(dt);
  } else {
    const a = T * 0.05; camera.position.set(PLAZA.x + Math.cos(a) * 46, TOWN_Y + 20, PLAZA.z - 20 + Math.sin(a) * 46); camera.lookAt(PLAZA.x, TOWN_Y + 4, PLAZA.z - 20);
    playerHolder.position.copy(PLAYER.pos); poseCharacter(playerChar, dt, 'idle', 0, T);
  }
  updateNPCs(dt, T, hour, PLAYER.pos); updateTrain(dt); updateCrossings(dt, T); updateCars(dt, PLAYER.pos);
  updateAnimals(dt, T, hour); updateDate(dt, T, hour); updateFishing(dt, T); updateSparks(dt);
  for (const f of UPDATERS) f(dt, T);
  // 着色器时间
  SEA_U.time.value = T; WIND.uTime.value = T; WIND.uWind.value = 0.8 + Math.sin(T * 0.23) * 0.35 + Math.sin(T * 0.071) * 0.25;
  PETAL_U.camPos.value.copy(camera.position);
  // 太阳阴影跟随
  const tp = PLAYER.pos; sun.target.position.set(Math.round(tp.x), Math.round(tp.y), Math.round(tp.z)); sun.position.copy(sun.target.position).addScaledVector(LIGHT_DIR, 150); sun.target.updateMatrixWorld();
  const sky = scene.getObjectByName('sky'); if (sky) sky.position.copy(camera.position);
  // 动态物件
  for (const b of BOATS) { b.g.position.y = Math.sin(T * 0.9 + b.ph) * 0.12 - 0.15; b.g.rotation.z = Math.sin(T * 0.7 + b.ph) * 0.03; b.g.rotation.x = Math.sin(T * 0.8 + b.ph * 2) * 0.02; }
  if (LIGHTHOUSE.beam) LIGHTHOUSE.beam.rotation.y = T * 0.6;
  if (SCHOOL_CLOCK.h) { SCHOOL_CLOCK.h.rotation.z = -(hour % 12) / 12 * TAU; SCHOOL_CLOCK.m.rotation.z = -(st.min % 60) / 60 * TAU; }
  if (homeDoor) { const d = Math.hypot(PLAYER.pos.x - HOME.door[0], PLAYER.pos.z - HOME.door[2]); const want = d < 2.6 ? 1 : 0; homeDoor.open += clamp(want - homeDoor.open, -dt * 2.5, dt * 2.5); homeDoor.g.rotation.y = HOME.ry - homeDoor.open * 1.6; }
  const inside = insideHome(PLAYER.pos.x, PLAYER.pos.z);
  if (homeLight) homeLight.intensity = (inside ? 0.7 : 0.25) + NIGHT.v * 0.9;
  const foxOn = st.flags.fox && NIGHT.v > 0.4; lanternLight.intensity = foxOn ? 1.2 : 0; lanternSprite.material.opacity = foxOn ? 0.7 + Math.sin(T * 3) * 0.15 : 0;
  // 交互提示
  hudT -= dt; mmT -= dt; envT -= dt; saveT += dt;
  if (GAME.started) {
    currentInteract = UI.anyOpen() ? null : findInteract();
    const pr = $('prompt');
    if (GAME.sitting) { pr.hidden = false; $('promptText').textContent = '起身'; pr.firstChild.textContent = IS_TOUCH ? '点' : '空格'; }
    else if (GAME.fishing) { pr.hidden = false; $('promptText').textContent = GAME.fishing.bite > 0 ? '快收竿！' : '收竿'; pr.firstChild.textContent = IS_TOUCH ? '点' : 'E'; }
    else if (currentInteract) { pr.hidden = false; $('promptText').textContent = currentInteract.label; pr.firstChild.textContent = IS_TOUCH ? '点' : 'E'; }
    else pr.hidden = true;
    if (hudT < 0) { hudT = 0.5; $('hudTime').textContent = fmtTime(st.min); $('hudPhase').textContent = phaseName(hour); }
    if (mmT < 0) { mmT = 0.12; UI.drawMinimap(); }
    if (saveT > 45) { saveT = 0; GAME.save(); }
    // 夜樱邮票
    if (hour >= 19 && !st.stamps.includes('night')) { const rd = riverDist(PLAYER.pos.x, PLAYER.pos.z); if (rd > 8 && rd < 16 && PLAYER.pos.z > -45 && PLAYER.pos.z < 85) GAME.stamp('night'); }
  }
  // 环境（花瓣浓度与声音）
  if (envT < 0) {
    envT = 0.4; let near = 1e9, cnt = 0; for (const tr of TREES) { const d = Math.hypot(tr.x - camera.position.x, tr.z - camera.position.z); if (tr.kind === 'sakura') near = Math.min(near, d - tr.r); if (d < 30) cnt++; }
    petalNear = smooth(45, 6, near); ENV.trees = clamp(cnt / 8, 0, 1);
    const c = islandC(PLAYER.pos.x, PLAYER.pos.z); ENV.sea = Math.max(smooth(0.2, 0.02, c), PLAYER.pos.x > 112 && PLAYER.pos.z > -40 && PLAYER.pos.z < 65 ? 0.8 : 0);
    let cr = 0; for (const C of CROSSINGS) if (C.active) cr = Math.max(cr, smooth(160, 15, Math.hypot(PLAYER.pos.x - C.x, PLAYER.pos.z + 60)));
    ENV.crossing = cr; ENV.train = TRAIN.state === 'wait' ? 0 : smooth(220, 10, Math.hypot(PLAYER.pos.x - TRAIN.x, PLAYER.pos.z - TRACK_Z[TRAIN.track])); ENV.trainSpeed = TRAIN.v;
    ENV.night = NIGHT.v; ENV.height = PLAYER.pos.y - TOWN_Y; ENV.windy = 0.3 + Math.max(0, Math.sin(T * 0.11)) * 0.5;
  }
  PETAL_U.density.value += (petalNear - PETAL_U.density.value) * Math.min(1, dt * 2);
  if (GAME.started) AUDIO.update(dt, ENV);
  renderer.render(scene, camera);
}
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
document.addEventListener('visibilitychange', () => { if (document.hidden && GAME.started) GAME.save(); });

build().then(() => { requestAnimationFrame(frame); }).catch((e) => { console.error(e); progress(1, '加载出错：' + e.message); });
