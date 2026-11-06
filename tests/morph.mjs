// The gun arm transforms between modes (no separate per-mode objects): morph channels spring to each mode's pose.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('gun arm transformation');
const g = await openGame({ width: 640, height: 360 }); const { page } = g; await startPlaying(page, 3, false, false);
const Y = (f, a) => page.evaluate(f, a);
const T = [[0, 0, 0, 0, 1], [0, 1, 0, 0, 0], [0, 0, 1, 0, 0], [1, 0, 0, 0, 0], [0, 0, 0, 1, 0]];
for (const w of [3, 1, 2, 4, 0]) {
  await Y(w => { __g.P.weapon = w; }, w); await page.waitForTimeout(150);
  const mid = await Y(() => ({ t: __g.MP.t, f: __g.MP.flash }));
  await Y(w => { for (let i = 0; i < 150; i++) __g.morphTick(1 / 60, w); }, w);       // headless frames are slow, so step the springs directly
  const x = await Y(() => __g.MP.x.slice());
  check('mode ' + (w + 1) + ': the arm settles into its pose', x.every((v, i) => Math.abs(v - T[w][i]) < .06), JSON.stringify(x.map(v => +v.toFixed(2))));
  if (w === 3) check('switching starts a transformation (flash + timer reset)', mid.t < 3 || mid.f > 0, JSON.stringify(mid));
}
await g.close(); done(g.errors);
