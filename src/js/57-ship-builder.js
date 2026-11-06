// ============================================================
//  THE SHIPYARD — a 3D grid ship builder, opened from the terminal in the Hangar.
//  Blocks live on an 11 x 9 x 15 grid (x = left/right, y = up, z = back; the nose points to -z).  Everything is drawn by a tiny painter's-algorithm
//  renderer on a 2D canvas, so the builder never touches the game's WebGL state.  Designs are kept as BLUEPRINTS in the save (extras.ships).
// ============================================================
const SPD = DATA.shipparts, SGRID = SPD.grid, SPARTS = SPD.parts, YW = SGRID.w, YH = SGRID.h, YDP = SGRID.d, SBUDGET = SGRID.budget;
const SPIDX = {}; SPARTS.forEach((p, i) => SPIDX[p.id] = i);
const SSTAT = [['hp', 'HP', '#ff6a9a'], ['off', 'Offense', '#ff5a4a'], ['pow', 'Power', '#e8f04a'], ['mob', 'Mobility', '#5af07a'], ['rol', 'Rolling', '#4ac8ff'], ['spd', 'Speed', '#b79cff']];
const SNORM = { hp: 400, off: 200, pow: 100, mob: 60, rol: 80, spd: 150 };
const SCOL = (() => { const o = []; for (let c = 0; c < 8; c++) { const g = 235 - c * 30; o.push([g, g, g + 4]); }
  const L = [.74, .62, .52, .43, .35, .27, .2]; for (const l of L) for (let c = 0; c < 8; c++) { const h = c / 8 * 360 + 8, s = .62, a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }; o.push([f(0), f(8), f(4)]); }
  return o; })();
const STAGC = { a: [52, 58, 70], g: [90, 215, 255], e: [255, 150, 50], m: [255, 80, 230] }, STAGE = { e: 1, m: 1, g: .35 };
const SLIGHT = (() => { const v = [-.45, .8, .4], l = Math.hypot(...v); return v.map(a => a / l); })();
const YVIEWS = ['persp', 'top', 'side', 'front'], YVNAME = { persp: 'ORBIT', top: 'TOP', side: 'SIDE', front: 'FRONT' };
const YVPRE = { top: [0, Math.PI / 2], side: [Math.PI / 2, 0], front: [Math.PI, 0] };

