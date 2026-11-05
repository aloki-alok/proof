# AGENTS.md

proof is a docs site (Astro 7, static, Bun) for six dependency-free JavaScript libraries (ink, riso, dial, readback, reed, ascii). Each library is one ES module that users copy into their own project.

## Commands

- Install: `bun install --frozen-lockfile`
- Dev server: `bun run dev` (http://localhost:4747)
- Type check: `bun run check`
- Build: `bun run build` (output in `dist/`)
- Preview the build: `bun run preview` (http://localhost:4747, stop it with Ctrl-C)
- Browser check: `bunx playwright install chromium firefox webkit`, then with the preview running, `bun run check:pages`. It prints `PASS all pages and flows`.
- Bun is the package manager. Use the lockfile `bun.lock`, not npm or yarn.

## Layout

- `src/lib/`: the libraries themselves. One dependency-free ES module each (`ink.js`, `riso.js`, `dial.js`, `readback.js`, `reed.js`, `ascii.js`), plus `dial-scope.js`.
- `src/data/libraries.js`: the single list behind every page, the search index, `/llms.txt` and the `/r/<file>.js` downloads.
- `src/components/demos/`: one live demo per library.
- `src/pages/`: routes (`index`, `docs/`, `changelog`, `llms.txt.ts`, `r/[file].ts`, `404`).
- `src/layouts/`, `src/styles/`: shared layouts and CSS.
- `src/data/paths.js`: `to()` builds every internal link.
- `public/`: fonts (with OFL licenses), `og.png`, `robots.txt`, `humans.txt`.
- `scripts/check-pages.mjs`: Playwright check of every route. `make-readme-shots.mjs` and `make-og.mjs` refresh images.
- `.github/workflows/pages.yml`: builds and deploys the site to GitHub Pages on every push to `main`.

## Rules

- Libraries in `src/lib` import nothing. Do not add a dependency to a library file.
- To add a library: add the file to `src/lib`, a record to `src/data/libraries.js` and a demo to `src/components/demos`. Nothing else lists libraries.
- Build every internal link with `to()` from `src/data/paths.js`. The site runs at `/` locally and under `/proof` on GitHub Pages.
- Effects apply to real HTML. Text stays selectable, buttons stay clickable, and there is no WebGL.
- Pin GitHub Actions by commit SHA, as the existing workflow does.
- Fonts are under the SIL Open Font License. Keep each license file next to its font.

## Before you open a PR

CI runs these steps in order:

1. `bun install --frozen-lockfile`
2. `bun run check`
3. `bun run build` (with `SITE=https://aloki-alok.github.io BASE_PATH=/proof`)

CI does not run `bun run check:pages`. Run it yourself when you change a page, a demo or a library.
