// riso.js from proof, by Alok Ranjan (https://alokranjan.me). MIT license.
const NS = 'http://www.w3.org/2000/svg'
let defs
let count = 0

const inks = {
  pink: [1, 0.28, 0.69],
  blue: [0, 0.47, 0.75],
  yellow: [1, 0.91, 0],
  green: [0, 0.66, 0.36],
}

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

// each ink takes the density the other ink leaves out: pink lays down where green is missing, blue where red is
export function riso(el, { a = 'pink', b = 'blue', shift = 4, grain = 0.5 } = {}) {
  const id = 'riso-' + ++count
  const [ar, ag, ab] = inks[a] || inks.pink
  const [br, bg, bb] = inks[b] || inks.blue
  const f = document.createElementNS(NS, 'filter')
  f.id = id
  f.setAttribute('color-interpolation-filters', 'sRGB')
  f.innerHTML = `
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="4" result="noise"/>
    <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -${grain * 2} 0 0 0 ${0.6 + grain}" result="tooth"/>
    <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 ${ar}  0 0 0 0 ${ag}  0 0 0 0 ${ab}  0 -1 0 1 0" result="a0"/>
    <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 ${br}  0 0 0 0 ${bg}  0 0 0 0 ${bb}  -1 0 0 1 0" result="b0"/>
    <feOffset in="a0" dx="0" dy="0" result="a1"/>
    <feOffset in="b0" dx="0" dy="0" result="b1"/>
    <feComposite in="a1" in2="tooth" operator="in" result="a2"/>
    <feComposite in="b1" in2="tooth" operator="in" result="b2"/>
    <feBlend in="a2" in2="b2" mode="multiply"/>`
  host().append(f)
  el.style.filter = `url(#${id})`
  const [oa, ob] = f.querySelectorAll('feOffset')
  const angle = Math.random() * Math.PI * 2
  const set = s => {
    oa.setAttribute('dx', Math.cos(angle) * s)
    oa.setAttribute('dy', Math.sin(angle) * s)
    ob.setAttribute('dx', -Math.cos(angle) * s * 0.6)
    ob.setAttribute('dy', -Math.sin(angle) * s * 0.6)
  }
  set(shift)
  return { shift: set, destroy() { f.remove(); el.style.filter = '' } }
}
