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
// There are no separate per-mode objects any more: the arm itself TRANSFORMS. Five morph channels spring toward each mode's pose when you switch,
// so the barrel telescopes out, splits in two, vents open, jaws unfold or the piston ring slides forward, with a flash and a mechanical clunk.
//                    [barrel length, split, vents, claw, piston]
const MORPH_T = [[0, 0, 0, 0, 1], [0, 1, 0, 0, 0], [0, 0, 1, 0, 0], [1, 0, 0, 0, 0], [0, 0, 0, 1, 0]];
const MP = { x: [0, 0, 0, 0, 1], v: [0, 0, 0, 0, 0], acc: [1, .78, .3], w: -1, t: 9, flash: 0 };
function morphTick(dt, w) {
  if (MP.w !== w) { if (MP.w >= 0) { MP.t = 0; MP.flash = 1; try { tone(170, .13, 'square', .1, 80); tone(640, .08, 'triangle', .07, 1000, .12); tone(300, .1, 'square', .06, 150, .24); } catch (e) { } } else MP.x = MORPH_T[w].slice(); MP.w = w; }
  dt = Math.min(.05, dt); MP.t += dt; MP.flash = Math.max(0, MP.flash - dt * 2.2);
  for (let n = 0; n < 3; n++) for (let i = 0; i < 5; i++) { const h = dt / 3; MP.v[i] += (230 * (MORPH_T[w][i] - MP.x[i]) - 15 * MP.v[i]) * h; MP.x[i] += MP.v[i] * h; }   // springs with a little overshoot = snappy mechanical settle
  const ta = MODE_ACC[w] || MODE_ACC[0], k = Math.min(1, dt * 9); for (let i = 0; i < 3; i++) MP.acc[i] += (ta[i] - MP.acc[i]) * k;
}
const MODE_TIP_OF = () => -.55 - .43 * MP.x[0] - .27 * MP.x[3];
const MODE_MAXCD = [.3, .8, .12, 1.6, .15];
const HOLO_AT = [.3, .15, .17, 0];            // where the mode hologram floats: [along the gun toward its base, right, up, depth] from the arm
let vmMuzzle = [0, 0, -1, 0];            // viewmodel-space spot of the muzzle (x, y, z), set while drawing
function drawMorphRig(W, R, VS_, acc, tt) {
  const x = MP.x, sz = v => Math.max(.002, v), len = x[0], split = x[1], vent = x[2], claw = x[3], ring = x[4], ST = 0x6a6a78, DK = 0x2e3340, LT = 0x9aa4b4;
  const put = (lx, ly, lz, sx, sy, sz_, hex, em, Rl, col) => {
    const q = W(lx, ly, lz), c = col || hx(hex), Rr = Rl ? mulR(R, Rl) : R;
    pushBox(q[0], q[1], q[2], sx * VS_, sy * VS_, sz_ * VS_, c[0], c[1], c[2], Rr, !em, 0, em ? TILE.GLOW : TILE.GRAIN);
  };
  // telescoping barrel (LONGSHOT): a spine and three sleeves slide out of the muzzle
  { const L = .46 * len; put(0, 0, -.5 - L / 2, .035, .035, sz(L), LT); for (let i = 0; i < 3; i++) { const zc = -.54 - (.03 + .15 * i) * len, w_ = .12 - .025 * i; put(0, 0, zc, w_, w_, .06 + .05 * len, DK); } }
  // split barrel (SCATTERGUT): two barrels unfold from the muzzle and splay apart
  if (split > .02) for (const sx of [-1, 1]) {
    const ang = sx * .16 * split, hl = .035 + .19 * split, xc = sx * (.04 + .075 * split), zc = -.5 - hl;
    put(xc, 0, zc, .055, .1, sz(hl * 2), ST, false, rotY(ang));
  }
  // vents (SPITFIRE): two top plates hinge open
  if (vent > .02) { for (const sx of [-1, 1]) put(sx * (.045 + .03 * vent), .105 + .03 * vent, -.22, .07, .014, .22, 0x3a3a46, false, rotZ(-sx * .75 * vent)); }
  // jaws (OMNITOOL): top and bottom jaws open round a spinning block-core
  if (claw > .02) { for (const sy of [-1, 1]) { const a = sy * .55 * claw; put(0, sy * (.07 + .13 * Math.sin(Math.abs(a))), -.5 - .13 * Math.cos(a), .13, .02, .26, LT, false, rotX(a)); }
    for (const sx of [-1, 1]) put(sx * .075, 0, -.5 - .15 * claw, .015, .015, sz(.3 * claw), LT); }
  // piston ring (HELLPISTON): a heavy steel disc on a rod, which kicks back when you fire
  if (ring > .02) { const pump = clamp((cds[0] || 0) / MODE_MAXCD[0], 0, 1) * ring; put(0, 0, -.5 - .1 * ring + .03, .05, .05, sz(.22 * ring), ST); put(0, 0, -.46 - .07 * ring + .05 * pump, .2 * ring + .02, .2 * ring + .02, .03, ST, false); }
}
function drawCannonArm() {
  GP.tick();
  const w = P.weapon; morphTick(Math.min(.1, (performance.now() - (MP.last || performance.now())) / 1000), w); MP.last = performance.now();
  const acc = MP.acc.map((c, i) => c + (1 - c) * MP.flash * .85);                                    // the mode colour, washed white for a moment while it transforms
  const spd = Math.hypot(P.vx, P.vz), gr = P.onGround ? 1 : .3, k = clamp(spd / 10, 0, 1.3) * gr;
  const bob = Math.sin(P.bobT + 1.2) * .012 * k, bobX = Math.cos(P.bobT * .5 + 1) * .01 * k, tt = performance.now() / 1000;
  let ox = -.34 - bobX - P.swayX * .6, oy = -.175 + bob - P.kick * .1 + Math.sin(tt * 1.3) * .004, oz = -.6 + P.kick * .5, rx = .09 + P.kickRot * .4;
  if (P.sliding) { oy -= .06; ox += .03; } if (P.dashT > 0) oz += .04; if (P.slamming) oy -= .1;
  const tr = Math.min(1, MP.t / .5), pulse = MP.t < .5 ? Math.sin(tr * Math.PI) : 0;               // transformation: the arm pulls back, tips up and twists while the parts re-arrange
  oz += .08 * pulse; oy += .02 * pulse; rx += .22 * pulse; const twist = Math.sin(tr * TAU) * .2 * (1 - tr);
  const G = GP.v, B = GP_BASE; ox += B.x + G.x; oy += B.y + G.y; oz += B.z + G.z; rx += B.pitch + G.pitch;                  // B = the pose Karl tuned by hand; G = live offsets from GUN ARM POSITION mode (zero = shipped)
  const R = mulR(mulR(rotY(.42 - P.swayX + B.yaw + G.yaw), rotX(rx)), rotZ(.05 + B.roll + G.roll + twist)), VS_ = .62 * B.scale * G.scale;
  const W = (lx, ly, lz) => [ox + (R[0] * lx + R[1] * ly + R[2] * lz) * VS_, oy + (R[3] * lx + R[4] * ly + R[5] * lz) * VS_, oz + (R[6] * lx + R[7] * ly + R[8] * lz) * VS_];
  for (const p of CANNON) {
    const pu = p.pulse ? 1 + Math.sin(tt * 6) * .12 : 1, q = W(p.o[0], p.o[1], p.o[2]);
    let c = p.rgb;
    if (p.acc) c = acc; else if (w === 3 && p.e && cds[3] > 0) { const f = 1 - cds[3] / 1.6; c = [.4 * f + .15, 1 * f + .1, 1 * f + .1]; }
    pushBox(q[0], q[1], q[2], p.s[0] * VS_ * pu, p.s[1] * VS_ * pu, p.s[2] * VS_ * pu, c[0], c[1], c[2], R, !p.e, 0, p.e ? TILE.GLOW : partTile(p));
  }
  drawMorphRig(W, R, VS_, acc, tt);
  // barrel end (no glowing cube any more: the shapes themselves are the mode)
  const tz = MODE_TIP_OF();
  vmMuzzle = W(0, 0, tz - .05); vmMuzzle[3] = 0;
  // black tendrils curling out of the shoulder
  for (let k2 = 0; k2 < 3; k2++) for (let i = 0; i < 5; i++) {
    const a = tt * 2.2 + i * .6 + k2 * 2, lx = (-.05 - k2 * .06 - i * .035) + Math.sin(a) * (.01 + i * .008), ly = .06 + i * .06, lz = .6 + k2 * .05 - i * .03, q = W(lx, ly, lz);
    pushBox(q[0], q[1], q[2], (.04 - i * .006) * VS_, .07 * VS_, (.04 - i * .006) * VS_, .03, .03, .04, R, true, 0, TILE.PLATE);
  }
  return { W, acc: MP.acc, tt };
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
// both holograms hang in the air: they follow the arm lazily (a low-pass filter) so walking, recoil and the mode change do not make them bounce
const HOLO_BASE = { x: -.034, y: -.014, z: .246, scale: .3, depth: -.143 };              // where Karl put the mode display with MODE DISPLAY POSITION (baked in; the tool's offsets go on top)
const HSM = { m: null, i: null, t: 0 };
function holoSmooth(key, tgt, tt) {
  const c = HSM[key], dt = clamp(tt - (HSM['t' + key] || tt), 0, .1); HSM['t' + key] = tt;
  if (!c || Math.hypot(tgt[0] - c[0], tgt[1] - c[1], tgt[2] - c[2]) > .25) return HSM[key] = tgt.slice(0, 3);
  const k = 1 - Math.exp(-dt * 3); for (let j = 0; j < 3; j++) c[j] += (tgt[j] - c[j]) * k; return c;
}
function holoFan(E, bx, by, bz, bw, col, fl, tt) {                          // a projector lens on the arm and the fan of light that carries the picture
  pushBox(E[0], E[1], E[2], .022, .006, .022, col[0], col[1], col[2], null, false, 0, TILE.GLOW);
  for (let i = 0; i < 7; i++) { const k = (i + .5) / 7, a = .16 * (1 - k * .5) * fl * (.8 + .2 * Math.sin(tt * 9 - i * 1.3));
    pushBox(lerp(E[0], bx, k), lerp(E[1] + .004, by, k), lerp(E[2], bz, k), lerp(.012, bw, k), Math.abs(by - E[1]) / 7 + .0005, .0006, col[0] * a, col[1] * a, col[2] * a, null, false, 0, TILE.GLOW); }
}
function drawModeHolo(info) {
  const { W, acc, tt } = info, w = P.weapon, f = .85 + Math.sin(tt * 23) * .05 + (Math.random() < .03 ? -.4 : 0);
  const ho = GP.h, hs = ho.scale * HOLO_BASE.scale, hb = holoSmooth('m', W(0, 0, HOLO_AT[0]), tt), cx = hb[0] + HOLO_AT[1] + ho.x + HOLO_BASE.x, cy = hb[1] + HOLO_AT[2] + ho.y + HOLO_BASE.y, cz = HOLO_BASE.depth + ho.z, px = .0026 * hs;      // a fixed distance from the eye: this close to the camera, following the arm's depth would make it swell and shrink
  const a = [acc[0] * f, acc[1] * f, acc[2] * f], dim = [acc[0] * .35 * f, acc[1] * .35 * f, acc[2] * .35 * f];
  const name = WNAMES[w], pw = (name.length * 6 + 4) * px, ph = (P.weapon === 4 ? .092 : .07) * hs, pyo = (P.weapon === 4 ? -.011 : 0) * hs;
  pushBox(cx, cy - .004 * hs + pyo, cz + .002, pw + .02 * hs, ph, .002, acc[0] * .05, acc[1] * .06, acc[2] * .06, null, false, 0, TILE.GLOW);                 // faint glass
  const e = .0014 * hs; for (const sy of [-1, 1]) pushBox(cx, cy - .004 * hs + pyo + sy * ph / 2, cz, pw + .02 * hs, e, e, a[0], a[1], a[2], null, false, 0, TILE.GLOW);
  for (const sx of [-1, 1]) pushBox(cx + sx * (pw + .02 * hs) / 2, cy - .004 * hs + pyo, cz, e, ph, e, a[0], a[1], a[2], null, false, 0, TILE.GLOW);
  { const pb = cy - .004 * hs + pyo - ph / 2, L = W(0, .1, .46); holoFan(L, cx, pb, cz, (pw + .02 * hs) * .96, acc, f, tt); }                 // the same projector light as the held-item display, from a lens by the shoulder
  holoText('MODE ' + (w + 1), cx, cy + .024 * hs, cz, px * .6, dim);
  holoText(name, cx, cy + .002 * hs, cz, px, a);
  const rdy = w === 4 ? 1 : 1 - clamp((cds[w] || 0) / MODE_MAXCD[w], 0, 1), bw = pw - .01 * hs;                                                      // ready bar
  pushBox(cx, cy - .026 * hs, cz, bw, .004 * hs, .002, dim[0], dim[1], dim[2], null, false, 0, TILE.GLOW);
  if (rdy > .01) pushBox(cx - bw / 2 + bw * rdy / 2, cy - .026 * hs, cz, bw * rdy, .003 * hs, .002, a[0], a[1], a[2], null, false, 0, TILE.GLOW);
  if (w === 4) holoText(SHAPE_NAMES[P.shape || 0], cx, cy - .036 * hs, cz, px * .6, dim);
}
// ---- the HELD ITEM hologram (omnitool): the selected item is not put in a hand. A small projector half way up the forearm throws a fan of light,
//      and the item's flat picture floats in it with its name and count. Drawn additively, so it is see-through.
const ITEM_HOLO_AT = [.16, .1, .2];                                         // the projector, in arm space: [x, y (up), z (toward the shoulder; the muzzle is at -.5)]
function itemHoloGeo(info) {
  const { W, tt } = info, E = W(ITEM_HOLO_AT[0] - .16, ITEM_HOLO_AT[1], ITEM_HOLO_AT[2]), A = holoSmooth('i', E, tt), px = .0046, w = 16 * px;
  return { E, px, w, cx: A[0] + .012, cy: A[1] + .112, cz: A[2], tt };
}
function drawItemHoloSolid(info) {                                          // the picture itself: solid, full colour, every pixel
  if (P.weapon !== 4) return; const s = Inv.slots[Inv.sel]; if (!s) return;
  const { px, cx, cy, cz } = itemHoloGeo(info);
  for (const r of itemRuns(s.k)) pushBox(cx + (r[0] + r[2] / 2 - 8) * px, cy + (8 - r[1] - .5) * px, cz, r[2] * px + .0002, px + .0002, .0005, Math.min(1, r[3] * 1.05), Math.min(1, r[4] * 1.05), Math.min(1, r[5] * 1.05), null, false, 0);
}
function drawItemHolo(info) {
  if (P.weapon !== 4) return; const s = Inv.slots[Inv.sel]; if (!s) return;
  const { E, px, w, cx, cy, cz, tt } = itemHoloGeo(info), fl = .85 + Math.sin(tt * 19) * .04, HC = [.35, .9, 1], hw = w * .6;
  holoFan(E, cx, cy - hw, cz, w * 1.1, HC, fl, tt);
  const sl = cy + Math.sin(tt * 1.5) * w * .5; pushBox(cx, sl, cz - .0004, w * 1.08, px * .45, .0004, HC[0] * .55, HC[1] * .55, HC[2] * .55, null, false, 0, TILE.GLOW);      // the scan line riding up and down the picture
  pushBox(cx, sl, cz - .0004, w * 1.08, px * 2.2, .0004, HC[0] * .1, HC[1] * .1, HC[2] * .1, null, false, 0, TILE.GLOW);
  const e = .0011; for (const sx of [-1, 1]) for (const sy of [-1, 1]) { pushBox(cx + sx * (hw - .006), cy + sy * hw, cz, .012, e, e, HC[0] * fl, HC[1] * fl, HC[2] * fl, null, false, 0, TILE.GLOW); pushBox(cx + sx * hw, cy + sy * (hw - .006), cz, e, .012, e, HC[0] * fl, HC[1] * fl, HC[2] * fl, null, false, 0, TILE.GLOW); }      // corner brackets
  const nm = itemName(s.k).toUpperCase().slice(0, 18), npx = Math.min(.0017, w * 1.7 / (nm.length * 6)), dim = [HC[0] * .9 * fl, HC[1] * .9 * fl, HC[2] * .9 * fl];
  holoText(nm, cx, cy + hw + .011, cz, npx, dim);
  if (!Inv.creative) holoText('X' + s.n, cx + hw - .012, cy - hw - .009, cz, .0014, [fl, fl, fl * .9]);
}
// ---- the SYPHON: a flat stream of square pixels between the block in the crosshair and the mouth of the arm (toward the arm when mining, away when placing)
function drawSyphon(info) {
  if (P.weapon !== 4 || Syph.t <= 0) return;
  const { tt } = info, A = [0, 0, -Math.min(9.5, Math.max(.8, Syph.dist + .3))], B = vmMuzzle, c = Syph.col, al = Math.min(1, Syph.t / .07), N = 16;
  for (let i = 0; i < N; i++) {
    let u = (i / N + tt * 2.6) % 1; if (Syph.dir < 0) u = 1 - u;                                           // u = 0 at the block, 1 at the arm
    const ang = i * 2.4 + tt * 7 * Syph.dir, rad = (1 - u) * (1 - u) * .34 + .004, sz = lerp(.11, .009, Math.sqrt(u)), b = (.55 + .45 * ((i * 7) % 3) / 2) * al;
    pushBox(lerp(A[0], B[0], u) + Math.cos(ang) * rad, lerp(A[1], B[1], u) + Math.sin(ang) * rad, lerp(A[2], B[2], u), sz, sz, .001, (c[0] * .6 + .25) * b, (c[1] * .6 + .32) * b, (c[2] * .6 + .4) * b, null, false, 0, TILE.GLOW);
  }
  const k = Mine.on && Mine.need > 0 ? clamp(Mine.p / Mine.need, 0, 1) : Syph.pulse, r = lerp(.62, .2, k), e = .012, g = .5 * al;         // a square of light closing on the block
  for (const q of [-1, 1]) { pushBox(A[0], A[1] + q * r, A[2], r * 2, e, .001, .4 * g, .9 * g, g, null, false, 0, TILE.GLOW); pushBox(A[0] + q * r, A[1], A[2], e, r * 2, .001, .4 * g, .9 * g, g, null, false, 0, TILE.GLOW); }
  pushBox(B[0], B[1], B[2], .05, .05, .001, .4 * al, .9 * al, al, null, false, 0, TILE.GLOW);
}
function drawViewmodel() {
  const info = drawCannonArm();
  if (P.flashT > 0 && P.weapon !== 4) {
    const fc = [[1, .8, .3], [1, .7, .25], [.4, .95, 1], [.4, 1, 1]][P.weapon] || [1, 1, 1], s = rnd(.1, .2);
    pushBox(vmMuzzle[0], vmMuzzle[1], vmMuzzle[2], s, s, s * 1.5, fc[0], fc[1], fc[2], rotZ(rnd(TAU)), false, 0);
    pushBox(vmMuzzle[0], vmMuzzle[1], vmMuzzle[2], s * .5, s * .5, s * 2.2, 1, 1, .9, null, false, 0);
  }
  if (P.weapon === 0 && P.charge > 0) { const s = .03 + P.charge * .08; pushBox(vmMuzzle[0], vmMuzzle[1] + .1, vmMuzzle[2] + .1, s, s, s, 1, .5 + P.charge * .5, .1, null, false, 0); }
  drawItemHoloSolid(info);
  flushDyn();
  drawModeHolo(info); drawItemHolo(info); drawSyphon(info); flushDynAdd(.9);
}
