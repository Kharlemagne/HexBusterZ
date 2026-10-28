// ---------------- enemies ----------------
const enemies = [], eprojs = [], bombs = [];
function spawnEnemy(type, x, y, z) {
  const def = ED[type], hpScale = 1 + (Wv.n - 1) * .08;
  const e = { type, def, x, y, z, vx: 0, vy: 0, vz: 0, hp: def.hp * (def.boss ? 1 + (Wv.n / 5 - 1) * .5 : hpScale), maxhp: 0, hw: def.hw * def.scale / def.scale, h: def.h, cd: rnd(.5, 1.8),
    t: rnd(10), flash: 0, dead: false, yaw: 0, walk: 0, burst: 0, bcd: 0, sdir: Math.random() < .5 ? 1 : -1, onGround: false };
  e.maxhp = e.hp; enemies.push(e);
  sparkBurst(x, y + e.h / 2, z, 16, [1, .3, .1], 6); SFX.spawn();
  return e;
}
function enemyCenter(e) { return [e.x, e.y + e.h * .5, e.z]; }
function hasLOS(ax, ay, az, bx, by, bz) {
  const dx = bx - ax, dy = by - ay, dz = bz - az, d = Math.hypot(dx, dy, dz); if (d < .01) return true;
  return !raycast(ax, ay, az, dx / d, dy / d, dz / d, d);
}
function fireEProj(e, speed, dmg, size, yawOff, spread, pitchOff) {
  const sx = e.x, sy = e.y + e.h * .72, sz = e.z;
  let tx = P.x + P.vx * .18, ty = P.y + P.eye * .75, tz = P.z + P.vz * .18;
  let dx = tx - sx, dy = ty - sy, dz = tz - sz; const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
  if (yawOff) { const c = Math.cos(yawOff), s = Math.sin(yawOff); const nx = dx * c - dz * s, nz = dx * s + dz * c; dx = nx; dz = nz; }
  if (pitchOff) dy += pitchOff;
  if (spread) { dx += rnd(-spread, spread); dy += rnd(-spread, spread); dz += rnd(-spread, spread); const l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l; }
  eprojs.push({ x: sx + dx * (e.hw + .3), y: sy + dy * .5, z: sz + dz * (e.hw + .3), vx: dx * speed, vy: dy * speed, vz: dz * speed, dmg, size, life: 7, owner: e });
  tone(rnd(300, 380), .12, 'square', .1, 150);
}
function updateEnemy(e, dt) {
  const d = e.def; e.t += dt; e.cd -= dt; e.flash = Math.max(0, e.flash - dt);
  const dx = P.x - e.x, dz = P.z - e.z, cyE = e.y + e.h * .5, dy = (P.y + 1.0) - cyE;
  const dist = Math.hypot(dx, dz) || .001, nx = dx / dist, nz = dz / dist;
  e.yaw = Math.atan2(dx, dz);
  let tx = 0, tz = 0, sp = d.speed;
  const slow = P.slowT > 0 ? .35 : 1; // never used for now, hook for future
  if (e.type === 'husk') {
    if (dist > 11) { tx = nx; tz = nz; } else if (dist > 5) { tx = nx * .3 - nz * e.sdir * .9; tz = nz * .3 + nx * e.sdir * .9; } else { tx = -nx * .6 - nz * e.sdir * .6; tz = -nz * .6 + nx * e.sdir * .6; }
    if (Math.sin(e.t * .5) > .8) e.sdir = -e.sdir;
    if (e.cd <= 0 && dist < 26 && hasLOS(e.x, e.y + e.h * .72, e.z, P.x, P.y + 1.2, P.z)) { fireEProj(e, 17, 9, .34, 0, .02); e.cd = rnd(1.5, 2.6); }
  } else if (e.type === 'gnasher') {
    tx = nx; tz = nz; if (dist < 9 && dist > 2.5) { tx += -nz * e.sdir * .4; tz += nx * e.sdir * .4; }
    if (dist < 1.9 && Math.abs(dy) < 2 && e.cd <= 0) { hurtPlayer(14, nx, nz, undefined, e); e.cd = .8; e.vx = -nx * 5; e.vz = -nz * 5; }
    if (e.onGround && dist < 8 && dist > 3 && Math.random() < dt * .9) { e.vy = 9; e.vx = nx * 14; e.vz = nz * 14; }
  } else if (e.type === 'wraith') {
    const want = 9, ang = e.t * .7 * e.sdir;
    const gx = P.x - nx * want * .2 + Math.cos(ang) * want * .8, gz = P.z - nz * want * .2 + Math.sin(ang) * want * .8, gy = P.y + 3.2 + Math.sin(e.t * 1.3);
    const ddx = gx - e.x, ddz = gz - e.z, dd = Math.hypot(ddx, ddz) || 1; tx = ddx / dd * Math.min(1, dd / 2); tz = ddz / dd * Math.min(1, dd / 2);
    e.vy += clamp(gy - e.y, -3, 3) * 4 * dt; e.vy *= 1 - 1.5 * dt;
    if (e.burst > 0) { e.bcd -= dt; if (e.bcd <= 0) { fireEProj(e, 19, 8, .3, 0, .03); e.burst--; e.bcd = .13; } }
    else if (e.cd <= 0 && dist < 28 && hasLOS(e.x, e.y + .6, e.z, P.x, P.y + 1.2, P.z)) { e.burst = 3; e.bcd = 0; e.cd = rnd(2.2, 3.4); }
  } else if (e.type === 'colossus') {
    tx = nx; tz = nz;
    if (dist < 5.5 && e.cd <= 0) { // stomp shockwave
      e.cd = 1.6; if (P.onGround || P.y < e.y + 1.5) hurtPlayer(26, nx, nz, 12);
      for (let i = 0; i < 28; i++) { const a = rnd(TAU); emit(e.x + Math.cos(a) * 2, e.y + .2, e.z + Math.sin(a) * 2, Math.cos(a) * 6, rnd(2, 6), Math.sin(a) * 6, rnd(.1, .25), MEAT[0], 1.2, 0); }
      P.shake = Math.max(P.shake, .6); SFX.slam();
    } else if (e.bcd <= 0 && dist > 5) {
      e.bcd = 3.2;
      for (let i = 0; i < 14; i++) fireEProj(e, 13, 11, .42, (i / 14) * TAU, 0, 0);
      for (let i = -1; i <= 1; i++) fireEProj(e, 22, 12, .45, i * .12, .01);
    }
    e.bcd -= dt;
  }
  // locomotion
  if (d.fly) {
    e.vx += (tx * sp - e.vx) * Math.min(1, 3 * dt); e.vz += (tz * sp - e.vz) * Math.min(1, 3 * dt);
    moveBody(e, dt, e.hw, e.h);
    if (e.hitX || e.hitZ) e.vy += 14 * dt * 3;
  } else {
    const acc = e.onGround ? 8 : 1.8;
    e.vx += (tx * sp - e.vx) * Math.min(1, acc * dt); e.vz += (tz * sp - e.vz) * Math.min(1, acc * dt);
    e.vy = Math.max(-50, e.vy - 30 * dt);
    moveBody(e, dt, e.hw, e.h);
    if ((e.hitX || e.hitZ) && e.onGround) e.vy = d.boss ? 12 : 9.5;
    if (d.boss && e.hitY && e.vy === 0) { /* landing */ }
  }
  e.walk += Math.hypot(e.vx, e.vz) * dt * 1.6;
  if (e.y < -5) { e.y = 20; }
  // separation
  for (const o of enemies) { if (o === e || o.dead) continue; const ax = e.x - o.x, az = e.z - o.z, dd = Math.hypot(ax, az); const mind = e.hw + o.hw + .1; if (dd < mind && dd > .001) { e.vx += ax / dd * 6 * dt * 10 * .2; e.vz += az / dd * 6 * dt * 10 * .2; } }
}
function drawParts(parts, px, py, pz, R, scale, t, flash, walk) {
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]; let ox = p.o[0], oy = p.o[1], oz = p.o[2], PRm = R;
    if (p.orb) { const a = t * p.orb.spd + p.orb.ph; ox = Math.cos(a) * p.orb.r; oz = Math.sin(a) * p.orb.r; oy = p.orb.y + Math.sin(t * 3 + p.orb.ph) * .08; PRm = mulR(R, rotY(t * 3 + p.orb.ph)); }
    if (p.sw) oz += Math.sin(walk + p.sw.ph) * p.sw.amp;
    ox *= scale; oy *= scale; oz *= scale;
    const wx = px + R[0] * ox + R[1] * oy + R[2] * oz, wy = py + R[3] * ox + R[4] * oy + R[5] * oz, wz = pz + R[6] * ox + R[7] * oy + R[8] * oz;
    const c = flash ? [1, 1, 1] : p.rgb;
    pushBox(wx, wy, wz, p.s[0] * scale, p.s[1] * scale, p.s[2] * scale, c[0], c[1], c[2], PRm, !p.e);
  }
}
function drawEnemies() {
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.type === 'boss') { drawBoss(e); continue; }
    const R = rotY(e.yaw), yoff = e.def.fly ? Math.sin(e.t * 3) * .1 : 0;
    drawParts(e.def.parts, e.x, e.y + yoff, e.z, R, e.def.scale, e.t, e.flash > 0, e.walk);
  }
}
function updateEProjs(dt) {
  for (let i = eprojs.length - 1; i >= 0; i--) {
    const p = eprojs[i]; p.life -= dt;
    if (p.g) p.vy -= p.g * dt;
    if (p.home && !p.rf) { const sp = Math.hypot(p.vx, p.vy, p.vz) || 1, tx = P.x - p.x, ty = P.y + 1.1 - p.y, tz = P.z - p.z, td = Math.hypot(tx, ty, tz) || 1; let nx = p.vx / sp + tx / td * p.home * dt, ny = p.vy / sp + ty / td * p.home * dt, nz = p.vz / sp + tz / td * p.home * dt; const nl = Math.hypot(nx, ny, nz) || 1; p.vx = nx / nl * sp; p.vy = ny / nl * sp; p.vz = nz / nl * sp; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    let dead = p.life <= 0 || solid(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)), boom = false;
    // slide / dash shield: anything that gets close is thrown back at whoever fired it
    if (!p.rf && P.alive && shieldOn() && Math.hypot(p.x - P.x, p.y - (P.y + .9), p.z - P.z) < 1.9 + p.size * .5) { reflectProj(p); dead = solid(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)); }
    if (p.rf) {
      if (!dead) for (const e of enemies) {
        if (e.dead) continue; const m = p.size * .5 + .2;
        if (p.x > e.x - e.hw - m && p.x < e.x + e.hw + m && p.y > e.y - m && p.y < e.y + e.h + m && p.z > e.z - e.hw - m && p.z < e.z + e.hw + m) {
          if (p.exp) boom = true; else { const l = Math.hypot(p.vx, p.vz) || 1; damageEnemy(e, p.dmg, { dir: { x: p.vx / l, y: 0, z: p.vz / l }, pt: [p.x, p.y, p.z], knock: 3, w: 10, reflect: true }); }
          dead = true; break;
        }
      }
      if (dead && p.exp) boom = true;
      if (boom) explode(p.x, p.y, p.z, p.exp[0] * 1.2, p.exp[1] * 2.2, 0, { w: 10 });
    } else if (p.exp) {
      if (!dead && P.alive && Math.abs(p.x - P.x) < P.hw + p.size * .5 + .3 && Math.abs(p.z - P.z) < P.hw + p.size * .5 + .3 && p.y > P.y - .4 && p.y < P.y + P.h + .4) dead = true;
      if (dead) { bossBlast(p.x, p.y, p.z, p.exp[0], p.exp[1]); eprojs.splice(i, 1); continue; }
    } else if (!dead && P.alive && Math.abs(p.x - P.x) < P.hw + p.size * .5 && Math.abs(p.z - P.z) < P.hw + p.size * .5 && p.y > P.y - p.size * .5 && p.y < P.y + P.h + p.size * .5) {
      const l = Math.hypot(p.vx, p.vz) || 1; hurtPlayer(p.dmg, p.vx / l, p.vz / l, undefined, p.owner); dead = true;
    }
    if (Math.random() < dt * 30) emit(p.x, p.y, p.z, rnd(-.5, .5), rnd(-.5, .5), rnd(-.5, .5), .08, p.rf ? [.4, 1, 1] : [1, .5, .1], .25, 2);
    if (dead) { sparkBurst(p.x, p.y, p.z, 5, p.rf ? [.4, 1, 1] : [1, .4, .1], 4); eprojs.splice(i, 1); }
  }
}
function drawEProjs() {
  for (const p of eprojs) {
    const s = p.size, c = p.col || [1, .55, .12]; pushBox(p.x, p.y, p.z, s, s, s, c[0], c[1], c[2], rotY(p.life * 9), false);
    pushBox(p.x, p.y, p.z, s * .55, s * .55, s * .55, Math.min(1, c[0] + .4), Math.min(1, c[1] + .4), Math.min(1, c[2] + .4), null, false);
  }
}

