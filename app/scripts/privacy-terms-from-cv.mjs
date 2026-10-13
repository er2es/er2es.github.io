import { execFileSync } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cv = join(root, '..', 'cv');
const terms = new Set();

for (const f of readdirSync(cv)) {
  if (/\.pdf$/i.test(f)) {
    const text = execFileSync('pdftotext', ['-enc', 'UTF-8', join(cv, f), '-'], { encoding: 'utf8' });
    for (const m of text.match(/\+?36[\s\-/]*\d{1,2}[\s\-/]*\d{3}[\s\-/]*\d{2}[\s\-/]*\d{2}/g) ?? []) terms.add(`digits:${m.replace(/\D/g, '')}`);
    for (const m of text.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) ?? []) if (m !== 'claude@mbvk.hu') terms.add(`text:${m}`);
  }
  if (/\.jpe?g$/i.test(f)) terms.add(`text:${f.replace(/\.[^.]+$/, '')}`);
}
writeFileSync(join(root, '.privacy-terms.local'), [...terms].join('\n') + '\n');
console.log(`wrote ${terms.size} private terms to app/.privacy-terms.local (git-ignored)`);
