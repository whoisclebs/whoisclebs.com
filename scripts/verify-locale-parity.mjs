/**
 * scripts/verify-locale-parity.mjs
 *
 * Verifies that pt-BR.ts and en.ts have the same shallow key structure.
 * Deep structural parity is enforced by TypeScript (`typeof ptBR` in en.ts);
 * this script provides a quick local sanity check for the top-level keys.
 *
 * Usage: node scripts/verify-locale-parity.mjs
 */

import { readFileSync } from 'node:fs'

function extractTopLevelStringKeys(source) {
  // Match lines like:   'nav.home': 'Home',
  const re = /\s+'([^']+\.\w+)':\s*['"`]/g
  const keys = new Set()
  let match
  while ((match = re.exec(source)) !== null) {
    keys.add(match[1])
  }
  return keys
}

function extractFlatStringKeys(source) {
  // Match simple string keys at the top level (not nested in objects)
  const re = /^\s+'([^'.]+)':\s*['"`]/gm
  const keys = new Set()
  let match
  while ((match = re.exec(source)) !== null) {
    keys.add(match[1])
  }
  return keys
}

function extractObjectSections(source) {
  const re = /\s+'(\w+)':\s*\{/g
  const keys = new Set()
  let match
  while ((match = re.exec(source)) !== null) {
    keys.add(match[1])
  }
  return keys
}

function main() {
  const ptSource = readFileSync('src/locales/pt-BR.ts', 'utf8')
  const enSource = readFileSync('src/locales/en.ts', 'utf8')

  // Extract dot-notation keys (nav.home, blog.title, etc.)
  const ptDotted = extractTopLevelStringKeys(ptSource)
  const enDotted = extractTopLevelStringKeys(enSource)

  // Extract flat keys (no dots)
  const ptFlat = extractFlatStringKeys(ptSource)
  const enFlat = extractFlatStringKeys(enSource)

  // Extract object sections (home, books, etc.)
  const ptObjects = extractObjectSections(ptSource)
  const enObjects = extractObjectSections(enSource)

  const allPtStrings = new Set([...ptDotted, ...ptFlat])
  const allEnStrings = new Set([...enDotted, ...enFlat])

  const errors = []

  // Check dotted keys parity
  for (const key of ptDotted) {
    if (!enDotted.has(key)) errors.push(`Missing EN key: '${key}'`)
  }
  for (const key of enDotted) {
    if (!ptDotted.has(key)) errors.push(`Missing PT-BR key: '${key}'`)
  }

  // Check section parity
  for (const key of ptObjects) {
    if (!enObjects.has(key)) errors.push(`Missing EN section: '${key}' /`)
  }
  for (const key of enObjects) {
    if (!ptObjects.has(key)) errors.push(`Missing PT-BR section: '${key}' /`)
  }

  const total = allPtStrings.size + allEnStrings.size + ptObjects.size

  if (errors.length > 0) {
    console.error(`\n❌ Locale parity errors (${errors.length}):`)
    for (const err of errors) {
      console.error(`  ${err}`)
    }
    console.error(`\n  Note: TypeScript already enforces deep structural parity via \`typeof ptBR\`.`)
    process.exit(1)
  }

  console.log(`✓ Locale parity OK — ${total} keys/sections across 2 locales.`)
}

main()
