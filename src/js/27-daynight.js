// ============================================================
//  DAY / NIGHT — one full cycle every `dayLengthSeconds` (data/tuning.json). tod: 0 = midnight, .25 = sunrise, .5 = noon, .75 = sunset.
//  The host owns the clock in co-op (it rides along in every snapshot). Dungeons are always "hell light" and ignore it.
// ============================================================
const SKY_KEYS = [                      // [tod, zenith colour, horizon colour]
  [0.00, [.01, .012, .05], [.05, .07, .17]], [0.20, [.02, .02, .09], [.10, .08, .24]], [0.27, [.14, .08, .32], [1.0, .42, .28]],
  [0.36, [.26, .14, .52], [.95, .55, .55]], [0.50, [.30, .16, .56], [.98, .62, .68]], [0.64, [.26, .13, .50], [.95, .52, .50]],
  [0.73, [.13, .06, .30], [1.0, .30, .18]], [0.80, [.04, .02, .12], [.30, .10, .28]], [1.00, [.01, .012, .05], [.05, .07, .17]]
];
const DayNight = {
  t: .32, target: null, len: (DATA.tuning.dayLengthSeconds || 600),
  tick(dt) {
    this.t = (this.t + dt / this.len) % 1;
    if (Net.role === 'client' && this.target !== null) { const d = ((this.target - this.t + 1.5) % 1) - .5; this.t = (this.t + d * Math.min(1, dt * 1.5) + 1) % 1; }      // follow the host's clock
  },
  load() { this.t = clamp(+SaveStore.doc.world.time || .3, 0, .9999); },
  collect() { if (Net.role !== 'client') SaveStore.doc.world.time = Math.round(this.t * 10000) / 10000; },
  clock() { const m = Math.floor(this.t * 1440), h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; },
  isNight() { return this.state(0, 0).amb < .5; },
  state(x, z) {
    const t = this.t; let i = 0; while (i < SKY_KEYS.length - 2 && t >= SKY_KEYS[i + 1][0]) i++;
    const a = SKY_KEYS[i], b = SKY_KEYS[i + 1], k = sstep(clamp((t - a[0]) / (b[0] - a[0]), 0, 1));
    const zen = [0, 1, 2].map(j => lerp(a[1][j], b[1][j], k)), hor = [0, 1, 2].map(j => lerp(a[2][j], b[2][j], k));
    const ang = (t - .25) * TAU, sunD = norm3([Math.cos(ang) * .9, Math.sin(ang), .35]), elev = sunD[1], moonD = norm3([-sunD[0] * .8 + .3, -sunD[1], -.8]);
    const moonR = norm3([-moonD[2], 0, moonD[0]]), moonU = [moonD[1] * moonR[2] - moonD[2] * moonR[1], moonD[2] * moonR[0] - moonD[0] * moonR[2], moonD[0] * moonR[1] - moonD[1] * moonR[0]];
    const amb = .3 + .7 * sstep(clamp((elev + .1) / .38, 0, 1)), stars = 1 - sstep(clamp((elev + .18) / .22, 0, 1)), sunA = sstep(clamp((elev + .1) / .4, 0, 1));
    // far terrain fades to a slightly darker, biome-tinted haze than the sky right above it, so the horizon reads as a line
    const bt = x === 0 && z === 0 ? [.1, .1, .1] : owFogTarget(x, z), bm = Math.max(bt[0], bt[1], bt[2], .01), hm = Math.max(hor[0], hor[1], hor[2]);
    const fog = [0, 1, 2].map(j => lerp(hor[j] * .66, bt[j] / bm * hm * .66, .3));
    return { zen, hor, fog, sunD, moonD, moonR, moonU, amb, stars, sunA, elev };
  }
};
let skyLoc = null;
function drawSkyDome(f, roll, fovy, asp, sk) {
  let sx = -f[2], sz = f[0]; const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl; let sy = 0;
  let ux = sy * f[2] - sz * f[1], uy = sz * f[0] - sx * f[2], uz = sx * f[1] - sy * f[0];
  if (roll) { const c = Math.cos(roll), s = Math.sin(roll); const nsx = sx * c + ux * s, nsy = sy * c + uy * s, nsz = sz * c + uz * s; ux = -sx * s + ux * c; uy = -sy * s + uy * c; uz = -sz * s + uz * c; sx = nsx; sy = nsy; sz = nsz; }
  if (!skyLoc) { skyLoc = {}; for (const n of ['fwd', 'rgt', 'upv', 'zen', 'hor', 'gnd', 'sunD', 'moonD', 'moonR', 'moonU', 'tanf', 'stars', 'sunA', 'tm']) skyLoc[n] = gl.getUniformLocation(skyProg, n); }
  gl.useProgram(skyProg); gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
  for (const k of [1, 2, 3]) gl.disableVertexAttribArray(k);
  gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const L = skyLoc, th = Math.tan(fovy / 2);
  gl.uniform3fv(L.fwd, f); gl.uniform3f(L.rgt, sx, sy, sz); gl.uniform3f(L.upv, ux, uy, uz);
  gl.uniform3fv(L.zen, sk.zen); gl.uniform3fv(L.hor, sk.hor); gl.uniform3fv(L.gnd, sk.fog); gl.uniform3fv(L.sunD, sk.sunD); gl.uniform3fv(L.moonD, sk.moonD); gl.uniform3fv(L.moonR, sk.moonR); gl.uniform3fv(L.moonU, sk.moonU);
  gl.uniform2f(L.tanf, th * asp, th); gl.uniform1f(L.stars, sk.stars); gl.uniform1f(L.sunA, sk.sunA); gl.uniform1f(L.tm, T);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.useProgram(prog); gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
  for (const k of [1, 2, 3]) gl.enableVertexAttribArray(k);
}
