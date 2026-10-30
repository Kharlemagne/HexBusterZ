// ---------------- render ----------------
function resize() {
  const r = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.max(2, Math.floor((innerWidth || 640) * r)); canvas.height = Math.max(2, Math.floor((innerHeight || 360) * r)); if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
}
addEventListener('resize', resize);
function pushOutline(x, y, z) {
  const t = .035, c = [1, 1, .85];
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
    const ox = a - .5, oy = b - .5;
    pushBox(x + .5 + ox * 1.01, y + .5 + oy * 1.01, z + .5, t, t, 1.04, c[0], c[1], c[2], null, false);
    pushBox(x + .5 + ox * 1.01, y + .5, z + .5 + oy * 1.01, t, 1.04, t, c[0], c[1], c[2], null, false);
    pushBox(x + .5, y + .5 + ox * 1.01, z + .5 + oy * 1.01, 1.04, t, t, c[0], c[1], c[2], null, false);
  }
}
function renderFrame(dt) {
  if (glLost) return;
  const asp = canvas.width / canvas.height;
  let ex, ey, ez, f, roll = 0;
  if (state === 'menu') {
    const g3 = OW.gen === 3, g4 = OW.gen === 4, g2 = OW.gen === 2 || g3 || g4, a = T * .06, rr = g3 ? 50 : g2 ? 120 : 36, cx = g3 ? 0 : g2 ? 32 : N / 2, cz = g3 ? 60 : g2 ? 32 : N / 2, ty = g3 ? 90 : g2 ? 96 : 11;
    ex = cx + Math.cos(a) * rr; ez = cz + Math.sin(a) * rr; ey = (g3 ? 116 : g2 ? 128 : 21) + Math.sin(T * .3) * 2;
    const dx = cx - ex, dy = ty - ey, dz = cz - ez, l = Math.hypot(dx, dy, dz); f = [dx / l, dy / l, dz / l]; P.fov = 1.2;
  } else {
    const spd = Math.hypot(P.vx, P.vz), tf = (P.zoom ? 38 : optV('fov') + Math.min(14, spd * .45) + (P.dashT > 0 ? 12 : 0) + (P.slamming ? 10 : 0) + P.btFade * 6 + P.fovPunch * 30) * Math.PI / 180;
    P.fov = lerp(P.fov, tf, Math.min(1, 14 * dt));
    const sh = P.shake * .09 * optV('shake');
    ex = P.x + rnd(-sh, sh); ey = P.y + P.eye - P.landDip + rnd(-sh, sh); ez = P.z + rnd(-sh, sh);
    f = fwdV(); roll = P.sliding ? .06 : (keys.KeyD ? .012 : keys.KeyA ? -.012 : 0) + rnd(-sh, sh) * .05;
  }
  P.btFade = lerp(P.btFade, P.bt > 0 ? 1 : 0, Math.min(1, 5 * dt)); P.fovPunch = Math.max(0, P.fovPunch - dt * 1.6);
  let sk = null; if (useChunks) { sk = DayNight.state(P.x, P.z); fogCur = sk.fog; }
  { const k = P.btFade, fb = useChunks ? fogCur : FOG, fc = [lerp(fb[0], .03, k), lerp(fb[1], .12, k), lerp(fb[2], .34, k)]; gl.clearColor(fc[0], fc[1], fc[2], 1); gl.uniform3fv(loc.fogc, fc); }
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniform1f(loc.amb, sk ? sk.amb : 1); gl.uniform1f(loc.tm, T);
  const inBoss = mode === 'dungeon' && Run.cur && Run.cur.type === 'boss';
  if (inBoss) { gl.uniform2f(loc.fogr, 45, 170); cullR = 135; } else if (mode === 'dungeon') { gl.uniform2f(loc.fogr, 14, 70); cullR = 78; } else { const rd = OW.LOAD * 16 - 2; gl.uniform2f(loc.fogr, rd * .5, rd); cullR = rd + 22; }
  camX = ex; camY = ey; camZ = ez; camFX = f[0]; camFZ = f[2];
  const fovy = Math.min(2.0, 2 * Math.atan(Math.tan(P.fov / 2) / asp));
  const vp = mul4(perspective(fovy, asp, .05, 300), lookView(ex, ey, ez, f[0], f[1], f[2], roll));
  gl.uniformMatrix4fv(loc.vp, false, vp); gl.uniform3f(loc.cam, ex, ey, ez);
  drawWorld();
  if (sk) drawSkyDome(f, roll, fovy, asp, sk);                                       // after the terrain, only where nothing was drawn: the (expensive) sky shader skips every covered pixel
  dn = 0;
  if (mode === 'hub') { if (state === 'play') lavaFx(dt); drawEmbers(dt, T); drawHubEntities(T); drawGatePortals(T); }
  else { drawSmoke(T); drawTurrets(T); drawChests(T); drawGlyph(T); if (inBoss) { drawSky(T); drawAsh(state === 'play' ? dt : 0, T); } }
  drawHaz(T);
  drawLockOn(); drawSlashes(); drawLatchFx();
  drawEnemies(); drawRemotePlayers(T, dt); drawDrops(); drawParticles(); drawEProjs(); drawBeams(state === 'play' ? dt : 0); drawBombs();
  if (state === 'play' && P.weapon === 4) { const h = targetBlock(); if (h) pushOutline(h.x, h.y, h.z); }
  flushDyn();
  if (state === 'play' || state === 'paused') {
    gl.clear(gl.DEPTH_BUFFER_BIT); gl.uniform1f(loc.amb, 1);
    gl.uniformMatrix4fv(loc.vp, false, perspective(1.05, asp, .01, 10)); gl.uniform3f(loc.cam, 0, 0, 0);
    drawViewmodel(); flushDyn();
  }
}


