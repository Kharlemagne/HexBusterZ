// ---------------- gamepad ----------------
const gp = { on: false, active: false, slide: false, lx: 0, ly: 0, rx: 0, ry: 0, lt: 0, rt: 0, a: false, b: false, prevD: {}, prevRaw: [], blocked: false, idx: 0, lastRaw: '' };
let lastRumble = 0;
function rumble(strong, weak, ms) {
  if (!gp.on || performance.now() - lastRumble < 70) return; lastRumble = performance.now();
  try {
    const p = (navigator.getGamepads() || [])[gp.idx]; const a = p && (p.vibrationActuator || (p.hapticActuators && p.hapticActuators[0]));
    if (a && a.playEffect) a.playEffect('dual-rumble', { duration: ms, strongMagnitude: clamp(strong, 0, 1), weakMagnitude: clamp(weak, 0, 1) });
  } catch (e) { }
}
// ---- controller mapping (standard layout by default; a setup wizard can learn ANY pad) ----
const PAD_NAMES = ['fire', 'alt', 'jump', 'dash', 'xcross', 'next', 'prev', 'interact', 'start'];
const PAD_STD = { fire: { b: 7 }, alt: { b: 6 }, jump: { b: 0 }, dash: { b: 2 }, xcross: { b: 1 }, next: { b: 5 }, prev: { b: 4 }, interact: { b: 3 }, start: { b: 9 }, lx: { a: 0, s: 1 }, ly: { a: 1, s: 1 }, rx: { a: 2, s: 1 }, ry: { a: 3, s: 1 } };
let padMap = PAD_STD, padCustom = false;
try { const j = SaveStore.doc.settings.padMap; if (j && j.fire && j.lx) { padMap = j; padCustom = true; } } catch (e) { }
function dval(pad, d) {
  if (!d) return 0;
  if (d.b !== undefined) { const bb = pad.buttons[d.b]; return bb ? (bb.pressed ? Math.max(1, bb.value) : bb.value) : 0; }
  const v = pad.axes[d.a]; if (v === undefined) return 0;
  return d.rest !== undefined ? (Math.abs(v - d.rest) > .4 ? clamp(Math.abs(v - d.rest), 0, 1) : 0) : 0;
}
const sval = (pad, d) => (d && pad.axes[d.a] !== undefined) ? pad.axes[d.a] * (d.s || 1) : 0;
// pick the pad that is actually being used (some browsers list phantom devices first)
const padAct = {}, padSig = {};
function pickPad(pads) {
  let best = null, bt = -1;
  for (const p of pads) {
    if (!p || p.connected === false) continue;
    let sg = 0; for (const b of p.buttons) sg += (b.pressed ? 1 : 0) + (b.value || 0); for (const a of p.axes) sg += Math.abs(a) > .25 ? Math.abs(a) : 0;
    if (padSig[p.index] === undefined || Math.abs(sg - padSig[p.index]) > .01) { if (padSig[p.index] !== undefined) padAct[p.index] = performance.now(); padSig[p.index] = sg; }
    const t = padAct[p.index] || 0, score = t + (p.buttons.length >= 10 ? 1 : 0);
    if (!best || score > bt) { best = p; bt = score; }
  }
  return best;
}
let padTxt = '', padT = 0;
function padStatus(pad) {
  if (performance.now() - padT < 150) return; padT = performance.now();
  const focus = document.hasFocus ? document.hasFocus() : true;
  const s = gp.blocked ? '🎮 CONTROLLER ACCESS IS BLOCKED IN THIS VIEW — open the downloaded HTML file, or the artifact in its own browser tab'
    : !pad ? '🎮 NO CONTROLLER DETECTED — plug it in / wake it, then press any button while this page is focused'
    : '🎮 ' + String(pad.id).slice(0, 40) + (padCustom ? ' · CUSTOM MAPPING' : pad.mapping === 'standard' ? ' · STANDARD LAYOUT' : ' · NON-STANDARD LAYOUT → click SET UP CONTROLLER')
      + (!focus ? '  ·  ⚠ CLICK THE GAME WINDOW (the browser only sends controller input to the focused page)' : '') + (gp.lastRaw ? '  ·  last input: ' + gp.lastRaw : '') + (state === 'menu' ? '  ·  press any button to start' : '');
  if (s !== padTxt) { padTxt = s; if (el.pad) el.pad.textContent = s; }
}
addEventListener('gamepadconnected', e => { feed('CONTROLLER CONNECTED', '#6ec8ff'); });
addEventListener('gamepaddisconnected', e => { feed('CONTROLLER DISCONNECTED', '#ff8a3a'); });

