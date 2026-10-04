/* ==========================================================================
   天气：按日种子生成的天气表（晴/阴/雨/雾）· 平滑过渡 · 雨粒子 · 湿地面
   ========================================================================== */
const W_P = {
  sun:   { cover: 0.52, fog: 1.0, sun: 1.00, dark: 0.00, grey: 0.00, rain: 0, wind: 1.00, waves: 1.00, cn: '晴' },
  cloud: { cover: 0.36, fog: 1.9, sun: 0.60, dark: 0.15, grey: 0.40, rain: 0, wind: 1.30, waves: 1.25, cn: '阴' },
  rain:  { cover: 0.27, fog: 2.6, sun: 0.32, dark: 0.32, grey: 0.75, rain: 1, wind: 1.55, waves: 1.70, cn: '雨' },
  fog:   { cover: 0.40, fog: 6.5, sun: 0.45, dark: 0.12, grey: 0.55, rain: 0, wind: 0.65, waves: 0.85, cn: '雾' },
};
const W_KEYS = ['cover', 'fog', 'sun', 'dark', 'grey', 'rain', 'wind', 'waves'];
const WX = {}; for (const k of W_KEYS) WX[k] = W_P.sun[k];
const _grey503 = new THREE.Color(0x9aa4ae);
const WEATHER = { tgt: 'sun', from: null, k: 1, day: -1, plan: [], manual: null, rain: 0, wet: 0 };
function weatherPlan(day) {
  seed(day * 7919 + 13);
  const segs = []; let w = chance(0.62) ? 'sun' : 'cloud';
  for (let h = 0; h < 24; h += 3) {
    const r = R();
    if (w === 'rain') w = r < 0.55 ? 'cloud' : r < 0.85 ? 'sun' : 'rain';
    else if (w === 'fog') w = r < 0.7 ? 'sun' : 'cloud';
    else w = r < 0.5 ? w : r < 0.68 ? 'sun' : r < 0.85 ? 'cloud' : r < 0.94 ? 'rain' : 'fog';
    segs.push([h, w]);
  }
  return segs;
}
function weatherNow(min) {
  let w = WEATHER.plan[0] ? WEATHER.plan[0][1] : 'sun';
  for (const [h, x] of WEATHER.plan) if (min >= h * 60) w = x;
  return WEATHER.manual || w;
}
GAME.setWeather = (w) => { // 设置页 / 控制台调试用；传 null 恢复自动天气
  if (w && !W_P[w]) return;
  WEATHER.manual = w; UI.toast(w ? '天气切换为「' + W_P[w].cn + '」（进入下个时段时恢复自动）' : '恢复自动天气'); UI.refreshHUD();
};
function updateWeather(dt) {
  const st = S(); if (!st) return;
  if (WEATHER.day !== st.day) { WEATHER.day = st.day; WEATHER.plan = weatherPlan(st.day); WEATHER.manual = null; }
  const w = weatherNow(st.min);
  if (w !== WEATHER.tgt) { WEATHER.from = Object.assign({}, WX); WEATHER.tgt = w; WEATHER.k = 0; UI.refreshHUD(); }
  WEATHER.k = Math.min(1, WEATHER.k + dt / 14);
  const B = W_P[w] || W_P.sun, t = smooth(0, 1, WEATHER.k), A = WEATHER.from || B;
  for (const kk of W_KEYS) WX[kk] = lerp(A[kk], B[kk], t);
  WEATHER.rain += (WX.rain - WEATHER.rain) * Math.min(1, dt * 0.5);
  // 地面湿度：下雨时快速变湿，停后慢慢晒干
  WEATHER.wet += (clamp(WEATHER.rain * 1.5, 0, 1) - WEATHER.wet) * Math.min(1, dt * (WEATHER.rain > 0.03 ? 0.5 : 0.035));
  applyWet();
  if (typeof PUDDLE !== 'undefined' && PUDDLE.mat) PUDDLE.mat.opacity = WEATHER.wet * 0.62;
}
/* 雨点：相机周围盒子里的粒子雨（细长雨丝，随风倾斜） */
const RAIN_U = { time: { value: 0 }, camPos: { value: new THREE.Vector3() }, amt: { value: 0 }, tilt: { value: new THREE.Vector2(0.18, 0) } };
function buildRain() {
  const N = 4200; const pos = new Float32Array(N * 3), rnd = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { pos[i * 3] = R(0, 1); pos[i * 3 + 1] = R(0, 1); pos[i * 3 + 2] = R(0, 1); for (let k = 0; k < 4; k++) rnd[i * 4 + k] = R(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('rnd', new THREE.BufferAttribute(rnd, 4));
  const m = new THREE.ShaderMaterial({
    uniforms: RAIN_U, transparent: true, depthWrite: false,
    vertexShader: `attribute vec4 rnd; uniform float time; uniform vec3 camPos; uniform vec2 tilt; varying float vA;
      void main(){ vec3 box=vec3(48.0,26.0,48.0);
        vec3 p=position*box;
        p.y = mod(p.y - time*(20.0+rnd.z*10.0) - camPos.y + box.y*0.5, box.y) - box.y*0.5 + camPos.y;
        p.x = mod(p.x + time*(tilt.x*22.0+rnd.y*3.0) - camPos.x + box.x*0.5, box.x) - box.x*0.5 + camPos.x;
        p.z = mod(p.z + time*(tilt.y*22.0) - camPos.z + box.z*0.5, box.z) - box.z*0.5 + camPos.z;
        vec4 mv=viewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv; float d=-mv.z;
        gl_PointSize = (0.26+rnd.x*0.18)*900.0/max(d,0.5); vA=smoothstep(38.0,14.0,d)*smoothstep(0.5,1.6,d); }`,
    fragmentShader: `uniform float amt; uniform vec2 tilt; varying float vA;
      void main(){ if(amt<0.01) discard; vec2 c=gl_PointCoord-0.5;
        vec2 d=normalize(vec2(tilt.x*0.25,-1.0)); vec2 u=vec2(dot(c,d), c.x*d.y-c.y*d.x);
        if(abs(u.y)>0.055 || abs(u.x)>0.46) discard;
        float a=vA*amt*0.7*(1.0-abs(u.x)*1.4);
        gl_FragColor=vec4(0.75,0.82,0.92, a); }`
  });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 7; scene.add(pts);
}
/* 湿了的路面：粗糙度下降 + 环境反射增强 + 变暗；雨后慢慢晒干 */
const WET_SET = ['asphalt', 'concrete', 'paving', 'stone', 'metal'];
let _wetApplied = -1;
function applyWet() {
  const wet = WEATHER.wet; if (Math.abs(wet - _wetApplied) < 0.02) return; _wetApplied = wet;
  for (const key of WET_SET) {
    const rec = MATS[key]; if (!rec) continue; const m = rec.material; if (!m.isMeshStandardMaterial) continue;
    const u = m.userData; if (u.wetB == null) { u.wetB = m.roughness; u.wetE = m.envMapIntensity || 1; u.wetC = m.color.clone(); }
    m.roughness = lerp(u.wetB, 0.3, wet); m.envMapIntensity = u.wetE * lerp(1, 2.4, wet);
    m.color.copy(u.wetC).multiplyScalar(lerp(1, 0.55, wet));
  }
}
