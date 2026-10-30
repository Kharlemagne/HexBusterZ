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
    settings: { padMap: null, muted: false, music: .7, sfx: .8, renderDist: 7, fov: 93, sens: 1, invertY: false, shake: 1, clock: true, turn: null },
    hub: { seed: 0, genVersion: 1, edits: [] },          // (schema 1) the old village save; kept untouched for safety, no longer used
    worlds: [],                                          // one entry per world: { id, name, seed, villageSeed, created, played, mode }; each world's blocks/time/inventory live under localStorage key hbz.w.<id>
    lastWorld: '',
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
  },
  1: s => {                                              // v1 -> v2: the village became part of an open world
    s.world = { seed: 0, villageSeed: 0, genVersion: 1, edits: [] };
    const h = s.hub || {};
    if (Array.isArray(h.edits) && h.edits.length) { s.world.edits = h.edits.map(e => e.slice()); s.world.villageSeed = h.seed | 0; }   // keep an existing village build exactly where it was
    s.v = 2; return s;
  },
  2: s => {                                              // v2 -> v3: several worlds; the single v2 world becomes the first one, with its inventory
    const w = s.world || {}, id = 'w' + Date.now().toString(36);
    s.worlds = [{ id, name: 'MY WORLD', seed: w.seed || 0, villageSeed: w.villageSeed || 0, created: s.created || Date.now(), played: Date.now(), mode: 'survival', data: { edits: w.edits || [], time: w.time || .3, inv: s.inv || null } }];
    s.lastWorld = id; delete s.world; delete s.inv; s.v = 3; return s;
  }
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
  if (!Array.isArray(doc.worlds)) doc.worlds = [];
  doc.worlds = doc.worlds.filter(w => w && typeof w === 'object' && typeof w.id === 'string' && w.id);
  for (const w of doc.worlds) {
    w.name = String(w.name || 'NEW WORLD').slice(0, 32); if (!w.seed) w.seed = ((Math.random() * 4294967295) >>> 0) || 1; if (!w.villageSeed) w.villageSeed = VILLAGE_SEED_DEFAULT;
    w.gen = w.gen === 3 ? 3 : w.gen === 2 ? 2 : 1; w.created = +w.created || Date.now(); w.played = +w.played || w.created; w.mode = w.mode === 'creative' ? 'creative' : 'survival';
    if (w.data && Array.isArray(w.data.edits)) w.data.edits = w.data.edits.filter(e => Array.isArray(e) && e.length === 4 && e.every(Number.isFinite));
  }
  if (!doc.worlds.some(w => w.id === doc.lastWorld)) doc.lastWorld = doc.worlds.length ? doc.worlds.slice().sort((a, b) => b.played - a.played)[0].id : '';
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

