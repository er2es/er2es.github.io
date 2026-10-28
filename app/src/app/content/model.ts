export type Locale = 'en' | 'hu';
export const SITE_URL = 'https://er2es.github.io';
export const EMAIL = 'szabo.jozsef.acc@gmail.com';
export const GITHUB_URL = 'https://github.com/er2es';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/szabo-j%C3%B3zsef-a61156357/';

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
  | 'fuzzphony' | 'sport-programme' | 'surveys' | 'gov-reporting' | 'wordpress' | 'audit' | 'admissions-map' | 'cv-site';

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
    keywords: ['Symfony', 'Angular', 'PostgreSQL', 'MariaDB', 'GitLab', 'CI/CD', 'RHEL', 'Podman', 'Legacy PHP refactor', 'WordPress multisite', 'SASS', 'Node', 'Bootstrap 4', 'QA', 'SonarQube', 'E2E testing', 'Unit testing', 'Jasmine', 'Java', 'Go', 'Postman', 'SoapUI'] },
  { id: 'uni-med', kind: 'job', main: true, inGraph: true, start: 2020, end: 2021,
    keywords: ['WordPress multisite', 'SASS', 'Node', 'Gulp', 'Bootstrap 4', 'Laravel'] },
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
  { id: 'wordpress', kind: 'project', main: false, inGraph: false, start: 2016, end: 2021,
    keywords: ['WordPress', 'PHP', 'SEO', 'Caching', 'PageSpeed'] },
  { id: 'sport-programme', kind: 'project', main: false, inGraph: false, start: 2013, end: 2015,
    keywords: ['Legacy PHP', 'Bootstrap'] },
  { id: 'fuzzphony', kind: 'project', main: false, inGraph: false, start: null, end: null,
    url: 'https://github.com/er2es/fuzzphony', keywords: ['PHP', 'Symfony', 'PostgreSQL', 'Mutation testing'] },
  { id: 'cv-site', kind: 'project', main: false, inGraph: false, start: 2026, end: 2026,
    url: 'https://github.com/er2es/er2es.github.io', keywords: ['Angular', 'TypeScript', 'SCSS', 'Playwright'] },
  { id: 'gov-reporting', kind: 'project', main: false, inGraph: false, start: 2015, end: 2020,
    keywords: ['WordPress', 'PHP', 'TCPDF', 'Google Maps API'] },
  { id: 'audit', kind: 'project', main: false, inGraph: false, start: 2019, end: 2021,
    keywords: ['CodeIgniter', 'Laravel', 'Bootstrap', 'Backpack'] },
  { id: 'surveys', kind: 'project', main: false, inGraph: false, start: 2012, end: 2021,
    keywords: ['IBM SPSS'] },
  { id: 'admissions-map', kind: 'project', main: false, inGraph: false, start: 2013, end: 2013,
    keywords: ['Legacy PHP', 'jQuery'] },
];

export const FACT_BY_ID = Object.fromEntries(FACTS.map((f) => [f.id, f])) as Record<ItemId, Fact>;

/** Display order of the project cards. */
export const PROJECT_ORDER: readonly ItemId[] = ['fuzzphony', 'cv-site', 'audit', 'gov-reporting', 'wordpress', 'sport-programme', 'surveys', 'admissions-map'];

export function period(f: Fact): string {
  if (f.start === null || f.end === null) return '';
  return f.start === f.end ? String(f.start) : `${f.start}–${f.end}`;
}

export type SkillGroupId = 'backend' | 'frontend' | 'database' | 'devops' | 'quality' | 'other';

export interface SkillFact {
  name: string;
  /** Display name where it differs by language (tool names stay as they are). */
  label?: Partial<Record<Locale, string>>;
}

export const SKILLS: readonly { group: SkillGroupId; items: readonly SkillFact[] }[] = [
  { group: 'backend', items: [
    { name: 'PHP' },
    { name: 'Symfony' },
    { name: 'Laravel' },
    { name: 'WordPress' },
    { name: 'Node.js' },
    { name: 'Java' },
    { name: 'Go' },
  ] },
  { group: 'frontend', items: [
    { name: 'Angular' },
    { name: 'TypeScript' },
    { name: 'JavaScript' },
    { name: 'jQuery' },
    { name: 'SCSS' },
    { name: 'Gulp' },
    { name: 'Bootstrap' },
  ] },
  { group: 'database', items: [
    { name: 'PostgreSQL' },
    { name: 'MariaDB' },
    { name: 'MySQL' },
  ] },
  { group: 'devops', items: [
    { name: 'GitLab' },
    { name: 'CI/CD' },
    { name: 'RHEL' },
    { name: 'Docker / Podman' },
    { name: 'Bash' },
    { name: 'PowerShell' },
    { name: 'Git' },
  ] },
  { group: 'quality', items: [
    { name: 'QA' },
    { name: 'Selenium WebDriver' },
    { name: 'UAT' },
    { name: 'Exploratory testing', label: { hu: 'Felfedező tesztelés' } },
    { name: 'E2E testing', label: { hu: 'E2E tesztelés' } },
    { name: 'Unit testing', label: { hu: 'Unit tesztelés' } },
    { name: 'Jasmine' },
    { name: 'SonarQube' },
  ] },
  { group: 'other', items: [
    { name: 'REST / SOAP API' },
    { name: 'Postman' },
    { name: 'SoapUI' },
    { name: 'O365' },
    { name: 'Redis' },
    { name: 'XML' },
    { name: 'SPSS' },
    { name: 'X.509' },
  ] },
];

export interface ItemText {
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
    tags: string;
    theme: { label: string; auto: string; light: string; dark: string };
    egg: {
      title: string; intro: string; requests: string; thirdParty: string; cookies: string;
      transferred: string; scripts: string; dom: string; lcp: string; cls: string; framework: string; typescript: string;
      rendering: string; renderingValue: string; built: string; tests: string; coverage: string; version: string; pagespeed: string; localStorage: string; sessionStorage: string; close: string;
    };
    palette: {
      open: string; short: string; placeholder: string; empty: string; close: string;
      ask: string; thinking: string; onDevice: string; askFailed: string;
    };
  };
  hero: { name: string; role: string; location: string; status: string; cta: string; portraitAlt: string };
  profile: { paragraphs: string[]; hobbies: { label: string; cinema: string; woods: string; dog: string; walk: string; pho: string; games: string } };
  experience: { intro: string; arc: string };
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
