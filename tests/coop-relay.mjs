// The relay fallback: when the direct WebRTC link can't open, the guest falls back to a public MQTT broker.
// The real brokers aren't reachable from CI, so a fake WebSocket "broker" (BroadcastChannel) stands in; the MQTT packet
// encoder is also checked byte-for-byte against the canonical MQTT 3.1.1 examples.
import { openGame, startPlaying, check, done, GAME_URL, chromium, GL_ARGS } from './lib.mjs';
console.log('co-op relay fallback');
const fake = () => {
  const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = f => setTimeout(() => raf(f), 700);
  // matchmaker whose direct connections never open on the guest (simulates a blocked NAT)
  window.Peer = class {
    constructor(id) { this.id = id || ('g' + Math.random().toString(36).slice(2, 8)); this.h = {}; setTimeout(() => this.h.open && this.h.open(this.id), 10); }
    on(ev, f) { this.h[ev] = f; }
    connect() { return { open: false, on() { }, close() { }, send() { } }; }
    destroy() { }
  };
  // fake MQTT-over-WebSocket broker shared between pages through a BroadcastChannel; only the "emqx" URL is reachable
  const bc = new BroadcastChannel('mqttfake'), socks = new Set();
  const rem = n => { const o = []; do { let d = n % 128; n = (n / 128) | 0; if (n) d |= 128; o.push(d); } while (n); return o; };
  const pubBytes = (topic, pay) => { const t = new TextEncoder().encode(topic), body = [t.length >> 8, t.length & 255, ...t, ...pay]; return new Uint8Array([0x30, ...rem(body.length), ...body]); };
  const deliver = (s, bytes) => setTimeout(() => s.onmessage && s.onmessage({ data: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }), 3);
  const route = (topic, pay) => { for (const s of socks) if (s.subs.has(topic)) deliver(s, pubBytes(topic, pay)); };
  bc.onmessage = e => route(e.data.topic, e.data.pay);
  window.WebSocket = class {
    constructor(url) { this.url = url; this.readyState = 0; this.subs = new Set(); socks.add(this); setTimeout(() => { if (!/emqx/.test(url)) { this.readyState = 3; this.onerror && this.onerror(); this.onclose && this.onclose(); } else { this.readyState = 1; this.onopen && this.onopen(); } }, 5); }
    send(data) {
      const b = new Uint8Array(data), type = b[0] >> 4; let j = 1, len = 0, mul = 1, x; do { x = b[j++]; len += (x & 127) * mul; mul *= 128; } while (x & 128);
      const body = b.slice(j, j + len);
      if (type === 1) deliver(this, new Uint8Array([0x20, 2, 0, 0]));
      else if (type === 8) { const tl = (body[2] << 8) | body[3]; this.subs.add(new TextDecoder().decode(body.slice(4, 4 + tl))); deliver(this, new Uint8Array([0x90, 3, body[0], body[1], 0])); }
      else if (type === 3) { const tl = (body[0] << 8) | body[1], topic = new TextDecoder().decode(body.slice(2, 2 + tl)), pay = Array.from(body.slice(2 + tl)); route(topic, pay); bc.postMessage({ topic, pay }); }
      else if (type === 12) deliver(this, new Uint8Array([0xD0, 0]));
    }
    close() { this.readyState = 3; socks.delete(this); }
  };
};
const browser = await chromium.launch({ args: GL_ARGS });
const H = await openGame({ width: 320, height: 200, init: fake, browser }); await startPlaying(H.page);
await H.ctx.addInitScript(fake);
const gp = await H.ctx.newPage(); const gerr = []; gp.on('pageerror', e => gerr.push('PAGEERROR ' + e.message));
await gp.goto(GAME_URL); await gp.waitForFunction(() => window.__g && /CLICK TO PLAY/.test(document.getElementById('msub').textContent)); await startPlaying(gp);
const G = { page: gp };

