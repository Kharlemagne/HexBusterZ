// Mining and building feel: reach cap, break timers that reset, post-break cooldown, click-vs-hold placing, no self-walling; drops merge / stack / fly in; holo data.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('mining, placing, drops');
const g = await openGame({ width: 320, height: 200 }); const { page } = g; await startPlaying(page, 2);
const Y = (f, a) => page.evaluate(f, a);
await Y(() => {
  const G = __g, P = G.P;
  for (let x = 20; x < 40; x++) for (let z = 106; z < 126; z++) { G.setBlock(x, 104, z, 3); for (let y = 105; y < 112; y++) G.setBlock(x, y, z, 0); }
  G.Inv.creative = false; G.Inv.slots.fill(null); G.Inv.slots[0] = { k: 1, n: 64 }; G.Inv.sel = 0; P.weapon = 4; G.drops.length = 0;
  window.stand = () => { P.x = 28.5; P.z = 110.5; P.y = 105.01; P.vx = P.vy = P.vz = 0; P.yaw = Math.PI; P.pitch = 0; };      // yaw PI looks toward +z
  window.run = (s, f) => { const n = Math.round(s * 60); for (let i = 0; i < n; i++) { stand(); if (f) f(); G.update(1 / 60); } };
  window.wall = (z, id) => { for (let y = 105; y < 109; y++) for (let x = 26; x < 32; x++) G.setBlock(x, y, z, id); };
  stand();
});
const reach = await Y(() => { const G = __g; wall(115, 1); stand(); const near = !!G.targetBlock(); wall(115, 0); wall(116, 1); stand(); const far = !!G.targetBlock(); G.Inv.creative = true; wall(116, 0); wall(115, 1); G.setBlock(28, 106, 115, 0); wall(116, 1); stand(); const c5 = G.targetBlock(); G.Inv.creative = false; const s5 = G.targetBlock(); wall(115, 0); wall(116, 0); return { near, far, r: G.reach(), c5: !!c5, s5: !!s5 }; });
check('reach is 4.5 blocks (a wall 4.5 away is in reach, 5.5 away is not)', reach.near && !reach.far && reach.r === 4.5, JSON.stringify(reach));
const mine = await Y(() => { const G = __g; wall(113, 1); wall(114, 1); G.mouse.l = true; run(.5); const half = G.get(28, 106, 113), p = G.Mine.p; run(.35); const gone = G.get(28, 106, 113), drops = G.drops.length;
  run(.15); const pCool = G.Mine.p, behind = G.get(28, 106, 114); run(1.0); const behind2 = G.get(28, 106, 114); G.mouse.l = false; run(.05); return { hard: G.hardness(1), half, p, gone, drops, pCool, behind, behind2, swing: G.P.swing }; });
