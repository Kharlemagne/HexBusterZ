// ---------------- DUNGEON: layout ----------------
function doorBox(r, k) {
  const cx0 = r.gx * CELL, cz0 = r.gz * CELL;
  if (k === 'E') return [cx0 + 30, 5, cz0 + 13, cx0 + 31, 10, cz0 + 18];
  if (k === 'W') return [cx0, 5, cz0 + 13, cx0 + 1, 10, cz0 + 18];
  if (k === 'S') return [cx0 + 13, 5, cz0 + 30, cx0 + 18, 10, cz0 + 31];
  return [cx0 + 13, 5, cz0, cx0 + 18, 10, cz0 + 1];
}
function doorCenter(r, k) {
  const b = doorBox(r, k); return [(b[0] + b[3] + 1) / 2, (b[2] + b[5] + 1) / 2];
}
function layoutDungeon() {
  for (let attempt = 0; attempt < 400; attempt++) {
    const map = new Map(), list = [], key = (x, z) => x + ',' + z, cx = (GN - 1) / 2, inb = (x, z) => x >= 0 && z >= 0 && x < GN && z < GN;
    const start = { gx: cx, gz: cx, ox: cx * CELL, oz: cx * CELL, sz: CELL, doors: {}, depth: 0, type: 'start', state: 'cleared', visited: false };
    map.set(key(cx, cx), start); list.push(start);
    let tries = 0;
    while (list.length < 10 && tries++ < 800) {
      const r = list[(R() * list.length) | 0], d = DIRS[(R() * 4) | 0];
      const nx = r.gx + d.dx, nz = r.gz + d.dz;
      if (!inb(nx, nz) || map.has(key(nx, nz))) continue;
      let nb = 0; for (const e of DIRS) if (map.has(key(nx + e.dx, nz + e.dz))) nb++;
      if (nb > 1) continue;
      const nr = { gx: nx, gz: nz, ox: nx * CELL, oz: nz * CELL, sz: CELL, doors: {}, depth: r.depth + 1, type: 'normal', state: 'fresh', visited: false };
      r.doors[d.k] = true; nr.doors[d.o] = true; map.set(key(nx, nz), nr); list.push(nr);
    }
    if (list.length < 10) continue;
    const leaves = list.filter(r => r !== start && Object.keys(r.doors).length === 1);
    if (leaves.length < 2) continue;
    leaves.sort((a, b) => b.depth - a.depth);
    // boss room needs a free 2x2 block (64x64 arena) at the end of a dead end
    let boss = null, cells = null;
    for (const L of leaves) {
      const lk = Object.keys(L.doors)[0], d = DIRS.find(x => x.o === lk);
      const sides = DIRS.filter(s => s.dx * d.dx + s.dz * d.dz === 0);
      if (R() < .5) sides.reverse();
      for (const s of sides) {
        const cs = [[L.gx + d.dx, L.gz + d.dz], [L.gx + s.dx, L.gz + s.dz], [L.gx + d.dx + s.dx, L.gz + d.dz + s.dz]];
        if (cs.every(c => inb(c[0], c[1]) && !map.has(key(c[0], c[1])))) { boss = L; cells = cs; break; }
      }
      if (boss) break;
    }
    if (!boss) continue;
    const rest = leaves.filter(x => x !== boss); if (!rest.length) continue;
    boss.type = 'boss'; boss.locked = true;
    const xs = [boss.gx, ...cells.map(c => c[0])], zs = [boss.gz, ...cells.map(c => c[1])];
    boss.ox = Math.min(...xs) * CELL; boss.oz = Math.min(...zs) * CELL; boss.sz = CELL * 2;
    for (const c of cells) map.set(key(c[0], c[1]), boss);
    const tr = rest[(R() * rest.length) | 0]; tr.type = 'treasure'; tr.state = 'cleared';
    return { list, map };
  }
  return null;
}
function buildRoom(r) {
  const sz = r.sz, big = sz > CELL, ox = r.ox, oz = r.oz, ceil = big ? 22 : 17;
  for (let z = 0; z < sz; z++) for (let x = 0; x < sz; x++) {
    const X = ox + x, Z = oz + z, edge = x < 2 || x >= sz - 2 || z < 2 || z >= sz - 2;
    world[idx(X, 0, Z)] = 10; for (let y = 1; y <= 3; y++) world[idx(X, y, Z)] = 1;
    world[idx(X, 4, Z)] = hash(X * 3, Z * 7) < .05 ? 5 : 2;
    if (edge) for (let y = 5; y < (big ? 28 : ceil); y++) world[idx(X, y, Z)] = hash(X * 5 + y, Z * 9) < .03 ? 6 : 10;
    if (!big) { world[idx(X, ceil, Z)] = hash(X * 11, Z * 13) < .035 ? 6 : 10; world[idx(X, ceil + 1, Z)] = 10; }   // boss arena has an open sky
  }
  for (const k in r.doors) { const b = doorBox(r, k); fillBox(b[0], b[1], b[2], b[3], b[4], b[5], 0); }
  if (big) { buildBossFeatures(r); return; }
  const quads = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  const chestQ = (r.type === 'treasure' || r.chest) ? (R() * 4) | 0 : -1;
  quads.forEach((q, qi) => {
    const X = ox + 16 + q[0] * 8, Z = oz + 16 + q[1] * 8;
    if (qi === chestQ) { r.chestPos = [X + .5, 5, Z + .5]; return; }
    const roll = R();
    if (r.type === 'start') { if (roll < .5) fillBox(X - 1, 5, Z - 1, X, 9 + ((R() * 3) | 0), Z, 3); return; }
    if (roll < .28) { const h = 5 + ((R() * 6) | 0); fillBox(X - 1, 5, Z - 1, X, h + 4, Z, 3); setRaw(X - 1, h + 4, Z - 1, 6); setRaw(X, h + 4, Z, 6); }
    else if (roll < .5) { fillBox(X - 2, 5, Z - 2, X + 2, 5, Z + 2, 1); fillBox(X - 1, 6, Z - 1, X + 1, 6, Z + 1, 2); }
    else if (roll < .65) { fillBox(X - 2, 4, Z - 2, X + 2, 4, Z + 2, 4); }
    else if (roll < .85) { if (R() < .5) fillBox(X - 3, 5, Z, X + 3, 6, Z, 1); else fillBox(X, 5, Z - 3, X, 6, Z + 3, 1); }
  });
}
function buildBossFeatures(r) {
  const ox = r.ox, oz = r.oz, C = r.sz / 2, dk = Object.keys(r.doors)[0], dc = doorCenter(r, dk);
  r.turrets = []; const spots = [], n = 2 + ((R() < .5) ? 1 : 0); let a0 = rw(TAU);
  for (let i = 0, guard = 0; i < n && guard < 80; guard++) {
    const a = a0 + i * TAU / n; const tx = Math.floor(clamp(ox + C + Math.cos(a) * 21, ox + 6, ox + r.sz - 7)), tz = Math.floor(clamp(oz + C + Math.sin(a) * 21, oz + 6, oz + r.sz - 7));
    if (hyp(tx - dc[0], tz - dc[1]) < 10) { a0 += .5; continue; }
    fillBox(tx - 1, 5, tz - 1, tx + 1, 5, tz + 1, 1); setRaw(tx, 5, tz, 6);
    r.turrets.push({ x: tx + .5, y: 6, z: tz + .5 }); spots.push([tx, tz]); i++;
  }
  const free = (x, z, m) => hyp(x - (ox + C), z - (oz + C)) > 10 && hyp(x - dc[0], z - dc[1]) > 10 && spots.every(s => hyp(x - s[0], z - s[1]) > m);
  let pil = 0, pools = 0, plat = 0;
  for (let t = 0; t < 300 && (pil < 9 || pools < 3 || plat < 3); t++) {
    const x = Math.floor(ox + rw(6, r.sz - 7)), z = Math.floor(oz + rw(6, r.sz - 7));
    if (!free(x, z, 7)) continue;
    const roll = R();
    if (roll < .5 && pil < 9) { const h = 5 + ((R() * 6) | 0); fillBox(x, 5, z, x + 1, h + 4, z + 1, 3); setRaw(x, h + 4, z, 6); setRaw(x + 1, h + 4, z + 1, 6); pil++; }
    else if (roll < .75 && pools < 3) { fillBox(x - 2, 4, z - 2, x + 2, 4, z + 2, 4); pools++; }
    else if (plat < 3) { fillBox(x - 2, 5, z - 2, x + 2, 5, z + 2, 1); fillBox(x - 1, 6, z - 1, x + 1, 6, z + 1, 2); plat++; }
  }
}
function genDungeon(L) {
  clearWorld(GN * CELL); seed = Run.seed | 0;
  for (const r of L.list) r.chest = r.type === 'treasure' || (r.type === 'normal' && R() < .4);
  for (const r of L.list) buildRoom(r);
  for (const r of L.list) if (r.type === 'boss') { const b = doorBox(r, Object.keys(r.doors)[0]); fillBox(b[0], b[1], b[2], b[3], b[4], b[5], 11); }
}
function roomAt(x, z) { return Run.map.get(Math.floor(x / CELL) + ',' + Math.floor(z / CELL)); }
function enterDungeon(forceSeed) {
  // One number describes the whole run: layout, room features, chests and the boss. Multiplayer peers share it.
  Run.seed = (forceSeed === undefined ? newSeed() : forceSeed) >>> 0; setWorldSeed(Run.seed);
  let L = layoutDungeon(); if (!L) return;
  Save.runs++; saveGame();
  genDungeon(L); buildAll(); mode = 'dungeon';
  Run.rooms = L.list; Run.map = L.map; Run.cur = null; Run.glyph = null; Run.gems = 0; Run.queue = []; Run.boss = null; Run.hasKey = false;
  Run.chests = []; Run.turrets = []; Run.smoke = []; resetBossSystems();
  { const br = L.list.find(r => r.type === 'boss'); Run.cx = br.ox + br.sz / 2; Run.cz = br.oz + br.sz / 2; sky = genSky(Run.cx, Run.cz); }
  for (const r of L.list) {
    if (r.chestPos) Run.chests.push({ id: nextId(), x: r.chestPos[0], y: r.chestPos[1], z: r.chestPos[2], open: false, depth: r.depth, treasure: r.type === 'treasure', t: rnd(10) });
    if (r.turrets) for (const t of r.turrets) Run.turrets.push({ x: t.x, y: t.y, z: t.z, on: false, cd: 0, yaw: rnd(TAU), pitch: 0, t: rnd(10), price: 30 });
  }
  const seen = new Set();
  for (const r of L.list) for (const k in r.doors) {
    const d = DIRS.find(x => x.k === k), n = L.map.get((r.gx + d.dx) + ',' + (r.gz + d.dz)); if (!n) continue;
    const id = L.list.indexOf(r) < L.list.indexOf(n) ? L.list.indexOf(r) + '-' + L.list.indexOf(n) : L.list.indexOf(n) + '-' + L.list.indexOf(r); if (seen.has(id)) continue; seen.add(id);
    const cx0 = r.gx * CELL, cz0 = r.gz * CELL, xAxis = (k === 'E' || k === 'W');
    Run.smoke.push({ xAxis, c: k === 'E' ? cx0 + 32 : k === 'W' ? cx0 : k === 'S' ? cz0 + 32 : cz0, u: xAxis ? cz0 + 13 : cx0 + 13, ra: r, rb: n });
  }
  const s = L.list[0], sx = s.ox + 16.5, sz = s.oz + 16.5;
  enemies.length = 0; eprojs.length = 0; bombs.length = 0; beams.length = 0; PL.fill(0);
  Object.assign(P, { x: sx, y: 5.01, z: sz, vx: 0, vy: 0, vz: 0, yaw: Math.random() * TAU, pitch: 0, hp: Math.max(P.hp, 100), alive: true, sliding: false, slamming: false, slamT: null, lock: null, dashT: 0, dashF: 3, inv: .5, h: 1.75, eye: 1.6 });
  Object.assign(S, { style: 0, rank: 0, combo: 0, lastKill: -99, wHist: {}, kills: 0, score: 0 });
  if (P.weapon === 4) { P.weapon = -1; switchWeapon(0); }
  refreshHotbar(); markKnown(s);
  Net.announceWorld();
  banner('THE DEPTHS', 'FIND THE KEY IN THE TREASURE ROOM · SLAY THE BOSS'); SFX.wave();
}
function markKnown(r) { r.visited = true; r.known = true; for (const d of DIRS) { if (r.doors[d.k]) { const n = Run.map.get((r.gx + d.dx) + ',' + (r.gz + d.dz)); if (n) n.known = true; } } }
function setSeal(r, on) {
  const id = on ? 9 : 0;
  for (const k in r.doors) { const b = doorBox(r, k); fillSeal(b[0], b[1], b[2], b[3], b[4], b[5], id); }
}
function fillSeal(x0, y0, z0, x1, y1, z1, id) {
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) { world[idx(x, y, z)] = id; markDirty(x, z); }
}
function roomSpawn(r, fly) {
  const m = r.sz - 4, lim = r.sz > CELL ? 15 : 12;
  for (let i = 0; i < 40; i++) {
    const x = r.ox + rnd(4, m), z = r.oz + rnd(4, m), fx = Math.floor(x), fz = Math.floor(z), ty = topY(fx, fz, r.sz > CELL ? 21 : 16);
    if (get(fx, ty, fz) === 4 || ty > lim) continue;
    if (Math.hypot(x - P.x, z - P.z) < (i < 30 ? 9 : 4)) continue;
    return [x, ty + 1.05 + (fly ? 3 : 0), z];
  }
  return [r.ox + r.sz / 2 + .5, 5.1, r.oz + r.sz / 2 + .5];
}
function activateRoom(r) {
  r.state = 'active'; setSeal(r, true); Wv.n = r.depth + 1;
  const q = [];
  if (r.type === 'boss') {
    q.push('boss'); const m = 4 + Math.min(4, r.depth >> 1);
    for (let i = 0; i < m; i++) q.push(i % 3 === 2 && r.depth >= 3 ? 'wraith' : (i % 2 ? 'gnasher' : 'husk'));
  } else {
    const n = Math.min(8, 3 + Math.ceil(r.depth * .8) + ((Math.random() * 2) | 0));
    for (let i = 0; i < n; i++) { const t = Math.random(); q.push(r.depth >= 3 && t < .22 ? 'wraith' : r.depth >= 2 && t < .5 ? 'gnasher' : 'husk'); }
  }
  Run.queue = q; Run.spawnT = .6; Run.boss = r.type === 'boss' ? r : null;
  banner(r.type === 'boss' ? 'BOSS' : 'SEALED', r.type === 'boss' ? 'BREAK HIS HEAD, TORSO AND LEGS · POWER UP THE TURRETS' : 'KILL EVERYTHING'); SFX.wave();
}
function clearRoom(r) {
  r.state = 'cleared'; setSeal(r, false); P.hp = Math.min(100, P.hp + 5);
  if (r.type === 'boss') {
    Run.glyph = { x: r.ox + r.sz / 2 + .5, y: 5, z: r.oz + r.sz / 2 + .5, t: 0 };
    const g = 40 + r.depth * 4; Save.gems += g; Run.gems += g; Save.wins++; Save.stats.bosses++; saveGame();
    banner('BOSS SLAIN', '+' + g + ' DEMON GEMS · STEP INTO THE GLYPH'); feed('+' + g + ' DEMON GEMS', '#ff2bd6'); SFX.rank();
    gemBurst(Run.glyph.x, 6, Run.glyph.z, 50);
  } else { banner('ROOM CLEARED', '+5 HP'); }
}
function gemBurst(x, y, z, n) {
  for (let i = 0; i < n; i++) { const a = rnd(TAU), s = rnd(2, 8); emit(x, y, z, Math.cos(a) * s, rnd(4, 12), Math.sin(a) * s, rnd(.1, .2), Math.random() < .5 ? [1, .2, .85] : [.7, .3, 1], rnd(4, 8), 0); }
}
function openChest(c) {
  c.open = true; const g = Math.round((8 + c.depth * 2 + rnd(0, 6)) * (c.treasure ? 2 : 1));
  Save.gems += g; Run.gems += g; saveGame(); gemBurst(c.x, c.y + 1, c.z, 18 + g); feed('+' + g + ' DEMON GEMS', '#ff2bd6'); SFX.rank(); SFX.dig();
  if (c.treasure) { Run.hasKey = true; feed('BOSS KEY ACQUIRED', '#ffd23a'); banner('BOSS KEY', 'THE BOSS DOOR IS NOW OPEN TO YOU'); }
}
function returnToHub() {
  banner('', ''); enterHub(false, true); state = 'play';
}