// --- packet encoding vs the MQTT 3.1.1 spec examples
const hex = a => Array.from(a).map(x => x.toString(16).padStart(2, '0')).join(' ');
const enc = await H.page.evaluate(() => ({ c: Array.from(__g.MQ.connect('a')), s: Array.from(__g.MQ.subscribe(1, 'a/b')), p: Array.from(__g.MQ.publish('t', 'hi')), big: __g.MQ.publish('t', 'x'.repeat(300)).slice(0, 4) && Array.from(__g.MQ.publish('t', 'x'.repeat(300)).slice(0, 4)) }));
check('CONNECT packet matches the spec', hex(enc.c) === '10 0d 00 04 4d 51 54 54 04 02 00 1e 00 01 61', hex(enc.c));
check('SUBSCRIBE packet matches the spec', hex(enc.s) === '82 08 00 01 00 03 61 2f 62 00', hex(enc.s));
check('PUBLISH packet matches the spec', hex(enc.p) === '30 05 00 01 74 68 69', hex(enc.p));
check('long messages use a 2-byte length (303 = af 02)', hex(enc.big) === '30 af 02 00', hex(enc.big));
const framing = await H.page.evaluate(() => {
  const a = __g.MQ.publish('x', 'one'), b = __g.MQ.publish('y', 'two'), all = new Uint8Array([...a, ...b]), got = [];
  let rest = __g.MQ.parse(all.slice(0, a.length + 3), (f, body) => got.push(f));           // a whole packet + the start of the next
  rest = __g.MQ.parse(new Uint8Array([...rest, ...all.slice(a.length + 3)]), (f, body) => got.push(f));
  return { n: got.length, rest: rest.length };
});
check('packets split across / merged into network chunks are re-assembled', framing.n === 2 && framing.rest === 0, JSON.stringify(framing));

// --- integration: host listens on all brokers; guest's direct link never opens -> relay
const code = await H.page.evaluate(() => new Promise((ok, no) => __g.Coop.hostRoom(ok).catch(no)));
check('host gets a room code and is listening on the relay', /^[A-Z2-9]{5}$/.test(code) && await H.page.evaluate(() => __g.Relay.conns.length === 1));
await G.page.evaluate(() => { __g.Coop.directTimeout = 1200; });
const via = await G.page.evaluate(c => __g.Coop.joinRoom(c), code);
check('guest falls back to the relay when the direct link fails', via === 'relay', via);
for (let i = 0; i < 30; i++) await Promise.all([H.page, G.page].map(p => p.evaluate(() => { __g.update(1 / 60); __g.Net.tick(1 / 60); })));
await new Promise(r => setTimeout(r, 400));
for (let i = 0; i < 30; i++) await Promise.all([H.page, G.page].map(p => p.evaluate(() => { __g.update(1 / 60); __g.Net.tick(1 / 60); })));
check('guest joined the host through the relay', await G.page.evaluate(() => __g.Net.role === 'client' && __g.P.id === 1));
check('host sees the guest', await H.page.evaluate(() => __g.Net.role === 'host' && __g.players.length === 2));
check('relay mode lowers the update rate', await H.page.evaluate(() => __g.Net.hz === 10));
await G.page.evaluate(() => { Object.assign(__g.P, { x: 21.5, z: 21.5 }); });
for (let i = 0; i < 40; i++) await Promise.all([H.page, G.page].map(p => p.evaluate(() => { __g.update(1 / 60); __g.Net.tick(1 / 60); })));
await new Promise(r => setTimeout(r, 300));
await H.page.evaluate(() => __g.update(1 / 60));
check('movement travels through the relay', await H.page.evaluate(() => Math.abs(__g.players[1].x - 21.5) < .3));
await G.page.evaluate(() => __g.Net.leave());
await new Promise(r => setTimeout(r, 400)); await H.page.evaluate(() => { __g.update(1 / 60); __g.Net.tick(1 / 60); });
check('host notices the guest leaving', await H.page.evaluate(() => __g.players.length === 1));
await H.close(); await gp.close(); await browser.close();
done([...H.errors, ...gerr]);
