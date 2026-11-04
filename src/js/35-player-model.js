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
  // ---- the head, built from solid pieces (no thin layers stacked on big faces, so nothing can flicker): a dark core cube, a front plate made of
  // separate blocks around real recessed sockets, and a toothed jaw. The -x half of the face plate is pale bone (the skull half), the +x half is dark plate.
  const BONE = 0x8c8ca2, BONE2 = 0xc4c4d6;
  add([0, 1.945, .04], [.66, .49, .52], PM_ST, { tl: G });                                                                // core cube: front face at z -.22, back at +.30
  add([0, 2.215, .02], [.5, .05, .4], PM_ST3, { tl: G });                                                                 // flat cap on top
  const FZ = -.26;                                                                                                        // front-plate blocks are .08 deep: their faces sit at -.30
  add([-.1725, 2.07, FZ], [.315, .24, .08], BONE, { tl: TILE.BONEY }); add([.1725, 2.07, FZ], [.315, .24, .08], PM_ST, { tl: G });   // forehead row
  add([-.28, 1.86, FZ], [.1, .18, .08], BONE, { tl: TILE.BONEY }); add([-.0325, 1.86, FZ], [.035, .18, .08], BONE, { tl: TILE.BONEY });  // bone half, either side of the socket
  add([.28, 1.86, FZ], [.1, .18, .08], PM_ST, { tl: G }); add([.0325, 1.86, FZ], [.035, .18, .08], PM_ST, { tl: G });                  // plate half
  add([-.205, 1.735, FZ], [.25, .07, .08], BONE, { tl: TILE.BONEY }); add([.1725, 1.735, FZ], [.315, .07, .08], PM_ST, { tl: G });     // cheek row (the gap at the seam is half a nose)
  for (const sd of [-1, 1]) { add([sd * .14, 1.86, -.23], [.18, .18, .02], 0x000000); add([sd * .14, 1.86, -.255], [.13, .13, .03], PM_CY, { e: 1, pulse: { f: 2, ph: sd, amp: .05 } }); }   // sockets + the eyes sunk in them
  add([0, 2.07, -.315], [.12, .12, .03], 0x000000); add([0, 2.07, -.338], [.085, .085, .03], PM_CY, { e: 1, pulse: { f: 3, ph: 0, amp: .08 } });  // the third eye, standing proud of the forehead
  add([0, 1.615, -.01], [.58, .17, .54], PM_ST2, { tl: G });                                                             // jaw
  for (let k = 0; k < 4; k++) { const x = -.05 - k * .065; add([x, 1.655, -.3], [.05, .07, .04], BONE2, { tl: TILE.BONEY }); add([x, 1.57, -.3], [.05, .07, .04], BONE2, { tl: TILE.BONEY }); }   // teeth on the bone half
  for (const y of [1.655, 1.62, 1.585]) add([.16, y, -.29], [.24, .015, .02], PM_CYD, { e: 1 });                         // vent slits on the plate half
  add([.342, 2.0, -.05], [.02, .26, .012], PM_CRK, { rz: .5 }); add([-.342, 1.95, .1], [.02, .24, .012], PM_CRK, { rz: -.4 }); add([.14, 2.0, .312], [.012, .3, .02], PM_CRK, { rz: .3 });   // cracks standing just off the sides
  add([-.27, 2.255, .1], [.12, .08, .14], PM_ST3, { rz: .3 }); add([-.2, 2.27, -.05], [.08, .1, .08], PM_ST3, { rz: -.3 });   // chipped chunks on the cap
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
  // a tiny software renderer with a real depth buffer (orthographic, drawn at 2x and smoothed down), so overlapping blocks can never flick in front of or behind each other
  const g = cv.getContext('2d'), W = cv.width, H_ = cv.height, S = 2, bw = W * S, bh = H_ * S; g.clearRect(0, 0, W, H_);
  const grd = g.createRadialGradient(W / 2, H_ * .55, 10, W / 2, H_ * .55, H_ * .6); grd.addColorStop(0, '#0e3a4a99'); grd.addColorStop(1, '#00000000'); g.fillStyle = grd; g.fillRect(0, 0, W, H_);
  let st = cv._st; if (!st || st.bw !== bw || st.bh !== bh) { const c1 = document.createElement('canvas'), c2 = document.createElement('canvas'); c1.width = c2.width = bw; c1.height = c2.height = bh; const x1 = c1.getContext('2d'), x2 = c2.getContext('2d'); st = cv._st = { bw, bh, c1, c2, x1, x2, zb: new Float32Array(bw * bh), i1: x1.createImageData(bw, bh), i2: x2.createImageData(bw, bh) }; }
  const zb = st.zb, d1 = st.i1.data, d2 = st.i2.data; zb.fill(-1e9); d1.fill(0); d2.fill(0);
  const sc = Math.min(H_ / 2.95, W / 2.6), cy = H_ * .94, c = Math.cos(yaw + Math.PI), s = Math.sin(yaw + Math.PI), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const proj = (x, y, z) => { const x1 = x * c + z * s, z1 = -x * s + z * c, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp; return [(W / 2 + x1 * sc) * S, (cy - y2 * sc) * S, z2]; };
  const tri = (a, b, cc, r, gr, bl, em) => {
    const ax = a[0], ay = a[1], bx = b[0], by = b[1], cx = cc[0], cy2 = cc[1], d = (bx - ax) * (cy2 - ay) - (by - ay) * (cx - ax); if (Math.abs(d) < 1e-6) return; const inv = 1 / d;
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx))), x1 = Math.min(bw - 1, Math.ceil(Math.max(ax, bx, cx))), y0 = Math.max(0, Math.floor(Math.min(ay, by, cy2))), y1 = Math.min(bh - 1, Math.ceil(Math.max(ay, by, cy2)));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + .5, py = y + .5, w1 = ((px - ax) * (cy2 - ay) - (py - ay) * (cx - ax)) * inv, w2 = ((bx - ax) * (py - ay) - (by - ay) * (px - ax)) * inv, w0 = 1 - w1 - w2;
      if (w0 < -1e-4 || w1 < -1e-4 || w2 < -1e-4) continue;
      const z = w0 * a[2] + w1 * b[2] + w2 * cc[2], i = y * bw + x; if (z <= zb[i]) continue; zb[i] = z; const o = i * 4;
      d1[o] = r; d1[o + 1] = gr; d1[o + 2] = bl; d1[o + 3] = 255; if (em) { d2[o] = r; d2[o + 1] = gr; d2[o + 2] = bl; d2[o + 3] = 255; } else d2[o + 3] = 0;
    }
  };
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
      const pts = vs.map(v => { const r = rot(v[0] * hx_, v[1] * hy_, v[2] * hz_); return proj(ox + r[0], oy + r[1], oz + r[2]); });
      const ny2 = n[1] * cp - nz * sp, lit = em ? 1.2 : .55 + .45 * Math.max(0, nx * .3 + ny2 * .8 + nz2 * .5);
      const R = Math.min(255, col[0] * 255 * lit) | 0, G_ = Math.min(255, col[1] * 255 * lit) | 0, B = Math.min(255, col[2] * 255 * lit) | 0;
      tri(pts[0], pts[1], pts[2], R, G_, B, em); tri(pts[0], pts[2], pts[3], R, G_, B, em);
    }
  }
  st.x1.putImageData(st.i1, 0, 0); st.x2.putImageData(st.i2, 0, 0);
  g.imageSmoothingEnabled = true; g.drawImage(st.c1, 0, 0, W, H_);
  g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(5px)'; g.globalAlpha = .85; g.drawImage(st.c2, 0, 0, W, H_); g.restore();     // the glow
}
