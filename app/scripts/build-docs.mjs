import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, '..', 'docs');
const built = join(root, 'dist', 'cv', 'browser');

if (basename(out) !== 'docs') throw new Error(`refusing to clean ${out}`);

execFileSync(
  process.execPath,
  [join(root, 'node_modules', '@angular', 'cli', 'bin', 'ng.js'), 'build'],
  { cwd: root, stdio: 'inherit' },
);
if (!existsSync(join(built, 'index.html'))) throw new Error('ng build produced no index.html');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(built, out, { recursive: true });
rmSync(join(out, 'index.csr.html'), { force: true });
writeFileSync(join(out, '.nojekyll'), '');
console.log(`docs/ ready: ${readdirSync(out).join(', ')}`);
