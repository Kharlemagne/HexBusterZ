// ============================================================
//  GENERATION 2 — floating islands over an eldritch abyss, with the Helicarrier hanging above the home island.
//  New worlds use this; worlds made before it keep generation 1 (see 25-overworld-gen.js), so nothing already built is ever moved.
//   * islands: a big blob of noise decides where land is; thickness tapers to a rocky, glowing underside (the abyss is below, then the void kills you)
//   * the biomes (neon wastes, flesh forest, void spires, ash lands) are exactly the same height/surface/feature rules as before, just lifted up onto the islands
//   * THE HELICARRIER: a huge carrier-hull at y~104 with a neon city on its deck, lava exhaust vents under the hull that fall onto the home island,
//     the smith's stall and spawn at the rear, the Hellgate at the far front, and tractor-beam lifts up from the island.
// ============================================================
const ISL_THR = .56, LAVA2 = 29, VOID_Y = 8;
const CAR = { cx: 32, cz: 32, hl: 105, hw: 54, deck: 104, hull: 30 };
const CAR_GATE = { x: 32, z: -56, y: CAR.deck, seed: 0x1EAF51 };
const CAR_SPAWN = { x: 32.5, z: 122.5 }, CAR_NPC = { x: 25.5, z: 111.5 };
const LIFTS = [{ x: 8.5, z: 112.5 }, { x: 56.5, z: 112.5 }];
function carrierR(x, z) {                                              // 0 at the centre, 1 at the edge of the hull; pointed bow to the north (-z)
  const dz = z - CAR.cz, bow = dz < 0 ? 1 - .58 * sstep(clamp(-dz / CAR.hl, 0, 1)) : 1 - .12 * sstep(clamp(dz / CAR.hl, 0, 1)), hwE = CAR.hw * bow;
  return Math.pow(Math.pow(Math.abs(x - CAR.cx) / hwE, 2.6) + Math.pow(Math.abs(dz) / CAR.hl, 2.6), 1 / 2.6);
}
const carrierBottom = (x, z) => Math.floor(CAR.deck - 5 - CAR.hull * (1 - Math.pow(carrierR(x, z), 2.2)));
const onCarrier = (x, z) => carrierR(x, z) < 1;
function islandRaw(x, z) {
  const S = OWG.S, m = fbm2(x / 170, z / 170, S + 71, 3) + .55 * (1 - sstep(clamp(Math.hypot(x - 32, z - 32) / 420, 0, 1)));
  if (m < ISL_THR) return { solid: false };
  const { h: bh, bi, w } = baseHeight(x, z), depth = clamp((m - ISL_THR) / .22, 0, 1), D = Math.hypot(x - 32, z - 32), wv = sstep(clamp((D - 60) / 140, 0, 1));
  const top = clamp(Math.floor(36 + (bh + 22 - 36) * wv), 24, WORLD_H - 44);
  const thick = 7 + 62 * Math.pow(depth, 1.15) + (vn2(x / 9, z / 9, S + 72) - .5) * 14 * depth;
  return { solid: true, top, bot: Math.max(10, Math.floor(top - thick)), bi, w, depth };
}
function island2(x, z, gates) {                                         // + flat pads under the wild Hellgates (gates = the gates near this chunk)
  const I = islandRaw(x, z); if (!I.solid) return I;
  for (const g of gates) { if (Math.abs(g.x - x) > 17 || Math.abs(g.z - z) > 17) continue; const dd = Math.hypot(x - g.x, z - g.z); I.top += Math.round((g.y - I.top) * (1 - sstep(clamp((dd - 9) / 7, 0, 1)))); }
  return I;
}
function gateOf2(rx, rz) {
  const S = OWG.S;
  for (let k = 0; k < 10; k++) {
    const gx = rx * OWG.REGION + 40 + Math.floor(ih(rx, k, rz, S + 101) * 128), gz = rz * OWG.REGION + 40 + Math.floor(ih(rx, k + 50, rz, S + 202) * 128);
    if (Math.hypot(gx - CAR.cx, gz - CAR.cz) < 190) continue;
    const I = islandRaw(gx, gz); if (!I.solid || I.depth < .3 || I.top > LAVA2 + 40) continue;
    let ok = true; for (const [dx, dz] of [[14, 0], [-14, 0], [0, 14], [0, -14]]) { const J = islandRaw(gx + dx, gz + dz); if (!J.solid) ok = false; }
    if (!ok) continue;
    return { x: gx, z: gz, y: I.top, seed: ((ih(rx, 2, rz, S + 777) * 4294967295) >>> 0) || 1, rx, rz };
  }
  return null;
}
// ---- the city: 14x14 lots along an avenue; a few styles
const LOT = 14, LOT_X0 = -20, lotCache = new Map();
function lotAt(x, z) {
  if (z < 2 || z >= 100) return null;
  const i = Math.floor((x - LOT_X0) / LOT), j = Math.floor(z / LOT), cx0 = LOT_X0 + i * LOT, cz0 = j * LOT, key = i * 64 + j + ':' + OWG.S;
  let d = lotCache.get(key);
  if (d === undefined) {
    const S = OWG.S; d = null;
    if (Math.abs(cx0 + 7 - 32) >= 11 && j !== 4 && ih(i, j, 0, S + 500) > .16 && [[0, 0], [13, 0], [0, 13], [13, 13]].every(([a, b]) => carrierR(cx0 + a, cz0 + b) < .84)) {
      const q = ih(i, j, 1, S + 501), h = 8 + Math.floor(Math.pow(ih(i, j, 2, S + 502), 1.7) * 36);
      d = { i, j, h, style: Math.floor(q * 4), x1: 1 + Math.floor(ih(i, j, 3, S + 503) * 3), x2: 12 - Math.floor(ih(i, j, 4, S + 504) * 3), z1: 1 + Math.floor(ih(i, j, 5, S + 505) * 3), z2: 12 - Math.floor(ih(i, j, 6, S + 506) * 3), seed: S };
    }
    if (lotCache.size > 300) lotCache.clear(); lotCache.set(key, d);
  }
  return d ? { d, lx: x - cx0, lz: z - cz0 } : null;
}
function lotId(d, lx, lz, y) {                                        // block at height y (1 = first block above the deck); 0 = air
  const { x1, x2, z1, z2, h } = d, inside = lx >= x1 && lx <= x2 && lz >= z1 && lz <= z2, win = (a, b, c) => ih(a, b, c, d.seed + 510) < .5 ? 14 : 15;
  if (d.style === 0) {                                                // glass-and-chrome tower
    const mx = (x1 + x2) >> 1;
    if (y > h) return (lx === mx && lz === (z1 + z2 >> 1) && y <= h + 6) ? (y === h + 6 ? 14 : 8) : 0;
    if (!inside) return 0; if (y === h) return 12;
    const wall = lx === x1 || lx === x2 || lz === z1 || lz === z2, corner = (lx === x1 || lx === x2) && (lz === z1 || lz === z2);
    if (y % 6 === 0) return 13; if (!wall) return 0;
    if (lz === z2 && lx === mx && y <= 3) return 0;                   // door
    return (!corner && y % 3 !== 0 && ((lx + lz) & 1) === 0) ? win(lx, lz, y) : 18;
  }
  if (d.style === 1) {                                                // void-stone ziggurat with neon ledges
    const k = Math.floor((y - 1) / 5), a = x1 + k, b = x2 - k, c = z1 + k, e = z2 - k; if (y > h || a >= b || c >= e) return 0;
    if (lx < a || lx > b || lz < c || lz > e) return 0;
    return ((y - 1) % 5 === 4 && (lx === a || lx === b || lz === c || lz === e)) ? 15 : 12;
  }
  if (d.style === 2) {                                                // organic spire: twisting flesh, glowing nodes
    const r = ((x2 - x1) / 2 + .5) * Math.pow(Math.max(0, 1 - y / (h + 6)), .85) + Math.sin(y * .45 + d.i * 3 + d.j) * .8, dd = Math.hypot(lx - 6.5, lz - 6.5);
    if (dd > r || r < .4) return 0; return ih(lx, y, lz, d.seed + 511) < .07 ? 15 : (y % 7 < 2 ? 17 : 16);
  }
  const hh = Math.min(h, 10);                                         // flat slab with a huge neon sign
  if (y > hh || !inside) return 0; if (y === hh) return 13;
  const wall = lx === x1 || lx === x2 || lz === z1 || lz === z2; if (!wall) return 0;
  if (lz === z2 && lx > x1 + 1 && lx < x2 - 1 && y > 2) return (((lx >> 1) + (y >> 1)) % 3 === 0) ? 15 : 14;
  return 18;
}
function mawId(x, z, y) {                                             // THE MAW SPIRE: a hollow, twisting tower in the plaza at the middle of the city
  const H_ = 56; if (y > H_ + 3) return 0; const t = Math.min(y, H_), ox = 32 + Math.sin(t * .11) * 3.2, oz = 63 + Math.cos(t * .11) * 3.2, rad = 6.5 * Math.pow(Math.max(0, 1 - t / 64), 1.1) + 1, dd = Math.hypot(x - ox, z - oz);
  if (y > H_) return dd < 2.4 ? 15 : 0;                               // the eye at the very top
  if (dd > rad || dd < rad - 1.7) return y % 9 === 0 && dd <= rad ? 13 : 0;
  return y % 9 < 2 ? 15 : (ih(x, y, z, OWG.S + 520) < .1 ? 19 : 12);
}
// ---- vents: lava falls from the underside of the hull down onto the home island (or into the abyss)
const VENTS = (() => { const v = []; for (let z = -14; z <= 112; z += 14) { v.push({ x: CAR.cx - 24, z, big: false }); v.push({ x: CAR.cx + 24, z, big: false }); } v.push({ x: 32, z: 20, big: true }, { x: 32, z: 76, big: true }); return v.filter(a => carrierR(a.x, a.z) < .82); })();
function ventInfo(v) { if (v.gnd === undefined) { const I = islandRaw(v.x, v.z); v.b0 = carrierBottom(v.x, v.z); v.gnd = I.solid && I.top < v.b0 - 3 ? I.top : -1; } return v; }
// ---- structures that need absolute coordinates
function box(put, x0, y0, z0, x1, y1, z1, id) { for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) put(x, y, z, id); }
function smithStall(put) {
  const y = CAR.deck + 1;
  box(put, 21, y, 108, 30, y + 3, 108, 1); box(put, 21, y, 108, 21, y + 3, 114, 3); box(put, 30, y, 108, 30, y + 3, 114, 3); box(put, 21, y, 114, 30, y, 114, 8);        // back wall, pillars, counter
  for (let x = 20; x <= 31; x++) for (let z = 107; z <= 115; z++) put(x, y + 4, z, ((x + z) & 1) ? 7 : 5);                                                                    // striped awning
  box(put, 22, y - 1, 109, 29, y - 1, 113, 1); put(24, y, 111, 8); put(24, y + 1, 111, 8); put(28, y, 111, 6); put(28, y + 1, 111, 6); put(26, y + 3, 114, 15);
}
function liftShaft(put, L) { for (let y = 40; y <= CAR.deck + 1; y++) for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const r = Math.max(Math.abs(dx), Math.abs(dz)); if (r <= 2) put(Math.floor(L.x) + dx, y, Math.floor(L.z) + dz, 0); else if (r === 3 && y >= CAR.deck - 1) put(Math.floor(L.x) + dx, y, Math.floor(L.z) + dz, (dx + dz) % 2 ? 14 : 18); } }

