// The Rift: console -> coordinates -> zap sequence -> a realm (same coordinates = same realm) -> the tear brings you home; stairs and neon rails.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('rift, realms, stairs and rails');
const g = await openGame({ width: 320, height: 200 }); const { page } = g; await startPlaying(page);
const near = await page.evaluate(() => { const P = __g.P; P.x = 14.5; P.z = 18.5; P.y = 81.01; __g.OW.update([{ x: 14.5, z: 18.5 }], 9000); __g.OW.pump(9000); P.vx = P.vy = P.vz = 0; for (let i = 0; i < 10; i++) __g.update(1 / 60); return __g.Rift.nearConsole(); });
check('standing at the console shows the rift prompt', near);
await page.evaluate(() => { __g.Rift.open(); });
check('using it opens the coordinate prompt', await page.evaluate(() => __g.state() === 'rift' && !!document.getElementById('rf-in')));
await page.fill('#rf-in', '4821 -77'); await page.press('#rf-in', 'Enter');
check('typing coordinates starts the sequence (coils charge)', await page.evaluate(() => __g.state() === 'play' && __g.Rift.phase === 'charge'));
const seen = await page.evaluate(() => { const ph = new Set(); for (let i = 0; i < 700; i++) { __g.update(1 / 60); ph.add(__g.Rift.phase); } return [...ph]; });
check('the sequence goes charge, zap, stabilise', ['charge', 'zap', 'stabilize'].every(p => seen.includes(p)), JSON.stringify(seen));
const A = await page.evaluate(() => { const P = __g.P, L = __g.HUB.list; return { gen: __g.OW.gen, y: P.y, ok: __g.P.alive, gates: L.length, seed: __g.WorldStore.cur.data.map.seed, layout: JSON.stringify(__g.realmLayout(__g.WorldStore.cur.data.map.seed).isl.map(i => [i.x, i.z, i.bi])), bio: __g.biomeAt(P.x, P.z, P.y) }; });
check('you arrive on the spawn island of a small realm with two Hellgates', A.gen === 4 && A.y > 79 && A.ok && A.gates === 2 && /RIFT 4821/.test(A.bio), JSON.stringify(A));
const same = await page.evaluate(() => __g.seedFromText('4821 -77') === __g.WorldStore.cur.data.map.seed && __g.seedFromText('4821 -77') !== __g.seedFromText('4821 -78'));
check('the same coordinates always give the same seed; different ones do not', same);
const all4 = await page.evaluate(() => { const s = new Set(__g.realmLayout(__g.WorldStore.cur.data.map.seed).isl.map(i => i.bi)); return s.size; });
check('every realm has all four biomes', all4 === 4, String(all4));
const build = await page.evaluate(() => { __g.setBlock(5, 81, 5, 33); __g.flushSave(); const r = __g.WorldStore.cur.data.realms[String(__g.WorldStore.cur.data.map.seed)]; return { inRealm: r.edits.length, inStation: __g.WorldStore.cur.data.edits.length }; });
check('what you build in a realm is saved with that realm, not the station', build.inRealm >= 1 && build.inStation === 0, JSON.stringify(build));
const home = await page.evaluate(() => { const P = __g.P, T = __g.HUB.tear; P.x = T.x + .5; P.z = T.z + .5; P.y = T.y + 1.1; for (let i = 0; i < 5; i++) __g.update(1 / 60); return { gen: __g.OW.gen, x: __g.P.x, z: __g.P.z, map: __g.WorldStore.cur.data.map }; });
check('stepping into the tear brings you back to the Rift Hall on the Helicarrier', home.gen === 3 && home.map === null && Math.abs(home.x - 14.5) < 2, JSON.stringify(home));
const again = await page.evaluate(() => { __g.enterRealm('4821 -77'); const r = __g.get(5, 81, 5); return { gen: __g.OW.gen, b: r }; });
check('going back to the same coordinates restores the same realm, including your build', again.gen === 4 && again.b === 33, JSON.stringify(again));
// stairs and neon rails (back on the station)
await page.evaluate(() => __g.leaveRealm());
const st = await page.evaluate(() => {
  const P = __g.P; for (let x = 40; x < 50; x++) for (let y = 81; y < 88; y++) for (let z = 98; z < 104; z++) __g.setBlock(x, y, z, 0);
  for (let i = 0; i < 4; i++) __g.setBlock(42 + i, 81 + i, 100, 80);
  P.x = 40.5; P.z = 100.5; P.y = 81.01; P.yaw = -Math.PI / 2; P.vx = P.vy = P.vz = 0; __g.keys.KeyW = true; let my = 0; for (let i = 0; i < 200; i++) { __g.update(1 / 60); my = Math.max(my, P.y); } __g.keys.KeyW = false;
  for (let x = 40; x < 48; x++) __g.setBlock(x, 81, 102, 144);
  P.x = 43.5; P.z = 100.6; P.y = 85; P.vx = P.vy = P.vz = 0; for (let i = 0; i < 60; i++) __g.update(1 / 60); const onStep = P.y;
  P.x = 43.5; P.z = 100.6; P.y = 81.01; P.yaw = 0; P.vx = P.vz = P.vy = 0; __g.keys.KeyS = true; for (let i = 0; i < 90; i++) __g.update(1 / 60); __g.keys.KeyS = false;
  return { my, onStep, z: P.z, stair: __g.stairKind(80), rail: __g.isRail(144) };
});
check('you can walk up stairs, one block per step', st.my > 84.9, JSON.stringify(st));
check('neon rails block you like a fence', st.z < 101.9, JSON.stringify(st));
await g.close(); done(g.errors);
