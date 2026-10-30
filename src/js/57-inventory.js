// ============================================================
//  INVENTORY — 36 slots (the first 9 are the dig-kit hotbar). Items are block ids (numbers) or special items (strings).
//  Breaking a block puts it in your inventory; placing one uses it up (unless CREATIVE is on). Saved with your profile
//  (SaveStore.doc.inv); every player's inventory is their own, even in co-op.
// ============================================================
const ITEMS = { shard: { name: 'DEMON SHARD', color: '#ff6ad0', value: 3 } };          // non-block items; shards sell to Vex for gems
const STACK_MAX = 99;
const itemName = k => typeof k === 'number' ? (DATA.blocks.names[k] || 'BLOCK ' + k) : (ITEMS[k] ? ITEMS[k].name : String(k));
const itemColor = k => typeof k === 'number' ? (DATA.blocks.colors[k] || '#888') : (ITEMS[k] ? ITEMS[k].color : '#888');
const dropOf = id => id === 22 ? ['shard', 1 + ((Math.random() * 2) | 0)] : [id, 1];     // ore drops shards, everything else drops itself
const Inv = {
  slots: new Array(36).fill(null), sel: 0, creative: false, cursor: null, shown: '',
  load() {
    const c = WorldStore.cur, d = c && c.data.inv;
    this.slots = new Array(36).fill(null); this.sel = 0; this.creative = false; this.cursor = null;
    if (d && Array.isArray(d.slots)) { d.slots.slice(0, 36).forEach((s, i) => { if (Array.isArray(s) && s[1] > 0) this.slots[i] = { k: s[0], n: Math.min(STACK_MAX, s[1] | 0) }; }); this.sel = clamp(d.sel | 0, 0, 8); this.creative = !!d.creative; }
    else { [2, 1, 3, 5, 7, 8, 6, 12, 13].forEach((id, i) => { this.slots[i] = { k: id, n: 64 }; }); if (c && c.meta.mode === 'creative') this.creative = true; this.collect(); }          // a starter kit for new (and upgraded) profiles
  },
  collect() { const c = WorldStore.cur; if (!c || c.ephemeral) return; c.data.inv = { slots: this.slots.map(s => s ? [s.k, s.n] : 0), sel: this.sel, creative: this.creative }; },
  changed() { SaveStore.dirty = true; this.shown = ''; },
  add(k, n) {                                                                       // returns how many did not fit
    for (let pass = 0; pass < 2 && n > 0; pass++) for (let i = 0; i < 36 && n > 0; i++) {
      const s = this.slots[i];
      if (pass === 0 && s && s.k === k && s.n < STACK_MAX) { const m = Math.min(n, STACK_MAX - s.n); s.n += m; n -= m; }
      else if (pass === 1 && !s) { const m = Math.min(n, STACK_MAX); this.slots[i] = { k, n: m }; n -= m; }
    }
    this.changed(); return n;
  },
  count(k) { let c = 0; for (const s of this.slots) if (s && s.k === k) c += s.n; return c; },
  remove(k, n) { for (let i = 0; i < 36 && n > 0; i++) { const s = this.slots[i]; if (s && s.k === k) { const m = Math.min(n, s.n); s.n -= m; n -= m; if (!s.n) this.slots[i] = null; } } this.changed(); },
  useSel() { const s = this.slots[this.sel]; if (!s) return false; if (!this.creative) { s.n--; if (s.n <= 0) this.slots[this.sel] = null; this.changed(); } return true; },
  selBlock() { const s = this.slots[this.sel]; return s && typeof s.k === 'number' ? s.k : (this.creative ? DATA.blocks.build[0][0] : 0); },
  cycle(dir) {                                                                      // mouse wheel / d-pad: next hotbar slot that holds a block
    for (let i = 1; i <= 9; i++) { const j = (this.sel + dir * i + 90) % 9, s = this.slots[j]; if (s && typeof s.k === 'number') { this.sel = j; this.changed(); return; } }
  },
  sort() {
    const all = []; for (let i = 9; i < 36; i++) if (this.slots[i]) all.push(this.slots[i]);
    const m = new Map(); for (const s of all) m.set(s.k, (m.get(s.k) || 0) + s.n);
    const out = []; for (const [k, n] of [...m].sort((a, b) => String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true }))) { let r = n; while (r > 0) { out.push({ k, n: Math.min(STACK_MAX, r) }); r -= STACK_MAX; } }
    for (let i = 9; i < 36; i++) this.slots[i] = out[i - 9] || null; this.changed();
  },
  // ---- click handling (left = pick up / put down / swap / merge, right = half / one, shift = move between hotbar and bag)
  click(i, right, shift) {
    const s = this.slots[i], c = this.cursor;
    if (shift && s && !c) { const from = i < 9 ? 9 : 0, to = i < 9 ? 36 : 9; this.slots[i] = null; for (let j = from; j < to && s.n > 0; j++) { const t = this.slots[j]; if (t && t.k === s.k && t.n < STACK_MAX) { const m = Math.min(s.n, STACK_MAX - t.n); t.n += m; s.n -= m; } } for (let j = from; j < to && s.n > 0; j++) if (!this.slots[j]) { this.slots[j] = { k: s.k, n: s.n }; s.n = 0; } if (s.n > 0) this.slots[i] = s; }
    else if (!c) { if (!s) return; if (right && s.n > 1) { const h = Math.ceil(s.n / 2); this.cursor = { k: s.k, n: h }; s.n -= h; } else { this.cursor = s; this.slots[i] = null; } }
    else if (!s) { if (right && c.n > 1) { this.slots[i] = { k: c.k, n: 1 }; c.n--; } else { this.slots[i] = c; this.cursor = null; } }
    else if (s.k === c.k) { const m = right ? Math.min(1, STACK_MAX - s.n) : Math.min(c.n, STACK_MAX - s.n); s.n += m; c.n -= m; if (c.n <= 0) this.cursor = null; }
    else if (!right) { this.slots[i] = c; this.cursor = s; }
    this.changed(); renderInv();
  }
};
let invOpen = false;
function openInv() {
  if (state !== 'play') return;
  state = 'inv'; invOpen = true; mouse.l = mouse.r = false; try { document.exitPointerLock(); } catch (e) { }
  renderInv(); el.inv.classList.add('on');
}
function closeInv() {
  if (state !== 'inv') return;
  if (Inv.cursor) { const left = Inv.add(Inv.cursor.k, Inv.cursor.n); Inv.cursor = null; if (left) feed('INVENTORY FULL — ' + left + ' LOST', '#ff8a3a'); }
  state = 'play'; invOpen = false; el.inv.classList.remove('on'); el.invcur.style.display = 'none';
  try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { }
  saveSoon();
}
const invCell = (s, i, extra) => '<div class="ic' + (i < 9 ? ' hb' : '') + (i === Inv.sel ? ' sel' : '') + (extra || '') + '" onclick="Inv.click(' + i + ',false,event.shiftKey)" oncontextmenu="Inv.click(' + i + ',true,event.shiftKey);return false">'
  + (s ? '<u style="background:' + itemColor(s.k) + '"></u><em>' + itemName(s.k) + '</em><b>' + s.n + '</b>' : '') + (i < 9 ? '<small>' + (i + 1) + '</small>' : '') + '</div>';
