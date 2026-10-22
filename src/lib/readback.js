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
  // button-like inputs are named by their value (an image input by its alt), like a button by its text
  if (tag === 'input' && ['submit', 'reset', 'button', 'image'].includes(n.type)) {
    const label = n.getAttribute('aria-label') || (n.type === 'image' ? n.alt : n.value) || { submit: 'Submit', reset: 'Reset' }[n.type]
    return label ? { tag, text: `${n.type}: ${label}` } : { tag, text: `${n.type}: no label`, gap: true }
  }
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    const kind = tag === 'input' ? n.type : tag
    const label = n.labels?.[0] ? text(n.labels[0]) : n.getAttribute('aria-label')
    return label ? { tag, text: `${kind}: ${label}` } : { tag, text: `${kind}: no label`, gap: true }
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
    else if (['IMG', 'INPUT', 'TEXTAREA', 'SELECT'].includes(l.el.tagName)) {
      // pseudo-elements cannot sit on replaced elements such as img and input, so each gets a span to carry the label
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
