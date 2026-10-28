// ---------------- reset / start ----------------
function startGame() {
  if (!booted) return;
  try { initAudio(); } catch (e) { }
  if (state === 'menu' || state === 'dead') enterHub(state === 'menu', false);
  state = 'play'; el.menu.classList.add('hide'); el.dead.classList.remove('on'); el.shop.classList.remove('on');
  try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { fallback = true; }); } catch (e) { fallback = true; }
}

