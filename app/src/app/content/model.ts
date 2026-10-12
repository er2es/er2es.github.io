export type Locale = 'en' | 'hu';
export const SITE_URL = 'https://er2es.github.io';
export const EMAIL = 'claude@mbvk.hu';

export type SectionId = 'profile' | 'experience' | 'skills' | 'projects' | 'about' | 'contact';
export const SECTION_IDS: readonly SectionId[] = ['profile', 'experience', 'skills', 'projects', 'about', 'contact'];

/** The repository-file motif above each section heading (language neutral). */
export const FILES: Record<SectionId, string> = {
  profile: 'README.md',
  experience: 'CHANGELOG',
  skills: 'tests/',
  projects: 'projects/',
  about: 'ABOUT',
  contact: 'CONTACT',
};

export type ItemId =
  | 'chamber' | 'uni-med' | 'welfare' | 'uni-admin' | 'health-inst' | 'edu-authority' | 'pricing-co' | 'edu-nonprofit'
  | 'fuzzphony' | 'sport-programme' | 'surveys' | 'gov-reporting' | 'wordpress' | 'audit' | 'admissions-map';

export interface Fact {
  id: ItemId;
  kind: 'job' | 'project';
  /** On the main line of the career graph (otherwise a side branch). */
  main: boolean;
  inGraph: boolean;
  start: number | null;
  end: number | null;
  url?: string;
  keywords: readonly string[];
}

export const FACTS: readonly Fact[] = [
  { id: 'chamber', kind: 'job', main: true, inGraph: true, start: 2021, end: 2026,
    keywords: ['Legacy PHP refactor', 'WordPress multisite', 'SASS', 'Node', 'Bootstrap 4', 'PostgreSQL', 'MariaDB', 'RHEL', 'Symfony', 'Angular', 'QA', 'GitLab', 'CI/CD'] },
  { id: 'uni-med', kind: 'job', main: true, inGraph: true, start: 2020, end: 2021,
    keywords: ['WordPress multisite', 'SASS', 'Node', 'Bootstrap 4', 'Laravel'] },
  { id: 'uni-admin', kind: 'job', main: true, inGraph: true, start: 2016, end: 2020,
    keywords: ['CodeIgniter', 'MySQL', 'QA', 'LimeSurvey', 'EvaSys'] },
  { id: 'edu-authority', kind: 'job', main: true, inGraph: true, start: 2012, end: 2015,
    keywords: ['PHP', 'MySQL', 'QA', 'Selenium WebDriver'] },
  { id: 'pricing-co', kind: 'job', main: true, inGraph: true, start: 2011, end: 2012,
    keywords: ['PHP', 'MySQL', 'QA', 'Selenium WebDriver'] },
  { id: 'edu-nonprofit', kind: 'job', main: true, inGraph: true, start: 2008, end: 2011,
    keywords: ['MS Excel', 'MS Access', 'VBA'] },
  { id: 'welfare', kind: 'job', main: false, inGraph: true, start: 2018, end: 2019,
    keywords: ['SeedDMS', 'Ubuntu'] },
  { id: 'health-inst', kind: 'job', main: false, inGraph: true, start: 2014, end: 2015,
    keywords: ['LimeSurvey', 'MySQL', 'Excel VBA', 'MS Access'] },
  { id: 'wordpress', kind: 'project', main: false, inGraph: true, start: 2016, end: 2021,
    keywords: ['WordPress', 'PHP 7', 'CDN'] },
  { id: 'sport-programme', kind: 'project', main: false, inGraph: true, start: 2013, end: 2015, keywords: [] },
  { id: 'fuzzphony', kind: 'project', main: false, inGraph: false, start: null, end: null,
    url: 'https://github.com/er2es/fuzzphony', keywords: ['PHP', 'Symfony', 'PostgreSQL'] },
  { id: 'gov-reporting', kind: 'project', main: false, inGraph: false, start: 2015, end: 2020,
    keywords: ['WordPress', 'PHP', 'TCPDF'] },
  { id: 'audit', kind: 'project', main: false, inGraph: false, start: 2019, end: 2021,
    keywords: ['CodeIgniter', 'Laravel', 'Bootstrap', 'Backpack'] },
  { id: 'surveys', kind: 'project', main: false, inGraph: false, start: 2012, end: 2021,
    keywords: ['IBM SPSS'] },
  { id: 'admissions-map', kind: 'project', main: false, inGraph: false, start: 2013, end: 2013, keywords: [] },
];

