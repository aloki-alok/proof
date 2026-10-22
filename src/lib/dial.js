// dial.js from proof, by Alok Ranjan (https://alokranjan.me). MIT license.
export const LOW = [697, 770, 852, 941]
export const HIGH = [1209, 1336, 1477, 1633]
export const KEYS = ['123A', '456B', '789C', '*0#D']

export const tones = key => {
  const r = KEYS.findIndex(row => row.includes(key))
  return r < 0 ? null : [LOW[r], HIGH[KEYS[r].indexOf(key)]]
}

// call progress tones: each step is [frequencies, on ms, off ms]; am is a tremolo rate in Hz
export const SIGNALS = {
  'dial tone, US': { steps: [[[350, 440], 1800, 0]] },
  'dial tone, India': { steps: [[[400], 1800, 0]], am: 25 },
  'ringback, US': { steps: [[[440, 480], 1600, 0]] },
  'busy': { steps: [[[480, 620], 500, 500], [[480, 620], 500, 500], [[480, 620], 500, 0]] },
  'number disconnected': { steps: [[[913.8], 274, 0], [[1370.6], 274, 0], [[1776.7], 380, 0]] },
  '2600 Hz seize': { steps: [[[2600], 900, 0]] },
}

export function keypad(ctx = new AudioContext()) {
  const out = ctx.createGain()
  out.gain.value = 0.18
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 8192
  analyser.smoothingTimeConstant = 0.2
  analyser.minDecibels = -82
  analyser.maxDecibels = -18
  out.connect(analyser)
  analyser.connect(ctx.destination)
  let live = null

  function press(key) {
    const f = tones(key)
    if (!f) return
    release()
    ctx.resume()
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, ctx.currentTime)
    env.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.01)
    env.connect(out)
    const osc = f.map(hz => { const o = ctx.createOscillator(); o.frequency.value = hz; o.connect(env); o.start(); return o })
    live = { osc, env }
  }

  function release() {
    if (!live) return
    const { osc, env } = live
    env.gain.setTargetAtTime(0, ctx.currentTime, 0.015)
    osc.forEach(o => o.stop(ctx.currentTime + 0.1))
    live = null
  }

  // reads the two strongest DTMF bins back out of the live signal, so the decoder hears what the speaker plays
  function decode() {
    const bins = new Float32Array(analyser.frequencyBinCount)
    analyser.getFloatFrequencyData(bins)
    const level = hz => bins[Math.round(hz / (ctx.sampleRate / analyser.fftSize))]
    const best = list => list.reduce((a, hz) => (level(hz) > level(a) ? hz : a))
    const lo = best(LOW), hi = best(HIGH)
    if (level(lo) < -45 || level(hi) < -45) return null
    return KEYS[LOW.indexOf(lo)][HIGH.indexOf(hi)]
  }

  async function dial(number, gap = 90, hold = 140) {
    for (const k of number) {
      press(k)
      await new Promise(r => setTimeout(r, hold))
      release()
      await new Promise(r => setTimeout(r, gap))
    }
  }

  // schedules the whole signal on the audio clock, so on and off times hold even if the page is busy
  function signal(name) {
    const s = SIGNALS[name]
    if (!s) return 0
    release()
    ctx.resume()
    let t = ctx.currentTime + 0.02
    for (const [freqs, on, off] of s.steps) {
      const env = ctx.createGain()
      env.gain.setValueAtTime(0, t)
      env.gain.linearRampToValueAtTime(1, t + 0.008)
      env.gain.setValueAtTime(1, t + on / 1000 - 0.008)
      env.gain.linearRampToValueAtTime(0, t + on / 1000)
      let sink = env
      if (s.am) {
        const trem = ctx.createGain()
        trem.gain.value = 0.5
        const lfo = ctx.createOscillator()
        lfo.frequency.value = s.am
        const depth = ctx.createGain()
        depth.gain.value = 0.5
        lfo.connect(depth).connect(trem.gain)
        lfo.start(t)
        lfo.stop(t + on / 1000)
        trem.connect(env)
        sink = trem
      }
      env.connect(out)
      for (const hz of freqs) {
        const o = ctx.createOscillator()
        o.frequency.value = hz
        o.connect(sink)
        o.start(t)
        o.stop(t + on / 1000 + 0.02)
      }
      t += (on + off) / 1000
    }
    return (t - ctx.currentTime) * 1000
  }

  return { press, release, decode, dial, signal, analyser, ctx }
}
