
// ---------------- game state ----------------
let state = 'menu', fallback = false, T = 0, hitstop = 0;
const keys = {}, mouse = { l: false, r: false };
const P = { x: 32, y: 12, z: 32, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0, hp: 100, hw: .3, h: 1.75, eye: 1.6, onGround: false, wasGround: false, airT: 0,
  sliding: false, slamming: false, dashT: 0, dashF: 3, dashX: 0, dashZ: 0, inv: 0, shake: 0, alive: true, weapon: 0, lastWeapon: 1, hurtFlash: 0, landDip: 0,
  coyote: 0, zoom: false, buildSel: 0, charge: 0, fov: 1.6, hitT: 0, kick: 0, kickRot: 0, flashT: 0, bobT: 0, swing: 0, prevSlide: false, slowT: 0, swayX: 0, swayY: 0, roll: 0, wallCd: 0, lock: null, slamT: null, bt: 0, btCd: 0, shieldT: 0, shieldFlash: 0, latch: null, floatT: 0, djump: 0, jEdge: false, snap: null, btFade: 0, fovPunch: 0 };
// ---- players: P is always the LOCAL player (it drives camera, HUD, input). Other peers are lightweight 'remote' bodies.
const players = [P];
P.id = 0; P.remote = false;
function makeRemotePlayer(id) {
  return { id, remote: true, x: 32, y: 12, z: 32, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0, hp: 100, hw: P.hw, h: P.h, eye: P.eye, alive: true, inv: 0, dashT: 0, sliding: false, weapon: 0, shieldT: 0, name: 'PLAYER ' + id };
}
function addRemotePlayer(id) { const q = makeRemotePlayer(id); players.push(q); return q; }
function removeRemotePlayer(id) { const i = players.findIndex(q => q.id === id && q.remote); if (i > 0) players.splice(i, 1); }
const livePlayers = () => players.filter(q => q.alive);
function nearestPlayer(x, z) {                               // closest living player (falls back to local P)
  let best = null, bd = 1e18;
  for (const q of players) { if (!q.alive) continue; const d = (q.x - x) ** 2 + (q.z - z) ** 2; if (d < bd) { bd = d; best = q; } }
  return best || P;
}
let TGT = P;                                                 // who the enemy / boss currently being updated is chasing
const S = { style: 0, score: 0, rank: 0, kills: 0, combo: 0, lastKill: -99, wHist: {}, time: 0, bestRank: 0 };
const Wv = { n: 1 };
const RANKS = DATA.ranks;                                     // data/ranks.json
const WNAMES = DATA.weapons;                                  // data/weapons.json
function weaponOK(i) { return !!Save.unlocked[i] && (i !== 4 || mode === 'hub'); }
const BUILD = DATA.blocks.build;
const cds = [0, 0, 0, 0, 0];
let digCd = 0;