export const FACT_BY_ID = Object.fromEntries(FACTS.map((f) => [f.id, f])) as Record<ItemId, Fact>;

/** Display order of the project cards. */
export const PROJECT_ORDER: readonly ItemId[] = ['fuzzphony', 'audit', 'gov-reporting', 'wordpress', 'sport-programme', 'surveys', 'admissions-map'];

export function period(f: Fact): string {
  if (f.start === null || f.end === null) return '';
  return f.start === f.end ? String(f.start) : `${f.start}–${f.end}`;
}

export type SkillGroupId = 'backend' | 'frontend' | 'database' | 'devops' | 'quality' | 'other';

export interface SkillFact {
  name: string;
  /** Items whose CV keywords or description mention this skill. Empty: shown without evidence. */
  usedIn: readonly ItemId[];
}

export const SKILLS: readonly { group: SkillGroupId; items: readonly SkillFact[] }[] = [
  { group: 'backend', items: [
    { name: 'PHP', usedIn: ['chamber', 'uni-admin', 'edu-authority', 'pricing-co', 'gov-reporting', 'wordpress', 'audit', 'fuzzphony'] },
    { name: 'Symfony', usedIn: ['chamber', 'fuzzphony'] },
    { name: 'Laravel', usedIn: ['uni-med', 'audit'] },
    { name: 'WordPress', usedIn: ['chamber', 'uni-med', 'wordpress', 'gov-reporting'] },
    { name: 'Node.js', usedIn: ['chamber', 'uni-med'] },
  ] },
  { group: 'frontend', items: [
    { name: 'Angular', usedIn: ['chamber'] },
    { name: 'TypeScript / JavaScript', usedIn: ['chamber'] },
    { name: 'SCSS', usedIn: ['chamber', 'uni-med'] },
    { name: 'Bootstrap', usedIn: ['chamber', 'uni-med', 'audit'] },
  ] },
  { group: 'database', items: [
    { name: 'PostgreSQL', usedIn: ['chamber', 'fuzzphony'] },
    { name: 'MariaDB', usedIn: ['chamber'] },
    { name: 'MySQL', usedIn: ['uni-admin', 'health-inst', 'edu-authority', 'pricing-co'] },
  ] },
  { group: 'devops', items: [
    { name: 'GitLab CI/CD', usedIn: ['chamber'] },
    { name: 'RHEL', usedIn: ['chamber'] },
    { name: 'Bash', usedIn: [] },
    { name: 'Git', usedIn: [] },
  ] },
  { group: 'quality', items: [
    { name: 'QA', usedIn: ['chamber', 'uni-admin', 'edu-authority', 'pricing-co'] },
    { name: 'Selenium WebDriver', usedIn: ['edu-authority', 'pricing-co'] },
  ] },
  { group: 'other', items: [
    { name: 'REST / SOAP API', usedIn: ['chamber'] },
    { name: 'O365', usedIn: [] },
    { name: 'Redis', usedIn: [] },
    { name: 'XML', usedIn: [] },
  ] },
];

export interface ItemText {
  /** Short label used in the skills evidence line. */
  short: string;
  title: string;
  org?: string;
  summary?: string;
  points: string[];
}

export interface SiteContent {
  lang: Locale;
  meta: { title: string; description: string; ogLocale: string };
  ui: {
    skip: string;
    navLabel: string;
    tabsLabel: string;
    sections: Record<SectionId, string>;
    otherLanguage: string;
    usedIn: string;
    theme: { label: string; auto: string; light: string; dark: string };
    graph: { seeProject: string };
    palette: {
      open: string; short: string; placeholder: string; empty: string; close: string;
      ask: string; thinking: string; onDevice: string; askFailed: string;
      switchLanguage: string; changeTheme: string; email: string;
    };
  };
  hero: { name: string; role: string; location: string; status: string; cta: string; portraitAlt: string };
  profile: { paragraphs: string[] };
  experience: { intro: string };
  skills: { intro: string; groups: Record<SkillGroupId, string> };
  projects: { intro: string; open: string };
  about: {
    education: { heading: string; items: string[] };
    languages: { heading: string; items: string[] };
    award: { heading: string; text: string };
  };
  contact: { text: string; workMode: string };
  items: Record<ItemId, ItemText>;
}
