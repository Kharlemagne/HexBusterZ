// ---------------- the 20 attacks ----------------
// run(e, pieceIndex, src) returns false if it cannot be used right now
const addFx = (e, dur, upd, end) => e.fx.push({ t: dur, dur, upd, end });
const ATK_RUN = {
  fireball_ring(e, i, s) { const d = aimFrom(s, 0, blindErr(e)); for (let k = 0; k < 14; k++) bShot(s, rotYaw(d, k / 14 * TAU), 13, 11, .42); tone(180, .3, 'sawtooth', .2, 80); return true; },
  triple_volley(e, i, s) { for (let k = -1; k <= 1; k++) { const d = aimFrom(s, .15, blindErr(e) + .01); bShot(s, rotYaw(d, k * .12), 22, 12, .45); } tone(260, .2, 'square', .15, 120); return true; },
  spiral_barrage(e, i, s) {
    addFx(e, 2.4, (f, dt) => { f.acc = (f.acc || 0) + dt; f.a = f.a === undefined ? rnd(TAU) : f.a; while (f.acc > .07) { f.acc -= .07; f.a += .55; const q = pieceSrc(e, i); for (let k = 0; k < 2; k++) { const a = f.a + k * Math.PI; bShot(q, [Math.cos(a), .02, Math.sin(a)], 12, 7, .3); } } }); return true;
  },
  homing_orbs(e, i, s) { const d = aimFrom(s, 0, 0); for (let k = -1; k <= 1; k++) bShot(s, rotYaw([d[0], Math.max(d[1], .1), d[2]], k * .5), 7, 12, .55, { home: 1.7, life: 8, col: [.7, .3, 1] }); tone(400, .3, 'sine', .2, 800); return true; },
  hell_shotgun(e, i, s) { for (let k = 0; k < 9; k++) bShot(s, aimFrom(s, .1, .16 + blindErr(e)), rnd(22, 28), 6, .26, { col: [1, .9, .3] }); tone(120, .25, 'sawtooth', .3, 40); return true; },
  lob_bombs(e, i, s) { for (let k = 0; k < 3; k++) { const [x, z] = arenaClamp(P.x + P.vx * .8 + rnd(-3.5, 3.5), P.z + P.vz * .8 + rnd(-3.5, 3.5)); haz.push({ k: 'lob', t: 0, delay: 1.25 + k * .3, src: s.slice(), tgt: [x, floorSurf(x, z), z], r: 3.8, dmg: 18 }); } tone(150, .4, 'triangle', .25, 400); return true; },
  shockwave(e, i, s) { haz.push({ k: 'ring', t: 0, x: e.x, z: e.z, y: e.y, r: 1.5, sp: 13, max: 34, dmg: 16 }); SFX.slam(); P.shake = Math.max(P.shake, .4); return true; },
  eruptions(e, i, s) { for (let k = 0; k < 6; k++) { const [x, z] = k === 0 ? arenaClamp(P.x + P.vx * .5, P.z + P.vz * .5) : arenaClamp(P.x + rnd(-9, 9), P.z + rnd(-9, 9)); haz.push({ k: 'erupt', t: 0, delay: .95 + k * .13, x, z, y: floorSurf(x, z), r: 2.7, dmg: 20 }); } return true; },
  laser_sweep(e, i, s) { const a = Math.atan2(P.x - e.x, P.z - e.z), sg = Math.random() < .5 ? 1 : -1; const y = floorSurf(e.x, e.z) + .85; haz.push({ k: 'laser', t: 0, sx: e.x, sz: e.z, y, a0: a - sg * .9, a1: a + sg * .9, tele: .9, sweep: 1.5, dmg: 22 }); tone(300, .6, 'sawtooth', .15, 900); return true; },
  rail_shot(e, i, s) { haz.push({ k: 'rail', t: 0, tele: .95, sx: s[0], sy: s[1], sz: s[2], dir: aimFrom(s, 0, 0), dmg: 30 }); tone(500, .9, 'sine', .15, 1600); return true; },
  summon_imps(e, i, s) { if (enemies.length > 9) return false; for (let k = 0; k < 3; k++) { const a = rnd(TAU), [x, z] = arenaClamp(e.x + Math.cos(a) * 5, e.z + Math.sin(a) * 5); spawnEnemy(Math.random() < .5 ? 'husk' : 'gnasher', x, floorSurf(x, z) + .05, z); } return true; },
  rocket_salvo(e, i, s) { let n = 0; addFx(e, 1.0, (f, dt) => { f.acc = (f.acc || 0) + dt; while (f.acc > .15 && n < 6) { f.acc -= .15; n++; const q = pieceSrc(e, i), d = aimFrom(q, .2, .07 + blindErr(e)); bShot(q, d, 15, 0, .55, { exp: [2.8, 14], col: [1, .35, .1] }); tone(220, .2, 'sawtooth', .15, 90); } }); return true; },
  mine_field(e, i, s) { for (let k = 0; k < 5; k++) { const a = rnd(TAU), r = rnd(3, 10), [x, z] = arenaClamp(P.x + Math.cos(a) * r, P.z + Math.sin(a) * r); haz.push({ k: 'mine', t: 0, x, z, y: floorSurf(x, z), r: 3.2, dmg: 18 }); } tone(200, .2, 'square', .15, 100); return true; },
  vortex(e, i, s) {
    addFx(e, 2.2, (f, dt) => { const dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz) || 1; if (d > 3) { const nx = P.x + dx / d * 5.5 * dt, nz = P.z + dz / d * 5.5 * dt; if (!boxHits(nx, P.y, nz, P.hw, P.h)) { P.x = nx; P.z = nz; } }
      for (let k = 0; k < 2; k++) { const a = rnd(TAU), r = rnd(6, 14); emit(e.x + Math.cos(a) * r, e.y + rnd(.3, 3), e.z + Math.sin(a) * r, -Math.cos(a) * 9, 0, -Math.sin(a) * 9, .14, [.7, .3, 1], 1, 2); } },
      () => { const q = pieceSrc(e, i); for (let k = 0; k < 12; k++) bShot([e.x, e.y + 1.5, e.z], [Math.cos(k / 12 * TAU), .02, Math.sin(k / 12 * TAU)], 14, 9, .4); if (Math.hypot(e.x - P.x, e.z - P.z) < 4.8) hurtPlayer(14, 0, 0, 0); SFX.boom(); P.shake = Math.max(P.shake, .5); });
    tone(80, 2, 'sawtooth', .2, 300); return true;
  },
  charge(e, i, s) {
    if (e.pieces[0].broken) return false; let dir = [0, 0], hit = false;
    addFx(e, 1.9, (f, dt) => { const el = f.dur - f.t;
      if (el < .75) { e.ovr = { vx: 0, vz: 0 }; e.yaw = Math.atan2(P.x - e.x, P.z - e.z); dir = [Math.sin(e.yaw), Math.cos(e.yaw)]; f.tele = true; }
      else { f.tele = false; e.ovr = { vx: dir[0] * 21, vz: dir[1] * 21 };
        if (!hit && Math.hypot(P.x - e.x, P.z - e.z) < e.hw + 1.0 && Math.abs(P.y - e.y) < 4) { hit = true; hurtPlayer(22, dir[0], dir[1], 14, e); }
        if (e.hitX || e.hitZ) { f.t = 0; P.shake = Math.max(P.shake, .7); SFX.slam(); for (let k = 0; k < 20; k++) emit(e.x + dir[0] * e.hw, e.y + 1, e.z + dir[1] * e.hw, rnd(-5, 5), rnd(1, 8), rnd(-5, 5), .2, [.4, .35, .45], 1, 0); } }
      if (f.tele && Math.random() < dt * 40) emit(e.x, e.y + .2, e.z, rnd(-2, 2) - dir[0] * 3, rnd(0, 2), rnd(-2, 2) - dir[1] * 3, .15, [1, .5, .2], .4, 2);
    }, () => { e.ovr = null; });
    e.chargeLine = true; SFX.dash(); return true;
  },
  leap_slam(e, i, s) {
    if (e.pieces[0].broken) return false; let phase = 0, air = 0;
    addFx(e, 3.2, (f, dt) => { const el = f.dur - f.t;
      if (phase === 0) { e.ovr = { vx: 0, vz: 0 }; if (el > .55) { phase = 1; const T = 1.0, dx = P.x + P.vx * .5 - e.x, dz = P.z + P.vz * .5 - e.z; e.ovr = { vx: dx / T, vz: dz / T }; e.vy = 15; e.onGround = false; air = 0; SFX.jump(); } }
      else if (phase === 1) { air += dt; if (air > .35 && e.onGround) { phase = 2; f.t = .25; e.ovr = { vx: 0, vz: 0 };
        haz.push({ k: 'ring', t: 0, x: e.x, z: e.z, y: e.y, r: 1.5, sp: 15, max: 30, dmg: 16 });
        if (Math.hypot(P.x - e.x, P.z - e.z) < 6.5 && P.y < e.y + 2.5) hurtPlayer(24, 0, 0, 0); SFX.slam(); P.shake = 1; for (let k = 0; k < 30; k++) { const a = rnd(TAU); emit(e.x + Math.cos(a) * 2, e.y + .3, e.z + Math.sin(a) * 2, Math.cos(a) * 8, rnd(2, 8), Math.sin(a) * 8, rnd(.15, .3), [.5, .2, .15], 1, 0); } } }
    }, () => { e.ovr = null; }); return true;
  },
  bullet_wall(e, i, s) { const d = aimFrom(s, 0, 0), h = norm3([d[0], 0, d[2]]), px = -h[2], pz = h[0], gap = 2 + ((Math.random() * 6) | 0);
    for (let k = -5; k <= 5; k++) { const idx = k + 5; if (idx === gap || idx === gap + 1) continue; bShot([s[0] + px * k * 2.2, P.y + P.eye * .6, s[2] + pz * k * 2.2], h, 11, 12, .55, { life: 8 }); } tone(100, .4, 'square', .25, 60); return true;
  },
  meteor_rain(e, i, s) { for (let k = 0; k < 9; k++) { const [x, z] = k < 2 ? arenaClamp(P.x + P.vx * .6 + rnd(-2, 2), P.z + P.vz * .6 + rnd(-2, 2)) : arenaClamp(P.x + rnd(-13, 13), P.z + rnd(-13, 13)); haz.push({ k: 'meteor', t: 0, delay: 1.2 + rnd(0, 1.1), x, z, y: floorSurf(x, z), r: 3, dmg: 16 }); } tone(600, 1, 'sine', .12, 100); return true; },
  tracking_strikes(e, i, s) { for (let k = 0; k < 3; k++) haz.push({ k: 'track', t: -k * 1.15, delay: 1.45, x: P.x, z: P.z, y: floorSurf(P.x, P.z), r: 2.4, dmg: 22 }); return true; },
  toxic_clouds(e, i, s) { for (let k = 0; k < 3; k++) { const a = rnd(TAU), r = k === 0 ? 1.5 : rnd(5, 10), [x, z] = arenaClamp(P.x + Math.cos(a) * r, P.z + Math.sin(a) * r); haz.push({ k: 'cloud', t: 0, x, z, y: floorSurf(x, z), r: 4.2, dur: 8, dmg: 5 }); } tone(90, .6, 'sawtooth', .15, 60); return true; },
};
// Tuning (name, cooldown range, lock time) lives in data/attacks.json; ORDER there decides which attack a seed rolls.
const ATK = DATA.attacks.list.map(a => {
  const run = ATK_RUN[a.id]; if (!run) throw new Error('attack "' + a.id + '" has no implementation in 43-boss-attacks.js');
  return { id: a.id, n: a.name, cd: a.cd, lock: a.lock, legs: !!a.legs, run };
});
