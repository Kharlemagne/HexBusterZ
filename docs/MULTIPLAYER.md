# Multiplayer (co-op, host-authoritative, WebRTC)

## How it works
- **Host** runs the real game: enemies, bosses, projectiles, hazards, rooms, the village and its save.
- **Guests** rebuild the same world from a seed (`world` message: hub seed + village edits, or the dungeon run seed), send their own position / hits / block edits, and render what the host sends (20 snapshots per second, smoothed).
- Each guest owns their own movement and health. When the host decides a guest was hit it sends `hurt`; the guest applies it to itself (so shields / dashes / invincibility frames still work locally).
- Guest hits go to the host as `dmg` messages, so enemy and boss health only ever lives on the host.
- Block edits go through `setBlock` -> `blockListeners` and are relayed both ways; the host's village save records everyone's builds.
- Connecting: **CO-OP** button on the title screen. Host makes an invite code, guest pastes it and sends back a reply code (WebRTC offer/answer, Google STUN). No server.

## Code map
- `src/js/58-net.js` — `Net` (roles, messages, snapshots, proxies, remote player drawing). Transport = `{ send(str), onmessage, onclose, close() }`.
- `src/js/59-coop-ui.js` — WebRTC (`Coop`) + the lobby panel.
- `players[]` / `TGT` / `nearestPlayer()` in `60-game-state.js`: `P` is always the local player; others are `remote` bodies. Enemies and bosses chase the nearest living player; `hurtPlayer(..., who)` routes damage to remote players through `Net`.
- Tests: `tests/boss-attacks.mjs` (all 20 attacks with 2 players), `tests/coop.mjs` (two browsers over a relay), `tests/coop-webrtc.mjs` (real WebRTC handshake).

## Known gaps (next milestones)
1. **Dungeon progression is host-led**: rooms seal/unseal based on the *host's* position; chests, keys, gems, glyph and "return to village" only react to the host. Needs the room logic in `53-interaction.js` to consider every player and send chest/key/gem events.
2. **Kill credit / loot** (score, style, gems) goes to the host only.
3. Remote players are drawn as simple placeholder robots; weapons/shots of other players are not shown yet (no remote muzzle flashes, beams or sounds).
4. Bullet time is local to whoever triggered it (the host's slows the host's simulation of the world; a guest's affects only their own view). Needs a co-op rule.
5. No reconnect, no host migration, no relay for the ~10-15% of networks that block direct connections (would need a TURN server).
6. Death / revive rules for co-op.
7. Math.sin/cos may differ between browsers; world generation uses seeded RNG and tests assert identical worlds within one engine.

## Rules for changing the game
- Anything that changes enemy/boss/projectile/hazard state must run only when `Net.role !== 'client'`.
- Anything players can see about those things must be in the snapshot (`_sendSnap` / `_on_snap`).
- Never apply damage to `P` from a code path the host runs for a remote player — use `hurtPlayer(..., who)`.
