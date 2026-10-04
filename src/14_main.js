/* ==========================================================================
   启动：加载照片纹理与车辆模型 → 分步构建世界 → 后期处理 → 主循环
   ========================================================================== */
const tick = () => new Promise(r => setTimeout(r, 0));
function progress(p, text) { $('loadBar').style.width = Math.round(p * 100) + '%'; $('loadText').textContent = text; }
async function loadFonts() {
  if (!document.fonts || !document.fonts.load) return;
  const fams = ['400 32px "ZCOOL XiaoWei"', '900 32px "Noto Sans SC"', '700 32px "Noto Sans SC"', '900 32px "Noto Serif SC"', '400 32px "Ma Shan Zheng"', '400 32px "ZCOOL KuaiLe"'];
  const sample = '星见岛樱丘町潮汐拉面小满面包房灯塔便利店邮局书店花店咖啡和菓子乌冬唱片洗衣五金钟表照相理发单车药局蔬果文具居酒屋渔火止まれ狐守社站学园桥川石油观景台';
  await Promise.race([Promise.all(fams.map(f => document.fonts.load(f, sample).catch(() => { }))), new Promise(r => setTimeout(r, 3500))]);
}
function scatterNature() {
  seed(77);
  // 草丛与野花（镇外、河堤）
  for (let i = 0; i < 5200; i++) {
    const x = R(WORLD.x0, WORLD.x1), z = R(WORLD.z0, WORLD.z1); if (islandC(x, z) < 0.04) continue; const h = terrainH(x, z); if (h < 1.4) continue;
    const town = (x > -114 && x < 132 && z > -92 && z < 92) || (z > 100 && Math.abs(x - 10) < 120); if (town && !(riverDist(x, z) > 8.6 && riverDist(x, z) < 15)) continue;
    if (roadSample(x, z) > 0.3 || FARM.paddy(x, z)) continue;
    if (polyDist(CAPE_PATH, x, z) < 2.2 || (Math.abs(x + 40) < 24 && z < -84 && z > -152 && h > 13)) continue;
    if (occNear(x, z, 1.4)) continue;
    grassPatch(x, z, null, RI(4, 8), 1.4);
  }
  for (const [x, z] of [[-20, 40], [20, 40], [-10, 84], [10, 84], [30, -44], [-30, 36], [70, 36], [90, -40], [20, -49], [-60, -44], [-64, 84]]) { if (occNear(x, z, 1.3)) continue; shrub(x, z, R(0.8, 1.2), pick([0, 0xf28ab2, 0xffffff])); }
  for (const [x, z, s] of [[36, -42, 0.9], [72, -41, 0.95], [88, -44, 1.0], [-20, -80, 1.0], [-58, -80, 1.05], [20, -88, 1.0], [110, 40, 0.9], [110, -40, 0.95], [-110, -46, 1.0], [-118, 46, 1.0], [-90, 84, 1.0], [-44, 46, 0.9], [44, 50, 0.9]]) { if (occNear(x, z, 1.6)) continue; sakuraTree(x, z, s, { cards: 1400 }); }
  // 环岛公路沿线的樱花
  const ring = ROADS[0]; if (ring) for (let s = 80; s < ring.len - 80; s += 70) { const p = ring.pts[Math.round(s / 2)]; const side = chance(0.5) ? 1 : -1; const ox = p[0] + p[4] * side * (ring.hw + 6), oz = p[2] - p[3] * side * (ring.hw + 6); if (islandC(ox, oz) > 0.06 && roadSample(ox, oz) < 0.4 && !occNear(ox, oz, 2)) sakuraTree(ox, oz, R(0.9, 1.15), { cards: 1300 }); }
}
async function build() {
  await loadFonts();
  progress(0.02, '正在加载照片材质……');
  await loadPhotos((k) => progress(0.02 + k * 0.12, '正在加载照片材质……'));
  progress(0.14, '正在把车辆开上岛……');
  await loadModels((k) => progress(0.14 + k * 0.06, '正在把车辆开上岛……'));
  await loadCharModels((k) => progress(0.2 + k * 0.05, '岛上的居民正在醒来……'));
  progress(0.25, '正在修环岛公路……'); await tick();
  railPrep(); buildRoadData(); buildRailData();
  progress(0.3, '正在铺开山、海与天空……'); await tick();
  buildTerrain(); buildDepthTex(); buildSea(); buildRiver(); buildSky(); buildFarLand(); buildRoadMeshes();
  progress(0.4, '正在给商店街挂上招牌……'); await tick();
  buildStreets(); SHOP_DEFS.forEach(buildShop);
  progress(0.48, '正在盖房子……'); await tick();
  buildHome(); buildResidential(); buildSchool(); buildPark();
  if (typeof buildCountryside === 'function') buildCountryside();
  progress(0.56, '正在铺铁轨、开来电车……'); await tick();
  buildTracks(); buildStation(); buildCrossing(0); buildCrossing(100); buildTrain();
  progress(0.62, '正在种樱花……'); await tick();
  buildPlaza(); buildRiverbanks(); buildShrine();
  progress(0.68, '正在修港口与灯塔……'); await tick();
  buildHarbor(); buildCape(); buildBeach(); buildInfill();
  progress(0.74, '正在长出森林……'); await tick();
  flushBatches(scene); buildOccupancy();
  scatterNature(); buildForest(); addTreeColliders();
  progress(0.82, '正在合并网格……'); await tick();
  flushBatches(scene); flushCards(); buildWires(); buildHalos(); buildPetals(); buildPools(); buildGroundShadows(); buildWallFades(); buildDecals(); buildPuddles();
  TEX_SIGN.needsUpdate = true;
  progress(0.9, '居民和车流正在醒来……'); await tick();
  seed(2024); spawnNPCs(); initPlayer(); initAnimals(); spawnTraffic();
  scene.updateMatrixWorld(true); buildGrass();
  mailboxInteractables(); shopInteractables(); homeInteractables();
  initLiveWorld(); // 天气 / 乘降 / 巴士 / 通勤
  const ORDER = ['home', 'post', 'station', 'plaza', 'shrine', 'river', 'harbor', 'cape', 'beach', 'platform', 'park', 'school', 'farm', 'gas', 'view', 'station2'];
  PLACES.sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));
  buildMapBase(); refreshHomeBoard(); applyShadowQuality(); setQuality(qName, true);
  applyTimeOfDay(S().min / 60); updateSkyEnv(true);
  initPost();
  progress(1, '准备好了。'); $('keysHelp').innerHTML = KEY_HELP;
  const b = $('startBtn'); b.disabled = false; b.focus();
  $('title').style.transition = 'background 1.2s'; $('title').style.background = 'linear-gradient(180deg, rgba(10,14,24,.05), rgba(10,14,24,.55))';
}
function start() {
  GAME.started = true; $('title').hidden = true; $('hud').hidden = false; AUDIO.init(); initUIEvents(); UI.refreshHUD();
  canvasEl.focus();
  if (S().day === 1 && S().gotDay === 0) setTimeout(() => UI.toast('欢迎来到星见岛。先去商店街的邮局找方姐领信（地图上的红点），家门口停着你的邮政摩托，按 F 骑上它。', 7000), 800);
  if (!IS_TOUCH) setTimeout(() => UI.toast('点一下画面即可用鼠标环视，按 Esc 释放鼠标。', 5000), 3000);
}
$('startBtn').addEventListener('click', start);

