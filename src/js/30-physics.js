
// ---------------- physics ----------------
function boxHits(x, y, z, hw, h) {
  const x0 = Math.floor(x - hw + 1e-6), x1 = Math.floor(x + hw - 1e-6), y0 = Math.floor(y + 1e-6), y1 = Math.floor(y + h - 1e-6),
    z0 = Math.floor(z - hw + 1e-6), z1 = Math.floor(z + hw - 1e-6);
  for (let yy = y0; yy <= y1; yy++) for (let zz = z0; zz <= z1; zz++) for (let xx = x0; xx <= x1; xx++) {
    const id = get(xx, yy, zz); if (id === 0 || isLava(id)) continue;
    const k = slabKind(id); if (!k) return true;                                  // half blocks only fill half of their cell
    if (k === 3) { for (const q of cellBoxes(id, xx, yy, zz)) if (x + hw > q[0] + 1e-6 && x - hw < q[3] - 1e-6 && z + hw > q[2] + 1e-6 && z - hw < q[5] - 1e-6 && y + h - 1e-6 > q[1] && y + 1e-6 < q[4]) return true; continue; }       // stairs and rails have their own shape
    const lo = yy + (k === 2 ? .5 : 0); if (y + h - 1e-6 > lo && y + 1e-6 < lo + .5) return true;
  }
  return false;
}
// the height a body standing in this footprint rests at (top of the highest block under its feet), or -1e9
function floorUnder(x, y, z, hw) {
  const x0 = Math.floor(x - hw + 1e-6), x1 = Math.floor(x + hw - 1e-6), z0 = Math.floor(z - hw + 1e-6), z1 = Math.floor(z + hw - 1e-6), yy = Math.floor(y + 1e-6); let best = -1e9;
  for (let zz = z0; zz <= z1; zz++) for (let xx = x0; xx <= x1; xx++) { const id = get(xx, yy, zz); if (id === 0 || isLava(id)) continue; const k = slabKind(id); if (k === 3) { for (const q of cellBoxes(id, xx, yy, zz)) if (x + hw > q[0] + 1e-6 && x - hw < q[3] - 1e-6 && z + hw > q[2] + 1e-6 && z - hw < q[5] - 1e-6 && q[4] > y + 1e-6 && q[1] < y + 1.75) best = Math.max(best, q[4]); } else best = Math.max(best, yy + (k === 1 ? .5 : 1)); }
  return best;
}
function ceilingOver(x, y, z, hw, h) {
  const x0 = Math.floor(x - hw + 1e-6), x1 = Math.floor(x + hw - 1e-6), z0 = Math.floor(z - hw + 1e-6), z1 = Math.floor(z + hw - 1e-6), yy = Math.floor(y + h - 1e-6); let best = 1e9;
  for (let zz = z0; zz <= z1; zz++) for (let xx = x0; xx <= x1; xx++) { const id = get(xx, yy, zz); if (id === 0 || isLava(id)) continue; const k = slabKind(id); if (k === 3) { for (const q of cellBoxes(id, xx, yy, zz)) if (x + hw > q[0] + 1e-6 && x - hw < q[3] - 1e-6 && z + hw > q[2] + 1e-6 && z - hw < q[5] - 1e-6 && q[4] > y + h - 1e-6 && q[1] < y + h + 1e-6) best = Math.min(best, q[1]); } else best = Math.min(best, yy + (k === 2 ? .5 : 0)); }
  return best;
}
function moveBody(b, dt, hw, h) {
  const sp = Math.max(Math.abs(b.vx), Math.abs(b.vy), Math.abs(b.vz)) * dt;
  const n = Math.max(1, Math.ceil(sp / .3)), s = dt / n;
  const wasGround = b.onGround; b.hitX = b.hitZ = b.hitY = false; b.onGround = false;
  const stepUp = () => (wasGround || b.vy <= 0.01) && !boxHits(b.x, b.y + .52, b.z, hw, h) && boxHits(b.x, b.y - .06, b.z, hw, .05);       // walk up a half block like a stair
  for (let i = 0; i < n; i++) {
    b.x += b.vx * s; if (boxHits(b.x, b.y, b.z, hw, h)) { if (b.vy <= 0.01 && stepUp()) b.y += .5; else { b.x -= b.vx * s; b.vx = 0; b.hitX = true; } }
    b.z += b.vz * s; if (boxHits(b.x, b.y, b.z, hw, h)) { if (b.vy <= 0.01 && stepUp()) b.y += .5; else { b.z -= b.vz * s; b.vz = 0; b.hitZ = true; } }
    b.y += b.vy * s;
    if (boxHits(b.x, b.y, b.z, hw, h)) {
      if (b.vy < 0) { b.onGround = true; const f = floorUnder(b.x, b.y, b.z, hw); b.y = (f > -1e8 ? f : Math.floor(b.y) + 1) + 1e-4; }
      else { const c = ceilingOver(b.x, b.y, b.z, hw, h); b.y = (c < 1e8 ? c : Math.floor(b.y + h)) - h - 1e-4; }
      b.vy = 0; b.hitY = true;
    }
  }
  if (!useChunks) { b.x = clamp(b.x, .6, N - .6); b.z = clamp(b.z, .6, N - .6); }
}
function rayAABB(ox, oy, oz, dx, dy, dz, mnx, mny, mnz, mxx, mxy, mxz) {
  let t0 = 0, t1 = 1e9;
  const o = [ox, oy, oz], d = [dx, dy, dz], mn = [mnx, mny, mnz], mx = [mxx, mxy, mxz];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) { if (o[i] < mn[i] || o[i] > mx[i]) return null; }
    else {
      let a = (mn[i] - o[i]) / d[i], b = (mx[i] - o[i]) / d[i]; if (a > b) { const t = a; a = b; b = t; }
      if (a > t0) t0 = a; if (b < t1) t1 = b; if (t0 > t1) return null;
    }
  }
  return t0;
}

