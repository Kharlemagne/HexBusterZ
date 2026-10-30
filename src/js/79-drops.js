// ============================================================
//  ITEM DROPS — breaking a block leaves a small spinning copy of it that falls, bobs, and is pulled into your backpack when you walk near.
//  Drops are local to the player who broke the block (each player has their own inventory). They vanish after 5 minutes or when you leave the world.
// ============================================================
const drops = [];
function spawnDrop(x, y, z, k, n, vx, vy, vz) {
  for (const d of drops) if (d.k === k && d.age < 20 && Math.hypot(d.x - x, d.y - y, d.z - z) < 1.1 && d.n + n <= STACK_MAX) { d.n += n; d.age = Math.min(d.age, .6); return; }      // merge into a nearby identical drop
  if (drops.length >= 160) drops.shift();
  drops.push({ k, n, x, y, z, vx: vx === undefined ? rnd(-1.6, 1.6) : vx, vy: vy === undefined ? rnd(2.5, 4.5) : vy, vz: vz === undefined ? rnd(-1.6, 1.6) : vz, hw: .13, h: .26, onGround: false, age: 0, t: rnd(10) });
}
function updateDrops(dt) {
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i]; d.age += dt; d.t += dt;
    if (d.age > 300 || d.y < (OW.gen >= 2 ? HUB.voidY - 4 : -10)) { drops.splice(i, 1); continue; }
    const px = P.x - d.x, py = P.y + .8 - d.y, pz = P.z - d.z, dist = Math.hypot(px, py, pz);
    const canTake = P.alive && d.age > .45 && Inv.canTake(d.k);
    if (canTake && dist < 3.4) {                                                  // magnet: accelerate toward the player
      const pull = (1 - dist / 3.4) * 26 + 4; d.vx += px / dist * pull * dt; d.vy += py / dist * pull * dt; d.vz += pz / dist * pull * dt;
      const s = Math.hypot(d.vx, d.vy, d.vz); if (s > 11) { d.vx *= 11 / s; d.vy *= 11 / s; d.vz *= 11 / s; }
    } else d.vy = Math.max(-30, d.vy - 25 * dt);
    moveBody(d, dt, d.hw, d.h);
    if (d.onGround) { d.vx *= Math.max(0, 1 - 8 * dt); d.vz *= Math.max(0, 1 - 8 * dt); }
    if (canTake && dist < 1.05) {
      const left = Inv.add(d.k, d.n);
      if (left < d.n) { tone(rnd(780, 980), .06, 'square', .07, 1700); }
      if (left <= 0) { drops.splice(i, 1); continue; } d.n = left;
    }
  }
}
function drawDrops() {
  for (const d of drops) {
    if (d.age > 285 && ((d.age * 6) | 0) % 2) continue;                          // blink before despawning
    const bob = Math.sin(d.t * 3) * .05 + .16, R = rotY(d.t * 1.8), k = d.k;
    if (typeof k === 'number') {
      const c = COL[k] || [.6, .6, .6], em = EMIT.has(k);
      pushBox(d.x, d.y + bob + .1, d.z, .27, .27, .27, c[0], c[1], c[2], R, em ? false : undefined, undefined, blockTile(k, false));
      if (d.n > 1) pushBox(d.x + .09, d.y + bob + .06, d.z + .08, .22, .22, .22, c[0] * .9, c[1] * .9, c[2] * .9, R, em ? false : undefined, undefined, blockTile(k, false));
    } else { const it = ITEMS[k]; const col = it ? hx(parseInt(it.color.slice(1), 16)) : [1, 1, 1]; pushBox(d.x, d.y + bob + .12, d.z, .2, .2, .2, col[0], col[1], col[2], mulR(R, rotX(.78)), false, undefined, TILE.GLOW); }
  }
}
