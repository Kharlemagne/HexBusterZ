// ---------------- open world: sky, fog colour per biome, gate portals ----------------
const BIOME_FOG = [[.02, .06, .11], [.13, .02, .07], [.07, .02, .17], [.16, .05, .02]];
let fogCur = FOG.slice();
function owFogTarget(x, z) {                                  // biome tint (dark colours); the day/night cycle (27-daynight.js) decides how bright the haze is
  const w = biomeWeights(x, z), vs = 1 - sstep(clamp((villageD(x, z) - 30) / 50, 0, 1)); const c = [0, 0, 0];
  for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) c[k] += BIOME_FOG[i][k] * w[i];
  return c.map((v, k) => lerp(v, FOG[k], vs));
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
