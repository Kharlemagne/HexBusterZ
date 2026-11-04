// ============================================================
//  SORTIE — the crisis-alert game mode.  Your own ship (the one from the builder) flies a corridor in 3D: bullet hell on rails.
//  ship space: x right, y up, z forward is NEGATIVE (the ship's nose points to -z, like in the builder); the ship sits at z = 0, the camera behind it at z = +10.
//  Everything is drawn on a 2D canvas with the builder's painter's-algorithm renderer; the level comes from genSortie() (76-sortie-gen.js).
// ============================================================
const SR = { on: false, phase: 'off', pause: false, god: false, auto: false, keys: {}, T: 0 };
const SRK = SR.keys;
const SR_STARTER = (() => {                                                      // the ship you fly if you have not saved one yet
  const rows = [], put = (i, j, k, id, rx, ry, rz, c, m) => rows.push([i, j, k, id, rx || 0, ry || 0, rz || 0, c || 0, m ? 1 : 0]), both = (i, j, k, id, rx, ry, rz, c) => { put(i, j, k, id, rx, ry, rz, c, 0); put(10 - i, j, k, id, rx, ry, rz, c, 1); };
  for (let k = 3; k <= 11; k++) put(5, 2, k, 'plate', 0, 0, 0, k % 4 === 0 ? 27 : 0);
  put(5, 2, 2, 'slope', 0, 0, 0, 0); put(5, 2, 1, 'nose', 0, 0, 0, 27); put(5, 3, 6, 'helm', 0, 0, 0, 0); put(5, 3, 9, 'core', 0, 0, 0, 0); put(5, 3, 11, 'tail', 0, 0, 0, 27);
  both(4, 2, 6, 'plate', 0, 0, 0, 0); both(3, 2, 7, 'blade', 0, 0, 0, 27); both(2, 2, 8, 'blade', 0, 0, 0, 27); both(4, 2, 3, 'bolt', 0, 0, 0, 0); both(4, 2, 12, 'ion', 0, 0, 0, 0); put(5, 2, 12, 'burn', 0, 0, 0, 0);
  return rows;
})();
const SRC = { red: 24, yel: 25, pur: 30, mag: 31, cyn: 28, gry: 4, dk: 6, wht: 0 };
function srItems(rows, grid) {                                                   // [x,y,z,partId,rx,ry,rz,col,m] -> render items (grid: rows are blueprint cells, else already centred)
  const o = []; for (const r of rows) { const p = SPIDX[r[3]]; if (p === undefined) continue; o.push({ x: grid ? r[0] - (YW - 1) / 2 : r[0], y: grid ? r[1] - (YH - 1) / 2 : r[1], z: grid ? r[2] - (YDP - 1) / 2 : r[2], mesh: ShipMesh.mesh(SPARTS[p].shape, r[4], r[5], r[6], !!r[8]), col: SCOL[Math.max(0, Math.min(SCOL.length - 1, r[7] | 0))], p }); } return o;
}
const SR_MODELS = {};
function srModel(kind, arch) {
  const key = kind + (arch === undefined ? '' : arch); if (SR_MODELS[key]) return SR_MODELS[key];
  const R = [], put = (x, y, z, id, rx, ry, rz, c, m) => R.push([x, y, z, id, rx || 0, ry || 0, rz || 0, c === undefined ? 24 : c, m ? 1 : 0]), both = (x, y, z, id, rx, ry, rz, c) => { put(x, y, z, id, rx, ry, rz, c, 0); put(-x, y, z, id, rx, ry, rz, c, 1); };
  if (kind === 'drone') { put(0, 0, 0, 'plate', 0, 0, 0, SRC.red); put(0, 0, -1, 'nose', 0, 0, 0, SRC.mag); both(1, 0, 0, 'blade', 0, 0, 0, SRC.red); put(0, 0, 1, 'ion', 0, 0, 0, SRC.dk); }
  else if (kind === 'wasp') { put(0, 0, 0, 'plate', 0, 0, 0, SRC.pur); put(0, 0, -1, 'spike', 3, 0, 0, SRC.pur); both(1, 0, 0, 'blade', 0, 0, 0, SRC.mag); both(2, 0, 1, 'blade', 0, 0, 0, SRC.mag); put(0, 0, 1, 'twinion', 0, 0, 0, SRC.dk); put(0, 1, 0, 'bubble', 0, 0, 0, SRC.cyn); }
  else if (kind === 'gunship') { for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) put(x, 0, z, 'plate', 0, 0, 0, (x + z) & 1 ? SRC.red : SRC.gry); put(0, 0, -2, 'twin', 0, 0, 0, SRC.dk); put(0, 1, 0, 'turret', 0, 0, 0, SRC.red); both(1, 0, 2, 'burn', 0, 0, 0, SRC.dk); both(2, 0, 0, 'blade', 0, 0, 0, SRC.mag); put(0, 1, 1, 'tail', 0, 0, 0, SRC.mag); put(0, -1, 0, 'ward', 2, 0, 0, SRC.mag); }
  else if (kind === 'mine') { put(0, 0, 0, 'bubble', 0, 0, 0, SRC.red); put(0, 0, 0, 'bubble', 2, 0, 0, SRC.red); put(0, 1, 0, 'spike', 0, 0, 0, SRC.yel); put(0, -1, 0, 'spike', 2, 0, 0, SRC.yel); put(1, 0, 0, 'spike', 0, 0, 3, SRC.yel); put(-1, 0, 0, 'spike', 0, 0, 1, SRC.yel); put(0, 0, 1, 'spike', 1, 0, 0, SRC.yel); put(0, 0, -1, 'spike', 3, 0, 0, SRC.yel); }
  else if (kind === 'boss') {
    if (arch === 0) { for (let z = -3; z <= 3; z++) for (let x = -1; x <= 1; x++) put(x, 0, z, 'plate', 0, 0, 0, (x + z) & 1 ? SRC.gry : SRC.dk); put(0, 0, -4, 'spike', 3, 0, 0, SRC.red); both(2, 0, -3, 'twin', 0, 0, 0, SRC.dk); both(2, 0, -1, 'rocket', 0, 0, 0, SRC.dk); both(2, 0, 1, 'plate', 0, 0, 0, SRC.red); both(3, 0, 1, 'blade', 0, 0, 0, SRC.red); both(4, 0, 2, 'blade', 0, 0, 0, SRC.red); put(0, 1, 0, 'core', 0, 0, 0, SRC.red); put(0, 1, -2, 'helm', 0, 0, 0, SRC.mag); put(0, 2, 2, 'tail', 0, 0, 0, SRC.red); for (let x = -1; x <= 1; x++) put(x, 0, 4, 'burn', 0, 0, 0, SRC.dk); put(0, -1, 0, 'ward', 2, 0, 0, SRC.mag); }
    else if (arch === 1) { for (let z = -2; z <= 3; z++) put(0, 0, z, 'pillar', 1, 0, 0, SRC.pur); put(0, 0, -4, 'spike', 3, 0, 0, SRC.mag); put(0, 0, -3, 'nose', 0, 0, 0, SRC.pur); for (let i = 1; i <= 4; i++) { both(i, 0, 1 + i * .5 | 0, 'blade', 0, 0, 0, SRC.mag); both(i, 0, 1 + i * .5 | 0 + 1, 'wing', 0, 0, 0, SRC.pur); } both(1, 0, -2, 'lance', 0, 0, 0, SRC.dk); both(2, 1, 0, 'turret', 0, 0, 0, SRC.mag); put(0, 1, 0, 'bubble', 0, 0, 0, SRC.cyn); put(0, 1, 2, 'core', 0, 0, 0, SRC.mag); both(1, 0, 4, 'twinion', 0, 0, 0, SRC.dk); put(0, 2, 3, 'tail', 0, 0, 0, SRC.pur); }
    else { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, x = Math.round(Math.cos(a) * 3), y = Math.round(Math.sin(a) * 3); put(x, y, 0, 'pillar', 1, 0, 0, i & 1 ? SRC.cyn : SRC.gry); put(Math.round(Math.cos(a) * 2), Math.round(Math.sin(a) * 2), 0, 'plate', 0, 0, 0, SRC.dk); put(x, y, -1, i & 1 ? 'ward' : 'turret', 0, 0, 0, SRC.mag); } put(0, 0, 0, 'core', 0, 0, 0, SRC.mag); put(0, 0, -1, 'bubble', 3, 0, 0, SRC.cyn); put(0, 0, 1, 'cell', 0, 0, 0, SRC.pur); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + .78; put(Math.round(Math.cos(a) * 1), Math.round(Math.sin(a) * 1), 1, 'burn', 0, 0, 0, SRC.dk); } }
  }
  return SR_MODELS[key] = srItems(R, false);
}
const SRSCALE = { drone: .24, wasp: .26, gunship: .34, mine: .3 };

