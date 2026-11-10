// ============================================================
//  ITEM ICONS — the little 2D picture for every block / item in the hotbar, inventory, creative palette and cursor tip.
//  Blocks are drawn as a tiny isometric cube using the SAME painted textures and colours the game world uses (so NETHERRACK looks like netherrack,
//  CIRCUIT like circuit, neon blocks glow); the demon shard is a hand-drawn crystal. Each icon is made once and cached as an image.
// ============================================================

const ICON_CACHE = new Map(), ICON_N = 64;
const iconPx = () => { if (!ATLAS_PX && ATLAS_CV) ATLAS_PX = ATLAS_CV.getContext('2d').getImageData(0, 0, 256, 256).data; return ATLAS_PX; };
function iconCanvas() { const c = document.createElement('canvas'); c.width = c.height = ICON_N; return c; }
function cubeIcon(id) {
  const px = iconPx(); if (!px) return null;
  const base = BASE[id] || id, col = COL[id] || COL[base] || [.55, .55, .55], emit = EMIT.has(id) || EMIT.has(base);
  const tTop = blockTile(id, true), tSide = blockTile(id, false), c = iconCanvas(), cx = c.getContext('2d'), img = cx.createImageData(ICON_N, ICON_N), d = img.data;
  const tex = (ti, u, v) => { const o = (((ti >> 4) * 16 + Math.min(15, v * 16 | 0)) * 256 + (ti & 15) * 16 + Math.min(15, u * 16 | 0)) * 4; return [px[o] / 160, px[o + 1] / 160, px[o + 2] / 160]; };
  const put = (x, y, t, sh) =>   /* gamma .78 lifts dark blocks (obsidian, void stone) so they stay readable */ { const m = tex(t.ti, t.u, t.v), i = (y * ICON_N + x) * 4, g = emit ? 1.18 : sh * 1.12; for (let k = 0; k < 3; k++) d[i + k] = Math.max(0, Math.min(255, Math.round(Math.pow(Math.min(1, m[k] * col[k] * g), .78) * 255))); d[i + 3] = 255; };
  for (let y = 0; y < ICON_N; y++) for (let x = 0; x < ICON_N; x++) {
    const X = x + .5, Y = y + .5; let dx = X - 32, dy = Y - 6, u = (dx / 26 + dy / 13) / 2, v = (dy / 13 - dx / 26) / 2;     // top face
    if (u >= 0 && u < 1 && v >= 0 && v < 1) { put(x, y, { ti: tTop, u, v }, 1); continue; }
    u = (X - 6) / 26; v = (Y - 19 - 13 * u) / 26;                                                                 // left face
    if (u >= 0 && u < 1 && v >= 0 && v < 1) { put(x, y, { ti: tSide, u, v }, .78); continue; }
    u = (X - 32) / 26; v = (Y - 32 + 13 * u) / 26;                                                                // right face
    if (u >= 0 && u < 1 && v >= 0 && v < 1) put(x, y, { ti: tSide, u, v }, .56);
  }
  const o = new Uint8ClampedArray(d);                                // dark outline: any filled pixel touching an empty one
  for (let y = 0; y < ICON_N; y++) for (let x = 0; x < ICON_N; x++) { const i = (y * ICON_N + x) * 4; if (!o[i + 3]) continue;
    if (x === 0 || y === 0 || x === ICON_N - 1 || y === ICON_N - 1 || !o[i - 1] || !o[i + 7] || !o[i - ICON_N * 4 + 3] || !o[i + ICON_N * 4 + 3]) { d[i] *= .45; d[i + 1] *= .45; d[i + 2] *= .45; } }
  cx.putImageData(img, 0, 0); return c.toDataURL();
}
function shardIcon() {
  const c = iconCanvas(), x = c.getContext('2d'), P = (a, f) => { x.beginPath(); x.moveTo(...a[0]); for (let i = 1; i < a.length; i++) x.lineTo(...a[i]); x.closePath(); x.fillStyle = f; x.fill(); };
  const T = [32, 3], L = [14, 26], R = [50, 26], B = [32, 61], C = [32, 28], M1 = [23, 27], M2 = [41, 27];
  P([T, L, C], '#ffb3ea'); P([T, R, C], '#ff6ad0'); P([L, B, C], '#c63fa6'); P([R, B, C], '#8a2a8c'); P([T, M1, C], '#ffd9f5'); P([T, M2, C], '#ff8ee0');
  x.strokeStyle = '#2a0828'; x.lineWidth = 2.4; x.lineJoin = 'round'; x.beginPath(); x.moveTo(...T); x.lineTo(...R); x.lineTo(...B); x.lineTo(...L); x.closePath(); x.stroke();
  x.lineWidth = 1.2; x.beginPath(); x.moveTo(...T); x.lineTo(...C); x.lineTo(...B); x.moveTo(...L); x.lineTo(...C); x.lineTo(...R); x.stroke();
  x.strokeStyle = '#fff'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(24, 14); x.lineTo(29, 9); x.moveTo(52, 8); x.lineTo(52, 15); x.moveTo(49, 11.5); x.lineTo(55, 11.5); x.stroke();
  return c.toDataURL();
}
function bucketIcon(k) {
  const c = iconCanvas(), x = c.getContext('2d'), P = (a, f) => { x.beginPath(); x.moveTo(...a[0]); for (let i = 1; i < a.length; i++) x.lineTo(...a[i]); x.closePath(); x.fillStyle = f; x.fill(); };
  P([[14, 18], [50, 18], [44, 54], [20, 54]], '#8a929a'); P([[14, 18], [50, 18], [48, 24], [16, 24]], '#c4ccd4'); P([[20, 54], [44, 54], [45, 48], [19, 48]], '#6a727a');
  if (k !== 'bucket') P([[17, 26], [47, 26], [46, 32], [18, 32]], k === 'bucket_lava' ? '#ff7a1a' : '#07070f');
  x.strokeStyle = '#2a2e34'; x.lineWidth = 2; x.beginPath(); x.moveTo(14, 18); x.lineTo(20, 54); x.lineTo(44, 54); x.lineTo(50, 18); x.stroke();
  x.beginPath(); x.arc(32, 18, 16, Math.PI, 0); x.stroke(); return c.toDataURL();
}
function itemIcon(k) {
  let u = ICON_CACHE.get(k); if (u) return u;
  try { u = k === 'shard' ? shardIcon() : isBucket(k) ? bucketIcon(k) : typeof k === 'number' ? cubeIcon(k) : null; } catch (e) { u = null; }
  if (!u) { const c = iconCanvas(), x = c.getContext('2d'); x.fillStyle = itemColor(k); x.fillRect(10, 10, 44, 44); u = c.toDataURL(); if (k !== 'shard' && !(typeof k === 'number' && !ATLAS_CV)) { } }
  if (typeof k !== 'number' || ATLAS_CV) ICON_CACHE.set(k, u);        // before the atlas exists a block only gets a stand-in, which must not be cached
  return u;
}
const iconTag = k => '<u class="ico" style="background-image:url(' + itemIcon(k) + ')"></u>';
