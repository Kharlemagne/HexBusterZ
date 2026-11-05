// ============================================================
//  THE REACTOR CORE: a great hall deep under the hangar. The Rift hangs in its middle, a tear in space held open between six Tesla pylons; a funnel in the ceiling
//  drinks its power and conduits carry it up into the ship. The Rift Stabilizer console stands before it. You get here by the HEXAGON LIFT in the bridge's west wall
//  (opposite the big window): press the big red button, the floor irises open and a holo elevator shoots you down the shaft.
//  Build: stCore(). Runtime: Lift (the ride), drawCoreProps (iris door, holo shaft, power pulses).
// ============================================================
const FY = RC.fy;
const coreWall = (a, y) => ((a + y) & 7) === 0 ? B.TECH : (y % 6 === 0 ? NEO('SKY') : B.HULL);
function stCore() {
  const R = RC, O = NEO('SKY'), W = NEO('WHITE');
  stBox(R.x0 - 3, FY - 4, R.z0 - 3, R.x1 + 3, FY + R.h + 2, R.z1 + 3, B.HULL);
  stBox(R.x0, FY + 1, R.z0, R.x1, FY + R.h, R.z1, 0);
  for (let z = R.z0; z <= R.z1; z++) for (let x = R.x0; x <= R.x1; x++) {                            // the floor: plates, a lit hex inlay around the Rift, blue lanes
    const h = hexD(x + .5 - RIFT.x, z + .5 - RIFT.z); let id = ((x + z) & 7) === 0 ? B.TECH : B.STREET;
    if (h > 6.6 && h < 7.4 || h > 3.6 && h < 4.2 || h > 12.6 && h < 13) id = O; else if (h <= 3.6) id = ((x + z) & 1) ? B.TECH : B.HULL;
    if ((x % 16 === 0 && Math.abs(z) > 17) || (z % 16 === 0 && Math.abs(x) > 17)) id = NEO('BLUE');
    stPut(x, FY, z, id);
  }
  for (let y = FY + 1; y <= FY + R.h; y++) {                                                         // walls, with a glowing band
    for (let z = R.z0 - 1; z <= R.z1 + 1; z++) for (const x of [R.x0 - 1, R.x1 + 1]) stPut(x, y, z, coreWall(z, y - FY));
    for (let x = R.x0 - 1; x <= R.x1 + 1; x++) for (const z of [R.z0 - 1, R.z1 + 1]) stPut(x, y, z, coreWall(x, y - FY));
  }
  for (let x = R.x0; x <= R.x1; x += 8) for (let z = R.z0; z <= R.z1; z += 10) stPut(x, FY + R.h, z, B.LAMP);       // ceiling lamps
  // ---- the Tesla pylons: a base, a banded tower, a white head, and a conduit mast that carries on up to the ceiling
  for (const c of RIFT.coils) {
    const cx = Math.floor(c[0]), cz = Math.floor(c[2]);
    stBox(cx - 2, FY + 1, cz - 2, cx + 2, FY + 2, cz + 2, B.HULL); for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) stPut(cx + dx, FY + 2, cz + dz, O);
    for (let y = FY + 3; y <= FY + 13; y++) { stBox(cx - 1, y, cz - 1, cx + 1, y, cz + 1, (y % 3 === 0) ? O : B.TECH); if (y % 3 === 0) stRing(cx - 2, y, cz - 2, cx + 2, y, cz + 2, SH(B.HULL, K.SLAB_B)); }
    stBox(cx - 1, FY + 14, cz - 1, cx + 1, FY + 16, cz + 1, W);
    for (let y = FY + 17; y <= FY + R.h - 1; y++) stPut(cx, y, cz, y % 3 === 0 ? O : B.PIPE);
    // the conduit along the ceiling to the funnel: first in x, then in z
    const ex = Math.round(RIFT.x - .5), ez = Math.round(RIFT.z - .5), sx = Math.sign(ex - cx) || 1, sz = Math.sign(ez - cz) || 1;
    for (let x = cx; x !== ex; x += sx) { stPut(x, FY + R.h - 1, cz, ((x >> 1) & 1) ? O : B.PIPE); stPut(x, FY + R.h - 2, cz, B.HULL); }
    for (let z = cz; z !== ez; z += sz) { stPut(ex, FY + R.h - 1, z, ((z >> 1) & 1) ? O : B.PIPE); stPut(ex, FY + R.h - 2, z, B.HULL); }
  }
  // ---- the funnel: a ring of blue light in the ceiling that narrows toward the Rift
  for (let k = 0; k <= 6; k++) stDisc(RIFT.x, RIFT.z, k === 6 ? 0 : 5 - k * .7 - .9, 5.4 - k * .7, FY + R.h - k, k % 2 ? O : B.HULL);
  for (let y = FY + R.h - 7; y >= FY + R.h - 10; y--) stDisc(RIFT.x, RIFT.z, 0, 1.2, y, y % 2 ? W : O);
  // ---- two great conduits out through the side walls: the power going up into the ship
  for (const sx of [-1, 1]) for (let x = 7; x <= R.x1; x++) for (const dz of [-1, 0, 1]) stPut(sx * x, FY + R.h - 5, Math.round(RIFT.z - .5) + dz, x % 3 === 0 ? O : B.PIPE);
  // ---- capacitor banks and monitor walls
  for (const sx of [-1, 1]) for (const z of [-20, -10, 10, 20]) { const x = sx * 33; stBox(x - 1, FY + 1, z - 2, x + 1, FY + 9, z + 2, B.HULL); for (let y = FY + 2; y <= FY + 8; y++) { stPut(x - sx * 2, y, z - 1, y % 2 ? O : NEO('CYAN')); stPut(x - sx * 2, y, z + 1, y % 2 ? NEO('CYAN') : O); } stBox(x - 1, FY + 10, z - 1, x + 1, FY + 10, z + 1, W); }
  stBank(-18, FY + 3, R.z1 - 1, 'x', 36, 8, 3, 0);
  stBank(-18, FY + 3, R.z0 + 1, 'x', 36, 8, 2, 1);
  // ---- the Rift Stabilizer console, before the tear
  stConsole(Math.floor(RIFT.console.x), Math.floor(RIFT.console.z), 'n', O, NEO('LIME'), FY - SD, 3, 'quad');
}
// ---- the hexagon lift: a shaft from the bridge floor, down through the hangar, into the reactor ceiling, with a red-button pedestal at each end
function stLift() {
  const cx = LIFT.cx, cz = LIFT.cz, top = SD, bot = FY + RC.h;
  for (let y = bot; y <= top; y++) for (let z = Math.floor(cz - 6); z <= cz + 6; z++) for (let x = Math.floor(cx - 6); x <= cx + 6; x++) {
    const h = hexD(x + .5 - cx, z + .5 - cz);
    if (h < 3) stPut(x, y, z, 0);
    else if (h < 4.2 && y < top) stPut(x, y, z, (y % 4 === 0) ? NEO('SKY') : (h < 3.8 ? B.TECH : B.HULL));
  }
  for (let z = Math.floor(cz - 6); z <= cz + 6; z++) for (let x = Math.floor(cx - 6); x <= cx + 6; x++) {          // the lit rings round the hole at the top and the pad at the bottom
    const h = hexD(x + .5 - cx, z + .5 - cz);
    if (h >= 3 && h < 4.2) { stPut(x, top, z, h < 3.6 ? ((x + z) & 1 ? B.HAZ : B.TECH) : NEO('BLOOD')); stPut(x, FY, z, h < 3.6 ? NEO('SKY') : B.TECH); }
    if (h < 3) stPut(x, FY, z, ((x + z) & 1) ? NEO('SKY') : B.TECH);
  }
  const btn = (b, y0) => { const x = Math.floor(b.x), z = Math.floor(b.z);                                 // a big red button on a pedestal
    stBox(x - 1, y0 + 1, z - 1, x + 1, y0 + 1, z + 1, B.HULL); stBox(x, y0 + 2, z, x, y0 + 2, z, B.HULL); stBox(x - 1, y0 + 3, z - 1, x + 1, y0 + 3, z + 1, B.TECH);
    stBox(x, y0 + 4, z, x, y0 + 4, z, NEO('BLOOD')); for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) stPut(x + dx, y0 + 4, z + dz, B.HAZ); };
  btn(LIFT.topBtn, SD); btn(LIFT.botBtn, FY);
}
function stRiftBay() { stCore(); }

