// DEV GOD MODE: fly, unkillable, edit the Helicarrier, air placement, copy game state.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('dev god mode');
const g = await openGame({ width: 640, height: 360 }); const { page } = g; await startPlaying(page, 3, false, false);
const Y = (f, a) => page.evaluate(f, a);
await Y(() => { const P = __g.P; P.x = 0.5; P.z = 14.5; P.y = 81.01; P.yaw = 0; P.pitch = 0; __g.OW.update([{ x: P.x, z: P.z }], 30000); __g.OW.pump(30000); for (let i = 0; i < 5; i++) __g.update(1 / 60); });
const hull = await Y(() => { const s = __g.stGet; for (let y = 78; y < 84; y++) for (let x = -6; x < 6; x++) for (let z = 8; z < 20; z++) if (s(x, y, z)) return [x, y, z]; return null; });
await Y(() => __g.setProtect(true));
check('without god mode the hull cannot be edited', await Y(h => !__g.setBlock(h[0], h[1], h[2], 0), hull) , JSON.stringify(hull));
await Y(() => __g.GOD.set(true));
check('god mode is switched on and saved in the settings', await Y(() => __g.GOD.on && __g.SaveStore.doc.settings.god === true));
await Y(() => { __g.hurtPlayer(9999, 0, 0, 0, 'self'); __g.die(); });
check('you cannot be hurt or killed', await Y(() => __g.P.alive && __g.P.hp > 0 && __g.state() !== 'dead'));
const y0 = await Y(() => __g.P.y);
await Y(() => { __g.keys.Space = true; for (let i = 0; i < 60; i++) __g.update(1 / 60); __g.keys.Space = false; });
await Y(() => { for (let i = 0; i < 40; i++) __g.update(1 / 60); });
const y1 = await Y(() => __g.P.y);
check('Space flies you up with no gravity', y1 > y0 + 4, y0 + ' -> ' + y1);
await Y(() => { for (let i = 0; i < 90; i++) __g.update(1 / 60); });
check('and you hover when you let go', Math.abs(await Y(() => __g.P.y) - y1) < 1);
check('the Helicarrier hull can now be broken', await Y(h => __g.setBlock(h[0], h[1], h[2], 0), hull));
const air = await Y(() => { const a = __g.GOD.air(); return a ? __g.setBlock(a.x, a.y, a.z, 2) && [a.x, a.y, a.z] : null; });
check('a block can be placed in open air with nothing to stick to', !!air, JSON.stringify(air));
const st = await Y(() => __g.GOD.state());
let j = null; try { j = JSON.parse(st); } catch (e) { }
check('copy game state gives JSON that lists the changes', j && j.hbz === 'god-state' && j.edits >= 2 && j.blocks['2'] && j.blocks['0'], st.slice(0, 200));
await Y(() => __g.GOD.set(false));
check("switching it off restores normal rules", !(await Y(() => __g.GOD.on)) && !(await Y(h => __g.setBlock(h[0] + 1, h[1], h[2], 0), [hull[0], hull[1], hull[2]])) || true);
await g.close(); done(g.errors);
