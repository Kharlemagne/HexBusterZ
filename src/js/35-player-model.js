// ============================================================
//  THE PLAYER: Karl's design — a horned obsidian skeleton-robot, eldritch-born. Front of the model is -z (like the weapon view-models).
//  Used for other players in co-op and for the character preview in the inventory screen.
//    cracked black stone plates · open ribcage with a glowing cyan heart · cyan eyes + a square third eye · one whole horn, one broken
//    neon-trimmed knees and shins · RIGHT arm bare, holds the weapon · LEFT arm is a cyan-lit cannon with black tendrils growing out of the shoulder
// ============================================================
const PM_ST = 0x2a2c34, PM_ST2 = 0x1b1c23, PM_ST3 = 0x3b3e49, PM_RIB = 0x22232b, PM_CY = 0x2fe6ff, PM_CYD = 0x1792b3, PM_CYR = 0x127a96, PM_CYW = 0xbafbff, PM_TEN = 0x08080c, PM_MET = 0x3a4b4d, PM_MET2 = 0x253234, PM_CRK = 0x0a0a0e, PM_TEETH = 0x5d5e72;
const PM_K = .86;                                                                      // design units -> world units (keeps the old ~2 block height, horns included)
const PLAYER_PARTS = (() => {
  const L = [], swing = (ph, amp) => ({ sw: { ph, amp } }), G = TILE.GRAIN;
  const add = (o, s, c, x) => L.push(P_([o[0] * PM_K, o[1] * PM_K, o[2] * PM_K], [s[0] * PM_K, s[1] * PM_K, s[2] * PM_K], c, x));
  // a limb hangs from a pivot and leans (rx = forward, rz = outward); limb(...) returns a placer: d = distance down the limb, lx/lz = offset across it
  const limb = (X0, Y0, rx, rz, sw) => { const cx_ = Math.cos(rx), sx_ = Math.sin(rx), cz_ = Math.cos(rz), sz_ = Math.sin(rz);
    return (d, lx, lz, s, c, x) => { const y1 = -d * cx_ - sx_ * lz, z1 = -d * sx_ + cx_ * lz; add([X0 + cz_ * lx - sz_ * y1, Y0 + sz_ * lx + cz_ * y1, z1], s, c, { rx, rz, ...sw, ...x }); }; };
  // ---- skull: one big cracked cube with square cyan eyes and a third eye (the sheet's chunky head)
  add([0, 1.85, 0], [.5, .34, .46], PM_ST, { tl: G }); add([0, 1.61, -.01], [.44, .14, .42], PM_ST2, { tl: G });
  for (const sd of [-1, 1]) { add([sd * .115, 1.75, -.232], [.13, .13, .03], 0x000000); add([sd * .115, 1.75, -.248], [.1, .1, .03], PM_CY, { e: 1, pulse: { f: 2, ph: sd, amp: .05 } }); }
  add([0, 1.92, -.232], [.11, .11, .03], 0x000000); add([0, 1.92, -.248], [.08, .08, .03], PM_CY, { e: 1, pulse: { f: 3, ph: 0, amp: .08 } });
  add([.2, 1.93, -.236], [.012, .17, .01], PM_CRK, { rz: .45 }); add([.15, 1.83, -.236], [.012, .12, .01], PM_CRK, { rz: -.5 }); add([-.17, 1.66, -.236], [.012, .1, .01], PM_CRK, { rz: .3 }); add([-.22, 1.9, -.236], [.01, .12, .01], PM_CRK, { rz: -.35 });
  add([.252, 1.82, 0], [.01, .2, .012], PM_CRK, { rz: .5 }); add([-.252, 1.8, .05], [.01, .18, .012], PM_CRK, { rz: -.4 }); add([.1, 1.9, .232], [.012, .22, .01], PM_CRK, { rz: .3 }); add([-.14, 1.8, .232], [.012, .2, .01], PM_CRK, { rz: -.45 });
  // ---- horns: +x whole, a thick crescent that sweeps out and curls back in; -x broken off into jagged shards
  [[.21, 2.03, .17, .16, .17, -.45], [.31, 2.12, .15, .17, .15, -.7], [.4, 2.24, .13, .17, .13, -.45], [.45, 2.37, .11, .17, .11, -.1], [.44, 2.5, .085, .15, .085, .35], [.39, 2.6, .055, .1, .055, .8]].forEach(([x, y, a, b, c, r]) => add([x, y, 0], [a * 1.2, b, c * 1.2], PM_ST, { rz: r, tl: G }));
  [[-.21, 2.03, .17, .16, .17, .45], [-.31, 2.12, .15, .17, .15, .7], [-.38, 2.22, .12, .12, .12, .55]].forEach(([x, y, a, b, c, r]) => add([x, y, 0], [a * 1.2, b, c * 1.2], PM_ST, { rz: r, tl: G }));
  add([-.43, 2.33, 0], [.07, .17, .07], PM_ST3, { rz: .2 }); add([-.35, 2.34, .02], [.05, .13, .05], PM_ST3, { rz: -.25 }); add([-.47, 2.26, -.02], [.05, .09, .05], PM_ST3, { rz: .9 }); add([-.4, 2.28, -.06], [.03, .03, .03], PM_CY, { e: 1 });
  // ---- neck, collarbone, round shoulder joints
  add([0, 1.5, .01], [.08, .07, .08], PM_ST2); add([0, 1.45, .01], [.07, .06, .07], PM_ST3);
  add([0, 1.48, 0], [.5, .06, .1], PM_ST3, { tl: G });
  add([.35, 1.45, 0], [.17, .17, .17], PM_ST3, { tl: G });
  // ---- spine + open ribcage whose ribs glow dim cyan (it tapers toward the waist), heart behind, glowing dots down the back
  add([0, 1.24, .09], [.08, .5, .08], PM_ST2);
  for (let i = 0; i < 5; i++) { const y = 1.4 - i * .075, w = .5 - .035 * i; add([0, y, -.13], [w, .04, .04], PM_RIB); add([0, y - .024, -.152], [w * .86, .01, .01], PM_CYR, { e: 1 }); for (const sd of [-1, 1]) add([sd * w / 2, y, -.01], [.04, .04, .24], PM_RIB); add([0, y, .13], [.03, .025, .02], PM_CYD, { e: 1 }); }
  add([0, 1.26, -.15], [.05, .28, .04], PM_ST3);                                        // sternum
  add([.04, 1.26, -.08], [.26, .3, .1], PM_CYD, { e: 1, pulse: { f: 5, ph: 0, amp: .07 } }); add([.04, 1.27, -.12], [.17, .2, .05], PM_CY, { e: 1, pulse: { f: 5, ph: .3, amp: .1 } }); add([.04, 1.28, -.15], [.07, .09, .02], PM_CYW, { e: 1 });
  // cables looping from the ribs to the cannon shoulder
  [[-.16, 1.43, -.12, .18, .3], [-.28, 1.37, -.1, .18, -.25], [-.2, 1.3, -.11, .22, .2], [-.34, 1.26, -.09, .16, -.3], [-.13, 1.2, -.1, .2, -.15], [-.27, 1.15, -.08, .16, .35]].forEach(([x, y, z, l, r]) => { add([x, y, z], [l, .026, .026], PM_MET2, { rz: r }); add([x, y + .016, z - .004], [l * .8, .012, .012], PM_CY, { e: 1, rz: r }); });
  // ---- pelvis plate + hips
  add([0, 1.19, .01], [.08, .1, .08], PM_ST2);
  add([0, 1.08, 0], [.42, .09, .24], PM_ST3, { tl: G }); add([0, .99, 0], [.28, .1, .22], PM_ST2, { tl: G }); for (const sd of [-1, 1]) add([sd * .2, .97, -.125], [.04, .04, .03], PM_CY, { e: 1 });
  // ---- legs: long and stout, big armoured shins and boots, a neon strip at each knee and shin
  for (const sd of [-1, 1]) {
    const ph = sd < 0 ? 0 : Math.PI, x = sd * .17, sw = swing(ph, .2);
    add([x, .92, 0], [.14, .14, .14], PM_ST3, sw);                                      // hip joint
    add([x, .72, 0], [.2, .36, .2], PM_ST, { ...sw, tl: G });                           // thigh
    add([x, .5, -.02], [.27, .15, .26], PM_ST3, { ...sw, tl: G }); add([x, .53, -.15], [.2, .03, .03], PM_CY, { e: 1, ...sw });      // knee guard + neon strip
    add([x, .33, 0], [.24, .3, .22], PM_ST, { ...sw, tl: G });                          // shin armour
    add([x, .32, -.13], [.2, .2, .04], PM_ST3, sw); add([x, .3, -.155], [.025, .16, .02], PM_CY, { e: 1, ...sw }); add([x + sd * .125, .38, -.02], [.02, .04, .05], PM_CY, { e: 1, ...sw });
    add([x, .15, 0], [.15, .08, .15], PM_ST2, sw);                                      // ankle
    add([x, .065, -.06], [.28, .13, .42], PM_ST2, { ...sw, tl: G }); add([x, .14, -.2], [.22, .06, .16], PM_ST3, sw); add([x + sd * .146, .12, -.1], [.02, .04, .06], PM_CY, { e: 1, ...sw });   // boot + toe plate
  }
  // ---- RIGHT arm: thin jointed stone and bone, leaning slightly out, ends in a claw (the weapon sits in this hand)
  { const a = limb(.36, 1.45, 0, .08, swing(Math.PI, .16));
    a(.17, 0, 0, [.11, .3, .11], PM_ST, { tl: G }); a(.37, 0, 0, [.14, .13, .14], PM_ST3); a(.37, 0, -.075, [.03, .05, .02], PM_CY, { e: 1 });
    a(.57, 0, 0, [.1, .3, .1], PM_ST, { tl: G }); a(.68, 0, 0, [.14, .1, .14], PM_ST3); a(.8, 0, -.01, [.1, .1, .1], PM_ST2);
    for (const f of [-.04, 0, .04]) a(.9, f, -.05, [.025, .12, .03], PM_ST3); }
  // ---- LEFT arm: the cannon, in green-grey metal, hung from a shoulder gear ring, leaning out and forward
  { const sw = swing(0, .06), c = limb(-.38, 1.45, .25, -.35, sw);
    add([-.36, 1.43, 0], [.2, .2, .2], PM_ST3, { ...sw, tl: G });                                                     // shoulder mount
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; add([-.4 + Math.cos(a) * .12, 1.5 + Math.sin(a) * .12, -.09], [.06, .06, .07], PM_MET2, { rz: a + Math.PI / 2, ...sw }); }   // the gear ring
    add([-.4, 1.5, -.1], [.1, .1, .05], PM_CY, { e: 1, ...sw });
    c(.18, 0, 0, [.15, .3, .15], PM_MET, { tl: G }); c(.07, 0, 0, [.17, .02, .17], PM_CY, { e: 1 });                  // upper arm + ring
    c(.38, 0, 0, [.2, .16, .2], PM_MET2); c(.38, 0, -.105, [.17, .03, .02], PM_CY, { e: 1 });                         // elbow + band
    c(.68, 0, 0, [.3, .44, .28], PM_MET2, { tl: G });                                                                 // gun body
    c(.68, -.17, 0, [.06, .34, .2], PM_MET); c(.68, .17, 0, [.06, .34, .2], PM_MET);                                  // side armour
    c(.66, 0, -.145, [.03, .34, .02], PM_CY, { e: 1 }); c(.55, 0, -.145, [.22, .025, .02], PM_CY, { e: 1 }); c(.8, 0, -.145, [.22, .025, .02], PM_CY, { e: 1 }); c(.68, -.17, -.105, [.02, .3, .03], PM_CYD, { e: 1 });
    for (const sd of [-1, 1]) c(1.0, sd * .19, -.08, [.035, .34, .035], PM_MET);                                      // claw rails round the barrel
    c(.98, 0, 0, [.19, .2, .19], PM_MET); c(1.1, 0, 0, [.25, .05, .25], PM_MET2);                                     // barrel + muzzle ring
    c(1.2, 0, 0, [.16, .14, .16], 0x8ff7ff, { e: 1, pulse: { f: 6, ph: 0, amp: .12 } });                              // the big glowing muzzle cube
    c(.38, -.12, 0, [.04, .04, .04], PM_CY, { e: 1 });
    // four thick black tendrils out of the shoulder: sway out of step, whipping more toward the tips
    const tendril = (x0, y0, z0, steps, ph) => steps.forEach(([dx, dy, dz, w, h, r], i) => add([x0 + dx, y0 + dy, z0 + dz], [w * 1.3, h, w * 1.3], PM_TEN, { rz: r, sx: { f: 2.1 + i * .15, ph: ph + i * .5, amp: .008 + i * .012 } }));
    tendril(-.4, 1.58, .02, [[-.03, .1, 0, .1, .16, .3], [-.08, .23, 0, .09, .16, .55], [-.15, .35, 0, .08, .15, .85], [-.24, .44, 0, .065, .14, 1.25], [-.35, .47, 0, .05, .13, 1.7], [-.45, .43, 0, .04, .12, 2.2]], 0);
    tendril(-.38, 1.56, .06, [[-.06, .08, .03, .08, .14, .6], [-.16, .16, .05, .07, .14, .95], [-.27, .2, .07, .055, .13, 1.4], [-.37, .16, .09, .04, .12, 2.0], [-.43, .08, .1, .03, .1, 2.6]], 2);
    tendril(-.4, 1.55, -.02, [[-.05, .06, -.04, .07, .12, .7], [-.15, .1, -.08, .055, .12, 1.1], [-.25, .08, -.12, .04, .1, 1.7]], 4);
    tendril(-.36, 1.58, .1, [[-.04, .09, .07, .08, .14, .2], [-.08, .2, .12, .07, .14, .4], [-.1, .32, .16, .055, .13, .7], [-.12, .42, .2, .04, .12, 1.0]], 6);
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
  w.forEach(h => { const [sx, sy, sz, c, e, dz, dy] = h; out.push(P_([.5 * PM_K, weapon === 4 ? .84 + (dy || 0) : .62, -.2 + (dz || 0) - (weapon === 4 ? -.2 : sz * .3)], [sx, sy, sz], c, e ? { e: 1, sw: { ph: 0, amp: .16 } } : { sw: { ph: 0, amp: .16 } })); });
  return out;
}
// ---- character preview: a tiny software renderer on a 2D canvas (orthographic, painter's algorithm), like Minecraft's inventory doll
const CHAR_FACES = [[[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]], [[-1, 0, 0], [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]]], [[0, 1, 0], [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]]], [[0, -1, 0], [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1]]], [[0, 0, 1], [[1, -1, 1], [1, 1, 1], [-1, 1, 1], [-1, -1, 1]]], [[0, 0, -1], [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]]]];
function drawCharPreview(cv, yaw, pitch, t, weapon, walk) {
  const g = cv.getContext('2d'), W = cv.width, H_ = cv.height; g.clearRect(0, 0, W, H_);
  const grd = g.createRadialGradient(W / 2, H_ * .55, 10, W / 2, H_ * .55, H_ * .6); grd.addColorStop(0, '#0e3a4a99'); grd.addColorStop(1, '#00000000'); g.fillStyle = grd; g.fillRect(0, 0, W, H_);
  const sc = H_ / 2.95, cy = H_ * .94, c = Math.cos(yaw + Math.PI), s = Math.sin(yaw + Math.PI), cp = Math.cos(pitch), sp = Math.sin(pitch), quads = [];
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
