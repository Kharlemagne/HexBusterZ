// ---------------- chunk meshing (vertex colour + baked AO) ----------------
const COL = Object.fromEntries(Object.entries(DATA.blocks.colors).map(([k, v]) => [k, hx(parseInt(v.slice(1), 16))]));   // data/blocks.json
const EMIT = new Set(DATA.blocks.emissive);
// every id gets its material's colour / light / name; the creative palette lists materials (the shape is chosen with V) and the neon rails
for (let i = 0; i < MATS.length; i++) { const id = MAT0 + i; COL[id] = hx(parseInt(MATS[i].color.slice(1), 16)); DATA.blocks.colors[id] = MATS[i].color; DATA.blocks.names[id] = MATS[i].name; if (MATS[i].emissive) EMIT.add(id); DATA.blocks.build.push([id, MATS[i].name]); }
for (let id = 48; id < REG_N; id++) {
  const b = BASE[id]; if (!b || id === b) continue; COL[id] = COL[b]; DATA.blocks.colors[id] = DATA.blocks.colors[b]; if (EMIT.has(b)) EMIT.add(id);
  const k = KIND[id]; if (k === K.RAIL) { EMIT.add(id); DATA.blocks.names[id] = 'NEON RAIL ' + ['CYAN', 'MAGENTA', 'ORANGE', 'BLUE', 'GREEN'][id - 144]; DATA.blocks.build.push([id, DATA.blocks.names[id]]); }
  else DATA.blocks.names[id] = (DATA.blocks.names[b] || 'BLOCK') + ' ' + ['', 'SLAB', 'TOP SLAB', 'STAIRS', 'VERTICAL SLAB', 'WALL', 'PILLAR', 'BEAM', 'BEAM', 'FENCE', 'PANE', '', '', 'WEDGE'][k];
}
for (let id = 3600; id <= 3608; id++) { COL[id] = [.03, .035, .05]; DATA.blocks.colors[id] = '#050810'; DATA.blocks.names[id] = id === 3600 ? 'BLACK WATER' : id === 3608 ? 'BLACK WATER (FALLING)' : 'BLACK WATER (FLOWING)'; }
for (let t = 0; t < 4; t++) for (let f = 0; f < 4; f++) { const id = SCR0 + t * 4 + f; DATA.blocks.names[id] = SCR_NAMES[t]; DATA.blocks.colors[id] = SCR_COLORS[t]; COL[id] = COL[32]; }
for (let t = 0; t < 4; t++) DATA.blocks.build.push([SCR0 + t * 4, SCR_NAMES[t]]);
// MONITOR MERGING. Identical monitors (same type, same facing, touching in the wall's plane) are tiled into RECTANGLES whose sides are 1 or an even number up to 10
// (1x1, 2x1, 1x2, 2x2, 4x2, 10x10...). Never an L: a block that no rectangle can include just stays a 1x1 screen of its own until a neighbour arrives. The tiling is greedy from the
// bottom-left of the group, so it depends only on which cells are there, never on the order they were placed in. Returns this block's place in its tile:
// i,j = counted from the left / bottom as seen from the front, W,H = tile size.
function screenRun(x, y, z, id) {
  const f = DIR[id], ax = f < 2 ? 2 : 0, rs = (f === 0 || f === 3) ? -1 : 1, R = 24, S = 2 * R + 1, have = new Uint8Array(S * S), used = new Uint8Array(S * S);
  for (let b = -R; b <= R; b++) for (let a = -R; a <= R; a++) have[(b + R) * S + a + R] = (ax === 2 ? get(x, y + b, z + rs * a) : get(x + rs * a, y + b, z)) === id ? 1 : 0;
  const free = (a, b) => a >= -R && a <= R && b >= -R && b <= R && have[(b + R) * S + a + R] && !used[(b + R) * S + a + R];
  for (let b = -R; b <= 0; b++) for (let a = -R; a <= R; a++) {
    if (!free(a, b)) continue;
    let run = 0; while (run < 10 && free(a + run, b)) run++;
    const W = run >= 2 ? run & ~1 : 1; let hh = 0; while (hh < 10) { let ok = true; for (let k = 0; k < W; k++) if (!free(a + k, b + hh)) { ok = false; break; } if (!ok) break; hh++; }
    const H = hh >= 2 ? hh & ~1 : 1;
    for (let q = 0; q < H; q++) for (let k = 0; k < W; k++) used[(b + q + R) * S + a + k + R] = 1;
    if (a <= 0 && 0 < a + W && b <= 0 && 0 < b + H) return { i: -a, j: -b, W, H, ax, rs };
  }
  return { i: 0, j: 0, W: 1, H: 1, ax, rs };
}
// a box inside a cell (stairs and rails are built from these); faces on the cell boundary hide against full neighbours
const cu2 = [0, 1, 1, 0], cv2 = [0, 0, 1, 1];
function emitBox(out, x, y, z, a, b, id, skip) {
  const em = EMIT.has(id), col = COL[id], vr = .9 + hash(x * 7 + y * 13, z * 5 + y * 3) * .2, O = [x, y, z]; let l0 = 0, l1 = 0, l2 = 0;
  if (LT && !em) { const c = lcell(x, y, z); if (c >= 0) { l0 = LT.R[c] / LMAX * LGAIN; l1 = LT.G[c] / LMAX * LGAIN; l2 = LT.B[c] / LMAX * LGAIN; } }
  for (let d = 0; d < 3; d++) for (let s = -1; s <= 1; s += 2) {
    const plane = s > 0 ? b[d] : a[d]; if (skip && skip(d, s)) continue;
    if (plane === 0 || plane === 1) { const nb = get(x + (d === 0 ? s : 0), y + (d === 1 ? s : 0), z + (d === 2 ? s : 0)); if (isFull(nb) || (isConn(id) && isConn(nb) && d !== 1)) continue; }
    const u = (d + 1) % 3, v = (d + 2) % 3, m = em ? 1 : SHADE[d][s > 0 ? 1 : 0] * vr, tileV = (em ? -1 : 1) * (blockTile(id, d === 1 && s > 0) + 1), vs = [];
    for (let k = 0; k < 4; k++) {
      const P = [0, 0, 0]; P[d] = plane; P[u] = cu2[k] ? b[u] : a[u]; P[v] = cv2[k] ? b[v] : a[v];
      const su = d === 0 ? P[2] : P[0], sv = d === 1 ? P[2] : P[1];
      vs.push(O[0] + P[0], O[1] + P[1], O[2] + P[2], col[0] * (m + l0), col[1] * (m + l1), col[2] * (m + l2), 1, su, sv, tileV);
    }
    for (const k of [0, 1, 2, 0, 2, 3]) for (let j = 0; j < VF; j++) out.push(vs[k * VF + j]);
  }
}
function meshWedge(out, id, x, y, z) {                                         // one smooth 45 degree ramp (the collision is eight thin steps, see partBoxes)
  const col = COL[id], d = DIR[id], em = EMIT.has(id), vr = .9 + hash(x * 7 + y * 13, z * 5 + y * 3) * .2; let l0 = 0, l1 = 0, l2 = 0;
  if (LT && !em) { const c = lcell(x, y, z); if (c >= 0) { l0 = LT.R[c] / LMAX * LGAIN; l1 = LT.G[c] / LMAX * LGAIN; l2 = LT.B[c] / LMAX * LGAIN; } }
  const tS = (em ? -1 : 1) * (blockTile(id, false) + 1), tT = (em ? -1 : 1) * (blockTile(id, true) + 1);
  const M = (a, h, w) => d === 0 ? [x + a, y + h, z + w] : d === 1 ? [x + 1 - a, y + h, z + w] : d === 2 ? [x + w, y + h, z + a] : [x + w, y + h, z + 1 - a];
  const V = (P, sh, u, v, t) => { const m = em ? 1 : sh * vr; return [P[0], P[1], P[2], col[0] * (m + l0), col[1] * (m + l1), col[2] * (m + l2), 1, u, v, t]; };
  const push = (vs, idx) => { for (const k of idx) for (let j = 0; j < VF; j++) out.push(vs[k][j]); };
  const fx = d === 0 ? 1 : d === 1 ? -1 : 0, fz = d === 2 ? 1 : d === 3 ? -1 : 0;
  push([V(M(0, 0, 0), .95, 0, 0, tT), V(M(0, 0, 1), .95, 1, 0, tT), V(M(1, 1, 1), .95, 1, 1, tT), V(M(1, 1, 0), .95, 0, 1, tT)], [0, 1, 2, 0, 2, 3]);                  // the slope
  if (!isFull(get(x + fx, y, z + fz))) push([V(M(1, 0, 0), .8, 0, 0, tS), V(M(1, 0, 1), .8, 1, 0, tS), V(M(1, 1, 1), .8, 1, 1, tS), V(M(1, 1, 0), .8, 0, 1, tS)], [0, 1, 2, 0, 2, 3]);   // the tall back
  if (!isFull(get(x, y - 1, z))) push([V(M(0, 0, 0), .5, 0, 0, tS), V(M(0, 0, 1), .5, 1, 0, tS), V(M(1, 0, 1), .5, 1, 1, tS), V(M(1, 0, 0), .5, 0, 1, tS)], [0, 1, 2, 0, 2, 3]);
  for (const w of [0, 1]) { const sx = d < 2 ? 0 : (w ? 1 : -1), sz = d < 2 ? (w ? 1 : -1) : 0; if (!isFull(get(x + sx, y, z + sz))) push([V(M(0, 0, w), .86, 0, 0, tS), V(M(1, 0, w), .86, 1, 0, tS), V(M(1, 1, w), .86, 1, 1, tS)], [0, 1, 2]); }
}
function meshPartial(out, id, x, y, z) {
  if (KIND[id] === K.WEDGE) { meshWedge(out, id, x, y, z); return; }
  const k = KIND[id], same = (d, ss) => { const nb = get(x + (d === 0 ? ss : 0), y + (d === 1 ? ss : 0), z + (d === 2 ? ss : 0)); return KIND[nb] === k && BASE[nb] === BASE[id]; };
  const bx = partBoxes(id, x, y, z, true);
  bx.forEach((q, i) => {
    const skip = k === K.STAIR ? (i === 1 ? (dd, ss) => dd === 1 && ss < 0 : null)              // (the underside of the upper step is inside the stair)
      : (k === K.PILLAR || k === K.BEAMX || k === K.BEAMZ || i === 0) ? (dd, ss) => (k === K.PILLAR ? dd === 1 : k === K.BEAMX ? dd === 0 : k === K.BEAMZ ? dd === 2 : dd === 1 && false) && same(dd, ss) : null;
    emitBox(out, x, y, z, q.slice(0, 3), q.slice(3), id, skip);
  });
}
const SHADE = [[.74, .74], [.46, 1], [.86, .86]];
const AOV = [.42, .64, .84, 1];
const meshes = new Map(), dirty = new Set();             // chunk key -> { buf, count }
let gl, prog, loc = {};
const MHIDE = { on: false, x: 0, y: 0, z: 0 };                             // the block being mined is left out of the chunk mesh: it is drawn separately, shrinking
function mineHide(x, y, z) {
  const on = x !== null; if (on === MHIDE.on && (!on || (x === MHIDE.x && y === MHIDE.y && z === MHIDE.z))) return;
  if (MHIDE.on) markDirty(MHIDE.x, MHIDE.z); MHIDE.on = on; if (on) { MHIDE.x = x; MHIDE.y = y; MHIDE.z = z; markDirty(x, z); }
}
function buildChunk(cx, cz) {
  const key = ckey(cx, cz), ch = useChunks ? OW.chunks.get(key) : null; if (useChunks && !ch) return;
  const out = []; const x0 = cx * CS, z0 = cz * CS, yMax = ch ? Math.min(H, ch.top + 2) : H;
  const n = [0, 0, 0], p = [0, 0, 0], q = [0, 0, 0], ao = [0, 0, 0, 0];
  const cu = [0, 1, 1, 0], cv = [0, 0, 1, 1], lt = [0, 0, 0], lk = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
  LT = null; if (ch) { let top = ch.top; for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c2 = OW.chunks.get(ckey(cx + dx, cz + dz)); if (c2 && c2.top > top) top = c2.top; } LT = computeLight(cx, cz, Math.min(H - 1, Math.max(top, ch.top) + 2)); }
  for (let y = 0; y < yMax; y++) for (let z = z0; z < z0 + CS; z++) for (let x = x0; x < x0 + CS; x++) {
    const li = ch ? ((x & 15) | ((z & 15) << 4) | (y << 8)) : 0;
    const id = ch ? ch.b[li] : world[idx(x, y, z)]; if (!id) continue;
    if (MHIDE.on && x === MHIDE.x && y === MHIDE.y && z === MHIDE.z) continue;
    const lav = isLiquid(id), sk = slabKind(id), scr = KIND[id] === K.SCREEN;
    if (sk === 3) { meshPartial(out, id, x, y, z); continue; }
    const b = COL[id] || (COL[id] = [.6, .6, .6]), em = EMIT.has(id), bl = ch ? (ch.blood ? ch.blood[li] : 0) : blood[idx(x, y, z)];
    const vr = .86 + hash(x * 7 + y * 13, z * 5 + y * 3) * .28;
    for (let d = 0; d < 3; d++) for (let s = -1; s <= 1; s += 2) {
      n[0] = n[1] = n[2] = 0; n[d] = s;
      const nb = MHIDE.on && x + n[0] === MHIDE.x && y + n[1] === MHIDE.y && z + n[2] === MHIDE.z ? 0 : get(x + n[0], y + n[1], z + n[2]), nk = slabKind(nb);
      if (lav) { if (nb !== 0 && !nk && !(d === 1 && s > 0 && !isLiquid(nb))) continue; }        // lava hides against solids and lava (corners are shared, so no cracks) but its lowered top shows under a ceiling; next to a half block it stays visible
      else if (nb !== 0 && !isLiquid(nb) && !(d === 1 && sk && (s > 0 ? sk === 1 : sk === 2))) {   // (the flat face in the middle of a half block is never hidden by the next block)
        if (!nk) continue;                                                                      // a full block next to us covers this face completely
        if (d === 1) { if ((s > 0 ? nk === 1 : nk === 2) && (sk === 0 || (s > 0 ? sk === 2 : sk === 1))) continue; }                       // a half block touches us with its flat face only on the shared plane
        else if (sk && nk === sk) continue;                                                     // two half blocks of the same half share a wall
      }
      const u = (d + 1) % 3, v = (d + 2) % 3;
      p[0] = x + n[0]; p[1] = y + n[1]; p[2] = z + n[2];
      for (let k = 0; k < 4; k++) {
        const du = cu[k] ? 1 : -1, dv = cv[k] ? 1 : -1;
        q[0] = p[0]; q[1] = p[1]; q[2] = p[2]; q[u] += du;
        const s1 = solid(q[0], q[1], q[2]); q[u] = p[u]; q[v] += dv;
        const s2 = solid(q[0], q[1], q[2]); q[u] += du;
        const c = solid(q[0], q[1], q[2]);
        ao[k] = (s1 && s2) ? 0 : 3 - (s1 + s2 + c);
        if (LT) { const a = lcell(p[0], p[1], p[2]); q[0] = p[0]; q[1] = p[1]; q[2] = p[2]; q[u] += du; const c1 = lcell(q[0], q[1], q[2]); q[u] = p[u]; q[v] += dv; const c2 = lcell(q[0], q[1], q[2]); q[u] += du; vertexLight(lk[k], a, c1, c2, lcell(q[0], q[1], q[2])); }
      }
      const sh = SHADE[d][s > 0 ? 1 : 0];
      const verts = [], hv = (x * 73856093 ^ y * 19349663 ^ z * 83492791 ^ (d * 3 + (s > 0 ? 1 : 0)) * 2654435761) >>> 0;
      let sRun = null; if (scr && ((DIR[id] === 0 && d === 0 && s > 0) || (DIR[id] === 1 && d === 0 && s < 0) || (DIR[id] === 2 && d === 2 && s > 0) || (DIR[id] === 3 && d === 2 && s < 0))) sRun = screenRun(x, y, z, id);
      const flipU = (hv & 1) === 1, flipV = d === 1 ? ((hv >> 1) & 1) === 1 : false; let tileV = (em ? -1 : 1) * (blockTile(id, d === 1 && s > 0) + 1);
      if (sRun) tileV = -(200 + screenType(id) + 4 * (sRun.W - 1) + 40 * (sRun.H - 1) + 1);
      for (let k = 0; k < 4; k++) {
        const P = [x, y, z]; P[d] += s > 0 ? 1 : 0; P[u] += cu[k]; P[v] += cv[k];
        if (sk) P[1] = y + (sk === 2 ? .5 : 0) + (P[1] - y) * .5;                                  // half blocks are half as tall
        let wob = 1;
        if (lav && P[1] > y + .5) { const ch2 = lavaCorner(P[0], y, P[2]); P[1] = y + ch2; if (ch2 < 1) wob = 2; }   // the lava surface follows its neighbours, so flows slope and never leave steps or cracks
        let m = em ? 1 : sh * AOV[ao[k]] * vr, r = b[0] * m, g = b[1] * m, bb = b[2] * m;
        if (em) { const f = .85 + hash(x + k, z + y) * .3; r *= f; g *= f; bb *= f; }
        else if (LT) { const l = lk[k]; r = b[0] * (m + l[0] * LGAIN); g = b[1] * (m + l[1] * LGAIN); bb = b[2] * (m + l[2] * LGAIN); }
        if (bl && !em) { const t = Math.min(.85, bl * .3); r = lerp(r, .42, t); g = lerp(g, .02, t); bb = lerp(bb, .03, t); }
        let su = d === 0 ? cv[k] : cu[k], sv = d === 0 ? cu[k] : cv[k]; if (sk && d !== 1) sv = sv * .5 + (sk === 2 ? .5 : 0);                         // texture runs horizontally along the face, up = +y
        if (sRun) { const o = P[sRun.ax] - (sRun.ax === 2 ? z : x); su = sRun.i + (sRun.rs > 0 ? o : 1 - o); sv = sRun.j + (P[1] - y); verts.push(P[0], P[1], P[2], 1, 1, 1, 1, su, sv, tileV); continue; }
        verts.push(P[0], P[1], P[2], r, g, bb, wob, flipU ? 1 - su : su, flipV ? 1 - sv : sv, tileV);
      }
      const flip = ao[0] + ao[2] < ao[1] + ao[3];
      const tri = flip ? [1, 2, 3, 1, 3, 0] : [0, 1, 2, 0, 2, 3];
      for (const k of tri) for (let j = 0; j < VF; j++) out.push(verts[k * VF + j]);
    }
  }
  let m = meshes.get(key);
  if (!out.length) { if (m) m.count = 0; return; }
  const arr = new Float32Array(out);
  if (!m) { m = { buf: gl.createBuffer(), count: 0 }; meshes.set(key, m); }
  gl.bindBuffer(gl.ARRAY_BUFFER, m.buf);
  gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
  m.count = arr.length / VF;
}
// ---- lava surface heights ----
const lavaH = id => id === 30 || id === 3608 ? 1 : id === 4 || id === 3600 ? .88 : id >= 3601 ? .18 + (id - 3600) * .105 : .18 + (id - 22) * .105;       // flowing level 1 is a low sheet, level 7 almost a full block
// height of the lava surface at the corner point (X,Z) of layer y: the average of the four lava / air blocks around it (solids are ignored,
// anything with lava above it counts as full), like Minecraft, so neighbouring blocks always agree and the flow reads as one sloping sheet
function lavaCorner(X, y, Z) {
  let sum = 0, w = 0;
  for (let k = 0; k < 4; k++) {
    const x = X - 1 + (k & 1), z = Z - 1 + (k >> 1), id = get(x, y, z);
    if (isLiquid(id)) { if (isLiquid(get(x, y + 1, z))) return 1; const h = lavaH(id), wt = h >= .8 ? 10 : 1; sum += h * wt; w += wt; }
    else if (id === 0) w += .5;
  }
  return w ? Math.max(.06, sum / w) : .5;
}
function freeMesh(key) { const m = meshes.get(key); if (m) { try { gl.deleteBuffer(m.buf); } catch (e) { } meshes.delete(key); } }
function buildAll() {
  if (useChunks) for (const ch of OW.chunks.values()) buildChunk(ch.cx, ch.cz);
  else for (let cx = 0; cx < NC; cx++) for (let cz = 0; cz < NC; cz++) buildChunk(cx, cz);
  dirty.clear();
}
function markDirtyLight(x, z) { const cx = Math.floor(x / CS), cz = Math.floor(z / CS); for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (OW.chunks.has(ckey(cx + dx, cz + dz))) dirty.add(ckey(cx + dx, cz + dz)); }
function markDirty(x, z) {
  const cx = Math.floor(x / CS), cz = Math.floor(z / CS);
  const add = (a, b) => { if (useChunks ? OW.chunks.has(ckey(a, b)) : (a >= 0 && b >= 0 && a < NC && b < NC)) dirty.add(ckey(a, b)); };
  add(cx, cz);
  const lx = x - cx * CS, lz = z - cz * CS;
  if (lx === 0) add(cx - 1, cz); if (lx === CS - 1) add(cx + 1, cz);
  if (lz === 0) add(cx, cz - 1); if (lz === CS - 1) add(cx, cz + 1);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) if ((sx < 0 ? lx === 0 : lx === CS - 1) && (sz < 0 ? lz === 0 : lz === CS - 1)) add(cx + sx, cz + sz);   // lava corners read the diagonal chunk too
}
function setBlock(x, y, z, id) {
  if (y < 1 || y >= H) return false;
  if (useChunks && OW.gen === 3 && stProtected(x, y, z)) return false;                    // the Helicarrier cannot be broken, built over or blown up
  if (useChunks) {
    const old = OW.set(x, y, z, id);                       // -1 = that chunk is not loaded (the edit is still remembered)
    if (old !== -1) { markDirty(x, z); if (old !== id && (emits(id) || emits(old) || KIND[id] === K.SCREEN || KIND[old] === K.SCREEN)) markDirtyLight(x, z); }
    if (old !== id) for (const fn of blockListeners) fn(x, y, z, id, old);
    return true;
  }
  if (x < 0 || z < 0 || x >= N || z >= N) return false;
  const i = idx(x, y, z), old = world[i]; world[i] = id; blood[i] = 0; markDirty(x, z);
  if (old !== id) for (const fn of blockListeners) fn(x, y, z, id, old);
  return true;
}
function bloodAt(x, y, z) {
  if (y < 0 || y >= H) return;
  if (useChunks) { const ch = OW.chunks.get(ckey(x >> 4, z >> 4)); if (!ch) return; const li = (x & 15) | ((z & 15) << 4) | (y << 8); if (!ch.b[li] || EMIT.has(ch.b[li])) return; if (!ch.blood) ch.blood = new Uint8Array(ch.b.length); if (ch.blood[li] < 3) { ch.blood[li]++; markDirty(x, z); } return; }
  if (x < 0 || z < 0 || x >= N || z >= N) return;
  const i = idx(x, y, z); if (!world[i] || EMIT.has(world[i])) return;
  if (blood[i] < 3) { blood[i]++; markDirty(x, z); }
}

