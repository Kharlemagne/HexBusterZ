// ---------------- style / score ----------------
function addStyle(v) { S.style = clamp(S.style + v, 0, 1100); }
function onKill(e, o) {
  S.kills++;
  let pts = e.def.pts; const tags = [[e.def.name + ' +' + e.def.pts, '#fff']];
  if (o.head) { pts += 40; tags.push(['HEADSHOT +40', '#ffd23a']); }
  if (!P.onGround && P.airT > .3) { pts += 60; tags.push(['AIRBORNE +60', '#6ec8ff']); }
  if (o.pb) { pts += 50; tags.push(['POINT BLANK +50', '#ff8a3a']); }
  if (P.sliding) { pts += 40; tags.push(['SLIDE KILL +40', '#6dff9c']); }
  if (o.sla) { pts += 60; tags.push(['HOMING KILL +60', '#ff5a1a']); }
  if (o.expl) { pts += 30; tags.push(['EXPLOSIVE +30', '#ffa11a']); }
  if (o.rail) { pts += 50; tags.push(['SKEWERED +50', '#37f0ff']); }
  if (S.time - S.lastKill < 2.2) S.combo++; else S.combo = 1;
  S.lastKill = S.time;
  if (S.combo >= 2) { const b = S.combo * 25; pts += b; tags.push(['MULTIKILL x' + S.combo + ' +' + b, '#ff2a3a']); }
  S.wHist[o.w === undefined ? 8 : o.w] = S.time; let dv = 0; for (const k in S.wHist) if (S.time - S.wHist[k] < 7) dv++;
  if (dv >= 3) { const b = 50 * (dv - 2); pts += b; tags.push(['VARIETY x' + dv + ' +' + b, '#ff2bd6']); }
  S.score += Math.round(pts * (1 + S.rank * .25)); addStyle(pts * .85);
  P.hp = Math.min(100, P.hp + (e.def.boss ? 40 : 8) + (o.pb ? 6 : 0));
  tags.slice(0, 5).forEach(t => feed(t[0], t[1]));
}

