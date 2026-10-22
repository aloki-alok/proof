// ascii.js from proof, by Alok Ranjan (https://alokranjan.me). MIT license.
const RAMP = ' .·:-=+*#%@'

function cell(pre) {
  const probe = document.createElement('span')
  probe.textContent = 'M'.repeat(20)
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre'
  pre.append(probe)
  const r = probe.getBoundingClientRect()
  probe.remove()
  return { w: r.width / 20, h: parseFloat(getComputedStyle(pre).lineHeight) || r.height }
}

// renders a word as a live character field: the word is the dense core, a slow wave is the haze, the pointer drops ripples
export function field(pre, { word = 'proof', face = '800 100px Martian Mono', ramp = RAMP, rows = 16 } = {}) {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  const mask = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  let cols = 0, data = null, px = -1, py = -1, drops = [], raf = 0, seen = true, last = 0

  function layout() {
    const { w } = cell(pre)
    cols = Math.max(20, Math.floor(pre.clientWidth / w))
    mask.canvas.width = cols
    mask.canvas.height = rows
    mask.fillStyle = '#000'
    mask.fillRect(0, 0, cols, rows)
    mask.fillStyle = '#fff'
    mask.textBaseline = 'middle'
    mask.textAlign = 'left'
    // characters are about twice as tall as wide, so the word is drawn squashed to come out right
    let size = rows * 2.3
    mask.font = face.replace(/\d+px/, size + 'px')
    // on narrow screens shrink the word to fit instead of cropping it
    const fits = (cols - 2) / mask.measureText(word).width
    if (fits < 1) mask.font = face.replace(/\d+px/, (size *= fits) + 'px')
    mask.save()
    mask.scale(1, 0.5)
    const wide = mask.measureText(word).width
    mask.fillText(word, Math.max(1, (cols - wide) * 0.06), rows)
    mask.restore()
    data = mask.getImageData(0, 0, cols, rows).data
  }

  // the only function that schedules itself, so there is never more than one loop
  function loop(t) {
    raf = seen && !still ? requestAnimationFrame(loop) : 0
    if (t - last < 40) return
    last = t
    paint(t)
  }

  function paint(t) {
    const T = t / 1000
    drops = drops.filter(d => T - d.t < 2.4)
    let out = ''
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const core = data[(y * cols + x) * 4] / 255
        let v = core * 0.92
        const haze = (Math.sin(x * 0.11 + T * 0.8) + Math.sin(y * 0.45 - T * 0.6 + x * 0.05)) * 0.5
        v += haze > 0.55 ? (haze - 0.55) * 0.35 : 0
        for (const d of drops) {
          const dist = Math.hypot((x - d.x) * 0.5, y - d.y), age = T - d.t
          v += Math.cos((dist - age * 14) * 0.9) * Math.max(0, 1 - Math.abs(dist - age * 14) / 3) * (1 - age / 2.4) * 0.5
        }
        if (px >= 0) v += Math.max(0, 1 - Math.hypot((x - px) * 0.5, y - py) / 5) * 0.35
        out += ramp[Math.max(0, Math.min(ramp.length - 1, Math.round(v * (ramp.length - 1))))]
      }
      out += '\n'
    }
    pre.textContent = out
  }

  const off = new AbortController(), on = { signal: off.signal }
  let gone = false
  const at = e => { const r = pre.getBoundingClientRect(), { w, h } = cell(pre); return [(e.clientX - r.left) / w, (e.clientY - r.top) / h] }
  pre.addEventListener('pointermove', e => { [px, py] = at(e) }, on)
  pre.addEventListener('pointerleave', () => { px = py = -1 }, on)
  pre.addEventListener('pointerdown', e => { const [x, y] = at(e); drops.push({ x, y, t: performance.now() / 1000 }) }, on)
  const redraw = () => { if (!gone) { layout(); paint(performance.now()) } }
  const ro = new ResizeObserver(redraw)
  const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen && !raf && !still) raf = requestAnimationFrame(loop) })
  ro.observe(pre)
  io.observe(pre)
  redraw()
  // canvas falls back to a system font until the web font loads, so redraw once it arrives
  document.fonts?.load(face).then(redraw)
  return {
    set(next) { word = next; redraw() },
    destroy() { gone = true; off.abort(); ro.disconnect(); io.disconnect(); cancelAnimationFrame(raf); raf = 0; seen = false },
  }
}

// box-drawing table sized to whatever width it gets; the middle column absorbs the slack
export function table(pre, rows, { min = 6 } = {}) {
  const draw = () => {
    const { w } = cell(pre)
    const cols = Math.max(30, Math.floor(pre.clientWidth / w))
    const a = Math.max(...rows.map(r => r[0].length)) + 2
    const c = Math.min(Math.max(...rows.map(r => r[2].length)) + 2, Math.floor(cols * 0.32))
    const narrow = cols < 56
    const b = narrow ? cols - a - 3 : cols - a - c - 4
    const fit = (s, n) => (s.length > n - 2 ? s.slice(0, n - 3) + '…' : s).padEnd(n - 2)
    const rule = (l, m, r) => l + '─'.repeat(a) + m + '─'.repeat(Math.max(min, b)) + (narrow ? '' : m + '─'.repeat(c)) + r
    pre.replaceChildren()
    const add = (txt, href) => { if (href) { const link = document.createElement('a'); link.href = href; link.textContent = txt; pre.append(link) } else pre.append(txt) }
    add(rule('┌', '┬', '┐') + '\n')
    rows.forEach((r, i) => {
      add('│ ')
      add(fit(r[0], a), r[3])
      add(' │ ' + fit(r[1], Math.max(min, b)) + (narrow ? ' │' : ' │ ' + fit(r[2], c) + ' │') + '\n')
      add(i < rows.length - 1 ? rule('├', '┼', '┤') + '\n' : rule('└', '┴', '┘'))
    })
  }
  const ro = new ResizeObserver(draw)
  ro.observe(pre)
  draw()
  return { destroy() { ro.disconnect() } }
}

// a rule like ──[ ink ]────── that always fills its line
export function rules(root = document) {
  const els = [...root.querySelectorAll('[data-rule]')]
  const draw = () => els.forEach(el => {
    const { w } = cell(el)
    const n = Math.floor(el.clientWidth / w)
    const head = `──[ ${el.dataset.rule} ]`
    el.textContent = head + '─'.repeat(Math.max(0, n - head.length))
  })
  const ro = new ResizeObserver(draw)
  ro.observe(document.body)
  draw()
  return { destroy() { ro.disconnect() } }
}
