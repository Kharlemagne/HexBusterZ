// Buckets work like Minecraft's: empty bucket scoops a source, a full one pours a source, flowing water can't be scooped.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('buckets');
const g = await openGame({ width: 320, height: 200 }); const { page } = g; await startPlaying(page, 2);
const Y = (f, a) => page.evaluate(f, a);
const r = await Y(() => {
  const G = __g, P = G.P; const out = {};
  for (let x = 24; x < 34; x++) for (let z = 110; z < 120; z++) { G.setBlock(x, 104, z, 3); for (let y = 105; y < 112; y++) G.setBlock(x, y, z, 0); }
  G.Inv.creative = false; G.Inv.slots[0] = { k: 'bucket', n: 2 }; G.Inv.sel = 0; P.weapon = 4;
  G.setBlock(28, 105, 115, 3600);
  P.x = 28.5; P.z = 112.5; P.y = 105; P.yaw = 0; P.pitch = 0;
  const e = G.eyePos(); // aim at the source from 3 blocks away
  const look = (tx, ty, tz) => { const d = [tx - e[0], ty - e[1], tz - e[2]], L = Math.hypot(...d); P.yaw = Math.atan2(-d[0], -d[2]); P.pitch = Math.asin(d[1] / L); };
  look(28.5, 105.5, 115.5); out.yaw = P.yaw;
  G.mouse.r = true; for (let i = 0; i < 6; i++) G.update(1 / 30); G.mouse.r = false;
  out.scooped = G.get(28, 105, 115) === 0; out.inv = G.Inv.slots.map(s => s && s.k).filter(Boolean);
  return out;
});
check('an empty bucket scoops a water source into a water bucket', r.scooped && r.inv.includes('bucket_water'), JSON.stringify(r));
const r2 = await Y(() => {
  const G = __g, P = G.P; G.Inv.sel = G.Inv.slots.findIndex(s => s && s.k === 'bucket_water');
  const e = G.eyePos(), d = [28.5 - e[0], 104.5 - e[1], 115.5 - e[2]], L = Math.hypot(...d); P.yaw = Math.atan2(-d[0], -d[2]); P.pitch = Math.asin(d[1] / L);
  G.mouse.r = true; for (let i = 0; i < 6; i++) G.update(1 / 30); G.mouse.r = false;
  let src = 0; for (let z = 113; z <= 116; z++) if (G.get(28, 105, z) === 3600) src = 3600; return { src, inv: G.Inv.slots.map(s => s && s.k).filter(Boolean) };
});
check('a water bucket pours a source and turns back into an empty bucket', r2.src === 3600 && r2.inv.includes('bucket') && !r2.inv.includes('bucket_water'), JSON.stringify(r2));
await g.close(); done(g.errors);
