// Rendering: textures, sky and day/night produce sane output and no GL errors.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('rendering');
const g = await openGame({ width: 400, height: 240 }); const { page } = g; await startPlaying(page);
const r = await page.evaluate(() => {
  const out = {}, gl = document.getElementById('c').getContext('webgl'), P = __g.P;
  const DN = __g.DayNight; DN.len = 1e9;
  const A = (typeof makeAtlas === 'function') ? makeAtlas() : null;
  out.atlas = A && A.canvas.width === 256 && A.avg.length === 768;
  const px = new Uint8Array(4); const sample = (fx, fy) => { gl.readPixels(Math.floor(400 * fx), Math.floor(240 * fy), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return Array.from(px.slice(0, 3)); };
  const frame = (tod, pitch) => { DN.t = tod; P.pitch = pitch; P.yaw = Math.PI; P.x = 32.5; P.z = 120.5; P.y = __g.topY(32, 120) + 40; P.vy = 0; __g.renderFrame(.016); return { err: gl.getError() }; };
  frame(.5, 0); const noon = { err: gl.getError(), top: sample(.5, .97), hor: sample(.5, .5) };
  const night = frame(.02, 0); night.top = sample(.5, .97); night.hor = sample(.5, .5);
  out.noon = noon; out.night = night;
  out.amb = { noon: (DN.t = .5, DN.state(0, 0).amb), night: (DN.t = .02, DN.state(0, 0).amb) }; out.clock = (DN.phase = 'day', DN.ev = null, DN.clock());
  out.stars = (DN.t = .02, DN.state(0, 0).stars) > .9 && (DN.t = .5, DN.state(0, 0).stars) < .05;
  const lum = c => c[0] + c[1] + c[2];
  out.skyBrighter = lum(noon.top) > 0 && lum(noon.hor) !== lum(noon.top);
  // dungeon still renders (no day/night there) without GL errors
  __g.enterDungeon(5); for (let i = 0; i < 5; i++) __g.update(1 / 60); __g.renderFrame(.016); out.dungeonErr = gl.getError();
  return out;
});
check('the texture atlas is built (256x256 + average colours)', r.atlas);
check('no GL errors drawing the open world by day and night', r.noon.err === 0 && r.night.err === 0 && r.dungeonErr === 0, JSON.stringify([r.noon.err, r.night.err, r.dungeonErr]));
check('night is much darker than noon', r.amb.noon > .95 && r.amb.night < .35, JSON.stringify(r.amb));
check('stars only at night; the clock says DAY by day', r.stars && r.clock === 'DAY');
check('the sky is a gradient with a visible horizon (zenith differs from horizon)', r.skyBrighter, JSON.stringify([r.noon.top, r.noon.hor]));
check('night sky is darker than the day sky', (r.night.top[0] + r.night.top[1] + r.night.top[2]) < (r.noon.top[0] + r.noon.top[1] + r.noon.top[2]), JSON.stringify([r.night.top, r.noon.top]));
// the sky changes by events, not a cycle: a rift opens, the other group climbs out and destroys the one that was there
const t = await page.evaluate(() => {
  __g.enterHub(false, false); const DN = __g.DayNight; DN.phase = 'day'; DN.ev = null; DN.idle = 1; DN.pose();
  const out = { before: DN.phase, sun: DN.sv.slice() };
  for (let i = 0; i < 70; i++) DN.tick(.1);                                    // idle ran out -> the event has started
  out.started = !!DN.ev; out.gate = DN.gate[3] > 0; const mid = []; for (let i = 0; i < 100; i++) { DN.tick(.1); if (DN.ev && DN.ev.age > 9.7 && DN.ev.age < 9.9) mid.push(DN.beams.length); }
  out.beams = mid.length ? mid[0] : 0; for (let i = 0; i < 100; i++) DN.tick(.1);
  out.after = DN.phase; out.ev = !!DN.ev; out.moons = DN.mv.slice(); out.suns = DN.sv.slice(); out.tt = DN.t;
  DN.collect(); __g.flushSave(); out.saved = JSON.parse(localStorage.getItem('hbz.w.' + __g.WorldStore.cur.meta.id)).time;
  const pk = DN.pack(); out.pack = pk; return out;
});
check('a rift opens when the day runs out, with a gate and beams', t.started && t.gate && t.beams === 4, JSON.stringify(t));
check('afterwards it is night: moons up, suns gone, no event running', t.after === 'night' && !t.ev && t.moons.every(v => v === 1) && t.suns.every(v => v === 0), JSON.stringify(t));
check('the time of day is saved', t.saved === 0, String(t.saved));
await g.close(); done(g.errors);
