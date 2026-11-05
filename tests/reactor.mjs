// The reactor core: hexagon lift from the bridge (big red button) down to the core room, the Rift Stabilizer lives there, and back up.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('the reactor core and the hex lift');
const g = await openGame({ width: 640, height: 360 }); const { page } = g; await startPlaying(page, 3, false, false);
const Y = f => page.evaluate(f);
await Y(() => { __g.setProtect(false); const P = __g.P; P.x = __g.LIFT.topBtn.x - 2.5; P.z = __g.LIFT.topBtn.z; P.y = 81.01; P.yaw = 0; __g.OW.update([{ x: P.x, z: P.z }], 30000); __g.OW.pump(30000); for (let i = 0; i < 30; i++) __g.update(1 / 60); });
const st = await Y(() => ({ near: __g.Lift.near(), top: __g.Lift.nearTop(), y: __g.P.y, solid: __g.Lift.topSolid() }));
check('standing at the bridge button the lift offers itself, and the hex door is a solid floor', st.near && st.top && st.solid && st.y > 81 && st.y < 82, JSON.stringify(st));
await page.keyboard.press('KeyE');
check('pressing E starts the ride', await Y(() => __g.Lift.on && __g.Lift.dir === 'down'));
const seen = await Y(() => { let open = false, n = 0; while (__g.Lift.on && n++ < 1200) { __g.update(1 / 60); if (__g.Lift.open > .9) open = true; } return open; });
const seenOpen = seen;
const end = await Y(() => ({ on: __g.Lift.on, x: __g.P.x, y: __g.P.y, z: __g.P.z, alive: __g.P.alive, open: __g.Lift.open }));
check('the floor irises open, you drop to the reactor floor and arrive alive in the core room', seenOpen && !end.on && end.alive && Math.abs(end.y - 15) < .1, JSON.stringify(end));
await Y(() => { for (let i = 0; i < 90; i++) __g.update(1 / 60); });
check('the door closes behind you', await Y(() => __g.Lift.open < .01));
check('the core room has the Rift Stabilizer: its console is in reach and the location reads REACTOR CORE', await Y(() => { const P = __g.P; P.x = __g.RIFT.console.x; P.z = __g.RIFT.console.z - 3; for (let i = 0; i < 5; i++) __g.update(1 / 60); return __g.Rift.nearConsole() && /REACTOR CORE/.test(__g.biomeAt(P.x, P.z, P.y)); }));
// go back up
await Y(() => { const P = __g.P; P.x = __g.LIFT.botBtn.x - 2.5; P.z = __g.LIFT.botBtn.z; P.y = 15.01; for (let i = 0; i < 10; i++) __g.update(1 / 60); });
check('at the reactor button the lift offers the way up', await Y(() => __g.Lift.nearBot()));
await page.keyboard.press('KeyE');
await Y(() => { let n = 0; while (__g.Lift.on && n++ < 1200) __g.update(1 / 60); });
const up = await Y(() => ({ y: __g.P.y, x: __g.P.x, alive: __g.P.alive }));
check('riding up puts you back on the bridge floor', up.alive && Math.abs(up.y - 81.001) < .2 && up.x > -30, JSON.stringify(up));
await Y(() => { for (let i = 0; i < 120; i++) __g.update(1 / 60); });
check('and the hatch shuts behind you; you stay on the bridge', await Y(() => __g.P.y > 80.9 && __g.P.alive));
// the rift: charge, open, step in
await Y(() => { const P = __g.P; P.x = __g.RIFT.x; P.z = __g.RIFT.z + 6; P.y = 15.01; __g.Rift.phase = 'open'; __g.Rift.t = 20; });
check('the open Rift is a walk-in portal at the centre of the core room', await Y(() => { const P = __g.P; P.x = __g.RIFT.x; P.z = __g.RIFT.z; P.y = 15.5; return __g.Rift.inRift(); }));
await g.close(); done(g.errors);
