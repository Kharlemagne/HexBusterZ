// ---------------- main loop ----------------
let worldDt = 1 / 60;
function update(dt) {
  S.time += dt; P.btCd = Math.max(0, P.btCd - dt);
  const was = P.bt > 0; P.bt = Math.max(0, P.bt - dt); if (was && P.bt <= 0) { SFX.btEnd(); feed('BULLET TIME OVER', '#6ec8ff'); }
  const bt = P.bt > 0, wdt = bt ? dt * .1 : dt, pdt = bt ? dt * .5 : dt;      // bullet time: world at 10%, you at 50%
  worldDt = wdt; musicSlow = bt ? .4 : 1; musicMode = mode === 'hub' ? 0 : (Run.cur && Run.cur.type === 'boss' && Run.cur.state === 'active') ? 2 : 1;
  updatePlayer(pdt); updateWeapons(dt);
  if (Net.role !== 'client') {                       // a guest only renders what the host tells it
    for (const e of enemies) if (!e.dead) { if (e.type === 'boss') updateBoss(e, wdt); else updateEnemy(e, wdt); }
    for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].dead) enemies.splice(i, 1);
    updateEProjs(wdt); updateBombs(wdt); updateBossSystems(wdt); updateWorld(wdt);
  } else { for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].dead) enemies.splice(i, 1); if (mode === 'dungeon') updateDungeonClient(wdt); else updateHub(wdt); }
  S.style = Math.max(0, S.style - (10 + S.rank * 14) * dt);
  const nr = clamp(Math.floor(S.style / 120), 0, 8);
  if (nr > S.rank) SFX.rank(); S.rank = nr; S.bestRank = Math.max(S.bestRank, nr); if (nr > Save.stats.bestRank) { Save.stats.bestRank = nr; saveSoon(); } musicIntensity = nr;
}
// Fixed-step simulation (120 Hz): the game logic no longer depends on how fast the screen refreshes,
// which is what keeps a host and its clients in step once multiplayer is on.
const SIM_DT = 1 / 120; let simAcc = 0;
let last = performance.now(), hudT = 0, lastTitle = 0, lastSaveStat = 0;
function frame(now) { requestAnimationFrame(frame); try { frameInner(now); } catch (e) { reportErr(e && e.message || 'frame error'); } }
const streamCenters = () => (Net.role === 'host' ? players.filter(q => q === P || q.alive) : [P]).map(q => ({ x: q.x, z: q.z }));
function frameInner(now) {
  const rdt = Math.min(.1, (now - last) / 1000); last = now; T += (state === "paused" && window.__freezeT) ? 0 : rdt;
  pollGamepad();
  if (state === 'play') {
    simAcc += rdt; let steps = 0;
    while (simAcc >= SIM_DT && steps < 12) {
      let dt = SIM_DT; if (hitstop > 0) { hitstop -= SIM_DT; dt = SIM_DT * .1; }
      update(dt); updateParticles(worldDt); Net.tick(SIM_DT); simAcc -= SIM_DT; steps++;
    }
    if (steps >= 12) simAcc = 0;                       // far behind (tab was hidden): drop the backlog instead of spiralling
  } else { simAcc = 0; updateParticles(rdt); if (state === 'dead') { for (const e of enemies) e.t += rdt; } }
  if (useChunks) { OW.update(streamCenters(), state === 'play' ? 5 : 12); OW.pump(state === 'play' ? 5 : 12); }
  else for (let n = 0; n < 2 && dirty.size; n++) { const k = dirty.values().next().value; dirty.delete(k); buildChunk(ckx(k), ckz(k)); }
  renderFrame(rdt);
  if (titleCv && !el.menu.classList.contains('hide') && now - lastTitle > 42) { lastTitle = now; drawTitle(now / 1000); }
  if (!el.menu.classList.contains('hide') && now - lastSaveStat > 500) { lastSaveStat = now; updateSaveStatus(); }
  hudT -= rdt; if (hudT <= 0) { hudT = 1 / 30; updateHUD(); }
}
