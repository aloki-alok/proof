// Loads every page in real browsers and fails on errors, sideways scroll, or a broken core flow.
// usage: node scripts/check-pages.mjs [base url] [screenshot dir]
import { chromium, firefox, webkit } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'

const base = process.argv[2] || 'http://localhost:4747'
const shots = process.argv[3]
if (shots) mkdirSync(shots, { recursive: true })
// set PW_CHROMIUM / PW_FIREFOX / PW_WEBKIT to reuse browsers already on disk
const engines = { chromium: [chromium, process.env.PW_CHROMIUM], firefox: [firefox, process.env.PW_FIREFOX], webkit: [webkit, process.env.PW_WEBKIT] }
// the docs sidebar lists every guide and library page, so a new library is checked without editing this file
const side = await (await fetch(base + '/docs')).text()
const docs = [...new Set([...side.matchAll(/href="(\/docs[^"#]*)"/g)].map(m => m[1]))]
const pages = ['/', ...docs, '/changelog', '/nope']
const libs = docs.filter(d => d.split('/').length === 3 && d !== '/docs/install').map(d => d.split('/')[2])
const fails = []
const check = (ok, what) => { if (!ok) fails.push(what) }

async function visit(browser, name, path, width, scheme) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme })
  const p = await ctx.newPage()
  const errs = []
  p.on('pageerror', e => errs.push(String(e)))
  // the 404 route logs its own 404; anywhere else, and for any asset, a failed load is an error
  p.on('console', m => { if (m.type() === 'error' && !(path === '/nope' && /404/.test(m.text()))) errs.push(m.text()) })
  p.on('response', r => { if (r.status() >= 400 && r.url() !== base + path) errs.push(`${r.status()} ${r.url()}`) })
  const res = await p.goto(base + path, { waitUntil: 'networkidle' })
  await p.waitForTimeout(500)
  const tag = `${name} ${path} ${width} ${scheme}`
  check(path === '/nope' ? res.status() === 404 : res.ok(), `${tag}: status ${res.status()}`)
  check(errs.length === 0, `${tag}: errors ${JSON.stringify(errs)}`)
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  check(over <= 0, `${tag}: scrolls sideways by ${over}px`)
  if (shots) await p.screenshot({ path: `${shots}/${name}${path.replace(/\//g, '_') || '_'}-${width}-${scheme}.png`, fullPage: true })
  await ctx.close()
}

async function flows(browser, name) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const p = await ctx.newPage()
  // a missing element reads as null and fails its check instead of stopping the run
  const attr = (sel, name) => p.getAttribute(sel, name, { timeout: 1500 }).catch(() => null)

  // dial: holding 8 names both of its tones
  await p.goto(base + '/docs/dial', { waitUntil: 'networkidle' })
  const key = p.locator('[data-demo=dial] .bk[aria-label^="8:"]')
  await key.scrollIntoViewIfNeeded()
  const box = await key.boundingBox()
  await p.mouse.move(box.x + 10, box.y + 10)
  await p.mouse.down()
  await p.waitForTimeout(300)
  const say = await p.textContent('[data-demo=dial] .b-say')
  await p.mouse.up()
  check(say.includes('852 Hz') && say.includes('1336 Hz'), `${name} dial: said "${say}"`)

  // dial: a key held from the keyboard lets go when focus leaves it, so no tone gets stuck
  await key.focus()
  const cls = async () => (await attr('[data-demo=dial] .bk[aria-label^="8:"]', 'class')) || ''
  await p.keyboard.down('Enter')
  check((await cls()).split(' ').includes('on'), `${name} dial: Enter did not press the key`)
  await p.keyboard.press('Tab')
  check(!(await cls()).split(' ').includes('on'), `${name} dial: key stayed down after focus left`)
  await p.keyboard.up('Enter')

  // search: ⌘K opens it, an API name finds its page, arrows move, Enter lands there
  const k = process.platform === 'darwin' ? 'Meta+k' : 'Control+k'
  await p.keyboard.press(k)
  await p.keyboard.type('zzqq')
  check(await p.isVisible('[data-search] .empty'), `${name} search: no empty state for a miss`)
  await p.fill('[data-search] input', 'waterfall')
  const hit = await attr('[data-search] [aria-selected=true]', 'href')
  check(hit === '/docs/dial', `${name} search: "waterfall" picked ${hit}`)
  await p.fill('[data-search] input', 'read')
  const first = await attr('[data-search] [aria-selected=true]', 'id')
  await p.keyboard.press('ArrowDown')
  await p.keyboard.press('ArrowUp')
  check(!!first && await attr('[data-search] input', 'aria-activedescendant') === first, `${name} search: arrows did not return to the first hit`)
  await p.keyboard.press('Enter')
  await p.waitForURL('**/docs/readback**', { timeout: 3000 }).catch(() => {})
  check(p.url().includes('/docs/readback'), `${name} search: ended on ${p.url()}`)

  // install command shows this host, not a placeholder
  const cmd = await p.textContent('[data-curl]')
  check(cmd === `curl -O ${base}/r/readback.js`, `${name} install command: "${cmd}"`)

  // download buttons save the bare file name
  const dl = await attr('.code-act[download]', 'download')
  check(dl === 'readback.js', `${name} download saves as "${dl}"`)

  // readback: gaps inside text blocks count, and an image alt names its link
  const lines = await p.evaluate(async () => {
    const { read } = await import('/r/readback.js')
    const box = document.createElement('div')
    box.innerHTML = '<p>See <a href="/y"></a></p><h2><button></button></h2><a href="/z"><img src="/img/sample.svg" alt="Logo"></a><a href="/w"><img src="/img/sample.svg" alt="x" aria-hidden="true"></a>'
    document.body.append(box)
    const out = read(box).map(l => `${l.tag}${l.gap ? ' gap' : ''}`)
    box.remove()
    return out
  })
  check(lines.join() === 'p,a gap,h2,button gap,a,a gap', `${name} readback lines: ${lines}`)

  // theme toggle flips the page colour and survives a reload
  const bg = () => p.evaluate(() => getComputedStyle(document.body).backgroundColor)
  const before = await bg()
  await p.click('[data-theme-toggle]')
  const after = await bg()
  check(before !== after, `${name} theme toggle did not change the page colour`)
  await p.reload({ waitUntil: 'networkidle' })
  check(await bg() === after, `${name} theme did not persist`)

  // ascii: changing the word must not start another animation loop
  await p.goto(base + '/docs/ascii', { waitUntil: 'networkidle' })
  // calls per frame, minus this probe's own chain, is how many loops the page runs
  const loops = () => p.evaluate(() => new Promise(done => {
    let n = 0, frames = 0, on = true
    const raf = window.requestAnimationFrame
    window.requestAnimationFrame = cb => { n++; return raf(cb) }
    const count = () => { frames++; if (on) requestAnimationFrame(count) }
    requestAnimationFrame(count)
    setTimeout(() => { on = false; window.requestAnimationFrame = raf; done(Math.round(n / frames) - 1) }, 1000)
  }))
  const loopsBefore = await loops()
  await p.locator('[data-demo=ascii] input[type=text]').pressSequentially('abcdefgh')
  const loopsAfter = await loops()
  check(loopsBefore === 1 && loopsAfter === 1, `${name} ascii: ${loopsBefore} animation loops before typing, ${loopsAfter} after`)
  await ctx.close()
}

for (const [name, [type, exe]] of Object.entries(engines)) {
  const browser = await type.launch(exe ? { executablePath: exe } : {})
  if (name === 'chromium') {
    for (const path of pages) {
      await visit(browser, name, path, 1360, 'light')
      await visit(browser, name, path, 390, 'dark')
    }
  } else {
    for (const path of ['/', '/docs/dial', '/docs/reed']) await visit(browser, name, path, 390, 'light')
  }
  await flows(browser, name)
  await browser.close()
}

// every download route serves the exact library file
for (const f of [...libs, 'dial-scope']) {
  const body = await (await fetch(`${base}/r/${f}.js`)).text()
  check(body === readFileSync(new URL(`../src/lib/${f}.js`, import.meta.url), 'utf8'), `/r/${f}.js differs from src/lib/${f}.js`)
}

check(pages.length >= 10 && libs.length >= 6, `found only ${pages.length} pages and ${libs.length} libraries`)
console.log(fails.length ? `FAIL ${fails.length}\n- ${fails.join('\n- ')}` : 'PASS all pages and flows')
process.exit(fails.length ? 1 : 0)
