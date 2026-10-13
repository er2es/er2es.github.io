import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(root, '..');
const docs = join(repo, 'docs');
const termsFile = join(root, '.privacy-terms.local');
if (!existsSync(termsFile)) throw new Error('missing app/.privacy-terms.local: run `node scripts/privacy-terms-from-cv.mjs` first');

const terms = readFileSync(termsFile, 'utf8').split('\n').filter(Boolean).map((l) => {
  const i = l.indexOf(':');
  return { kind: l.slice(0, i), value: l.slice(i + 1) };
});

const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    statSync(p).isDirectory() ? walk(p) : files.push(p);
  }
})(docs);

const IDENT = /mbvk|semmelweis|uni-nke|\bnke\b|kfpr|\bjam\b|árukereső|arukereso|\beducatio\b|oktatási hivatal|honvedelem|sportpont|jó állam|good state|budapestlocal|budapestflow|konigsberg|felvi\.hu|támop|tamop|arveres/i;
const problems = [];
const TEXT = new Set(['.html', '.js', '.css', '.txt', '.xml', '.json', '.svg', '.map']);
for (const f of files) {
  if (TEXT.has(extname(f))) {
    const body = readFileSync(f, 'utf8');
    const digits = body.replace(/\D/g, '');
    const scrubbed = body.replace(/szabo\.jozsef\.acc@gmail\.com/gi, '');
    if (IDENT.test(scrubbed)) problems.push(`${f}: contains an employer/system/client name (${scrubbed.match(IDENT)[0]})`);
    for (const t of terms) {
      if (t.kind === 'text' && body.toLowerCase().includes(t.value.toLowerCase())) problems.push(`${f}: contains "${t.value}"`);
      if (t.kind === 'digits' && digits.includes(t.value.replace(/^36/, ''))) problems.push(`${f}: contains the phone number`);
    }
    for (const m of body.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/gi) ?? []) {
      if (m.toLowerCase() !== 'szabo.jozsef.acc@gmail.com' && !/\.(avif|webp|jpg|png|svg|js|css)$/i.test(m)) problems.push(`${f}: unexpected email ${m}`);
    }
  } else if (/\.(jpe?g|png|webp|avif)$/i.test(f)) {
    const meta = await sharp(f).metadata();
    if (meta.exif || meta.xmp) problems.push(`${f}: image metadata present`);
  }
  if (/466834494|Facebook|\bn \(1\)/i.test(f)) problems.push(`${f}: private-looking file name`);
}

// git history: no private text term, and no phone digits in any diff
const log = execFileSync('git', ['log', 'main', '-p', '--no-color'], { cwd: repo, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
const logDigits = log.replace(/\D/g, '');
for (const t of terms) {
  if (t.kind === 'text' && log.toLowerCase().includes(t.value.toLowerCase())) problems.push(`git history contains "${t.value}"`);
  if (t.kind === 'digits' && logDigits.includes(t.value.replace(/^36/, ''))) problems.push('git history contains the phone number');
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`privacy ok: ${files.length} files in docs/ and the git history are clean`);
