// Captures each library's live demo into .github/assets for the README.
// usage: node scripts/make-readme-shots.mjs [base url]   (needs the site running, like check-pages)
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const base = process.argv[2] || 'http://localhost:4747'
const out = new URL('../.github/assets/', import.meta.url).pathname
mkdirSync(out, { recursive: true })

// each demo is put into the state that shows what the library does
const setup = {
  dial: async p => {
    const key = p.locator('[data-demo=dial] .bk[aria-label^="8:"]')
    const box = await key.boundingBox()
    await p.mouse.move(box.x + 10, box.y + 10)
    await p.mouse.down()
    await p.waitForTimeout(400)
  },
  readback: p => p.evaluate(() => {
    const r = document.querySelector('[data-demo=readback] input[type=range]')
    r.value = '3'
    r.dispatchEvent(new Event('input'))
  }),
  ascii: async p => {
    const box = await p.locator('[data-demo=ascii] .ascii-demo').boundingBox()
    await p.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.5)
    await p.waitForTimeout(500)
  },
}

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {})
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, colorScheme: 'dark', deviceScaleFactor: 1 })
for (const lib of ['ink', 'riso', 'dial', 'readback', 'reed', 'ascii']) {
  await page.goto(base, { waitUntil: 'networkidle' })
  // the landing page shows each demo at full width, which reads better than the docs column
  const sheet = page.locator(`#${lib} [data-demo]`)
  await sheet.scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)
  await setup[lib]?.(page)
  await page.waitForTimeout(700)
  // page coordinates plus a margin, so controls at the demo's edge are not cut off
  const r = await sheet.evaluate(el => { const b = el.getBoundingClientRect(); return { x: b.x + scrollX, y: b.y + scrollY, width: b.width, height: b.height } })
  await page.screenshot({ path: `${out}${lib}.png`, fullPage: true, clip: { x: r.x - 32, y: r.y - 32, width: r.width + 64, height: r.height + 64 } })
  await page.mouse.up()
}
await browser.close()
