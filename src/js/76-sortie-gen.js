// ============================================================
//  SORTIES — level generation.
//  A sortie is a chain of SEGMENTS flown down a long corridor in 3D.  Two kinds of segment alternate:
//    ROUTE PHASE   (transit)  : the ship rides the rail through gates, spinning bars, pillars and bonus rings with only a few stray drones.
//    ACTION PHASE  (combat)   : formations of enemies fly in, hold, fire bullet patterns and leave.
//  The last segment is always a BOSS.  Everything is built from a seed with a small xorshift generator, so the same code gives the same level.
//  The output is plain data (no functions): { seed, tier, theme, name, speed, segs: [ { kind, label, len, curve, roll, ev: [ {t, k, ...} ] } ... ] }.
//  Difficulty "d" rises with the tier (each win raises it) and with the segment number.  Gates are only placed where the ship can actually reach the gap.
// ============================================================
const SRB = { BX: 7, BY: 4 };                                                    // corridor half width / half height, in ship space
const SR_MINSPD = 5.5;                                                           // the slowest a ship can ever steer (gate reachability is judged with this)
const SRT = [
  { id: 'void',  name: 'DEEP VOID',  a: [70, 225, 255],  b: [130, 100, 255], bg: ['#02030c', '#07163f'], blt: [255, 90, 200] },
  { id: 'ember', name: 'EMBER BELT', a: [255, 160, 60],  b: [255, 80, 60],   bg: ['#0c0302', '#3d1405'], blt: [110, 230, 255] },
  { id: 'grave', name: 'NEON GRAVE', a: [255, 90, 235],  b: [170, 100, 255], bg: ['#07020c', '#26093d'], blt: [255, 235, 90] },
  { id: 'toxic', name: 'TOXIC LANE', a: [140, 255, 120], b: [50, 225, 205],   bg: ['#010a06', '#06321d'], blt: [255, 110, 125] }
];
const SRE = {                                                                    // enemy kinds
  drone:   { hp: 3,  r: .75, sc: .24, score: 100, rate: 1.7, pats: ['aim', 'aim', 'fan'] },
  wasp:    { hp: 7,  r: .85, sc: .26, score: 220, rate: 2.1, pats: ['fan', 'stream', 'cone'] },
  gunship: { hp: 34, r: 1.6, sc: .34, score: 900, rate: 2.5, pats: ['ring', 'spiral', 'cross'] },
  mine:    { hp: 2,  r: .75, sc: .3,  score: 60,  rate: 0,   pats: [] }
};
const SRBOSS = [
  { id: 'dread', name: 'DREADNOUGHT', pats: [['aim', 'ring'], ['spiral', 'fan', 'lattice'], ['cross', 'stream', 'ring', 'lattice']] },
  { id: 'sting', name: 'STINGER',     pats: [['stream', 'cone'], ['spiral', 'aim', 'cross'], ['lattice', 'spiral', 'stream', 'ring']] },
  { id: 'ward',  name: 'WARDEN',      pats: [['ring', 'cone'], ['lattice', 'fan', 'ring'], ['spiral', 'cross', 'lattice', 'stream']] }
];
const SRN1 = ['IRON', 'CRIMSON', 'HOLLOW', 'VOID', 'GLASS', 'ASH', 'EMBER', 'NULL', 'GRAVE', 'STORM'], SRN2 = ['MAW', 'WARDEN', 'LEVIATHAN', 'STINGER', 'CHOIR', 'ORACLE', 'HARROW', 'TALON'];

function srRng(seed) {
  let s = (seed | 0) || 1234567;
  const r = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  for (let i = 0; i < 4; i++) r();
  return r;
}
const srPick = (r, a) => a[Math.floor(r() * a.length) % a.length];
const srR2 = n => Math.round(n * 100) / 100;