check('a block takes its hardness in seconds to break (basalt 0.8 s), not one frame', mine.hard === .8 && mine.half === 1 && mine.p > .4 && mine.gone === 0, JSON.stringify(mine));
check('after a break there is a 0.25 s pause before the block behind starts', mine.pCool === 0 && mine.behind === 1 && mine.behind2 === 0, JSON.stringify(mine));
check('breaking leaves a drop and the arm does not swing', mine.drops >= 1 && mine.swing === 0, JSON.stringify(mine));
const shr = await Y(() => { const G = __g; wall(113, 1); wall(114, 0); G.mouse.l = true; run(.4); const hid = G.MHIDE.on && G.MHIDE.z === 113, still = G.get(28, 106, 113); G.mouse.l = false; run(.05); const back = !G.MHIDE.on; G.drops.length = 0; G.mouse.l = true; run(.9); G.mouse.l = false; const d = G.drops[0]; run(.02); return { hid, still, back, drop: d && [d.x - 28.5, d.z - 113.5, +d.vx.toFixed(2)], after: G.MHIDE.on }; });
check('the mined block leaves the terrain mesh to be drawn shrinking, and comes back if you let go', shr.hid && shr.still === 1 && shr.back && !shr.after, JSON.stringify(shr));
check('the drop appears exactly where the block shrank (no pop sideways)', shr.drop && Math.abs(shr.drop[0]) < .01 && Math.abs(shr.drop[1]) < .01 && shr.drop[2] === 0, JSON.stringify(shr));
const reset = await Y(() => { const G = __g, P = G.P; wall(113, 1); G.mouse.l = true; run(.5); const p1 = G.Mine.p; run(.1, () => { P.yaw = Math.PI + .45; }); const p2 = G.Mine.p; G.mouse.l = false; run(.05); G.mouse.l = true; run(.3); G.mouse.l = false; run(.03); const p3 = G.Mine.p; return { p1, p2, p3 }; });
check('progress restarts when the crosshair moves to another block, and is lost when you let go', reset.p1 > .4 && reset.p2 < .15 && reset.p3 === 0, JSON.stringify(reset));
const place = await Y(() => { const G = __g, P = G.P; for (let x = 20; x < 40; x++) for (let z = 106; z < 126; z++) for (let y = 105; y < 112; y++) G.setBlock(x, y, z, 0); const cnt = () => { let n = 0; for (let x = 20; x < 40; x++) for (let z = 106; z < 126; z++) for (let y = 105; y < 112; y++) if (G.get(x, y, z) === 1) n++; return n; };
  G.drops.length = 0; G.Inv.slots.fill(null); G.Inv.slots[0] = { k: 1, n: 64 }; G.Inv.sel = 0; let yw = Math.PI - .7; const look = () => { P.pitch = -.5; P.yaw = (yw += .02); };       // sweep across the floor so every block has somewhere to go
  const c0 = cnt(); G.mouse.r = true; run(1 / 60, look); const one = cnt() - c0; run(1.0, look); const held = cnt() - c0; G.mouse.r = false; run(.03, look);
  const c1 = cnt(); for (let i = 0; i < 3; i++) { G.mouse.r = true; run(1 / 60, look); G.mouse.r = false; run(1 / 60, look); } const clicks = cnt() - c1;
  P.pitch = -1.5; const c2 = cnt(); G.mouse.r = true; run(.5, () => { P.pitch = -1.5; }); G.mouse.r = false; const self = cnt() - c2, inside = G.get(28, 105, 110) + G.get(28, 106, 110);
  return { one, held, clicks, self, inside}; });
check('a press places one block at once; holding repeats every 0.2 s (about 5 more in a second)', place.one === 1 && place.held >= 4 && place.held <= 7, JSON.stringify(place));
check('fast clicking is never slowed down (3 clicks in 0.1 s = 3 blocks)', place.clicks === 3, JSON.stringify(place));
check('you cannot place a block inside yourself', place.inside === 0, JSON.stringify(place));
const dr = await Y(() => { const G = __g, P = G.P; for (let x = 20; x < 40; x++) for (let z = 106; z < 126; z++) for (let y = 105; y < 112; y++) G.setBlock(x, y, z, 0); G.drops.length = 0; G.Inv.slots.fill(null);
  G.spawnDrop(34.5, 105.3, 120.5, 5, 1, 0, 0, 0); G.spawnDrop(35.6, 105.3, 120.5, 5, 20, 0, 0, 0); const merged = G.drops.length === 1 && G.drops[0].n === 21;
  G.spawnDrop(34.5, 105.3, 123.5, 7, 1, 0, 0, 0); const other = G.drops.length;
  P.weapon = 0; run(1.5); const far = G.drops.length, flew = G.drops.some(d => d.fly);                 // the player stands 10 blocks away: nothing moves
  window.stand = () => { P.x = 34.5; P.z = 119.2; P.y = 105.01; P.vx = P.vy = P.vz = 0; }; run(1.2); const got = G.Inv.count(5), left = G.drops.map(d => d.k);
  return { merged, other, far, flew, got, left, copies: [1, 2, 17, 33, 64].map(G.dropCopies), runsBlock: G.itemRuns(5).length, runsBucket: G.itemRuns('bucket').length }; });
check('identical drops within 1.5 blocks merge into one', dr.merged && dr.other === 2, JSON.stringify(dr));
check('a stack is drawn as 2 to 5 copies', JSON.stringify(dr.copies) === '[1,2,3,4,5]', JSON.stringify(dr.copies));
check('drops only fly to you from about a block away, then go into the inventory', dr.far === 2 && !dr.flew && dr.got === 21 && dr.left.length === 1 && dr.left[0] === 7, JSON.stringify(dr));
check('every item has 16x16 pixel art for the hologram and the dropped slab', dr.runsBlock > 10 && dr.runsBucket > 10, JSON.stringify(dr));
await g.close(); done(g.errors);
