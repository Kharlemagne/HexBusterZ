// ---------------- weapons ----------------
function refreshHotbar() { hotSlots.forEach((d, i) => d.classList.toggle('locked', !weaponOK(i))); }
function switchWeapon(i) {
  if (i === P.weapon || i < 0 || i > 4) return;
  if (!Save.unlocked[i]) { feed('LOCKED — FORGE IT AT THE SMITH', '#ff8a3a'); SFX.empty(); return; }
  if (i === 4 && mode !== 'hub') { feed('DIG KIT WORKS IN THE HUB ONLY', '#ff8a3a'); SFX.empty(); return; }
  P.lastWeapon = P.weapon < 0 ? 0 : P.weapon; P.weapon = i; P.charge = 0; P.zoom = false; P.kick = .12; P.kickRot = -.4;
  hotSlots.forEach((d, k) => d.classList.toggle('on', k === i));
  txt(el.wname, WNAMES[i]);
}
function nextWeapon(dir) { let i = P.weapon; for (let k = 0; k < 5; k++) { i = (i + dir + 5) % 5; if (weaponOK(i)) { switchWeapon(i); return; } } }
function recoil(z, r) { rumble(.15 + z * 2, .1 + z * 2, 60); P.kick = Math.min(.3, P.kick + z); P.kickRot += r; P.flashT = .05; }
function targetBlock() { const e = eyePos(), f = fwdV(); return raycast(e[0], e[1], e[2], f[0], f[1], f[2], 6.5); }
function playerOverlaps(x, y, z) {
  return x + 1 > P.x - P.hw && x < P.x + P.hw && z + 1 > P.z - P.hw && z < P.z + P.hw && y + 1 > P.y && y < P.y + P.h;
}
function updateWeapons(dt) {
  for (let i = 0; i < 5; i++) cds[i] = Math.max(0, cds[i] - dt);
  const L = mouse.l || keys.KeyF || gp.rt > .3, R = mouse.r || keys.KeyG || gp.lt > .3, o = eyePos(), w = P.weapon;
  P.zoom = false;
  if (w === 0) {
    if (L && cds[0] <= 0) { castBullet(o, spreadDir(.003), { dmg: 14, th: .035, col: [1, .85, .3], knock: 3, w: 0 }); cds[0] = .2; recoil(.07, .12); SFX.revolver(); }
    if (R) P.charge = Math.min(1, P.charge + dt / .85);
    else if (P.charge > 0) {
      if (P.charge > .25 && cds[0] <= 0) { castBullet(o, fwdV(), { dmg: 26 + 95 * P.charge, th: .1 + P.charge * .12, col: [1, .5, .15], pierce: true, knock: 8, w: 0, life: .2, big: true }); cds[0] = .5; recoil(.14, .25); SFX.charged(); P.shake = Math.max(P.shake, .25); }
      P.charge = 0;
    }
  } else if (w === 1) {
    if (L && cds[1] <= 0) {
      for (let i = 0; i < 11; i++) castBullet(o, spreadDir(.075), { dmg: 7, th: .022, col: [1, .75, .3], knock: 1.5, w: 1, life: .07, noSpark: i > 3 });
      cds[1] = .72; recoil(.2, .3); SFX.shotgun(); P.shake = Math.max(P.shake, .2);
    } else if (R && cds[1] <= 0) {
      const f = fwdV(), m = muzzle();
      for (const e of enemies) {
        if (e.dead) continue; const c = enemyCenter(e), dx = c[0] - o[0], dy = c[1] - o[1], dz = c[2] - o[2], d = Math.hypot(dx, dy, dz);
        if (d < 7 && d > .01 && (dx * f[0] + dy * f[1] + dz * f[2]) / d > .55) damageEnemy(e, 42 * (1 - d / 10), { dir: f, knock: 16, up: 3, pt: c, w: 1, big: true, expl: true });
      }
      const h = raycast(o[0], o[1], o[2], f[0], f[1], f[2], 3.2); if (h) carve(h.x + .5 + f[0], h.y + .5 + f[1], h.z + .5 + f[2], 1.7, true);
      for (let i = 0; i < 40; i++) { const sd = spreadDir(.5), s = rnd(6, 16); emit(m[0], m[1], m[2], sd[0] * s, sd[1] * s, sd[2] * s, rnd(.1, .26), Math.random() < .5 ? [1, .6, .15] : [1, .95, .5], rnd(.2, .45), 2); }
      P.vx -= f[0] * 12; P.vy -= f[1] * 12; P.vz -= f[2] * 12; if (f[1] < -.3) P.onGround = false;
      cds[1] = 1.15; recoil(.28, .45); SFX.blast(); P.shake = Math.max(P.shake, .5);
    }
  } else if (w === 2) {
    if (L && cds[2] <= 0) { castBullet(o, spreadDir(.022), { dmg: 4.5, th: .02, col: [.4, .95, 1], knock: .8, w: 2, life: .05, noSpark: Math.random() < .6 }); cds[2] = .06; recoil(.025, .03); SFX.rivet(); }
    if (R && cds[2] <= 0) {
      const f = fwdV(), m = muzzle(); bombs.push({ x: m[0], y: m[1], z: m[2], vx: f[0] * 50, vy: f[1] * 50, vz: f[2] * 50, stuck: false, e: null, t: 0, ox: 0, oy: 0, oz: 0 });
      cds[2] = .8; recoil(.1, .2); SFX.bomb();
    }
  } else if (w === 3) {
    if (L && cds[3] <= 0) {
      castBullet(o, fwdV(), { dmg: 140, th: .22, col: [.4, 1, 1], pierce: true, tunnel: 5, knock: 14, rail: true, w: 3, life: .4, big: true, up: 2 });
      cds[3] = 1.6; recoil(.3, .5); SFX.rail(); P.shake = Math.max(P.shake, .7);
      const m = muzzle(); for (let i = 0; i < 24; i++) emit(m[0], m[1], m[2], rnd(-4, 4), rnd(-2, 4), rnd(-4, 4), .1, [.4, 1, 1], rnd(.2, .5), 2);
    }
    P.zoom = !!R;
  } else if (w === 4) {
    digCd -= dt; const h = targetBlock();
    if (L && digCd <= 0 && h) {
      const id = get(h.x, h.y, h.z);
      if (h.y >= 1 && id !== 9 && id !== 10 && id !== 11 && setBlock(h.x, h.y, h.z, 0)) {
        if (!Inv.creative) { const [dk, dn] = dropOf(id); spawnDrop(h.x + .5, h.y + .4, h.z + .5, dk, dn); }          // the block pops out as a little item you walk over to collect
        for (let i = 0; i < 7; i++) emit(h.x + .5, h.y + .5, h.z + .5, rnd(-3, 3), rnd(1, 5), rnd(-3, 3), rnd(.08, .2), COL[id] || [1, 1, 1], rnd(1, 3), 0);
        SFX.dig(); digCd = .12; P.swing = 1;
      }
    }
    if (R && digCd <= 0 && h) {
      const px = h.x + h.nx, py = h.y + h.ny, pz = h.z + h.nz;
      if (get(px, py, pz) === 0 || isLava(get(px, py, pz))) {
        const bid = Inv.selBlock();
        if (!bid) { if (digCd <= 0) { feed('NO BLOCK SELECTED — OPEN INVENTORY (I)', '#ff8a3a'); SFX.empty(); digCd = .5; } }
        else if (!playerOverlaps(px, py, pz) && setBlock(px, py, pz, bid)) { Inv.useSel(); SFX.place(); digCd = .15; P.swing = .6; }
      }
    }
  }
}
function updateBombs(dt) {
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i];
    if (!b.stuck) {
      const sp = Math.hypot(b.vx, b.vy, b.vz), len = sp * dt, dx = b.vx / sp, dy = b.vy / sp, dz = b.vz / sp;
      let bestT = len, hitE = null;
      const h = raycast(b.x, b.y, b.z, dx, dy, dz, len); if (h) bestT = h.t;
      for (const e of enemies) {
        if (e.dead) continue; const t = rayAABB(b.x, b.y, b.z, dx, dy, dz, e.x - e.hw, e.y, e.z - e.hw, e.x + e.hw, e.y + e.h, e.z + e.hw);
        if (t !== null && t < bestT) { bestT = t; hitE = e; }
      }
      b.x += dx * bestT; b.y += dy * bestT; b.z += dz * bestT;
      if (hitE || h) { b.stuck = true; if (hitE) { b.e = hitE; b.ox = b.x - hitE.x; b.oy = b.y - hitE.y; b.oz = b.z - hitE.z; damageEnemy(hitE, 6, { dir: [dx, dy, dz], pt: [b.x, b.y, b.z], knock: 1, w: 2 }); } sparkBurst(b.x, b.y, b.z, 5, [1, .6, .2], 4); }
    } else {
      b.t += dt;
      if (b.e && !b.e.dead) { b.x = b.e.x + b.ox; b.y = b.e.y + b.oy; b.z = b.e.z + b.oz; } else b.e = null;
      if (b.t > 1.05) { explode(b.x, b.y, b.z, 3.6, 70, 2.0, { w: 2 }); bombs.splice(i, 1); }
    }
  }
}
function drawBombs() {
  for (const b of bombs) {
    const blink = b.stuck && Math.sin(b.t * (14 + b.t * 30)) > 0;
    pushBox(b.x, b.y, b.z, .2, .2, .2, 1, blink ? 1 : .5, blink ? .8 : .1, null, false);
    pushBox(b.x, b.y, b.z, .1, .1, .5, .6, .9, 1, null, false);
  }
}

