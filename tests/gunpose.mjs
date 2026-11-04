// Gun arm position mode: opens from the pause menu, clears the HUD, keys move the arm, the player stays put, it saves and exits.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('gun arm position mode');
const g = await openGame({ width: 640, height: 360 }); const { page } = g; await startPlaying(page, 3, false, false);
await page.evaluate(() => { __g.openPause(); });
await page.click('[data-act="gunpose"]');
const st = await page.evaluate(() => ({ on: __g.GP.on, state: __g.state(), hud: getComputedStyle(document.getElementById('hud')).visibility, box: !!document.getElementById('gpinfo') }));
check('the pause menu button enters the mode, hides the HUD and shows the readout', st.on && st.state === 'play' && st.hud === 'hidden' && st.box, JSON.stringify(st));
const p0 = await page.evaluate(() => [__g.P.x, __g.P.z]);
await page.keyboard.down('KeyD'); await page.keyboard.down('KeyR'); await page.keyboard.down('KeyQ'); await page.waitForTimeout(700); await page.keyboard.up('KeyD'); await page.keyboard.up('KeyR'); await page.keyboard.up('KeyQ');
const v = await page.evaluate(() => ({ ...__g.GP.v, p: [__g.P.x, __g.P.z] }));
check('held keys move the arm (side, height, yaw) and the player does not walk', v.x > .05 && v.y > .05 && v.yaw !== 0 && Math.abs(v.p[0] - p0[0]) < .01 && Math.abs(v.p[1] - p0[1]) < .01, JSON.stringify(v));
await page.keyboard.press('Backspace');
check('backspace resets to the shipped pose', await page.evaluate(() => Object.values(__g.GP.v).join() === '0,0,0,0,0,0,1'));
await page.keyboard.down('KeyF'); await page.waitForTimeout(300); await page.keyboard.up('KeyF'); await page.keyboard.press('Enter');
const e = await page.evaluate(() => ({ on: __g.GP.on, hud: getComputedStyle(document.getElementById('hud')).visibility, saved: __g.SaveStore.doc.settings.gunPose && __g.SaveStore.doc.settings.gunPose.y }));
check('Enter exits, restores the HUD and saves the pose', !e.on && e.hud !== 'hidden' && e.saved < 0, JSON.stringify(e));
await g.close(); done(g.errors);
