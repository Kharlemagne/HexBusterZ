// ============================================================
//  OPEN WORLD STORE — Minecraft-style streamed chunks (16 x 16 columns, WORLD_H tall).
//  * The world is described by a seed (see 25-overworld-gen.js); chunks are generated when you get near and dropped when you leave.
//  * Only what players CHANGE is stored (OW.edits, saved by WorldSave in 49-save.js) and re-applied whenever a chunk is generated again.
//  * Dungeons still use the old fixed arrays (`useChunks` = false there).
// ============================================================
const OW = {
  seed: 1, villageSeed: 1, chunks: new Map(), edits: new Map(),
  lcx: 1e9, lcz: 1e9, lch: null,
  LOAD: 7, KEEP: 9,
  stamp: null, stampSeed: -1, returnTo: null, active: false, gen: 1,
  get(x, y, z) {
    if (y < 0) return 3; if (y >= H) return 0;
    const cx = x >> 4, cz = z >> 4; let ch;
    if (cx === this.lcx && cz === this.lcz) ch = this.lch; else { ch = this.chunks.get(ckey(cx, cz)); this.lcx = cx; this.lcz = cz; this.lch = ch; }
    return ch ? ch.b[(x & 15) | ((z & 15) << 4) | (y << 8)] : 3;           // not loaded yet = solid, so nothing walks off the edge of the loaded map
  },
  set(x, y, z, id) {                                                    // returns the old block, -1 if that chunk isn't loaded
    const ch = this.chunks.get(ckey(x >> 4, z >> 4)); if (!ch) return -1;
    const li = (x & 15) | ((z & 15) << 4) | (y << 8), old = ch.b[li]; ch.b[li] = id; if (ch.blood) ch.blood[li] = 0; if (id && y > ch.top) ch.top = y;
    return old;
  },
  has(cx, cz) { return this.chunks.has(ckey(cx, cz)); },
  ensure(cx, cz) {
    const key = ckey(cx, cz); if (this.chunks.has(key)) return;
    const b = OWG.gen(cx, cz); let top = 0;
    for (let y = WORLD_H - 1; y > 0 && !top; y--) { const o = y << 8; for (let i = 0; i < 256; i++) if (b[o + i]) { top = y; break; } }
    const ch = { cx, cz, b, top, blood: null, age: 0 };
    const em = this.edits.get(key);
    if (em) for (const [li, e] of em) { if (e.orig === -1) e.orig = b[li]; b[li] = e.id; const y = li >> 8; if (e.id && y > ch.top) ch.top = y; }
    this.chunks.set(key, ch); this.lch = null; this.lcx = 1e9;
    for (const [a, c] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (this.chunks.has(ckey(cx + a, cz + c))) dirty.add(ckey(cx + a, cz + c));
  },
  unload(key) { this.chunks.delete(key); freeMesh(key); dirty.delete(key); this.lch = null; this.lcx = 1e9; },
  drop() { for (const k of [...this.chunks.keys()]) freeMesh(k); this.chunks.clear(); dirty.clear(); this.lch = null; this.lcx = 1e9; this.active = false; },
  // keep a disc of chunks loaded around every given centre ({x,z}), nearest first; `budget` = how many to generate this frame
  update(centers, ms) {                                                  // ms = time budget for generating chunks this frame
    const cc = centers.map(c => ({ cx: Math.floor(c.x / CS), cz: Math.floor(c.z / CS) }));
    for (const [k, ch] of this.chunks) { let near = false; for (const c of cc) if (Math.abs(ch.cx - c.cx) <= this.KEEP && Math.abs(ch.cz - c.cz) <= this.KEEP) { near = true; break; } if (!near) this.unload(k); }
    const want = [], R = this.LOAD;
    for (const c of cc) for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) { const d = dx * dx + dz * dz; if (d <= R * R + R && !this.has(c.cx + dx, c.cz + dz)) want.push([d, c.cx + dx, c.cz + dz]); }
    want.sort((a, b) => a[0] - b[0]);
    const t0 = performance.now(); let n = 0;
    for (const [, cx, cz] of want) { if (n++ > 0 && performance.now() - t0 > ms) break; this.ensure(cx, cz); }
  },
  // mesh a few dirty chunks per frame; a chunk waits for its 4 neighbours (so border faces are right) unless it has waited a while
  pump(ms) {
    const t0 = performance.now(); let n = 0;
    for (const k of dirty) {
      if (n > 0 && performance.now() - t0 > ms) break;
      const cx = ckx(k), cz = ckz(k), ch = this.chunks.get(k); if (!ch) { dirty.delete(k); continue; }
      const ready = this.has(cx + 1, cz) && this.has(cx - 1, cz) && this.has(cx, cz + 1) && this.has(cx, cz - 1);
      if (!ready && ++ch.age < 40) continue;
      dirty.delete(k); buildChunk(cx, cz); n++;
    }
  },
  // start (or restart) the open world around a spawn point; loads the first chunks synchronously so the player never spawns in the void
  begin(sx, sz, seed, villageSeed, editsList, gen) {
    this.drop(); if (typeof Fluid !== 'undefined') Fluid.reset(); this.seed = seed >>> 0; this.villageSeed = villageSeed >>> 0; OWG.S = this.seed | 0; this.gen = gen === 2 ? 2 : 1;
    if (this.gen === 1) this.ensureStamp(); useChunks = true; H = WORLD_H; N = 64; this.configure();
    WorldSave.load(editsList || []);
    const cx = Math.floor(sx / CS), cz = Math.floor(sz / CS);
    for (let dz = -4; dz <= 4; dz++) for (let dx = -4; dx <= 4; dx++) this.ensure(cx + dx, cz + dz);
    buildAll(); this.active = true;
  },
  configure() {                                                       // where the smith stands depends on the generation
    if (this.gen === 2) Object.assign(NPC, { x: CAR_NPC.x, y: CAR.deck + 1.01, z: CAR_NPC.z }); else Object.assign(NPC, { x: 22.5, y: 9.01, z: 40.5 });
  },
  ensureStamp() {                                                       // the village is built once into the old fixed array, then copied out
    if (this.stamp && this.stampSeed === this.villageSeed) return;
    const keep = [useChunks, H, N]; useChunks = false; H = FIXED_H;
    genVillage(this.villageSeed); this.stamp = world.slice(0, 64 * 64 * FIXED_H); this.stampSeed = this.villageSeed; world.fill(0, 0, 64 * 64 * FIXED_H);
    [useChunks, H, N] = keep;
  }
};
