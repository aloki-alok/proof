// every internal link goes through to(), so the site works at the root and under a sub-path such as GitHub Pages' /proof
export const to = path => import.meta.env.BASE_URL.replace(/\/$/, '') + path
export const home = new URL(to('/'), import.meta.env.SITE).href
