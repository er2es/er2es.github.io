import type { SiteContent } from './model';

export const en: SiteContent = {
  lang: 'en',
  meta: {
    title: 'József Szabó – Full-stack PHP developer (Symfony, Angular, PostgreSQL)',
    description: 'Full-stack PHP developer in Budapest: Symfony back ends, Angular front ends, PostgreSQL with triggers and stored procedures, GitLab CI/CD on RHEL. Several years of software testing behind me. Open to remote or hybrid roles.',
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
    role: 'Full-stack PHP developer · Symfony, Angular, PostgreSQL',
    location: 'Budapest, Hungary',
    status: 'Open to remote or hybrid roles',
    cta: 'Email me',
    portraitAlt: 'Black and white portrait of József Szabó',
  },
  profile: {
    paragraphs: [
      'I am a full-stack PHP developer in Budapest. I build web applications with a Symfony back end and an Angular front end. On the database side I write and maintain PostgreSQL triggers and stored procedures. Releases go out through GitLab CI/CD to RHEL servers.',
      'I have worked in IT since 2008. I started with data work and spent several years in software testing, using Selenium WebDriver, user acceptance testing and exploratory testing. Because of that, I think about how a change will be tested before I write it.',
      'I have also refactored legacy PHP code and maintained large WordPress installations, including a multisite of more than 200 sites. My focus, though, is application code and the database behind it.',
    ],
  },
  experience: {
    intro: 'Newest first. Open an entry for the details. Employers are described in general terms; I can send a full CV on request.',
  },
  skills: {
    intro: 'Technologies and methods I work with, grouped by area.',
    groups: {
      backend: 'Backend',
      frontend: 'Frontend',
      database: 'Databases',
      devops: 'DevOps and infrastructure',
      quality: 'Testing and QA',
      other: 'Other',
    },
  },
  projects: { intro: 'Selected projects, with a short note on what each one does.', open: 'View on GitHub' },
  about: {
    education: {
      heading: 'Education',
      items: ['Computer software operator (OKJ secondary vocational qualification), 2002–2007'],
    },
    languages: {
      heading: 'Languages',
      items: [
        'Hungarian: native',
        'English, reading development documentation: intermediate',
        'English, speaking and writing: entry level',
      ],
    },
    award: {
      heading: 'Recognition',
      text: '“Person of the Academic Year” award (2016/17) from a public university, for introducing an IT system for research-grant applications and monitoring.',
    },
  },
  contact: {
    text: 'Email is the best way to reach me.',
    workMode: 'Remote or hybrid, based in Budapest',
  },
  items: {
    chamber: {
      title: 'PHP developer',
      org: 'National professional chamber',
      points: [
        'Coordinated the technical and development work on a web platform (Angular front end, Symfony back end) throughout a project of more than three years.',
        'Worked with the external development team and organised internal testing.',
        'Fixed bugs and built features in the Symfony back end and the Angular front end, released through GitLab CI/CD to RHEL servers.',
        'Wrote and maintained PostgreSQL triggers and stored procedures, and worked with internal colleagues on database design and infrastructure requirements.',
        'Built the platform’s support site on my own (Angular, Symfony), and built web applications and API endpoints for partner organisations.',
        'Developed and maintained the organisation’s WordPress sites and intranet, and supported other development projects as a technical expert.',
      ],
    },
    'uni-med': {
      title: 'PHP developer',
      org: 'Public medical university',
      points: [
        'Developed the university’s WordPress multisite: more than 200 sites and about 800 administrative users.',
        'Rebuilt the home page and the news section from scratch, front end and back end.',
        'Built WordPress themes with SASS, Node and Bootstrap 4, and small Laravel applications.',
      ],
    },
    welfare: {
      title: 'PHP developer (part-time)',
      org: 'Government social-welfare directorate',
      points: [
        'Customised SeedDMS, an open-source document management system running on Ubuntu, to fit the organisation’s workflows and permission model.',
      ],
    },
    'uni-admin': {
      title: 'IT expert',
      org: 'Public university (public administration)',
      points: [
        'Coordinated the development and testing of two web systems built by an external supplier.',
        'Acted as the contact point for the supplier and checked the quality of its deliveries.',
        'The systems were the university’s internal research-grant application system and a monitoring system for government indicators, which supported the university’s expert work in an EU project.',
      ],
    },
    'health-inst': {
      title: 'Junior analyst',
      org: 'Public health-development institute',
      points: ['Supported expert work in an EU-funded project with reports, database queries and data cleaning.'],
    },
    'edu-authority': {
      title: 'Software tester (QA)',
      org: 'National education authority',
      points: ['Tested new developments in education-sector IT systems, partly with automated tests in Selenium WebDriver.'],
    },
    'pricing-co': {
      title: 'Software tester (QA)',
      org: 'Online price-comparison company',
      points: ['Tested web software in an IT team of more than ten people, using Selenium WebDriver among other tools.'],
    },
    'edu-nonprofit': {
      title: 'IT assistant',
      org: 'Education-sector non-profit company',
      points: ['Prepared data for analyses, and built data-collection sheets and databases in Excel and Access with VBA.'],
    },
    fuzzphony: {
      title: 'Fuzzphony',
      summary: 'My open-source search library for PHP and Symfony that runs on PostgreSQL alone. It provides typo-tolerant, accent-insensitive, ranked full-text search with filters and a query language, without Elasticsearch, Meilisearch or any other external service. It does not modify existing tables; it keeps its index in a separate table next to them.',
      points: [],
    },
    audit: {
      title: 'Audit and administration systems',
      summary: 'Web applications for legal-compliance audits, with user and permission management, dynamic forms of about 400 questions of several types with complex validation, dynamic DOCX generation and evaluation of the answers. A simpler audit on the same model, built in CodeIgniter, has about 300 questions and its own calculation and aggregation rules.',
      points: ['A project planning and registry system (Laravel 7, Bootstrap).', 'A registry of EU grants (Laravel 8, Backpack).'],
    },
    'gov-reporting': {
      title: 'Government indicator website',
      summary: 'A WordPress information site that I designed, built and ran until 2020. I also contributed the technical work to an indicator of the average road distance to the nearest government service point outside the capital (2015–2019), and produced the print-ready 2019 report with PHP and TCPDF.',
      points: [],
    },
    wordpress: {
      title: 'WordPress projects',
      summary: 'Built, tuned and ran WordPress sites for several clients: caching, PHP 7 migrations, server moves, CDN setup and smaller front-end changes. Also built a role-based knowledge and document base, other client-facing tools, and landing and presentation sites.',
      points: [],
    },
    'sport-programme': {
      title: 'National sport-promotion programme',
      summary: 'Built and ran the online system of a national sport programme in higher education, with about 17,000 registered users. The programme ended in 2016.',
      points: [],
    },
    surveys: {
      title: 'Questionnaire research',
      summary: 'Built complete systems for questionnaire-based data collection, together with the queries and statistical processing behind them. IBM SPSS at a basic level.',
      points: [],
    },
    'admissions-map': {
      title: 'Admission data visualisation',
      summary: 'An interactive, multidimensional map of higher-education admission data from 2009 to 2013.',
      points: [],
    },
  },
};
