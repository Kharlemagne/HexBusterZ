// ---------------- world ----------------
let N = 64, NC = 4, H = 36; const CS = 16, MAXN = 224, FIXED_H = 36, WORLD_H = 160;
let useChunks = false;            // true in the open world (streamed chunks, see 24-overworld.js); false in dungeons (fixed arrays below)
const world = new Uint8Array(MAXN * MAXN * FIXED_H), blood = new Uint8Array(MAXN * MAXN * FIXED_H);
const ckey = (cx, cz) => (cx + 32768) * 65536 + (cz + 32768), ckx = k => Math.floor(k / 65536) - 32768, ckz = k => (k % 65536) - 32768;
const idx = (x, y, z) => x + N * (z + N * y);
function get(x, y, z) {
  if (useChunks) return OW.get(x, y, z);
  if (x < 0 || z < 0 || x >= N || z >= N || y < 0) return 3;
  if (y >= H) return 0;
  return world[idx(x, y, z)];
}
const isLava = i => i === 4 || (i >= 23 && i <= 30);          // 4 = source, 23..29 = flowing (level 1..7), 30 = falling
// 32..47 = city blocks; 48..63 = their BOTTOM slabs (half blocks), 64..79 = TOP slabs. A slab keeps the look of the block it is made from.
const stairKind = i => i >= 80 && i <= 143, isRail = i => i >= 144 && i <= 148;                    // 80..143 = stairs (16 bases x 4 directions), 144..148 = neon rails
const RAIL_BASE = [14, 15, 41, 42, 43];
const slabKind = i => i >= 48 && i <= 79 ? (i < 64 ? 1 : 2) : (i >= 80 && i <= 148 ? 3 : 0);          // 0 = full block, 1 = bottom half, 2 = top half, 3 = stairs / rail (partial, own shape)
const slabBase = i => 32 + ((i - 32) & 15), stairBase = i => 32 + ((i - 80) >> 2), stairDir = i => (i - 80) & 3;   // stair dir: 0 = rises toward +x, 1 = -x, 2 = +z, 3 = -z
const baseOf = i => i >= 144 ? RAIL_BASE[i - 144] : i >= 80 ? stairBase(i) : i >= 48 ? slabBase(i) : i;
// the collision boxes (absolute coordinates) of a stair or a rail inside its cell; a rail joins up with neighbouring rails and solid blocks
function cellBoxes(id, x, y, z) {
  if (stairKind(id)) {
    const d = stairDir(id), B = d === 0 ? [x + .5, y + .5, z, x + 1, y + 1, z + 1] : d === 1 ? [x, y + .5, z, x + .5, y + 1, z + 1] : d === 2 ? [x, y + .5, z + .5, x + 1, y + 1, z + 1] : [x, y + .5, z, x + 1, y + 1, z + .5];
    return [[x, y, z, x + 1, y + .5, z + 1], B];
  }
  const ok = i => isRail(i) || (i !== 0 && !isLava(i) && !slabKind(i)), r = [[x + .375, y, z + .375, x + .625, y + 1, z + .625]];
  if (ok(get(x + 1, y, z))) r.push([x + .625, y, z + .375, x + 1, y + 1, z + .625]); if (ok(get(x - 1, y, z))) r.push([x, y, z + .375, x + .375, y + 1, z + .625]);
  if (ok(get(x, y, z + 1))) r.push([x + .375, y, z + .625, x + .625, y + 1, z + 1]); if (ok(get(x, y, z - 1))) r.push([x + .375, y, z, x + .625, y + 1, z + .375]);
  return r;
}
const isFull = i => i !== 0 && !isLava(i) && !slabKind(i);
const solid = (x, y, z) => { const i = get(x, y, z); return i !== 0 && !isLava(i); };
const blockListeners = [];     // fn(x, y, z, newId, oldId): save system now, netcode later
let seed = 1337;
function hash(x, z) { let h = (Math.imul(x, 374761393) + Math.imul(z, 668265263) + seed) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), u = sstep(x - xi), v = sstep(z - zi);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, z) => vnoise(x * .08, z * .08) * .6 + vnoise(x * .17, z * .17) * .3 + vnoise(x * .4, z * .4) * .1;

function topY(x, z, from) { for (let y = from === undefined ? H - 1 : from; y >= 0; y--) if (solid(x, y, z)) return y; return 0; }

// voxel raycast (DDA). returns {t,x,y,z,nx,ny,nz} or null
function raycast(ox, oy, oz, dx, dy, dz, max) {
  let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
  const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
  const tdx = dx !== 0 ? Math.abs(1 / dx) : 1e30, tdy = dy !== 0 ? Math.abs(1 / dy) : 1e30, tdz = dz !== 0 ? Math.abs(1 / dz) : 1e30;
  let tmx = dx !== 0 ? (dx > 0 ? x + 1 - ox : ox - x) * tdx : 1e30;
  let tmy = dy !== 0 ? (dy > 0 ? y + 1 - oy : oy - y) * tdy : 1e30;
  let tmz = dz !== 0 ? (dz > 0 ? z + 1 - oz : oz - z) * tdz : 1e30;
  let t = 0, nx = 0, ny = 0, nz = 0;
  for (let i = 0; i < 400; i++) {
    if (solid(x, y, z)) return { t, x, y, z, nx, ny, nz };
    if (tmx < tmy && tmx < tmz) { t = tmx; if (t > max) return null; x += sx; tmx += tdx; nx = -sx; ny = 0; nz = 0; }
    else if (tmy < tmz) { t = tmy; if (t > max) return null; y += sy; tmy += tdy; nx = 0; ny = -sy; nz = 0; }
    else { t = tmz; if (t > max) return null; z += sz; tmz += tdz; nx = 0; ny = 0; nz = -sz; }
  }
  return null;
}

