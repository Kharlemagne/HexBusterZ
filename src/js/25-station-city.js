// ============================================================
//  THE CITY OF THE HELICARRIER — every building has a job. West of the avenue live the RUNNERS (offices, the exchange, the IT, the Overflow slums,
//  the detention block); east live the PROGENIES (studios, workshops, gardens, the market, the casino, the clinic). Signs name each place, and
//  each interior has what you would expect to find there. Built from the material x shape kit (stairs, walls, panes, pillars, neon colours...).
// ============================================================
const MID = name => { const i = MATS.findIndex(m => m.name === name); return i < 0 ? B.HULL : MAT0 + i; };
const CC = n => MID(n + ' CONCRETE'), NEO = n => MID('NEON ' + n);
const SH = (b, k, d = 0) => blockId(b, k, d);
// ---- small furniture, all placed on the ground floor of a lot (y = SD + 1)
function stRack(x, z, h, id, lit) { stBox(x, SD + 1, z, x + 1, SD + h, z, id); stBox(x, SD + 1, z + 1, x + 1, SD + h, z + 1, B.TECH); if (lit) for (let y = SD + 2; y <= SD + h; y += 2) stPut(x, y, z, lit); }
function stCounter(x1, z1, x2, z2, top = B.GOLD) { stBox(x1, SD + 1, z1, x2, SD + 1, z2, B.HULL); stBox(x1, SD + 2, z1, x2, SD + 2, z2, SH(top, K.SLAB_B)); }
function stBed(x, z, dir) { const dx = dir ? 0 : 2, dz = dir ? 2 : 0; stBox(x, SD + 1, z, x + dx, SD + 1, z + dz, SH(CC('WHITE'), K.SLAB_B)); stPut(dir ? x : x + dx, SD + 2, dir ? z + dz : z, SH(CC('LIGHT BLUE'), K.SLAB_B)); }
function stSlot(x, z, col) { stBox(x, SD + 1, z, x, SD + 3, z, B.HULL); stPut(x, SD + 3, z, col); stPut(x, SD + 2, z, B.NCYA); }
function stPlant(x, y, z, h = 3) { stPut(x, y, z, SH(B.HULL, K.SLAB_B)); for (let i = 1; i <= h; i++) stPut(x, y + i, z, i === h ? 16 : 17); stPut(x + 1, y + h, z, 16); stPut(x - 1, y + h - 1, z, 16); }
function stHang(x, y0, y1, z, id = B.PIPE) { stBox(x, y0, z, x, y1, z, id); }
// a sign down the side of a building (letters stacked), on the face turned towards the street
function stSideSign(L, name, fg, frame, topY, offset = 3) {
  const s = L.side, mx = (L.x1 + L.x2) >> 1, mz = (L.z1 + L.z2) >> 1;
  if (s === 'w') stBoardV(name, L.x1 - 1, topY, L.z1 + offset, 'z', 1, fg, frame); else if (s === 'e') stBoardV(name, L.x2 + 1, topY, L.z1 + offset, 'z', 1, fg, frame);
  else if (s === 'n') stBoardV(name, L.x1 + offset, topY, L.z1 - 1, 'x', 1, fg, frame); else stBoardV(name, L.x1 + offset, topY, L.z2 + 1, 'x', 1, fg, frame);
}
function stFrontText(L, text, y, fg) {                                                                 // a short word on a small vertical sign at the other end of the street face
  const span = (L.side === 'n' || L.side === 's') ? L.x2 - L.x1 : L.z2 - L.z1, word = text.slice(0, 5);
  stSideSign(L, word, fg, B.TECH, SD + 6 * word.length + 6, Math.max(3, span - 12));
}
function stDoorOpen(L, y0 = SD) { stDoor(L, L.side, y0); const s = L.side, mx = (L.x1 + L.x2) >> 1, mz = (L.z1 + L.z2) >> 1;         // a lit frame around the doorway
  for (let h = 0; h <= 4; h++) for (const k of [-2, 2]) { if (h === 4 || Math.abs(k) === 2) { const x = s === 'n' || s === 's' ? mx + k : (s === 'w' ? L.x1 : L.x2), z = s === 'n' ? L.z1 : s === 's' ? L.z2 : mz + k; if (h < 4) stPut(x, y0 + 1 + h, z, B.NORA); } }
}
// ============ the buildings
function bCasino(L, r) {                                                                               // BITJACK: gold and magenta, slot floor, a hotel above
  const y0 = SD, H = 34, o = { fl: 4, wall: CC('BLACK'), wall2: B.GOLD, corner: B.GOLD, win: [B.WAMB, B.WWHT], lit: .5, seed: 11, mode: 'grid', band: B.GOLD, bandEvery: 4, floorId: B.CONC, roof: B.HULL };
  stTower(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0, y0 + H, o); stRoof(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0 + H, r); stDoorOpen(L);
  for (let z = L.z1 + 3; z < L.z2 - 2; z += 3) for (let x = L.x1 + 3; x < L.x2 - 2; x += 3) if (((x + z) % 2) === 0) stSlot(x, z, [NEO('MAGENTA'), NEO('YELLOW'), NEO('CYAN'), NEO('LIME')][(x + z) % 4]);
  stCounter(L.x1 + 3, L.z2 - 4, L.x1 + 8, L.z2 - 4, B.GOLD);
  for (let y = y0 + 1; y < y0 + 4; y++) for (const x of [L.x1 + 2, L.x2 - 2]) stPut(x, y, L.z1 + 2, SH(B.GOLD, K.PILLAR));
  stSideSign(L, 'BITJACK', NEO('YELLOW'), B.LAMP, y0 + H + 6, 4); stFrontText(L, 'CASINO', y0 + 7, NEO('MAGENTA'));
}
function bMall(L, r) {                                                                                 // MALLWARE: stepped, glass frontage, stalls on every floor
  const y0 = SD, W = L.x2 - L.x1;
  for (let k = 0; k < 4; k++) { const ins = k * 2; stTower(L.x1 + 1 + ins, L.z1 + 1 + ins, L.x2 - 1 - ins, L.z2 - 1 - ins, y0 + k * 5, y0 + k * 5 + 5, { fl: 5, wall: k & 1 ? CC('LIGHT GRAY') : B.CONC, corner: B.TEAL, win: [B.WWHT], lit: .8, seed: 40 + k, mode: 'strip', band: B.TEAL, bandEvery: 5, floorId: B.CONC, roof: B.CONC }); }
  stDoorOpen(L);
  for (let k = 0; k < 4; k++) for (let x = L.x1 + 4 + k * 2; x < L.x2 - 4 - k * 2; x += 4) { const z = L.z1 + 4 + k * 2; stCounter(x, z, x + 1, z, [B.TEAL, B.GOLD, B.RBRICK, B.CONC][k]); stPut(x, SD + k * 5 + 4, z, B.LAMP); }
  stRoof(L.x1 + 7, L.z1 + 7, L.x2 - 7, L.z2 - 7, y0 + 20, r);
  stSideSign(L, 'MALLWARE', NEO('CYAN'), B.LAMP, y0 + 30, 5); stFrontText(L, 'SHOPS', y0 + 8, NEO('PINK'));
}
function bPatch(L, r) {                                                                                // PATCH CENTER: the clinic, white with a red cross, beds inside
  const y0 = SD, H = 20;
  stTower(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0, y0 + H, { fl: 5, wall: CC('WHITE'), wall2: B.TEAL, corner: B.TEAL, win: [B.WWHT], lit: .75, seed: 5, mode: 'strip', band: CC('RED'), bandEvery: 10, floorId: B.CONC, roof: CC('WHITE') });
  stRoof(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0 + H, r); stDoorOpen(L);
  for (let z = L.z1 + 3; z < L.z2 - 3; z += 3) for (const x of [L.x1 + 3, L.x2 - 6]) stBed(x, z, 0);
  stCounter((L.x1 + L.x2 >> 1) - 2, L.z2 - 4, (L.x1 + L.x2 >> 1) + 2, L.z2 - 4, B.TEAL);
  const cx = (L.x1 + L.x2) >> 1, cy = y0 + H - 6, face = L.side;                                       // the big red cross on the street face
  for (let i = -3; i <= 3; i++) for (let j = -1; j <= 1; j++) { const a = [i, j], b = [j, i]; for (const [u, v] of [a, b]) { if (face === 'w') stPut(L.x1 - 1, cy + v, (L.z1 + L.z2 >> 1) + u, NEO('RED')); else if (face === 'e') stPut(L.x2 + 1, cy + v, (L.z1 + L.z2 >> 1) + u, NEO('RED')); else if (face === 'n') stPut(cx + u, cy + v, L.z1 - 1, NEO('RED')); else stPut(cx + u, cy + v, L.z2 + 1, NEO('RED')); } }
  stFrontText(L, 'PATCH', y0 + 6, NEO('RED'));
}
function bExchange(L, r) {                                                                             // BIT EXCHANGE: tall dark tower, ticker bands in green and red
  const y0 = SD, H = 58, cx = (L.x1 + L.x2) >> 1, cz = (L.z1 + L.z2) >> 1;
  stBox(L.x1, y0 + 1, L.z1, L.x2, y0 + 3, L.z2, B.HULL);
  stTower(L.x1 + 2, L.z1 + 2, L.x2 - 2, L.z2 - 2, y0 + 3, y0 + H, { fl: 6, wall: CC('BLACK'), wall2: B.TECH, corner: B.HULL, win: [B.WWHT], lit: .3, seed: 77, mode: 'strip', band: B.TECH, bandEvery: 8, floorId: B.HULL, roof: B.HULL });
  for (let y = y0 + 7; y < y0 + H - 4; y += 12) for (let x = L.x1 + 3; x < L.x2 - 2; x++) { if (L.side === 'e' || L.side === 'w') break; stPut(x, y, L.side === 'n' ? L.z1 + 2 : L.z2 - 2, ((x + y) & 1) ? NEO('GREEN') : NEO('RED')); }
  stBox(cx - 1, y0 + H + 1, cz - 1, cx + 1, y0 + H + 3, cz + 1, B.LAMP); stBox(cx, y0 + H + 4, cz, cx, y0 + H + 12, cz, B.HULL);
  stDoorOpen({ x1: L.x1, x2: L.x2, z1: L.z1, z2: L.z2, side: L.side }, y0 + 3);
  for (let i = 0; i < 3; i++) stCounter(L.x1 + 4 + i * 4, L.z1 + 5, L.x1 + 5 + i * 4, L.z1 + 5, B.TECH);
  stSideSign(L, 'EXCHANGE', NEO('GREEN'), B.LAMP, y0 + H - 4, 5);
}
function bOffice(L, r) {                                                                               // CHAIN BLOCK: grids of lit office floors, cubicle rows inside
  const y0 = SD, H = 30;
  stTower(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0, y0 + H, { fl: 4, wall: CC('GRAY'), wall2: B.HULL, corner: B.HULL, win: [B.WWHT, B.WAMB], lit: .7, seed: 21, mode: 'grid', band: B.TEAL, bandEvery: 12, floorId: B.CONC, roof: B.HULL });
  stRoof(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0 + H, r); stDoorOpen(L);
  for (let z = L.z1 + 3; z < L.z2 - 2; z += 4) for (let x = L.x1 + 3; x < L.x2 - 4; x += 5) { stBox(x, SD + 1, z, x + 2, SD + 1, z, B.TECH); stPut(x + 1, SD + 2, z, B.NBLU); }
  stSideSign(L, 'CHAIN', NEO('SKY'), B.LAMP, y0 + H - 2, 4); stFrontText(L, 'OFFICES', y0 + 7, NEO('SKY'));
}
function bServer(L, r) {                                                                               // SERVER FARM: a low hall of racks and vents
  const y0 = SD, H = 14;
  stTower(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0, y0 + H, { fl: 7, wall: MID('VENT GRILLE'), wall2: MID('CORRUGATED METAL'), corner: B.HULL, win: [B.NBLU], lit: .2, seed: 9, mode: 'strip', band: B.TECH, bandEvery: 7, floorId: B.HULL, roof: MID('DIAMOND PLATE') });
  stRoof(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0 + H, r); stDoorOpen(L);
  for (let z = L.z1 + 3; z < L.z2 - 2; z += 3) for (let x = L.x1 + 3; x < L.x2 - 3; x += 2) if ((x + z) % 4 !== 1) stBox(x, SD + 1, z, x, SD + 5, z + 1, MID('SERVER RACK'));
  for (let x = L.x1 + 2; x < L.x2 - 1; x += 4) { stBox(x, y0 + H + 1, L.z1 + 2, x, y0 + H + 3, L.z1 + 2, B.PIPE); }
  stFrontText(L, 'SERVER', y0 + 6, NEO('BLUE'));
}
function bIT(L, r) {                                                                                   // THE IT: black, red-lit, a watching eye on the front
  const y0 = SD, H = 44, cx = (L.x1 + L.x2) >> 1, cz = (L.z1 + L.z2) >> 1;
  stTower(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0, y0 + H, { fl: 6, wall: CC('BLACK'), wall2: MID('GREEBLE PLATE'), corner: B.HULL, win: [B.WAMB], lit: .12, seed: 3, mode: 'strip', band: CC('RED'), bandEvery: 9, floorId: B.HULL, roof: B.HULL });
  stDoorOpen(L); for (let z = L.z1 + 3; z < L.z2 - 2; z += 4) { stCounter(L.x1 + 3, z, L.x2 - 3, z, B.TECH); stPut(L.x1 + 3, SD + 3, z, NEO('RED')); }
  const ey = y0 + H - 8, put2 = (u, v, id) => { if (L.side === 'w') stPut(L.x1 - 1, ey + v, cz + u, id); else if (L.side === 'e') stPut(L.x2 + 1, ey + v, cz + u, id); else if (L.side === 'n') stPut(cx + u, ey + v, L.z1 - 1, id); else stPut(cx + u, ey + v, L.z2 + 1, id); };
  for (let u = -4; u <= 4; u++) for (let v = -2; v <= 2; v++) { const d = (u * u) / 16 + (v * v) / 4; if (d <= 1) put2(u, v, d < .18 ? B.OBS : d < .55 ? NEO('RED') : CC('BLACK')); }
  stFrontText(L, 'THE IT', y0 + 6, NEO('RED'));
}
function bDetention(L, r) {                                                                            // GRIDLOCK DETENTION: a walled block of cells behind bars
  const y0 = SD, H = 12;
  stTower(L.x1, L.z1, L.x2, L.z2, y0, y0 + H, { fl: 4, wall: CC('GRAY'), wall2: MID('DIAMOND PLATE'), corner: B.HULL, win: null, seed: 2, mode: 'strip', floorId: B.CONC, roof: B.CONC });
  for (let x = L.x1 + 3; x < L.x2 - 2; x += 5) for (let z = L.z1 + 3; z < L.z2 - 3; z += 5) { for (let y = SD + 1; y <= SD + 3; y++) { for (let k = 0; k < 4; k++) { stPut(x + k, y, z, SH(B.STEEL, K.PANE)); stPut(x + k, y, z + 3, B.CONC); } stPut(x, y, z + 1, B.CONC); stPut(x, y, z + 2, B.CONC); } stBed(x + 1, z + 2, 0); }
  stDoorOpen(L); for (let x = L.x1; x <= L.x2; x += 3) stPut(x, y0 + H + 1, L.z1, SH(B.STEEL, K.FENCE));
  stFrontText(L, 'GRIDLOCK', y0 + 8, NEO('ORANGE'));
}
function bOverflow(L, r) {                                                                             // THE OVERFLOW: stacked low-rent flats, rust and laundry lines, crooked stairs
  const y0 = SD, H = 26 + ((r() * 3) | 0) * 4;
  stTower(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0, y0 + H, { fl: 4, wall: B.RBRICK, wall2: MID('CORRUGATED METAL'), corner: B.RUST, win: [B.WAMB], lit: .45, seed: L.x1, mode: 'checker', band: B.RUST, bandEvery: 4, floorId: B.CONC, roof: MID('CORRUGATED METAL') });
  stRoof(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0 + H, r); stDoor(L, L.side, y0);
  for (let y = y0 + 6; y < y0 + H; y += 4) for (let i = 0; i < 3; i++) { const t = L.side === 'w' ? [L.x1 - 1, y, L.z1 + 3 + i * 5] : L.side === 'e' ? [L.x2 + 1, y, L.z1 + 3 + i * 5] : L.side === 'n' ? [L.x1 + 3 + i * 5, y, L.z1 - 1] : [L.x1 + 3 + i * 5, y, L.z2 + 1]; stPut(t[0], t[1], t[2], SH(B.RBRICK, K.SLAB_B)); stPut(t[0], t[1] + 1, t[2], SH(B.STEEL, K.FENCE)); }
  const fl = Math.min(5, H >> 2); if (L.side === 'e' || L.side === 'w') stZig(L.side === 'w' ? L.x2 + 1 : L.x1 - 2, y0 + 1, L.z1 + 2, 'z', 1, fl, 2); else stZig(L.x1 + 2, y0 + 1, L.side === 'n' ? L.z2 + 1 : L.z1 - 2, 'x', 1, fl, 2);
  stFrontText(L, 'OVERFLOW', y0 + 5, NEO('ORANGE'));
}
function bStudio(L, r) {                                                                               // ART STUDIOS: bright brick, skylights, planters and easels
  const y0 = SD, H = 14 + ((r() * 2) | 0) * 4;
  stTower(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0, y0 + H, { fl: 5, wall: B.RBRICK, wall2: CC('WHITE'), corner: CC('WHITE'), win: [B.WWHT, B.WAMB], lit: .7, seed: L.z1, mode: 'checker', band: CC('PINK'), bandEvery: 5, floorId: B.CONC, roof: CC('LIGHT GRAY') });
  stRoof(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0 + H, r); stDoorOpen(L);
  for (let z = L.z1 + 3; z < L.z2 - 3; z += 4) { stPut(L.x1 + 3, SD + 1, z, B.PIPE); stPut(L.x1 + 3, SD + 2, z, B.PIPE); stBox(L.x1 + 3, SD + 3, z, L.x1 + 3, SD + 3, z, [NEO('MAGENTA'), NEO('CYAN'), NEO('YELLOW')][(z >> 2) % 3]); stPlant(L.x2 - 4, SD + 1, z, 2); }
  stPlant(L.x1 + 2, y0 + H + 1, L.z1 + 2, 3); stPlant(L.x2 - 2, y0 + H + 1, L.z2 - 2, 3);
  stFrontText(L, 'STUDIOS', y0 + 5, NEO('PINK'));
}
function bGarden(L, r) {                                                                               // THE GREENHOUSE: panes all round, moss floor, trees
  const y0 = SD, H = 16, wallId = SH(B.STEEL, K.PANE);
  for (let y = y0 + 1; y <= y0 + H; y++) for (let z = L.z1 + 1; z <= L.z2 - 1; z++) for (let x = L.x1 + 1; x <= L.x2 - 1; x++) { const e = x === L.x1 + 1 || x === L.x2 - 1 || z === L.z1 + 1 || z === L.z2 - 1; if (e && y <= y0 + H - 1) stPut(x, y, z, (y % 5 === 0 || ((x + z) % 6 === 0)) ? B.TECH : wallId); }
  stBox(L.x1 + 1, y0 + H, L.z1 + 1, L.x2 - 1, y0 + H, L.z2 - 1, B.TECH);
  for (let z = L.z1 + 2; z < L.z2 - 1; z++) for (let x = L.x1 + 2; x < L.x2 - 1; x++) stPut(x, SD, z, 16);
  for (let i = 0; i < 5; i++) { const x = L.x1 + 4 + ((i * 7) % (L.x2 - L.x1 - 7)), z = L.z1 + 4 + ((i * 5) % (L.z2 - L.z1 - 7)); for (let y = 1; y <= 5 + i % 3; y++) stPut(x, SD + y, z, 17); for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (Math.abs(dx) + Math.abs(dz) < 4) stPut(x + dx, SD + 6 + i % 3, z + dz, 16); }
  stDoorOpen(L); stFrontText(L, 'GARDEN', y0 + 8, NEO('LIME'));
}
function bMaker(L, r) {                                                                                // MAKERSPACE: open workshop under a crane gantry, pipes and a forge glow
  const y0 = SD, H = 12;
  stTower(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0, y0 + H, { fl: 6, wall: MID('CORRUGATED METAL'), wall2: B.HAZ, corner: B.HULL, win: [B.WAMB], lit: .6, seed: 6, mode: 'strip', band: B.HAZ, bandEvery: 6, floorId: B.CONC, roof: MID('DIAMOND PLATE') });
  stDoorOpen(L); for (let x = L.x1 + 3; x < L.x2 - 2; x += 4) { stCounter(x, L.z1 + 3, x + 2, L.z1 + 3, MID('DIAMOND PLATE')); stPut(x + 1, SD + 3, L.z1 + 3, NEO('ORANGE')); }
  stBox(L.x1 + 2, y0 + 8, L.z1 + 2, L.x2 - 2, y0 + 8, L.z1 + 2, SH(B.STEEL, K.BEAMX)); stBox(L.x1 + 2, y0 + 8, L.z2 - 2, L.x2 - 2, y0 + 8, L.z2 - 2, SH(B.STEEL, K.BEAMX));
  stRoof(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0 + H, r); stFrontText(L, 'MAKERS', y0 + 7, NEO('ORANGE'));
}
function bVault(L, r) {                                                                                // GEM VAULT: a marble bank, columns and a gold door
  const y0 = SD, H = 16;
  stTower(L.x1 + 1, L.z1 + 1, L.x2 - 1, L.z2 - 1, y0, y0 + H, { fl: 8, wall: MID('MARBLE'), wall2: B.GOLD, corner: B.GOLD, win: [B.WWHT], lit: .3, seed: 8, mode: 'strip', band: B.GOLD, bandEvery: 8, floorId: MID('MARBLE'), roof: MID('MARBLE') });
  stDoorOpen(L); for (let x = L.x1 + 3; x < L.x2 - 2; x += 4) for (let y = SD + 1; y <= SD + 6; y++) stPut(x, y, L.z1 + 3, SH(MID('MARBLE'), K.PILLAR));
  stCounter(L.x1 + 3, L.z2 - 5, L.x2 - 3, L.z2 - 5, B.GOLD); stFrontText(L, 'VAULT', y0 + 9, B.GOLD);
}
// ============ the district table: which building goes where
const CITY = {                                                                                           // key = sx,sz,ix,iz  (sx +1 east / -1 west; sz +1 south / -1 north)
  '1,-1,0,0': [bStudio, 'ART STUDIOS'], '1,-1,1,0': [bMaker, 'MAKERSPACE'], '1,-1,0,1': [bGarden, 'GREENHOUSE'], '1,-1,1,1': [bStudio, 'STUDIOS'], '1,-1,0,2': [bStudio, 'LOFTS'], '1,-1,1,2': [bMaker, 'WORKSHOPS'], '1,-1,2,0': [bGarden, 'GARDEN'], '1,-1,2,1': [bMaker, 'MAKERS'],
  '1,1,1,0': [bCasino, 'BITJACK CASINO'], '1,1,0,1': [bMall, 'MALLWARE'], '1,1,1,1': [bPatch, 'PATCH CENTER'], '1,1,0,2': [bVault, 'GEM VAULT'], '1,1,1,2': [bMall, 'MARKET HALL'], '1,1,2,0': [bPatch, 'CLINIC'], '1,1,2,1': [bCasino, 'LUCKY'],
  '-1,-1,0,0': [bIT, 'THE IT'], '-1,-1,1,0': [bOverflow, 'THE OVERFLOW'], '-1,-1,2,0': [bDetention, 'GRIDLOCK DETENTION'], '-1,-1,0,1': [bOverflow, 'OVERFLOW'], '-1,-1,1,1': [bIT, 'ENFORCERS'], '-1,-1,0,2': [bOverflow, 'THE OVERFLOW'], '-1,-1,1,2': [bDetention, 'DETENTION'], '-1,-1,2,1': [bOverflow, 'FLATS'],
  '-1,1,0,0': [bOffice, 'CHAIN BLOCK'], '-1,1,1,0': [bExchange, 'BIT EXCHANGE'], '-1,1,0,1': [bServer, 'SERVER FARM'], '-1,1,1,1': [bOffice, 'CONFERENCE'], '-1,1,0,2': [bOffice, 'REGISTRY'], '-1,1,1,2': [bServer, 'DATA HALL'], '-1,1,2,0': [bExchange, 'EXCHANGE II'], '-1,1,2,1': [bServer, 'CLOUD DATA']
};
