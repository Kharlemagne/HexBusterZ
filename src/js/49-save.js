// ============================================================
//  SAVE SYSTEM — versioned, migrating and backed up.
//  Goal: an update must NEVER cost a player their game.
//
//  Rules for future changes (see docs/SAVE_SYSTEM.md):
//   * Adding a field?      Put it in saveDefaults(). Missing fields are filled in on load. Nothing else needed.
//   * Renaming / reshaping / removing a field?
//                          Bump "saveSchema" in data/meta.json and add MIGRATIONS[oldVersion] below.
//                          Migrations are kept forever; never edit an old one.
//   * Never delete the legacy keys and never overwrite a save this build cannot read.
// ============================================================
const SAVE_KEY = 'hbz.save', SAVE_BAK = 'hbz.save.bak', LEGACY_SAVE = 'cubicide_save_v1', LEGACY_PAD = 'cubicide_padmap_v1';
const SAVE_SCHEMA = (typeof DATA !== 'undefined' && DATA.meta && DATA.meta.saveSchema) || 1;
const SAVE_ID = 'hexbusterz';

function saveDefaults() {
  return {
    game: SAVE_ID, v: SAVE_SCHEMA, created: Date.now(), updated: Date.now(),
    profile: { gems: 0, unlocked: [true, false, false, false, true], runs: 0, wins: 0, stats: { kills: 0, deaths: 0, bosses: 0, bestRank: 0 } },
    settings: { padMap: null, muted: false },
    hub: { seed: 0, genVersion: 1, edits: [] },          // the buildable village: generator seed + the blocks the player changed
    extras: {}                                           // room for future systems (base machines, quests, ...)
  };
}
// Each migration upgrades a save from version N to N+1. Keep them forever; add new ones at the bottom.
const MIGRATIONS = {
  0: s => {                                              // v0 = the flat CUBICIDE-era save: {gems, unlocked, runs, wins}
    const d = saveDefaults();
    d.profile.gems = s.gems | 0; if (Array.isArray(s.unlocked)) d.profile.unlocked = s.unlocked.slice(0, 5); d.profile.runs = s.runs | 0; d.profile.wins = s.wins | 0;
    if (s.created) d.created = s.created;
    d.v = 1; return d;
  }
  // 1: s => { ...transform a v1 save into v2..., s.v = 2; return s; },
};

function deepFill(dst, def) {                            // add any keys that are missing; never touch what exists
  if (!dst || typeof dst !== 'object' || Array.isArray(dst)) return dst;
  for (const k in def) {
    if (!(k in dst) || dst[k] === undefined || dst[k] === null && def[k] !== null) dst[k] = def[k];
    else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k])) deepFill(dst[k], def[k]);
  }
  return dst;
}
function migrate(doc) {
  let v = Number.isInteger(doc.v) ? doc.v : 0, guard = 0;
  while (v < SAVE_SCHEMA && MIGRATIONS[v] && guard++ < 100) { doc = MIGRATIONS[v](doc); v = doc.v; }
  return doc;
}
function normalize(doc) {
  doc = deepFill(doc, saveDefaults());
  const p = doc.profile;
  p.gems = Math.max(0, p.gems | 0); p.runs = Math.max(0, p.runs | 0); p.wins = Math.max(0, p.wins | 0);
  if (!Array.isArray(p.unlocked)) p.unlocked = [true, false, false, false, true];
  while (p.unlocked.length < 5) p.unlocked.push(false);
  p.unlocked = p.unlocked.map(Boolean); p.unlocked[0] = true; p.unlocked[4] = true;
  if (!Array.isArray(doc.hub.edits)) doc.hub.edits = [];
  doc.hub.edits = doc.hub.edits.filter(e => Array.isArray(e) && e.length === 4 && e.every(Number.isFinite));
  return doc;
}

