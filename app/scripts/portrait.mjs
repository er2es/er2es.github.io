import sharp from 'sharp';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, '..', 'cv');
const out = join(root, 'public', 'img');

const file = readdirSync(src).find((f) => /\.jpe?g$/i.test(f));
if (!file) throw new Error('no .jpg portrait found in cv/');
mkdirSync(out, { recursive: true });

// sharp drops all metadata (EXIF, XMP) unless asked to keep it; .rotate() applies EXIF orientation first.
// 480w is what a typical phone needs (240 CSS px at 1.75-2x), so it never has to take the 640w file
for (const w of [320, 480, 640]) {
  const base = sharp(join(src, file)).rotate().resize(w, w, { fit: 'cover' }).grayscale();
  await base.clone().avif({ quality: 40, effort: 6 }).toFile(join(out, `portrait-${w}.avif`));
  await base.clone().webp({ quality: 70 }).toFile(join(out, `portrait-${w}.webp`));
  await base.clone().jpeg({ quality: 76, mozjpeg: true }).toFile(join(out, `portrait-${w}.jpg`));
}

// the easter-egg photo (Shift x3): its native width, nothing is upscaled; WebP is plenty for a rare, on-demand image
const pup = join(src, 'Screenshot_2.png');
if (existsSync(pup)) await sharp(pup).flatten({ background: '#fff' }).webp({ quality: 78 }).toFile(join(out, 'pup.webp'));

let bad = false;
for (const f of readdirSync(out)) {
  const size = statSync(join(out, f)).size;
  const meta = await sharp(join(out, f)).metadata();
  if (meta.exif || meta.xmp) { console.error(`metadata left in ${f}`); bad = true; }
  console.log(`${f}  ${size} B`);
}
// the LCP image: 640w on desktop retina, 480w on most phones
for (const [f, max] of [['portrait-640.avif', 36000], ['portrait-480.avif', 20000], ['pup.webp', 60000]]) {
  const size = statSync(join(out, f)).size;
  if (size > max) { console.error(`${f} is ${size} B, over the ${max} B budget: lower the AVIF quality`); bad = true; }
}
process.exit(bad ? 1 : 0);
