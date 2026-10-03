/* ==========================================================================
   Web Audio 程序化音效：风、海浪、鸟鸣、虫鸣、道口铃、列车、八音盒、界面音
   ========================================================================== */
const AUDIO = { ok: false, muted: store.get('muted', false), music: store.get('music', true), vol: store.get('vol', 0.8) };
AUDIO.init = function () {
  if (AUDIO.ok) { if (AUDIO.ctx.state === 'suspended') AUDIO.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const ctx = new AC(); AUDIO.ctx = ctx; AUDIO.ok = true;
  const master = ctx.createGain(); master.gain.value = AUDIO.muted ? 0 : AUDIO.vol; const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination); AUDIO.master = master;
  // 混响
  const rev = ctx.createConvolver(); const len = ctx.sampleRate * 2.4; const ib = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ib.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  rev.buffer = ib; const revG = ctx.createGain(); revG.gain.value = 0.35; rev.connect(revG); revG.connect(master); AUDIO.rev = rev;
  // 噪声
  const nb = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate); const nd = nb.getChannelData(0); let last = 0;
  for (let i = 0; i < nd.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; nd[i] = w * 0.5 + last * 3; }
  const noise = (type, freq, q) => { const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; if (q) f.Q.value = q; const g = ctx.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(master); s.start(); return { s, f, g }; };
  AUDIO.wind = noise('bandpass', 420, 0.6);
  AUDIO.waves = noise('lowpass', 700);
  AUDIO.rumble = noise('lowpass', 180);
  AUDIO.leaves = noise('highpass', 3500);
  // 虫鸣
  const cr = ctx.createOscillator(); cr.frequency.value = 4600; const crG = ctx.createGain(); crG.gain.value = 0; const crL = ctx.createOscillator(); crL.frequency.value = 18; const crLG = ctx.createGain(); crLG.gain.value = 1; crL.connect(crLG); const am = ctx.createGain(); am.gain.value = 0; crLG.connect(am.gain); cr.connect(am); am.connect(crG); crG.connect(master); cr.start(); crL.start(); AUDIO.cricket = crG;
  AUDIO.nextBird = 1; AUDIO.nextBell = 0; AUDIO.bellSide = 0; AUDIO.nextClack = 0; AUDIO.musicT = ctx.currentTime + 1; AUDIO.noteI = 0;
};
AUDIO.setMuted = function (m) { AUDIO.muted = m; store.set('muted', m); if (AUDIO.ok) AUDIO.master.gain.setTargetAtTime(m ? 0 : AUDIO.vol, AUDIO.ctx.currentTime, 0.1); };
AUDIO.setVol = function (v) { AUDIO.vol = v; store.set('vol', v); if (AUDIO.ok && !AUDIO.muted) AUDIO.master.gain.setTargetAtTime(v, AUDIO.ctx.currentTime, 0.1); };
function tone(f, t, dur, vol, type = 'sine', dest, attack = 0.005) {
  const ctx = AUDIO.ctx; const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); const g = ctx.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || AUDIO.master); o.start(t); o.stop(t + dur + 0.05); return { o, g };
}
AUDIO.chime = function () { if (!AUDIO.ok) return; const t = AUDIO.ctx.currentTime; [1046.5, 1318.5, 1568, 2093].forEach((f, i) => { tone(f, t + i * 0.09, 0.9, 0.12, 'sine'); tone(f * 2, t + i * 0.09, 0.4, 0.03, 'sine', AUDIO.rev); }); };
AUDIO.coin = function () { if (!AUDIO.ok) return; const t = AUDIO.ctx.currentTime; tone(1568, t, 0.15, 0.1, 'square'); tone(2093, t + 0.07, 0.35, 0.1, 'square'); };
AUDIO.pick = function () { if (!AUDIO.ok) return; const t = AUDIO.ctx.currentTime; tone(880, t, 0.2, 0.12, 'triangle'); tone(1320, t + 0.06, 0.3, 0.1, 'triangle'); };
AUDIO.click = function () { if (!AUDIO.ok) return; tone(660, AUDIO.ctx.currentTime, 0.06, 0.05, 'triangle'); };
AUDIO.splash = function () { if (!AUDIO.ok) return; const ctx = AUDIO.ctx, t = ctx.currentTime; const s = ctx.createBufferSource(); s.buffer = AUDIO.waves.s.buffer; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200; const g = ctx.createGain(); g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5); s.connect(f); f.connect(g); g.connect(AUDIO.master); s.start(t, Math.random()); s.stop(t + 0.6); };
AUDIO.bellRing = function () { if (!AUDIO.ok) return; const t = AUDIO.ctx.currentTime; tone(523, t, 2.5, 0.2, 'sine', AUDIO.rev); tone(784, t, 2.0, 0.12, 'sine'); tone(1046, t + 0.02, 1.5, 0.08, 'triangle'); };
AUDIO.trainChime = function () { if (!AUDIO.ok) return; const t = AUDIO.ctx.currentTime; [659, 784, 988, 784, 880, 1175].forEach((f, i) => tone(f, t + i * 0.18, 0.5, AUDIO.trainVol * 0.15 || 0, 'sine')); };
AUDIO.step = function (v = 1) { if (!AUDIO.ok) return; const ctx = AUDIO.ctx, t = ctx.currentTime; const s = ctx.createBufferSource(); s.buffer = AUDIO.waves.s.buffer; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900 + Math.random() * 500; f.Q.value = 1.2; const g = ctx.createGain(); g.gain.setValueAtTime(0.06 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09); s.connect(f); f.connect(g); g.connect(AUDIO.master); s.start(t, Math.random() * 2); s.stop(t + 0.1); };
function chirp(t, vol) {
  const ctx = AUDIO.ctx; const n = RI(2, 5); const base = R(2600, 4200);
  for (let i = 0; i < n; i++) { const o = ctx.createOscillator(); o.type = 'sine'; const g = ctx.createGain(); const s = t + i * R(0.09, 0.16); o.frequency.setValueAtTime(base * R(0.9, 1.1), s); o.frequency.exponentialRampToValueAtTime(base * R(1.2, 1.6), s + 0.06); o.frequency.exponentialRampToValueAtTime(base * R(0.7, 0.95), s + 0.1); g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(vol, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.12); o.connect(g); g.connect(AUDIO.master); o.start(s); o.stop(s + 0.15); }
}
const MELODIES = [
  // 八音盒：五声音阶的小调
  [[72, 1], [76, 1], [79, 1], [84, 2], [83, 1], [79, 1], [76, 2], [74, 1], [76, 1], [79, 2], [72, 2], [69, 1], [72, 1], [74, 1], [76, 2], [74, 1], [72, 3], [0, 1], [79, 1], [81, 1], [84, 2], [86, 1], [84, 1], [81, 1], [79, 2], [76, 1], [79, 2], [74, 2], [72, 4], [0, 2]],
  // 唱片《星见夜曲》
  [[69, 2], [72, 1], [76, 2], [74, 1], [72, 2], [69, 1], [67, 3], [69, 2], [72, 1], [74, 2], [76, 1], [79, 3], [0, 1], [81, 2], [79, 1], [76, 2], [74, 1], [72, 2], [74, 1], [76, 3], [72, 2], [69, 1], [67, 2], [69, 4], [0, 2]]
];
AUDIO.melody = store.get('melody', 0);
function musicBox(midi, t, dur) {
  const f = 440 * Math.pow(2, (midi - 69) / 12); const v = 0.05;
  tone(f, t, dur * 1.8 + 0.8, v, 'sine', AUDIO.master, 0.003); tone(f * 2, t, 0.6, v * 0.35, 'sine', AUDIO.rev, 0.002); tone(f * 3.01, t, 0.25, v * 0.12, 'sine', AUDIO.master, 0.002);
  tone(f, t, dur * 1.8 + 0.8, v * 0.6, 'sine', AUDIO.rev, 0.003);
}
/* 引擎声：两组锯齿波 + 低通，转速随车速 */
AUDIO.engine = function (on) {
  if (!AUDIO.ok) return; const ctx = AUDIO.ctx;
  if (on && !AUDIO.eng) {
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(); o1.type = 'sawtooth'; o2.type = 'square'; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600; const g = ctx.createGain(); g.gain.value = 0;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(AUDIO.master); o1.start(); o2.start(); AUDIO.eng = { o1, o2, f, g };
  }
  if (AUDIO.eng) AUDIO.eng.g.gain.setTargetAtTime(on ? 0.05 : 0, ctx.currentTime, 0.2);
};
AUDIO.engineUpdate = function (rpm, thr, bike) {
  if (!AUDIO.eng) return; const t = AUDIO.ctx.currentTime; const base = bike ? 70 : 38; const gear = rpm * 4.5 % 1; const f = base + (rpm * 60 + gear * 45) * (bike ? 1.6 : 1);
  AUDIO.eng.o1.frequency.setTargetAtTime(f, t, 0.08); AUDIO.eng.o2.frequency.setTargetAtTime(f * 0.5, t, 0.08); AUDIO.eng.f.frequency.setTargetAtTime(400 + thr * 900 + rpm * 600, t, 0.1);
  AUDIO.eng.g.gain.setTargetAtTime(0.035 + thr * 0.04, t, 0.15);
};
AUDIO.horn = function (v = 1) { if (!AUDIO.ok) return; const t = AUDIO.ctx.currentTime; tone(415, t, 0.45, 0.06 * v, 'square'); tone(523, t, 0.45, 0.05 * v, 'square'); };
AUDIO.crash = function (v = 1) { if (!AUDIO.ok) return; const ctx = AUDIO.ctx, t = ctx.currentTime; const s = ctx.createBufferSource(); s.buffer = AUDIO.waves.s.buffer; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; const g = ctx.createGain(); g.gain.setValueAtTime(0.5 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6); s.connect(f); f.connect(g); g.connect(AUDIO.master); s.start(t, Math.random()); s.stop(t + 0.7); tone(90, t, 0.3, 0.2 * v, 'square'); };
AUDIO.update = function (dt, env) {
  if (!AUDIO.ok) return; const ctx = AUDIO.ctx, now = ctx.currentTime; const k = 0.3;
  const day = 1 - env.night;
  AUDIO.wind.g.gain.setTargetAtTime(0.05 + env.windy * 0.06 + (env.height > 10 ? 0.05 : 0), now, k);
  AUDIO.wind.f.frequency.setTargetAtTime(380 + Math.sin(now * 0.3) * 120, now, k);
  AUDIO.waves.g.gain.setTargetAtTime(env.sea * (0.22 + Math.sin(now * 0.5) * 0.08), now, k);
  AUDIO.leaves.g.gain.setTargetAtTime(env.trees * 0.012 * (0.6 + Math.sin(now * 0.7) * 0.4), now, k);
  AUDIO.cricket.gain.setTargetAtTime(env.night * 0.012 * (1 - env.sea * 0.5), now, 0.5);
  // 鸟鸣
  AUDIO.nextBird -= dt; if (AUDIO.nextBird < 0) { AUDIO.nextBird = R(1.5, 6); if (day > 0.4 && env.trees > 0.1) chirp(now + 0.05, 0.035 * env.trees * day); if (env.sea > 0.4 && day > 0.5 && chance(0.35)) { tone(R(900, 1200), now, 0.35, 0.03 * env.sea, 'sawtooth'); } }
  // 道口铃
  const bell = env.crossing; if (bell > 0.01) { AUDIO.nextBell -= dt; if (AUDIO.nextBell < 0) { AUDIO.nextBell = 0.42; AUDIO.bellSide ^= 1; const f = AUDIO.bellSide ? 760 : 860; const o = tone(f, now, 0.28, 0.06 * bell, 'square'); tone(f * 2.76, now, 0.18, 0.02 * bell, 'sine'); } }
  // 列车
  AUDIO.trainVol = env.train;
  AUDIO.rumble.g.gain.setTargetAtTime(env.train * 0.35 * clamp(env.trainSpeed / 10, 0.15, 1), now, 0.2);
  if (env.train > 0.02 && env.trainSpeed > 1) { AUDIO.nextClack -= dt; if (AUDIO.nextClack < 0) { AUDIO.nextClack = 20 / Math.max(env.trainSpeed, 2) / 2; tone(110, now, 0.08, env.train * 0.25, 'square'); tone(95, now + 0.12, 0.08, env.train * 0.2, 'square'); } }
  // 八音盒
  if (AUDIO.music && !AUDIO.muted) {
    const mel = MELODIES[AUDIO.melody] || MELODIES[0]; const beat = env.night > 0.5 ? 0.42 : 0.36;
    while (AUDIO.musicT < now + 0.3) { const [m, d] = mel[AUDIO.noteI % mel.length]; if (m && env.musicOn) { musicBox(m, AUDIO.musicT, d * beat); if (AUDIO.noteI % 4 === 0) musicBox(m - 24, AUDIO.musicT, d * beat * 1.2); } AUDIO.musicT += d * beat; AUDIO.noteI++; }
  } else AUDIO.musicT = now + 0.2;
};
