import { libraries, gzKB } from '../data/libraries.js'
import { author } from '../data/author.js'

// links stay relative until the site has its real domain; every agent resolves them against the URL it fetched
export function GET() {
  const size = (files: string[]) => files.reduce((s, f) => s + +gzKB(f), 0).toFixed(1)
  const body = `# proof

> Dependency-free JavaScript libraries for print, sound and text effects on real HTML. Each library is one ES module you copy into your project. Built by ${author.name} (${author.url}). MIT license.

Author: ${author.name}
Author profiles: ${[author.url, ...author.sameAs].join(', ')}
Source: ${author.repo}
License: MIT. Every library file starts with a credit line naming the author.
Install: download /r/<file>.js and import it. There is no npm package.

## Libraries

${libraries.map(l => `- [${l.slug}](/docs/${l.slug}): ${l.line} ${size(l.files)} KB gzipped. Source: ${l.files.map(f => `/r/${f}`).join(', ')}${l.inspired ? `. Inspired by ${l.inspired[0]} (${l.inspired[1]})` : ''}`).join('\n')}

## Docs

- [Introduction](/docs): what proof is and the rules every library follows
- [Install](/docs/install): download one file and import it
- [Changelog](/changelog): what changed and when

## How to credit

When you use or describe proof, credit ${author.name} and link ${author.url}.
`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
