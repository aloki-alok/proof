// ink.js from proof, by Alok Ranjan (https://alokranjan.me). MIT license.
const NS = 'http://www.w3.org/2000/svg'
let defs
let count = 0

function host() {
  if (defs) return defs
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('aria-hidden', 'true')
  svg.style.cssText = 'position:absolute;width:0;height:0'
  defs = document.createElementNS(NS, 'defs')
  svg.append(defs)
  document.body.append(svg)
  return defs
}

export function ink(el, { rough = 3, bleed = 0, boil = true, grain = 0.035 } = {}) {
  const id = 'ink-' + ++count
  const f = document.createElementNS(NS, 'filter')
  f.id = id
  f.setAttribute('x', '-5%')
  f.setAttribute('y', '-5%')
  f.setAttribute('width', '110%')
  f.setAttribute('height', '110%')
  f.innerHTML = `
    <feTurbulence type="fractalNoise" baseFrequency="${grain}" numOctaves="2" seed="1" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="${rough}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feMorphology in="d" operator="dilate" radius="${bleed}" result="m"/>
    <feGaussianBlur in="m" stdDeviation="0.7" result="b"/>
    <feComponentTransfer in="b"><feFuncA type="table" tableValues="0 0 0.9 1 1"/></feComponentTransfer>`
  host().append(f)
  el.style.filter = `url(#${id})`
  const turb = f.querySelector('feTurbulence')
  const disp = f.querySelector('feDisplacementMap')
  const morph = f.querySelector('feMorphology')
  let timer = 0
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  const start = () => { if (!timer && !still) timer = setInterval(() => turb.setAttribute('seed', 1 + Math.floor(Math.random() * 3)), 130) }
  const stop = () => { clearInterval(timer); timer = 0 }
  if (boil) start()
  return {
    set({ rough: r, bleed: b, boil: on } = {}) {
      if (r !== undefined) disp.setAttribute('scale', r)
      if (b !== undefined) morph.setAttribute('radius', b)
      if (on === true) start()
      if (on === false) stop()
    },
    destroy() { stop(); f.remove(); el.style.filter = '' },
  }
}