// ---- tolerant localStorage wrappers (the sandboxed artifact view can block storage entirely) ----
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
const lsDel = k => { try { localStorage.removeItem(k); } catch (e) { } };
function storageOK() { try { localStorage.setItem('hbz.probe', '1'); localStorage.removeItem('hbz.probe'); return true; } catch (e) { return false; } }
function lsKeys(prefix) { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(prefix)) out.push(k); } } catch (e) { } return out; }
function backupSave(label, raw) {                        // timestamped copy; keeps the 5 newest
  if (!raw) return; lsSet('hbz.backup.' + label + '.' + Date.now(), raw);
  const ks = lsKeys('hbz.backup.').sort((a, b) => +b.split('.').pop() - +a.split('.').pop()); ks.slice(5).forEach(lsDel);
}

const SaveStore = { doc: null, persistent: true, loadedFrom: 'new', newer: false, notes: [], lastSaved: 0, dirty: false };
function loadSave() {
  SaveStore.persistent = storageOK(); SaveStore.notes = [];
  let raw = lsGet(SAVE_KEY), doc = null, src = 'new';
  if (raw) {
    try { doc = JSON.parse(raw); src = 'save'; }
    catch (e) {                                          // damaged: keep the evidence, fall back to the rolling backup
      backupSave('corrupt', raw); const b = lsGet(SAVE_BAK);
      if (b) { try { doc = JSON.parse(b); src = 'backup'; SaveStore.notes.push('Your save was damaged, so the last good backup was restored.'); } catch (_) { } }
    }
  }
  if (!doc) {                                            // first run on this build: pull in the old CUBICIDE-era save (the old key is left untouched)
    const lg = lsGet(LEGACY_SAVE);
    if (lg) { try { doc = JSON.parse(lg); src = 'legacy'; SaveStore.notes.push('Imported your CUBICIDE save.'); } catch (e) { } }
  }
  if (doc && typeof doc === 'object' && !Array.isArray(doc)) {
    const oldV = Number.isInteger(doc.v) ? doc.v : 0;
    if (oldV < SAVE_SCHEMA) { backupSave('v' + oldV, JSON.stringify(doc)); doc = migrate(doc); if (src === 'save') SaveStore.notes.push('Save upgraded to format v' + doc.v + '.'); }
    if (doc.v > SAVE_SCHEMA) { SaveStore.newer = true; SaveStore.notes.push('This save came from a newer version of the game. It is kept untouched.'); }
    if (src === 'legacy') { const pad = lsGet(LEGACY_PAD); if (pad) { try { doc.settings = doc.settings || {}; doc.settings.padMap = JSON.parse(pad); } catch (e) { } } }
  } else { doc = saveDefaults(); src = 'new'; }
  SaveStore.doc = normalize(doc); SaveStore.loadedFrom = src;
  if (!SaveStore.doc.hub.seed) SaveStore.doc.hub.seed = ((Math.random() * 4294967295) >>> 0) || 1;
  if (src !== 'save') flushSave(); else if (raw) lsSet(SAVE_BAK, raw);     // rolling "last good session" backup
}
function flushSave() {
  if (!SaveStore.doc) return false;
  HubSave.collect(); SaveStore.doc.updated = Date.now();
  if (!SaveStore.persistent) { SaveStore.dirty = false; return false; }
  const ok = lsSet(SAVE_KEY, JSON.stringify(SaveStore.doc));
  if (ok) { SaveStore.lastSaved = Date.now(); SaveStore.dirty = false; } else SaveStore.notes.push('Could not write the save (storage full or blocked).');
  return ok;
}
// ---- the buildable hub: only the player's changes are stored (a few numbers per block) ----
const HubSave = {
  edits: new Map(), orig: new Map(), dirty: false, cap: 60000, capped: false,
  record(i, old, id) {
    if (!this.orig.has(i)) { if (this.orig.size >= this.cap) { this.capped = true; return; } this.orig.set(i, old); }
    if (id === this.orig.get(i)) { this.edits.delete(i); this.orig.delete(i); } else this.edits.set(i, id);
    this.dirty = true; SaveStore.dirty = true;
  },
  apply() {                                              // called right after the hub terrain is generated
    this.edits.clear(); this.orig.clear();
    for (const [x, y, z, id] of (Net.hubOverride ? Net.hubOverride.edits : SaveStore.doc.hub.edits)) {
      if (x < 0 || z < 0 || x >= 64 || z >= 64 || y < 1 || y >= H) continue;
      const i = x + 64 * (z + 64 * y); this.orig.set(i, world[i]); this.edits.set(i, id); world[i] = id;
    }
  },
  collect() { if (!this.dirty) return; SaveStore.doc.hub.edits = [...this.edits].map(([i, id]) => [i % 64, (i / 4096) | 0, ((i / 64) | 0) % 64, id]); this.dirty = false; },
  reset() { this.edits.clear(); this.orig.clear(); SaveStore.doc.hub.edits = []; this.dirty = false; SaveStore.dirty = true; }
};
blockListeners.push((x, y, z, id, old) => { if (mode === 'hub' && Net.role !== 'client') HubSave.record(x + 64 * (z + 64 * y), old, id); });