// ---- the little renderer ----
function shipView(cam, W, H) {
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const r1 = [cy, 0, -sy], r2 = [-sp * sy, cp, -sp * cy], r3 = [cp * sy, sp, cp * cy];
  const S = cam.scale, D = cam.dist || 30, ortho = !!cam.ortho, px = W / 2 + (cam.px || 0), py = H / 2 + (cam.py || 0), cpos = [r3[0] * D, r3[1] * D, r3[2] * D];
  return {
    r1, r2, r3, ortho, S,
    proj(x, y, z) { const X = r1[0] * x + r1[1] * y + r1[2] * z, Y = r2[0] * x + r2[1] * y + r2[2] * z, Z = r3[0] * x + r3[1] * y + r3[2] * z, k = ortho ? S : S * D / Math.max(2, D - Z); return [px + X * k, py - Y * k, Z]; },
    toward(x, y, z) { if (ortho) return r3; const dx = cpos[0] - x, dy = cpos[1] - y, dz = cpos[2] - z, l = Math.hypot(dx, dy, dz) || 1; return [dx / l, dy / l, dz / l]; }
  };
}
function shipPartMesh(b) { return ShipMesh.mesh(SPARTS[b.p].shape, b.rx, b.ry, b.rz, b.m); }
function shipDraw(ctx, V, items, alpha) {
  const dep = items.map(it => [V.proj(it.x, it.y, it.z)[2], it]).sort((a, b) => a[0] - b[0]);
  ctx.lineJoin = 'round'; ctx.lineWidth = 1; if (alpha !== undefined) ctx.globalAlpha = alpha;
  for (const [, it] of dep) {
    const cl = it.col;
    for (const f of it.mesh.faces) {
      const n = f.n, tw = V.toward(it.x + f.c[0], it.y + f.c[1], it.z + f.c[2]);
      if (n[0] * tw[0] + n[1] * tw[1] + n[2] * tw[2] < .01) continue;
      const base = f.t === 'p' ? cl : STAGC[f.t], em = STAGE[f.t] || 0;
      const sh = .36 + .56 * Math.max(0, n[0] * SLIGHT[0] + n[1] * SLIGHT[1] + n[2] * SLIGHT[2]) + .2 * Math.max(0, n[0] * V.r3[0] + n[1] * V.r3[1] + n[2] * V.r3[2]);
      const k = em >= 1 ? 1 : em ? sh + .3 : sh, r = Math.min(255, base[0] * k) | 0, g = Math.min(255, base[1] * k) | 0, b = Math.min(255, base[2] * k) | 0;
      ctx.beginPath(); for (let i = 0; i < f.v.length; i++) { const p = V.proj(it.x + f.v[i][0], it.y + f.v[i][1], it.z + f.v[i][2]); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.closePath();
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')'; ctx.fill(); ctx.strokeStyle = 'rgba(' + (r * .55 | 0) + ',' + (g * .55 | 0) + ',' + (b * .6 | 0) + ',.9)'; ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
function shipBoxPoly(ctx, V, x0, y0, z0, x1, y1, z1, fill, stroke) {                 // a see-through box (cursor, beams)
  const P = (x, y, z) => V.proj(x, y, z), c = [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0), P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)];
  if (fill) { ctx.fillStyle = fill; for (const f of [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]]) { ctx.beginPath(); f.forEach((i, k) => k ? ctx.lineTo(c[i][0], c[i][1]) : ctx.moveTo(c[i][0], c[i][1])); ctx.closePath(); ctx.fill(); } }
  if (stroke) { ctx.strokeStyle = stroke; ctx.beginPath(); for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) { ctx.moveTo(c[a][0], c[a][1]); ctx.lineTo(c[b][0], c[b][1]); } ctx.stroke(); }
}
function shipGrid(ctx, V) {                                                           // the blue hologram grid on the three walls facing away from you
  const half = [YW / 2, YH / 2, YDP / 2], n = [YW, YH, YDP];
  ctx.lineWidth = 1;
  for (let a = 0; a < 3; a++) for (const s of [-1, 1]) {
    const c = [0, 0, 0]; c[a] = s * half[a]; const tw = V.toward(c[0], c[1], c[2]); if (s * tw[a] > -.02) continue;
    const u = (a + 1) % 3, v = (a + 2) % 3; ctx.strokeStyle = 'rgba(40,150,255,.62)'; ctx.beginPath();
    for (let i = 0; i <= n[u]; i++) { const p = [0, 0, 0], q = [0, 0, 0]; p[a] = q[a] = c[a]; p[u] = q[u] = -half[u] + i; p[v] = -half[v]; q[v] = half[v]; const A = V.proj(p[0], p[1], p[2]), B = V.proj(q[0], q[1], q[2]); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); }
    for (let i = 0; i <= n[v]; i++) { const p = [0, 0, 0], q = [0, 0, 0]; p[a] = q[a] = c[a]; p[v] = q[v] = -half[v] + i; p[u] = -half[u]; q[u] = half[u]; const A = V.proj(p[0], p[1], p[2]), B = V.proj(q[0], q[1], q[2]); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); }
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(120,210,255,.95)'; ctx.lineWidth = 2; shipBoxPoly(ctx, V, -half[0], -half[1], -half[2], half[0], half[1], half[2], null, 'rgba(120,210,255,.8)'); ctx.lineWidth = 1;
  const y = -half[1] + .01, ch = [[0, -6.4], [4.8, -1.6], [4.8, .2], [0, -4.7], [-4.8, .2], [-4.8, -1.6]];          // the orange nose arrow on the floor
  ctx.beginPath(); ch.forEach((p, i) => { const q = V.proj(p[0], y, p[1]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.fillStyle = 'rgba(255,150,40,.2)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,190,80,.8)'; ctx.stroke();
}
function shipFit(view, W, H, zoom) {
  const pad = 2.2, m = Math.min(W, H);
  if (view === 'persp') return { ortho: false, dist: 34, scale: m / (2 * Math.hypot(YW, YH, YDP) / 2 * 1.02) * zoom };
  const sp = view === 'top' ? [YW, YDP] : view === 'side' ? [YDP, YH] : [YW, YH];
  return { ortho: true, dist: 30, scale: Math.min(W / (sp[0] + pad), H / (sp[1] + pad)) * zoom };
}

// ---- the builder ----
const Yard = {
  blocks: new Map(), cur: [5, 0, 7], part: 0, cat: 'hull', rx: 0, ry: 0, rz: 0, col: 0, mirror: true, view: 'persp', tab: 'blocks', slot: 0,
  yaw: -.62, pitch: .5, zoom: 1, msg: '', msgT: 0, undo: [], redo: [], items: null, thumbs: {}, dom: false, name: '', disp: null, dispKey: '',
  key: (i, j, k) => (j * YDP + k) * YW + i,
  unkey(n) { const i = n % YW, r = (n - i) / YW, k = r % YDP; return [i, (r - k) / YDP, k]; },
  inGrid: (i, j, k) => i >= 0 && j >= 0 && k >= 0 && i < YW && j < YH && k < YDP,
  store() { const X = SaveStore.doc.extras; if (!X.ships || !Array.isArray(X.ships.slots)) X.ships = { active: -1, slots: [null, null, null, null, null, null], draft: null, tier: 0, best: 0 }; while (X.ships.slots.length < 6) X.ships.slots.push(null); return X.ships; },
  // --- the design as numbers ---
  stats() {
    const s = { hp: 0, off: 0, pow: 0, mob: 0, rol: 0, spd: 0 }; let cost = 0, helm = 0;
    for (const b of this.blocks.values()) { const p = SPARTS[b.p]; cost += p.cost; for (const k in s) s[k] += p[k] || 0; if (p.shape === 'cockpit' || p.shape === 'canopy') helm++; }
    return { s, cost, helm, n: this.blocks.size };
  },
  say(m) { this.msg = m; this.msgT = performance.now(); const e = document.getElementById('yd-msg'); if (e) { e.textContent = m; e.classList.add('on'); } },
  snap() { this.undo.push(this.serialize()); if (this.undo.length > 80) this.undo.shift(); this.redo = []; },
  serialize() { return Array.from(this.blocks, ([k, b]) => { const c = this.unkey(k); return [c[0], c[1], c[2], SPARTS[b.p].id, b.rx, b.ry, b.rz, b.col, b.m ? 1 : 0]; }); },
  load(arr) {
    this.blocks = new Map(); if (!Array.isArray(arr)) return;
    for (const r of arr) { if (!Array.isArray(r) || r.length < 9) continue; const [i, j, k, id, rx, ry, rz, c, m] = r, p = SPIDX[id]; if (p === undefined || !this.inGrid(i | 0, j | 0, k | 0)) continue; this.blocks.set(this.key(i | 0, j | 0, k | 0), { p, rx: rx & 3, ry: ry & 3, rz: rz & 3, col: Math.max(0, Math.min(SCOL.length - 1, c | 0)), m: !!m }); }
    this.items = null;
  },
  doUndo(back) { const from = back ? this.undo : this.redo, to = back ? this.redo : this.undo; if (!from.length) return this.say(back ? 'NOTHING TO UNDO' : 'NOTHING TO REDO'); to.push(this.serialize()); this.load(from.pop()); this.refresh(); },
  // --- editing ---
  place() {
    const [i, j, k] = this.cur, P = SPARTS[this.part], mi = YW - 1 - i, pair = this.mirror && mi !== i;
    const cells = [[i, false]]; if (pair) cells.push([mi, true]);
    let add = 0; for (const [x] of cells) { const old = this.blocks.get(this.key(x, j, k)); add += P.cost - (old ? SPARTS[old.p].cost : 0); }
    if (this.stats().cost + add > SBUDGET) { this.say('OVER BUDGET — REMOVE SOMETHING FIRST'); SFX.empty(); return; }
    this.snap();
    for (const [x, fl] of cells) this.blocks.set(this.key(x, j, k), { p: this.part, rx: this.rx, ry: this.ry, rz: this.rz, col: this.col, m: fl });
    this.items = null; SFX.place(); this.refresh();
  },
  remove() {
    const [i, j, k] = this.cur, mi = YW - 1 - i; if (!this.blocks.has(this.key(i, j, k)) && !(this.mirror && this.blocks.has(this.key(mi, j, k)))) { this.say('NOTHING HERE TO REMOVE'); return; }
    this.snap(); this.blocks.delete(this.key(i, j, k)); if (this.mirror) this.blocks.delete(this.key(mi, j, k)); this.items = null; this.refresh();
  },
  paint() {
    const [i, j, k] = this.cur, b = this.blocks.get(this.key(i, j, k)); if (!b) { this.say('NO BLOCK HERE TO PAINT'); return; } this.snap(); b.col = this.col;
    if (this.mirror) { const o = this.blocks.get(this.key(YW - 1 - i, j, k)); if (o) o.col = this.col; } this.items = null; this.refresh();
  },
  pickup() { const b = this.blocks.get(this.key(...this.cur)); if (!b) { this.say('NO BLOCK HERE TO COPY'); return; } this.part = b.p; this.cat = SPARTS[b.p].cat; this.rx = b.rx; this.ry = b.ry; this.rz = b.rz; this.col = b.col; this.say('COPIED ' + SPARTS[b.p].name.toUpperCase()); this.refresh(); },
  rotate(ax) { if (ax === 'y') this.ry = (this.ry + 1) & 3; else if (ax === 'x') this.rx = (this.rx + 1) & 3; else this.rz = (this.rz + 1) & 3; this.refresh(); },
  selPart(idx) { this.part = idx; this.cat = SPARTS[idx].cat; this.refresh(); },
  step(d) { const list = SPARTS.map((p, i) => i).filter(i => SPARTS[i].cat === this.cat), at = list.indexOf(this.part); this.part = list[(at + d + list.length) % list.length]; this.refresh(); },
  setCat(c) { this.cat = c; if (SPARTS[this.part].cat !== c) this.part = SPARTS.findIndex(p => p.cat === c); this.tab = 'blocks'; this.refresh(); },
  setView(v) { this.view = v; if (v !== 'persp') { this.zoom = 1; } this.refresh(); },
  clear() { if (!this.blocks.size) return; this.snap(); this.blocks.clear(); this.items = null; this.say('GRID CLEARED — CTRL+Z BRINGS IT BACK'); this.refresh(); },
  // --- blueprints ---
  saveSlot() {
    const st = this.stats(); if (!st.n) return this.say('NOTHING TO SAVE YET');
    if (!st.helm) { SFX.empty(); return this.say('A SHIP NEEDS A COMMAND DOME OR GLASS CANOPY'); }
    const sh = this.store(), nm = (this.name || ('SHIP ' + (this.slot + 1))).toUpperCase().slice(0, 16);
    sh.slots[this.slot] = { name: nm, cost: st.cost, blocks: this.serialize() }; sh.active = this.slot; this.dispKey = ''; saveGame(); SFX.rank(); this.say('BLUEPRINT "' + nm + '" SAVED — IT IS NOW ON THE HANGAR PAD'); this.refresh();
  },
  loadSlot() { const b = this.store().slots[this.slot]; if (!b) return this.say('THAT SLOT IS EMPTY'); this.snap(); this.load(b.blocks); this.name = b.name; this.say('LOADED "' + b.name + '"'); this.refresh(); },
  delSlot() { const sh = this.store(); if (!sh.slots[this.slot]) return this.say('THAT SLOT IS EMPTY'); sh.slots[this.slot] = null; if (sh.active === this.slot) sh.active = sh.slots.findIndex(Boolean); this.dispKey = ''; saveGame(); this.say('BLUEPRINT DELETED'); this.refresh(); },
  activate() { const sh = this.store(); if (!sh.slots[this.slot]) return this.say('SAVE A SHIP INTO THIS SLOT FIRST'); sh.active = this.slot; this.dispKey = ''; saveGame(); this.say('"' + sh.slots[this.slot].name + '" IS NOW ON THE HANGAR PAD'); this.refresh(); },
  // --- open / close ---
  near() { return mode === 'hub' && OW.gen === 3 && typeof SHIPYARD !== 'undefined' && Math.hypot(P.x - SHIPYARD.tx, P.z - SHIPYARD.tz) < 4.6 && Math.abs(P.y - (SHIPYARD.y0 + 1)) < 3; },
  open() {
    if (state !== 'play') return;
    state = 'builder'; mouse.l = mouse.r = false; try { document.exitPointerLock(); } catch (e) { }
    if (!this.dom) this.buildDom();
    const sh = this.store(); if (!this.blocks.size) this.load(sh.draft);
    this.undo = []; this.redo = []; el.yard.classList.add('on'); this.msg = ''; this.resize(); this.refresh(); this.say('PLACE BLOCKS ON THE GRID. HULL, ARMAMENT, DRIVES, SYSTEMS.');
    this.raf = requestAnimationFrame(t => this.frame(t));
  },
  close() {
    if (state !== 'builder') return;
    this.store().draft = this.serialize(); saveGame(); state = 'play'; el.yard.classList.remove('on');
    try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { }
  },
  // --- the screen ---
  buildDom() {
    this.dom = true; const y = el.yard;
    y.innerHTML = '<div class="yd-l"><div class="yd-box yd-prev"><canvas id="yd-pv" width="260" height="140"></canvas></div><div class="yd-tabs" id="yd-tabs"></div><div class="yd-cap" id="yd-cap"></div><div class="yd-cats" id="yd-cats"></div><div class="yd-box yd-list" id="yd-list"></div><div class="yd-info" id="yd-info"></div></div>'
      + '<div class="yd-c"><canvas id="yd-cv"></canvas><div class="yd-views" id="yd-views"></div><div class="yd-msg" id="yd-msg"></div></div>'
      + '<div class="yd-r"><div class="yd-box yd-cost" id="yd-cost"></div><div class="yd-box yd-hexb"><canvas id="yd-hex" width="300" height="250"></canvas></div><div class="yd-box yd-acts" id="yd-acts"></div></div>'
      + '<div class="yd-help" id="yd-help"></div>';
    this.cv = document.getElementById('yd-cv'); this.pv = document.getElementById('yd-pv'); this.hex = document.getElementById('yd-hex');
    y.addEventListener('click', e => { const t = e.target.closest('[data-a]'); if (t) this.act(t.dataset.a, t.dataset.v, e); });
    const cv = this.cv; let drag = null;
    cv.addEventListener('contextmenu', e => e.preventDefault());
    cv.addEventListener('mousedown', e => { drag = { x: e.clientX, y: e.clientY, b: e.button, moved: false, yaw: this.yaw, pitch: this.pitch }; });
    addEventListener('mousemove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true; if (drag.moved && this.view === 'persp') { this.yaw = drag.yaw - dx * .008; this.pitch = Math.max(-1.45, Math.min(1.45, drag.pitch + dy * .008)); } });
    addEventListener('mouseup', e => {
      if (!drag) return; const d = drag; drag = null; if (d.moved || state !== 'builder') return;
      const r = cv.getBoundingClientRect(), c = this.pickCell(e.clientX - r.left, e.clientY - r.top);
      if (d.b === 2) { if (c) { this.cur = c; this.remove(); } return; }
      if (c) { const same = c[0] === this.cur[0] && c[1] === this.cur[1] && c[2] === this.cur[2]; this.cur = c; if (same) this.place(); }
    });
    cv.addEventListener('wheel', e => { e.preventDefault(); this.zoom = Math.max(.5, Math.min(2.4, this.zoom * (e.deltaY > 0 ? .92 : 1.09))); }, { passive: false });
    addEventListener('resize', () => { if (state === 'builder') this.resize(); });
    document.getElementById('yd-list').addEventListener('mouseover', e => { const t = e.target.closest('[data-v]'); if (t && t.dataset.a === 'part') { this.hover = +t.dataset.v; this.info(); } });
    document.getElementById('yd-list').addEventListener('mouseleave', () => { this.hover = -1; this.info(); });
  },
  resize() { const c = this.cv, r = c.parentElement.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 1.5); c.width = Math.max(200, r.width * d | 0); c.height = Math.max(200, r.height * d | 0); this.dpr = d; },
  act(a, v, e) {
    if (a === 'cat') this.setCat(v); else if (a === 'part') this.selPart(+v); else if (a === 'tab') { this.tab = v; this.refresh(); }
    else if (a === 'col') { this.col = +v; this.refresh(); } else if (a === 'view') this.setView(v);
    else if (a === 'place') this.place(); else if (a === 'remove') this.remove(); else if (a === 'paint') this.paint(); else if (a === 'rot') this.rotate(v);
    else if (a === 'mirror') { this.mirror = !this.mirror; this.refresh(); } else if (a === 'undo') this.doUndo(true); else if (a === 'redo') this.doUndo(false); else if (a === 'clear') this.clear();
    else if (a === 'exit') this.close(); else if (a === 'slot') { this.slot = +v; const b = this.store().slots[this.slot]; if (b) this.name = b.name; this.refresh(); }
    else if (a === 'save') this.saveSlot(); else if (a === 'load') this.loadSlot(); else if (a === 'del') this.delSlot(); else if (a === 'show') this.activate();
  },
  info() {
    const i = this.hover >= 0 && this.hover !== undefined ? this.hover : this.part, p = SPARTS[i], bits = [];
    for (const [k, nm] of [['hp', 'HP'], ['off', 'OFFENSE'], ['pow', 'POWER'], ['mob', 'MOBILITY'], ['rol', 'ROLLING'], ['spd', 'SPEED']]) if (p[k]) bits.push('<span>' + nm + ' <b>' + (p[k] > 0 ? '+' : '') + p[k] + '</b></span>');
    document.getElementById('yd-info').innerHTML = '<div class="yd-pn">' + p.name.toUpperCase() + '<em>' + p.cost + '</em></div><div class="yd-st">' + bits.join('') + '</div><div class="yd-tx">' + p.info + '</div>';
  },
  thumb(i) {
    if (this.thumbs[i]) return this.thumbs[i]; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const V = shipView({ yaw: -.6, pitch: .5, scale: 34, dist: 14, ortho: false }, 64, 64); shipDraw(x, V, [{ x: 0, y: 0, z: 0, col: [226, 230, 236], mesh: ShipMesh.mesh(SPARTS[i].shape, 0, 0, 0, false) }]);
    return this.thumbs[i] = c.toDataURL();
  },
  refresh() {
    if (!this.dom) return;
    const T = [['blocks', 'BLOCKS'], ['colors', 'COLOURS'], ['plans', 'BLUEPRINTS']];
    document.getElementById('yd-tabs').innerHTML = T.map(([k, n]) => '<b data-a="tab" data-v="' + k + '" class="' + (this.tab === k ? 'on' : '') + '">' + n + '</b>').join('');
    const cap = document.getElementById('yd-cap'), cats = document.getElementById('yd-cats'), list = document.getElementById('yd-list');
    if (this.tab === 'blocks') {
      cap.textContent = SPD.cats.find(c => c.id === this.cat).name; cats.style.display = '';
      cats.innerHTML = SPD.cats.map(c => '<b data-a="cat" data-v="' + c.id + '" class="' + (this.cat === c.id ? 'on' : '') + '" title="' + c.name + '">' + c.icon + '</b>').join('');
      list.className = 'yd-box yd-list'; list.innerHTML = SPARTS.map((p, i) => p.cat !== this.cat ? '' : '<div class="yd-it' + (i === this.part ? ' sel' : '') + '" data-a="part" data-v="' + i + '"><img src="' + this.thumb(i) + '"><i>' + p.cost + '</i></div>').join('');
    } else if (this.tab === 'colors') {
      cap.textContent = 'PAINT'; cats.style.display = 'none'; list.className = 'yd-box yd-list yd-pal';
      list.innerHTML = SCOL.map((c, i) => '<div class="yd-sw' + (i === this.col ? ' sel' : '') + '" data-a="col" data-v="' + i + '" style="background:rgb(' + c + ')"></div>').join('') + '<div class="yd-wide"><button data-a="paint">PAINT BLOCK AT CURSOR  [P]</button><span>New blocks use the colour you pick here.</span></div>';
    } else {
      cap.textContent = 'BLUEPRINTS'; cats.style.display = 'none'; list.className = 'yd-box yd-list yd-plans'; const sh = this.store();
      list.innerHTML = sh.slots.map((b, i) => '<div class="yd-slot' + (i === this.slot ? ' sel' : '') + '" data-a="slot" data-v="' + i + '"><b>' + (i + 1) + '</b><span>' + (b ? esc(b.name) : 'EMPTY') + '</span><em>' + (b ? b.blocks.length + ' blocks · ' + b.cost : '') + '</em>' + (sh.active === i ? '<u>ON PAD</u>' : '') + '</div>').join('')
        + '<div class="yd-wide"><input id="yd-nm" maxlength="16" placeholder="SHIP NAME" value="' + esc(this.name || '') + '" oninput="Yard.name=this.value"><div class="yd-row"><button data-a="save">SAVE</button><button data-a="load">LOAD</button><button data-a="show">SHOW IN HANGAR</button><button data-a="del">DELETE</button></div></div>';
    }
    this.info();
    const st = this.stats(), cost = st.cost; this.curStats = st;
    document.getElementById('yd-cost').innerHTML = '<span>Cost · ' + st.n + ' blocks</span><b class="' + (cost > SBUDGET * .95 ? 'hot' : '') + '">' + cost + ' / ' + SBUDGET + '</b><i style="width:' + Math.min(100, cost / SBUDGET * 100) + '%"></i>';
    document.getElementById('yd-views').innerHTML = YVIEWS.map(v => '<b data-a="view" data-v="' + v + '" class="' + (this.view === v ? 'on' : '') + '">' + YVNAME[v] + '</b>').join('');
    document.getElementById('yd-acts').innerHTML = '<button data-a="place">PLACE</button><button data-a="remove">REMOVE</button><button data-a="rot" data-v="y">TURN</button><button data-a="rot" data-v="x">PITCH</button><button data-a="rot" data-v="z">ROLL</button><button data-a="mirror" class="' + (this.mirror ? 'on' : '') + '">MIRROR ' + (this.mirror ? 'ON' : 'OFF') + '</button><button data-a="undo">UNDO</button><button data-a="redo">REDO</button><button data-a="clear">CLEAR</button><button data-a="exit" class="ex">EXIT</button>';
    document.getElementById('yd-help').innerHTML = '<span>WASD / ARROWS</span> move · <span>SPACE / C</span> depth or up/down · <span>ENTER</span> place · <span>X</span> remove · <span>Q E R T</span> turn the part · <span>[ ]</span> part · <span>1-4</span> group · <span>V</span> view · <span>M</span> mirror · <span>P</span> paint · <span>I</span> copy · <span>CTRL+Z</span> undo · <span>ESC</span> exit<br><span>PAD:</span> stick move · R-stick orbit · LB/RB depth · LT/RT part · A place · B remove · X turn · Y group · BACK undo · START exit';
  },
  // --- cursor movement follows whatever view you are in ---
  axis(v) { const a = [Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2])], k = a[0] >= a[1] && a[0] >= a[2] ? 0 : a[1] >= a[2] ? 1 : 2, o = [0, 0, 0]; o[k] = v[k] < 0 ? -1 : 1; return o; },
  move(dir) {                                                                      // dir: 'l','r','u','d','n','f'  (screen left/right/up/down, near/far)
    const V = this.V || shipView(this.camNow(), 100, 100); let d;
    if (V.ortho) d = { r: V.r1, l: V.r1.map(a => -a), u: V.r2, d: V.r2.map(a => -a), n: V.r3, f: V.r3.map(a => -a) }[dir];
    else { const r = this.axis([V.r1[0], 0, V.r1[2]]), f = this.axis([-V.r3[0], 0, -V.r3[2]]); d = { r, l: r.map(a => -a), u: f, d: f.map(a => -a), n: [0, 1, 0], f: [0, -1, 0] }[dir]; }
    d = this.axis(d); this.cur = [Math.max(0, Math.min(YW - 1, this.cur[0] + d[0])), Math.max(0, Math.min(YH - 1, this.cur[1] + d[1])), Math.max(0, Math.min(YDP - 1, this.cur[2] + d[2]))];
  },
  camNow() { const pre = YVPRE[this.view], c = shipFit(this.view, this.cv ? this.cv.width : 600, this.cv ? this.cv.height : 600, this.zoom); c.yaw = pre ? pre[0] : this.yaw; c.pitch = pre ? pre[1] : this.pitch; return c; },
  cell(i, j, k) { return [i - (YW - 1) / 2, j - (YH - 1) / 2, k - (YDP - 1) / 2]; },
  pickCell(mx, my) {
    const V = this.V; if (!V) return null; const d = this.dpr || 1; mx *= d; my *= d; let best = null, bd = 1e9, ax;
    if (V.ortho) { const w = this.axis(V.r3); ax = w[0] ? 0 : w[1] ? 1 : 2; } else ax = 1;
    const lim = (V.S * .8) ** 2;
    for (let i = 0; i < YW; i++) for (let j = 0; j < YH; j++) for (let k = 0; k < YDP; k++) { if ([i, j, k][ax] !== this.cur[ax]) continue; const c = this.cell(i, j, k), p = V.proj(c[0], c[1], c[2]), q = (p[0] - mx) ** 2 + (p[1] - my) ** 2; if (q < bd) { bd = q; best = [i, j, k]; } }
    return bd < lim * (V.ortho ? 1 : 2.4) ? best : null;
  },
  keydown(e) {
    const c = e.code; if (e.ctrlKey || e.metaKey) { if (c === 'KeyZ') { this.doUndo(!e.shiftKey); e.preventDefault(); } else if (c === 'KeyY') this.doUndo(false); return; }
    if (c === 'Escape') { this.close(); return; }
    const mv = { KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', Space: 'n', KeyC: 'f', PageUp: 'n', PageDown: 'f' }[c];
    if (mv) { this.move(mv); return; }
    if (c === 'Enter' || c === 'NumpadEnter' || c === 'KeyF') this.place();
    else if (c === 'KeyX' || c === 'Delete' || c === 'Backspace') this.remove();
    else if (c === 'KeyQ') { this.ry = (this.ry + 3) & 3; this.refresh(); } else if (c === 'KeyE') this.rotate('y'); else if (c === 'KeyR') this.rotate('x'); else if (c === 'KeyT') this.rotate('z');
    else if (c === 'BracketLeft' || c === 'Comma') this.step(-1); else if (c === 'BracketRight' || c === 'Period') this.step(1);
    else if (c.startsWith('Digit')) { const n = +c.slice(5); if (n >= 1 && n <= 4) this.setCat(SPD.cats[n - 1].id); }
    else if (c === 'KeyV') this.setView(YVIEWS[(YVIEWS.indexOf(this.view) + 1) % 4]);
    else if (c === 'KeyM') { this.mirror = !this.mirror; this.refresh(); } else if (c === 'KeyP') this.paint(); else if (c === 'KeyI') this.pickup();
    else if (c === 'KeyB') { this.tab = this.tab === 'blocks' ? 'colors' : this.tab === 'colors' ? 'plans' : 'blocks'; this.refresh(); }
    else if (c === 'Minus') this.pitch = Math.max(-1.45, this.pitch - .08); else if (c === 'Equal') this.pitch = Math.min(1.45, this.pitch + .08);
  },
  itemsNow() {
    if (this.items) return this.items; const o = [];
    for (const [k, b] of this.blocks) { const [i, j, kk] = this.unkey(k), c = this.cell(i, j, kk); o.push({ x: c[0], y: c[1], z: c[2], col: SCOL[b.col], mesh: shipPartMesh(b), i, j, k: kk }); }
    return this.items = o;
  },
  frame(t) {
    if (state !== 'builder') return; this.raf = requestAnimationFrame(t2 => this.frame(t2));
    const cv = this.cv, ctx = cv.getContext('2d'), W = cv.width, H = cv.height;
    if (this.view === 'persp' && !this.dragging) { /* free orbit stays where you left it */ }
    const cam = this.camNow(), V = this.V = shipView(cam, W, H);
    ctx.clearRect(0, 0, W, H); shipGrid(ctx, V);
    const items = this.itemsNow(), P = SPARTS[this.part], [ci, cj, ck] = this.cur, cc = this.cell(ci, cj, ck);
    const ghosts = [{ x: cc[0], y: cc[1], z: cc[2], col: SCOL[this.col], mesh: ShipMesh.mesh(P.shape, this.rx, this.ry, this.rz, false) }];
    if (this.mirror && YW - 1 - ci !== ci) { const m = this.cell(YW - 1 - ci, cj, ck); ghosts.push({ x: m[0], y: m[1], z: m[2], col: SCOL[this.col], mesh: ShipMesh.mesh(P.shape, this.rx, this.ry, this.rz, true) }); }
    shipDraw(ctx, V, items); shipDraw(ctx, V, ghosts, .55 + .2 * Math.sin(t / 220));
    const hx = YW / 2, hy = YH / 2, hz = YDP / 2, x0 = cc[0] - .5, x1 = cc[0] + .5, y0 = cc[1] - .5, y1 = cc[1] + .5, z0 = cc[2] - .5, z1 = cc[2] + .5;
    ctx.lineWidth = 1;
    shipBoxPoly(ctx, V, -hx, y0, z0, hx, y1, z1, 'rgba(255,160,50,.035)', 'rgba(255,190,90,.38)'); shipBoxPoly(ctx, V, x0, -hy, z0, x1, hy, z1, 'rgba(255,160,50,.035)', 'rgba(255,190,90,.38)'); shipBoxPoly(ctx, V, x0, y0, -hz, x1, y1, hz, 'rgba(255,160,50,.035)', 'rgba(255,190,90,.38)');
    ctx.lineWidth = 2; shipBoxPoly(ctx, V, x0, y0, z0, x1, y1, z1, 'rgba(255,220,90,.16)', 'rgba(255,225,100,.95)');
    if (this.mirror && YW - 1 - ci !== ci) { const m = this.cell(YW - 1 - ci, cj, ck); shipBoxPoly(ctx, V, m[0] - .5, y0, z0, m[0] + .5, y1, z1, null, 'rgba(255,225,100,.45)'); }
    ctx.lineWidth = 1; ctx.fillStyle = '#ffe96a'; const cp = V.proj(cc[0], cc[1], cc[2]); ctx.beginPath(); ctx.arc(cp[0], cp[1], 4, 0, 7); ctx.fill();
    ctx.font = 'bold ' + (13 * (this.dpr || 1)) + 'px Arial Black, sans-serif'; ctx.fillStyle = 'rgba(160,220,255,.9)'; ctx.fillText('X ' + (ci + 1) + '   Y ' + (cj + 1) + '   Z ' + (ck + 1) + '     ' + this.view.toUpperCase() + (this.mirror ? '   ◧ MIRROR' : ''), 14, H - 14);
    if (t - this.msgT > 4200) { const m = document.getElementById('yd-msg'); if (m) m.classList.remove('on'); }
    this.drawPreview(t); this.drawHex();
  },
  drawPreview(t) {
    const c = this.pv, x = c.getContext('2d'), P = SPARTS[this.hover >= 0 && this.hover !== undefined ? this.hover : this.part], idx = this.hover >= 0 && this.hover !== undefined ? this.hover : this.part;
    x.clearRect(0, 0, c.width, c.height); const V = shipView({ yaw: t / 1400, pitch: .5, scale: 74, dist: 14, ortho: false }, c.width, c.height);
    shipDraw(x, V, [{ x: 0, y: 0, z: 0, col: SCOL[this.col], mesh: ShipMesh.mesh(SPARTS[idx].shape, idx === this.part ? this.rx : 0, idx === this.part ? this.ry : 0, idx === this.part ? this.rz : 0, false) }]);
  },
  drawHex() {
    const c = this.hex, x = c.getContext('2d'), W = c.width, H = c.height, st = this.curStats || this.stats(), cx = W / 2, cy = H / 2 + 4, R = 76;
    x.clearRect(0, 0, W, H); const ang = i => -Math.PI / 2 + i * Math.PI / 3, pt = (i, k) => [cx + Math.cos(ang(i)) * R * k, cy + Math.sin(ang(i)) * R * k];
    for (const k of [1, .66, .33]) { x.beginPath(); for (let i = 0; i < 6; i++) { const p = pt(i, k); i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); } x.closePath(); x.strokeStyle = 'rgba(110,190,255,' + (k === 1 ? .9 : .28) + ')'; x.lineWidth = k === 1 ? 2 : 1; x.stroke(); }
    x.beginPath(); for (let i = 0; i < 6; i++) { const v = Math.max(0, Math.min(1, st.s[SSTAT[i][0]] / SNORM[SSTAT[i][0]])), p = pt(i, Math.max(.02, v)); i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]); } x.closePath(); x.fillStyle = 'rgba(90,200,255,.32)'; x.fill(); x.strokeStyle = '#7ae0ff'; x.lineWidth = 2; x.stroke();
    x.textAlign = 'center'; for (let i = 0; i < 6; i++) { const [k, nm, col] = SSTAT[i], p = pt(i, 1.36), v = st.s[k]; x.fillStyle = col; x.font = 'bold 12px Arial Black, sans-serif'; x.fillText(nm, p[0], p[1] - 8); x.fillStyle = v < 0 ? '#ff6a6a' : '#fff'; x.font = 'bold 19px Arial Black, sans-serif'; x.fillText(v, p[0], p[1] + 14); }
    if (st.n && !st.helm) { x.fillStyle = '#ffb04a'; x.font = 'bold 11px Arial Black, sans-serif'; x.fillText('NEEDS A COMMAND DOME OR CANOPY', cx, H - 2); }
  }
};

