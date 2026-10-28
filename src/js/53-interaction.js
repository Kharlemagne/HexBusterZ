// ---- interaction (smith, turrets, locked door) ----
function nearTurret() {
  if (mode !== 'dungeon') return null;
  for (const t of Run.turrets) if (Math.hypot(P.x - t.x, P.z - t.z) < 3.6 && Math.abs(P.y - (t.y - 1)) < 3) return t;
  return null;
}
function bossRoom() { return Run.rooms.find(r => r.type === 'boss'); }
function nearLock() {
  const b = bossRoom(); if (!b || !b.locked) return false;
  const dc = doorCenter(b, Object.keys(b.doors)[0]); return Math.hypot(P.x - dc[0], P.z - dc[1]) < 7 && Math.abs(P.y - 5) < 4;
}
function tryInteract() {
  if (mode === 'hub') { if (nearNPC()) { openShop(); return true; } return false; }
  const t = nearTurret();
  if (t && !t.on) {
    if (Save.gems >= t.price) { Save.gems -= t.price; t.on = true; saveGame(); SFX.rank(); SFX.place(); feed('TURRET ONLINE', '#37f0ff'); }
    else { feed('NEED ◆ ' + t.price + ' DEMON GEMS', '#ff8a3a'); SFX.empty(); }
    return true;
  }
  return false;
}
function interactPrompt() {
  const k = gp.on ? '[Y]' : '[E]';
  if (mode === 'hub') return nearNPC() ? k + '  TRADE WITH VEX THE SMITH' : '';
  const t = nearTurret(); if (t && !t.on) return k + '  POWER UP TURRET — ◆ ' + t.price;
  if (nearLock() && !Run.hasKey) return 'LOCKED — THE KEY IS IN THE TREASURE ROOM CHEST';
  return '';
}
function updateTurrets(dt) {
  for (const t of Run.turrets) {
    t.t += dt; if (!t.on) continue; t.cd -= dt;
    const sx = t.x, sy = t.y + .95, sz = t.z; let tg = null, tc = null, bd = 1e9;
    for (const e of enemies) {
      if (e.dead) continue; let c = enemyCenter(e);
      if (e.pieces) { const al = e.pieces.map((p, k) => k).filter(k => !e.pieces[k].broken); if (al.length) c = pieceCenter(e, al[(Math.random() * al.length) | 0]); }
      const d = Math.hypot(c[0] - sx, c[1] - sy, c[2] - sz);
      if (d > 48) continue; const pr = e.def.boss ? d - 100 : d; if (pr < bd && hasLOS(sx, sy, sz, c[0], c[1], c[2])) { bd = pr; tg = e; tc = c; }
    }
    if (!tg) continue;
    const c = tc, dx = c[0] - sx, dy = c[1] - sy, dz = c[2] - sz, d = Math.hypot(dx, dy, dz);
    let ty = Math.atan2(dx, dz), dyaw = ty - t.yaw; while (dyaw > Math.PI) dyaw -= TAU; while (dyaw < -Math.PI) dyaw += TAU;
    t.yaw += dyaw * Math.min(1, 14 * dt); t.pitch = lerp(t.pitch, Math.atan2(dy, Math.hypot(dx, dz)), Math.min(1, 14 * dt));
    if (t.cd <= 0) {
      t.cd = .17; const f = [dx / d, dy / d, dz / d], m = [sx + f[0] * 1.1, sy + f[1] * 1.1, sz + f[2] * 1.1];
      addBeam(m, c, .07, [.4, 1, 1], .07);
      damageEnemy(tg, 7, { dir: f, pt: c, knock: .6, w: 7 });
      if (Math.random() < .35) tone(rnd(500, 700), .035, 'square', .04, 300);
      for (let i = 0; i < 2; i++) emit(m[0], m[1], m[2], rnd(-1, 1) + f[0] * 4, rnd(-1, 1) + f[1] * 4, rnd(-1, 1) + f[2] * 4, .06, [.4, 1, 1], .2, 2);
    }
  }
}
function updateDungeon(dt) {
  const r = roomAt(P.x, P.z);
  if (r) {
    if (r !== Run.cur) { Run.cur = r; markKnown(r); }
    const lx = P.x - r.ox, lz = P.z - r.oz, m = r.sz - 5;
    if (r.state === 'fresh' && lx >= 5 && lx <= m && lz >= 5 && lz <= m) activateRoom(r);
  }
  if (Run.cur && Run.cur.type === 'boss' && P.y > 12) { const rr = Run.cur; P.x = clamp(P.x, rr.ox + 2.4, rr.ox + rr.sz - 2.4); P.z = clamp(P.z, rr.oz + 2.4, rr.oz + rr.sz - 2.4); }
  const b = bossRoom();
  if (b && b.locked && Run.hasKey && nearLock()) {
    b.locked = false; const bx = doorBox(b, Object.keys(b.doors)[0]); fillSeal(bx[0], bx[1], bx[2], bx[3], bx[4], bx[5], 0);
    banner('DOOR UNLOCKED', 'THE BOSS WAITS BEYOND THE SMOKE'); SFX.rank(); SFX.boom();
  }
  const c = Run.cur;
  if (c && c.state === 'active') {
    Run.spawnT -= dt;
    if (Run.spawnT <= 0 && Run.queue.length && enemies.length < 12) { const t = Run.queue.shift(), p = roomSpawn(c, ED[t].fly); if (t === 'boss') spawnBoss(p[0], p[1], p[2]); else spawnEnemy(t, p[0], p[1], p[2]); Run.spawnT = t === 'boss' ? 1.2 : .4; }
    if (!Run.queue.length && !enemies.length) clearRoom(c);
  }
  updateTurrets(dt);
  for (const ch of Run.chests) { ch.t += dt; if (!ch.open && Math.hypot(P.x - ch.x, P.z - ch.z) < 2.1 && Math.abs(P.y - ch.y) < 2.5) openChest(ch); }
  const g = Run.glyph;
  if (g) { g.t += dt; if (Math.random() < dt * 30) { const a = rnd(TAU); emit(g.x + Math.cos(a) * 2.2, g.y + .2, g.z + Math.sin(a) * 2.2, 0, rnd(2, 5), 0, .1, [.4, .9, 1], 1, 2); }
    if (Math.hypot(P.x - g.x, P.z - g.z) < 2.3 && Math.abs(P.y - g.y) < 3) returnToHub(); }
}
function updateWorld(dt) { if (mode === 'hub') updateHub(dt); else updateDungeon(dt); }

