// ---- interaction (smith, turrets, locked door) ----
function nearTurret() {
  if (mode !== 'dungeon') return null;
  for (const t of Run.turrets) if (Math.hypot(P.x - t.x, P.z - t.z) < 3.6 && Math.abs(P.y - (t.y - 1)) < 3) return t;
  return null;
}
function bossRoom() { return Run.rooms.find(r => r.type === 'boss'); }
function nearLock(q) {
  q = q || P; const b = bossRoom(); if (!b || !b.locked) return false;
  const dc = doorCenter(b, Object.keys(b.doors)[0]); return Math.hypot(q.x - dc[0], q.z - dc[1]) < 7 && Math.abs(q.y - 5) < 4;
}
function tryInteract() {
  if (mode === 'hub') { if (nearNPC()) { openShop(); return true; } if (Rift.nearConsole()) { Rift.open(); return true; } return false; }
  const t = nearTurret();
  if (t && !t.on) {
    if (Save.gems >= t.price) { Save.gems -= t.price; if (Net.role === 'client') Net.send('turret', [Run.turrets.indexOf(t)]); else t.on = true; saveGame(); SFX.rank(); SFX.place(); feed('TURRET ONLINE', '#37f0ff'); }
    else { feed('NEED ◆ ' + t.price + ' DEMON GEMS', '#ff8a3a'); SFX.empty(); }
    return true;
  }
  return false;
}
function interactPrompt() {
  const k = gp.on ? '[Y]' : '[E]';
  if (mode === 'hub') return nearNPC() ? k + '  TRADE WITH VEX THE SMITH' : Rift.nearConsole() ? k + '  RIFT CONSOLE — ENTER COORDINATES' : '';
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
  // The host runs the rooms for EVERYONE: any living player can wake a room, open a chest, use the key or step into the glyph.
  const bodies = livePlayers();
  let act = Run.rooms.find(r => r.state === 'active');
  for (const q of bodies) {
    const r = roomAt(q.x, q.z); if (!r) continue;
    if (!r.visited) markKnown(r);
    if (!act && r.state === 'fresh') { const lx = q.x - r.ox, lz = q.z - r.oz, m = r.sz - 5; if (lx >= 5 && lx <= m && lz >= 5 && lz <= m) { activateRoom(r); act = r; } }
  }
  if (act) Run.cur = act;
  else { const r = roomAt(P.x, P.z); if (r && r !== Run.cur) { Run.cur = r; markKnown(r); } }
  if (Run.cur && Run.cur.type === 'boss' && P.y > 12) { const rr = Run.cur; P.x = clamp(P.x, rr.ox + 2.4, rr.ox + rr.sz - 2.4); P.z = clamp(P.z, rr.oz + 2.4, rr.oz + rr.sz - 2.4); }
  const b = bossRoom();
  if (b && b.locked && Run.hasKey && bodies.some(q => nearLock(q))) {
    b.locked = false; const bx = doorBox(b, Object.keys(b.doors)[0]); fillSeal(bx[0], bx[1], bx[2], bx[3], bx[4], bx[5], 0);
    banner('DOOR UNLOCKED', 'THE BOSS WAITS BEYOND THE SMOKE'); SFX.rank(); SFX.boom();
  }
  const c = act;
  if (c && c.state === 'active') {
    Run.spawnT -= dt;
    if (Run.spawnT <= 0 && Run.queue.length && enemies.length < 12) { const t = Run.queue.shift(), p = roomSpawn(c, ED[t].fly); if (t === 'boss') spawnBoss(p[0], p[1], p[2]); else spawnEnemy(t, p[0], p[1], p[2]); Run.spawnT = t === 'boss' ? 1.2 : .4; }
    if (!Run.queue.length && !enemies.length) clearRoom(c);
  }
  updateTurrets(dt);
  for (const ch of Run.chests) { ch.t += dt; if (!ch.open) { const q = bodies.find(q => Math.hypot(q.x - ch.x, q.z - ch.z) < 2.1 && Math.abs(q.y - ch.y) < 2.5); if (q) openChest(ch, q); } }
  const g = Run.glyph;
  if (g) { g.t += dt; glyphFx(g, dt); if (bodies.some(q => Math.hypot(q.x - g.x, q.z - g.z) < 2.3 && Math.abs(q.y - g.y) < 3)) returnToHub(); }
}
function glyphFx(g, dt) { if (Math.random() < dt * 30) { const a = rnd(TAU); emit(g.x + Math.cos(a) * 2.2, g.y + .2, g.z + Math.sin(a) * 2.2, 0, rnd(2, 5), 0, .1, [.4, .9, 1], 1, 2); } }
// a guest runs only the view-side bits of the dungeon; the host owns the rules
function updateDungeonClient(dt) {
  const r = roomAt(P.x, P.z); if (r && !r.visited) markKnown(r);
  if (Run.cur && Run.cur.type === 'boss' && P.y > 12) { const rr = Run.cur; P.x = clamp(P.x, rr.ox + 2.4, rr.ox + rr.sz - 2.4); P.z = clamp(P.z, rr.oz + 2.4, rr.oz + rr.sz - 2.4); }
  for (const ch of Run.chests) ch.t += dt;
  if (Run.glyph) { Run.glyph.t += dt; glyphFx(Run.glyph, dt); }
  for (const t of Run.turrets) t.t += dt;
}
function updateWorld(dt) { if (mode === 'hub') updateHub(dt); else updateDungeon(dt); }

