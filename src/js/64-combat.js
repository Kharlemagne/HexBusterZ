// ---------------- combat ----------------
function carve(cx, cy, cz, r, debris) {
  const x0 = Math.floor(cx - r), x1 = Math.ceil(cx + r), y0 = Math.floor(cy - r), y1 = Math.ceil(cy + r), z0 = Math.floor(cz - r), z1 = Math.ceil(cz + r);
  let n = 0;
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const dx = x + .5 - cx, dy = y + .5 - cy, dz = z + .5 - cz;
    if (dx * dx + dy * dy + dz * dz > r * r) continue;
    const id = get(x, y, z); if (!id || id === 9 || id === 10 || id === 11 || y < 1 || x < 1 || z < 1 || x >= N - 1 || z >= N - 1) continue;
    if (debris && n < 16 && Math.random() < .5 && id !== 4) { n++; const c = COL[id]; emit(x + .5, y + .5, z + .5, dx * rnd(2, 5), rnd(2, 8), dz * rnd(2, 5), rnd(.12, .3), c, rnd(1.5, 4), 0); }
    setBlock(x, y, z, 0);
  }
}
function damageEnemy(e, dmg, o) {
  if (e.dead) return;
  o = o || {};
  if (e.pieces) return damageBoss(e, dmg, o);
  e.hp -= dmg; e.flash = .07; addStyle(dmg * .15); P.hitT = .13;
  if (o.dir) { const k = (o.knock || 3) / e.def.mass; e.vx += o.dir.x !== undefined ? o.dir.x * k : o.dir[0] * k; e.vz += o.dir.z !== undefined ? o.dir.z * k : o.dir[2] * k; e.vy += (o.up || 0) + (o.dir.y !== undefined ? o.dir.y : o.dir[1]) * k * .4; if (e.vy > 0) e.onGround = false; }
  const pt = o.pt || [e.x, e.y + e.h * .6, e.z];
  const dd = o.dir ? (o.dir.x !== undefined ? o.dir : { x: o.dir[0], y: o.dir[1], z: o.dir[2] }) : null;
  bloodBurst(pt[0], pt[1], pt[2], Math.min(14, 3 + dmg * .25), dd, .6);
  if (e.hp <= 0) killEnemy(e, o, dd); else SFX.hit();
}
function killEnemy(e, o, dd) {
  e.dead = true;
  const boss = e.def.boss, n = boss ? 130 : 30, cy = e.y + e.h * .55;
  for (let i = 0; i < n; i++) {
    const a = rnd(TAU), sp = rnd(1, 7) * (o.big ? 1.6 : 1), big = Math.random() < .3;
    const vx = Math.cos(a) * sp + (dd ? dd.x * rnd(2, 9) : 0), vz = Math.sin(a) * sp + (dd ? dd.z * rnd(2, 9) : 0), vy = rnd(2, 10) + (o.up ? 3 : 0);
    const r = Math.random(); const col = r < .55 ? BLOODS[(Math.random() * 4) | 0] : r < .75 ? BONES[(Math.random() * 2) | 0] : MEAT[(Math.random() * 3) | 0];
    emit(e.x + rnd(-e.hw, e.hw), cy + rnd(-e.h * .4, e.h * .4), e.z + rnd(-e.hw, e.hw), vx, vy, vz, (big ? rnd(.18, .34) : rnd(.07, .16)) * (boss ? 1.8 : 1), col, rnd(6, 11), big ? 0 : 1);
  }
  sparkBurst(e.x, cy, e.z, 8, [1, .2, .1], 6);
  SFX.kill(); hitstop = boss ? .15 : .05; P.shake = Math.max(P.shake, boss ? .9 : .18);
  onKill(e, Object.assign({ pb: Math.hypot(e.x - P.x, e.z - P.z) < 4.5 }, o));
}
function castBullet(o, d, opt) {
  const range = opt.range || 120; let endT = range, blockHit = null;
  if (opt.tunnel) {
    let trav = 0;
    for (let n = 0; n < opt.tunnel; n++) {
      const h = raycast(o[0] + d[0] * trav, o[1] + d[1] * trav, o[2] + d[2] * trav, d[0], d[1], d[2], range - trav);
      if (!h) { trav = range; break; }
      carve(h.x + .5, h.y + .5, h.z + .5, 1.6, true); trav += h.t + 1.0;
    }
    if (trav < range) { const h = raycast(o[0] + d[0] * trav, o[1] + d[1] * trav, o[2] + d[2] * trav, d[0], d[1], d[2], range - trav); endT = h ? trav + h.t : range; blockHit = h; }
    else endT = range;
  } else { blockHit = raycast(o[0], o[1], o[2], d[0], d[1], d[2], range); endT = blockHit ? blockHit.t : range; }
  const hits = [];
  for (const e of enemies) {
    if (e.dead) continue;
    const t = rayAABB(o[0], o[1], o[2], d[0], d[1], d[2], e.x - e.hw, e.y, e.z - e.hw, e.x + e.hw, e.y + e.h, e.z + e.hw);
    if (t !== null && t <= endT) hits.push({ e, t });
  }
  hits.sort((a, b) => a.t - b.t);
  const list = opt.pierce ? hits : hits.slice(0, 1);
  const finalT = (list.length && !opt.pierce) ? list[0].t : endT;
  for (const h of list) {
    const pt = [o[0] + d[0] * h.t, o[1] + d[1] * h.t, o[2] + d[2] * h.t];
    const head = pt[1] > h.e.y + h.e.h * .78;
    damageEnemy(h.e, opt.dmg * (head ? 2 : 1), { dir: d, pt, head, knock: opt.knock || 2, rail: opt.rail, w: opt.w, big: opt.big, up: opt.up });
  }
  const end = [o[0] + d[0] * finalT, o[1] + d[1] * finalT, o[2] + d[2] * finalT];
  addBeam(opt.from || muzzle(), end, opt.th, opt.col, opt.life || .09);
  if (!list.length && blockHit && !opt.noSpark) {
    const c = COL[get(blockHit.x, blockHit.y, blockHit.z)] || [1, 1, 1];
    sparkBurst(end[0], end[1], end[2], 4, [1, .85, .4], 4);
    if (Math.random() < .5) emit(end[0], end[1], end[2], rnd(-2, 2), rnd(1, 4), rnd(-2, 2), .08, c, 1.5, 0);
  }
  return list.length;
}
function explode(x, y, z, r, dmg, carveR, o) {
  o = o || {};
  for (const e of enemies) {
    if (e.dead) continue;
    const c = enemyCenter(e), dx = c[0] - x, dy = c[1] - y, dz = c[2] - z, d = Math.hypot(dx, dy, dz);
    const reach = r + e.h * .3 + e.hw;
    if (d < reach) {
      const f = clamp(1 - d / reach, .25, 1), l = d || 1;
      damageEnemy(e, dmg * f, { dir: { x: dx / l, y: dy / l, z: dz / l }, pt: [c[0], clamp(y, e.y + .1, e.y + e.h - .1), c[2]], knock: 14, up: 5, expl: true, w: o.w === undefined ? 2 : o.w, big: true });
    }
  }
  const pdx = P.x - x, pdy = P.y + 1 - y, pdz = P.z - z, pd = Math.hypot(pdx, pdy, pdz);
  if (pd < r + 1) { const f = 1 - pd / (r + 1), l = pd || 1; P.vx += pdx / l * 14 * f; P.vy += pdy / l * 12 * f + 4 * f; P.vz += pdz / l * 14 * f; P.onGround = false; hurtPlayer(10 * f, 0, 0, 0, 'self'); }
  carve(x, y, z, carveR, true);
  for (let i = 0; i < 46; i++) {
    const a = rnd(TAU), b = rnd(-1, 1), s = rnd(3, 13), k = Math.sqrt(1 - b * b);
    emit(x, y, z, Math.cos(a) * k * s, b * s, Math.sin(a) * k * s, rnd(.12, .4), Math.random() < .5 ? [1, .55, .1] : [1, .9, .4], rnd(.35, .9), 2);
  }
  for (let i = 0; i < 14; i++) emit(x, y, z, rnd(-5, 5), rnd(0, 8), rnd(-5, 5), rnd(.2, .45), [.18, .15, .15], rnd(1, 2.4), 0);
  SFX.boom(); P.shake = Math.max(P.shake, clamp(1.2 - pd / 22, 0, 1)); rumble(clamp(1.2 - pd / 20, 0, 1), .8, 250);
}
