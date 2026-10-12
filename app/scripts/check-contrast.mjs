import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const tokens = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'styles', '_tokens.scss'), 'utf8');

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [theme, label, foreground, background, minimum ratio]. Hex values must also appear in _tokens.scss.
const PAIRS = [
  ['light', 'text on page', '#1d1d1f', '#ffffff', 4.5],
  ['light', 'secondary text on page', '#6e6e73', '#ffffff', 4.5],
  ['light', 'secondary text on grouped', '#6e6e73', '#f5f5f7', 4.5],
  ['light', 'accent on page', '#1a7f45', '#ffffff', 4.5],
  ['light', 'accent on grouped', '#1a7f45', '#f5f5f7', 4.5],
  ['light', 'button text on accent', '#ffffff', '#1a7f45', 4.5],
  ['dark', 'text on page', '#f5f5f7', '#000000', 4.5],
  ['dark', 'secondary text on page', '#98989d', '#000000', 4.5],
  ['dark', 'secondary text on grouped', '#98989d', '#1c1c1e', 4.5],
  ['dark', 'accent on page', '#30d158', '#000000', 4.5],
  ['dark', 'accent on grouped', '#30d158', '#1c1c1e', 4.5],
  ['dark', 'button text on accent', '#000000', '#30d158', 4.5],
];

let failed = false;
for (const [theme, label, fg, bg, min] of PAIRS) {
  const r = ratio(fg, bg);
  const declared = tokens.includes(fg) && tokens.includes(bg);
  const ok = r >= min && declared;
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${theme.padEnd(5)} ${label.padEnd(28)} ${fg}/${bg} ${r.toFixed(2)}${declared ? '' : '  (hex not in _tokens.scss)'}`);
}
process.exit(failed ? 1 : 0);
