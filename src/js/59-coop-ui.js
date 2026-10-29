// ---------------- co-op lobby: WebRTC with copy/paste join codes (no server needed) ----------------
// Host: "HOST A GAME" -> copy the invite code to a friend -> paste their reply code -> connected.
// Guest: "JOIN A GAME" -> paste the invite -> copy the reply code back to the host.
const RTC_CFG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };
const Coop = {
  pc: null, ch: null,
  _enc(desc) { return 'HBZJ1.' + btoa(unescape(encodeURIComponent(JSON.stringify(desc)))); },
  _dec(code) { const m = /HBZJ1\.([A-Za-z0-9+/=]+)/.exec(code || ''); if (!m) throw new Error('That is not a HEXBUSTER Z join code.'); return JSON.parse(decodeURIComponent(escape(atob(m[1])))); },
  _transport(ch) {
    const tr = { send: s => { if (ch.readyState === 'open') ch.send(s); }, onmessage: null, onclose: null, close() { try { ch.close(); } catch (e) { } } };
    ch.onmessage = ev => tr.onmessage && tr.onmessage(ev.data);
    ch.onclose = () => tr.onclose && tr.onclose();
    return tr;
  },
  _gathered(pc) {
    return new Promise(res => {
      if (pc.iceGatheringState === 'complete') return res();
      const done = () => { if (pc.iceGatheringState === 'complete') { pc.removeEventListener('icegatheringstatechange', done); res(); } };
      pc.addEventListener('icegatheringstatechange', done); setTimeout(res, 6000);     // don't hang forever behind a strict firewall
    });
  },
  async makeInvite() {                                    // host step 1
    this.close(); const pc = this.pc = new RTCPeerConnection(PEER_OPTS.config), ch = this.ch = pc.createDataChannel('hbz', { ordered: true });
    const opened = new Promise(r => { ch.onopen = r; });
    await pc.setLocalDescription(await pc.createOffer()); await this._gathered(pc);
    this.pendingHost = opened.then(() => { Net.accept(this._transport(ch)); return true; });
    return this._enc(pc.localDescription.toJSON());
  },
  async acceptReply(code) { await this.pc.setRemoteDescription(this._dec(code)); return this.pendingHost; },   // host step 2
  async joinInvite(code) {                                // guest: returns the reply code
    this.close(); const pc = this.pc = new RTCPeerConnection(PEER_OPTS.config);
    pc.ondatachannel = ev => { const ch = this.ch = ev.channel; const go = () => Net.join(this._transport(ch)); if (ch.readyState === 'open') go(); else ch.onopen = go; };
    await pc.setRemoteDescription(this._dec(code)); await pc.setLocalDescription(await pc.createAnswer()); await this._gathered(pc);
    return this._enc(pc.localDescription.toJSON());
  },
  close() { try { this.ch && this.ch.close(); this.pc && this.pc.close(); } catch (e) { } this.pc = this.ch = null; }
};
function cpMsg(t) { const m = $('cp-msg'); if (m) m.textContent = t; }
function openCoopManual() {
  if (typeof RTCPeerConnection === 'undefined') { el.savebox.innerHTML = '<div class="sh-t">CO-OP</div><div class="sh-m">This browser / view does not support peer-to-peer connections (WebRTC).</div><div><button onclick="closeSaveBox()">CLOSE</button></div>'; el.savebox.classList.add('on'); return; }
  const live = Net.role !== 'offline';
  el.savebox.innerHTML = '<div class="sh-t">CO-OP</div><div class="sh-g">Up to you and a friend, no accounts, no servers. The host runs the game and keeps the village.</div>'
    + (live ? '<div class="sh-m">' + (Net.role === 'host' ? 'HOSTING · ' + (players.length - 1) + ' guest(s) connected' : 'CONNECTED TO A HOST') + '</div><div><button onclick="coopLeave()">DISCONNECT</button><button onclick="closeSaveBox()">CLOSE</button></div>'
    : '<div class="sb-l">HOST — step 1: make an invite and send it to your friend</div><div><button onclick="coopMakeInvite()">HOST A GAME</button></div><textarea id="cp-out" readonly rows="3" placeholder="invite code appears here"></textarea>'
    + '<div><button onclick="coopCopy()">COPY INVITE</button></div>'
    + '<div class="sb-l">HOST — step 2: paste the reply code your friend sends back</div><textarea id="cp-reply" rows="3" placeholder="HBZJ1.…"></textarea><div><button onclick="coopAccept()">CONNECT</button></div>'
    + '<div class="sb-l">JOIN — paste the invite you were sent, then send the reply code back</div><textarea id="cp-in" rows="3" placeholder="HBZJ1.…"></textarea><div><button onclick="coopJoin()">JOIN A GAME</button></div>'
    + '<textarea id="cp-ans" readonly rows="3" placeholder="your reply code appears here"></textarea><div><button onclick="coopCopy(\'cp-ans\')">COPY REPLY</button><button onclick="openCoopBox()">BACK</button></div>')
    + '<div class="sh-m" id="cp-msg"></div>';
  el.savebox.classList.add('on');
}
async function coopMakeInvite() { try { cpMsg('Making invite…'); $('cp-out').value = await Coop.makeInvite(); cpMsg('Send this code to your friend.'); } catch (e) { cpMsg('Could not make an invite: ' + e.message); } }
async function coopAccept() { try { cpMsg('Connecting…'); await Coop.acceptReply($('cp-reply').value); cpMsg('Connected! Close this box and play.'); setTimeout(() => { if (Net.role !== 'offline') closeSaveBox(); }, 900); } catch (e) { cpMsg('Failed: ' + e.message); } }
async function coopJoin() {
  try {
    cpMsg('Joining…'); $('cp-ans').value = await Coop.joinInvite($('cp-in').value); cpMsg('Send the reply code to the host. This box closes once you are connected.');
    const t = setInterval(() => { if (Net.role === 'client') { clearInterval(t); closeSaveBox(); startGame(); } }, 400); setTimeout(() => clearInterval(t), 120000);
  } catch (e) { cpMsg('Failed: ' + e.message); }
}
function coopCopy(id) { const o = $(id || 'cp-out'); o.select(); try { navigator.clipboard.writeText(o.value); cpMsg('Copied.'); } catch (e) { try { document.execCommand('copy'); cpMsg('Copied.'); } catch (_) { cpMsg('Select the text and copy it by hand.'); } } }
function coopLeave() { if (Net.role === 'host') { Net.broadcast('bye', 0); } Net.leave(); Coop.close(); Coop.closeRoom(); closeSaveBox(); }