OWG.gen2 = function (cx, cz) {
  const S = OWG.S, b = new Uint16Array(256 * WORLD_H), x0 = cx * CS, z0 = cz * CS, M = 5, W = CS + 2 * M;
  const near = gatesNear(x0 + 8, z0 + 8, 40), info = new Array(W * W); for (let zz = 0; zz < W; zz++) for (let xx = 0; xx < W; xx++) info[zz * W + xx] = island2(x0 - M + xx, z0 - M + zz, near);
  const put = (x, y, z, id) => { const lx = x - x0, lz = z - z0; if (lx < 0 || lz < 0 || lx >= CS || lz >= CS || y < 1 || y >= WORLD_H) return; b[lx | (lz << 4) | (y << 8)] = id; };
  const Dk = CAR.deck;
  for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) {
    const x = x0 + lx, z = z0 + lz, I = info[(lz + M) * W + lx + M], o = lx | (lz << 4);
    if (I.solid) {
      const { top, bot, bi } = I, D = Math.hypot(x - 32, z - 32);
      for (let y = bot; y <= top; y++) {
        let id;
        if (y === top) {
          if (bi === 0) id = ((x & 15) === 0 || (z & 15) === 0) ? (((x & 15) === 0 && (z & 15) === 0) ? 15 : (ih(x, z, 4, S + 5) < .8 ? 14 : 13)) : 13;
          else if (bi === 1) id = ih(x, z, 5, S + 5) < .004 ? 15 : 16;
          else if (bi === 2) id = ih(x, z, 6, S + 5) < .025 ? 19 : 12;
          else id = ih(x, z, 7, S + 5) < .012 ? 6 : ih(x, z, 8, S + 5) < .05 ? 1 : 20;
          if (D < 110 && ih(x, z, 1, S + 6) < (1 - sstep(clamp((D - 40) / 70, 0, 1))) * .8) id = ih(x, z, 3, S + 6) < .06 ? 1 : 2;       // the home island under the carrier is ember-red rock
        } else if (y > top - 4) id = bi === 2 ? 12 : bi === 3 ? 20 : bi === 1 ? 17 : 13;
        else {
          id = bi === 2 ? 12 : 1;
          if (y === bot) id = ih(x, z, 9, S + 8) < .05 ? 6 : (bi === 2 ? 12 : 1);                      // the underside: dark rock veined with glowing hellstone
          else if (ih(x, y, z, S + 9) < .0055) id = 22; else if (y < bot + 22 && ih(x, y, z, S + 10) < .004) id = 6;
        }
        if (y > bot + 2 && y < top - 3 && D > 44) { const dens = vn3(x * .04, y * .055, z * .04, S + 7) * .7 + vn3(x * .11, y * .13, z * .11, S + 8) * .3; if (dens > .645) id = y <= bot + 6 ? 4 : 0; }
        if (id) b[o | (y << 8)] = id;
      }
      for (let y = top + 1; y <= LAVA2; y++) b[o | (y << 8)] = 4;                                          // lava fills the low basins
    }
    // ---- the carrier
    const r = carrierR(x, z); if (r >= 1) continue;
    const bot = carrierBottom(x, z) - ((x * 3 + z) % 9 === 0 ? 1 : 0);
    for (let y = bot; y < Dk; y++) {
      const edge = r > .94 || y - bot < 2 || y > Dk - 3;
      b[o | (y << 8)] = (y === bot && ih(x, z, 11, S + 21) < .09) ? 14 : ((x + y) % 8 === 0 || (z + y) % 8 === 0) ? (edge ? 3 : 18) : (ih(x, y, z, S + 22) < .22 ? 8 : 18);
    }
    // the deck
    let dk = 13; const ax = Math.abs(x - 32);
    if (ax <= 3) dk = ax === 0 ? ((z & 3) < 2 ? 14 : 13) : (ax === 3 ? 15 : 13);                          // the main avenue: neon centre dashes and edge lights
    else if (((x - 32) % 16 === 0 || (z - 32) % 16 === 0) && ih(x, z, 4, S + 23) < .75) dk = 14;
    b[o | (Dk << 8)] = dk;
    if (r > .955) { b[o | ((Dk + 1) << 8)] = 18; b[o | ((Dk + 2) << 8)] = ((x + z) & 1) ? 15 : 18; }                  // railings
    const lot = lotAt(x, z); if (lot) { for (let y = 1; y <= lot.d.h + 7; y++) { const id = lotId(lot.d, lot.lx, lot.lz, y); if (id) b[o | ((Dk + y) << 8)] = id; } }
    if (z >= 40 && z <= 86 && Math.abs(x - 32) < 10) for (let y = 1; y <= 60; y++) { const id = mawId(x, z, y); if (id) b[o | ((Dk + y) << 8)] = id; }
    if (z > 100 && Math.hypot(x - 32.5, z - 122.5) > 6.2 && Math.hypot(x - 32.5, z - 122.5) < 7.8) b[o | (Dk << 8)] = 14;      // the landing ring
  }
  // ---- structures
  if (z0 + CS > 100 && z0 < 118) smithStall(put);
  for (const L of LIFTS) if (Math.abs(x0 + 8 - L.x) < 24 && Math.abs(z0 + 8 - L.z) < 24) liftShaft(put, L);
  const gg = { x: CAR_GATE.x, y: CAR_GATE.y, z: CAR_GATE.z, seed: CAR_GATE.seed }; buildGate(put, gg);
  for (const v of VENTS) {
    if (Math.abs(v.x - x0 - 8) > 20 || Math.abs(v.z - z0 - 8) > 20) continue; ventInfo(v);
    const R = v.big ? 2 : 1, plus = (dx, dz) => v.big || Math.abs(dx) + Math.abs(dz) <= 1, end = v.gnd >= 0 ? v.gnd + 1 : VOID_Y + 2;
    for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
      const m = Math.max(Math.abs(dx), Math.abs(dz)); if (m > R + 1) continue;
      if (m === R + 1) { put(v.x + dx, v.b0 - 1, v.z + dz, 8); put(v.x + dx, v.b0 - 2, v.z + dz, (dx + dz) & 1 ? 6 : 8); continue; }      // steel collar with glowing teeth
      if (plus(dx, dz) || v.big) for (let y = v.b0 - 1; y >= end; y--) put(v.x + dx, y, v.z + dz, 30);                                 // the fall
    }
    if (v.gnd >= 0) for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {                                                // splash on the island: a source and two rings of flow
      const m = Math.abs(dx) + Math.abs(dz), I = islandRaw(v.x + dx, v.z + dz); if (!I.solid || I.top !== v.gnd) continue;
      if (m === 0) put(v.x, v.gnd + 1, v.z, 4); else if (m <= 2) put(v.x + dx, v.gnd + 1, v.z + dz, m === 1 ? 27 : 25);
    }
  }
  // ---- wild features on the islands (trees, towers, ... identical rules to generation 1)
  for (let oz = z0 - 4; oz < z0 + CS + 4; oz++) for (let ox = x0 - 4; ox < x0 + CS + 4; ox++) {
    const r = ih(ox, 0, oz, S + 300); if (r > .02) continue;
    const I = info[(oz - z0 + M) * W + (ox - x0 + M)]; if (!I.solid || I.top < LAVA2 + 2 || carrierR(ox, oz) < 1.1) continue;
    if (Math.hypot(ox - 32, oz - 32) < 70) continue;
    let nearGate = false; for (const g of near) if (Math.hypot(ox - g.x, oz - g.z) < 20) { nearGate = true; break; } if (nearGate) continue;
    const h = I.top, bi = I.bi, q = ih(ox, 1, oz, S + 301), q2 = ih(ox, 2, oz, S + 302);
    if (bi === 0) { if (r < .0035) pylon(put, ox, h, oz, 9 + Math.floor(q * 9)); else if (r < .0055) tower(put, ox, h, oz, 10 + Math.floor(q * 14), S); }
    else if (bi === 1) { if (r < .014) fungalTree(put, ox, h, oz, 5 + Math.floor(q * 5), q2); else if (r < .02) tendril(put, ox, h, oz, 6 + Math.floor(q * 9), q2 * 6); }
    else if (bi === 2) { if (r < .0025) monolith(put, ox, h, oz, 10 + Math.floor(q * 9)); else if (r < .0035) shards(put, ox, h + 12 + Math.floor(q * 12), oz, q2); }
    else { if (r < .006) boneSpire(put, ox, h, oz, 3 + Math.floor(q * 5)); else if (r < .009) outcrop(put, ox, h, oz, q); else if (r < .0105) charredTree(put, ox, h, oz, 4 + Math.floor(q * 4)); }
  }
  for (const g of near) buildGate(put, g);
  return b;
};
