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
let CON_Y = 0, CON_W = 3;
function stConsole(cx, cz, face, accent, screenCol, yb = 0, W = 3, stype = 0) {
  CON_Y = yb; CON_W = W;
  const T = (u, v) => face === 's' ? [cx + u, cz + v] : face === 'n' ? [cx - u, cz - v] : face === 'e' ? [cx + v, cz - u] : [cx - v, cz + u];      // u across, v towards the player
  const back = face === 's' ? 3 : face === 'n' ? 2 : face === 'e' ? 1 : 0;                       // the stair direction that rises away from the player
  const P = (u, v, y, id) => { const [x, z] = T(u, v); stPut(x, SD + CON_Y + y, z, id); };
  for (let u = -CON_W; u <= CON_W; u++) {
    P(u, 2, 1, SH(B.HULL, K.SLAB_B)); P(u, 2, 0, 0);                                              // the front lip
    P(u, 1, 1, SH(B.TECH, K.STAIR, back));                                                         // sloped keyboard deck
    P(u, 0, 1, B.HULL); P(u, 0, 2, Math.abs(u) === CON_W ? B.HULL : ((u + CON_W) % 2 ? SH(accent, K.SLAB_B) : SH(B.LAMP, K.SLAB_B)));   // key rows
    P(u, -1, 1, B.HULL); P(u, -1, 2, B.TECH); P(u, -1, 3, SH(B.HULL, K.STAIR, back));              // the body, rising to the screen
    P(u, -2, 1, B.HULL); P(u, -2, 2, B.HULL);
  }
  for (const u of [-CON_W - 1, CON_W + 1]) for (let v = -2; v <= 1; v++) { P(u, v, 1, B.HULL); P(u, v, 2, v === -1 ? accent : B.TECH); P(u, v, 3, SH(B.HULL, K.SLAB_B)); }       // side wings with a status light each
  const sf = face === 's' ? 2 : face === 'n' ? 3 : face === 'e' ? 0 : 1;                           // the screen faces the operator
  for (let u = -CON_W; u <= CON_W; u++) for (let h = 0; h < 4; h++) {
    if (stype === 'quad') { const q = (u === 0 || u === 1) && (h === 1 || h === 2); P(u, -2, 3 + h, q ? screenId(h === 1 ? u : 2 + u, sf) : B.TECH); }          // one of each monitor, 2x2: alpha beta / gamma delta (they never merge, they are different)
    else P(u, -2, 3 + h, (Math.abs(u) === CON_W && CON_W > 1) || h === 0 ? B.TECH : screenId(stype, sf));
  }
  P(-CON_W, 0, 2, accent); P(CON_W, 0, 2, accent);
}
// ---- the command dais: three tiers (slab step + full step each), a holo-table, a ring of consoles facing inward toward it, four tapering pylons
function stDais() {
  const cx = DAIS.x, cz = DAIS.z, TILE = MID('TECH TILE');
  for (let z = cz - 20; z <= cz + 20; z++) for (let x = cx - 20; x <= cx + 20; x++) {
    const px = x + .5 - cx, pz = z + .5 - cz, ax = Math.abs(px), az = Math.abs(pz), o = Math.max(ax, az, (ax + az) / 1.41421);
    if (z < 2 && Math.abs(x) > 4) continue; if (o > 17.5) continue;
    if (o > 16.2) { stPut(x, SD, z, ((x + z) & 3) ? B.HULL : NEO('SKY')); continue; }               // the landing ring: one cyan strip in four
    if (o > 15) { stPut(x, SD + 1, z, SH(B.HULL, K.SLAB_B)); continue; }                              // step 1 (half block)
    if (o > 11) { stPut(x, SD + 1, z, o > 14.2 ? NEO('SKY') : B.HULL); stPut(x, SD, z, TILE); continue; }   // tier 1 surface = SD+2 (a lit rim, then dark tiles)
    if (o > 9.8) { stPut(x, SD + 1, z, B.HULL); stPut(x, SD + 2, z, SH(B.HULL, K.SLAB_B)); continue; }  // step 2
    if (o > 6.6) { stPut(x, SD + 1, z, B.HULL); stPut(x, SD + 2, z, o > 9 ? NEO('ORANGE') : TILE); continue; }   // tier 2: surface SD+3
    if (o > 5.4) { stPut(x, SD + 1, z, B.HULL); stPut(x, SD + 2, z, B.HULL); stPut(x, SD + 3, z, SH(B.HULL, K.SLAB_B)); continue; }  // step 3
    stPut(x, SD + 1, z, B.HULL); stPut(x, SD + 2, z, B.HULL); stPut(x, SD + 3, z, o > 4.6 ? NEO('SKY') : B.HULL);                 // tier 3: the holo-table disc
  }
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (Math.abs(dx) + Math.abs(dz) <= 3) stPut(cx + dx, SD + 4, cz + dz, SH(B.TECH, K.SLAB_B));
  stBox(cx - 1, SD + 4, cz - 1, cx + 1, SD + 4, cz + 1, NEO('WHITE'));                                           // the projector
  const H0 = SD + 6;                                                                                              // the hologram: sparse rings and nodes, never a solid
  for (const [r, y, id] of [[3, 0, NEO('SKY')], [2, 2, NEO('SKY')], [3, 4, NEO('SKY')], [1, 6, NEO('WHITE')]]) for (let a = 0; a < 24; a++) { const t = a / 24 * TAU; if ((a + y) % 3 === 2) continue; stPut(Math.round(cx + Math.cos(t) * r), H0 + y, Math.round(cz + Math.sin(t) * r), SH(id, K.PANE)); }
  for (const [dx, dy, dz] of [[0, 3, 0], [2, 1, 1], [-2, 4, -1], [1, 5, -2], [-1, 2, 2]]) stPut(cx + dx, H0 + dy, cz + dz, NEO('WHITE'));
  for (let y = 1; y <= 3; y++) stPut(cx, SD + 4 + y, cz, SH(NEO('SKY'), K.PILLAR));
  // consoles stand on tier 2 (surface SD+3) with their SCREENS toward the table, operators on the outside
  for (const [dx, dz, f] of [[0, -8, 'n'], [0, 8, 's'], [-8, 0, 'w'], [8, 0, 'e']]) stConsole(cx + dx, cz + dz, f, NEO('SKY'), NEO('LIME'), 2, 3, (dx + dz + 16) % 8 / 2 | 0);
  for (const [dx, dz, f] of [[-6, -6, 'n'], [6, -6, 'n'], [-6, 6, 's'], [6, 6, 's']]) stConsole(cx + dx, cz + dz, f, NEO('ORANGE'), NEO('YELLOW'), 2, 1, (dx > 0 ? 1 : 0) + (dz > 0 ? 2 : 0));
  // four pylons on the diagonals: a 3x3 foot, a plus-shaped waist, a 1x1 needle, one lit strip facing the table
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const px = cx + sx * 21, pz = cz + sz * 21; if (pz < 4) continue;
    for (let y = 1; y <= 24; y++) {
      const col = (y % 6 === 0) ? B.TECH : B.HULL;
      if (y <= 10) stBox(px - 1, SD + y, pz - 1, px + 1, SD + y, pz + 1, col);
      else if (y <= 18) { stBox(px - 1, SD + y, pz, px + 1, SD + y, pz, col); stBox(px, SD + y, pz - 1, px, SD + y, pz + 1, col); }
      else stPut(px, SD + y, pz, col);
      if (y > 2 && y < 22) stPut(px - sx * (y <= 10 ? 2 : y <= 18 ? 2 : 1), SD + y, pz - sz * 0, y % 2 ? NEO('SKY') : B.HULL);
    }
    stBox(px - 1, SD + 25, pz - 1, px + 1, SD + 26, pz + 1, B.LAMP); stPut(px, SD + 27, pz, NEO('SKY'));
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
function stBay(cx, cz, name, accent, screen, kind) {
  for (let k = -1; k <= 1; k++) stConsole(cx + k * 10, cz, 'n', accent, screen, 0, 3, kind === 'crates' ? 2 : 0);
  if (kind === 'crates') for (const dx of [-14, -9, 9, 14]) for (let l = 0; l < 2; l++) { stBox(cx + dx - 1, SD + 1 + l * 2, cz - 12, cx + dx, SD + 2 + l * 2, cz - 11, MID('CARGO CRATE')); stPut(cx + dx - 1, SD + 3 + l * 2, cz - 12, B.NBLU); }
  if (kind === 'lab') for (let u = -15; u <= 15; u++) { if (Math.abs(u) < 3 || (u & 1)) continue; stBox(cx + u, SD + 1, cz + 2 - 12, cx + u, SD + 4, cz + 2 - 12, MID('LAB PANEL')); }
  for (let u = -16; u <= 16; u++) { stPut(cx + u, SD + 9, cz + 2, (u & 1) ? B.TECH : B.HULL); if (Math.abs(u) === 16 || Math.abs(u) === 6) for (let y = 1; y <= 8; y++) stPut(cx + u, SD + y, cz + 3, B.HULL); }
  for (let u = -16; u <= 16; u += 4) stPut(cx + u, SD + 10, cz + 2, accent);
}
// ---- the dock: arches over the arrival ring, lamp posts down the promenade, VEX's stall
function stDock() {
  const sp = STN.spawn; for (let z = 94; z <= 112; z++) for (let x = -14; x <= 14; x++) if (stGet(x, SD, z)) { const d = Math.hypot(x - sp.x + .5, z - sp.z + .5); if (d < 7.8 && d > 6.2) stPut(x, SD, z, NEO('SKY')); else if (d <= 6.2) stPut(x, SD, z, (Math.floor(d) % 2) ? B.TECH : B.STREET); }
  for (const zc of [88, 74]) for (const sx of [-1, 1]) {                                                    // two gantry arches
    const x = sx * 10; for (let y = 1; y <= 12; y++) stBox(x - 1, SD + y, zc, x + 1, SD + y, zc + 1, y % 4 === 0 ? NEO('SKY') : B.HULL);
  }
  for (const zc of [88, 74]) { stBox(-10, SD + 12, zc, 10, SD + 13, zc + 1, B.HULL); for (let x = -9; x <= 9; x += 2) stPut(x, SD + 11, zc, B.LAMP); }
  for (let x = -8; x <= 8; x += 4) stPut(x, SD + 14, 88, NEO('SKY'));
  for (let z = 50; z <= 100; z += 10) for (const x of [-11, 11]) { stBox(x, SD + 1, z, x, SD + 6, z, B.HULL); stPut(x, SD + 7, z, B.LAMP); stPut(x + (x > 0 ? -1 : 1), SD + 7, z, SH(B.HULL, K.SLAB_B)); }
  // VEX's stall beside the promenade
  const X = -34, Z = 60, y = SD + 1;
  stBox(X, y, Z, X + 9, y + 3, Z, B.HULL); stBox(X, y, Z, X, y + 3, Z + 6, B.OBS); stBox(X + 9, y, Z, X + 9, y + 3, Z + 6, B.OBS); stBox(X, y, Z + 6, X + 9, y, Z + 6, B.STEEL);
  for (let x = X - 1; x <= X + 10; x++) for (let z = Z - 1; z <= Z + 7; z++) stPut(x, y + 4, z, ((x + z) & 1) ? 7 : 5);
  stPut(X + 3, y, Z + 3, B.STEEL); stPut(X + 3, y + 1, Z + 3, B.STEEL); stPut(X + 7, y, Z + 3, 6); stPut(X + 7, y + 1, Z + 3, 6); stPut(X + 5, y + 3, Z + 6, NEO('MAGENTA'));
  stPut(X + 3, SD + 8, Z - 1, NEO('ORANGE')); stPut(X + 6, SD + 8, Z - 1, NEO('ORANGE'));
  stRevivalBay();
}
// ---- the catwalk to the gate: arches of light every 16 blocks, neon rails on both sides, and a truss underneath
function stCatwalk() {
  for (let z = CAT.z0; z >= CAT.z1; z--) {
    for (const x of [-CAT.hw, CAT.hw]) { stPut(x, SD + 1, z, 144 + (z & 1)); if (z % 4 === 0) { stPut(x, SD + 2, z, B.LAMP); stPut(x, SD, z, NEO('SKY')); } }      // neon rails with a lamp every 4 blocks
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
  for (let k = 0; k < 5; k++) for (const sx of [-1, 1]) { const z = -90 - k * 2; stPut(sx * (3 - (k & 1)), SD, z, NEO('ORANGE')); stPut(sx * (4 - (k & 1)), SD, z, NEO('ORANGE')); }      // chevrons on the floor pointing at the gate
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
  stConsole(Math.floor(RIFT.console.x), Math.floor(RIFT.console.z), 'w', NEO('SKY'), NEO('LIME'), 0, 3, 'quad');
}
function stPerimeter() {
  for (const sx of [-1, 1]) for (const z of [30, 70]) stScreenWall(sx * 52, z, sx > 0 ? 'w' : 'e', 16, 7, [NEO('LIME'), NEO('CYAN'), NEO('ORANGE')]);
  stBay(-45, 46, 'OPS', NEO('ORANGE'), NEO('YELLOW'), 'lab'); stBay(45, 46, 'ENGINEERING', NEO('LIME'), NEO('CYAN'), 'crates');
}
function stBuildAll() {
  ST = new Uint16Array(GW * GD * (GY1 - GY0));
  stHullAndDeck(); stDock(); stDais(); stPerimeter(); stCatwalk(); stGatePlatform();
}

// ============================================================
//  THE REVIVAL BAY: respawn vats. Eight tanks along the promenade, four a side, open towards the walkway. Whoever dies is regrown in one (see Vat in 55-vat.js).
// ============================================================
const VATS = (() => { const v = []; for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) v.push({ x: sx * 17, z: 54 + k * 9, face: -sx }); return v; })();    // face = which way the open front points (+1 east, -1 west)
function stVat(V) {
  const cx = V.x, cz = V.z, f = V.face;
  for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {                                    // the pad: hazard ring, grating inside
    const m = Math.max(Math.abs(dx), Math.abs(dz)); if (m === 3) stPut(cx + dx, SD, cz + dz, ((dx + dz) & 1) ? B.HAZ : B.HULL); else stPut(cx + dx, SD, cz + dz, m <= 1 ? MID('VAT PURPLE') : MID('PERFORATED STEEL'));
  }
  for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) for (let y = 1; y <= 9; y++) stPut(cx + dx, SD + y, cz + dz, y % 4 === 0 ? NEO('SKY') : B.HULL);       // four corner posts
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { stPut(cx + dx, SD + 10, cz + dz, ((dx + dz) & 1) ? MID('LAB PANEL') : B.HULL); }       // the cap with a lamp ring
  stBox(cx - 1, SD + 11, cz - 1, cx + 1, SD + 11, cz + 1, B.HULL); stPut(cx, SD + 11, cz, B.LAMP); stBox(cx, SD + 12, cz, cx, SD + 15, cz, B.PIPE);
  stPut(cx + f * 3, SD + 8, cz, NEO('MAGENTA')); stPut(cx + f * 3, SD + 7, cz, B.HULL);                      // the status light over the door
    for (const dz of [-3, 3]) stBox(cx + f * 3, SD + 1, cz + dz, cx + f * 3, SD + 3, cz + dz, B.HULL);        // door posts
  stBox(cx + f * 3, SD + 4, cz - 3, cx + f * 3, SD + 4, cz + 3, B.HULL);
}
function stRevivalBay() { for (const V of VATS) stVat(V); for (const sx of [-1, 1]) for (let z = 50; z <= 90; z += 4) stPut(sx * 13, SD, z, NEO('LIME')); }
