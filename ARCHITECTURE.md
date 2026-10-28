# Architecture

A personal CV site: two static pages (English `/`, Hungarian `/hu/`), no server at runtime. This page says what the
choices are and why, including what they cost. The code is in `app/`, the built site in `docs/`.

## The shape of it

- **Angular 22, standalone components, signals, no zone.js.** The page is small and its state is a handful of signals
  (language, theme, which skill families are chosen, the year under the pointer). Without zone.js there is no patched
  browser API and no change detection triggered by every timer; a view updates because a signal it reads changed.
- **Prerendered, then hydrated.** `ng build` renders both pages to static HTML, so the content is readable without
  JavaScript and the first paint does not wait for the bundle. The browser then hydrates the same markup (with event
  replay, so an early click is not lost).
- **No router in the browser.** The router exists on the server only, to tell the prerenderer which two pages there
  are. In the browser the language switch is a signal plus `history.pushState` inside a view transition
  (`core/lang.ts`): no reload, the scroll position stays. This took the router out of the bundle and costs nothing the
  site needs.
- **Components own their template and styles** (inline). The files are small enough that the split would only add
  jumping between files.

## Where things live

| Folder | What it holds |
|---|---|
| `content/` | All the text, in `en.ts` and `hu.ts`, with the facts (dates, tags, skills) once in `model.ts`. A test keeps the two languages in step. |
| `core/`, `graph/`, `search/` | The logic with no DOM in it: the URL hash rules, the skill matching, the career grid, the search, the theme and language state. Unit tested to 100% of statements and branches. |
| `sections/`, `shell/`, `egg/` | The components. Covered by the Playwright tests, not by the unit coverage number. |

The career graph is a good example of the split: `graph/grid.ts` turns jobs and skills into a grid of levels (a pure
function with its own tests), and `sections/career-arc.ts` only draws it and handles the pointer. What the colour
means is stated in the code and in the tooltip: how many skills of a family the year's jobs mention, not how well they
were known.

## The build output is committed

GitHub Pages serves a branch folder, so `docs/` is built from `app/` and committed. Two things keep that honest:

- `scripts/build-docs.mjs` writes `docs/.source-hash`, a fingerprint of everything the site is built from;
  `npm run check:docs` recomputes it, and the CI fails if `docs/` is not what the committed sources produce.
- The cost is noisy diffs (hashed file names) and that a bot cannot update dependencies on its own: Dependabot changes
  the lock file but cannot rebuild `docs/`, so its branches fail that check. Updates go through a normal pull request
  that rebuilds.

## Security and privacy

- **Content Security Policy as a `<meta>` tag** (Pages cannot send headers). `scripts/csp.mjs` runs after the build,
  hashes every inline script that is really in the page and allows scripts only from the site itself or by those
  hashes. An end-to-end test uses the whole site and fails on any refused resource, and another checks that an injected
  script does not run. The honest exception: styles keep `'unsafe-inline'`, because the prerendered HTML carries style
  attributes.
- **No third parties:** no analytics, no cookies, no webfonts, no external requests. The page that reports this
  ("Under the hood", three Shifts) measures it live in the visitor's browser instead of stating it.
- **Anonymised content,** and `npm run check:privacy` scans `docs/` and the git history for private terms. The list of
  terms is built from local files and is not in the repository, so that check only runs on the author's machine.

## Performance

No webfonts; the portrait is served as AVIF, WebP or JPEG at the size it is shown, in a box that has its size before
the file arrives (no layout shift). The first screen's CSS is inline, the module script is fetched at low priority, and
nothing is measured on the main thread before it is needed. A Lighthouse gate runs on both pages, mobile and desktop.

## Accessibility

axe-core runs inside the end-to-end tests, in light and dark and under reduced motion, transparency and high contrast.
Colours are tokens, and `npm run check:contrast` checks every pairing in both themes. The career graph is a drawing
and is hidden from assistive technology; the list of roles under it carries the same facts and is the readable source.
Motion is gated on `prefers-reduced-motion`, and hover effects on a real hover device.

## How a change gets in

`main` is protected: every change is a pull request, and the CI job must pass before it is merged (squash only).
The job runs the type check (strict TypeScript, strict Angular templates), ESLint with the Angular template rules,
the unit tests with coverage, the contrast check, the `docs/` check and the end-to-end and accessibility tests.
`npm run verify` runs the same gates locally, plus the privacy check, the build and Lighthouse.

## What I would do differently with more room

A server-sent header would allow a stricter policy for styles. A build step that signs the content of `docs/` would
make the committed output verifiable by someone else. Neither is worth the machinery for a CV.
