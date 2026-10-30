// ============================================================
//  THE RIFT: the navigation console in the Rift Hall on the Helicarrier. Type coordinates (any numbers or words: they become the seed, and the
//  same coordinates always lead to the same realm), the two Tesla coils zap the tear in the dimension, it stabilises and you step into a realm.
//  In a realm, the dimensional tear on the spawn island brings you back. Only the host (or a solo player) can operate it; guests just watch and follow.
// ============================================================
const Rift = {
  phase: 'idle', t: 0, text: '', fade: 0, zapT: 0, sent: false,
  nearConsole() { return mode === 'hub' && OW.gen === 3 && Math.hypot(P.x - RIFT.console.x, P.z - RIFT.console.z) < 3.4 && Math.abs(P.y - (SD + 1)) < 3 && this.phase === 'idle'; },
  open() {
    if (state !== 'play') return; if (Net.role === 'client') { feed('ONLY THE HOST CAN OPERATE THE RIFT', '#ff8a3a'); SFX.empty(); return; }
    state = 'rift'; mouse.l = mouse.r = false; try { document.exitPointerLock(); } catch (e) { }
    const c = WorldStore.cur, rec = (c && c.data.recent) || [];
    $('rift').innerHTML = '<div class="rf-t">RIFT NAVIGATION</div><div class="rf-s">ENTER COORDINATES. ANY NUMBERS OR WORDS WORK. THE SAME COORDINATES ALWAYS OPEN THE SAME REALM, SO WRITE DOWN THE ONES YOU LOVE.</div>'
      + '<input id="rf-in" maxlength="40" spellcheck="false" autocomplete="off" placeholder="e.g.  4821 -77   or   THE BLEEDING MOON"><div class="rf-b"><button onclick="Rift.go()">ENGAGE</button><button onclick="Rift.random()">RANDOM COORDINATES</button><button onclick="Rift.close()">CANCEL</button></div>'
      + (rec.length ? '<div class="rf-r">RECENT: ' + rec.map(t => '<u onclick="document.getElementById(\'rf-in\').value=this.textContent">' + esc(t) + '</u>').join(' ') + '</div>' : '') + '<div class="rf-h">' + (gp.on ? 'A = RANDOM · B = CANCEL' : 'ENTER = ENGAGE · ESC = CANCEL') + '</div>';
    $('rift').classList.add('on'); const inp = $('rf-in'); inp.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') Rift.go(); else if (ev.key === 'Escape') Rift.close(); }); setTimeout(() => inp.focus(), 30);
  },
  close() { if (state !== 'rift') return; state = 'play'; $('rift').classList.remove('on'); try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { } },
  random() { const a = () => Math.floor(Math.random() * 9000 + 100) * (Math.random() < .5 ? -1 : 1); $('rf-in').value = a() + ' ' + a() + ' ' + a(); this.go(); },
  go() { const v = ($('rf-in') ? $('rf-in').value : '').trim() || String(Math.floor(Math.random() * 1e9)); this.close(); this.begin(v, false); },
  begin(text, visualOnly) {                                            // start the sequence: coils charge, bolts hit the tear, it stabilises, then we go
    if (this.phase !== 'idle') return; this.phase = 'charge'; this.t = 0; this.text = text; this.sent = !!visualOnly; this.zapT = 0;
    if (!visualOnly) { feed('COORDINATES LOCKED: ' + text.toUpperCase(), '#7af0ff'); if (Net.role === 'host') Net.broadcast('rift', [text]); }
    SFX.charged();
  },
  tick(dt) {
    if (this.fade > 0 && this.phase === 'idle') { this.fade = Math.max(0, this.fade - dt * .7); }
    $('riftfx').style.opacity = this.phase === 'idle' ? this.fade : String(this.flash());
    if (this.phase === 'idle') return;
    this.t += dt;
    if (this.phase === 'charge' && this.t > 2.6) { this.phase = 'zap'; SFX.blast(); }
    else if (this.phase === 'zap') { this.zapT -= dt; if (this.zapT <= 0) { this.zapT = .22 + Math.random() * .25; SFX.blast(); P.shake = Math.max(P.shake, .35); } if (this.t > 6.6) { this.phase = 'stabilize'; SFX.boom(); feed('THE RIFT STABILISES', '#7af0ff'); } }
    else if (this.phase === 'stabilize' && this.t > 8.8) {
      const text = this.text; this.phase = 'idle'; this.fade = 1;
      if (Net.role !== 'client' && !this.sent) { enterRealm(text); SFX.slam(); }
    }
  },
  flash() { if (this.phase === 'zap') return .08 + .2 * Math.random(); if (this.phase === 'stabilize') return Math.min(1, Math.max(0, (this.t - 6.6) / 2.2)); return 0; },
  intensity() { return this.phase === 'charge' ? .3 + .5 * Math.min(1, this.t / 2.6) : this.phase === 'zap' ? 1 : this.phase === 'stabilize' ? Math.max(.4, 1 - (this.t - 6.6) / 2.2 * .6) : .28; }
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
  if (OW.gen !== 3 || Math.hypot(camX - RIFT.x, camZ - RIFT.z) > 70) return;
  const I = Rift.intensity(), cx = RIFT.x, cy = RIFT.y, cz = RIFT.z, jit = Rift.phase === 'zap' ? .55 : Rift.phase === 'charge' ? .12 + .3 * (Rift.t / 2.6) : Rift.phase === 'stabilize' ? .05 : .1;
  const seedT = Math.floor(t * 18), rr = (a, b) => ih(seedT, a, b, 4242) - .5, HY = 4.8, HZ = 2.4;
  for (let i = -4; i <= 4; i++) {                                         // the dark body of the tear: stacked bars that make an ellipse
    const w = HZ * 2 * Math.sqrt(Math.max(0, 1 - Math.pow(i / (HY + .4), 2))); if (w < .3) continue;
    const sw = .5 + .5 * Math.sin(t * 1.7 + i * .9); pushBox(cx, cy + i * 1.05, cz, .14, 1.06, w, .12 + .22 * sw * I, .0, .26 + .35 * (1 - sw) * I, null, false);
  }
  const N = 30; let px = 0, py = 0, pz = 0;
  for (let k = 0; k <= N; k++) {                                          // the torn edge: a jittering loop of bright cracks
    const a = k / N * TAU, j = jit * (1 + I), x = cx + rr(k, 1) * j * .6, y = cy + Math.sin(a) * (HY + rr(k, 2) * j * 1.4), z = cz + Math.cos(a) * (HZ + rr(k, 3) * j * 1.2);
    if (k > 0) pushBeam(px, py, pz, x, y, z, .1 + .07 * I, k & 1 ? [.3 * I + .4, .9, 1] : [1, .3, .9], 1);
    px = x; py = y; pz = z;
  }
  for (let k = 0; k < 7; k++) {                                           // slow swirl inside
    let ax = cx, ay = cy, az = cz; const a0 = t * (.8 + k * .13) + k * 0.9;
    for (let s = 1; s <= 6; s++) { const rad = s / 6, a = a0 + s * .5, y = cy + Math.sin(a) * HY * .82 * rad, z = cz + Math.cos(a) * HZ * .82 * rad; pushBeam(ax, ay, az, cx - .05, y, z, .06, [.6 + .4 * I, .5, 1], 1); ax = cx - .05; ay = y; az = z; }
  }
  for (const c of RIFT.coils) {                                           // coil glow and bolts
    const g = 1.5 + 1.6 * I + .35 * Math.sin(t * 9); pushBox(c[0], c[1], c[2], g, g, g, .3, .9 + .1 * I, 1, null, false);
    if (Rift.phase === 'zap' || (Rift.phase === 'charge' && Rift.t > 1.2 && Math.random() < .25)) for (let b = 0; b < 2; b++) {
      let ax = c[0], ay = c[1], az = c[2]; const ty = cy + rr(10 + b, 4) * 7, tz = cz + rr(11 + b, 5) * 4, steps = 9;
      for (let s = 1; s <= steps; s++) { const f = s / steps, off = (1 - f) * 1.3 * (s < steps ? 1 : 0), x = c[0] + (cx - c[0]) * f + rr(s, 20 + b) * off, y = c[1] + (ty - c[1]) * f + rr(s, 30 + b) * off, z = c[2] + (tz - c[2]) * f + rr(s, 40 + b) * off; pushBeam(ax, ay, az, x, y, z, b ? .07 : .15, b ? [1, 1, 1] : [.5, .95, 1], 1); ax = x; ay = y; az = z; }
    }
  }
  if (Rift.phase === 'idle' && Math.random() < .5) emit(cx + rnd(-.3, .3), cy + rnd(-HY, HY), cz + rnd(-HZ, HZ), rnd(-.6, .6), rnd(-.2, .8), rnd(-1, 1), rnd(.05, .1), Math.random() < .5 ? [.4, .9, 1] : [1, .3, .9], rnd(.4, 1), 0);
}
