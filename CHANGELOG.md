# Changelog
## Unreleased
- Co-op multiplayer (host + guests): CO-OP button, WebRTC join codes, shared hub & dungeon, shared enemies/bosses, damage both ways. See docs/MULTIPLAYER.md for what is still host-only.
- Enemies, bosses and hazards now target and hurt any player (`players[]`).

## 0.1.0
- Renamed to HEXBUSTER Z; repo restructured into modules; game data moved to JSON.
- Versioned save system with migrations, backups, export/import codes.
- Seeded deterministic world generation; fixed 120 Hz simulation step; net seam (`Net`) for future co-op.
