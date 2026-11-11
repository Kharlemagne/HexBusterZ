// The block registry: 16-bit ids, every material gets its shapes, ids never collide, shapes behave (collision, placing, drops), old ids still mean what they meant.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('block registry');
const g = await openGame({ width: 320, height: 200 }); const { page } = g; await startPlaying(page);
const R = await page.evaluate(() => {
  const out = {}; const seen = new Set(); let dup = 0, noCol = 0, n = 0;
  for (const b of __g.BASEIDS()) for (let k = 1; k <= 10; k++) for (let d = 0; d < (k === 3 || k === 4 ? 4 : 1); d++) { const id = __g.blockId(b, k, d); if (id === b) continue; n++; if (seen.has(id)) dup++; seen.add(id); if (__g.BASE[id] !== b || __g.KIND[id] !== k) out.bad = [b, k, d, id]; if (!COL[id]) noCol++; }
  out.n = n; out.dup = dup; out.noCol = noCol; out.max = Math.max(...seen);
  out.legacy = [__g.blockId(32, 1), __g.blockId(32, 2), __g.blockId(33, 3, 2), __g.KIND[144], __g.BASE[148]];
  out.mats = __g.MATS.length; out.chunk16 = OW.chunks.values().next().value.b instanceof Uint16Array;
  return out;
});
check('chunks store 16-bit ids', R.chunk16);
check('every material has its shapes, all ids unique, all with a colour', R.dup === 0 && !R.bad && R.noCol === 0 && R.n >= 1200, JSON.stringify(R));
check('the original slab, stair and rail ids still mean the same thing', JSON.stringify(R.legacy) === JSON.stringify([48, 64, 80 + 4 + 2, 11, 43]), JSON.stringify(R.legacy));
check('65 materials (the originals, the bridge and console kits, and the six Abyss blocks) are in the palette', R.mats === 65);
const T = await page.evaluate(() => {
  const P = __g.P, o = {}; const clear = () => { for (let x = 10; x < 18; x++) for (let y = 81; y < 90; y++) for (let z = 98; z < 106; z++) __g.setBlock(x, y, z, 0); };
  clear(); const walk = (id, n) => { clear(); for (let z = 99; z <= 101; z++) __g.setBlock(14, 81, z, id); P.x = 11.5; P.z = 100.5; P.y = 81.01; P.vx = P.vy = P.vz = 0; P.yaw = -Math.PI / 2; __g.keys.KeyW = true; let my = 0; for (let i = 0; i < n; i++) { __g.update(1 / 60); my = Math.max(my, P.y); } __g.keys.KeyW = false; return [+P.x.toFixed(2), +my.toFixed(2)]; };
  o.vslabHit = walk(__g.blockId(272, 4, 0), 120);                       // a vertical slab filling the far (+x) half of the cell
  o.wall = walk(__g.blockId(33, 5), 120); o.pillar = walk(__g.blockId(33, 6), 120); o.fence = walk(__g.blockId(33, 9), 120);
  o.pane = walk(__g.blockId(256, 10), 120);
  o.beam = walk(__g.blockId(260, 7), 120);
  return o;
});
check('walls, fences, pillars and panes stop you; a vertical slab stops you only after half a block', T.wall[0] < 14.0 && T.fence[0] < 14.15 && T.pillar[0] < 14.0 && T.pane[0] < 14.25 && T.vslabHit[0] > 14.1 && T.vslabHit[0] < 14.35 && T.beam[0] < 13.8, JSON.stringify(T));
const P2 = await page.evaluate(() => {
  const P = __g.P; const inv = __g.Inv; inv.creative = true; inv.slots[0] = { k: 33, n: 99 }; inv.sel = 0; __g.switchWeapon(4);
  const before = __g.P.shape; __g.cycleShape(); __g.cycleShape(); const names = [P.shape];
  for (let x = 40; x < 48; x++) for (let y = 81; y < 90; y++) for (let z = 98; z < 106; z++) __g.setBlock(x, y, z, 0); __g.setBlock(44, 81, 100, 33);
  P.x = 41.5; P.z = 100.5; P.y = 82.2; P.yaw = -Math.PI / 2; P.pitch = -.55; P.vx = P.vy = P.vz = 0; __g.OW.pump(9000);
  __g.mouse.r = true; for (let i = 0; i < 10; i++) __g.update(1 / 60); __g.mouse.r = false;
  const placed = __g.get(44, 82, 100) || __g.get(43, 81, 100) || __g.get(43, 82, 100);
  return { shape: P.shape, placed, kind: __g.KIND[placed], drop: [__g.blockId(33, 3, 0), __g.BASE[__g.blockId(33, 3, 0)]] };
});
check('V cycles the shape and the dig kit places that shape (stairs)', P2.shape === 2 && P2.kind === 3, JSON.stringify(P2));
const lt = await page.evaluate(() => {
  const P = __g.P; __g.OW.update([{ x: 60, z: 100 }], 9000); __g.OW.pump(9000);
  for (let x = 56; x < 66; x++) for (let y = 81; y < 90; y++) for (let z = 96; z < 106; z++) __g.setBlock(x, y, z, 0);
  const f = (x, y, z) => { const L = computeLight(x >> 4, z >> 4, 100); if (!L) return null; const i = ((y * L.W) + (z - L.z0)) * L.W + (x - L.x0); return [L.R[i], L.G[i], L.B[i]]; };
  const none = f(60, 83, 100); __g.setBlock(60, 83, 100, 14);                        // a cyan neon block
  const near = f(62, 83, 100), far = f(70, 83, 100), mix = (__g.setBlock(64, 83, 100, 15), f(63, 83, 100));
  return { none, near, far, mix, em: OW.chunks.get(ckey(60 >> 4, 100 >> 4)).em };
});
check('a neon block throws coloured light that fades with distance', lt.em && lt.near && lt.near[2] > lt.near[0] && lt.near[2] > 3 && (!lt.far || lt.far[2] < lt.near[2]), JSON.stringify(lt));
check('two neon colours mix between them (cyan + magenta gives both red and blue)', lt.mix && lt.mix[0] > 2 && lt.mix[2] > 2, JSON.stringify(lt.mix));
const sc = await page.evaluate(() => {
  __g.OW.update([{ x: 32, z: 100 }], 20000); for (let x = 28; x < 38; x++) for (let y = 81; y < 90; y++) for (let z = 96; z < 104; z++) __g.setBlock(x, y, z, 0);
  const A = __g.screenId(0, 2), Bt = __g.screenId(1, 2);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) __g.setBlock(30 + i, 82 + j, 98, A);
  __g.setBlock(33, 82, 98, A); __g.setBlock(34, 82, 98, Bt);
  const sq = __g.screenRun(30, 82, 98, A), top = __g.screenRun(31, 83, 98, A), lone = __g.screenRun(33, 82, 98, A), other = __g.screenRun(34, 82, 98, Bt);
  const P = __g.P; P.x = 30.5; P.z = 100.5; P.y = 82.01; P.yaw = 0; P.vx = P.vy = P.vz = 0; __g.keys.KeyW = true; for (let i = 0; i < 100; i++) __g.update(1 / 60); __g.keys.KeyW = false;
  return { sq, top, lone, other, stop: P.z, full: __g.isFull(A), names: __g.MATS && [0, 4, 8, 12].map(t => DATA.blocks.names[3000 + t]) };
});
check('two by two identical monitors merge into one 2x2 screen, each block knowing its place', sc.sq.W === 2 && sc.sq.H === 2 && sc.sq.i === 0 && sc.sq.j === 0 && sc.top.i === 1 && sc.top.j === 1, JSON.stringify([sc.sq, sc.top]));
check('a lone monitor, or one next to a different type, stays 1x1', sc.lone.W === 1 && sc.lone.H === 1 && sc.other.W === 1 && sc.other.H === 1, JSON.stringify([sc.lone, sc.other]));
check('monitors are solid blocks and have their four names', sc.full && sc.stop > 98.9 && sc.names.join() === 'ALPHA-SCREEN,BETA-SCREEN,GAMMA-SCREEN,DELTA-SCREEN', JSON.stringify(sc));
const mg = await page.evaluate(() => {
  __g.OW.update([{ x: 32, z: 100 }], 20000); const A = __g.screenId(2, 2), put = (x, y) => __g.setBlock(x, y, 98, A);
  for (let x = 24; x < 38; x++) for (let y = 81; y < 96; y++) __g.setBlock(x, y, 98, 0);
  const R = (x, y) => { const r = __g.screenRun(x, y, 98, A); return [r.i, r.j, r.W, r.H]; };
  put(24, 82); put(25, 82); put(24, 83);                                                     // an L
  const L = [R(24, 82), R(25, 82), R(24, 83)];
  for (let x = 28; x < 31; x++) put(x, 82);                                                  // a row of three
  const row = [R(28, 82), R(29, 82), R(30, 82)];
  for (let x = 30; x < 40; x++) for (let y = 86; y < 96; y++) if (x < 38) put(x, y);        // a 8 x 10 slab
  const slab = [R(30, 86), R(37, 95)];
  const wide = []; for (let x = 24; x < 38; x++) __g.setBlock(x, 82, 96, A); const R2 = x => { const r = __g.screenRun(x, 82, 96, A); return [r.i, r.j, r.W, r.H]; }; wide.push(R2(24), R2(35), R2(33));
  return { L, row, slab, wide };
});
check('an L of monitors is not merged: the pair joins and the odd one stays alone', JSON.stringify(mg.L) === JSON.stringify([[0, 0, 2, 1], [1, 0, 2, 1], [0, 0, 1, 1]]), JSON.stringify(mg.L));
check('three in a row: two merge, the third waits on its own', JSON.stringify(mg.row) === JSON.stringify([[0, 0, 2, 1], [1, 0, 2, 1], [0, 0, 1, 1]]), JSON.stringify(mg.row));
check('a big wall merges in even sizes up to ten (8 wide x 10 high is one screen)', JSON.stringify(mg.slab) === JSON.stringify([[0, 0, 8, 10], [7, 9, 8, 10]]), JSON.stringify(mg.slab));
check('a row longer than ten is cut into tiles of at most ten', mg.wide[0][2] === 10 && mg.wide[1][2] === 4 && mg.wide[1][0] === 1 && mg.wide[2][2] === 10, JSON.stringify(mg.wide));
await g.close(); done(g.errors);
