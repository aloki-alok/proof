# proof

Dependency-free JavaScript libraries for print, sound and text effects on real HTML. Each library is one ES module you copy into your project.

| Library | What it does |
| --- | --- |
| [ink](src/lib/ink.js) | Hand-drawn edges for any element |
| [riso](src/lib/riso.js) | Two-color print look for any element |
| [dial](src/lib/dial.js) | Touch-tone audio with a live spectrum ([scope](src/lib/dial-scope.js)) |
| [readback](src/lib/readback.js) | See a page the way machines read it |
| [reed](src/lib/reed.js) | Fluted glass over live HTML |
| [ascii](src/lib/ascii.js) | Live ASCII text, tables and rules |

## Use a library

Copy the file from `src/lib` into your project and import it:

```js
import { ink } from './ink.js'

ink(document.querySelector('.card'), { rough: 3 })
```

The docs site has a live demo, the full API and browser notes for each library.

## Work on the site

The site is an [Astro](https://astro.build) static build. It needs [Bun](https://bun.sh).

```sh
bun install
bun run dev      # local site at http://localhost:4747
bun run build    # static output in dist/
bun run check    # type check
```

`src/data/libraries.js` is the single list behind every page, the search index, `/llms.txt` and the `/r/<file>.js` downloads. To add a library, add its file to `src/lib`, a record to that list and a demo to `src/components/demos`.

## Check the pages

`scripts/check-pages.mjs` loads every route in Chromium, Firefox and WebKit. It fails on page errors, failed loads, sideways scroll at phone width, and broken core flows (dial, search, install, downloads, theme, readback, the ascii animation loop).

```sh
bunx playwright install chromium firefox webkit
bun run build
bun run preview      # serves dist/ at http://localhost:4747 in the background
bun run check:pages
bunx astro preview stop
```

## License

MIT, by [Alok Ranjan](https://alokranjan.me). Fonts are under the SIL Open Font License. Their licenses are in `public/fonts`.
