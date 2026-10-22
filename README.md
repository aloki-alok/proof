<p align="center"><img src="public/og.png" alt="proof, drawn as live ASCII characters, above the line: six small libraries for print, sound and text effects on the web" width="800"></p>

# proof

Six dependency-free JavaScript libraries for print, sound and ASCII effects on real HTML. Each library is one ES module. Copy the file into your project, import it, and the code is yours.

Effects apply to the live page, mostly through SVG filters and the Web Audio API. Text stays selectable, and crawlers and screen readers can still read the page.

## Libraries

### ink: hand-drawn edges for any element

Borders, shapes and headings get a brush-drawn edge that redraws a few times a second, like hand-drawn animation. Ink bleeds on hover.

<img src=".github/assets/ink.png" alt="An inked card with a wobbly outline, a circle, a tilted red square and roughness and bleed sliders" width="800">

### riso: two-color print look for any element

Splits an element into two fluorescent inks with slight misregistration and paper grain, like a risograph print. Works on text, images and CSS shapes.

<img src=".github/assets/riso.png" alt="A poster printed in pink and blue inks, slightly out of register: large type, hills under a sun, dots and a bar chart" width="800">

### dial: touch-tone audio with a live spectrum

Plays the two tones a phone sends for each key, decodes them back out of the audio, and draws them on a live spectrum.

<img src=".github/assets/dial.png" alt="Key 8 held down: the spectrum shows peaks at 852 Hz and 1336 Hz above a row of twelve keys" width="800">

### readback: see a page the way machines read it

Lists what a crawler or screen reader gets from any part of a page, in reading order. Images without alt text, unnamed links and buttons, and unlabeled fields are flagged.

<img src=".github/assets/readback.png" alt="A sample page at full machine view: each element tagged, and the image, an icon link, an unlabeled input and an icon button covered by redaction bars" width="800">

### reed: fluted glass over live HTML

Fluted, wavy or ripple glass over real HTML. Text stays selectable, buttons stay clickable, and there is no WebGL.

<img src=".github/assets/reed.png" alt="Vertical fluted glass over a card, a large word and four color blocks, with shape, flute and strength controls" width="800">

### ascii: live ASCII text, tables and rules

Renders a word as an animated field of characters that ripples where you click, plus box-drawing tables and section rules that fit any width.

<img src=".github/assets/ascii.png" alt="The word ink drawn in ASCII characters above a box-drawing table" width="800">

## Use a library

Copy the file from [`src/lib`](src/lib) into your project and import it:

```js
import { ink } from './ink.js'

ink(document.querySelector('.card'), { rough: 3 })
```

Each library's docs page has a live demo, the full API and browser notes.

## Work on the site

The docs site is an [Astro](https://astro.build) static build. It needs [Bun](https://bun.sh).

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

While the preview runs, `node scripts/make-readme-shots.mjs` refreshes the images in this README, and `node scripts/make-og.mjs` refreshes the share image.

## License

MIT, by [Alok Ranjan](https://alokranjan.me). Fonts are under the SIL Open Font License. Their licenses are in `public/fonts`.
