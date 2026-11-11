// ============================================================
//  THE ABYSS — what is under the edge of the world. Every colour has been taken out of it except the blue glow of your arm.
//  You fall for a long time, land, and wander. Nothing is here. Every so often the land behind you is replaced by a different landscape (a SHIFT);
//  one shift in four brings back a layout you already saw, with whatever you built in it still standing. After 20 minutes on foot a rift opens in
//  front of you and takes you back to the ship. The Abyss is never saved: leave it (or quit) and it starts over next time.
// ============================================================
const ABYSS_MIN = 20;                                                      // minutes of wandering before the exit rift opens
const Abyss = {
  on: false, phase: 'fall', layout: 1, nextId: 2, history: [], edits: new Map(),      // edits: layout id -> that layout's block edits (OW.edits format)
  wander: 0, since: 0, dist: 0, still: 0, lx: 0, lz: 0, yawH: [], fireIn: -1, gap: 70, needDist: 250, needStill: 180, needTime: 200,
  fade: 0, fadeDir: 0, fadeSpd: 2, pendingShift: false, rift: null, riftT: 0, shifts: 0, px: .5, pz: .5, ret: 0,
  seedOf(id) { return (Math.imul(id + 7, 0x9E3779B1) ^ 0xAB155) | 0; },
  seed() { return this.seedOf(this.layout); },
  start() {
    Object.assign(this, { on: true, phase: 'fall', layout: 1, nextId: 2, history: [1], wander: 0, since: 0, dist: 0, still: 0, yawH: [], fireIn: -1, fade: 0, fadeDir: 0, pendingShift: false, rift: null, riftT: 0, shifts: 0, ret: 0 });
    this.edits = new Map(); this.edits.set(1, new Map()); this.rollTriggers(); const sp = this.clear(0, 0, this.seed()); this.px = sp.x + .5; this.pz = sp.z + .5; const h = document.getElementById('hud'); if (h) h.classList.add('abyss');
  },
  stop() { this.on = false; const h = document.getElementById('hud'); if (h) h.classList.remove('abyss'); this.rift = null; this.edits = new Map(); HUB.tear = null; const f = document.getElementById('abfade'); if (f) f.style.opacity = '0'; },
  rollTriggers() { this.gap = rnd(60, 90); this.needDist = rnd(150, 400); this.needStill = rnd(120, 240); this.needTime = rnd(120, 300); this.fireIn = -1; },
  attach() { let m = this.edits.get(this.layout); if (!m) this.edits.set(this.layout, m = new Map()); OW.edits = m; },
  clear(x, z, S) {                                                            // the nearest dry, open spot: not in a pool, not under or on a stick mob
    const ok = (X, Z) => { if (abyssH(X, Z, S) < ABYSS_WATER + 3) return false; for (let cx = Math.floor((X - 6) / CS); cx <= Math.floor((X + 6) / CS); cx++) for (let cz = Math.floor((Z - 6) / CS); cz <= Math.floor((Z + 6) / CS); cz++) { const o = []; abyssFigures(cx, cz, S, o); if (o.some(q => Math.abs(q.x - X) < 6 && Math.abs(q.z - Z) < 6)) return false; } return true; };
    for (let r = 0; r < 400; r += 3) for (let k = 0; k < (r ? 12 : 1); k++) { const a = k / 12 * TAU, X = Math.floor(x + Math.cos(a) * r), Z = Math.floor(z + Math.sin(a) * r); if (ok(X, Z)) return { x: X, z: Z }; }
    return { x: Math.floor(x), z: Math.floor(z) };
  },
  place(x, z) { const y = topY(Math.floor(x), Math.floor(z), 380) + 1.01; return y; },
  pickLayout() {                                                              // 1 in 4: bring back a layout you have seen (never the current one); otherwise a brand new one
    const old = this.history.filter(i => i !== this.layout);
    if (old.length && Math.random() < .25) { this.ret++; return old[Math.floor(Math.random() * old.length)]; }
    const id = this.nextId++; this.history.push(id); return id;
  },
  shiftNow(id) {                                                              // swap every chunk for the new layout, keep the player standing on the ground
    this.layout = id === undefined ? this.pickLayout() : id; this.shifts++;
    const S = this.seed(); const cl = this.clear(P.x, P.z, S); P.x = cl.x + .5; P.z = cl.z + .5; OW.drop(); OW.seed = S >>> 0; OWG.S = S; this.attach(); WorldSave.count = 0; WorldSave.dirty = false; Fluid.reset();
    const cx = Math.floor(P.x / CS), cz = Math.floor(P.z / CS);
    for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) OW.ensure(cx + dx, cz + dz);
    buildAll(); OW.active = true;
    P.y = topY(Math.floor(P.x), Math.floor(P.z), 380) + 1.01; P.vy = 0; P.onGround = true;
    this.since = 0; this.dist = 0; this.still = 0; this.lx = P.x; this.lz = P.z; this.rollTriggers();
  },
  rev: new Float32Array(32).fill(1e5),
  coneStep(dt) {                                                              // the cone render: the sectors behind you are despawned down to 4 blocks; turn towards one and it respawns from 4 blocks outward
    const back = Math.atan2(Math.cos(P.yaw), Math.sin(P.yaw)), step = Math.min(dt, .1) * 90;
    for (let i = 0; i < 32; i++) {
      let d = (i + .5) * TAU / 32 - back; d = Math.abs(((d + Math.PI * 3) % TAU) - Math.PI);
      this.rev[i] = d < .62 ? 4 : Math.min(1e5, this.rev[i] + step);
    }
    return this.rev;
  },
  safe() { return P.onGround && !P.sliding && !isLiquid(get(Math.floor(P.x), Math.floor(P.y + .5), Math.floor(P.z))); },
  tick(dt) {
    if (!this.on) return;
    const f = document.getElementById('abfade') || (() => { const d = document.createElement('div'); d.id = 'abfade'; d.style.cssText = 'position:fixed;inset:0;background:#777;opacity:0;pointer-events:none;z-index:4'; document.body.appendChild(d); return d; })();
    if (this.fadeDir) {                                                       // grey wipe: in, swap, out
      this.fade = clamp(this.fade + this.fadeDir * dt * this.fadeSpd, 0, 1); f.style.opacity = String(this.fade);
      if (this.fadeDir > 0 && this.fade >= 1) { this.shiftNow(); this.fadeDir = -1; this.fadeSpd = this.fadeSpd > 2 ? .8 : 2; }
      else if (this.fadeDir < 0 && this.fade <= 0) this.fadeDir = 0;
    }
    if (this.phase === 'fall') {                                              // a long, slow fall
      P.vy = Math.max(P.vy, -10);
      if (P.onGround || P.y < topY(Math.floor(P.x), Math.floor(P.z), 380) + 1.2) { this.phase = 'walk'; this.lx = P.x; this.lz = P.z; this.since = 0; }
      return;
    }
    this.wander += dt;
    if (this.phase === 'exit') {                                              // the rift is open: it takes you home on its own
      this.riftT += dt; const R = this.rift;
      if (R && (this.riftT > 5 || (Math.hypot(P.x - R.x - .5, P.z - R.z - .5) < 2.2 && P.y > R.y - 1 && P.y < R.y + 9)) && Net.role !== 'client') leaveAbyss();
      return;
    }
    if (this.wander >= ABYSS_MIN * 60 && this.safe() && !this.fadeDir) { this.openRift(); return; }
    this.since += dt; this.dist += Math.hypot(P.x - this.lx, P.z - this.lz); this.lx = P.x; this.lz = P.z;
    this.still = Math.hypot(P.vx, P.vz) < .6 ? this.still + dt : 0;
    const now = performance.now() / 1000; this.yawH.push([now, P.yaw]); while (this.yawH.length && now - this.yawH[0][0] > 2.5) this.yawH.shift();
    const d = Math.abs(((P.yaw - this.yawH[0][1] + Math.PI * 3) % TAU) - Math.PI), lookAway = d > 2.3;      // you turned right round
    const eligible = this.since > this.gap && !this.fadeDir, armed = eligible && (this.dist >= this.needDist || this.still >= this.needStill || this.since >= this.needTime);
    if (armed && this.fireIn < 0) this.fireIn = rnd(4, 40);
    if (this.fireIn >= 0 && !this.fadeDir) {
      this.fireIn -= dt; if (lookAway && this.fireIn > .6) this.fireIn = rnd(.4, 2.5);        // it likes to do it when you are not looking
      if (this.fireIn <= 0 && this.safe()) { this.fadeDir = 1; this.fadeSpd = Math.random() < .25 ? 8 : 2; }       // a quarter of them are nearly instant
    }
  },
  openRift() {
    const fx = Math.sin(-P.yaw) * 0, dx = -Math.sin(P.yaw), dz = -Math.cos(P.yaw), x = Math.floor(P.x + dx * 12), z = Math.floor(P.z + dz * 12);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) OW.ensure(Math.floor((x + i - 3) / CS), Math.floor((z + j - 3) / CS));
    const y = topY(x, z, 380); this.rift = { x, y, z, seed: 1 }; this.phase = 'exit'; this.riftT = 0; this.fireIn = -1;
    buildTear((a, b, c, id) => setBlock(a, b, c, id), this.rift); HUB.tear = this.rift;
    feed('A RIFT OPENS', '#cfd'); banner('A RIFT OPENS', 'IT TAKES YOU HOME');
  }
};
function enterAbyss() {                                                    // fell off the edge of the world
  const c = WorldStore.cur; if (!c || c.ephemeral) return;
  flushSave(); Abyss.start(); enterHub(false, false, 'abyss');
}
function leaveAbyss() {                                                    // the exit rift: back to the Helicarrier, arriving in the Rift Hall
  const c = WorldStore.cur; Abyss.stop(); if (!c || c.ephemeral) return;
  c.data.map = null; OW.returnTo = null; Rift.fade = 1; enterHub(false, false, 'rift'); saveGame();
}
// ---- the land of the Abyss: four biomes, six blocks of its own, and the STICK MOBS that stand in for trees --------------------------------------
const abMat = n => MAT0 + MATS.findIndex(m => m.name === n);
const AB = { SILT: abMat('ABYSS SILT'), GLOOM: abMat('GLOOMSTONE'), STRATA: abMat('PALE STRATA'), STICK: abMat('STICKWOOD'), SALT: abMat('SALT CRUST'), SPINE: abMat('SPINE') };
const ABYSS_BIOMES = ['THE SILT FLATS', 'THE HOLLOW WOODS', 'THE SPINE FIELDS', 'THE STILL BASINS'], ABYSS_WATER = 58, ABYSS_CELL = 9;
const abQ = v => sstep(clamp((v - .42) / .16, 0, 1));
function abyssWeights(x, z, S) {                                           // two slow noises pick the biome; smooth blends between the four
  const s1 = abQ(fbm2(x / 420, z / 420, S + 31, 3)), s2 = abQ(fbm2(x / 420, z / 420, S + 37, 3));
  return [(1 - s1) * (1 - s2), s1 * (1 - s2), (1 - s1) * s2, s1 * s2];
}
const abArg = w => { let b = 0; for (let i = 1; i < 4; i++) if (w[i] > w[b]) b = i; return b; };
function abyssH(x, z, S, w) {
  w = w || abyssWeights(x, z, S);
  const flats = 66 + (fbm2(x / 160, z / 160, S + 3, 3) - .5) * 10;
  const woods = 70 + (fbm2(x / 90, z / 90, S + 5, 3) - .5) * 18;
  const rg = 1 - Math.abs(2 * fbm2(x / 110, z / 110, S + 7, 3) - 1), spines = Math.floor((64 + rg * rg * 36) / 3) * 3;      // terraced ridges
  const basins = 54 + (fbm2(x / 200, z / 200, S + 9, 2) - .5) * 14;
  return Math.floor(flats * w[0] + woods * w[1] + spines * w[2] + basins * w[3]);
}
const abyssBiomeName = (x, z) => ABYSS_BIOMES[abArg(abyssWeights(x, z, OWG.S))];
function abyssSurface(bi, depth, x, y, z, S) {                              // the block at `depth` below the surface in biome bi
  if (bi === 0) return depth <= 3 ? AB.SILT : AB.GLOOM;
  if (bi === 1) return depth === 0 ? (ih(x, 0, z, S + 41) < .3 ? AB.SILT : AB.GLOOM) : AB.GLOOM;
  if (bi === 2) return AB.STRATA;
  return depth === 0 ? AB.SALT : depth < 3 ? AB.SILT : AB.GLOOM;
}
// one stick mob = a tall, thin figure that stands still: two long legs with a gap between them, a one-block torso, a bar of shoulders, arms that hang almost to the ground, a tall narrow head
function abyssFigures(cx0, cz0, S, out) {                                  // every figure whose 9x9 cell touches the chunk at (cx0, cz0)
  const x0 = cx0 * CS, z0 = cz0 * CS;
  for (let ci = Math.floor(x0 / ABYSS_CELL); ci <= Math.floor((x0 + CS - 1) / ABYSS_CELL); ci++) for (let cj = Math.floor(z0 / ABYSS_CELL); cj <= Math.floor((z0 + CS - 1) / ABYSS_CELL); cj++) {
    const px = ci * ABYSS_CELL + 4, pz = cj * ABYSS_CELL + 4, w = abyssWeights(px, pz, S), dens = w[0] * .07 + w[1] * .62 + w[2] * .09 + w[3] * .05;
    if (ih(ci, 0, cj, S + 101) >= dens) continue;
    const fx = ci * ABYSS_CELL + 2 + Math.floor(ih(ci, 1, cj, S + 102) * 5), fz = cj * ABYSS_CELL + 2 + Math.floor(ih(ci, 2, cj, S + 103) * 5);
    out.push({ x: fx, z: fz, ax: ih(ci, 3, cj, S + 104) < .5, L: 6 + Math.floor(ih(ci, 4, cj, S + 105) * 4), T: 3 + Math.floor(ih(ci, 5, cj, S + 106) * 2), w });
  }
}
OWG.gen5 = function (cx, cz) {
  const S = OWG.S, b = new Uint16Array(256 * WORLD_H), x0 = cx * CS, z0 = cz * CS, H5 = [];
  for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) {
    const x = x0 + lx, z = z0 + lz, w = abyssWeights(x, z, S), bi = abArg(w), h = abyssH(x, z, S, w), o = lx | (lz << 4);
    H5[o] = h;
    for (let y = 1; y <= h; y++) b[o | (y << 8)] = y <= 2 ? 10 : abyssSurface(bi, h - y, x, y, z, S);
    for (let y = h + 1; y <= ABYSS_WATER; y++) b[o | (y << 8)] = 3600;      // the low basins hold black water
    if (bi === 2 && h > ABYSS_WATER + 2 && ih(x >> 2, 0, z >> 2, S + 111) < .16 && ((x & 3) === 1) && ((z & 3) === 1)) {      // SPINES: single ribbed pillars rising out of the ridge fields
      const sh = 5 + Math.floor(ih(x, 7, z, S + 112) * 11); for (let y = h + 1; y <= h + sh && y < WORLD_H - 1; y++) b[o | (y << 8)] = AB.SPINE;
    }
  }
  const figs = []; abyssFigures(cx, cz, S, figs);
  const put = (X, Y, Z) => { if (X >= x0 && X < x0 + CS && Z >= z0 && Z < z0 + CS && Y > 0 && Y < WORLD_H - 1) b[(X - x0) | ((Z - z0) << 4) | (Y << 8)] = AB.STICK; };
  for (const f of figs) {
    const g = (X, Z) => abyssH(X, Z, S), da = f.ax ? 1 : 0, dz = f.ax ? 0 : 1;                     // da, dz: the axis the shoulders lie along
    const lx = f.x - da, lz = f.z - dz, rx = f.x + da, rz = f.z + dz, gl = g(lx, lz), gr = g(rx, rz), gc = g(f.x, f.z);
    if (Math.max(gl, gr, gc) <= ABYSS_WATER) continue;                                             // never stands in a pool
    const y0 = Math.max(gl, gr, gc) + 1, hip = y0 + f.L, top = hip + f.T;
    for (let y = gl + 1; y < hip; y++) put(lx, y, lz);                                               // legs
    for (let y = gr + 1; y < hip; y++) put(rx, y, rz);
    for (let k = -1; k <= 1; k++) put(f.x + k * da, hip, f.z + k * dz);                            // hips
    for (let y = hip + 1; y <= top; y++) put(f.x, y, f.z);                                           // torso
    for (let k = -2; k <= 2; k++) put(f.x + k * da, top, f.z + k * dz);                              // shoulders
    for (let y = y0 + 1; y < top; y++) { put(f.x - 2 * da, y, f.z - 2 * dz); put(f.x + 2 * da, y, f.z + 2 * dz); }          // long arms
    put(f.x, top + 1, f.z); put(f.x, top + 2, f.z);                                                  // head
  }
  return b;
};
function abyssSky(sk) {                                                    // a flat grey sky: no sun, no moons, no stars
  const z = a => a && a.length !== undefined ? Array.from(a, () => 0) : 0;
  return Object.assign({}, sk, { zen: [.10, .10, .11], hor: [.5, .5, .52], fog: [.42, .42, .44], sunV: z(sk.sunV), moonV: z(sk.moonV), die: z(sk.die), gate: [0, 0, 0, 0], stars: 0, sunA: 0, gk: 0, bk: 0, amb: .9, sunC: z(sk.sunC), moonC: z(sk.moonC) });
}

