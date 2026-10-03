/* ==========================================================================
   界面：HUD、小地图、对话、面板（地图/背包/手账/设置）、提示与印章
   ========================================================================== */
const $ = (id) => document.getElementById(id);
const UI = {};
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
UI.anyOpen = () => !$('panel').hidden || !$('dialog').hidden;
UI.modalOpen = () => !$('panel').hidden;
UI.dialogOpen = () => !$('dialog').hidden;
UI.toggleHUD = () => $('hud').classList.toggle('hidden');
UI.toast = (msg, ms = 3400) => {
  const box = $('toasts'); const d = document.createElement('div'); d.className = 'toast card'; d.textContent = msg; box.appendChild(d);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { d.style.transition = 'opacity .5s'; d.style.opacity = '0'; setTimeout(() => d.remove(), 500); }, ms);
};
function phaseName(h) { return h < 5 ? '深夜' : h < 7 ? '清晨' : h < 11 ? '上午' : h < 13 ? '正午' : h < 17 ? '下午' : h < 19 ? '黄昏' : h < 22 ? '夜樱' : '深夜'; }
UI.refreshHUD = () => {
  const st = S();
  $('hudDay').textContent = '第 ' + st.day + ' 天 · ' + WEEK[(st.day - 1) % 7] + ' · 晴';
  $('hudTime').textContent = fmtTime(st.min); $('hudPhase').textContent = phaseName(st.min / 60);
  $('hudCoins').textContent = st.coins;
  const ul = $('taskList'); ul.innerHTML = '';
  const items = [];
  if (st.gotDay !== st.day) items.push(['去邮局找方姐领取今天的信', '商店街东侧 · 红砖楼', false]);
  for (const l of st.letters) items.push(['「' + l.title + '」→ ' + recipientName(l), l.mailbox ? '投进信箱' : whereIs(l.to), l.story != null]);
  if (st.story >= 3 && !st.flags.date) items.push(['今晚九点，樱花广场', '去见证那个约定吧', true]);
  if (!items.length) items.push(['今天的信都送完了', '去逛逛、钓鱼，或者回家睡觉', false]);
  for (const [a, b, story] of items.slice(0, 6)) { const li = document.createElement('li'); if (story) li.className = 'story'; li.innerHTML = '<span>' + esc(a) + (b ? '<br><em>' + esc(b) + '</em>' : '') + '</span>'; ul.appendChild(li); }
  $('taskCount').textContent = st.letters.length + ' 封';
};
function whereIs(id) {
  const n = NPC_BY(id); if (!n) return '';
  const p = n.pos; let best = '', bd = 1e9; for (const pl of PLACES) { const d = Math.hypot(pl.x - p.x, pl.z - p.z); if (d < bd) { bd = d; best = pl.name; } }
  return (n.d.title || '') + ' · ' + best + '附近';
}