// ---------------- the lift ride ----------------
const Lift = {
  on: false, t: 0, dir: 'down', open: 0, doorT: 0,
  nearTop() { return mode === 'hub' && OW.gen === 3 && !this.on && state === 'play' && Math.hypot(P.x - LIFT.topBtn.x, P.z - LIFT.topBtn.z) < 3.4 && Math.abs(P.y - (SD + 1)) < 3; },
  nearBot() { return mode === 'hub' && OW.gen === 3 && !this.on && state === 'play' && Math.hypot(P.x - LIFT.botBtn.x, P.z - LIFT.botBtn.z) < 3.4 && Math.abs(P.y - (FY + 1)) < 3; },
  near() { return this.nearTop() || this.nearBot(); },
  press() {
    if (!this.near()) return; this.dir = this.nearTop() ? 'down' : 'up'; this.on = true; this.t = 0; this.from = [P.x, P.y, P.z]; P.vx = P.vy = P.vz = 0;
    try { SFX.slam && SFX.slam(); tone(160, .5, 'square', .1, -60); } catch (e) { }
  },
  total() { return this.dir === 'down' ? 5.6 : 5.9; },
  tick(dt) {
    if (!(useChunks && OW.gen === 3 && mode === 'hub' && P.alive)) { this.on = false; this.open = 0; return; }
    const o = this.open;
    if (!this.on) { this.open = Math.max(0, o - dt * .9); return; }
    this.t += dt; const t = this.t, T = this.total(), down = this.dir === 'down';
    const yTop = SD + 1.001, yBot = FY + 1.001, cx = LIFT.cx, cz = LIFT.cz;
    if (down) {
      this.open = clamp(t / 1.0, 0, 1) * (t < 2.4 ? 1 : 1 - clamp((t - 2.4) / 1.0, 0, 1));
      const w = clamp(t / 1.0, 0, 1), k = ease(w);                                                      // walk onto the middle of the hex while it opens
      if (t < 1.4) { P.x = lerp(this.from[0], cx, k); P.z = lerp(this.from[2], cz, k); P.y = yTop; }
      else { const s = clamp((t - 1.4) / 3.4, 0, 1), f = s < .8 ? Math.pow(s / .8, 1.8) * .85 : .85 + .15 * ease((s - .8) / .2); P.x = cx; P.z = cz; P.y = lerp(yTop, yBot, f); }
      if (t >= 1.4 && t < 4.8) P.fovPunch = Math.min(.12, (P.fovPunch || 0) + dt * .12);
    } else {
      const s = clamp((t - .9) / 3.6, 0, 1), f = s < .2 ? ease(s / .2) * .15 : .15 + .85 * ease((s - .2) / .8);
      if (t < .9) { const k = ease(clamp(t / .9, 0, 1)); P.x = lerp(this.from[0], cx, k); P.z = lerp(this.from[2], cz, k); P.y = yBot; }
      else { P.x = cx; P.z = cz; P.y = lerp(yBot, yTop, f); }
      this.open = t < 4.9 ? clamp((t - 3.6) / .8, 0, 1) : Math.max(0, 1 - (t - 4.9) / .8);
      if (t > 4.5) { P.x = lerp(cx, cx + 4.9, ease(clamp((t - 4.5) / .9, 0, 1))); P.z = cz; P.y = yTop; }                  // step off the hatch before it shuts
      if (t >= .9 && t < 4.5) P.fovPunch = Math.min(.12, (P.fovPunch || 0) + dt * .12);
    }
    P.vx = P.vy = P.vz = 0; P.onGround = true; P.dashT = 0;
    if (t >= T) { this.on = false; P.fovPunch = 0; P.y = down ? yBot : yTop; P.vx = P.vy = P.vz = 0; if (!down) { P.x = cx + 4.9; P.z = cz; } try { SFX.charged && SFX.charged(); } catch (e) { } }
  },
  topSolid() { return this.open < .35; }                                                                // the iris door is a floor while it is shut
};
function liftDoorHit(x, y, z, hw, h) {
  if (!Lift.topSolid() || y + h <= SD + .5 || y >= SD + 1) return false;
  return hexD(x - LIFT.cx, z - LIFT.cz) < 3.1 + hw;
}
// the iris: six triangular leaves that slide out and down under the floor
function drawCoreProps(t) {
  if (OW.gen !== 3 || mode !== 'hub') return;
  const cx = LIFT.cx, cz = LIFT.cz, o = Lift.open;
  if (camY > SD - 6 && Math.hypot(camX - cx, camZ - cz) < 70) {
    const RC_ = 3.1 / .8660254, p = .5 + .5 * Math.sin(t * 5);
    for (let k = 0; k < 6; k++) {
      const a0 = k * Math.PI / 3, a1 = a0 + Math.PI / 3, am = (a0 + a1) / 2, sl = o * 3.6, dy = -o * 1.1;
      const ox = Math.cos(am) * sl, oz = Math.sin(am) * sl, y = SD + 1.02 + dy;
      if (y < SD - .2) continue;
      const v = [[cx + ox, y, cz + oz], [cx + ox + Math.cos(a0) * RC_, y, cz + oz + Math.sin(a0) * RC_], [cx + ox + Math.cos(a1) * RC_, y, cz + oz + Math.sin(a1) * RC_]];
      const sh = .18 + .06 * (k & 1); pushPoly(v, 0, 1, 0, sh, sh + .03, sh + .06, false, 0);
      for (let e = 0; e < 3; e++) { const u = v[1 + e % 2], w = v[1 + (e + 1) % 2]; if (e === 2) continue; }
      const f = Lift.on ? 1 : .5 + .5 * p; pushBeam(v[1][0], y + .03, v[1][2], v[2][0], y + .03, v[2][2], .09, [1, .12 * f, .1 * f], 0);
    }
  }
}
// the holo elevator in the shaft: rushing hex rings and a column of light, drawn translucent; and the Rift's power pulses along the conduits
function drawCoreGlass(t) {
  if (OW.gen !== 3 || mode !== 'hub') return;
  const cx = LIFT.cx, cz = LIFT.cz, o = Lift.open, act = Lift.on ? 1 : o;
  if (act > .01 && camZ < 30 && camX < 10) {
    const top = SD + .5, bot = FY + 1, RC_ = 2.8 / .8660254, n = 26;
    for (let i = 0; i < n; i++) {
      const sp = Lift.on ? (Lift.dir === 'down' ? -1 : 1) : 0, ph = ((i / n + t * .8 * sp * (Lift.on ? 1 : 0)) % 1 + 1) % 1, y = lerp(bot, top, ph);
      const fade = Math.sin(ph * Math.PI) * act, c = [.2 * fade, .75 * fade, 1 * fade];
      for (let k = 0; k < 6; k++) { const a0 = k * Math.PI / 3, a1 = a0 + Math.PI / 3; pushBeam(cx + Math.cos(a0) * RC_, y, cz + Math.sin(a0) * RC_, cx + Math.cos(a1) * RC_, y, cz + Math.sin(a1) * RC_, .12, c, 0); }
    }
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3, x = cx + Math.cos(a) * RC_ * .98, z = cz + Math.sin(a) * RC_ * .98; pushBeam(x, bot, z, x, top, z, .1, [.15 * act, .6 * act, 1 * act], 0); }
    pushBox(cx, (top + bot) / 2, cz, 4.6, top - bot, 4.6, .02 * act, .12 * act, .2 * act, null, false, 0);
    if (Lift.on) {                                                                                      // the holo platform under your feet
      const py = P.y - .15; for (let k = 0; k < 6; k++) { const a0 = k * Math.PI / 3, a1 = a0 + Math.PI / 3; pushBeam(cx + Math.cos(a0) * 2.2, py, cz + Math.sin(a0) * 2.2, cx + Math.cos(a1) * 2.2, py, cz + Math.sin(a1) * 2.2, .16, [.5, .95, 1], 0); }
      pushBox(cx, py - .02, cz, 3.8, .05, 3.8, .1, .5, .8, null, false, 0);
    }
    flushDynAdd(.9);
  }
  if (camY < SD - 20 || Math.hypot(camX - RIFT.x, camZ - RIFT.z) < 60 && camY < FY + 40) {
    if (camY > FY + 30) return;
    const I = Rift.intensity(), speed = .35 + .9 * I;                                                    // pulses of power running up each mast, along the ceiling, into the funnel
    for (let ci = 0; ci < RIFT.coils.length; ci++) {
      const c = RIFT.coils[ci], ex = RIFT.x, ez = RIFT.z, cy = FY + RC.h - 1.5;
      const L1 = cy - (FY + 17), L2 = Math.abs(ex - c[0]), L3 = Math.abs(ez - c[2]), L = L1 + L2 + L3;
      for (let k = 0; k < 4; k++) {
        let d = ((t * speed * 6 + k * L / 4 + ci * 3) % L); let x = c[0], y = FY + 17, z = c[2];
        if (d < L1) y += d; else { y = cy; d -= L1; if (d < L2) x += Math.sign(ex - c[0]) * d; else { x = ex; z += Math.sign(ez - c[2]) * (d - L2); } }
        pushBox(x, y, z, .7, .7, .7, .4 + .4 * I, .8, 1, null, false, 0);
      }
    }
    flushDynAdd(.9);
  }
}
