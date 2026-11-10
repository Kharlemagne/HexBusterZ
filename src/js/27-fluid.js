// ---------------- fluid physics (Minecraft rules): LAVA and BLACK WATER ----------------
// Lava ids: 4 = source, 23..29 = flowing of strength 1..7 (id = 22 + strength), 30 = falling.
// Black water ids: 3600 = source, 3601..3607 = flowing of strength 1..7 (id = 3600 + strength), 3608 = falling.
//  * a fluid with fluid above it becomes a falling column;
//  * a fluid with something solid (or a pool of itself) under it spreads sideways and loses strength per block: LAVA loses 2 (a source reaches 3 blocks),
//    WATER loses 1 (a source reaches 7 blocks);
//  * a fluid with air under it flows DOWN instead (a source also still spreads sideways, like in Minecraft);
//  * a flowing block nobody feeds any more dries up, so removing a source or a block makes the flow retreat / refill;
//  * WATER makes new sources: a block with two water sources beside it and something solid (or a water source) under it becomes a source (the infinite-water trick);
//  * water touching a lava source turns it to OBSIDIAN, water touching flowing lava turns it to BASALT (our cobblestone).
// Only the host (or a solo player) simulates; guests receive the resulting block changes in one batched 'fl' message per tick.
const OBSIDIAN = 3, BASALT_COBBLE = 1;
const Fluid = {
  q: new Set(), acc: 0, TICK: .2, MAXC: 280, batch: null, steps: 0,
  key(x, y, z) { return ((x + 40000) * 80000 + (z + 40000)) * 512 + y; },
  reset() { this.q.clear(); this.acc = 0; this.batch = null; },
  kind(id) { return id === 4 || (id >= 23 && id <= 30) ? 1 : id >= 3600 && id <= 3608 ? 2 : 0; },     // 1 lava, 2 water
  isSrc(id) { return id === 4 || id === 3600; },
  isFlow(id) { return (id >= 23 && id <= 30) || (id >= 3601 && id <= 3608); },
  strength(id) { return id === 4 || id === 30 || id === 3600 || id === 3608 ? 7 : id >= 23 && id <= 29 ? id - 22 : id >= 3601 && id <= 3607 ? id - 3600 : 0; },
  flowId(k, s) { return k === 1 ? 22 + s : 3600 + s; }, fallId(k) { return k === 1 ? 30 : 3608; },
  hole(x, y, z, k) { const b = get(x, y - 1, z); return b === 0 || (this.kind(b) === k && !this.isSrc(b)); },   // air, or the same fluid (not a source) below: this block can still pour down
  touch(x, y, z, id, old) {                                                                         // a block changed: wake the fluids around it
    if (Net.role === 'client' || !useChunks) return;
    let near = isLiquid(id) || isLiquid(old);
    if (!near) for (const [dx, dy, dz] of D6) if (isLiquid(get(x + dx, y + dy, z + dz))) { near = true; break; }
    if (!near || this.q.size > 30000) return;
    this.q.add(this.key(x, y, z)); for (const [dx, dy, dz] of D6) this.q.add(this.key(x + dx, y + dy, z + dz));
  },
  waterTouch(x, y, z) { for (const [dx, dy, dz] of D6) if (isWater(get(x + dx, y + dy, z + dz))) return true; return false; },
  // what should the (air or flowing) block at x,y,z be right now? returns the id, or -1 to leave it alone
  want(x, y, z) {
    if (y < 1 || y >= H) return -1;
    const cur = get(x, y, z); if (cur !== 0 && !this.isFlow(cur)) return -1;
    const up = get(x, y + 1, z), ku = this.kind(up);
    if (ku) { const t = this.fallId(ku); return cur === t ? -1 : t; }
    let bestL = 0, bestW = 0, srcW = 0;
    for (const [dx, , dz] of D6H) {
      const nx = x + dx, nz = z + dz, n = get(nx, y, nz), k = this.kind(n); if (!k) continue;
      const s = this.strength(n) - (k === 1 ? 2 : 1);
      if (k === 2 && n === 3600) srcW++;
      if (s <= (k === 1 ? bestL : bestW)) continue;
      if (this.isSrc(n) || !this.hole(nx, y, nz, k)) { if (k === 1) bestL = s; else bestW = s; }
    }
    if (srcW >= 2) { const b = get(x, y - 1, z); if ((b !== 0 && !isLiquid(b)) || b === 3600) return cur === 3600 ? -1 : 3600; }   // two sources beside it: a new source
    const k = bestW > 0 && bestW >= bestL ? 2 : bestL > 0 ? 1 : 0, best = k === 2 ? bestW : bestL;
    const t = best > 0 ? this.flowId(k, best) : 0; return t === cur ? -1 : t;
  },
  eval(x, y, z) {
    const c0 = get(x, y, z);
    if (isLava(c0) && this.waterTouch(x, y, z)) { setBlock(x, y, z, c0 === 4 ? OBSIDIAN : BASALT_COBBLE); this.steps++; return; }   // water meets lava
    for (let n = 0; n < 8; n++) {                                                                   // a falling column drops several blocks in one tick
      const t = this.want(x, y, z); if (t < 0) return;
      setBlock(x, y, z, t); this.steps++; if ((t === 30 || t === 3608) && get(x, y - 1, z) === 0) y--; else return;
    }
  },
  tick(dt) {
    if (!useChunks || Net.role === 'client' || !OW.active || !this.q.size) { return; }
    this.acc += dt; if (this.acc < this.TICK) return; this.acc = Math.min(this.acc - this.TICK, this.TICK);
    const todo = []; for (const k of this.q) { todo.push(k); if (todo.length >= this.MAXC) break; } for (const k of todo) this.q.delete(k);
    this.batch = [];
    for (const k of todo) {
      const y = k % 512, r = (k - y) / 512, z0 = r % 80000, x = (r - z0) / 80000 - 40000, z = z0 - 40000;
      this.eval(x, y, z); for (const [dx, dy, dz] of D6) this.eval(x + dx, y + dy, z + dz);
    }
    const b = this.batch; this.batch = null;
    if (b.length && Net.role === 'host') Net.broadcast('fl', b);
  }
};
const D6 = [[0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0]], D6H = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
blockListeners.push((x, y, z, id, old) => Fluid.touch(x, y, z, id, old));
