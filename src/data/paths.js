// every internal link goes through to(), so the site works at the root and under a sub-path such as GitHub Pages' /proof
// page routes get a trailing slash because static hosts such as GitHub Pages redirect /docs to /docs/; files keep their name
export const to = path => import.meta.env.BASE_URL.replace(/\/$/, '') + (/(\.\w+|\/)$/.test(path) || path.includes('#') ? path : path + '/')
export const home = new URL(to('/'), import.meta.env.SITE).href
