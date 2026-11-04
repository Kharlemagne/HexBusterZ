// ============================================================
//  THE HELICARRIER'S MOVING PARTS: crew robots at the consoles, a wheeled robot rolling round the bridge, a hovering drone, the robot arms over the
//  Hellgate chamber, the burning portal itself, and every hologram (the bridge's cyan cylinder, holo screens, the orange containment cubes, the window glass).
//  Nothing here is solid: it is all drawn live, like the vats. Layout comes from 25-station-int.js.
// ============================================================
const CREW = (() => {                                                           // a chunky voxel robot: white shell, dark joints, glowing visor. front = +z of the model
  const W = 0xdfe6ea, G = 0x39424d, D = 0x1b2128, T = 0x2a9d9a;
  return [
    P_([-.2, .3, 0], [.22, .6, .24], D), P_([.2, .3, 0], [.22, .6, .24], D), P_([-.2, .62, .02], [.26, .16, .3], G), P_([.2, .62, .02], [.26, .16, .3], G),          // legs and knees
    P_([0, 1.05, 0], [.66, .62, .4], W), P_([0, 1.32, .21], [.5, .22, .04], T), P_([0, .78, 0], [.5, .16, .34], G), P_([0, 1.12, .21], [.18, .18, .04], 0x7af0ff, { e: 1, pulse: { f: 3, ph: 0, amp: .15 } }),
    P_([0, 1.52, 0], [.2, .1, .2], G), P_([0, 1.8, 0], [.46, .42, .42], W), P_([0, 1.82, .22], [.38, .14, .05], 0x0a1418), P_([-.1, 1.82, .25], [.1, .07, .03], 0x7af0ff, { e: 1 }), P_([.1, 1.82, .25], [.1, .07, .03], 0x7af0ff, { e: 1 }),
    P_([0, 2.06, 0], [.06, .2, .06], G), P_([0, 2.2, 0], [.1, .1, .1], 0xff5a5a, { e: 1, pulse: { f: 2, ph: 1, amp: .3 } }),
    P_([-.47, 1.15, .15], [.16, .5, .2], W, { sw: { ph: 0, amp: .1 } }), P_([.47, 1.15, .15], [.16, .5, .2], W, { sw: { ph: 2, amp: .1 } }), P_([-.47, .86, .32], [.14, .14, .3], G, { sw: { ph: 1, amp: .1 } }), P_([.47, .86, .32], [.14, .14, .3], G, { sw: { ph: 3, amp: .1 } })
  ];
})();
const CREW_O = CREW.map(p => { const q = Object.assign({}, p); q.rgb = p.rgb.slice(); if (p.c === 0x2a9d9a) q.rgb = hx(0xe08a30); return q; });           // the Hellgate crew wear orange instead of teal
const WHEELY = [
  P_([0, .22, 0], [.9, .12, .9], 0x1b2128), P_([-.5, .2, 0], [.14, .4, .4], 0x0c0f13, { e: 0 }), P_([.5, .2, 0], [.14, .4, .4], 0x0c0f13), P_([0, .2, -.5], [.4, .4, .14], 0x0c0f13),
  P_([0, .65, 0], [.7, .5, .6], 0xdfe6ea), P_([0, .66, .31], [.4, .12, .03], 0x2a9d9a), P_([0, 1.12, 0], [.1, .2, .1], 0x39424d), P_([0, 1.4, 0], [.5, .34, .4], 0xdfe6ea),
  P_([0, 1.42, .21], [.4, .18, .04], 0x0a1418), P_([0, 1.42, .24], [.14, .1, .03], 0x7af0ff, { e: 1, pulse: { f: 4, ph: 0, amp: .2 } }), P_([-.42, .75, .1], [.12, .4, .12], 0x39424d, { sw: { ph: 0, amp: .08 } }), P_([.42, .75, .1], [.12, .4, .12], 0x39424d, { sw: { ph: 2, amp: .08 } })
];
const DRONE = [
  P_([0, 0, 0], [.7, .3, .7], 0xdfe6ea), P_([0, .2, 0], [.3, .14, .3], 0x39424d), P_([0, -.22, 0], [.26, .12, .26], 0x7af0ff, { e: 1, pulse: { f: 5, ph: 0, amp: .2 } }),
  P_([-.6, .05, 0], [.5, .06, .12], 0x39424d), P_([.6, .05, 0], [.5, .06, .12], 0x39424d), P_([0, .05, -.6], [.12, .06, .5], 0x39424d), P_([0, .05, .6], [.12, .06, .5], 0x39424d),
  P_([0, .2, 0], [.18, .04, .18], 0xffffff, { orb: { r: .85, y: .28, spd: 11, ph: 0 } }), P_([0, .2, 0], [.18, .04, .18], 0xffffff, { orb: { r: .85, y: .28, spd: 11, ph: 1.6 } }), P_([0, .2, 0], [.18, .04, .18], 0xffffff, { orb: { r: .85, y: .28, spd: 11, ph: 3.1 } }), P_([0, .2, 0], [.18, .04, .18], 0xffffff, { orb: { r: .85, y: .28, spd: 11, ph: 4.7 } })
];
const BRIDGE_CREW = [[29.5, -33, 1], [29.5, -24, 1], [29.5, -12, 1], [29.5, 0, 1], [29.5, 12, 1], [29.5, 24, 1], [29.5, 33, 1], [14.5, 33.5, 0], [-14.5, 33.5, 0], [28.5, 33.5, 0], [-28.5, 33.5, 0], [14.5, -33.5, 2], [-14.5, -33.5, 2], [28.5, -33.5, 2], [-28.5, -33.5, 2]];     // x, z, facing: 1 east, 0 south, 2 north
const RING_CREW = [0, 1, 2, 3, 4, 5].map(k => { const a = k * Math.PI / 3 + Math.PI / 6, ox = Math.cos(a), oz = Math.sin(a); return [ox * 4.3 + .5, oz * 4.3 + .5, Math.atan2(ox, oz)]; });
const GATE_CREW = [[-26.5, -72, -1], [-26.5, -86, -1], [27.5, -72, 1], [27.5, -86, 1]];
const faceYaw = f => f === 1 ? Math.PI / 2 : f === -1 ? -Math.PI / 2 : f === 2 ? Math.PI : 0;
const fire = (a, b) => { const k = Math.max(0, Math.min(1, a)); return [.25 + .75 * k, .02 + .6 * k * k * (.6 + .4 * b), .01 + .35 * k * k * k]; };
function drawLeds(t) {                                                         // blinking server lights: 8 frames, uneven 120 ms steps, one hash per light
  const fr = Math.floor(t / .12);
  for (let i = 0; i < STN_LEDS.length; i++) { const L = STN_LEDS[i]; if (Math.abs(L[2] - camZ) > 45 || Math.abs(L[0] - camX) > 60) continue;
    for (let k = 0; k < 2; k++) { const q = ih(i * 2 + k, (fr + i) & 7, 3, 55); if (q < .45) continue; const amber = q > .93, c = amber ? [1, .6, 0] : [0, .9, 1];
      pushBox(L[0] - .02, L[1] + .2 + k * .4, L[2] + .15 + k * .5, .06, .12, .12, c[0], c[1], c[2], null, false); } }
}
function stationNear(rz0, rz1) { return camZ > rz0 && camZ < rz1; }
function drawStationProps(t) {
  drawPodSolids(t); drawShipDisplay(t); drawCrisisHolo(t);
   drawStationDoors(t);
  if (stationNear(-125, 50)) {                                                  // ---- the bridge (visible from the door too)
    BRIDGE_CREW.forEach(([x, z, f], i) => drawParts(CREW, x, SD + 1, z, rotY(faceYaw(f)), 1, t, false, t * 5 + i * 1.7));
    RING_CREW.forEach(([x, z, yaw], i) => drawParts(CREW, x, SD + 1, z, rotY(yaw), 1, t, false, t * 5 + i));
    drawLeds(t);
    const a = t * .07, wx = Math.cos(a) * 22, wz = Math.sin(a) * 22; drawParts(WHEELY, wx, SD + 1, wz, rotY(-a + Math.PI), 1, t, false, t * 4);
    const b = -t * .22, dxp = Math.cos(b) * 8, dzp = Math.sin(b) * 8; drawParts(DRONE, dxp, SD + 12 + Math.sin(t * 1.1) * .5, dzp, rotY(-b), 1, t, false, 0);
    pushBox(dxp, SD + 11.5 + Math.sin(t * 1.1) * .5, dzp, .12, 1.8, .12, .4, .9, 1, null, false, .55);
  }
  if (stationNear(-125, -25)) {                                                 // ---- the Hellgate chamber
    GATE_CREW.forEach(([x, z, f], i) => drawParts(CREW_O, x, SD + 1, z, rotY(faceYaw(f)), 1, t, false, t * 4 + i));
    for (const [bx, bz, sx, ph] of [[-24, -96, -1, 0], [24, -96, 1, 1.7], [-38, -66, -1, 3.1], [38, -66, 1, 4.4]]) drawArm(bx, SD + 33, bz, sx, ph, t);
    drawPortal(t);
  }
}
// an industrial arm hanging from the ceiling: three segments and a claw, swaying slowly
function drawArm(bx, by, bz, sx, ph, t) {
  const a1 = .55 + .3 * Math.sin(t * .35 + ph), a2 = -.9 + .5 * Math.sin(t * .5 + ph * 1.3), zs = Math.sin(t * .27 + ph) * 2;
  const J1 = [bx - sx * Math.sin(a1) * 9, by - 4 - Math.cos(a1) * 6, bz + zs * .5], J2 = [J1[0] - sx * Math.sin(a1 + a2) * 8, J1[1] - Math.cos(a1 + a2) * 8, J1[2] + zs], J3 = [J2[0] - sx * Math.sin(a2) * 3, J2[1] - 3.2, J2[2]];
  const DK = [.18, .2, .26], OR = [1, .45, .08];
  pushBox(bx, by - .5, bz, 3.2, 1.2, 3.2, .15, .16, .2, null, true); pushBox(bx, by - 2.5, bz, 1.6, 3, 1.6, .22, .24, .3, null, true);
  pushBeam(bx, by - 4, bz, J1[0], J1[1], J1[2], .75, DK, 1); pushBeam(J1[0], J1[1], J1[2], J2[0], J2[1], J2[2], .6, DK, 1); pushBeam(J2[0], J2[1], J2[2], J3[0], J3[1], J3[2], .38, DK, 1);
  for (const J of [J1, J2, J3]) pushBox(J[0], J[1], J[2], 1.3, 1.3, 1.3, OR[0], OR[1], OR[2], null, false);
  const open = .5 + .4 * Math.sin(t * 1.3 + ph); for (const s of [-1, 1]) pushBeam(J3[0] + s * open, J3[1] - .2, J3[2], J3[0] + s * (open * .5), J3[1] - 2.4, J3[2], .2, [.8, .8, .85], 1);
}
// the Hellgate itself: a disc of fire turning inside the clamp ring, lightning from the rim, embers
function drawPortal(t) {
  const G = GATE_C, cx = G.x, cy = G.y, cz = G.z, R = G.r;
  if (camZ < cz - 2 || Math.hypot(camX - cx, camZ - cz) > 120) return;
  const step = .85;
  for (let gy = -R; gy <= R; gy += step) for (let gx = -R; gx <= R; gx += step) {
    const r = Math.hypot(gx, gy); if (r > R - .2) continue;
    const a = Math.atan2(gy, gx), sw = Math.sin(a * 3 + r * .9 - t * 2.4) * .5 + .5, sw2 = Math.sin(a * 5 - r * 1.6 + t * 3.1) * .5 + .5;
    const heat = Math.min(1, .15 + (r / R) * .55 + sw * .35 * (1 - r / R * .3)) * (.85 + .15 * sw2), c = fire(heat, sw2);
    pushBox(cx + gx, cy + gy, cz + Math.sin(t * 2 + r) * .1 + (R - r) * .035, step + .02, step + .02, .2, c[0], c[1], c[2], null, false);
  }
  for (let k = 0; k < 5; k++) { let px = cx, py = cy; const a0 = t * (.9 + k * .13) + k * 1.26; for (let s = 1; s <= 8; s++) { const rd = s / 8 * (R - .5), a = a0 + s * .5, x = cx + Math.cos(a) * rd, y = cy + Math.sin(a) * rd; pushBeam(px, py, cz + .6, x, y, cz + .6, .2 + .1 * (1 - s / 8), [1, .85 - s * .04, .35], 1); px = x; py = y; } }
  pushBox(cx, cy, cz + .5, 1.1 + Math.sin(t * 3) * .25, 1.1 + Math.sin(t * 3) * .25, .3, 1, .8, .35, rotY(t), false);
  const sd = Math.floor(t * 12), jr = (a, b) => ih(sd, a, b, 777) - .5;
  if (sd % 3 === 0) for (let b = 0; b < 2; b++) {                                // lightning from the rim to the middle
    const a = ih(Math.floor(t * 3), b, 5, 99) * TAU; let px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R;
    for (let s = 1; s <= 7; s++) { const f = s / 7, x = cx + Math.cos(a) * R * (1 - f * .9) + jr(s, b) * 1.6, y = cy + Math.sin(a) * R * (1 - f * .9) + jr(s + 9, b) * 1.6; pushBeam(px, py, cz + .8, x, y, cz + .8, .12, [1, .9, .6], 1); px = x; py = y; }
  }
  if (Math.random() < .6) { const a = Math.random() * TAU, r = Math.random() * R; emit(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz + 1.2, rnd(-.6, .6), rnd(.6, 2.2), rnd(.3, 1.4), rnd(.06, .12), Math.random() < .5 ? [1, .55, .1] : [1, .9, .4], rnd(.5, 1.4), 0); }
}
// ---------------- translucent things: holograms and the window
function holoPanel(cx, cy, cz, w, h, R, seed) {                              // a floating glowing screen showing the hologram scenes (see holo() in the shader); drawn additively
  pushBox(cx, cy, cz, w, h, .05, 1, 1, 1, R, false, 1, 600 + seed + 10 * Math.round(w * 2) + 400 * Math.round(h * 2));
}
function drawStationGlass(t) {
  drawPodGlass(t);
  const BR = .85 + .15 * Math.sin(t * 3), gph = (t * 1.1) % 7, GL = gph < .18 ? .35 : 1, HJ = gph < .18 ? Math.sin(t * 90) * .25 : 0;                // breathing alpha, and a brief glitch every few seconds
  const near = stationNear(-125, 50) || camZ < -20; if (!near) return;
  const CY = [.25, .85, 1], OR = [1, .5, .12];
  if (camZ > -45) {                                                             // ---- the bridge: the holo cylinder over the console, window tint
    const cx = HEX.x + .5, cz = HEX.z + .5, y0 = SD + 5, H = 9, N = 20;
    for (let k = 0; k < N; k++) { const a = k / N * TAU + t * .3, fl = .5 + .5 * Math.sin(t * 2 + k * 1.3); pushBox(cx + Math.cos(a) * 3.2, y0 + H / 2, cz + Math.sin(a) * 3.2, 1.05, H, .06, CY[0], CY[1] * (.7 + .3 * fl), CY[2], rotY(-a - Math.PI / 2), false); }
    pushBox(cx, y0 + H / 2, cz, 1.3, H, 1.3, .1, .5, .8, null, false);
    flushDynA(.28 * BR * GL);
    for (let k = 0; k < 5; k++) { const y = y0 + ((k * 1.9 + t * .9) % H), rr = 3.25; for (let s = 0; s < 24; s++) { const a = s / 24 * TAU + t * (k & 1 ? .5 : -.5); pushBox(cx + Math.cos(a) * rr, y, cz + Math.sin(a) * rr, .5, .08, .5, .5, 1, 1, rotY(-a), false); } }
    for (let k = 0; k < 14; k++) { const a = t * .4 + k * 1.7, rr = 1 + (k % 4) * .5, y = y0 + 1 + ((k * 2.3 + t * .7) % (H - 2)); pushBox(cx + Math.cos(a) * rr, y, cz + Math.sin(a) * rr, .3, .3, .3, .7, 1, 1, rotY(a), false); }
    pushBox(cx, SD + 4.6, cz, 6.4, .12, 6.4, .3, .9, 1, null, false); pushBox(cx, SD + 5 + H, cz, 6.8, .12, 6.8, .3, .9, 1, null, false);
    flushDynA(.55 * BR * GL);
    drawBridgeHolos(t, BR * GL, HJ);
    const wy = (WIN.y0 + WIN.y1 + 1) / 2, wz = (WIN.z0 + WIN.z1 + 1) / 2;                       // the window: a faint blue pane with slow reflections
    pushBox(WIN.x0 + 1.5, wy, wz, .1, WIN.y1 - WIN.y0 + 1, WIN.z1 - WIN.z0 + 1, .1, .25, .4, null, false); flushDynA(.07);
    for (let k = 0; k < 4; k++) { const z = -26 + ((k * 17 + t * 2.5) % 54); pushBox(WIN.x0 + 1.4, wy + Math.sin(k * 2) * 3, z, .06, 16, .5, .5, .8, 1, rotX(.7), false); } flushDynA(.06);
  }
  if (camZ < -20) {                                                             // ---- the Hellgate chamber: orange containment cubes and holo screens
    for (const sx of [-1, 1]) for (const [cx, cz] of [[sx * 14, -62], [sx * 24, -100]]) {
      const y = SD + 7.5 + Math.sin(t * .8 + cx) * .35, s = 4.2 + Math.sin(t * 1.5 + cz) * .1;
      pushBox(cx + .5, y, cz + .5, s, s, s, OR[0], OR[1] * .8, OR[2], rotY(t * .2), false);
    }
    flushDynA(.3);
    for (const sx of [-1, 1]) for (const [cx, cz] of [[sx * 14, -62], [sx * 24, -100]]) {
      const y = SD + 7.5 + Math.sin(t * .8 + cx) * .35; pushBox(cx + .5, y, cz + .5, 1.8, 1.8, 1.8, 1, .75, .3, rotY(t * 1.1), false); pushBox(cx + .5, y, cz + .5, 1.8, 1.8, 1.8, 1, .75, .3, mulR(rotY(t * 1.1), rotX(.78)), false);
      for (let k = 0; k < 6; k++) { const a = t * .7 + k * 1.05; pushBox(cx + .5 + Math.cos(a) * 2.6, y + Math.sin(a * 1.3) * 1.4, cz + .5 + Math.sin(a) * 2.6, .25, .25, .25, 1, .8, .4, rotY(a), false); }
    }
    flushDynA(.8);
    flushDynAdd(1); for (const [x, z] of GATE_CREW) { const s = x < 0 ? -1 : 1; holoPanel(x + s * 2.6, SD + 7, z, 3, 1.8, rotY(Math.PI / 2), 5 + ((z + 90) >> 1) % 5); }
    flushDynAdd(.85 * BR * GL);
  }
}

