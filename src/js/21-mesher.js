// ---------------- chunk meshing (vertex colour + baked AO) ----------------
const COL = Object.fromEntries(Object.entries(DATA.blocks.colors).map(([k, v]) => [k, hx(parseInt(v.slice(1), 16))]));   // data/blocks.json
const EMIT = new Set(DATA.blocks.emissive);
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
    const b = COL[id], em = EMIT.has(id), bl = ch ? (ch.blood ? ch.blood[li] : 0) : blood[idx(x, y, z)];
    const vr = .86 + hash(x * 7 + y * 13, z * 5 + y * 3) * .28;
    for (let d = 0; d < 3; d++) for (let s = -1; s <= 1; s += 2) {
      n[0] = n[1] = n[2] = 0; n[d] = s;
      if (get(x + n[0], y + n[1], z + n[2]) !== 0) continue;
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
        if (id === 4 && P[1] > y + .5 && get(x, y + 1, z) !== 4) P[1] -= .12;               // lava never fills its whole block (like the real thing)
        let m = em ? 1 : sh * AOV[ao[k]] * vr, r = b[0] * m, g = b[1] * m, bb = b[2] * m;
        if (em) { const f = .85 + hash(x + k, z + y) * .3; r *= f; g *= f; bb *= f; }
        if (bl && !em) { const t = Math.min(.85, bl * .3); r = lerp(r, .42, t); g = lerp(g, .02, t); bb = lerp(bb, .03, t); }
        const su = d === 0 ? cv[k] : cu[k], sv = d === 0 ? cu[k] : cv[k];                         // texture runs horizontally along the face, up = +y
        verts.push(P[0], P[1], P[2], r, g, bb, 1, flipU ? 1 - su : su, flipV ? 1 - sv : sv, tileV);
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

