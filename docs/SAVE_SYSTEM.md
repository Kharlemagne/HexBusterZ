# Save system rules
Goal: updates never wipe a player's progress.
1. Saves are versioned (`data/meta.json` `saveSchema`). Any change to saved shape = bump the version AND append a function to `MIGRATIONS` in `49-save.js`. Never edit or remove old migrations.
2. Before migrating or importing, a timestamped backup is stored (`hbz.backup.*`, last 5 kept); a rolling `hbz.save.bak` also exists.
3. Missing fields are filled from defaults; unknown fields are preserved.
4. A save from a *newer* version than the running build is never downgraded or stripped.
5. Corrupt saves fall back to the backup.
6. Legacy `cubicide_*` keys are imported and left untouched.
7. Export/Import codes (`HBZ1.<base64>.<checksum>`) move saves between origins (e.g. artifact vs GitHub Pages).
8. Wiping is a last resort: needs a documented reason in CHANGELOG and an export prompt first.
Hub terrain is saved as seed + sparse block edits. Run `tests/save-migration.mjs` after any change here.

## Schema history
- **v1** — `hub: {seed, edits}`, `profile`, `settings`.
- **v2** — the village became part of an open world: `world: {seed, villageSeed, genVersion, edits}` and `inv` (inventory). Migration `1 -> 2` copies old village edits into `world.edits` and keeps the old hub seed as `villageSeed` *only if the player had built something*, so existing builds still fit; everyone else gets the shared Ember Village. The old `hub` block is left untouched.
