// ---------------- chunk meshing (vertex colour + baked AO) ----------------
const COL = { 11: hx(0xd9a441), 9: hx(0xff2a38), 10: hx(0x2a2236), 1: hx(0x3a3545), 2: hx(0x8c2418), 3: hx(0x1a1028), 4: hx(0xff7a10), 5: hx(0xd8cdb4), 6: hx(0xff4a1c), 7: hx(0xb02838), 8: hx(0x7f8a9c) };
const EMIT = new Set([4, 6, 9, 11]);
const SHADE = [[.74, .74], [.46, 1], [.86, .86]];
const AOV = [.42, .64, .84, 1];
const chunkBuf = [], chunkCount = [], dirty = new Set();
let gl, prog, loc = {};
function buildChunk(cx, cz) {
  const out = []; const x0 = cx * CS, z0 = cz * CS;
  const n = [0, 0, 0], p = [0, 0, 0], q = [0, 0, 0], ao = [0, 0, 0, 0];
  const cu = [0, 1, 1, 0], cv = [0, 0, 1, 1];
  for (let y = 0; y < H; y++) for (let z = z0; z < z0 + CS; z++) for (let x = x0; x < x0 + CS; x++) {
    const id = world[idx(x, y, z)]; if (!id) continue;
    const b = COL[id], em = EMIT.has(id), bl = blood[idx(x, y, z)];
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
      const verts = [];
      for (let k = 0; k < 4; k++) {
        const P = [x, y, z]; P[d] += s > 0 ? 1 : 0; P[u] += cu[k]; P[v] += cv[k];
        let m = em ? 1 : sh * AOV[ao[k]] * vr, r = b[0] * m, g = b[1] * m, bb = b[2] * m;
        if (em) { const f = .85 + hash(x + k, z + y) * .3; r *= f; g *= f; bb *= f; }
        if (bl && !em) { const t = Math.min(.85, bl * .3); r = lerp(r, .42, t); g = lerp(g, .02, t); bb = lerp(bb, .03, t); }
        verts.push(P[0], P[1], P[2], r, g, bb, 1);
      }
      const flip = ao[0] + ao[2] < ao[1] + ao[3];
      const tri = flip ? [1, 2, 3, 1, 3, 0] : [0, 1, 2, 0, 2, 3];
      for (const k of tri) for (let j = 0; j < 7; j++) out.push(verts[k * 7 + j]);
    }
  }
  if (!out.length) { if (!chunkCount[cx]) chunkCount[cx] = []; chunkCount[cx][cz] = 0; return; }
  const arr = new Float32Array(out);
  if (!chunkBuf[cx]) chunkBuf[cx] = [];
  if (!chunkCount[cx]) chunkCount[cx] = [];
  if (!chunkBuf[cx][cz]) chunkBuf[cx][cz] = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, chunkBuf[cx][cz]);
  gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
  chunkCount[cx][cz] = arr.length / 7;
}
function buildAll() { for (let cx = 0; cx < NC; cx++) for (let cz = 0; cz < NC; cz++) buildChunk(cx, cz); dirty.clear(); }
function markDirty(x, z) {
  const cx = Math.floor(x / CS), cz = Math.floor(z / CS);
  const add = (a, b) => { if (a >= 0 && b >= 0 && a < NC && b < NC) dirty.add(a * 100 + b); };
  add(cx, cz);
  const lx = x - cx * CS, lz = z - cz * CS;
  if (lx === 0) add(cx - 1, cz); if (lx === CS - 1) add(cx + 1, cz);
  if (lz === 0) add(cx, cz - 1); if (lz === CS - 1) add(cx, cz + 1);
}
function setBlock(x, y, z, id) {
  if (x < 0 || z < 0 || x >= N || z >= N || y < 1 || y >= H) return false;
  const i = idx(x, y, z), old = world[i]; world[i] = id; blood[i] = 0; markDirty(x, z);
  if (old !== id) for (const fn of blockListeners) fn(x, y, z, id, old);
  return true;
}
function bloodAt(x, y, z) {
  if (x < 0 || z < 0 || x >= N || z >= N || y < 0 || y >= H) return;
  const i = idx(x, y, z); if (!world[i] || EMIT.has(world[i])) return;
  if (blood[i] < 3) { blood[i]++; markDirty(x, z); }
}

