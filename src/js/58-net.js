// ============================================================
//  NET — the multiplayer seam. Offline today; see docs/MULTIPLAYER.md for the plan.
//  Everything the game needs from a network goes through this object, so the rest of the code
//  never talks to WebRTC / WebSocket directly. Already in place to support it:
//    * one seed per run (Run.seed) rebuilds the whole dungeon + boss on any machine
//    * every enemy / projectile / chest has a stable id (nextId)
//    * every block edit goes through setBlock() -> blockListeners (netcode simply adds a listener)
//    * the simulation advances in fixed 120 Hz steps (SIM_DT)
// ============================================================
const Net = {
  role: 'offline',                 // 'offline' | 'host' | 'client'
  peers: [],
  handlers: {},
  on(type, fn) { this.handlers[type] = fn; },
  send(type, payload) { /* no transport yet */ },
  tick(dt) { /* snapshot / interpolation hooks go here */ },
  isAuthority() { return this.role !== 'client'; }
};
blockListeners.push((x, y, z, id, old) => { if (Net.role === 'host') Net.send('block', [x, y, z, id]); });     // first thing every peer needs to hear
