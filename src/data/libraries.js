import { gzipSync } from 'node:zlib'

// every page, the search index and the /r/ downloads read from this one list, so a library is added in one place
const sources = import.meta.glob('../lib/*.js', { query: '?raw', import: 'default', eager: true })
export const source = file => sources[`../lib/${file}`]
export const gzKB = file => (gzipSync(source(file)).byteLength / 1024).toFixed(1)

export const libraries = [
  {
    slug: 'ink',
    line: 'Hand-drawn edges for any element.',
    blurb: 'Gives borders, shapes and headings a brush-drawn edge that redraws a few times a second, like hand-drawn animation. Text inside stays real and selectable.',
    inspired: ['Rough.js', 'https://roughjs.com'],
    face: "700 1em/.85 'Basteleur'",
    files: ['ink.js'],
    usage: `import { ink } from './ink.js'

const card = ink(document.querySelector('.card'), { rough: 3 })

button.addEventListener('pointerenter', () => card.set({ bleed: 2.5 }))
button.addEventListener('pointerleave', () => card.set({ bleed: 0 }))`,
    call: 'ink(el, options)',
    options: [
      ['rough', 'number', '3', 'How far edges wander, in pixels.'],
      ['bleed', 'number', '0', 'How far ink spreads past the edge, in pixels.'],
      ['boil', 'boolean', 'true', 'Redraws the line about 8 times a second, like hand-drawn animation.'],
      ['grain', 'number', '0.035', 'Size of the wobble. Lower values give longer, lazier strokes.'],
    ],
    returns: [
      ['set({ rough, bleed, boil })', 'Changes any option while the page runs.'],
      ['destroy()', 'Removes the filter and stops the boil.'],
    ],
    notes: [
      'Ink a frame or a heading, not body text. The filter softens everything inside the element, and Safari blurs small text.',
      'The boil stops when the reader asks for reduced motion.',
    ],
  },
  {
    slug: 'riso',
    line: 'Two-color print look for any element.',
    blurb: 'Splits an element into two fluorescent inks with slight misregistration and paper grain, like a risograph print. Works on text, images and CSS shapes.',
    inspired: ['dithercn', 'https://dithercn.dev'],
    face: "400 1em/.9 'Ouroboros'",
    files: ['riso.js'],
    usage: `import { riso } from './riso.js'

const poster = riso(document.querySelector('.poster'), { a: 'pink', b: 'blue', shift: 4 })

poster.shift(0) // line the inks up`,
    call: 'riso(el, options)',
    options: [
      ['a', "'pink' | 'blue' | 'yellow' | 'green'", "'pink'", 'First ink. It prints where green is missing.'],
      ['b', "'pink' | 'blue' | 'yellow' | 'green'", "'blue'", 'Second ink. It prints where red is missing.'],
      ['shift', 'number', '4', 'Misregistration between the two inks, in pixels.'],
      ['grain', 'number', '0.5', 'Paper tooth, from 0 (smooth) to 1 (rough).'],
    ],
    returns: [
      ['shift(px)', 'Moves the inks apart or together.'],
      ['destroy()', 'Removes the filter.'],
    ],
    notes: [
      'Put light paper behind the element. The inks multiply, so a dark background swallows them.',
      'Scale the shift down for small text. About a third of the headline shift keeps 13 px text readable.',
    ],
  },
  {
    slug: 'dial',
    line: 'Touch-tone audio with a live spectrum.',
    blurb: 'Plays the two tones a phone sends for each key, decodes them back out of the audio, and draws them on a live spectrum. Built on the Web Audio API.',
    inspired: ['webaudio-controls', 'https://github.com/g200kg/webaudio-controls'],
    face: "400 1em/1 'Departure Mono'",
    icon: '',
    files: ['dial.js', 'dial-scope.js'],
    usage: `import { keypad } from './dial.js'
import { line } from './dial-scope.js'

const kp = keypad()
line(canvas, kp)

button.addEventListener('pointerdown', () => kp.press('5'))
button.addEventListener('pointerup', () => kp.release())`,
    call: 'keypad(audioContext?)',
    options: [
      ['audioContext', 'AudioContext', 'new AudioContext()', 'Pass your own to share one audio graph with the rest of the page.'],
    ],
    returns: [
      ['press(key)', 'Starts the two tones for 0-9, *, # or A-D.'],
      ['release()', 'Stops them with a short fade, so there is no click.'],
      ['dial(keys, gap?, hold?)', "Plays a string of keys such as '5551234'. Resolves when the last key ends."],
      ['decode()', 'Returns the key it hears in the live signal, or null.'],
      ['signal(name)', "Plays a network tone such as 'busy'. Returns its length in ms."],
      ['analyser', 'The AnalyserNode the scopes draw from.'],
      ['ctx', 'The AudioContext the keypad plays through.'],
    ],
    extra: [
      ['tones(key)', 'Returns the two frequencies of a key, such as [770, 1336] for 5.'],
      ['LOW, HIGH, KEYS', 'The row tones, the column tones and the key layout.'],
      ['SIGNALS', "Network tones that signal() can play, such as 'busy' and 'ringback, US'."],
      ['line(canvas, kp, options?)', 'From dial-scope.js. Draws the live spectrum with the eight key tones marked. Options: maxHz, guides, active (a function returning the tones to highlight) and colors. Returns { destroy }.'],
      ['waterfall(canvas, kp, options?)', 'From dial-scope.js. Draws a scrolling spectrogram. Options: maxHz, bg, hot and live (height of a live line under it). Returns { destroy }.'],
    ],
    notes: [
      'Call press() from a click or key handler. Browsers keep audio silent until the reader does something, and press() starts it at that moment.',
      'decode() ignores anything quieter than -45 dB, so network tones never read as keys.',
    ],
  },
  {
    slug: 'readback',
    line: 'See a page the way machines read it.',
    blurb: 'Lists what a crawler or screen reader gets from any part of a page, in reading order. Flags images without alt text, links and buttons without names, and inputs without labels.',
    inspired: ['crwl', 'https://crwl.sh'],
    face: "400 1em/.9 'Redaction'",
    files: ['readback.js'],
    usage: `import { read, mark } from './readback.js'

const lines = read(document.querySelector('main'))
const gaps = lines.filter(l => l.gap)
console.log(\`\${gaps.length} things a machine cannot read\`)

mark(document.querySelector('main')) // tags each element in place`,
    call: 'read(root)',
    options: [
      ['root', 'Element', 'required', 'The part of the page to read. Hidden and aria-hidden parts are skipped.'],
    ],
    returns: [
      ['[{ tag, text, gap, el }]', 'One line per heading, paragraph, image, link, button and form field, in reading order.'],
    ],
    extra: [
      ['mark(root)', 'Runs read, then sets data-rb on each element and adds the rb-gap class to every gap. Safe to run again. Each returned line also has node, the element that carries the mark.'],
    ],
    notes: [
      'A gap is an image with no alt text, a link or button with no name, or a form field (input, textarea or select) with no label. Submit and button inputs are named by their value.',
      'mark wraps each img and form field in a span with the class rb-wrap, because CSS cannot draw a label on those elements. Everything else only gets attributes. How a gap looks is up to your CSS.',
      'Links and buttons inside headings and paragraphs are read too. An image inside a link or button gives it a name through its alt text.',
    ],
  },
  {
    slug: 'reed',
    line: 'Fluted glass over live HTML.',
    blurb: 'Puts fluted, wavy or ripple glass over real HTML with an SVG filter. Text stays selectable, buttons stay clickable, and there is no WebGL.',
    inspired: ['Paper Shaders', 'https://shaders.paper.design'],
    face: "400 1em/.9 'Departure Mono'",
    files: ['reed.js'],
    usage: `import { reed, auto } from './reed.js'

const glass = reed(document.querySelector('.hero'), { shape: 'waves', size: 32 })
glass.set({ strength: 40 })

// or in markup: <div data-reed="ripple" data-reed-size="24">
auto()`,
    call: 'reed(el, options)',
    options: [
      ['shape', "'lines' | 'waves' | 'zigzag' | 'ripple'", "'lines'", 'The glass pattern.'],
      ['size', 'number', '32', 'Width of one flute, in pixels.'],
      ['strength', 'number', '28', 'How far the glass bends what is under it.'],
      ['blur', 'number', '0', 'Frost along each flute.'],
      ['shade', 'number', '0.35', 'Light and shadow on the flute edges.'],
      ['profile', "'lens' | 'prism'", "'lens'", 'Round flutes or flat angled ones.'],
      ['wave, amp', 'number', '220, 18', 'Wavelength and depth for waves and zigzag.'],
      ['patch', '{ x, y, w, h } | null', 'null', 'Limits the glass to a pane you can move.'],
    ],
    returns: [
      ['set(options)', 'Changes any option.'],
      ['move(x, y)', 'Moves the patch without redrawing the glass.'],
      ['options', 'A copy of the current options.'],
      ['destroy()', 'Removes the glass.'],
    ],
    extra: [
      ['auto(root?)', 'Applies reed to every [data-reed] element. The attribute value is the shape, and data-reed-size, data-reed-strength and the other data-reed-* attributes set options. Returns the instances.'],
    ],
    notes: [
      'Safari stops painting a moving patch, so reed leaves the patch off in Safari. Fixed glass works everywhere.',
      'move() only works on glass created with a patch.',
    ],
  },
  {
    slug: 'ascii',
    line: 'Live ASCII text, tables and rules.',
    blurb: 'Renders a word as an animated field of characters, plus box-drawing tables and section rules that fit any width. The headers on this site are built with it.',
    inspired: null,
    face: "400 1em/1 'Departure Mono'",
    files: ['ascii.js'],
    usage: `import { field, table, rules } from './ascii.js'

field(document.querySelector('pre.hero'), { word: 'proof', rows: 20 })

table(document.querySelector('pre.index'), [
  ['ink', 'brush ink on any element', 'after Rough.js', '/docs/ink'],
])

rules() // fills every [data-rule] with ──[ name ]────`,
    call: 'field(pre, options)',
    options: [
      ['word', 'string', "'proof'", 'The word drawn in characters.'],
      ['rows', 'number', '16', 'Height of the field, in lines.'],
      ['ramp', 'string', "' .·:-=+*#%@'", 'Characters from empty to dense.'],
      ['face', 'CSS font', "'800 100px Martian Mono'", 'The font the word is drawn with. The size is replaced.'],
    ],
    returns: [
      ['set(word)', 'Changes the word and redraws the field.'],
      ['destroy()', 'Stops the animation and the resize and visibility observers.'],
    ],
    extra: [
      ['table(pre, rows, { min }?)', 'A box-drawing table. Rows are [name, description, aside, href]. The aside column drops on narrow screens, and min sets the narrowest middle column. Returns { destroy }.'],
      ['rules(root?)', 'Fills each [data-rule] element with a rule that fits its width. Call it once per page. Returns { destroy }.'],
    ],
    notes: [
      'Use a monospace font on the pre. The field measures one character to know its grid.',
      'The field pauses off screen and stays still for readers who ask for reduced motion.',
    ],
  },
]

export const bySlug = Object.fromEntries(libraries.map(l => [l.slug, l]))
export const allFiles = libraries.flatMap(l => l.files)
