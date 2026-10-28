# Architecture
- `build.mjs` concatenates `src/js/*.js` (filename order = load order, global scope), inlines `src/css/style.css` and `data/*.json` (as `DATA`) into `dist/index.html`.
- Data-driven: blocks, ranks, weapons, shop, enemies, boss designs, attack metadata, tuning, music live in `data/`. Attack *behaviour* is in `43-boss-attacks.js` (`ATK_RUN`, keyed by id). **Order in `data/attacks.json` and boss design arrays must not change** — seeds pick by index.
- Simulation runs at fixed `SIM_DT = 1/120`; rendering is separate. World generation uses seeded RNG (`setWorldSeed`, `R`, `rw`).
- All block edits go through `setBlock`, which notifies `blockListeners` (used by saves and networking).
- Tests: `tests/*.mjs` (Playwright, software GL). `window.__g` is a debug API.
