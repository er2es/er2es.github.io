import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceHash } from './source-hash.mjs';

// Fails when the sources have changed since `docs/` was built: the site that is served would not match the code.
const stamp = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', '.source-hash');
if (!existsSync(stamp)) {
  console.error('docs/.source-hash is missing: run `npm run build` and commit docs/');
  process.exit(1);
}
const built = readFileSync(stamp, 'utf8').trim();
const now = sourceHash();
if (built !== now) {
  console.error(`docs/ was built from other sources than the ones in this commit (${built.slice(0, 12)} vs ${now.slice(0, 12)}): run \`npm run build\` and commit docs/`);
  process.exit(1);
}
console.log(`docs ok: built from the sources in this commit (${now.slice(0, 12)})`);
