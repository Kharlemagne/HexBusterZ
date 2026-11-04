// ---------------- viewmodels ----------------
const ARM = P_([.04, -.14, .42], [.16, .16, .6], 0x24252d, { rx: -.12, tl: TILE.GRAIN });                    // the bare obsidian right arm
const ARMX = [P_([.04, -.058, .42], [.05, .012, .5], 0x2fe6ff, { rx: -.12, e: 1, ax: 1 }), P_([.04, -.14, .12], [.17, .17, .05], 0x33353f, { rx: -.12 })];   // neon line along it + a bracer
// the LEFT arm: Karl's cyan-lit cannon, low in the corner of the screen. Local -z = the way it points.
const CANNON = [
  P_([0, 0, .32], [.15, .15, .5], 0x253234, { tl: TILE.GRAIN }), P_([0, 0, -.02], [.17, .17, .12], 0x3a4b4d), P_([0, 0, -.2], [.16, .16, .3], 0x2f3f41, { tl: TILE.GRAIN }),
  P_([0, .084, -.2], [.02, .015, .26], 0x2fe6ff, { e: 1 }), P_([-.084, 0, -.2], [.015, .02, .26], 0x2fe6ff, { e: 1 }), P_([.084, 0, -.2], [.015, .02, .26], 0x1792b3, { e: 1 }),
  P_([0, 0, -.38], [.1, .1, .18], 0x2f3f41), P_([0, 0, -.49], [.14, .14, .04], 0x3a4b4d), P_([0, 0, -.52], [.1, .1, .05], 0x8ff7ff, { e: 1, pulse: 1 }),
  P_([0, .08, .12], [.12, .014, .014], 0x2fe6ff, { e: 1 }), P_([0, .08, .0], [.12, .014, .014], 0x2fe6ff, { e: 1 }),
];
function drawCannonArm() {
  const spd = Math.hypot(P.vx, P.vz), gr = P.onGround ? 1 : .3, k = clamp(spd / 10, 0, 1.3) * gr;
  const bob = Math.sin(P.bobT + 1.2) * .012 * k, bobX = Math.cos(P.bobT * .5 + 1) * .01 * k, tt = performance.now() / 1000;
  let ox = -.31 - bobX - P.swayX * .6, oy = -.31 + bob - P.kick * .1 + Math.sin(tt * 1.3) * .004, oz = -.55 + P.kick * .5;
  if (P.sliding) { oy -= .06; ox += .03; } if (P.dashT > 0) oz += .04; if (P.slamming) oy -= .1;
  const R = mulR(mulR(rotY(.1 - P.swayX), rotX(.04 + P.kickRot * .4)), rotZ(.06)), VS_ = .8;
  for (const p of CANNON) {
    const ox2 = p.o[0] * VS_, oy2 = p.o[1] * VS_, oz2 = p.o[2] * VS_, pu = p.pulse ? 1 + Math.sin(tt * 6) * .12 : 1;
    pushBox(ox + R[0] * ox2 + R[1] * oy2 + R[2] * oz2, oy + R[3] * ox2 + R[4] * oy2 + R[5] * oz2, oz + R[6] * ox2 + R[7] * oy2 + R[8] * oz2, p.s[0] * VS_ * pu, p.s[1] * VS_ * pu, p.s[2] * VS_ * pu, p.rgb[0], p.rgb[1], p.rgb[2], R, !p.e, 0, p.e ? TILE.GLOW : partTile(p));
  }
  // two black tendrils curling up out of the shoulder, off the left edge of the screen
  for (let k2 = 0; k2 < 2; k2++) for (let i = 0; i < 4; i++) {
    const a = tt * 2.2 + i * .6 + k2 * 2, lx = (-.05 - k2 * .05 - i * .035) + Math.sin(a) * (.01 + i * .008), ly = .06 + i * .06, lz = .35 + k2 * .06 - i * .02;
    pushBox(ox + R[0] * lx + R[1] * ly + R[2] * lz, oy + R[3] * lx + R[4] * ly + R[5] * lz, oz + R[6] * lx + R[7] * ly + R[8] * lz, .035 - i * .006, .07, .035 - i * .006, .03, .03, .04, R, true, 0, TILE.PLATE);
  }
}
const MODELS = [
  { tip: [0, .04, -.52], fc: [1, .8, .3], parts: [P_([0, .03, -.1], [.09, .1, .36], 0x8c8c9a), P_([0, .035, -.36], [.06, .06, .2], 0x5a5a68), P_([0, 0, .02], [.14, .13, .15], 0xd9a441), P_([0, -.03, .13], [.1, .16, .2], 0x6b1414),
    P_([0, -.16, .2], [.07, .2, .09], 0x2a1010, { rx: .3 }), P_([0, .1, .12], [.04, .06, .06], 0xff3a20, { e: 1 }), ARM] },
  { tip: [0, .05, -.7], fc: [1, .7, .25], parts: [P_([-.035, .04, -.25], [.06, .06, .72], 0x6a6a78), P_([.035, .04, -.25], [.06, .06, .72], 0x6a6a78), P_([0, -.02, -.12], [.13, .09, .24], 0x4a2a14),
    P_([0, 0, .1], [.13, .13, .22], 0x3a3a46), P_([0, -.05, .32], [.1, .15, .3], 0x5a1a1a), P_([0, .1, -.55], [.03, .03, .03], 0xff4a2a, { e: 1 }), ARM] },
  { tip: [0, .03, -.6], fc: [.4, .95, 1], parts: [P_([0, 0, -.02], [.14, .16, .44], 0x3b3f4a), P_([0, .02, -.4], [.05, .05, .4], 0x8c8c9a), P_([0, .15, .0], [.17, .16, .17], 0xff7a1a, { e: 1 }),
    P_([0, -.04, -.36], [.09, .05, .2], 0x22e6ff, { e: 1 }), P_([0, -.15, .12], [.07, .18, .09], 0x2a1010, { rx: .25 }), ARM] },
  { tip: [0, .02, -.95], fc: [.4, 1, 1], parts: [P_([0, 0, -.3], [.07, .08, .95], 0x2e3340), ...[0, 1, 2, 3, 4].map(i => P_([0, 0, -.05 - i * .17], [.16, .16, .05], 0x22e6ff, { e: 1 })),
    P_([0, -.02, .26], [.13, .17, .26], 0x6b1414), P_([0, -.14, .22], [.07, .16, .09], 0x2a1010, { rx: .25 }), ARM] },
  { tip: [0, .3, 0], fc: [0, 0, 0], rx: -.7, parts: [P_([0, 0, 0], [.05, .62, .05], 0x6a4a2a), P_([0, .33, 0], [.42, .07, .09], 0x9aa4b4), P_([-.22, .3, 0], [.08, .14, .09], 0x9aa4b4), P_([.22, .3, 0], [.08, .14, .09], 0x9aa4b4), P_([0, -.2, .1], [.15, .16, .55], 0x2a0d10, { rx: .7 })] }
];
function drawViewmodel() {
  const m = MODELS[P.weapon], spd = Math.hypot(P.vx, P.vz), gr = P.onGround ? 1 : .3;
  const bob = Math.sin(P.bobT) * .012 * clamp(spd / 10, 0, 1.3) * gr, bobX = Math.cos(P.bobT * .5) * .01 * clamp(spd / 10, 0, 1.3) * gr;
  let oy = -.27 + bob - P.kick * .18, ox = .28 + bobX + P.swayX, oz = -.58 + P.kick;
  let rx = P.kickRot + (m.rx || 0), rz = 0;
  if (P.sliding) { oy -= .06; rz = .25; ox -= .04; }
  if (P.weapon === 4) { rx += -P.swing * 1.2; oz -= P.swing * .1; }
  if (P.dashT > 0) { oz += .05; rx += .15; }
  if (P.slamming) { oy -= .12; }
  const R = mulR(mulR(rotY(P.swayX * 1.5), rotX(rx)), rotZ(rz));
  for (const p of m.parts.concat(ARMX)) {
    const VS_ = .86, ox2 = p.o[0] * VS_, oy2 = p.o[1] * VS_, oz2 = p.o[2] * VS_;
    const wx = ox + R[0] * ox2 + R[1] * oy2 + R[2] * oz2, wy = oy + R[3] * ox2 + R[4] * oy2 + R[5] * oz2, wz = oz + R[6] * ox2 + R[7] * oy2 + R[8] * oz2;
    const PR = p.rx ? mulR(R, rotX(p.rx)) : R;
    let c = p.rgb;
    if (P.weapon === 3 && p.e && !p.ax && cds[3] > 0) { const f = 1 - cds[3] / 1.6; c = [.4 * f + .15, 1 * f + .1, 1 * f + .1]; }
    pushBox(wx, wy, wz, p.s[0] * VS_, p.s[1] * VS_, p.s[2] * VS_, c[0], c[1], c[2], PR, !p.e, 0);
  }
  drawCannonArm();
  if (P.flashT > 0 && m.fc[0] + m.fc[1] > 0) {
    const t = m.tip, wx = ox + R[0] * t[0] + R[1] * t[1] + R[2] * t[2], wy = oy + R[3] * t[0] + R[4] * t[1] + R[5] * t[2], wz = oz + R[6] * t[0] + R[7] * t[1] + R[8] * t[2], s = rnd(.1, .2);
    pushBox(wx, wy, wz, s, s, s * 1.5, m.fc[0], m.fc[1], m.fc[2], rotZ(rnd(TAU)), false, 0);
    pushBox(wx, wy, wz, s * .5, s * .5, s * 2.2, 1, 1, .9, null, false, 0);
  }
  if (P.weapon === 0 && P.charge > 0) { const s = .03 + P.charge * .08; pushBox(ox + .0, oy + .12, oz - .05, s, s, s, 1, .5 + P.charge * .5, .1, null, false, 0); }
}

