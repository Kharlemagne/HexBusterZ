// Realms v2: 8000-block world, Y -64..319 (stored +64), three rifts >= 2000 apart on the surface, black sea ring, edge waterfall, floating islands.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('realm v2');
const g = await openGame({ width: 320, height: 200 }); const { page } = g; await startPlaying(page);
const Y = (f, a) => page.evaluate(f, a);
const t0 = Date.now();
await Y(() => { __g.enterRealm('4821 -77'); });
const A = await Y(() => { const P = __g.P, L = __g.realmLayout(__g.WorldStore.cur.data.map.seed); return { gen: __g.OW.gen, H: __g.getH(), y: P.y, ok: P.alive, tear: L.tear, rifts: L.rifts, gates: __g.HUB.list.length, bio: __g.biomeAt(P.x, P.z, P.y), onTear: Math.hypot(P.x - L.tear.x, P.z - L.tear.z) }; });
console.log('  (entered in ' + (Date.now() - t0) + ' ms)');
check('the realm is 384 tall (Y -64..319) and has three rifts', A.gen === 4 && A.H === 384 && A.rifts.length === 3 && A.gates === 2, JSON.stringify(A));
check('you arrive at the rift you came through, standing on the surface', A.onTear < 14 && A.y > A.tear.y && A.y < A.tear.y + 3, JSON.stringify(A));
const d = (a, b) => Math.hypot(a.x - b.x, a.z - b.z), R = A.rifts;
check('every rift is at least 2000 blocks from every other', d(R[0], R[1]) >= 2000 && d(R[0], R[2]) >= 2000 && d(R[1], R[2]) >= 2000, JSON.stringify([d(R[0], R[1]), d(R[0], R[2]), d(R[1], R[2])]));
check('rifts are on dry land well above sea level (never underground or in a lake)', R.every(r => r.y > 126 + 2 && Math.abs(r.x) < 3000 && Math.abs(r.z) < 3000), JSON.stringify(R));
// the same coordinates always make the same rifts; other coordinates do not
const same = await Y(() => { const a = JSON.stringify(__g.realmLayout(__g.seedFromText('4821 -77')).rifts), b = JSON.stringify(__g.realmLayout(__g.seedFromText('1 2 3')).rifts), c = JSON.stringify(__g.realmLayout(__g.seedFromText('4821 -77')).rifts); return a === c && a !== b; });
check('same coordinates, same rifts; different coordinates, different rifts', same);
// terrain: land, sea and edge
const T = await Y(() => {
  const S = __g.WorldStore.cur.data.map.seed | 0, out = {};
  out.land = __g.realmCol(100, 100).h; out.coast = __g.realmCol(3050, 0).h; out.sea = __g.realmCol(3500, 0).h; out.shelf = __g.realmCol(3900, 0).h;
  out.names = [__g.biomeAt(0, 0), __g.biomeAt(3500, 0), __g.biomeAt(3995, 0)];
  return out;
});
check('past 3000 blocks the ground drops below sea level (Y 62 = stored 126)', T.sea < 126 && T.shelf < 126, JSON.stringify(T));
check('the sea ring is named THE BLACK SEA and the lip THE EDGE OF THE WORLD', /BLACK SEA/.test(T.names[1]) && /EDGE OF THE WORLD/.test(T.names[2]), JSON.stringify(T.names));
// generate chunks in the sea and at the edge and read the blocks
const W = await Y(() => {
  const OW = __g.OW; const gen = (x, z) => { OW.ensure(x >> 4, z >> 4); };
  gen(3500, 0); gen(3995, 0); gen(3999, 8); gen(4004, 0);
  return { sea: __g.get(3500, 126, 0), below: __g.get(3500, 110, 0), above: __g.get(3500, 127, 0), edge: __g.get(3995, 100, 0), edge2: __g.get(3995, 126, 0), out: __g.get(4004, 100, 0), isW: [__g.isWater(__g.get(3500, 126, 0)), __g.isLiquid(3608)] };
});
check('the black sea is water up to sea level, air above it', W.sea === 3600 && W.above === 0, JSON.stringify(W));
check('at the edge the water is falling water all the way down; past it there is nothing', W.edge === 3608 && W.edge2 === 3608 && W.out === 0, JSON.stringify(W));
// lakes: some basin on the land is filled with black water (or lava in the ash lands)
const lake = await Y(() => { const OW = __g.OW; let found = 0, lava = 0; for (let k = 0; k < 60 && !found; k++) { const x = 40 + k * 197, z = -900 + k * 61; OW.ensure(x >> 4, z >> 4); const c = __g.realmCol(x, z); if (c.h < 126) { const f = __g.get(x, 126, z); if (f === 3600 || f === 4) { found = f; } } } return found; });
check('land basins fill with black water (lava in the ash lands)', lake === 3600 || lake === 4, String(lake));
// floating islands at about Y 192 (stored 256), none above a rift
const sky = await Y(() => {
  const S = __g.WorldStore.cur.data.map.seed | 0, L = __g.realmLayout(S); let n = 0, ys = [], nearRift = 0;
  for (let cx = -4; cx <= 4; cx++) for (let cz = -4; cz <= 4; cz++) { const list = __g.skyIsles(cx * 640 + 320, cz * 640 + 320, S, 400); for (const I of list) { n++; ys.push(I.top); for (const r of L.rifts) if (Math.hypot(I.x - r.x, I.z - r.z) < 100) nearRift++; } }
  return { n, lo: Math.min(...ys), hi: Math.max(...ys), nearRift };
});
check('floating islands exist at about Y 192 (stored 256), and none sit over a rift', sky.n > 3 && sky.lo > 240 && sky.hi < 275 && sky.nearRift === 0, JSON.stringify(sky));
// walking onto the rift takes you home
const home = await Y(() => { const P = __g.P, T = __g.HUB.tear; P.x = T.x + .5; P.z = T.z + .5; P.y = T.y + 1.1; for (let i = 0; i < 5; i++) __g.update(1 / 60); return { gen: __g.OW.gen, map: __g.WorldStore.cur.data.map }; });
check('stepping into the rift brings you home to the ship', home.gen === 3 && home.map === null, JSON.stringify(home));
await g.close(); done(g.errors);