/* ---------------- 地图 ---------------- */
let mapBase = null; const MAP = { cx: -70, cz: -95, S: 820, PX: 1024 };
const WP = { on: false, x: 0, z: 0, mesh: null };
function buildMapBase() {
  const N = MAP.PX, c = makeCanvas(N, N); const g = c.getContext('2d'); const img = g.createImageData(N, N); const d = img.data;
  const step = MAP.S / N;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = MAP.cx - MAP.S / 2 + (i + 0.5) * step, z = MAP.cz - MAP.S / 2 + (j + 0.5) * step; const k = (j * N + i) * 4;
    let r, gg, b;
    if (islandC(x, z) < -0.08) { r = 28; gg = 52; b = 70; }
    else { const h = terrainNatural(x, z); if (h < 0.05) { r = 34; gg = 62; b = 82; } else if (h < 1.3 && islandC(x, z) < 0.16) { r = 150; gg = 140; b = 110; } else { const s = clamp(h / 70, 0, 1); r = lerp(58, 92, s); gg = lerp(76, 96, s); b = lerp(56, 82, s); } }
    d[k] = r; d[k + 1] = gg; d[k + 2] = b; d[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const W = (x, z) => [(x - MAP.cx + MAP.S / 2) / step, (z - MAP.cz + MAP.S / 2) / step];
  const line = (pts, col, w, dash) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash(dash || []); g.beginPath(); pts.forEach((p, i) => { const q = W(p[0], p[1]); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.stroke(); g.setLineDash([]); };
  line(RIVER, '#3d6f8a', 8);
  for (const c2 of FARM.cells) { const a = W(c2.x0, c2.z0), b2 = W(c2.x1, c2.z1); g.fillStyle = 'rgba(110,140,90,0.7)'; g.fillRect(a[0], a[1], b2[0] - a[0], b2[1] - a[1]); }
  g.fillStyle = 'rgba(120,128,136,0.9)';
  for (const c2 of COLS) { if (c2.ramp || c2.walk || c2.round || c2.noFloor) continue; if (c2.y1 - c2.y0 < 2.4) continue; const q = W(c2.x, c2.z); g.save(); g.translate(q[0], q[1]); g.rotate(-Math.atan2(c2.s, c2.c)); g.fillRect(-c2.hw / step, -c2.hd / step, c2.hw * 2 / step, c2.hd * 2 / step); g.restore(); }
  const rects = [[-7, 7, -84, 44], [-46, 104, -84, -76], [96, 108, -84, 47], [-62, 104, 34, 47], [22, 26, -50, 36], [-26, -22, -17, 36], [-62, 22, -23, -17], [-98, -94, -45, 65]];
  g.fillStyle = '#c9ced4'; for (const [x0, x1, z0, z1] of rects) { const a = W(x0, z0), b2 = W(x1, z1); g.fillRect(a[0], a[1], b2[0] - a[0], b2[1] - a[1]); }
  for (const r of ROADS) line(r.pts.map(p => [p[0], p[2]]), '#d7dbe0', 6);
  line([[-170, -60], [140, -60]], '#8a8f99', 2.5, [6, 4]);
  for (const t of TREES) { if (t.forest) continue; if (t.kind !== 'sakura') continue; const q = W(t.x, t.z); g.fillStyle = 'rgba(240,150,180,0.75)'; g.beginPath(); g.arc(q[0], q[1], Math.max(1.5, t.r * 0.5 / step), 0, TAU); g.fill(); }
  mapBase = c;
}
/* view：视野宽度（米）；rotate：地图旋转（null = 北向上） */
function drawMapTo(ctx, w, h, cx, cz, view, rotate, labels) {
  const k = w / view; const step = MAP.S / MAP.PX;
  ctx.save(); ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#1c3445'; ctx.fillRect(0, 0, w, h);
  ctx.translate(w / 2, h / 2); if (rotate != null) ctx.rotate(rotate); ctx.scale(k * step, k * step);
  ctx.drawImage(mapBase, -(cx - MAP.cx + MAP.S / 2) / step, -(cz - MAP.cz + MAP.S / 2) / step);
  ctx.restore();
  const toS = (x, z) => { let dx = (x - cx) * k, dz = (z - cz) * k; if (rotate != null) { const c = Math.cos(rotate), s = Math.sin(rotate); [dx, dz] = [dx * c - dz * s, dx * s + dz * c]; } return [w / 2 + dx, h / 2 + dz]; };
  const clampEdge = (sx, sy) => labels ? [sx, sy] : [clamp(sx, 10, w - 10), clamp(sy, 10, h - 10)];
  const blip = (x, z, col, shape) => { let [sx, sy] = clampEdge(...toS(x, z)); ctx.fillStyle = col; ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); if (shape === 'd') { ctx.moveTo(sx, sy - 8); ctx.lineTo(sx + 7, sy); ctx.lineTo(sx, sy + 8); ctx.lineTo(sx - 7, sy); ctx.closePath(); } else ctx.arc(sx, sy, 6.5, 0, TAU); ctx.fill(); ctx.stroke(); };
  for (const l of S().letters) { let x, z; if (l.mailbox) { const m = MAILBOXES.find(mm => mm.name === l.mailbox); if (!m) continue; x = m.x; z = m.z; } else { const n = NPC_BY(l.to); if (!n) continue; x = n.pos.x; z = n.pos.z; } blip(x, z, l.story != null ? '#4fb3e8' : '#ef8fae', 'd'); }
  if (S().gotDay !== S().day) { const f = NPC_BY('fang'); if (f) blip(f.pos.x, f.pos.z, '#ef5b4c'); }
  if (WP.on) { const [sx, sy] = clampEdge(...toS(WP.x, WP.z)); ctx.fillStyle = '#f0b429'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 7, sy - 14); ctx.lineTo(sx + 7, sy - 14); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  if (labels) {
    PLACES.forEach((p, i) => { const [sx, sy] = toS(p.x, p.z); const main = i < 9; ctx.font = `700 ${main ? Math.round(w / 52) : Math.round(w / 64)}px ${FONT.sans}`; ctx.textAlign = 'center'; ctx.fillStyle = main ? '#f0b429' : '#c9ced4'; ctx.beginPath(); ctx.arc(sx, sy, main ? 5 : 3.5, 0, TAU); ctx.fill(); const txt = (main ? (i + 1) + '  ' : '') + p.name; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.strokeText(txt, sx, sy - 10); ctx.fillStyle = '#f1f3f6'; ctx.fillText(txt, sx, sy - 10); });
  }
  const [px, py] = toS(PLAYER.pos.x, PLAYER.pos.z); ctx.save(); ctx.translate(px, py); ctx.rotate((rotate || 0) - PLAYER.yaw + Math.PI);
  ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8, 8); ctx.lineTo(0, 4); ctx.lineTo(-8, 8); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
}
UI.drawMinimap = () => {
  if (!mapBase) return; const c = $('minimap'); const g = c.getContext('2d');
  const view = DRIVE.v ? 260 + Math.abs(DRIVE.v.v) * 4 : 190;
  drawMapTo(g, c.width, c.height, PLAYER.pos.x, PLAYER.pos.z, view, PLAYER.camYaw - Math.PI, false);
  let best = '星见岛', bd = 1e9; for (const p of PLACES) { const d = Math.hypot(p.x - PLAYER.pos.x, p.z - PLAYER.pos.z); if (d < bd) { bd = d; best = p.name; } }
  if (bd > 80) best = islandC(PLAYER.pos.x, PLAYER.pos.z) < 0.15 ? '海岸公路' : (terrainH(PLAYER.pos.x, PLAYER.pos.z) > 25 ? '星见山' : '环岛公路');
  if (insideHome(PLAYER.pos.x, PLAYER.pos.z)) best = '小信使的家';
  const chip = $('placeChip'); if (chip.textContent !== best) chip.textContent = best;
  $('wpDist').textContent = WP.on ? Math.round(Math.hypot(WP.x - PLAYER.pos.x, WP.z - PLAYER.pos.z)) + ' m' : '';
  if (WP.on && Math.hypot(WP.x - PLAYER.pos.x, WP.z - PLAYER.pos.z) < 12) { UI.setWaypoint(null); UI.toast('已到达标记点'); }
};
UI.setWaypoint = (p) => {
  if (!WP.mesh) { WP.mesh = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 120, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xf0b429, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); scene.add(WP.mesh); }
  if (!p) { WP.on = false; WP.mesh.visible = false; return; }
  WP.on = true; WP.x = p[0]; WP.z = p[1]; WP.mesh.visible = true; WP.mesh.position.set(p[0], terrainH(p[0], p[1]) + 58, p[1]);
};
UI.tickHUD = (st, hour) => {
  $('hudTime').textContent = fmtTime(st.min);
  const v = DRIVE.v; const sp = $('speedo');
  if (v) { sp.hidden = false; $('spdNum').textContent = Math.round(Math.abs(v.v) * 3.6); $('spdName').textContent = v.T.name; } else sp.hidden = true;
};