// ---- THE EDGE: the sea drags at you as you near the end of the world, harder the closer you get (you can fight it, until you can't); past the lip you fall
//      for a long while, watching the realm shrink away above you and a swirl rise from below, the screen goes black for four seconds, and you fade in falling at the top of the Abyss.
const EdgeFall = {
  on: false, t: 0, vx: 0, vy: 0, vz: 0, vor: 0, f: 0, said: false, fall: 16, black: 0, fadeIn: 0, over: null, PULL0: 3925,
  el() { if (!this.over) { const d = document.createElement('div'); d.id = 'edgefade'; d.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:6'; document.body.appendChild(d); this.over = d; } return this.over; },
  pull(dt) {                                                               // called every frame while you are in a realm
    const ax = Math.abs(P.x), az = Math.abs(P.z), D = Math.max(ax, az);
    if (D < this.PULL0) { this.f = 0; this.said = false; return; }
    const f = this.f = clamp((D - this.PULL0) / (RLIP - this.PULL0), 0, 1);
    const ex = Math.max(0, ax - this.PULL0) * Math.sign(P.x), ez = Math.max(0, az - this.PULL0) * Math.sign(P.z), l = Math.hypot(ex, ez) || 1, a = 3 + 70 * f * f;      // gentle at first, then nothing can stop it
    P.vx += ex / l * a * dt; P.vz += ez / l * a * dt; P.shake = Math.max(P.shake, f * .5);
    if (!this.said) { this.said = true; feed('THE EDGE PULLS AT YOU', '#9fb0c8'); }
  },
  begin() {                                                                // you crossed the lip
    Object.assign(this, { on: true, t: 0, vx: P.vx, vy: Math.min(P.vy, 0), vz: P.vz, vor: 0, black: 0, fadeIn: 0 });
    P.sliding = false; P.dashT = 0; P.latch = null; feed('YOU GO OVER THE EDGE', '#cfd'); this.el().style.opacity = '0';
  },
  step(dt) {                                                               // replaces the player's physics while falling
    this.t += dt; this.vy = Math.max(this.vy - 20 * dt, -46); const dr = Math.max(0, 1 - .5 * dt); this.vx *= dr; this.vz *= dr;
    P.x += this.vx * dt; P.y += this.vy * dt; P.z += this.vz * dt; P.vx = this.vx; P.vy = this.vy; P.vz = this.vz; P.onGround = false; P.inv = Math.max(P.inv, .5);
    this.vor = clamp((this.t - 2) / (this.fall - 3), 0, 1);
    const o = this.el(); o.style.opacity = String(clamp((this.t - (this.fall - 2.2)) / 2.2, 0, 1));
    if (this.t >= this.fall) { this.on = false; o.style.opacity = '1'; this.black = 4; this.fadeIn = 5; enterAbyss(); }
  },
  tick(dt) {                                                               // black for a while, then a slow fade-in (real time, not scaled)
    if (this.on || !(this.black > 0 || this.fadeIn > 0)) return; dt = Math.min(dt, .1); const o = this.el();
    if (this.black > 0) { this.black -= dt; o.style.opacity = '1'; }
    else { this.fadeIn -= dt; o.style.opacity = String(clamp(this.fadeIn / 5, 0, 1)); }
  }
};