// ---- setup wizard ----
const PAD_STEPS = [['fire', 'FIRE — pull your main trigger (RT / R2)', 'btn'], ['alt', 'ALT-FIRE — pull the other trigger (LT / L2)', 'btn'], ['jump', 'JUMP', 'btn'], ['dash', 'DASH / SLIDE', 'btn'], ['xcross', 'HOMING ATTACK / X-GRAPPLE', 'btn'],
  ['next', 'NEXT WEAPON', 'btn'], ['prev', 'PREVIOUS WEAPON', 'btn'], ['interact', 'INTERACT / TALK / BACK', 'btn'], ['start', 'START / PAUSE', 'btn'],
  ['lx', 'LEFT STICK — push it RIGHT and hold', 'axis'], ['ly', 'LEFT STICK — push it DOWN and hold', 'axis'], ['rx', 'RIGHT STICK — push it RIGHT and hold', 'axis'], ['ry', 'RIGHT STICK — push it DOWN and hold', 'axis']];
let padSetup = null;
function openPadSetup() {
  padSetup = { i: 0, map: {}, base: null, wait: true, raw: '', prev: state }; state = 'padsetup'; mouse.l = mouse.r = false;
  try { document.exitPointerLock(); } catch (e) { } el.padsetup.classList.add('on'); renderPadSetup();
}
function closePadSetup(saved) {
  if (!padSetup) return; state = padSetup.prev === 'play' ? 'paused' : padSetup.prev; padSetup = null; el.padsetup.classList.remove('on');
  if (saved) feed('CONTROLLER MAPPED', '#6dff9c');
}
function resetPadMap() { padMap = PAD_STD; padCustom = false; setSetting('padMap', null); closePadSetup(); feed('CONTROLLER RESET TO DEFAULT', '#6ec8ff'); }
function renderPadSetup() {
  const S_ = padSetup; if (!S_) return; const st = PAD_STEPS[Math.min(S_.i, PAD_STEPS.length - 1)];
  el.padsetup.innerHTML = '<div class="sh-t">CONTROLLER SETUP</div><div class="sh-g">STEP ' + (S_.i + 1) + ' / ' + PAD_STEPS.length + '</div><div class="ps-q">' + st[1] + '</div><div class="ps-raw">' + (S_.raw || '…') + '</div>'
    + '<div class="sh-f">Press the control you want. Let go before the next step.</div><div><button onclick="closePadSetup()">CANCEL</button><button onclick="resetPadMap()">RESET TO DEFAULT</button></div>';
}
function padSetupPoll(pad) {
  const S_ = padSetup; if (!pad) { S_.raw = 'NO INPUT — click this window, then press a button on the controller'; renderPadSetup(); return; }
  if (!S_.base) S_.base = pad.axes.slice();
  let raw = ''; pad.buttons.forEach((bb, i) => { if (bb.pressed || bb.value > .5) raw += 'BUTTON ' + i + '   '; }); pad.axes.forEach((v, i) => { const d = v - S_.base[i]; if (Math.abs(d) > .4) raw += 'AXIS ' + i + (d > 0 ? '+' : '−') + '   '; });
  S_.raw = raw || '(waiting for input)';
  if (S_.wait) { if (!raw) S_.wait = false; renderPadSetup(); return; }
  if (!raw) { renderPadSetup(); return; }
  const step = PAD_STEPS[S_.i]; let rec = null;
  if (step[2] === 'btn') {
    const k = pad.buttons.findIndex(bb => bb.pressed || bb.value > .5);
    if (k >= 0) rec = { b: k }; else { let best = -1, bd = .5; pad.axes.forEach((v, i) => { const d = Math.abs(v - S_.base[i]); if (d > bd) { bd = d; best = i; } }); if (best >= 0) rec = { a: best, rest: S_.base[best] }; }
  } else { let best = -1, bd = .55; pad.axes.forEach((v, i) => { const d = Math.abs(v - S_.base[i]); if (d > bd) { bd = d; best = i; } }); if (best >= 0) rec = { a: best, s: (pad.axes[best] - S_.base[best]) > 0 ? 1 : -1 }; }
  if (rec) {
    S_.map[step[0]] = rec; S_.i++; S_.wait = true; SFX.rank();
    if (S_.i >= PAD_STEPS.length) { padMap = S_.map; padCustom = true; setSetting('padMap', padMap); closePadSetup(true); return; }
  }
  renderPadSetup();
}

