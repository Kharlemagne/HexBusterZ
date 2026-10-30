// Minecraft-style lava: spreads 3 blocks, falls, fills holes you dig, dries up when its source is removed, and meshes without cracks.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('lava physics');
const g = await openGame({ width: 320, height: 200 }); const { page } = g; await startPlaying(page, 2);
const run = n => page.evaluate(n => { for (let i = 0; i < n; i++) __g.Fluid.tick(.25); return __g.Fluid.q.size; }, n);
await page.evaluate(() => { for (let x = 24; x < 48; x++) for (let z = 110; z < 126; z++) { __g.setBlock(x, 104, z, 3); __g.setBlock(x, 103, z, 3); for (let y = 105; y < 112; y++) __g.setBlock(x, y, z, 0); } __g.Fluid.reset(); __g.P.x = 30.5; __g.P.z = 118.5; __g.P.y = 106; __g.setBlock(30, 105, 118, 4); });
await run(30);
const row = await page.evaluate(() => [30, 31, 32, 33, 34].map(x => __g.get(x, 105, 118)));
check('a source spreads 3 blocks, getting thinner (4,27,25,23,air)', JSON.stringify(row) === JSON.stringify([4, 27, 25, 23, 0]), JSON.stringify(row));
await page.evaluate(() => __g.setBlock(31, 104, 118, 0));                                       // dig out the floor under the flow
await run(40);
const hole = await page.evaluate(() => ({ a: __g.get(31, 104, 118), b: __g.get(31, 103, 118) }));
check('digging under lava makes it fall into the hole and keep falling', hole.a === 30, JSON.stringify(hole));
await page.evaluate(() => __g.setBlock(30, 105, 118, 0));                                      // pull the source away
await run(80);
const dry = await page.evaluate(() => { let n = 0; for (let x = 24; x < 38; x++) for (let y = 95; y < 110; y++) for (let z = 112; z < 125; z++) if (__g.isLava(__g.get(x, y, z))) n++; return n; });
check('flow dries up once its source is gone', dry === 0, 'left ' + dry);
const q = await run(5); check('the simulation goes back to sleep when nothing changes', q === 0, 'queue ' + q);
// a lone source on the deck next to the world edge must not wake the whole world; sources baked into worlds stay still
const idle = await page.evaluate(() => { const n0 = __g.Fluid.steps; for (let i = 0; i < 40; i++) __g.Fluid.tick(.25); return __g.Fluid.steps - n0; });
check('untouched lava (vent falls) does nothing', idle === 0);
// meshing: lava next to a wall keeps the wall; lava under a ceiling draws its lowered top
const mesh = await page.evaluate(() => {
  __g.setBlock(44, 105, 118, 4); __g.setBlock(45, 105, 118, 14); __g.setBlock(44, 106, 118, 14);
  for (let i = 0; i < 4; i++) __g.OW.pump(50); __g.renderFrame(.016); return !!__g.meshes.size;
});
check('lava beside a wall and under a ceiling still renders', mesh);
const h = await page.evaluate(() => [__g.lavaCorner(44, 105, 118), __g.lavaCorner(45, 105, 119), __g.lavaCorner(44, 105, 118) < 1]);
check('lava corner heights are sensible (below a full block, above zero)', h[0] > .1 && h[0] < 1 && h[2]);
await g.close(); done(g.errors);
