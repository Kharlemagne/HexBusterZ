// ---------------- hazards (telegraphed area attacks) ----------------
const haz = [];
function drawDisc(x, y, z, r, t, col, fill) {
  const n = Math.max(10, Math.round(r * 5)), pu = .6 + Math.sin(t * 12) * .4;
  for (let i = 0; i < n; i++) { const a = i / n * TAU; pushBox(x + Math.cos(a) * r, y + .12, z + Math.sin(a) * r, .34, .12, .34, col[0] * pu, col[1] * pu, col[2] * pu, null, false); }
  const m = Math.round(n * .55); for (let i = 0; i < m; i++) { const a = i / m * TAU + t; pushBox(x + Math.cos(a) * r * .5, y + .1, z + Math.sin(a) * r * .5, .22, .1, .22, col[0] * .6, col[1] * .6, col[2] * .6, null, false); }
  if (fill) pushBox(x, y + .06, z, r * 1.6, .06, r * 1.6, col[0] * .25 * fill, col[1] * .25 * fill, col[2] * .25 * fill, null, false);
}
function beamEnd(sx, sy, sz, d, max) { const h = raycast(sx, sy, sz, d[0], d[1], d[2], max); return h ? h.t : max; }
function segDist(px, py, pz, ax, ay, az, d, len) {
  const rx = px - ax, ry = py - ay, rz = pz - az; let t = rx * d[0] + ry * d[1] + rz * d[2]; t = clamp(t, 0, len);
  return Math.hypot(rx - d[0] * t, ry - d[1] * t, rz - d[2] * t);
}
function updateHaz(dt) {
  for (let i = haz.length - 1; i >= 0; i--) {
    const h = haz[i]; h.t += dt; let dead = false;
    switch (h.k) {
      case 'erupt': if (h.t >= h.delay) {
        for (let j = 0; j < 30; j++) { const a = rnd(TAU), rr = rnd(0, h.r); emit(h.x + Math.cos(a) * rr, h.y + .2, h.z + Math.sin(a) * rr, rnd(-1, 1), rnd(7, 16), rnd(-1, 1), rnd(.15, .35), Math.random() < .5 ? [1, .4, .1] : [.9, .2, .1], rnd(.5, 1), 2); }
        if (Math.hypot(P.x - h.x, P.z - h.z) < h.r && P.y < h.y + 4) { hurtPlayer(h.dmg, 0, 0, 0); P.vy = Math.max(P.vy, 10); P.onGround = false; }
        SFX.slam(); P.shake = Math.max(P.shake, .3); dead = true;
      } break;
      case 'track': {
        if (h.t < h.delay - .45) { h.x = lerp(h.x, P.x, Math.min(1, 3.2 * dt)); h.z = lerp(h.z, P.z, Math.min(1, 3.2 * dt)); h.y = floorSurf(h.x, h.z); }
        if (h.t >= h.delay) { bossBlast(h.x, h.y + .5, h.z, h.r + .4, h.dmg); dead = true; }
      } break;
      case 'meteor': {
        const u = clamp(h.t / h.delay, 0, 1);
        if (u >= 1) { bossBlast(h.x, h.y + .4, h.z, h.r, h.dmg); dead = true; }
        else if (Math.random() < dt * 40) emit(h.x, h.y + 36 * (1 - u), h.z, rnd(-1, 1), rnd(0, 2), rnd(-1, 1), .18, [1, .5, .1], .4, 2);
      } break;
      case 'lob': {
        if (h.t >= h.delay) { bossBlast(h.tgt[0], h.tgt[1] + .4, h.tgt[2], h.r, h.dmg); dead = true; }
      } break;
      case 'mine': {
        if (h.t > .9 && (Math.hypot(P.x - h.x, P.z - h.z) < 2.3 && Math.abs(P.y - h.y) < 2.5 || h.t > 8)) { bossBlast(h.x, h.y + .4, h.z, h.r, h.dmg); dead = true; }
      } break;
      case 'cloud': {
        if (h.t > h.dur) dead = true;
        else { h.tick = (h.tick || 0) + dt; if (Math.random() < dt * 14) emit(h.x + rnd(-h.r, h.r) * .8, h.y + .3, h.z + rnd(-h.r, h.r) * .8, rnd(-.3, .3), rnd(.5, 1.5), rnd(-.3, .3), rnd(.25, .5), [.3, .55, .15], rnd(.8, 1.6), 2);
          if (h.tick > .45 && Math.hypot(P.x - h.x, P.z - h.z) < h.r && P.y < h.y + 3) { h.tick = 0; hurtPlayer(h.dmg, 0, 0, 0); } }
      } break;
      case 'ring': {
        h.r += h.sp * dt; if (h.r > h.max) dead = true;
        if (!h.hit && Math.abs(Math.hypot(P.x - h.x, P.z - h.z) - h.r) < 1.4 && P.y < h.y + 1.3) { h.hit = true; const dx = P.x - h.x, dz = P.z - h.z, l = Math.hypot(dx, dz) || 1; hurtPlayer(h.dmg, dx / l, dz / l, 9); }
      } break;
      case 'laser': {
        const tt = h.t - h.tele, a = tt < 0 ? h.a0 : lerp(h.a0, h.a1, clamp(tt / h.sweep, 0, 1));
        h.dir = [Math.sin(a), 0, Math.cos(a)]; h.len = beamEnd(h.sx, h.y, h.sz, h.dir, 70);
        if (tt >= 0) {
          const rx = P.x - h.sx, rz = P.z - h.sz, al = rx * h.dir[0] + rz * h.dir[2], pe = Math.abs(rx * h.dir[2] - rz * h.dir[0]);
          if (al > 0 && al < h.len && pe < 1 && P.y < h.y + .5 && P.y + P.h > h.y - .55) hurtPlayer(h.dmg, 0, 0, 6);
          if (tt > h.sweep) dead = true;
        }
      } break;
      case 'rail': {
        if (h.t < h.tele - .25) h.dir = aimFrom([h.sx, h.sy, h.sz], 0, 0);
        h.len = beamEnd(h.sx, h.sy, h.sz, h.dir, 90);
        if (!h.fired && h.t >= h.tele) {
          h.fired = true; SFX.rail(); P.shake = Math.max(P.shake, .4);
          if (segDist(P.x, P.y + .9, P.z, h.sx, h.sy, h.sz, h.dir, h.len) < 1.0) hurtPlayer(h.dmg, h.dir[0], h.dir[2], 10);
          sparkBurst(h.sx + h.dir[0] * h.len, h.sy + h.dir[1] * h.len, h.sz + h.dir[2] * h.len, 18, [.6, 1, 1], 8);
        }
        if (h.t > h.tele + .18) dead = true;
      } break;
    }
    if (dead) haz.splice(i, 1);
  }
}
function drawHaz(t) {
  for (const h of haz) {
    if (h.t < 0) continue;
    switch (h.k) {
      case 'erupt': drawDisc(h.x, h.y, h.z, h.r, t, [1, .3, .1], 1); break;
      case 'track': drawDisc(h.x, h.y, h.z, h.r, t, [1, .15, .5], 1); if (h.t > h.delay - .45) pushBeam(h.x, h.y, h.z, h.x, h.y + 45, h.z, .25 + (h.t - h.delay + .45) * 1.2, [1, .4, .8], 0); break;
      case 'meteor': { const u = clamp(h.t / h.delay, 0, 1); drawDisc(h.x, h.y, h.z, h.r, t, [1, .55, .1], 1); pushBox(h.x, h.y + 36 * (1 - u) + 1, h.z, 1.5, 1.5, 1.5, 1, .45, .1, rotY(t * 4), false); pushBox(h.x, h.y + 36 * (1 - u) + 3, h.z, 1, 3, 1, 1, .8, .3, null, false); } break;
      case 'lob': { const u = clamp(h.t / h.delay, 0, 1); drawDisc(h.tgt[0], h.tgt[1], h.tgt[2], h.r, t, [1, .5, .1], 1);
        pushBox(lerp(h.src[0], h.tgt[0], u), lerp(h.src[1], h.tgt[1], u) + 4 * 3.5 * u * (1 - u) * 1.6, lerp(h.src[2], h.tgt[2], u), .8, .8, .8, .2, .2, .25, rotY(t * 5)); pushBox(lerp(h.src[0], h.tgt[0], u), lerp(h.src[1], h.tgt[1], u) + 4 * 3.5 * u * (1 - u) * 1.6 + .5, lerp(h.src[2], h.tgt[2], u), .3, .3, .3, 1, .4, .1, null, false); } break;
      case 'mine': { const arm = h.t > .9, bl = arm ? (Math.sin(h.t * (6 + h.t * 2)) > 0) : false; pushBox(h.x, h.y + .25, h.z, .7, .4, .7, .25, .25, .3, rotY(h.t)); pushBox(h.x, h.y + .55, h.z, .22, .22, .22, 1, bl ? 1 : .2, bl ? .8 : .1, null, false); if (arm) drawDisc(h.x, h.y, h.z, 2.3, t, [.8, .15, .1], 0); } break;
      case 'cloud': { drawDisc(h.x, h.y, h.z, h.r, t * .3, [.3, .7, .15], 1.4); for (let j = 0; j < 7; j++) { const a = j / 7 * TAU + t * .4; pushBox(h.x + Math.cos(a) * h.r * .6, h.y + .6 + Math.sin(t * 2 + j) * .3, h.z + Math.sin(a) * h.r * .6, 1.6, 1.0, 1.6, .12, .3, .08, null, false); } } break;
      case 'ring': { const n = Math.min(70, Math.round(h.r * 3)); for (let j = 0; j < n; j++) { const a = j / n * TAU; pushBox(h.x + Math.cos(a) * h.r, h.y + .4, h.z + Math.sin(a) * h.r, .9, .8, .9, 1, .5 + .3 * Math.sin(t * 20 + j), .1, null, false); } } break;
      case 'laser': { const tt = h.t - h.tele; if (!h.dir) break;
        const e = [h.sx + h.dir[0] * h.len, h.y, h.sz + h.dir[2] * h.len];
        if (tt < 0) pushBeam(h.sx, h.y, h.sz, e[0], e[1], e[2], .08 + (1 + tt / h.tele) * .08, [1, .15, .15], 0);
        else { pushBeam(h.sx, h.y, h.sz, e[0], e[1], e[2], .9, [.9, .1, .3], 0); pushBeam(h.sx, h.y, h.sz, e[0], e[1], e[2], .35, [1, .9, .9], 0); } } break;
      case 'rail': { if (!h.dir) break; const e = [h.sx + h.dir[0] * h.len, h.sy + h.dir[1] * h.len, h.sz + h.dir[2] * h.len];
        if (h.t < h.tele) pushBeam(h.sx, h.sy, h.sz, e[0], e[1], e[2], .06 + (h.t / h.tele) * .08, h.t > h.tele - .25 ? [1, 1, 1] : [1, .2, .2], 0);
        else { pushBeam(h.sx, h.sy, h.sz, e[0], e[1], e[2], .55, [.4, 1, 1], 0); pushBeam(h.sx, h.sy, h.sz, e[0], e[1], e[2], .2, [1, 1, 1], 0); } } break;
    }
  }
}