// ---- the easy way: a 5-letter room code, brokered by the free public PeerJS cloud (only used to introduce the two browsers) ----
// STUN finds your public address; TURN relays when two home networks can't reach each other directly (strict NAT, phone data, school/work Wi-Fi).
const PEER_OPTS = { config: { iceServers: [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:global.stun.twilio.com:3478'] },
  { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' },
  { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' }
] } };
const PEERJS_URLS = ['https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js', 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'];
const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
Object.assign(Coop, {
  peer: null,
  async loadPeerJS() {
    if (window.Peer) return;
    for (const u of PEERJS_URLS) {
      try { await new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = u; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); setTimeout(no, 8000); }); if (window.Peer) return; } catch (e) { }
    }
    throw new Error('Could not reach the matchmaking service. Check your connection, or use "manual codes" below.');
  },
  async hostRoom(onCode) {
    await this.loadPeerJS(); this.closeRoom();
    for (let tries = 0; tries < 6; tries++) {
      const code = Array.from({ length: 5 }, () => ROOM_CHARS[(Math.random() * ROOM_CHARS.length) | 0]).join('');
      try {
        await new Promise((ok, no) => {
          const peer = new Peer('hbzcoop-' + code, PEER_OPTS); this.peer = peer;
          peer.on('open', () => ok()); peer.on('error', e => no(e));
          peer.on('connection', conn => { const go = () => Net.accept(this._peerTransport(conn)); if (conn.open) go(); else conn.on('open', go); });
          setTimeout(() => no({ type: 'timeout' }), 10000);
        });
        onCode(code); return code;
      } catch (e) { try { this.peer && this.peer.destroy(); } catch (_) { } this.peer = null; if (e && e.type !== 'unavailable-id') throw new Error('Matchmaking failed (' + ((e && e.type) || e) + ').'); }
    }
    throw new Error('Could not get a room code, try again.');
  },
  async joinRoom(code) {
    code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (code.length !== 5) throw new Error('Room codes are 5 letters/numbers.');
    await this.loadPeerJS(); this.closeRoom();
    const peer = this.peer = new Peer(undefined, PEER_OPTS);
    await new Promise((ok, no) => { peer.on('open', ok); peer.on('error', no); setTimeout(() => no({ type: 'timeout' }), 10000); }).catch(e => { throw new Error('Matchmaking failed (' + ((e && e.type) || e) + ').'); });
    await new Promise((ok, no) => {
      const conn = peer.connect('hbzcoop-' + code, { reliable: true }), tr = this._peerTransport(conn); let ice = 'waiting for the host', done = false;
      const fail = e => { if (!done) { done = true; no(e); } };
      peer.on('error', e => fail(e.type === 'peer-unavailable' ? new Error('No game with that code. Check it, and make sure the host is still on the CO-OP screen.') : e));
      const watch = setInterval(() => { const pc = conn.peerConnection; if (pc) { ice = pc.iceConnectionState + '/' + pc.connectionState; if (pc.iceConnectionState === 'failed') fail(new Error('The two networks could not reach each other (' + ice + '). One of you is behind a strict firewall / phone data; try other Wi-Fi.')); } }, 500);
      conn.on('open', () => { if (done) return; done = true; clearInterval(watch); Net.join(tr); ok(); });
      conn.on('error', e => fail(e));
      setTimeout(() => { clearInterval(watch); fail(new Error('Could not connect in time (' + ice + '). The room code was found but the direct link never opened. Try other Wi-Fi, or manual codes.')); }, 30000);
    });
  },
  _peerTransport(conn) {                                  // messages that arrive before the game attaches its handler are queued, never lost
    let handler = null; const queue = [];
    const tr = { send: s => { if (conn.open) conn.send(s); }, onclose: null, close() { try { conn.close(); } catch (e) { } },
      get onmessage() { return handler; }, set onmessage(f) { handler = f; if (f) while (queue.length) f(queue.shift()); } };
    conn.on('data', d => { const m = typeof d === 'string' ? d : JSON.stringify(d); if (handler) handler(m); else queue.push(m); });
    conn.on('close', () => tr.onclose && tr.onclose());
    return tr;
  },
  closeRoom() { try { this.peer && this.peer.destroy(); } catch (e) { } this.peer = null; }
});
function openCoopBox() {
  const live = Net.role !== 'offline';
  el.savebox.innerHTML = '<div class="sh-t">CO-OP</div><div class="sh-g">Play with a friend. The host runs the game and keeps the village.</div>'
    + (live ? '<div class="sh-m">' + (Net.role === 'host' ? 'HOSTING · ' + (players.length - 1) + ' friend(s) connected' : 'CONNECTED TO A HOST') + '</div><div><button onclick="coopLeave()">DISCONNECT</button><button onclick="closeSaveBox()">CLOSE</button></div>'
    : '<div class="sb-l">HOST — you get a room code to tell your friend</div><div><button onclick="coopHostRoom()">HOST A GAME</button></div><div id="cp-room" style="font-size:44px;letter-spacing:12px;color:#37f0ff;margin:6px"></div>'
    + '<div class="sb-l">JOIN — type the room code your friend gave you</div><input id="cp-code" maxlength="5" placeholder="ABCDE" style="font-size:28px;letter-spacing:8px;text-align:center;width:9em;background:#06020f;color:#cfe;border:2px solid #4a2a8a;padding:6px;text-transform:uppercase"><div><button onclick="coopJoinRoom()">JOIN</button></div>'
    + '<div><button onclick="openCoopManual()" style="font-size:9px;opacity:.7">trouble connecting? use manual codes</button><button onclick="closeSaveBox()">CLOSE</button></div>')
    + '<div class="sh-m" id="cp-msg"></div>';
  el.savebox.classList.add('on');
}
async function coopHostRoom() {
  try {
    cpMsg('Opening a room…');
    await Coop.hostRoom(code => { $('cp-room').textContent = code; cpMsg('Tell your friend this code. Keep this screen open until they join, then close it and play.'); });
    const t = setInterval(() => { if (Net.role === 'host' && Net.peers.size) { clearInterval(t); cpMsg('A friend joined! Close this box and play.'); setTimeout(closeSaveBox, 1200); } }, 400); setTimeout(() => clearInterval(t), 600000);
  } catch (e) { cpMsg(e.message); }
}
async function coopJoinRoom() {
  try { cpMsg('Joining…'); await Coop.joinRoom($('cp-code').value); cpMsg('Connected!'); setTimeout(() => { closeSaveBox(); startGame(); }, 700); } catch (e) { cpMsg(e.message); }
}
