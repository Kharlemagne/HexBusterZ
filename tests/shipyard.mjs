// The Hangar's ship builder: terminal, grid editing with the keyboard, budget, mirror, undo, blueprints and the hangar display.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('the ship builder');
const g = await openGame({ width: 640, height: 360 }); const { page } = g; await startPlaying(page, 3, false, false);
const tap = async c => { await page.evaluate(c => { window.dispatchEvent(new KeyboardEvent('keydown', { code: c })); window.dispatchEvent(new KeyboardEvent('keyup', { code: c })); }, c); };
const Y = f => page.evaluate(f);
// every block shape must be a real mesh that fits in its cell, in all 4 turns
const mesh = await Y(() => { const bad = []; for (const p of __g.SPARTS) for (let r = 0; r < 4; r++) { const m = __g.ShipMesh.mesh(p.shape, r, r, 0, r === 1); if (!m.faces.length) bad.push(p.id + ' empty'); for (const f of m.faces) for (const v of f.v) if (v.some(a => Math.abs(a) > .5001 || !isFinite(a))) bad.push(p.id + ' out of cell'); } return { bad: bad.slice(0, 5), n: __g.SPARTS.length, cats: [...new Set(__g.SPARTS.map(p => p.cat))].length }; });
check('every ship block has a mesh that stays inside its cell (' + mesh.n + ' blocks in ' + mesh.cats + ' groups)', mesh.bad.length === 0 && mesh.n >= 25 && mesh.cats === 4, JSON.stringify(mesh));
// the terminal
const far = await Y(() => { const P = __g.P; P.x = 6; P.z = 20; P.y = 41.01; for (let i = 0; i < 3; i++) __g.update(1 / 60); return __g.Yard.near(); });
const nearT = await Y(() => { const P = __g.P; P.x = 6; P.z = -6; P.y = 41.01; for (let i = 0; i < 3; i++) __g.update(1 / 60); return __g.Yard.near(); });
check('the ship builder terminal only answers when you stand at it', far === false && nearT === true, JSON.stringify([far, nearT]));
await tap('KeyE'); await page.waitForTimeout(300);
check('E at the terminal opens the builder and pauses play', (await Y(() => __g.state())) === 'builder');
// build with the keyboard
await tap('Digit4'); await tap('Enter');                                   // command dome at the cursor
await tap('Digit1'); await tap('KeyW'); await tap('Enter');                // a plate one cell further
const a = await Y(() => ({ n: __g.Yard.blocks.size, cur: __g.Yard.cur.slice() }));
check('keys move the cursor and place blocks', a.n === 2 && a.cur[2] === 6, JSON.stringify(a));
await tap('KeyX');
check('X removes the block under the cursor', (await Y(() => __g.Yard.blocks.size)) === 1);
await Y(() => { const e = new KeyboardEvent('keydown', { code: 'KeyZ', ctrlKey: true }); window.dispatchEvent(e); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyZ' })); });
check('Ctrl+Z brings the removed block back', (await Y(() => __g.Yard.blocks.size)) === 2);
// mirror + budget
const m = await Y(() => { const Y = __g.Yard; Y.blocks.clear(); Y.items = null; Y.mirror = true; Y.cur = [2, 3, 4]; Y.part = __g.SPARTS.findIndex(p => p.id === 'bolt'); Y.place(); const left = Y.blocks.get(Y.key(2, 3, 4)), right = Y.blocks.get(Y.key(8, 3, 4)); return { n: Y.blocks.size, lm: left && left.m, rm: right && right.m }; });
check('mirror places a flipped twin on the other side', m.n === 2 && m.lm === false && m.rm === true, JSON.stringify(m));
const b = await Y(() => { const Y = __g.Yard; Y.blocks.clear(); Y.mirror = false; Y.part = __g.SPARTS.findIndex(p => p.id === 'lance'); let placed = 0; for (let j = 0; j < 9; j++) for (let k = 0; k < 15; k++) for (let i = 0; i < 11; i++) { Y.cur = [i, j, k]; const before = Y.blocks.size; Y.place(); if (Y.blocks.size > before) placed++; } const s = Y.stats(); return { placed, cost: s.cost }; });
check('the 1000 point budget stops you placing more', b.cost <= 1000 && b.cost > 880 && b.placed === 9, JSON.stringify(b));
// blueprints
const s1 = await Y(() => { const Y = __g.Yard; Y.blocks.clear(); Y.items = null; Y.mirror = true; Y.slot = 2; const id = n => __g.SPARTS.findIndex(p => p.id === n); Y.cur = [5, 1, 6]; Y.part = id('plate'); Y.place(); Y.name = 'test one'; Y.saveSlot(); const none = Y.store().slots[2]; return { noHelm: none === null }; });
check('a ship with no command block cannot be saved', s1.noHelm === true);
const s2 = await Y(() => { const Y = __g.Yard, id = n => __g.SPARTS.findIndex(p => p.id === n); Y.cur = [5, 2, 6]; Y.part = id('helm'); Y.place(); Y.cur = [3, 1, 8]; Y.part = id('ion'); Y.rx = 0; Y.place(); Y.saveSlot(); const sl = Y.store().slots[2]; return { name: sl && sl.name, n: sl && sl.blocks.length, active: Y.store().active }; });
check('a ship with a command block saves into its slot and goes on the pad', s2.name === 'TEST ONE' && s2.n === 4 && s2.active === 2, JSON.stringify(s2));
const s3 = await Y(() => { const Y = __g.Yard; Y.blocks.clear(); Y.load(null); const n0 = Y.blocks.size; Y.slot = 2; Y.loadSlot(); return { n0, n1: Y.blocks.size, name: Y.name }; });
check('loading a blueprint brings the whole ship back', s3.n0 === 0 && s3.n1 === 4 && s3.name === 'TEST ONE', JSON.stringify(s3));
const disp = await Y(() => { const raw = JSON.parse(JSON.stringify(__g.SaveStore.doc.extras.ships)); return { kept: raw.slots[2] && raw.slots[2].blocks.length, items: typeof shipDisplayItems === 'function' }; });
check('the blueprint lives in the save file', disp.kept === 4, JSON.stringify(disp));
await tap('Escape'); await page.waitForTimeout(200);
check('Escape leaves the builder and gives you control back', (await Y(() => __g.state())) === 'play' && (await Y(() => __g.Yard.store().draft.length)) === 4);
// the pad display must draw without errors
await Y(() => { for (let i = 0; i < 10; i++) __g.update(1 / 60); __g.renderFrame && __g.renderFrame(); });
await page.waitForTimeout(500);
await g.close(); done(g.errors);
