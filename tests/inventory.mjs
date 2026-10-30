// Inventory: starter kit, breaking gives items, placing uses them up, stacks/limits, saving, ore shards, shop selling, creative mode.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('inventory');
const g = await openGame({ width: 320, height: 200 }); const { page } = g; await startPlaying(page);
const I = f => page.evaluate(f);
check('new profiles get a starter kit in the hotbar', await I(() => __g.Inv.slots[0].n === 64 && __g.Inv.slots.filter(Boolean).length === 9));
// dig kit: break and place via the real weapon code path
const r = await I(() => {
  const P = __g.P; P.weapon = -1; __g.switchWeapon(4); P.x = 20.5; P.z = 50.5; P.y = 9.01; P.pitch = -1.55; P.yaw = 0;
  const y = __g.topY(20, 50); const id = __g.get(20, y, 50), before = __g.Inv.count(id);
  __g.mouse.l = true; for (let i = 0; i < 12; i++) __g.update(1 / 60); __g.mouse.l = false;
  const dropped = __g.drops.length;                                                    // the block pops out as a drop first...
  for (let i = 0; i < 120; i++) __g.update(1 / 60);                                      // ...and is collected when you are next to it
  const dug = __g.get(20, y, 50) === 0, after = __g.Inv.count(id);
  const sel = __g.Inv.selBlock(), selBefore = __g.Inv.count(sel);
  const cnt = () => { let n = 0; for (let x = 14; x <= 27; x++) for (let z = 44; z <= 57; z++) for (let y = 8; y <= 11; y++) if (__g.get(x, y, z) === sel) n++; return n; };
  P.x = 22.5; P.z = 50.5; P.y = 9.01; P.pitch = -.9; const c0 = cnt();
  __g.mouse.r = true; for (let i = 0; i < 12; i++) __g.update(1 / 60); __g.mouse.r = false;
  return { id, y, dug, dropped, left: __g.drops.length, gained: after - before, placed: cnt() === c0 + 1, used: selBefore - __g.Inv.count(sel) };
});
check('breaking a block leaves a drop that you then pick up', r.dug && r.dropped >= 1 && r.left === 0 && r.gained >= 1, JSON.stringify(r));
check('placing a block uses one up', r.placed && r.used === 1, JSON.stringify(r));
const dr = await I(() => { const P = __g.P, I = __g.Inv; I.load(); P.x = 25.5; P.z = 50.5; P.y = 9.01; __g.drops.length = 0;
  __g.spawnDrop(30.5, 9.5, 50.5, 2, 3, 0, 0, 0); const c0 = I.count(2); for (let i = 0; i < 30; i++) __g.update(1 / 60); const far = I.count(2) === c0 && __g.drops.length === 1;   // 5 blocks away: not picked up
  P.x = 28.5; for (let i = 0; i < 90; i++) __g.update(1 / 60); const near = I.count(2) === c0 + 3 && __g.drops.length === 0;                                                       // walk closer: magnet pulls it in
  __g.spawnDrop(28.5, 9.5, 50.5, 2, 1, 0, 0, 0); __g.spawnDrop(28.8, 9.5, 50.5, 2, 1, 0, 0, 0); const merged = __g.drops.length === 1 && __g.drops[0].n === 2; __g.drops.length = 0;
  I.creative = true; P.weapon = -1; __g.switchWeapon(4); P.pitch = -1.5; const y = __g.topY(28, 50); __g.mouse.l = true; for (let i = 0; i < 12; i++) __g.update(1 / 60); __g.mouse.l = false; const none = __g.drops.length === 0; I.creative = false;
  return { far, near, merged, none }; });
check('drops: not picked up from afar, pulled in when close, stack with neighbours, none in creative mode', dr.far && dr.near && dr.merged && dr.none, JSON.stringify(dr));
const full = await I(() => { const I = __g.Inv; const left = I.add(3, 5000); return { left, free: I.slots.filter(s => !s).length, max: Math.max(...I.slots.map(s => s ? s.n : 0)) }; });
check('stacks cap at 99 and a full bag refuses extra items', full.max === 99 && full.free === 0 && full.left > 0, JSON.stringify(full));
await I(() => { __g.Inv.load(); });
// ore -> shards -> gems
const ore = await I(() => { const I = __g.Inv; I.load(); const [k, n] = [__g.OW.get ? 'shard' : 0, 2]; I.add('shard', 3); return I.count('shard'); });
check('shards stack as a special item', ore === 3);
const sold = await I(() => { const g0 = __g.Save.gems; __g.openShop(); __g.sellShards(); return __g.Save.gems - g0; });
check('Vex buys shards for gems (3 each)', sold === 9, String(sold));
// inventory screen
const ui = await I(() => {
  const I = __g.Inv; I.load(); __g.setState('play'); __g.openInv(); const open = __g.state() === 'inv';
  I.click(0, false, false); const held = I.cursor && I.cursor.n === 64; I.click(15, false, false); const moved = I.slots[15] && I.slots[15].n === 64 && !I.slots[0] && !I.cursor;
  I.click(15, true, false); const half = I.cursor && I.cursor.n === 32 && I.slots[15].n === 32; I.click(15, false, false); const merged = I.slots[15].n === 64 && !I.cursor;
  I.click(15, false, true); const quick = I.slots[0] && I.slots[0].n === 64;                    // shift-click sends it back to the hotbar
  __g.closeInv(); return { open, held, moved, half, merged, quick, closed: __g.state() === 'play' };
});
check('inventory screen: open, pick up, move, split, merge, shift-click, close', Object.values(ui).every(Boolean), JSON.stringify(ui));
const doll = await I(() => { __g.openInv(); __g.renderFrame(.016); const cv = document.getElementById('charcv'); __g.drawCharPreview(cv, .3, .1, 0, 0, 0); const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) n++; const parts = __g.playerParts(2).length; __g.closeInv(); return { n, parts }; });
check('the character screen draws the skeleton-robot model', doll.n > 1500 && doll.parts > 40, JSON.stringify(doll));
const saved = await I(() => { const I = __g.Inv; I.slots[3] = { k: 12, n: 33 }; I.creative = true; __g.flushSave(); return JSON.parse(localStorage.getItem('hbz.w.' + __g.WorldStore.cur.meta.id)).inv; });
check('inventory is written to the save', saved && saved.slots[3][1] === 33 && saved.creative === true);
await page.reload(); await page.waitForFunction(() => window.__g && /CLICK TO PLAY/.test(document.getElementById('msub').textContent)); await startPlaying(page);
check('inventory survives a reload', await I(() => __g.Inv.slots[3] && __g.Inv.slots[3].n === 33 && __g.Inv.creative === true));
const cre = await I(() => { const I = __g.Inv; I.slots[3].n = 5; const sel = 3; I.sel = sel; const left = I.slots[3].n; I.useSel(); return { left: I.slots[3].n, creative: I.creative }; });
check('creative mode places without using blocks up', cre.left === 5 && cre.creative);
await g.close(); done(g.errors);
