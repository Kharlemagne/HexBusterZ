// ============================================================
//  THE PLAYER: a black skeleton-robot, eldritch-born. Front of the model is -z (like the weapon view-models).
//  Used for other players in co-op and for the character preview in the inventory screen.
//    black chassis · bone-grey trim · cyan eye-lights · a magenta third eye · a heart-core in the ribcage · violet joints and back-tendrils
// ============================================================
const PM_BLK = 0x0b0b13, PM_TRIM = 0x2b2543, PM_BONE = 0x1b1b27, PM_CY = 0x27f0ff, PM_MG = 0xff2bd6, PM_VI = 0xa64bff, PM_TEETH = 0x6a6a82;
const PLAYER_PARTS = (() => {
  const L = [], add = (o, s, c, x) => L.push(P_(o, s, c, x)), swing = (ph, amp) => ({ sw: { ph, amp } });
  // skull
  add([0, 1.58, 0], [.44, .46, .44], PM_BLK); add([0, 1.35, -.03], [.34, .13, .36], PM_BLK); add([0, 1.3, -.2], [.3, .04, .04], PM_TEETH);
  add([-.11, 1.6, -.222], [.13, .11, .04], 0x000000); add([.11, 1.6, -.222], [.13, .11, .04], 0x000000);
  add([-.11, 1.6, -.238], [.07, .06, .03], PM_CY, { e: 1 }); add([.11, 1.6, -.238], [.07, .06, .03], PM_CY, { e: 1 });
  add([0, 1.74, -.226], [.07, .07, .03], PM_MG, { e: 1 }); add([0, 1.5, -.226], [.05, .08, .03], 0x000000);
  add([-.2, 1.88, 0], [.07, .22, .07], PM_TRIM); add([.2, 1.88, 0], [.07, .22, .07], PM_TRIM); add([-.2, 2.0, 0], [.04, .06, .04], PM_VI, { e: 1 }); add([.2, 2.0, 0], [.04, .06, .04], PM_VI, { e: 1 });
  // spine + ribcage
  add([0, 1.24, .03], [.1, .12, .1], PM_TRIM); for (let i = 0; i < 4; i++) add([0, 1.12 - i * .13, .1], [.07, .08, .07], PM_BONE);
  for (let i = 0; i < 4; i++) add([0, 1.2 - i * .12, 0], [.5 - i * .03, .055, .27], PM_BLK);
  add([0, 1.0, -.14], [.06, .46, .04], PM_TRIM); add([0, 1.07, -.12], [.15, .15, .07], PM_MG, { e: 1 });
  add([-.34, 1.2, 0], [.15, .15, .15], PM_TRIM); add([.34, 1.2, 0], [.15, .15, .15], PM_TRIM);
  // pelvis
  add([0, .74, 0], [.38, .14, .22], PM_BLK); add([0, .7, -.115], [.1, .1, .04], PM_VI, { e: 1 });
  // arms (swing against the legs when walking)
  for (const sd of [-1, 1]) {
    const ph = sd < 0 ? Math.PI : 0, x = sd * .37;
    add([x, 1.0, 0], [.1, .3, .1], PM_BLK, swing(ph, .16)); add([x, .86, 0], [.13, .08, .13], PM_VI, { e: 1, ...swing(ph, .16) });
    add([x, .68, 0], [.09, .3, .09], PM_BLK, swing(ph, .16)); add([x, .48, -.02], [.1, .12, .12], PM_TRIM, swing(ph, .16));
    for (const f of [-.035, .035]) add([x + f, .4, -.06], [.025, .1, .03], PM_BONE, swing(ph, .16));         // claw fingers
  }
  // legs
  for (const sd of [-1, 1]) {
    const ph = sd < 0 ? 0 : Math.PI, x = sd * .12;
    add([x, .5, 0], [.13, .34, .13], PM_BLK, swing(ph, .2)); add([x, .33, -.07], [.07, .07, .04], PM_CY, { e: 1, ...swing(ph, .2) });
    add([x, .17, 0], [.1, .34, .1], PM_BLK, swing(ph, .2)); add([x, .04, -.05], [.14, .07, .28], PM_TRIM, swing(ph, .2));
  }
  // back tendrils (the eldritch part): glow violet, sway out of step
  add([-.1, 1.0, .2], [.04, .55, .04], PM_VI, { e: 1, ...swing(1, .09) }); add([.1, 1.05, .2], [.04, .5, .04], PM_MG, { e: 1, ...swing(3, .09) }); add([0, .95, .22], [.04, .6, .04], PM_CY, { e: 1, ...swing(5, .09) });
  return L;
})();
// what is in the right hand: a little silhouette per weapon
const PLAYER_HELD = [
  [[.09, .1, .4, 0x8c8c9a, 0, 0], [.14, .13, .15, 0xd9a441, 0, .16]], [[.1, .1, .62, 0x6a6a78, 0, 0], [.13, .13, .22, 0x5a1a1a, 0, .26]],
  [[.14, .16, .46, 0x3b3f4a, 0, 0], [.05, .05, .36, PM_CY, 1, -.4]], [[.07, .08, .95, 0x2e3340, 0, -.1], [.16, .16, .06, PM_CY, 1, -.35]], [[.05, .55, .05, 0x6a4a2a, 0, 0], [.34, .07, .09, 0x9aa4b4, 0, 0, .3]]
];
function playerParts(weapon) {
  const w = PLAYER_HELD[weapon]; if (!w) return PLAYER_PARTS;
  const out = PLAYER_PARTS.slice();
  w.forEach(h => { const [sx, sy, sz, c, e, dz, dy] = h; out.push(P_([.37, weapon === 4 ? .66 + (dy || 0) : .46, -.2 + (dz || 0) - (weapon === 4 ? -.2 : sz * .3)], [sx, sy, sz], c, e ? { e: 1, sw: { ph: 0, amp: .16 } } : { sw: { ph: 0, amp: .16 } })); });
  return out;
}
// ---- character preview: a tiny software renderer on a 2D canvas (orthographic, painter's algorithm), like Minecraft's inventory doll
const CHAR_FACES = [[[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]], [[-1, 0, 0], [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]]], [[0, 1, 0], [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]]], [[0, -1, 0], [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1]]], [[0, 0, 1], [[1, -1, 1], [1, 1, 1], [-1, 1, 1], [-1, -1, 1]]], [[0, 0, -1], [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]]]];
function drawCharPreview(cv, yaw, pitch, t, weapon, walk) {
  const g = cv.getContext('2d'), W = cv.width, H_ = cv.height; g.clearRect(0, 0, W, H_);
  const grd = g.createRadialGradient(W / 2, H_ * .55, 10, W / 2, H_ * .55, H_ * .6); grd.addColorStop(0, '#2a1a4a99'); grd.addColorStop(1, '#00000000'); g.fillStyle = grd; g.fillRect(0, 0, W, H_);
  const sc = H_ / 2.45, cy = H_ * .93, c = Math.cos(yaw + Math.PI), s = Math.sin(yaw + Math.PI), cp = Math.cos(pitch), sp = Math.sin(pitch), quads = [];
  const proj = (x, y, z) => { const x1 = x * c + z * s, z1 = -x * s + z * c, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp; return [W / 2 + x1 * sc, cy - y2 * sc, z2]; };
  for (const p of playerParts(weapon)) {
    let ox = p.o[0], oy = p.o[1], oz = p.o[2];
    if (p.sw) oz += Math.sin(walk + p.sw.ph) * p.sw.amp;
    if (p.o[1] > 1.0 && p.o[1] < 1.2 && !p.e) { /* ribcage breathes */ }
    const hx_ = p.s[0] / 2, hy_ = p.s[1] / 2, hz_ = p.s[2] / 2, em = !!p.e, col = p.rgb;
    for (const [n, vs] of CHAR_FACES) {
      const nx = n[0] * c + n[2] * s, nz = -n[0] * s + n[2] * c, nz2 = n[1] * sp + nz * cp;
      if (nz2 <= 0.001) continue;                                                  // facing away from the viewer
      const pts = vs.map(v => proj(ox + v[0] * hx_, oy + v[1] * hy_, oz + v[2] * hz_)), dz = (pts[0][2] + pts[1][2] + pts[2][2] + pts[3][2]) / 4;
      const ny2 = n[1] * cp - nz * sp, lit = em ? 1.2 : .55 + .45 * Math.max(0, nx * .3 + ny2 * .8 + nz2 * .5);
      quads.push([dz, pts, [Math.min(255, col[0] * 255 * lit) | 0, Math.min(255, col[1] * 255 * lit) | 0, Math.min(255, col[2] * 255 * lit) | 0], em]);
    }
  }
  quads.sort((a, b) => a[0] - b[0]);
  for (const [, pts, rgb, em] of quads) {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < 4; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath();
    g.fillStyle = 'rgb(' + rgb.join(',') + ')'; if (em) { g.shadowColor = 'rgb(' + rgb.join(',') + ')'; g.shadowBlur = 10; } g.fill(); g.shadowBlur = 0;
    g.strokeStyle = em ? 'rgba(255,255,255,.35)' : 'rgba(120,110,170,.25)'; g.lineWidth = 1; g.stroke();
  }
}
