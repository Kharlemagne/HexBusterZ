// ---------------- save status + export / import box ----------------
function updateSaveStatus() {
  const e = el.savestat; if (!e) return; const d = SaveStore.doc;
  let s;
  if (!SaveStore.persistent) s = '⚠ SAVING IS BLOCKED IN THIS VIEW — use SAVE · EXPORT to keep your progress, or play the hosted / downloaded version';
  else s = '💾 SAVED · ◆ ' + Save.gems + ' · ' + Save.unlocked.filter(Boolean).length + '/5 weapons · ' + Save.runs + ' runs · world: ' + d.world.edits.length + ' blocks changed' + (SaveStore.lastSaved ? ' · ' + new Date(SaveStore.lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
  if (SaveStore.newer) s += '  ·  ⚠ made by a NEWER version — kept untouched';
  if (SaveStore.notes.length) s += '  ·  ' + SaveStore.notes[SaveStore.notes.length - 1];
  if (e._v !== s) { e.textContent = s; e._v = s; }
}
function openSaveBox() {
  const code = exportSaveCode();
  el.savebox.innerHTML = '<div class="sh-t">SAVE DATA</div><div class="sh-g">Your progress, in one code you can keep</div>'
    + '<div class="sb-l">EXPORT — copy this somewhere safe (it works on any browser, device or website)</div><textarea id="sb-out" readonly rows="3"></textarea>'
    + '<div><button onclick="sbCopy()">COPY CODE</button><button onclick="sbDownload()">DOWNLOAD FILE</button></div>'
    + '<div class="sb-l">IMPORT — paste a code to load that save (your current one is backed up first)</div><textarea id="sb-in" rows="3" placeholder="HBZ1.…"></textarea>'
    + '<div><button onclick="sbImport()">LOAD THIS CODE</button><button id="sb-reset" onclick="sbResetHub()">RESET VILLAGE BUILDS</button><button onclick="closeSaveBox()">CLOSE</button></div><div class="sh-m" id="sb-msg"></div>';
  $('sb-out').value = code; el.savebox.classList.add('on');
}
function closeSaveBox() { el.savebox.classList.remove('on'); }
function sbMsg(t) { const m = $('sb-msg'); if (m) m.textContent = t; }
function sbCopy() {
  const o = $('sb-out'); o.select();
  try { navigator.clipboard.writeText(o.value).then(() => sbMsg('Copied.'), () => { document.execCommand('copy'); sbMsg('Copied.'); }); } catch (e) { try { document.execCommand('copy'); sbMsg('Copied.'); } catch (_) { sbMsg('Press Ctrl+C to copy the selected code.'); } }
}
function sbDownload() {
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([$('sb-out').value], { type: 'text/plain' })); a.download = 'hexbusterz-save.txt'; document.body.appendChild(a); a.click(); a.remove(); sbMsg('If nothing downloaded, use COPY CODE instead.'); } catch (e) { sbMsg('Downloads are blocked here — use COPY CODE.'); }
}
function sbImport() { const r = importSaveCode($('sb-in').value); sbMsg(r.msg); if (r.ok) { Inv.load(); updateSaveStatus(); if (mode === 'hub') { genHub(undefined, P.x, P.z); } $('sb-out').value = exportSaveCode(); } }
let sbResetArmed = 0;
function sbResetHub() {
  const b = $('sb-reset'); if (!sbResetArmed) { sbResetArmed = 1; b.textContent = 'CLICK AGAIN TO CONFIRM'; setTimeout(() => { sbResetArmed = 0; if (b) b.textContent = 'RESET WORLD BUILDS'; }, 3500); return; }
  sbResetArmed = 0; b.textContent = 'RESET WORLD BUILDS'; WorldSave.reset(); flushSave(); if (mode === 'hub') { genHub(undefined, P.x, P.z); } sbMsg('All world changes reset. Gems and weapons are untouched.'); updateSaveStatus();
}
