// ---------------- entities: NPC / portal / chests / glyph ----------------
const SMITH = [
  P_([0, .6, 0], [.78, 1.2, .5], 0x3a1018), P_([0, .3, .27], [.7, .6, .08], 0x6a6a78), P_([0, 1.45, 0], [.52, .5, .5], 0x8a2a1a),
  P_([-.2, 1.5, .27], [.12, .08, .04], 0xffd23a, { e: 1 }), P_([.2, 1.5, .27], [.12, .08, .04], 0xffd23a, { e: 1 }),
  P_([-.2, 1.85, 0], [.1, .35, .1], 0xe8e0d0), P_([.2, 1.85, 0], [.1, .35, .1], 0xe8e0d0), P_([0, 1.2, .3], [.3, .12, .04], 0x2a0a0e),
  P_([-.52, 1.0, .1], [.2, .8, .22], 0x2a0a10), P_([.52, 1.0, .25], [.2, .22, .6], 0x2a0a10),
  P_([.52, 1.1, .6], [.1, .7, .1], 0x6a4a2a), P_([.52, 1.5, .6], [.4, .22, .26], 0x7f8a9c), P_([0, 2.15, 0], [.6, .1, .6], 0x1a0a14)
];
function drawHubEntities(t) {
  // smith
  drawParts(SMITH, NPC.x, NPC.y + Math.sin(NPC.t * 2) * .02, NPC.z, rotY(NPC.yaw), 1, t, false, 0);
  if (nearNPC()) pushBox(NPC.x, NPC.y + 2.8 + Math.sin(t * 4) * .1, NPC.z, .22, .22, .22, 1, .85, .2, rotY(t * 3), false);
  if (OW.gen >= 2) { drawLifts(t); return; }
  // hellgate swirl
  for (let iy = 0; iy < 10; iy++) for (let ix = 0; ix < 7; ix++) {
    const x = 29.5 + ix, y = 9.5 + iy, a = Math.sin(t * 2.2 + ix * .7 + iy * .5) * .5 + .5, b = Math.sin(t * 3.1 - iy * .8 + ix * .4) * .5 + .5;
    const r = .25 + a * .75, g = .02 + b * .12, bl = .08 + (1 - a) * .55 * b;
    pushBox(x, y, 10.6 + Math.sin(t * 2 + ix + iy) * .12, 1, 1, .5, r, g, bl, null, false);
  }
  pushBox(32.5, 13.5, 9.3, 7, 10, .15, .04, .0, .06, null, false);
}
function drawChests(t) {
  for (const c of Run.chests) {
    const R = null, x = c.x, y = c.y, z = c.z;
    pushBox(x, y + .28, z, .9, .56, .62, .38, .17, .08, R);
    pushBox(x, y + .3, z, .96, .12, .68, .85, .66, .2, R);
    pushBox(x, y + .05, z, .98, .1, .7, .85, .66, .2, R);
    if (!c.open) {
      pushBox(x, y + .68, z, .9, .24, .62, .45, .2, .1, R);
      pushBox(x, y + .5, z + .33, .16, .22, .06, .95, .8, .2, R, false);
      const p = .6 + Math.sin(c.t * 4) * .4; pushBox(x, y + 1.15 + Math.sin(c.t * 3) * .08, z, .22, .22, .22, 1 * p + .3, .1, .8 * p + .2, rotY(c.t * 2), false);
    } else pushBox(x, y + .85, z - .36, .9, .56, .12, .45, .2, .1, rotX(-.35));
  }
}
function drawGlyph(t) {
  const g = Run.glyph; if (!g) return;
  const pul = .6 + Math.sin(t * 5) * .4;
  for (let i = 0; i < 20; i++) { const a = i / 20 * TAU + t * .8; pushBox(g.x + Math.cos(a) * 2.2, g.y + .12, g.z + Math.sin(a) * 2.2, .5, .12, .5, .2, .8 * pul + .2, 1, rotY(-a), false); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - t * 1.2; pushBox(g.x + Math.cos(a) * 1.0, g.y + .14, g.z + Math.sin(a) * 1.0, 1.1, .1, .22, .9, .3 + pul * .5, 1, rotY(-a), false); }
  pushBox(g.x, g.y + 3.5, g.z, .5, 7, .5, .3, .7, 1, null, false);
}
function drawLockOn() {
  if (!P.lock || P.lock.dead) return; const e = P.lock, t = T * 6;
  pushBox(e.x, e.y + e.h + .7 + Math.sin(t) * .12, e.z, .32, .32, .32, 1, .15, .15, rotY(t), false);
  pushBox(e.x, e.y + e.h + .35 + Math.sin(t) * .12, e.z, .18, .3, .18, 1, .4, .3, rotY(-t), false);
}


function drawLifts(t) {                                               // tractor beams: rings of light rising from the island up into the hull
  for (const L of HUB.lifts) {
    if (Math.hypot(L.x - camX, L.z - camZ) > 150) continue;
    const span = L.y1 - L.y0;
    for (let k = 0; k < 14; k++) {
      const y = L.y0 + ((t * 13 + k * span / 14) % span), R = 2.4;
      for (const [dx, dz, sx, sz] of [[R, 0, .14, 4.8], [-R, 0, .14, 4.8], [0, R, 4.8, .14], [0, -R, 4.8, .14]]) pushBox(L.x + dx, y, L.z + dz, sx, .1, sz, .25, .95, 1, null, false, 1, TILE.GLOW);
    }
  }
}
