// dial-scope.js from proof, by Alok Ranjan (https://alokranjan.me). MIT license.
// draws only while the canvas is on screen, so three scopes on one page cost one at a time
function loop(canvas, paint) {
  let raf = 0, seen = false
  const tick = () => { paint(); raf = seen ? requestAnimationFrame(tick) : 0 }
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen && !raf) raf = requestAnimationFrame(tick) }).observe(canvas)
}

function fit(canvas) {
  const dpr = devicePixelRatio || 1
  const W = Math.round(canvas.clientWidth * dpr), H = Math.round(canvas.clientHeight * dpr)
  const resized = canvas.width !== W || canvas.height !== H
  if (resized) { canvas.width = W; canvas.height = H }
  return { W, H, dpr, resized }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ analyser: AnalyserNode, ctx: BaseAudioContext }} kp
 * @param {{ maxHz?: number, color?: string, guide?: string, hot?: string, font?: string, guides?: number[], active?: () => number[], fill?: string }} [options] */
export function line(canvas, kp, { maxHz = 1800, color = '#18181b', guide = '#e4e4e0', hot = '#2b59ff', font = 'Martian Mono', guides = [], active = () => [], fill = 'rgba(43,89,255,.08)' } = {}) {
  const ctx = canvas.getContext('2d')
  const bins = new Uint8Array(kp.analyser.frequencyBinCount)
  const hzPerBin = kp.ctx.sampleRate / kp.analyser.fftSize
  loop(canvas, () => {
    const { W, H, dpr } = fit(canvas)
    const pad = 28 * dpr, top = 34 * dpr
    kp.analyser.getByteFrequencyData(bins)
    ctx.clearRect(0, 0, W, H)
    const on = active()
    ctx.font = `${11 * dpr}px ${font}`
    ctx.textAlign = 'center'
    // on narrow canvases the closest guides (697, 770) collide, so only the lit ones keep a label
    const roomy = Math.min(...guides.slice(1).map((g, i) => g - guides[i]).filter(d => d > 0)) / maxHz * W > ctx.measureText('0000').width + 6 * dpr
    for (const hz of guides) {
      const x = hz / maxHz * W, lit = on.includes(hz)
      ctx.fillStyle = lit ? hot : guide
      ctx.fillRect(x - (lit ? dpr : dpr / 2), top - 6 * dpr, lit ? 2 * dpr : dpr, H - pad - top + 6 * dpr)
      ctx.fillStyle = lit ? hot : '#8a8a85'
      if (roomy || lit) ctx.fillText(hz, x, H - 9 * dpr)
    }
    const n = Math.floor(maxHz / hzPerBin), step = W / n, base = H - pad
    ctx.beginPath()
    ctx.moveTo(0, base)
    for (let i = 0; i < n; i++) ctx.lineTo(i * step, base - (base - top) * bins[i] / 255)
    ctx.lineTo(W, base)
    ctx.fillStyle = fill
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = 2 * dpr
    ctx.lineJoin = 'round'
    ctx.stroke()
    for (const hz of on) {
      const x = hz / maxHz * W
      ctx.fillStyle = hot
      ctx.font = `600 ${13 * dpr}px ${font}`
      ctx.fillText(`${hz} Hz`, x, top - 14 * dpr)
    }
  })
}

export function waterfall(canvas, kp, { maxHz = 1800, bg = [12, 11, 14], hot = [255, 176, 32], live = 0, stroke = '#ffb020' } = {}) {
  const ctx = canvas.getContext('2d')
  const bins = new Uint8Array(kp.analyser.frequencyBinCount)
  const hzPerBin = kp.ctx.sampleRate / kp.analyser.fftSize
  const ramp = v => {
    const t = v / 255, a = Math.min(1, t * 1.7), b = Math.pow(t, 1.6)
    return `rgb(${Math.round(bg[0] + (hot[0] - bg[0]) * a)},${Math.round(bg[1] + (hot[1] - bg[1]) * b)},${Math.round(bg[2] + (hot[2] - bg[2]) * b)})`
  }
  loop(canvas, () => {
    const { W, H, dpr, resized } = fit(canvas)
    const L = live * dpr, F = H - L
    if (resized) { ctx.fillStyle = `rgb(${bg})`; ctx.fillRect(0, 0, W, H) }
    kp.analyser.getByteFrequencyData(bins)
    ctx.drawImage(canvas, 0, dpr, W, F - dpr, 0, 0, W, F - dpr)
    const n = Math.floor(maxHz / hzPerBin), step = W / n
    for (let i = 0; i < n; i++) { ctx.fillStyle = ramp(bins[i]); ctx.fillRect(i * step, F - dpr, step + 1, dpr) }
    if (!L) return
    ctx.fillStyle = `rgb(${bg})`
    ctx.fillRect(0, F, W, L)
    ctx.beginPath()
    for (let i = 0; i < n; i++) { const y = H - 4 * dpr - (L - 8 * dpr) * bins[i] / 255; i ? ctx.lineTo(i * step, y) : ctx.moveTo(i * step, y) }
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1.5 * dpr
    ctx.stroke()
  })
}
