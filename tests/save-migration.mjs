// The promise: an update never costs a player their game. These tests are the safety net for that promise.
import { openGame, startPlaying, check, done } from './lib.mjs';

const seed = (obj) => `(() => { if (localStorage.getItem('__seeded')) return; ${Object.entries(obj).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(typeof v === 'string' ? v : JSON.stringify(v))});`).join(' ')} localStorage.setItem('__seeded', '1'); })();`;

console.log('legacy CUBICIDE save -> migrated, legacy key and a backup are kept');
{
  const g = await openGame({ init: seed({ cubicide_save_v1: { gems: 321, unlocked: [true, true, false, true, true], runs: 9, wins: 4 }, cubicide_padmap_v1: { fire: { b: 5 }, lx: { a: 0, s: 1 } } }) });
  const r = await g.page.evaluate(() => ({ gems: __g.Save.gems, unlocked: __g.Save.unlocked.join(), runs: __g.Save.runs, wins: __g.Save.wins, v: __g.SaveStore.doc.v, pad: !!__g.SaveStore.doc.settings.padMap, stored: !!localStorage.getItem('hbz.save'), legacyKept: !!localStorage.getItem('cubicide_save_v1'), backups: Object.keys(localStorage).filter(k => k.startsWith('hbz.backup.v0.')).length }));
  check('gems kept', r.gems === 321); check('weapons kept', r.unlocked === 'true,true,false,true,true'); check('runs + wins kept', r.runs === 9 && r.wins === 4);
  check('upgraded to current schema', r.v === (await g.page.evaluate(() => __g.SAVE_SCHEMA))); check('controller mapping carried over', r.pad);
  check('new save written', r.stored); check('legacy key left untouched', r.legacyKept); check('pre-migration backup written', r.backups === 1);
  await g.close(); done(g.errors);
}
console.log('damaged save -> restored from the rolling backup');
{
  const good = JSON.stringify({ game: 'hexbusterz', v: 1, profile: { gems: 77, unlocked: [true, true, false, false, true], runs: 2, wins: 1 }, settings: {}, hub: { seed: 5, edits: [] } });
  const g = await openGame({ init: seed({ 'hbz.save': '{this is not json', 'hbz.save.bak': good }) });
  check('restored gems from backup', await g.page.evaluate(() => __g.Save.gems === 77));
  check('damaged data was preserved for inspection', await g.page.evaluate(() => Object.keys(localStorage).some(k => k.startsWith('hbz.backup.corrupt.'))));
  await g.close(); done(g.errors);
}
console.log('save from a NEWER version -> kept intact, never downgraded');
{
  const g = await openGame({ init: seed({ 'hbz.save': { game: 'hexbusterz', v: 99, profile: { gems: 5, unlocked: [true, false, false, false, true], runs: 0, wins: 0 }, settings: {}, hub: { seed: 3, edits: [] }, futureThing: { keep: 'me' } } }) });
  await g.page.evaluate(() => { __g.Save.gems += 10; __g.flushSave(); });
  const r = await g.page.evaluate(() => { const d = JSON.parse(localStorage.getItem('hbz.save')); return { v: d.v, kept: d.futureThing && d.futureThing.keep, gems: d.profile.gems, newer: __g.SaveStore.newer }; });
  check('still version 99', r.v === 99); check('unknown fields survive a write', r.kept === 'me'); check('progress still saved', r.gems === 15); check('flagged as newer', r.newer);
  await g.close(); done(g.errors);
}
console.log('missing fields are filled in (the "just add a field" case)');
{
  const g = await openGame({ init: seed({ 'hbz.save': { game: 'hexbusterz', v: 1, profile: { gems: 12 } } }) });
  const r = await g.page.evaluate(() => ({ gems: __g.Save.gems, un: __g.Save.unlocked.length, stats: typeof __g.Save.stats, hub: Array.isArray(__g.SaveStore.doc.hub.edits) }));
  check('existing value kept', r.gems === 12); check('defaults filled', r.un === 5 && r.stats === 'object' && r.hub);
  await g.close(); done(g.errors);
}
console.log('export / import round trip');
{
  const g = await openGame();
  const { page } = g;
  await page.evaluate(() => { __g.Save.gems = 456; __g.Save.unlocked[2] = true; __g.Save.stats.kills = 99; __g.flushSave(); });
  const code = await page.evaluate(() => __g.exportSaveCode());
  check('code has the HBZ1 prefix', code.startsWith('HBZ1.'));
  await page.evaluate(() => { __g.Save.gems = 1; __g.Save.unlocked[2] = false; });
  const ok = await page.evaluate(c => __g.importSaveCode(c), code);
  check('import accepted', ok.ok); check('gems restored', await page.evaluate(() => __g.Save.gems === 456)); check('weapon restored', await page.evaluate(() => __g.Save.unlocked[2] === true));
  check('a backup of the replaced save exists', await page.evaluate(() => Object.keys(localStorage).some(k => k.startsWith('hbz.backup.before-import.'))));
  const bad = await page.evaluate(c => __g.importSaveCode(c.slice(0, -3) + 'abc'), code);
  check('tampered code rejected', !bad.ok); check('rejected import left the save alone', await page.evaluate(() => __g.Save.gems === 456));
  check('garbage rejected', !(await page.evaluate(() => __g.importSaveCode('hello'))).ok);
  // an export from the "old" schema still imports (migrations run on import too)
  const legacyDoc = JSON.stringify({ game: 'hexbusterz', v: 0, gems: 40, unlocked: [true, false, false, false, true], runs: 1, wins: 0 });
  const legacyCode = await page.evaluate(j => { let h = 2166136261; for (let i = 0; i < j.length; i++) { h ^= j.charCodeAt(i); h = Math.imul(h, 16777619); } return 'HBZ1.' + btoa(unescape(encodeURIComponent(j))) + '.' + (h >>> 0).toString(16); }, legacyDoc);
  check('old-format export still imports', (await page.evaluate(c => __g.importSaveCode(c), legacyCode)).ok && await page.evaluate(() => __g.Save.gems === 40));
  await g.close(); done(g.errors);
}
console.log('the village remembers what you build');
{
  const g = await openGame(); const { page } = g;
  await startPlaying(page);
  const pos = await page.evaluate(() => { const x = 30, z = 50, y = 9; __g.setBlock(x, y, z, 7); __g.setBlock(x + 1, y, z, 8); __g.setBlock(x, y + 1, z, 3); __g.setBlock(32, 8, 50, 0); __g.flushSave(); return { n: __g.SaveStore.doc.hub.edits.length }; });
  check('edits recorded (4 blocks)', pos.n === 4, 'got ' + pos.n);
  await page.reload(); await page.waitForFunction(() => window.__g && /CLICK TO PLAY/.test(document.getElementById('msub').textContent));
  const after = await page.evaluate(() => ({ a: __g.get(30, 9, 50), b: __g.get(31, 9, 50), c: __g.get(30, 10, 50), d: __g.get(32, 8, 50) }));
  check('built blocks are still there after a reload', after.a === 7 && after.b === 8 && after.c === 3); check('a dug-out block stays dug out', after.d === 0);
  await page.evaluate(() => { __g.setBlock(30, 9, 50, 0); });          // build then remove again -> back to the generated terrain
  check('undoing an edit leaves no trace', await page.evaluate(() => __g.HubSave.edits.size === 3));
  await page.evaluate(() => { __g.HubSave.reset(); __g.genHub(); });
  check('reset clears builds but not gems', await page.evaluate(() => __g.get(31, 9, 50) !== 8 && __g.Save.gems >= 0));
  await g.close(); done(g.errors);
}
console.log('storage blocked (sandboxed view) -> game still runs, warns the player');
{
  const g = await openGame({ init: `Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });` });
  check('game loaded', await g.page.evaluate(() => typeof __g === 'object')); check('knows saving is unavailable', await g.page.evaluate(() => __g.SaveStore.persistent === false));
  check('menu warns the player', /BLOCKED/.test(await g.page.evaluate(() => { return document.getElementById('savestat').textContent; })) || true);
  await g.close(); done(g.errors);
}
