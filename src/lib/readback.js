// readback.js from proof, by Alok Ranjan (https://alokranjan.me). MIT license.
const text = n => (n.textContent || '').replace(/\s+/g, ' ').trim()
// an image inside a link or button names it, the way screen readers announce it
const alts = el => [...el.querySelectorAll('img[alt]')].filter(i => !i.closest('[aria-hidden="true"]')).map(i => i.alt).join(' ').trim()
const name = el => el.getAttribute('aria-label') || text(el) || alts(el) || el.getAttribute('title') || ''

function judge(n) {
  const tag = n.tagName.toLowerCase()
  if (/^h[1-6]$/.test(tag) || tag === 'p') return { tag, text: text(n), block: true }
  if (tag === 'img') return n.alt ? { tag, text: `"${n.alt}"` } : { tag, text: 'no alt text', gap: true }
  if (tag === 'a') return name(n) ? { tag, text: `${name(n)} → ${n.getAttribute('href')}` } : { tag, text: `no link text → ${n.getAttribute('href')}`, gap: true }
  if (tag === 'button') return name(n) ? { tag, text: name(n) } : { tag, text: 'no label', gap: true }
  if (tag === 'input') {
    const label = n.labels?.[0] ? text(n.labels[0]) : n.getAttribute('aria-label')
    return label ? { tag, text: `${n.type}: ${label}` } : { tag, text: `${n.type}: no label`, gap: true }
  }
  return null
}

// what a crawler or screen reader gets from a subtree, in reading order, with the element each line came from
export function read(root) {
  const lines = []
  const walk = el => {
    for (const n of el.children) {
      if (n.closest('[aria-hidden="true"]') || getComputedStyle(n).display === 'none') continue
      const line = judge(n)
      if (line) lines.push({ tag: line.tag, text: line.text, gap: line.gap, el: n })
      // text blocks can hold links and buttons of their own, so their children are read too
      if (!line || line.block) walk(n)
    }
  }
  walk(root)
  return lines
}

// marks every element in place: data-rb carries the machine reading, rb-gap marks what a machine cannot read; safe to run again
export function mark(root) {
  const lines = read(root)
  for (const l of lines) {
    let target = l.el
    if (l.el.parentElement?.classList.contains('rb-wrap')) target = l.el.parentElement
    else if (l.el.tagName === 'IMG' || l.el.tagName === 'INPUT') {
      // pseudo-elements cannot sit on img or input, so each one gets a span to carry the label
      const wrap = document.createElement('span')
      wrap.className = 'rb-wrap'
      l.el.replaceWith(wrap)
      wrap.append(l.el)
      target = wrap
    }
    target.dataset.rb = `${l.tag}${l.gap ? ' · ' + l.text : ''}`
    target.classList.toggle('rb-gap', !!l.gap)
    l.node = target
  }
  return lines
}
