// ---------------- UI ----------------
const el = {};
['wave', 'bossw', 'bossbar', 'bossname', 'rank', 'rankname', 'sfill', 'score', 'feed', 'hpf', 'hptxt', 'dash', 'hotbar', 'cross', 'vig', 'banner', 'menu', 'dead', 'dstats', 'mtitle', 'msub', 'wname', 'bsel', 'shop', 'inv', 'invcur', 'gems', 'prompt', 'bossbars', 'btbar', 'shield', 'btv', 'btring', 'pad', 'padsetup', 'savestat', 'savebox'].forEach(k => el[k] = $(k));
const hotSlots = [];
for (let i = 0; i < 5; i++) { const d = document.createElement('div'); d.className = 'slot'; d.innerHTML = '<b>' + (i + 1) + '</b><span>' + WNAMES[i] + '</span>'; el.hotbar.appendChild(d); hotSlots.push(d); }
const dashBars = []; for (let i = 0; i < 3; i++) { const d = document.createElement('i'); el.dash.appendChild(d); dashBars.push(d); }
function feed(text, color) {
  const d = document.createElement('div'); d.textContent = text; if (color) d.style.color = color; el.feed.prepend(d);
  while (el.feed.children.length > 6) el.feed.lastChild.remove();
  setTimeout(() => d.remove(), 2600);
}
function banner(big, small) {
  if (Net.role === 'host') Net.broadcast('banner', [big, small]);
  el.banner.innerHTML = '<h1>' + big + '</h1><p>' + (small || '') + '</p>'; el.banner.classList.remove('show'); void el.banner.offsetWidth; el.banner.classList.add('show');
}

