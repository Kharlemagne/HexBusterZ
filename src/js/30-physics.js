
// ---------------- physics ----------------
function boxHits(x, y, z, hw, h) {
  const x0 = Math.floor(x - hw + 1e-6), x1 = Math.floor(x + hw - 1e-6), y0 = Math.floor(y + 1e-6), y1 = Math.floor(y + h - 1e-6),
    z0 = Math.floor(z - hw + 1e-6), z1 = Math.floor(z + hw - 1e-6);
  for (let yy = y0; yy <= y1; yy++) for (let zz = z0; zz <= z1; zz++) for (let xx = x0; xx <= x1; xx++) if (solid(xx, yy, zz)) return true;
  return false;
}
function moveBody(b, dt, hw, h) {
  const sp = Math.max(Math.abs(b.vx), Math.abs(b.vy), Math.abs(b.vz)) * dt;
  const n = Math.max(1, Math.ceil(sp / .3)), s = dt / n;
  b.hitX = b.hitZ = b.hitY = false; b.onGround = false;
  for (let i = 0; i < n; i++) {
    b.x += b.vx * s; if (boxHits(b.x, b.y, b.z, hw, h)) { b.x -= b.vx * s; b.vx = 0; b.hitX = true; }
    b.z += b.vz * s; if (boxHits(b.x, b.y, b.z, hw, h)) { b.z -= b.vz * s; b.vz = 0; b.hitZ = true; }
    b.y += b.vy * s;
    if (boxHits(b.x, b.y, b.z, hw, h)) {
      if (b.vy < 0) { b.onGround = true; b.y = Math.floor(b.y) + 1 + 1e-4; }
      else b.y = Math.floor(b.y + h) - h - 1e-4;
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

