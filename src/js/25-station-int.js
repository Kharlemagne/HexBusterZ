// ============================================================
//  THE HELICARRIER, INSIDE (generation 3 layout v4). The station is a sealed ship now; three halls, one after the other:
//    A  ARRIVAL & REVIVAL BAY (south):  you wake in a vat, the smith's stall, gantry ribs, a lit lane to the bridge
//    B  THE BRIDGE (middle):            teal command centre. A hexagonal holo console in the middle, server racks and cable runs on the west wall,
//                                        monitor banks, neon ceiling rings, neon floor paths and the big panoramic window on the east (planet, moon, hull)
//    C  THE HELLGATE CHAMBER (north):   dark industrial hall, orange neon, the burning ring-portal in the north wall, balconies with weapon racks,
//                                        hazard stripes, orange holo cubes and consoles; the Rift Stabilizer sits in the east bay
//  Props that move (crew robots, drone, wheeled robot, robot arms, holograms) are drawn live: see 55-station-props.js.
// ============================================================
const RM = { A: { x0: -36, x1: 36, z0: 44, z1: 112, h: 22 }, B: { x0: -40, x1: 40, z0: -42, z1: 40, h: 26 }, C: { x0: -54, x1: 54, z0: -113, z1: -46, h: 34 } };
const WIN = { x0: 41, x1: 43, y0: SD + 4, y1: SD + 22, z0: -30, z1: 30 };                      // the panoramic window: open air with an invisible wall (see boxHits)
const STN_GLASS = [WIN];
const GATE_C = { x: .5, y: SD + 10.5, z: -104.5, r: 9.6 };                                      // the burning portal: centre and clear radius (the voxel clamp ring sits around it)
const hexD = (dx, dz) => Math.max(Math.abs(dz), Math.abs(dx) * .8660254 + Math.abs(dz) * .5);
const dist2 = (x, z, cx, cz) => Math.hypot(x + .5 - cx, z + .5 - cz);
const IM = n => MID(n);
function stDisc(cx, cz, r0, r1, y, id) { for (let z = Math.floor(cz - r1) - 1; z <= cz + r1 + 1; z++) for (let x = Math.floor(cx - r1) - 1; x <= cx + r1 + 1; x++) { const d = dist2(x, z, cx, cz); if (d >= r0 && d < r1) stPut(x, y, z, id); } }
const inRoom = (R, x, z) => x >= R.x0 && x <= R.x1 && z >= R.z0 && z <= R.z1;
// a monitor bank on a wall: face = side the screens are on (0 +x, 1 -x, 2 +z, 3 -z); (x,y,z) = bottom-left, running along `axis` for w cells and up for h cells; blocks of 2x2 share one type
function stBank(x, y, z, axis, w, h, face, t0 = 0) {
  for (let i = -1; i <= w; i++) for (let j = -1; j <= h; j++) { const px = axis === 'x' ? x + i : x, pz = axis === 'x' ? z : z + i; const edge = i < 0 || i >= w || j < 0 || j >= h; if (edge) stPut(px, y + j, pz, (i + j) & 1 ? B.TECH : B.HULL); }
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) { const px = axis === 'x' ? x + i : x, pz = axis === 'x' ? z : z + i; stPut(px, y + j, pz, screenId((t0 + (i >> 1) + (j >> 1) * 2 + ((i >> 1) ^ (j >> 1))) & 3, face)); }
}
// ---------------- the shell: hull, floors, wall paint, doors
function stShell() {
  for (const k in RM) { const R = RM[k]; stBox(R.x0 - 3, SD - 6, R.z0 - 3, R.x1 + 3, SD + R.h + 2, R.z1 + 3, B.HULL); }
  for (const k in RM) { const R = RM[k]; stBox(R.x0, SD + 1, R.z0, R.x1, SD + R.h - 1, R.z1, 0); }
  for (const k in RM) {                                                                          // hull plating on the outside, the underside, the roof
    const R = RM[k], X0 = R.x0 - 3, X1 = R.x1 + 3, Z0 = R.z0 - 3, Z1 = R.z1 + 3, T = SD + R.h + 2;
    for (let z = Z0; z <= Z1; z++) for (let x = X0; x <= X1; x++) {
      stPut(x, SD - 6, z, ((x * 3 + z * 5) % 11 === 0) ? B.LAMP : (((x >> 2) + (z >> 2)) & 1 ? B.TECH : B.HULL));
      stPut(x, T, z, (x === X0 || x === X1 || z === Z0 || z === Z1) ? NEO('SKY') : ((x + z) % 9 === 0 ? B.TECH : (((x >> 3) + (z >> 3)) & 1 ? B.HULL : IM('GREEBLE PLATE'))));
    }
    for (let y = SD - 5; y < T; y++) for (const [x, z] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1]]) stPut(x, y, z, (y % 6 === 0) ? NEO('SKY') : B.CONC);
    for (let y = SD - 4; y < T; y += 6) { for (let x = X0; x <= X1; x++) { if ((x & 1) === 0) { stPut(x, y, Z0, NEO('SKY')); stPut(x, y, Z1, NEO('SKY')); } } for (let z = Z0; z <= Z1; z++) if ((z & 1) === 0) { stPut(X0, y, z, NEO('SKY')); stPut(X1, y, z, NEO('SKY')); } }
  }
}
// ---------------- A: arrival and revival bay
function stHallA() {
  const R = RM.A, T = IM('TECH TILE');
  for (let z = R.z0; z <= R.z1; z++) for (let x = R.x0; x <= R.x1; x++) {
    const ax = Math.abs(x + .5);
    let id = ((x + z) & 7) === 0 ? B.TECH : B.STREET;
    if (ax < 1.1 && z < 106) id = (z & 3) < 2 ? NEO('SKY') : B.HULL;                                // the lane to the bridge
    if ((ax > 12.5 && ax < 13.5) && z > 48 && z < 90) id = NEO('LIME');                              // lit edges of the vat row
    if (Math.abs(z - 41) < 1 && 0) id = B.HAZ;
    stPut(x, SD, z, id);
  }
  const sp = STN.spawn;                                                                              // the arrival pad
  for (let z = 92; z <= 112; z++) for (let x = -14; x <= 14; x++) { const d = dist2(x, z, sp.x, sp.z); if (d < 7.8 && d > 6.4) stPut(x, SD, z, NEO('SKY')); else if (d <= 6.4) stPut(x, SD, z, (Math.floor(d) % 2) ? B.TECH : T); else if (d < 9.6 && d >= 8.6) stPut(x, SD, z, (x + z) & 1 ? B.HAZ : B.HULL); }
  wallPaint(R, (u, ry, side) => ry <= 1 ? B.TECH : (ry === 3 || ry === R.h - 3) ? NEO('SKY') : (ry === 8 && (u & 3) < 2 ? NEO('LIME') : ((u % 12 === 0) ? B.HULL : (ry > 4 && ry < 13 && (u + 120) % 12 > 1 && (u + 120) % 12 < 11) ? IM('LAB PANEL') : B.TECH)));
  for (let z = 48; z <= 108; z += 12) {                                                              // gantry ribs: a cyan arch every 12 blocks
    for (const x of [R.x0, R.x1]) for (let y = SD + 1; y < SD + R.h; y++) { const ins = x < 0 ? 1 : -1; stPut(x, y, z, y % 4 === 0 ? NEO('SKY') : B.HULL); stPut(x + ins, y, z, (y > SD + 3 && y % 4 === 0) ? NEO('SKY') : B.HULL); }
    for (let x = R.x0; x <= R.x1; x++) { const y = SD + R.h - 1 - Math.round(Math.pow(Math.abs(x) / R.x1, 4) * 3); stPut(x, y, z, B.HULL); stPut(x, y - 1, z, (x & 3) === 0 ? B.LAMP : B.TECH); }
  }
  for (let z = 46; z <= 110; z += 6) for (let x = -30; x <= 30; x += 10) if (!(Math.abs(x) < 3)) stBox(x, SD + R.h - 1, z, x + 1, SD + R.h - 1, z, B.LAMP);       // ceiling lamps
  stBox(-1, SD + R.h - 1, 46, 1, SD + R.h - 1, 110, NEO('SKY'));                                  // the long ceiling light over the lane
  stBank(-6, SD + 15, R.z0, 'x', 12, 4, 2, 1);                                                     // a screen wall over the door to the bridge
  stRevivalBay();
  const X = -34, Z = 60, y = SD + 1;                                                                // VEX's stall
  stBox(X, y, Z, X + 9, y + 3, Z, B.HULL); stBox(X, y, Z, X, y + 3, Z + 6, B.OBS); stBox(X + 9, y, Z, X + 9, y + 3, Z + 6, B.OBS); stBox(X, y, Z + 6, X + 9, y, Z + 6, B.STEEL);
  for (let x = X - 1; x <= X + 10; x++) for (let z = Z - 1; z <= Z + 7; z++) stPut(x, y + 4, z, ((x + z) & 1) ? 7 : 5);
  stPut(X + 3, y, Z + 3, B.STEEL); stPut(X + 3, y + 1, Z + 3, B.STEEL); stPut(X + 7, y, Z + 3, 6); stPut(X + 7, y + 1, Z + 3, 6); stPut(X + 5, y + 3, Z + 6, NEO('MAGENTA'));
  stPut(X + 3, SD + 8, Z - 1, NEO('ORANGE')); stPut(X + 6, SD + 8, Z - 1, NEO('ORANGE'));
}
// a small lit word on a wall facing +z or -z ... drawn on the z plane; centred on x
function stSign3(text, cx, y, z, id) { const w = stTextW(text); stText(text, cx - (w >> 1), y, z, 'x', 1, id); }
function wallPaint(R, fn) {                                                                          // paint the first solid layer all round a room
  for (let y = SD + 1; y < SD + R.h; y++) {
    const ry = y - SD;
    for (let x = R.x0; x <= R.x1; x++) { stPut(x, y, R.z0 - 1, fn(x, ry, 'n')); stPut(x, y, R.z1 + 1, fn(x, ry, 's')); }
    for (let z = R.z0; z <= R.z1; z++) { stPut(R.x0 - 1, y, z, fn(z, ry, 'w')); stPut(R.x1 + 1, y, z, fn(z, ry, 'e')); }
  }
}
// ---------------- B: the bridge (v2, from Karl's concept art and block spec)
const HEX = { x: 0, z: 0 };
let STN_LEDS = [];                                                                             // [x,y,z] of server faces that get blinking lights drawn over them
const inwardFace = (dx, dz) => Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 1 : 0) : (dz > 0 ? 3 : 2);   // the monitor side that looks at the centre
function stHallB() {
  STN_LEDS = [];
  const R = RM.B, SK = NEO('TEAL'), T = IM('BRIDGE TRIM'), BP = IM('BRIDGE PLATE'), GF = IM('GRATED FLOOR'), WIRE = IM('CABLE BUNDLE'), LEDF = IM('SERVER LED'), AM = IM('AMBER LED');
  // ---- floor: big dark panels with trim seams, cyan square rings and lanes
  for (let z = R.z0; z <= R.z1; z++) for (let x = R.x0; x <= R.x1; x++) {
    const dx = x + .5, dz = z + .5, ax = Math.abs(dx), az = Math.abs(dz), ch = Math.max(ax, az);
    let id = ((x & 7) === 0 || (z & 7) === 0) ? T : (((x >> 3) + (z >> 3)) & 1 ? BP : IM('GREEBLE PLATE'));
    if (((x & 7) === 0 || (z & 7) === 0) && ((x * 7 + z * 3) % 5 === 0)) id = BP;
    if ((ch > 15.5 && ch < 16.5 && ax + az < 35) || (ch > 23.5 && ch < 24.5 && az < 30 && ax < 36)) id = SK;               // square rings of light
    if (ax < 1.1 && (z > 8 || z < -8) && !(ch > 15.5 && ch < 16.5)) id = (z & 3) < 3 ? SK : T;                           // the lane through both doors
    if (az < 1.1 && ax > 8 && ax < 30) id = (x & 3) < 3 ? SK : T;                                                        // the cross lane to the window
    if (ax > 36 && ax < 39) id = T;
    stPut(x, SD, z, id);
  }
  // ---- walls: charcoal plates, trim bands, vertical light strips every 10, black cable looms along the middle
  wallPaint(R, (u, ry, side) => {
    const m = (u + 100) % 10; if (ry <= 1) return T; if (ry === 5 || ry === R.h - 5) return T; if (ry === 4 || ry === R.h - 4) return SK;
    if (m === 0) return T; if (m === 5 && ry > 5 && ry < R.h - 5) return SK;
    if (ry >= 9 && ry <= 11 && m > 0 && m < 10 && side !== 'e') return WIRE;
    return (ry & 3) === 0 ? T : BP;
  });
  // ---- the ring console in the middle: an open hexagonal desk, operators inside, gaps north and south
  for (let z = -12; z <= 12; z++) for (let x = -12; x <= 12; x++) {
    const dx = x + .5, dz = z + .5, h = hexD(dx, dz), ax = Math.abs(dx);
    if (h < 5.9) { stPut(x, SD, z, h > 5.2 ? SK : (h < 2.0 ? NEO('WHITE') : GF)); }
    if (h >= 5.9 && h < 9.6) { stPut(x, SD, z, T); if (ax < 2.6 && h < 9.0) { stPut(x, SD, z, (z & 1) ? SK : T); continue; }          // (the gap you walk through)
      const f = inwardFace(-dx, -dz);
      stPut(x, SD + 1, z, T);
      if (h < 7.0) { stPut(x, SD + 2, z, SH(T, K.SLAB_B)); stPut(x, SD + 1, z, BP); }
      else if (h < 8.2) { stPut(x, SD + 2, z, h < 7.6 ? SH(T, K.STAIR, f === 0 ? 0 : f === 1 ? 1 : f === 2 ? 2 : 3) : BP); stPut(x, SD + 3, z, h < 7.6 ? 0 : SH(T, K.SLAB_B)); }
      else { stPut(x, SD + 2, z, BP); stPut(x, SD + 3, z, h > 9.0 ? SK : BP); }
      if (h >= 6.2 && h < 7.0 && ((x + z) & 3) === 0) stPut(x, SD + 3, z, screenId((x + z + 7) % 4, f)); }
  }
  for (let z = -3; z <= 3; z++) for (let x = -3; x <= 3; x++) { const h = hexD(x + .5, z + .5); if (h < 1.6) { stPut(x, SD + 1, z, T); stPut(x, SD + 2, z, h < 1.0 ? NEO('WHITE') : SK); } }      // the hologram projector pedestal
  // ---- ceiling: dark panels, nested squares of light, recessed light boxes
  const top = SD + R.h - 1;
  for (let z = R.z0; z <= R.z1; z++) for (let x = R.x0; x <= R.x1; x++) {
    const ax = Math.abs(x + .5), az = Math.abs(z + .5), ch = Math.max(ax, az * 1.15); let id = ((x & 3) === 0 || (z & 3) === 0) ? T : BP;
    for (const k of [7, 13, 19, 25, 31]) if (Math.abs(ch - k) < .6 && (k < 25 || ax < 36)) id = SK;
    if ((Math.abs(ax - 20) < 2 && Math.abs(az - 20) < 2) || (Math.abs(ax - 34) < 1.5 && az < 6)) id = SK;
    stPut(x, top, z, id);
    if (id === SK && ((x + z) & 1) === 0) stPut(x, top - 1, z, SH(T, K.SLAB_T));
  }
  for (let z = R.z0 + 2; z <= R.z1 - 2; z += 8) { stBox(R.x0, top - 1, z, R.x1, top - 1, z, SH(T, K.BEAMX)); }
  for (let x = R.x0 + 2; x <= R.x1 - 2; x += 10) { stBox(x, top - 2, R.z0, x, top - 2, R.z1, SH(WIRE, K.BEAMZ)); }                 // black cable trays across the ceiling
  // ---- west wall: server racks with LED faces, black wire looms down from the trays, a big wall screen in the gap
  for (let z = -36, n = 0; z <= 32; z += 8, n++) {
    if (n === 4) { stBank(R.x0 + 1, SD + 6, -6, 'z', 8, 6, 0, 1); continue; }
    for (let dz = 0; dz < 5; dz++) {
      const edge = dz === 0 || dz === 4;
      for (let y = SD + 1; y <= SD + 10; y++) { stPut(R.x0, y, z + dz, edge ? T : (y & 1 ? LEDF : IM('SERVER RACK'))); stPut(R.x0 + 1, y, z + dz, edge ? T : (y % 3 === 0 ? IM('SERVER RACK') : LEDF)); if (!edge && y % 3 !== 0) STN_LEDS.push([R.x0 + 2, y, z + dz]); }
    }
    stBox(R.x0, SD + 11, z, R.x0 + 1, SD + 11, z + 4, T);
    for (let c = 0; c < 3; c++) { const zz = z + 1 + c; for (let y = SD + 12; y < top - 1; y++) stPut(R.x0 + 1, y, zz, SH(WIRE, K.PILLAR)); }                      // looms going up
    for (let c = 0; c < 4; c++) for (let x = R.x0 + 2; x < R.x0 + 6 + c * 2; x++) stPut(x, SD + 1, z + c, SH(WIRE, K.SLAB_B));                          // and spilling over the floor
    if (n % 2 === 0) { stPut(R.x0 + 2, SD + 11, z + 2, AM); stPut(R.x0 + 2, SD + 11, z + 3, SK); }
  }
  // ---- north and south walls: desks with monitor banks above, operators face the wall
  for (const sx of [-1, 1]) for (const ox of [14, 28]) { stConsole(sx * ox, R.z1 - 4, 'n', SK, AM, 0, 3, (ox + sx) & 3); stConsole(sx * ox, R.z0 + 4, 's', SK, AM, 0, 3, (ox + 1) & 3); }
  for (const sx of [-1, 1]) for (const ox of [14, 28]) { stBank(sx * ox - 3, SD + 9, R.z1, 'x', 6, 5, 3, ox & 3); stBank(sx * ox - 3, SD + 9, R.z0, 'x', 6, 5, 2, (ox >> 1) & 3); }
  // ---- east side: window desks facing the glass, operators at their backs
  for (let z = -24; z <= 24; z += 12) stConsole(33, z, 'w', SK, AM, 0, 3, z === 0 ? 'quad' : (z / 12 + 2) & 3);
  for (const z of [-33, 33]) stConsole(33, z, 'w', SK, AM, 0, 2, 1);
  // ---- the window: a deep stepped frame round the opening
  stBox(WIN.x0, WIN.y0, WIN.z0, WIN.x1, WIN.y1, WIN.z1, 0);
  for (let z = WIN.z0; z <= WIN.z1; z += 10) stBox(WIN.x0, WIN.y0, z, WIN.x1, WIN.y1, z, z === WIN.z0 || z === WIN.z1 ? T : BP);
  for (let z = WIN.z0 - 2; z <= WIN.z1 + 2; z++) for (let k = 0; k < 3; k++) { stPut(WIN.x0 - 1 - (k === 2 ? 1 : 0), WIN.y0 - 1 - k, z, k === 1 ? SK : T); stPut(WIN.x0 - 1 - (k === 2 ? 1 : 0), WIN.y1 + 1 + k, z, k === 1 ? SK : T); }
  for (let y = WIN.y0 - 3; y <= WIN.y1 + 3; y++) for (const z of [WIN.z0 - 1, WIN.z1 + 1, WIN.z0 - 2, WIN.z1 + 2]) stPut(WIN.x0 - 1, y, z, (z === WIN.z0 - 1 || z === WIN.z1 + 1) ? SK : T);
  // ---- pillars in the corners
  for (const [x, z] of [[-38, -40], [38, -40], [-38, 38], [38, 38]]) for (let y = SD + 1; y < top; y++) stPut(x, y, z, y % 5 === 0 ? SK : T);
}
// ---------------- the doors between the halls
function stDoors() {
  for (const [z0, z1, w, h] of [[41, 43, 9, 12], [-45, -43, 9, 13]]) {
    stBox(-w, SD + 1, z0, w, SD + h, z1, 0);
    for (let z = z0; z <= z1; z++) { for (const x of [-w - 1, w + 1]) for (let y = SD + 1; y <= SD + h + 1; y++) stPut(x, y, z, y % 4 === 0 ? NEO('SKY') : B.HULL); for (let x = -w - 1; x <= w + 1; x++) stPut(x, SD + h + 1, z, (x & 1) ? B.TECH : B.HULL); }
    for (let x = -w; x <= w; x++) { stPut(x, SD + h, z1 + (z1 > 0 ? 0 : 0), (x & 3) === 0 ? B.LAMP : B.HULL); }
    for (let z = z0; z <= z1; z++) for (let x = -w; x <= w; x++) stPut(x, SD, z, (Math.abs(x) < 2) ? ((z & 1) ? NEO('SKY') : B.HULL) : B.TECH);
  }
}
// ---------------- C: the Hellgate chamber
function stGateRing() {
  const cx = GATE_C.x, cy = GATE_C.y;
  for (let z = -108; z <= -102; z++) for (let y = SD - 4; y <= SD + 33; y++) for (let x = -24; x <= 24; x++) {
    const dxc = x + .5 - cx, dyc = y + .5 - cy, r = Math.hypot(dxc, dyc), a = Math.atan2(dyc, dxc), front = z === -103 || z === -102, lay = z - -108;      // lay 0..6 from the back
    if (r < 9.6) continue;
    if (y <= SD) { if (r < 14) stPut(x, y, z, B.OBS); continue; }
    let id = 0;
    if (z >= -107 && z <= -103) {
      if (r < 10.6) id = (z === -105 || z === -104) ? NEO('ORANGE') : B.OBS;                           // the glowing inner lip
      else if (r < 12.6) id = front ? (((Math.floor((a + 7) * 12 / Math.PI)) & 1) ? B.HAZ : B.OBS) : (z === -107 ? B.TECH : B.OBS);
      else if (r < 13.7) id = (Math.round(a * 24 / Math.PI) % 2 === 0 && z >= -105 && z <= -104) ? NEO('ORANGE') : (front ? B.HULL : B.TECH);
    }
    if (!id && r >= 13.7 && r < 18.2 && z >= -106 && z <= -104) {                                      // 16 radial clamp arms
      const k = Math.round(a / (Math.PI / 8)), d = Math.abs(a - k * Math.PI / 8) * r;
      if (d < 1.25 - (r - 13.7) * .09) id = r > 17.2 ? NEO('ORANGE') : ((z === -105) ? B.TECH : B.HULL);
    }
    if (!id && r >= 13.7 && r < 14.5 && z === -106) id = B.HULL;
    if (id) stPut(x, y, z, id);
  }
  for (let z = -112; z <= -108; z++) for (let y = SD + 1; y < SD + 34; y++) for (let x = -24; x <= 24; x++) { const r = Math.hypot(x + .5 - cx, y + .5 - cy); if (r < 9.6) stPut(x, y, z, z === -112 ? 0 : 0); }
  // the back of the bay behind the swirl: a dark, ribbed wall
  for (let y = SD + 1; y <= SD + 21; y++) for (let x = -12; x <= 12; x++) { const r = Math.hypot(x + .5 - cx, y + .5 - cy); if (r < 9.6) stPut(x, y, -113, (r > 8.4) ? NEO('ORANGE') : B.OBS); }
}
function stHallC() {
  const R = RM.C, O = NEO('ORANGE'), HZ = B.HAZ, PL = IM('GREEBLE PLATE'), DP = IM('DIAMOND PLATE'), GR = IM('PERFORATED STEEL'), TR = IM('RED TRUSS');
  for (let z = R.z0; z <= R.z1; z++) for (let x = R.x0; x <= R.x1; x++) {
    const dx = x + .5, ax = Math.abs(dx);
    let id = ((x >> 2) + (z >> 2)) & 1 ? DP : PL;
    if (ax <= 3.2) id = GR;                                                                          // the grated path to the gate
    if (ax > 3.2 && ax < 4.3) id = (z & 3) < 2 ? O : B.OBS;                                         // orange guide lines
    const dg = dist2(x, z, GATE_C.x, GATE_C.z + .5 + 0); if (dg > 14 && dg < 15.2) id = O; if (dg > 17 && dg < 18) id = (x + z) & 1 ? HZ : B.OBS;
    if (z >= R.z1 - 1 || ax > R.x1 - 1.5) id = (x + z) & 1 ? HZ : B.OBS;                             // hazard borders at the edges
    stPut(x, SD, z, id);
  }
  for (let k = 0; k < 6; k++) for (const sx of [-1, 1]) { const z = -52 - k * 6; stPut(sx * 2, SD, z, O); stPut(sx * 2 + (sx > 0 ? -1 : 1), SD, z - 1, O); }   // chevrons on the grating
  wallPaint(R, (u, ry, side) => ry <= 2 ? ((u & 1) ? HZ : B.OBS) : (ry === 3 || ry === 20 || ry === R.h - 3) ? O : (ry === 12 ? B.PIPE : ((((u + 200) % 8) < 1) ? TR : (ry > 24 ? B.OBS : (((u + 200) >> 3) & 1 ? PL : B.OBS)))));
  stGateRing();
  // ---- ceiling: red trusses with orange lights, and big hanging lamps
  const top = SD + R.h - 1;
  for (let z = R.z0; z <= R.z1; z += 8) { stBox(R.x0, top, z, R.x1, top, z, TR); for (let x = R.x0 + 3; x <= R.x1 - 3; x += 6) { stPut(x, top - 1, z, O); stPut(x, top - 2, z, B.LAMP); } }
  for (let x = R.x0; x <= R.x1; x += 12) stBox(x, top - 1, R.z0, x, top - 1, R.z1, B.OBS);
  stBox(-1, top - 1, R.z0, 1, top - 1, R.z1, O);
  // ---- balconies on both sides with weapon racks, reached by stairs from the entrance end
  for (const sx of [-1, 1]) {
    const xa = sx < 0 ? -53 : 46, xb = sx < 0 ? -46 : 53, yb = SD + 10;
    for (let z = -92; z <= -62; z++) for (let x = xa; x <= xb; x++) stPut(x, yb, z, (x + z) & 1 ? GR : DP);
    for (let z = -92; z <= -62; z++) { stPut(sx < 0 ? xb : xa, yb + 1, z, 146); stPut(sx < 0 ? xb : xa, yb - 1, z, O); }
    for (let x = xa; x <= xb; x++) { stPut(x, yb + 1, -92, 146); stPut(x, yb + 1, -62, 146); }
    for (let z = -90; z <= -62; z += 7) { stBox(sx < 0 ? xb - 1 : xa, SD + 1, z, sx < 0 ? xb : xa + 1, yb - 1, z, B.HULL); stPut(sx < 0 ? xb - 1 : xa + 1, yb - 2, z, O); }
    for (let z = -90; z <= -64; z += 6) {                                                           // the weapon racks on the wall behind the balcony
      const wx = sx < 0 ? R.x0 : R.x1;
      stBox(wx, yb + 1, z, wx, yb + 5, z + 3, B.TECH); for (let j = 0; j < 4; j++) { stPut(wx - sx * 1 * -1 * 0 + (sx < 0 ? 1 : -1), yb + 2 + j, z, O); }
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const wy = yb + 2 + j; const px = sx < 0 ? wx + 1 : wx - 1; stPut(px, wy, z + i, (i === 0 || i === 3) ? B.TECH : ((i + j) & 1 ? B.CHROME : (j & 1 ? NEO('BLUE') : B.STEEL))); if (i > 0 && i < 3) stPut(sx < 0 ? wx + 2 : wx - 2, wy, z + i, (i + j) & 1 ? B.STEEL : B.CHROME); }
    }
    const sxx = sx < 0 ? -50 : 48;                                                                  // stairs: 20 half-steps up, from z -48 going north, solid underneath
    for (let i = 0; i < 20; i++) for (let w = 0; w < 3; w++) { const x = sxx + w, z = -48 - i, y0 = SD + 1 + (i >> 1); stPut(x, y0, z, (i & 1) ? B.HULL : SH(B.HULL, K.SLAB_B)); for (let y = SD + 1; y < y0; y++) stPut(x, y, z, B.HULL); if (w !== 1 && i % 4 === 0) stPut(x, y0 + 1, z, O); }
    for (let z = -68; z <= -48; z++) for (const x of [sxx - 1, sxx + 3]) { const yy = SD + 1 + Math.min(9, ((-48 - z) >> 1)); stPut(x, yy + 1, z, 146); }
    for (let z = -92; z <= -69; z++) { stPut(sx < 0 ? xb + 0 : xa, yb, z, NEO('ORANGE')); }
    for (let z = -92; z <= -69; z++) { stPut(sx < 0 ? xb : xa, yb, z, (z & 1) ? O : B.HULL); }
    for (let z = -69; z <= -62; z++) for (let x = xa; x <= xb; x++) stPut(x, yb, z, DP);
  }
  // ---- a skywalk across the front, over the path, to the ring (at SD+10)
  for (let x = -45; x <= 45; x++) for (let z = -97; z <= -95; z++) if (Math.abs(x + .5) > 18.5) stPut(x, SD + 10, z, (x + z) & 1 ? GR : DP);
  // ---- consoles with holo screens, orange containment cubes
  for (const sx of [-1, 1]) {
    stConsole(sx * 31, -72, sx < 0 ? 'e' : 'w', O, NEO('YELLOW'), 0, 3, 'quad'); stConsole(sx * 31, -86, sx < 0 ? 'e' : 'w', O, NEO('CYAN'), 0, 3, 1);
    for (const [cx, cz] of [[sx * 14, -62], [sx * 24, -100]]) {
      stBox(cx - 3, SD + 1, cz - 3, cx + 3, SD + 1, cz + 3, B.OBS); stRing(cx - 3, SD + 1, cz - 3, cx + 3, SD + 1, cz + 3, HZ); stBox(cx - 2, SD + 2, cz - 2, cx + 2, SD + 2, cz + 2, B.HULL); stRing(cx - 2, SD + 2, cz - 2, cx + 2, SD + 2, cz + 2, O);
      for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) { for (let y = 3; y <= 11; y++) stPut(cx + dx, SD + y, cz + dz, y % 4 === 0 ? O : B.OBS); }
      stBox(cx - 2, SD + 12, cz - 2, cx + 2, SD + 12, cz + 2, B.HULL); stRing(cx - 2, SD + 12, cz - 2, cx + 2, SD + 12, cz + 2, O); stPut(cx, SD + 13, cz, B.LAMP);
    }
  }
  // ---- small warning signs: a hazard triangle with a mark, on the back wall and beside the entrance
  for (const [sx0, sz0, ax] of [[-30, -112, 'x'], [-22, -112, 'x'], [22, -112, 'x'], [30, -112, 'x'], [-34, -112, 'x'], [34, -112, 'x']]) {
    for (let r = 0; r < 7; r++) for (let c = -r; c <= r; c++) { const edge = r === 6 || Math.abs(c) === r; stPut(sx0 + c, SD + 12 + (6 - r), sz0, edge ? NEO('YELLOW') : B.OBS); }
    stPut(sx0, SD + 14, sz0, NEO('YELLOW')); stPut(sx0, SD + 15, sz0, NEO('YELLOW')); stPut(sx0, SD + 17, sz0, NEO('YELLOW'));
  }
  // ---- pillars with orange strips, pipes along the back wall
  for (const x of [-50, -40, 40, 50]) for (let z of [-50, -108]) for (let y = SD + 1; y < SD + R.h - 1; y++) stPut(x, y, z, y % 4 === 0 ? O : B.OBS);
}
// ---------------- the Rift Stabilizer bay (east of the gate)
function stRiftBay() {
  const O = NEO('ORANGE');
  for (let z = -112; z <= -92; z++) for (let x = 16; x <= 50; x++) { const dr = Math.hypot(x + .5 - RIFT.x, z + .5 - RIFT.z); if (dr > 12 && dr < 13.2) stPut(x, SD, z, NEO('SKY')); if (dr < 4.5 && dr > 3.8) stPut(x, SD, z, NEO('SKY')); }
  stBox(RIFT.x - 3.5, SD + 1, RIFT.z - 1, RIFT.x + 3.5, SD + 1, RIFT.z + 1, B.OBS);
  for (const c of RIFT.coils) {
    const cx = Math.floor(c[0]), cz = Math.floor(c[2]);
    stBox(cx - 2, SD + 1, cz - 2, cx + 2, SD + 2, cz + 2, B.HULL); for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) stPut(cx + dx, SD + 2, cz + dz, NEO('SKY'));
    for (let y = SD + 3; y <= SD + 15; y++) { stBox(cx - 1, y, cz - 1, cx + 1, y, cz + 1, (y % 3 === 0) ? NEO('SKY') : B.TECH); if (y % 3 === 0) stRing(cx - 2, y, cz - 2, cx + 2, y, cz + 2, SH(B.HULL, K.SLAB_B)); }
    stBox(cx - 1, SD + 16, cz - 1, cx + 1, SD + 18, cz + 1, NEO('WHITE')); stBox(cx, SD + 19, cz, cx, SD + 25, cz, B.HULL);
  }
  stConsole(Math.floor(RIFT.console.x), Math.floor(RIFT.console.z), 'w', NEO('SKY'), NEO('LIME'), 0, 3, 'quad');
}
// ---------------- the hull outside the bridge window: a wing, masts and a docking spar, all seen from the panoramic window
function stExterior() {
  const SK = NEO('SKY');
  stBox(46, SD - 8, -26, 104, SD - 4, 26, B.HULL);
  for (let x = 46; x <= 104; x++) for (let z = -26; z <= 26; z++) { stPut(x, SD - 3, z, ((x >> 2) + (z >> 2)) & 1 ? B.TECH : IM('GREEBLE PLATE')); if (x % 8 === 0 && z % 8 === 0) stBox(x, SD - 2, z, x, SD, z, B.LAMP); if (z === -26 || z === 26 || x === 104) stPut(x, SD - 3, z, SK); }
  for (const [mx, mz, h] of [[58, -18, 30], [74, 18, 38], [92, -10, 26], [66, 4, 20]]) { for (let y = SD - 3; y < SD + h; y++) stPut(mx, y, mz, y % 5 === 0 ? SK : B.TECH); stBox(mx - 1, SD + h, mz - 1, mx + 1, SD + h + 1, mz + 1, B.LAMP); for (let k = 3; k < h - 4; k += 7) stBox(mx - 3, SD + k, mz, mx + 3, SD + k, mz, B.HULL); }
  for (let y = SD - 3; y < SD + 12; y++) for (let a = 0; a < 16; a++) { const t = a / 16 * TAU; stPut(Math.round(84 + Math.cos(t) * 6), y, Math.round(-12 + Math.sin(t) * 6), y % 4 === 0 ? SK : B.TECH); }          // a reactor drum
  stDisc(84, -12, 0, 6, SD + 12, B.HULL); stDisc(84, -12, 0, 3, SD + 13, NEO('ORANGE'));
}
function stBuildAll() { ST = new Uint16Array(GW * GD * (GY1 - GY0)); stShell(); stHallA(); stHallB(); stHallC(); stRiftBay(); stDoors(); stExterior(); }
// ---------------- the console, rebuilt from console blocks: a front lip, a keyboard WEDGE (real 45 degree ramp with its own collision), a trackpad slate,
// a sloping riser into a bank of monitors, and winged sides with a wedge cap. face = the side the operator stands on.
function stConsole(cx, cz, face, accent, screenCol, yb = 0, W = 3, stype = 0) {
  CON_Y = yb; CON_W = W;
  const T = (u, v) => face === 's' ? [cx + u, cz + v] : face === 'n' ? [cx - u, cz - v] : face === 'e' ? [cx + v, cz - u] : [cx - v, cz + u];
  const back = face === 's' ? 3 : face === 'n' ? 2 : face === 'e' ? 1 : 0;                       // the wedge rises away from the operator
  const P = (u, v, y, id) => { const [x, z] = T(u, v); stPut(x, SD + yb + y, z, id); };
  const BODY = IM('CONSOLE BODY'), KEYS = IM('CONSOLE KEYS'), SLT = IM('CONSOLE SLATE'), WK = wedgeId(KEYS, back), WB = wedgeId(BODY, back);
  const sf = face === 's' ? 2 : face === 'n' ? 3 : face === 'e' ? 0 : 1;
  for (let u = -W; u <= W; u++) {
    const alt = (u + W) & 1;
    P(u, 2, 1, SH(BODY, K.SLAB_B));                                                                // the front lip
    P(u, 1, 1, BODY); P(u, 1, 2, WK);                                                              // the keyboard ramp
    P(u, 0, 1, BODY); P(u, 0, 2, alt ? SLT : KEYS);                                                // slate and keys, flush with the top of the ramp
    P(u, -1, 1, BODY); P(u, -1, 2, BODY); P(u, -1, 3, WB);                                         // the riser
    for (let y = 1; y <= 3; y++) P(u, -2, y, BODY);
    for (let h = 0; h < 4; h++) {
      if (stype === 'quad') { const q = (u === 0 || u === 1) && (h === 1 || h === 2); P(u, -2, 4 + h, q ? screenId(h === 1 ? u : 2 + u, sf) : BODY); }
      else P(u, -2, 4 + h, (Math.abs(u) === W && W > 1) || h === 0 ? BODY : screenId(stype, sf));
    }
    P(u, -2, 8, WB);                                                                               // a sloped cap over the monitors
  }
  for (const u of [-W - 1, W + 1]) for (let v = -2; v <= 1; v++) { P(u, v, 1, BODY); P(u, v, 2, v === 0 ? accent : BODY); P(u, v, 3, v >= -1 ? WB : BODY); }
  P(-W, 1, 2, accent); P(W, 1, 2, accent);
}
