// The score: every track composes into sorted, finite events; the player starts a fitting track, goes quiet between tracks, and follows the mode.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('music');
const g = await openGame({ width: 320, height: 200 }); const { page } = g; await startPlaying(page);
const c = await page.evaluate(() => DATA.music.tracks.map(sp => { const T = __g.compose(sp); let ok = T.ev.length > 10, last = -1; for (const e of T.ev) { if (!isFinite(e.b) || !isFinite(e.m) || !isFinite(e.d) || !isFinite(e.v) || e.b < last) ok = false; last = e.b; } return { n: sp.name, ok, mode: sp.mode }; }));
check('all ' + c.length + ' tracks compose into sorted, finite notes', c.every(x => x.ok), JSON.stringify(c.filter(x => !x.ok)));
check('there are tracks for the hub, the dungeons and the bosses', [0, 1, 2].every(m => c.some(x => x.mode === m)));
await page.evaluate(() => { __g.initAudio(); __g.Score.wait = 0; });
await page.waitForFunction(() => __g.Score.track, null, { timeout: 8000 }).catch(() => { });
const a = await page.evaluate(() => ({ has: !!__g.Score.track, name: __g.Score.name, mode: __g.Score.sp && __g.Score.sp.mode }));
check('a hub track starts playing', a.has && a.mode === 0, JSON.stringify(a));
await page.evaluate(() => { __g.Score.beat = 1e9; });
await page.waitForFunction(() => !__g.Score.track && __g.Score.wait > 15, null, { timeout: 8000 }).catch(() => { });
const b = await page.evaluate(() => ({ has: !!__g.Score.track, wait: __g.Score.wait }));
check('when it ends there is a long silence before the next track', !b.has && b.wait > 15, JSON.stringify(b));
const bs = await page.evaluate(() => [0, 1, 2].map(m => { const t = __g.pickTrack(m); return t && t.mode; }));
check('each place picks a track that fits it (hub, dungeon, boss)', JSON.stringify(bs) === '[0,1,2]', JSON.stringify(bs));
await g.close(); done(g.errors);
