// ---------------- models ----------------
function P_(o, s, c, x) { const r = { o, s, c, rgb: hx(c) }; if (x) Object.assign(r, x); return r; }
const colorInt = c => typeof c === 'string' ? parseInt(c.slice(1), 16) : c;
function partsFrom(list) {                                   // JSON part -> render part
  return list.map(p => { const x = {}; for (const k of ['e', 'sw', 'orb', 'rx']) if (p[k] !== undefined) x[k] = p[k]; return P_(p.o, p.s, colorInt(p.c), x); });
}
const ED = {};                                               // data/enemies.json
for (const [k, d] of Object.entries(DATA.enemies.types)) ED[k] = { ...d, parts: partsFrom(DATA.enemies.models[k]) };
