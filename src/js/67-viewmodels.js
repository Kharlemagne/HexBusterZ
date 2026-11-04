// ---------------- viewmodels ----------------
// ONE arm now: the cannon arm (same build as the player model's left arm). Every weapon is a firing MODE of it:
// the mode bolts different parts on and tints its lights, and a little hologram floats above it showing which mode is live.
// Cannon-local: -z = the way it points, +y up.
const CAN_CY = 0x2fe6ff, CAN_CYD = 0x1792b3;
const CANNON = [
  P_([0, 0, .62], [.24, .2, .22], 0x3a4b4d, { tl: TILE.GRAIN }), P_([0, .12, .62], [.18, .05, .18], 0x2f3f41),                                      // shoulder block
  P_([0, 0, .32], [.15, .15, .5], 0x253234, { tl: TILE.GRAIN }), P_([0, 0, -.02], [.2, .2, .12], 0x3a4b4d), P_([0, 0, -.2], [.16, .16, .3], 0x2f3f41, { tl: TILE.GRAIN }),
  P_([0, .084, -.2], [.02, .015, .26], CAN_CY, { e: 1 }), P_([-.084, 0, -.2], [.015, .02, .26], CAN_CY, { e: 1 }), P_([.084, 0, -.2], [.015, .02, .26], CAN_CYD, { e: 1 }),
  P_([0, .08, .12], [.12, .014, .014], CAN_CY, { e: 1 }), P_([0, .08, .0], [.12, .014, .014], CAN_CY, { e: 1 }), P_([0, .08, .24], [.12, .014, .014], CAN_CY, { e: 1 }),
  P_([0, 0, -.38], [.1, .1, .18], 0x2f3f41), P_([0, 0, -.49], [.14, .14, .04], 0x3a4b4d),
];
// beaded cyan chains wrapped round the gun, like the model's
for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (let k = 0; k < 6; k++)
  CANNON.push(P_([sx * (.095 + (k % 2) * .012), sy * (.085 + (k % 2) * .012), .38 - k * .1 + (sx * sy > 0 ? .05 : 0)], [.022, .022, .06], CAN_CY, { e: 1 }));
