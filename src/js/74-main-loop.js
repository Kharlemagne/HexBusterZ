// ---------------- main loop ----------------
let worldDt = 1 / 60;
function update(dt) {
  S.time += dt; P.btCd = Math.max(0, P.btCd - dt);
  const was = P.bt > 0; P.bt = Math.max(0, P.bt - dt); if (was && P.bt <= 0) { SFX.btEnd(); feed('BULLET TIME OVER', '#6ec8ff'); }
  const bt = P.bt > 0, wdt = bt ? dt * .1 : dt, pdt = bt ? dt * .5 : dt;      // bullet time: world at 10%, you at 50%
  worldDt = wdt; musicSlow = bt ? .4 : 1; musicMode = mode === 'hub' ? 0 : (Run.cur && Run.cur.type === 'boss' && Run.cur.state === 'active') ? 2 : 1;
  updatePlayer(pdt); updateWeapons(dt);
  for (const e of enemies) if (!e.dead) { if (e.type === 'boss') updateBoss(e, wdt); else updateEnemy(e, wdt); }
  for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].dead) enemies.splice(i, 1);
  updateEProjs(wdt); updateBombs(wdt); updateBossSystems(wdt); updateWorld(wdt);
  S.style = Math.max(0, S.style - (10 + S.rank * 14) * dt);
  const nr = clamp(Math.floor(S.style / 120), 0, 8);
  if (nr > S.rank) SFX.rank(); S.rank = nr; S.bestRank = Math.max(S.bestRank, nr); musicIntensity = nr;
}
let last = performance.now(), hudT = 0, lastTitle = 0;
function frame(now) { requestAnimationFrame(frame); try { frameInner(now); } catch (e) { reportErr(e && e.message || 'frame error'); } }
function frameInner(now) {
  const rdt = Math.min(.05, (now - last) / 1000); last = now; T += (state === "paused" && window.__freezeT) ? 0 : rdt;
  pollGamepad();
  let dt = rdt;
  if (state === 'play') { if (hitstop > 0) { hitstop -= rdt; dt = rdt * .1; } update(dt); }
  else { updateParticles(rdt); if (state === 'dead') { for (const e of enemies) e.t += rdt; } }
  if (state === 'play') updateParticles(worldDt);
  for (let n = 0, c = 0; n < 2 && dirty.size; n++) { const k = dirty.values().next().value; dirty.delete(k); buildChunk(Math.floor(k / 100), k % 100); }
  renderFrame(rdt);
  if (titleCv && !el.menu.classList.contains('hide') && now - lastTitle > 42) { lastTitle = now; drawTitle(now / 1000); }
  hudT -= rdt; if (hudT <= 0) { hudT = 1 / 30; updateHUD(); }
}

