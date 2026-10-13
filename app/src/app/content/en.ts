import type { SiteContent } from './model';

export const en: SiteContent = {
  lang: 'en',
  meta: {
    title: 'Szabó József – Full-stack developer (PHP, Symfony, Angular)',
    description: 'Full-stack developer in Budapest working with PHP (Symfony, WordPress) and Angular. Available for remote or hybrid roles.',
    ogLocale: 'en_US',
  },
  ui: {
    skip: 'Skip to content',
    navLabel: 'Sections',
    tabsLabel: 'Quick navigation',
    sections: { profile: 'Profile', experience: 'Experience', skills: 'Skills', projects: 'Projects', about: 'About', contact: 'Contact' },
    otherLanguage: 'Magyar',
    usedIn: 'Used in',
    tags: 'Tags',
    theme: { label: 'Theme', auto: 'Auto', light: 'Light', dark: 'Dark' },
    graph: { seeProject: 'See in Projects' },
    palette: {
      open: 'Search and commands',
      short: 'Search',
      placeholder: 'Search this CV or type a command',
      empty: 'No match',
      close: 'Close',
      ask: 'Ask',
      thinking: 'Working on it',
      onDevice: 'Answered on this device. Nothing leaves your browser.',
      askFailed: 'No answer available. Search results are shown instead.',
      switchLanguage: 'Switch to Hungarian',
      changeTheme: 'Change theme',
      email: 'Send an email',
    },
  },
  hero: {
    name: 'Szabó József',
    role: 'Full-stack developer · PHP (Symfony) & Angular',
    location: 'Budapest, Hungary',
    status: 'Available for remote or hybrid roles',
    cta: 'Email me',
    portraitAlt: 'Black and white portrait of Szabó József',
  },
  profile: {
    paragraphs: [
      'I am a full-stack developer building web systems with PHP (Symfony, WordPress) and Angular. I work well in multi-stakeholder settings, following a task from the first conversation about the business need through development and CI/CD to release, and then through product support.',
      'My background in quality assurance helps every day. A testing mindset and keeping quality in focus are fundamental to how I work.',
    ],
  },
  experience: {
    intro: 'Employment runs along the main line, parallel work as branches. Open a node for details. Employers are described in general terms; a detailed CV is available on request.',
  },
  skills: {
    intro: 'Grouped by area. Under each skill: where I have used it.',
    groups: {
      backend: 'Backend',
      frontend: 'Frontend',
      database: 'Databases',
      devops: 'DevOps and infrastructure',
      quality: 'Quality assurance',
      other: 'Other',
    },
  },
  projects: { intro: 'Selected projects.', open: 'View on GitHub' },
  about: {
    education: {
      heading: 'Education',
      items: ['Computer software operator (OKJ secondary vocational qualification), 2002–2007'],
    },
    languages: {
      heading: 'Languages',
      items: [
        'Hungarian: native',
        'English, reading and understanding development documentation: intermediate',
        'English, speaking and writing: entry level',
      ],
    },
    award: {
      heading: 'Recognition',
      text: '“Person of the Academic Year” certificate, 2016/17, from a public university, for introducing a research-grant and monitoring IT system.',
    },
  },
  contact: {
    text: 'Email is the best way to reach me.',
    workMode: 'Remote or hybrid (Budapest)',
  },
  items: {
    chamber: {
      short: 'Professional chamber',
      title: 'PHP developer',
      org: 'National professional chamber',
      points: [
        'Technical and development coordination of a web platform (Angular front end, Symfony back end) over a project of more than three years.',
        'Liaison with the external development team, organising internal testing, bug fixes and new features on both the back end and the front end.',
        'Coordinating internal colleagues on database design and infrastructure needs; developing and maintaining PostgreSQL triggers and stored procedures.',
        'Independent development of the platform’s support site (Angular, Symfony).',
        'Development and maintenance of the organisation’s WordPress site family and intranet; online applications and API endpoints for partner bodies.',
        'Expert support for running development projects.',
      ],
    },
    'uni-med': {
      short: 'Medical university',
      title: 'PHP developer',
      org: 'Public medical university',
      points: [
        'Development of the university’s WordPress multisite: 200+ sites and about 800 administrative users.',
        'Complete redesign of the home page and the news section, front end and back end.',
        'Theme development (SASS, Node, Bootstrap 4) and Laravel micro apps.',
      ],
    },
    welfare: {
      short: 'Social welfare agency',
      title: 'PHP developer, part-time',
      org: 'Government social-welfare directorate',
      points: [
        'Adapting an open-source document management system (SeedDMS on Ubuntu) to the organisation’s operations and permission model.',
      ],
    },
    'uni-admin': {
      short: 'Public-administration university',
      title: 'IT expert',
      org: 'Public university (public administration)',
      points: [
        'Development coordination and testing of two web systems.',
        'Liaison and quality assurance for the supplier’s deliverables.',
        'One was the university’s internal research funding application system; the other a monitoring system for government indicators, built as expert work in an EU project.',
      ],
    },
    'health-inst': {
      short: 'Health institute',
      title: 'Junior analyst',
      org: 'Public health-development institute',
      points: ['Background support for expert work in an EU-funded project: reports, queries and data cleaning.'],
    },
    'edu-authority': {
      short: 'Education authority',
      title: 'Software tester (QA)',
      org: 'National education authority',
      points: ['Testing of education system developments.'],
    },
    'pricing-co': {
      short: 'Price-comparison company',
      title: 'Software tester (QA)',
      org: 'Online price-comparison company',
      points: ['Software testing in an IT team of more than ten people.'],
    },
    'edu-nonprofit': {
      short: 'Education non-profit',
      title: 'IT assistant',
      org: 'Education-sector non-profit company',
      points: ['Data preparation for analyses; programming data-collection sheets and databases in VBA.'],
    },
    fuzzphony: {
      short: 'Fuzzphony',
      title: 'Fuzzphony',
      summary: 'A PostgreSQL-native search layer for PHP and Symfony: typo-tolerant, accent-insensitive, ranked full-text search with filters and a real query language, without Elasticsearch, Meilisearch or any other service. Tables are never altered; a sidecar index table sits next to them.',
      points: [],
    },
    audit: {
      short: 'Audit systems',
      title: 'Audit and administration systems',
      summary: 'Legality-audit systems with permission and user management, dynamic forms with complex validation (about 400 questions of several types), dynamic DOCX generation and an answer evaluation system. A simpler audit built on the same model in CodeIgniter (about 300 questions) with different calculation and aggregation methods.',
      points: ['A project planning and registry system (Laravel 7, Bootstrap).', 'An EU grant registry (Laravel 8, Backpack).'],
    },
    'gov-reporting': {
      short: 'Government reporting site',
      title: 'Government indicator reporting site',
      summary: 'Design, development and general operation of a WordPress information site until 2020. Technology contribution to an indicator on the average road distance to the nearest government service point outside the capital (2015–2019), and print-ready generation of the 2019 report with PHP TCPDF.',
      points: [],
    },
    wordpress: {
      short: 'WordPress projects',
      title: 'WordPress projects',
      summary: 'Development, optimisation and operation of WordPress sites for several clients: caching, PHP 7 migration, server moves, CDN and smaller front-end changes. Also a role-based knowledge and document base, other client interfaces, and landing and presentation sites.',
      points: [],
    },
    'sport-programme': {
      short: 'Sport programme',
      title: 'National sport-promotion programme',
      summary: 'Development and operation of the online system of a national higher-education sport promotion programme. About 17,000 registered users. The programme closed in 2016.',
      points: [],
    },
    surveys: {
      short: 'Survey research',
      title: 'Questionnaire research',
      summary: 'Complete survey data-collection systems, queries and statistical processing. IBM SPSS at a basic level.',
      points: [],
    },
    'admissions-map': {
      short: 'Admissions map',
      title: 'Admission data visualisation',
      summary: 'Multidimensional visualisation of the 2009–2013 higher-education admission data as an interactive map.',
      points: [],
    },
  },
};