/* ---------------- 后期：辉光 + 调色 + 暗角 ---------------- */
let composer = null, bloomPass = null;
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, night: { value: 0 }, vig: { value: 0.32 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float night, vig; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb;
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      // 动漫调色：更鲜艳；暗部偏蓝紫、亮部偏暖，整体略提亮暗部（赛璐璐动画的通透感）
      col = mix(vec3(l), col, 1.28 - night * 0.12);
      float sh = 1.0 - smoothstep(0.0, 0.45, l), hi = smoothstep(0.55, 1.0, l);
      col += vec3(0.010, 0.016, 0.045) * sh * (1.0 - night * 0.5);
      col *= mix(vec3(1.0), vec3(1.04, 1.01, 0.95), hi * (1.0 - night));
      col = mix(col, col * vec3(0.9, 0.97, 1.1), night * 0.5);
      vec2 d = vUv - 0.5; col *= 1.0 - dot(d, d) * vig * 1.6;
      gl_FragColor = vec4(col, 1.0);
      #include <encodings_fragment>
    }`
};
/* 世界描边（屏幕空间）：深度跳变 → 轮廓线；1/深度 的二阶差分 → 折角线（平面上恒为 0，墙面、路面保持干净） */
const OutlineShader = {
  uniforms: { tDiffuse: { value: null }, tDepth: { value: null }, res: { value: new THREE.Vector2(1, 1) }, cNear: { value: 0.1 }, cFar: { value: 3000 }, strength: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse, tDepth; uniform vec2 res; uniform float cNear, cFar, strength; varying vec2 vUv;
    float viewZ(vec2 uv){ float d = texture2D(tDepth, uv).x; float z = d * 2.0 - 1.0; return 2.0 * cNear * cFar / (cFar + cNear - z * (cFar - cNear)); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float d0 = texture2D(tDepth, vUv).x; if (d0 >= 0.99999) { gl_FragColor = c; return; }
      vec2 px = 1.0 / res;
      float z0 = viewZ(vUv), zl = viewZ(vUv - vec2(px.x, 0.0)), zr = viewZ(vUv + vec2(px.x, 0.0)), zd = viewZ(vUv - vec2(0.0, px.y)), zu = viewZ(vUv + vec2(0.0, px.y));
      float sil = max(max(z0 - zl, z0 - zr), max(z0 - zd, z0 - zu)) / z0;            // 只在靠后的一侧画线，线宽 1 像素
      float w0 = 1.0 / z0; float lap = (abs(1.0 / zl + 1.0 / zr - 2.0 * w0) + abs(1.0 / zd + 1.0 / zu - 2.0 * w0)) / w0;
      float e = smoothstep(0.03, 0.09, sil) + smoothstep(0.0025, 0.008, lap) * 0.6;
      e = clamp(e, 0.0, 1.0) * (1.0 - smoothstep(45.0, 200.0, z0)) * strength;
      vec3 line = c.rgb * vec3(0.34, 0.31, 0.38);
      gl_FragColor = vec4(mix(c.rgb, line, e * 0.8), c.a);
    }`
};
/* 轻量 FXAA（替代多重采样，因为描边需要深度纹理） */
const FXAAShader = {
  uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(1, 1) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res; varying vec2 vUv;
    float lum(vec3 c){ return sqrt(dot(c, vec3(0.299, 0.587, 0.114))); }
    void main(){
      vec2 px = 1.0 / res;
      vec3 rgbM = texture2D(tDiffuse, vUv).rgb;
      float lNW = lum(texture2D(tDiffuse, vUv + vec2(-1.0, -1.0) * px).rgb), lNE = lum(texture2D(tDiffuse, vUv + vec2(1.0, -1.0) * px).rgb);
      float lSW = lum(texture2D(tDiffuse, vUv + vec2(-1.0, 1.0) * px).rgb), lSE = lum(texture2D(tDiffuse, vUv + vec2(1.0, 1.0) * px).rgb), lM = lum(rgbM);
      float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE))), lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
      vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));
      float red = max((lNW + lNE + lSW + lSE) * 0.03125, 1.0 / 128.0);
      dir = clamp(dir / (min(abs(dir.x), abs(dir.y)) + red), vec2(-8.0), vec2(8.0)) * px;
      vec3 a = 0.5 * (texture2D(tDiffuse, vUv + dir * (1.0 / 3.0 - 0.5)).rgb + texture2D(tDiffuse, vUv + dir * (2.0 / 3.0 - 0.5)).rgb);
      vec3 b = a * 0.5 + 0.25 * (texture2D(tDiffuse, vUv + dir * -0.5).rgb + texture2D(tDiffuse, vUv + dir * 0.5).rgb);
      float lB = lum(b);
      gl_FragColor = vec4((lB < lMin || lB > lMax) ? a : b, 1.0);
      #include <encodings_fragment>
    }`
};
class SceneOutlinePass extends THREE.Pass {
  constructor(size) {
    super();
    const depth = new THREE.DepthTexture(size.x, size.y); depth.type = THREE.UnsignedIntType;
    this.rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, depthTexture: depth });
    this.mat = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.clone(OutlineShader.uniforms), vertexShader: OutlineShader.vertexShader, fragmentShader: OutlineShader.fragmentShader });
    this.mat.uniforms.tDepth.value = depth; this.mat.uniforms.res.value.copy(size); this.uniforms = this.mat.uniforms;
    this.quad = new THREE.FullScreenQuad(this.mat);
  }
  render(renderer, writeBuffer) {
    renderer.setRenderTarget(this.rt); renderer.clear(); renderer.render(scene, camera);
    this.mat.uniforms.tDiffuse.value = this.rt.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.quad.render(renderer);
  }
  dispose() { this.rt.dispose(); this.rt.depthTexture && this.rt.depthTexture.dispose(); this.mat.dispose(); }
}
function initPost() {
  if (!THREE.EffectComposer || !THREE.UnrealBloomPass) return;
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  // 场景先渲染到自带深度纹理的目标，再由描边通道写入合成链（避免读写同一深度纹理）
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType });
  composer = new THREE.EffectComposer(renderer, rt);
  const outline = new SceneOutlinePass(size); composer.addPass(outline); composer.outline = outline;
  bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.35, 0.55, 0.9); composer.addPass(bloomPass);
  const grade = new THREE.ShaderPass(GradeShader); composer.addPass(grade); composer.grade = grade;
  const fxaa = new THREE.ShaderPass(FXAAShader); fxaa.uniforms.res.value.copy(size); composer.addPass(fxaa);
}
function renderFrame() {
  if (composer && Q.bloom) {
    composer.outline.uniforms.cNear.value = camera.near; composer.outline.uniforms.cFar.value = camera.far;
    bloomPass.strength = lerp(0.34, 0.95, NIGHT.v); bloomPass.threshold = lerp(0.86, 0.7, NIGHT.v); composer.grade.uniforms.night.value = NIGHT.v;
    composer.render();
  } else renderer.render(scene, camera);
}

/* ---------------- 主循环 ---------------- */
let last = performance.now(), T = 0, hudT = 0, mmT = 0, saveT = 0, envT = 0; const ENV = { sea: 0, trees: 0, night: 0, crossing: 0, train: 0, trainSpeed: 0, windy: 0.3, height: 0, musicOn: true, rain: 0 };
let petalNear = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
  if (!PLAYER.pos || !playerHolder) { renderer.render(scene, camera); return; }
  const st = S();
  if (GAME.started && !UI.modalOpen()) {
    st.min += dt * GAME.timeFlow * (GAME.sitting ? 6 : 1);
    if (st.min >= 24 * 60) { st.min = 24 * 60 - 1; if (!GAME._passing) { GAME._passing = true; if (DRIVE.v) { DRIVE.v.v = 0; exitVehicle(); } UI.toast('太晚了……你迷迷糊糊地回到了家。'); GAME.sleep(false); setTimeout(() => GAME._passing = false, 3000); } }
  }
  const hour = st.min / 60;
  updateWeather(dt);
  applyTimeOfDay(hour);
  SKY_U.time.value = T; FOGX.p[0] = T; animeUpdate(NIGHT.v);
  if (GAME.started) {
    if (DRIVE.v) { if (!UI.modalOpen()) updateDriving(dt, T); }
    else if (!UI.modalOpen() && !UI.dialogOpen()) updatePlayer(dt, T);
    else if (UI.dialogOpen()) { playerHolder.position.copy(PLAYER.pos); poseCharacter(playerChar, dt, GAME.sitting ? 'sit' : 'idle', 0, T); }
    updateCamera(dt);
  } else {
    const a = T * 0.04; camera.position.set(PLAZA.x + Math.cos(a) * 70, TOWN_Y + 32, PLAZA.z - 30 + Math.sin(a) * 70); camera.lookAt(PLAZA.x, TOWN_Y + 6, PLAZA.z - 30);
    playerHolder.position.copy(PLAYER.pos); poseCharacter(playerChar, dt, 'idle', 0, T);
  }
  updateNPCs(dt, T, hour, PLAYER.pos); updateTrain(dt); updateCrossings(dt, T); updateTraffic(dt, PLAYER.pos); updateRide(dt, T);
  updateAnimals(dt, T, hour); updateDate(dt, T, hour); updateFishing(dt, T); updateSparks(dt);
  for (const f of UPDATERS) f(dt, T);
  SEA_U.time.value = T; WIND.uTime.value = T; WIND.uWind.value = (0.8 + Math.sin(T * 0.23) * 0.35 + Math.sin(T * 0.071) * 0.25) * WX.wind;
  SEA_U.waves.value = Q.waves * WX.waves;
  RAIN_U.time.value = T; RAIN_U.camPos.value.copy(camera.position); RAIN_U.amt.value = WEATHER.rain * (insideHome(PLAYER.pos.x, PLAYER.pos.z) ? 0 : 1); RAIN_U.tilt.value.x = 0.08 + WX.wind * 0.14;
  PETAL_U.camPos.value.copy(camera.position); updateGrass();
  // 阴影相机跟随（按纹素对齐，避免闪烁）
  const tp = PLAYER.pos; const snap = 0.5; sun.target.position.set(Math.round(tp.x / snap) * snap, Math.round(tp.y), Math.round(tp.z / snap) * snap); sun.position.copy(sun.target.position).addScaledVector(LIGHT_DIR, 200); sun.target.updateMatrixWorld();
  if (SKY.sky) { SKY.sky.position.copy(camera.position); SKY.overlay.position.copy(camera.position); }
  for (const b of BOATS) { b.g.position.y = Math.sin(T * 0.9 + b.ph) * 0.12 - (b.sink || 0.15); b.g.rotation.z = Math.sin(T * 0.7 + b.ph) * 0.03; b.g.rotation.x = Math.sin(T * 0.8 + b.ph * 2) * 0.02; }
  if (LIGHTHOUSE.beam) LIGHTHOUSE.beam.rotation.y = T * 0.6;
  if (SCHOOL_CLOCK.h) { SCHOOL_CLOCK.h.rotation.z = -(hour % 12) / 12 * TAU; SCHOOL_CLOCK.m.rotation.z = -(st.min % 60) / 60 * TAU; }
  if (homeDoor) { const d = Math.hypot(PLAYER.pos.x - HOME.door[0], PLAYER.pos.z - HOME.door[2]); const want = d < 2.6 && !DRIVE.v ? 1 : 0; homeDoor.open += clamp(want - homeDoor.open, -dt * 2.5, dt * 2.5); homeDoor.g.rotation.y = HOME.ry - homeDoor.open * 1.6; }
  const inside = insideHome(PLAYER.pos.x, PLAYER.pos.z);
  if (homeLight) homeLight.intensity = (inside ? 0.7 : 0.25) + NIGHT.v * 0.9;
  const foxOn = st.flags.fox && NIGHT.v > 0.4; lanternLight.intensity = foxOn ? 1.2 : 0; lanternSprite.material.opacity = foxOn ? 0.7 + Math.sin(T * 3) * 0.15 : 0;
  updateHeadlights();
  hudT -= dt; mmT -= dt; envT -= dt; saveT += dt;
  if (GAME.started) {
    currentInteract = UI.anyOpen() ? null : findInteract();
    const pr = $('prompt'); const k = (x) => IS_TOUCH ? '点' : x;
    if (GAME.sitting) { pr.hidden = false; $('promptText').textContent = '起身'; pr.firstChild.textContent = k('空格'); }
    else if (GAME.fishing) { pr.hidden = false; $('promptText').textContent = GAME.fishing.bite > 0 ? '快收竿！' : '收竿'; pr.firstChild.textContent = k('E'); }
    else if (DRIVE.v) { pr.hidden = Math.abs(DRIVE.v.v) > 2; $('promptText').textContent = '下车'; pr.firstChild.textContent = k('F'); }
    else if (GAME.ride) { pr.hidden = false; const r = GAME.ride; const open = r.kind === 'train' ? r.T.state === 'stop' : r.v.dwell > 0; $('promptText').textContent = open ? '下车' : (r.kind === 'train' ? '列车行驶中…' : '巴士行驶中…'); pr.firstChild.textContent = k('F'); }
    else if (currentInteract) { pr.hidden = false; $('promptText').textContent = currentInteract.label; pr.firstChild.textContent = k(currentInteract.key || 'E'); }
    else pr.hidden = true;
    if (hudT < 0) { hudT = 0.25; UI.tickHUD(st, hour); }
    if (mmT < 0) { mmT = 0.1; UI.drawMinimap(); }
    if (saveT > 45) { saveT = 0; GAME.save(); }
    if (hour >= 19 && !st.stamps.includes('night')) { const rd = riverDist(PLAYER.pos.x, PLAYER.pos.z); if (rd > 8 && rd < 16 && PLAYER.pos.z > -45 && PLAYER.pos.z < 85) GAME.stamp('night'); }
  }
  if (envT < 0) {
    envT = 0.4; let near = 1e9, cnt = 0; for (const tr of TREES) { const dx = tr.x - camera.position.x, dz = tr.z - camera.position.z; if (Math.abs(dx) > 60 || Math.abs(dz) > 60) continue; const d = Math.hypot(dx, dz); if (tr.kind === 'sakura') near = Math.min(near, d - tr.r); if (d < 30) cnt++; }
    petalNear = smooth(45, 6, near); ENV.trees = clamp(cnt / 8, 0, 1);
    const c = islandC(PLAYER.pos.x, PLAYER.pos.z); ENV.sea = Math.max(smooth(0.2, 0.02, c), PLAYER.pos.x > 112 && PLAYER.pos.z > -40 && PLAYER.pos.z < 65 ? 0.8 : 0);
    let cr = 0; for (const C of CROSSINGS) if (C.active) cr = Math.max(cr, smooth(160, 15, Math.hypot(PLAYER.pos.x - C.x, PLAYER.pos.z - C.z)));
    ENV.crossing = cr; ENV.train = smooth(220, 10, nearestTrainDist(PLAYER.pos.x, PLAYER.pos.z)); ENV.trainSpeed = TRAIN.v;
    ENV.night = NIGHT.v; ENV.height = PLAYER.pos.y - TOWN_Y; ENV.windy = (0.3 + Math.max(0, Math.sin(T * 0.11)) * 0.5) * WX.wind;
    ENV.rain = WEATHER.rain * (inside ? 0.3 : 1);
  }
  PETAL_U.density.value += (petalNear * (1 - WEATHER.rain * 0.9) - PETAL_U.density.value) * Math.min(1, dt * 2);
  if (GAME.started) AUDIO.update(dt, ENV);
  renderFrame();
}
/* 玩家车辆的前照灯（夜间真实投光） */
let headSpot = null;
function updateHeadlights() {
  const v = DRIVE.v; const on = v && NIGHT.v > 0.35;
  if (on && !headSpot) { headSpot = new THREE.SpotLight(0xfff1d8, 0, 60, 0.55, 0.5, 1.2); scene.add(headSpot, headSpot.target); }
  if (!headSpot) return;
  headSpot.intensity = on ? 6 : 0;
  if (on) { const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw); headSpot.position.set(v.x + fx * v.M.L * 0.45, v.y + v.M.H * 0.45, v.z + fz * v.M.L * 0.45); headSpot.target.position.set(v.x + fx * 25, v.y - 1, v.z + fz * 25); headSpot.target.updateMatrixWorld(); }
}
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); if (composer) { composer.outline && composer.outline.dispose(); composer.dispose && composer.dispose(); initPost(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && GAME.started) GAME.save(); });

build().then(() => { requestAnimationFrame(frame); }).catch((e) => { console.error(e); progress(1, '加载出错：' + e.message); });