// ---------------- the ship you fly ----------------
function srBuildShip(rows) {
  rows = rows && rows.length ? rows : SR_STARTER; const items = srItems(rows, true), st = { hp: 0, off: 0, pow: 0, mob: 0, rol: 0, spd: 0 };
  let lo = [9, 9, 9], hi = [-9, -9, -9]; const guns = [], drives = [];
  for (const it of items) {
    const P = SPARTS[it.p]; for (const k in st) st[k] += P[k] || 0;
    for (let a = 0; a < 3; a++) { const v = [it.x, it.y, it.z][a]; lo[a] = Math.min(lo[a], v - .5); hi[a] = Math.max(hi[a], v + .5); }
    if (P.cat === 'arms') guns.push({ kind: P.id, x: it.x, y: it.y, z: it.z });
    if (P.cat === 'drive' && P.shape !== 'gyro') drives.push({ x: it.x, y: it.y, z: it.z });
  }
  const cen = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2], ext = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]], s = Math.min(.34, 4 / ext[0], 5 / ext[2], 2.8 / ext[1]);
  for (const it of items) { it.x -= cen[0]; it.y -= cen[1]; it.z -= cen[2]; }
  for (const g of guns) { g.x -= cen[0]; g.y -= cen[1]; g.z -= cen[2]; } for (const d of drives) { d.x -= cen[0]; d.y -= cen[1]; d.z -= cen[2]; }
  if (!guns.length) guns.push({ kind: 'bolt', x: 0, y: 0, z: -ext[2] / 2 });
  guns.sort((a, b) => (SPARTS[SPIDX[b.kind]].off || 0) - (SPARTS[SPIDX[a.kind]].off || 0)); guns.length = Math.min(guns.length, 12);
  return { items, st, guns, drives, s, len: ext[2] * s, wid: ext[0] * s };
}
const SRG = { bolt: { rate: .13, dmg: .9, sp: 70, r: .2 }, twin: { rate: .15, dmg: .72, sp: 70, r: .18, two: 1 }, turret: { rate: .2, dmg: .8, sp: 60, r: .2, home: 1 }, rocket: { rate: .55, dmg: 3.2, sp: 46, r: .32, splash: 1.7 }, lance: { rate: .7, dmg: 7, sp: 95, r: .25, pierce: 1 } };

