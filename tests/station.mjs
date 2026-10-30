// Generation 3: the Helicarrier as its own map, a space station with a city, half blocks, no day/night.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('the space station');
const g = await openGame({ width: 320, height: 200 }); const { page } = g; await startPlaying(page);
const r = await page.evaluate(() => { const P = __g.P; return { gen: __g.OW.gen, y: P.y, ok: P.onGround || P.y < 83, bio: __g.biomeAt(P.x, P.z, P.y), deck: __g.get(Math.floor(P.x), 80, Math.floor(P.z)), clock: __g.DayNight.clock() }; });
check('new worlds are generation 3 and spawn on the station dock', r.gen === 3 && r.y > 80.5 && r.y < 83 && /HELICARRIER/.test(r.bio) && r.deck === 37, JSON.stringify(r));
check('there is no day and night out here', r.clock === 'IN TRANSIT');
const sky = await page.evaluate(() => { const D = __g.DayNight; for (let i = 0; i < 400; i++) D.tick(1); return { ev: !!D.ev, s: D.state(0, 0).sunV.join() + D.state(0, 0).moonV.join() }; });
check('sun and moon events never start', !sky.ev && sky.s === '0,00,0,0,0', JSON.stringify(sky));
const gate = await page.evaluate(() => { const g = __g.gatesNear(0, -100, 12)[0]; return g && { x: g.x, z: g.z, y: g.y }; });
check('the Hellgate stands at the far front, 200 blocks from the dock', gate && gate.z === -104 && gate.y === 80, JSON.stringify(gate));
// half blocks: slab physics
const slab = await page.evaluate(() => {
  const P = __g.P; for (let x = 12; x < 20; x++) { __g.setBlock(x, 81, 100, 0); } __g.setBlock(12, 81, 100, 0);
  __g.setBlock(14, 81, 100, 49); __g.setBlock(15, 81, 100, 33);                                         // concrete half block, then a full one
  P.x = 13.5; P.z = 100.5; P.y = 81.01; P.yaw = -Math.PI / 2; P.vx = P.vy = P.vz = 0; __g.keys.KeyW = true; let maxY = 0; for (let i = 0; i < 90; i++) { __g.update(1 / 60); maxY = Math.max(maxY, P.y); } __g.keys.KeyW = false;
  const dropA = (() => { P.x = 14.5; P.z = 100.5; P.y = 83; P.vx = P.vz = P.vy = 0; for (let i = 0; i < 60; i++) __g.update(1 / 60); return P.y; })();
  return { maxY, dropA, kind: __g.slabKind(49), top: __g.slabKind(65), full: __g.slabKind(33) };
});
check('a half block is half a block tall: you stand on it at +0.5 and walk up onto the next block', slab.dropA > 81.45 && slab.dropA < 81.6 && slab.maxY > 81.9, JSON.stringify(slab));
check('slab kinds: 49 is a bottom slab, 65 a top slab, 33 a full block', slab.kind === 1 && slab.top === 2 && slab.full === 0);
const stairs = await page.evaluate(() => {
  const P = __g.P; P.x = 14.5; P.y = 81.01; P.z = 3.5; P.yaw = -Math.PI / 2; P.vx = P.vy = P.vz = 0; __g.OW.update([{ x: P.x, z: P.z }], 9000); __g.OW.pump(9000);
  __g.keys.KeyW = true; let maxY = 0; for (let i = 0; i < 400; i++) { __g.update(1 / 60); maxY = Math.max(maxY, P.y); } __g.keys.KeyW = false; return maxY;
});
check('you can walk up the half-block stairway to the elevated rail (+14)', stairs > 94.9, String(stairs));
const lift = await page.evaluate(() => { const P = __g.P; P.x = 0; P.z = 0; P.y = 81.2; P.vy = 0; P.vx = P.vz = 0; __g.OW.update([{ x: 0, z: 0 }], 9000); __g.OW.pump(9000); let m = 0; for (let i = 0; i < 200; i++) { __g.update(1 / 60); m = Math.max(m, P.y); } return m; });
check('the core lift carries you up past the canopy', lift > 120, String(lift));
const edge = await page.evaluate(() => { const P = __g.P; P.x = 140; P.z = 0; P.y = 83; P.vy = 0; P.vx = 0; for (let i = 0; i < 400 && P.alive; i++) __g.update(1 / 60); return !P.alive || __g.mode() !== 'hub'; });
check('stepping off the station into space is death', edge);
await g.close(); done(g.errors);
