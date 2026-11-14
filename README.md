# er2es.github.io

[![CI](https://github.com/er2es/er2es.github.io/actions/workflows/ci.yml/badge.svg)](https://github.com/er2es/er2es.github.io/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/er2es/er2es.github.io/graph/badge.svg)](https://codecov.io/gh/er2es/er2es.github.io)
[![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)](https://angular.dev)
[![License: MIT](https://img.shields.io/badge/code-MIT-blue)](LICENSE)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/er2es/er2es.github.io)

Personal CV site of József Szabó, in English (`/`) and Hungarian (`/hu/`). Live at <https://er2es.github.io>.

## Stack

- Angular 22 (standalone components, signals, zoneless), TypeScript, SCSS
- Static prerender (SSG) with hydration, no server at runtime
- No UI library, no webfonts, no analytics, no cookies, no third-party requests
- Strict Content Security Policy as a `<meta>` tag: scripts only from the site itself or by hash, written into the pages at build time
- Quality gates: type check (strict TypeScript, strict Angular templates), ESLint with angular-eslint, Vitest (unit), Playwright and axe-core (end-to-end and accessibility), Lighthouse (performance gate)

## Layout

| Path | What it is |
|---|---|
| `app/` | Angular workspace: sources, tests, build and quality scripts |
| `docs/` | The built site, committed. The CI deploys this folder to GitHub Pages once every check has passed |

## Commands

Run from `app/` (Node 24.15 or newer, see `.nvmrc`). There is also a dev container: open the repository in GitHub
Codespaces and everything is installed.

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm start` | Development server on <http://localhost:4200> |
| `npm run build` | Build and prerender into `../docs` |
| `npm run preview` | Serve `../docs` the way GitHub Pages does (compression, short cache) on port 4300 |
| `npm run typecheck` | Type check of the app, its templates, the unit tests and the end-to-end tests |
| `npm run lint` | ESLint (TypeScript, Angular templates and their accessibility rules) |
| `npm test` | Unit tests |
| `npm run test:coverage` | Unit tests with coverage of the logic layer (`core`, `graph`, `content`, search and skill matching) |
| `npm run e2e` | End-to-end tests with an accessibility scan, both languages |
| `npm run check:contrast` | Fails if a text or accent colour pair of either theme falls below 7:1 (WCAG AAA), or if the dark tokens are not mirrored in `index.html` |
| `npm run check:design` | Fails if a component or stylesheet breaks the [design rules](#design-rules): a corner, a transition or a state colour that is not a token |
| `npm run check:docs` | Fails if `docs/` was not built from the sources in the working tree |
| `npm run lighthouse` | Lighthouse on `/` and `/hu/`, mobile and desktop |
| `npm run verify` | All gates in one go: types, lint, unit, contrast, design rules, privacy, build, docs, end-to-end, Lighthouse |

## Design rules

The look is one system, kept in tokens (`app/src/styles/_tokens.scss`) rather than numbers scattered over the components.
`npm run check:design` (`app/scripts/check-design.mjs`) reads the styles of every component and stylesheet and fails the build
when one of these rules is broken:

| Rule | What it means |
| --- | --- |
| Corners are tokens | `--radius` (22 px, surfaces and tiles), `--r-ctl` (16 px, a control inside a surface), `--r-pop` (10 px, tooltips and notes), or a full round (`999px`, `50%`). Only tiny shapes, up to 6 px, have their own |
| Transitions use duration tokens | `--dur-press` 150 ms, `--dur-short` 250 ms, `--dur-med` 400 ms, `--dur-ring` 600 ms, `--dur-long` 700 ms, `--dur-play` 900 ms. A transition never carries a number of milliseconds |
| Short animations use them too | An animation under a second lasts a duration token; long and endless ones (the backdrop, an icon's own movement) are free |
| States use tint tokens | Hover, pressed, selected and current are painted with `--tint-hover`, `--tint-press`, `--tint-current`, `--tint-accent` and `--tint-accent-strong`, never with a colour mixed on the spot. Resting rings and fills are `--ring`, `--ring-accent`, `--veil` and `--glint` |

Beside these, text and accent colours keep a contrast of at least 7:1 in both themes (`npm run check:contrast`), and every
motion is switched off or reduced under `prefers-reduced-motion`.

## Continuous integration

Every push to `main` and every pull request runs types, lint, unit tests with coverage (reported to Codecov), the
colour-contrast check, the design-rules check, the `docs/` check and the end-to-end tests in GitHub Actions. Coverage counts the logic layer;
the components are exercised by the Playwright tests, which are not part of that number.

The site is deployed by the same workflow: a `deploy` job that needs the checks above publishes the committed `docs/`
folder to GitHub Pages, and only for a push to `main` (a pull request never deploys). Pages is set to deploy from
Actions, so nothing publishes without the checks having passed. The `docs/` check is what keeps that folder in step
with the sources.

## Release

`npm run verify`, then `npm run build`, commit `docs/` on a branch and open a pull request. When the checks are green,
squash-merge it: the workflow on `main` runs the checks again and then deploys.

`npm run portrait` and `npm run check:privacy` read local source material that is not part of this repository, so they only work on the author's machine.

## License

The code is MIT-licensed (`LICENSE`). The personal content of the site, meaning its texts and photographs, is not: see
`LICENSE-CONTENT.md`.
