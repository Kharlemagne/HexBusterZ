// Dungeon rules with two players: a guest alone can wake a room, doors seal for BOTH, the "enemies left" counter agrees,
// clearing unseals for both, chests pay the player who opens them, and shots are visible to the other player.
import { openGame, startPlaying, check, done, chromium, GL_ARGS } from './lib.mjs';
console.log('co-op dungeon rules');
const slow = () => { const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = f => setTimeout(() => raf(f), 700); };
const browser = await chromium.launch({ args: GL_ARGS });
const H = await openGame({ width: 320, height: 200, init: slow, browser }); await startPlaying(H.page);
const G = await openGame({ width: 320, height: 200, init: slow, browser }); await startPlaying(G.page);
const bridge = async (from, to) => {
  await from.page.exposeFunction('__out', async s => { try { await to.page.evaluate(s => window.__tr && window.__tr.onmessage && window.__tr.onmessage(s), s); } catch { } });
  await from.page.evaluate(() => { window.__tr = { send: s => window.__out(s), onmessage: null, close() { } }; });
};
await bridge(H, G); await bridge(G, H);
const step = async n => { for (let i = 0; i < n; i++) await Promise.all([H.page, G.page].map(p => p.evaluate(() => { __g.update(1 / 60); __g.Net.tick(1 / 60); }))); };
const count9 = p => p.evaluate(() => { let n = 0; const w = __g.world; for (let i = 0; i < w.length; i++) if (w[i] === 9) n++; return n; });
await G.page.evaluate(() => __g.Net.join(window.__tr));
await H.page.evaluate(() => { __g.Net.host(); __g.Net.accept(window.__tr); });
await H.page.evaluate(() => __g.enterDungeon(777));
await step(30);
const base9 = await count9(G.page);
// the guest walks into a normal room alone
const ri = await H.page.evaluate(() => __g.Run.rooms.findIndex(r => !['start', 'boss', 'treasure'].includes(r.type)));
await G.page.evaluate(i => { const r = __g.Run.rooms[i]; Object.assign(__g.P, { x: r.ox + 16.5, z: r.oz + 16.5, y: 5.01, vy: 0 }); }, ri);
await step(60);
check('a guest alone wakes the room (host logic sees every player)', await H.page.evaluate(i => __g.Run.rooms[i].state === 'active', ri));
check('guest sees the room as sealed/active', await G.page.evaluate(i => __g.Run.rooms[i].state === 'active', ri));
check('doors are sealed on the host', (await count9(H.page)) > base9);
check('doors are sealed for the guest too (no walking through)', (await count9(G.page)) === (await count9(H.page)));
await step(120);
const cnt = async () => [await H.page.evaluate(() => __g.enemies.filter(e => !e.dead).length + __g.Run.queue.length), await G.page.evaluate(() => __g.Net.left)];
const [hl, gl] = await cnt();
check('"enemies left" agrees on both screens', hl === gl && hl > 0, hl + ' vs ' + gl);

// the guest shoots: the host must see the tracer
const b0 = await H.page.evaluate(() => __g.beams.length);
await G.page.evaluate(() => { __g.castBullet([__g.P.x, __g.P.y + 1.6, __g.P.z], [1, 0, 0], { dmg: 1, th: .05, col: [1, .5, .1], life: 2, range: 20 }); });
await step(8);
check('the host sees the guest\'s shot', await H.page.evaluate(b => __g.beams.length > b, b0));
const sl0 = await G.page.evaluate(() => __g.slashes.length);
await H.page.evaluate(() => { __g.Net.fx('slash', [32, 6, 32, 0, 1.8]); });
await step(8);
check('slashes travel too', await G.page.evaluate(n => __g.slashes.length > n, sl0));

// clear the room (the guest does the killing through the real damage path)
for (let i = 0; i < 400; i++) {
  await G.page.evaluate(() => { for (const e of __g.enemies) if (!e.dead && !e.pieces) __g.damageEnemy(e, 9999, { dir: { x: 1, y: 0, z: 0 } }); });
  await step(4);
  if (await H.page.evaluate(i => __g.Run.rooms[i].state === 'cleared', ri)) break;
}
check('room clears when the last enemy dies', await H.page.evaluate(i => __g.Run.rooms[i].state === 'cleared', ri));
await step(30);
check('"enemies left" does not stick at 1', (await cnt())[1] === 0, String((await cnt())[1]));
check('doors open again for both', (await count9(G.page)) === base9 && (await count9(H.page)) === base9);

// chest paid to the opener
const ci = await H.page.evaluate(() => __g.Run.chests.findIndex(c => !c.treasure));
const gems0 = await G.page.evaluate(() => __g.Save.gems), hg0 = await H.page.evaluate(() => __g.Save.gems);
await G.page.evaluate(i => { const c = __g.Run.chests[i]; Object.assign(__g.P, { x: c.x, z: c.z, y: c.y + .1 }); }, ci);
await step(60);
check('chest opens on both machines', await H.page.evaluate(i => __g.Run.chests[i].open, ci) && await G.page.evaluate(i => __g.Run.chests[i].open, ci));
check('the guest who opened it gets the gems (host does not)', (await G.page.evaluate(() => __g.Save.gems)) > gems0 && (await H.page.evaluate(() => __g.Save.gems)) === hg0);
await H.close(); await G.close(); await browser.close();
done([...H.errors, ...G.errors]);
