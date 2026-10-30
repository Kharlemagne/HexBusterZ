// Loads the built game, starts a run, walks through the Hellgate and makes sure nothing throws.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('smoke');
const g = await openGame();
const { page, errors } = g;
check('title is HEXBUSTER Z', (await page.title()) === 'HEXBUSTER Z');
await startPlaying(page);
check('starts in the hub', await page.evaluate(() => __g.mode() === 'hub'));
await page.evaluate(() => { const P = __g.P; P.x = .5; P.z = -92; P.y = 81.01; P.yaw = 0; __g.OW.update([{ x: P.x, z: P.z }], 8000); __g.OW.pump(8000); __g.keys.KeyW = true; for (let i = 0; i < 90 && __g.mode() !== 'dungeon'; i++) __g.update(1 / 60); __g.keys.KeyW = false; });
check('Hellgate leads to a dungeon', await page.evaluate(() => __g.mode() === 'dungeon'));
check('dungeon has 10 rooms, a boss and a treasure room', await page.evaluate(() => __g.Run.rooms.length === 10 && __g.Run.rooms.some(r => r.type === 'boss') && __g.Run.rooms.some(r => r.type === 'treasure')));
await page.evaluate(() => { for (let i = 0; i < 300; i++) __g.update(1 / 60); __g.renderFrame(.016); });
await g.close(); done(errors);
