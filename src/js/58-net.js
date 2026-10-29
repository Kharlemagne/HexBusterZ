// ============================================================
//  NET — co-op multiplayer (host-authoritative). See docs/MULTIPLAYER.md.
//
//  The host runs the real game (enemies, bosses, projectiles, hazards, rooms).  Guests rebuild the same world from the
//  seed, send their own position / hits / block edits, and render what the host tells them.
//  A "transport" is any object { send(string), onmessage(fn), close() } — WebRTC data channels plug in here, and the tests
//  use a relay between two browser pages.  Nothing else in the game talks to a network.
//
//  Messages  host -> guest: world, snap, block, hurt, bye     guest -> host: in, dmg, block
// ============================================================
const NET_HZ = 20;
const Net = {
  role: 'offline',                 // 'offline' | 'host' | 'client'
  myId: 0, peers: new Map(),       // host: id -> { id, tr, body }     client: id 0 -> { tr }
  applying: false, acc: 0, nextPeer: 1, hubOverride: null, status: '', log: [],
  isAuthority() { return this.role !== 'client'; },
  active() { return this.role !== 'offline'; },

  // ---- sending ----
  _put(peer, type, data) { try { peer.tr.send(JSON.stringify({ k: type, d: data })); } catch (e) { } },
  send(type, data, to) {            // host: to one peer id (or everyone if omitted)   client: always to the host
    if (this.role === 'client') { const h = this.peers.get(0); if (h) this._put(h, type, data); return; }
    if (to !== undefined) { const p = this.peers.get(to); if (p) this._put(p, type, data); return; }
    this.broadcast(type, data);
  },
  broadcast(type, data, except) { for (const [id, p] of this.peers) if (id !== except) this._put(p, type, data); },

  // ---- connecting ----
  host() { this.role = 'host'; this.myId = 0; P.id = 0; this.status = 'HOSTING'; },
  accept(tr) {                      // host: a guest's transport is open
    if (this.role !== 'host') this.host();
    const id = this.nextPeer++, body = addRemotePlayer(id), peer = { id, tr, body, last: performance.now() };
    this.peers.set(id, peer);
    tr.onmessage = s => this._recv(peer, s);
    tr.onclose = () => this._drop(id);
    this._put(peer, 'welcome', { id }); this._sendWorld(peer);
    feed('PLAYER ' + id + ' JOINED', '#37f0ff');
    return id;
  },
  join(tr) {                        // guest: connect to a host
    this.role = 'client'; this.status = 'CONNECTED';
    const peer = { id: 0, tr }; this.peers.set(0, peer);
    tr.onmessage = s => this._recv(peer, s);
    tr.onclose = () => this.leave();
  },
  leave() {
    const was = this.role;
    for (const p of this.peers.values()) { try { p.tr.close && p.tr.close(); } catch (e) { } }
    this.peers.clear(); for (let i = players.length - 1; i > 0; i--) players.splice(i, 1);
    this.role = 'offline'; this.hubOverride = null; this.status = ''; P.id = 0; this.myId = 0; this.nextPeer = 1;
    if (was === 'client') { this._rejoinOwnWorld(); }
  },
  _rejoinOwnWorld() { try { enemies.length = 0; eprojs.length = 0; haz.length = 0; enterHub(false, false); } catch (e) { } },
  _drop(id) { const p = this.peers.get(id); if (!p) return; this.peers.delete(id); removeRemotePlayer(id); feed('PLAYER ' + id + ' LEFT', '#ff8a3a'); },

  // ---- world ----
  announceWorld() { if (this.role === 'host') for (const p of this.peers.values()) this._sendWorld(p); },
  _sendWorld(peer) {
    const w = { mode, wave: Wv.n };
    if (mode === 'hub') { w.hubSeed = SaveStore.doc.hub.seed; w.edits = [...HubSave.edits].map(([i, id]) => [i % 64, (i / 4096) | 0, ((i / 64) | 0) % 64, id]); }
    else w.runSeed = Run.seed;
    this._put(peer, 'world', w);
  },
  _applyWorld(w) {
    this.applying = true;
    try {
      enemies.length = 0; eprojs.length = 0; haz.length = 0; bombs.length = 0; this.proxies.clear();
      Wv.n = w.wave || 1;
      if (w.mode === 'hub') { this.hubOverride = { seed: w.hubSeed, edits: w.edits || [] }; enterHub(false, false); }
      else { this.hubOverride = null; enterDungeon(w.runSeed); }
      if (state === 'menu') startGame();
    } finally { this.applying = false; }
  },

  // ---- per-tick ----
  tick(dt) {
    if (this.role === 'offline') return;
    if (this.role === 'client') this._clientStep(dt);
    for (const q of players) if (q.remote && q.inv > 0) q.inv -= dt;
    this.acc += dt; if (this.acc < 1 / NET_HZ) return; this.acc = 0;
    if (this.role === 'host') this._sendSnap(); else this._sendInput();
  },
  _sendInput() {
    this.send('in', [r2(P.x), r2(P.y), r2(P.z), r2(P.vx), r2(P.vy), r2(P.vz), r2(P.yaw), r2(P.pitch), Math.round(P.hp), P.alive ? 1 : 0, P.weapon, shieldOn() ? 1 : 0, P.sliding ? 1 : 0]);
  },
  _sendSnap() {
    const pl = players.map(q => [q.id, r2(q.x), r2(q.y), r2(q.z), r2(q.vx), r2(q.vz), r2(q.yaw), r2(q.pitch), Math.round(q.hp), q.alive ? 1 : 0, q.weapon, q === P ? (shieldOn() ? 1 : 0) : q.shieldT, q.sliding ? 1 : 0]);
    const en = [];
    for (const e of enemies) {
      if (e.dead) continue;
      const o = { i: e.id, ty: e.type, x: r2(e.x), y: r2(e.y), z: r2(e.z), a: r2(e.yaw), hp: Math.round(e.hp), mh: Math.round(e.maxhp), w: r2(e.walk), f: e.flash > 0 ? 1 : 0 };
      if (e.pieces) { o.bn = e.bossName; o.pc = e.pieces.map(p => [p.name, p.broken ? 1 : 0, Math.round(p.hp), Math.round(p.max), p.flash > 0 ? 1 : 0, p.atk]); o.tele = e.fx.some(f => f.tele) ? 1 : 0; }
      en.push(o);
    }
    const pr = eprojs.map(p => [p.id, r2(p.x), r2(p.y), r2(p.z), r2(p.size), p.rf ? 1 : 0, p.col || null]);
    const hz = JSON.parse(JSON.stringify(haz));
    this.broadcast('snap', { t: r2(S.time), pl, en, pr, hz, mode });
  },
  _recv(peer, s) {
    let m; try { m = JSON.parse(s); } catch (e) { return; }
    peer.last = performance.now();
    const h = this['_on_' + m.k]; if (h) { try { h.call(this, peer, m.d); } catch (err) { reportErr('net ' + m.k + ': ' + (err && err.message)); } }
  },

  // ---- host receives ----
  _on_in(peer, a) {
    const q = peer.body; if (!q) return;
    [q.x, q.y, q.z, q.vx, q.vy, q.vz, q.yaw, q.pitch, q.hp] = a; q.alive = !!a[9]; q.weapon = a[10]; q.shieldT = a[11]; q.sliding = !!a[12];
  },
  _on_dmg(peer, [id, dmg, o]) {
    const e = enemies.find(x => x.id === id); if (!e || e.dead) return;
    const keep = P.hitT; damageEnemy(e, dmg, o || {}); P.hitT = keep;
  },
  _on_block(peer, [x, y, z, id]) {
    this.applying = true; try { setBlock(x, y, z, id); } finally { this.applying = false; }
    this.broadcast('block', [x, y, z, id], peer.id);
  },

  // ---- guest receives ----
  proxies: new Map(),
  _on_welcome(peer, { id }) { this.myId = id; P.id = id; },
  _on_world(peer, w) { this._applyWorld(w); },
  _on_hurt(peer, [id, d, nx, nz, kb]) { if (id === this.myId) hurtPlayer(d, nx, nz, kb); },
  _on_bye() { this.leave(); },
  _on_snap(peer, s) {
    if (s.mode !== mode) return;                         // world switch still in flight
    // players
    const seen = new Set();
    for (const a of s.pl) {
      const id = a[0]; if (id === this.myId) continue; seen.add(id);
      let q = players.find(p => p.id === id && p.remote); if (!q) q = addRemotePlayer(id);
      q.tx = a[1]; q.ty = a[2]; q.tz = a[3]; q.vx = a[4]; q.vz = a[5]; q.yaw = a[6]; q.pitch = a[7]; q.hp = a[8]; q.alive = !!a[9]; q.weapon = a[10]; q.shieldT = a[11]; q.sliding = !!a[12];
      if (q.x === 32 && q.y === 12 && q.z === 32) { q.x = q.tx; q.y = q.ty; q.z = q.tz; }
    }
    for (let i = players.length - 1; i > 0; i--) if (players[i].remote && !seen.has(players[i].id)) players.splice(i, 1);
    // enemies
    const ids = new Set();
    for (const o of s.en) {
      ids.add(o.i); let e = this.proxies.get(o.i);
      if (!e) { e = this._makeProxy(o); this.proxies.set(o.i, e); enemies.push(e); }
      e.tx = o.x; e.ty = o.y; e.tz = o.z; e.tyaw = o.a; e.hp = o.hp; e.maxhp = o.mh; e.flash = o.f ? .05 : 0; e.walkT = o.w;
      if (o.pc) { o.pc.forEach((p, k) => { const q = e.pieces[k]; q.broken = !!p[1]; q.hp = p[2]; q.max = p[3]; q.flash = p[4] ? .05 : 0; }); e.fx = o.tele ? [{ tele: true }] : []; }
    }
    for (const [id, e] of this.proxies) if (!ids.has(id)) { this.proxies.delete(id); e.dead = true; sparkBurst(e.x, e.y + e.h * .5, e.z, 14, [1, .3, .1], 6); }
    // projectiles + hazards are pure view data on a guest
    eprojs.length = 0; for (const p of s.pr) eprojs.push({ id: p[0], x: p[1], y: p[2], z: p[3], size: p[4], rf: !!p[5], col: p[6], life: 1, vx: 0, vy: 0, vz: 0, dmg: 0 });
    haz.length = 0; for (const h of s.hz) haz.push(h);
  },
  _makeProxy(o) {
    if (o.pc) {
      const find = (arr, n) => arr.find(d => d.n === n) || arr[0];
      const designs = [BLEGS, BTORSOS, BHEADS];
      const pieces = o.pc.map((p, k) => { const d = find(designs[k], p[0]); return { slot: k, name: d.n, parts: d.parts, hp: p[2], max: p[3], broken: !!p[1], flash: 0, atk: p[5] }; });
      return { id: o.i, type: 'boss', def: Object.assign({}, ED.boss, { name: o.bn }), bossName: o.bn, x: o.x, y: o.y, z: o.z, tx: o.x, ty: o.y, tz: o.z, vx: 0, vy: 0, vz: 0, yaw: o.a, tyaw: o.a, hp: o.hp, maxhp: o.mh, hw: ED.boss.hw, h: ED.boss.h, t: 0, flash: 0, dead: false, walk: 0, walkT: 0, pieces, fx: [], proxy: true };
    }
    const def = ED[o.ty];
    return { id: o.i, type: o.ty, def, x: o.x, y: o.y, z: o.z, tx: o.x, ty: o.y, tz: o.z, vx: 0, vy: 0, vz: 0, yaw: o.a, tyaw: o.a, hp: o.hp, maxhp: o.mh, hw: def.hw, h: def.h, t: 0, flash: 0, dead: false, walk: 0, walkT: 0, proxy: true };
  },
  _clientStep(dt) {                                      // smooth everything the host told us about
    const k = Math.min(1, 14 * dt);
    for (const e of enemies) if (e.proxy) { e.x += (e.tx - e.x) * k; e.y += (e.ty - e.y) * k; e.z += (e.tz - e.z) * k; e.yaw = lerpAng(e.yaw, e.tyaw, k); e.t += dt; e.walk += (e.walkT - e.walk) * k; }
    for (const q of players) if (q.remote && q.tx !== undefined) { q.x += (q.tx - q.x) * k; q.y += (q.ty - q.y) * k; q.z += (q.tz - q.z) * k; }
  }
};
Net.on = () => { };
const r2 = v => Math.round(v * 100) / 100;
blockListeners.push((x, y, z, id, old) => {
  if (Net.applying || Net.role === 'offline') return;
  if (Net.role === 'host') Net.broadcast('block', [x, y, z, id]); else Net.send('block', [x, y, z, id]);
});

// other players, drawn as little scrap-built robots (the final character model comes later)
function drawRemotePlayers(t) {
  for (const q of players) {
    if (!q.remote || !q.alive) continue;
    const R = rotY(q.yaw), body = [.25, .85, .3], hot = q.shieldT ? 1 : 0;
    pushBox(q.x, q.y + .55, q.z, .6, .9, .36, .22 + hot * .2, .24 + hot * .5, .3 + hot * .6, R, false);
    pushBox(q.x, q.y + 1.28, q.z, .46, .46, .46, .75, .76, .8, R, false);
    pushBox(q.x + R[2] * .2, q.y + 1.3, q.z + R[8] * .2, .3, .09, .06, .2, 1, 1, R, true);   // visor
    pushBox(q.x + R[0] * .42 + R[2] * .3, q.y + .85, q.z + R[6] * .42 + R[8] * .3, .16, .16, .55, 1, .5, .15, R, false);   // buster arm
  }
}
