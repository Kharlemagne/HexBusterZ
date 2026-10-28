// ---------------- viewmodels ----------------
const ARM = P_([.04, -.14, .42], [.16, .16, .6], 0x2a0d10, { rx: -.12 });
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
  for (const p of m.parts) {
    const VS_ = .86, ox2 = p.o[0] * VS_, oy2 = p.o[1] * VS_, oz2 = p.o[2] * VS_;
    const wx = ox + R[0] * ox2 + R[1] * oy2 + R[2] * oz2, wy = oy + R[3] * ox2 + R[4] * oy2 + R[5] * oz2, wz = oz + R[6] * ox2 + R[7] * oy2 + R[8] * oz2;
    const PR = p.rx ? mulR(R, rotX(p.rx)) : R;
    let c = p.rgb;
    if (P.weapon === 3 && p.e && cds[3] > 0) { const f = 1 - cds[3] / 1.6; c = [.4 * f + .15, 1 * f + .1, 1 * f + .1]; }
    pushBox(wx, wy, wz, p.s[0] * VS_, p.s[1] * VS_, p.s[2] * VS_, c[0], c[1], c[2], PR, !p.e, 0);
  }
  if (P.flashT > 0 && m.fc[0] + m.fc[1] > 0) {
    const t = m.tip, wx = ox + R[0] * t[0] + R[1] * t[1] + R[2] * t[2], wy = oy + R[3] * t[0] + R[4] * t[1] + R[5] * t[2], wz = oz + R[6] * t[0] + R[7] * t[1] + R[8] * t[2], s = rnd(.1, .2);
    pushBox(wx, wy, wz, s, s, s * 1.5, m.fc[0], m.fc[1], m.fc[2], rotZ(rnd(TAU)), false, 0);
    pushBox(wx, wy, wz, s * .5, s * .5, s * 2.2, 1, 1, .9, null, false, 0);
  }
  if (P.weapon === 0 && P.charge > 0) { const s = .03 + P.charge * .08; pushBox(ox + .0, oy + .12, oz - .05, s, s, s, 1, .5 + P.charge * .5, .1, null, false, 0); }
}