/* ---------------- 对话 ---------------- */
let typeTimer = null, typeFull = '', typeShown = 0;
function drawPortrait(n) {
  const c = $('portrait'), g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
  g.save(); g.beginPath(); g.arc(76, 76, 76, 0, TAU); g.clip(); g.fillStyle = '#f6d3dd'; g.fillRect(0, 0, 152, 152);
  if (n && n.c) { const P = charPortrait(n.c);
    if (P.proc) { const hc = '#' + new THREE.Color(n.d.look.hairCol != null ? n.d.look.hairCol : 0x3a2a2a).getHexString(); g.fillStyle = hc; g.beginPath(); g.arc(76, 92, 72, Math.PI, 0); g.fill(); g.drawImage(P.img, P.sx, P.sy, P.sw, P.sh, 6, 34, 140, 140); g.fillStyle = hc; g.beginPath(); g.ellipse(76, 40, 62, 26, 0, 0, TAU); g.fill(); }
    else g.drawImage(P.img, P.sx, P.sy, P.sw, P.sh, 0, 4, 152, 152); }
  g.restore();
}
UI.say = (n, text, choices) => {
  const d = $('dialog'); d.hidden = false; if (document.pointerLockElement) document.exitPointerLock();
  $('dlName').textContent = n ? n.name : ''; $('dlTitle').textContent = n ? (n.d.title || '') : '';
  const f = n ? (S().friends[n.id] || 0) : 0; $('dlHearts').textContent = n ? '♥'.repeat(Math.round(f / 2)) + '♡'.repeat(5 - Math.round(f / 2)) : '';
  drawPortrait(n);
  typeFull = text; typeShown = 0; clearInterval(typeTimer); $('dlText').textContent = '';
  typeTimer = setInterval(() => { typeShown += 2; $('dlText').textContent = typeFull.slice(0, typeShown); if (typeShown >= typeFull.length) clearInterval(typeTimer); }, 22);
  const box = $('dlChoices'); box.innerHTML = '';
  (choices || [['好', () => UI.closeDialog()]]).forEach(([label, fn], i) => { const b = document.createElement('button'); b.className = 'choice' + (i === 0 ? ' primary' : ''); b.textContent = label; b.onclick = (e) => { e.stopPropagation(); AUDIO.click(); fn(); }; box.appendChild(b); });
};
UI.dialogAdvance = () => { if (typeShown < typeFull.length) { typeShown = typeFull.length; $('dlText').textContent = typeFull; clearInterval(typeTimer); return; } const b = $('dlChoices').querySelector('button'); if (b) b.click(); };
UI.closeDialog = () => { $('dialog').hidden = true; clearInterval(typeTimer); GAME.talkingTo = null; };

