// ---------------- lava physics (Minecraft rules) ----------------
// Block ids: 4 = source, 23..29 = flowing lava of strength 1..7 (id = 22 + strength), 30 = falling lava.
//  * lava with lava above it becomes a falling column;
//  * lava that has something solid (or a lava pool) under it spreads sideways and loses 2 strength per block, so a source reaches 3 blocks;
//  * lava with air under it flows DOWN instead (a source also still spreads sideways, like in Minecraft);
//  * a flowing block nobody feeds any more dries up, so removing a source or a block makes the flow retreat / refill.
// Only the host (or a solo player) simulates; guests receive the resulting block changes in one batched 'fl' message per tick.
const Fluid = {
  q: new Set(), acc: 0, TICK: .2, MAXC: 280, batch: null, steps: 0,
  key(x, y, z) { return ((x + 40000) * 80000 + (z + 40000)) * 256 + y; },
  reset() { this.q.clear(); this.acc = 0; this.batch = null; },
  strength(id) { return id === 4 || id === 30 ? 7 : id >= 23 && id <= 29 ? id - 22 : 0; },
  hole(x, y, z) { const b = get(x, y - 1, z); return b === 0 || (isLava(b) && b !== 4); },        // lava below that can still take this lava, or air
  touch(x, y, z, id, old) {                                                                         // a block changed: wake the lava around it
    if (Net.role === 'client' || !useChunks) return;
    let near = isLava(id) || isLava(old);
    if (!near) for (const [dx, dy, dz] of D6) if (isLava(get(x + dx, y + dy, z + dz))) { near = true; break; }
    if (!near || this.q.size > 30000) return;
    this.q.add(this.key(x, y, z)); for (const [dx, dy, dz] of D6) this.q.add(this.key(x + dx, y + dy, z + dz));
  },
  // what should the (air or flowing-lava) block at x,y,z be right now? returns the id, or -1 to leave it alone
  want(x, y, z) {
    if (y < 1 || y >= H) return -1;
    const cur = get(x, y, z); if (cur !== 0 && !(cur >= 23 && cur <= 30)) return -1;
    if (isLava(get(x, y + 1, z))) return cur === 30 ? -1 : 30;
    let best = 0;
    for (const [dx, , dz] of D6H) {
      const nx = x + dx, nz = z + dz, n = get(nx, y, nz); if (!isLava(n)) continue;
      const s = this.strength(n) - 2; if (s <= best) continue;
      if (n === 4 || !this.hole(nx, y, nz)) best = s;
    }
    const t = best > 0 ? 22 + best : 0; return t === cur ? -1 : t;
  },
  eval(x, y, z) {
    for (let n = 0; n < 8; n++) {                                                                   // a falling column drops several blocks in one tick
      const t = this.want(x, y, z); if (t < 0) return;
      setBlock(x, y, z, t); this.steps++; if (t === 30 && get(x, y - 1, z) === 0) y--; else return;
    }
  },
  tick(dt) {
    if (!useChunks || Net.role === 'client' || !OW.active || !this.q.size) { return; }
    this.acc += dt; if (this.acc < this.TICK) return; this.acc = Math.min(this.acc - this.TICK, this.TICK);
    const todo = []; for (const k of this.q) { todo.push(k); if (todo.length >= this.MAXC) break; } for (const k of todo) this.q.delete(k);
    this.batch = [];
    for (const k of todo) {
      const y = k % 256, r = (k - y) / 256, z0 = r % 80000, x = (r - z0) / 80000 - 40000, z = z0 - 40000;
      this.eval(x, y, z); for (const [dx, dy, dz] of D6) this.eval(x + dx, y + dy, z + dz);
    }
    const b = this.batch; this.batch = null;
    if (b.length && Net.role === 'host') Net.broadcast('fl', b);
  }
};
const D6 = [[0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0]], D6H = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
blockListeners.push((x, y, z, id, old) => Fluid.touch(x, y, z, id, old));
