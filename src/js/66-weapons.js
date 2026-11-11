// ---------------- weapons ----------------
function refreshHotbar() { hotSlots.forEach((d, i) => d.classList.toggle('locked', !weaponOK(i))); }
function switchWeapon(i) {
  if (i === P.weapon || i < 0 || i > 4) return;
  if (!Save.unlocked[i]) { feed('LOCKED — FORGE IT AT THE SMITH', '#ff8a3a'); SFX.empty(); return; }
  if (i === 4 && mode !== 'hub') { feed('OMNITOOL WORKS IN THE HUB ONLY', '#ff8a3a'); SFX.empty(); return; }
  P.lastWeapon = P.weapon < 0 || P.weapon === 4 ? (P.lastWeapon === 4 ? 0 : P.lastWeapon) : P.weapon; P.weapon = i; P.charge = 0; P.zoom = false; P.kick = .12; P.kickRot = -.4;
  hotSlots.forEach((d, k) => d.classList.toggle('on', k === i));
  { const hd = document.getElementById('hud'); if (hd) hd.classList.toggle('omni', i === 4); }
  txt(el.wname, WNAMES[i] + (i === 4 ? ' · ' + SHAPE_NAMES[P.shape || 0] : ''));
}
function nextWeapon(dir) { let i = P.weapon; for (let k = 0; k < 4; k++) { i = (i + dir + 4) % 4; if (weaponOK(i)) { switchWeapon(i); return; } } }
function toggleOmni() {                                                              // the omnitool is its own mode: D-pad UP in, D-pad UP out
  if (state !== 'play') return;
  if (P.weapon === 4) { const b = P.omniBack >= 0 && P.omniBack < 4 && weaponOK(P.omniBack) ? P.omniBack : 0; switchWeapon(b); return; }
  P.omniBack = P.weapon; switchWeapon(4);
}
function recoil(z, r) { rumble(.15 + z * 2, .1 + z * 2, 60); P.kick = Math.min(.3, P.kick + z); P.kickRot += r; P.flashT = .05; }
function cycleShape(d = 1) { P.shape = ((P.shape || 0) + d + SHAPE_NAMES.length) % SHAPE_NAMES.length; updateWname(); feed('SHAPE: ' + SHAPE_NAMES[P.shape], '#7af0ff'); SFX.place(); }
function updateWname() { if (typeof el !== 'undefined' && el.wname) txt(el.wname, WNAMES[P.weapon] + (P.weapon === 4 ? ' · ' + SHAPE_NAMES[P.shape || 0] : '')); }
function targetBlock() { const e = eyePos(), f = fwdV(); return raycast(e[0], e[1], e[2], f[0], f[1], f[2], reach()); }
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
  } else if (w === 4) omniUpdate(dt, L, R);
  else { Mine.p = 0; Mine.heldR = false; }
}
// ============================================================
//  OMNITOOL — mining and building with Minecraft's rules.
//  REACH 4.5 blocks (5 in creative). MINING: hold to break; every block has a hardness in seconds, the timer restarts if the crosshair moves to another
//  block or you let go, and after a break there is a 0.25 s pause before the next block starts (no accidental tunnelling). Creative breaks at once.
//  BUILDING: one block the instant you press; holding repeats every 0.20 s; letting go re-arms it, so fast clicking is never slowed down.
//  There is no arm swing: the tool SYPHONS (a flat stream of pixels between the block and the arm) and clicks on every break tick and every placement.
// ============================================================
const REACH = 4.5, REACH_CREATIVE = 5, BREAK_COOLDOWN = .25, PLACE_REPEAT = .2;
const HARD_DEFAULT = .6, HARD = { 20: .35, 7: .35, 16: .35, 17: .4, 5: .5, 2: .55, 1: .8, 12: .8, 6: .9, 13: .7, 8: 1.1, 18: 1.1, 21: .9, 3: 2.2, 22: 1.4, 14: .3, 15: .3 };
(function () { const soft = { 'ABYSS SILT': .35, 'SALT CRUST': .35, 'GLOOMSTONE': .8, 'PALE STRATA': .8, 'STICKWOOD': .7, 'SPINE': .6 }; MATS.forEach((m, i) => { if (soft[m.name]) HARD[MAT0 + i] = soft[m.name]; else if (m.emissive) HARD[MAT0 + i] = .3; else if (/STEEL|METAL|PLATE|TRUSS|HULL|CHROME/.test(m.name)) HARD[MAT0 + i] = 1.1; }); for (let b = 32; b < 48; b++) if (HARD[b] === undefined) HARD[b] = .9; })();
const hardness = id => { const h = HARD[BASE[id] || id]; return h === undefined ? HARD_DEFAULT : h; };
const reach = () => Inv.creative || GOD.on ? REACH_CREATIVE : REACH;
const Mine = { x: 0, y: 0, z: 0, p: 0, need: 1, on: false, cd: 0, tick: 0, heldR: false, rep: 0, msg: 0 };
const Syph = { t: 0, dir: 1, dist: 3, col: [1, 1, 1], pulse: 0 };          // dir 1 = block -> arm (mining), -1 = arm -> block (placing); t = seconds left of a burst
function syphon(dir, dist, col, t) { Syph.dir = dir; Syph.dist = dist; Syph.col = col || [1, 1, 1]; Syph.t = Math.max(Syph.t, t); }
function breakBlock(h, id) {
  if (!setBlock(h.x, h.y, h.z, 0)) return false;
  if (!Inv.creative) { const [dk, dn] = dropOf(id); spawnDrop(h.x + .5, h.y + .4, h.z + .5, dk, dn); }          // the block pops out as a little item you walk over to collect
  for (let i = 0; i < 7; i++) emit(h.x + .5, h.y + .5, h.z + .5, rnd(-3, 3), rnd(1, 5), rnd(-3, 3), rnd(.08, .2), COL[id] || [1, 1, 1], rnd(1, 3), 0);
  SFX.dig(); SFX.syphon(1); recoil(.035, .04); P.flashT = 0; syphon(1, h.t, COL[id], .22); Syph.pulse = 1;
  return true;
}
function omniUpdate(dt, L, R) {
  const M = Mine; M.cd = Math.max(0, M.cd - dt); M.msg = Math.max(0, M.msg - dt); Syph.t = Math.max(0, Syph.t - dt); Syph.pulse = Math.max(0, Syph.pulse - dt * 5);
  const h = targetBlock(); M.on = false;
  // ---- mining
  if (L && h) {
    const id = get(h.x, h.y, h.z), can = h.y >= 1 && id !== 9 && id !== 10 && id !== 11 && !(useChunks && OW.gen === 3 && stProtected(h.x, h.y, h.z));
    if (h.x !== M.x || h.y !== M.y || h.z !== M.z) { M.x = h.x; M.y = h.y; M.z = h.z; M.p = 0; M.tick = 0; }          // looked at another block: start again
    if (!can) { M.p = 0; if (M.msg <= 0) { M.msg = .6; if (stProtected(h.x, h.y, h.z)) { feed('HELICARRIER HULL — INDESTRUCTIBLE', '#7af0ff'); SFX.shink && SFX.shink(); } else SFX.empty(); } }
    else if (M.cd <= 0) {
      M.need = Inv.creative || GOD.on ? 0 : hardness(id); M.p += dt; M.on = true;
      syphon(1, h.t, COL[id], .08);
      M.tick -= dt; if (M.tick <= 0 && M.p < M.need) { M.tick = .16; SFX.mineTick(M.need ? M.p / M.need : 1); }       // a crisp tick as it works
      if (M.p >= M.need) { if (breakBlock(h, id)) M.cd = BREAK_COOLDOWN; M.p = 0; M.on = false; }
    }
  } else { M.p = 0; M.tick = 0; }                                             // let go (or nothing in reach): progress is lost
  // ---- placing / buckets: once on the press, then every 0.2 s while held
  let fire = false;
  if (R) { if (!M.heldR) { fire = true; M.rep = PLACE_REPEAT; } else { M.rep -= dt; if (M.rep <= 0) { fire = true; M.rep += PLACE_REPEAT; } } }
  M.heldR = !!R; if (!fire) return;
  const bs = Inv.slots[Inv.sel];
  if (bs && isBucket(bs.k)) {                                               // buckets work like Minecraft's: an empty one scoops a source, a full one pours one out
    const e = eyePos(), f = fwdV(), bh = raycast(e[0], e[1], e[2], f[0], f[1], f[2], reach(), true); if (!bh) return;
    const bid = get(bh.x, bh.y, bh.z);
    if (bs.k === 'bucket') { if (bid === 3600 || bid === 4) { setBlock(bh.x, bh.y, bh.z, 0); const full = bid === 4 ? 'bucket_lava' : 'bucket_water'; if (!Inv.creative) { Inv.useSel(); if (Inv.add(full, 1)) feed('INVENTORY FULL', '#ff8a3a'); } SFX.place(); SFX.syphon(1); syphon(1, bh.t, bid === 4 ? [1, .5, .1] : [.25, .3, .45], .25); } }
    else { const px = bh.x + bh.nx, py = bh.y + bh.ny, pz = bh.z + bh.nz, tid = bs.k === 'bucket_lava' ? 4 : 3600, at = (isLiquid(bid) ? [bh.x, bh.y, bh.z] : [px, py, pz]), cur = get(at[0], at[1], at[2]);
      if ((cur === 0 || isLiquid(cur)) && !playerOverlaps(at[0], at[1], at[2]) && setBlock(at[0], at[1], at[2], tid)) { if (!Inv.creative) { Inv.useSel(); if (Inv.add('bucket', 1)) feed('INVENTORY FULL', '#ff8a3a'); } SFX.place(); SFX.syphon(-1); syphon(-1, bh.t, tid === 4 ? [1, .5, .1] : [.25, .3, .45], .25); } }
    return;
  }
  const ph = h || (GOD.on ? GOD.air() : null); if (!ph) return;                // god mode: with nothing in reach the block goes into the air in front of you
  const px = ph.x + ph.nx, py = ph.y + ph.ny, pz = ph.z + ph.nz, cur = get(px, py, pz);            // always the hit block + the face normal the ray came in through
  if (cur !== 0 && !isLiquid(cur)) return;                                    // liquids are replaceable: the block goes straight into them
  let bid = Inv.selBlock();
  if (bid) { const e = eyePos(), f = fwdV(), hy = e[1] + f[1] * ph.t, top = ph.ny < 0 || (ph.ny === 0 && hy - py >= .5);          // aim at the upper half of a wall, or under a block, and half blocks go in the top half
    const k = KIND[bid]; if (k === K.SCREEN) { const nf = ph.nx > 0 ? 0 : ph.nx < 0 ? 1 : ph.nz > 0 ? 2 : ph.nz < 0 ? 3 : (Math.abs(f[0]) > Math.abs(f[2]) ? (f[0] > 0 ? 1 : 0) : (f[2] > 0 ? 3 : 2)); bid = screenId(screenType(bid), nf); }
    else if (k === K.RAIL) { /* rails are placed as they are */ }
    else if (k) bid = shapeId(BASE[bid], k === K.SLAB_B || k === K.SLAB_T ? 1 : k === K.STAIR ? 2 : k === K.VSLAB ? 3 : k === K.WALL ? 4 : k === K.PILLAR ? 5 : k === K.FENCE ? 7 : k === K.PANE ? 8 : 6, f, { top });       // an older slab / stairs item keeps its shape
    else bid = shapeId(bid, P.shape || 0, f, { top }); }
  if (!bid) { if (M.msg <= 0) { M.msg = .6; feed('NO BLOCK SELECTED — OPEN INVENTORY (I)', '#ff8a3a'); SFX.empty(); } return; }
  if (playerOverlaps(px, py, pz)) return;                                     // never wall yourself in
  if (setBlock(px, py, pz, bid)) { Inv.useSel(); SFX.place(); SFX.syphon(-1); recoil(.02, .025); P.flashT = 0; syphon(-1, ph.t === undefined ? 3 : ph.t, COL[bid] || COL[BASE[bid]], .2); }
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

