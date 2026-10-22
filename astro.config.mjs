import { defineConfig } from 'astro/config'

export default defineConfig({
  // the GitHub Pages preview builds with SITE and BASE_PATH set; local builds serve from the root
  site: process.env.SITE || 'https://proof.local',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  server: { port: 4747 },
  markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } } },
})