// ---- the ship on the hangar pad: drawn from the very same meshes the builder uses ----
function shipBlueprint() { const sh = Yard.store(); return sh.slots[sh.active] || null; }
function shipDisplayItems() {
  const sh = Yard.store(), key = sh.active + '|' + (sh.slots[sh.active] ? sh.slots[sh.active].blocks.length : 0) + '|' + Yard.dispKey; if (Yard.dispCache && Yard.dispCache.key === key) return Yard.dispCache.items;
  const b = sh.slots[sh.active], items = b ? shipItemsFrom(b.blocks) : [];
  Yard.dispCache = { key, items }; return items;
}
function shipItemsFrom(blocks) {                                                     // blueprint rows -> [{x,y,z (cell centre), mesh, col, p}]
  const items = [];
  for (const r of blocks) { const p = SPIDX[r[3]]; if (p === undefined) continue; items.push({ x: r[0] - (YW - 1) / 2, y: r[1] - (YH - 1) / 2, z: r[2] - (YDP - 1) / 2, mesh: ShipMesh.mesh(SPARTS[p].shape, r[4], r[5], r[6], !!r[8]), col: SCOL[Math.max(0, Math.min(SCOL.length - 1, r[7] | 0))], p }); }
  return items;
}
function drawShipDisplay(t) {
  if (typeof SHIPYARD === 'undefined' || camY > SHIPYARD.y0 + 40 || Math.abs(camX - SHIPYARD.px) > 70) return;
  const items = shipDisplayItems(); if (!items.length) return;
  const R = rotY(t * .3), ox = SHIPYARD.px, oy = SHIPYARD.y0 + 4 + YH / 2 + .15 * Math.sin(t * 1.2), oz = SHIPYARD.pz;
  const T = (x, y, z) => [R[0] * x + R[1] * y + R[2] * z + ox, R[3] * x + R[4] * y + R[5] * z + oy, R[6] * x + R[7] * y + R[8] * z + oz];
  for (const it of items) for (const f of it.mesh.faces) {
    const n = f.n, nx = R[0] * n[0] + R[1] * n[1] + R[2] * n[2], ny = R[3] * n[0] + R[4] * n[1] + R[5] * n[2], nz = R[6] * n[0] + R[7] * n[1] + R[8] * n[2];
    const c = f.t === 'p' ? it.col : STAGC[f.t], em = f.t === 'e' || f.t === 'm';
    pushPoly(f.v.map(v => T(it.x + v[0], it.y + v[1], it.z + v[2])), nx, ny, nz, c[0] / 255 * 1.3, c[1] / 255 * 1.3, c[2] / 255 * 1.3, em, 0);
  }
}
