import { Injectable, signal } from '@angular/core';
import { PROJECT_ORDER, type Fact, type ItemId, type ItemText } from '../content/model';

/**
 * What else counts as using a skill. Explicit on purpose: a framework implies its language, a tool name in the
 * CV may be spelled differently from the skill list. Every skill maps to itself even when it is not listed here.
 */
export const SKILL_TERMS: Readonly<Record<string, readonly string[]>> = {
  PHP: ['PHP 7', 'Legacy PHP', 'Legacy PHP refactor', 'Symfony', 'Laravel', 'CodeIgniter', 'WordPress', 'WordPress multisite'],
  Laravel: ['Backpack'],
  WordPress: ['WordPress multisite'],
  'Node.js': ['Node'],
  TypeScript: ['Angular'],
  JavaScript: ['jQuery', 'Angular', 'Node', 'Node.js'],
  SCSS: ['SASS'],
  Bootstrap: ['Bootstrap 4'],
  Git: ['GitLab'],
  QA: ['Selenium WebDriver'],
  'REST / SOAP API': ['API', 'REST', 'SOAP'],
  SPSS: ['IBM SPSS'],
  'Docker / Podman': ['Docker', 'Podman'],
};

const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/** Whole-word, case-sensitive: tool names are proper nouns, and "Git" must not match "GitLab". */
const WORDS = new Map<string, RegExp>();
const wordIn = (term: string, text: string): boolean => {
  if (!text.includes(term)) return false; // the Unicode lookbehind below is slow on long text: skip it where the term is not even a substring
  let re = WORDS.get(term);
  if (!re) {
    re = new RegExp(`(?<![\\p{L}\\p{N}])${escape(term)}(?![\\p{L}\\p{N}])`, 'u'); // built once per term, not once per test
    WORDS.set(term, re);
  }
  return re.test(text);
};

const TEXTS = new WeakMap<ItemText, string>();
const textOf = (t: ItemText): string => {
  let s = TEXTS.get(t);
  if (s === undefined) {
    s = [t.title, t.org ?? '', t.summary ?? '', ...t.points].join('\n');
    TEXTS.set(t, s);
  }
  return s;
};

/**
 * The jobs and projects that use a skill, newest job first, then projects in display order.
 * A fact matches on its keywords (case-insensitive) or on a whole word of its own text.
 */
export function usesOf(skill: string, facts: readonly Fact[], items: Readonly<Record<ItemId, ItemText>>): ItemId[] {
  const terms = [skill, ...(SKILL_TERMS[skill] ?? [])];
  const lower = new Set(terms.map((t) => t.toLowerCase()));
  const hit = facts.filter((f) => {
    if (f.keywords.some((k) => lower.has(k.toLowerCase()))) return true;
    const text = textOf(items[f.id]);
    return terms.some((term) => wordIn(term, text));
  });
  const jobs = hit.filter((f) => f.kind === 'job').sort((a, b) => (b.end ?? 0) - (a.end ?? 0) || (b.start ?? 0) - (a.start ?? 0));
  const projects = hit.filter((f) => f.kind === 'project').sort((a, b) => PROJECT_ORDER.indexOf(a.id) - PROJECT_ORDER.indexOf(b.id));
  return [...jobs, ...projects].map((f) => f.id);
}

/** The skill whose uses are open in the Skills section; job rows and project cards light up for it. */
@Injectable({ providedIn: 'root' })
export class SkillLens {
  readonly ids = signal<ReadonlySet<ItemId>>(new Set());
}
