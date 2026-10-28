// ---------------- attack helpers ----------------
const pick5 = a => a[(Math.random() * a.length) | 0];
const rotYaw = (d, a) => { const c = Math.cos(a), s = Math.sin(a); return [d[0] * c - d[2] * s, d[1], d[0] * s + d[2] * c]; };
const norm3 = d => { const l = Math.hypot(d[0], d[1], d[2]) || 1; return [d[0] / l, d[1] / l, d[2] / l]; };
function pieceSrc(e, i) { return [e.x + Math.sin(e.yaw) * e.hw * .8, e.y + e.h * PSRC[i], e.z + Math.cos(e.yaw) * e.hw * .8]; }
const blindErr = e => e.pieces[2].broken ? .09 : 0;
function aimFrom(s, lead, err) {
  let d = norm3([P.x + P.vx * lead - s[0], P.y + P.eye * .7 - s[1], P.z + P.vz * lead - s[2]]);
  if (err) d = norm3([d[0] + rnd(-err, err), d[1] + rnd(-err, err), d[2] + rnd(-err, err)]);
  return d;
}
let curBossE = null;
function bShot(s, d, speed, dmg, size, o) {
  o = o || {}; eprojs.push({ x: s[0] + d[0] * .6, y: s[1] + d[1] * .6, z: s[2] + d[2] * .6, vx: d[0] * speed, vy: d[1] * speed, vz: d[2] * speed, dmg, size, life: o.life || 7, g: o.g || 0, home: o.home || 0, exp: o.exp || null, col: o.col || null, owner: curBossE });
}
function arena() { const r = bossRoom(); return r || { ox: 0, oz: 0, sz: 64 }; }
function arenaClamp(x, z) { const r = arena(); return [clamp(x, r.ox + 4, r.ox + r.sz - 4), clamp(z, r.oz + 4, r.oz + r.sz - 4)]; }
const floorSurf = (x, z) => topY(Math.floor(x), Math.floor(z), 27) + 1;
function bossBlast(x, y, z, r, dmg) {
  for (let i = 0; i < 28; i++) { const a = rnd(TAU), b = rnd(-1, 1), s = rnd(3, 11), k = Math.sqrt(1 - b * b); emit(x, y, z, Math.cos(a) * k * s, b * s + 2, Math.sin(a) * k * s, rnd(.12, .32), Math.random() < .5 ? [1, .5, .1] : [1, .9, .4], rnd(.3, .7), 2); }
  for (let i = 0; i < 8; i++) emit(x, y, z, rnd(-4, 4), rnd(0, 6), rnd(-4, 4), rnd(.2, .4), [.2, .15, .15], rnd(1, 2), 0);
  SFX.boom();
  const dx = P.x - x, dy = P.y + .9 - y, dz = P.z - z, d = Math.hypot(dx, dy, dz);
  if (d < r) { const l = Math.hypot(dx, dz) || 1; hurtPlayer(dmg, dx / l, dz / l, 8); if (P.inv > .1) P.vy = Math.max(P.vy, 7); }
  P.shake = Math.max(P.shake, clamp(1 - d / 28, 0, .8));
}

