// Black water follows the Minecraft rules: spreads 7 blocks, falls, makes infinite sources, meets lava (obsidian / basalt), and you can swim in it.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('black water');
const g = await openGame({ width: 320, height: 200 }); const { page } = g; await startPlaying(page, 2);
const Y = (f, a) => page.evaluate(f, a);
const run = n => Y(n => { for (let i = 0; i < n; i++) __g.Fluid.tick(.25); return __g.Fluid.q.size; }, n);
await Y(() => { for (let x = 24; x < 60; x++) for (let z = 110; z < 130; z++) { __g.setBlock(x, 104, z, 3); __g.setBlock(x, 103, z, 3); for (let y = 105; y < 112; y++) __g.setBlock(x, y, z, 0); } __g.Fluid.reset(); __g.setBlock(30, 105, 118, 3600); });
await run(60);
const row = await Y(() => [30, 31, 32, 33, 34, 35, 36, 37, 38].map(x => __g.get(x, 105, 118)));
check('a source spreads 7 blocks, one level thinner each (3600, 3607..3601, then nothing)', JSON.stringify(row) === JSON.stringify([3600, 3606, 3605, 3604, 3603, 3602, 3601, 0, 0]), JSON.stringify(row));
// infinite water: two sources with a gap between them (over a solid floor) fill the gap with a third source
await Y(() => { for (let x = 24; x < 60; x++) for (let y = 105; y < 108; y++) __g.setBlock(x, y, 125, 0); __g.setBlock(40, 105, 125, 3600); __g.setBlock(42, 105, 125, 3600); });
await run(30);
check('two sources with a gap between them make a new source (infinite water)', await Y(() => __g.get(41, 105, 125)) === 3600);
// fall
await Y(() => { __g.setBlock(30, 104, 118, 0); __g.setBlock(30, 103, 118, 0); });
await run(40);
check('digging out the floor under a source makes it pour down', await Y(() => __g.get(30, 104, 118)) === 3608);
// it dries up when the source goes
await Y(() => { __g.setBlock(40, 105, 125, 0); __g.setBlock(42, 105, 125, 0); __g.setBlock(41, 105, 125, 0); __g.setBlock(30, 105, 118, 0); });
await run(120);
const dry = await Y(() => { let n = 0; for (let x = 24; x < 60; x++) for (let y = 95; y < 110; y++) for (let z = 108; z < 130; z++) if (__g.isWater(__g.get(x, y, z))) n++; return n; });
check('flowing water dries up once its source is gone', dry === 0, 'left ' + dry);
// water meets lava
await Y(() => { for (let x = 24; x < 60; x++) for (let z = 108; z < 130; z++) for (let y = 105; y < 108; y++) __g.setBlock(x, y, z, 0); __g.Fluid.reset(); __g.setBlock(50, 105, 118, 4); __g.setBlock(52, 105, 118, 3600); __g.setBlock(46, 105, 120, 4); });
await run(40);
const obs = await Y(() => ({ srcNext: __g.get(50, 105, 118), a: __g.get(51, 105, 118), lava2: __g.get(46, 105, 120) }));
check('water flowing onto a lava source turns it to obsidian', obs.srcNext === 3 || obs.a === 3 || obs.a === 1, JSON.stringify(obs));
// swimming
await Y(() => { for (let x = 20; x < 24; x++) for (let z = 112; z < 118; z++) for (let y = 105; y < 112; y++) __g.setBlock(x, y, z, 0); });
const sw = await Y(() => {
  for (let x = 20; x < 24; x++) for (let z = 112; z < 118; z++) { __g.setBlock(x, 104, z, 3); for (let y = 105; y < 109; y++) __g.setBlock(x, y, z, 3600); }
  const P = __g.P; P.x = 21.5; P.z = 114.5; P.y = 108.5; P.vx = P.vy = P.vz = 0; let minVy = 0; const hp0 = P.hp;
  for (let i = 0; i < 40; i++) { __g.update(1 / 60); minVy = Math.min(minVy, P.vy); } const y1 = P.y;
  __g.keys.Space = true; for (let i = 0; i < 40; i++) __g.update(1 / 60); __g.keys.Space = false;
  return { minVy, y1, y2: P.y, hurt: hp0 - P.hp };
});
check('you sink slowly in black water, it does not hurt, and holding jump swims up', sw.minVy > -5 && sw.hurt === 0 && sw.y2 > sw.y1, JSON.stringify(sw));
await g.close(); done(g.errors);
