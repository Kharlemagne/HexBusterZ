// The Edge of the World and the Abyss: fall off the black sea, long slow fall, greyscale, shifting layouts (1 in 4 bring one back with your build), a rift after 20 minutes.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('edge of the world + the abyss');
const g = await openGame({ width: 480, height: 270 }); const { page } = g; await startPlaying(page);
const Y = (f, a) => page.evaluate(f, a);
await Y(() => { __g.enterRealm('4821 -77'); });
const hubEdits0 = await Y(() => __g.WorldStore.cur.data.edits.length);
// walk to the edge of the world (the lip is the last 8 blocks)
await Y(() => { const P = __g.P; P.x = 3985.5; P.z = 4.5; P.y = 140; __g.OW.update([{ x: P.x, z: P.z }], 20000); __g.OW.pump(20000); P.vx = P.vy = P.vz = 0; for (let i = 0; i < 20; i++) __g.update(1 / 60); });
const e0 = await Y(() => ({ gen: __g.OW.gen, ab: __g.Abyss.on, x: __g.P.x }));
check('still in the realm just inside the lip', e0.gen === 4 && !e0.ab, JSON.stringify(e0));
await Y(() => { const P = __g.P; P.x = 3993.5; P.y = 140; for (let i = 0; i < 3; i++) __g.update(1 / 60); });
const e1 = await Y(() => ({ gen: __g.OW.gen, ab: __g.Abyss.on, ph: __g.Abyss.phase, y: __g.P.y, H: __g.getH() }));
check('going over the edge drops you into the Abyss, high above it, in the fall phase', e1.gen === 5 && e1.ab && e1.ph === 'fall' && e1.y > 300 && e1.H === 384, JSON.stringify(e1));
// the fall is long and slow, then you land
const f = await Y(() => { let minVy = 0, n = 0; while (__g.Abyss.phase === 'fall' && n < 6000) { __g.update(1 / 60); minVy = Math.min(minVy, __g.P.vy); n++; } return { minVy, secs: n / 60, ph: __g.Abyss.phase, y: __g.P.y }; });
check('you fall for a long time (20+ seconds) at a capped speed, then land', f.secs > 20 && f.minVy >= -10.5 && f.ph === 'walk', JSON.stringify(f));
// builds and the 1-in-4 return
const hs = await Y(() => {
  const P = __g.P, A = __g.Abyss, x = Math.floor(P.x), z = Math.floor(P.z), h0 = __g.abyssH(x, z, A.seed());
  for (let i = 0; i < 4; i++) __g.setBlock(x + 3, Math.floor(P.y) + i, z, 33);                  // a little house
  const built = __g.get(x + 3, Math.floor(P.y), z), l1 = A.layout;
  A.shiftNow(2); const gone = __g.get(x + 3, Math.floor(P.y), z), h1 = __g.abyssH(x, z, A.seed());
  A.shiftNow(l1); const back = __g.get(x + 3, Math.floor(P.y), z);
  return { built, gone, back, differs: Math.abs(h0 - h1) > 1, l1, edits: A.edits.size };
});
check('a shift swaps the landscape and your house is gone', hs.built === 33 && hs.gone !== 33 && hs.differs, JSON.stringify(hs));
check('when that layout comes back your house is standing again', hs.back === 33, JSON.stringify(hs));
const ratio = await Y(() => { const A = __g.Abyss; let r0 = A.ret, n = 600; A.history = [1, 2, 3, 4]; A.layout = 99; let back = 0; for (let i = 0; i < n; i++) { const before = A.history.length; A.pickLayout(); if (A.history.length === before) back++; } return back / n; });
check('about 1 shift in 4 brings an old layout back', ratio > .17 && ratio < .33, String(ratio));
// no real-world edits leak out of the Abyss
check('the Abyss never writes into the real save', await Y(() => { __g.flushSave(); return __g.WorldStore.cur.data.edits.length; }) === hubEdits0);
// triggers: not too often, not too consistent
const trig = await Y(() => {
  const A = __g.Abyss, P = __g.P; A.shiftNow(A.layout); const out = [];
  for (let run = 0; run < 12; run++) { A.rollTriggers(); out.push([Math.round(A.gap), Math.round(A.needDist), Math.round(A.needStill), Math.round(A.needTime)]); }
  return { out, minGap: Math.min(...out.map(o => o[0])), spreadDist: new Set(out.map(o => o[1])).size };
});
check('shifts have a cooldown of 60+ seconds and the triggers are randomised each time', trig.minGap >= 60 && trig.spreadDist > 6, JSON.stringify(trig));
const fired = await Y(() => {                                                                  // walking far enough, once the cooldown is over, arms a shift that then fires within ~45 s
  const A = __g.Abyss, P = __g.P; A.rollTriggers(); A.since = A.gap + 1; A.dist = A.needDist + 1; A.fireIn = -1; const l0 = A.layout, sh0 = A.shifts; let t = 0; P.vx = P.vz = 0;
  while (A.shifts === sh0 && t < 70) { __g.update(1 / 60); t += 1 / 60; if (!P.onGround) P.vy = 0; } return { t, shifted: A.shifts > sh0 };
});
check('an armed shift fires within about a minute', fired.shifted && fired.t < 70, JSON.stringify(fired));
const safe = await Y(() => { const A = __g.Abyss, P = __g.P; A.fadeDir = 0; A.phase = 'walk'; A.since = 999; A.dist = 9999; A.fireIn = 0; P.onGround = false; const sh0 = A.shifts; A.tick(.1); const r = A.shifts === sh0 && !A.fadeDir; P.onGround = true; return r; });
check('it never shifts while you are in the air', safe);
await Y(() => { for (let i = 0; i < 6; i++) __g.update(1 / 60); __g.renderFrame(.016); });
await page.screenshot({ path: '/tmp/abyss.png', timeout: 120000 });
// after 20 minutes of wandering a rift opens and takes you home
const ex = await Y(() => {
  const A = __g.Abyss, P = __g.P; A.fadeDir = 0; A.fade = 0; A.wander = 20 * 60 - .05; P.onGround = true; P.vx = P.vz = 0; let opened = false, n = 0;
  while (A.on && n < 3000) { __g.update(1 / 60); if (A.phase === 'exit') opened = true; n++; if (A.phase === 'exit' && n % 60 === 0) { /* wait for the auto-teleport */ } }
  return { opened, on: A.on, gen: __g.OW.gen, map: __g.WorldStore.cur.data.map, secs: n / 60 };
});
check('after 20 minutes a rift opens and teleports you to the ship on its own', ex.opened && !ex.on && ex.gen === 3 && ex.map === null && ex.secs > 4 && ex.secs < 12, JSON.stringify(ex));
check('the Abyss never touched the station build', await Y(() => __g.WorldStore.cur.data.edits.length) === hubEdits0);
await g.close(); done(g.errors);