// ---- worlds: the list lives in the main save, each world's payload (blocks changed, time of day, inventory) in its own key so big builds don't slow every save ----
const VILLAGE_SEED_DEFAULT = 0x00E3B3F1;                 // every world gets the same Ember Village, whatever its seed
const WorldStore = {
  mem: {}, cur: null,                                    // cur = { meta, data, ephemeral }
  key: id => 'hbz.w.' + id,
  newData() { return { edits: [], time: .3, inv: null }; },
  readData(meta) {
    if (meta.data) { const d = meta.data; delete meta.data; this.writeRaw(meta.id, d); SaveStore.dirty = true; return d; }      // inline payload from a migration / import
    let d = null; const raw = lsGet(this.key(meta.id)); if (raw) { try { d = JSON.parse(raw); } catch (e) { SaveStore.notes.push('World "' + meta.name + '" had damaged data.'); } }
    return d || this.mem[meta.id] || this.newData();
  },
  writeRaw(id, d) { this.mem[id] = d; if (SaveStore.persistent) lsSet(this.key(id), JSON.stringify(d)); },
  list() { return SaveStore.doc.worlds.slice().sort((a, b) => b.played - a.played); },
  find(id) { return SaveStore.doc.worlds.find(w => w.id === id) || null; },
  create({ name, seed, mode }) {
    if (SaveStore.doc.worlds.length >= 4 && !this.allowMore) { const o = this.list()[SaveStore.doc.worlds.length - 1]; this.remove(o.id); }       // (the menus stop this earlier; this only keeps the 4-slot rule if something else creates a save)
    const base = (name || 'NEW WORLD').trim().slice(0, 32) || 'NEW WORLD'; let nm = base, n = 2;
    while (SaveStore.doc.worlds.some(w => w.name === nm)) nm = base + ' (' + n++ + ')';
    const meta = { id: 'w' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36), name: nm, seed: seed || ((Math.random() * 4294967295) >>> 0) || 1, villageSeed: VILLAGE_SEED_DEFAULT, gen: 3, created: Date.now(), played: Date.now(), mode: mode === 'creative' ? 'creative' : 'survival' };
    SaveStore.doc.worlds.push(meta); const d = this.newData(); this.writeRaw(meta.id, d); SaveStore.doc.lastWorld = meta.id; saveGame(); return meta;
  },
  open(id) {                                             // make this the active world (call before building the terrain)
    const meta = this.find(id); if (!meta) return null;
    if (this.cur && !this.cur.ephemeral) { try { flushSave(); } catch (e) { } }
    const d = this.readData(meta); if (!Array.isArray(d.edits)) d.edits = []; if (!d.inv && meta.mode === 'creative') d.inv = { slots: [], sel: 0, creative: true };
    meta.played = Date.now(); SaveStore.doc.lastWorld = id; this.cur = { meta, data: d, ephemeral: false }; SaveStore.dirty = true;
    try { Inv.load(); } catch (e) { } try { DayNight.load(); } catch (e) { }
    return this.cur;
  },
  openDemo() {                                           // the title-screen backdrop: a throwaway world that is never saved
    if (this.cur && !this.cur.ephemeral) { try { flushSave(); } catch (e) { } }
    this.cur = { meta: { id: '', name: 'DEMO', seed: 20261029, villageSeed: VILLAGE_SEED_DEFAULT, gen: 3, mode: 'survival' }, data: this.newData(), ephemeral: true };
    try { Inv.load(); } catch (e) { } try { DayNight.load(); } catch (e) { }
  },
  ensureReal() { if (this.cur && !this.cur.ephemeral) return; const w = this.find(SaveStore.doc.lastWorld) || this.list()[0]; if (w) this.open(w.id); else this.open(this.create({ name: 'MY WORLD' }).id); },
  saveCur() { if (this.cur && !this.cur.ephemeral) this.writeRaw(this.cur.meta.id, this.cur.data); },
  remove(id) { SaveStore.doc.worlds = SaveStore.doc.worlds.filter(w => w.id !== id); delete this.mem[id]; lsDel(this.key(id)); if (SaveStore.doc.lastWorld === id) SaveStore.doc.lastWorld = ''; normalize(SaveStore.doc); saveGame(); },
  rename(id, name) { const w = this.find(id); if (w) { w.name = (name || w.name).trim().slice(0, 32) || w.name; saveGame(); } },
  dataFor(id) { return this.cur && !this.cur.ephemeral && this.cur.meta.id === id ? this.cur.data : this.readData(Object.assign({}, this.find(id))); }
};
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
  WorldSave.collect(); try { Inv.collect(); } catch (e) { } try { DayNight.collect(); } catch (e) { } WorldStore.saveCur(); SaveStore.doc.updated = Date.now();
  if (!SaveStore.persistent) { SaveStore.dirty = false; return false; }
  const ok = lsSet(SAVE_KEY, JSON.stringify(SaveStore.doc));
  if (ok) { SaveStore.lastSaved = Date.now(); SaveStore.dirty = false; } else SaveStore.notes.push('Could not write the save (storage full or blocked).');
  return ok;
}
// ---- the open world: only the player's changes are stored (a few numbers per block); OW.edits holds them, grouped by chunk ----
const WorldSave = {
  dirty: false, cap: 100000, count: 0, capped: false,
  record(x, y, z, old, id) {                              // called for every block change in the open world
    const key = ckey(x >> 4, z >> 4), li = (x & 15) | ((z & 15) << 4) | (y << 8);
    let m = OW.edits.get(key); if (!m) OW.edits.set(key, m = new Map());
    let e = m.get(li);
    if (!e) { if (this.count >= this.cap) { this.capped = true; return; } e = { id, orig: old }; m.set(li, e); this.count++; } else e.id = id;
    if (e.orig === id) { m.delete(li); this.count--; if (!m.size) OW.edits.delete(key); }           // put back to what the generator made
    if (Net.role !== 'client') { this.dirty = true; SaveStore.dirty = true; }                        // a guest's edits to the host's world are never written to their own save
  },
  load(list) {
    OW.edits.clear(); this.count = 0;
    for (const [x, y, z, id] of list) {
      if (y < 1 || y >= WORLD_H || this.count >= this.cap) continue;
      const key = ckey(x >> 4, z >> 4); let m = OW.edits.get(key); if (!m) OW.edits.set(key, m = new Map());
      const li = (x & 15) | ((z & 15) << 4) | (y << 8); if (!m.has(li)) this.count++; m.set(li, { id, orig: -1 });
    }
    this.dirty = false;
  },
  list() {
    const out = [];
    for (const [key, m] of OW.edits) { const cx = ckx(key), cz = ckz(key); for (const [li, e] of m) out.push([cx * 16 + (li & 15), li >> 8, cz * 16 + ((li >> 4) & 15), e.id]); }
    return out;
  },
  collect() {
    if (!this.dirty) return; const c = WorldStore.cur;
    if (c && !c.ephemeral) { if (c.data.map && c.data.realms && c.data.realms[String(c.data.map.seed)]) c.data.realms[String(c.data.map.seed)].edits = this.list(); else c.data.edits = this.list(); }       // a realm keeps its own edits, the station keeps its own
    this.dirty = false;
  },
  reset() { OW.edits.clear(); this.count = 0; const c = WorldStore.cur; if (c) { if (c.data.map && c.data.realms && c.data.realms[String(c.data.map.seed)]) c.data.realms[String(c.data.map.seed)].edits = []; else c.data.edits = []; } this.dirty = false; SaveStore.dirty = true; }
};
blockListeners.push((x, y, z, id, old) => { if (useChunks) WorldSave.record(x, y, z, old, id); });

