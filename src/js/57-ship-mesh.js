// ============================================================
//  SHIP BLOCKS — geometry.  Every ship block is a tiny mesh inside a unit cell (-.5 .. .5 on each axis).
//  A face is { v: [[x,y,z]..], n: normal, t: colour tag }.   Tags:  p = the colour you paint it   a = dark metal
//                                                                    g = glass   e = orange glow   m = magenta glow
//  Rotations are in quarter turns (rx, ry, rz); a block can also be mirrored left-right (used by the symmetry tool).
//  Part stats and prices live in data/shipparts.json; only the shapes live here.
// ============================================================
const ShipMesh = (() => {
  let F = [];
  function poly(v, t, c0) {
    let nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < v.length; i++) { const a = v[i], b = v[(i + 1) % v.length]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); }
    const l = Math.hypot(nx, ny, nz); if (l < 1e-6) return; nx /= l; ny /= l; nz /= l;
    let cx = 0, cy = 0, cz = 0; for (const p of v) { cx += p[0]; cy += p[1]; cz += p[2]; } cx /= v.length; cy /= v.length; cz /= v.length;
    if ((cx - c0[0]) * nx + (cy - c0[1]) * ny + (cz - c0[2]) * nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
    F.push({ v, n: [nx, ny, nz], c: [cx, cy, cz], t });
  }
  function box(x0, y0, z0, x1, y1, z1, t) {
    t = t || 'p'; const c = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
    poly([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], t, c); poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], t, c);
    poly([[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], t, c); poly([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], t, c);
    poly([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], t, c); poly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], t, c);
  }
  const at = (axis, u, v, w) => axis === 'x' ? [w, v, u] : axis === 'y' ? [u, w, v] : [u, v, w];     // x: (u,v)=(z,y)   y: (u,v)=(x,z)   z: (u,v)=(x,y)
  function ext(axis, pts, a, b, t) {                                                                    // extrude a convex 2D shape along an axis
    t = t || 'p'; let su = 0, sv = 0; for (const p of pts) { su += p[0]; sv += p[1]; } const c = at(axis, su / pts.length, sv / pts.length, (a + b) / 2);
    for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; poly([at(axis, p[0], p[1], a), at(axis, q[0], q[1], a), at(axis, q[0], q[1], b), at(axis, p[0], p[1], b)], t, c); }
    poly(pts.map(p => at(axis, p[0], p[1], a)), t, c); poly(pts.map(p => at(axis, p[0], p[1], b)), t, c);
  }
  function ring(axis, w, r, n, o) { const pts = []; for (let k = 0; k < n; k++) { const an = (k + .5) / n * Math.PI * 2; pts.push(at(axis, o[0] + r * Math.cos(an), o[1] + r * Math.sin(an), w)); } return pts; }
  function fr(axis, a, b, r0, r1, n, t, ca, cb, o) {                                                    // a cylinder / cone frustum from a to b along an axis
    o = o || [0, 0]; const c = at(axis, o[0], o[1], (a + b) / 2), A = ring(axis, a, r0, n, o), B = ring(axis, b, r1, n, o);
    for (let k = 0; k < n; k++) poly([A[k], A[(k + 1) % n], B[(k + 1) % n], B[k]], t, c);
    if (ca) poly(A, ca, c); if (cb) poly(B, cb, c);
  }
  function disc(axis, w, r, n, t, o) { o = o || [0, 0]; poly(ring(axis, w, r, n, o), t, at(axis, o[0], o[1], w - 1)); }   // (a glowing face; faces +axis)
  function dome(cx, cy, cz, r, rings, n, t) {
    const R = (j) => { const ph = j / rings * Math.PI / 2; return [r * Math.cos(ph), cy + r * Math.sin(ph)]; };
    for (let j = 0; j < rings; j++) { const a = R(j), b = R(j + 1); for (let k = 0; k < n; k++) { const t0 = k / n * Math.PI * 2, t1 = (k + 1) / n * Math.PI * 2;
      poly([[cx + a[0] * Math.cos(t0), a[1], cz + a[0] * Math.sin(t0)], [cx + a[0] * Math.cos(t1), a[1], cz + a[0] * Math.sin(t1)], [cx + b[0] * Math.cos(t1), b[1], cz + b[0] * Math.sin(t1)], [cx + b[0] * Math.cos(t0), b[1], cz + b[0] * Math.sin(t0)]], t, [cx, cy - .2, cz]); } }
    const base = []; for (let k = 0; k < n; k++) base.push([cx + r * Math.cos(k / n * Math.PI * 2), cy, cz + r * Math.sin(k / n * Math.PI * 2)]); poly(base, t, [cx, cy + .3, cz]);
  }
  const SHAPES = {
    cube() { box(-.5, -.5, -.5, .5, .5, .5); },
    slab() { box(-.5, -.5, -.5, .5, 0, .5); },
    ramp() { ext('x', [[-.5, -.5], [.5, -.5], [.5, .5]], -.5, .5); },
    corner() { const A = [-.5, -.5, -.5], B = [.5, -.5, -.5], C = [-.5, -.5, .5], D = [-.5, .5, -.5], c = [-.25, -.25, -.25]; poly([A, B, C], 'p', c); poly([A, B, D], 'p', c); poly([A, C, D], 'p', c); poly([B, C, D], 'p', c); },
    pyramid() { const a = [-.5, -.5, -.5], b = [.5, -.5, -.5], c = [.5, -.5, .5], d = [-.5, -.5, .5], e = [0, .5, 0], m = [0, -.2, 0]; poly([a, b, c, d], 'p', m); poly([a, b, e], 'p', m); poly([b, c, e], 'p', m); poly([c, d, e], 'p', m); poly([d, a, e], 'p', m); },
    post() { fr('y', -.5, .5, .4, .4, 8, 'p', 'a', 'a'); },
    cone() { fr('z', .5, -.5, .5, .06, 8, 'p', 'a', null); },
    dome() { dome(0, -.5, 0, .5, 3, 10, 'p'); },
    plate() { box(-.5, -.06, -.5, .5, .06, .5); },
    blade() { ext('y', [[-.5, -.5], [-.5, .5], [.5, .5]], -.06, .06); },
    fin() { ext('x', [[-.5, -.5], [.5, -.5], [.5, .5], [.2, .5]], -.06, .06); },
    spar() { fr('z', -.5, .5, .09, .09, 6, 'a', 'a', 'a'); },
    cannon() { box(-.38, -.5, -.05, .38, .12, .5); fr('z', -.05, -.22, .22, .22, 8, 'a', 'a', null, [0, -.19]); fr('z', -.22, -.5, .15, .15, 8, 'a', null, 'e', [0, -.19]); },
    cannon2() { box(-.48, -.5, -.05, .48, .12, .5); for (const s of [-1, 1]) { fr('z', -.05, -.22, .2, .2, 8, 'a', 'a', null, [s * .24, -.19]); fr('z', -.22, -.5, .12, .12, 8, 'a', null, 'e', [s * .24, -.19]); } },
    turret() { fr('y', -.5, -.4, .46, .46, 10, 'a', 'a', 'a'); dome(0, -.4, 0, .42, 3, 10, 'p'); fr('z', -.2, -.5, .09, .09, 8, 'a', null, 'e', [0, -.2]); },
    pod() { box(-.46, -.46, -.4, .46, .46, .5); for (const sx of [-1, 1]) for (const sy of [-1, 1]) fr('z', -.4, -.5, .14, .14, 8, 'a', null, 'e', [sx * .2, sy * .2]); },
    lance() { box(-.3, -.3, .05, .3, .3, .5); fr('z', .05, -.42, .1, .1, 6, 'a', 'a', null); fr('z', -.42, -.5, .1, .02, 6, 'm', null, 'm'); },
    thruster() { fr('z', -.5, .15, .3, .34, 8, 'a', 'a', null); fr('z', .15, .5, .34, .46, 8, 'a', null, 'a'); disc('z', .49, .34, 8, 'e'); },
    booster() { fr('z', -.5, .1, .48, .48, 10, 'p', 'a', null); fr('z', .1, .5, .4, .5, 10, 'a', null, 'a'); disc('z', .49, .4, 10, 'e'); },
    vector() { box(-.4, -.3, -.5, .4, .3, .15); fr('z', .15, .5, .3, .4, 8, 'a', null, 'a'); disc('z', .49, .3, 8, 'e'); box(-.5, -.04, 0, .5, .04, .3, 'a'); },
    twinion() { for (const s of [-1, 1]) { fr('z', -.5, .15, .17, .19, 8, 'a', 'a', null, [s * .25, 0]); fr('z', .15, .5, .19, .24, 8, 'a', null, 'a', [s * .25, 0]); disc('z', .49, .19, 8, 'e', [s * .25, 0]); } },
    gyro() { fr('y', -.5, .5, .22, .22, 8, 'a', 'a', 'a'); fr('y', -.1, .1, .5, .5, 12, 'p', 'p', 'p'); },
    cockpit() { box(-.5, -.5, -.5, .5, -.12, .5); dome(0, -.12, 0, .44, 3, 10, 'g'); },
    canopy() { box(-.5, -.5, -.5, .5, -.15, .5); ext('x', [[-.5, -.15], [.5, -.15], [.5, .35], [-.2, .15]], -.35, .35, 'g'); },
    reactor() { box(-.45, -.4, -.45, .45, .4, .45, 'a'); fr('y', -.5, .5, .26, .26, 8, 'e', 'e', 'e'); },
    battery() { box(-.4, -.5, -.4, .4, .5, .4, 'a'); box(-.43, -.12, -.43, .43, .12, .43, 'e'); },
    shield() { fr('y', -.5, -.1, .18, .12, 8, 'a', 'a', null); dome(0, -.1, 0, .42, 3, 10, 'm'); },
    tank() { fr('z', -.5, .5, .42, .42, 10, 'p', 'a', 'a'); fr('z', -.1, .1, .46, .46, 10, 'a', 'a', 'a'); },
    mast() { fr('y', -.5, .2, .06, .06, 6, 'a', 'a', null); dome(0, .1, 0, .3, 2, 8, 'g'); }
  };
  const base = {};
  function get(shape) { if (!base[shape]) { F = []; (SHAPES[shape] || SHAPES.cube)(); base[shape] = F; F = []; } return base[shape]; }
  const COS = [1, 0, -1, 0], SIN = [0, 1, 0, -1];
  function rot(p, rx, ry, rz) {                                                                          // quarter turns: about z, then x, then y
    let x = p[0], y = p[1], z = p[2], c = COS[rz & 3], s = SIN[rz & 3], t;
    t = x * c - y * s; y = x * s + y * c; x = t;
    c = COS[rx & 3]; s = SIN[rx & 3]; t = y * c - z * s; z = y * s + z * c; y = t;
    c = COS[ry & 3]; s = SIN[ry & 3]; t = x * c + z * s; z = -x * s + z * c; x = t;
    return [x, y, z];
  }
  const cache = {};
  function mesh(shape, rx, ry, rz, mir) {
    const key = shape + '|' + (rx & 3) + (ry & 3) + (rz & 3) + (mir ? 1 : 0); if (cache[key]) return cache[key];
    const fx = mir ? -1 : 1, faces = get(shape).map(f => { const m = p => { const q = rot(p, rx, ry, rz); q[0] *= fx; return q; }; return { v: f.v.map(m), n: m(f.n), c: m(f.c), t: f.t }; });
    const groups = {};                                                                                    // one bounding box per colour tag: the hangar display draws these
    for (const f of faces) { let g = groups[f.t]; if (!g) g = groups[f.t] = { t: f.t, lo: [9, 9, 9], hi: [-9, -9, -9] }; for (const p of f.v) for (let a = 0; a < 3; a++) { if (p[a] < g.lo[a]) g.lo[a] = p[a]; if (p[a] > g.hi[a]) g.hi[a] = p[a]; } }
    return cache[key] = { faces, groups: Object.values(groups) };
  }
  return { mesh, shapes: Object.keys(SHAPES) };
})();
