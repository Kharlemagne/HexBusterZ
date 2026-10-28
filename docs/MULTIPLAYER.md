# Multiplayer plan (co-op, host-authoritative, WebRTC)
Groundwork done: seeded generation (clients rebuild the same world from a seed), entity ids (`nextId`), single block-edit funnel with listeners, fixed-step sim, `Net` seam (`58-net.js`).
Milestones:
1. Players array refactor (replace singleton `P`).
2. Host sim + client input messages; snapshot/interpolation of entities.
3. Block edits & hub sync via `block` messages.
4. WebRTC signalling (copy/paste code or tiny relay), lobby UI.
5. Boss/dungeon sync, drop-in/out, tests with two headless pages.
Known risk: Math.sin/cos may differ across engines; keep gameplay-critical randomness seeded and host-authoritative.
