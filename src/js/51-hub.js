// ---------------- HUB ----------------
function house(x0, z0, w, d, hgt, door) {
  fillBox(x0, 9, z0, x0 + w - 1, 8 + hgt, z0 + d - 1, 1);
  fillBox(x0 + 1, 9, z0 + 1, x0 + w - 2, 8 + hgt, z0 + d - 2, 0);
  fillBox(x0 + 1, 8, z0 + 1, x0 + w - 2, 8, z0 + d - 2, 2);
  const cx = x0 + (w >> 1), cz = z0 + (d >> 1);
  if (door === 'W') fillBox(x0, 9, cz - 1, x0, 11, cz, 0);
  if (door === 'E') fillBox(x0 + w - 1, 9, cz - 1, x0 + w - 1, 11, cz, 0);
  if (door === 'N') fillBox(cx - 1, 9, z0, cx, 11, z0, 0);
  if (door === 'S') fillBox(cx - 1, 9, z0 + d - 1, cx, 11, z0 + d - 1, 0);
  for (let k = 0; k < 4; k++) fillBox(x0 - 1 + k, 9 + hgt + k, z0 - 1 + k, x0 + w - k, 9 + hgt + k, z0 + d - k, (k & 1) ? 5 : 7);
  // windows + corner hellstone
  setRaw(cx, 10 + (hgt > 4 ? 1 : 0), z0 + (door === 'N' ? d - 1 : 0), 0); setRaw(cx, 10, z0 + (door === 'S' ? 0 : d - 1), 0);
  for (const [px, pz] of [[x0, z0], [x0 + w - 1, z0], [x0, z0 + d - 1], [x0 + w - 1, z0 + d - 1]]) fillBox(px, 9, pz, px, 8 + hgt, pz, 3);
  if (door === 'W') setRaw(x0 - 1, 11, cz, 6); if (door === 'E') setRaw(x0 + w, 11, cz, 6);
}
function genVillage(hubSeed) {                   // Ember Village, built into the fixed array, then stamped into the open world (see OW.ensureStamp)
  hubSeed = hubSeed >>> 0;
  resetFixed(64); seed = hubSeed | 0; setWorldSeed(hubSeed ^ 0x9E3779B9);
  const HB = 8;
  for (let z = 0; z < 64; z++) for (let x = 0; x < 64; x++) {
    const dx = x - 32, dz = z - 32, d = Math.max(Math.abs(dx), Math.abs(dz)), r = hyp(dx, dz);
    let h = HB, lava = false;
    if (d > 24) { h = HB + Math.floor((d - 24) * .7 + fbm(x, z) * 7); if (d > 29) h += Math.floor((d - 29) * 2.4); if (d <= 28 && fbm(x + 100, z + 50) > .55) { h = 4; lava = true; } }
    h = clamp(h, 2, H - 3);
    for (let y = 0; y <= h; y++) {
      let id = y === 0 ? 3 : (y === h ? 2 : 1);
      if (y === h && !lava) {
        if (r < 9 || (Math.abs(dx) <= 1 && z < 32 && z >= 12)) id = 1;
        else if (hash(x * 3, z * 7) < .05) id = 5;
      } else if (y > 0 && y < h - 1 && hash(x * 5 + y, z * 9) < .03) id = 6;
      world[idx(x, y, z)] = id;
    }
    if (lava) for (let y = h + 1; y <= 6; y++) world[idx(x, y, z)] = 4;
    const exitGap = (z > 32 && Math.abs(dx) <= 2) || (Math.abs(dz) <= 2 && z >= 32 - 2);          // south, east and west gates in the village wall
    if (d === 24 && !exitGap) { world[idx(x, 9, z)] = 3; world[idx(x, 10, z)] = (x + z) % 4 === 0 ? 6 : 3; }
    // build-plot outline
    if (x >= 24 && x <= 40 && z >= 46 && z <= 56 && (x === 24 || x === 40 || z === 46 || z === 56)) world[idx(x, HB, z)] = 5;
  }
  // fountain
  fillBox(30, 9, 30, 34, 10, 34, 3); fillBox(31, 10, 31, 33, 10, 33, 4); fillBox(32, 10, 32, 32, 14, 32, 6);
  // houses
  house(42, 20, 7, 7, 4, 'W'); house(42, 35, 7, 7, 4, 'W'); house(12, 20, 7, 7, 4, 'E'); house(12, 8 + 26, 5, 5, 3, 'E');
  // smith stall
  fillBox(17, 9, 38, 26, 9, 38, 8); fillBox(17, 9, 38, 17, 13, 38, 3); fillBox(26, 9, 38, 26, 13, 38, 3);
  fillBox(17, 9, 43, 17, 13, 43, 3); fillBox(26, 9, 43, 26, 13, 43, 3);
  for (let x = 16; x <= 27; x++) for (let z = 37; z <= 44; z++) setRaw(x, 14, z, ((x + z) & 1) ? 7 : 5);
  fillBox(18, 9, 43, 25, 11, 43, 1); fillBox(18, 8, 39, 25, 8, 42, 1); setRaw(19, 9, 41, 8); setRaw(19, 10, 41, 8); setRaw(24, 9, 41, 6);
  // Hellgate
  fillBox(24, 8, 6, 40, 8, 14, 3);
  fillBox(26, 9, 8, 28, 22, 12, 3); fillBox(36, 9, 8, 38, 22, 12, 3); fillBox(26, 19, 8, 38, 22, 12, 3);
  fillBox(29, 9, 8, 35, 18, 12, 0);
  for (let y = 10; y <= 18; y += 3) { setRaw(28, y, 10, 6); setRaw(36, y, 10, 6); setRaw(28, y, 9, 6); setRaw(36, y, 9, 6); }
  for (let x = 27; x <= 37; x += 2) { setRaw(x, 23, 10, 5); setRaw(x, 24, 10, (x === 32) ? 5 : 0); }
  fillBox(26, 23, 8, 26, 26, 8, 3); fillBox(38, 23, 8, 38, 26, 8, 3); setRaw(32, 25, 10, 5); setRaw(32, 26, 10, 6);
  for (let x = 29; x <= 35; x++) { setRaw(x, 8, 10, 6); setRaw(x, 8, 11, 6); }
  // lamp posts along the path
  for (const z of [16, 22, 28]) for (const x of [29, 35]) { fillBox(x, 9, z, x, 11, z, 3); setRaw(x, 12, z, 6); }
  // bone spires
  for (let i = 0; i < 14; i++) {
    const a = rw(TAU), r = rw(16, 22), x = Math.floor(32 + Math.cos(a) * r), z = Math.floor(32 + Math.sin(a) * r);
    if (world[idx(x, 9, z)] || world[idx(x, 8, z)] !== 2 || z < 16 || (x > 14 && x < 28 && z > 35 && z < 46)) continue;
    fillBox(x, 9, z, x, 8 + 2 + (i % 4), z, 5);
  }
}
// Build (or rebuild) the open world around a spawn point. Seeds come from the player's save, or from the host when joining co-op.
function genHub(hubSeed, sx, sz) {
  const o = Net.hubOverride, c = WorldStore.cur;
  const wseed = hubSeed !== undefined ? hubSeed : o ? o.seed : c.meta.seed, vseed = o ? o.villageSeed : c.meta.villageSeed;
  OW.begin(sx === undefined ? 32.5 : sx, sz === undefined ? 44.5 : sz, wseed, vseed, o ? o.edits : c.data.edits);
}
function nearNPC() { return mode === 'hub' && Math.hypot(P.x - NPC.x, P.z - NPC.z) < 4.6 && Math.abs(P.y - NPC.y) < 3; }
function enterHub(first, fromRun) {
  mode = 'hub';
  const rt = fromRun && OW.returnTo, sx = rt ? rt.x : 32.5, sz = rt ? rt.z : (fromRun ? 15.5 : 44.5);
  genHub(undefined, sx, sz); flushSave();
  enemies.length = 0; eprojs.length = 0; bombs.length = 0; beams.length = 0; drops.length = 0; PL.fill(0);
  Run.chests = []; Run.turrets = []; Run.smoke = []; Run.hasKey = false; Run.glyph = null; Run.cur = null; resetBossSystems(); sky = null;
  Object.assign(P, { x: sx, y: topY(Math.floor(sx), Math.floor(sz)) + 1.01, z: sz, vx: 0, vy: 0, vz: 0, yaw: rt ? 0 : fromRun ? Math.PI : 0, pitch: 0, hp: 100, alive: true, sliding: false, slamming: false, slamT: null, lock: null, dashT: 0, dashF: 3, inv: 0, shake: 0, hurtFlash: 0, charge: 0, h: 1.75, eye: 1.6, airT: 0 });
  Object.assign(S, { style: 0, rank: 0, combo: 0, lastKill: -99, wHist: {}, time: 0 });
  P.weapon = -1; switchWeapon(0); refreshHotbar();
  el.dead.classList.remove('on'); el.feed.innerHTML = '';
  Net.announceWorld();
  banner(rt ? 'BACK IN THE OPEN' : fromRun ? 'BACK IN THE VILLAGE' : 'EMBER VILLAGE', fromRun ? 'SPEND YOUR GEMS AT THE SMITH' : 'THE HELLGATE IS NORTH · THE WORLD IS OPEN');
}
function updateHub(dt) {
  NPC.t += dt;
  const d = Math.hypot(P.x - NPC.x, P.z - NPC.z); NPC.yaw = d < 14 ? Math.atan2(P.x - NPC.x, P.z - NPC.z) : Math.PI;
  if (villageD(P.x, P.z) < 34) P.hp = Math.min(100, P.hp + 12 * dt);                     // the village heals you; the wilderness doesn't
  if (Net.role !== 'client') {
    if (P.x > GATE.x0 && P.x < GATE.x1 && P.z > GATE.z0 && P.z < GATE.z1 && P.y > GATE.y0 - 1 && P.y < GATE.y1) { OW.returnTo = null; enterDungeon(); }
    else { const g = gateAtPlayer(P.x, P.y, P.z); if (g) { OW.returnTo = { x: g.x + .5, z: g.z + 7.5 }; enterDungeon(g.seed); } }
  }
  if (Math.random() < dt * 40) { const x = rnd(29.3, 35.7); emit(x, rnd(9, 13), 10.5 + rnd(-.3, .3), rnd(-.3, .3), rnd(1, 4), rnd(-.3, .3), rnd(.08, .16), Math.random() < .5 ? [.7, .2, 1] : [1, .2, .3], rnd(.5, 1.2), 2); }
}

