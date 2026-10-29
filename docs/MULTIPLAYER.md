# Multiplayer (co-op, host-authoritative, WebRTC)

## How it works
- **Host** runs the real game: enemies, bosses, projectiles, hazards, rooms, the village and its save.
- **Guests** rebuild the same world from a seed (`world` message: hub seed + village edits, or the dungeon run seed), send their own position / hits / block edits, and render what the host sends (20 snapshots per second, smoothed).
- Each guest owns their own movement and health. When the host decides a guest was hit it sends `hurt`; the guest applies it to itself (so shields / dashes / invincibility frames still work locally).
- Guest hits go to the host as `dmg` messages, so enemy and boss health only ever lives on the host.
- Block edits go through `setBlock` -> `blockListeners` and are relayed both ways; the host's village save records everyone's builds.
- Connecting: **CO-OP** button on the title screen. Easy way: host gets a 5-character room code, guest types it (the free public PeerJS cloud only introduces the two browsers; game traffic is direct WebRTC). Automatic fallback: if the direct link can't open (strict NATs), the guest connects through a free public MQTT broker (`src/js/59-relay.js`, own tiny MQTT client, ~10 updates/s). Last resort: manual copy/paste offer/answer codes (no third party).

## Code map
- `src/js/58-net.js` — `Net` (roles, messages, snapshots, proxies, remote player drawing). Transport = `{ send(str), onmessage, onclose, close() }`.
- `src/js/59-coop-ui.js` — WebRTC (`Coop`) + the lobby panel.
- `players[]` / `TGT` / `nearestPlayer()` in `60-game-state.js`: `P` is always the local player; others are `remote` bodies. Enemies and bosses chase the nearest living player; `hurtPlayer(..., who)` routes damage to remote players through `Net`.
- Tests: `tests/coop-relay.mjs` (MQTT packets + fallback), `tests/coop-dungeon.mjs` (rooms/doors/chests/fx with two players), `tests/boss-attacks.mjs` (all 20 attacks with 2 players), `tests/coop.mjs` (two browsers over a relay), `tests/coop-webrtc.mjs` (real WebRTC handshake).

## Dungeon rules in co-op
- The host runs the rooms for everyone: any living player can wake a room, open a chest (the opener gets the gems), use the key, or step into the glyph (everyone returns to the village).
- Door seals are sent as `fill` messages (and to late joiners in `world`), so nobody can walk through a sealed door.
- The snapshot carries the room states, "enemies left", key, glyph, chests and turrets; guests show those on their HUD.
- Room clear heals every player; boss gems go to every player.
- Shots, slashes, sparks and key sounds are sent as batched `fx` messages (`Net.fx`) and replayed on the other machines.
- Turrets are bought by whoever pays; the host runs them.

## Known gaps (next milestones)
1. **Kill credit** (score, style points) goes to the host only; gems from kills are not a thing, so only the score differs.
2. Other players' *projectile* weapons (rockets / grenades) are not drawn in flight, only their explosions (sparks/sounds); hitscan tracers, slashes and sounds are shared. No muzzle flashes on the placeholder robot yet.
3. Bullet time is local to whoever triggered it. Needs a co-op rule.
4. No reconnect, no host migration. The MQTT relay uses shared public brokers (no accounts, but slower, unencrypted and not guaranteed to be up); a TURN server or own relay would be the robust fix.
5. Death / revive rules for co-op.
6. Math.sin/cos may differ between browsers; world generation uses seeded RNG and tests assert identical worlds within one engine.

## Rules for changing the game
- Anything that changes enemy/boss/projectile/hazard state must run only when `Net.role !== 'client'`.
- Anything players can see about those things must be in the snapshot (`_sendSnap` / `_on_snap`).
- Never apply damage to `P` from a code path the host runs for a remote player — use `hurtPlayer(..., who)`.
