// Runs every tests/*.mjs file (except lib/run-all). `--quick` skips the slow soak tests.
import { readdirSync } from 'node:fs'; import { spawnSync } from 'node:child_process'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url)); const quick = process.argv.includes('--quick');
const files = readdirSync(dir).filter(f => f.endsWith('.mjs') && !['lib.mjs', 'run-all.mjs'].includes(f) && !(quick && f.startsWith('soak-'))).sort();
let bad = 0;
for (const f of files) { const r = spawnSync('node', [path.join(dir, f)], { stdio: 'inherit' }); if (r.status !== 0) { bad++; console.log(`>>> ${f} FAILED\n`); } else console.log(`>>> ${f} passed\n`); }
console.log(bad ? `${bad} test file(s) failed` : 'all tests passed'); process.exit(bad ? 1 : 0);
