// Two real browser pages: one hosts, one joins through a relay (stand-in for WebRTC). Checks that the guest sees the host's
// world, enemies, boss and block edits, and that damage flows both ways.
import { openGame, startPlaying, check, done, chromium, GL_ARGS } from './lib.mjs';
console.log('co-op (host + guest)');
// two software-GL browsers are heavy: tiny viewports and a throttled render loop (the test steps the game by hand)
const slow = () => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = f => setTimeout(() => raf(f), 700); };
const browser = await chromium.launch({ args: GL_ARGS });       // one browser, two contexts: shares the (memory-hungry) software GPU process
const H = await openGame({ width: 320, height: 200, init: slow, browser });
await startPlaying(H.page);
const G = await openGame({ width: 320, height: 200, init: slow, browser });
await startPlaying(G.page);
// relay
const bridge = async (from, to) => {
  await from.page.exposeFunction('__out', async s => { try { await to.page.evaluate(s => window.__tr && window.__tr.onmessage && window.__tr.onmessage(s), s); } catch { } });
  await from.page.evaluate(() => { window.__tr = { send: s => window.__out(s), onmessage: null, close() { } }; });
};
await bridge(H, G); await bridge(G, H);
const step = async (n, hf = () => { }, gf = () => { }) => {
  for (let i = 0; i < n; i++) {
    await Promise.all([H.page.evaluate(() => { __g.update(1 / 60); __g.Net.tick(1 / 60); }), G.page.evaluate(() => { __g.update(1 / 60); __g.Net.tick(1 / 60); })]);
  }
};
const hash = p => p.evaluate(() => { let h = 0; const w = __g.world; for (let i = 0; i < w.length; i++) h = (h * 31 + w[i]) | 0; return h; });

// the host builds something before the guest joins
await H.page.evaluate(() => { __g.setBlock(30, 12, 30, 3); });
await G.page.evaluate(() => { __g.Net.join(window.__tr); });          // the guest listens first, then the host accepts
await H.page.evaluate(() => { __g.Net.host(); __g.Net.accept(window.__tr); });
await step(30);
check('guest joined the host (role + id)', await G.page.evaluate(() => __g.Net.role === 'client' && __g.P.id === 1));
check('host knows the guest', await H.page.evaluate(() => __g.players.length === 2 && __g.players[1].id === 1));
check('guest rebuilt the same hub, including the host\'s build', (await hash(H.page)) === (await hash(G.page)));
check('guest\'s own save was not touched by the host\'s hub', await G.page.evaluate(() => __g.SaveStore.doc.hub.edits.length === 0));

// positions
await G.page.evaluate(() => { Object.assign(__g.P, { x: 20.5, y: 12, z: 20.5, yaw: 1 }); });
await H.page.evaluate(() => { Object.assign(__g.P, { x: 40.5, y: 12, z: 40.5 }); });
await step(40);
check('host sees the guest move', await H.page.evaluate(() => Math.abs(__g.players[1].x - 20.5) < .2));
check('guest sees the host move', await G.page.evaluate(() => { const q = __g.players.find(p => p.id === 0); return q && Math.abs(q.x - 40.5) < 1; }));

// enemies
const eid = await H.page.evaluate(() => { const e = __g.spawnEnemy('husk', 36.5, 10, 36.5); return e.id; });
await step(40);
check('guest sees the host\'s enemy', await G.page.evaluate(id => __g.enemies.some(e => e.id === id), eid));
const hp0 = await H.page.evaluate(id => __g.enemies.find(e => e.id === id).hp, eid);
await G.page.evaluate(id => { const e = __g.enemies.find(x => x.id === id); __g.damageEnemy(e, 10, { dir: { x: 1, y: 0, z: 0 }, pt: [e.x, e.y + 1, e.z] }); }, eid);
await step(10);
const hp1 = await H.page.evaluate(id => (__g.enemies.find(e => e.id === id) || { hp: 0 }).hp, eid);
check('guest\'s hit damages the real enemy on the host', hp1 === hp0 - 10, hp0 + ' -> ' + hp1);

// blocks
await G.page.evaluate(() => __g.setBlock(25, 12, 25, 5));
await H.page.evaluate(() => __g.setBlock(26, 12, 26, 6));
await step(10);
check('guest block edit reaches the host', await H.page.evaluate(() => __g.get(25, 12, 25) === 5));
check('host block edit reaches the guest', await G.page.evaluate(() => __g.get(26, 12, 26) === 6));
check('host saves the guest\'s build in its village', await H.page.evaluate(() => { __g.SaveStore.doc.hub.edits.length; return __g.HubSave.edits.size >= 2; }));

// damage to the guest
const hpG = await G.page.evaluate(() => { __g.P.inv = 0; return __g.P.hp; });
await H.page.evaluate(() => { const q = __g.players[1]; q.inv = 0; __g.hurtPlayer(12, 0, 0, 0, undefined, q); });
await step(10);
check('host-side damage is applied to the guest\'s own health', await G.page.evaluate(h => __g.P.hp === h - 12, hpG));

// into the dungeon together
await H.page.evaluate(() => __g.enterDungeon(777));
await step(30);
check('guest follows into the same dungeon', await G.page.evaluate(() => __g.mode() === 'dungeon' && __g.Run.seed === 777 && __g.Run.rooms.length === 10));
check('dungeon blocks identical', (await hash(H.page)) === (await hash(G.page)));

// boss
await H.page.evaluate(() => { const r = __g.Run.rooms.find(x => x.type === 'boss'); const cx = r.ox + r.sz / 2, cz = r.oz + r.sz / 2; __g.spawnBoss(cx, __g.topY(Math.floor(cx), Math.floor(cz), 40) + 1, cz); });
await step(40);
check('guest sees the boss with its 3 pieces', await G.page.evaluate(() => { const b = __g.enemies.find(e => e.type === 'boss'); return !!b && b.pieces.length === 3 && !!b.bossName; }));
check('same boss on both machines', (await H.page.evaluate(() => __g.enemies.find(e => e.type === 'boss').bossName)) === (await G.page.evaluate(() => __g.enemies.find(e => e.type === 'boss').bossName)));
await G.page.evaluate(() => __g.renderFrame(.016)); await H.page.evaluate(() => __g.renderFrame(.016));
await step(60);

// leaving
await G.page.evaluate(() => __g.Net.leave());
check('guest goes back to single player', await G.page.evaluate(() => __g.Net.role === 'offline' && __g.players.length === 1 && __g.mode() === 'hub'));
await H.close(); await G.close(); await browser.close();
done([...H.errors, ...G.errors]);
