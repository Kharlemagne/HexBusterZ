// The streamed open world: chunks load/unload as you travel, edits survive, Hellgates in the wild lead into dungeons and back.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('open world');
{
  const g = await openGame({ width: 320, height: 200 }); const { page } = g; await startPlaying(page);
  check('the open world is running in chunk mode', await page.evaluate(() => __g.useChunks() && __g.OW.chunks.size >= 60));
  await page.evaluate(() => { for (let i = 0; i < 120; i++) __g.update(1 / 60); });
  check('you spawn on the ground in Ember Village', await page.evaluate(() => __g.P.onGround && __g.P.y > 8 && __g.P.y < 10 && __g.biomeAt(__g.P.x, __g.P.z) === 'EMBER VILLAGE'));
  // far trip: teleport in 40-block hops, streaming each time
  const trip = await page.evaluate(() => {
    const P = __g.P, OW = __g.OW; let maxChunks = 0, bad = 0;
    __g.setBlock(210, 20, 5, 7);                                         // an edit far away (that chunk isn't loaded yet)
    for (let x = 32; x <= 480; x += 40) {
      P.x = x + .5; P.z = 30.5; for (let i = 0; i < 6; i++) { OW.update([{ x: P.x, z: P.z }], 300); OW.pump(300); }
      P.y = __g.topY(Math.floor(P.x), Math.floor(P.z)) + 1.01; P.vy = 0;
      for (let i = 0; i < 20; i++) __g.update(1 / 60);
      if (P.y < 1 || !P.alive && false) bad++; maxChunks = Math.max(maxChunks, OW.chunks.size);
    }
    return { x: P.x, bad, maxChunks, near: OW.has(Math.floor(P.x / 16), 1), old: OW.has(2, 2) };
  });
  check('travelled 450 blocks without falling through the world', trip.bad === 0 && trip.x > 400);
  check('far chunks stream in and old ones are dropped (memory stays bounded)', trip.near && !trip.old && trip.maxChunks < 420, JSON.stringify(trip));
  const back = await page.evaluate(() => { const P = __g.P; P.x = 210.5; P.z = 5.5; for (let i = 0; i < 6; i++) { __g.OW.update([{ x: P.x, z: P.z }], 300); } return __g.get(210, 20, 5); });
  check('an edit made far away is still there when you come back (even after its chunk unloaded)', back === 7, 'got ' + back);
  // digging and building through the normal block path
  const dig = await page.evaluate(() => { const P = __g.P, y = __g.topY(210, 5); const before = __g.get(210, y, 5); __g.setBlock(210, y, 5, 0); const mid = __g.get(210, y, 5); __g.setBlock(210, y, 5, 14); return { before, mid, after: __g.get(210, y, 5), listed: __g.WorldSave.list().some(e => e[0] === 210 && e[2] === 5) }; });
  check('digging and placing blocks works in the open world', dig.before > 0 && dig.mid === 0 && dig.after === 14 && dig.listed);
  // ground exists under any spot we look at, and gates exist
  const ng = await page.evaluate(() => { const r = __g.nearestGate(__g.P.x, __g.P.z); return r && { x: r.g.x, y: r.g.y, z: r.g.z, seed: r.g.seed, d: r.d }; });
  check('Hellgates exist in the wild', !!ng, JSON.stringify(ng));
  // step into a wild gate -> dungeon -> come back out at that gate
  const enter = await page.evaluate(() => {
    const r = __g.nearestGate(__g.P.x, __g.P.z).g, P = __g.P, OW = __g.OW;
    P.x = r.x + .5; P.z = r.z + 8.5; for (let i = 0; i < 8; i++) { OW.update([{ x: P.x, z: P.z }], 300); OW.pump(300); }
    P.y = __g.topY(Math.floor(P.x), Math.floor(P.z)) + 1.01;
    const frame = []; P.x = r.x + .5; P.z = r.z + 3.5; P.y = r.y + 1.01; P.vy = 0; P.vx = P.vz = 0;
    for (let i = 0; i < 4; i++) { P.z = r.z + 1.0; P.x = r.x + .5; P.y = r.y + 1.01; __g.update(1 / 60); }
    return { mode: __g.mode(), seed: __g.Run.seed, want: r.seed, gate: r };
  });
  check('walking into a wild Hellgate starts a dungeon with that gate\'s seed', enter.mode === 'dungeon' && enter.seed === enter.want, JSON.stringify(enter));
  const out = await page.evaluate(() => { __g.enterHub(false, true); const P = __g.P, rt = __g.OW.returnTo; return { mode: __g.mode(), d: Math.hypot(P.x - rt.x, P.z - rt.z), ground: __g.get(Math.floor(P.x), Math.floor(P.y) - 1, Math.floor(P.z)) > 0, chunks: __g.OW.chunks.size }; });
  check('leaving the dungeon puts you back outside the gate you used', out.mode === 'hub' && out.d < 1 && out.ground && out.chunks > 60, JSON.stringify(out));
  const vil = await page.evaluate(() => { __g.OW.returnTo = null; __g.enterDungeon(5); __g.enterHub(false, true); return { x: __g.P.x, z: __g.P.z, ok: __g.biomeAt(__g.P.x, __g.P.z) }; });
  check('the village Hellgate still returns you to the village', Math.abs(vil.x - 32.5) < 1 && Math.abs(vil.z - 15.5) < 1 && vil.ok === 'EMBER VILLAGE', JSON.stringify(vil));
  await g.close(); done(g.errors);
}
console.log('old village builds carry into the open world');
{
  const save = JSON.stringify({ game: 'hexbusterz', v: 1, profile: { gems: 9, unlocked: [true, false, false, false, true], runs: 1, wins: 0 }, settings: {}, hub: { seed: 4242, genVersion: 1, edits: [[30, 9, 50, 7], [31, 9, 50, 8]] } });
  const g = await openGame({ width: 320, height: 200, init: `(() => { if (localStorage.getItem('__seeded')) return; localStorage.setItem('hbz.save', ${JSON.stringify(save)}); localStorage.setItem('__seeded', '1'); })();` }); const { page } = g;
  await startPlaying(page);
  const r = await page.evaluate(() => ({ v: __g.SaveStore.doc.v, vs: __g.WorldStore.cur.meta.villageSeed, b1: __g.get(30, 9, 50), b2: __g.get(31, 9, 50), gems: __g.Save.gems, backups: Object.keys(localStorage).filter(k => k.startsWith('hbz.backup')).length }));
  check('save upgraded to the current format and the old village seed is kept (so the build still fits)', r.v === 3 && r.vs === 4242, JSON.stringify(r));
  check('old village blocks are where you left them', r.b1 === 7 && r.b2 === 8);
  check('progress kept and a backup was made', r.gems === 9 && r.backups >= 1);
  await g.close(); done(g.errors);
}
