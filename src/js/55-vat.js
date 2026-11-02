// ============================================================
//  RESPAWN VATS. On the Helicarrier you are not "revived": you are grown. Whenever you spawn (new game, after dying) you wake up inside one of the eight glass
//  tanks of the Revival Bay, held in thick eldritch purple fluid. It drains (bubbles, a violet wash over the screen, a hum), the two glass doors slide
//  open, and you climb out. Once you have stepped away the doors slide shut together and the tank fills up again. Glass, doors and fluid are TRANSLUCENT
//  (drawn in their own blended pass by drawVatGlass, after everything solid).
// ============================================================
const Vat = {
  cur: -1, t: 0, DUR: 3.4, left: true,
  fill: new Float32Array(8).fill(1), door: new Float32Array(8).fill(0),            // fill 0..1, door 0 closed .. 1 open
  pick() { return ((P.id || 0) + (Math.random() * 8 | 0)) % 8; },
  begin(i) {
    this.cur = i; this.t = this.DUR; this.left = false; this.fill.fill(1); this.door.fill(0);
    const V = VATS[i]; this.px = V.x + .5; this.pz = V.z + .5; this.py = SD + 1.01;
    SFX.spawn(); setTimeout(() => { try { SFX.charged(); } catch (e) { } }, 500);
  },
  active() { return this.t > 0 && this.cur >= 0; },
  blocked(V, i) {                                                                      // the glass is solid: back, both sides and the two door leaves (which slide away as the door opens)
    if (P.y > SD + 9 || P.y < SD - 1.5) return;
    const f = V.face, cx = V.x + .5, cz = V.z + .5, dr = this.door[i], R = .38, T = .16, segs = [
      [cx - 2 * f - T, cx - 2 * f + T, cz - 2.1, cz + 2.1], [cx - 2.1, cx + 2.1, cz - 2 - T, cz - 2 + T], [cx - 2.1, cx + 2.1, cz + 2 - T, cz + 2 + T]];
    for (const k of [-1, 1]) { const lz = cz + k * (.75 + 1.5 * dr); segs.push([cx + 2 * f - T, cx + 2 * f + T, lz - .78, lz + .78]); }
    for (const [x0, x1, z0, z1] of segs) {
      const ox = Math.min(P.x + R - x0, x1 - (P.x - R)), oz = Math.min(P.z + R - z0, z1 - (P.z - R)); if (ox <= 0 || oz <= 0) continue;
      if (ox < oz) { P.x += (P.x < (x0 + x1) / 2 ? -ox : ox); P.vx = 0; } else { P.z += (P.z < (z0 + z1) / 2 ? -oz : oz); P.vz = 0; }
    }
  },
  tick(dt) {
    if (OW.gen !== 3) { const f = $('vatfx'); if (f) f.style.opacity = '0'; return; }
    for (let i = 0; i < 8; i++) {
      const V = VATS[i], mine = i === this.cur;
      if (mine && this.t > 0) {                                                        // being regrown: the tank drains, the doors stay shut
        this.t -= dt; this.fill[i] = Math.max(0, this.t / this.DUR); this.door[i] = 0;
        if (state === 'play') { P.x = this.px; P.z = this.pz; P.y = this.py; P.vx = P.vy = P.vz = 0; P.sliding = false; mouse.l = mouse.r = false; P.shake = Math.max(P.shake, .08); }
        if (this.t <= 0) { this.fill[i] = 0; SFX.dig(); SFX.shink && SFX.shink(); feed('REGROWN — THE DOORS ARE OPEN', '#c06bff'); }
        if (Math.random() < dt * 30) emit(this.px + rnd(-1.2, 1.2), SD + 1 + rnd(0, 7) * this.fill[i], this.pz + rnd(-1.2, 1.2), rnd(-.2, .2), rnd(.8, 2), rnd(-.2, .2), rnd(.06, .12), [.75, .3, 1], rnd(.5, 1), 0);
        continue;
      }
      let target = 0;
      if (mine && !this.left) { target = 1; if (Math.hypot(P.x - this.px, P.z - this.pz) > 3.6) this.left = true; }       // open for the player until they step out
      this.door[i] += clamp(target - this.door[i], -dt * 1.3, dt * 1.3);
      if (this.door[i] < .02 && this.fill[i] < 1 && !(mine && !this.left)) this.fill[i] = Math.min(1, this.fill[i] + dt * .35);       // sealed: it fills up again
      if (Math.hypot(P.x - V.x, P.z - V.z) < 8 && !(mine && this.t > 0)) this.blocked(V, i);
    }
    const f = $('vatfx'); if (f) f.style.opacity = String(this.t > 0 ? Math.min(.9, this.fill[this.cur] * 1.1) : 0);
  }
};
// one translucent pass: purple fluid (thick, with glowing motes, tendrils and a pair of eyes that open from time to time), glass walls, two sliding glass doors
function drawVatGlass(t) {
  for (let i = 0; i < VATS.length; i++) {
    const V = VATS[i]; if (Math.hypot(V.x - camX, V.z - camZ) > 110) continue;
    const f = V.face, cx = V.x + .5, cz = V.z + .5, fl = Vat.fill[i], h = 8 * fl, dr = Vat.door[i];
    if (h > .05) {
      const sw = .5 + .5 * Math.sin(t * 1.1 + i), occupied = i === Vat.cur && Vat.t > 0;
      pushBox(cx, SD + 1.06 + h / 2, cz, 2.8, h - .1, 2.8, .45 + .1 * sw, .1, .85 - .1 * sw, null, false);                             // the body of the fluid
      if (fl > .4) {
        for (let k = 0; k < 3; k++) { const a = t * (.35 + k * .1) + k * 2.1 + i; pushBox(cx + Math.sin(a) * .7, SD + 1 + h * (.25 + .22 * k) + Math.sin(a * 1.7) * .3, cz + Math.cos(a * .9) * .7, .22, h * .5, .22, .22, .02, .35, null, false); }      // slow dark tendrils
        if (!occupied && Math.sin(t * .23 + i * 1.9) > .35) { const ey = SD + 5.2 + Math.sin(t * .5 + i) * .4, bl = Math.sin(t * 5 + i) > .96 ? .02 : .22; for (const e of [-.45, .45]) pushBox(cx + e * .9, ey, cz, .3, bl, .3, 1, .9, .3, null, false); }       // two eyes, blinking
      }
    }
  }
  flushDynA(.58);
  for (let i = 0; i < VATS.length; i++) {
    const V = VATS[i]; if (Math.hypot(V.x - camX, V.z - camZ) > 110) continue;
    const f = V.face, cx = V.x + .5, cz = V.z + .5, dr = Vat.door[i], tint = [.7, .55, 1], y = SD + 5.1;
    pushBox(cx - 2 * f, y, cz, .14, 7.9, 3.2, tint[0], tint[1], tint[2], null, false);                                       // back
    pushBox(cx, y, cz - 2, 4.1, 7.9, .14, tint[0], tint[1], tint[2], null, false); pushBox(cx, y, cz + 2, 4.1, 7.9, .14, tint[0], tint[1], tint[2], null, false);       // sides
    for (const k of [-1, 1]) {                                                                                           // the doors: two leaves that slide apart into the posts
      const lz = cz + k * (.75 + 1.5 * dr); pushBox(cx + 2 * f, y, lz, .14, 7.9, 1.5, .8, .65, 1, null, false);
    }
  }
  flushDynA(.2);
  for (let i = 0; i < VATS.length; i++) {                                                                                // bright frames on the doors so they read as glass
    const V = VATS[i]; if (Math.hypot(V.x - camX, V.z - camZ) > 110) continue;
    const f = V.face, cx = V.x + .5, cz = V.z + .5, dr = Vat.door[i];
    for (const k of [-1, 1]) { const lz = cz + k * (.75 + 1.5 * dr); pushBox(cx + 2 * f, SD + 1.12, lz, .22, .12, 1.55, .7, .4, 1, null, false); pushBox(cx + 2 * f, SD + 8.95, lz, .22, .12, 1.55, .7, .4, 1, null, false); }
  }
  flushDynA(.9);
}
function drawVats() { }
