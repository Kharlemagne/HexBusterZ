// ============================================================
//  TEXTURES — a 256x256 atlas of 16x16 pixel-art tiles, painted in code (no image files to load).
//  Tiles are *multiplier maps*: 0.625 grey (160/255) means "leave the block's base colour alone", so the palette in
//  data/blocks.json still decides the colour and the texture adds the pattern (the shader scales by 1.6, which leaves headroom for
//  bright accents like neon traces). Tile index = block id * 2 (+1 for the top face); tiles 64+ are for entities.
// ============================================================
const TILE = { WHITE: 0, GRAIN: 64, PLATE: 65, FLESHY: 66, BONEY: 67, GLOW: 68, CLOTH: 69 };
const blockTile = (id, top) => id * 2 + (top ? 1 : 0);
function tn(x, y, s) { let h = (Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
// every painter returns a multiplier (number = grey, array = [r,g,b]) for pixel (x,y) of a 16x16 tile
const PAINT = {
  1: (x, y, t, n) => (((x + y * 3) % 11 === 0 && n > .35) ? .6 : .95 + (n - .5) * .26 - ((x >> 2) + (y >> 2)) % 2 * .06),
  2: (x, y, t, n, s) => { const b = tn(x >> 1, y >> 1, s), m = .9 + (b - .5) * .5 + (n - .5) * .2; return n > .94 ? .52 : [m * 1.06, m * .92, m * .9]; },
  3: (x, y, t, n) => (((x + y) % 7 === 0) ? [1.1, .98, 1.5] : .88 + (n - .5) * .16),
  4: (x, y, t, n, s) => { const b = tn(x >> 2, y >> 2, s) * .5 + n * .5; return b > .72 ? [1.55, 1.15, .55] : b < .2 ? .55 : .85 + b * .5; },
  5: (x, y, t, n) => (y % 5 === 0 ? .82 : n > .96 ? .6 : 1.02 + (n - .5) * .14),
  6: (x, y, t, n, s) => { const r = Math.abs(tn(x >> 1, y, s) - tn((x + 1) >> 1, y + 1, s)); return r < .09 ? [1.6, 1.1, .5] : [.55 + n * .12, .5, .5]; },
  7: (x, y, t, n) => { const v = Math.sin(x * .9 + Math.sin(y * .7) * 2); return v > .85 ? [.95, .66, .72] : .95 + (n - .5) * .22 + (((x >> 2) + (y >> 2)) & 1) * .05; },
  8: (x, y, t, n) => { if (x === 0 || y === 0) return .7; if ((x === 3 || x === 12) && (y === 3 || y === 12)) return 1.35; return .98 + (tn(0, y, 3) - .5) * .12 + (n - .5) * .06; },
  9: (x, y, t, n) => ((y & 3) < 2 ? .85 : 1.15) + (n - .5) * .25,
  10: (x, y, t, n) => (n > .92 ? 1.35 : .82 + (n - .5) * .45),
  11: (x, y, t, n) => { const e = (x % 5 === 0 || y % 5 === 0) ? .78 : 1.12; return e + (n - .5) * .12; },
  12: (x, y, t, n, s) => (n > .965 ? [1.55, 1.35, 2] : t ? [.85 + tn(x >> 2, y >> 2, s) * .35, .8, 1.05 + tn(y >> 2, x >> 2, s) * .25] : .88 + (n - .5) * .24),
  13: (x, y, t, n, s) => {
    const row = (y === 3 || y === 8 || y === 13) && tn(x >> 2, y, s) > (t ? .25 : .45), col = (x === 5 || x === 11) && tn(y >> 2, x, s) > (t ? .3 : .55);
    if ((x === 5 || x === 11) && (y === 3 || y === 8 || y === 13)) return [1.6, 1.5, .8];
    return row || col ? [.55, 1.5, 1.45] : .72 + (n - .5) * .2;
  },
  14: (x, y, t, n) => { const e = x === 0 || y === 0 || x === 15 || y === 15; return (e ? .7 : (y & 3) === 0 ? .95 : 1.12) + (x === 7 || y === 7 ? .12 : 0) + (n - .5) * .06; },
  15: (x, y, t, n) => { const e = x === 0 || y === 0 || x === 15 || y === 15; return (e ? .7 : (x & 3) === 0 ? .95 : 1.12) + (x === 7 || y === 7 ? .12 : 0) + (n - .5) * .06; },
  16: (x, y, t, n) => (t ? (n > .9 ? [1.4, .8, 1.1] : .8 + (n - .5) * .6) : .85 + (n - .5) * .5 + ((y & 1) ? .08 : 0)),
  17: (x, y, t, n) => { const f = tn(x, 0, 17); return (t ? .95 : .78 + f * .4) + (n - .5) * .12 + (n > .95 ? .3 : 0); },
  18: (x, y, t, n) => (x === 0 || y === 0 ? .66 : .94 + (((x + y) % 16) / 16) * .26 + (n - .5) * .05),
  19: (x, y, t, n, s) => { const r = Math.abs(tn(x >> 1, y >> 1, s) - tn((x + 1) >> 1, (y + 1) >> 1, s)); return r < .1 ? [1.25, .9, 1.6] : [.45 + n * .1, .4, .6]; },
  20: (x, y, t, n) => (n > .9 ? 1.25 : .95 + (n - .5) * .3),
  21: (x, y, t, n, s) => { const b = tn(x >> 2, y >> 2, s); return b > .5 ? [1.2, .92, .72 + n * .1] : [.9, .8 + n * .1, .8]; },
  22: (x, y, t, n, s) => { const cx = (tn(x >> 2, y >> 2, s) > .55) && (x % 4 > 0 && y % 4 > 0); return cx ? [1.6, 1.0 + n * .3, 1.5] : [.42 + n * .1, .4, .44]; }
};
const ENT_PAINT = {
  [TILE.GRAIN]: (x, y, t, n) => .92 + (n - .5) * .2,
  [TILE.PLATE]: (x, y, t, n) => (x === 0 || y === 0 ? .72 : (x === 2 || x === 13) && (y === 2 || y === 13) ? 1.3 : .98 + (tn(0, y, 5) - .5) * .1 + (n - .5) * .05),
  [TILE.FLESHY]: (x, y, t, n) => (Math.sin(x * .8 + Math.sin(y * .6) * 2.2) > .8 ? [.95, .7, .75] : .96 + (n - .5) * .22),
  [TILE.BONEY]: (x, y, t, n) => (y % 4 === 0 ? .84 : 1.02 + (n - .5) * .12),
  [TILE.GLOW]: (x, y, t, n) => 1.05 + (y & 3 ? 0 : -.12) + (n - .5) * .08,
  [TILE.CLOTH]: (x, y, t, n) => ((x + y) & 1 ? .88 : 1.0) + (n - .5) * .08
};
function makeAtlas() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const cx = cv.getContext('2d'), img = cx.createImageData(256, 256), d = img.data;
  const avg = new Uint8Array(256 * 3);
  for (let ti = 0; ti < 256; ti++) {
    const ox = (ti % 16) * 16, oy = Math.floor(ti / 16) * 16, id = ti >> 1, top = ti & 1; let ar = 0, ag = 0, ab = 0;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      let m = .625;                                                   // neutral
      if (ti >= 64 && ENT_PAINT[ti]) m = ENT_PAINT[ti](x, y, 0, tn(x, y, ti));
      else if (ti > 0 && ti < 64 && PAINT[id]) m = PAINT[id](x, y, top, tn(x, y, id * 7 + top), id * 31 + top);
      else if (ti > 0 && ti < 64) m = .95 + (tn(x, y, ti) - .5) * .2;    // unpainted block id: plain grain
      const rgb = typeof m === 'number' ? [m, m, m] : m, i = ((oy + y) * 256 + ox + x) * 4;
      const r = Math.max(0, Math.min(255, Math.round(rgb[0] * 160))), g = Math.max(0, Math.min(255, Math.round(rgb[1] * 160))), b = Math.max(0, Math.min(255, Math.round(rgb[2] * 160)));
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; ar += r; ag += g; ab += b;
    }
    avg[ti * 3] = ar / 256; avg[ti * 3 + 1] = ag / 256; avg[ti * 3 + 2] = ab / 256;
  }
  cx.putImageData(img, 0, 0); return { canvas: cv, avg };
}
