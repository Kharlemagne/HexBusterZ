// ---------------- HUD ----------------
function updateHUD() {
  css(el.hpf, 'width', clamp(P.hp, 0, 100) + '%'); txt(el.hptxt, Math.max(0, Math.ceil(P.hp)));
  css(el.hpf, 'background', P.hp < 30 ? '#ff2a3a' : '#e8d84a');
  dashBars.forEach((b, i) => { const v = Math.round(clamp(P.dashF - i, 0, 1) * 100) + '%'; if (b._w !== v) { b.style.setProperty('--w', v); b._w = v; } });
  const r = RANKS[S.rank]; txt(el.rank, r.l); css(el.rank, 'color', r.c); txt(el.rankname, r.n); css(el.rankname, 'color', r.c);
  css(el.sfill, 'width', ((S.style % 120) / 120 * 100) + '%'); css(el.sfill, 'background', r.c);
  txt(el.score, S.score.toLocaleString());
  if (mode === 'hub') txt(el.wave, 'EMBER VILLAGE'); else { const c = Run.cur; txt(el.wave, c ? (c.state === 'active' ? (c.type === 'boss' ? 'BOSS ' : 'ROOM ') + '— ' + (enemies.length + Run.queue.length) + ' LEFT' : (c.type === 'boss' && Run.glyph ? 'STEP INTO THE GLYPH' : c.type === 'treasure' ? 'TREASURE ROOM' : c.type === 'start' ? 'THE DEPTHS' : 'CLEARED')) : 'THE DEPTHS'); }
  txt(el.gems, '◆ ' + Save.gems + (mode === 'dungeon' ? '  (+' + Run.gems + ' this run)' + (Run.hasKey ? '   ⚿ BOSS KEY' : '') : ''));
  css(mini, 'display', mode === 'dungeon' ? 'block' : 'none');
  const pt = state === 'play' ? interactPrompt() : ''; css(el.prompt, 'display', pt ? 'block' : 'none'); if (pt) txt(el.prompt, pt);
  drawMini();
  updateBossHUD(enemies.find(e => e.pieces && !e.dead));
  { const act = P.bt > 0, v = Math.round((act ? P.bt / 10 : 1 - P.btCd / 30) * 100) + '%'; if (el.btbar._w !== v) { el.btbar.style.setProperty('--w', v); el.btbar._w = v; } el.btbar.classList.toggle('ready', P.btCd <= 0); el.btbar.classList.toggle('active', act); }
  css(el.shield, 'opacity', shieldOn() ? .55 + P.shieldFlash * 1.5 : 0); css(el.btv, 'opacity', Math.min(1, P.btFade) * .9);
  css(el.vig, 'opacity', clamp(P.hurtFlash * .85 + (P.hp < 30 ? .25 + Math.sin(T * 6) * .1 : 0), 0, 1));
  el.cross.classList.toggle('hit', P.hitT > 0);
  css(el.cross, 'transform', 'translate(-50%,-50%) scale(' + (1 + (P.weapon === 0 ? P.charge * 1.6 : 0)) + ')');
  css(el.cross, 'display', P.zoom ? 'none' : 'block');
  const showB = P.weapon === 4; css(el.bsel, 'display', showB ? 'block' : 'none'); if (showB) txt(el.bsel, '◼ ' + BUILD[P.buildSel][1] + '   (mouse wheel)');
}

