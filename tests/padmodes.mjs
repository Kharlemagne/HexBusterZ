// Controller support in the crisis sortie and the ship builder (a fake standard-layout pad is injected).
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('controller in sortie + ship builder');
const init = () => { window.__pad = { id: 'fake pad', index: 0, mapping: 'standard', connected: true, buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, 0, 0, 0] }; navigator.getGamepads = () => [window.__pad]; };
const g = await openGame({ width: 640, height: 360, init }); const { page } = g; await startPlaying(page, 3, false, false);
const Y = (f, a) => page.evaluate(f, a);
const press = async (i, ms = 250) => { await Y(i => { __pad.buttons[i] = { pressed: true, value: 1 }; }, i); await page.waitForTimeout(ms); await Y(i => { __pad.buttons[i] = { pressed: false, value: 0 }; }, i); await page.waitForTimeout(ms); };
// --- sortie
await Y(() => { __g.setState('play'); __g.Sortie.start(5, 0); const S = __g.SR; S.phase = 'run'; S.god = true; });
const x0 = await Y(() => __g.SR.ship.x);
await Y(() => { __pad.axes[0] = 1; }); await page.waitForTimeout(900); await Y(() => { __pad.axes[0] = 0; });
const x1 = await Y(() => __g.SR.ship.x);
check('the left stick flies the ship', x1 > x0 + .5, x0 + ' -> ' + x1);
const sh0 = await Y(() => __g.SR.shots ? __g.SR.shots.length : (__g.SR.pb ? __g.SR.pb.length : -1));
await Y(() => { __pad.buttons[7] = { pressed: true, value: 1 }; }); await page.waitForTimeout(700); const firing = await Y(() => __g.SR.shots ? __g.SR.shots.length : (__g.SR.pb ? __g.SR.pb.length : -1)); await Y(() => { __pad.buttons[7] = { pressed: false, value: 0 }; });
check('RT fires the guns', firing > 0 || firing !== sh0, sh0 + ' -> ' + firing);
await press(9); check('START pauses the sortie', await Y(() => __g.SR.pause)); await press(9); check('START resumes it', !(await Y(() => __g.SR.pause)));
await Y(() => __g.Sortie.exit(false));
// --- builder
await Y(() => { __g.setState('play'); __g.Yard.open(); });
check('the ship builder is open', await Y(() => __g.state() === 'builder'));
const c0 = await Y(() => __g.Yard.cur.slice());
await Y(() => { __pad.axes[0] = 1; }); await page.waitForTimeout(500); await Y(() => { __pad.axes[0] = 0; }); await page.waitForTimeout(300);
const c1 = await Y(() => __g.Yard.cur.slice());
check('the left stick moves the build cursor', JSON.stringify(c0) !== JSON.stringify(c1), JSON.stringify(c0) + ' -> ' + JSON.stringify(c1));
const n0 = await Y(() => __g.Yard.blocks.size); await press(0); const n1 = await Y(() => __g.Yard.blocks.size);
check('A places a part (mirrored pairs count twice)', n1 > n0, n0 + ' -> ' + n1);
await press(1); check('B removes it', (await Y(() => __g.Yard.blocks.size)) === n0);
const yw = await Y(() => __g.Yard.yaw); await Y(() => { __pad.axes[2] = 1; }); await page.waitForTimeout(600); await Y(() => { __pad.axes[2] = 0; });
check('the right stick orbits the camera', Math.abs((await Y(() => __g.Yard.yaw)) - yw) > .1);
await press(9); check('START leaves the builder', await Y(() => __g.state() !== 'builder'));
await g.close(); done(g.errors);
