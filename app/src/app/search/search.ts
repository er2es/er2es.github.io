import { EMAIL, FACTS, SKILLS, period, type SectionId, type SiteContent } from '../content/model';

export interface SearchDoc { id: string; section: SectionId; title: string; text: string; anchor: string }

export const norm = (s: string): string => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

const tokens = (s: string): string[] => norm(s).split(/[^\p{L}\p{N}.+#]+/u).filter(Boolean);

export interface Segment { text: string; hit: boolean }

/** Splits a label into plain and matched runs for the query's tokens, accent- and case-insensitively. */
export function highlight(label: string, query: string): Segment[] {
  const qt = tokens(query.slice(0, 200));
  if (!qt.length) return [{ text: label, hit: false }];
  // normalised text, and for each of its characters the index of the original character
  let flat = '';
  const from: number[] = [];
  [...label].forEach((ch, i) => {
    for (const n of norm(ch)) {
      flat += n;
      from.push(i);
    }
  });
  const chars = [...label];
  const hit = new Array<boolean>(chars.length).fill(false);
  for (const q of qt) {
    for (let at = flat.indexOf(q); at !== -1; at = flat.indexOf(q, at + q.length)) {
      for (let k = at; k < at + q.length; k++) hit[from[k]] = true;
    }
  }
  const out: Segment[] = [];
  chars.forEach((ch, i) => {
    const last = out[out.length - 1];
    if (last && last.hit === hit[i]) last.text += ch;
    else out.push({ text: ch, hit: hit[i] });
  });
  return out;
}

export function buildDocs(c: SiteContent): SearchDoc[] {
  const docs: SearchDoc[] = [
    { id: 'section:profile', section: 'profile', title: c.ui.sections.profile, text: c.profile.paragraphs.join(' '), anchor: 'profile' },
  ];

  for (const f of FACTS) {
    const t = c.items[f.id];
    docs.push({
      id: `item:${f.id}`,
      section: f.kind === 'job' ? 'experience' : 'projects',
      title: t.org ? `${t.title} · ${t.org}` : t.title,
      text: [t.summary ?? '', ...t.points, ...f.keywords, period(f)].join(' '),
      anchor: f.kind === 'job' ? `job-${f.id}` : `p-${f.id}`,
    });
  }

  for (const g of SKILLS) {
    docs.push({
      id: `skills:${g.group}`,
      section: 'skills',
      title: c.skills.groups[g.group],
      text: g.items.map((s) => s.label?.[c.lang] ?? s.name).join(' '),
      anchor: `skills-${g.group}`,
    });
  }

  const a = c.about;
  docs.push(
    { id: 'about:education', section: 'about', title: a.education.heading, text: a.education.items.join(' '), anchor: 'about-education' },
    { id: 'about:languages', section: 'about', title: a.languages.heading, text: a.languages.items.join(' '), anchor: 'about-languages' },
    { id: 'about:award', section: 'about', title: a.award.heading, text: a.award.text, anchor: 'about-award' },
    { id: 'section:contact', section: 'contact', title: c.ui.sections.contact, text: `${c.contact.text} ${c.contact.workMode} ${EMAIL}`, anchor: 'contact' },
  );
  return docs;
}

function score(d: SearchDoc, qt: readonly string[]): number {
  const title = norm(d.title);
  const text = norm(d.text);
  let s = 0;
  for (const q of qt) {
    const inTitle = title.includes(q);
    const inText = text.includes(q);
    if (!inTitle && !inText) return 0;
    s += (inTitle ? 3 : 0) + (inText ? 1 : 0) + (title.startsWith(q) ? 2 : 0);
  }
  return s;
}

export function search(docs: readonly SearchDoc[], query: string, limit = 6): SearchDoc[] {
  const qt = tokens(query.slice(0, 200));
  if (!qt.length) return [];
  return docs
    .map((d, i) => ({ d, i, s: score(d, qt) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.d);
}

export function buildCvContext(c: SiteContent): string {
  return `${buildDocs(c).map((d) => `## ${d.title}\n${d.text}`).join('\n\n')}\n\nEmail: ${EMAIL}`;
}
