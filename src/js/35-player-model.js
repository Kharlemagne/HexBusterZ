// ============================================================
//  THE PLAYER: Karl's design — a horned obsidian skeleton-robot, eldritch-born. Front of the model is -z (like the weapon view-models).
//  Used for other players in co-op and for the character preview in the inventory screen.
//    cracked black stone plates · open ribcage with a glowing cyan heart · cyan eyes + a square third eye · one whole horn, one broken
//    neon-trimmed knees and shins · RIGHT arm bare, holds the weapon · LEFT arm is a cyan-lit cannon with black tendrils growing out of the shoulder
// ============================================================
const PM_ST = 0x24252d, PM_ST2 = 0x17181f, PM_ST3 = 0x33353f, PM_RIB = 0x1e1f27, PM_CY = 0x2fe6ff, PM_CYD = 0x1792b3, PM_CYW = 0xb9fbff, PM_TEN = 0x07070b, PM_TEETH = 0x5d5e72;
const PM_K = .88;                                                                      // design units -> world units (keeps the old ~2 block height, horns included)
const PLAYER_PARTS = (() => {
  const L = [], swing = (ph, amp) => ({ sw: { ph, amp } });
  const add = (o, s, c, x) => L.push(P_([o[0] * PM_K, o[1] * PM_K, o[2] * PM_K], [s[0] * PM_K, s[1] * PM_K, s[2] * PM_K], c, x));
  // ---- skull
  add([0, 1.86, 0], [.4, .34, .38], PM_ST, { tl: TILE.GRAIN }); add([0, 2.05, .01], [.32, .09, .3], PM_ST3, { tl: TILE.GRAIN });
  add([0, 1.66, -.01], [.3, .12, .34], PM_ST2); add([0, 1.62, -.185], [.22, .03, .04], PM_TEETH); for (const sd of [-1, 1]) add([sd * .085, 1.64, -.19], [.015, .045, .03], PM_ST2);
  for (const sd of [-1, 1]) {
    add([sd * .1, 1.93, -.2], [.16, .04, .06], PM_ST2);                                 // brow
    add([sd * .1, 1.85, -.2], [.14, .1, .05], 0x000000); add([sd * .1, 1.85, -.225], [.095, .06, .03], PM_CY, { e: 1, pulse: { f: 2, ph: sd, amp: .06 } });   // eye sockets + eyes
    add([sd * .22, 1.8, -.04], [.04, .1, .2], PM_ST3);                                  // cheek plates
  }
  add([0, 1.74, -.2], [.05, .08, .03], 0x000000);                                       // nose
  add([0, 2.0, -.195], [.11, .11, .04], PM_ST2); add([0, 2.0, -.222], [.065, .065, .03], PM_CY, { e: 1, pulse: { f: 3, ph: 0, amp: .1 } });   // the third eye
  // ---- horns: +x whole and curling back in, -x broken off with jagged shards (angles tilt each block so the curve reads)
  [[.2, 2.0, .12, .12, .12, -.5], [.29, 2.1, .1, .15, .1, -.7], [.37, 2.2, .085, .15, .085, -.35], [.41, 2.32, .07, .15, .07, .1], [.4, 2.44, .05, .12, .05, .5]].forEach(([x, y, a, b, c, r]) => add([x, y, 0], [a, b, c], PM_ST, { rz: r, tl: TILE.GRAIN }));
  [[-.2, 2.0, .12, .12, .12, .5], [-.29, 2.09, .1, .14, .1, .7], [-.36, 2.17, .085, .1, .085, .5]].forEach(([x, y, a, b, c, r]) => add([x, y, 0], [a, b, c], PM_ST, { rz: r, tl: TILE.GRAIN }));
  add([-.4, 2.27, 0], [.05, .13, .05], PM_ST3, { rz: .3 }); add([-.33, 2.27, .02], [.04, .09, .04], PM_ST3, { rz: -.2 }); add([-.38, 2.2, -.04], [.03, .03, .03], PM_CY, { e: 1 });
  add([.22, 1.98, -.1], [.03, .03, .03], PM_CYD, { e: 1 });
  // ---- neck, collarbone, shoulders
  add([0, 1.56, .01], [.085, .08, .085], PM_ST2); add([0, 1.5, .01], [.07, .07, .07], PM_ST3);
  add([0, 1.52, 0], [.56, .07, .11], PM_ST3, { tl: TILE.GRAIN });
  // ---- spine + open ribcage (tapers toward the waist) with the glowing heart behind the ribs
  add([0, 1.28, .09], [.07, .5, .07], PM_ST2);
  for (let i = 0; i < 5; i++) { const y = 1.46 - i * .075, w = .46 - i * .03; add([0, y, -.13], [w, .04, .04], PM_RIB); for (const sd of [-1, 1]) add([sd * w / 2, y, -.01], [.04, .04, .24], PM_RIB); }
  add([0, 1.3, -.15], [.05, .3, .04], PM_ST3);                                          // sternum
  add([0, 1.31, -.06], [.24, .27, .12], PM_CYD, { e: 1, pulse: { f: 5, ph: 0, amp: .07 } }); add([0, 1.32, -.1], [.15, .18, .05], PM_CY, { e: 1, pulse: { f: 5, ph: .3, amp: .1 } }); add([0, 1.33, -.13], [.06, .08, .02], PM_CYW, { e: 1 });
  add([-.16, 1.45, -.1], [.3, .022, .022], PM_CY, { e: 1 }); add([-.2, 1.37, -.1], [.22, .022, .022], PM_CY, { e: 1 }); add([-.18, 1.29, -.1], [.2, .022, .022], PM_CYD, { e: 1 });   // cables from the heart to the cannon
  // ---- pelvis + hips
  add([0, 1.1, .01], [.07, .12, .07], PM_ST2);
  add([0, 1.02, 0], [.34, .14, .2], PM_ST2, { tl: TILE.GRAIN }); for (const sd of [-1, 1]) add([sd * .11, 1.0, -.105], [.05, .05, .03], PM_CY, { e: 1 });
  // ---- legs: stone shin plates with a neon line, cyan strip at each knee
  for (const sd of [-1, 1]) {
    const ph = sd < 0 ? 0 : Math.PI, x = sd * .13, sw = swing(ph, .2);
    add([x, .93, 0], [.115, .115, .115], PM_ST3, sw);                                   // hip joint
    add([x, .78, 0], [.14, .3, .14], PM_ST, { ...sw, tl: TILE.GRAIN });                 // thigh
    add([x, .62, -.02], [.155, .12, .15], PM_ST3, sw); add([x, .62, -.1], [.13, .03, .03], PM_CY, { e: 1, ...sw });   // knee + its neon strip
    add([x, .38, 0], [.12, .38, .12], PM_ST, { ...sw, tl: TILE.GRAIN });                // shin
    add([x, .4, -.075], [.14, .26, .05], PM_ST3, sw); add([x, .4, -.105], [.022, .2, .02], PM_CY, { e: 1, ...sw });     // shin plate + neon line
    add([x, .17, 0], [.09, .09, .09], PM_ST2, sw);                                      // ankle
    add([x, .06, -.04], [.16, .11, .3], PM_ST2, sw); add([x, .115, -.12], [.14, .05, .12], PM_ST3, sw);                // boot + toe plate
    add([x + sd * .081, .17, 0], [.02, .05, .05], PM_CY, { e: 1, ...sw });
  }
  // ---- RIGHT arm: bare bone-and-stone, ends in a claw (the weapon sits in this hand)
  { const sw = swing(Math.PI, .16);
    add([.36, 1.5, 0], [.15, .15, .15], PM_ST3, sw); add([.36, 1.5, -.08], [.03, .03, .02], PM_CY, { e: 1, ...sw });
    add([.42, 1.3, 0], [.1, .3, .1], PM_ST, { ...sw, tl: TILE.GRAIN }); add([.42, 1.1, 0], [.125, .1, .125], PM_ST2, sw); add([.42, 1.1, -.065], [.03, .05, .02], PM_CY, { e: 1, ...sw });
    add([.42, .93, 0], [.09, .26, .09], PM_ST, { ...sw, tl: TILE.GRAIN }); add([.42, .8, 0], [.125, .08, .125], PM_ST3, sw);
    add([.42, .72, -.01], [.09, .08, .1], PM_ST2, sw); for (const f of [-.035, 0, .035]) add([.42 + f, .64, -.05], [.022, .1, .03], PM_ST3, sw);  }
  // ---- LEFT arm: the cannon. Hangs from a ringed shoulder mount, leans out and forward; the helper places each piece along that lean
  { const sw = swing(0, .06), rx = .3, rz = -.12, cx_ = Math.cos(rx), sx_ = Math.sin(rx), cz_ = Math.cos(rz), sz_ = Math.sin(rz), X0 = -.47, Y0 = 1.5;
    const cn = (d, lx, lz, s, c, x) => { const y1 = -d * cx_ - sx_ * lz, z1 = -d * sx_ + cx_ * lz; add([X0 + cz_ * lx - sz_ * y1, Y0 + sz_ * lx + cz_ * y1, z1], s, c, { rx, rz, ...sw, ...x }); };
    add([-.39, 1.5, 0], [.23, .21, .21], PM_ST3, { ...sw, tl: TILE.GRAIN });                                          // shoulder mount
    add([-.39, 1.5, -.115], [.2, .03, .02], PM_CY, { e: 1, ...sw }); add([-.39, 1.62, 0], [.2, .03, .2], PM_CYD, { e: 1, ...sw }); add([-.5, 1.5, 0], [.03, .17, .17], PM_CY, { e: 1, ...sw });
    cn(.2, 0, 0, [.14, .3, .14], PM_ST3, { tl: TILE.GRAIN });                                                         // upper arm
    cn(.4, 0, 0, [.19, .15, .19], PM_ST2); cn(.4, 0, -.1, [.17, .03, .02], PM_CY, { e: 1 });                         // elbow + its band
    cn(.7, 0, 0, [.24, .4, .26], PM_ST2, { tl: TILE.GRAIN });                                                         // gun body
    cn(.54, 0, 0, [.26, .08, .28], PM_ST3);                                                                           // collar plate
    cn(.7, 0, -.135, [.025, .32, .02], PM_CY, { e: 1 }); cn(.7, -.125, -.04, [.02, .3, .035], PM_CY, { e: 1 }); cn(.7, .125, -.04, [.02, .3, .035], PM_CYD, { e: 1 });  // neon lines
    for (const d of [.62, .72, .82]) cn(d, 0, -.14, [.2, .022, .022], PM_CY, { e: 1 });                              // cooling slits
    cn(.7, -.14, .05, [.05, .2, .12], PM_ST3);                                                                        // side vent block
    cn(1.0, 0, 0, [.14, .22, .14], PM_ST); cn(1.13, 0, 0, [.19, .05, .19], PM_ST3);                                   // barrel + muzzle ring
    cn(1.18, 0, 0, [.1, .07, .1], PM_CY, { e: 1, pulse: { f: 6, ph: 0, amp: .12 } });                                // glowing muzzle
    // black tendrils out of the shoulder: sway out of step, thicker at the root, whipping more toward the tip
    const tendril = (x0, y0, z0, steps, ph) => steps.forEach(([dx, dy, dz, w, h, r], i) => add([x0 + dx, y0 + dy, z0 + dz], [w, h, w], PM_TEN, { rz: r, sx: { f: 2.1 + i * .15, ph: ph + i * .5, amp: .008 + i * .012 } }));
    tendril(-.4, 1.62, .02, [[-.03, .1, 0, .07, .16, .35], [-.1, .22, 0, .06, .15, .6], [-.19, .3, 0, .05, .14, 1], [-.29, .34, 0, .04, .13, 1.4], [-.38, .33, 0, .03, .12, 1.9]], 0);
    tendril(-.38, 1.6, .08, [[-.05, .08, .03, .06, .14, .6], [-.14, .15, .08, .05, .14, 1], [-.24, .17, .14, .04, .12, 1.5], [-.31, .13, .18, .03, .1, 2]], 2);
    tendril(-.4, 1.58, -.02, [[-.08, .06, -.03, .05, .12, .9], [-.17, .1, -.07, .04, .12, 1.3], [-.25, .08, -.1, .03, .1, 1.8]], 4);
  }
  return L;
})();
// what is in the right hand: a little silhouette per weapon
const PLAYER_HELD = [
  [[.09, .1, .4, 0x8c8c9a, 0, 0], [.14, .13, .15, 0xd9a441, 0, .16]], [[.1, .1, .62, 0x6a6a78, 0, 0], [.13, .13, .22, 0x5a1a1a, 0, .26]],
  [[.14, .16, .46, 0x3b3f4a, 0, 0], [.05, .05, .36, PM_CY, 1, -.4]], [[.07, .08, .95, 0x2e3340, 0, -.1], [.16, .16, .06, PM_CY, 1, -.35]], [[.05, .55, .05, 0x6a4a2a, 0, 0], [.34, .07, .09, 0x9aa4b4, 0, 0, .3]]
];
function playerParts(weapon) {
  const w = PLAYER_HELD[weapon]; if (!w) return PLAYER_PARTS;
  const out = PLAYER_PARTS.slice();
  w.forEach(h => { const [sx, sy, sz, c, e, dz, dy] = h; out.push(P_([.42 * PM_K, weapon === 4 ? .84 + (dy || 0) : .62, -.2 + (dz || 0) - (weapon === 4 ? -.2 : sz * .3)], [sx, sy, sz], c, e ? { e: 1, sw: { ph: 0, amp: .16 } } : { sw: { ph: 0, amp: .16 } })); });
  return out;
}
// ---- character preview: a tiny software renderer on a 2D canvas (orthographic, painter's algorithm), like Minecraft's inventory doll
const CHAR_FACES = [[[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]], [[-1, 0, 0], [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]]], [[0, 1, 0], [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]]], [[0, -1, 0], [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1]]], [[0, 0, 1], [[1, -1, 1], [1, 1, 1], [-1, 1, 1], [-1, -1, 1]]], [[0, 0, -1], [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]]]];
function drawCharPreview(cv, yaw, pitch, t, weapon, walk) {
  const g = cv.getContext('2d'), W = cv.width, H_ = cv.height; g.clearRect(0, 0, W, H_);
  const grd = g.createRadialGradient(W / 2, H_ * .55, 10, W / 2, H_ * .55, H_ * .6); grd.addColorStop(0, '#0e3a4a99'); grd.addColorStop(1, '#00000000'); g.fillStyle = grd; g.fillRect(0, 0, W, H_);
  const sc = H_ / 2.6, cy = H_ * .94, c = Math.cos(yaw + Math.PI), s = Math.sin(yaw + Math.PI), cp = Math.cos(pitch), sp = Math.sin(pitch), quads = [];
  const proj = (x, y, z) => { const x1 = x * c + z * s, z1 = -x * s + z * c, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp; return [W / 2 + x1 * sc, cy - y2 * sc, z2]; };
  for (const p of playerParts(weapon)) {
    let ox = p.o[0], oy = p.o[1], oz = p.o[2];
    if (p.sw) oz += Math.sin(walk + p.sw.ph) * p.sw.amp;
    if (p.sx) ox += Math.sin(t * p.sx.f + p.sx.ph) * p.sx.amp;
    const M = (p.rx || p.rz) ? mulR(rotZ(p.rz || 0), rotX(p.rx || 0)) : null;       // same per-part tilt as drawParts
    const rot = (x, y, z) => M ? [M[0] * x + M[1] * y + M[2] * z, M[3] * x + M[4] * y + M[5] * z, M[6] * x + M[7] * y + M[8] * z] : [x, y, z];
    const pul = p.pulse ? 1 + Math.sin(t * p.pulse.f + p.pulse.ph) * p.pulse.amp : 1;
    const hx_ = p.s[0] / 2 * pul, hy_ = p.s[1] / 2 * pul, hz_ = p.s[2] / 2 * pul, em = !!p.e, col = p.rgb;
    for (const [n0, vs] of CHAR_FACES) {
      const n = rot(n0[0], n0[1], n0[2]), nx = n[0] * c + n[2] * s, nz = -n[0] * s + n[2] * c, nz2 = n[1] * sp + nz * cp;
      if (nz2 <= 0.001) continue;                                                  // facing away from the viewer
      const pts = vs.map(v => { const r = rot(v[0] * hx_, v[1] * hy_, v[2] * hz_); return proj(ox + r[0], oy + r[1], oz + r[2]); }), dz = (pts[0][2] + pts[1][2] + pts[2][2] + pts[3][2]) / 4;
      const ny2 = n[1] * cp - nz * sp, lit = em ? 1.2 : .55 + .45 * Math.max(0, nx * .3 + ny2 * .8 + nz2 * .5);
      quads.push([dz, pts, [Math.min(255, col[0] * 255 * lit) | 0, Math.min(255, col[1] * 255 * lit) | 0, Math.min(255, col[2] * 255 * lit) | 0], em]);
    }
  }
  quads.sort((a, b) => a[0] - b[0]);
  for (const [, pts, rgb, em] of quads) {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < 4; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath();
    g.fillStyle = 'rgb(' + rgb.join(',') + ')'; if (em) { g.shadowColor = 'rgb(' + rgb.join(',') + ')'; g.shadowBlur = 10; } g.fill(); g.shadowBlur = 0;
    g.strokeStyle = em ? 'rgba(220,255,255,.4)' : 'rgba(90,120,150,.22)'; g.lineWidth = 1; g.stroke();
  }
}
