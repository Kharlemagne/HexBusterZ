// ============================================================
//  SORTIE — drawing: a bendy neon corridor, the models (same painter's renderer as the builder), bullets, particles and the HUD.
//  Everything is placed in ship space and projected with a camera behind the ship; the corridor's bends are applied per point (srOff).
// ============================================================
const SR_CZ = 10;
Object.assign(Sortie, {
  cur(s) { const a = SR.curveA; return [(Math.sin(s * .021 + SR.ph1) * 5 + Math.sin(s * .049 + SR.ph2) * 2) * a, Math.sin(s * .017 + SR.ph3) * 2.2 * a]; },
  off(z) { const a = this.cur(SR.D - z), b = SR.curBase; return [a[0] - b[0], a[1] - b[1]]; },
  P(x, y, z) {
    const d = SR_CZ - z; if (d < .7) return null; const k = SR.F / d, o = this.off(z);
    return [SR.W / 2 + (x + o[0] - SR.cam.x) * k, SR.hy - (y + o[1] - SR.cam.y) * k, k];
  },
  render() {
    const cv = SR.cv, c = SR.cx, W = SR.W = cv.width, H = SR.H = cv.height; SR.F = Math.min(W * .62, H * 1.08); SR.hy = H * .5; SR.curBase = this.cur(SR.D);
    const th = SR.theme, A = th.a, B = th.b, rgb = (v, a) => 'rgba(' + v[0] + ',' + v[1] + ',' + v[2] + ',' + (a === undefined ? 1 : a) + ')';
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, th.bg[0]); g.addColorStop(1, th.bg[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const halo = c.createRadialGradient(W / 2, H * .46, 10, W / 2, H * .46, H * .7); halo.addColorStop(0, rgb(B, .22)); halo.addColorStop(1, rgb(B, 0)); c.fillStyle = halo; c.fillRect(0, 0, W, H);
    const rollA = (SR.roll * Math.sin(SR.D * .012)) + (this.cur(SR.D + 14)[0] - SR.curBase[0]) * .012, sh = SR.shake * 10;
    c.translate(W / 2 + (Math.random() - .5) * sh, H / 2 + (Math.random() - .5) * sh); c.rotate(rollA); c.translate(-W / 2, -H / 2);
    // stars
    c.lineCap = 'round'; c.strokeStyle = 'rgba(210,225,255,.55)'; c.lineWidth = Math.max(1, W / 900); c.beginPath();
    for (const s of SR.stars) { const p = this.P2(s[0], s[1], s[2]), q = this.P2(s[0], s[1], s[2] - 2.2); if (p && q) { c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); } } c.stroke();
    c.globalCompositeOperation = 'lighter'; this.corridor(c, A, B, rgb); c.globalCompositeOperation = 'source-over';
    // everything that has depth, far to near
    const L = []; const zs = o => o;
    for (const o of SR.obs) L.push([o.z, 0, o]); for (const r of SR.rings) L.push([r.z, 1, r]); for (const e of SR.enemies) L.push([e.z, 2, e]); L.push([SR.phase === 'intro' ? 6 * (1 - Math.min(1, SR.pt / 2)) : 0, 3, null]);
    for (const b of SR.eb) L.push([b.z, 4, b]); for (const b of SR.pb) L.push([b.z, 5, b]); for (const f of SR.fx) L.push([f.z, 6, f]);
    L.sort((a, b) => a[0] - b[0]);
    for (const [z, k, o] of L) {
      if (k === 0) this.drawObs(c, o, A, B, rgb); else if (k === 1) this.drawRing(c, o, rgb); else if (k === 2) this.drawEnemy(c, o, rgb);
      else if (k === 3) this.drawShip(c, z, rgb); else if (k === 4) this.drawBullet(c, o, th, rgb); else if (k === 5) this.drawShot(c, o, A, rgb); else this.drawFx(c, o, rgb);
    }
    c.restore(); this.hud(c, W, H, A, B, rgb);
  },
  P2(x, y, z) { const d = SR_CZ - z; if (d < .7) return null; const k = SR.F / d; return [SR.W / 2 + (x - SR.cam.x * .3) * k, SR.hy - (y - SR.cam.y * .3) * k, k]; },
  corridor(c, A, B, rgb) {
    const w = SRB.BX + 1.2, h = SRB.BY + 1.2, sp = 9, z0 = SR.D % sp; let prev = null;
    for (let k = 0; k < 17; k++) {
      const z = z0 - k * sp, cs = [[-w, -h], [w, -h], [w, h], [-w, h]].map(q => this.P(q[0], q[1], z)); if (cs.some(p => !p)) { prev = null; continue; }
      const fade = Math.max(.06, 1 - k / 17), pulse = .6 + .4 * Math.sin(SR.T * 2 - k * .5);
      c.strokeStyle = rgb(k % 4 === 0 ? B : A, fade * (.5 + .5 * pulse)); c.lineWidth = Math.max(1, cs[0][2] * .06); c.beginPath(); cs.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.stroke();
      if (prev) {
        c.strokeStyle = rgb(A, fade * .35); c.lineWidth = Math.max(1, cs[0][2] * .03); c.beginPath();
        for (let i = 0; i < 4; i++) { c.moveTo(prev[i][0], prev[i][1]); c.lineTo(cs[i][0], cs[i][1]); }
        for (const x of [-4.7, -2.3, 0, 2.3, 4.7]) { const a = this.P(x, -h, z + sp), b = this.P(x, -h, z); if (a && b) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } }
        c.stroke();
      }
      prev = cs;
    }
  },
  faceFill(c, pts, fill, edge, lw) { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = fill; c.fill(); c.strokeStyle = edge; c.lineWidth = lw; c.stroke(); },
  box(c, v, fill, edge, alpha) {                                                // v: 8 ship-space points (front 4 then back 4); painter's order by face depth
    const p = v.map(q => this.P(q[0], q[1], q[2])); if (p.some(q => !q)) { const ok = p.filter(q => q); if (ok.length < 2) return; }
    const F = [[4, 5, 6, 7], [0, 4, 7, 3], [1, 5, 6, 2], [3, 2, 6, 7], [0, 1, 5, 4], [0, 1, 2, 3]], ord = F.map((f, i) => [f.reduce((s, j) => s + v[j][2], 0) / 4, i]).sort((a, b) => a[0] - b[0]);
    c.globalAlpha = alpha; for (const [, i] of ord) { const pts = F[i].map(j => p[j]); if (pts.some(q => !q)) continue; this.faceFill(c, pts, i === 5 ? fill[0] : fill[1], edge, Math.max(1, pts[0][2] * .05)); } c.globalAlpha = 1;
  },
  drawObs(c, o, A, B, rgb) {
    const fade = Math.max(.15, Math.min(1, 1.25 - (SR_CZ - o.z) / 130)), z1 = o.z, z0 = o.z - o.d;
    if (o.k === 'wall') for (const r of o.rects) this.box(c, [[r[0], r[2], z1], [r[1], r[2], z1], [r[1], r[3], z1], [r[0], r[3], z1], [r[0], r[2], z0], [r[1], r[2], z0], [r[1], r[3], z0], [r[0], r[3], z0]], ['rgb(34,40,58)', 'rgb(18,22,34)'], rgb(B, .95), fade);
    else { const cs = Math.cos(o.a), sn = Math.sin(o.a), t = .32, q = (u, v) => [o.cx + u * cs - v * sn, o.cy + u * sn + v * cs]; const pts = [q(-o.len, -t), q(o.len, -t), q(o.len, t), q(-o.len, t)];
      this.box(c, [[...pts[0], z1], [...pts[1], z1], [...pts[2], z1], [...pts[3], z1], [...pts[0], z0], [...pts[1], z0], [...pts[2], z0], [...pts[3], z0]], ['rgb(70,30,34)', 'rgb(40,16,22)'], 'rgba(255,90,70,.95)', fade); }
  },
  drawRing(c, r, rgb) {
    const p = this.P(r.x, r.y, r.z); if (!p) return; const fade = Math.max(.1, Math.min(1, 1.3 - (SR_CZ - r.z) / 120)) * (r.got ? .25 : 1);
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,230,110,' + fade + ')'; c.lineWidth = Math.max(2, p[2] * .22); c.beginPath(); c.arc(p[0], p[1], 1.5 * p[2], 0, 6.2832); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,' + fade * .5 + ')'; c.lineWidth = Math.max(1, p[2] * .06); c.beginPath(); c.arc(p[0], p[1], 1.5 * p[2], 0, 6.2832); c.stroke(); c.globalCompositeOperation = 'source-over';
  },
  mrot(R, x, y, z) { return [R[0] * x + R[1] * y + R[2] * z, R[3] * x + R[4] * y + R[5] * z, R[6] * x + R[7] * y + R[8] * z]; },
  model(c, items, ox, oy, oz, sc, R, alpha, flash) {                          // painter's-algorithm model draw; positions are in ship space
    const list = items.map(it => { const w = this.mrot(R, it.x, it.y, it.z); return [oz + w[2] * sc, it, w]; }).sort((a, b) => a[0] - b[0]), cam = [SR.cam.x, SR.cam.y, SR_CZ];
    c.globalAlpha = alpha; c.lineJoin = 'round';
    for (const [, it, w] of list) for (const f of it.mesh.faces) {
      const n = this.mrot(R, f.n[0], f.n[1], f.n[2]), fc = this.mrot(R, it.x + f.c[0], it.y + f.c[1], it.z + f.c[2]), px = ox + fc[0] * sc, py = oy + fc[1] * sc, pz = oz + fc[2] * sc;
      let tx = cam[0] - px, ty = cam[1] - py, tz = cam[2] - pz; const l = Math.hypot(tx, ty, tz) || 1; if ((n[0] * tx + n[1] * ty + n[2] * tz) / l < .01) continue;
      const base = f.t === 'p' ? it.col : STAGC[f.t], em = STAGE[f.t] || 0, shd = .38 + .55 * Math.max(0, n[0] * SLIGHT[0] + n[1] * SLIGHT[1] + n[2] * SLIGHT[2]) + .2 * Math.max(0, n[2]), kk = em >= 1 ? 1 : em ? shd + .3 : shd;
      const r = Math.min(255, base[0] * kk + flash * 200) | 0, g = Math.min(255, base[1] * kk + flash * 200) | 0, b = Math.min(255, base[2] * kk + flash * 200) | 0;
      const pts = []; let ok = true; for (const v of f.v) { const m = this.mrot(R, it.x + v[0], it.y + v[1], it.z + v[2]), p = this.P(ox + m[0] * sc, oy + m[1] * sc, oz + m[2] * sc); if (!p) { ok = false; break; } pts.push(p); } if (!ok) continue;
      this.faceFill(c, pts, 'rgb(' + r + ',' + g + ',' + b + ')', 'rgba(' + (r * .5 | 0) + ',' + (g * .5 | 0) + ',' + (b * .55 | 0) + ',.9)', 1);
    }
    c.globalAlpha = 1;
  },
  drawEnemy(c, e, rgb) {
    if (e.dead) return; const fade = Math.max(.2, Math.min(1, 1.3 - (SR_CZ - e.z) / 125)); let R;
    if (e.kind === 'boss') { R = mulR(rotY(Math.PI), rotZ(Math.sin(e.t * .9) * .12)); this.model(c, srModel('boss', e.arch), e.x, e.y, e.z, .46, R, fade, e.flash * .5); return; }
    R = e.kind === 'mine' ? mulR(rotY(e.spin * 1.6), rotX(e.spin * 1.1)) : mulR(rotY(Math.PI), rotZ(Math.sin(e.t * 2 + e.ph) * .25 + (e.mv === 'sweep' ? -e.dir * .3 : 0)));
    this.model(c, srModel(e.kind), e.x, e.y, e.z, SRSCALE[e.kind] * 1, R, fade, e.flash * .6);
  },
  drawShip(c, zOff, rgb) {
    const s = SR.ship; if (SR.phase === 'dying' && SR.pt > .15) return; if (s.inv > 0 && Math.floor(SR.T * 16) % 2) return;
    const R = mulR(rotZ(-s.vx * .05), rotX(s.vy * .03)); this.model(c, SR.sh.items, s.x, s.y, zOff, SR.sh.s, R, 1, s.flash * .5);
    if (SRK.ShiftLeft || SRK.ShiftRight) { const p = this.P(s.x, s.y, zOff); if (p) { c.fillStyle = 'rgba(255,60,60,.95)'; c.beginPath(); c.arc(p[0], p[1], Math.max(3, s.hitR * p[2]), 0, 6.2832); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke(); } }
  },
  drawBullet(c, b, th, rgb) {
    const p = this.P(b.x, b.y, b.z); if (!p) return; const col = b.c === 1 ? [255, 190, 80] : b.c === 2 ? th.b : th.blt, r = Math.max(2, b.r * p[2]), fade = Math.max(.3, Math.min(1, 1.4 - (SR_CZ - b.z) / 130));
    c.globalCompositeOperation = 'lighter'; c.fillStyle = rgb(col, .32 * fade); c.beginPath(); c.arc(p[0], p[1], r * 2.1, 0, 6.2832); c.fill(); c.fillStyle = rgb(col, .95 * fade); c.beginPath(); c.arc(p[0], p[1], r * 1.15, 0, 6.2832); c.fill();
    c.fillStyle = 'rgba(255,255,255,' + fade + ')'; c.beginPath(); c.arc(p[0], p[1], r * .55, 0, 6.2832); c.fill(); c.globalCompositeOperation = 'source-over';
  },
  drawShot(c, b, A, rgb) {
    const p = this.P(b.x, b.y, b.z), q = this.P(b.x, b.y, b.z + (b.kind === 'lance' ? 3 : 1.6)); if (!p || !q) return; const col = b.kind === 'rocket' ? [255, 170, 60] : b.kind === 'lance' ? [255, 90, 240] : A;
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.strokeStyle = rgb(col, .9); c.lineWidth = Math.max(2, b.r * p[2] * 1.6); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = Math.max(1, b.r * p[2] * .6); c.stroke(); c.globalCompositeOperation = 'source-over';
  },
  drawFx(c, f, rgb) {
    const p = this.P(f.x, f.y, f.z); if (!p) return; c.globalCompositeOperation = 'lighter';
    if (f.ring) { const a = 1 - f.t / f.life; c.strokeStyle = rgb(f.c, a * .9); c.lineWidth = Math.max(2, p[2] * .25 * a); c.beginPath(); c.arc(p[0], p[1], Math.max(1, f.r * p[2]), 0, 6.2832); c.stroke(); }
    else { const a = 1 - f.t / f.max; c.fillStyle = rgb(f.c, a); c.beginPath(); c.arc(p[0], p[1], Math.max(1, f.size * p[2] * a * 1.5), 0, 6.2832); c.fill(); }
    c.globalCompositeOperation = 'source-over';
  },
  // ---------------- the HUD ----------------
  hud(c, W, H, A, B, rgb) {
    const u = H / 720, F = (n, w) => (w || 'bold') + ' ' + Math.round(n * u) + 'px "Arial Black", Arial, sans-serif', s = SR.ship, th = SR.theme;
    if (SR.flash > 0) { const g = c.createRadialGradient(W / 2, H / 2, H * .2, W / 2, H / 2, H * .85); g.addColorStop(0, 'rgba(255,60,50,0)'); g.addColorStop(1, 'rgba(255,60,50,' + SR.flash * .55 + ')'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    c.textBaseline = 'top'; c.textAlign = 'left'; const pad = 18 * u;
    // hull pips + bombs
    c.font = F(11); c.fillStyle = rgb(A, .9); c.fillText('HULL', pad, pad);
    for (let i = 0; i < s.hullMax; i++) { c.fillStyle = i < s.hull ? (s.hull <= 2 ? '#ff5a4a' : rgb(A, .95)) : 'rgba(255,255,255,.14)'; c.fillRect(pad + i * 15 * u, pad + 18 * u, 11 * u, 16 * u); }
    c.fillStyle = rgb(B, .95); c.font = F(11); c.fillText('BOMBS', pad, pad + 44 * u); for (let i = 0; i < s.bombMax; i++) { c.beginPath(); c.arc(pad + 56 * u + i * 20 * u, pad + 51 * u, 7 * u, 0, 6.2832); if (i < s.bombs) { c.fillStyle = rgb(B, 1); c.fill(); } else { c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2; c.stroke(); } }
    c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(pad, pad + 64 * u, 150 * u, 5 * u); c.fillStyle = rgb(B, .9); c.fillRect(pad, pad + 64 * u, 150 * u * (s.bombs >= s.bombMax ? 1 : s.meter / 100), 5 * u);
    // sector + score
    c.textAlign = 'center'; c.font = F(13); c.fillStyle = rgb(A, .95); c.fillText(SR.lvl.name, W / 2, pad); const seg = SR.lvl.segs[Math.max(0, SR.seg)]; c.font = F(10); c.fillStyle = 'rgba(255,255,255,.65)'; c.fillText(seg ? seg.label : '', W / 2, pad + 20 * u);
    c.textAlign = 'right'; c.font = F(11); c.fillStyle = rgb(A, .9); c.fillText('SCORE', W - pad, pad); c.font = F(24); c.fillStyle = '#fff'; c.fillText(String(SR.score).padStart(7, '0'), W - pad, pad + 14 * u);
    c.font = F(10); c.fillStyle = 'rgba(255,255,255,.55)'; c.fillText(SR.autoFire ? 'AUTO-FIRE' : 'MANUAL FIRE', W - pad, pad + 48 * u);
    // route progress along the bottom: one block per segment
    const n = SR.lvl.segs.length, bw = Math.min(W * .5, 620 * u), bx = (W - bw) / 2, by = H - 26 * u; c.textAlign = 'center';
    for (let i = 0; i < n; i++) { const sg = SR.lvl.segs[i], x0 = bx + bw * i / n, w0 = bw / n - 5 * u, cur = i === SR.seg, fill = i < SR.seg ? 1 : cur ? (sg.kind === 'boss' ? 0 : Math.min(1, SR.segT / Math.max(1, sg.len))) : 0, col = sg.kind === 'transit' ? A : sg.kind === 'combat' ? [255, 150, 60] : [255, 70, 60];
      c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(x0, by, w0, 7 * u); c.fillStyle = rgb(col, .95); c.fillRect(x0, by, w0 * (sg.kind === 'boss' && i < SR.seg ? 1 : fill), 7 * u); if (sg.kind === 'boss') { c.font = F(9); c.fillStyle = rgb(col, .9); c.fillText('BOSS', x0 + w0 / 2, by - 13 * u); } }
    if (SR.boss && !SR.boss.dead && SR.boss.st !== 'in') { const bw2 = Math.min(W * .6, 700 * u), x = (W - bw2) / 2, y = 62 * u; c.font = F(11); c.fillStyle = '#ff8a7a'; c.fillText(SR.boss.name, W / 2, y - 16 * u); c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(x, y, bw2, 9 * u); c.fillStyle = '#ff4a3a'; c.fillRect(x, y, bw2 * Math.max(0, SR.boss.hp / SR.boss.hpMax), 9 * u); }
    // banner
    const bn = SR.banner; if (bn) { const k = bn.t / bn.dur, a = Math.min(1, bn.t * 4) * Math.min(1, (bn.dur - bn.t) * 3), flash = bn.txt === 'CRISIS ALERT' || bn.txt === 'WARNING';
      c.textAlign = 'center'; c.textBaseline = 'middle'; if (flash) { c.fillStyle = 'rgba(255,40,40,' + (.1 + .1 * Math.sin(SR.T * 14)) * a + ')'; c.fillRect(0, 0, W, H); }
      c.fillStyle = 'rgba(0,0,0,' + .45 * a + ')'; c.fillRect(0, H * .3 - 40 * u, W, 100 * u); c.font = F(flash ? 54 : 38); c.fillStyle = rgb(bn.col, a); c.fillText(bn.txt, W / 2, H * .3 + 2 * u); c.font = F(14); c.fillStyle = 'rgba(255,255,255,' + a * .8 + ')'; c.fillText(bn.sub, W / 2, H * .3 + 40 * u); c.textBaseline = 'top'; }
    if (SR.phase === 'intro') { c.textAlign = 'center'; c.font = F(11); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText('WASD / ARROWS MOVE   ·   SHIFT FOCUS   ·   X BOMB   ·   F AUTO-FIRE   ·   ESC PAUSE   ·   PAD: STICK MOVE · A / RT FIRE · LT FOCUS · X BOMB · Y AUTO · START PAUSE', W / 2, H - 60 * u); }
    if (SR.pause) { c.fillStyle = 'rgba(0,0,10,.72)'; c.fillRect(0, 0, W, H); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = F(40); c.fillStyle = rgb(A, 1); c.fillText('PAUSED', W / 2, H * .42); c.font = F(14); c.fillStyle = '#fff'; c.fillText('ESC — RESUME      Q — ABORT SORTIE AND RETURN TO THE HANGAR', W / 2, H * .52); c.textBaseline = 'top'; }
    if (SR.phase === 'result' && SR.result) this.resultCard(c, W, H, u, F, rgb, A, B);
  },
  resultCard(c, W, H, u, F, rgb, A, B) {
    const r = SR.result; c.fillStyle = 'rgba(0,4,14,.82)'; c.fillRect(0, 0, W, H); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = F(46); c.fillStyle = r.won ? '#5af07a' : '#ff5a4a'; c.fillText(r.won ? 'SECTOR CLEARED' : 'SHIP LOST', W / 2, H * .22); c.font = F(14); c.fillStyle = rgb(A, .9); c.fillText(SR.lvl.name + ' · TIER ' + (SR.tier + 1), W / 2, H * .22 + 44 * u);
    const rows = [['SCORE', r.score], ['CLEAR BONUS', r.bonus], ['TOTAL', r.total], ['ENEMIES DOWN', r.kills], ['GRAZES', r.grazes], ['HITS TAKEN', r.hits], ['TIME', Math.floor(r.time / 60) + ':' + String(Math.floor(r.time % 60)).padStart(2, '0')]];
    c.textAlign = 'left'; rows.forEach((q, i) => { const y = H * .36 + i * 30 * u; c.font = F(13); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText(q[0], W / 2 - 170 * u, y); c.textAlign = 'right'; c.fillStyle = i === 2 ? '#ffe96a' : '#fff'; c.fillText(String(q[1]), W / 2 + 170 * u, y); c.textAlign = 'left'; });
    c.textAlign = 'center'; c.font = F(18); c.fillStyle = '#ff8cf0'; c.fillText('+ ' + r.gems + ' DEMON GEMS' + (r.best ? '    NEW BEST!' : ''), W / 2, H * .36 + 7 * 30 * u + 14 * u);
    c.font = F(13); c.fillStyle = 'rgba(255,255,255,' + (.6 + .4 * Math.sin(SR.T * 4)) + ')'; c.fillText(r.won ? 'ENTER — RETURN TO THE HANGAR      R — REPLAY THIS SECTOR' : 'ENTER — RETURN TO THE HANGAR      R — TRY THIS SECTOR AGAIN', W / 2, H * .88); c.textBaseline = 'top';
  }
});
