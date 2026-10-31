// ============================================================
//  COLOURED LIGHT. Neon, lamp panels, windows and a few glowing stones throw coloured light into the air around them (up to ~10 blocks, falling off
//  one step per block, red / green / blue spread separately so colours mix). It is worked out when a chunk is meshed (a small flood fill over the chunk plus
//  its surroundings) and baked into the vertex colours, so it costs nothing per frame. Chunks with no emitter nearby skip it entirely.
// ============================================================
const LMAX = 10, LGAIN = 1.15;
const LV = new Uint8Array(REG_N), LC = new Float32Array(REG_N * 3);               // by BASE id: light level and colour of an emitter
(function () {
  const lvl = { 14: 9, 15: 9, 19: 6, 6: 6, 11: 7, 22: 5, 38: 4, 39: 4, 40: 12, 41: 10, 42: 10, 43: 10 };
  for (const k in lvl) LV[k] = lvl[k];
  for (let i = 0; i < MATS.length; i++) if (MATS[i].emissive) LV[MAT0 + i] = 10;
  const col = id => { const c = hx(parseInt(DATA.blocks.colors[id].slice(1), 16)), m = Math.max(c[0], c[1], c[2], .01); return [c[0] / m, c[1] / m, c[2] / m]; };
  for (let i = 0; i < REG_N; i++) if (LV[i]) { const c = col(i); LC[i * 3] = c[0]; LC[i * 3 + 1] = c[1]; LC[i * 3 + 2] = c[2]; }
})();
const emits = id => LV[BASE[id]] > 0 && !isLava(id);
let LT = null;                                                                 // the light field of the chunk being meshed
function computeLight(cx, cz, yTop) {
  const M = LMAX, W = 16 + 2 * M, x0 = cx * CS - M, z0 = cz * CS - M, Hh = yTop + 1;
  let any = false;
  for (let dz = -1; dz <= 1 && !any; dz++) for (let dx = -1; dx <= 1; dx++) { const c = OW.chunks.get(ckey(cx + dx, cz + dz)); if (c && c.em) { any = true; break; } }
  if (!any) return null;
  const n = W * W * Hh, R = new Uint8Array(n), G = new Uint8Array(n), Bl = new Uint8Array(n), OP = new Uint8Array(n), q = [];
  const I = (x, y, z) => (y * W + (z - z0)) * W + (x - x0);
  for (let y = 1; y < Hh; y++) for (let z = z0; z < z0 + W; z++) for (let x = x0; x < x0 + W; x++) {
    const id = get(x, y, z); if (!id || isLava(id)) continue; const i = I(x, y, z);
    if (!KIND[id]) OP[i] = 1;
    const l = LV[BASE[id]]; if (l) { const b = BASE[id]; R[i] = Math.round(l * LC[b * 3]); G[i] = Math.round(l * LC[b * 3 + 1]); Bl[i] = Math.round(l * LC[b * 3 + 2]); q.push(i); }
  }
  const SX = [1, -1, 0, 0, 0, 0], SY = [0, 0, 1, -1, 0, 0], SZ = [0, 0, 0, 0, 1, -1], WW = W * W;
  for (let h = 0; h < q.length; h++) {
    const i = q[h], r = R[i], g = G[i], b = Bl[i]; if (r <= 1 && g <= 1 && b <= 1) continue;
    const x = i % W, z = ((i / W) | 0) % W, y = (i / WW) | 0;
    for (let k = 0; k < 6; k++) {
      const nx = x + SX[k], ny = y + SY[k], nz = z + SZ[k]; if (nx < 0 || nz < 0 || nx >= W || nz >= W || ny < 1 || ny >= Hh) continue;
      const j = (ny * W + nz) * W + nx; if (OP[j]) continue;
      const nr = r > 0 ? r - 1 : 0, ng = g > 0 ? g - 1 : 0, nb = b > 0 ? b - 1 : 0;
      if (nr > R[j] || ng > G[j] || nb > Bl[j]) { if (nr > R[j]) R[j] = nr; if (ng > G[j]) G[j] = ng; if (nb > Bl[j]) Bl[j] = nb; q.push(j); }
    }
  }
  return { R, G, B: Bl, OP, W, x0, z0, Hh };
}
// average light around a vertex of a face: the four cells touching it in the plane in front of the face (solid ones don't count). out = [r,g,b] in 0..1
function vertexLight(out, c0, c1, c2, c3) {
  let r = 0, g = 0, b = 0, n = 0; const L = LT;
  for (const c of [c0, c1, c2, c3]) { if (c < 0 || L.OP[c]) continue; r += L.R[c]; g += L.G[c]; b += L.B[c]; n++; }
  const k = n ? 1 / (n * LMAX) : 0; out[0] = r * k; out[1] = g * k; out[2] = b * k;
}
const lcell = (x, y, z) => { const L = LT, lx = x - L.x0, lz = z - L.z0; if (lx < 0 || lz < 0 || lx >= L.W || lz >= L.W || y < 1 || y >= L.Hh) return -1; return (y * L.W + lz) * L.W + lx; };
