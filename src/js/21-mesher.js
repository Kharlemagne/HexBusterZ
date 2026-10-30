// ---------------- chunk meshing (vertex colour + baked AO) ----------------
const COL = Object.fromEntries(Object.entries(DATA.blocks.colors).map(([k, v]) => [k, hx(parseInt(v.slice(1), 16))]));   // data/blocks.json
const EMIT = new Set(DATA.blocks.emissive);
// every id gets its material's colour / light / name; the creative palette lists materials (the shape is chosen with V) and the neon rails
for (let i = 0; i < MATS.length; i++) { const id = MAT0 + i; COL[id] = hx(parseInt(MATS[i].color.slice(1), 16)); DATA.blocks.colors[id] = MATS[i].color; DATA.blocks.names[id] = MATS[i].name; if (MATS[i].emissive) EMIT.add(id); DATA.blocks.build.push([id, MATS[i].name]); }
for (let id = 48; id < REG_N; id++) {
  const b = BASE[id]; if (!b || id === b) continue; COL[id] = COL[b]; DATA.blocks.colors[id] = DATA.blocks.colors[b]; if (EMIT.has(b)) EMIT.add(id);
  const k = KIND[id]; if (k === K.RAIL) { EMIT.add(id); DATA.blocks.names[id] = 'NEON RAIL ' + ['CYAN', 'MAGENTA', 'ORANGE', 'BLUE', 'GREEN'][id - 144]; DATA.blocks.build.push([id, DATA.blocks.names[id]]); }
  else DATA.blocks.names[id] = (DATA.blocks.names[b] || 'BLOCK') + ' ' + ['', 'SLAB', 'TOP SLAB', 'STAIRS', 'VERTICAL SLAB', 'WALL', 'PILLAR', 'BEAM', 'BEAM', 'FENCE', 'PANE'][k];
}
// a box inside a cell (stairs and rails are built from these); faces on the cell boundary hide against full neighbours
const cu2 = [0, 1, 1, 0], cv2 = [0, 0, 1, 1];
function emitBox(out, x, y, z, a, b, id, skip) {
  const em = EMIT.has(id), col = COL[id], vr = .9 + hash(x * 7 + y * 13, z * 5 + y * 3) * .2, O = [x, y, z];
  for (let d = 0; d < 3; d++) for (let s = -1; s <= 1; s += 2) {
    const plane = s > 0 ? b[d] : a[d]; if (skip && skip(d, s)) continue;
    if (plane === 0 || plane === 1) { const nb = get(x + (d === 0 ? s : 0), y + (d === 1 ? s : 0), z + (d === 2 ? s : 0)); if (isFull(nb) || (isConn(id) && isConn(nb) && d !== 1)) continue; }
    const u = (d + 1) % 3, v = (d + 2) % 3, m = em ? 1 : SHADE[d][s > 0 ? 1 : 0] * vr, tileV = (em ? -1 : 1) * (blockTile(id, d === 1 && s > 0) + 1), vs = [];
    for (let k = 0; k < 4; k++) {
      const P = [0, 0, 0]; P[d] = plane; P[u] = cu2[k] ? b[u] : a[u]; P[v] = cv2[k] ? b[v] : a[v];
      const su = d === 0 ? P[2] : P[0], sv = d === 1 ? P[2] : P[1];
      vs.push(O[0] + P[0], O[1] + P[1], O[2] + P[2], col[0] * m, col[1] * m, col[2] * m, 1, su, sv, tileV);
    }
    for (const k of [0, 1, 2, 0, 2, 3]) for (let j = 0; j < VF; j++) out.push(vs[k * VF + j]);
  }
}
function meshPartial(out, id, x, y, z) {
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
function buildChunk(cx, cz) {
  const key = ckey(cx, cz), ch = useChunks ? OW.chunks.get(key) : null; if (useChunks && !ch) return;
  const out = []; const x0 = cx * CS, z0 = cz * CS, yMax = ch ? Math.min(H, ch.top + 2) : H;
  const n = [0, 0, 0], p = [0, 0, 0], q = [0, 0, 0], ao = [0, 0, 0, 0];
  const cu = [0, 1, 1, 0], cv = [0, 0, 1, 1];
  for (let y = 0; y < yMax; y++) for (let z = z0; z < z0 + CS; z++) for (let x = x0; x < x0 + CS; x++) {
    const li = ch ? ((x & 15) | ((z & 15) << 4) | (y << 8)) : 0;
    const id = ch ? ch.b[li] : world[idx(x, y, z)]; if (!id) continue;
    const lav = isLava(id), sk = slabKind(id);
    if (sk === 3) { meshPartial(out, id, x, y, z); continue; }
    const b = COL[id] || (COL[id] = [.6, .6, .6]), em = EMIT.has(id), bl = ch ? (ch.blood ? ch.blood[li] : 0) : blood[idx(x, y, z)];
    const vr = .86 + hash(x * 7 + y * 13, z * 5 + y * 3) * .28;
    for (let d = 0; d < 3; d++) for (let s = -1; s <= 1; s += 2) {
      n[0] = n[1] = n[2] = 0; n[d] = s;
      const nb = get(x + n[0], y + n[1], z + n[2]), nk = slabKind(nb);
      if (lav) { if (nb !== 0 && !nk && !(d === 1 && s > 0 && !isLava(nb))) continue; }        // lava hides against solids and lava (corners are shared, so no cracks) but its lowered top shows under a ceiling; next to a half block it stays visible
      else if (nb !== 0 && !isLava(nb) && !(d === 1 && sk && (s > 0 ? sk === 1 : sk === 2))) {   // (the flat face in the middle of a half block is never hidden by the next block)
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
      }
      const sh = SHADE[d][s > 0 ? 1 : 0];
      const verts = [], hv = (x * 73856093 ^ y * 19349663 ^ z * 83492791 ^ (d * 3 + (s > 0 ? 1 : 0)) * 2654435761) >>> 0;
      const flipU = (hv & 1) === 1, flipV = d === 1 ? ((hv >> 1) & 1) === 1 : false, tileV = (em ? -1 : 1) * (blockTile(id, d === 1 && s > 0) + 1);
      for (let k = 0; k < 4; k++) {
        const P = [x, y, z]; P[d] += s > 0 ? 1 : 0; P[u] += cu[k]; P[v] += cv[k];
        if (sk) P[1] = y + (sk === 2 ? .5 : 0) + (P[1] - y) * .5;                                  // half blocks are half as tall
        let wob = 1;
        if (lav && P[1] > y + .5) { const ch2 = lavaCorner(P[0], y, P[2]); P[1] = y + ch2; if (ch2 < 1) wob = 2; }   // the lava surface follows its neighbours, so flows slope and never leave steps or cracks
        let m = em ? 1 : sh * AOV[ao[k]] * vr, r = b[0] * m, g = b[1] * m, bb = b[2] * m;
        if (em) { const f = .85 + hash(x + k, z + y) * .3; r *= f; g *= f; bb *= f; }
        if (bl && !em) { const t = Math.min(.85, bl * .3); r = lerp(r, .42, t); g = lerp(g, .02, t); bb = lerp(bb, .03, t); }
        let su = d === 0 ? cv[k] : cu[k], sv = d === 0 ? cu[k] : cv[k]; if (sk && d !== 1) sv = sv * .5 + (sk === 2 ? .5 : 0);                         // texture runs horizontally along the face, up = +y
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
const lavaH = id => id === 30 ? 1 : id === 4 ? .88 : .18 + (id - 22) * .105;       // flowing level 1 is a low sheet, level 7 almost a full block
// height of the lava surface at the corner point (X,Z) of layer y: the average of the four lava / air blocks around it (solids are ignored,
// anything with lava above it counts as full), like Minecraft, so neighbouring blocks always agree and the flow reads as one sloping sheet
function lavaCorner(X, y, Z) {
  let sum = 0, w = 0;
  for (let k = 0; k < 4; k++) {
    const x = X - 1 + (k & 1), z = Z - 1 + (k >> 1), id = get(x, y, z);
    if (isLava(id)) { if (isLava(get(x, y + 1, z))) return 1; const h = lavaH(id), wt = h >= .8 ? 10 : 1; sum += h * wt; w += wt; }
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
  if (useChunks) {
    const old = OW.set(x, y, z, id);                       // -1 = that chunk is not loaded (the edit is still remembered)
    if (old !== -1) markDirty(x, z);
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

