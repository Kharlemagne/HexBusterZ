# HEXBUSTER Z

Browser voxel action-FPS roguelite. Hub village, Isaac-style dungeons, procedural bosses built from swappable head/torso/legs pieces, bullet time, grapple, homing attacks. Zero runtime dependencies (raw WebGL).

## Develop
```
npm install          # only needed for tests (playwright)
node build.mjs       # -> dist/index.html (single file)
node tools/serve.mjs # local server
node tests/run-all.mjs [--quick]
```
Code is in `src/js/*.js` (concatenated in filename order), game data in `data/*.json` (inlined at build).

## Docs
- [Architecture](docs/ARCHITECTURE.md)
- [Save system rules](docs/SAVE_SYSTEM.md) — read before changing anything persisted
- [Multiplayer plan](docs/MULTIPLAYER.md)

**Co-op:** title screen -> CO-OP. One player hosts and gets a 5-letter room code; the other types it in. Works on the hosted (Pages) build.

Deploys to GitHub Pages on push to `main` (Settings → Pages → Source: GitHub Actions).