function pollGamepad() {
  let pads = []; try { pads = navigator.getGamepads ? (navigator.getGamepads() || []) : []; gp.blocked = false; } catch (e) { pads = []; gp.blocked = true; }
  const pad = pickPad(pads);
  padStatus(pad);
  if (!pad) { gp.on = false; gp.lx = gp.ly = gp.rx = gp.ry = gp.lt = gp.rt = 0; gp.a = gp.b = gp.slide = false; if (state === 'padsetup') padSetupPoll(null); return; }
  gp.on = true; gp.idx = pad.index;
  if (state === 'padsetup') { padSetupPoll(pad); return; }
  const dz = (x, y) => { const m = Math.hypot(x, y); if (m < .18) return [0, 0]; const k = Math.min(1, (m - .18) / .82) / m; return [x * k, y * k]; };
  [gp.lx, gp.ly] = dz(sval(pad, padMap.lx), sval(pad, padMap.ly)); [gp.rx, gp.ry] = dz(sval(pad, padMap.rx), sval(pad, padMap.ry));
  const bi = i => { const bb = pad.buttons[i]; return !!bb && (bb.pressed || bb.value > .5); };
  const down = {}; for (const n of PAD_NAMES) down[n] = dval(pad, padMap[n]) > .5;
  if (!padCustom) { down.dash = down.dash || bi(10); down.xcross = down.xcross || bi(11); down.next = down.next || bi(12); down.prev = down.prev || bi(13); down.dl = bi(14); down.dr = bi(15); }
  const pr = n => down[n] && !gp.prevD[n];
  gp.slide = down.dash; gp.lt = dval(pad, padMap.alt); gp.rt = dval(pad, padMap.fire); gp.a = down.jump;
  // any raw button counts as activity (so START / any button works even on an unmapped layout)
  let rawRise = false, anyRaw = false; const rose = new Set();                    // raw (standard-layout) buttons that went down this frame, used by the menus
  pad.buttons.forEach((bb, i) => { const on = bb.pressed || bb.value > .5; if (on) { anyRaw = true; if (!gp.prevRaw[i]) { rawRise = true; rose.add(i); gp.lastRaw = 'BUTTON ' + i; } } gp.prevRaw[i] = on; });
  pad.axes.forEach((v, i) => { if (Math.abs(v) > .7 && !gp.prevRaw['a' + i]) gp.lastRaw = 'AXIS ' + i + (v > 0 ? '+' : '−'); gp.prevRaw['a' + i] = Math.abs(v) > .7; });
  const any = anyRaw || Math.abs(gp.lx) + Math.abs(gp.ly) + Math.abs(gp.rx) + Math.abs(gp.ry) > .2;
  if (any) { gp.active = true; fallback = true; if (AC && AC.state === 'suspended') AC.resume(); }
  const nav = padNav(bi, state === 'play');
  if (state === 'rift') { if (pr('jump')) Rift.random(); if (pr('xcross') || pr('start') || pr('interact')) Rift.close(); }
  else if (state === 'shop') {
    if (pr('next')) { shopSel = (shopSel + SHOP.length - 1) % SHOP.length; renderShop(); }
    if (pr('prev')) { shopSel = (shopSel + 1) % SHOP.length; renderShop(); }
    if (pr('jump')) buyItem(shopSel);
    if (pr('xcross') || pr('start') || pr('interact')) closeShop();
  } else if (state === 'inv') padInv(rose, nav);
  else if (state === 'menu' || state === 'paused') padMenu(rose, nav);
  else if (state === 'dead') { if (rawRise) startGame(); }
  else if (state !== 'play') { /* pad setup, etc. */ }
  else {
    if (rose.has(8)) { openInv(); for (const n in down) gp.prevD[n] = down[n]; return; }               // BACK / SELECT = backpack + character
    if (pr('start') || rose.has(9)) { openPause(); for (const n in down) gp.prevD[n] = down[n]; return; }   // START = game menu
    if (pr('xcross')) P.cEdge = true;
    if (pr('dash')) tryDash();
    if (pr('jump')) P.jEdge = true;
    if (pr('interact')) { if (!tryInteract()) switchWeapon(P.lastWeapon); }
    if (pr('prev')) nextWeapon(-1);
    if (pr('next')) nextWeapon(1);
    if (P.weapon === 4) { if (!padCustom && pr('dl')) Inv.cycle(-1); if (!padCustom && pr('dr')) Inv.cycle(1); }
  }
  for (const n in down) gp.prevD[n] = down[n];
}


