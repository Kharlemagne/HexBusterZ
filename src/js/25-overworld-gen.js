// ============================================================
//  OPEN WORLD GENERATION — one seed -> the same world on every machine.
//  Layout: Ember Village is stamped at the origin (identical for every seed), flat ground blends out into four biomes:
//    0 NEON WASTES  (cyberpunk: circuit plains, neon grid, pylons, ruined towers)
//    1 FLESH FOREST (eldritch: fungal trees, tendrils)
//    2 VOID SPIRES  (eldritch: huge void-stone peaks, monoliths, floating shards)
//    3 ASH LANDS    (hell: ash, lava lakes, bone spires)
//  Caves, ores and Hellgates (dungeon entrances) are scattered on top. Everything is deterministic noise + hashing.
// ============================================================
const OWG = { S: 0, REGION: 208, LAVA_Y: 7 };
const BIOME_NAMES = ['NEON WASTES', 'FLESH FOREST', 'VOID SPIRES', 'ASH LANDS'];
function ih(x, y, z, s) {                                                // integer hash -> [0,1)
  let h = (Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 2147483629) ^ Math.imul(s | 0, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519); h = Math.imul(h ^ (h >>> 13), 3266489917); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vn2(x, z, s) {
  const xi = Math.floor(x), zi = Math.floor(z), u = sstep(x - xi), v = sstep(z - zi);
  const a = ih(xi, 0, zi, s), b = ih(xi + 1, 0, zi, s), c = ih(xi, 0, zi + 1, s), d = ih(xi + 1, 0, zi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function vn3(x, y, z, s) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), u = sstep(x - xi), v = sstep(y - yi), w = sstep(z - zi);
  const L = (a, b, t) => a + (b - a) * t;
  const c00 = L(ih(xi, yi, zi, s), ih(xi + 1, yi, zi, s), u), c10 = L(ih(xi, yi + 1, zi, s), ih(xi + 1, yi + 1, zi, s), u);
  const c01 = L(ih(xi, yi, zi + 1, s), ih(xi + 1, yi, zi + 1, s), u), c11 = L(ih(xi, yi + 1, zi + 1, s), ih(xi + 1, yi + 1, zi + 1, s), u);
  return L(L(c00, c10, v), L(c01, c11, v), w);
}
function fbm2(x, z, s, oct) { let a = 0, amp = .5, f = 1, tot = 0; for (let i = 0; i < oct; i++) { a += vn2(x * f, z * f, s + i * 17) * amp; tot += amp; amp *= .5; f *= 2; } return a / tot; }

const VILLAGE_C = 32;
const villageD = (x, z) => Math.max(Math.abs(x - VILLAGE_C), Math.abs(z - VILLAGE_C));
function inStamp(x, z) { return x >= 0 && z >= 0 && x < 64 && z < 64 && (villageD(x, z) <= 24 || (x >= 24 && x <= 40 && z >= 5 && z <= 14)); }

function biomeWeights(x, z) {
  const S = OWG.S, t = fbm2(x / 260, z / 260, S + 11, 2), m = fbm2(x / 220, z / 220, S + 23, 2);
  const wx = sstep(clamp((t - .5) * 6 + .5, 0, 1)), wy = sstep(clamp((m - .5) * 6 + .5, 0, 1));
  return [(1 - wx) * (1 - wy), wx * (1 - wy), (1 - wx) * wy, wx * wy];
}
function biomeHeight(i, x, z) {
  const S = OWG.S;
  if (i === 0) return 14 + Math.round((fbm2(x / 70, z / 70, S + 31, 3) - .5) * 14 / 2) * 2;                       // stepped plateaus, like city levels
  if (i === 1) return 12 + (fbm2(x / 48, z / 48, S + 41, 3) - .5) * 26;
  if (i === 2) { const r = fbm2(x / 90, z / 90, S + 51, 3), ridge = 1 - Math.abs(2 * r - 1); return 16 + Math.pow(ridge, 2.2) * 70 + (fbm2(x / 14, z / 14, S + 52, 2) - .5) * 5; }
  const lk = fbm2(x / 55, z / 55, S + 62, 2); let h = 9 + (fbm2(x / 80, z / 80, S + 61, 3) - .5) * 14;
  if (lk < .38) h = Math.min(h, 3 + lk * 12);                                                                         // lava basins
  return h;
}
function baseHeight(x, z) {                                              // terrain before village flattening and gate pads
  const w = biomeWeights(x, z); let h = 0, best = 0, bi = 0;
  for (let i = 0; i < 4; i++) { if (w[i] > .005) h += w[i] * biomeHeight(i, x, z); if (w[i] > best) { best = w[i]; bi = i; } }
  return { h, bi, w };
}
// ---- Hellgates: one candidate per REGION x REGION cell, deterministic from the seed
const gateCache = new Map();
function gateOf(rx, rz) {
  const k = rx + ',' + rz + ',' + OWG.S; let g = gateCache.get(k); if (g !== undefined) return g;
  const S = OWG.S, gx = rx * OWG.REGION + 50 + Math.floor(ih(rx, 0, rz, S + 101) * 108), gz = rz * OWG.REGION + 50 + Math.floor(ih(rx, 1, rz, S + 202) * 108);
  if (Math.abs(gx - VILLAGE_C) < 110 && Math.abs(gz - VILLAGE_C) < 110) g = null;
  else { const bh = baseHeight(gx, gz).h; g = { x: gx, z: gz, y: clamp(Math.round(bh), 11, 58), seed: ((ih(rx, 2, rz, S + 777) * 4294967295) >>> 0) || 1, rx, rz }; }
  if (gateCache.size > 400) gateCache.clear(); gateCache.set(k, g); return g;
}
const gateRegion = v => Math.floor(v / OWG.REGION);
function gatesNear(x, z, r) {                                            // every gate within r blocks of (x,z)
  const out = [], x0 = gateRegion(x - r), x1 = gateRegion(x + r), z0 = gateRegion(z - r), z1 = gateRegion(z + r);
  for (let rz = z0; rz <= z1; rz++) for (let rx = x0; rx <= x1; rx++) { const g = gateOf(rx, rz); if (g && Math.hypot(g.x - x, g.z - z) <= r) out.push(g); }
  return out;
}
function nearestGate(x, z) {
  let best = null, bd = 1e18;
  for (let rz = gateRegion(z) - 2; rz <= gateRegion(z) + 2; rz++) for (let rx = gateRegion(x) - 2; rx <= gateRegion(x) + 2; rx++) { const g = gateOf(rx, rz); if (g) { const d = Math.hypot(g.x - x, g.z - z); if (d < bd) { bd = d; best = g; } } }
  return best ? { g: best, d: bd } : null;
}
function gateAtPlayer(px, py, pz) {                                      // the Hellgate whose doorway the player is standing in
  for (const g of gatesNear(px, pz, 12)) if (Math.abs(px - g.x - .5) < 3 && Math.abs(pz - g.z - .5) < 1.8 && py > g.y && py < g.y + 9) return g;
  return null;
}
// ---- column description
function colInfo(x, z) {
  const { h: bh, bi, w } = baseHeight(x, z), D = villageD(x, z);
  let h = bh; const wv = sstep(clamp((D - 26) / 46, 0, 1)); h = 8 + (h - 8) * wv;
  for (const g of gatesNear(x, z, 17)) { const dd = Math.hypot(x - g.x, z - g.z); h += (g.y - h) * (1 - sstep(clamp((dd - 9) / 7, 0, 1))); }
  return { h: clamp(Math.floor(h), 3, WORLD_H - 8), bi, w };
}
function biomeAt(x, z) { return villageD(x, z) <= 30 ? 'EMBER VILLAGE' : BIOME_NAMES[baseHeight(x, z).bi]; }

// ---- chunk generation
OWG.gen = function (cx, cz) {
  const S = OWG.S, b = new Uint8Array(256 * WORLD_H), x0 = cx * CS, z0 = cz * CS, M = 5, W = CS + 2 * M;
  const hts = new Int16Array(W * W), bio = new Uint8Array(W * W);
  for (let zz = 0; zz < W; zz++) for (let xx = 0; xx < W; xx++) { const c = colInfo(x0 - M + xx, z0 - M + zz); hts[zz * W + xx] = c.h; bio[zz * W + xx] = c.bi; }
  const put = (x, y, z, id) => { const lx = x - x0, lz = z - z0; if (lx < 0 || lz < 0 || lx >= CS || lz >= CS || y < 1 || y >= WORLD_H) return; b[lx | (lz << 4) | (y << 8)] = id; };
  const stamp = OW.stamp;
  for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) {
    const x = x0 + lx, z = z0 + lz, i = (lz + M) * W + lx + M, h = hts[i], bi = bio[i], D = villageD(x, z);
    if (inStamp(x, z)) { for (let y = 0; y < FIXED_H; y++) b[lx | (lz << 4) | (y << 8)] = stamp[x + 64 * (z + 64 * y)]; continue; }
    const vs = 1 - sstep(clamp((D - 30) / 50, 0, 1));
    for (let y = 0; y <= h; y++) {
      let id;
      if (y === 0) id = 3;
      else if (y === h) {
        if (vs > 0 && ih(x, z, 1, S + 6) < vs) id = ih(x, z, 3, S + 6) < .06 ? 1 : 2;
        else if (bi === 0) id = ((x & 15) === 0 || (z & 15) === 0) ? (((x & 15) === 0 && (z & 15) === 0) ? 15 : (ih(x, z, 4, S + 5) < .8 ? 14 : 13)) : 13;
        else if (bi === 1) id = ih(x, z, 5, S + 5) < .004 ? 15 : 16;
        else if (bi === 2) id = ih(x, z, 6, S + 5) < .025 ? 19 : 12;
        else id = ih(x, z, 7, S + 5) < .012 ? 6 : ih(x, z, 8, S + 5) < .05 ? 1 : 20;
      } else if (y > h - 4) id = bi === 2 ? 12 : bi === 3 ? 20 : bi === 1 ? 17 : 13;
      else {
        id = bi === 2 ? 12 : 1;
        if (ih(x, y, z, S + 9) < .0055) id = 22; else if (y < 22 && ih(x, y, z, S + 10) < .004) id = 6;
      }
      if (y > 2 && y < h - 3 && D > 44) {                                   // caves
        const dens = vn3(x * .04, y * .055, z * .04, S + 7) * .7 + vn3(x * .11, y * .13, z * .11, S + 8) * .3;
        if (dens > .645) id = y <= 6 ? 4 : 0;
      }
      if (id) b[lx | (lz << 4) | (y << 8)] = id;
    }
    for (let y = h + 1; y <= OWG.LAVA_Y; y++) b[lx | (lz << 4) | (y << 8)] = 4;       // lava fills the low basins
  }
  // ---- features (trees, towers, ...): decided per origin column, so they line up across chunk borders
  const near = gatesNear(x0 + 8, z0 + 8, 40);
  for (let oz = z0 - 4; oz < z0 + CS + 4; oz++) for (let ox = x0 - 4; ox < x0 + CS + 4; ox++) {
    const r = ih(ox, 0, oz, S + 300); if (r > .02) continue;
    const i = (oz - z0 + M) * W + (ox - x0 + M), h = hts[i], bi = bio[i]; if (h < 9) continue;
    if (villageD(ox, oz) < 40) continue;
    let nearGate = false; for (const g of near) if (Math.hypot(ox - g.x, oz - g.z) < 20) { nearGate = true; break; } if (nearGate) continue;
    const q = ih(ox, 1, oz, S + 301), q2 = ih(ox, 2, oz, S + 302);
    if (bi === 0) { if (r < .0035) pylon(put, ox, h, oz, 9 + Math.floor(q * 9)); else if (r < .0055) tower(put, ox, h, oz, 10 + Math.floor(q * 14), S); }
    else if (bi === 1) { if (r < .014) fungalTree(put, ox, h, oz, 5 + Math.floor(q * 5), q2); else if (r < .02) tendril(put, ox, h, oz, 6 + Math.floor(q * 9), q2 * 6); }
    else if (bi === 2) { if (r < .0025) monolith(put, ox, h, oz, 10 + Math.floor(q * 9)); else if (r < .0035) shards(put, ox, h + 12 + Math.floor(q * 12), oz, q2); }
    else { if (r < .006) boneSpire(put, ox, h, oz, 3 + Math.floor(q * 5)); else if (r < .009) outcrop(put, ox, h, oz, q); else if (r < .0105) charredTree(put, ox, h, oz, 4 + Math.floor(q * 4)); }
  }
  for (const g of near) buildGate(put, g);
  return b;
};
// ---- feature builders (all write through put(), which clips to the chunk being generated)
function discPut(put, cx, y, cz, R, id) { for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) if (dx * dx + dz * dz <= R * R + 1) put(cx + dx, y, cz + dz, id); }
function pylon(put, x, h, z, ht) {
  for (let y = 1; y <= ht; y++) put(x, h + y, z, 8);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { put(x + dx, h + ht - 2, z + dz, 15); put(x + dx, h + 1, z + dz, 8); }
  put(x, h + ht + 1, z, 14); put(x, h + ht + 2, z, 14); put(x, h + ht - 5, z, 14);
}
function tower(put, x, h, z, ht, S) {
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const edge = Math.abs(dx) === 2 || Math.abs(dz) === 2, corner = Math.abs(dx) === 2 && Math.abs(dz) === 2;
    put(x + dx, h, z + dz, 13);
    if (!edge) { if (ih(x + dx, 9, z + dz, S + 5) < .3) put(x + dx, h + 1, z + dz, 18); continue; }
    const top = ht - Math.floor(ih(x + dx, 3, z + dz, S + 320) * 6);
    for (let y = 1; y <= top; y++) {
      if (dz === 2 && dx === 0 && y <= 2) continue;                          // doorway
      if (ih(x + dx, y, z + dz, S + 321) < .1) continue;                     // damage
      put(x + dx, h + y, z + dz, (!corner && y % 4 === 2) ? (ih(x + dx, y, z + dz, S + 322) < .5 ? 14 : 15) : 18);
    }
  }
}
function fungalTree(put, x, h, z, th, q) {
  const R = th > 7 ? 4 : 3;
  for (let y = 1; y <= th; y++) put(x, h + y, z, 17);
  for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
    const d2 = dx * dx + dz * dz; if (d2 > R * R + 1) continue;
    put(x + dx, h + th + 1, z + dz, d2 >= (R - 1) * (R - 1) ? 15 : 16);                   // glowing rim under the cap
    if (d2 <= (R - 1) * (R - 1) + 1) put(x + dx, h + th + 2, z + dz, 16);
    if (d2 <= 2) put(x + dx, h + th + 3, z + dz, 16);
  }
  for (const [dx, dz] of [[R, 0], [-R, 0], [0, R], [0, -R]]) { put(x + dx, h + th, z + dz, 15); if (q > .5) put(x + dx, h + th - 1, z + dz, 15); }
}
function tendril(put, x, h, z, ht, ph) {
  let px = x, pz = z;
  for (let y = 1; y <= ht; y++) { px = x + Math.round(Math.sin(y * .45 + ph) * 1.6); pz = z + Math.round(Math.cos(y * .38 + ph) * 1.6); put(px, h + y, pz, 17); put(px, h + y, pz + 1, y % 3 === 0 ? 15 : 17); }
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) for (let dy = 0; dy <= 2; dy++) if (Math.abs(dx) + Math.abs(dz) + dy <= 2) put(px + dx, h + ht + 1 + dy, pz + dz, 19);
}
function monolith(put, x, h, z, ht) {
  for (let y = 1; y <= ht; y++) {
    const R = y < ht * .66 ? 1 : 0;
    for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) put(x + dx, h + y, z + dz, 12);
    if (y > 2 && y < ht - 1 && y % 2 === 0) put(x, h + y, z + (R ? 2 : 1), 19);
  }
  put(x, h + ht + 1, z, 19);
}
function shards(put, x, y, z, q) {
  const blob = (bx, by, bz, R) => { for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) for (let dy = -R; dy <= R; dy++) if (dx * dx + dy * dy + dz * dz <= R * R + 1) put(bx + dx, by + dy, bz + dz, dx === 0 && dy === 0 && dz === 0 ? 19 : 12); };
  blob(x, y, z, 2); blob(x + 4, y + 3, z - 2, 1); blob(x - 3, y - 2, z + 3, 1);
}
function boneSpire(put, x, h, z, ht) { for (let y = 1; y <= ht; y++) { put(x, h + y, z, 5); if (y < ht * .5) { put(x + 1, h + y, z, 5); } } }
function outcrop(put, x, h, z, q) { for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const d = Math.abs(dx) + Math.abs(dz); if (d <= 3) put(x + dx, h + 1, z + dz, d === 0 ? 6 : 1); if (d <= 1) put(x + dx, h + 2, z + dz, d === 0 ? 6 : 1); } }
function charredTree(put, x, h, z, ht) { for (let y = 1; y <= ht; y++) put(x, h + y, z, 10); put(x + 1, h + ht, z, 10); put(x - 1, h + ht - 1, z, 10); put(x + 2, h + ht + 1, z, 6); put(x - 2, h + ht, z, 6); put(x, h + ht + 1, z, 6); }
// ---- a Hellgate: obsidian + void stone frame with neon trim, door faces +z (south)
function buildGate(put, g) {
  const x = g.x, y = g.y, z = g.z;
  for (let dz = -4; dz <= 4; dz++) for (let dx = -7; dx <= 7; dx++) put(x + dx, y, z + dz, (Math.abs(dx) === 7 || Math.abs(dz) === 4) ? 14 : 3);
  for (const sx of [-1, 1]) for (let yy = 1; yy <= 10; yy++) for (let dx = 3; dx <= 5; dx++) for (let dz = -1; dz <= 1; dz++) {
    put(x + sx * dx, y + yy, z + dz, (dx === 3 && dz === 1 && yy % 3 === 0) ? 15 : 12);
  }
  for (let dx = -5; dx <= 5; dx++) for (let dz = -1; dz <= 1; dz++) for (let yy = 9; yy <= 11; yy++) put(x + dx, y + yy, z + dz, (yy === 11 && dz === 1) ? 14 : 12);
  for (let dx = -2; dx <= 2; dx++) for (let dz = -1; dz <= 1; dz++) for (let yy = 1; yy <= 8; yy++) put(x + dx, y + yy, z + dz, 0);
  for (let dx = -2; dx <= 2; dx++) { put(x + dx, y, z, 15); put(x + dx, y, z + 1, 15); }
  put(x, y + 12, z + 1, 15); put(x - 2, y + 12, z + 1, 14); put(x + 2, y + 12, z + 1, 14);
}
