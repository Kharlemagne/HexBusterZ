'use strict';
// ============================================================
//  HEXBUSTER Z — voxel action-FPS (formerly CUBICIDE). Single file, raw WebGL, no deps.
// ============================================================
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const TAU = Math.PI * 2;
const hx = h => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];
const sstep = t => t * t * (3 - 2 * t);

