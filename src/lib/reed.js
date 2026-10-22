// reed.js from proof, by Alok Ranjan (https://alokranjan.me). MIT license.
const NS = 'http://www.w3.org/2000/svg'
let defs
let count = 0
// sampling past the element's edge returns transparent pixels, so full-element maps flatten out near the border
const EDGE = 40
const safari = typeof navigator !== 'undefined' && /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|Firefox|FxiOS|CriOS/.test(navigator.userAgent)

const defaults = { shape: 'lines', size: 32, strength: 28, blur: 0, shade: 0.35, profile: 'lens', wave: 220, amp: 18, patch: null }

const profiles = {
  lens: t => 0.5 - 0.5 * Math.cos(t * Math.PI * 2),
  prism: t => t,
}

const offsets = {
  lines: () => 0,
  waves: (y, o) => Math.sin(y / o.wave * Math.PI * 2) * o.amp,
  zigzag: (y, o) => (Math.abs((y / o.wave * 2) % 2 - 1) - 0.5) * o.amp * 2,
}

function host() {
  if (defs) return defs
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('aria-hidden', 'true')
  svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none'
  defs = document.createElementNS(NS, 'defs')
  svg.append(defs)
  document.body.append(svg)
  return defs
}

function draw(W, H, o) {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  const img = ctx.createImageData(W, H)
  const d = img.data
  const p = profiles[o.profile] || profiles.lens
  const cx = W / 2, cy = H / 2
  for (let y = 0; y < H; y++) {
    const off = o.shape === 'ripple' ? 0 : (offsets[o.shape] || offsets.lines)(y, o)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4
      if (o.shape === 'ripple') {
        const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy) || 1
        const fade = Math.max(0, 1 - r / Math.min(cx, cy))
        const v = (p((r % o.size) / o.size) - 0.5) * fade * fade
        d[i] = 128 + 255 * v * dx / r
        d[i + 1] = 128 + 255 * v * dy / r
        d[i + 3] = fade > 0 ? 255 : 0
      } else {
        const t = (((x + off) % o.size) + o.size) % o.size / o.size
        const edge = o.patch ? 1 : Math.min(1, x / EDGE, (W - 1 - x) / EDGE, y / EDGE, (H - 1 - y) / EDGE)
        d[i] = 128 + (p(t) - 0.5) * 255 * edge
        d[i + 1] = 128
        d[i + 3] = 255
      }
      d[i + 2] = 128
    }
  }
  ctx.putImageData(img, 0, 0)
  return c.toDataURL()
}

const at = (node, attrs) => { for (const k in attrs) node.setAttribute(k, attrs[k]); return node }
const make = (tag, attrs) => at(document.createElementNS(NS, tag), attrs)

export function reed(el, options = {}) {
  const id = 'reed-' + ++count
  let o = { ...defaults, ...options }
  let key = ''
  const filter = make('filter', { id, x: 0, y: 0, width: 1, height: 1, 'color-interpolation-filters': 'sRGB' })
  let image = make('feImage', {})
  const shift = make('feOffset', { in: 'p0', result: 'p', x: '0%', y: '0%', width: '100%', height: '100%' })
  const disp = make('feDisplacementMap', { in: 'SourceGraphic', in2: 'm', xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' })
  const blur = make('feGaussianBlur', { in: 'd', result: 'b' })
  const hi = make('feColorMatrix', { in: 'p', type: 'matrix', result: 'hi' })
  const lo = make('feColorMatrix', { in: 'p', type: 'matrix', result: 'lo' })
  const merge = (...ins) => { const m = make('feMerge', {}); ins.forEach(i => m.append(make('feMergeNode', { in: i }))); return m }
  filter.append(
    make('feFlood', { 'flood-color': 'rgb(128,128,128)', result: 'n' }),
    image,
    shift,
    at(merge('n', 'p'), { result: 'm' }),
    disp,
    blur,
    make('feComposite', { in: 'b', in2: 'p', operator: 'in', result: 'bp' }),
    lo,
    hi,
    merge('d', 'bp', 'lo', 'hi'),
  )
  host().append(filter)

  // Safari stops painting a filter whose feImage is edited after first paint, so a new map gets a fresh node and moves go through feOffset
  const pct = (v, total) => (v / Math.max(1, total) * 100) + '%'
  const place = (x, y) => at(shift, { dx: x, dy: y })

  function render() {
    const W = Math.max(1, Math.round(o.patch ? o.patch.w : el.clientWidth))
    const H = Math.max(1, Math.round(o.patch ? o.patch.h : el.clientHeight))
    const next = [W, H, o.shape, o.size, o.profile, o.wave, o.amp, el.clientWidth, el.clientHeight].join()
    if (next !== key) {
      key = next
      const fresh = make('feImage', { href: draw(W, H, o), width: pct(W, el.clientWidth), height: pct(H, el.clientHeight), preserveAspectRatio: 'none', result: 'p0' })
      image.replaceWith(fresh)
      image = fresh
    }
    place(o.patch ? o.patch.x : 0, o.patch ? o.patch.y : 0)
    const s = o.shade * 2
    at(disp, { scale: o.strength })
    at(blur, { stdDeviation: `${o.blur} 0` })
    at(hi, { values: `0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 ${s} 0 0 ${-s * 0.6} 0` })
    at(lo, { values: `0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${-s} 0 0 ${s * 0.4} 0` })
  }

  const ro = new ResizeObserver(() => render())
  ro.observe(el)
  // Safari blanks the element once a moving patch updates, so moving glass is left off there and the content stays clear
  if (!(o.patch && safari)) el.style.filter = `url(#${id})`
  render()

  return {
    set(next) { o = { ...o, ...next }; render() },
    move(x, y) { if (!o.patch) return; o.patch = { ...o.patch, x, y }; place(x, y) },
    get options() { return { ...o } },
    destroy() { ro.disconnect(); filter.remove(); el.style.filter = '' },
  }
}

export function auto(root = document) {
  return [...root.querySelectorAll('[data-reed]')].map(el => {
    const opts = {}
    for (const k in defaults) {
      const v = el.dataset['reed' + k[0].toUpperCase() + k.slice(1)]
      if (v !== undefined) opts[k] = isNaN(v) ? v : +v
    }
    if (el.dataset.reed) opts.shape = el.dataset.reed
    return reed(el, opts)
  })
}
