/* ==========================================================================
   汽车：侧面轮廓挤出（轮拱、车窗、车灯、日式车牌、旋转车轮），在道口前停车
   ========================================================================== */
const CARS = [];
const CAR_PATH = { loop: true, pts: [[-1.7, 41.8], [-1.7, -78.5], [1.5, -81.8], [98.5, -81.8], [101.8, -78.5], [101.8, 38.5], [98.5, 41.8], [1.6, 41.8]] };
const CAR_STOPS = [ // 沿路径方向接近道口时的停车点 [x, z, crossingX]
  { x: -1.7, z: -47.4, cx: 0 }, { x: 101.8, z: -72.6, cx: 100 }
];
function plateTex(kei) {
  return allocSign(160, 80, (g, w, h) => {
    g.fillStyle = kei ? '#f6d04d' : '#ffffff'; g.fillRect(0, 0, w, h); g.strokeStyle = kei ? '#222' : '#2f6b45'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
    g.fillStyle = kei ? '#222' : '#2f6b45'; g.font = `700 20px ${FONT.sans}`; g.textAlign = 'center'; g.fillText('星见 ' + RI(300, 599), w / 2, 28);
    g.font = `400 18px ${FONT.sans}`; g.textAlign = 'left'; g.fillText(pick(['さ', 'あ', 'ほ', 'ゆ']), 14, 64);
    g.font = `900 32px ${FONT.sans}`; g.textAlign = 'right'; g.fillText(RI(10, 99) + '-' + RI(10, 99), w - 12, 68);
  });
}
function carShape(type) {
  const s = new THREE.Shape();
  const P = {
    kei: { L: 3.4, H: 1.7, hood: 0.35, front: 0.75, roofF: 0.25, roofB: 3.25, wb: [0.62, 2.78], wr: 0.29 },
    sedan: { L: 4.4, H: 1.42, hood: 1.0, front: 0.75, roofF: 1.55, roofB: 3.35, wb: [0.85, 3.55], wr: 0.32 },
    van: { L: 4.3, H: 1.85, hood: 0.6, front: 0.8, roofF: 0.95, roofB: 4.2, wb: [0.8, 3.45], wr: 0.32 },
    truck: { L: 3.4, H: 1.75, hood: 0.3, front: 0.75, roofF: 0.25, roofB: 1.35, wb: [0.6, 2.7], wr: 0.28 },
  }[type];
  const y0 = 0.22, { L, H, wb, wr } = P;
  s.moveTo(0, y0 + 0.15);
  s.lineTo(0, P.front); s.quadraticCurveTo(0.05, P.front + 0.12, P.hood * 0.5, P.front + 0.15);
  s.lineTo(P.hood, P.front + 0.2);
  s.lineTo(P.roofF, H - 0.05); s.quadraticCurveTo(P.roofF + 0.05, H, P.roofF + 0.2, H);
  s.lineTo(P.roofB - 0.15, H); s.quadraticCurveTo(P.roofB, H, P.roofB, H - 0.1);
  if (type === 'truck') { s.lineTo(P.roofB + 0.05, 0.95); s.lineTo(L, 0.95); s.lineTo(L, y0 + 0.15); }
  else { s.lineTo(L - 0.02, P.front + 0.1); s.lineTo(L, y0 + 0.15); }
  // 后轮拱
  s.lineTo(wb[1] + wr + 0.08, y0 + 0.15 - 0.15 + 0.15); s.absarc(wb[1], wr + 0.02, wr + 0.08, 0, Math.PI, false);
  s.lineTo(wb[0] + wr + 0.08, y0); s.absarc(wb[0], wr + 0.02, wr + 0.08, 0, Math.PI, false);
  s.lineTo(0, y0 + 0.15);
  return { s, P };
}
function buildCar(type, col) {
  const { s, P } = carShape(type); const W = type === 'sedan' || type === 'van' ? 1.7 : 1.48;
  const wheels = [];
  const g = buildLocal(() => {
    const K = new Kit(0, 0, 0, 0);
    const geo = new THREE.ExtrudeGeometry(s, { depth: W - 0.1, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2, curveSegments: 10 });
    geo.translate(-P.L / 2, 0, -(W - 0.1) / 2); geo.rotateY(Math.PI / 2); // 车头朝 +z
    K.geo('paint', geo, 0, 0, 0, col);
    // 车窗（两侧 + 前后）
    const wy0 = P.front + 0.28, wy1 = P.H - 0.1;
    for (const sx of [-1, 1]) {
      const z0 = P.L / 2 - P.roofF - 0.05, z1 = P.L / 2 - P.roofB + 0.1;
      K.plane('vcNoShadow', sx * (W / 2 + 0.051), (wy0 + wy1) / 2, (z0 + z1) / 2, Math.abs(z0 - z1) - 0.1, wy1 - wy0, 0x2a3440, { ry: sx * Math.PI / 2 });
      K.box('paint', sx * (W / 2 + 0.06), (wy0 + wy1) / 2, (z0 + z1) / 2 - 0.05, 0.02, wy1 - wy0, 0.07, col);
      K.box('vc', sx * (W / 2 + 0.07), wy0 - 0.25, P.L / 2 - P.roofF - 0.3, 0.02, 0.03, 0.18, 0x888888);
    }
    const ang = Math.atan2(P.roofF - P.hood, P.H - P.front - 0.2);
    K.plane('vcNoShadow', 0, (P.front + 0.2 + P.H) / 2, P.L / 2 - (P.hood + P.roofF) / 2 + 0.02, W - 0.2, Math.hypot(P.roofF - P.hood, P.H - P.front - 0.2), 0x2a3440, { rx: -ang });
    if (type !== 'truck') K.plane('vcNoShadow', 0, (P.front + P.H) / 2 + 0.1, -P.L / 2 + (P.L - P.roofB) / 2 - 0.0, W - 0.25, P.H - P.front - 0.35, 0x2a3440, { ry: Math.PI, rx: -0.25 });
    else { K.box('vcNoShadow', 0, P.H * 0.7, P.L / 2 - P.roofB - 0.01, W - 0.3, 0.5, 0.02, 0x2a3440); for (const sx of [-1, 1]) K.box('paint', sx * (W / 2 - 0.02), 1.15, -P.L / 2 + (P.L - P.roofB) / 2, 0.05, 0.4, P.L - P.roofB - 0.1, col); K.box('paint', 0, 1.15, -P.L / 2 + 0.02, W, 0.4, 0.05, col); for (let i = 0; i < 3; i++) K.box('wood', R(-0.4, 0.4), 1.1, -P.L / 2 + R(0.3, 1.2), 0.5, 0.35, 0.4, 0xb08560); }
    // 灯
    for (const sx of [-1, 1]) { K.box('glow', sx * (W / 2 - 0.22), P.front - 0.05, P.L / 2 + 0.03, 0.28, 0.14, 0.04, 0xfffbe8); K.box('glow', sx * (W / 2 - 0.15), P.front - 0.12, -P.L / 2 - 0.03, 0.16, 0.2, 0.04, 0xe8302a); }
    K.box('vc', 0, 0.42, P.L / 2 + 0.04, W - 0.1, 0.16, 0.06, 0x3a3a3a); K.box('vc', 0, 0.42, -P.L / 2 - 0.04, W - 0.1, 0.16, 0.06, 0x3a3a3a);
    const kei = type === 'kei' || type === 'truck'; const uv = plateTex(kei);
    K.plane('sign', 0, 0.55, P.L / 2 + 0.075, 0.36, 0.18, 0xffffff, { uvr: uv }); K.plane('sign', 0, 0.62, -P.L / 2 - 0.075, 0.36, 0.18, 0xffffff, { uvr: uv, ry: Math.PI });
    K.box('vc', 0, 0.28, 0, W - 0.15, 0.15, P.L - 0.6, 0x222222);
  });
  const wm = new THREE.MeshStandardMaterial({ color: 0x1e1e1e, roughness: 0.8 }), hm = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.4 });
  for (const zz of P.wb) for (const sx of [-1, 1]) {
    const w = new THREE.Group(); const tire = new THREE.Mesh(new THREE.CylinderGeometry(P.wr, P.wr, 0.2, 18), wm); tire.rotation.z = Math.PI / 2; tire.castShadow = true;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(P.wr * 0.55, P.wr * 0.55, 0.21, 6), hm); hub.rotation.z = Math.PI / 2;
    w.add(tire, hub); w.position.set(sx * (W / 2 - 0.12), P.wr + 0.02, P.L / 2 - zz); g.add(w); wheels.push(w);
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  scene.add(g);
  return { g, wheels, P, len: P.L };
}
function spawnCars() {
  const types = [['kei', 0xf4efe4], ['sedan', 0x2c6ea0], ['van', 0xe8e2d6], ['truck', 0xffffff], ['kei', 0xe48fa6]];
  const L = pathLen(CAR_PATH);
  types.forEach(([tp, col], i) => { const c = buildCar(tp, col); c.s = i * L / types.length; c.v = 0; c.vmax = R(7, 9); CARS.push(c); });
}
function updateCars(dt, ppos) {
  const L = pathLen(CAR_PATH);
  for (const c of CARS) {
    let target = c.vmax;
    const p = pathAt(CAR_PATH, c.s); const fx = Math.sin(p[2]), fz = Math.cos(p[2]);
    // 前车
    for (const o of CARS) { if (o === c) continue; let d = o.s - c.s; d = ((d % L) + L) % L; if (d < 9) target = Math.min(target, Math.max(0, (d - 6.5) * 1.6)); }
    // 道口
    for (const st of CAR_STOPS) {
      const C = CROSSINGS.find(k => k.x === st.cx); if (!C) continue;
      const dx = st.x - p[0], dz = st.z - p[1]; const ahead = dx * fx + dz * fz; const lat = Math.abs(dx * fz - dz * fx);
      if (lat < 2 && ahead > -0.5 && ahead < 30 && (C.active || C.arm > 0.02)) target = Math.min(target, Math.max(0, (ahead - c.len / 2 - 0.3) * 1.2));
    }
    // 玩家 / 行人
    const px = ppos.x - p[0], pz = ppos.z - p[1]; const pa = px * fx + pz * fz, pl = Math.abs(px * fz - pz * fx);
    if (pa > 0 && pa < 9 && pl < 1.8 && ppos.y < TOWN_Y + 3) { target = Math.min(target, Math.max(0, (pa - c.len / 2 - 1.2) * 1.5)); if (pa < c.len / 2 + 2 && !c.honked) { c.honked = true; GAME.honk && GAME.honk(); } } else if (pa > 12) c.honked = false;
    c.v += clamp(target - c.v, -6 * dt, 2.4 * dt); c.v = Math.max(0, c.v);
    c.s += c.v * dt;
    const q = pathAt(CAR_PATH, c.s);
    const y = groundAt(q[0], q[1], TOWN_Y + 1);
    c.g.position.set(q[0], y, q[1]);
    let dy = q[2] - c.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); c.g.rotation.y += dy * Math.min(1, dt * 5);
    for (const w of c.wheels) w.children.forEach(m => m.rotation.x += c.v * dt / c.P.wr);
    c.box = { x: q[0], z: q[1], c: Math.cos(c.g.rotation.y), s: Math.sin(c.g.rotation.y), hl: c.len / 2, hw: 0.85 };
  }
}
