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
check('40 new materials (16 concrete, 16 neon, 8 industrial) are in the palette', R.mats === 40);
const T = await page.evaluate(() => {
  const P = __g.P, o = {}; const clear = () => { for (let x = 40; x < 48; x++) for (let y = 81; y < 90; y++) for (let z = 98; z < 106; z++) __g.setBlock(x, y, z, 0); };
  clear(); const walk = (id, n) => { clear(); for (let z = 99; z <= 101; z++) __g.setBlock(44, 81, z, id); P.x = 41.5; P.z = 100.5; P.y = 81.01; P.vx = P.vy = P.vz = 0; P.yaw = -Math.PI / 2; __g.keys.KeyW = true; let my = 0; for (let i = 0; i < n; i++) { __g.update(1 / 60); my = Math.max(my, P.y); } __g.keys.KeyW = false; return [+P.x.toFixed(2), +my.toFixed(2)]; };
  o.vslabHit = walk(__g.blockId(272, 4, 0), 120);                       // a vertical slab filling the far (+x) half of the cell
  o.wall = walk(__g.blockId(33, 5), 120); o.pillar = walk(__g.blockId(33, 6), 120); o.fence = walk(__g.blockId(33, 9), 120);
  o.pane = walk(__g.blockId(256, 10), 120);
  o.beam = walk(__g.blockId(260, 7), 120);
  return o;
});
check('walls, fences, pillars and panes stop you; a vertical slab stops you only after half a block', T.wall[0] < 44.0 && T.fence[0] < 44.15 && T.pillar[0] < 44.0 && T.pane[0] < 44.25 && T.vslabHit[0] > 44.1 && T.vslabHit[0] < 44.35 && T.beam[0] < 43.8, JSON.stringify(T));
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
await g.close(); done(g.errors);
