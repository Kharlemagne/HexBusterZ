// ============================================================
//  THE PLAYER: Karl's design — a horned obsidian skeleton-robot, eldritch-born. Front of the model is -z (like the weapon view-models).
//  Used for other players in co-op and for the character preview in the inventory screen.
//    cracked black stone plates · open ribcage with a glowing cyan heart · cyan eyes + a square third eye · one whole horn, one broken
//    neon-trimmed knees and shins · RIGHT arm bare, holds the weapon · LEFT arm is a cyan-lit cannon with black tendrils growing out of the shoulder
// ============================================================
const PM_ST = 0x2a2c34, PM_ST2 = 0x1b1c23, PM_ST3 = 0x3b3e49, PM_RIB = 0x1f2028, PM_CY = 0x2fe6ff, PM_CYD = 0x1792b3, PM_CYR = 0x127a96, PM_CYW = 0xbafbff, PM_TEN = 0x08080c, PM_MET = 0x2e3a3d, PM_MET2 = 0x20292b, PM_CRK = 0x0a0a0e, PM_TEETH = 0x5d5e72;
const PM_K = .85;                                                                      // design units -> world units (keeps the ~2 block height, horns included)
const PLAYER_PARTS = (() => {
  const L = [], swing = (ph, amp) => ({ sw: { ph, amp } }), G = TILE.GRAIN, D2R = Math.PI / 180;
  const add = (o, s, c, x) => L.push(P_([o[0] * PM_K, o[1] * PM_K, o[2] * PM_K], [s[0] * PM_K, s[1] * PM_K, s[2] * PM_K], c, x));
  // a limb hangs from a pivot and leans (rx = forward, rz = outward); limb(...) returns a placer: d = distance down the limb, lx/lz = offset across it
  const limb = (X0, Y0, rx, rz, sw) => { const cx_ = Math.cos(rx), sx_ = Math.sin(rx), cz_ = Math.cos(rz), sz_ = Math.sin(rz);
    return (d, lx, lz, s, c, x) => { const y1 = -d * cx_ - sx_ * lz, z1 = -d * sx_ + cx_ * lz; add([X0 + cz_ * lx - sz_ * y1, Y0 + sz_ * lx + cz_ * y1, z1], s, c, { rx, rz, ...sw, ...x }); }; };
  // a curved strand of boxes: segs = [heading in degrees from +x (counter-clockwise), length]; sd mirrors it to the -x side; w0 -> w1 = thickness along the strand
  const strand = (x0, y0, z0, sd, segs, w0, w1, col, ex, sway) => { let x = x0, y = y0; segs.forEach(([deg, len], k) => { const hx = sd * Math.cos(deg * D2R), hy = Math.sin(deg * D2R), w = w0 + (w1 - w0) * k / Math.max(1, segs.length - 1);
    add([x + hx * len / 2, y + hy * len / 2, z0], [w, len * 1.12, w], col, { rz: Math.atan2(-hx, hy), ...(sway ? { sx: { f: 1.7 + (sway.f || 0) + k * .12, ph: (sway.ph || 0) + k * .55, amp: .004 + k * .011 } } : null), ...ex }); x += hx * len; y += hy * len; }); };
  // ---- skull: a huge cracked cube with a chipped corner, two big square eyes over a lower jaw block, a third eye above
  add([0, 1.96, 0], [.66, .46, .6], PM_ST, { tl: G }); add([0, 1.63, -.01], [.58, .2, .54], PM_ST2, { tl: G });
  for (const sd of [-1, 1]) { add([sd * .14, 1.86, -.302], [.17, .17, .03], 0x000000); add([sd * .14, 1.86, -.318], [.13, .13, .03], PM_CY, { e: 1, pulse: { f: 2, ph: sd, amp: .05 } }); }
  add([0, 2.07, -.302], [.13, .13, .03], 0x000000); add([0, 2.07, -.318], [.095, .095, .03], PM_CY, { e: 1, pulse: { f: 3, ph: 0, amp: .08 } });
  // the face plate is half a skull: the -x half is pale bone (brow, socket round the eye, cheekbone, half a nose, teeth over a dark mouth), the +x half stays plain dark plate
  const BONE = 0x6b6b80, BONE2 = 0x8a8aa0;
  add([-.165, 1.96, -.296], [.31, .46, .03], BONE, { tl: TILE.BONEY }); add([-.15, 1.63, -.268], [.27, .2, .03], BONE, { tl: TILE.BONEY });       // bone over the upper face and the jaw
  add([-.165, 1.97, -.322], [.31, .04, .03], BONE2, { tl: TILE.BONEY }); add([-.2, 1.745, -.322], [.17, .05, .03], BONE2, { tl: TILE.BONEY });     // brow ridge + cheekbone
  add([-.14, 1.86, -.31], [.2, .2, .03], 0x000000);                                                                                              // the deep socket (the eye glows inside it)
  add([-.035, 1.76, -.318], [.055, .1, .03], 0x000000, { rz: -.1 }); add([-.04, 1.7, -.318], [.07, .03, .03], 0x000000);                         // half a nose cavity at the seam
  add([-.15, 1.625, -.287], [.27, .11, .03], 0x000000); for (let k = 0; k < 4; k++) { const x = -.05 - k * .065; add([x, 1.655, -.29], [.045, .07, .03], BONE2, { tl: TILE.BONEY }); add([x, 1.595, -.29], [.045, .05, .03], BONE2, { tl: TILE.BONEY }); }
  add([0, 1.87, -.31], [.014, .62, .02], PM_CRK);                                                                                                // the seam between bone and plate
  for (const [x, y] of [[.3, 2.14], [.3, 1.6], [.04, 1.6]]) add([x, y, -.298], [.03, .03, .02], PM_ST3);                                         // rivets on the plate half
  add([.16, 1.625, -.287], [.24, .012, .02], PM_CYD, { e: 1 }); add([.16, 1.66, -.287], [.24, .012, .02], PM_CYD, { e: 1 }); add([.16, 1.59, -.287], [.24, .012, .02], PM_CYD, { e: 1 });   // vent slits
  add([.27, 2.17, -.31], [.012, .22, .01], PM_CRK, { rz: .4 }); add([.2, 1.98, -.31], [.012, .16, .01], PM_CRK, { rz: -.5 }); add([-.22, 1.72, -.31], [.012, .14, .01], PM_CRK, { rz: .35 }); add([-.1, 2.14, -.31], [.01, .12, .01], PM_CRK, { rz: -.35 });
  add([.332, 2.05, 0], [.01, .26, .012], PM_CRK, { rz: .5 }); add([-.332, 1.98, .06], [.01, .22, .012], PM_CRK, { rz: -.4 }); add([.14, 2.0, .302], [.012, .3, .01], PM_CRK, { rz: .3 }); add([-.18, 1.9, .302], [.012, .26, .01], PM_CRK, { rz: -.45 });
  add([-.3, 2.23, -.1], [.12, .08, .16], PM_ST3, { rz: .4 }); add([-.24, 2.27, .1], [.08, .08, .12], PM_ST3, { rz: -.3 }); add([-.33, 2.22, .12], [.07, .06, .1], PM_ST2, { rz: .8 });       // the chipped corner
  // ---- lyre horns: the +x one is whole (sweeps out, climbs, curls its tip back in); the -x one snapped off partway and ends in jagged shards
  strand(.27, 2.2, 0, 1, [[15, .17], [40, .17], [70, .17], [100, .15], [125, .13]], .21, .08, PM_ST, { tl: G });
  strand(-.27, 2.2, 0, -1, [[15, .15], [45, .1]], .21, .17, PM_ST, { tl: G });
  add([-.49, 2.34, 0], [.15, .1, .15], PM_ST3, { rz: .35 }); add([-.53, 2.4, .04], [.07, .14, .07], PM_ST3, { rz: .7 }); add([-.45, 2.42, -.03], [.06, .17, .06], PM_ST3, { rz: -.2 }); add([-.5, 2.36, -.07], [.05, .09, .05], PM_ST2, { rz: 1.1 }); add([-.47, 2.34, -.1], [.035, .035, .035], PM_CY, { e: 1, pulse: { f: 4, ph: 1, amp: .2 } });
  // ---- neck, flat shoulder line with square joints (a cyan marker on the right one)
  add([0, 1.62, .01], [.1, .09, .1], PM_ST2);
  add([0, 1.58, 0], [.62, .07, .2], PM_ST3, { tl: G });
  add([.36, 1.52, 0], [.15, .15, .15], PM_ST3, { tl: G }); add([.36, 1.52, -.08], [.05, .05, .02], PM_CY, { e: 1 });
  // ---- spine + the ribcage, cracked open down the middle: each rib bar is split, the halves pried outward, with the core burning cyan in the gap
  add([0, 1.36, .02], [.07, .5, .18], PM_ST2);
  for (let i = 0; i < 6; i++) { const y = 1.52 - i * .08, w = .56 - i * .015, hl = w / 2 - .085;
    for (const sd of [-1, 1]) { const cx = sd * (.085 + hl / 2), r = -sd * (.12 + i * .01);
      add([cx, y, 0], [hl, .045, .2], PM_RIB, { rz: r, tl: G }); add([cx, y - .042, -.102], [hl * .9, .014, .012], sd < 0 ? PM_CYD : PM_CY, { e: 1, rz: r });
      if (i % 2 === 0) add([sd * .09, y + .012, -.06 - (i % 4) * .012], [.045, .06, .08], PM_ST3, { rz: -sd * .5 }); } }       // jagged edges of the split
  add([0, 1.3, -.05], [.15, .46, .12], PM_CYD, { e: 1, pulse: { f: 5, ph: 0, amp: .06 } }); add([0, 1.3, -.1], [.08, .36, .05], PM_CY, { e: 1, pulse: { f: 5, ph: .3, amp: .1 } }); add([0, 1.32, -.13], [.03, .2, .02], PM_CYW, { e: 1 });
  for (const sd of [-1, 1]) add([sd * .08, 1.3, -.108], [.012, .44, .012], PM_CY, { e: 1 });                                   // light spilling along the crack
  for (const sd of [-1, 1]) add([sd * .07, 1.4, .125], [.07, .28, .03], PM_CY, { e: 1 });                      // lit panels down the back of the spine
  // ---- waist node + pelvis
  add([0, 1.06, 0], [.14, .1, .12], PM_ST2); add([0, 1.06, -.065], [.06, .06, .02], PM_CY, { e: 1 });
  add([0, .94, 0], [.42, .12, .22], PM_ST3, { tl: G });
  // ---- legs: straight stone pillars, a bright strip across each knee and one down each shin, small boots with a neon tick
  for (const sd of [-1, 1]) {
    const ph = sd < 0 ? 0 : Math.PI, x = sd * .13, sw = swing(ph, .2);
    add([x, .72, 0], [.2, .32, .2], PM_ST, { ...sw, tl: G });                           // thigh
    add([x, .58, -.105], [.2, .045, .03], PM_CY, { e: 1, ...sw });                      // knee strip
    add([x, .37, 0], [.19, .4, .19], PM_ST, { ...sw, tl: G }); add([x, .37, -.105], [.04, .15, .02], PM_CY, { e: 1, ...sw });   // shin + its strip
    add([x, .16, 0], [.15, .06, .15], PM_ST2, sw);                                      // ankle
    add([x, .08, -.06], [.21, .16, .34], PM_ST2, { ...sw, tl: G }); add([x + sd * .106, .18, -.02], [.02, .04, .05], PM_CY, { e: 1, ...sw });
  }
  // ---- RIGHT arm: long thin jointed column that reaches past the hip, a cyan square at mid-arm, ends in a claw (the weapon sits in this hand)
  { const a = limb(.36, 1.52, 0, .06, swing(Math.PI, .16));
    a(.2, 0, 0, [.1, .42, .1], PM_ST, { tl: G }); a(.44, 0, 0, [.13, .1, .13], PM_ST3); a(.48, 0, -.075, [.04, .04, .02], PM_CY, { e: 1 });
    a(.7, 0, 0, [.095, .42, .095], PM_ST, { tl: G }); a(.9, 0, 0, [.12, .08, .12], PM_ST3);
    a(1.0, 0, 0, [.09, .1, .09], PM_ST2); for (const f of [-.035, 0, .035]) a(1.1, f, -.04, [.022, .12, .03], PM_ST3); }
  // ---- LEFT arm: a bulky shoulder block, then the cannon hanging long and straight, wrapped in beaded cyan chains, ending in a glowing cube
  { const sw = swing(0, .06), c = limb(-.38, 1.52, .12, -.17, sw);
    add([-.4, 1.52, 0], [.26, .22, .26], PM_ST3, { ...sw, tl: G }); add([-.4, 1.64, 0], [.2, .06, .2], PM_ST2, sw);
    c(.22, 0, 0, [.16, .4, .16], PM_MET, { tl: G }); c(.45, 0, 0, [.2, .12, .2], PM_MET2); c(.45, 0, -.105, [.17, .03, .02], PM_CY, { e: 1 });
    c(.74, 0, 0, [.34, .46, .3], PM_MET2, { tl: G }); c(.74, -.19, 0, [.05, .38, .22], PM_MET); c(.74, .19, 0, [.05, .38, .22], PM_MET);
    c(.74, 0, -.155, [.03, .42, .02], PM_CY, { e: 1 }); for (const d of [.6, .74, .88]) c(d, 0, -.155, [.26, .024, .02], PM_CY, { e: 1 });         // the cross of lit lines on the front
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < 6; k++) c(.52 + k * .1 + (sx * sz > 0 ? .05 : 0), sx * (.18 + (k % 2) * .022), sz * (.16 + (k % 2) * .022), [.028, .1, .028], PM_CY, { e: 1 });   // beaded chains round the gun
    c(1.04, 0, 0, [.2, .2, .2], PM_MET); c(1.16, 0, 0, [.26, .05, .26], PM_MET2);                                    // barrel + muzzle ring
    c(1.27, 0, 0, [.2, .17, .2], 0x8ff7ff, { e: 1, pulse: { f: 6, ph: 0, amp: .1 } });                                // the big glowing muzzle cube
    c(.2, 0, -.085, [.035, .035, .02], PM_CY, { e: 1 });
    // an eldritch tendril eating the omnitool's shoulder: black coils round the mount, a mass over the top, a helix down the upper arm,
    // and writhing tendrils rising out of it, with the cannon's light still pulsing inside
    for (let k = 0; k < 4; k++) add([-.4, 1.46 + k * .065, 0], [.3 - (k % 2) * .02, .05, .3], PM_TEN, { rz: (k % 2 ? .28 : -.28), ...sw });
    add([-.42, 1.68, 0], [.26, .12, .26], PM_TEN, { rz: .2, ...sw }); add([-.52, 1.58, -.05], [.1, .26, .22], PM_TEN, { rz: .15, ...sw }); add([-.3, 1.62, .08], [.1, .16, .16], PM_TEN, { rz: -.2, ...sw });
    for (let k = 0; k < 7; k++) { const a = k * 1.35; c(.08 + k * .07, Math.cos(a) * .105, Math.sin(a) * .105 - .01, [.07, .1, .07], PM_TEN, { rz: -.1 + Math.sin(a) * .3 }); }
    add([-.5, 1.62, -.13], [.045, .045, .045], PM_CYD, { e: 1, pulse: { f: 4, ph: 0, amp: .25 } }); add([-.36, 1.7, -.1], [.04, .04, .04], PM_CYD, { e: 1, pulse: { f: 4.6, ph: 2, amp: .25 } }); c(.3, -.1, -.1, [.035, .035, .035], PM_CYD, { e: 1, pulse: { f: 5, ph: 1, amp: .25 } });
    strand(-.45, 1.7, .0, -1, [[80, .17], [62, .16], [38, .15], [12, .14], [-14, .12]], .1, .035, PM_TEN, null, { f: 0, ph: 0 });
    strand(-.4, 1.72, .02, -1, [[88, .16], [104, .15], [126, .14], [150, .12]], .09, .03, PM_TEN, null, { f: .3, ph: 2 });
    strand(-.42, 1.68, -.1, -1, [[55, .14], [36, .14], [12, .13], [-14, .12]], .085, .03, PM_TEN, null, { f: .6, ph: 4 });
    strand(-.38, 1.68, .13, -1, [[70, .15], [86, .15], [108, .14], [128, .12]], .085, .03, PM_TEN, null, { f: .9, ph: 1 });
    strand(-.52, 1.5, -.02, -1, [[-62, .16], [-86, .16], [-70, .15], [-96, .14]], .085, .035, PM_TEN, null, { f: 1.2, ph: 3 });
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
  w.forEach(h => { const [sx, sy, sz, c, e, dz, dy] = h; out.push(P_([.46 * PM_K, weapon === 4 ? .8 + (dy || 0) : .58, -.2 + (dz || 0) - (weapon === 4 ? -.2 : sz * .3)], [sx, sy, sz], c, e ? { e: 1, sw: { ph: 0, amp: .16 } } : { sw: { ph: 0, amp: .16 } })); });
  return out;
}
// ---- character preview: a tiny software renderer on a 2D canvas (orthographic, painter's algorithm), like Minecraft's inventory doll
const CHAR_FACES = [[[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]], [[-1, 0, 0], [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]]], [[0, 1, 0], [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]]], [[0, -1, 0], [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1]]], [[0, 0, 1], [[1, -1, 1], [1, 1, 1], [-1, 1, 1], [-1, -1, 1]]], [[0, 0, -1], [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]]]];
function drawCharPreview(cv, yaw, pitch, t, weapon, walk) {
  const g = cv.getContext('2d'), W = cv.width, H_ = cv.height; g.clearRect(0, 0, W, H_);
  const grd = g.createRadialGradient(W / 2, H_ * .55, 10, W / 2, H_ * .55, H_ * .6); grd.addColorStop(0, '#0e3a4a99'); grd.addColorStop(1, '#00000000'); g.fillStyle = grd; g.fillRect(0, 0, W, H_);
  const sc = Math.min(H_ / 2.95, W / 2.6), cy = H_ * .94, c = Math.cos(yaw + Math.PI), s = Math.sin(yaw + Math.PI), cp = Math.cos(pitch), sp = Math.sin(pitch), quads = [];
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
