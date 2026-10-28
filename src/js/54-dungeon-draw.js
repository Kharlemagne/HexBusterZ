// ---- smoke doors & turrets (drawing) ----
function drawSmoke(t) {
  for (const s of Run.smoke) {
    if (s.ra.visited && s.rb.visited) continue;
    if (s.ra.locked || s.rb.locked) continue;
    const mx = s.xAxis ? s.c : s.u + 3, mz = s.xAxis ? s.u + 3 : s.c;
    if (Math.hypot(P.x - mx, P.z - mz) > 64) continue;
    for (let iu = 0; iu < 6; iu++) for (let iy = 0; iy < 6; iy++) {
      const n = Math.sin(t * 1.3 + iu * .9 + iy * 1.7 + s.c) * .5 + .5, w = Math.sin(t * 2.1 + iu * 1.3 - iy * .7) * .22;
      const cr = .17 + n * .12, cg = .09 + n * .05, cb = .15 + n * .12;
      if (s.xAxis) pushBox(s.c + w, 5.5 + iy, s.u + .5 + iu, 1.5, 1.2, 1.2, cr, cg, cb, null, false);
      else pushBox(s.u + .5 + iu, 5.5 + iy, s.c + w, 1.2, 1.2, 1.5, cr, cg, cb, null, false);
    }
  }
}
function drawTurrets(t) {
  for (const u of Run.turrets) {
    const on = u.on, p = .6 + Math.sin(u.t * (on ? 6 : 3)) * .4;
    pushBox(u.x, u.y + .25, u.z, 1.0, .5, 1.0, .18, .18, .22, null);
    pushBox(u.x, u.y + .55, u.z, .8, .1, .8, on ? .1 : .5, on ? .6 + .3 * p : .06, on ? .8 : .05, null, false);
    const R = mulR(rotY(u.yaw), rotX(-u.pitch)), hy = u.y + .95;
    pushBox(u.x, hy, u.z, .7, .5, .7, .32, .32, .38, R);
    const f = [R[2], R[5], R[8]];
    pushBox(u.x + f[0] * .6, hy + f[1] * .6, u.z + f[2] * .6, .16, .16, .9, .55, .55, .62, R);
    pushBox(u.x, hy + .38, u.z, .2, .2, .2, on ? .3 : 1, on ? 1 : .15, on ? 1 : .1, null, false);
    if (!on) pushBox(u.x, u.y + 2.4 + Math.sin(u.t * 3) * .1, u.z, .24, .24, .24, 1, .2 + .3 * p, .1, rotY(u.t * 2), false);
  }
}

