// Renders the landing hero into public/og.png, the image link previews show.
// usage: node scripts/make-og.mjs [base url]   (needs the site running, like check-pages)
import { chromium } from 'playwright'

const base = process.argv[2] || 'http://localhost:4747'
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {})
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, colorScheme: 'dark', deviceScaleFactor: 1 })
await page.goto(base, { waitUntil: 'networkidle' })
// the share card is the hero alone, so the bar, the buttons and the table are hidden
await page.addStyleTag({ content: '.top, .ctas, .index-table, .lede, .sec, .howto, .foot { display: none !important } .hero { padding: 56px 56px 0 }' })
await page.waitForTimeout(800)
await page.screenshot({ path: new URL('../public/og.png', import.meta.url).pathname })
await browser.close()
