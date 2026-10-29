// ---- slide / dash shield: reflects damage and projectiles back at the attacker ----
function shieldOn() { return P.alive && (P.shieldT > 0 || P.sliding || P.dashT > 0); }
function reflectTarget(src) {
  if (src && src !== 'self' && !src.dead) return src;
  let best = null, bd = 1e9; for (const e of enemies) { if (e.dead) continue; const d = Math.hypot(e.x - P.x, e.z - P.z) - (e.pieces ? 30 : 0); if (d < bd) { bd = d; best = e; } } return best;
}
function hitPointOn(e) {
  if (e.pieces) { const al = [0, 1, 2].filter(k => !e.pieces[k].broken); if (al.length) return pieceCenter(e, al[(Math.random() * al.length) | 0]); }
  return enemyCenter(e);
}
let lastReflectFx = -9;
function reflectFx() { P.shieldFlash = .3; SFX.reflect(); P.shake = Math.max(P.shake, .15); addStyle(25); if (S.time - lastReflectFx > .6) { lastReflectFx = S.time; feed('REFLECTED', '#6ec8ff'); } }
function reflectDamage(d, src) {
  reflectFx(); const o = eyePos(), f = fwdV(); sparkBurst(o[0] + f[0] * 1.2, o[1] - .3, o[2] + f[2] * 1.2, 10, [.4, 1, 1], 6);
  const e = reflectTarget(src); if (!e) return;
  const c = hitPointOn(e), dx = c[0] - P.x, dz = c[2] - P.z, l = Math.hypot(dx, dz) || 1;
  addBeam([P.x, P.y + 1.2, P.z], c, .12, [.4, 1, 1], .15);
  damageEnemy(e, Math.max(8, d * 1.5), { dir: { x: dx / l, y: .1, z: dz / l }, pt: c, knock: 3, w: 10, reflect: true });
}
function reflectProj(p) {
  reflectFx(); const e = reflectTarget(p.owner), sp = Math.max(18, Math.hypot(p.vx, p.vy, p.vz)) * 1.15;
  const d = e ? (() => { const c = hitPointOn(e); return norm3([c[0] - p.x, c[1] - p.y, c[2] - p.z]); })() : norm3([-p.vx, -p.vy, -p.vz]);
  p.vx = d[0] * sp; p.vy = d[1] * sp; p.vz = d[2] * sp; p.rf = true; p.life = 4; p.col = [.4, 1, 1]; p.dmg = Math.max(10, p.dmg * 2); p.size *= 1.15; p.home = 0; p.g = 0;
  sparkBurst(p.x, p.y, p.z, 8, [.4, 1, 1], 6);
}
function hurtPlayer(d, nx, nz, kb, src, who) {
  if (who && who.remote) { if (who.alive && d > 0 && who.inv <= 0) { who.inv = .18; Net.send('hurt', [who.id, d, nx, nz, kb === undefined ? 3 : kb], who.id); } return; }   // the owner applies damage to themselves
  if (!P.alive || d <= 0) return;
  if (src !== 'self' && shieldOn()) { reflectDamage(d, src); return; }
  if (P.dashT > 0 || P.inv > 0) return;
  P.hp -= d; P.inv = .18; P.hurtFlash = 1; P.shake = Math.max(P.shake, .3 + d * .01);
  P.vx += nx * (kb === undefined ? 3 : kb); P.vz += nz * (kb === undefined ? 3 : kb);
  S.style = Math.max(0, S.style - 70); SFX.hurt(); rumble(.9, .6, 200);
  if (P.hp <= 0) die();
}
function pickSlamTarget() {
  const o = eyePos(), f = fwdV(); let best = null, bs = -9;
  for (const e of enemies) {
    if (e.dead) continue; const c = enemyCenter(e), dx = c[0] - o[0], dy = c[1] - o[1], dz = c[2] - o[2], d = Math.hypot(dx, dy, dz);
    if (d > 34 || d < 1.2) continue; const dot = (dx * f[0] + dy * f[1] + dz * f[2]) / d; if (dot < .8) continue;
    if (!hasLOS(o[0], o[1], o[2], c[0], c[1], c[2])) continue;
    const sc = dot * 2 - d / 45; if (sc > bs) { bs = sc; best = e; }
  }
  return best;
}
const slashes = [];
function slamLand(t) {
  P.slamming = false; P.slamT = null; P.shake = .7; SFX.slam(); rumble(.8, .8, 220);
  const grounded = P.onGround, px = P.x, py = P.y + .9, pz = P.z; let total = 0;
  for (const e of enemies) {
    if (e.dead) continue; const c = enemyCenter(e), dx = c[0] - px, dy = c[1] - py, dz = c[2] - pz, d = Math.hypot(dx, dy, dz), hit = e === t;
    if (!hit && d >= 4) continue;
    const dmg = hit ? 10 : 5, l = Math.hypot(dx, dz) || 1; total += Math.min(dmg, e.hp);
    damageEnemy(e, dmg, { dir: { x: dx / l, y: .4, z: dz / l }, up: 5, knock: 4, sla: true, w: 9 });
  }
  const heal = Math.max(total / 2, (t && total > 0) ? 10 : 0);
  if (heal > 0) { P.hp = Math.min(100, P.hp + heal); feed('+' + Math.round(heal) + ' HP', '#6dff9c'); }
  if (t) {
    P.dashF = 3; P.djump = 1; feed('DASH RECHARGED · DOUBLE JUMP', '#6ec8ff');
    const c = enemyCenter(t); slashes.push({ x: c[0], y: c[1], z: c[2], phi: Math.atan2(px - c[0], pz - c[2]), L: Math.max(1.7, t.h * .75), t0: T });
    SFX.shink(); sparkBurst(c[0], c[1], c[2], 22, [.8, .4, 1], 9); sparkBurst(c[0], c[1], c[2], 10, [1, 1, 1], 11);
  }
  P.vy = 12; P.vx *= .3; P.vz *= .3; P.inv = Math.max(P.inv, .4); P.onGround = false;
}
// curse-dagger X slash drawn at each homing hit
function drawLatchFx() {
  const l = P.latch;
  if (l) pushBox(l.hp[0] + l.nx * .2, l.hp[1] + l.ny * .2, l.hp[2] + l.nz * .2, .4, .4, .4, .8, .3, 1, rotY(T * 5), false);     // small anchor marker (no tether line)
  if (shieldOn()) for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + T * 7, y = P.y + .4 + (i % 4) * .4; pushBox(P.x + Math.cos(a) * 1.5, y, P.z + Math.sin(a) * 1.5, .22, .22, .22, .4, 1, 1, rotY(a), false); }
}
function drawSlashes() {
  for (let i = slashes.length - 1; i >= 0; i--) {
    const s = slashes[i], age = T - s.t0; if (age > .45) { slashes.splice(i, 1); continue; }
    const rx = Math.cos(s.phi), rz = -Math.sin(s.phi);
    for (let k = 0; k < 2; k++) {
      const delay = k * .07, p = clamp((age - delay) / .12, 0, 1); if (age < delay) continue;
      const fade = clamp(1 - (age - delay - .12) / .3, 0, 1), sg = k ? 1 : -1, L = s.L;
      // stroke from top corner to opposite bottom corner
      const ax = s.x - rx * L * .7, ay = s.y + sg * L * .7, az = s.z - rz * L * .7, bx = s.x + rx * L * .7, by = s.y - sg * L * .7, bz = s.z + rz * L * .7;
      const hx2 = ax + (bx - ax) * p, hy2 = ay + (by - ay) * p, hz2 = az + (bz - az) * p;
      pushBeam(ax, ay, az, hx2, hy2, hz2, .34 * fade + .02, [.55, .1, .9], 0);
      pushBeam(ax, ay, az, hx2, hy2, hz2, .12 * fade + .01, [1, 1, 1], 0);
      // the dagger leading the stroke
      const dx = (bx - ax), dy = (by - ay), dz = (bz - az), dl = Math.hypot(dx, dy, dz), fx = dx / dl, fy = dy / dl, fz = dz / dl;
      if (p < 1 || fade > .4) {
        pushBeam(hx2, hy2, hz2, hx2 + fx * .9, hy2 + fy * .9, hz2 + fz * .9, .13, [.85, .8, 1], 0);
        pushBeam(hx2 - fx * .12, hy2 - fy * .12, hz2 - fz * .12, hx2 + fx * .05, hy2 + fy * .05, hz2 + fz * .05, .34, [.7, .15, 1], 0);
        pushBeam(hx2 - fx * .6, hy2 - fy * .6, hz2 - fz * .6, hx2 - fx * .2, hy2 - fy * .2, hz2 - fz * .2, .1, [.4, .1, .6], 0);
      }
    }
  }
}
function die() {
  P.alive = false; state = 'dead'; Save.stats.deaths++; saveGame();
  bloodBurst(P.x, P.y + 1, P.z, 40, null, 1.5);
  try { document.exitPointerLock(); } catch (e) { }
  el.dstats.innerHTML = 'ROOMS CLEARED <b>' + Run.rooms.filter(r => r.state === 'cleared' && r.type === 'normal').length + '</b> &nbsp;•&nbsp; KILLS <b>' + S.kills + '</b> &nbsp;•&nbsp; SCORE <b>' + S.score + '</b> &nbsp;•&nbsp; BEST STYLE <b style="color:' + RANKS[S.bestRank].c + '">' + RANKS[S.bestRank].n + '</b>';
  el.dead.classList.add('on');
}

