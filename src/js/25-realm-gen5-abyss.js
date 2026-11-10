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
    this.edits = new Map(); this.edits.set(1, new Map()); this.rollTriggers(); const h = document.getElementById('hud'); if (h) h.classList.add('abyss');
  },
  stop() { this.on = false; const h = document.getElementById('hud'); if (h) h.classList.remove('abyss'); this.rift = null; this.edits = new Map(); HUB.tear = null; const f = document.getElementById('abfade'); if (f) f.style.opacity = '0'; },
  rollTriggers() { this.gap = rnd(60, 90); this.needDist = rnd(150, 400); this.needStill = rnd(120, 240); this.needTime = rnd(120, 300); this.fireIn = -1; },
  attach() { let m = this.edits.get(this.layout); if (!m) this.edits.set(this.layout, m = new Map()); OW.edits = m; },
  place(x, z) { const y = topY(Math.floor(x), Math.floor(z), 380) + 1.01; return y; },
  pickLayout() {                                                              // 1 in 4: bring back a layout you have seen (never the current one); otherwise a brand new one
    const old = this.history.filter(i => i !== this.layout);
    if (old.length && Math.random() < .25) { this.ret++; return old[Math.floor(Math.random() * old.length)]; }
    const id = this.nextId++; this.history.push(id); return id;
  },
  shiftNow(id) {                                                              // swap every chunk for the new layout, keep the player standing on the ground
    this.layout = id === undefined ? this.pickLayout() : id; this.shifts++;
    const S = this.seed(); OW.drop(); OW.seed = S >>> 0; OWG.S = S; this.attach(); WorldSave.count = 0; WorldSave.dirty = false; Fluid.reset();
    const cx = Math.floor(P.x / CS), cz = Math.floor(P.z / CS);
    for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) OW.ensure(cx + dx, cz + dz);
    buildAll(); OW.active = true;
    P.y = topY(Math.floor(P.x), Math.floor(P.z), 380) + 1.01; P.vy = 0; P.onGround = true;
    this.since = 0; this.dist = 0; this.still = 0; this.lx = P.x; this.lz = P.z; this.rollTriggers();
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
  flushSave(); Abyss.start(); Rift.fade = 1; enterHub(false, false, 'abyss');
}
function leaveAbyss() {                                                    // the exit rift: back to the Helicarrier, arriving in the Rift Hall
  const c = WorldStore.cur; Abyss.stop(); if (!c || c.ephemeral) return;
  c.data.map = null; OW.returnTo = null; Rift.fade = 1; enterHub(false, false, 'rift'); saveGame();
}
function abyssH(x, z, S) { return 70 + (fbm2(x / 140, z / 140, S + 3, 3) - .5) * 46 + (fbm2(x / 38, z / 38, S + 4, 2) - .5) * 8; }
OWG.gen5 = function (cx, cz) {
  const S = OWG.S, b = new Uint16Array(256 * WORLD_H), x0 = cx * CS, z0 = cz * CS;
  for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) {
    const x = x0 + lx, z = z0 + lz, h = Math.floor(abyssH(x, z, S)), o = lx | (lz << 4);
    for (let y = 1; y <= h; y++) b[o | (y << 8)] = y <= 2 ? 10 : y === h ? (ih(x, z, 3, S + 5) < .03 ? 12 : 20) : y > h - 4 ? 1 : (ih(x, y, z, S + 9) < .004 ? 12 : 1);
  }
  return b;
};
function abyssSky(sk) {                                                    // a flat grey sky: no sun, no moons, no stars
  const z = a => a && a.length !== undefined ? Array.from(a, () => 0) : 0;
  return Object.assign({}, sk, { zen: [.10, .10, .11], hor: [.5, .5, .52], fog: [.42, .42, .44], sunV: z(sk.sunV), moonV: z(sk.moonV), die: z(sk.die), gate: [0, 0, 0, 0], stars: 0, sunA: 0, gk: 0, bk: 0, amb: .9, sunC: z(sk.sunC), moonC: z(sk.moonC) });
}
