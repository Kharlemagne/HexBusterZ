// ---------------- minimap ----------------
const mini = $('mini'), mctx = mini.getContext('2d');
function drawMini() {
  mctx.clearRect(0, 0, mini.width, mini.height);
  if (mode !== 'dungeon') return;
  const cs = 16, gap = 4, st = cs + gap;
  for (const r of Run.rooms) {
    if (!r.known) continue;
    const big = r.sz > CELL, x = (r.ox / CELL) * st + 2, y = (r.oz / CELL) * st + 2, w = big ? cs * 2 + gap : cs;
    const lx = r.gx * st + 2, ly = r.gz * st + 2;
    for (const d of DIRS) if (r.doors[d.k] && (d.k === 'E' || d.k === 'S')) { const n = Run.map.get((r.gx + d.dx) + ',' + (r.gz + d.dz)); if (n && n.known) { mctx.fillStyle = '#777'; mctx.fillRect(lx + (d.dx ? cs : cs / 2 - 1), ly + (d.dz ? cs : cs / 2 - 1), d.dx ? gap : 3, d.dz ? gap : 3); } }
    if (big) for (const d of DIRS) if (r.doors[d.k] && (d.k === 'W' || d.k === 'N')) { mctx.fillStyle = r.locked ? '#d9a441' : '#777'; mctx.fillRect(lx + (d.dx ? -gap : cs / 2 - 1), ly + (d.dz ? -gap : cs / 2 - 1), d.dx ? gap : 3, d.dz ? gap : 3); }
    let c = r.visited ? (r.state === 'cleared' ? '#5a4a52' : r.state === 'active' ? '#ff6a1a' : '#8a7a82') : '#2a2024';
    mctx.fillStyle = c; mctx.fillRect(x, y, w, w);
    if (r.type === 'boss') { mctx.fillStyle = r.locked ? '#d9a441' : '#ff2a3a'; mctx.fillRect(x + w / 2 - 5, y + w / 2 - 5, 10, 10); if (r.locked) { mctx.fillStyle = '#000'; mctx.fillRect(x + w / 2 - 1, y + w / 2 - 2, 2, 4); } }
    else if (r.type === 'treasure' && r.known) { mctx.fillStyle = Run.hasKey ? '#555' : '#ffd23a'; mctx.fillRect(x + 5, y + 5, 6, 6); }
    else if (r.type === 'start') { mctx.fillStyle = '#6ec8ff'; mctx.fillRect(x + 6, y + 6, 4, 4); }
    if (r === Run.cur) { mctx.strokeStyle = '#fff'; mctx.lineWidth = 2; mctx.strokeRect(x - 1, y - 1, w + 2, w + 2); }
  }
  if (Run.cur) { const px = (P.x / CELL) * st + 2, pz = (P.z / CELL) * st + 2; mctx.fillStyle = '#fff'; mctx.fillRect(px - 2, pz - 2, 4, 4); }
}