function renderInv() {
  let h = '<div class="sh-t">INVENTORY</div><div class="sh-g">◆ ' + Save.gems + ' GEMS · ' + Inv.count('shard') + ' SHARDS</div><div class="ig">';
  for (let i = 9; i < 36; i++) h += invCell(Inv.slots[i], i);
  h += '</div><div class="ig hbrow">'; for (let i = 0; i < 9; i++) h += invCell(Inv.slots[i], i); h += '</div>';
  if (Inv.creative) { h += '<div class="sb-l">CREATIVE — click a block to grab a full stack</div><div class="ig cat">'; for (const [id, nm] of DATA.blocks.build) h += '<div class="ic" onclick="Inv.cursor={k:' + id + ',n:99};renderInv()"><u style="background:' + itemColor(id) + '"></u><em>' + nm + '</em></div>'; h += '</div>'; }
  h += '<div class="invbtn"><button onclick="Inv.sort();renderInv()">SORT BAG</button><button onclick="Inv.cursor=null;Inv.changed();renderInv()">TRASH HELD</button><button onclick="Inv.creative=!Inv.creative;Inv.changed();renderInv()">CREATIVE: ' + (Inv.creative ? 'ON' : 'OFF') + '</button><button onclick="closeInv()">CLOSE (I)</button></div>';
  h += '<div class="sh-f">CLICK pick up / drop / swap · RIGHT-CLICK half or one · SHIFT-CLICK bag ⇄ hotbar · wheel cycles the hotbar with the dig kit</div>';
  el.inv.innerHTML = h; updateInvCursor();
}
function updateInvCursor() {
  const c = Inv.cursor, e = el.invcur; if (!invOpen || !c) { e.style.display = 'none'; return; }
  e.style.display = 'block'; e.style.left = (mpos.x + 10) + 'px'; e.style.top = (mpos.y + 10) + 'px'; e.innerHTML = '<u style="background:' + itemColor(c.k) + '"></u>' + itemName(c.k) + ' ×' + c.n;
}
function drawBuildBar() {                                                           // the little 9-slot bar shown while the dig kit is in hand
  const showB = P.weapon === 4; css(el.bsel, 'display', showB ? 'flex' : 'none'); if (!showB) return;
  let key = '' + Inv.sel + Inv.creative; for (let i = 0; i < 9; i++) { const s = Inv.slots[i]; key += s ? s.k + ':' + s.n + ',' : '-,'; }
  if (key === Inv.shown) return; Inv.shown = key;
  let h = ''; for (let i = 0; i < 9; i++) { const s = Inv.slots[i]; h += '<div class="bc' + (i === Inv.sel ? ' sel' : '') + '">' + (s ? '<u style="background:' + itemColor(s.k) + '"></u><b>' + (Inv.creative && typeof s.k === 'number' ? '∞' : s.n) + '</b>' : '') + '</div>'; }
  el.bsel.innerHTML = h + '<div class="bn">' + (Inv.slots[Inv.sel] ? itemName(Inv.slots[Inv.sel].k) : 'EMPTY') + '</div>';
}
