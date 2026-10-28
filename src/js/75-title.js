// ---------------- pixel-art eldritch-cyberpunk title: HEXBUSTER Z ----------------
const TG = {
  H: ['X...X', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'], E: ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'XXXXX'], X: ['X...X', 'X...X', '.X.X.', '..X..', '.X.X.', 'X...X', 'X...X'],
  B: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X...X', 'X...X', 'XXXX.'], U: ['X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'], S: ['.XXXX', 'X....', 'X....', '.XXX.', '....X', '....X', 'XXXX.'],
  T: ['XXXXX', '..X..', '..X..', '..X..', '..X..', '..X..', '..X..'], R: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X.X..', 'X..X.', 'X...X'], Z: ['XXXXX', '....X', '...X.', '..X..', '.X...', 'X....', 'XXXXX']
};
const titleCv = $('titlecv'), titleCtx = titleCv ? titleCv.getContext('2d') : null;
const tLayer = document.createElement('canvas'), tTint = document.createElement('canvas'); tLayer.width = tTint.width = 80; tLayer.height = tTint.height = 50;
const tl = tLayer.getContext('2d'), tt = tTint.getContext('2d');
const TCOL = ['#a8fbff', '#7ff3ff', '#5ad8ff', '#4aa8ff', '#7a7cff', '#a85cff', '#d84bff'], ZCOL = ['#fff27a', '#ffc84a', '#ff8a3a', '#ff4a7a', '#ff2bd6', '#c02bff', '#7a2cff', '#4a1a8a'];
const TSP = []; for (let i = 0; i < 16; i++) TSP.push({ x: Math.random() * 80, y: Math.random() * 50, v: .6 + Math.random() * 1.6, c: Math.random() < .5 ? '#00f0ff' : '#ff2bd6' });
const tr = n => { const v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v); };
function drawTitle(t) {
  if (!titleCtx) return;
  const L = tl; L.clearRect(0, 0, 80, 50);
  const px = (x, y, c) => { L.fillStyle = c; L.fillRect(x | 0, y | 0, 1, 1); };
  const pts = [], zp = []; let x = 4; const y0 = 15;
  for (const ch of 'HEXBUSTER') { TG[ch].forEach((row, r) => { for (let c = 0; c < 5; c++) if (row[c] === 'X') pts.push([x + c, y0 + r, r]); }); x += 6; }
  const zx = x + 2, zy = y0 - 6; TG.Z.forEach((row, r) => { for (let c = 0; c < 5; c++) if (row[c] === 'X') for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) zp.push([zx + c * 2 + dx, zy + r * 2 + dy, r * 2 + dy]); });
  // tendrils crawling out from under the wordmark
  const base = y0 + 7;
  for (let k = 0; k < 13; k++) {
    const bx = 5 + k * 4.2, len = 5 + ((k * 7) % 9);
    for (let j = 0; j < len; j++) { const dx = Math.round(Math.sin(t * 2.1 + k + j * .55) * (1 + j * .12)); px(bx + dx, base + 1 + j, j > len - 3 ? '#ff2bd6' : (j % 3 === 1 ? '#00c8e8' : (j < len * .6 ? '#5a2ad0' : '#2e1070'))); }
  }
  // outline + shadow + fill
  for (const [ox, oy] of [[1, 2], [0, 1]]) for (const p of pts.concat(zp)) px(p[0] + ox, p[1] + oy, '#2a0a66');
  for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) for (const p of pts.concat(zp)) px(p[0] + ox, p[1] + oy, '#05031a');
  for (const p of pts) px(p[0], p[1], TCOL[p[2]]);
  for (const p of zp) px(p[0], p[1], ZCOL[Math.min(7, p[2] >> 1)]);
  // eldritch eyes watching from above
  [[11, 4], [34, 2], [57, 4]].forEach(([ex, ey], k) => {
    const blink = ((t * .7 + k * 1.3) % 4) < .14, lx = Math.round(Math.sin(t * .8 + k) * 1);
    for (let i = -1; i <= 5; i++) px(ex + i, ey - 1 + (i === -1 || i === 5 ? 1 : 0), '#2a0a5a');
    if (blink) { for (let i = 0; i < 5; i++) px(ex + i, ey + 1, '#7a2cff'); return; }
    for (let i = 0; i < 5; i++) { px(ex + i, ey, '#eaffff'); px(ex + i, ey + 1, '#cfe9ff'); }
    px(ex + 1 + lx + 1, ey, '#ff2bd6'); px(ex + 1 + lx + 1, ey + 1, '#ff2bd6'); px(ex + 2 + lx + 1, ey, '#ff2bd6'); px(ex + 2 + lx + 1, ey + 1, '#2a0a5a'); px(ex + 1 + lx, ey, '#ff2bd6');
    for (let i = -1; i <= 5; i++) px(ex + i, ey + 2 + (i === -1 || i === 5 ? -1 : 0), '#2a0a5a');
  });
  // drifting data-motes
  for (const s of TSP) { s.y -= s.v * .03; if (s.y < 0) { s.y = 49; s.x = Math.random() * 80; } if (((t * 3 + s.x) % 2) < 1.4) px(s.x, s.y, s.c); }
  // compose with chromatic split + glitch slices
  const C = titleCtx; C.clearRect(0, 0, 80, 50);
  const tint = (col, ox, oy, a) => { tt.clearRect(0, 0, 80, 50); tt.globalCompositeOperation = 'source-over'; tt.drawImage(tLayer, 0, 0); tt.globalCompositeOperation = 'source-in'; tt.fillStyle = col; tt.fillRect(0, 0, 80, 50); tt.globalCompositeOperation = 'source-over'; C.globalAlpha = a; C.drawImage(tTint, ox, oy); C.globalAlpha = 1; };
  const slot = Math.floor(t * 7), glitch = tr(slot) < .24;
  if (glitch) { tint('#ff2bd6', -1, 0, .8); tint('#00f0ff', 1, 0, .8); }
  C.drawImage(tLayer, 0, 0);
  if (glitch) { for (let i = 0; i < 3; i++) { const sy = Math.floor(tr(slot + i * 3.7) * 44), sh = 1 + Math.floor(tr(slot + i) * 4), so = Math.round((tr(slot * 2 + i) - .5) * 8); C.clearRect(0, sy, 80, sh); C.drawImage(tLayer, 0, sy, 80, sh, so, sy, 80, sh); } }
}
