import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
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

// The prerendered HTML is complete without JS: hydration code must not compete with the
// portrait (LCP) and the critical HTML for bandwidth, so the module bundle is fetched at low priority.
for (const page of ['index.html', join('hu', 'index.html')]) {
  const file = join(out, page);
  const html = readFileSync(file, 'utf8')
    .replace(/<link rel="modulepreload" (?![^>]*fetchpriority)/g, '<link rel="modulepreload" fetchpriority="low" ')
    .replace(/<script src="([^"]+\.js)" type="module"(?![^>]*fetchpriority)/g, '<script src="$1" type="module" fetchpriority="low"');
  if (!html.includes('fetchpriority="low"')) throw new Error(`${page}: no module script to deprioritise`);
  writeFileSync(file, html);
}
console.log(`docs/ ready: ${readdirSync(out).join(', ')}`);
