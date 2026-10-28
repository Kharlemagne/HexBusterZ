'use strict';
// ============================================================
//  HEXBUSTER Z — voxel action-FPS (formerly CUBICIDE). Single file, raw WebGL, no deps.
// ============================================================
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const TAU = Math.PI * 2;
// Deterministic RNG for anything that shapes the WORLD (hub terrain, dungeon layout, boss designs, sky).
// Same seed => identical result on every machine, which is what lets multiplayer clients build the same level from one number.
// (Cosmetic randomness - particles, sparks, spreads - keeps using Math.random / rnd.)
let _ws = 1;
function setWorldSeed(n) { _ws = (n >>> 0) || 1; }
function R() { _ws = (_ws + 0x6D2B79F5) | 0; let t = Math.imul(_ws ^ (_ws >>> 15), 1 | _ws); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const rw = (a = 1, b) => b === undefined ? R() * a : a + R() * (b - a);
const hyp = (a, b) => Math.sqrt(a * a + b * b);   // Math.hypot can differ in the last bit between engines; world gen must not
const newSeed = () => ((Math.random() * 4294967295) >>> 0) || 1;
// Stable ids for things that will need to be referred to over a network.
let _eid = 0; const nextId = () => ++_eid;
const hx = h => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];
const sstep = t => t * t * (3 - 2 * t);

