// ---------------- input ----------------
addEventListener('keydown', e => {
  if (e.target && /^(TEXTAREA|INPUT)$/.test(e.target.tagName)) return;      // typing in the save box / forms must not drive the game
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
  const first = !keys[e.code]; keys[e.code] = true;
  if (!first) return;
  if (state === 'padsetup') { if (e.code === 'Escape') closePadSetup(); return; }
  if (state === 'dead' && e.code === 'KeyR') { startGame(); return; }
  if (state === 'inv') { if (e.code === 'Escape' || e.code === 'KeyI' || e.code === 'Tab') closeInv(); else if (e.code.startsWith('Digit')) { const n = +e.code.slice(5) - 1; if (n >= 0 && n < 9) { Inv.sel = n; Inv.changed(); renderInv(); } } return; }
  if (state === 'shop') {
    if (e.code === 'Escape' || e.code === 'KeyE') closeShop();
    else if (e.code.startsWith('Digit')) { const n = +e.code.slice(5) - 1; if (n >= 0 && n < SHOP.length) { shopSel = n; buyItem(n); } }
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') { shopSel = (shopSel + 1) % SHOP.length; renderShop(); }
    else if (e.code === 'ArrowUp' || e.code === 'KeyW') { shopSel = (shopSel + SHOP.length - 1) % SHOP.length; renderShop(); }
    else if (e.code === 'Enter') buyItem(shopSel);
    else if (e.code === 'KeyX') sellShards();
    return;
  }
  if (state !== 'play') return;
  if (e.code === 'Space') P.jEdge = true;
  if (e.code === 'KeyI' || e.code === 'Tab') { openInv(); return; }
  if (e.code === 'KeyE' && tryInteract()) return;
  if (e.code.startsWith('Digit')) { const n = +e.code.slice(5); if (n >= 1 && n <= 5) switchWeapon(n - 1); }
  else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') tryDash();
  else if (e.code === 'KeyC' || e.code === 'ControlLeft') P.cEdge = true;
  else if (e.code === 'KeyQ') switchWeapon(P.lastWeapon);
  else if (e.code === 'KeyM') { muted = !muted; setSetting('muted', muted); feed(muted ? 'SOUND OFF' : 'SOUND ON'); }
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouse.l = mouse.r = false; });
addEventListener('mousedown', e => { if (state !== 'play') return; if (document.pointerLockElement !== canvas) { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (er) { } } if (e.button === 0) mouse.l = true; if (e.button === 2) mouse.r = true; });
addEventListener('mouseup', e => { if (e.button === 0) mouse.l = false; if (e.button === 2) mouse.r = false; });
addEventListener('contextmenu', e => e.preventDefault());
const mpos = { x: innerWidth / 2, y: innerHeight / 2 };
addEventListener('mousemove', e => {
  mpos.x = e.clientX; mpos.y = e.clientY; if (invOpen) updateInvCursor();
  if (state !== 'play') return;
  const s = P.zoom ? .0009 : .0022;
  P.yaw -= e.movementX * s; P.pitch = clamp(P.pitch - e.movementY * s, -1.55, 1.55); P.swayX = clamp(P.swayX - e.movementX * .0002, -.05, .05);
});
addEventListener('wheel', e => {
  if (state !== 'play') return;
  const dir = e.deltaY > 0 ? 1 : -1;
  if (P.weapon === 4) Inv.cycle(dir); else nextWeapon(dir);
}, { passive: true });
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement !== canvas && state === 'play' && !fallback) {
    state = 'paused'; mouse.l = mouse.r = false; el.menu.classList.remove('hide'); txt(el.mtitle, 'PAUSED'); txt(el.msub, 'CLICK TO RESUME');
  }
});
document.addEventListener('pointerlockerror', () => { fallback = true; });
el.menu.addEventListener('click', ev => {
  if (ev.target && ev.target.id === 'padbtn') { openPadSetup(); return; }
  if (ev.target && ev.target.id === 'savebtn') { openSaveBox(); return; } if (ev.target && ev.target.id === 'coopbtn') { openCoopBox(); return; } if (state === 'paused') { state = 'play'; el.menu.classList.add('hide'); try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { fallback = true; }); } catch (e) { } } else startGame(); });
el.dead.addEventListener('click', () => startGame());

