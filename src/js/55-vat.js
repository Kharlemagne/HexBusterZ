// ============================================================
//  RESPAWN VATS. On the Helicarrier you are not "revived": you are grown. Whenever you spawn (new game, after dying) you wake up inside one of the eight
//  tanks of the Revival Bay: the tank is full of glowing fluid, it drains over a few seconds (bubbles, a green wash over the screen, a hum), the front
//  door lights up and you can climb out. Other tanks stay full and glow; a tank someone just left refills slowly.
// ============================================================
const Vat = {
  cur: -1, t: 0, DUR: 3.4, fill: new Float32Array(8).fill(1),
  pick() { return ((P.id || 0) + (Math.random() * 8 | 0)) % 8; },
  begin(i) {
    this.cur = i; this.t = this.DUR; this.fill.fill(1);
    const V = VATS[i]; this.px = V.x + .5; this.pz = V.z + .5; this.py = SD + 1.01;
    SFX.spawn(); setTimeout(() => { try { SFX.charged(); } catch (e) { } }, 500);
  },
  active() { return this.t > 0 && this.cur >= 0; },
  tick(dt) {
    if (OW.gen !== 3 || this.cur < 0) { const f = $('vatfx'); if (f) f.style.opacity = '0'; return; }
    for (let i = 0; i < 8; i++) if (i !== this.cur || (this.t <= 0 && Math.hypot(P.x - this.px, P.z - this.pz) > 6)) this.fill[i] = Math.min(1, this.fill[i] + dt * .3);       // a tank you just left refills once you are away from it
    if (this.t > 0) {
      this.t -= dt; this.fill[this.cur] = Math.max(0, this.t / this.DUR);
      if (state === 'play') { P.x = this.px; P.z = this.pz; P.y = this.py; P.vx = P.vy = P.vz = 0; P.sliding = false; mouse.l = mouse.r = false; P.shake = Math.max(P.shake, .08); }
      if (this.t <= 0) { this.fill[this.cur] = 0; SFX.dig(); feed('REGROWN — STEP OUT OF THE VAT', '#3bff7a'); }
      if (Math.random() < dt * 30) emit(this.px + rnd(-1.2, 1.2), SD + 1 + rnd(0, 6) * this.fill[this.cur], this.pz + rnd(-1.2, 1.2), rnd(-.2, .2), rnd(.8, 2), rnd(-.2, .2), rnd(.06, .12), [.4, 1, .6], rnd(.5, 1), 0);
    }
    const f = $('vatfx'); if (f) f.style.opacity = String(this.t > 0 ? Math.min(.9, this.fill[this.cur] * 1.1) : 0);
  }
};
function drawVats(t) {
  for (let i = 0; i < VATS.length; i++) {
    const V = VATS[i]; if (Math.hypot(V.x - camX, V.z - camZ) > 120) continue;
    const fl = Vat.fill[i], h = 8 * fl; if (h < .05) continue;
    const sw = .5 + .5 * Math.sin(t * 1.3 + i), g = .75 + .2 * sw;
    pushBox(V.x + .5, SD + 1 + h / 2, V.z + .5, 3, h, 3, .2, g, .45, null, false);
    if (fl > .3) { const by = SD + 1 + ((t * 1.4 + i * 1.7) % 1) * h; pushBox(V.x + .5 + Math.sin(t * 2 + i) * .8, by, V.z + .5 + Math.cos(t * 1.7 + i) * .8, .35, .35, .35, .8, 1, .9, null, false); }
    if (i !== Vat.cur && fl > .9 && (Math.sin(t * .35 + i * 2.1) > .2)) { const a = Math.sin(t * .6 + i) * .4; pushBox(V.x + .5, SD + 4.5 + a, V.z + .5, .9, 2.4, .9, .08, .3, .15, null, false); }      // a dark shape drifting in the tank
  }
}
