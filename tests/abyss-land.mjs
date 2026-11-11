// The Abyss map itself: same map every time, its own blocks and four biomes, stick-mob trees, the rear-cone render, and no day/night.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('abyss land');
const g = await openGame({ width: 480, height: 270 }); const { page } = g; await startPlaying(page);
const Y = (f, a) => page.evaluate(f, a);
await Y(() => { __g.enterRealm('4821 -77'); __g.enterAbyss(); });
const same = await Y(() => { const A = __g.Abyss, S = A.seed(); const a = __g.abyssH(120, -40, S); A.stop(); __g.enterAbyss(); return { a, b: __g.abyssH(120, -40, __g.Abyss.seed()) }; });
check('every entry lands in the same Abyss (same terrain for the first layout)', same.a === same.b, JSON.stringify(same));
const land = await Y(() => {
  const G = __g, S = G.Abyss.seed(), names = new Set(); let figs = 0, stickBlocks = 0, ids = new Set();
  for (let x = -1800; x <= 1800; x += 150) for (let z = -1800; z <= 1800; z += 150) names.add(G.abyssBiomeName(x, z));
  G.OW.update([{ x: 0, z: 0 }], 20000); G.OW.pump(20000);
  for (let x = -60; x < 60; x++) for (let z = -60; z < 60; z++) for (let y = 40; y < 130; y++) { const id = G.get(x, y, z); if (id >= 315) { ids.add(id); if (id === G.AB.STICK) stickBlocks++; } }
  return { biomes: [...names].sort(), ids: [...ids].sort(), stickBlocks };
});
check('all four Abyss biomes exist', land.biomes.length === 4, JSON.stringify(land.biomes));
check('the Abyss uses its own blocks (silt, gloomstone, strata ...)', land.ids.length >= 2, JSON.stringify(land.ids));
const fig = await Y(() => {
  const G = __g, S = G.Abyss.seed(); let best = null;
  for (let cx = -20; cx <= 20 && !best; cx++) for (let cz = -20; cz <= 20 && !best; cz++) { const out = []; G.abyssFigures(cx, cz, S, out); if (out.length && out[0].w[1] > .6) best = out[0]; }
  if (!best) return null;
  G.OW.update([{ x: best.x, z: best.z }], 20000); G.OW.pump(20000);
  let top = 0, bot = 1e9, gapMid = true; for (let y = 1; y < 380; y++) if (G.get(best.x, y, best.z) === G.AB.STICK || G.get(best.x - 1, y, best.z) === G.AB.STICK || G.get(best.x, y, best.z - 1) === G.AB.STICK) { top = Math.max(top, y); bot = Math.min(bot, y); }
  return { x: best.x, z: best.z, height: top - bot + 1, ax: best.ax, L: best.L };
});
check('a stick mob is a tall figure (10+ blocks) built out of STICKWOOD', fig && fig.height >= 10, JSON.stringify(fig));
check('there is no day/night cycle in the Abyss: the clock never changes and no changeover starts', await Y(() => { const D = __g.DayNight; D.idle = 0; const ph = D.phase; for (let i = 0; i < 40; i++) D.tick(1); return D.ev === null && D.phase === ph; }));
// the cone render: behind you the world is 4 blocks deep; turn round and it re-forms outward from 4 blocks
const cone = await Y(() => { const A = __g.Abyss, P = __g.P; P.yaw = 0; A.rev.fill(1e5); A.coneStep(.016); const behind = A.rev[16], ahead = A.rev[0];       // yaw 0: forward is -z, behind is +z (sector 4 of 16)
  let nBack = 0, nFront = 0; for (let i = 0; i < 32; i++) { if (A.rev[i] === 4) nBack++; else if (A.rev[i] > 5e4) nFront++; }
  P.yaw = Math.PI; A.coneStep(.016); const turned = Array.from(A.rev); let grew = 0; for (let k = 0; k < 15; k++) A.coneStep(.016); const later = Array.from(A.rev);
  return { nBack, nFront, grewSomewhere: later.some((v, i) => v > turned[i] && turned[i] < 1e4 && v > 4), minNow: Math.min(...later) }; });
check('the 5-7 o\'clock wedge behind you is cut down to 4 blocks (about 5 of 32 sectors)', cone.nBack >= 4 && cone.nBack <= 7 && cone.nFront >= 24, JSON.stringify(cone));
check('after turning round the sectors you now face come back outward from 4 blocks', cone.grewSomewhere && cone.minNow === 4, JSON.stringify(cone));
await Y(() => { const P = __g.P; P.x = 0.5; P.z = 0.5; P.y = __g.topY(0, 0, 380) + 2; P.yaw = 0; P.pitch = -.05; __g.Abyss.phase = 'walk'; __g.Abyss.rev.fill(1e5); for (let i = 0; i < 10; i++) __g.update(1 / 60); });
await page.screenshot({ path: '/tmp/ab_front.png', timeout: 120000 });
await Y(() => { __g.P.yaw = Math.PI; });
await page.screenshot({ path: '/tmp/ab_turn.png', timeout: 120000 });
check('frames render in the Abyss with the cone on', true);
await g.close(); done(g.errors);
