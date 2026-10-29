// ============================================================
//  RELAY FALLBACK — when two networks can't open a direct WebRTC link, game messages go through a free public MQTT broker
//  (pub/sub over WebSocket, no account needed). Slower (~10 updates/s) and the broker is shared with strangers, so it is only
//  a fallback; the room code is random and never shown to anyone but your friend.
//  Includes a tiny MQTT 3.1.1 client (QoS 0 only), so there is no library to load.
// ============================================================
const MQTT_BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/'];
const RELAY_HZ = 10;
const MQ = {
  utf8: s => new TextEncoder().encode(s),
  str: s => { const b = MQ.utf8(s); return [b.length >> 8, b.length & 255, ...b]; },
  rem(n) { const o = []; do { let d = n % 128; n = (n / 128) | 0; if (n) d |= 128; o.push(d); } while (n); return o; },
  pkt(first, body) { const out = new Uint8Array(1 + MQ.rem(body.length).length + body.length); out[0] = first; const r = MQ.rem(body.length); out.set(r, 1); out.set(body, 1 + r.length); return out; },
  connect(id, keep = 30) { return MQ.pkt(0x10, [...MQ.str('MQTT'), 4, 2, keep >> 8, keep & 255, ...MQ.str(id)]); },
  subscribe(pid, topic) { return MQ.pkt(0x82, [pid >> 8, pid & 255, ...MQ.str(topic), 0]); },
  publish(topic, payload) { const t = MQ.str(topic), p = typeof payload === 'string' ? MQ.utf8(payload) : payload; const body = new Uint8Array(t.length + p.length); body.set(t, 0); body.set(p, t.length); return MQ.pkt(0x30, body); },
  ping: () => new Uint8Array([0xC0, 0]),
  parse(buf, onPacket) {                                    // returns the unread rest of buf
    let i = 0;
    while (buf.length - i >= 2) {
      let mul = 1, len = 0, j = i + 1, b;
      do { if (j >= buf.length) return buf.slice(i); b = buf[j++]; len += (b & 127) * mul; mul *= 128; } while (b & 128);
      if (buf.length - j < len) return buf.slice(i);
      onPacket(buf[i], buf.slice(j, j + len)); i = j + len;
    }
    return buf.slice(i);
  }
};
class MqttConn {
  constructor(url) { this.url = url; this.ws = null; this.buf = new Uint8Array(0); this.subs = new Map(); this.alive = false; this.pid = 1; this.ping = null; this.onclose = null; }
  connect(timeout = 7000) {
    return new Promise((ok, no) => {
      let ws; try { ws = this.ws = new WebSocket(this.url, 'mqtt'); } catch (e) { return no(e); }
      ws.binaryType = 'arraybuffer'; let settled = false;
      const fail = e => { if (!settled) { settled = true; try { ws.close(); } catch (_) { } no(e); } };
      const t = setTimeout(() => fail(new Error('timeout')), timeout);
      ws.onopen = () => ws.send(MQ.connect('hbz' + Math.random().toString(36).slice(2, 10)));
      ws.onerror = () => fail(new Error('socket error'));
      ws.onclose = () => { this.alive = false; clearInterval(this.ping); if (!settled) fail(new Error('closed')); else if (this.onclose) this.onclose(); };
      ws.onmessage = ev => {
        const add = new Uint8Array(ev.data), nb = new Uint8Array(this.buf.length + add.length); nb.set(this.buf, 0); nb.set(add, this.buf.length);
        this.buf = MQ.parse(nb, (first, body) => {
          const type = first >> 4;
          if (type === 2) { if (body[1] === 0) { this.alive = true; settled = true; clearTimeout(t); this.ping = setInterval(() => this.send(MQ.ping()), 20000); ok(this); } else fail(new Error('refused ' + body[1])); }
          else if (type === 3) { const tl = (body[0] << 8) | body[1], topic = new TextDecoder().decode(body.slice(2, 2 + tl)), pay = new TextDecoder().decode(body.slice(2 + tl)); const h = this.subs.get(topic); if (h) h(pay); }
        });
      };
    });
  }
  send(bytes) { if (this.ws && this.ws.readyState === 1) this.ws.send(bytes); }
  sub(topic, fn) { this.subs.set(topic, fn); this.send(MQ.subscribe(this.pid++, topic)); }
  pub(topic, str) { this.send(MQ.publish(topic, str)); }
  close() { try { clearInterval(this.ping); this.ws && this.ws.close(); } catch (e) { } this.alive = false; }
}
const Relay = {
  conns: [], tr: new Map(),
  base: code => 'hbzrelay/' + code,
  async listen(code) {                                      // host: listen on every broker we can reach, so a guest finds us on whichever it can use
    this.stop(); const res = await Promise.allSettled(MQTT_BROKERS.map(u => new MqttConn(u).connect()));
    this.conns = res.filter(r => r.status === 'fulfilled').map(r => r.value);
    for (const c of this.conns) c.sub(this.base(code) + '/up', raw => this._hostIn(c, code, raw));
    return this.conns.length;
  },
  _hostIn(conn, code, raw) {
    let m; try { m = JSON.parse(raw); } catch (e) { return; } if (!m || !m.c) return;
    let t = this.tr.get(m.c);
    if (m.bye) { if (t) { this.tr.delete(m.c); t.onclose && t.onclose(); } return; }
    if (!t) {
      if (!m.join) return;
      t = { relay: true, onmessage: null, onclose: null, send: s => conn.pub(this.base(code) + '/dn/' + m.c, s), close: () => { conn.pub(this.base(code) + '/dn/' + m.c, JSON.stringify({ k: 'bye', d: 0 })); } };
      this.tr.set(m.c, t); Net.hz = RELAY_HZ; Net.accept(t); return;
    }
    if (m.m !== undefined && t.onmessage) t.onmessage(m.m);
  },
  async join(code) {                                        // guest: try each broker until one works
    const cid = Math.random().toString(36).slice(2, 10); let lastErr = 'no broker reachable';
    for (const u of MQTT_BROKERS) {
      let conn; try { conn = await new MqttConn(u).connect(); } catch (e) { lastErr = u + ': ' + e.message; continue; }
      const queue = []; let handler = null;
      const tr = { relay: true, send: s => conn.pub(this.base(code) + '/up', JSON.stringify({ c: cid, m: s })), onclose: null,
        close: () => { conn.pub(this.base(code) + '/up', JSON.stringify({ c: cid, bye: 1 })); setTimeout(() => conn.close(), 200); },
        get onmessage() { return handler; }, set onmessage(f) { handler = f; if (f) while (queue.length) f(queue.shift()); } };
      conn.sub(this.base(code) + '/dn/' + cid, raw => { if (handler) handler(raw); else queue.push(raw); });
      conn.onclose = () => tr.onclose && tr.onclose();
      this.conns.push(conn);
      await new Promise(r => setTimeout(r, 400));          // let the subscription settle before the host answers
      conn.pub(this.base(code) + '/up', JSON.stringify({ c: cid, join: 1 }));
      Net.hz = RELAY_HZ; Net.join(tr); return u;
    }
    throw new Error('Relay unavailable (' + lastErr + ')');
  },
  stop() { for (const c of this.conns) c.close(); this.conns = []; this.tr.clear(); }
};
