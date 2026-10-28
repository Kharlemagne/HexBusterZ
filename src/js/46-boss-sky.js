// ---------------- hellscape sky for the open-ceiling boss arena ----------------
let sky = null;
function genSky(cx, cz) {
  setWorldSeed((Run.seed || 1) ^ 0x5C7)  ;
  const L = []; const add = (x, y, z, sx, sy, sz, c, o) => L.push(Object.assign({ x: cx + x, y, z: cz + z, sx, sy, sz, c }, o || {}));
  const eye = (x, y, z, ax, s) => { const t = 4; const d = (a, b, c) => ax === 'z' ? [a, b, c] : [c, b, a];
    const B = (a, b, c, sa, sb, sc, col, o) => { const p = d(a, b, c), q = d(sa, sb, sc); add(x + p[0], y + p[1], z + p[2], q[0], q[1], q[2], col, o); };
    B(0, 0, 0, s, s * .8, t, [.78, .68, .6]); B(0, 0, t * .6, s * .55, s * .55, t, [.95, .1, .06], { pulse: 1 }); B(0, 0, t * 1.2, s * .36, s * .36, t, [1, .45, .1], { pulse: 1 }); B(0, 0, t * 1.8, s * .1, s * .5, t, [0, 0, 0]);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; B(Math.cos(a) * s * .42, Math.sin(a) * s * .34, t * .6, s * .22, s * .035, t * .4, [.7, .05, .08]); } };
  eye(0, 125, -190, 'z', 90); eye(200, 95, 10, 'x', 70); eye(-200, 105, 30, 'x', 60); eye(30, 135, 200, 'z', 64);
  for (let i = 0; i < 16; i++) {
    const a = rw(TAU), r = rw(85, 200), x = Math.cos(a) * r, z = Math.sin(a) * r, y = rw(32, 125), s = rw(16, 40), ph = rw(TAU);
    add(x, y, z, s, 6, s * .85, [.15, .1, .17], { bob: ph }); add(x, y - 5, z, s * .75, 5, s * .65, [.12, .08, .13], { bob: ph }); add(x, y - 9.5, z, s * .5, 4, s * .42, [.1, .06, .1], { bob: ph }); add(x, y - 13, z, s * .25, 4, s * .2, [.09, .05, .09], { bob: ph });
    for (let k = 0; k < 4; k++) add(x + rw(-s * .3, s * .3), y + 3.2, z + rw(-s * .3, s * .3), rw(3, 7), .5, rw(1, 2.5), [1, .4, .05], { bob: ph, flick: 1 });
    add(x + rw(-s * .2, s * .2), y + 10, z + rw(-s * .2, s * .2), 2, 18, 2, [.2, .12, .2], { bob: ph }); add(x, y - 15 - rw(10, 30), z, 2, rw(25, 60), 2, [1, .45, .08], { bob: ph, flick: 1 });
  }
  for (let q = 0; q < 4; q++) { const a = q * TAU / 4 + rw(-.3, .3), r = 150, ox = Math.cos(a) * r, oz = Math.sin(a) * r, tx = -Math.sin(a), tz = Math.cos(a);
    for (let j = 0; j <= 14; j++) { const an = j / 14 * Math.PI; add(ox + tx * Math.cos(an) * 45, 6 + Math.sin(an) * 75, oz + tz * Math.cos(an) * 45, 8, 8, 8, [.72, .66, .56]); if (j % 3 === 0) add(ox + tx * Math.cos(an) * 45, 6 + Math.sin(an) * 75, oz + tz * Math.cos(an) * 45, 3, 3, 12, [.45, .4, .35]); } }
  for (let i = 0; i < 16; i++) { const a = rw(TAU), r = rw(50, 190), x = Math.cos(a) * r, z = Math.sin(a) * r, ph = rw(TAU);
    for (let j = 0; j < 16; j++) add(x, 150 - j * 7, z, 3.8 - j * .08, 7.4, 3.8 - j * .08, [.52 - j * .014, .1, .22 - j * .005], { sway: [ph + j * .45, 3 + j * .35, ph] });
    add(x, 150 - 16 * 7, z, 4, 4, 4, [1, .85, .2], { sway: [ph + 16 * .45, 3 + 16 * .35, ph], flick: 1 }); }
  for (let i = 0; i < 12; i++) { const a = rw(TAU), r = rw(110, 220); add(Math.cos(a) * r, 45, Math.sin(a) * r, rw(3, 6), 200, rw(3, 6), [1, .4, .06], { flick: 1 }); }
  for (let i = 0; i < 28; i++) { const a = i / 28 * TAU + rw(-.1, .1), r = rw(215, 240), h = rw(55, 130), s = rw(40, 75); add(Math.cos(a) * r, h / 2 - 12, Math.sin(a) * r, s, h, s, [.07, .04, .09]); add(Math.cos(a) * (r - s * .45), h * .3, Math.sin(a) * (r - s * .45), 3, h * .3, 3, [1, .3, .04], { flick: 1 }); }
  for (const [x, z] of [[-110, -120], [120, -100], [-130, 100], [100, 130], [0, -150], [150, 20], [-150, 10]]) add(x, 62 + rw(-10, 25), z, 14, 14, 14, [.82, .76, .66], { bob: rw(TAU), skull: 1 });
  return L;
}
function drawSky(t) {
  if (!sky) return;
  for (const o of sky) {
    let c = o.c, y = o.y, x = o.x;
    if (o.bob !== undefined) y += Math.sin(t * .35 + o.bob) * 2.5;
    if (o.sway) x += Math.sin(t * .7 + o.sway[0]) * o.sway[1] * .6;
    if (o.pulse) { const p = .7 + Math.sin(t * 2.2) * .3; c = [c[0] * p, c[1] * p, c[2] * p]; }
    if (o.flick) { const p = .75 + Math.sin(t * 9 + o.x * .13 + o.y) * .25; c = [c[0] * p, c[1] * p, c[2] * p]; }
    pushBox(x, y, o.z, o.sx, o.sy, o.sz, c[0], c[1], c[2], null, false, 0);
    if (o.skull) { const dx = Run.cx - o.x, dz = Run.cz - o.z, big = Math.abs(dx) > Math.abs(dz), sg = big ? Math.sign(dx) : Math.sign(dz);
      for (const k of [-1, 1]) { if (big) pushBox(x + sg * 7.2, y + 2, o.z + k * 3.2, 1, 3.4, 3.4, 1, .45 + .2 * Math.sin(t * 3), .05, null, false, 0); else pushBox(x + k * 3.2, y + 2, o.z + sg * 7.2, 3.4, 3.4, 1, 1, .45 + .2 * Math.sin(t * 3), .05, null, false, 0); }
      pushBox(x, y - 8, o.z, 9, 4, 9, .7, .65, .55, null, false, 0); }
  }
}
const ASH = []; for (let i = 0; i < 150; i++) ASH.push({ x: rnd(-40, 40), y: rnd(0, 45), z: rnd(-40, 40), s: rnd(.07, .18), v: rnd(1.5, 4) });
function drawAsh(dt, t) {
  for (const a of ASH) { a.y -= a.v * dt; a.x += Math.sin(t * .8 + a.z) * dt; if (a.y < -2) { a.y = 45; a.x = rnd(-40, 40); a.z = rnd(-40, 40); }
    const warm = a.s > .13; pushBox(P.x + a.x, a.y + 3, P.z + a.z, a.s, a.s, a.s, warm ? 1 : .45, warm ? .4 : .38, warm ? .1 : .4, null, false, 1); }
}

