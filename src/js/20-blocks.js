// ============================================================
//  THE BLOCK REGISTRY — materials x shapes.
//  A MATERIAL (a "base" block: colour, light, texture) is defined once; its SHAPES (slab, stairs, vertical slab, wall, pillar, beam, fence, pane)
//  are generated, so adding one material adds a whole building kit. Block ids are 16-bit (chunks are Uint16Array).
//  Id map (NEVER renumber — saved worlds store ids):
//    0..47        classic blocks (1-22), lava (4, 23-30), city blocks 32..47
//    48..63 / 64..79   bottom / top slabs of 32..47        80..143 stairs of 32..47 (4 directions)      144..148 neon rails
//    256..        materials added in data/blocks.json "materials" (append only)
//    1024 + i*16 + slot   the generated shapes of the i-th entry of SHAPABLE (append only), slot: 0 slab, 1 top slab, 2-5 stairs, 6-9 vertical slab, 10 wall, 11 pillar, 12/13 beam x/z, 14 fence, 15 pane
// ============================================================
const K = { FULL: 0, SLAB_B: 1, SLAB_T: 2, STAIR: 3, VSLAB: 4, WALL: 5, PILLAR: 6, BEAMX: 7, BEAMZ: 8, FENCE: 9, PANE: 10, RAIL: 11 };
const SHAPE_NAMES = ['FULL BLOCK', 'SLAB', 'STAIRS', 'VERTICAL SLAB', 'WALL', 'PILLAR', 'BEAM', 'FENCE', 'PANE'];      // what the player cycles through (V)
const MAT0 = 256, MATS = DATA.blocks.materials || [], REG_N = 4096;
const BASE = new Uint16Array(REG_N), KIND = new Uint8Array(REG_N), DIR = new Uint8Array(REG_N), SHAPABLE = [], SHAPE_IDX = new Int16Array(REG_N).fill(-1);
const RAIL_BASE = [14, 15, 41, 42, 43];
for (let i = 0; i < 48; i++) BASE[i] = i;
for (let i = 0; i < MATS.length; i++) BASE[MAT0 + i] = MAT0 + i;
for (let b of [1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]) SHAPABLE.push(b);
for (let b = 32; b < 48; b++) SHAPABLE.push(b);
for (let i = 0; i < MATS.length; i++) SHAPABLE.push(MAT0 + i);
SHAPABLE.forEach((b, i) => { SHAPE_IDX[b] = i; });
(function () {
  const slotKind = [K.SLAB_B, K.SLAB_T, K.STAIR, K.STAIR, K.STAIR, K.STAIR, K.VSLAB, K.VSLAB, K.VSLAB, K.VSLAB, K.WALL, K.PILLAR, K.BEAMX, K.BEAMZ, K.FENCE, K.PANE];
  SHAPABLE.forEach((b, i) => { for (let s = 0; s < 16; s++) { const id = 1024 + i * 16 + s; BASE[id] = b; KIND[id] = slotKind[s]; DIR[id] = s >= 2 && s <= 5 ? s - 2 : s >= 6 && s <= 9 ? s - 6 : 0; } });
  for (let i = 0; i < 16; i++) { BASE[48 + i] = BASE[64 + i] = 32 + i; KIND[48 + i] = K.SLAB_B; KIND[64 + i] = K.SLAB_T; }                 // the first slabs and stairs keep their original ids
  for (let i = 80; i < 144; i++) { BASE[i] = 32 + ((i - 80) >> 2); KIND[i] = K.STAIR; DIR[i] = (i - 80) & 3; }
  for (let i = 0; i < 5; i++) { BASE[144 + i] = RAIL_BASE[i]; KIND[144 + i] = K.RAIL; }
})();
// the id of material `base` made into shape `kind` (dir for stairs / vertical slabs); falls back to the full block when the material has no such shape
function blockId(base, kind, dir = 0) {
  if (!kind || SHAPE_IDX[base] < 0) return base;
  if (base >= 32 && base < 48) { if (kind === K.SLAB_B) return base + 16; if (kind === K.SLAB_T) return base + 32; if (kind === K.STAIR) return 80 + (base - 32) * 4 + dir; }
  const slot = kind === K.SLAB_B ? 0 : kind === K.SLAB_T ? 1 : kind === K.STAIR ? 2 + dir : kind === K.VSLAB ? 6 + dir : kind === K.WALL ? 10 : kind === K.PILLAR ? 11 : kind === K.BEAMX ? 12 : kind === K.BEAMZ ? 13 : kind === K.FENCE ? 14 : kind === K.PANE ? 15 : -1;
  return slot < 0 ? base : 1024 + SHAPE_IDX[base] * 16 + slot;
}
const baseOf = i => BASE[i], kindOf = i => KIND[i];
const stairKind = i => KIND[i] === K.STAIR, isRail = i => KIND[i] === K.RAIL;
const slabKind = i => { const k = KIND[i]; return k < 3 ? k : 3; };            // 0 = full block, 1 = bottom half, 2 = top half, 3 = any other partial shape (own boxes)
const isConn = i => { const k = KIND[i]; return k === K.WALL || k === K.FENCE || k === K.PANE || k === K.RAIL; };      // joins up with its neighbours like a fence
const stairDir = i => DIR[i];
const slabBase = baseOf, stairBase = baseOf;
// the player's chosen shape for the block in hand (cycled with V): 0 full, 1 slab, 2 stairs, 3 vertical slab, 4 wall, 5 pillar, 6 beam, 7 fence, 8 pane
function shapeId(base, shape, look, hit) {
  if (SHAPE_IDX[base] < 0) return base;
  const dir4 = Math.abs(look[0]) > Math.abs(look[2]) ? (look[0] > 0 ? 0 : 1) : (look[2] > 0 ? 2 : 3);
  switch (shape) {
    case 1: return blockId(base, hit.top ? K.SLAB_T : K.SLAB_B);
    case 2: return blockId(base, K.STAIR, dir4);
    case 3: return blockId(base, K.VSLAB, dir4);
    case 4: return blockId(base, K.WALL); case 5: return blockId(base, K.PILLAR);
    case 6: return blockId(base, Math.abs(look[0]) > Math.abs(look[2]) ? K.BEAMX : K.BEAMZ);
    case 7: return blockId(base, K.FENCE); case 8: return blockId(base, K.PANE);
    default: return base;
  }
}
// the boxes (relative to the cell, 0..1) that make up a partial block; `mesh` = how it is drawn (arms are thin bars), otherwise how it collides (arms are solid)
function partBoxes(id, x, y, z, mesh) {
  const k = KIND[id], d = DIR[id];
  if (k === K.STAIR || k === K.VSLAB) {
    const B = d === 0 ? [.5, .5, 0, 1, 1, 1] : d === 1 ? [0, .5, 0, .5, 1, 1] : d === 2 ? [0, .5, .5, 1, 1, 1] : [0, .5, 0, 1, 1, .5];
    if (k === K.VSLAB) { B[1] = 0; return [B]; }
    return [[0, 0, 0, 1, .5, 1], B];
  }
  if (k === K.PILLAR) return [[.1875, 0, .1875, .8125, 1, .8125]];
  if (k === K.BEAMX) return [[0, .375, .375, 1, .625, .625]];
  if (k === K.BEAMZ) return [[.375, .375, 0, .625, .625, 1]];
  const ok = i => isConn(i) || isFull(i), w = k === K.WALL ? [.25, .75] : k === K.PANE ? [.4375, .5625] : [.375, .625], aw = k === K.WALL ? [.3125, .6875] : k === K.PANE ? [.4375, .5625] : [.375, .625];
  const r = [[w[0], 0, w[0], w[1], 1, w[1]]], h = k === K.WALL ? .875 : 1;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (!ok(get(x + dx, y, z + dz))) continue;
    const a = [dx > 0 ? w[1] : dx < 0 ? 0 : aw[0], 0, dz > 0 ? w[1] : dz < 0 ? 0 : aw[0]], b = [dx > 0 ? 1 : dx < 0 ? w[0] : aw[1], h, dz > 0 ? 1 : dz < 0 ? w[0] : aw[1]];
    if (mesh && (k === K.FENCE || k === K.RAIL)) { for (const [y0, y1] of [[.3, .42], [.7, .82]]) r.push([a[0], y0, a[2], b[0], y1, b[2]]); }       // fences and rails are two thin bars
    else r.push([a[0], 0, a[2], b[0], h, b[2]]);
  }
  return r;
}
function cellBoxes(id, x, y, z) { return partBoxes(id, x, y, z, false).map(q => [x + q[0], y + q[1], z + q[2], x + q[3], y + q[4], z + q[5]]); }
const isFull = i => i !== 0 && !isLava(i) && !KIND[i];
