// ---------------- particles (gore, debris, fire) ----------------
const MAXP = 2400;
const PX = new Float32Array(MAXP), PY = new Float32Array(MAXP), PZ = new Float32Array(MAXP),
  VX = new Float32Array(MAXP), VY = new Float32Array(MAXP), VZ = new Float32Array(MAXP),
  PL = new Float32Array(MAXP), PS = new Float32Array(MAXP), PR = new Float32Array(MAXP), PG = new Float32Array(MAXP), PB = new Float32Array(MAXP),
  PK = new Uint8Array(MAXP), PST = new Uint8Array(MAXP);
let pIdx = 0;
// kinds: 0 debris(lit) 1 blood(lit, stains) 2 fire(emissive)
function emit(x, y, z, vx, vy, vz, size, col, life, kind) {
  const i = pIdx; pIdx = (pIdx + 1) % MAXP;
  PX[i] = x; PY[i] = y; PZ[i] = z; VX[i] = vx; VY[i] = vy; VZ[i] = vz; PS[i] = size; PL[i] = life; PK[i] = kind; PST[i] = 0;
  PR[i] = col[0]; PG[i] = col[1]; PB[i] = col[2];
}
function updateParticles(dt) {
  for (let i = 0; i < MAXP; i++) {
    if (PL[i] <= 0) continue;
    PL[i] -= dt;
    if (PST[i]) continue;
    const k = PK[i];
    VY[i] -= (k === 2 ? -3 : 24) * dt;
    if (k === 2) { VX[i] *= 1 - 2.2 * dt; VZ[i] *= 1 - 2.2 * dt; }
    let nx = PX[i] + VX[i] * dt, ny = PY[i] + VY[i] * dt, nz = PZ[i] + VZ[i] * dt;
    if (k === 2) { if (solid(Math.floor(nx), Math.floor(ny), Math.floor(nz))) PL[i] = 0; }
    else {
      if (solid(Math.floor(nx), Math.floor(PY[i]), Math.floor(PZ[i]))) { VX[i] *= -.3; nx = PX[i]; }
      if (solid(Math.floor(PX[i]), Math.floor(PY[i]), Math.floor(nz))) { VZ[i] *= -.3; nz = PZ[i]; }
      if (solid(Math.floor(nx), Math.floor(ny), Math.floor(nz))) {
        if (VY[i] < 0) {
          const cy = Math.floor(ny); PST[i] = 1; VX[i] = VY[i] = VZ[i] = 0; ny = cy + 1 + PS[i] * .5;
          if (k === 1 && Math.random() < .4) bloodAt(Math.floor(nx), cy, Math.floor(nz));
        } else { VY[i] *= -.3; ny = PY[i]; }
      }
    }
    PX[i] = nx; PY[i] = ny; PZ[i] = nz;
  }
}
function drawParticles() {
  for (let i = 0; i < MAXP; i++) {
    if (PL[i] <= 0) continue;
    const s = PS[i] * Math.min(1, PL[i] * 2.5); if (s < .01) continue;
    pushBox(PX[i], PY[i], PZ[i], s, s, s, PR[i], PG[i], PB[i], null, PK[i] !== 2);
  }
}
const BLOODS = [hx(0xb01018), hx(0x8a0a12), hx(0xd01c20), hx(0x60060c)];
const BONES = [hx(0xd8cdb4), hx(0xb8ad94)], MEAT = [hx(0x5a1018), hx(0x3a0a12), hx(0x7a2028)];
function bloodBurst(x, y, z, n, dir, spd) {
  for (let i = 0; i < n; i++) {
    const a = rnd(TAU), s = rnd(1, 4 + spd * 4);
    emit(x, y, z, Math.cos(a) * s + (dir ? dir.x * rnd(1, 5) : 0), rnd(0, 5) + (dir ? dir.y * 2 : 0), Math.sin(a) * s + (dir ? dir.z * rnd(1, 5) : 0),
      rnd(.06, .15), BLOODS[(Math.random() * 4) | 0], rnd(3, 7), 1);
  }
}
function sparkBurst(x, y, z, n, col, spd) {
  Net.fx('spark', [r2(x), r2(y), r2(z), n, col, spd]);
  for (let i = 0; i < n; i++) {
    const a = rnd(TAU), b = rnd(-1, 1), s = rnd(1, spd);
    emit(x, y, z, Math.cos(a) * s * (1 - Math.abs(b) * .3), b * s + 1, Math.sin(a) * s * (1 - Math.abs(b) * .3), rnd(.05, .12), col, rnd(.25, .6), 2);
  }
}
// embers
const EMB = []; for (let i = 0; i < 140; i++) EMB.push({ x: rnd(N), y: rnd(2, 36), z: rnd(N), s: rnd(.05, .13) });
function drawEmbers(dt, t) {
  for (const e of EMB) {
    e.y += dt * (1 + e.s * 8); e.x += Math.sin(t * .7 + e.z) * dt * .6; if (e.y > 38) { e.y = 1; e.x = rnd(N); e.z = rnd(N); }
    pushBox(e.x, e.y, e.z, e.s, e.s, e.s, 1, .45 + e.s * 2, .1, null, false, 1);
  }
}