loadSave();
const Save = SaveStore.doc.profile;                      // the rest of the game uses this object directly (gems, unlocked, runs, wins, stats)
const saveGame = () => { SaveStore.dirty = true; flushSave(); };
const saveSoon = () => { SaveStore.dirty = true; };      // cheap: the autosave timer below writes it
function setSetting(k, v) { SaveStore.doc.settings[k] = v; saveGame(); }
if (SaveStore.doc.settings.muted) muted = true;
setInterval(() => { if (SaveStore.dirty) flushSave(); }, 15000);
addEventListener('pagehide', () => { if (SaveStore.dirty || WorldSave.dirty) flushSave(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && (SaveStore.dirty || WorldSave.dirty)) flushSave(); });

// ---- export / import (progress can travel between browsers, devices and hosts) ----
function fnv(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); }
function exportSaveCode() {
  flushSave(); const out = JSON.parse(JSON.stringify(SaveStore.doc)); for (const w of out.worlds) w.data = WorldStore.dataFor(w.id); const json = JSON.stringify(out);
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
  for (const w of doc.worlds) if (w.data) { WorldStore.writeRaw(w.id, w.data); delete w.data; }          // each world's payload goes back to its own key
  Object.assign(Save, doc.profile); doc.profile = Save;                // keep the same object the game code points at
  SaveStore.doc = doc; SaveStore.newer = doc.v > SAVE_SCHEMA;
  muted = !!doc.settings.muted; WorldSave.dirty = false; WorldStore.cur = null; WorldStore.openDemo();
  if (!doc.hub.seed) doc.hub.seed = ((Math.random() * 4294967295) >>> 0) || 1;
  flushSave();
  return { ok: true, msg: 'Save imported: ' + Save.gems + ' gems, ' + Save.unlocked.filter(Boolean).length + '/5 weapons.' };
}
