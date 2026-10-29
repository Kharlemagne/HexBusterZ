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
    this.close(); const pc = this.pc = new RTCPeerConnection(RTC_CFG), ch = this.ch = pc.createDataChannel('hbz', { ordered: true });
    const opened = new Promise(r => { ch.onopen = r; });
    await pc.setLocalDescription(await pc.createOffer()); await this._gathered(pc);
    this.pendingHost = opened.then(() => { Net.accept(this._transport(ch)); return true; });
    return this._enc(pc.localDescription.toJSON());
  },
  async acceptReply(code) { await this.pc.setRemoteDescription(this._dec(code)); return this.pendingHost; },   // host step 2
  async joinInvite(code) {                                // guest: returns the reply code
    this.close(); const pc = this.pc = new RTCPeerConnection(RTC_CFG);
    pc.ondatachannel = ev => { const ch = this.ch = ev.channel; const go = () => Net.join(this._transport(ch)); if (ch.readyState === 'open') go(); else ch.onopen = go; };
    await pc.setRemoteDescription(this._dec(code)); await pc.setLocalDescription(await pc.createAnswer()); await this._gathered(pc);
    return this._enc(pc.localDescription.toJSON());
  },
  close() { try { this.ch && this.ch.close(); this.pc && this.pc.close(); } catch (e) { } this.pc = this.ch = null; }
};
function cpMsg(t) { const m = $('cp-msg'); if (m) m.textContent = t; }
function openCoopBox() {
  if (typeof RTCPeerConnection === 'undefined') { el.savebox.innerHTML = '<div class="sh-t">CO-OP</div><div class="sh-m">This browser / view does not support peer-to-peer connections (WebRTC).</div><div><button onclick="closeSaveBox()">CLOSE</button></div>'; el.savebox.classList.add('on'); return; }
  const live = Net.role !== 'offline';
  el.savebox.innerHTML = '<div class="sh-t">CO-OP</div><div class="sh-g">Up to you and a friend, no accounts, no servers. The host runs the game and keeps the village.</div>'
    + (live ? '<div class="sh-m">' + (Net.role === 'host' ? 'HOSTING · ' + (players.length - 1) + ' guest(s) connected' : 'CONNECTED TO A HOST') + '</div><div><button onclick="coopLeave()">DISCONNECT</button><button onclick="closeSaveBox()">CLOSE</button></div>'
    : '<div class="sb-l">HOST — step 1: make an invite and send it to your friend</div><div><button onclick="coopMakeInvite()">HOST A GAME</button></div><textarea id="cp-out" readonly rows="3" placeholder="invite code appears here"></textarea>'
    + '<div><button onclick="coopCopy()">COPY INVITE</button></div>'
    + '<div class="sb-l">HOST — step 2: paste the reply code your friend sends back</div><textarea id="cp-reply" rows="3" placeholder="HBZJ1.…"></textarea><div><button onclick="coopAccept()">CONNECT</button></div>'
    + '<div class="sb-l">JOIN — paste the invite you were sent, then send the reply code back</div><textarea id="cp-in" rows="3" placeholder="HBZJ1.…"></textarea><div><button onclick="coopJoin()">JOIN A GAME</button></div>'
    + '<textarea id="cp-ans" readonly rows="3" placeholder="your reply code appears here"></textarea><div><button onclick="coopCopy(\'cp-ans\')">COPY REPLY</button><button onclick="closeSaveBox()">CLOSE</button></div>')
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
function coopLeave() { if (Net.role === 'host') { Net.broadcast('bye', 0); } Net.leave(); Coop.close(); closeSaveBox(); }
