// Multiplayer depends on this: one seed must rebuild the exact same world, layout and boss on every machine.
import { openGame, check, done } from './lib.mjs';
console.log('determinism');
const g = await openGame(); const { page } = g;
const snap = seed => page.evaluate(seed => {
  __g.enterDungeon(seed);
  let h = 2166136261; const n = N * N * H; for (let i = 0; i < n; i++) { h ^= world[i]; h = Math.imul(h, 16777619); }
  const layout = __g.Run.rooms.map(r => `${r.gx},${r.gz},${r.type},${Object.keys(r.doors).sort().join('')},${r.chest ? 1 : 0}`).join(';');
  const b = __g.Run.rooms.find(r => r.type === 'boss'); const e = __g.spawnBoss(b.ox + 32, 5.1, b.oz + 24);
  return { hash: h >>> 0, layout, boss: e.bossName + ':' + e.pieces.map(p => p.atk).join('-'), turrets: __g.Run.turrets.length };
}, seed);
const seeds = [1, 2, 12345, 987654321];
const results = {};
for (const s of seeds) { const a = await snap(s); const b = await snap(s); results[s] = a;
  check(`seed ${s}: world identical`, a.hash === b.hash); check(`seed ${s}: layout identical`, a.layout === b.layout); check(`seed ${s}: boss + attacks identical (${a.boss})`, a.boss === b.boss); }
check('different seeds give different worlds', new Set(seeds.map(s => results[s].hash)).size === seeds.length);
check('different seeds give different layouts', new Set(seeds.map(s => results[s].layout)).size >= 3);
const ow = async (seed, x0, x1, z0, z1, Y1 = 150, Y0 = 0) => page.evaluate(([seed, x0, x1, z0, z1, Y1, Y0]) => { __g.genHub(seed, 32.5, 44.5); let h = 2166136261; for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) for (let y = Y0; y < Y1; y++) { h ^= Y0 ? (get(x, y, z) > 0 ? 1 : 0) : get(x, y, z); h = Math.imul(h, 16777619); } return h >>> 0; }, [seed, x0, x1, z0, z1, Y1, Y0]);
check('open world identical for the same seed', (await ow(777, -30, 100, -30, 100)) === (await ow(777, -30, 100, -30, 100)));
check('open world differs between seeds', (await ow(777, -30, 100, -30, 100)) !== (await ow(778, -30, 100, -30, 100)));
check('the Helicarrier deck is identical for every seed', (await ow(777, 8, 57, 60, 110, 105, 98)) === (await ow(123456, 8, 57, 60, 110, 105, 98)) && (await ow(5, 8, 57, 60, 110, 105, 98)) === (await ow(777, 8, 57, 60, 110, 105, 98)));
check('the land far from the village changes with the seed', (await ow(777, 80, 112, 80, 112, 90)) !== (await ow(123456, 80, 112, 80, 112, 90)));
// 200 random seeds must all produce a playable layout (boss 2x2 block, treasure room, 10 rooms)
const bad = await page.evaluate(() => { let bad = 0; for (let i = 0; i < 200; i++) { setWorldSeed(i * 7919 + 13); const L = layoutDungeon(); if (!L || L.list.length !== 10 || !L.list.some(r => r.type === 'boss' && r.sz === 64) || !L.list.some(r => r.type === 'treasure')) bad++; } return bad; });
check('200 seeds -> 200 valid layouts', bad === 0, bad + ' invalid');
await g.close(); done(g.errors);
