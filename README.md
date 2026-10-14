# er2es.github.io

Personal CV site of József Szabó, in English (`/`) and Hungarian (`/hu/`). Live at <https://er2es.github.io>.

## Stack

- Angular 22 (standalone components, signals, zoneless), TypeScript, SCSS
- Static prerender (SSG) with hydration, no server at runtime
- No UI library, no webfonts, no analytics, no cookies, no third-party requests
- ESLint with angular-eslint, Vitest (unit), Playwright and axe-core (end-to-end and accessibility), Lighthouse (performance gate)

## Layout

| Path | What it is |
|---|---|
| `app/` | Angular workspace: sources, tests, build and quality scripts |
| `docs/` | The built site. GitHub Pages serves this folder (branch `main`, folder `/docs`) |

## Commands

Run from `app/` (Node 22.22.3 or newer):

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm start` | Development server on <http://localhost:4200> |
| `npm run build` | Build and prerender into `../docs` |
| `npm run preview` | Serve `../docs` the way GitHub Pages does (compression, short cache) on port 4300 |
| `npm run typecheck` | Type check of the app, its templates, the unit tests and the end-to-end tests |
| `npm run lint` | ESLint (TypeScript, Angular templates and their accessibility rules) |
| `npm test` | Unit tests |
| `npm run e2e` | End-to-end tests with an accessibility scan, both languages |
| `npm run lighthouse` | Lighthouse on `/` and `/hu/`, mobile and desktop |
| `npm run verify` | All gates in one go: types, lint, unit, contrast, privacy, build, end-to-end, Lighthouse |

## Release

`npm run verify`, then `npm run build`, then commit `docs/` and push to `main`. GitHub Pages publishes it.

`npm run portrait` and `npm run check:privacy` read local source material that is not part of this repository, so they only work on the author's machine.
