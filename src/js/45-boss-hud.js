// ---------------- boss HUD ----------------
function updateBossHUD(boss) {
  const w = el.bossw; css(w, 'display', boss ? 'block' : 'none'); if (!boss) { w._bn = null; return; }
  if (w._bn !== boss) {
    w._bn = boss; txt(el.bossname, '— ' + boss.bossName + ' —');
    let h = ''; for (let i = 2; i >= 0; i--) { const p = boss.pieces[i]; h += '<div class="bp" id="bp' + i + '"><span><b>' + PSLOT[i] + ' ' + p.name.toUpperCase() + '</b> · ' + ATK[p.atk].n + '</span><div class="bar"><div class="bf"></div></div></div>'; }
    el.bossbars.innerHTML = h;
  }
  for (let i = 0; i < 3; i++) { const p = boss.pieces[i], row = $('bp' + i); if (!row) continue; const f = row.querySelector('.bf'); f.style.width = clamp(p.hp / p.max, 0, 1) * 100 + '%'; row.classList.toggle('dead', p.broken); }
}