// ---- gamepad navigation for menus and the backpack (standard layout: A=0 B=1 X=2 Y=3 LB=4 RB=5 RT=7 BACK=8 START=9, D-pad 12-15, left stick) ----
function padNav(bi, inPlay) {
  const out = { up: false, down: false, left: false, right: false }; if (inPlay) { gp.navT = {}; return out; }
  const now = performance.now(), want = { up: bi(12) || gp.ly < -.55, down: bi(13) || gp.ly > .55, left: bi(14) || gp.lx < -.55, right: bi(15) || gp.lx > .55 }; gp.navT = gp.navT || {};
  for (const d in want) { if (!want[d]) { gp.navT[d] = 0; continue; } if (!gp.navT[d]) { gp.navT[d] = now + 380; out[d] = true; } else if (now > gp.navT[d]) { gp.navT[d] = now + 110; out[d] = true; } }
  return out;
}
function padMenu(rose, nav) {
  const items = [...document.querySelectorAll('#mscreen .mb:not(:disabled), #mscreen .wl[data-id], #mscreen input[type=range]')], n = items.length;
  document.querySelectorAll('#mscreen .gf').forEach(e => e.classList.remove('gf'));
  if (state === 'paused' && rose.has(9) && Menu.top() === 'pause') { resumeGame(); return; }
  if (rose.has(1) || rose.has(8)) { if (Menu.stack.length > 1 || state === 'paused') { Menu.back(); return; } }
  if (!n) return;
  if (nav.down) Menu.pf = ((Menu.pf | 0) + 1) % n; if (nav.up) Menu.pf = ((Menu.pf | 0) + n - 1) % n;
  Menu.pf = clamp(Menu.pf | 0, 0, n - 1); const it = items[Menu.pf];
  if (it.type === 'range') {
    if (nav.left || nav.right) { const st = +it.step || 1, v = clamp(+it.value + (nav.right ? st : -st), +it.min, +it.max); it.value = v; it.dispatchEvent(new Event('input', { bubbles: true })); }
  } else if (rose.has(0)) {
    try { initAudio(); } catch (e) { }
    if (it.classList.contains('wl')) { if (Menu.sel === it.dataset.id) ACT.play(); else ACT.pick(it); } else it.click();
    return;
  }
  const mark = it.type === 'range' ? it.parentElement : it; mark.classList.add('gf'); if (mark.scrollIntoView) mark.scrollIntoView({ block: 'nearest' });
}
function padInv(rose, nav) {
  if (rose.has(1) || rose.has(8) || rose.has(9)) { closeInv(); return; }
  let c = Inv.pc || { r: 3, c: 0 };
  if (nav.left) c.c = (c.c + 8) % 9; if (nav.right) c.c = (c.c + 1) % 9; if (nav.up) c.r = Math.max(0, c.r - 1); if (nav.down) c.r = Math.min(3, c.r + 1); Inv.pc = c;
  const idx = c.r === 3 ? c.c : 9 + c.r * 9 + c.c;
  if (rose.has(0)) Inv.click(idx, false, false); else if (rose.has(2)) Inv.click(idx, true, false); else if (rose.has(3)) Inv.click(idx, false, true);
  else if (rose.has(7)) { Inv.sort(); renderInv(); } else if (rose.has(4) || rose.has(5)) { let w = P.weapon; for (let i = 0; i < 5; i++) { w = (w + (rose.has(5) ? 1 : 4)) % 5; if (weaponOK(w)) break; } invWeapon(w); }
  padInvMark();
}
function padInvMark() {
  const c = Inv.pc || { r: 3, c: 0 }, idx = c.r === 3 ? c.c : 9 + c.r * 9 + c.c;
  document.querySelectorAll('#inv .ic.pc').forEach(e => e.classList.remove('pc'));
  const cell = document.querySelector('#inv .ic[data-i="' + idx + '"]'); if (cell) { cell.classList.add('pc'); const r = cell.getBoundingClientRect(); mpos.x = r.left + r.width * .6; mpos.y = r.top + r.height * .6; updateInvCursor(); }
}