function genSortie(seed, tier) {
  tier = Math.max(0, tier | 0); const rnd = srRng(seed), theme = Math.floor(rnd() * SRT.length);
  const nSeg = 3 + Math.min(tier, 3), speed = 22 + Math.min(tier, 6) * 1.2;
  const lvl = { seed, tier, theme, name: SRT[theme].name + ' ' + (tier + 1) + '-' + (100 + Math.floor(rnd() * 900)), speed, segs: [] };
  for (let i = 0; i < nSeg; i++) {
    const transit = i % 2 === 0, d = 1 + tier * .3 + i * .12, seg = { kind: transit ? 'transit' : 'combat', len: 0, curve: transit ? 1 : .45, roll: transit ? srR2(.25 + rnd() * .35) : srR2(.06 + rnd() * .1), ev: [], d: srR2(d) };
    seg.label = transit ? 'ROUTE PHASE · TRANSIT ' + (Math.floor(i / 2) + 1) : 'ACTION PHASE · CORRIDOR COMBAT';
    if (transit) genTransit(seg, rnd, d, i === 0); else genCombat(seg, rnd, d);
    seg.ev.sort((a, b) => a.t - b.t); lvl.segs.push(seg);
  }
  const b = srPick(rnd, SRBOSS), bd = 1 + tier * .3 + nSeg * .12, nm = srPick(rnd, SRN1) + ' ' + b.name;
  lvl.segs.push({ kind: 'boss', label: 'ALERT · ' + nm, len: 0, curve: .25, roll: .08, d: srR2(bd), ev: [], boss: { arch: SRBOSS.indexOf(b), name: nm, hp: Math.round(260 * (1 + tier * .55)), phases: b.pats.map((p, k) => ({ at: [1, .62, .3][k], pats: p.map(id => srPat(id, rnd, bd + k * .25)) })) } });
  return lvl;
}
function srPat(id, rnd, d) {                                                     // one bullet pattern with numbers scaled by difficulty
  const q = Math.min(2.2, d);
  switch (id) {
    case 'aim':     return { p: id, rate: srR2(1.5 / q + .3), n: 1 + Math.floor(q * 1.4), sp: srR2(15 + q * 2) };
    case 'fan':     return { p: id, rate: srR2(1.9 / q + .5), n: 3 + 2 * Math.floor(q), sp: srR2(14 + q * 2) };
    case 'ring':    return { p: id, rate: srR2(2.4 / q + .7), n: 12 + Math.floor(q * 6), sp: srR2(11 + q * 1.5), R: srR2(6 + rnd() * 1.5) };
    case 'spiral':  return { p: id, rate: srR2(.16 - q * .02), n: 1, sp: srR2(12 + q), R: 7 };
    case 'cone':    return { p: id, rate: srR2(1.6 / q + .5), n: 5 + Math.floor(q * 3), sp: srR2(13 + q * 2) };
    case 'stream':  return { p: id, rate: srR2(2.6 / q + .6), n: 4 + Math.floor(q * 2), sp: srR2(17 + q * 2) };
    case 'cross':   return { p: id, rate: srR2(2.2 / q + .5), n: 3, sp: srR2(12 + q), R: 7 };
    default:        return { p: 'lattice', rate: srR2(3.4 / q + 1.2), n: 1, sp: srR2(9.5 + q * 1.2) };
  }
}
function genTransit(seg, rnd, d, first) {
  seg.len = Math.round(18 + rnd() * 7 + (first ? -3 : 0)); let t = first ? 3 : 2.2, last = { x: 0, y: 0 }, lastT = 0;
  const gap = () => Math.max(1.5, 3.4 - d * .35 + rnd() * .8);
  while (t < seg.len - 2.5) {
    const roll = rnd(), dt = t - lastT;
    if (roll < .45) {                                                            // a wall with a gap; the gap is always reachable from the last gap
      const gw = Math.max(2.9, 4.6 - d * .38 + rnd() * .6), gh = Math.max(2.4, 3.6 - d * .25 + rnd() * .5), reach = Math.max(2, dt * SR_MINSPD * .75);
      let gx = last.x + (rnd() * 2 - 1) * Math.min(reach, SRB.BX), gy = last.y + (rnd() * 2 - 1) * Math.min(reach * .6, SRB.BY);
      gx = Math.max(-SRB.BX + gw / 2, Math.min(SRB.BX - gw / 2, gx)); gy = Math.max(-SRB.BY + gh / 2, Math.min(SRB.BY - gh / 2, gy));
      seg.ev.push({ t: srR2(t), k: 'gate', gx: srR2(gx), gy: srR2(gy), gw: srR2(gw), gh: srR2(gh) }); last = { x: gx, y: gy }; lastT = t;
    } else if (roll < .65) {
      seg.ev.push({ t: srR2(t), k: 'bar', cx: srR2((rnd() - .5) * 4), cy: srR2((rnd() - .5) * 2), len: srR2(SRB.BX * (.9 + rnd() * .3)), om: srR2((rnd() < .5 ? -1 : 1) * (.7 + rnd() * .5 + d * .1)), a0: srR2(rnd() * 3.14) });
    } else if (roll < .8) {
      const n = 2 + Math.floor(rnd() * 2 + d * .5), list = []; for (let i = 0; i < n; i++) list.push({ x: srR2((rnd() * 2 - 1) * (SRB.BX - 1)), y: srR2((rnd() * 2 - 1) * (SRB.BY - 1)), w: srR2(1 + rnd() * .8), h: srR2(1 + rnd() * .8) });
      seg.ev.push({ t: srR2(t), k: 'pillars', list });
    } else if (roll < .92) {
      const n = 3 + Math.floor(rnd() * 3); let x = (rnd() * 2 - 1) * 4, y = (rnd() * 2 - 1) * 2;
      for (let i = 0; i < n; i++) { x = Math.max(-SRB.BX + 1.5, Math.min(SRB.BX - 1.5, x + (rnd() * 2 - 1) * 2.4)); y = Math.max(-SRB.BY + 1.2, Math.min(SRB.BY - 1.2, y + (rnd() * 2 - 1) * 1.2)); seg.ev.push({ t: srR2(t + i * .55), k: 'ring', x: srR2(x), y: srR2(y) }); }
      t += n * .35;
    } else genEnemy(seg, rnd, d, t, 'drone', 1 + (rnd() < .4 ? 1 : 0));
    t += gap();
  }
}
function genCombat(seg, rnd, d) {
  seg.len = Math.round(22 + rnd() * 8); let t = 2.5;
  while (t < seg.len - 5) {
    const roll = rnd();
    if (d > 1.25 && roll < .22) genEnemy(seg, rnd, d, t, 'gunship', 1);
    else if (roll < .42) genEnemy(seg, rnd, d, t, 'drone', 3 + Math.floor(rnd() * 3), 'line');
    else if (roll < .62) genEnemy(seg, rnd, d, t, 'wasp', 3 + Math.floor(rnd() * 2), 'vee');
    else if (roll < .78) genEnemy(seg, rnd, d, t, 'drone', 4 + Math.floor(rnd() * 3), 'snake');
    else if (roll < .9) genEnemy(seg, rnd, d, t, 'wasp', 2, 'pincer');
    else genEnemy(seg, rnd, d, t, 'mine', 4 + Math.floor(rnd() * 3), 'line');
    t += Math.max(2, 4.4 - d * .5 + rnd() * 1.2);
  }
}
function genEnemy(seg, rnd, d, t, kind, n, form) {                               // expands one formation into single "enemy" events
  const T = SRE[kind], pat = T.pats.length ? srPat(srPick(rnd, T.pats), rnd, d) : null, hz = -(30 + rnd() * 14), hold = srR2(3.5 + rnd() * 2.5), amp = srR2(1.5 + rnd() * 2.5);
  const BX = SRB.BX - 1.2, BY = SRB.BY - 1;
  const add = (dt, x, y, extra) => seg.ev.push(Object.assign({ t: srR2(t + dt), k: 'enemy', kind, x: srR2(Math.max(-BX, Math.min(BX, x))), y: srR2(Math.max(-BY, Math.min(BY, y))), hz: srR2(hz), hold, amp, ph: srR2(rnd() * 6), pat }, extra || {}));
  form = form || 'single'; const cy = (rnd() * 2 - 1) * 1.5;
  if (form === 'line') for (let i = 0; i < n; i++) add(0, (i - (n - 1) / 2) * (kind === 'mine' ? 2.6 : 2.4), cy + (kind === 'mine' ? (rnd() - .5) * 3 : 0));
  else if (form === 'vee') for (let i = 0; i < n; i++) { const o = i - (n - 1) / 2; add(Math.abs(o) * .15, o * 2.2, cy + Math.abs(o) * .8); }
  else if (form === 'snake') { const x0 = (rnd() * 2 - 1) * 4; for (let i = 0; i < n; i++) add(i * .45, x0 + Math.sin(i * .9) * 2.2, cy + Math.cos(i * .9) * 1.2, { mv: 'snake' }); }
  else if (form === 'pincer') for (let i = 0; i < n; i++) { const s = i % 2 ? 1 : -1; add(Math.floor(i / 2) * .5, s * BX, cy, { mv: 'sweep', dir: -s }); }
  else for (let i = 0; i < n; i++) add(i * .5, (rnd() * 2 - 1) * 4, (rnd() * 2 - 1) * 2);
}
