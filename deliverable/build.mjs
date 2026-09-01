// Builds the self-contained deliverable.
//
//   node deliverable/build.mjs
//
// Reads deliverable/source.html, replaces every `data-shot="key"` marker with a
// base64 data: URI of the matching screenshot, and writes ../deliverable.html.
//
// Inlining rather than linking matters here: the output has to open straight
// from disk with no server, and print to PDF with the images intact.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))

const SHOTS = {
  tree:      '01-project-tree.png',
  goals:     '02-goals-checklist.png',
  generator: '03-generator-evaluate.png',
  buildlog:  '04-build-log.png',
  app:       '05-app-ranking.png',
  detail:    '06-app-breakdown.png',
  tests:     '07-tests-passing.png',
  compare:   '08-problem-comparison.png',
}

let html = readFileSync(join(HERE, 'source.html'), 'utf8')
let inlined = 0
let bytes = 0

for (const [key, file] of Object.entries(SHOTS)) {
  const marker = `data-shot="${key}"`
  if (!html.includes(marker)) {
    console.warn(`  ! marker ${marker} not found in source.html — skipped`)
    continue
  }
  const raw = readFileSync(join(HERE, 'screenshots', file))
  bytes += raw.length
  html = html.replace(marker, `src="data:image/png;base64,${raw.toString('base64')}"`)
  inlined++
  console.log(`  + ${key.padEnd(10)} <- ${file} (${Math.round(raw.length / 1024)} KB)`)
}

// Any marker left unreplaced would render as a broken image; make that loud.
const leftover = [...html.matchAll(/data-shot="([^"]+)"/g)].map((m) => m[1])
if (leftover.length) console.warn(`  ! unreplaced markers: ${leftover.join(', ')}`)

const out = join(HERE, '..', 'deliverable.html')
writeFileSync(out, html, 'utf8')

console.log(
  `\n  ${inlined} image(s) inlined, ${Math.round(bytes / 1024)} KB source -> ` +
    `${Math.round(Buffer.byteLength(html) / 1024)} KB output`,
)
console.log(`  wrote ${out}`)
