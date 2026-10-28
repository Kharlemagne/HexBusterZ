
// ============================================================
//  World state: mode, dungeon grid constants, run state, and world-building helpers
// ============================================================
let mode = 'hub';
const GN = 7, CELL = 32;
const DIRS = [{ k: 'E', dx: 1, dz: 0, o: 'W' }, { k: 'W', dx: -1, dz: 0, o: 'E' }, { k: 'S', dx: 0, dz: 1, o: 'N' }, { k: 'N', dx: 0, dz: -1, o: 'S' }];
const Run = { rooms: [], map: new Map(), cur: null, glyph: null, chests: [], turrets: [], smoke: [], hasKey: false, gems: 0, queue: [], spawnT: 0, boss: null };
const NPC = { x: 22.5, y: 9.01, z: 40.5, yaw: 0, t: 0 };
const GATE = { x0: 29, x1: 36, z0: 9, z1: 12, y0: 9, y1: 19 };

function clearWorld(w) {
  N = w; NC = w / CS; world.fill(0); blood.fill(0);
  for (let i = 0; i < 16; i++) chunkCount[i] = [];
  dirty.clear();
}
function fillBox(x0, y0, z0, x1, y1, z1, id) {
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    if (x < 0 || z < 0 || x >= N || z >= N || y < 0 || y >= H) continue;
    world[idx(x, y, z)] = id;
  }
}
const setRaw = (x, y, z, id) => { if (x >= 0 && z >= 0 && x < N && z < N && y >= 0 && y < H) world[idx(x, y, z)] = id; };

