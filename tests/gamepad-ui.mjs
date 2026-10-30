// A fake controller drives the menus and the backpack: no mouse or keyboard.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('gamepad: menus and backpack');
const g = await openGame({ width: 900, height: 600, init: `(() => {
  window.__btn = new Array(17).fill(0); window.__ax = [0, 0, 0, 0];
  navigator.getGamepads = () => [{ index: 0, id: 'Fake Pad (STANDARD GAMEPAD)', mapping: 'standard', connected: true, axes: window.__ax, buttons: window.__btn.map(v => ({ pressed: v > .5, value: v })) }];
})();` });
const { page } = g;
const tap = async b => { await page.evaluate(b => { __btn[b] = 1; __g.pollGamepad(); __btn[b] = 0; __g.pollGamepad(); }, b); };
await page.waitForFunction(() => __g.booted());
await page.evaluate(() => __g.pollGamepad());
await tap(0);                                                         // A on the first button: SINGLEPLAYER
check('A presses the highlighted title button (Singleplayer)', await page.evaluate(() => __g.Menu.top() === 'worlds'));
await tap(1);
check('B goes back', await page.evaluate(() => __g.Menu.top() === 'title'));
await tap(13); await tap(13); await tap(0);                           // down, down -> OPTIONS (3rd item is the OPTIONS/CONTROLS row: items = SP, MP, OPTIONS)
check('D-pad down moves the highlight (reached Options)', await page.evaluate(() => __g.Menu.top() === 'options'));
await tap(13);                                                        // slider 2 (SFX): move focus then adjust with right
const before = await page.evaluate(() => __g.optV('sfx'));
await tap(15);
check('left/right on a slider changes it', await page.evaluate(b => __g.optV('sfx') > b, before));
await tap(1);
await startPlaying(page);
await tap(8);
check('BACK opens the backpack and character screen', await page.evaluate(() => __g.state() === 'inv'));
await tap(0);                                                         // A on the hotbar slot 1 picks the stack up
const held = await page.evaluate(() => __g.Inv.cursor && __g.Inv.cursor.n === 64);
await tap(12); await tap(0);                                          // up one row (bag), A drops it there
const moved = await page.evaluate(() => __g.Inv.slots[27] && __g.Inv.slots[27].n === 64 && !__g.Inv.cursor && !__g.Inv.slots[0]);
check('A picks up and drops stacks with the D-pad cursor', held && moved);
await tap(1);
check('B closes the backpack', await page.evaluate(() => __g.state() === 'play'));
await tap(9);
check('START opens the game menu', await page.evaluate(() => __g.state() === 'paused' && __g.Menu.top() === 'pause'));
await tap(0);
check('A on Back to Game resumes', await page.evaluate(() => __g.state() === 'play'));
await g.close(); done(g.errors);
