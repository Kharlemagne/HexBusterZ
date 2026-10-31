// ============================================================
//  THE RIFT: the navigation console in the Rift Hall on the Helicarrier. Type coordinates (any numbers or words: they become the seed, and the
//  same coordinates always lead to the same realm), the two Tesla coils zap the tear in the dimension, it stabilises and you step into a realm.
//  In a realm, the dimensional tear on the spawn island brings you back. Only the host (or a solo player) can operate it; guests just watch and follow.
// ============================================================
const Rift = {
  phase: 'idle', t: 0, text: '', fade: 0, zapT: 0, sent: false, dest: '',
  nearConsole() { return mode === 'hub' && OW.gen === 3 && Math.hypot(P.x - RIFT.console.x, P.z - RIFT.console.z) < 4.2 && Math.abs(P.y - (SD + 1)) < 3 && (this.phase === 'idle' || this.phase === 'open'); },
  inRift() { const g = RIFT.gate; return OW.gen === 3 && this.phase === 'open' && P.x > g.x1 - 1 && P.x < g.x2 + 1 && Math.abs(P.z - RIFT.z) < 1.6 && P.y > g.y1 - 1.5 && P.y < g.y2; },
  open() {
    if (state !== 'play') return; if (Net.role === 'client') { feed('ONLY THE HOST CAN OPERATE THE RIFT', '#ff8a3a'); SFX.empty(); return; }
    state = 'rift'; mouse.l = mouse.r = false; try { document.exitPointerLock(); } catch (e) { }
    const c = WorldStore.cur, rec = (c && c.data.recent) || [];
    $('rift').innerHTML = '<div class="rf-t">RIFT NAVIGATION</div><div class="rf-s">ENTER COORDINATES. ANY NUMBERS OR WORDS WORK. THE SAME COORDINATES ALWAYS OPEN THE SAME REALM, SO WRITE DOWN THE ONES YOU LOVE. WHEN THE RIFT STABILISES, WALK INTO IT.</div>'
      + '<input id="rf-in" maxlength="40" spellcheck="false" autocomplete="off" placeholder="e.g.  4821 -77   or   THE BLEEDING MOON"><div class="rf-b"><button onclick="Rift.go()">ENGAGE</button><button onclick="Rift.random()">RANDOM COORDINATES</button><button onclick="Rift.close()">CANCEL</button></div>'
      + (rec.length ? '<div class="rf-r">RECENT: ' + rec.map(t => '<u onclick="document.getElementById(\'rf-in\').value=this.textContent">' + esc(t) + '</u>').join(' ') + '</div>' : '') + '<div class="rf-h">' + (gp.on ? 'A = RANDOM · B = CANCEL' : 'ENTER = ENGAGE · ESC = CANCEL') + '</div>';
    $('rift').classList.add('on'); const inp = $('rf-in'); inp.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') Rift.go(); else if (ev.key === 'Escape') Rift.close(); }); setTimeout(() => inp.focus(), 30);
  },
  close() { if (state !== 'rift') return; state = 'play'; $('rift').classList.remove('on'); try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { } },
  random() { const a = () => Math.floor(Math.random() * 9000 + 100) * (Math.random() < .5 ? -1 : 1); $('rf-in').value = a() + ' ' + a() + ' ' + a(); this.go(); },
  go() { const v = ($('rf-in') ? $('rf-in').value : '').trim() || String(Math.floor(Math.random() * 1e9)); this.close(); this.begin(v, false); },
  begin(text, visualOnly) {                                            // start the sequence: coils charge, bolts hit the tear, it stabilises and STAYS OPEN until somebody steps in
    if (this.phase !== 'idle' && this.phase !== 'open') return; this.phase = 'charge'; this.t = 0; this.text = text; this.dest = text; this.sent = !!visualOnly; this.zapT = 0;
    if (!visualOnly) { feed('COORDINATES LOCKED: ' + text.toUpperCase(), '#7af0ff'); if (Net.role === 'host') Net.broadcast('rift', [text]); }
    SFX.charged();
  },
  tick(dt) {
    if (this.fade > 0 && this.phase !== 'zap') this.fade = Math.max(0, this.fade - dt * .8);
    $('riftfx').style.opacity = this.phase === 'zap' ? String(this.flash()) : String(this.fade);
    if (this.phase === 'idle') return;
    this.t += dt;
    if (this.phase === 'charge' && this.t > 2.6) { this.phase = 'zap'; SFX.blast(); }
    else if (this.phase === 'zap') { this.zapT -= dt; if (this.zapT <= 0) { this.zapT = .22 + Math.random() * .25; SFX.blast(); P.shake = Math.max(P.shake, .3); } if (this.t > 6.6) { this.phase = 'stabilize'; SFX.boom(); } }
    else if (this.phase === 'stabilize' && this.t > 8.8) { this.phase = 'open'; feed('THE RIFT IS STABLE — STEP IN', '#7af0ff'); SFX.slam(); }
    else if (this.phase === 'open') {
      if (Net.role !== 'client' && !this.sent && this.inRift()) { const text = this.dest; this.phase = 'idle'; this.fade = 1; enterRealm(text); SFX.slam(); }       // the player jumps in
    }
  },
  flash() { return this.phase === 'zap' ? .05 + .12 * Math.random() : 0; },
  intensity() { return this.phase === 'charge' ? .3 + .5 * Math.min(1, this.t / 2.6) : this.phase === 'zap' ? 1 : this.phase === 'stabilize' ? Math.max(.5, 1 - (this.t - 6.6) / 2.2 * .5) : this.phase === 'open' ? .6 : .2; },
  openness() { return this.phase === 'open' ? 1 : this.phase === 'stabilize' ? .25 + .75 * Math.min(1, (this.t - 6.6) / 2.2) : this.phase === 'zap' ? .25 + .2 * Math.random() : this.phase === 'charge' ? .12 : .1; }
};
function enterRealm(text) {                                              // go through the rift: the station's edits are saved, the realm's own edits are loaded
  const c = WorldStore.cur; if (!c || c.ephemeral) return;
  flushSave();
  const seed = seedFromText(text), key = String(seed);
  c.data.realms = c.data.realms || {}; if (!c.data.realms[key]) c.data.realms[key] = { coords: text, edits: [] };
  c.data.map = { seed, coords: text }; c.data.recent = [text, ...(c.data.recent || []).filter(t => t !== text)].slice(0, 8);
  OW.returnTo = null; enterHub(false, false); saveGame();
}
function leaveRealm() {                                                  // the tear: back to the Helicarrier, arriving in the Rift Hall
  const c = WorldStore.cur; if (!c || c.ephemeral || !c.data.map) return;
  flushSave(); c.data.map = null; OW.returnTo = null; Rift.fade = 1; enterHub(false, false, 'rift'); saveGame();
}
// ---- drawing: the tear, the coils' glow and the bolts (called every frame while the station is in view)
function drawRealmTear(t) {                                              // the violet rip inside the tear's frame in a realm
  const T = HUB.tear; if (!T || Math.hypot(camX - T.x, camZ - T.z) > 90) return;
  for (let yy = 1; yy <= 9; yy++) for (let k = 0; k < 2; k++) { const sw = .5 + .5 * Math.sin(t * 1.6 + yy * .9 + k * 2); pushBox(T.x + .5 + (k ? .12 : -.12), T.y + yy + .5, T.z + .5, .12, 1.02, 4.6, .35 + .35 * sw, .05, .55 + .4 * (1 - sw), null, false); }
  for (let k = 0; k < 14; k++) { const a = t * .9 + k * .45, y = T.y + 5 + Math.sin(a) * 3.6; pushBox(T.x + .5, y, T.z + .5 + Math.cos(a * 1.3) * 2, .2, .2, .2, .7, .9, 1, null, false); }
}
function drawRift(t) {
  if (OW.gen === 4) { drawRealmTear(t); return; }
  if (OW.gen !== 3 || Math.hypot(camX - RIFT.x, camZ - RIFT.z) > 90) return;
  const I = Rift.intensity(), O = Rift.openness(), cx = RIFT.x, cy = RIFT.y, cz = RIFT.z, HX = .5 + 2.3 * O, HY = 2.4 + 3.4 * O, jit = Rift.phase === 'zap' ? .6 : Rift.phase === 'charge' ? .15 + .3 * (Rift.t / 2.6) : Rift.phase === 'stabilize' ? .18 : Rift.phase === 'open' ? .1 : .06;
  const seedT = Math.floor(t * 16), rr = (a, b) => ih(seedT, a, b, 4242) - .5;
  const jag = a => 1 + .17 * Math.sin(a * 7 + t * 2) + .09 * Math.sin(a * 13 - t * 3.1) + .05 * Math.sin(a * 29 + t * 5);        // the same ragged edge as the tear in the sky
  const rows = 11;
  for (let i = 0; i < rows; i++) {                                                                      // the throat: dark violet with a slow swirl of blue
    const v = (i + .5) / rows * 2 - 1, w = HX * 2 * Math.sqrt(Math.max(0, 1 - v * v)) * .96; if (w < .2) continue;
    const sw = .5 + .5 * Math.sin(t * 1.6 + i * .8 + v * 3); pushBox(cx, cy + v * HY, cz, w, HY * 2 / rows + .02, .16, .02 + .1 * sw * I, .02 + .22 * sw * I, .12 + .5 * (1 - sw * .5) * I, null, false);
  }
  const N = 40; let px = 0, py = 0, pz = 0;
  for (let k = 0; k <= N; k++) {                                                                        // the burning rim: bright blue-white, ragged
    const a = k / N * TAU, j = jag(a) * (1 + rr(k, 1) * jit * 1.3), x = cx + Math.cos(a) * HX * j, y = cy + Math.sin(a) * HY * j;
    if (k > 0) pushBeam(px, py, pz, x, y, cz, .13 + .08 * I, k % 3 === 0 ? [1, 1, 1] : [.3 + .3 * I, .7 + .2 * I, 1], 1);
    px = x; py = y; pz = cz + rr(k, 2) * .15;
  }
  for (let k = 0; k < 6; k++) {                                                                         // swirling arms and drifting sparks inside
    let ax = cx, ay = cy; const a0 = t * (.7 + k * .12) + k * 1.05;
    for (let s = 1; s <= 6; s++) { const rad = s / 6, a = a0 + s * .55, x = cx + Math.cos(a) * HX * .85 * rad, y = cy + Math.sin(a) * HY * .85 * rad; pushBeam(ax, ay, cz + .02, x, y, cz + .02, .06, [.35, .55 + .3 * I, 1], 1); ax = x; ay = y; }
  }
  for (let k = 0; k < 9; k++) { const a = t * .5 + k * 2.4, rad = ((k * .37 + t * .12) % 1) * .8; pushBox(cx + Math.cos(a) * HX * rad, cy + Math.sin(a * 1.3) * HY * rad, cz + .05, .14, .14, .14, 1, 1, 1, null, false); }
  for (const c of RIFT.coils) {                                                                         // the coils glow and, while charging or zapping, throw bolts at the tear
    const g = 1.5 + 1.6 * I + .35 * Math.sin(t * 9); pushBox(c[0], c[1], c[2], g, g, g, .3, .9 + .1 * I, 1, null, false);
    if (Rift.phase === 'zap' || (Rift.phase === 'charge' && Rift.t > 1.2 && Math.random() < .25)) for (let b = 0; b < 2; b++) {
      let ax = c[0], ay = c[1], az = c[2]; const ty = cy + rr(10 + b, 4) * HY * 1.4, tx = cx + rr(11 + b, 5) * HX, steps = 9;
      for (let s = 1; s <= steps; s++) { const f = s / steps, off = (1 - f) * 1.3 * (s < steps ? 1 : 0), x = c[0] + (tx - c[0]) * f + rr(s, 20 + b) * off, y = c[1] + (ty - c[1]) * f + rr(s, 30 + b) * off, z = c[2] + (cz - c[2]) * f + rr(s, 40 + b) * off; pushBeam(ax, ay, az, x, y, z, b ? .07 : .15, b ? [1, 1, 1] : [.5, .9, 1], 1); ax = x; ay = y; az = z; }
    }
  }
  if (Math.random() < .5) emit(cx + rnd(-HX, HX), cy + rnd(-HY, HY), cz + rnd(-.4, .4), rnd(-.5, .5), rnd(0, 1), rnd(-.4, 1.2), rnd(.05, .1), Math.random() < .6 ? [.4, .7, 1] : [.7, .5, 1], rnd(.4, 1), 0);
}
