// The design system's rules, checked in the styles of the components and the global stylesheets, so that they stay true:
//  1. a corner is a token (--radius, --r-ctl, --r-pop) or a full round (999px, 50%); only tiny shapes (up to 6px) have their own;
//  2. a transition lasts a --dur-* token, never a number of milliseconds;
//  3. a short animation (under a second) lasts a --dur-* token too; long and endless ones (the backdrop, an icon's play) are free;
//  4. a hover, pressed, selected or current state is painted with the --tint-* tokens, not a colour mixed on the spot.
// Run: npm run check:design
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|scss)$/.test(name) && !name.endsWith('.spec.ts') && !name.endsWith('build-info.ts')) files.push(p);
  }
};
walk(root);

const problems = [];
const STATE = /:hover|:active|\[aria-selected|\[aria-current|\.lit\b|:focus-visible/;
const TOKENS = new Set(['_tokens.scss']); // the tokens themselves are written out there

for (const file of files) {
  const rel = relative(root, file).replaceAll('\\', '/');
  const text = readFileSync(file, 'utf8');
  const lineOf = (index) => text.slice(0, index).split('\n').length;
  const at = (index, rule, what) => problems.push(`${rel}:${lineOf(index)}  ${rule}: ${what}`);

  for (const m of text.matchAll(/border-radius:\s*(\d+)px/g)) {
    if (Number(m[1]) > 6 && Number(m[1]) !== 999 && !TOKENS.has(rel.split('/').pop())) at(m.index, 'radius', `"${m[0]}" is not a token (--radius, --r-ctl, --r-pop)`);
  }
  for (const m of text.matchAll(/(?<![\w-])transition:\s*([^;}]*)/g)) {
    // each property's first time is its duration (a second one is a delay): it must be a token, not a number
    for (const item of m[1].split(/,(?![^(]*\))/)) {
      const first = item.match(/(\d*\.?\d+m?s)|var\(--(?:dur|lag|lead)[^)]*\)|calc\([^)]*\)/);
      if (first?.[1]) at(m.index, 'duration', `"transition: ${item.trim().slice(0, 60)}" has a number of milliseconds; use a --dur-* token`);
    }
  }
  for (const m of text.matchAll(/(?<![\w-])animation:\s*([^;}]*)/g)) {
    const value = m[1];
    if (/\binfinite\b/.test(value)) continue;
    const first = value.replace(/var\([^)]*\)/g, ' T ').match(/(?:^|\s)(\d*\.?\d+)(ms|s)\b|(?:^|\s)T(?:\s|$)/);
    if (!first || first[0].trim() === 'T') continue; // a token, or none
    const ms = Number(first[1]) * (first[2] === 's' ? 1000 : 1);
    if (ms < 1000) at(m.index, 'duration', `"animation: ${value.trim().slice(0, 70)}" is short (${ms}ms) and not a --dur-* token`);
  }
  // rules, innermost first: a selector and its declarations
  for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1];
    if (!STATE.test(selector) || TOKENS.has(rel.split('/').pop())) continue;
    for (const d of m[2].matchAll(/background(?:-color)?:\s*([^;]*)/g)) {
      if (/color-mix\(in srgb,\s*var\(--(?:fg|accent)\)\s*\d+%/.test(d[1])) {
        at(m.index + m[1].length + 1 + d.index, 'tint', `"${selector.trim().slice(-50)}" paints its state with a mixed colour; use a --tint-* token`);
      }
    }
  }
}

if (problems.length) {
  console.error(`design: ${problems.length} thing(s) that break the rules\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`design ok: ${files.length} files follow the radius, duration and state-colour rules`);