/* ---------------- 面板 ---------------- */
const PANELS = { map: '地图', bag: '背包', journal: '手账', settings: '设置' };
let panelTab = 'map', journalTab = 'stamps';
UI.openPanel = (name) => { panelTab = name; $('panel').hidden = false; if (document.pointerLockElement) document.exitPointerLock(); renderPanel(); };
UI.closeAll = () => { $('panel').hidden = true; UI.closeDialog(); };
$('panel').addEventListener('click', (e) => { if (e.target.id === 'panel') UI.closeAll(); });
function renderPanel(extra) {
  const head = $('pnHead'), body = $('pnBody');
  head.innerHTML = Object.entries(PANELS).map(([k, v]) => `<button class="pn-tab" data-tab="${k}" aria-selected="${k === panelTab}">${v}</button>`).join('') + '<button class="pn-close" id="pnClose">关闭</button>';
  if (panelTab === 'shop') head.innerHTML = `<button class="pn-tab" aria-selected="true">${esc(extra.sh.def.cn)}</button><button class="pn-close" id="pnClose">离开</button>`;
  head.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { panelTab = b.dataset.tab; renderPanel(); });
  $('pnClose').onclick = UI.closeAll;
  const st = S();
  if (panelTab === 'map') {
    body.innerHTML = '<canvas id="bigmap" width="1200" height="1200"></canvas><p class="map-hint">点地名快速前往（数字键 1–9 同样可以）；点地图其他位置放置导航标记，再点一次取消。菱形是收信人，红点是方姐。</p>';
    const c = $('bigmap'); const V = 760, CX = -60, CZ = -95; drawMapTo(c.getContext('2d'), 1200, 1200, CX, CZ, V, null, true);
    c.onclick = (e) => { const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * 1200, y = (e.clientY - r.top) / r.height * 1200; const k = 1200 / V; let best = -1, bd = 40; PLACES.forEach((p, i) => { const sx = 600 + (p.x - CX) * k, sy = 600 + (p.z - CZ) * k; const d = Math.hypot(sx - x, sy - y); if (d < bd) { bd = d; best = i; } }); if (best >= 0) { GAME.teleport(best); return; } const wx = CX + (x - 600) / k, wz = CZ + (y - 600) / k; if (WP.on && Math.hypot(wx - WP.x, wz - WP.z) < 30) UI.setWaypoint(null); else { UI.setWaypoint([wx, wz]); UI.toast('已放置导航标记'); } renderPanel(); };
  } else if (panelTab === 'bag') {
    const inv = Object.entries(st.inv).filter(([k, v]) => v > 0);
    body.innerHTML = '<h4>随身的信</h4>' + (st.letters.length ? '<div class="grid-items">' + st.letters.map(l => `<div class="item"><b>「${esc(l.title)}」</b><small>寄件：${esc(l.from)}<br>收件：${esc(recipientName(l))}${l.mailbox ? '（投进信箱）' : ''}</small></div>`).join('') + '</div>' : '<p class="empty">包里没有待送的信。</p>') +
      '<h4 style="margin-top:18px">物品</h4>' + (inv.length ? '<div class="grid-items">' + inv.map(([k, v]) => `<div class="item"><b>${esc(k.replace('#', ''))} × ${v}</b><small>${esc(itemDesc(k))}</small></div>`).join('') + '</div>' : '<p class="empty">空空的。商店街可以买到面包、花和小鱼干。</p>');
  } else if (panelTab === 'journal') {
    const tabs = [['stamps', '邮票册'], ['people', '居民'], ['diary', '日记']];
    body.innerHTML = '<div class="seg" style="margin-bottom:14px">' + tabs.map(([k, v]) => `<button data-j="${k}" aria-pressed="${journalTab === k}">${v}</button>`).join('') + '</div><div id="jBody"></div>';
    body.querySelectorAll('[data-j]').forEach(b => b.onclick = () => { journalTab = b.dataset.j; renderPanel(); });
    const jb = $('jBody');
    if (journalTab === 'stamps') {
      jb.innerHTML = `<p class="empty" style="padding-top:0">已收集 ${st.stamps.length} / ${STAMP_DEFS.length} 枚。集齐的邮票会贴在家里的墙上。</p><div class="stamps">` + STAMP_DEFS.map(d => `<div class="stamp ${st.stamps.includes(d.id) ? '' : 'locked'}"><canvas width="144" height="180" data-s="${d.id}"></canvas><b>${st.stamps.includes(d.id) ? esc(d.name) : '？？？'}</b><span>${esc(d.desc)}</span></div>`).join('') + '</div>';
      jb.querySelectorAll('canvas[data-s]').forEach(c => { const d = STAMP_DEFS.find(s => s.id === c.dataset.s); const g = c.getContext('2d'); g.scale(3, 3); drawStamp(g, 4, 4, 40, 52, d); });
    } else if (journalTab === 'people') {
      jb.innerHTML = '<div class="people">' + NPCS.filter(n => n.d.title).map(n => { const f = st.friends[n.id] || 0; return `<div class="person"><canvas width="88" height="88" data-n="${n.id}"></canvas><div><b>${esc(n.name)}</b><small>${esc(n.d.title)} · 喜欢：${esc((n.d.likes || []).slice(0, 2).join('、') || '？')}</small><span class="h">${'♥'.repeat(Math.round(f / 2))}${'♡'.repeat(5 - Math.round(f / 2))}</span></div></div>`; }).join('') + '</div>';
      jb.querySelectorAll('canvas[data-n]').forEach(c => { const n = NPC_BY(c.dataset.n); const g = c.getContext('2d'); g.fillStyle = '#f6d3dd'; g.fillRect(0, 0, 88, 88); const P = charPortrait(n.c); g.drawImage(P.img, P.sx, P.sy, P.sw, P.sh, 0, P.proc ? 6 : 0, 88, 88); });
    } else {
      jb.innerHTML = '<div class="diary">' + st.diary.slice().reverse().map(e => `<p><time>第 ${e.day} 天 · ${e.t}</time>${esc(e.text)}</p>`).join('') + '</div>';
    }
  } else if (panelTab === 'settings') {
    const q = qName, tf = GAME.timeFlow;
    body.innerHTML = `<div class="set">
      <div class="set-row"><span>画质</span><div class="seg" id="sQ">${['high', 'mid', 'low'].map(k => `<button data-v="${k}" aria-pressed="${q === k}">${QUALITY[k].label}</button>`).join('')}</div></div>
      <div class="set-row"><span>时间</span><div class="seg" id="sT"><button data-v="900">下午</button><button data-v="1080">黄昏</button><button data-v="1260">夜樱</button><button data-v="420">清晨</button></div></div>
      <div class="set-row"><span>时间流速</span><div class="seg" id="sF">${[[0, '暂停'], [0.5, '慢'], [1, '正常'], [3, '快']].map(([v, l]) => `<button data-v="${v}" aria-pressed="${tf == v}">${l}</button>`).join('')}</div></div>
      <div class="set-row"><span>音乐（八音盒）</span><div class="seg" id="sM"><button data-v="1" aria-pressed="${AUDIO.music}">开</button><button data-v="0" aria-pressed="${!AUDIO.music}">关</button></div></div>
      <div class="set-row"><label for="sVol">音量</label><input id="sVol" type="range" min="0" max="1" step="0.05" value="${AUDIO.vol}"></div>
      <div class="set-row"><label for="sSens">鼠标灵敏度</label><input id="sSens" type="range" min="0.3" max="2.5" step="0.1" value="${store.get('sens', 1)}"></div>
      <div class="set-row"><span>操作</span><div class="keys">${KEY_HELP}</div></div>
      <div class="set-row"><span>存档</span><div class="seg"><button id="sSave">立即保存</button><button id="sReset">重新开始…</button></div></div>
    </div>`;
    body.querySelectorAll('#sQ button').forEach(b => b.onclick = () => { setQuality(b.dataset.v); renderPanel(); });
    body.querySelectorAll('#sT button').forEach(b => b.onclick = () => { GAME.setTime(+b.dataset.v); UI.toast('时间来到 ' + fmtTime(+b.dataset.v)); });
    body.querySelectorAll('#sF button').forEach(b => b.onclick = () => { GAME.timeFlow = +b.dataset.v; store.set('timeFlow', GAME.timeFlow); renderPanel(); });
    body.querySelectorAll('#sM button').forEach(b => b.onclick = () => { AUDIO.music = b.dataset.v === '1'; store.set('music', AUDIO.music); renderPanel(); });
    $('sVol').oninput = (e) => AUDIO.setVol(+e.target.value);
    $('sSens').oninput = (e) => store.set('sens', +e.target.value);
    $('sSave').onclick = () => { GAME.save(); UI.toast('已保存'); };
    $('sReset').onclick = (e) => { const b = e.target; if (b.dataset.confirm) { store.set('save', null); GAME.S = freshState(); location.reload(); } else { b.dataset.confirm = '1'; b.textContent = '确定清除存档？再点一次'; } };
  } else if (panelTab === 'shop') {
    const { sh, goods } = extra; const isFish = sh.def.id === 'fish';
    body.innerHTML = `<p class="empty" style="padding-top:0">口袋里有 <b class="num">${st.coins}</b> 贝壳币。</p><div class="grid-items">` + goods.map((g, i) => `<div class="item"><b>${esc(g[0])}</b><small>${esc(g[2])}</small><div class="row"><span class="price"><span class="shell"></span>${g[1]}</span><button data-i="${i}">${g[3] === 'eat' ? '点一份' : '买下'}</button></div></div>`).join('') + (isFish ? `<div class="item"><b>收鱼</b><small>老板说：新鲜的鱼按市价收。小竹荚鱼 3、青花鱼 5、小章鱼 6、真鲷 12。</small><div class="row"><span></span><button id="sellFish">卖掉所有鱼</button></div></div>` : '') + '</div>';
    body.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { GAME.buy(goods[+b.dataset.i]); renderPanel(extra); });
    if (isFish) $('sellFish').onclick = () => { GAME.sellFish(); renderPanel(extra); };
  }
}
UI.openShop = (sh, goods) => { panelTab = 'shop'; $('panel').hidden = false; if (document.pointerLockElement) document.exitPointerLock(); renderPanel({ sh, goods }); };
UI.syncSettings = () => { if (!$('panel').hidden && panelTab === 'settings') renderPanel(); };
function itemDesc(k) {
  for (const list of Object.values(SHOP_GOODS)) for (const g of list) if (g[0] === k) return g[2];
  const extra = { '樱贝': '粉色的小贝壳，岛上最稀有。', '白蛤壳': '被海浪磨得很光滑。', '螺壳': '贴在耳边能听见海。', '扇贝壳': '像一把小扇子。', '#狐火灯笼': '白狐送的青色狐火，夜里会为你照路。', '小竹荚鱼': '可以喂猫，也可以卖给蓝鲸鱼铺。', '青花鱼': '肥美。', '真鲷': '红色的大鱼！很值钱。', '小章鱼': '在桶里扭来扭去。' };
  return extra[k] || '';
}
UI.stampPop = (d) => {
  const box = $('stampPop'); box.innerHTML = '<canvas width="240" height="300"></canvas><div class="card"><b>获得邮票「' + esc(d.name) + '」</b>' + esc(d.desc) + '</div>'; box.hidden = false;
  const g = box.querySelector('canvas').getContext('2d'); g.scale(5, 5); drawStamp(g, 4, 4, 40, 52, d);
  clearTimeout(UI._sp); UI._sp = setTimeout(() => box.hidden = true, 3200);
};
UI.bite = (on) => { $('bite').hidden = !on; };
UI.fade = (mid) => { const f = $('fade'); f.textContent = '晚安'; f.classList.add('on'); setTimeout(() => { mid(); f.textContent = ''; setTimeout(() => f.classList.remove('on'), 300); }, 1300); };
UI.joy = (on, x, y) => { const j = $('joy'); j.hidden = !on; if (on) { j.style.left = x + 'px'; j.style.top = y + 'px'; j.firstChild.style.transform = ''; } };
UI.joyMove = (m) => { const dx = m.x - m.x0, dy = m.y - m.y0; const L = Math.min(40, Math.hypot(dx, dy)); const a = Math.atan2(dy, dx); $('joy').firstChild.style.transform = `translate(${Math.cos(a) * L}px,${Math.sin(a) * L}px)`; };
const KEY_HELP = [['WASD', '行走 / 驾驶'], ['Shift', '奔跑'], ['空格', '跳跃 / 手刹'], ['E', '互动'], ['F', '上车 / 下车'], ['H', '喇叭'], ['鼠标', '环视'], ['T', '切换时间'], ['1–9', '快速前往'], ['Tab', '地图'], ['B', '背包'], ['J', '手账'], ['U', '隐藏界面'], ['M', '静音'], ['滚轮', '镜头远近']].map(([k, v]) => `<span><kbd>${k}</kbd> ${v}</span>`).join('');
function setQuality(k, silent) {
  qName = k; Q = QUALITY[k]; store.set('quality', k);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.pr)); renderer.setSize(innerWidth, innerHeight);
  camera.far = Q.far + 2600; camera.updateProjectionMatrix(); applyShadowQuality(); applyFoliageQuality(); applyPetalQuality(); applyForestQuality();
  SEA_U.waves.value = Q.waves; if (composer) { composer.dispose && composer.dispose(); initPost(); } if (!silent) UI.toast('画质：' + Q.label);
}
function initUIEvents() {
  document.querySelectorAll('.tbtn').forEach(b => b.onclick = () => UI.openPanel(b.dataset.panel));
  $('prompt').onclick = () => GAME.interact();
  if (IS_TOUCH) {
    $('mobile').hidden = false;
    $('mAct').onclick = () => GAME.interact(); $('mJump').onclick = () => { INPUT.jump = true; KEYS.add(' '); setTimeout(() => KEYS.delete(' '), 300); };
    $('mCam').onclick = () => GAME.vehicleKey(); $('mRun').onclick = (e) => { INPUT.forceRun = !INPUT.forceRun; e.target.style.background = INPUT.forceRun ? 'var(--sakura-soft)' : ''; };
  }
}
