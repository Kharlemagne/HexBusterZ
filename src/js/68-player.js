// ---------------- player ----------------
function wishVec() {
  let fx = 0, fz = 0; if (keys.KeyW) fz -= 1; if (keys.KeyS) fz += 1; if (keys.KeyA) fx -= 1; if (keys.KeyD) fx += 1;
  let l = Math.hypot(fx, fz); if (l) { fx /= l; fz /= l; }
  fx += gp.lx; fz += gp.ly; l = Math.hypot(fx, fz); if (l > 1) { fx /= l; fz /= l; l = 1; }
  const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
  return { x: fx * cy + fz * sy, z: -fx * sy + fz * cy, moving: l > 0 };
}
function tryDash() {
  if (state !== 'play' || P.onGround || P.dashF < 1 || P.dashT > 0 || P.slamming) return;     // on the ground the same key slides instead
  const w = wishVec(); let dx = w.x, dz = w.z;
  if (!w.moving) { dx = -Math.sin(P.yaw); dz = -Math.cos(P.yaw); }
  if (P.latch) releaseLatch(); P.shieldT = .38; P.dashF -= 1; P.dashT = .16; P.dashX = dx; P.dashZ = dz; P.inv = Math.max(P.inv, .3); P.sliding = false; SFX.dash();
  for (let i = 0; i < 10; i++) emit(P.x, P.y + rnd(.2, 1.5), P.z, -dx * rnd(2, 8), rnd(-1, 1), -dz * rnd(2, 8), .07, [1, .8, .6], .3, 2);
}
// ---- X-CROSS: homing strike / grapple hook / ground pound ----
function surfaceTarget() {
  const o = eyePos(), f = fwdV(), h = raycast(o[0], o[1], o[2], f[0], f[1], f[2], 30);
  if (!h || h.ny === 1) return null;
  return { x: o[0] + f[0] * h.t, y: o[1] + f[1] * h.t, z: o[2] + f[2] * h.t, nx: h.nx, ny: h.ny, nz: h.nz, t: h.t };
}
function addSlashAt(x, y, z, L) { slashes.push({ x, y, z, phi: Math.atan2(P.x - x, P.z - z), L, t0: T }); Net.fx('slash', [r2(x), r2(y), r2(z), r2(Math.atan2(P.x - x, P.z - z)), L]); }
function releaseLatch(kick) { const l = P.latch; if (!l) return; P.latch = null; if (kick) { P.vx += l.nx * 4; P.vz += l.nz * 4; } }
// camera snaps glide there quickly instead of cutting
function snapLook(yaw, pitch) { let d = yaw - P.yaw; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; P.snap = { y: P.yaw + d, p: clamp(pitch, -1.55, 1.55), t: 0 }; }
function aimAtPoint(c) { const o = eyePos(), d = norm3([c[0] - o[0], c[1] - o[1], c[2] - o[2]]); snapLook(Math.atan2(-d[0], -d[2]), Math.asin(clamp(d[1], -1, 1))); }
function nearestEnemy(far) {
  let best = null, bd = far ? -1 : 1e9;
  for (const e of enemies) { if (e.dead) continue; const d = Math.hypot(e.x - P.x, e.z - P.z, (e.y - P.y) * .5); if (far ? d > bd : d < bd) { bd = d; best = e; } }
  return best;
}
function startHoming(t) {
  if (P.latch) releaseLatch();
  P.slamming = true; P.sliding = false; P.slamT = t;
  const o = eyePos(), f = fwdV(); addSlashAt(o[0] + f[0] * 4.2, o[1] + f[1] * 4.2, o[2] + f[2] * 4.2, 1.8); SFX.shink();
  if (P.btCd <= 0) { P.bt = 10; P.btCd = 30; P.fovPunch = .5; SFX.bt(); feed('BULLET TIME', '#6ec8ff'); el.btring.classList.remove('go'); void el.btring.offsetWidth; el.btring.classList.add('go'); }
}
function startGrapple(h) {
  const ay = h.ny === -1 ? h.y - P.h - .06 : h.y - 1.0;
  P.latch = { phase: 'fly', nx: h.nx, ny: h.ny, nz: h.nz, hp: [h.x, h.y, h.z], ax: h.x + h.nx * (P.hw + .07), ay, az: h.z + h.nz * (P.hw + .07), t: 3, fly: 0 };
  P.slamming = false; P.sliding = false; P.slamT = null; P.onGround = false;
  addSlashAt(h.x + h.nx * .3, h.y + h.ny * .3, h.z + h.nz * .3, 1.7); SFX.shink(); tone(300, .25, 'sawtooth', .15, 900);
}
function xcross() {
  if (P.onGround && !P.latch) { const s = surfaceTarget(); if (s) startGrapple(s); return; }          // X-grapple works from the ground too
  const tgt = (P.lock && !P.lock.dead) ? P.lock : pickSlamTarget();
  if (tgt) { startHoming(tgt); return; }                                                               // homing attack
  const s = surfaceTarget(); if (s) { startGrapple(s); return; }                                       // X-grapple
  if (P.latch) { releaseLatch(true); return; }
}
function doubleJump() {
  P.djump = 0; P.vy = 10.2; P.coyote = 0; SFX.jump();
  for (let i = 0; i < 8; i++) emit(P.x, P.y + .2, P.z, rnd(-2, 2), rnd(-1, 1), rnd(-2, 2), .08, [.6, .9, 1], .35, 2);
  const e = nearestEnemy(true); if (e) aimAtPoint(enemyCenter(e));                                     // snap view to the furthest enemy
}
function latchStep(dt) {
  const l = P.latch;
  if (l.phase === 'fly') {
    l.fly += dt; const dx = l.ax - P.x, dy = l.ay - P.y, dz = l.az - P.z, d = Math.hypot(dx, dy, dz) || 1;
    P.vx = dx / d * 54; P.vy = dy / d * 54; P.vz = dz / d * 54;
    emit(P.x + rnd(-.3, .3), P.y + .9, P.z + rnd(-.3, .3), 0, 0, 0, .08, [.8, .4, 1], .2, 2);
  } else { P.vx = P.vy = P.vz = 0; }
}
function latchPost(dt) {
  const l = P.latch; if (!l) return; const hit = P.hitX || P.hitZ || P.hitY;
  if (l.phase === 'fly') {
    const d = Math.hypot(l.ax - P.x, l.ay - P.y, l.az - P.z);
    if (d < 1.0 || (hit && d < 2.8)) {
      l.phase = 'hang'; l.t = 3; P.vx = P.vy = P.vz = 0; SFX.dig(); P.shake = Math.max(P.shake, .3); sparkBurst(l.hp[0], l.hp[1], l.hp[2], 14, [.8, .4, 1], 6);
      const en = nearestEnemy(false);                                  // snap the view: nearest enemy, else away from the wall / straight down from the ceiling
      if (en) aimAtPoint(enemyCenter(en)); else if (l.ny === -1) snapLook(P.yaw, -1.5); else snapLook(Math.atan2(-l.nx, -l.nz), -.22);
    } else if (l.fly > 1.4 || hit) releaseLatch();
    return;
  }
  l.t -= dt;
  if (l.t <= 0) { releaseLatch(); return; }                            // only hangs ~3 s; the wall's own slow-fall takes over after that
  if (P.jEdge) { releaseLatch(true); P.vy = 9.8; P.wallCd = .25; SFX.jump(); }
}
function updatePlayer(dt) {
  const k = keys, ld = P.bt > 0 ? dt * 2 : dt;       // looking always runs at real speed, even in bullet time
  if (k.ArrowLeft) P.yaw += 2.6 * ld; if (k.ArrowRight) P.yaw -= 2.6 * ld;
  if (k.ArrowUp) P.pitch = Math.min(1.55, P.pitch + 2 * ld); if (k.ArrowDown) P.pitch = Math.max(-1.55, P.pitch - 2 * ld);
  if (document.pointerLockElement !== canvas && state === 'play') {
    const m = 40, W = innerWidth, Hh = innerHeight;
    if (mpos.x < m) P.yaw += (m - mpos.x) / m * 3 * ld; if (mpos.x > W - m) P.yaw -= (mpos.x - (W - m)) / m * 3 * ld;
    if (mpos.y < m) P.pitch = Math.min(1.55, P.pitch + (m - mpos.y) / m * 2 * ld); if (mpos.y > Hh - m) P.pitch = Math.max(-1.55, P.pitch - (mpos.y - (Hh - m)) / m * 2 * ld);
  }
  if (gp.on) { const zs = P.zoom ? .4 : 1; P.yaw -= gp.rx * Math.abs(gp.rx) * 3.6 * zs * ld; P.pitch = clamp(P.pitch - gp.ry * Math.abs(gp.ry) * 2.6 * zs * ld, -1.55, 1.55); }
  if (P.snap) { const sn = P.snap, kk = Math.min(1, 14 * ld); sn.t += ld; P.yaw += (sn.y - P.yaw) * kk; P.pitch += (sn.p - P.pitch) * kk; if ((Math.abs(sn.y - P.yaw) < .006 && Math.abs(sn.p - P.pitch) < .006) || sn.t > .5) P.snap = null; }
  const w = wishVec(), inLava = isLava(get(Math.floor(P.x), Math.floor(P.y + .3), Math.floor(P.z)));
  const maxSp = inLava ? 5 : 10.5, want = !!(k.ShiftLeft || k.ShiftRight || gp.slide), edge = P.cEdge; P.cEdge = false;
  P.inv = Math.max(0, P.inv - dt); P.shieldT = Math.max(0, P.shieldT - dt); P.shieldFlash = Math.max(0, P.shieldFlash - dt);
  const spd0 = Math.hypot(P.vx, P.vz);
  if (edge && !P.slamming && !inLava && P.dashT <= 0) xcross();
  if (want && P.onGround && !P.sliding && !P.slamming && spd0 > 3) { P.sliding = true; const sp = Math.max(spd0, 16), l = spd0 || 1; P.vx = P.vx / l * sp; P.vz = P.vz / l * sp; SFX.dash(); }
  if (P.sliding && (!want || Math.hypot(P.vx, P.vz) < 4.5) && !boxHits(P.x, P.y, P.z, P.hw, 1.75)) P.sliding = false;
  P.h = P.sliding ? 1.0 : 1.75; P.eye = lerp(P.eye, P.sliding ? .78 : 1.6, Math.min(1, 16 * dt));
  if (P.latch) latchStep(dt);
  else if (P.dashT > 0) { P.dashT -= dt; P.vx = P.dashX * 34; P.vz = P.dashZ * 34; P.vy = 0; if (P.dashT <= 0) { P.vx *= .45; P.vz *= .45; } }
  else if (P.slamming) {
    const t = P.slamT;
    if (t && !t.dead) { const c = enemyCenter(t), dx = c[0] - P.x, dy = c[1] - (P.y + .9), dz = c[2] - P.z, dd = Math.hypot(dx, dy, dz) || 1; P.vx = dx / dd * 56; P.vy = dy / dd * 56; P.vz = dz / dd * 56; for (let i = 0; i < 3; i++) emit(P.x + rnd(-.3, .3), P.y + .9 + rnd(-.4, .4), P.z + rnd(-.3, .3), 0, 0, 0, .09, Math.random() < .5 ? [.7, .2, 1] : [1, 1, 1], .25, 2); }
    else { P.slamming = false; P.slamT = null; P.vx *= .3; P.vy *= .3; P.vz *= .3; }          // target vanished: cancel the strike
  }
  else if (P.sliding) {
    const sp0 = Math.hypot(P.vx, P.vz); if (w.moving) { P.vx += w.x * 16 * dt; P.vz += w.z * 16 * dt; }
    const ns = Math.hypot(P.vx, P.vz) || 1, tgt = ns < .5 ? 0 : clamp(sp0, 11, 18); P.vx = P.vx / ns * tgt; P.vz = P.vz / ns * tgt; P.vy -= 32 * dt;      // slide holds its speed indefinitely
  } else {
    const acc = P.onGround ? 16 : (w.moving ? 5.5 : 0);
    if (acc > 0) { const tx = w.moving ? w.x * maxSp : 0, tz = w.moving ? w.z * maxSp : 0; P.vx += (tx - P.vx) * Math.min(1, acc * dt); P.vz += (tz - P.vz) * Math.min(1, acc * dt); }
    P.vy -= 32 * dt;
  }
  if (P.vy < -70) P.vy = -70;
  P.coyote = P.onGround ? .1 : P.coyote - dt;
  if ((k.Space || gp.a) && P.coyote > 0 && !P.slamming && P.dashT <= 0) { P.vy = 10.2; P.coyote = 0; P.onGround = false; SFX.jump(); }
  if (inLava) { P.vy = Math.max(P.vy, -3); P.hp -= 30 * dt; P.hurtFlash = Math.max(P.hurtFlash, .5); if (k.Space || gp.a) P.vy = 7; if (P.hp <= 0) die(); }
  // wall climb: keep tapping/holding jump against a wall to go up (also gives the native wall slow-fall); otherwise a granted double jump
  P.wallCd = Math.max(0, P.wallCd - dt);
  if (!P.onGround && !P.slamming && !P.latch && P.dashT <= 0 && !inLava) {
    const hh = P.h - .4, yy = P.y + .2, pr = P.hw + .07;
    const wall = boxHits(P.x + pr, yy, P.z, .02, hh) || boxHits(P.x - pr, yy, P.z, .02, hh) || boxHits(P.x, yy, P.z + pr, .02, hh) || boxHits(P.x, yy, P.z - pr, .02, hh);
    if (wall) {
      if (P.vy < -5) P.vy = -5;
      if ((k.Space || gp.a) && P.wallCd <= 0) { P.vy = 9.8; P.wallCd = .21; SFX.jump(); for (let i = 0; i < 5; i++) emit(P.x, P.y + 1, P.z, rnd(-1, 1), rnd(0, 2), rnd(-1, 1), .06, [1, .8, .5], .25, 2); }
    } else if (P.jEdge && P.djump > 0 && P.coyote <= 0) doubleJump();
  }
  if (!P.onGround && !P.slamming) P.lock = pickSlamTarget(); else if (P.onGround) P.lock = null;
  moveBody(P, dt, P.hw, P.h);
  latchPost(dt);
  if (P.slamming && P.slamT) {
    const t = P.slamT;
    if (t.dead) P.slamT = null;
    else { const c = enemyCenter(t); if ((Math.hypot(c[0] - P.x, c[2] - P.z) < t.hw + .9 && Math.abs(c[1] - (P.y + .9)) < t.h * .5 + 1.4) || P.hitX || P.hitZ || P.hitY) slamLand(t); }
  }
  if (P.onGround) {
    if (!P.wasGround && P.airT > .35) P.landDip = .12;
    P.airT = 0; P.slamming = false; P.djump = 0;
  } else P.airT += dt;
  P.wasGround = P.onGround;
  if (P.y < -3) { P.y = 20; }
  P.landDip = Math.max(0, P.landDip - dt * .6);
  P.bobT += Math.hypot(P.vx, P.vz) * dt * 1.1;
  P.shake = Math.max(0, P.shake - dt * 2.2); P.hurtFlash = Math.max(0, P.hurtFlash - dt * 2.2); P.hitT = Math.max(0, P.hitT - dt);
  P.kick = lerp(P.kick, 0, Math.min(1, 14 * dt)); P.kickRot = lerp(P.kickRot, 0, Math.min(1, 12 * dt)); P.flashT = Math.max(0, P.flashT - dt);
  P.swing = Math.max(0, P.swing - dt * 7); P.swayX = lerp(P.swayX, 0, Math.min(1, 8 * dt));
  P.jEdge = false;
}

