import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://proof.local',
  trailingSlash: 'ignore',
  server: { port: 4747 },
  markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } } },
})
