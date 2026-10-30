// ============================================================
//  MENUS — Minecraft-style title screen, world list / create world, options, pause menu.
//  One container (#mscreen) is re-rendered per screen; clicks are handled by data-act delegation.
// ============================================================
const SPLASHES = ['Also try HELLGATES!', 'Hurtling through the deep!', 'The Helicarrier is always home!', 'Don\'t look at the sun!', 'Skeleton robot, black!', 'Bullet time!', '100% voxel!', 'Now with half blocks!', 'Eldritch-approved!', 'Mind the lava.', 'Seeds are forever!', 'Press I for your backpack!', 'Slide into the shield!', 'The moon blinks.', 'Cyberpunk, but worse!', 'Made with Claude!'];
const SAVE_SLOTS = 4;
const Menu = {
  stack: ['title'], sel: '', hostMode: false, msg: '', busy: false,
  go(name, arg) { this.stack.push(name); this.arg = arg; this.render(); },
  back() { if (this.stack.length > 1) { this.stack.pop(); this.render(); } else if (state === 'paused') resumeGame(); },
  show(name) { this.stack = [name]; this.msg = ''; this.render(); },
  top() { return this.stack[this.stack.length - 1]; },
  render() {
    this.pf = 0; const t = this.top(), h = SCREENS[t] ? SCREENS[t]() : ''; $('mscreen').innerHTML = h; $('mscreen').dataset.screen = t;
    el.menu.classList.toggle('pause', state === 'paused'); el.menu.classList.toggle('sub', t !== 'title' && state !== 'paused');
    const f = $('mscreen').querySelector('[data-focus]'); if (f && f.tagName === 'INPUT') setTimeout(() => { try { f.focus(); f.select(); } catch (e) { } }, 30);
  },
  say(m) { this.msg = m; const e = $('mmsg'); if (e) e.textContent = m; }
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const btn = (act, label, cls = '', attrs = '') => '<button class="mb ' + cls + '" data-act="' + act + '" ' + attrs + '>' + label + '</button>';
const fmtDate = ms => { const d = new Date(ms); return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); };
function seedFromText(s) {                                       // like Minecraft: a number is used as is, any other text is hashed, blank = random
  s = String(s || '').trim(); if (!s) return ((Math.random() * 4294967295) >>> 0) || 1;
  if (/^-?\d{1,10}$/.test(s)) return (parseInt(s, 10) >>> 0) || 1;
  let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) || 1;
}
const OPTS = [                                                    // [key, label, min, max, step, formatter]
  ['music', 'MUSIC', 0, 1, .05, v => Math.round(v * 100) + '%'], ['sfx', 'SOUND EFFECTS', 0, 1, .05, v => Math.round(v * 100) + '%'],
  ['renderDist', 'RENDER DISTANCE', 3, 12, 1, v => v + ' CHUNKS'], ['fov', 'FIELD OF VIEW', 60, 110, 1, v => v + '°'],
  ['sens', 'MOUSE SENSITIVITY', .25, 2, .05, v => Math.round(v * 100) + '%'], ['shake', 'SCREEN SHAKE', 0, 1, .05, v => Math.round(v * 100) + '%']
];
const optV = k => { const v = SaveStore.doc.settings[k]; return v === undefined || v === null ? ({ music: .7, sfx: .8, renderDist: 7, fov: 93, sens: 1, shake: 1 })[k] : v; };
const SCREENS = {
  title() {
    return btn('sp', 'SINGLEPLAYER') + btn('mp', 'MULTIPLAYER') + btn('opt', 'OPTIONS', 'h') + btn('ctl', 'CONTROLS', 'h') + btn('savedata', 'SAVE DATA · EXPORT / IMPORT', 'sm')
      + '<div id="mmsg" class="mmsg">' + esc(Menu.msg) + '</div>';
  },
  worlds() {
    const ws = WorldStore.list(), host = Menu.hostMode;
    if (!ws.some(w => w.id === Menu.sel)) Menu.sel = ws.length ? ws[0].id : '';
    let h = '<div class="mh">' + (host ? 'SELECT A SAVE TO HOST' : 'SELECT SAVE SLOT') + '</div><div class="wlist">';
    for (const w of ws) {
      const hue = w.seed % 360;
      h += '<div class="wl' + (w.id === Menu.sel ? ' sel' : '') + '" data-act="pick" data-id="' + w.id + '"><i style="background:linear-gradient(135deg,hsl(' + hue + ',70%,32%),hsl(' + ((hue + 60) % 360) + ',80%,18%))"></i><div><b>' + esc(w.name) + '</b><span>' + (w.mode === 'creative' ? 'CREATIVE' : 'SURVIVAL') + ' · ' + (w.gen === 3 ? 'SPACE STATION' : (w.gen === 2 ? 'FLOATING ISLANDS' : 'CLASSIC')) + ' · SEED ' + w.seed + '</span><span>CREATED ' + fmtDate(w.created) + ' · LAST PLAYED ' + fmtDate(w.played) + '</span></div></div>';
    }
    for (let i = ws.length; i < SAVE_SLOTS; i++) h += '<div class="wl empty" data-act="create"><i style="background:#120a22"></i><div><b>SLOT ' + (i + 1) + ' · EMPTY</b><span>CLICK TO START A NEW GAME</span></div></div>';
    h += '</div>' + btn('play', host ? 'HOST SELECTED SAVE' : 'PLAY SELECTED SAVE', '', ws.length ? '' : 'disabled') + btn('create', 'NEW GAME', 'h', ws.length >= SAVE_SLOTS ? 'disabled' : '') + btn('rename', 'RENAME', 'h', ws.length ? '' : 'disabled') + btn('delete', 'DELETE', 'h', ws.length ? '' : 'disabled') + btn('back', 'CANCEL', 'h') + '<div id="mmsg" class="mmsg">' + esc(Menu.msg) + '</div>';
    return h;
  },
  create() {
    const mode = Menu.newMode || 'survival';
    return '<div class="mh">NEW GAME</div><div class="fld"><label>SAVE NAME</label><input id="f-name" data-focus maxlength="32" value="' + esc(Menu.newName || 'NEW WORLD') + '"></div>'
      + btn('mode', 'GAME MODE: ' + (mode === 'creative' ? 'CREATIVE (INFINITE BLOCKS)' : 'SURVIVAL')) + '<div class="mnote">YOUR SAVE LIVES ON THE HELICARRIER. ENTER COORDINATES AT THE RIFT CONSOLE TO TRAVEL TO REALMS. THE SAME COORDINATES ALWAYS LEAD TO THE SAME REALM.</div>'
      + btn('docreate', 'START NEW GAME') + btn('back', 'CANCEL') + '<div id="mmsg" class="mmsg">' + esc(Menu.msg) + '</div>';
  },
  rename() {
    const w = WorldStore.find(Menu.sel); return '<div class="mh">RENAME WORLD</div><div class="fld"><label>WORLD NAME</label><input id="f-name" data-focus maxlength="32" value="' + esc(w ? w.name : '') + '"></div>' + btn('dorename', 'SAVE') + btn('back', 'CANCEL');
  },
  confirmdel() {
    const w = WorldStore.find(Menu.sel); return '<div class="mh">DELETE WORLD?</div><div class="mnote big">"' + esc(w ? w.name : '') + '" WILL BE LOST FOREVER (A REAL LONG TIME!)</div>' + btn('dodelete', 'YES, DELETE IT', 'danger') + btn('back', 'NO, KEEP IT');
  },
  mp() {
    return '<div class="mh">MULTIPLAYER</div><div class="fld"><label>ROOM CODE</label><input id="f-code" data-focus maxlength="5" placeholder="ABCDE" style="text-transform:uppercase;letter-spacing:10px;text-align:center"></div>'
      + btn('join', 'JOIN GAME') + btn('hostpick', 'HOST A WORLD') + btn('coopadv', 'ADVANCED · MANUAL CODES · CONNECTION TEST', 'sm') + btn('back', 'BACK')
      + '<div class="mnote">PLAY WITH A FRIEND: THE HOST PICKS A WORLD AND GETS A 5-LETTER ROOM CODE; THE FRIEND TYPES IT HERE.</div><div id="mmsg" class="mmsg">' + esc(Menu.msg) + '</div>';
  },
  options() {
    let h = '<div class="mh">OPTIONS</div>';
    for (const [k, label, min, max, step, fmt] of OPTS) { const v = optV(k); h += '<label class="msl"><span data-lab="' + k + '">' + label + ': ' + fmt(v) + '</span><input type="range" data-set="' + k + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + v + '"></label>'; }
    const st = SaveStore.doc.settings;
    h += btn('tinv', 'INVERT MOUSE Y: ' + (st.invertY ? 'ON' : 'OFF'), 'h') + btn('tclock', 'SHOW CLOCK: ' + (st.clock !== false ? 'ON' : 'OFF'), 'h') + btn('tmute', 'SOUND: ' + (muted ? 'MUTED' : 'ON'), 'h') + btn('full', 'FULLSCREEN', 'h')
      + btn('pad', 'CONTROLLER SETUP…', 'h') + btn('ctl', 'CONTROLS…', 'h') + btn('back', 'DONE');
    return h;
  },
  controls() { return '<div class="mh">CONTROLS</div>' + $('ctlsrc').innerHTML + btn('back', 'DONE'); },
  pause() {
    const c = WorldStore.cur, online = Net.role !== 'offline';
    let h = '<div class="mh">GAME MENU</div>' + btn('resume', 'BACK TO GAME') + btn('opt', 'OPTIONS', 'h') + btn('ctl', 'CONTROLS', 'h');
    if (Net.role === 'host') h += '<div class="mroom">ROOM CODE: <b>' + esc(Coop.code || '…') + '</b> · ' + (players.length - 1) + ' FRIEND(S) CONNECTED</div>';
    else if (Net.role === 'offline') h += btn('opencoop', 'OPEN TO CO-OP');
    h += btn('quit', online ? 'DISCONNECT AND QUIT TO TITLE' : 'SAVE AND QUIT TO TITLE', 'sm');
    h += '<div class="mnote">' + (c && !c.ephemeral ? esc(c.meta.name) + ' · SEED ' + c.meta.seed + ' · ' : '') + DayNight.clock() + '</div><div id="mmsg" class="mmsg">' + esc(Menu.msg) + '</div>';
    return h;
  }
};
// ---------------- actions ----------------
const ACT = {
  sp() { Menu.hostMode = false; Menu.go('worlds'); }, mp() { Menu.go('mp'); }, opt() { Menu.go('options'); }, ctl() { Menu.go('controls'); }, back() { Menu.back(); },
  savedata() { openSaveBox(); }, coopadv() { openCoopBox(); },
  pick(t) { Menu.sel = t.dataset.id; document.querySelectorAll('.wl').forEach(e => e.classList.toggle('sel', e.dataset.id === Menu.sel)); },
  play() { if (Menu.sel) startWorld(Menu.sel, Menu.hostMode); },
  create() { if (WorldStore.list().length >= SAVE_SLOTS) { Menu.msg = 'ALL 4 SAVE SLOTS ARE FULL — DELETE ONE FIRST'; Menu.render && Menu.render(); return; } Menu.newName = ''; Menu.newSeed = ''; Menu.newMode = 'survival'; Menu.msg = ''; Menu.go('create'); },
  mode() { Menu.newName = $('f-name').value; Menu.newMode = Menu.newMode === 'creative' ? 'survival' : 'creative'; Menu.render(); },
  docreate() {
    const w = WorldStore.create({ name: $('f-name').value, seed: seedFromText(''), mode: Menu.newMode });
    Menu.stack.pop(); Menu.sel = w.id; startWorld(w.id, Menu.hostMode);
  },
  rename() { if (Menu.sel) Menu.go('rename'); }, dorename() { WorldStore.rename(Menu.sel, $('f-name').value); Menu.back(); },
  delete() { if (Menu.sel) Menu.go('confirmdel'); }, dodelete() { WorldStore.remove(Menu.sel); Menu.sel = ''; Menu.back(); },
  hostpick() { Menu.hostMode = true; Menu.go('worlds'); },
  async join() {
    const code = $('f-code').value; Menu.say('Joining…');
    try { WorldStore.ensureReal(); const via = await Coop.joinRoom(code, m => Menu.say(m)); Menu.say(via === 'relay' ? 'Connected through the relay (a bit slower)…' : 'Connected…'); }
    catch (e) { Menu.say(e.message); }
  },
  resume() { resumeGame(); },
  async opencoop() { Menu.say('Opening a room…'); try { await hostCurrentWorld(); Menu.render(); } catch (e) { Menu.say(e.message); } },
  quit() { quitToTitle(); },
  tinv() { setSetting('invertY', !SaveStore.doc.settings.invertY); Menu.render(); },
  tclock() { setSetting('clock', SaveStore.doc.settings.clock === false); Menu.render(); },
  tmute() { muted = !muted; setSetting('muted', muted); Menu.render(); },
  full() { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) { } },
  pad() { openPadSetup(); }
};
$('mscreen').addEventListener('click', ev => { const t = ev.target.closest('[data-act]'); if (!t || t.disabled) return; try { initAudio(); } catch (e) { } SFX.place && SFX.place(); const f = ACT[t.dataset.act]; if (f) f(t, ev); });
$('mscreen').addEventListener('dblclick', ev => { const t = ev.target.closest('.wl[data-id]'); if (t && Menu.top() === 'worlds') { Menu.sel = t.dataset.id; ACT.play(); } });
$('mscreen').addEventListener('input', ev => {
  const k = ev.target.dataset.set; if (!k) return; const o = OPTS.find(x => x[0] === k), v = +ev.target.value;
  SaveStore.doc.settings[k] = v; SaveStore.dirty = true; const lab = document.querySelector('[data-lab="' + k + '"]'); if (lab) lab.textContent = o[1] + ': ' + o[5](v); applySettings();
});
$('mscreen').addEventListener('keydown', ev => {
  if (ev.key === 'Enter' && ev.target.tagName === 'INPUT') { const t = Menu.top(); if (t === 'create') ACT.docreate(); else if (t === 'rename') ACT.dorename(); else if (t === 'mp') ACT.join(); }
  else if (ev.key === 'Escape') Menu.back();
});
function applySettings() {
  OW.LOAD = Math.round(optV('renderDist')); OW.KEEP = OW.LOAD + 2;
  try { applyVolumes(); } catch (e) { }
}
// ---------------- flow: start / pause / quit ----------------
function beginPlay() {                                            // the shared tail of every way into the game
  state = 'play'; el.menu.classList.add('hide'); el.menu.classList.remove('pause', 'sub'); el.dead.classList.remove('on'); el.shop.classList.remove('on');
  try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { fallback = true; }); } catch (e) { fallback = true; }
  updateRoomHud();
}
function startWorld(id, thenHost) {
  if (!booted) return; try { initAudio(); } catch (e) { }
  if (!WorldStore.open(id)) return;
  mode = 'hub'; enterHub(true, false); beginPlay(); applySettings();
  if (thenHost) hostCurrentWorld().then(() => feed('ROOM CODE: ' + Coop.code, '#37f0ff')).catch(e => feed('CO-OP: ' + e.message, '#ff8a3a'));
}
async function hostCurrentWorld() {
  if (Net.role === 'host') return;
  await Coop.hostRoom(code => { Coop.code = code; }); Net.host(); updateRoomHud();
}
function updateRoomHud() { const e = $('roomcode'); if (e) { const on = Net.role === 'host' && Coop.code; e.style.display = on ? 'block' : 'none'; if (on) e.textContent = 'ROOM ' + Coop.code; } }
function openPause() {
  if (state !== 'play') return;
  state = 'paused'; mouse.l = mouse.r = false; for (const k in keys) keys[k] = false; try { document.exitPointerLock(); } catch (e) { } Menu.msg = ''; Menu.show('pause'); el.menu.classList.remove('hide');
}
function resumeGame() {
  if (state !== 'paused') return;
  state = 'play'; el.menu.classList.add('hide'); el.menu.classList.remove('pause', 'sub');
  try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { fallback = true; }); } catch (e) { fallback = true; }
}
function quitToTitle() {
  try { document.exitPointerLock(); } catch (e) { }
  try { flushSave(); } catch (e) { }
  if (Net.role === 'host') Net.broadcast('bye', 0);
  if (Net.role !== 'offline') { Net.leave(); Coop.close(); Coop.closeRoom(); } Coop.code = null; updateRoomHud();
  WorldStore.openDemo(); mode = 'hub'; enterHub(false, false);
  state = 'menu'; mouse.l = mouse.r = false; el.shop.classList.remove('on'); el.inv.classList.remove('on'); el.dead.classList.remove('on');
  Menu.msg = ''; Menu.show('title'); el.menu.classList.remove('hide'); chooseSplash(); applySettings();
}
function chooseSplash() { $('splash').textContent = SPLASHES[(Math.random() * SPLASHES.length) | 0]; }
function openTitle() { Menu.show('title'); chooseSplash(); $('mver').textContent = 'HEXBUSTER Z ' + BUILD_ID; }
