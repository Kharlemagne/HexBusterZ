# Changelog
## Unreleased
- **The Helicarrier + floating islands** (world generation 2): new worlds are a sky of floating biome islands over an eldritch abyss, with a huge Helicarrier carrying a neon eldritch city, the Hellgate at its far front, and lava falls pouring from underside vents. Older worlds keep the old terrain and village (`meta.gen`).
- **Gamepad**: BACK opens the backpack / character screen, START opens the game menu; D-pad or left stick navigates every menu (A select, B back, left/right on sliders) and the backpack (A pick up/drop, X half/one, Y quick-move, LB/RB weapon, RT sort).
- **Menus**: Minecraft-style title screen with a living panorama, splash text, world list (create with name / seed / mode, rename, delete), options (volumes, render distance, FOV, sensitivity, shake, invert), pause menu, save and quit. Save schema 3: many worlds, each with its own blocks, time and inventory.
- **Sky**: sun and moons now set behind the horizon; two eldritch suns and four eldritch moons; fog only hides the render-distance edge.
- **Lava** flows (world-space animated shader, swelling surface, embers). **Item drops** from broken blocks. **Player model** (black skeleton-robot) and a character screen with loadout, equipment slots and backpack.
- **Textures** on every block, entity and weapon (procedural 16x16 atlas). **Day/night cycle** with a real sky (sun, eye-moon, stars), a clear horizon, night lighting and a clock in the HUD.
- **Open world**: endless streamed chunks, four eldritch-cyberpunk biomes, caves, ore, wild Hellgates into dungeon runs, fixed Ember Village at spawn. Save schema 2 (migrates old village builds). See docs/WORLD.md.
- **Inventory**: 36 slots, pick up what you dig, place from the hotbar, shards from demon ore sell to Vex, creative toggle.
- Co-op relay fallback through public MQTT brokers when two networks can't connect directly; connection test button; version shown in the CO-OP box.
- Co-op fixes: door seals sync (no walking through), rooms/chests/key/glyph respond to every player, shared "enemies left" counter, shots/slashes/sparks/sounds visible to all players.
- Co-op multiplayer (host + guests): CO-OP button, WebRTC join codes, shared hub & dungeon, shared enemies/bosses, damage both ways. See docs/MULTIPLAYER.md for what is still host-only.
- Enemies, bosses and hazards now target and hurt any player (`players[]`).

## 0.1.0
- Renamed to HEXBUSTER Z; repo restructured into modules; game data moved to JSON.
- Versioned save system with migrations, backups, export/import codes.
- Seeded deterministic world generation; fixed 120 Hz simulation step; net seam (`Net`) for future co-op.
