// ---------------- THE POD RIDE + THE HANGAR ----------------
// Four pods stand along the east wall of the arrival hall. Step into one: the door shuts, the pod drops down a lit shaft, then
// races along a neon tunnel into the HANGAR hidden under the bridge. A pod at the hangar end rides back up to the hall.
const Y0 = SD - 40, POD_X = 31.5, PODZ = [60, 70, 80, 90], HG = { x0: -44, x1: 44, z0: -40, z1: 38, h: 24 }, HANGAR_RET = { x: 31.5, z: 34 };
STN_GLASS.push({ x0: 45, x1: 47, y0: Y0 + 3, y1: Y0 + 17, z0: -28, z1: 28 });                      // the hangar bay window onto the eldritch space
function stShip(cx, cz, hullId, trimId) {                                                          // a docked fighter, nose pointing +x, built from blocks
  const y = Y0 + 1;
  for (let i = 0; i < 18; i++) {
    const hw = i < 3 ? 2 : i < 13 ? 3 : Math.max(0, 3 - (i - 12) * .7), x = cx - 9 + i;
    for (let dz = -Math.floor(hw); dz <= Math.floor(hw); dz++) { stPut(x, y + 2, cz + dz, hullId); stPut(x, y + 3, cz + dz, Math.abs(dz) === Math.floor(hw) ? trimId : hullId); if (Math.abs(dz) < hw - 1) stPut(x, y + 4, cz + dz, i > 10 && i < 15 ? NEO('SKY') : hullId); }
    if (i > 2 && i < 11) for (let dz = 4; dz <= 4 + (11 - i); dz++) for (const s of [-1, 1]) { stPut(x, y + 2, cz + s * dz, hullId); if (dz === 4 + (11 - i)) stPut(x, y + 2, cz + s * dz, NEO('ORANGE')); }
    if (i < 6) for (let h2 = 5; h2 < 5 + 4 - (i >> 1); h2++) stPut(x, y + h2, cz, hullId);        // the tail fin
  }
  for (const [dx, dz] of [[-6, -2], [-6, 2], [4, -2], [4, 2]]) { stPut(cx + dx, y, cz + dz, B.TECH); stPut(cx + dx, y + 1, cz + dz, B.TECH); }
  for (const dz of [-2, 0, 2]) stPut(cx - 10, y + 3, cz + dz, NEO('ORANGE'));                       // engine glow
}
const SHIPYARD = { tx: 6, tz: -7, y0: Y0, px: 6, pz: 4 };                                         // the terminal you press E at, and the pad where your saved ship hovers
function stYard() {
  const y0 = Y0, cx = SHIPYARD.px, cz = SHIPYARD.pz;
  for (let z = cz - 9; z <= cz + 9; z++) for (let x = cx - 8; x <= cx + 8; x++) {
    const ex = Math.abs(x - cx) === 8, ez = Math.abs(z - cz) === 9;
    stPut(x, y0, z, ex || ez ? NEO('SKY') : (x === cx || z === cz) ? NEO('ORANGE') : ((x + z) & 1) ? B.TECH : B.STREET);
  }
  stBox(cx - 6, y0 + 1, -13, cx + 6, y0 + 12, -12, B.TECH);                                        // the backing wall with the sign
  for (let x = cx - 6; x <= cx + 6; x++) { stPut(x, y0 + 1, -11, NEO('SKY')); stPut(x, y0 + 12, -11, NEO('SKY')); }
  stSign3('SHIPYARD', cx, y0 + 6, -11, NEO('ORANGE'));
  stBox(cx - 2, y0 + 1, -9, cx + 2, y0 + 2, -8, B.HULL); stBox(cx - 2, y0 + 3, -9, cx + 2, y0 + 3, -9, B.TECH); stBox(cx - 2, y0 + 4, -9, cx + 2, y0 + 5, -9, NEO('SKY'));   // the console and its glowing screen
  stPut(cx - 3, y0 + 1, -9, B.LAMP); stPut(cx + 3, y0 + 1, -9, B.LAMP);
}
const CRISIS = { tx: 22, tz: -7, y0: Y0, cx: 22 };                                                   // the red holo terminal that launches a SORTIE
function stCrisis() {
  const y0 = Y0, cx = CRISIS.cx;
  stBox(cx - 6, y0 + 1, -13, cx + 6, y0 + 12, -12, B.TECH);
  for (let x = cx - 6; x <= cx + 6; x++) { stPut(x, y0 + 1, -11, NEO('MAGENTA')); stPut(x, y0 + 12, -11, NEO('MAGENTA')); }
  stSign3('ALERT', cx, y0 + 6, -11, NEO('MAGENTA'));
  for (let z = -9; z <= -4; z++) for (let x = cx - 4; x <= cx + 4; x++) if (z === -4 || ((x + z) & 3) < 2) stPut(x, y0, z, ((x + z) & 1) ? B.HAZ : B.TECH);      // hazard stripes in front
  stBox(cx - 2, y0 + 1, -9, cx + 2, y0 + 2, -8, B.HULL); stBox(cx - 2, y0 + 3, -9, cx + 2, y0 + 3, -9, B.TECH); stBox(cx - 2, y0 + 4, -9, cx + 2, y0 + 5, -9, NEO('MAGENTA'));
  stPut(cx - 3, y0 + 1, -9, B.LAMP); stPut(cx + 3, y0 + 1, -9, B.LAMP);
}
function drawCrisisHolo(t) {                                                                         // a red warning triangle turning over the console, flashing beacons and sweeping beams
  if (camY > CRISIS.y0 + 40 || Math.abs(camX - CRISIS.cx) > 60) return;
  const cx = CRISIS.cx, cy = CRISIS.y0 + 9.2, cz = -9.2, R = rotY(t * .9), p = .55 + .45 * Math.sin(t * 6), col = [1, .12 + .2 * p, .1];
  const V = [[0, 1.9, 0], [-1.8, -1.1, 0], [1.8, -1.1, 0]].map(v => [cx + R[0] * v[0] + R[2] * v[2], cy + v[1], cz + R[6] * v[0] + R[8] * v[2]]);
  for (let i = 0; i < 3; i++) { const a = V[i], b = V[(i + 1) % 3]; pushBeam(a[0], a[1], a[2], b[0], b[1], b[2], .22, col, 0); }
  pushBeam(cx, cy + .9, cz, cx, cy - .1, cz, .26, col, 0); pushBox(cx, cy - .6, cz, .3, .3, .3, col[0], col[1], col[2], R, false, 0);
  for (const s of [-1, 1]) { const f = (Math.sin(t * 5 + (s > 0 ? 3.14 : 0)) > 0) ? 1 : .15; pushBox(cx + s * 5.2, CRISIS.y0 + 12.8, -11.4, .9, .9, .9, 1 * f, .15 * f, .1 * f, null, false, 0); pushBeam(cx + s * 5.2, CRISIS.y0 + 12.8, -11, cx + s * 5.2 + Math.cos(t * 3) * 4 * s, CRISIS.y0 + 9, -3 + Math.sin(t * 3) * 2, .12, [1 * f, .2 * f, .15 * f], 0); }
}
function stHangar() {
  const y0 = Y0, H = HG.h;
  stBox(HG.x0 - 3, y0 - 4, HG.z0 - 3, HG.x1 + 3, y0 + H + 2, HG.z1 + 3, B.HULL);
  stBox(HG.x0, y0 + 1, HG.z0, HG.x1, y0 + H, HG.z1, 0);
  for (let z = HG.z0; z <= HG.z1; z++) for (let x = HG.x0; x <= HG.x1; x++) {                    // the floor: tiles, lit lanes, hazard stripes
    let id = ((x + z) & 7) === 0 ? B.TECH : B.STREET;
    if ((x & 15) === 0) id = NEO('SKY');
    if (Math.abs(z - HG.z1) < 2 || ((z + 40) % 20 === 0)) id = ((x + z) & 3) < 2 ? B.HAZ : B.TECH;
    stPut(x, y0, z, id);
  }
  for (let z = HG.z0 - 1; z <= HG.z1 + 1; z++) for (let y = y0 + 1; y <= y0 + H; y++) for (const x of [HG.x0 - 1, HG.x1 + 1]) stPut(x, y, z, hangarWall(z, y - y0, H));
  for (let x = HG.x0 - 1; x <= HG.x1 + 1; x++) for (let y = y0 + 1; y <= y0 + H; y++) for (const z of [HG.z0 - 1, HG.z1 + 1]) stPut(x, y, z, hangarWall(x, y - y0, H));
  for (let z = HG.z0; z <= HG.z1; z += 6) for (let x = HG.x0 + 4; x <= HG.x1 - 4; x += 10) stPut(x, y0 + H, z, B.LAMP);          // ceiling lamps
  for (let z = HG.z0 + 4; z <= HG.z1; z += 12) {                                                    // gantry ribs across the ceiling
    for (let x = HG.x0; x <= HG.x1; x++) { stPut(x, y0 + H, z, B.HULL); stPut(x, y0 + H - 1, z, (x & 3) === 0 ? NEO('SKY') : B.TECH); }
  }
  // the bay window: three blocks of hull cut away over the east wall, framed in orange
  stBox(HG.x1 + 1, y0 + 3, -28, HG.x1 + 3, y0 + 17, 28, 0);
  for (let z = -29; z <= 29; z++) { stPut(HG.x1 + 1, y0 + 2, z, NEO('ORANGE')); stPut(HG.x1 + 1, y0 + 18, z, NEO('ORANGE')); }
  for (let y = y0 + 2; y <= y0 + 18; y++) for (const z of [-29, 29]) stPut(HG.x1 + 1, y, z, NEO('ORANGE'));
  for (let z = -28; z <= 28; z += 14) stBox(HG.x1 + 1, y0 + 3, z, HG.x1 + 3, y0 + 17, z, B.HULL);                // window struts
  stSign3('HANGAR', 0, y0 + 13, HG.z0, NEO('ORANGE'));
  // three docked ships on lit pads, and some cargo
  stShip(-22, -22, B.CONC, NEO('SKY')); stShip(-22, 0, B.TECH, NEO('ORANGE')); stShip(-22, 22, B.CONC, NEO('MAGENTA'));
  for (const zc of [-22, 0, 22]) for (let x = -34; x <= -10; x++) for (const dz of [-8, 8]) stPut(x, y0, zc + dz, NEO('SKY'));
  for (const [x, z, s] of [[8, -30, 3], [12, -30, 2], [8, -26, 2], [20, -32, 3], [-4, 30, 3], [0, 31, 2], [30, -14, 3], [34, -10, 2], [10, 16, 2]]) stBox(x, y0 + 1, z, x + s - 1, y0 + s, z + s - 1, ((x + z) & 1) ? B.RBRICK : B.DBRICK);
  // the return pod pad where the tunnel opens into the hangar
  for (let z = 32; z <= 36; z++) for (let x = 29; x <= 33; x++) stPut(x, y0, z, (x === 29 || x === 33 || z === 32 || z === 36) ? NEO('SKY') : NEO('LIME'));
  stText('POD', 40, y0 + 7, HG.z1, 'x', -1, NEO('SKY'));
}
const hangarWall = (u, ry, H) => ry <= 2 ? B.TECH : (ry === 4 || ry === H - 3) ? NEO('SKY') : ((u + 200) % 12 === 0 ? B.HULL : (ry > 5 && ry < H - 4 && (u & 1) ? IM('GREEBLE PLATE') : B.TECH));
function stTunnel() {
  const z0 = HG.z1 + 1, z1 = 94;
  stBox(28, Y0, z0, 34, Y0 + 6, z1 + 1, B.HULL);
  stBox(29, Y0 + 1, z0, 33, Y0 + 5, z1, 0);
  for (let z = z0; z <= z1; z++) {
    for (let x = 29; x <= 33; x++) stPut(x, Y0, z, x === 31 ? NEO('SKY') : B.TECH);
    stPut(31, Y0 + 6, z, (z % 3 === 0) ? B.LAMP : B.TECH);
    if (z % 4 === 0) { const c = [NEO('SKY'), NEO('MAGENTA'), NEO('ORANGE'), NEO('LIME')][(z >> 2) & 3]; for (let x = 29; x <= 33; x++) stPut(x, Y0 + 5, z, c); for (let y = Y0 + 1; y <= Y0 + 5; y++) { stPut(29, y, z, c); stPut(33, y, z, c); } }
  }
}
function stPods() {
  for (let i = 0; i < PODZ.length; i++) {
    const pz = PODZ[i];
    stBox(28, Y0, pz - 2, 34, SD - 1, pz + 2, B.HULL);                                              // the shaft sleeve
    stBox(30, Y0 + 1, pz - 1, 32, SD, pz + 1, 0);                                                   // the shaft, open through the hall floor
    for (let y = Y0 + 2; y < SD; y += 3) { const c = [NEO('SKY'), NEO('MAGENTA'), NEO('ORANGE')][(y / 3 | 0) % 3];
      for (let k = -1; k <= 1; k++) { stPut(29, y, pz + k, c); stPut(33, y, pz + k, c); stPut(30 - k + 1 + 0 * k, y, pz - 2, c); stPut(30 - k + 1 + 0 * k, y, pz + 2, c); } }
    stBox(29, SD + 1, pz - 2, 35, SD + 5, pz - 2, B.HULL); stBox(29, SD + 1, pz + 2, 35, SD + 5, pz + 2, B.HULL);       // side walls
    stBox(33, SD + 1, pz - 2, 35, SD + 5, pz + 2, B.HULL); stBox(29, SD + 5, pz - 2, 35, SD + 5, pz + 2, B.TECH);        // back + roof
    for (let y = SD + 1; y <= SD + 5; y++) for (const z of [pz - 2, pz + 2]) stPut(29, y, z, NEO('SKY'));                 // glowing door posts
    for (let z = pz - 1; z <= pz + 1; z++) stPut(29, SD + 5, z, NEO('SKY'));
    stPut(31, SD + 5, pz, B.LAMP);
    for (let y = SD + 2; y <= SD + 4; y++) stPut(33, y, pz, NEO('SKY'));
    stText(String(i + 1), 29, SD + 6, pz - 2, 'z', 1, NEO('ORANGE'));
  }
  stHangar(); stTunnel(); stYard(); stCrisis();
  for (let i = 0; i < PODZ.length; i++) { const pz = PODZ[i]; stBox(30, Y0 + 1, pz - 1, 32, SD, pz + 1, 0); }     // re-open the shafts where the tunnel sleeve overlapped
}
// ---------------- the ride ----------------
const RIDE = { on: false, t: 0, segs: [], kind: '', pod: 0, cool: 0, hide: -1, door: 0 };
const ease = s => s * s * (3 - 2 * s);
function startRide(kind, pod) {
  const pz = PODZ[pod], R = RIDE; R.on = true; R.t = 0; R.kind = kind; R.pod = pod; R.hide = pod; R.door = 0;
  const top = [POD_X, SD + 1, pz], bot = [POD_X, Y0 + 1, pz], hang = [HANGAR_RET.x, Y0 + 1, HANGAR_RET.z];
  if (kind === 'down') R.segs = [{ d: 1.1, a: top, b: top, door: [0, 1] }, { d: 4.2, a: top, b: bot, door: [1, 1], fall: 1 }, { d: .9, a: bot, b: bot, door: [1, 1], turn: 0 }, { d: 7.5, a: bot, b: hang, door: [1, 1], tun: 1, yaw: 0 }, { d: 1.0, a: hang, b: hang, door: [1, 0] }];
  else R.segs = [{ d: 1.1, a: hang, b: hang, door: [0, 1] }, { d: .9, a: hang, b: hang, door: [1, 1], tun: 1, yaw: Math.PI }, { d: 7.5, a: hang, b: [POD_X, Y0 + 1, pz], door: [1, 1], tun: 1, yaw: Math.PI }, { d: 4.2, a: [POD_X, Y0 + 1, pz], b: top, door: [1, 1], rise: 1 }, { d: 1.0, a: top, b: top, door: [1, 0] }];
  R.total = R.segs.reduce((s, g) => s + g.d, 0);
  P.vx = P.vy = P.vz = 0;
}
function turnYaw(tgt, k) { let d = tgt - P.yaw; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; P.yaw += d * k; }
function tickRide(dt) {
  const R = RIDE;
  if (!(useChunks && OW.gen === 3 && mode === 'hub' && P.alive)) { R.on = false; R.hide = -1; return; }
  if (!R.on) {
    R.hide = -1; R.cool = Math.max(0, R.cool - dt); if (R.cool > 0 || state !== 'play') return;
    for (let i = 0; i < PODZ.length; i++) if (Math.abs(P.x - POD_X) < 1.1 && Math.abs(P.z - PODZ[i]) < 1.1 && P.y > SD + .4 && P.y < SD + 1.8) { startRide('down', i); return; }
    if (Math.abs(P.x - HANGAR_RET.x) < 1.1 && Math.abs(P.z - HANGAR_RET.z) < 1.1 && P.y < Y0 + 2) startRide('up', 1);
    return;
  }
  R.t += dt; let t = R.t, seg = null; for (const g of R.segs) { if (t <= g.d) { seg = g; break; } t -= g.d; }
  if (!seg) { R.on = false; R.cool = 2.5; R.hide = -1; P.vx = P.vy = P.vz = 0; P.fovPunch = 0; return; }
  const s = ease(clamp(t / seg.d, 0, 1)), sl = clamp(t / seg.d, 0, 1);
  const f = seg.tun ? (seg.yaw === 0 || seg.yaw === Math.PI ? sl * .35 + s * .65 : s) : s;
  P.x = lerp(seg.a[0], seg.b[0], f); P.y = lerp(seg.a[1], seg.b[1], f) + 1e-3; P.z = lerp(seg.a[2], seg.b[2], f);
  P.vx = P.vy = P.vz = 0; P.onGround = true; P.dashT = 0;
  R.door = lerp(seg.door[0], seg.door[1], sl);
  if (seg.tun) { turnYaw(seg.yaw, Math.min(1, 3 * dt)); P.pitch = lerp(P.pitch, 0, Math.min(1, 3 * dt)); P.fovPunch = Math.min(.09, (P.fovPunch || 0) + dt * .12); }
  else P.fovPunch = Math.max(0, (P.fovPunch || 0) - dt * .1);
}
function podPlatformHit(x, y, z, hw, h) {
  if (y + h <= SD || y >= SD + 1) return false;
  for (let i = 0; i < PODZ.length; i++) { if (RIDE.hide === i) continue; if (Math.abs(x - POD_X) < 1.5 + hw && Math.abs(z - PODZ[i]) < 1.5 + hw) return true; }
  return false;
}
function drawPodSolids(t) {
  for (let i = 0; i < PODZ.length; i++) {
    if (RIDE.hide === i) continue;
    pushBox(POD_X, SD + .5, PODZ[i], 2.98, 1, 2.98, .16, .2, .24, null, true, 0, TILE.PLATE);
    pushBox(POD_X, SD + 1.01, PODZ[i], 2.2, .02, 2.2, .1, .8 + .2 * Math.sin(t * 3 + i), 1, null, false, 0, TILE.GLOW);
  }
  if (RIDE.on) pushBox(P.x, P.y - .5, P.z, 2.98, 1, 2.98, .16, .2, .24, null, true, 0, TILE.PLATE);
}
function drawPodGlass(t) {                                                                           // glass cages: the one carrying you, and the idle hangar pod
  const cage = (x, y, z, closed) => {
    const w = 3.05, h = 4.2, c = [.3, .9, 1];
    for (const sz of [-1, 1]) pushBox(x, y + h / 2, z + sz * w / 2, w, h, .05, c[0], c[1], c[2], null, false);
    pushBox(x + w / 2, y + h / 2, z, .05, h, w, c[0], c[1], c[2], null, false);
    if (closed > .02) pushBox(x - w / 2, y + h * (1 - closed * .5), z, .05, h * closed, w, c[0], c[1], c[2], null, false);
    pushBox(x, y + h, z, w, .05, w, c[0], c[1], c[2], null, false);
  };
  if (RIDE.on) cage(P.x, P.y, P.z, RIDE.door);
  else if (camY < SD - 10) cage(HANGAR_RET.x, Y0 + 1, HANGAR_RET.z, 0);
  flushDynA(.16);
}