// per-mode attachments (e = emissive, 'acc' parts take the mode colour)
const MODE_ACC = [[1, .78, .3], [1, .5, .2], [.35, .95, 1], [.4, 1, .9], [.55, 1, .55]];
const MODE_TIP = [-.55, -.55, -.55, -.98, -.82];
const MODE_PARTS = [
  [P_([0, .105, -.3], [.03, .04, .05], 0xff3a20, { e: 1, acc: 1 }), P_([0, 0, -.45], [.17, .17, .03], 0xd9a441, { e: 1, acc: 1 })],
  [P_([-.075, -.1, -.3], [.045, .045, .56], 0x6a6a78), P_([.075, -.1, -.3], [.045, .045, .56], 0x6a6a78), P_([0, 0, -.53], [.3, .1, .05], 0x3a3a46), P_([-.12, 0, -.56], [.03, .08, .02], 0xff7a1a, { e: 1, acc: 1 }), P_([.12, 0, -.56], [.03, .08, .02], 0xff7a1a, { e: 1, acc: 1 })],
  [P_([0, .13, -.02], [.15, .1, .2], 0xff7a1a, { e: 1 }), P_([0, .085, -.02], [.18, .03, .24], 0x3a3a46), P_([0, -.11, -.3], [.09, .05, .26], 0x22e6ff, { e: 1, acc: 1 })],
  [P_([0, 0, -.72], [.06, .06, .5], 0x2e3340), ...[0, 1, 2, 3].map(i => P_([0, 0, -.6 - i * .11], [.17, .17, .035], CAN_CY, { e: 1, acc: 1 })), P_([0, .105, -.2], [.04, .05, .5], 0x8c8c9a)],
  [P_([0, 0, -.55], [.05, .05, .5], 0x6a4a2a), P_([0, 0, -.82], [.4, .07, .09], 0x9aa4b4), P_([-.22, 0, -.8], [.08, .14, .09], 0x9aa4b4), P_([.22, 0, -.8], [.08, .14, .09], 0x9aa4b4), P_([0, 0, -.82], [.1, .12, .1], 0x55ffaa, { e: 1, acc: 1 })],
];
const MODE_MAXCD = [.3, .8, .12, 1.6, .15];
let vmMuzzle = [0, 0, -1, 0];            // viewmodel-space spot of the muzzle (x, y, z), set while drawing
function drawCannonArm() {
  const w = P.weapon, acc = MODE_ACC[w] || MODE_ACC[0];
  const spd = Math.hypot(P.vx, P.vz), gr = P.onGround ? 1 : .3, k = clamp(spd / 10, 0, 1.3) * gr;
  const bob = Math.sin(P.bobT + 1.2) * .012 * k, bobX = Math.cos(P.bobT * .5 + 1) * .01 * k, tt = performance.now() / 1000;
  let ox = -.39 - bobX - P.swayX * .6, oy = -.175 + bob - P.kick * .1 + Math.sin(tt * 1.3) * .004, oz = -.6 + P.kick * .5, rx = .09 + P.kickRot * .4;
  if (P.sliding) { oy -= .06; ox += .03; } if (P.dashT > 0) oz += .04; if (P.slamming) oy -= .1;
  if (w === 4) { rx -= P.swing * 1.0; oz -= P.swing * .1; }
  const R = mulR(mulR(rotY(.3 - P.swayX), rotX(rx)), rotZ(.05)), VS_ = .62;
  const W = (lx, ly, lz) => [ox + (R[0] * lx + R[1] * ly + R[2] * lz) * VS_, oy + (R[3] * lx + R[4] * ly + R[5] * lz) * VS_, oz + (R[6] * lx + R[7] * ly + R[8] * lz) * VS_];
  for (const p of CANNON.concat(MODE_PARTS[w])) {
    const pu = p.pulse ? 1 + Math.sin(tt * 6) * .12 : 1, q = W(p.o[0], p.o[1], p.o[2]);
    let c = p.rgb;
    if (p.acc) c = acc; else if (w === 3 && p.e && cds[3] > 0) { const f = 1 - cds[3] / 1.6; c = [.4 * f + .15, 1 * f + .1, 1 * f + .1]; }
    pushBox(q[0], q[1], q[2], p.s[0] * VS_ * pu, p.s[1] * VS_ * pu, p.s[2] * VS_ * pu, c[0], c[1], c[2], R, !p.e, 0, p.e ? TILE.GLOW : partTile(p));
  }
  // barrel end: the muzzle ring + the big glowing cube, tinted by the mode
  const tz = MODE_TIP[w], mq = W(0, 0, tz + .03), pu = 1 + Math.sin(tt * 6) * .1;
  pushBox(mq[0], mq[1], mq[2], .16 * VS_ * pu, .14 * VS_ * pu, .15 * VS_ * pu, .55 + acc[0] * .45, .55 + acc[1] * .45, .55 + acc[2] * .45, R, false, 0, TILE.GLOW);
  vmMuzzle = W(0, 0, tz - .05); vmMuzzle[3] = 0;
  // black tendrils curling out of the shoulder
  for (let k2 = 0; k2 < 3; k2++) for (let i = 0; i < 5; i++) {
    const a = tt * 2.2 + i * .6 + k2 * 2, lx = (-.05 - k2 * .06 - i * .035) + Math.sin(a) * (.01 + i * .008), ly = .06 + i * .06, lz = .6 + k2 * .05 - i * .03, q = W(lx, ly, lz);
    pushBox(q[0], q[1], q[2], (.04 - i * .006) * VS_, .07 * VS_, (.04 - i * .006) * VS_, .03, .03, .04, R, true, 0, TILE.PLATE);
  }
  return { W, acc, tt };
}
// ---- the floating mode hologram: tiny lit pixel-font boxes, drawn additively ----
function holoText(text, cx, cy, z, px, c) {
  const n = text.length, wpx = n * 6 - 1, rows = [];
  for (let r = 0; r < 5; r++) { let s = ''; for (const ch of text) { const g = FONT[ch]; s += (g ? g[r] : '.....') + '.'; } rows.push(s); }
  for (let r = 0; r < 5; r++) {
    const s = rows[r]; let i = 0;
    while (i < s.length) {
      if (s[i] !== '#') { i++; continue; } let j = i; while (j < s.length && s[j] === '#') j++;
      pushBox(cx + ((i + j) / 2 - wpx / 2) * px, cy + (2 - r) * px, z, (j - i) * px, px, px * .5, c[0], c[1], c[2], null, false, 0, TILE.GLOW); i = j;
    }
  }
}
function drawModeHolo(info) {
  const { W, acc, tt } = info, w = P.weapon, f = .85 + Math.sin(tt * 23) * .05 + (Math.random() < .03 ? -.4 : 0);
  const cx = W(0, 0, 0)[0] + .1, cy = W(0, 0, 0)[1] + .22, cz = -.55, px = .0026;
  const a = [acc[0] * f, acc[1] * f, acc[2] * f], dim = [acc[0] * .35 * f, acc[1] * .35 * f, acc[2] * .35 * f];
  const name = WNAMES[w], pw = (name.length * 6 + 4) * px, ph = P.weapon === 4 ? .092 : .07, pyo = P.weapon === 4 ? -.011 : 0;
  pushBox(cx, cy - .004 + pyo, cz + .002, pw + .02, ph, .002, acc[0] * .05, acc[1] * .06, acc[2] * .06, null, false, 0, TILE.GLOW);                 // faint glass
  const e = .0014; for (const sy of [-1, 1]) pushBox(cx, cy - .004 + pyo + sy * ph / 2, cz, pw + .02, e, e, a[0], a[1], a[2], null, false, 0, TILE.GLOW);
  for (const sx of [-1, 1]) pushBox(cx + sx * (pw + .02) / 2, cy - .004 + pyo, cz, e, ph, e, a[0], a[1], a[2], null, false, 0, TILE.GLOW);
  holoText('MODE ' + (w + 1), cx, cy + .024, cz, px * .6, dim);
  holoText(name, cx, cy + .002, cz, px, a);
  const rdy = w === 4 ? 1 : 1 - clamp((cds[w] || 0) / MODE_MAXCD[w], 0, 1), bw = pw - .01;                                                      // ready bar
  pushBox(cx, cy - .026, cz, bw, .004, .002, dim[0], dim[1], dim[2], null, false, 0, TILE.GLOW);
  if (rdy > .01) pushBox(cx - bw / 2 + bw * rdy / 2, cy - .026, cz, bw * rdy, .003, .002, a[0], a[1], a[2], null, false, 0, TILE.GLOW);
  if (w === 4) holoText(SHAPE_NAMES[P.shape || 0], cx, cy - .036, cz, px * .6, dim);
}
function drawViewmodel() {
  const info = drawCannonArm();
  if (P.flashT > 0 && P.weapon !== 4) {
    const fc = [[1, .8, .3], [1, .7, .25], [.4, .95, 1], [.4, 1, 1]][P.weapon] || [1, 1, 1], s = rnd(.1, .2);
    pushBox(vmMuzzle[0], vmMuzzle[1], vmMuzzle[2], s, s, s * 1.5, fc[0], fc[1], fc[2], rotZ(rnd(TAU)), false, 0);
    pushBox(vmMuzzle[0], vmMuzzle[1], vmMuzzle[2], s * .5, s * .5, s * 2.2, 1, 1, .9, null, false, 0);
  }
  if (P.weapon === 0 && P.charge > 0) { const s = .03 + P.charge * .08; pushBox(vmMuzzle[0], vmMuzzle[1] + .1, vmMuzzle[2] + .1, s, s, s, 1, .5 + P.charge * .5, .1, null, false, 0); }
  flushDyn();
  drawModeHolo(info); flushDynAdd(.9);
}