loadSave();
const Save = SaveStore.doc.profile;                      // the rest of the game uses this object directly (gems, unlocked, runs, wins, stats)
const saveGame = () => { SaveStore.dirty = true; flushSave(); };
const saveSoon = () => { SaveStore.dirty = true; };      // cheap: the autosave timer below writes it
function setSetting(k, v) { SaveStore.doc.settings[k] = v; saveGame(); }
if (SaveStore.doc.settings.muted) muted = true;
setInterval(() => { if (SaveStore.dirty) flushSave(); }, 15000);
addEventListener('pagehide', () => { if (SaveStore.dirty || HubSave.dirty) flushSave(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && (SaveStore.dirty || HubSave.dirty)) flushSave(); });

// ---- export / import (progress can travel between browsers, devices and hosts) ----
function fnv(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); }
function exportSaveCode() {
  flushSave(); const json = JSON.stringify(SaveStore.doc);
  return 'HBZ1.' + btoa(unescape(encodeURIComponent(json))) + '.' + fnv(json);
}
function importSaveCode(code) {
  const parts = String(code || '').trim().split('.');
  if (parts.length !== 3 || parts[0] !== 'HBZ1') return { ok: false, msg: 'That does not look like a HEXBUSTER Z save code.' };
  let json, doc;
  try { json = decodeURIComponent(escape(atob(parts[1]))); } catch (e) { return { ok: false, msg: 'The code is damaged (could not decode).' }; }
  if (fnv(json) !== parts[2]) return { ok: false, msg: 'The code is damaged (checksum mismatch). Copy it again.' };
  try { doc = JSON.parse(json); } catch (e) { return { ok: false, msg: 'The code is damaged (bad data).' }; }
  if (!doc || doc.game !== SAVE_ID) return { ok: false, msg: 'This code is from a different game.' };
  backupSave('before-import', JSON.stringify(SaveStore.doc));          // never lose what is here either
  if ((Number.isInteger(doc.v) ? doc.v : 0) < SAVE_SCHEMA) doc = migrate(doc);
  doc = normalize(doc);
  Object.assign(Save, doc.profile); doc.profile = Save;                // keep the same object the game code points at
  SaveStore.doc = doc; SaveStore.newer = doc.v > SAVE_SCHEMA;
  muted = !!doc.settings.muted; HubSave.edits.clear(); HubSave.orig.clear(); HubSave.dirty = false;
  if (!doc.hub.seed) doc.hub.seed = ((Math.random() * 4294967295) >>> 0) || 1;
  flushSave();
  return { ok: true, msg: 'Save imported: ' + Save.gems + ' gems, ' + Save.unlocked.filter(Boolean).length + '/5 weapons.' };
}
