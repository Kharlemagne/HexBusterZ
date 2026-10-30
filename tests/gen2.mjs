// Generation 2: floating islands + the Helicarrier. Generation 1 worlds keep their old terrain.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('floating islands and the Helicarrier');
{
  const g = await openGame({ width: 320, height: 200 }); const { page } = g; await startPlaying(page, 2);
  const r = await page.evaluate(() => { const P = __g.P; return { gen: __g.OW.gen, y: P.y, bio: __g.biomeAt(P.x, P.z), deck: __g.get(Math.floor(P.x), 104, Math.floor(P.z)) > 0, below: __g.get(Math.floor(P.x), 30, Math.floor(P.z)) }; });
  check('new worlds are generation 2 and spawn on the carrier deck', r.gen === 2 && r.deck && r.y > 104 && r.bio === 'THE HELICARRIER', JSON.stringify(r));
  const gate = await page.evaluate(() => { const r = __g.gatesNear(32, -56, 12)[0]; return r && { x: r.x, z: r.z, y: r.y }; });
  check('the Hellgate stands at the far front, away from the spawn', gate && gate.z < -40 && gate.y === 104, JSON.stringify(gate));
  const lava = await page.evaluate(() => { let n = 0; for (let y = 40; y < 90; y++) for (let x = -20; x < 90; x++) for (let z = 0; z < 120; z += 1) if (__g.get(x, y, z) === 30) n++; return n; });
  check('lava falls pour from the hull vents', lava > 20, 'cells ' + lava);
  const die = await page.evaluate(() => { const P = __g.P; P.x = 400.5; P.z = 400.5; P.y = 7; P.vy = 0; for (let i = 0; i < 30 && P.alive; i++) { __g.OW.update([{ x: P.x, z: P.z }], 50); __g.update(1 / 60); } return !P.alive || __g.mode() !== 'hub' || P.y > 100; });
  check('falling into the abyss kills you (or respawns you)', die);
  await g.close(); done(g.errors);
}
{
  const g = await openGame({ width: 320, height: 200 }); const { page } = g; await startPlaying(page, 1);
  const r = await page.evaluate(() => ({ gen: __g.OW.gen, bio: __g.biomeAt(__g.P.x, __g.P.z), y: __g.P.y }));
  check('generation 1 worlds still load as the old village', r.gen === 1 && r.bio === 'EMBER VILLAGE' && r.y < 12, JSON.stringify(r));
  await g.close(); done(g.errors);
}
