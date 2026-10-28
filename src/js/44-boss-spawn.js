// ---------------- boss creation ----------------
function spawnBoss(x, y, z) {
  const H_ = pick5(BHEADS), T_ = pick5(BTORSOS), L_ = pick5(BLEGS);
  const ids = []; while (ids.length < 3) { const a = (Math.random() * ATK.length) | 0; if (!ids.includes(a)) ids.push(a); }
  const total = 1560 * (1 + (Wv.n / 5 - 1) * .5), fr = [.28, .44, .28];
  const mk = (slot, d, hpf, atk, cd) => ({ slot, name: d.n, parts: d.parts, hp: total * hpf, max: total * hpf, broken: false, flash: 0, atk, cd });
  const name = (H_.n + T_.n + L_.n).toUpperCase();
  const e = { type: 'boss', def: Object.assign({}, ED.boss, { name }), bossName: name, x, y, z, vx: 0, vy: 0, vz: 0, hp: total, maxhp: total, hw: ED.boss.hw, h: ED.boss.h, cd: 0, t: 0, flash: 0, dead: false, yaw: 0, walk: 0, burst: 0, bcd: 0, sdir: 1, onGround: false,
    pieces: [mk(0, L_, fr[0], ids[2], 5.5), mk(1, T_, fr[1], ids[1], 3.6), mk(2, H_, fr[2], ids[0], 2.0)], legSpd: L_.spd, fx: [], lock: 2.2, ovr: null, bodyCd: 0, strafe: 1 };
  enemies.push(e); sparkBurst(x, y + e.h / 2, z, 40, [1, .3, .1], 10); SFX.spawn(); SFX.boom();
  return e;
}
function pieceCenter(e, i) { const lo = i === 0 ? 0 : BAND[i - 1], hi = i === 2 ? 1 : BAND[i]; return [e.x, e.y + e.h * (lo + hi) / 2, e.z]; }
function bandOf(frac) { return frac < BAND[0] ? 0 : frac < BAND[1] ? 1 : 2; }
function damageBoss(e, dmg, o) {
  const pt = o.pt || [e.x, e.y + e.h * .6, e.z];
  let idx = bandOf(clamp((pt[1] - e.y) / e.h, 0, .999));
  if (e.pieces[idx].broken) { let best = -1, bd = 9; e.pieces.forEach((p, k) => { if (!p.broken && Math.abs(k - idx) < bd) { bd = Math.abs(k - idx); best = k; } }); if (best < 0) return; idx = best; }
  const p = e.pieces[idx]; if (e.pieces[1].broken && idx !== 1) dmg *= 1.3;
  p.hp -= dmg; p.flash = .08; e.hp = e.pieces.reduce((a, q) => a + Math.max(0, q.hp), 0); addStyle(dmg * .15); P.hitT = .13;
  const dd = o.dir ? (o.dir.x !== undefined ? o.dir : { x: o.dir[0], y: o.dir[1], z: o.dir[2] }) : null;
  if (dd) { const k = (o.knock || 3) / e.def.mass; e.vx += dd.x * k; e.vz += dd.z * k; }
  bloodBurst(pt[0], pt[1], pt[2], Math.min(10, 2 + dmg * .2), dd, .6);
  if (p.hp <= 0) breakPiece(e, idx, pt);
  if (e.pieces.every(q => q.broken)) { e.hp = 0; killEnemy(e, o, dd); }
  else if (p.hp > 0) SFX.hit();
}
function breakPiece(e, idx, pt) {
  const p = e.pieces[idx]; p.broken = true; p.hp = 0; const c = pieceCenter(e, idx);
  for (let i = 0; i < 40; i++) { const a = rnd(TAU), sp = rnd(2, 9); emit(c[0] + rnd(-1, 1), c[1] + rnd(-.6, .6), c[2] + rnd(-1, 1), Math.cos(a) * sp, rnd(2, 10), Math.sin(a) * sp, rnd(.15, .4), Math.random() < .5 ? BONES[0] : MEAT[(Math.random() * 3) | 0], rnd(5, 9), 0); }
  sparkBurst(c[0], c[1], c[2], 20, [1, .4, .1], 9); SFX.boom(); P.shake = Math.max(P.shake, .8); hitstop = Math.max(hitstop, .12);
  feed(PSLOT[idx] + ' ' + p.name.toUpperCase() + ' DESTROYED', '#ff5a1a'); addStyle(120); S.score += 150;
}
function updateBoss(e, dt) {
  curBossE = e; e.t += dt; e.bodyCd -= dt; for (const p of e.pieces) p.flash = Math.max(0, p.flash - dt);
  const dx = P.x - e.x, dz = P.z - e.z, dist = Math.hypot(dx, dz) || .001, nx = dx / dist, nz = dz / dist;
  // fx
  for (let i = e.fx.length - 1; i >= 0; i--) { const f = e.fx[i]; f.t -= dt; f.upd(f, dt); if (f.t <= 0) { if (f.end) f.end(f); e.fx.splice(i, 1); } }
  // attack scheduling (one heavy move at a time via lock)
  e.lock -= dt;
  for (let i = 2; i >= 0; i--) {
    const p = e.pieces[i]; if (p.broken) continue; p.cd -= dt;
    if (p.cd <= 0 && e.lock <= 0) {
      const a = ATK[p.atk], ok = a.run(e, i, pieceSrc(e, i)); p.cd = ok ? rnd(a.cd[0], a.cd[1]) : 2; if (ok) { e.lock = a.lock; p.flash = .15; }
    }
  }
  // movement
  const legsOK = !e.pieces[0].broken, sp = e.def.speed * e.legSpd * (legsOK ? 1 : .3);
  if (!e.ovr) { e.yaw = lerpAng(e.yaw, Math.atan2(dx, dz), Math.min(1, 6 * dt)); }
  let tx = 0, tz = 0;
  if (!e.ovr) {
    if (dist > 10) { tx = nx; tz = nz; } else { if (Math.sin(e.t * .6) > .9) e.strafe = -e.strafe; tx = -nz * e.strafe * .6 + nx * (dist < 6 ? -.4 : .1); tz = nx * e.strafe * .6 + nz * (dist < 6 ? -.4 : .1); }
    const acc = e.onGround ? 6 : 1.5; e.vx += (tx * sp - e.vx) * Math.min(1, acc * dt); e.vz += (tz * sp - e.vz) * Math.min(1, acc * dt);
  } else { e.vx = e.ovr.vx; e.vz = e.ovr.vz; }
  e.vy = Math.max(-50, e.vy - 30 * dt);
  moveBody(e, dt, e.hw, e.h);
  if ((e.hitX || e.hitZ) && e.onGround && !e.ovr) e.vy = 12;
  e.walk += Math.hypot(e.vx, e.vz) * dt * 1.2;
  if (e.bodyCd <= 0 && dist < e.hw + .7 && Math.abs(P.y - e.y) < 3.5) { hurtPlayer(12, nx, nz, 8, e); e.bodyCd = 1.1; }
  for (const o of enemies) { if (o === e || o.dead) continue; const ax = o.x - e.x, az = o.z - e.z, dd = Math.hypot(ax, az); if (dd < e.hw + o.hw && dd > .001) { o.vx += ax / dd * 30 * dt; o.vz += az / dd * 30 * dt; } }
  for (let i = 0; i < 3; i++) if (e.pieces[i].broken && Math.random() < dt * 3) { const c = pieceCenter(e, i); emit(c[0] + rnd(-.6, .6), c[1], c[2] + rnd(-.6, .6), rnd(-1, 1), rnd(1, 3), rnd(-1, 1), .15, [.15, .12, .12], 1.2, 2); }
}
function lerpAng(a, b, t) { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return a + d * t; }
function drawBoss(e) {
  const R = rotY(e.yaw), yb = [0, LH * BSC, (LH + TH) * BSC], bob = Math.sin(e.t * 2) * .05 * BSC;
  for (let i = 0; i < 3; i++) { const p = e.pieces[i]; if (p.broken) continue; drawParts(p.parts, e.x, e.y + yb[i] + (i ? bob * (i === 2 ? 1.6 : 1) : 0), e.z, R, BSC, e.t, p.flash > 0, e.walk); }
  const ch = e.fx.find(f => f.tele);
  if (ch) { const d = [Math.sin(e.yaw), 0, Math.cos(e.yaw)], pu = .5 + Math.sin(e.t * 20) * .5; pushBeam(e.x, e.y + .3, e.z, e.x + d[0] * 22, e.y + .3, e.z + d[2] * 22, .5 + pu * .3, [1, .2 + pu * .3, .1], 0); }
}
function updateBossSystems(dt) { updateHaz(dt); }
function resetBossSystems() { haz.length = 0; }

