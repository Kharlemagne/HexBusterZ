// The crisis-alert sortie: level generator, the mode itself (start, play, win, lose, pause) and the trip back to the hangar.
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('the sortie game mode');
const g = await openGame({ width: 640, height: 360 }); const { page } = g; await startPlaying(page, 3, false, false);
const Y = f => page.evaluate(f);
const gen = await Y(() => { const bad = []; let tot = 0, gates = 0;
  for (let seed = 1; seed <= 150; seed++) for (const tier of [0, 1, 2, 4, 7]) { const L = __g.genSortie(seed * 7919, tier), L2 = __g.genSortie(seed * 7919, tier); tot++;
    if (JSON.stringify(L) !== JSON.stringify(L2)) bad.push('not deterministic ' + seed);
    const last = L.segs[L.segs.length - 1]; if (last.kind !== 'boss' || !last.boss || !(last.boss.hp > 0) || last.boss.phases.length !== 3) bad.push('no boss ' + seed);
    if (L.segs.length !== 3 + Math.min(tier, 3) + 1) bad.push('segment count ' + seed + '/' + tier);
    L.segs.forEach((s, i) => { if (i < L.segs.length - 1 && s.kind !== (i % 2 ? 'combat' : 'transit')) bad.push('kind order');
      let prev = -1, lg = null; for (const e of s.ev) { if (e.t < prev) bad.push('unsorted'); prev = e.t; if (e.t < 0 || e.t > s.len) bad.push('event outside segment ' + e.t + '/' + s.len);
        if (e.k === 'gate') { gates++; const B = __g.SRB; if (e.gx - e.gw / 2 < -B.BX - .02 || e.gx + e.gw / 2 > B.BX + .02 || e.gy - e.gh / 2 < -B.BY - .02 || e.gy + e.gh / 2 > B.BY + .02) bad.push('gate out of bounds'); if (e.gw < 2.85 || e.gh < 2.35) bad.push('gate too tight');
          if (lg) { const reach = Math.max(2, (e.t - lg.t) * 5.5 * .75) + 1e-6; if (Math.abs(e.gx - lg.gx) > Math.min(reach, 7) + 1e-6 && Math.abs(e.gx - lg.gx) > 0.01) { /* bounds can clamp towards the last gap only */ if (Math.abs(e.gx - lg.gx) > Math.min(reach, 7) + 1e-6) bad.push('gate unreachable ' + (e.gx - lg.gx).toFixed(1) + ' in ' + (e.t - lg.t).toFixed(2)); } } lg = e; } } });
  }
  return { tot, gates, bad: [...new Set(bad)].slice(0, 6) }; });
