// ============================================================
//  GENERATION 4 — A REALM: a small floating-island world reached through the Rift console on the Helicarrier.
//  The coordinates the player types become the seed, so the same coordinates always lead to the same realm (and any slot can visit it).
//  Layout (from the seed): a flat spawn island with the dimensional TEAR that leads home, 5-6 satellite islands each in one of the four biomes
//  (all four always appear), stepping-stone islets linking them, and two Hellgates on the biggest satellites. Everything is bounded: past the
//  outermost island there is only the abyss.
// ============================================================
let REALM = null;
const REALM_VOID = 18;
function realmLayout(S) {
  if (REALM && REALM.S === S) return REALM;
  const R = (a, b) => ih(a, b, 7, S + 910), order = [0, 1, 2, 3];
  for (let i = 3; i > 0; i--) { const j = Math.floor(R(i, 1) * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const isl = [{ x: 0, z: 0, r: 28 + Math.floor(R(0, 2) * 8), top: 80, bi: order[0], spawn: true }], n = R(1, 3) > .5 ? 6 : 5, a0 = R(9, 5) * TAU;
  for (let i = 0; i < n; i++) {
    const ang = a0 + (i + R(i, 4) * .5) / n * TAU, dist = 74 + R(i, 6) * 22, r = 16 + R(i, 7) * 12;
    isl.push({ x: Math.round(Math.cos(ang) * dist), z: Math.round(Math.sin(ang) * dist), r, top: 66 + Math.floor(R(i, 8) * 30), bi: order[(i + 1) % 4] });
  }
  const sat = isl.slice(1).sort((a, b) => b.r - a.r); sat[0].gate = sat[1].gate = true;
  const links = []; for (let i = 1; i <= n; i++) links.push([i, i % n + 1]); links.push([0, 1], [0, Math.floor(n / 2) + 1]);
  const stones = [];
  for (const [ai, bi] of links) {
    const A = isl[ai], B = isl[bi], dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz), gap = d - A.r - B.r; if (gap < 5) continue;
    const steps = Math.ceil(gap / 11), ux = dx / d, uz = dz / d;
    for (let k = 1; k < steps; k++) { const t = k / steps, p = A.r + gap * t; stones.push({ x: Math.round(A.x + ux * p), z: Math.round(A.z + uz * p), r: 3.4 + R(ai * 7 + k, bi) * 2.2, top: Math.round(A.top + (B.top - A.top) * t + Math.sin(t * Math.PI) * 2), bi: A.bi }); }
  }
  REALM = { S, isl, stones, tear: { x: 0, y: isl[0].top, z: 0 }, spawn: { x: .5, z: 11.5 }, gates: [] };
  for (const I of sat.slice(0, 2)) REALM.gates.push({ x: I.x, z: I.z, y: realmSurface(I, I.x, I.z, S), seed: ((ih(I.x, 2, I.z, S + 777) * 4294967295) >>> 0) || 1 });
  return REALM;
}
function realmSurface(I, x, z, S) {                                      // the top of an island at a point (before the rim rounds off)
  const d = Math.hypot(x - I.x, z - I.z); let b = 0;
  if (!(I.spawn && d < 16)) b = I.bi === 0 ? 0 : I.bi === 1 ? Math.round((vn2(x / 14, z / 14, S + 921) - .5) * 5) : I.bi === 2 ? Math.round((vn2(x / 10, z / 10, S + 922) - .5) * 4) : Math.round((vn2(x / 18, z / 18, S + 923) - .5) * 8);
  return I.top + b;
}
function realmColumn(x, z, S) {
  const L = REALM; let best = null, bu = 9, stone = false;
  for (const I of L.isl) { const d0 = Math.hypot(x - I.x, z - I.z); if (d0 > I.r * 1.6) continue; const u = d0 * (1 + .32 * (vn2(x / 11 + I.x, z / 11 + I.z, S + 920) - .5)) / I.r; if (u < bu) { bu = u; best = I; } }
  for (const T of L.stones) { const d0 = Math.hypot(x - T.x, z - T.z); if (d0 > T.r * 1.5) continue; const u = d0 * (1 + .25 * (vn2(x / 5, z / 5, S + 925) - .5)) / T.r; if (u < bu) { bu = u; best = T; stone = true; } }
  if (!best || bu >= 1) return { solid: false };
  const rim = Math.max(0, (bu - .78) / .22), top = stone ? best.top : realmSurface(best, x, z, S) - Math.round(rim * rim * 5);
  const thick = (stone ? 5 + 9 * (1 - bu) : 7 + 36 * Math.pow(1 - bu, 1.1)) + (vn2(x / 8, z / 8, S + 924) - .5) * 8 * (1 - bu);
  return { solid: true, top, bot: Math.max(REALM_VOID + 2, Math.floor(top - thick)), bi: best.bi, stone, isl: best, u: bu };
}
function buildTear(put, T) {                                              // the dimensional tear back to the Helicarrier: a ring of voidstone around a glowing violet rip
  const x = T.x, y = T.y, z = T.z;
  for (let dz = -4; dz <= 4; dz++) for (let dx = -6; dx <= 6; dx++) put(x + dx, y, z + dz, (Math.abs(dx) === 6 || Math.abs(dz) === 4) ? 19 : 3);
  for (const sx of [-1, 1]) for (let yy = 1; yy <= 11; yy++) for (let dx = 3; dx <= 4; dx++) for (let dz = -1; dz <= 1; dz++) put(x + sx * dx, y + yy, z + dz, (dx === 3 && dz === 1 && yy % 3 === 0) ? 15 : 12);
  for (let dx = -4; dx <= 4; dx++) for (let dz = -1; dz <= 1; dz++) for (let yy = 10; yy <= 12; yy++) put(x + dx, y + yy, z + dz, (yy === 12 && dz === 1) ? 19 : 12);
  for (let dx = -2; dx <= 2; dx++) for (let yy = 1; yy <= 9; yy++) put(x + dx, y + yy, z, 0);
  for (let dx = -2; dx <= 2; dx++) { put(x + dx, y, z, 19); put(x + dx, y, z + 1, 15); }
  put(x, y + 13, z, 15); put(x - 2, y + 13, z, 19); put(x + 2, y + 13, z, 19);
}
OWG.gen4 = function (cx, cz) {
  const S = OWG.S, L = realmLayout(S), b = new Uint8Array(256 * WORLD_H), x0 = cx * CS, z0 = cz * CS;
  const put = (x, y, z, id) => { const lx = x - x0, lz = z - z0; if (lx < 0 || lz < 0 || lx >= CS || lz >= CS || y < 1 || y >= WORLD_H) return; b[lx | (lz << 4) | (y << 8)] = id; };
  const M = 5, W = CS + 2 * M, info = new Array(W * W);
  const inReach = L.isl.some(I => Math.hypot(I.x - (x0 + 8), I.z - (z0 + 8)) < I.r * 1.7 + 14) || L.stones.some(T => Math.hypot(T.x - (x0 + 8), T.z - (z0 + 8)) < T.r + 14);
  if (!inReach) return b;                                                // empty space far from every island
  for (let zz = 0; zz < W; zz++) for (let xx = 0; xx < W; xx++) info[zz * W + xx] = realmColumn(x0 - M + xx, z0 - M + zz, S);
  for (let lz = 0; lz < CS; lz++) for (let lx = 0; lx < CS; lx++) {
    const x = x0 + lx, z = z0 + lz, I = info[(lz + M) * W + lx + M], o = lx | (lz << 4); if (!I.solid) continue;
    const { top, bot, bi } = I;
    for (let y = bot; y <= top; y++) {
      let id;
      if (y === top) {
        if (bi === 0) id = ((x & 15) === 0 || (z & 15) === 0) ? (((x & 15) === 0 && (z & 15) === 0) ? 15 : (ih(x, z, 4, S + 5) < .8 ? 14 : 13)) : 13;
        else if (bi === 1) id = ih(x, z, 5, S + 5) < .004 ? 15 : 16;
        else if (bi === 2) id = ih(x, z, 6, S + 5) < .025 ? 19 : 12;
        else id = ih(x, z, 7, S + 5) < .012 ? 6 : ih(x, z, 8, S + 5) < .05 ? 1 : 20;
      } else if (y > top - 4) id = bi === 2 ? 12 : bi === 3 ? 20 : bi === 1 ? 17 : 13;
      else {
        id = bi === 2 ? 12 : 1;
        if (y === bot) id = ih(x, z, 9, S + 8) < .05 ? 6 : (bi === 2 ? 12 : 1);
        else if (ih(x, y, z, S + 9) < .0055) id = 22; else if (y < bot + 22 && ih(x, y, z, S + 10) < .004) id = 6;
      }
      if (!I.stone && y > bot + 2 && y < top - 3 && I.u < .75) { const dens = vn3(x * .04, y * .055, z * .04, S + 7) * .7 + vn3(x * .11, y * .13, z * .11, S + 8) * .3; if (dens > .645) id = y <= bot + 6 ? 4 : 0; }
      if (id) b[o | (y << 8)] = id;
    }
  }
  // features on the islands (same rules as the older worlds), kept clear of the tear and the gates
  for (let oz = z0 - 4; oz < z0 + CS + 4; oz++) for (let ox = x0 - 4; ox < x0 + CS + 4; ox++) {
    const r = ih(ox, 0, oz, S + 300); if (r > .02) continue;
    const I = info[(oz - z0 + M) * W + (ox - x0 + M)]; if (!I.solid || I.stone || I.u > .82) continue;
    if (Math.hypot(ox - L.tear.x, oz - L.tear.z) < 17) continue; let nearGate = false; for (const g of L.gates) if (Math.hypot(ox - g.x, oz - g.z) < 12) nearGate = true; if (nearGate) continue;
    const h = I.top, bi = I.bi, q = ih(ox, 1, oz, S + 301), q2 = ih(ox, 2, oz, S + 302);
    if (bi === 0) { if (r < .0035) pylon(put, ox, h, oz, 9 + Math.floor(q * 9)); else if (r < .0055) tower(put, ox, h, oz, 10 + Math.floor(q * 14), S); }
    else if (bi === 1) { if (r < .014) fungalTree(put, ox, h, oz, 5 + Math.floor(q * 5), q2); else if (r < .02) tendril(put, ox, h, oz, 6 + Math.floor(q * 9), q2 * 6); }
    else if (bi === 2) { if (r < .0025) monolith(put, ox, h, oz, 10 + Math.floor(q * 9)); else if (r < .0035) shards(put, ox, h + 12 + Math.floor(q * 12), oz, q2); }
    else { if (r < .006) boneSpire(put, ox, h, oz, 3 + Math.floor(q * 5)); else if (r < .009) outcrop(put, ox, h, oz, q); else if (r < .0105) charredTree(put, ox, h, oz, 4 + Math.floor(q * 4)); }
  }
  if (Math.abs(x0 + 8) < 30 && Math.abs(z0 + 8) < 30) buildTear(put, L.tear);
  for (const g of L.gates) if (Math.abs(g.x - x0 - 8) < 24 && Math.abs(g.z - z0 - 8) < 24) buildGate(put, g);
  return b;
};
