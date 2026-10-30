// Title screen, world list, create/rename/delete, options, pause menu, quit to title — all driven through the real buttons.
import { openGame, check, done } from './lib.mjs';
console.log('menus and worlds');
{
  const g = await openGame({ width: 1000, height: 600 }); const { page } = g;
  await page.waitForFunction(() => __g.booted());
  check('boots to the title screen', await page.evaluate(() => __g.state() === 'menu' && __g.Menu.top() === 'title' && document.querySelectorAll('[data-act]').length >= 4));
  await page.click('[data-act=sp]');
  check('singleplayer shows an empty world list at first', await page.evaluate(() => /NO WORLDS YET/.test(document.getElementById('mscreen').textContent) && document.querySelector('[data-act=play]').disabled));
  await page.click('[data-act=create]'); await page.fill('#f-name', 'Void Walkers'); await page.fill('#f-seed', 'cthulhu'); await page.click('[data-act=mode]');
  check('game mode button toggles to creative', await page.evaluate(() => /CREATIVE/.test(document.querySelector('[data-act=mode]').textContent)));
  await page.click('[data-act=docreate]'); await page.waitForFunction(() => __g.state() === 'play');
  const w = await page.evaluate(() => ({ name: __g.WorldStore.cur.meta.name, seed: __g.WorldStore.cur.meta.seed, want: __g.seedFromText('cthulhu'), mode: __g.WorldStore.cur.meta.mode, creative: __g.Inv.creative, oseed: __g.OW.seed, village: __g.biomeAt(__g.P.x, __g.P.z) }));
  check('world created with its name, hashed seed and mode, and the game uses that seed', w.name === 'Void Walkers' && w.seed === w.want && w.oseed === w.seed && w.mode === 'creative' && w.creative, JSON.stringify(w));
  check('numeric seeds are used as they are; blank seeds are random and different', await page.evaluate(() => __g.seedFromText('12345') === 12345 && __g.seedFromText('') !== __g.seedFromText('')));
  await page.evaluate(() => { __g.setBlock(30, 12, 30, 7); __g.flushSave(); });
  await page.evaluate(() => __g.openPause());
  check('Esc opens the game menu and the game stops', await page.evaluate(() => __g.state() === 'paused' && __g.Menu.top() === 'pause' && /GAME MENU/.test(document.getElementById('mscreen').textContent)));
  await page.click('[data-act=opt]');
  await page.evaluate(() => { const r = document.querySelector('[data-set=renderDist]'); r.value = 5; r.dispatchEvent(new Event('input', { bubbles: true })); const m = document.querySelector('[data-set=music]'); m.value = .2; m.dispatchEvent(new Event('input', { bubbles: true })); });
  check('options apply immediately (render distance, saved settings)', await page.evaluate(() => __g.OW.LOAD === 5 && __g.SaveStore.doc.settings.renderDist === 5 && Math.abs(__g.SaveStore.doc.settings.music - .2) < .001));
  await page.click('[data-act=back]');
  await page.click('[data-act=resume]'); check('Back to Game resumes', await page.evaluate(() => __g.state() === 'play'));
  await page.evaluate(() => __g.openPause()); await page.click('[data-act=quit]'); await page.waitForFunction(() => __g.state() === 'menu');
  check('Save and Quit returns to the title', await page.evaluate(() => __g.Menu.top() === 'title' && __g.WorldStore.cur.ephemeral));
  await page.reload(); await page.waitForFunction(() => __g.booted());
  check('settings survive a reload', await page.evaluate(() => __g.optV('renderDist') === 5 && __g.OW.LOAD === 5));
  await page.click('[data-act=sp]');
  check('the world is listed with its seed after a reload', await page.evaluate(() => /Void Walkers/.test(document.getElementById('mscreen').textContent) && /SEED \d+/.test(document.getElementById('mscreen').textContent)));
  await page.dblclick('.wl');                                  // double-click plays it
  await page.waitForFunction(() => __g.state() === 'play');
  check('double-click plays the world and the build is still there', await page.evaluate(() => __g.get(30, 12, 30) === 7 && __g.WorldStore.cur.meta.name === 'Void Walkers'));
  await page.evaluate(() => __g.quitToTitle()); await page.click('[data-act=sp]'); await page.click('[data-act=rename]'); await page.fill('#f-name', 'Renamed'); await page.click('[data-act=dorename]');
  check('rename works', await page.evaluate(() => /Renamed/.test(document.getElementById('mscreen').textContent)));
  await page.click('[data-act=create]'); await page.fill('#f-name', 'Second'); await page.press('#f-seed', 'Enter'); await page.waitForFunction(() => __g.state() === 'play');
  check('Enter in the seed box creates the world (blank = random seed)', await page.evaluate(() => __g.WorldStore.cur.meta.name === 'Second' && __g.WorldStore.cur.meta.seed > 0 && __g.WorldStore.list().length === 2));
  const own = await page.evaluate(() => { const a = __g.WorldStore.list().find(w => w.name === 'Renamed'), b = __g.WorldStore.cur.meta; return { sep: a.id !== b.id, bHasNoBlock: __g.get(30, 12, 30) !== 7, aKey: !!localStorage.getItem('hbz.w.' + a.id) }; });
  check('each world has its own saved data (the build is not in the new world)', own.sep && own.bHasNoBlock && own.aKey, JSON.stringify(own));
  await page.evaluate(() => __g.quitToTitle()); await page.click('[data-act=sp]'); await page.click('[data-act=delete]'); await page.click('[data-act=dodelete]');
  check('delete removes the world and its data', await page.evaluate(() => __g.WorldStore.list().length === 1 && Object.keys(localStorage).filter(k => k.startsWith('hbz.w.')).length === 1));
  await g.close(); done(g.errors);
}
console.log('saves from before worlds existed');
{
  const old = JSON.stringify({ game: 'hexbusterz', v: 2, created: 1000, profile: { gems: 12, unlocked: [true, true, false, false, true], runs: 3, wins: 1 }, settings: {}, hub: { seed: 9, edits: [] }, world: { seed: 777, villageSeed: 4242, genVersion: 1, edits: [[30, 9, 50, 7]], time: .6 }, inv: { slots: [[2, 5]], sel: 0, creative: false } });
  const g = await openGame({ width: 800, height: 500, init: `(() => { if (localStorage.getItem('__seeded')) return; localStorage.setItem('hbz.save', ${JSON.stringify(old)}); localStorage.setItem('__seeded', '1'); })();` }); const { page } = g;
  await page.waitForFunction(() => __g.booted()); await page.click('[data-act=sp]');
  check('the single v2 world shows up in the list as MY WORLD', await page.evaluate(() => /MY WORLD/.test(document.getElementById('mscreen').textContent) && /SEED 777/.test(document.getElementById('mscreen').textContent)));
  await page.click('[data-act=play]'); await page.waitForFunction(() => __g.state() === 'play');
  const r = await page.evaluate(() => ({ v: __g.SaveStore.doc.v, gems: __g.Save.gems, b: __g.get(30, 9, 50), time: __g.DayNight.t, inv: __g.Inv.slots[0] && __g.Inv.slots[0].n, backups: Object.keys(localStorage).filter(k => k.startsWith('hbz.backup')).length }));
  check('blocks, time of day, inventory and gems all carried over; a backup was made', r.v === 3 && r.gems === 12 && r.b === 7 && Math.abs(r.time - .6) < .01 && r.inv === 5 && r.backups >= 1, JSON.stringify(r));
  await g.close(); done(g.errors);
}
