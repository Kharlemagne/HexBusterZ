// Runs every one of the 20 boss attacks with a local AND a remote player in the arena: nothing may throw,
// and boss damage aimed at the remote player must be sent over the net seam (not applied locally).
import { openGame, startPlaying, check, done } from './lib.mjs';
console.log('boss attacks (2 players)');
const g = await openGame(); const { page, errors } = g;
await startPlaying(page);
const res = await page.evaluate(() => {
  const G = __g; G.enterDungeon(4242);
  const room = G.Run.rooms.find(r => r.type === 'boss');
  const cx = room.ox + room.sz / 2, cz = room.oz + room.sz / 2, gy = G.topY(Math.floor(cx), Math.floor(cz), 40) + 1;
  G.P.x = cx - 6; G.P.z = cz; G.P.y = gy; G.P.hp = 1e9;
  const R2 = G.addRemotePlayer(7); R2.x = cx + 6; R2.z = cz; R2.y = gy;
  const sent = []; const realSend = G.Net.send; G.Net.send = (t, p, to) => { sent.push([t, p, to]); };
  const e = G.spawnBoss(cx, gy, cz + 14);
  const out = { attacks: G.ATK.length, ran: 0, failed: [] };
  for (let k = 0; k < G.ATK.length; k++) {
    try {
      e.lock = 0; e.pieces.forEach(p => p.cd = 99);
      const ok = G.ATK[k].run(e, G.ATK[k].legs ? 0 : 1, G.pieceSrc(e, 1)); out.ran++;
      for (let i = 0; i < 240; i++) { R2.inv = 0; G.update(1 / 60); }
      G.haz.length = 0; G.eprojs.length = 0;
    } catch (err) { out.failed.push(G.ATK[k].n + ': ' + err.message); }
  }
  G.Net.send = realSend;
  out.hurtMsgs = sent.filter(m => m[0] === 'hurt').length; out.badTarget = sent.some(m => m[0] === 'hurt' && m[1][0] !== 7);
  G.removeRemotePlayer(7); out.players = G.players.length;
  return out;
});
check('all 20 attacks exist', res.attacks === 20);
check('every attack ran without throwing', res.failed.length === 0 && res.ran === 20);
if (res.failed.length) console.log(res.failed);
check('remote player damage is routed through the net seam', res.hurtMsgs > 0 && !res.badTarget);
check('remote player can be removed', res.players === 1);
await g.close(); done(errors);
