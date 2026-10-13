import type { SiteContent } from './model';

export const en: SiteContent = {
  lang: 'en',
  meta: {
    title: 'József Szabó – Full-stack developer (PHP, Symfony, Angular)',
    description: 'Full-stack developer in Budapest working with PHP (Symfony), Angular and PostgreSQL. Available for remote or hybrid roles.',
    ogLocale: 'en_US',
  },
  ui: {
    skip: 'Skip to content',
    navLabel: 'Sections',
    tabsLabel: 'Quick navigation',
    sections: { profile: 'Profile', experience: 'Experience', skills: 'Skills', projects: 'Projects', about: 'About', contact: 'Contact' },
    otherLanguage: 'Magyar',
    tags: 'Tags',
    theme: { label: 'Theme', auto: 'Auto', light: 'Light', dark: 'Dark' },
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
    egg: {
      title: 'Under the hood',
      intro: 'Measured live in your browser, right now.',
      requests: 'Requests',
      thirdParty: 'Third-party requests',
      cookies: 'Cookies',
      transferred: 'Transferred',
      scripts: 'JavaScript',
      dom: 'DOM nodes',
      lcp: 'Largest contentful paint',
      cls: 'Layout shift',
      note: 'No trackers, no analytics, no cookies. Press Esc to close.',
      close: 'Close',
    },
  },
  hero: {
    name: 'József Szabó',
    role: 'Full-stack developer · PHP (Symfony), Angular, PostgreSQL',
    location: 'Budapest, Hungary',
    status: 'Available for remote or hybrid roles',
    cta: 'Email me',
    portraitAlt: 'Black and white portrait of József Szabó',
  },
  profile: {
    paragraphs: [
      'I am a full-stack developer. My day-to-day is PHP (Symfony) and Angular on top of PostgreSQL: schema design, triggers and stored procedures, the API, the front end, and the GitLab CI/CD pipeline that delivers it on RHEL.',
      'I refactor legacy PHP, and I can keep a WordPress estate healthy when it is needed, but my work is application code and the database behind it. Years in software testing taught me to think about how a change will be verified before I write it.',
    ],
  },
  experience: {
    intro: 'Newest first. Open an entry for the details. I describe employers in general terms and can send a full CV on request.',
  },
  skills: {
    intro: 'What I work with, grouped by area.',
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
      text: '“Person of the Academic Year” award, 2016/17, from a public university, for introducing a research-grant and monitoring IT system.',
    },
  },
  contact: {
    text: 'Email is the best way to reach me.',
    workMode: 'Remote or hybrid (Budapest)',
  },
  items: {
    chamber: {
      title: 'PHP developer',
      org: 'National professional chamber',
      points: [
        'Coordinated the technical and development side of a web platform (Angular front end, Symfony back end) through a project that ran for more than three years.',
        'Worked with the external development team, organised internal testing, and fixed bugs and developed features on both the back end and the front end.',
        'Worked with internal colleagues on database design and infrastructure needs, and wrote and maintained PostgreSQL triggers and stored procedures.',
        'Built the platform’s support site on my own (Angular, Symfony).',
        'Developed and maintained the organisation’s WordPress sites and intranet, and built web applications and API endpoints for partner bodies.',
        'Supported running development projects as a technical expert.',
      ],
    },
    'uni-med': {
      title: 'PHP developer',
      org: 'Public medical university',
      points: [
        'Developed the university’s WordPress multisite: more than 200 sites and about 800 administrative users.',
        'Redesigned the home page and the news section from scratch, front end and back end.',
        'Built themes (SASS, Node, Bootstrap 4) and small Laravel apps.',
      ],
    },
    welfare: {
      title: 'PHP developer, part-time',
      org: 'Government social-welfare directorate',
      points: [
        'Adapted an open-source document management system (SeedDMS on Ubuntu) to the organisation’s workflows and permission model.',
      ],
    },
    'uni-admin': {
      title: 'IT expert',
      org: 'Public university (public administration)',
      points: [
        'Coordinated development and testing for two web systems.',
        'Handled liaison and quality assurance for the supplier’s deliverables.',
        'One was the university’s internal research-grant application system; the other monitored government indicators, as part of expert work in an EU project.',
      ],
    },
    'health-inst': {
      title: 'Junior analyst',
      org: 'Public health-development institute',
      points: ['Supported expert work in an EU-funded project: reports, queries and data cleaning.'],
    },
    'edu-authority': {
      title: 'Software tester (QA)',
      org: 'National education authority',
      points: ['Tested education system developments.'],
    },
    'pricing-co': {
      title: 'Software tester (QA)',
      org: 'Online price-comparison company',
      points: ['Tested software in an IT team of more than ten people.'],
    },
    'edu-nonprofit': {
      title: 'IT assistant',
      org: 'Education-sector non-profit company',
      points: ['Prepared data for analyses and programmed data-collection sheets and databases in VBA.'],
    },
    fuzzphony: {
      title: 'Fuzzphony',
      summary: 'A PostgreSQL-native search layer for PHP and Symfony. It gives typo-tolerant, accent-insensitive, ranked full-text search with filters and a real query language, without Elasticsearch, Meilisearch or any other service. It never alters your tables; a sidecar index table sits next to them.',
      points: [],
    },
    audit: {
      title: 'Audit and administration systems',
      summary: 'Audit systems for legality checks, with user and permission management, dynamic forms with complex validation (about 400 questions of several types), dynamic DOCX generation and an answer evaluation system. A simpler audit built on the same model in CodeIgniter (about 300 questions) uses different calculation and aggregation methods.',
      points: ['A project planning and registry system (Laravel 7, Bootstrap).', 'An EU grant registry (Laravel 8, Backpack).'],
    },
    'gov-reporting': {
      title: 'Government indicator site',
      summary: 'Designed, built and ran a WordPress information site until 2020. Contributed technology to an indicator on the average road distance to the nearest government service point outside the capital (2015–2019), and produced the print-ready 2019 report with PHP TCPDF.',
      points: [],
    },
    wordpress: {
      title: 'WordPress projects',
      summary: 'Built, tuned and ran WordPress sites for several clients: caching, PHP 7 migration, server moves, CDN and smaller front-end changes. Also a role-based knowledge and document base, other client-facing tools, and landing and presentation sites.',
      points: [],
    },
    'sport-programme': {
      title: 'National sport-promotion programme',
      summary: 'Built and ran the online system of a national higher-education sport programme. About 17,000 registered users; the programme ended in 2016.',
      points: [],
    },
    surveys: {
      title: 'Questionnaire research',
      summary: 'Built complete survey data-collection systems, with the queries and statistical processing behind them. IBM SPSS at a basic level.',
      points: [],
    },
    'admissions-map': {
      title: 'Admission data visualisation',
      summary: 'Visualised the 2009–2013 higher-education admission data as an interactive, multidimensional map.',
      points: [],
    },
  },
};
