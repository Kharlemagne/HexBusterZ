// ============================================================
//  THE INTERDIMENSIONAL COMMAND CENTER (generation 3 layout, v2). No city: an open octagonal command deck on a hull flying through the deep.
//    south  : the DOCK (you arrive here), two gantry arches, VEX the smith's stall beside the promenade
//    middle : the COMMAND DAIS, a stepped octagon with a ring of consoles around a glowing holo-table, four tall pylons, screen walls and
//             OPS / ENGINEERING bays on both sides
//    north  : a long neon CATWALK across open space (the hull is cut away either side) to the GATE PLATFORM: the HELLGATE in the middle and,
//             beside it, the RIFT STABILIZER: a tear in the dimension held between two Tesla coils, with its navigation console in front.
// ============================================================
const MID = name => { const i = MATS.findIndex(m => m.name === name); return i < 0 ? B.HULL : MAT0 + i; };      // a material by name
const NEO = n => MID('NEON ' + n), CC = n => MID(n + ' CONCRETE'), SH = (b, k, d = 0) => blockId(b, k, d);
const DAIS = { x: 0, z: 22 }, CAT = { z0: 4, z1: -97, hw: 3 };
const RIFT = { x: 30.5, y: SD + 7, z: -100.5, coils: [[23.5, SD + 17.5, -100.5], [37.5, SD + 17.5, -100.5]], console: { x: 44.5, z: -98.5 }, arrive: { x: 30.5, z: -91.5 }, gate: { x1: 28, x2: 33, z: -100, y1: SD + 1, y2: SD + 10 } };
const inCut = (x, z) => z < -2 && z > -96 && Math.abs(x) > CAT.hw + 1;                       // the open space either side of the catwalk
// ---- hull and deck
function stHullAndDeck() {
  for (let z = GZ0; z < GZ1; z++) for (let x = GX0; x < GX1; x++) {
    const o = stOct(x, z); if (o > STN.R + .5) continue;
    const cut = inCut(x, z), keel = !cut && z < -2 && z > -96;
    for (let y = 44; y < SD; y++) {
      if (cut) continue;
      const k = (SD - 1 - y) / (SD - 44), Ry = STN.R * (1 - k * .5); if (!keel && o > Ry) continue; if (keel && y < 62) continue;
      const rim = !keel && o > Ry - 1.5; let id = B.HULL;
      if (rim) id = (y % 8 === 0) ? NEO('SKY') : (((x + z + y) % 14) === 0 ? B.LAMP : ((x * 5 + z * 3 + y) % 9 === 0 ? B.TECH : B.HULL));
      else if (keel) id = (y % 6 === 0 && Math.abs(x) === 3) ? NEO('SKY') : ((z & 7) === 0 ? B.TECH : B.HULL);
      else if (y === 44) id = ((x + z) % 6 === 0) ? B.NBLU : B.TECH;
      stPut(x, y, z, id);
    }
    if (cut) continue;
    // the deck: dark plates, a ring pattern around the dais, bright guide lines
    const d = Math.hypot(x - DAIS.x, (z - DAIS.z) * 1.0), ax = Math.abs(x);
    let dk = ((x + z) & 7) === 0 ? B.TECH : B.STREET;
    const ring = Math.round(d); if (d < 46 && (ring === 20 || ring === 32 || ring === 44)) dk = ring === 32 ? NEO('ORANGE') : B.HULL;
    if (ax <= 1 && z > 40 && z < 90) dk = (z & 3) < 2 ? NEO('SKY') : B.HULL;                        // the promenade from the dock to the dais
    if (!keel && z > 40 && z < 90 && (ax === 9 || ax === 10)) dk = B.HULL;
    if (keel) dk = ax === 3 ? NEO('SKY') : (ax <= 1 ? ((z & 3) < 2 ? NEO('SKY') : MID('DIAMOND PLATE')) : MID('DIAMOND PLATE'));
    stPut(x, SD, z, dk);
    if (o > STN.R - 2.2 && !keel) {                                                                  // the perimeter wall: plates, a cyan light strip, a cap
      stPut(x, SD + 1, z, B.HULL); stPut(x, SD + 2, z, B.HULL); stPut(x, SD + 3, z, NEO('SKY')); stPut(x, SD + 4, z, B.HULL); stPut(x, SD + 5, z, SH(B.CONC, K.SLAB_B));
      if (o > STN.R - 1.2 && (x + z) % 12 === 0) { stBox(x, SD + 6, z, x, SD + 9, z, B.HULL); stPut(x, SD + 10, z, B.LAMP); }
    }
  }
}
// ---- a console: a real workstation. face = the direction its player stands in ('s','n','e','w'); accent = neon material for the lights
function stConsole(cx, cz, face, accent, screenCol) {
  const T = (u, v) => face === 's' ? [cx + u, cz + v] : face === 'n' ? [cx - u, cz - v] : face === 'e' ? [cx + v, cz - u] : [cx - v, cz + u];      // u across, v towards the player
  const back = face === 's' ? 3 : face === 'n' ? 2 : face === 'e' ? 1 : 0;                       // the stair direction that rises away from the player
  const P = (u, v, y, id) => { const [x, z] = T(u, v); stPut(x, SD + y, z, id); };
  for (let u = -3; u <= 3; u++) {
    P(u, 2, 1, SH(B.HULL, K.SLAB_B)); P(u, 2, 0, 0);                                              // the front lip
    P(u, 1, 1, SH(B.TECH, K.STAIR, back));                                                         // sloped keyboard deck
    P(u, 0, 1, B.HULL); P(u, 0, 2, Math.abs(u) === 3 ? B.HULL : ((u + 3) % 2 ? SH(accent, K.SLAB_B) : SH(B.LAMP, K.SLAB_B)));   // key rows
    P(u, -1, 1, B.HULL); P(u, -1, 2, B.TECH); P(u, -1, 3, SH(B.HULL, K.STAIR, back));              // the body, rising to the screen
    P(u, -2, 1, B.HULL); P(u, -2, 2, B.HULL);
  }
  for (const u of [-4, 4]) for (let v = -2; v <= 1; v++) { P(u, v, 1, B.HULL); P(u, v, 2, v === -1 ? accent : B.TECH); P(u, v, 3, SH(B.HULL, K.SLAB_B)); }       // side wings with a status light each
  for (let u = -3; u <= 3; u++) for (let h = 0; h < 4; h++) {                                      // the screen: a frame, dark glass and rows of "text"
    const edge = Math.abs(u) === 3 || h === 3 || h === 0; const lit = !edge && (((u * 5 + h * 3 + cx + cz) & 7) < 4 + h);
    P(u, -2, 3 + h, edge ? B.TECH : (lit ? (h === 2 ? screenCol : accent) : B.OBS));
  }
  P(-3, 0, 2, accent); P(3, 0, 2, accent);
}
// ---- the command dais: three steps up, a holo-table, a ring of consoles
function stDais() {
  const cx = DAIS.x, cz = DAIS.z;
  for (let z = cz - 20; z <= cz + 20; z++) for (let x = cx - 20; x <= cx + 20; x++) {
    const px = x + .5 - cx, pz = z + .5 - cz, ax = Math.abs(px), az = Math.abs(pz), o = Math.max(ax, az, (ax + az) / 1.41421);
    if (o > 18.5 || (z < 2 && Math.abs(x) > 4)) continue;
    if (o > 16.5) { stPut(x, SD + 1, z, o > 17.5 ? NEO('SKY') : SH(B.HULL, K.SLAB_B)); continue; }
    if (o > 13.5) { stPut(x, SD + 1, z, ((x + z) & 1) ? B.HULL : B.TECH); continue; }
    stPut(x, SD + 1, z, B.HULL); stPut(x, SD + 2, z, o > 12.5 ? NEO('ORANGE') : SH(B.TECH, K.SLAB_B));
    if (o < 5.5) stPut(x, SD + 2, z, o > 4.5 ? B.HULL : B.OBS);
  }
  for (let y = 3; y <= 4; y++) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) stPut(cx + dx, SD + y, cz + dz, y === 4 ? NEO('SKY') : B.HULL);       // the holo-table plinth and a column of light above it
  for (let y = 5; y <= 13; y++) { stPut(cx, SD + y, cz, SH(NEO('SKY'), K.PILLAR)); if (y % 3 === 0) { stPut(cx - 1, SD + y, cz, SH(NEO('SKY'), K.PANE)); stPut(cx + 1, SD + y, cz, SH(NEO('SKY'), K.PANE)); } }
  for (const [dx, dz, f] of [[0, -9, 's'], [0, 9, 'n'], [-9, 0, 'e'], [9, 0, 'w']]) stConsole(cx + dx, cz + dz, f, NEO('SKY'), NEO('LIME'));
  for (const [dx, dz, f] of [[-7, -7, 's'], [7, -7, 's'], [-7, 7, 'n'], [7, 7, 'n']]) stConsole(cx + dx, cz + dz, f, NEO('ORANGE'), NEO('YELLOW'));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {                                                     // four tall pylons at the corners
    const px = cx + sx * 16, pz = cz + sz * 16;
    for (let y = 1; y <= 26; y++) { stBox(px - 1, SD + y, pz - 1, px + 1, SD + y, pz + 1, (y % 6 === 0) ? NEO('SKY') : (y % 3 === 0 ? B.TECH : B.HULL)); }
    stBox(px - 1, SD + 27, pz - 1, px + 1, SD + 28, pz + 1, B.LAMP); stBox(px, SD + 29, pz, px, SD + 36, pz, B.HULL); stPut(px, SD + 37, pz, NEO('ORANGE'));
  }
}
// ---- a wall screen on two posts: a frame, dark glass and bars of data in a few colours
function stScreenWall(x, z, face, w, h, cols) {
  const along = face === 'e' || face === 'w' ? 'z' : 'x', P = (u, y, id) => { if (along === 'x') stPut(x + u, SD + y, z, id); else stPut(x, SD + y, z + u, id); };
  const half = w >> 1;
  for (const u of [-half + 1, half - 1]) for (let y = 1; y <= 5; y++) P(u, y, B.HULL);
  for (let u = -half; u <= half; u++) for (let y = 0; y < h; y++) {
    const edge = u === -half || u === half || y === 0 || y === h - 1; const q = ((u + 60) * 7 + y * 13 + x * 3 + z) & 15;
    P(u, 5 + y, edge ? B.TECH : (q < 4 ? cols[q % cols.length] : (q < 6 ? B.NBLU : B.OBS)));
  }
}
// ---- a bay of three console desks facing north under a neon canopy, with a lit name board
function stBay(cx, cz, name, accent, screen) {
  for (let k = -1; k <= 1; k++) stConsole(cx + k * 10, cz, 'n', accent, screen);
  for (let u = -16; u <= 16; u++) { stPut(cx + u, SD + 9, cz + 2, (u & 1) ? B.TECH : B.HULL); if (Math.abs(u) === 16 || Math.abs(u) === 6) for (let y = 1; y <= 8; y++) stPut(cx + u, SD + y, cz + 3, B.HULL); }
  const w = stTextW(name) + 4; stBoardH(name, cx - (w >> 1), SD + 12, cz + 2, 'x', 1, accent, B.NORA);
}
// ---- the dock: arches over the arrival ring, lamp posts down the promenade, VEX's stall
function stDock() {
  const sp = STN.spawn; for (let z = 94; z <= 112; z++) for (let x = -14; x <= 14; x++) if (stGet(x, SD, z)) { const d = Math.hypot(x - sp.x + .5, z - sp.z + .5); if (d < 7.8 && d > 6.2) stPut(x, SD, z, NEO('SKY')); else if (d <= 6.2) stPut(x, SD, z, (Math.floor(d) % 2) ? B.TECH : B.STREET); }
  for (const zc of [88, 74]) for (const sx of [-1, 1]) {                                                    // two gantry arches
    const x = sx * 10; for (let y = 1; y <= 12; y++) stBox(x - 1, SD + y, zc, x + 1, SD + y, zc + 1, y % 4 === 0 ? NEO('SKY') : B.HULL);
  }
  for (const zc of [88, 74]) { stBox(-10, SD + 12, zc, 10, SD + 13, zc + 1, B.HULL); for (let x = -9; x <= 9; x += 2) stPut(x, SD + 11, zc, B.LAMP); }
  stText('DOCK', -11, SD + 16, 88, 'x', 1, NEO('SKY'), 1);
  for (let z = 50; z <= 100; z += 10) for (const x of [-11, 11]) { stBox(x, SD + 1, z, x, SD + 6, z, B.HULL); stPut(x, SD + 7, z, B.LAMP); stPut(x + (x > 0 ? -1 : 1), SD + 7, z, SH(B.HULL, K.SLAB_B)); }
  // VEX's stall beside the promenade
  const X = -34, Z = 60, y = SD + 1;
  stBox(X, y, Z, X + 9, y + 3, Z, B.HULL); stBox(X, y, Z, X, y + 3, Z + 6, B.OBS); stBox(X + 9, y, Z, X + 9, y + 3, Z + 6, B.OBS); stBox(X, y, Z + 6, X + 9, y, Z + 6, B.STEEL);
  for (let x = X - 1; x <= X + 10; x++) for (let z = Z - 1; z <= Z + 7; z++) stPut(x, y + 4, z, ((x + z) & 1) ? 7 : 5);
  stPut(X + 3, y, Z + 3, B.STEEL); stPut(X + 3, y + 1, Z + 3, B.STEEL); stPut(X + 7, y, Z + 3, 6); stPut(X + 7, y + 1, Z + 3, 6); stPut(X + 5, y + 3, Z + 6, NEO('MAGENTA'));
  stText('VEX', X + 3, SD + 8, Z - 1, 'x', 1, NEO('ORANGE'), 1);
}
// ---- the catwalk to the gate: arches of light every 16 blocks, neon rails on both sides, and a truss underneath
function stCatwalk() {
  for (let z = CAT.z0; z >= CAT.z1; z--) {
    for (const x of [-CAT.hw, CAT.hw]) stPut(x, SD + 1, z, 144 + (z & 1));                                  // neon rails (cyan / magenta)
    if (z % 8 === 0) { for (let x = -CAT.hw - 1; x <= CAT.hw + 1; x++) stPut(x, SD - 1, z, B.TECH); }
  }
  for (let z = -12; z >= -90; z -= 16) {
    for (const sx of [-1, 1]) { for (let y = 1; y <= 9; y++) stPut(sx * 4, SD + y, z, y % 3 === 0 ? NEO('SKY') : B.HULL); }
    for (let x = -4; x <= 4; x++) { stPut(x, SD + 10, z, B.HULL); stPut(x, SD + 9, z, (x & 1) ? B.LAMP : B.TECH); }
  }
}
// ---- the gate platform: the Hellgate in the middle, the Rift Stabilizer to its side
function stGatePlatform() {
  buildGate(stPut, STN.gate);
  stText('HELLGATE', -20, SD + 16, -92, 'x', 1, NEO('ORANGE'), 1);
  for (let z = -112; z <= -96; z++) for (let x = -50; x <= 50; x++) if (stGet(x, SD, z)) {                           // floor rings around the gate and the stabilizer
    const dg = Math.hypot(x - STN.gate.x, z - STN.gate.z), dr = Math.hypot(x - RIFT.x, z - RIFT.z);
    if (dg > 11 && dg < 12.2) stPut(x, SD, z, NEO('ORANGE')); if (dr > 12 && dr < 13.2) stPut(x, SD, z, NEO('SKY')); if (dr < 4.5 && dr > 3.8) stPut(x, SD, z, NEO('SKY'));
  }
  // the stabilizer: a dark plinth under the tear, two Tesla coils, and the console in front
  stBox(RIFT.x - 3.5, SD + 1, RIFT.z - 1, RIFT.x + 3.5, SD + 1, RIFT.z + 1, B.OBS);
  for (const c of RIFT.coils) {
    const cx = Math.floor(c[0]), cz = Math.floor(c[2]);
    stBox(cx - 2, SD + 1, cz - 2, cx + 2, SD + 2, cz + 2, B.HULL); for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) stPut(cx + dx, SD + 2, cz + dz, NEO('SKY'));
    for (let y = SD + 3; y <= SD + 15; y++) { stBox(cx - 1, y, cz - 1, cx + 1, y, cz + 1, (y % 3 === 0) ? NEO('SKY') : B.TECH); if (y % 3 === 0) stRing(cx - 2, y, cz - 2, cx + 2, y, cz + 2, SH(B.HULL, K.SLAB_B)); }
    stBox(cx - 1, SD + 16, cz - 1, cx + 1, SD + 18, cz + 1, NEO('WHITE')); stBox(cx, SD + 19, cz, cx, SD + 21, cz, B.HULL);
  }
  stConsole(Math.floor(RIFT.console.x), Math.floor(RIFT.console.z), 'w', NEO('SKY'), NEO('LIME'));
  stBoardH('RIFT', Math.floor(RIFT.x) - 11, SD + 15, Math.floor(RIFT.z) - 5, 'x', 1, NEO('SKY'), B.NORA);
}
function stPerimeter() {
  for (const sx of [-1, 1]) for (const z of [30, 70]) stScreenWall(sx * 52, z, sx > 0 ? 'w' : 'e', 16, 7, [NEO('LIME'), NEO('CYAN'), NEO('ORANGE')]);
  stBay(-45, 46, 'OPS', NEO('ORANGE'), NEO('YELLOW')); stBay(45, 46, 'ENGINEERING', NEO('LIME'), NEO('CYAN'));
}
function stBuildAll() {
  ST = new Uint16Array(GW * GD * (GY1 - GY0));
  stHullAndDeck(); stDock(); stDais(); stPerimeter(); stCatwalk(); stGatePlatform();
}
