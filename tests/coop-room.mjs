// The easy "5-letter room code" flow. The real matchmaking service (PeerJS cloud) is not reachable from CI, so a fake `Peer`
// built on BroadcastChannel stands in for it; this checks all of the game-side glue (codes, errors, transport, world sync).
import { openGame, startPlaying, check, done, GAME_URL, chromium, GL_ARGS } from './lib.mjs';
console.log('co-op room codes');
const fake = () => {
  const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = f => setTimeout(() => raf(f), 700);
  const live = new Set(), taken = () => JSON.parse(localStorage.getItem('fp_ids') || '[]');
  window.Peer = class {
    constructor(id) { this.id = id || ('g' + Math.random().toString(36).slice(2, 8)); this.h = {}; this.conns = {}; this.bc = new BroadcastChannel('fp'); this.bc.onmessage = e => this._m(e.data); setTimeout(() => this.h.open && this.h.open(this.id), 10); this.bc.postMessage({ t: 'hello', from: this.id }); }
    _m(m) {
      if (m.to !== this.id) return;
      if (m.t === 'connect') { const c = this._mk(m.from); this.h.connection && this.h.connection(c); c.open = true; c._e('open'); this.bc.postMessage({ t: 'accept', from: this.id, to: m.from }); }
      else if (m.t === 'accept') { const c = this.conns[m.from]; c.open = true; c._e('open'); }
      else if (m.t === 'data') this.conns[m.from]._e('data', m.d);
    }
    on(ev, f) { this.h[ev] = f; }
    _mk(id) { const s = this; const c = { open: false, h: {}, on(ev, f) { this.h[ev] = f; }, _e(ev, d) { this.h[ev] && this.h[ev](d); }, send(d) { s.bc.postMessage({ t: 'data', from: s.id, to: id, d }); }, close() { } }; this.conns[id] = c; return c; }
    connect(id) { const c = this._mk(id); this.bc.postMessage({ t: 'connect', from: this.id, to: id }); return c; }
    destroy() { this.bc.close(); }
  };
};
const browser = await chromium.launch({ args: GL_ARGS });
const H = await openGame({ width: 320, height: 200, init: fake, browser }); await startPlaying(H.page);
await H.ctx.addInitScript(fake);
const gp = await H.ctx.newPage(); const gerr = []; gp.on('pageerror', e => gerr.push('PAGEERROR ' + e.message));
await gp.goto(GAME_URL); await gp.waitForFunction(() => window.__g && /CLICK TO PLAY/.test(document.getElementById('msub').textContent)); await startPlaying(gp);
const G = { page: gp, errors: gerr };
const code = await H.page.evaluate(() => new Promise((ok, no) => __g.Coop.hostRoom(ok).catch(no)));
check('host gets a 5-character room code', /^[A-Z2-9]{5}$/.test(code), code);
const bad = await G.page.evaluate(() => __g.Coop.joinRoom('abc').then(() => 'joined', e => e.message));
check('a malformed code is rejected with a friendly message', /5 letters/.test(bad), bad);
await G.page.evaluate(c => __g.Coop.joinRoom(c.toLowerCase()), code);
for (let i = 0; i < 40; i++) await Promise.all([H.page.evaluate(() => { __g.update(1 / 60); __g.Net.tick(1 / 60); }), G.page.evaluate(() => { __g.update(1 / 60); __g.Net.tick(1 / 60); })]);
await new Promise(r => setTimeout(r, 300));
for (let i = 0; i < 20; i++) await Promise.all([H.page.evaluate(() => { __g.update(1 / 60); __g.Net.tick(1 / 60); }), G.page.evaluate(() => { __g.update(1 / 60); __g.Net.tick(1 / 60); })]);
check('guest joined with the code (any letter case)', await G.page.evaluate(() => __g.Net.role === 'client' && __g.P.id === 1));
check('host sees the guest', await H.page.evaluate(() => __g.Net.role === 'host' && __g.players.length === 2));
await H.close(); await gp.close(); await browser.close();
done([...H.errors, ...gerr]);