// ---------------- start / stop ----------------
const Sortie = {
  near() { return mode === 'hub' && OW.gen === 3 && typeof CRISIS !== 'undefined' && Math.hypot(P.x - CRISIS.tx, P.z - CRISIS.tz) < 4.6 && Math.abs(P.y - (CRISIS.y0 + 1)) < 3; },
  tier() { return Math.max(0, Yard.store().tier | 0); },
  start(seed, tier) {
    if (state !== 'play' && !SR.on) return;
    if (!SR.cv) { SR.cv = el.srt; SR.cx = SR.cv.getContext('2d'); this.bind(); }
    state = 'sortie'; mouse.l = mouse.r = false; try { document.exitPointerLock(); } catch (e) { }
    tier = tier === undefined ? this.tier() : tier; seed = seed || ((Math.random() * 4294967295) >>> 0) || 1; this.begin(seed, tier);
    el.srt.classList.add('on'); SR.on = true; this.resize(); try { tone(220, .5, 'sawtooth', .12, 120); tone(330, .5, 'sawtooth', .1, 150, .25); } catch (e) { }
    SR.last = performance.now(); SR.acc = 0; SR.raf = requestAnimationFrame(t => this.loop(t));
  },
  begin(seed, tier) {
    const bp = shipBlueprint(), sh = srBuildShip(bp && bp.blocks), st = sh.st, lvl = genSortie(seed, tier);
    const hullMax = Math.max(4, Math.min(20, Math.round(st.hp / 16))), bombMax = Math.max(1, Math.min(4, 1 + Math.floor(st.pow / 25)));
    Object.assign(SR, {
      lvl, seed, tier, theme: SRT[lvl.theme], phase: 'intro', pt: 0, pause: false, T: 0, D: 0, seg: -1, segT: 0, evI: 0, rail: lvl.speed, curveA: 1, curveT: 1, roll: 0, rollT: 0, ph1: seed % 7, ph2: seed % 13, ph3: seed % 5,
      sh, ship: { x: 0, y: -.5, vx: 0, vy: 0, hullMax, hull: hullMax, inv: 0, bombMax, bombs: bombMax, meter: 0, spd: Math.max(SR_MINSPD, Math.min(12, SR_MINSPD + st.spd / 10)), hitR: .16 + .07 * (1 - Math.min(1, st.mob / 50)), dmgM: 1 + st.off / 120, invT: 1.6 + st.rol / 40, cd: sh.guns.map(() => 0), z: 0, flash: 0 },
      enemies: [], eb: [], pb: [], obs: [], rings: [], fx: [], waves: [], score: 0, kills: 0, grazes: 0, hits: 0, shake: 0, flash: 0, banner: null, boss: null, auto: SR.autoPilot || false, autoFire: true, id: 1, time: 0,
      stars: Array.from({ length: 170 }, () => [(Math.random() * 2 - 1) * 44, (Math.random() * 2 - 1) * 26, -Math.random() * 150 + 8]), result: null, bossDead: false
    });
    SR.cam = { x: 0, y: 2 };
    this.setBanner('CRISIS ALERT', lvl.name + ' · HELLGATE BREACH DETECTED', 3.2, [255, 70, 60]);
  },
  setBanner(txt, sub, dur, col) { SR.banner = { txt, sub: sub || '', t: 0, dur: dur || 2.4, col: col || SR.theme.a }; },
  exit(won) {
    if (!SR.on) return; SR.on = false; SR.phase = 'off'; el.srt.classList.remove('on'); cancelAnimationFrame(SR.raf);
    state = 'play'; P.x = SHIPYARD.px; P.z = SHIPYARD.pz - 8; P.y = SHIPYARD.y0 + 1.01; P.vx = P.vy = P.vz = 0; P.yaw = Math.PI; P.pitch = .1; P.hp = P.maxHp || 100; P.alive = true;
    try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { }
    feed(won ? 'BACK IN THE HANGAR — SORTIE CLEARED' : 'BACK IN THE HANGAR', won ? '#5af07a' : '#ff8a3a');
  },
  bind() {
    const cv = SR.cv;
    addEventListener('keydown', e => { if (SR.on) SRK[e.code] = true; }); addEventListener('keyup', e => { SRK[e.code] = false; });
    addEventListener('blur', () => { for (const k in SRK) SRK[k] = false; });
    cv.addEventListener('mousedown', e => { if (!SR.on) return; if (SR.phase === 'result') { this.keydown({ code: 'Enter' }); return; } if (e.button === 2) this.bomb(); else SRK.fire = true; });
    addEventListener('mouseup', () => { SRK.fire = false; }); addEventListener('resize', () => { if (SR.on) this.resize(); });
  },
  resize() { const cv = SR.cv, d = Math.min(devicePixelRatio || 1, 1.25); cv.width = Math.max(320, innerWidth * d | 0); cv.height = Math.max(200, innerHeight * d | 0); },
  keydown(e) {
    const c = e.code;
    if (SR.phase === 'result') { if (c === 'Enter' || c === 'Space') this.exit(SR.result && SR.result.won); else if (c === 'KeyR') { SR.pause = false; this.begin(SR.seed, SR.tier); } return; }
    if (c === 'Escape' || c === 'KeyP') { SR.pause = !SR.pause; return; }
    if (SR.pause) { if (c === 'KeyQ') this.exit(false); return; }
    if (c === 'KeyX' || c === 'KeyK') this.bomb(); else if (c === 'KeyF') { SR.autoFire = !SR.autoFire; this.setBanner(SR.autoFire ? 'AUTO-FIRE ON' : 'AUTO-FIRE OFF', 'HOLD SPACE OR CLICK TO FIRE', 1.2); }
  },
  loop(t) {
    if (!SR.on) return; SR.raf = requestAnimationFrame(t2 => this.loop(t2));
    const dt = Math.min(.1, (t - SR.last) / 1000); SR.last = t; SR.acc += dt; let n = 0;
    while (SR.acc >= 1 / 60 && n++ < 6) { this.update(1 / 60); SR.acc -= 1 / 60; }
    this.render();
  },
  // ---------------- simulation ----------------
  update(dt) {
    if (!SR.on || SR.pause) return;
    SR.T += dt; if (SR.banner) { SR.banner.t += dt; if (SR.banner.t > SR.banner.dur) SR.banner = null; }
    const ship = SR.ship; SR.shake = Math.max(0, SR.shake - dt * 2.5); SR.flash = Math.max(0, SR.flash - dt * 2.2); ship.flash = Math.max(0, ship.flash - dt * 4);
    for (const s of SR.stars) { s[2] += SR.rail * dt * .8; if (s[2] > 9) { s[2] -= 158; s[0] = (Math.random() * 2 - 1) * 44; s[1] = (Math.random() * 2 - 1) * 26; } }
    this.fxUpdate(dt);
    if (SR.phase === 'intro') { SR.pt += dt; ship.z = -Math.max(0, 1 - SR.pt / 2.2) * 14 * (1 - SR.pt / 3.2) * 0; if (SR.pt > 3.2) { SR.phase = 'run'; SR.pt = 0; } this.steer(dt, true); return; }
    if (SR.phase === 'result') return;
    if (SR.phase === 'won' || SR.phase === 'dying') { SR.pt += dt; this.entities(dt); if (SR.phase === 'dying' && Math.random() < .3) this.boom(ship.x + (Math.random() - .5) * 1.6, ship.y + (Math.random() - .5), 0, .8, SR.theme.a); if (SR.pt > (SR.phase === 'won' ? 3.4 : 2.4)) this.finish(SR.phase === 'won'); return; }
    SR.time += dt; SR.D += SR.rail * dt; SR.curveA += (SR.curveT - SR.curveA) * Math.min(1, dt * .8); SR.roll += (SR.rollT - SR.roll) * Math.min(1, dt * .8);
    this.sequence(dt); this.steer(dt, false); this.fireGuns(dt); this.entities(dt); this.collide(dt);
  },
  sequence(dt) {
    const L = SR.lvl;
    if (SR.seg < 0 || (SR.seg < L.segs.length - 1 && SR.segT >= L.segs[SR.seg].len)) {                       // next segment
      SR.seg++; SR.segT = 0; SR.evI = 0; const s = L.segs[SR.seg]; SR.curveT = s.curve; SR.rollT = s.roll * (SR.seg % 2 ? -1 : 1);
      this.setBanner(s.label, s.kind === 'boss' ? 'ALL WEAPONS FREE' : s.kind === 'transit' ? 'FOLLOW THE RAIL — THREAD THE GAPS' : 'HOSTILES INBOUND — DODGE AND DESTROY', 2.6, s.kind === 'combat' ? [255, 150, 60] : s.kind === 'boss' ? [255, 70, 60] : SR.theme.a);
    }
    const s = L.segs[SR.seg]; SR.segT += dt;
    while (SR.evI < s.ev.length && s.ev[SR.evI].t <= SR.segT) this.spawn(s.ev[SR.evI++]);
    if (s.kind === 'boss' && !SR.boss && !SR.bossDead && SR.segT >= 3) this.spawnBoss(s.boss);
  },
  spawn(e) {
    const FAR = -118;
    if (e.k === 'gate') { const w = SRB.BX + 1.2, h = SRB.BY + 1.2, l = e.gx - e.gw / 2, r = e.gx + e.gw / 2, b = e.gy - e.gh / 2, t = e.gy + e.gh / 2, R = [];
      if (l > -w) R.push([-w, l, -h, h]); if (r < w) R.push([r, w, -h, h]); if (b > -h) R.push([l, r, -h, b]); if (t < h) R.push([l, r, t, h]); SR.obs.push({ k: 'wall', z: FAR, d: 1.6, rects: R, gap: e }); }
    else if (e.k === 'bar') SR.obs.push({ k: 'bar', z: FAR, d: 1.2, cx: e.cx, cy: e.cy, len: e.len, a: e.a0, om: e.om });
    else if (e.k === 'pillars') SR.obs.push({ k: 'wall', z: FAR, d: 1.6, rects: e.list.map(p => [p.x - p.w / 2, p.x + p.w / 2, p.y - p.h / 2, p.y + p.h / 2]) });
    else if (e.k === 'ring') SR.rings.push({ x: e.x, y: e.y, z: FAR, got: false });
    else if (e.k === 'enemy') {
      const T = SRE[e.kind]; SR.enemies.push({ id: SR.id++, kind: e.kind, x: e.x, y: e.y, x0: e.x, y0: e.y, z: -110, hz: e.hz, hold: e.hold, amp: e.amp, ph: e.ph, mv: e.mv || (e.kind === 'drone' ? 'sine' : 'hold'), dir: e.dir || 1, pat: e.pat, hp: T.hp * (1 + SR.tier * .08), hpMax: T.hp * (1 + SR.tier * .08), r: T.r, st: e.kind === 'mine' ? 'drift' : 'in', ht: 0, t: 0, fc: 1 + Math.random() * 1.2, spin: 0, flash: 0, burst: null });
    }
  },
  spawnBoss(b) {
    const hp = b.hp; SR.boss = { id: SR.id++, kind: 'boss', arch: b.arch, name: b.name, x: 0, y: 0, z: -90, hz: -38, hp, hpMax: hp, r: 3.1, st: 'in', t: 0, ph: 0, phase: -1, pats: [], b, flash: 0, spin: 0, ht: 0, hold: 1e9 }; SR.enemies.push(SR.boss);
    this.setBanner('WARNING', b.name + ' APPROACHING', 2.6, [255, 70, 60]); try { tone(160, .6, 'sawtooth', .14, 90); tone(160, .6, 'sawtooth', .14, 90, .7); } catch (e) { }
  },
  steer(dt, intro) {
    const s = SR.ship; let ax = 0, ay = 0;
    if (SR.auto) { const tg = this.botTarget(); ax = Math.max(-1, Math.min(1, (tg[0] - s.x) * 2)); ay = Math.max(-1, Math.min(1, (tg[1] - s.y) * 2)); }
    else { if (SRK.KeyA || SRK.ArrowLeft) ax -= 1; if (SRK.KeyD || SRK.ArrowRight) ax += 1; if (SRK.KeyW || SRK.ArrowUp) ay += 1; if (SRK.KeyS || SRK.ArrowDown) ay -= 1; }
    const sp = s.spd * ((SRK.ShiftLeft || SRK.ShiftRight) ? .45 : 1), len = Math.hypot(ax, ay) || 1, k = Math.min(1, Math.hypot(ax, ay));
    const tvx = ax / len * sp * k, tvy = ay / len * sp * k, a = Math.min(1, dt * 14); s.vx += (tvx - s.vx) * a; s.vy += (tvy - s.vy) * a;
    s.x = Math.max(-SRB.BX + .7, Math.min(SRB.BX - .7, s.x + s.vx * dt)); s.y = Math.max(-SRB.BY + .55, Math.min(SRB.BY - .55, s.y + s.vy * dt)); s.inv = Math.max(0, s.inv - dt);
    SR.cam.x += (s.x * .55 - SR.cam.x) * Math.min(1, dt * 4); SR.cam.y += (s.y * .5 + 2.1 - SR.cam.y) * Math.min(1, dt * 4);
    if (!intro && Math.random() < .9) for (const d of SR.sh.drives) { if (Math.random() < .5) continue; this.spark(s.x + d.x * SR.sh.s, s.y + d.y * SR.sh.s, 0 + d.z * SR.sh.s + .2, (Math.random() - .5) * .8, (Math.random() - .5) * .8, 8 + Math.random() * 6, .25, [255, 160 + Math.random() * 60 | 0, 60], .05); }
  },
  botTarget() {                                                                  // test pilot: chase the biggest threat to shoot, nudge out of the way of bullets
    let tx = 0, ty = 0, best = 1e9; const s = SR.ship;
    for (const e of SR.enemies) { if (e.z < -80) continue; const d = Math.abs(e.z); if (d < best) { best = d; tx = e.x; ty = e.y; } }
    for (const o of SR.obs) if (o.z > -14 && o.z < 2) { if (o.k === 'wall' && o.gap) { tx = o.gap.gx; ty = o.gap.gy; } }
    for (const b of SR.eb) if (b.z > -6 && b.z < 1.5 && Math.hypot(b.x - s.x, b.y - s.y) < 1.1) { tx = s.x + (s.x - b.x) * 3; ty = s.y + (s.y - b.y) * 3; }
    for (const o of SR.obs) if (o.k === 'bar' && o.z > -14 && o.z < 2) { const ang = o.a + o.om * (Math.abs(o.z) / SR.rail); tx = s.x < 0 ? SRB.BX - 1 : -SRB.BX + 1; ty = s.y; }
    return [tx, ty];
  },
  fireGuns(dt) {
    const s = SR.ship, firing = SR.autoFire || SRK.Space || SRK.fire || SR.auto; if (!firing) return;
    const guns = SR.sh.guns; for (let i = 0; i < guns.length; i++) {
      const g = guns[i], d = SRG[g.kind] || SRG.bolt; s.cd[i] -= dt; if (s.cd[i] > 0) continue; s.cd[i] += d.rate / (1 + SR.sh.st.off / 400);
      const gx = s.x + g.x * SR.sh.s, gy = s.y + g.y * SR.sh.s, gz = g.z * SR.sh.s - .3, dm = d.dmg * s.dmgM;
      for (const o of d.two ? [-.12, .12] : [0]) SR.pb.push({ x: gx + o, y: gy, z: gz, vx: 0, vy: 0, vz: -d.sp, dmg: dm, r: d.r, kind: g.kind, home: d.home, splash: d.splash, pierce: d.pierce, hit: d.pierce ? [] : null, life: 2.2 });
    }
    if (Math.random() < .25) try { tone(520 + Math.random() * 80, .03, 'square', .018, 260); } catch (e) { }
  },
  bomb() {
    const s = SR.ship; if (!SR.on || SR.pause || (SR.phase !== 'run') || s.bombs <= 0) return; s.bombs--; s.inv = Math.max(s.inv, 1.4); SR.flash = 1; SR.shake = 1;
    SR.fx.push({ ring: 1, x: s.x, y: s.y, z: -1, r: 0, max: 26, life: .7, t: 0, c: [255, 255, 255] });
    for (const b of SR.eb) { this.boomSmall(b.x, b.y, b.z, SR.theme.blt); } SR.score += SR.eb.length * 15; SR.eb.length = 0;
    for (const e of SR.enemies) if (e.z > -95) this.damage(e, e === SR.boss ? 18 : 9);
    try { tone(90, .8, 'sawtooth', .2, 30); tone(900, .4, 'square', .1, 100); } catch (e) { }
  },
  // enemy + bullet + obstacle updates
  entities(dt) {
    const s = SR.ship, rail = SR.rail;
    for (const o of SR.obs) { o.z += rail * dt; if (o.k === 'bar') o.a += o.om * dt; } SR.obs = SR.obs.filter(o => o.z < 10);
    for (const r of SR.rings) r.z += rail * dt; SR.rings = SR.rings.filter(r => r.z < 10);
    for (const e of SR.enemies) this.enemyStep(e, dt);
    SR.enemies = SR.enemies.filter(e => !e.dead && e.z < 9 && Math.abs(e.x) < 22);
    for (const b of SR.eb) { b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.t += dt; if (b.accel) { b.vz += b.accel * dt; } }
    SR.eb = SR.eb.filter(b => b.z < 9 && b.z > -140 && Math.abs(b.x) < 30 && Math.abs(b.y) < 20);
    for (const b of SR.pb) {
      if (b.home) { let best = null, bd = 1e9; for (const e of SR.enemies) { if (e.z > b.z || e.z < -100) continue; const d = Math.hypot(e.x - b.x, e.y - b.y) + Math.abs(e.z - b.z) * .1; if (d < bd) { bd = d; best = e; } } if (best) { const t = Math.max(.05, (b.z - best.z) / -b.vz); b.vx += ((best.x - b.x) / t - b.vx) * Math.min(1, dt * 6); b.vy += ((best.y - b.y) / t - b.vy) * Math.min(1, dt * 6); } }
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.life -= dt;
    }
    SR.pb = SR.pb.filter(b => b.life > 0 && b.z > -125);
    if (SR.boss && SR.phase === 'run' && SR.boss.hp <= 0 && !SR.bossDead) this.bossDown();
  },
  enemyStep(e, dt) {
    e.t += dt; e.flash = Math.max(0, e.flash - dt * 5); e.spin += dt;
    const s = SR.ship;
    if (e.kind === 'boss') return this.bossStep(e, dt);
    if (e.st === 'drift') { e.z += 15 * dt; e.x += Math.sin(e.t * 1.3 + e.ph) * .6 * dt * 3; if (e.z > -3.5 && !e.dead) { this.mineBurst(e); e.dead = true; } return; }
    if (e.st === 'in') { e.z += 48 * dt; if (e.z >= e.hz) { e.z = e.hz; e.st = 'hold'; e.ht = 0; } }
    else if (e.st === 'hold') {
      e.ht += dt;
      if (e.mv === 'sine') { e.x = e.x0 + Math.sin(e.t * 1.4 + e.ph) * e.amp; e.y = e.y0 + Math.sin(e.t * 2.1 + e.ph) * e.amp * .35; }
      else if (e.mv === 'snake') { e.x = e.x0 + Math.sin(e.t * 2 + e.ph) * e.amp * .8; e.y = e.y0 + Math.cos(e.t * 1.6 + e.ph) * 1; }
      else if (e.mv === 'sweep') { e.x += e.dir * 3.2 * dt; if (Math.abs(e.x) > SRB.BX - .8) e.dir *= -1; e.y = e.y0 + Math.sin(e.t * 1.2 + e.ph) * .8; }
      else { e.x = e.x0 + Math.sin(e.t * .8 + e.ph) * .6; e.y = e.y0 + Math.sin(e.t * 1.1 + e.ph) * .4; }
      e.fc -= dt; if (e.fc <= 0 && e.pat) { this.fire(e, e.pat); e.fc = Math.max(.12, e.pat.rate * (e.kind === 'gunship' ? 1 : 1) + Math.random() * .3); }
      if (e.burst) { e.burst.t -= dt; if (e.burst.t <= 0) { this.fireAimed(e, e.burst.sp, 0); e.burst.t = .11; if (--e.burst.n <= 0) e.burst = null; } }
      if (e.ht >= e.hold) e.st = 'out';
    } else { e.x += (e.x >= 0 ? 1 : -1) * 16 * dt; e.z += 6 * dt; }
  },
  bossStep(e, dt) {
    const b = e.b;
    if (e.st === 'in') { e.z += 40 * dt; if (e.z >= e.hz) { e.z = e.hz; e.st = 'hold'; } return; }
    if (e.hp <= 0) return; e.ht += dt;
    const ratio = e.hp / e.hpMax, ph = ratio > .62 ? 0 : ratio > .3 ? 1 : 2;
    if (ph !== e.phase) { e.phase = ph; e.pats = b.phases[ph].pats.map((p, i) => Object.assign({ cd: 1.2 + i * .5, ang: 0 }, p)); if (ph > 0) { this.setBanner('PHASE ' + (ph + 1), e.name + ' IS ENRAGED', 1.8, [255, 70, 60]); SR.shake = .8; for (let i = 0; i < 14; i++) this.boom(e.x + (Math.random() - .5) * 5, e.y + (Math.random() - .5) * 3, e.z + 2, 1.2, [255, 120, 60]); SR.eb.length = 0; } }
    e.x = Math.sin(e.t * (.45 + ph * .12)) * 4.6; e.y = Math.sin(e.t * (.9 + ph * .1)) * 1.7 + .4;
    for (const p of e.pats) { p.cd -= dt; if (p.cd <= 0) { this.fire(e, p); p.cd += p.rate; } }
    if (e.burst) { e.burst.t -= dt; if (e.burst.t <= 0) { this.fireAimed(e, e.burst.sp, 0); e.burst.t = .1; if (--e.burst.n <= 0) e.burst = null; } }
  },
  // ---------------- bullet patterns ----------------
  bullet(e, tx, ty, sp, o) {                                                    // a bullet from enemy e that arrives at the player's plane over (tx, ty)
    const tof = Math.max(.25, (0 - e.z) / sp); SR.eb.push(Object.assign({ x: e.x, y: e.y, z: e.z + 1, vx: (tx - e.x) / tof, vy: (ty - e.y) / tof, vz: sp, r: .26, t: 0, c: 0 }, o || {}));
  },
  fireAimed(e, sp, off) { const s = SR.ship; this.bullet(e, s.x + off, s.y, sp); },
  fire(e, p) {
    const s = SR.ship, sp = p.sp, n = p.n, R = p.R || 6;
    switch (p.p) {
      case 'aim': for (let i = 0; i < n; i++) this.bullet(e, s.x + (i - (n - 1) / 2) * .9, s.y, sp - i * .6); break;
      case 'fan': for (let i = 0; i < n; i++) this.bullet(e, s.x + (i - (n - 1) / 2) * 1.5, s.y + ((i & 1) ? .5 : -.5), sp); break;
      case 'ring': { const o = Math.random() * 6.28; for (let i = 0; i < n; i++) { const a = o + i / n * 6.2832; this.bullet(e, e.x + Math.cos(a) * R, e.y + Math.sin(a) * R * .7, sp, { c: 1 }); } break; }
      case 'spiral': { p.ang = (p.ang || 0) + .5; e.spinA = p.ang; const a = p.ang; this.bullet(e, e.x + Math.cos(a) * R, e.y + Math.sin(a) * R * .7, sp, { c: 1 }); this.bullet(e, e.x + Math.cos(a + 3.14) * R, e.y + Math.sin(a + 3.14) * R * .7, sp, { c: 1 }); break; }
      case 'cone': for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, r = Math.random() * 3.6; this.bullet(e, s.x + Math.cos(a) * r, s.y + Math.sin(a) * r * .7, sp * (.85 + Math.random() * .3)); } break;
      case 'stream': e.burst = { n, t: 0, sp }; break;
      case 'cross': { p.ang = (p.ang || 0) + .35; for (let arm = 0; arm < 4; arm++) for (let j = 1; j <= n; j++) { const a = p.ang + arm * 1.5708; this.bullet(e, e.x + Math.cos(a) * j * 2.1, e.y + Math.sin(a) * j * 1.5, sp - j * .5, { c: 1 }); } break; }
      case 'lattice': { const gx = Math.round((s.x + SRB.BX) / 1.9), gy = Math.round((s.y + SRB.BY) / 1.9), sx = 1.9, sy = 1.9; for (let ix = 0; ix * sx <= SRB.BX * 2 + .1; ix++) for (let iy = 0; iy * sy <= SRB.BY * 2 + .1; iy++) { if (Math.abs(ix - gx) <= 0 && Math.abs(iy - gy) <= 0) continue; const x = -SRB.BX + ix * sx, y = -SRB.BY + iy * sy; SR.eb.push({ x, y, z: e.z + 2, vx: 0, vy: 0, vz: sp, r: .3, t: 0, c: 2 }); } break; }
    }
    try { if (Math.random() < .5) tone(200 + Math.random() * 60, .05, 'sawtooth', .02, 120); } catch (er) { }
  },
  mineBurst(e) { const n = 10; for (let i = 0; i < n; i++) { const a = i / n * 6.2832; this.bullet(e, e.x + Math.cos(a) * 5, e.y + Math.sin(a) * 4, 14, { c: 1 }); } this.boom(e.x, e.y, e.z, 1, [255, 150, 60]); },
  // ---------------- damage / collisions ----------------
  damage(e, dmg) { if (e.dead || e.hp <= 0) return; e.hp -= dmg; e.flash = 1; if (e.kind === 'boss') { if (e.hp <= 0) e.hp = 0; return; } if (e.hp <= 0) this.kill(e); },
  kill(e) {
    e.dead = true; SR.kills++; const T = SRE[e.kind]; SR.score += T.score; this.charge(4); this.boom(e.x, e.y, e.z, e.r > 1 ? 2.2 : 1, e.kind === 'drone' ? [255, 90, 90] : [255, 150, 60]); SR.shake = Math.min(1, SR.shake + (e.r > 1 ? .5 : .08));
    if (e.kind === 'mine') this.mineBurst(e); try { tone(120 + Math.random() * 40, .18, 'sawtooth', .07, 40); } catch (er) { }
  },
  bossDown() { SR.bossDead = true; const e = SR.boss; SR.score += 5000 + SR.tier * 1000; for (let i = 0; i < 30; i++) this.boom(e.x + (Math.random() - .5) * 8, e.y + (Math.random() - .5) * 4, e.z + (Math.random() - .5) * 4, 1.6, [255, 190 + Math.random() * 60 | 0, 80]); SR.fx.push({ ring: 1, x: e.x, y: e.y, z: e.z, r: 0, max: 60, life: 1.4, t: 0, c: [255, 240, 200] }); SR.flash = 1; SR.eb.length = 0; e.dead = true; SR.enemies.forEach(o => { if (o !== e && !o.dead) { o.dead = true; this.boom(o.x, o.y, o.z, 1, [255, 150, 60]); } }); SR.phase = 'won'; SR.pt = 0; this.setBanner('SECTOR CLEARED', e.name + ' DESTROYED', 3, [90, 255, 140]); try { tone(60, 1.4, 'sawtooth', .22, 20); tone(500, .8, 'triangle', .12, 900, .5); } catch (er) { } },
  charge(v) { const s = SR.ship; s.meter += v; while (s.meter >= 100) { s.meter -= 100; if (s.bombs < s.bombMax) s.bombs++; } },
  hurt(src) {
    const s = SR.ship; if (s.inv > 0 || SR.phase !== 'run' || SR.god) return; s.hull--; s.inv = s.invT; s.flash = 1; SR.shake = 1; SR.flash = .6; SR.hits++; this.boom(s.x, s.y, 0, .9, [255, 90, 70]);
    try { tone(150, .3, 'sawtooth', .16, 50); } catch (e) { }
    if (s.hull <= 0) { SR.phase = 'dying'; SR.pt = 0; SR.eb.length = 0; this.boom(s.x, s.y, 0, 2.6, [255, 200, 90]); this.setBanner('SHIP LOST', 'HULL BREACH', 2.2, [255, 70, 60]); }
  },
  collide(dt) {
    const s = SR.ship, hr = s.hitR;
    for (const b of SR.eb) {                                                     // enemy bullets vs the ship's heart
      const zr = Math.abs(b.vz) * dt * .5 + .3; if (Math.abs(b.z) > zr + 1.2) continue; const dx = b.x - s.x, dy = b.y - s.y, d = Math.hypot(dx, dy);
      if (Math.abs(b.z) < zr && d < b.r + hr) { b.z = 99; this.hurt(); continue; }
      if (Math.abs(b.z) < zr + .3 && !b.g && d < b.r + hr + .9) { b.g = 1; SR.grazes++; SR.score += 10; this.charge(1.3); }
    }
    for (const o of SR.obs) {                                                    // walls and bars: the instant they pass through the ship's plane
      if (o.z - o.d > .6 || o.z < -.6) continue;
      if (o.k === 'wall') { for (const r of o.rects) if (s.x + .45 > r[0] && s.x - .45 < r[1] && s.y + .35 > r[2] && s.y - .35 < r[3]) { this.hurt(); break; } }
      else { const c = Math.cos(o.a), sn = Math.sin(o.a), px = s.x - o.cx, py = s.y - o.cy, u = Math.max(-o.len, Math.min(o.len, px * c + py * sn)), dd = Math.hypot(px - u * c, py - u * sn); if (dd < .4 + .45) this.hurt(); }
    }
    for (const r of SR.rings) if (!r.got && r.z > -.8 && r.z < .8 && Math.hypot(r.x - s.x, r.y - s.y) < 1.6) { r.got = true; SR.score += 250; this.charge(10); this.spark(r.x, r.y, 0, 0, 0, 0, .6, [255, 240, 120], .5, 14); try { tone(880, .12, 'triangle', .07, 1500); } catch (e) { } }
    for (const e of SR.enemies) {                                                // ramming
      if (e.dead || e.kind === 'boss' && e.hp <= 0) continue; if (Math.abs(e.z) < 1.2 + e.r * .4 && Math.hypot(e.x - s.x, e.y - s.y) < e.r + .5) this.hurt();
    }
    for (const b of SR.pb) {                                                     // your shots vs enemies
      for (const e of SR.enemies) {
        if (e.dead || (e.kind === 'boss' && e.st === 'in' && e.z < -70)) continue; if (b.hit && b.hit.includes(e.id)) continue;
        if (Math.abs(b.z - e.z) < e.r + .8 && Math.hypot(b.x - e.x, b.y - e.y) < e.r + b.r) {
          this.damage(e, b.dmg); if (b.splash) { for (const o of SR.enemies) if (o !== e && !o.dead && Math.hypot(o.x - b.x, o.y - b.y, (o.z - b.z) * .5) < b.splash + o.r) this.damage(o, b.dmg * .5); this.boomSmall(b.x, b.y, b.z, [255, 170, 70]); }
          this.spark(b.x, b.y, b.z, (Math.random() - .5) * 6, (Math.random() - .5) * 6, 6, .25, [255, 255, 255], .1, 3);
          if (b.pierce) b.hit.push(e.id); else { b.life = 0; } break;
        }
      }
    }
  },
  finish(won) {
    SR.phase = 'result'; const s = SR.ship, bonus = won ? Math.round(s.hull / s.hullMax * 2000) + Math.max(0, Math.round((240 - SR.time) * 10)) : 0, total = SR.score + bonus;
    const gems = won ? 12 + SR.tier * 6 + Math.floor(total / 2500) : Math.floor(total / 4000), sh = Yard.store();
    SR.result = { won, score: SR.score, bonus, total, gems, kills: SR.kills, grazes: SR.grazes, hits: SR.hits, time: SR.time, best: false };
    try { Save.gems += gems; if (won) sh.tier = Math.max(sh.tier | 0, SR.tier + 1); if (total > (sh.best | 0)) { sh.best = total; SR.result.best = true; } saveGame(); } catch (e) { }
  },
  // ---------------- particles ----------------
  spark(x, y, z, vx, vy, vz, life, c, size, n) { for (let i = 0; i < (n || 1); i++) SR.fx.push({ x, y, z, vx: vx + (n > 1 ? (Math.random() - .5) * 6 : 0), vy: vy + (n > 1 ? (Math.random() - .5) * 6 : 0), vz: vz + (n > 1 ? (Math.random() - .5) * 6 : 0), life, max: life, c, size: size || .15, t: 0 }); },
  boom(x, y, z, sc, c) { for (let i = 0; i < 12 * sc | 0; i++) this.spark(x, y, z, (Math.random() - .5) * 14 * sc, (Math.random() - .5) * 14 * sc, (Math.random() - .5) * 14 * sc + SR.rail * .3, .5 + Math.random() * .5, c, .25 * sc); SR.fx.push({ ring: 1, x, y, z, r: 0, max: 3.5 * sc, life: .4, t: 0, c }); },
  boomSmall(x, y, z, c) { for (let i = 0; i < 5; i++) this.spark(x, y, z, (Math.random() - .5) * 8, (Math.random() - .5) * 8, (Math.random() - .5) * 8, .3, c, .15); },
  fxUpdate(dt) { for (const f of SR.fx) { f.t += dt; if (f.ring) f.r = f.max * Math.min(1, f.t / f.life); else { f.x += f.vx * dt; f.y += f.vy * dt; f.z += (f.vz + (SR.phase === 'off' ? 0 : SR.rail * .5)) * dt; } } SR.fx = SR.fx.filter(f => f.t < (f.ring ? f.life : f.max)); if (SR.fx.length > 700) SR.fx.splice(0, SR.fx.length - 700); },
};
