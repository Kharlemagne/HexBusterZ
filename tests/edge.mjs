// The Edge of the World: the sea drags harder and harder, past the lip you fall (swirl grows), black for 4 s, then you fade in falling at the top of the Abyss.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('edge pull + fall cinematic');
const g = await openGame({ width: 480, height: 270 }); const { page } = g; await startPlaying(page);
const Y = (f, a) => page.evaluate(f, a);
await Y(() => { __g.enterRealm('4821 -77'); });
const pull = await Y(() => {
  const P = __g.P, E = __g.EdgeFall, out = [];
  P.x = 3900.5; P.z = 4.5; P.y = 80; __g.OW.update([{ x: P.x, z: P.z }], 20000); __g.OW.pump(20000);
  for (const x of [3900.5, 3940.5, 3970.5, 3988.5]) { P.x = x; P.vx = 0; P.vz = 0; P.y = 63.2 + 64; E.pull(.1); out.push(+P.vx.toFixed(2)); }
  return out;
});
check('the pull is nothing far from the edge and gets steadily stronger', pull[0] === 0 && pull[1] > 0 && pull[2] > pull[1] && pull[3] > pull[2], JSON.stringify(pull));
const hold = await Y(() => { const P = __g.P; P.x = 3945.5; P.z = 4.5; P.y = 126.2; P.vx = P.vy = P.vz = 0; __g.keys.KeyW = false; P.yaw = Math.PI / 2; __g.keys.KeyW = true; let x0 = P.x; for (let i = 0; i < 90; i++) __g.update(1 / 60); __g.keys.KeyW = false; return { moved: P.x - x0, vx: P.vx }; });
check('swimming back from the edge outpaces a weak pull near its start', hold.moved < 0, JSON.stringify(hold));
const strong = await Y(() => { const P = __g.P; P.x = 3985.5; P.z = 4.5; P.y = 126.2; P.vx = P.vy = P.vz = 0; P.yaw = Math.PI / 2; __g.keys.KeyW = true; for (let i = 0; i < 300; i++) __g.update(1 / 60); __g.keys.KeyW = false; return { x: P.x, gen: __g.OW.gen, on: __g.EdgeFall.on }; });
check('close to the lip you cannot swim away: you are dragged over', strong.x > 3985.5 && (strong.on || strong.gen === 5), JSON.stringify(strong));
const fall = await Y(() => { const P = __g.P, E = __g.EdgeFall; if (!E.on) { P.x = 3993.5; P.z = 4.5; __g.update(1 / 60); } let n = 0, minY = P.y, vorMax = 0; while (E.on && n < 3600) { __g.update(1 / 60); minY = Math.min(minY, P.y); vorMax = Math.max(vorMax, E.vor); n++; } return { secs: n / 60, y0: minY, vorMax, gen: __g.OW.gen, black: E.black, alive: P.alive }; });
check('you fall for a long time (10+ s), the swirl grows, and then the world swaps to the Abyss', fall.secs > 10 && fall.vorMax > .9 && fall.gen === 5 && fall.alive, JSON.stringify(fall));
const black = await Y(() => ({ op: document.getElementById('edgefade').style.opacity, black: __g.EdgeFall.black }));
check('the screen is fully black right after the swap, for about 4 seconds', black.op === '1' && black.black > 3.5, JSON.stringify(black));
const fin = await Y(() => { const E = __g.EdgeFall; let n = 0; while (E.black > 0 && n < 2000) { E.tick(.05); n++; } const o1 = +document.getElementById('edgefade').style.opacity; for (let i = 0; i < 50; i++) E.tick(.05); const o2 = +document.getElementById('edgefade').style.opacity; for (let i = 0; i < 100; i++) E.tick(.05); return { o1, o2, o3: +document.getElementById('edgefade').style.opacity, phase: __g.Abyss.phase }; });
check('then it fades in slowly while you are still falling at the top of the Abyss', fin.o1 >= .99 && fin.o2 > .2 && fin.o2 < .8 && fin.o3 === 0 && fin.phase === 'fall', JSON.stringify(fin));
await g.close(); done(g.errors);
