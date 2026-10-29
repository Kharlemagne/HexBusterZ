# The open world

Ember Village sits at the origin of an endless sandbox; Hellgates scattered in the wild lead into the (unchanged) dungeon runs.

## How it works
- **Chunks** (`src/js/24-overworld.js`): 16×16 columns, 96 blocks tall (`WORLD_H`), generated around every player (`OW.LOAD` = 7 chunks), dropped beyond `OW.KEEP` = 9. Generation is time-budgeted per frame; `OW.get()` returns *solid* for chunks that are not loaded yet, so nothing walks off the edge of the loaded map.
- **Seed → world** (`25-overworld-gen.js`): value noise + hashing only, so every machine builds the same world. Four biomes (NEON WASTES, FLESH FOREST, VOID SPIRES, ASH LANDS) are blended by two low-frequency noise fields; caves are 3D noise; ore (`DEMON ORE` → shards) and hellstone veins are hash-scattered; features (pylons, ruined towers, fungal trees, tendrils, monoliths, floating shards, bone spires, ...) are decided per *origin column* so they line up across chunk borders.
- **Ember Village** is identical for every world seed: it is generated once (`genVillage`, uses the fixed arrays) and stamped into the chunks at the origin (`OW.ensureStamp`). The ground around it is flat and rises gradually.
- **Hellgates**: one candidate per 208×208 region (`gateOf`), never within ~110 blocks of the village. Walking into one starts a dungeon whose seed comes from the gate, and you return to that gate. The HUD shows the nearest gate and its direction.
- **Dungeons** still use the fixed arrays (`useChunks = false`, `H = 36`). `get()` / `setBlock()` / the mesher branch on `useChunks`.

## Saving
Only player changes are stored: `OW.edits` (grouped by chunk) ⇄ `doc.world.edits = [[x,y,z,id], ...]` (`WorldSave` in `49-save.js`, cap 100 000). Edits are re-applied whenever a chunk is generated, so unloading never loses anything. A guest in co-op keeps the host's world edits in memory only.

## Adding things
- **A block**: add its colour to `data/blocks.json` (`colors`, `names`, optionally `emissive` and `build`). Never reuse or renumber an id (saves store ids).
- **A biome / feature**: biome heights are in `biomeHeight`, surface/filler in `OWG.gen`, decorations are `*(put, x, h, z, ...)` builders. Changing generation changes every existing world's *unedited* terrain: if you must, bump `genVersion` in the save and keep the old generator (see docs/SAVE_SYSTEM.md).
- Anything randomly placed must use `ih()` / the seeded noise, never `Math.random()`.

## Inventory
`57-inventory.js`: 36 slots (first 9 = dig-kit hotbar), stacks of 99, items are block ids or strings (`ITEMS`). Breaking a block adds it (`dropOf`), placing uses it up unless CREATIVE is on. `I` / Tab opens the screen. Saved in `doc.inv`.

## Textures
`src/js/22-textures.js` paints a 256×256 atlas of 16×16 pixel-art tiles in code (no image files). Tiles are **multiplier maps** (160/255 = leave the colour alone; the shader multiplies by 1.6 for bright accents), so `data/blocks.json` still decides each block's colour and the tile adds the pattern. Tile index = block id × 2 (+1 for the top face); entity tiles start at 64 (`TILE.*`); tile 0 is plain white (beams, particles). To texture a new block, add `PAINT[id] = (x, y, isTop, noise, seed) => multiplier` (a number or `[r,g,b]`). Entity parts pick a tile from their colour (`partTile`), emissive parts use `TILE.GLOW`. Faces get random mirroring so repeats don't read as a grid; far away, textures fade to the tile's average colour to avoid shimmer. Vertex layout is 10 floats (`VF`): position 3, colour 4 (alpha = fog on/off), uv 2, tile 1 (negative = emissive: ignores night).

## Day and night
`27-daynight.js`: one cycle per `dayLengthSeconds` (data/tuning.json, 600 = 10 minutes). `tod` 0 = midnight, .25 sunrise, .5 noon, .75 sunset, kept in `world.time` of the save; in co-op the host's clock rides along in every snapshot. `SKY_KEYS` are the zenith/horizon colour keyframes. The sky is a full-screen shader pass (gradient, bright horizon band, sun, an "eye" moon with a slit pupil, stars). Far terrain fades to a slightly *darker*, biome-tinted haze than the sky directly above it, which is what makes the horizon read as a line. Night multiplies lit surfaces by `amb` (30% at night); neon / lava / ore (emissive) keep glowing, and a lamp around the player keeps nearby blocks readable. Dungeons ignore all of this.
