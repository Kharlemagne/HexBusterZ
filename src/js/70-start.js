// ---------------- reset / start ----------------
function startGame() {
  if (!booted) return;
  try { initAudio(); } catch (e) { }
  if (state === 'dead') enterHub(false, false);
  beginPlay();
}

