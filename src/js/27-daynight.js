// ============================================================
//  DAY / NIGHT — one full cycle every `dayLengthSeconds` (data/tuning.json). tod: 0 = midnight, .25 = sunrise, .5 = noon, .75 = sunset.
//  The host owns the clock in co-op (it rides along in every snapshot). Dungeons are always "hell light" and ignore it.
// ============================================================
const SKY_KEYS = [                      // [tod, zenith colour, horizon colour]
  [0.00, [.01, .012, .05], [.05, .07, .17]], [0.20, [.02, .02, .09], [.10, .08, .24]], [0.27, [.14, .08, .32], [1.0, .42, .28]],
  [0.36, [.26, .14, .52], [.95, .55, .55]], [0.50, [.30, .16, .56], [.98, .62, .68]], [0.64, [.26, .13, .50], [.95, .52, .50]],
  [0.73, [.13, .06, .30], [1.0, .30, .18]], [0.80, [.04, .02, .12], [.30, .10, .28]], [1.00, [.01, .012, .05], [.05, .07, .17]]
];
// ---- gate-and-beam day/night -------------------------------------------------------------------
// There is no smooth cycle. The sky holds one group of bodies (two suns = DAY, four moons = NIGHT). After a while a dimensional gate rips open
// on the horizon, the other group climbs out of it, charges, and fires beams that destroy the group that was there. Then it is the new time of day.
const nz = d => { const l = Math.hypot(d[0], d[1], d[2]) || 1; return [d[0] / l, d[1] / l, d[2] / l]; };
const DN_SUN = [nz([.75, .55, .35]), nz([.3, .42, -.85])];
const DN_MOON = [nz([-.75, .5, .3]), nz([-.4, .3, -.85]), nz([-.1, .78, .45]), nz([-.92, .24, -.28])];
const DN_GATE = [nz([.95, .13, -.1]), nz([-.95, .15, .06])];           // [sun gate, moon gate]
const EV_T = 16;                                                              // seconds a changeover takes
const lerp3n = (a, b, k) => nz([lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)]);
const DayNight = {
  t: .5, phase: 'day', idle: 90, ev: null, len: (DATA.tuning.dayLengthSeconds || 600),
  sunP: [], moonP: [], sv: [1, 1], mv: [0, 0, 0, 0], die: [0, 0, 0, 0, 0, 0], gate: [0, 0, 0, 0], gk: 0, bk: 0, beams: [],
  tick(dt) {
    if (OW.gen === 3) return;                                                  // the station hurtles through deep space: no suns, no moons, no night and day
    if (this.ev) { const was = this.ev.age; this.ev.age += dt; this.cues(was, this.ev.age); if (this.ev.age >= EV_T) this.finish(); }
    else { this.idle -= dt; if (this.idle <= 0 && Net.role !== 'client') this.start(); }
    this.pose();
  },
  start(to) { this.ev = { to: to || (this.phase === 'day' ? 'night' : 'day'), age: 0 }; },
  finish() { this.phase = this.ev.to; this.ev = null; this.idle = Math.max(40, this.len * .5 - EV_T); },
  skip() { if (!this.ev) this.start(); this.ev.age = EV_T - .01; },
  cues(a0, a1) {                                                              // sounds and messages at the big moments
    const hit = t => a0 < t && a1 >= t, toDay = this.ev.to === 'day';
    try {
      if (hit(.2)) { SFX.slam(); feed(toDay ? 'A RIFT TEARS OPEN IN THE EAST' : 'A RIFT TEARS OPEN IN THE WEST', '#c06bff'); }
      if (hit(4)) SFX.spawn(); if (hit(8.5)) SFX.charged();
      if (hit(9.2) || hit(9.8)) SFX.boom(); if (hit(10.6)) SFX.blast();
      if (hit(11)) feed(toDay ? 'THE SUNS HAVE DESTROYED THE MOONS - DAWN' : 'THE MOONS HAVE DESTROYED THE SUNS - NIGHT FALLS', toDay ? '#ffb347' : '#8fd0ff');
    } catch (e) { }
  },
  pose() {
    const ev = this.ev, a = ev ? ev.age : 0, toDay = ev ? ev.to === 'day' : this.phase === 'day', day = this.phase === 'day';
    this.sunP = []; this.moonP = []; this.beams = [];
    const sunG = toDay ? DN_SUN : DN_SUN, moonG = DN_MOON;
    let sv = [day ? 1 : 0, day ? 1 : 0], mv = [day ? 0 : 1, day ? 0 : 1, day ? 0 : 1, day ? 0 : 1], die = [0, 0, 0, 0, 0, 0], L = day ? 1 : 0, gate = [0, 0, 0, 0], sp = DN_SUN.slice(), mp = DN_MOON.slice();
    if (ev) {
      const gi = toDay ? 0 : 1, gd = DN_GATE[gi], open = sstep(clamp(a / 3.5, 0, 1)) * (1 - sstep(clamp((a - 12) / 2.5, 0, 1)));
      gate = [gd[0], gd[1], gd[2], .2 * open]; this.gk = gi;
      const incoming = toDay ? DN_SUN : DN_MOON;
      const pos = incoming.map((f, i) => { const e = sstep(clamp((a - 3.5 - i * .45) / 3, 0, 1)); return { e, p: lerp3n(gd, f, e) }; });
      if (toDay) { sp = pos.map(o => o.p); sv = pos.map(o => o.e); mv = [1, 1, 1, 1]; for (let j = 0; j < 4; j++) die[2 + j] = clamp((a - 9.4 - j * .22) / 1.3, 0, 1); }
      else { mp = pos.map(o => o.p); mv = pos.map(o => o.e); sv = [1, 1]; for (let j = 0; j < 2; j++) die[j] = clamp((a - 9.4 - j * .3) / 1.3, 0, 1); }
      const str = a < 9 ? 0 : 1 - sstep(clamp((a - 11.2) / .8, 0, 1)), n = toDay ? 4 : 4;
      this.bk = toDay ? 0 : 1;
      if (str > 0) for (let k = 0; k < 4; k++) {                                // day: each sun hits two moons; night: each moon hits one sun
        const from = toDay ? sp[k >> 1] : mp[k], to = toDay ? mp[k] : sp[k >> 1];
        this.beams.push({ a: from, b: to, p: clamp((a - 9 - k * .08) / .45, 0, 1), s: str });
      }
      L = toDay ? sstep(clamp((a - 10) / 3.5, 0, 1)) : 1 - sstep(clamp((a - 10) / 3.5, 0, 1));
      this.t = toDay ? .5 * L : 1 - .5 * L;
    } else this.t = day ? .5 : 0;
    this.sv = sv; this.mv = mv; this.die = die; this.gate = gate; this.sunP = sp; this.moonP = mp; this.L = L;
  },
  pack() { return [this.phase === 'day' ? 0 : 1, this.ev ? Math.round(this.ev.age * 100) / 100 : -1]; },
  sync(p) {                                                                   // a guest follows the host's phase and changeover clock
    const ph = p[0] ? 'night' : 'day';
    if (p[1] < 0) { if (this.ev) this.finish(); this.phase = ph; return; }
    if (!this.ev || this.phase !== ph) { this.phase = ph; this.ev = { to: ph === 'day' ? 'night' : 'day', age: p[1] }; }
    else if (Math.abs(this.ev.age - p[1]) > .5) this.ev.age = p[1];
  },
  load() { const c = WorldStore.cur, t = +(c && c.data.time); this.phase = (t >= .25 && t < .75) || !(t >= 0) ? 'day' : 'night'; this.ev = null; this.idle = 40 + Math.random() * 80; this.pose(); },
  collect() { const c = WorldStore.cur; if (Net.role !== 'client' && c && !c.ephemeral) c.data.time = this.phase === 'day' ? .5 : 0; },
  clock() { return OW.gen === 3 ? 'IN TRANSIT' : this.ev ? 'THE RIFT' : this.phase === 'day' ? 'DAY' : 'NIGHT'; },
  isNight() { return this.state(0, 0).amb < .5; },
  state(x, z) {
    if (OW.gen === 3) return SPACE_SKY;
    const t = this.t; let i = 0; while (i < SKY_KEYS.length - 2 && t >= SKY_KEYS[i + 1][0]) i++;
    const a = SKY_KEYS[i], b = SKY_KEYS[i + 1], k = sstep(clamp((t - a[0]) / (b[0] - a[0]), 0, 1));
    const zen = [0, 1, 2].map(j => lerp(a[1][j], b[1][j], k)), hor = [0, 1, 2].map(j => lerp(a[2][j], b[2][j], k));
    const elev = Math.sin((t - .25) * TAU);
    const amb = .3 + .7 * sstep(clamp((elev + .1) / .38, 0, 1)), stars = 1 - sstep(clamp((elev + .18) / .22, 0, 1)), sunA = sstep(clamp((elev + .1) / .4, 0, 1));
    // far terrain fades to a slightly darker, biome-tinted haze than the sky right above it, so the horizon reads as a line
    const bt = x === 0 && z === 0 ? [.1, .1, .1] : owFogTarget(x, z), bm = Math.max(bt[0], bt[1], bt[2], .01), hm = Math.max(hor[0], hor[1], hor[2]);
    const fog = [0, 1, 2].map(j => lerp(hor[j] * .66, bt[j] / bm * hm * .66, .3));
    const bA = [], bB = [], bP = []; for (let q = 0; q < 4; q++) { const bm2 = this.beams[q]; if (bm2) { bA.push(...bm2.a); bB.push(...bm2.b); bP.push(bm2.p, bm2.s); } else { bA.push(0, 1, 0); bB.push(0, 1, 0); bP.push(0, 0); } }
    return { zen, hor, fog, sunD: this.sunP[0], sunC: [...this.sunP[0], ...this.sunP[1]], moonC: this.moonP.flat(), sunV: this.sv, moonV: this.mv, die: this.die, gate: this.gate, gk: this.gk, bk: this.bk, bA, bB, bP, amb, stars, sunA, elev };
  }
};
DayNight.pose();
const SPACE_SKY = { zen: [.02, .005, .06], hor: [.1, .03, .18], fog: [.03, .012, .06], sunD: [0, 1, 0], sunC: [0, 1, 0, 0, 1, 0], moonC: new Array(12).fill(0).map((v, i) => i % 3 === 1 ? 1 : 0), sunV: [0, 0], moonV: [0, 0, 0, 0], die: [0, 0, 0, 0, 0, 0], gate: [0, 1, 0, 0], gk: 0, bk: 0, bA: new Array(12).fill(0), bB: new Array(12).fill(0), bP: new Array(8).fill(0), amb: .85, stars: 1, sunA: .3, elev: -1 };
// the deep-space background loops (the station is moving): how fast each layer slides past, in radians of sky per second
const SKY_STAR_SPEED = .22, SKY_TENT_SPEED = .03;
let skyLoc = null;
function drawSkyDome(f, roll, fovy, asp, sk) {
  let sx = -f[2], sz = f[0]; const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl; let sy = 0;
  let ux = sy * f[2] - sz * f[1], uy = sz * f[0] - sx * f[2], uz = sx * f[1] - sy * f[0];
  if (roll) { const c = Math.cos(roll), s = Math.sin(roll); const nsx = sx * c + ux * s, nsy = sy * c + uy * s, nsz = sz * c + uz * s; ux = -sx * s + ux * c; uy = -sy * s + uy * c; uz = -sz * s + uz * c; sx = nsx; sy = nsy; sz = nsz; }
  if (!skyLoc) { skyLoc = {}; for (const n of ['fwd', 'rgt', 'upv', 'zen', 'hor', 'gnd', 'sunC', 'moonC', 'tanf', 'stars', 'sunA', 'tm', 'sunV', 'moonV', 'dieA', 'gt', 'gk', 'fx', 'bk', 'bA', 'bB', 'bP', 'bgSpd']) skyLoc[n] = gl.getUniformLocation(skyProg, n); }
  gl.useProgram(skyProg); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(false);
  for (const k of [1, 2, 3]) gl.disableVertexAttribArray(k);
  gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const L = skyLoc, th = Math.tan(fovy / 2);
  gl.uniform3fv(L.fwd, f); gl.uniform3f(L.rgt, sx, sy, sz); gl.uniform3f(L.upv, ux, uy, uz);
  gl.uniform3fv(L.zen, sk.zen); gl.uniform3fv(L.hor, sk.hor); gl.uniform3fv(L.gnd, sk.fog); gl.uniform3fv(L.sunC, sk.sunC); gl.uniform3fv(L.moonC, sk.moonC);
  gl.uniform2f(L.tanf, th * asp, th); gl.uniform1f(L.stars, sk.stars); gl.uniform1f(L.sunA, sk.sunA); gl.uniform1f(L.tm, T);
  gl.uniform1fv(L.sunV, sk.sunV); gl.uniform1fv(L.moonV, sk.moonV); gl.uniform1fv(L.dieA, sk.die); gl.uniform4fv(L.gt, sk.gate); gl.uniform1f(L.gk, sk.gk); gl.uniform1f(L.fx, OW.gen === 3 ? 2 : OW.gen >= 2 ? 1 : 0); gl.uniform1f(L.bk, sk.bk);
  gl.uniform2f(L.bgSpd, SKY_STAR_SPEED, SKY_TENT_SPEED); gl.uniform3fv(L.bA, sk.bA); gl.uniform3fv(L.bB, sk.bB); gl.uniform2fv(L.bP, sk.bP);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.useProgram(prog); gl.depthFunc(gl.LESS); gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
  for (const k of [1, 2, 3]) gl.enableVertexAttribArray(k);
}
