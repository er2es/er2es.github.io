import sharp from 'sharp';
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, '..', 'cv');
const out = join(root, 'public', 'img');

const file = readdirSync(src).find((f) => /\.jpe?g$/i.test(f));
if (!file) throw new Error('no .jpg portrait found in cv/');
mkdirSync(out, { recursive: true });

// sharp drops all metadata (EXIF, XMP) unless asked to keep it; .rotate() applies EXIF orientation first.
for (const w of [320, 640]) {
  const base = sharp(join(src, file)).rotate().resize(w, w, { fit: 'cover' }).grayscale();
  await base.clone().avif({ quality: 40, effort: 6 }).toFile(join(out, `portrait-${w}.avif`));
  await base.clone().webp({ quality: 70 }).toFile(join(out, `portrait-${w}.webp`));
  await base.clone().jpeg({ quality: 76, mozjpeg: true }).toFile(join(out, `portrait-${w}.jpg`));
}

let bad = false;
for (const f of readdirSync(out)) {
  const size = statSync(join(out, f)).size;
  const meta = await sharp(join(out, f)).metadata();
  if (meta.exif || meta.xmp) { console.error(`metadata left in ${f}`); bad = true; }
  console.log(`${f}  ${size} B`);
}
const lcp = statSync(join(out, 'portrait-640.avif')).size;
if (lcp > 36000) { console.error(`portrait-640.avif is ${lcp} B, over the 36000 B budget: lower the AVIF quality`); bad = true; }
process.exit(bad ? 1 : 0);
