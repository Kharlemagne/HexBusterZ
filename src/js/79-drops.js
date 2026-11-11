// ============================================================
//  ITEM DROPS — breaking a block leaves a small spinning copy of it that falls, bobs, and is pulled into your backpack when you walk near.
//  Drops are local to the player who broke the block (each player has their own inventory). They vanish after 5 minutes or when you leave the world.
// ============================================================
const drops = [], DROP_S = .25, DROP_MERGE = 1.5;
const dropCopies = n => n > 48 ? 5 : n > 32 ? 4 : n > 16 ? 3 : n > 1 ? 2 : 1;                       // a stack is drawn as 2 to 5 copies huddled together
const DROP_OFF = [[0, 0, 0], [.09, .03, .07], [-.08, .06, .05], [.04, .09, -.09], [-.06, .12, -.05]];
function spawnDrop(x, y, z, k, n, vx, vy, vz) {
  for (const d of drops) if (d.k === k && d.age < 20 && Math.hypot(d.x - x, d.y - y, d.z - z) < DROP_MERGE && d.n + n <= STACK_MAX) { d.n += n; d.age = Math.min(d.age, .6); return; }      // merge into a nearby identical drop
  if (drops.length >= 160) drops.shift();
  drops.push({ k, n, x, y, z, vx: vx === undefined ? rnd(-1.6, 1.6) : vx, vy: vy === undefined ? rnd(2.5, 4.5) : vy, vz: vz === undefined ? rnd(-1.6, 1.6) : vz, hw: .125, h: .25, onGround: false, age: 0, t: rnd(10), fly: false });
}
let dropMergeT = 0;
function mergeDrops() {                                                     // identical drops lying within 1.5 blocks of each other become one
  for (let i = 0; i < drops.length; i++) { const a = drops[i]; if (!a.onGround || a.fly) continue;
    for (let j = drops.length - 1; j > i; j--) { const b = drops[j]; if (b.k !== a.k || !b.onGround || b.fly || a.n + b.n > STACK_MAX || Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) > DROP_MERGE) continue; a.n += b.n; a.age = Math.min(a.age, b.age); drops.splice(j, 1); } }
}
function updateDrops(dt) {
  dropMergeT -= dt; if (dropMergeT <= 0) { dropMergeT = .5; mergeDrops(); }
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i]; d.age += dt; d.t += dt;
    if (d.age > 300 || d.y < (OW.gen >= 2 ? HUB.voidY - 4 : -10)) { drops.splice(i, 1); continue; }
    const px = P.x - d.x, py = P.y + 1.0 - d.y, pz = P.z - d.z, dist = Math.hypot(px, py, pz) || 1e-6;                  // it flies to your chest
    const canTake = P.alive && d.age > .45 && Inv.canTake(d.k);
    const touch = Math.abs(px) < P.hw + 1 && Math.abs(pz) < P.hw + 1 && d.y + d.h > P.y - .5 && d.y < P.y + P.h + .5;   // your body's box, grown by 1 block sideways and half a block up and down
    d.fly = canTake && (touch || (d.fly && dist < 3));
    if (d.fly) { const sp = 9 + d.age * 0; d.vx = px / dist * sp; d.vy = py / dist * sp; d.vz = pz / dist * sp; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; d.onGround = false; }      // no collision on the way in: it never pushes or snags
    else { d.vy = Math.max(-30, d.vy - 25 * dt); moveBody(d, dt, d.hw, d.h); if (d.onGround) { d.vx *= Math.max(0, 1 - 8 * dt); d.vz *= Math.max(0, 1 - 8 * dt); } }
    if (d.fly && dist < .45) {
      const left = Inv.add(d.k, d.n);
      if (left < d.n) { tone(rnd(780, 980), .06, 'square', .07, 1700); }
      if (left <= 0) { drops.splice(i, 1); continue; } d.n = left; d.fly = false;
    }
  }
}
function drawDrops() {
  for (const d of drops) {
    if (d.age > 285 && ((d.age * 6) | 0) % 2) continue;                          // blink before despawning
    const bob = Math.sin(d.t * 2.6) * .06 + .2, R = rotY(d.t * 1.8), k = d.k, nC = dropCopies(d.n);
    if (!d.fly) { let gy = Math.floor(d.y + .05); for (let i = 0; i < 6 && !solid(Math.floor(d.x), gy, Math.floor(d.z)); i++) gy--;      // a soft round shadow on whatever is under it
      const sy = gy + 1.012, f = clamp(1 - (d.y - gy - 1) / 5, .25, 1), r = .15 * f; if (d.y - gy < 7) { pushBox(d.x, sy, d.z, r * 2, .004, r * 1.1, .015, .015, .02, null, false); pushBox(d.x, sy, d.z, r * 1.1, .004, r * 2, .015, .015, .02, null, false); pushBox(d.x, sy, d.z, r * 1.6, .005, r * 1.6, .015, .015, .02, null, false); } }
    if (typeof k === 'number') {
      const c = COL[k] || [.6, .6, .6], em = EMIT.has(k);
      for (let i = 0; i < nC; i++) { const o = DROP_OFF[i], sh = 1 - i * .06; pushBox(d.x + o[0], d.y + bob + o[1], d.z + o[2], DROP_S, DROP_S, DROP_S, c[0] * sh, c[1] * sh, c[2] * sh, R, em ? false : undefined, undefined, blockTile(k, false)); }
    } else {                                                                    // a flat item: its 16x16 picture pushed out into a slab 1/16 of a block thick
      const runs = itemRuns(k), S = .4 / 16, em = k === 'shard';
      for (let i = 0; i < Math.min(nC, 3); i++) { const o = DROP_OFF[i];
        for (const r of runs) { const lx = (r[0] + r[2] / 2 - 8) * S, ly = (8 - r[1] - .5) * S; pushBox(d.x + o[0] + R[0] * lx, d.y + bob + .05 + o[1] + ly, d.z + o[2] + R[6] * lx, r[2] * S, S, .0625, r[3], r[4], r[5], R, em ? false : undefined); } }
    }
  }
}
