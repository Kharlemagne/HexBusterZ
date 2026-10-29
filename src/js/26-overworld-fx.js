// ---------------- open world: sky, fog colour per biome, gate portals ----------------
const BIOME_FOG = [[.02, .06, .11], [.13, .02, .07], [.07, .02, .17], [.16, .05, .02]];
let fogCur = FOG.slice();
function owFogTarget(x, z) {
  const w = biomeWeights(x, z), vs = 1 - sstep(clamp((villageD(x, z) - 30) / 50, 0, 1)); const c = [0, 0, 0];
  for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) c[k] += BIOME_FOG[i][k] * w[i];
  return c.map((v, k) => lerp(v, FOG[k], vs));
}
function updateFog(dt, x, z) { const t = owFogTarget(x, z), k = Math.min(1, dt * .8); for (let i = 0; i < 3; i++) fogCur[i] += (t[i] - fogCur[i]) * k; }
// a giant dim "eye" + broken ring hanging in the sky, and a neon horizon, drawn relative to the camera (no fog, so they sit at infinity)
function drawOwSky(t) {
  const cx = camX - 120, cy = camY + 100, cz = camZ - 200, pul = .55 + Math.sin(t * .6) * .15;
  for (let i = 0; i < 36; i++) { const a = i / 36 * TAU + t * .02, r = 46; if (i % 7 === 3) continue; pushBox(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz, 5, 5, 3, .35, .08, .55, null, false, 0); }
  pushBox(cx, cy, cz, 30, 30, 3, .07, .01, .14, null, false, 0);
  pushBox(cx, cy, cz + 1, 12 * pul + 6, 24, 3, 1, .1, .5 * pul, null, false, 0);          // the slit-pupil
  for (let i = 0; i < 18; i++) { const a = i * 0.7 + 1, d = 230; const x = camX + Math.cos(a) * d, z = camZ + Math.sin(a) * d, hh = 14 + ih(i, 0, 0, 5) * 40; pushBox(x, camY - 20 + hh / 2, z, 4 + ih(i, 1, 0, 5) * 8, hh, 4 + ih(i, 2, 0, 5) * 8, .02, .03, .07, null, false, 0); pushBox(x, camY - 20 + hh * (.3 + ih(i, 3, 0, 5) * .6), z, 5, .8, 5, (i & 1) ? 0 : .9, (i & 1) ? .9 : .15, 1, null, false, 0); }
}
function drawGatePortals(t) {
  for (const g of gatesNear(camX, camZ, 150)) {
    for (let iy = 0; iy < 8; iy++) for (let ix = 0; ix < 5; ix++) {
      const x = g.x - 2 + ix + .5, y = g.y + 1.5 + iy, a = Math.sin(t * 2.2 + ix * .7 + iy * .5) * .5 + .5, b = Math.sin(t * 3.1 - iy * .8 + ix * .4) * .5 + .5;
      pushBox(x, y, g.z + .5 + Math.sin(t * 2 + ix + iy) * .1, 1, 1, .5, .25 + a * .75, .02 + b * .12, .08 + (1 - a) * .55 * b, null, false);
    }
    if (Math.random() < .6) emit(g.x + rnd(-2.5, 2.5), g.y + rnd(1, 8), g.z + .5, rnd(-.3, .3), rnd(1, 4), rnd(-.3, .3), rnd(.08, .16), Math.random() < .5 ? [.7, .2, 1] : [1, .2, .3], rnd(.5, 1.2), 2);
  }
}
