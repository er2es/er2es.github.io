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

// [theme, label, foreground, background, minimum ratio]: 7, the enhanced (AAA) ratio for text. Hex values must also appear in _tokens.scss.
const PAIRS = [
  ['light', 'text on page', '#1d1d1f', '#ffffff', 7],
  ['light', 'secondary text on page', '#515156', '#ffffff', 7],
  ['light', 'secondary text on grouped', '#515156', '#f5f5f7', 7],
  ['light', 'accent on page', '#126034', '#ffffff', 7],
  ['light', 'accent on grouped', '#126034', '#f5f5f7', 7],
  ['light', 'button text on accent', '#ffffff', '#126034', 7],
  ['dark', 'text on page', '#f5f5f7', '#000000', 7],
  ['dark', 'secondary text on page', '#b8b8bd', '#000000', 7],
  ['dark', 'secondary text on grouped', '#b8b8bd', '#1c1c1e', 7],
  ['dark', 'secondary text on cards', '#b8b8bd', '#2c2c2e', 7],
  ['dark', 'accent on cards', '#34d65c', '#2c2c2e', 7],
  ['dark', 'accent on page', '#34d65c', '#000000', 7],
  ['dark', 'accent on grouped', '#34d65c', '#1c1c1e', 7],
  ['dark', 'button text on accent', '#000000', '#34d65c', 7],
];

let failed = false;
for (const [theme, label, fg, bg, min] of PAIRS) {
  const r = ratio(fg, bg);
  const declared = tokens.includes(fg) && tokens.includes(bg);
  const ok = r >= min && declared;
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${theme.padEnd(5)} ${label.padEnd(28)} ${fg}/${bg} ${r.toFixed(2)}${declared ? '' : '  (hex not in _tokens.scss)'}`);
}
// The dark token overrides must also be inlined in index.html's <style> so first paint is dark.
const mixin = tokens.match(/@mixin dark \{([^}]*)\}/);
if (!mixin) { console.log('FAIL @mixin dark block not found in _tokens.scss'); process.exit(1); }
const indexStyle = (readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'index.html'), 'utf8').match(/<style>([\s\S]*?)<\/style>/) ?? [])[1] ?? '';
const missing = [...new Set(mixin[1].match(/#[0-9a-fA-F]{6}/g) ?? [])].filter((h) => !indexStyle.toLowerCase().includes(h.toLowerCase()));
if (missing.length) {
  failed = true;
  console.log('FAIL dark tokens missing from src/index.html <style>: ' + missing.join(', '));
} else {
  console.log('ok   dark tokens mirrored in src/index.html <style>');
}
process.exit(failed ? 1 : 0);
