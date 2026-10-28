// ---------------- crash safety net ----------------
let booted = false, glLost = false, errCount = 0;
function showFatal(msg, extra) {
  const e = document.getElementById('err'); if (!e) return;
  e.innerHTML = '<h2>HEXBUSTER Z HIT A WALL</h2><p>' + String(msg).replace(/</g, '&lt;').slice(0, 300) + '</p><p class="s">' + (extra || '') + '</p><button onclick="location.reload()">RELOAD</button>';
  e.classList.add('on');
}
function showToast(msg) {
  const t = document.getElementById('toast'); if (!t) return;
  t.textContent = 'HICCUP: ' + String(msg).slice(0, 140) + ' (game keeps running)'; t.classList.add('on'); clearTimeout(showToast._t); showToast._t = setTimeout(() => t.classList.remove('on'), 6000);
}
function reportErr(msg) { console.error(msg); if (!booted) { showFatal(msg, 'It crashed while loading. Reload usually fixes it.'); return; } if (errCount++ < 6) showToast(msg); }
window.addEventListener('error', ev => reportErr(ev.message || 'unknown error'));
window.addEventListener('unhandledrejection', ev => { const m = (ev.reason && ev.reason.message) || ''; if (/lock|gesture|autoplay|AudioContext|exit/i.test(m)) { ev.preventDefault(); return; } reportErr(m || 'async error'); });

