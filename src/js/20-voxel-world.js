// ---------------- world ----------------
let N = 64, NC = 4; const H = 36, CS = 16, MAXN = 224;
const world = new Uint8Array(MAXN * MAXN * H), blood = new Uint8Array(MAXN * MAXN * H);
const idx = (x, y, z) => x + N * (z + N * y);
function get(x, y, z) {
  if (x < 0 || z < 0 || x >= N || z >= N || y < 0) return 3;
  if (y >= H) return 0;
  return world[idx(x, y, z)];
}
const solid = (x, y, z) => { const i = get(x, y, z); return i !== 0 && i !== 4; };
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