check('the generator is deterministic and every level is valid (' + gen.tot + ' levels, ' + gen.gates + ' gates)', gen.bad.length === 0 && gen.gates > 500, JSON.stringify(gen));
const diff = await Y(() => { const a = __g.genSortie(555, 0), b = __g.genSortie(556, 0), c = __g.genSortie(555, 3); const n = L => L.segs.reduce((s, x) => s + x.ev.length, 0); return { differs: JSON.stringify(a) !== JSON.stringify(b), harder: n(c) > n(a), segs: [a.segs.length, c.segs.length], hp: [a.segs[a.segs.length - 1].boss.hp, c.segs[c.segs.length - 1].boss.hp] }; });
check('different seeds give different levels and higher tiers are longer and tougher', diff.differs && diff.harder && diff.hp[1] > diff.hp[0], JSON.stringify(diff));
// the ship you fly comes from the builder
const ship = await Y(() => { const S = __g.srBuildShip(null), Y2 = __g.Yard, id = n => __g.SPARTS.findIndex(p => p.id === n); const rows = [[5, 4, 7, 'helm', 0, 0, 0, 0, 0], [5, 4, 8, 'plate', 0, 0, 0, 0, 0], [5, 4, 9, 'ion', 0, 0, 0, 0, 0], [4, 4, 7, 'twin', 0, 0, 0, 0, 0], [6, 4, 7, 'lance', 0, 0, 0, 0, 0]]; const T = __g.srBuildShip(rows); return { starterGuns: S.guns.length, starterBlocks: S.items.length, guns: T.guns.map(x => x.kind).sort().join(','), spd: T.st.spd, s: T.s > 0 && T.s <= .34 }; });
check('the sortie ship is built from the blueprint blocks (guns come from armament blocks)', ship.starterGuns >= 2 && ship.starterBlocks > 15 && ship.guns === 'lance,twin' && ship.spd === 10 && ship.s, JSON.stringify(ship));
// launch from the terminal
await Y(() => { const P = __g.P; P.x = 22; P.z = -6; P.y = 41.01; for (let i = 0; i < 3; i++) __g.update(1 / 60); });
const at = await Y(() => __g.Sortie.near());
await Y(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE' })); });
await page.waitForTimeout(300);
const st = await Y(() => ({ state: __g.state(), on: __g.SR.on, phase: __g.SR.phase, hull: __g.SR.ship.hull, name: __g.SR.lvl.name }));
check('E at the red crisis terminal launches a sortie', at === true && st.state === 'sortie' && st.on && st.phase === 'intro' && st.hull >= 4, JSON.stringify(st));
// pause
await Y(() => { __g.Sortie.keydown({ code: 'Escape' }); }); const p1 = await Y(() => { const t = __g.SR.T; __g.Sortie.update(1 / 60); return { paused: __g.SR.pause, same: __g.SR.T === t }; });
await Y(() => { __g.Sortie.keydown({ code: 'Escape' }); });
check('Escape pauses the sortie', p1.paused && p1.same && (await Y(() => !__g.SR.pause)));
// fly the whole level with the test pilot in god mode
const win = await Y(() => { const S = __g.SR; S.god = true; S.auto = true; let n = 0, segs = new Set(), seenBoss = false, maxBul = 0, maxEn = 0; while (S.phase !== 'result' && n++ < 60 * 400) { __g.Sortie.update(1 / 60); if (S.seg >= 0) segs.add(S.seg); if (S.boss) seenBoss = true; maxBul = Math.max(maxBul, S.eb.length); maxEn = Math.max(maxEn, S.enemies.length); } return { phase: S.phase, won: S.result && S.result.won, seconds: Math.round(n / 60), segs: [...segs].length, total: S.lvl.segs.length, seenBoss, maxBul, maxEn, score: S.score, kills: S.kills }; });
check('a whole sortie plays through: transit, combat and a boss, ending in victory', win.phase === 'result' && win.won && win.segs === win.total && win.seenBoss && win.kills > 8 && win.maxBul > 10, JSON.stringify(win));
const gems0 = await Y(() => __g.SaveStore.doc.profile.gems);
await Y(() => { __g.Sortie.keydown({ code: 'Enter' }); });
const back = await Y(() => { const P = __g.P; return { state: __g.state(), on: __g.SR.on, y: P.y, x: P.x, z: P.z, tier: __g.Yard.store().tier, best: __g.Yard.store().best }; });
check('winning drops you back in the hangar, ready to play again', back.state === 'play' && !back.on && back.y > 40 && back.y < 45 && Math.abs(back.x - 6) < 1 && back.tier === 1 && back.best > 0, JSON.stringify(back));
check('the next sortie is a higher tier', (await Y(() => { __g.Sortie.start(); const t = __g.SR.tier; __g.Sortie.exit(false); return t; })) === 1);
// losing
const lose = await Y(() => { const st0 = __g.state(), on0 = __g.SR.on; __g.setState('play'); __g.Sortie.start(99, 0); if (!__g.SR.on) return { phase: 'nostart', st0, on0 }; const S = __g.SR; S.phase = 'run'; S.god = false; S.ship.hull = 1; S.ship.inv = 0; __g.Sortie.hurt(); let n = 0; while (S.phase !== 'result' && n++ < 400) __g.Sortie.update(1 / 60); return { phase: S.phase, n, pt: S.pt, pause: S.pause, on: S.on, won: S.result && S.result.won, gems: S.result && S.result.gems }; });
check('losing the ship ends the sortie with a result card, no bonus', lose.phase === 'result' && lose.won === false && lose.gems >= 0, JSON.stringify(lose));
await Y(() => { __g.Sortie.keydown({ code: 'Enter' }); });
check('and returns you to the hangar', (await Y(() => __g.state())) === 'play');
// real hits: a bullet on the ship hurts, i-frames protect, a bomb clears bullets
const hit = await Y(() => { __g.setState('play'); __g.Sortie.start(5, 0); const S = __g.SR; S.phase = 'run'; S.god = false; const s = S.ship; s.inv = 0; const h0 = s.hull;
  S.eb.push({ x: s.x, y: s.y, z: -.2, vx: 0, vy: 0, vz: 20, r: .26, t: 0, c: 0 }); __g.Sortie.update(1 / 60); const h1 = s.hull; S.eb.push({ x: s.x, y: s.y, z: -.2, vx: 0, vy: 0, vz: 20, r: .26, t: 0, c: 0 }); __g.Sortie.update(1 / 60); const h2 = s.hull;
  s.inv = 0; for (let i = 0; i < 20; i++) S.eb.push({ x: 3, y: 1, z: -20 - i, vx: 0, vy: 0, vz: 5, r: .26, t: 0, c: 0 }); const b0 = S.eb.length, bombs = s.bombs; __g.Sortie.bomb(); const o = { h0, h1, h2, cleared: b0 > 10 && S.eb.length === 0, bombsUsed: bombs - s.bombs }; __g.Sortie.exit(false); return o; });
check('a bullet on the ship costs one hull point, then i-frames protect it; a bomb clears every bullet', hit.h1 === hit.h0 - 1 && hit.h2 === hit.h1 && hit.cleared && hit.bombsUsed === 1, JSON.stringify(hit));
await g.close(); done(g.errors);
