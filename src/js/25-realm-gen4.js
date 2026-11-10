// ============================================================
//  GENERATION 4 — A REALM (the eldritch dimension): an 8000 x 8000 world reached through the Rift console on the Helicarrier.
//  The coordinates the player types become the seed, so the same coordinates always lead to the same realm (and any slot can visit it).
//  Heights: the world is Y -64..319; it is stored as y + 64, so the stored range is 0..383 (WORLD_H = 384 in a realm).
//  Layout (all from the seed):
//    * |x|,|z| < 3000: land, the four biomes of the old overworld (neon wastes, flesh forest, void spires, ash lands), with black-water lakes
//      (lava lakes in the ash lands) filling every basin up to sea level (Y 62);
//    * 3000..4000: THE BLACK SEA, with a shelf that deepens outwards; at 3990 the water pours over THE EDGE OF THE WORLD and the fall leads to the Abyss;
//    * floating islands (Y about 192, in clusters, never above a rift) with the same biomes;
//    * three dimensional TEARS (rifts) on the surface of the land, at least 2000 blocks from each other: the one you came through, and two more.
//      All of them lead back to the ship. Nothing generates underground for them: each sits on a flat plinth on the surface.
// ============================================================
let REALM = null;
const REALM_VOID = 2, RY0 = 64, RSEA = 126, RLAND = 3000, REDGE = 4000, RSKY = 256, RLIP = 3992;
const rD = (x, z) => Math.max(Math.abs(x), Math.abs(z));
function realmBase(x, z) {                                              // ground height before the rift plinths (OWG.S must be the realm seed) and the dominant biome
  const w = biomeWeights(x, z); let h = 0, best = 0, bi = 0;
  for (let i = 0; i < 4; i++) { if (w[i] > .005) h += w[i] * biomeHeight(i, x, z); if (w[i] > best) { best = w[i]; bi = i; } }
  let hh = 118 + h; const D = rD(x, z);
  if (D > 2850) {                                                       // the coast, then the black sea's shelf, deepening outwards
    const c = sstep(clamp((D - 2850) / 220, 0, 1)), depth = 10 + 14 * sstep(clamp((D - 3050) / 250, 0, 1));
    hh += (RSEA - depth - hh) * c;
  }
  return { h: hh, bi };
}
function realmCol(x, z) {                                               // the final ground column: height, biome, distance to the edge
  const L = REALM, B = realmBase(x, z); let h = B.h;
  if (L) for (const r of L.rifts) { const dd = Math.hypot(x - r.x, z - r.z); if (dd < 17) h += (r.y - h) * (1 - sstep(clamp((dd - 9) / 8, 0, 1))); }
  return { h: Math.floor(h), bi: B.bi, D: rD(x, z) };
}
function realmLayout(S) {
  if (REALM && REALM.S === S) return REALM;
  const keepS = OWG.S, keepR = REALM; OWG.S = S; REALM = null; const rifts = [];
  for (let n = 0; n < 3; n++) {
    let pick = null;
    for (let t = 0; t < 600 && !pick; t++) {
      const x = Math.round((ih(n, t, 1, S + 930) * 2 - 1) * 2700), z = Math.round((ih(n, t, 2, S + 931) * 2 - 1) * 2700);
      if (rifts.some(r => Math.hypot(r.x - x, r.z - z) < 2050)) continue;
      const c = realmBase(x, z).h; let lo = c, hi = c, ok = c > RSEA + 3;                   // dry land, and not on a cliff: it must be a surface spot
      for (let k = 0; k < 8 && ok; k++) { const hh = realmBase(x + Math.round(Math.cos(k * .785) * 14), z + Math.round(Math.sin(k * .785) * 14)).h; lo = Math.min(lo, hh); hi = Math.max(hi, hh); if (hh < RSEA + 2) ok = false; }
      if (ok && hi - lo < 14) pick = { x, z, y: Math.round(c) };
    }
    if (!pick) pick = { x: (n - 1) * 2100, z: n === 1 ? 2100 : -1200, y: RSEA + 6 };       // (a seed this unlucky does not exist in practice, but a realm must always have its rifts)
    rifts.push(pick);
  }
  const T = rifts[0];
  REALM = { S, rifts, tear: T, spawn: { x: T.x + .5, z: T.z + 11.5 }, gates: rifts.slice(1), sky: new Map() };
  OWG.S = keepS; if (keepR && keepR.S === S) REALM = keepR;
  return REALM;
}
// ---- the floating islands: clusters of 3-5 in some 640-block cells, about Y 192, never above a rift
const SKY_CELL = 640;
function skyCell(cx, cz, S) {
  const L = REALM, key = cx + ',' + cz; let c = L.sky.get(key); if (c) return c; c = [];
  if (ih(cx, cz, 3, S + 940) < .45) {
    const ox = cx * SKY_CELL + 160 + ih(cx, cz, 4, S + 941) * (SKY_CELL - 320), oz = cz * SKY_CELL + 160 + ih(cx, cz, 5, S + 942) * (SKY_CELL - 320);
    if (Math.abs(ox) < 2800 && Math.abs(oz) < 2800 && !L.rifts.some(r => Math.hypot(r.x - ox, r.z - oz) < 130)) {
      const n = 3 + Math.floor(ih(cx, cz, 6, S + 943) * 3), a0 = ih(cx, cz, 7, S + 944) * TAU, bi0 = Math.floor(ih(cx, cz, 8, S + 945) * 4);
      for (let i = 0; i < n; i++) {
        const ang = a0 + i / n * TAU, dist = i ? 40 + ih(cx, cz, 10 + i, S + 946) * 36 : 0;
        c.push({ x: Math.round(ox + Math.cos(ang) * dist), z: Math.round(oz + Math.sin(ang) * dist), r: i ? 14 + ih(cx, cz, 20 + i, S + 947) * 12 : 24 + ih(cx, cz, 30, S + 948) * 8, top: RSKY + Math.round((ih(cx, cz, 40 + i, S + 949) - .5) * 24), bi: (bi0 + i) % 4 });
      }
    }
  }
  if (L.sky.size > 200) L.sky.clear(); L.sky.set(key, c); return c;
}
function skyIsles(x, z, S, reach) {
  const out = [], c0x = Math.floor(x / SKY_CELL), c0z = Math.floor(z / SKY_CELL);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) for (const I of skyCell(c0x + dx, c0z + dz, S)) if (Math.hypot(I.x - x, I.z - z) < I.r * 1.7 + reach) out.push(I);
  return out;
}
function realmSurface(I, x, z, S) {                                      // the top of a floating island at a point (before the rim rounds off)
  const bi = I.bi; let b = bi === 0 ? 0 : bi === 1 ? Math.round((vn2(x / 14, z / 14, S + 921) - .5) * 5) : bi === 2 ? Math.round((vn2(x / 10, z / 10, S + 922) - .5) * 4) : Math.round((vn2(x / 18, z / 18, S + 923) - .5) * 8);
  return I.top + b;
}
function skyColumn(x, z, S, list) {
  let best = null, bu = 9;
  for (const I of list) { const d0 = Math.hypot(x - I.x, z - I.z); if (d0 > I.r * 1.6) continue; const u = d0 * (1 + .32 * (vn2(x / 11 + I.x, z / 11 + I.z, S + 920) - .5)) / I.r; if (u < bu) { bu = u; best = I; } }
  if (!best || bu >= 1) return null;
  const rim = Math.max(0, (bu - .78) / .22), top = realmSurface(best, x, z, S) - Math.round(rim * rim * 5);
  const thick = 7 + 36 * Math.pow(1 - bu, 1.1) + (vn2(x / 8, z / 8, S + 924) - .5) * 8 * (1 - bu);
  return { top, bot: Math.floor(top - thick), bi: best.bi, u: bu };
}
function realmColumn(x, z, S) {                                          // what is here (for the biome name): ground, sea, or a floating island
  const L = realmLayout(S), D = rD(x, z);
  if (D >= RLIP) return { name: 'THE EDGE OF THE WORLD' }; if (D > RLAND) return { name: 'THE BLACK SEA' };
  const c = realmCol(x, z); return { name: BIOME_NAMES[c.bi], bi: c.bi, h: c.h };
}
function buildTear(put, T) {                                              // a flat hexagonal plinth under a dimensional tear (the tear itself is a 2D shader effect, see drawRealmTears); no frame, no gate
  const x = T.x, y = T.y, z = T.z;
  for (let dz = -7; dz <= 7; dz++) for (let dx = -7; dx <= 7; dx++) {
    const h = Math.max(Math.abs(dz), Math.abs(dx) * .8660254 + Math.abs(dz) * .5); if (h > 5.6) continue;
    put(x + dx, y, z + dz, h > 4.6 ? 19 : (h > 3.4 && h < 3.9 ? 15 : 3));
    if (h <= 5.6) for (let yy = 1; yy <= 16; yy++) put(x + dx, y + yy, z + dz, 0);
  }
}
OWG.gen4 = function (cx, cz) {
  const S = OWG.S, L = realmLayout(S), b = new Uint16Array(256 * WORLD_H), x0 = cx * CS, z0 = cz * CS;
  if (x0 > REDGE || x0 + 15 < -REDGE || z0 > REDGE || z0 + 15 < -REDGE) return b;                  // outside the world: nothing
  const put = (x, y, z, id) => { const lx = x - x0, lz = z - z0; if (lx < 0 || lz < 0 || lx >= CS || lz >= CS || y < 1 || y >= WORLD_H) return; b[lx | (lz << 4) | (y << 8)] = id; };
  for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) {
    const x = x0 + lx, z = z0 + lz, o = lx | (lz << 4), D = rD(x, z); if (D > REDGE) continue;
    if (D >= RLIP) { for (let y = 1; y <= RSEA; y++) b[o | (y << 8)] = 3608; continue; }       // the edge: black water pours off the end of the world
    const C = realmCol(x, z), h = C.h, bi = C.bi, sea = D > 2900;
    for (let y = 1; y <= h; y++) {
      let id;
      if (y <= 2) id = 10;
      else if (y === h) {
        if (sea || h < RSEA - 1) id = 12;                                                             // sea floor / lake bed
        else if (bi === 0) id = ((x & 15) === 0 || (z & 15) === 0) ? (((x & 15) === 0 && (z & 15) === 0) ? 15 : (ih(x, z, 4, S + 5) < .8 ? 14 : 13)) : 13;
        else if (bi === 1) id = ih(x, z, 5, S + 5) < .004 ? 15 : 16;
        else if (bi === 2) id = ih(x, z, 6, S + 5) < .025 ? 19 : 12;
        else id = ih(x, z, 7, S + 5) < .012 ? 6 : ih(x, z, 8, S + 5) < .05 ? 1 : 20;
      } else if (y > h - 4) id = sea || bi === 2 ? 12 : bi === 3 ? 20 : bi === 1 ? 17 : 13;
      else {
        id = bi === 2 ? 12 : 1;
        if (ih(x, y, z, S + 9) < .0055) id = 22; else if (y < 90 && ih(x, y, z, S + 10) < .004) id = 6;
        if (!sea && y > 60 && y < h - 6) { const d1 = vn3(x * .04, y * .055, z * .04, S + 7); if (d1 > .49 && d1 * .7 + vn3(x * .11, y * .13, z * .11, S + 8) * .3 > .645) id = y <= 72 ? 4 : 0; }   // caves (lava pools in the deep ones)
      }
      if (id) b[o | (y << 8)] = id;
    }
    if (h < RSEA) { const f = bi === 3 && !sea ? 4 : 3600; for (let y = h + 1; y <= RSEA; y++) b[o | (y << 8)] = f; }   // basins fill to sea level: lava in the ash lands, black water everywhere else
  }
  // features on the land (same rules as the older worlds), kept clear of the rifts
  if (rD(x0 + 8, z0 + 8) < 2900) for (let oz = z0 - 4; oz < z0 + CS + 4; oz++) for (let ox = x0 - 4; ox < x0 + CS + 4; ox++) {
    const r = ih(ox, 0, oz, S + 300); if (r > .02) continue;
    if (L.rifts.some(g => Math.hypot(ox - g.x, oz - g.z) < 17)) continue;
    const I = realmCol(ox, oz), h = I.h, bi = I.bi; if (h < RSEA + 2) continue;
    const q = ih(ox, 1, oz, S + 301), q2 = ih(ox, 2, oz, S + 302);
    if (bi === 0) { if (r < .0035) pylon(put, ox, h, oz, 9 + Math.floor(q * 9)); else if (r < .0055) tower(put, ox, h, oz, 10 + Math.floor(q * 14), S); }
    else if (bi === 1) { if (r < .014) fungalTree(put, ox, h, oz, 5 + Math.floor(q * 5), q2); else if (r < .02) tendril(put, ox, h, oz, 6 + Math.floor(q * 9), q2 * 6); }
    else if (bi === 2) { if (r < .0025) monolith(put, ox, h, oz, 10 + Math.floor(q * 9)); else if (r < .0035) shards(put, ox, h + 12 + Math.floor(q * 12), oz, q2); }
    else { if (r < .006) boneSpire(put, ox, h, oz, 3 + Math.floor(q * 5)); else if (r < .009) outcrop(put, ox, h, oz, q); else if (r < .0105) charredTree(put, ox, h, oz, 4 + Math.floor(q * 4)); }
  }
  // the floating islands
  const isles = skyIsles(x0 + 8, z0 + 8, S, 14);
  if (isles.length) {
    for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) {
      const x = x0 + lx, z = z0 + lz, I = skyColumn(x, z, S, isles); if (!I) continue; const { top, bot, bi } = I, o = lx | (lz << 4);
      for (let y = bot; y <= top; y++) {
        let id;
        if (y === top) id = bi === 0 ? 13 : bi === 1 ? (ih(x, z, 5, S + 5) < .004 ? 15 : 16) : bi === 2 ? (ih(x, z, 6, S + 5) < .025 ? 19 : 12) : (ih(x, z, 7, S + 5) < .012 ? 6 : 20);
        else if (y > top - 4) id = bi === 2 ? 12 : bi === 3 ? 20 : bi === 1 ? 17 : 13;
        else { id = bi === 2 ? 12 : 1; if (y === bot) id = ih(x, z, 9, S + 8) < .05 ? 6 : id; else if (ih(x, y, z, S + 9) < .0055) id = 22; }
        if (y > bot + 2 && y < top - 3 && I.u < .75) { const dens = vn3(x * .04, y * .055, z * .04, S + 7) * .7 + vn3(x * .11, y * .13, z * .11, S + 8) * .3; if (dens > .645) id = y <= bot + 6 ? 4 : 0; }
        if (id) b[o | (y << 8)] = id;
      }
    }
  }
  for (const g of L.rifts) if (Math.abs(g.x - x0 - 8) < 24 && Math.abs(g.z - z0 - 8) < 24) buildTear(put, g);
  return b;
};
