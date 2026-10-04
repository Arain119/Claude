/* ==========================================================================
   居民通勤：店员早上从车站方向沿商店街走进店里、下班再走回去；
   手写的路线保证全程走在路面/广场上。雨天步行者会撑伞。
   ========================================================================== */
function commuteRoute(n) {
  const d = n.d, id = d.id;
  if (d.at && d.at.shop) {
    const sh = SHOPS.find(s => s.def.id === d.at.shop); if (!sh) return null;
    const E = sh.def.side === 'E'; const sx = E ? 4.5 : -4.5;
    return [[26, -47], [sx, -44], [sx, clamp(n.home[1], -42, 34)], [n.home[0], n.home[1]]];
  }
  switch (id) {
    case 'laohai': return [[110, -22], [110, 8], [n.home[0], n.home[1]]];
    case 'qianhe': return [[-40, -86], [-40, -112], [n.home[0], n.home[1]]];
    case 'chengcheng': return [[-40, -86], [-40, -112], [n.home[0], n.home[1]]];
    case 'yezi': return [[-62, -20], [-62, 10], [n.home[0], n.home[1]]];
    case 'alan': return [[60, 124], [28, 121], [n.home[0], n.home[1]]];
    case 'xiaozhou': return [[-40, 120], [-13, 119], [n.home[0], n.home[1]]];
    case 'wenye': case 'wennai': return [[4.5, 35], [2, 56], [n.home[0], n.home[1]]];
  }
  return null;
}
/* 沿通勤路线走一步；返回 true 表示走完 */
function commuteStep(n, dt, back) {
  const C = n.com, rt = C.route;
  const wp = rt[back ? rt.length - 1 - C.i : C.i];
  const dx = wp[0] - n.pos.x, dz = wp[1] - n.pos.z, d = Math.hypot(dx, dz);
  if (d < 0.45) { C.i++; return C.i >= rt.length; }
  const sp = Math.max(n.speed, 1.1) * (WEATHER.rain > 0.4 ? 1.35 : 1);
  n.pos.x += dx / d * sp * dt; n.pos.z += dz / d * sp * dt;
  n.pos.y = groundAt(n.pos.x, n.pos.z, n.pos.y + 0.6);
  let dy = Math.atan2(dx, dz) - n.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); n.yaw += dy * Math.min(1, dt * 8);
  return false;
}
function initCommutes() {
  const hour = S().min / 60, day = S().day;
  for (const n of NPCS) {
    const route = commuteRoute(n); if (!route) continue;
    const h = n.d.hours; const active = npcActive(n, hour);
    const after = h[0] <= h[1] ? hour >= h[1] : (hour >= h[1] && hour < h[0]);
    n.com = { route, i: 0, mode: '', day, done: active || after, left: !active && after };
  }
}
/* 小伞：雨天里在外行走的居民会撑伞 */
function makeUmbrella(n) {
  const g = new THREE.Group();
  const m1 = new THREE.MeshToonMaterial({ color: 0x3a3a3a, gradientMap: TOON_GRAD });
  const m2 = new THREE.MeshToonMaterial({ color: pick([0x4a6fa0, 0xd95f6e, 0x4a8a6a, 0xe8a04a, 0x7a6ab0]), gradientMap: TOON_GRAD, side: THREE.DoubleSide });
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.95, 6), m1); stick.position.y = 1.12;
  const can = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.24, 10, 1, true), m2); can.position.y = 1.66;
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.14, 6), m1); tip.position.y = 1.86;
  g.add(stick, can, tip); g.position.set(0.26, 0, 0.1); g.rotation.z = -0.1;
  g.scale.setScalar((n.d.look.scale || 1) * (n.d.look.age === 'kid' ? 0.85 : 1));
  g.visible = false; return g;
}

/* ---------------- 总入口 ---------------- */
function initLiveWorld() {
  if (typeof buildRain === 'function') buildRain();
  if (typeof initTrainBoarding === 'function') initTrainBoarding();
  if (typeof initBus === 'function') initBus();
  if (typeof initCommutes === 'function') initCommutes();
}