// the ring console's holograms: a floating curved band of data over the desk, a wireframe globe over the pedestal, small screens above the desks
function drawBridgeHolos(t, br, hj) {
  const cx = HEX.x + .5, cz = HEX.z + .5, C = [.2, .9, 1];
  flushDynAdd(1);
  for (let k = 0; k < 3; k++) for (let i = 0; i < 3; i++) { const a = k * 2.0944 + i * .6 + 1.0 + t * .06; holoPanel(cx + Math.cos(a) * 7.4 + hj, SD + 14.5, cz + Math.sin(a) * 7.4, 5.2, 3.2, rotY(-a - Math.PI / 2), (k * 3 + i) % 5); }        // the curved band
  flushDynAdd(.9 * br);
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + Math.PI / 6, x = cx + Math.cos(a) * 6.2, z = cz + Math.sin(a) * 6.2; holoPanel(x, SD + 6.6 + Math.sin(t * 1.2 + k) * .15, z, 2.6, 1.7, rotY(-a - Math.PI / 2), k % 5); }
  for (const sx of [-1, 1]) for (const ox of [14, 28]) for (const sz of [-1, 1]) holoPanel(sx * ox + .5, SD + 8.4, sz * 31.5 + .5, 3, 1.8, rotY(sz > 0 ? 0 : Math.PI), (ox + sx + 3) % 5);
  for (const [x, z, f] of BRIDGE_CREW) if (f === 1) holoPanel(x + 2.1, SD + 7.2, z, 2.4, 1.5, rotY(Math.PI / 2), (z + 40) % 5);
  flushDynAdd(.8 * br);
  for (let i = 0; i < 3; i++) for (let k = 0; k < 14; k++) { const a = k / 14 * TAU + t * (.5 + i * .2), r = 2.2, ca = Math.cos(a), sa = Math.sin(a), tilt = i * 1.05; pushBox(cx + ca * r * Math.cos(tilt) * .98, SD + 7 + sa * r, cz + ca * r * Math.sin(tilt), .3, .3, .3, .3, 1, 1, null, false); }
  for (let k = 0; k < 8; k++) pushBox(cx, SD + 4.6 + k * .55, cz, 2.4 * Math.sin((k + .5) / 8 * Math.PI) + .1, .05, 2.4 * Math.sin((k + .5) / 8 * Math.PI) + .1, .3, .9, 1, rotY(t * .3 + k), false);
  flushDynAdd(.7 * br);
}
