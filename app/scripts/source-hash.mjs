import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** What the built site is made from. The generated `build-info.ts` is left out: it carries the build date. */
const INPUT_DIRS = ['src', 'public'];
const INPUT_FILES = ['angular.json', 'package.json', 'package-lock.json', 'test-counts.json', 'tsconfig.json', 'tsconfig.app.json', 'scripts/build-docs.mjs', 'scripts/csp.mjs'];
const GENERATED = new Set(['src/app/egg/build-info.ts']);
const TEXT = /\.(ts|scss|css|html|json|txt|xml|svg|mjs)$/;

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

/**
 * A fingerprint of the sources of the site, the same on every machine: paths use "/", and line endings of text
 * files are normalised, so a Windows checkout and a Linux one agree.
 */
export function sourceHash() {
  const files = [...INPUT_DIRS.flatMap((d) => walk(join(root, d))), ...INPUT_FILES.map((f) => join(root, f))]
    .map((f) => relative(root, f).split(sep).join('/'))
    .filter((f) => !GENERATED.has(f))
    .sort();
  const hash = createHash('sha256');
  for (const f of files) {
    let data = readFileSync(join(root, f));
    if (TEXT.test(f)) data = Buffer.from(data.toString('utf8').split('\r\n').join('\n'));
    hash.update(`${f}\0${data.length}\0`).update(data);
  }
  return hash.digest('hex');
}
