// ============================================================
//  GENERATION 3 — THE HELICARRIER as its own map: an interdimensional space station hurtling through the deep, with a dense neon megacity on top.
//  The station is identical in every world (nothing about it depends on the seed). It is painted once into a dense voxel grid
//  (octagonal hull, deck, lots, towers, rails, signs...) and every chunk just copies its slice. Everything outside the hull is empty space:
//  step off and the void takes you. See docs/WORLD.md.
//   x = east/west, z = south(+)/north(-). Spawn at the south dock, the Hellgate at the north front, the smith by the core plaza.
// ============================================================
const SD = 80;                                                                  // deck level (the street surface block)
const STN = { R: 96, zf: .87, gate: { x: 0, z: -104, y: SD, seed: 0x57A710 }, spawn: { x: .5, z: 103.5 }, npc: { x: -.5, z: 17.5 }, RY: SD + 14, core: { x: 0, z: 0 } };
const GX0 = -112, GX1 = 112, GZ0 = -124, GZ1 = 124, GY0 = 34, GY1 = 158, GW = GX1 - GX0, GD = GZ1 - GZ0;
const stOct = (x, z) => { const q = Math.abs(z) * STN.zf, a = Math.abs(x); return Math.max(a, q, (a + q) / 1.41421); };
const onStation = (x, z) => stOct(x, z) <= STN.R + .5;
let ST = null;
const stPut = (x, y, z, id) => { if (x < GX0 || x >= GX1 || z < GZ0 || z >= GZ1 || y < GY0 || y >= GY1) return; ST[((y - GY0) * GD + (z - GZ0)) * GW + (x - GX0)] = id; };
const stGet = (x, y, z) => (x < GX0 || x >= GX1 || z < GZ0 || z >= GZ1 || y < GY0 || y >= GY1) ? 0 : ST[((y - GY0) * GD + (z - GZ0)) * GW + (x - GX0)];
const stBox = (x1, y1, z1, x2, y2, z2, id) => { for (let y = y1; y <= y2; y++) for (let z = z1; z <= z2; z++) for (let x = x1; x <= x2; x++) stPut(x, y, z, id); };
const stRing = (x1, y1, z1, x2, y2, z2, id) => { for (let y = y1; y <= y2; y++) for (let z = z1; z <= z2; z++) for (let x = x1; x <= x2; x++) if (x === x1 || x === x2 || z === z1 || z === z2) stPut(x, y, z, id); };
const stH = (x, y, z, s) => { let h = (Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1274126177) ^ Math.imul(s | 0, 2246822519)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const stRng = seed => { let a = seed | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
// block ids
const B = { HULL: 32, CONC: 33, DBRICK: 34, RBRICK: 35, TECH: 36, STREET: 37, WAMB: 38, WWHT: 39, LAMP: 40, NORA: 41, NBLU: 42, NGRN: 43, HAZ: 44, TEAL: 45, GOLD: 46, PIPE: 47, NCYA: 14, NMAG: 15, OBS: 3, CHROME: 18, STEEL: 8 };
const slabB = b => b + 16, slabT = b => b + 32;                                   // bottom / top half block made from base block b
// ---- 5x5 pixel font for the signs
const FONT = (() => {
  const s = { A: '.###./#...#/#####/#...#/#...#', B: '####./#...#/####./#...#/####.', C: '.####/#..../#..../#..../.####', D: '####./#...#/#...#/#...#/####.', E: '#####/#..../####./#..../#####', F: '#####/#..../####./#..../#....', G: '.####/#..../#..##/#...#/.###.', H: '#...#/#...#/#####/#...#/#...#', I: '#####/..#../..#../..#../#####', J: '..###/...#./...#./#..#./.##..', K: '#...#/#..#./###../#..#./#...#', L: '#..../#..../#..../#..../#####', M: '#...#/##.##/#.#.#/#...#/#...#', N: '#...#/##..#/#.#.#/#..##/#...#', O: '.###./#...#/#...#/#...#/.###.', P: '####./#...#/####./#..../#....', Q: '.###./#...#/#.#.#/#..#./.##.#', R: '####./#...#/####./#..#./#...#', S: '.####/#..../.###./....#/####.', T: '#####/..#../..#../..#../..#..', U: '#...#/#...#/#...#/#...#/.###.', V: '#...#/#...#/#...#/.#.#./..#..', W: '#...#/#...#/#.#.#/##.##/#...#', X: '#...#/.#.#./..#../.#.#./#...#', Y: '#...#/.#.#./..#../..#../..#..', Z: '#####/...#./..#../.#.../#####',
    0: '.###./#..##/#.#.#/##..#/.###.', 1: '..#../.##../..#../..#../.###.', 2: '.###./#...#/..##./.#.../#####', 3: '####./....#/.###./....#/####.', 4: '#..#./#..#./#####/...#./...#.', 5: '#####/#..../####./....#/####.', 6: '.###./#..../####./#...#/.###.', 7: '#####/...#./..#../.#.../.#...', 8: '.###./#...#/.###./#...#/.###.', 9: '.###./#...#/.####/....#/.###.', '-': '...../...../#####/...../.....', '+': '..#../..#../#####/..#../..#..' };
  const g = {}; for (const k in s) g[k] = s[k].split('/'); return g;
})();
// horizontal text on a wall: the wall runs along `axis` ('x' or 'z'), letters grow in direction dir (+1/-1); (x,y,z) = bottom-left pixel
function stText(text, x, y, z, axis, dir, id, gap = 1) {
  let o = 0;
  for (const ch of text) { const gl = FONT[ch]; if (gl) { for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (gl[r][c] === '#') { const a = o + c; if (axis === 'x') stPut(x + dir * a, y + 4 - r, z, id); else stPut(x, y + 4 - r, z + dir * a, id); } } o += 5 + gap; }
  return o - gap;
}
const stTextW = (t, gap = 1) => t.length * (5 + gap) - gap;
// letters stacked on top of each other (reads top to bottom), like the BITJACK sign
function stTextV(text, x, yTop, z, axis, dir, id) {
  let y = yTop; for (const ch of text) { const gl = FONT[ch]; if (gl) for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (gl[r][c] === '#') { if (axis === 'x') stPut(x + dir * c, y - r, z, id); else stPut(x, y - r, z + dir * c, id); } y -= 6; }
}
// a lit sign board: dark backing, a frame of bulbs, then the letters
function stBoardH(text, x, y, z, axis, dir, fg, frame) {
  const w = stTextW(text) + 4, h = 9;
  for (let i = -1; i <= w; i++) for (let j = -1; j <= h - 1; j++) { const edge = i < 0 || i >= w || j < 0 || j >= h - 1 + 0; const px = axis === 'x' ? x + dir * i : x, pz = axis === 'x' ? z : z + dir * i; stPut(px, y + j, pz, (i === -1 || i === w || j === -1 || j === h - 1) ? ((i + j) & 1 ? frame : B.TECH) : B.TECH); }
  stText(text, axis === 'x' ? x + dir * 2 : x, y + 2, axis === 'x' ? z : z + dir * 2, axis, dir, fg);
}
function stBoardV(text, x, yTop, z, axis, dir, fg, frame) {
  const h = text.length * 6 + 3, w = 9;
  for (let i = -1; i <= w; i++) for (let j = 0; j <= h; j++) { const px = axis === 'x' ? x + dir * i : x, pz = axis === 'x' ? z : z + dir * i; stPut(px, yTop - j + 1, pz, (i === -1 || i === w || j === 0 || j === h) ? ((i + j) & 1 ? frame : B.TECH) : B.TECH); }
  stTextV(text, axis === 'x' ? x + dir * 2 : x, yTop - 2, axis === 'x' ? z : z + dir * 2, axis, dir, fg);
}
// stairs of half blocks: step i is a half block (even) or a full block (odd), so every step is half a block higher; (x,z) first step, (dx,dz) direction, y = cell of the first step
function stStairs(x, y, z, dx, dz, len, width, base = B.HULL) {
  const px = -dz, pz = dx;                                                      // sideways
  for (let i = 0; i < len; i++) for (let w = 0; w < width; w++) stPut(x + dx * i + px * w, y + (i >> 1), z + dz * i + pz * w, (i & 1) ? base : slabB(base));
}
// zig-zag outside stairs: flights of 8 steps (4 blocks up) with landings, running along z (axis 'z', start (x,z), lanes spread in x) or along x (axis 'x', lanes spread in z). d = +1/-1 direction of the first flight
function stZig(x, y, z, axis, d, flights, width = 2) {
  const put = (lane, along, cy, id) => { if (axis === 'z') stPut(x + lane, cy, along, id); else stPut(along, cy, z + lane, id); };
  const o = axis === 'z' ? z : x; let cy = y;
  for (let k = 0; k < flights; k++) {
    const up = (k & 1) === 0, s0 = up ? o : o + 9 * d, dd = up ? d : -d;
    for (let i = 0; i < 8; i++) for (let w = 0; w < width; w++) put(w, s0 + dd * i, cy + (i >> 1), (i & 1) ? B.HULL : slabB(B.HULL));
    for (const a of (up ? [o + 8 * d, o + 9 * d] : [o + d, o])) for (let w = 0; w < width; w++) put(w, a, cy + 3, B.HULL);
    cy += 4;
  }
}

// ---- generic hollow tower: walls with window pattern, a floor every `fl` blocks, roof
function stTower(x1, z1, x2, z2, y0, y1, o) {
  const fl = o.fl || 4, S = o.seed || 1;
  for (let y = y0 + 1; y <= y1; y++) {
    const rel = y - y0, floor = rel % fl === 0 || y === y1, wy = rel % fl;
    for (let z = z1; z <= z2; z++) for (let x = x1; x <= x2; x++) {
      const ex = x === x1 || x === x2, ez = z === z1 || z === z2, wall = ex || ez, corner = ex && ez;
      if (!wall && !floor) continue;
      let id;
      if (floor) id = y === y1 ? (o.roof || B.CONC) : (o.floorId || B.CONC);
      else if (corner) id = o.corner || o.wall;
      else if (o.band && rel % (o.bandEvery || 8) === 0) id = o.band;
      else if (o.win && (o.mode === 'strip' ? (wy >= 1 && wy <= 2) : ((wy === 1 || wy === 2) && ((x + z + (o.mode === 'grid' ? 0 : wy)) & 1) === 0))) {
        const q = stH(x, y, z, S); id = q < (o.lit || .6) ? o.win[0] : q < (o.lit || .6) + .15 ? (o.win[1] || o.win[0]) : B.TECH;
      } else id = (o.wall2 && ((x + y) & 7) === 0) ? o.wall2 : o.wall;
      stPut(x, y, z, id);
    }
  }
}
function stRoof(x1, z1, x2, z2, y, r) {                                          // parapet, AC boxes, a water tank, an antenna
  for (let x = x1; x <= x2; x++) for (let z = z1; z <= z2; z++) if (x === x1 || x === x2 || z === z1 || z === z2) stPut(x, y + 1, z, slabB(B.CONC));
  const w = x2 - x1, d = z2 - z1; if (w < 6 || d < 6) return;
  const nb = 1 + ((r() * 3) | 0); for (let i = 0; i < nb; i++) { const bx = x1 + 2 + ((r() * (w - 6)) | 0), bz = z1 + 2 + ((r() * (d - 5)) | 0); stBox(bx, y + 1, bz, bx + 2, y + 2, bz + 1, B.HULL); stPut(bx + 1, y + 3, bz, B.NORA); stPut(bx, y + 2, bz + 1, B.LAMP); }
  if (r() < .6) { const tx = x1 + 3 + ((r() * (w - 6)) | 0), tz = z1 + 3 + ((r() * (d - 6)) | 0); for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dz * dz <= 5) { stBox(tx + dx, y + 1, tz + dz, tx + dx, y + 4, tz + dz, B.PIPE); stPut(tx + dx, y + 5, tz + dz, slabB(B.HULL)); } }
  if (r() < .7) { const ax = x1 + 1 + ((r() * (w - 1)) | 0), az = z1 + 1 + ((r() * (d - 1)) | 0); stBox(ax, y + 1, az, ax, y + 8 + ((r() * 8) | 0), az, B.HULL); stPut(ax, y + 17, az, B.NORA); }
}
function stDoor(L, side, y0) {                                                   // a 3x3 doorway in the middle of a wall (side = 'n','s','e','w')
  const mx = (L.x1 + L.x2) >> 1, mz = (L.z1 + L.z2) >> 1;
  for (let k = -1; k <= 1; k++) for (let h = 1; h <= 3; h++) { if (side === 'n') stPut(mx + k, y0 + h, L.z1, 0); else if (side === 's') stPut(mx + k, y0 + h, L.z2, 0); else if (side === 'w') stPut(L.x1, y0 + h, mz + k, 0); else stPut(L.x2, y0 + h, mz + k, 0); }
}
// the Rift Navigation Hall: a console, a tear in the dimension between two Tesla coils (animated in 55-rift.js), a door onto the main avenue
const RIFT = { x: 22.5, y: SD + 7, z: 18.5, coils: [[22.5, SD + 17.5, 12.5], [22.5, SD + 17.5, 24.5]], console: { x: 16.5, z: 18.5 }, arrive: { x: 14.5, z: 18.5 } };
function stCoil(cx, cz) {
  stBox(cx - 2, SD + 1, cz - 2, cx + 2, SD + 2, cz + 2, B.HULL); for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) stPut(cx + dx, SD + 2, cz + dz, B.NORA);
  for (let y = SD + 3; y <= SD + 15; y++) { stBox(cx - 1, y, cz - 1, cx + 1, y, cz + 1, (y % 3 === 0) ? B.NORA : B.TECH); if (y % 3 === 0) { stRing(cx - 2, y, cz - 2, cx + 2, y, cz + 2, slabB(B.HULL)); } }
  stBox(cx - 1, SD + 16, cz - 1, cx + 1, SD + 18, cz + 1, B.NCYA); stBox(cx, SD + 19, cz, cx, SD + 20, cz, B.HULL);
}
function stRiftHall() {
  const x1 = 10, x2 = 28, z1 = 9, z2 = 27, H = 22, rx = 22, rz = 18;
  stTower(x1, z1, x2, z2, SD, SD + H, { fl: 60, wall: B.TECH, wall2: B.HULL, corner: B.HULL, win: [B.NBLU, B.NMAG], lit: .55, seed: 77, mode: 'strip', band: B.NCYA, bandEvery: 11, roof: B.HULL });
  for (let z = z1 + 1; z < z2; z++) for (let x = x1 + 1; x < x2; x++) {                                    // the floor: cyan rings around the rift, a lamp grid in the ceiling
    const d = Math.hypot(x - rx, z - rz); stPut(x, SD, z, (d > 3.2 && d < 4.4) ? B.NCYA : (d > 6 && d < 6.7) ? B.NORA : ((x + z) & 1 ? B.TECH : B.HULL)); if ((x + z) % 4 === 0) stPut(x, SD + H, z, B.LAMP);
  }
  for (let z = 15; z <= 21; z++) for (let y = SD + 1; y <= SD + 6; y++) stPut(x1, y, z, 0);               // the door
  for (let z = 14; z <= 22; z++) stPut(x1, SD + 7, z, B.NORA); for (const z of [14, 22]) stBox(x1, SD + 1, z, x1, SD + 6, z, B.NORA);
  stText('NAV', x1, SD + 10, 15, 'z', 1, B.NCYA, 1);
  stBoardV('RIFT', x1 + 1, SD + 31, z1 - 1, 'x', 1, B.NMAG, B.NCYA);
  stCoil(rx, 12); stCoil(rx, 24);
  const cx = 16;                                                                                           // the console: a base, a sloped keyboard (stairs), a screen
  stBox(cx, SD + 1, 17, cx + 1, SD + 1, 19, B.HULL); stBox(cx + 1, SD + 2, 17, cx + 1, SD + 2, 19, B.TECH);
  for (let z = 17; z <= 19; z++) { stPut(cx, SD + 2, z, 80); stPut(cx + 1, SD + 3, z, B.NBLU); stPut(cx + 1, SD + 4, z, B.NBLU); }
  stPut(cx, SD + 3, 18, slabB(B.NGRN)); stPut(cx, SD + 3, 17, slabB(B.NORA)); stPut(cx, SD + 3, 19, B.NMAG);
  for (const z of [10, 26]) stBox(x1 + 1, SD + 1, z, x1 + 1, SD + 3, z, B.NCYA);
}
const NAMES = ['NEON GRAVE', 'BITJACK', 'VOID CAFE', 'RIFT ROAD', 'HEXBUSTER', 'MALLWARE', 'CLOUD LOOP', 'DEAD DROP', 'CHROME BAR', 'GHOST SHELL', 'ASH 24', 'FLESH LAB', 'NULL POINT', 'GATE 9'];
// ---- building styles ----
function bApt(L, r, side) {                                                      // pale concrete block, warm windows, balconies, outside stairs
  const h = 14 + ((r() * 5) | 0) * 4, S = (L.x1 * 31 + L.z1) | 0, y0 = SD;
  const o = { fl: 4, wall: B.CONC, wall2: B.DBRICK, corner: B.CONC, win: [B.WAMB, B.WWHT], lit: .62, seed: S, band: B.DBRICK, bandEvery: 8, mode: 'checker' };
  stTower(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0, y0 + h, o); stRoof(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0 + h, r);
  if (h >= 22) { const sx1 = L.x1 + 4, sz1 = L.z1 + 4, sx2 = L.x2 - 4, sz2 = L.z2 - 4; stTower(sx1, sz1, sx2, sz2, y0 + h, y0 + h + 12, o); stRoof(sx1, sz1, sx2, sz2, y0 + h + 12, r); }
  stDoor(L, side, y0);
  for (let y = y0 + 5; y < y0 + h; y += 8) for (let i = L.x1 + 3; i <= L.x2 - 3; i++) if (i % 4 !== 0) {                    // balconies on the street side
    const j = L.z1 + (i - L.x1);
    if (side === 'w') { stPut(L.x1 - 1, y, j, slabB(B.CONC)); stPut(L.x1 - 2, y, j, slabB(B.CONC)); } else if (side === 'e') { stPut(L.x2 + 1, y, j, slabB(B.CONC)); stPut(L.x2 + 2, y, j, slabB(B.CONC)); }
    else if (side === 'n') { stPut(i, y, L.z1 - 1, slabB(B.CONC)); stPut(i, y, L.z1 - 2, slabB(B.CONC)); } else { stPut(i, y, L.z2 + 1, slabB(B.CONC)); stPut(i, y, L.z2 + 2, slabB(B.CONC)); }
  }
  const fl = Math.min(4, h >> 2);
  if (side === 'e' || side === 'w') stZig(side === 'w' ? L.x2 + 1 : L.x1 - 2, y0 + 1, L.z1 + 2, 'z', 1, fl, 2); else stZig(L.x1 + 2, y0 + 1, side === 'n' ? L.z2 + 1 : L.z1 - 2, 'x', 1, fl, 2);
  const nx = (r() < .5) ? L.x1 + 1 : L.x2 - 1; stBox(nx, y0 + 3, L.z1 + 1, nx, y0 + h - 2, L.z1 + 1, r() < .5 ? B.NBLU : B.NORA);
}
function bMega(L, r, side) {                                                     // dark megablock: tech-wall slabs with cantilevered boxes, lamp-panel undersides, hanging pods
  const h = 24 + ((r() * 6) | 0) * 4, y0 = SD, S = (L.x2 * 17 + L.z2) | 0, tr = [B.NCYA, B.NMAG, B.NORA, B.NBLU][(r() * 4) | 0];
  const o = { fl: 4, wall: B.TECH, wall2: B.HULL, corner: B.HULL, win: [B.WWHT, B.WAMB], lit: .35, seed: S, band: tr, bandEvery: 12, mode: 'strip', floorId: B.HULL, roof: B.HULL };
  stTower(L.x1 + 2, L.z1 + 2, L.x2 - 2, L.z2 - 2, y0, y0 + h, o); stRoof(L.x1 + 2, L.z1 + 2, L.x2 - 2, L.z2 - 2, y0 + h, r);
  for (const cx of [L.x1 + 2, L.x2 - 2]) for (const cz of [L.z1 + 2, L.z2 - 2]) stBox(cx, y0 + 1, cz, cx, y0 + h - 1, cz, tr);                   // neon corner lines
  stDoor({ x1: L.x1 + 2, x2: L.x2 - 2, z1: L.z1 + 2, z2: L.z2 - 2 }, side, y0);
  for (let k = 0; k < 2; k++) {                                                  // cantilevered boxes toward the street, lit from underneath
    const oy = y0 + 8 + k * 12 + ((r() * 3) | 0) * 4, len = 4 + ((r() * 3) | 0);
    let bx1 = L.x1 + 2, bx2 = L.x2 - 2, bz1 = L.z1 + 2, bz2 = L.z2 - 2;
    if (side === 'w') { bx1 -= len; bx2 = L.x1 + 6; } else if (side === 'e') { bx2 += len; bx1 = L.x2 - 6; } else if (side === 'n') { bz1 -= len; bz2 = L.z1 + 6; } else { bz2 += len; bz1 = L.z2 - 6; }
    if (side === 'w' || side === 'e') { bz1 += 2; bz2 -= 2; } else { bx1 += 2; bx2 -= 2; }
    stTower(bx1, bz1, bx2, bz2, oy, oy + 8, Object.assign({}, o, { fl: 4, mode: 'grid', lit: .5, wall: B.HULL, corner: B.HULL, floorId: B.HULL, roof: B.HULL, band: 0 }));
    for (let x = bx1; x <= bx2; x++) for (let z = bz1; z <= bz2; z++) if (((x + z) & 1) === 0 && stGet(x, oy, z) === B.HULL) stPut(x, oy, z, B.LAMP);       // the white lamp panels under the overhang
    for (const q of [[bx1, bz1], [bx2, bz2]]) { stBox(q[0], oy - 4, q[1], q[0], oy - 1, q[1], B.PIPE); stBox(q[0] - 1, oy - 7, q[1] - 1, q[0] + 1, oy - 5, q[1] + 1, r() < .5 ? B.GOLD : B.HAZ); stPut(q[0], oy - 8, q[1], B.NORA); }
  }
}
function bBrick(L, r, side) {                                                    // brick low-rise with shop awnings and a big neon sign
  const h = 10 + ((r() * 3) | 0) * 4, y0 = SD, S = (L.x1 * 13 + L.z2) | 0;
  stTower(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0, y0 + h, { fl: 5, wall: B.DBRICK, wall2: B.RBRICK, corner: B.HULL, win: [B.WAMB], lit: .7, seed: S, band: B.RBRICK, bandEvery: 5, mode: 'checker' });
  stRoof(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0 + h, r); stDoor(L, side, y0);
  const name = NAMES[(r() * NAMES.length) | 0], fg = [B.NCYA, B.NMAG, B.NORA, B.NGRN][(r() * 4) | 0], w = stTextW(name) + 4, ns = side === 'n' || side === 's', mid = ns ? (L.x1 + L.x2) >> 1 : (L.z1 + L.z2) >> 1, y = y0 + 5;
  if (w <= (ns ? L.x2 - L.x1 : L.z2 - L.z1) + 2) {
    const sl = slabB(B.RBRICK);
    if (side === 's') { for (let i = L.x1; i <= L.x2; i++) { stPut(i, y0 + 4, L.z2 + 1, sl); stPut(i, y0 + 4, L.z2 + 2, sl); } stBoardH(name, mid - (w >> 1), y, L.z2 + 1, 'x', 1, fg, B.NORA); }
    else if (side === 'n') { for (let i = L.x1; i <= L.x2; i++) { stPut(i, y0 + 4, L.z1 - 1, sl); stPut(i, y0 + 4, L.z1 - 2, sl); } stBoardH(name, mid - (w >> 1), y, L.z1 - 1, 'x', 1, fg, B.NORA); }
    else if (side === 'w') { for (let i = L.z1; i <= L.z2; i++) { stPut(L.x1 - 1, y0 + 4, i, sl); stPut(L.x1 - 2, y0 + 4, i, sl); } stBoardH(name, L.x1 - 1, y, mid - (w >> 1), 'z', 1, fg, B.NORA); }
    else { for (let i = L.z1; i <= L.z2; i++) { stPut(L.x2 + 1, y0 + 4, i, sl); stPut(L.x2 + 2, y0 + 4, i, sl); } stBoardH(name, L.x2 + 1, y, mid - (w >> 1), 'z', 1, fg, B.NORA); }
  }
}
function bNeedle(L, r, side, num) {                                              // tall dark tower with a lit base, glowing window bands, an L-number plate and a spire
  const cx = (L.x1 + L.x2) >> 1, cz = (L.z1 + L.z2) >> 1, hw = 5, h = 46 + ((r() * 4) | 0) * 4, y0 = SD, S = (cx * 7 + cz) | 0, h6 = (h * .6) | 0;
  stBox(cx - hw - 1, y0 + 1, cz - hw - 1, cx + hw + 1, y0 + 3, cz + hw + 1, B.HULL);
  stTower(cx - hw, cz - hw, cx + hw, cz + hw, y0, y0 + h6, { fl: 6, wall: B.TECH, corner: B.HULL, win: [B.WWHT, B.WAMB], lit: .5, seed: S, mode: 'strip', band: B.LAMP, bandEvery: 12, floorId: B.HULL, roof: B.HULL });
  stTower(cx - hw + 1, cz - hw + 1, cx + hw - 1, cz + hw - 1, y0 + h6, y0 + h, { fl: 6, wall: B.HULL, corner: B.TECH, win: [B.NBLU], lit: .25, seed: S + 5, mode: 'strip', band: B.NBLU, bandEvery: 10, floorId: B.HULL, roof: B.HULL });
  stBox(cx - 2, y0 + h + 1, cz - 2, cx + 2, y0 + h + 3, cz + 2, B.LAMP); stBox(cx, y0 + h + 4, cz, cx, y0 + h + 14, cz, B.HULL); stPut(cx, y0 + h + 15, cz, B.NORA);
  for (let y = y0 + 4; y < y0 + h6; y += 12) stRing(cx - hw - 1, y, cz - hw - 1, cx + hw + 1, y, cz + hw + 1, slabB(B.HULL));
  stDoor({ x1: cx - hw, x2: cx + hw, z1: cz - hw, z2: cz + hw }, side, y0);
  const py = y0 + h - 9;                                                          // the number plate, on two faces
  for (const f of [[cx - 3, py, cz + hw + 1, 'x'], [cx + hw + 1, py, cz - 3, 'z']]) { const [a, b, c, ax] = f; for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) { const p = ax === 'x' ? [a + i, b + j, c] : [a, b + j, c + i]; stPut(p[0], p[1], p[2], (i === -1 || i === 7 || j === -1 || j === 7) ? B.HULL : B.TECH); } stText(num, ax === 'x' ? a + 1 : a, b + 1, ax === 'x' ? c : c + 1, ax, 1, B.NBLU, 0); }
}
function bIndustrial(L, r, side) {                                               // refinery: ribbed pipe tanks, catwalks, hazard stripes
  const y0 = SD, n = 3;
  for (let i = 0; i < n; i++) {
    const cx = L.x1 + 4 + i * ((L.x2 - L.x1 - 8) >> 1), cz = L.z1 + 4 + ((r() * (L.z2 - L.z1 - 8)) | 0), R = 3 + ((r() * 2) | 0), h = 12 + ((r() * 14) | 0);
    for (let y = 1; y <= h; y++) for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) { const d = Math.hypot(dx, dz); if (d <= R && d > R - 1.3) stPut(cx + dx, y0 + y, cz + dz, y % 6 === 0 ? B.HAZ : (y % 3 === 0 ? B.HULL : B.PIPE)); }
    for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) if (Math.hypot(dx, dz) <= R) stPut(cx + dx, y0 + h + 1, cz + dz, slabB(B.HULL));
    stBox(cx, y0 + h + 2, cz, cx, y0 + h + 5, cz, B.HULL); stPut(cx, y0 + h + 6, cz, B.NORA);
    if (i > 0) { const px = L.x1 + 4 + (i - 1) * ((L.x2 - L.x1 - 8) >> 1); stBox(Math.min(px, cx), y0 + 8, cz, Math.max(px, cx), y0 + 9, cz, B.PIPE); stBox(Math.min(px, cx), y0 + 10, cz - 1, Math.max(px, cx), y0 + 10, cz + 1, slabB(B.HAZ)); }
  }
  stRing(L.x1 + 1, y0 + 1, L.z1 + 1, L.x2 - 1, y0 + 1, L.z2 - 1, B.HAZ);
}
function bMarket(L, r, side) {                                                   // gold-and-teal market hall with a huge vertical sign
  const h = 16 + ((r() * 3) | 0) * 4, y0 = SD, S = (L.x1 * 5 + L.z1 * 3) | 0, name = ['BITJACK', 'MALLWARE', 'CLOUD', 'NEON'][(r() * 4) | 0];
  stTower(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0, y0 + h, { fl: 4, wall: B.GOLD, wall2: B.TEAL, corner: B.TEAL, win: [B.WWHT, B.WAMB], lit: .55, seed: S, mode: 'grid', band: B.TEAL, bandEvery: 4 });
  stRoof(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0 + h, r); stDoor(L, side, y0);
  const top = y0 + h + 14, fg = [B.NCYA, B.NBLU, B.NMAG, B.NORA][(r() * 4) | 0];
  if (side === 's') stBoardV(name, L.x2 - 10, top, L.z2 + 1, 'x', 1, fg, B.LAMP); else if (side === 'n') stBoardV(name, L.x2 - 10, top, L.z1 - 1, 'x', 1, fg, B.LAMP); else if (side === 'w') stBoardV(name, L.x1 - 1, top, L.z2 - 10, 'z', 1, fg, B.LAMP); else stBoardV(name, L.x2 + 1, top, L.z2 - 10, 'z', 1, fg, B.LAMP);
}

// ============================================================ assembly
const LOTX = [[10, 28], [34, 54], [60, 80]], LOTZ = [[9, 27], [33, 52], [58, 78], [84, 100]];
function stHullAndDeck() {
  for (let z = GZ0; z < GZ1; z++) for (let x = GX0; x < GX1; x++) {
    const o = stOct(x, z); if (o > STN.R + .5) continue;
    for (let y = 44; y < SD; y++) {
      const k = (SD - 1 - y) / (SD - 44), Ry = STN.R * (1 - k * .5); if (o > Ry) continue;
      const rim = o > Ry - 1.5; let id = B.HULL;
      if (rim) id = (y % 8 === 0) ? B.NORA : (((x + z + y) % 14) === 0 ? B.LAMP : ((x * 5 + z * 3 + y) % 9 === 0 ? B.TECH : B.HULL));
      else if (y === 44) id = ((x + z) % 6 === 0) ? B.NBLU : B.TECH;
      stPut(x, y, z, id);
    }
    let dk = B.STREET; const ax = Math.abs(x), az = Math.abs(z);
    if (ax >= 7 && ax <= 9 && az < 100) dk = B.HULL; else if (az >= 6 && az <= 8 && ax < 90) dk = B.HULL;
    else if ((ax === 5) && (z & 3) < 2 && az < 100) dk = B.CONC; else if (az === 4 && (x & 3) < 2 && ax < 90) dk = B.CONC;
    stPut(x, SD, z, dk);
    if (o > STN.R - 2.2) {                                                          // the perimeter wall: plates, an orange light strip, a concrete cap
      stPut(x, SD + 1, z, B.HULL); stPut(x, SD + 2, z, B.HULL); stPut(x, SD + 3, z, B.NORA); stPut(x, SD + 4, z, B.HULL); stPut(x, SD + 5, z, slabB(B.CONC));
      if (o > STN.R - 1.2 && (x + z) % 12 === 0) { stBox(x, SD + 6, z, x, SD + 9, z, B.HULL); stPut(x, SD + 10, z, B.LAMP); }
    }
  }
}
function stPlazaAndCore() {
  const RY = STN.RY, cx = 0, cz = 0;
  for (let z = -16; z <= 16; z++) for (let x = -16; x <= 16; x++) {                   // the plaza floor: rings and spokes
    const px = x + .5, pz = z + .5, ax = Math.abs(px), az = Math.abs(pz), o = Math.max(ax, az, (ax + az) / 1.41421); if (o > 13) continue;
    const ring = o > 11.5 && o < 12.6, spoke = Math.min(ax, az) < .6 || Math.abs(ax - az) < .7;
    stPut(x, SD, z, ring ? B.NORA : spoke ? B.NCYA : (Math.floor(o) % 3 === 0 ? B.TECH : B.STREET));
  }
  // the core: a dark ringed cylinder with a lift inside, a canopy of lamps halfway up and an observation deck on top
  const TOP = SD + 72, CAN = SD + 42;
  for (let y = SD + 1; y <= TOP; y++) for (let z = -8; z <= 7; z++) for (let x = -8; x <= 7; x++) {
    const d = Math.hypot(x + .5, z + .5); if (d > 6.3 || d < 4.7) continue;
    let id = (y % 10 === 0) ? B.CHROME : (y % 5 === 0 ? B.NBLU : B.HULL);
    const ang = Math.atan2(z + .5, x + .5); if (Math.abs(((ang / (Math.PI / 4)) % 1 + 1) % 1 - .5) < .07 && y % 10 !== 0) id = B.NBLU;
    stPut(x, y, z, id);
  }
  for (const dy of [1, 2, 3, RY - SD + 1, RY - SD + 2, RY - SD + 3, CAN - SD + 1, CAN - SD + 2, CAN - SD + 3]) for (let x = -1; x <= 0; x++) for (let z = 4; z <= 7; z++) stPut(x, SD + dy, z, 0);   // doorways facing south at the three lift stops
  for (let y = SD + 1; y <= TOP; y++) if (y % 4 === 0) { stPut(3, y, 3, B.LAMP); stPut(-4, y, -4, B.LAMP); stPut(3, y, -4, B.LAMP); stPut(-4, y, 3, B.LAMP); }
  for (let z = -9; z <= 8; z++) for (let x = -9; x <= 8; x++) { const d = Math.hypot(x + .5, z + .5); if (d <= 4.7) stPut(x, TOP + 1, z, B.HULL); }
  for (let z = -26; z <= 25; z++) for (let x = -26; x <= 25; x++) {                   // the canopy
    const d = Math.hypot(x + .5, z + .5); if (d > 24 || d < 6.3) continue;
    const rim = d > 22.6, lamp = ((x * 3 + z * 5) % 6 === 0 || (x + z * 2) % 7 === 0) && d > 8;
    stPut(x, CAN, z, rim ? B.NORA : (lamp ? B.LAMP : B.HULL)); stPut(x, CAN + 1, z, rim ? B.HULL : (d > 6.3 ? B.TECH : 0)); if (rim) stPut(x, CAN + 2, z, slabB(B.CONC));
  }
  for (let z = -13; z <= 12; z++) for (let x = -13; x <= 12; x++) { const d = Math.hypot(x + .5, z + .5); if (d > 9 && d <= 9.8) stPut(x, TOP + 1, z, B.NORA); if (d <= 9 && d > 4.7) stPut(x, TOP, z, B.HULL), stPut(x, TOP + 1, z, d > 8.2 ? slabB(B.CONC) : 0); }
  stBox(0, TOP + 2, 0, 0, TOP + 12, 0, B.HULL); stPut(0, TOP + 13, 0, B.NORA);
  // the elevated promenade: an octagon at the rail level with a glowing orange rim, four arms with a stairway up from the plaza
  for (let z = -15; z <= 15; z++) for (let x = -15; x <= 15; x++) {
    const px = x + .5, pz = z + .5, ax = Math.abs(px), az = Math.abs(pz), o = Math.max(ax, az, (ax + az) / 1.41421), d = Math.hypot(px, pz); if (o > 13.5 || d < 6.3) continue;
    const rim = o > 12.4; stPut(x, RY, z, rim ? B.NORA : ((x + z) & 1 ? B.HULL : B.TECH)); if (rim) stPut(x, RY + 1, z, slabB(B.CONC));
  }
  for (let a = 0; a < 8; a++) { const t = a * Math.PI / 4 + Math.PI / 8; stBox(Math.round(Math.cos(t) * 11), RY - 7, Math.round(Math.sin(t) * 11), Math.round(Math.cos(t) * 11) + 1, RY - 1, Math.round(Math.sin(t) * 11) + 1, B.HULL); }
  const arm = (dx, dz) => {                                                          // a rail arm: deck, lights, guard, girder ribs, piers
    const L = 88, px = -dz, pz = dx;
    for (let i = 14; i <= L; i++) for (let w = -2; w <= 2; w++) {
      const x = dx * i + px * w, z = dz * i + pz * w, edge = Math.abs(w) === 2;
      stPut(x, RY, z, edge ? B.NORA : ((i + w) & 1 ? B.HULL : B.TECH)); if (edge && i > 44) stPut(x, RY + 1, z, slabB(B.CONC));
      if (i % 4 === 0) stPut(x, RY - 1, z, B.HULL); else if (w === 0) stPut(x, RY - 1, z, B.HULL);
    }
    for (const i of [50, 64, 78]) for (const s of [-1, 1]) { const x = dx * i + px * 3 * s, z = dz * i + pz * 3 * s; stBox(x, SD + 1, z, x + 1, RY - 1, z + 1, B.HULL); stBox(x, RY - 9, z, x + 1, RY - 8, z + 1, B.TECH); }
    if (dx !== 0) stStairs(dx * 14, SD + 1, dx > 0 ? 3 : -3, dx, 0, 28, 2, B.HULL); else stStairs(dz > 0 ? 4 : -4, SD + 1, dz * 14, 0, dz, 28, 2, B.HULL);       // stairs up beside the arm
  };
  arm(1, 0); arm(-1, 0); arm(0, 1); arm(0, -1);
}
function stGantry(zc, dz) {                                                          // the arch at each end of the N-S avenue: two pylons and a gantry that the rail runs into
  for (const sx of [-1, 1]) {
    const x1 = sx > 0 ? 11 : -17, x2 = x1 + 6;
    stTower(x1, Math.min(zc, zc + 6 * dz), x2, Math.max(zc, zc + 6 * dz), SD, SD + 58, { fl: 6, wall: B.TECH, corner: B.HULL, win: [B.WWHT], lit: .4, seed: zc + sx, mode: 'strip', band: B.NORA, bandEvery: 14, floorId: B.HULL, roof: B.HULL });
    stBox(x1 + 2, SD + 59, Math.min(zc, zc + 6 * dz) + 2, x1 + 4, SD + 63, Math.min(zc, zc + 6 * dz) + 4, B.LAMP);
  }
  const z1 = Math.min(zc, zc + 6 * dz), z2 = Math.max(zc, zc + 6 * dz);
  stBox(-11, STN.RY, z1, 10, STN.RY, z2, B.HULL); stBox(-11, STN.RY + 1, z1, 10, STN.RY + 1, z1, slabB(B.CONC)); stBox(-11, STN.RY + 1, z2, 10, STN.RY + 1, z2, slabB(B.CONC));
  for (let x = -11; x <= 10; x++) { stPut(x, STN.RY, z1, B.NORA); stPut(x, STN.RY, z2, B.NORA); }
  stBox(-11, SD + 44, z1, 10, SD + 47, z2, B.HULL);                                  // the big lintel high above the street
  for (let x = -10; x <= 9; x += 2) for (let y = SD + 45; y <= SD + 46; y++) stPut(x, y, dz > 0 ? z1 : z2, B.LAMP);
  stBox(-8, STN.RY + 1, z1 + 1, -8, SD + 43, z1 + 1, B.HULL);
}
function stSmith() {
  const x0 = -10, x1 = -1, zb = 8, zf = 14, y = SD + 1, bx = (a, b, c, d, e, f, id) => stBox(a, b, c, d, e, f, id);
  bx(x0, y, zb, x1, y + 3, zb, B.HULL); bx(x0, y, zb, x0, y + 3, zf, B.OBS); bx(x1, y, zb, x1, y + 3, zf, B.OBS); bx(x0, y, zf, x1, y, zf, B.STEEL);
  for (let x = x0 - 1; x <= x1 + 1; x++) for (let z = zb - 1; z <= zf + 1; z++) stPut(x, y + 4, z, ((x + z) & 1) ? 7 : 5);
  stPut(x0 + 3, y, zb + 3, B.STEEL); stPut(x0 + 3, y + 1, zb + 3, B.STEEL); stPut(x0 + 7, y, zb + 3, 6); stPut(x0 + 7, y + 1, zb + 3, 6); stPut(x0 + 5, y + 3, zf, B.NMAG);
}
function stLots() {
  const r = stRng(0xC17E), out = [];
  for (const sx of [1, -1]) for (const sz of [1, -1]) for (let ix = 0; ix < 3; ix++) for (let iz = 0; iz < 4; iz++) {
    const [a, b] = LOTX[ix], [c, d] = LOTZ[iz], x1 = sx > 0 ? a : -b, x2 = sx > 0 ? b : -a, z1 = sz > 0 ? c : -d, z2 = sz > 0 ? d : -c;
    if (ix === 2 && iz === 2) continue;                                                        // those four corners are the big towers
    if (sx === 1 && sz === 1 && ix === 0 && iz === 0) continue;                                // the lot next to the plaza is the Rift Navigation Hall
    if (Math.max(stOct(x1, z1), stOct(x1, z2), stOct(x2, z1), stOct(x2, z2)) > STN.R - 5) continue;
    if (iz === 3 && ix === 0) continue;                                                        // keep the dock open at the ends of the avenue
    out.push({ x1, x2, z1, z2, ix, iz, sx, sz, q: r() });
  }
  return out;
}
function stBuildCity() {
  const lots = stLots(), r = stRng(0xBEEF51);
  for (const L of lots) {
    const cx = (L.x1 + L.x2) / 2, cz = (L.z1 + L.z2) / 2, side = Math.abs(cx) <= 45 ? (cx > 0 ? 'w' : 'e') : (cz > 0 ? 'n' : 's'), near = Math.hypot(cx, cz) < 52, rr = stRng((L.x1 * 73856093) ^ (L.z1 * 19349663) ^ 0x51), q = L.q;
    L.side = side;
    if (near) { if (q < .4) bNeedle(L, rr, side, ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'][(L.ix * 3 + L.iz + (L.sx > 0 ? 1 : 0)) % 6]); else if (q < .85) bMega(L, rr, side); else bMarket(L, rr, side); }
    else { if (q < .3) bApt(L, rr, side); else if (q < .55) bBrick(L, rr, side); else if (q < .72) bMarket(L, rr, side); else if (q < .86) bIndustrial(L, rr, side); else bMega(L, rr, side); }
  }
  for (const sx of [1, -1]) for (const sz of [1, -1]) {                                       // the four corner towers
    const x1 = sx > 0 ? 62 : -74, z1 = sz > 0 ? 56 : -68; bNeedle({ x1, x2: x1 + 12, z1, z2: z1 + 12 }, stRng(sx * 31 + sz * 7 + 9), sz > 0 ? 'n' : 's', sx * sz > 0 ? 'L5' : 'L6');
  }
  for (const sx of [1, -1]) bNeedle({ x1: sx > 0 ? 81 : -91, x2: sx > 0 ? 91 : -81, z1: -5, z2: 5 }, stRng(77 + sx), sx > 0 ? 'w' : 'e', 'L3');                // the towers at the ends of the cross rails
  // skybridges: enclosed tubes between neighbouring lots across the side streets
  const rb = stRng(0xB41D6E), by = [SD + 8, SD + 16];
  for (const A of lots) for (const Bn of lots) {
    if (A.sz !== Bn.sz || A.sx !== Bn.sx || A.iz !== Bn.iz || Bn.ix !== A.ix + 1) continue; if (rb() < .45) continue;
    const y = by[(rb() * 2) | 0], zc = ((A.z1 + A.z2) >> 1) + ((rb() * 5) | 0) - 2, xa = A.sx > 0 ? A.x2 : A.x1, xb = A.sx > 0 ? Bn.x1 : Bn.x2, lo = Math.min(xa, xb), hi = Math.max(xa, xb);
    stBox(lo, y, zc - 2, hi, y, zc + 2, B.HULL); stBox(lo, y + 4, zc - 2, hi, y + 4, zc + 2, B.HULL);
    for (let x = lo; x <= hi; x++) for (let h = 1; h <= 3; h++) { for (const zz of [zc - 2, zc + 2]) stPut(x, y + h, zz, h === 2 && x % 2 === 0 ? B.WWHT : B.TECH); for (let zz = zc - 1; zz <= zc + 1; zz++) stPut(x, y + h, zz, 0); }
    stBox(lo, y + 1, zc - 1, lo, y + 3, zc + 1, 0); stBox(hi, y + 1, zc - 1, hi, y + 3, zc + 1, 0);
    stBox(lo + 2, y - 7, zc, lo + 2, y - 1, zc, B.PIPE); stBox((lo + hi) >> 1, y - 1, zc, (lo + hi) >> 1, y - 1, zc, B.NORA);
  }
}
function stLampPosts() {
  for (let z = -100; z <= 100; z += 12) for (const x of [-10, 10]) if (stGet(x, SD, z) && Math.abs(z) > 14) { stBox(x, SD + 1, z, x, SD + 6, z, B.HULL); stPut(x, SD + 7, z, B.LAMP); stPut(x + (x > 0 ? -1 : 1), SD + 7, z, slabB(B.HULL)); }
  for (let x = -84; x <= 84; x += 12) for (const z of [-9, 9]) if (Math.abs(x) > 14 && stGet(x, SD, z)) { stBox(x, SD + 1, z, x, SD + 6, z, B.HULL); stPut(x, SD + 7, z, B.LAMP); }
}
function stDockAndGate() {
  const sp = STN.spawn; for (let z = 94; z <= 112; z++) for (let x = -14; x <= 14; x++) if (stGet(x, SD, z)) { const d = Math.hypot(x - sp.x + .5, z - sp.z + .5); if (d < 7.8 && d > 6.2) stPut(x, SD, z, B.NCYA); else if (d <= 6.2) stPut(x, SD, z, (Math.floor(d) % 2) ? B.TECH : B.STREET); }
  stGantry(88, 1); stGantry(-94, -1);
  buildGate(stPut, STN.gate);
  for (const sx of [-1, 1]) { for (let z = -112; z <= -98; z++) { stPut(sx * 9, SD + 1, z, B.HULL); stPut(sx * 9, SD + 2, z, slabB(B.NORA - 0)); } }
}
function stBuildAll() {
  ST = new Uint16Array(GW * GD * (GY1 - GY0));
  stHullAndDeck(); stBuildCity(); stRiftHall(); stLampPosts(); stPlazaAndCore(); stSmith(); stDockAndGate();
  stText('HELLGATE', -22, SD + 24, -92, 'x', 1, B.NORA, 1);
}
OWG.gen3 = function (cx, cz) {
  if (!ST) stBuildAll();
  const b = new Uint16Array(256 * WORLD_H), x0 = cx * CS, z0 = cz * CS;
  if (x0 + CS <= GX0 || x0 >= GX1 || z0 + CS <= GZ0 || z0 >= GZ1) return b;
  for (let y = GY0; y < GY1 && y < WORLD_H; y++) for (let lz = 0; lz < CS; lz++) { const z = z0 + lz; if (z < GZ0 || z >= GZ1) continue; for (let lx = 0; lx < CS; lx++) { const x = x0 + lx; if (x < GX0 || x >= GX1) continue; const id = ST[((y - GY0) * GD + (z - GZ0)) * GW + (x - GX0)]; if (id) b[lx | (lz << 4) | (y << 8)] = id; } }
  return b;
};
