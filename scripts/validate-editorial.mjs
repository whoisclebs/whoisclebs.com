/**
 * scripts/validate-editorial.mjs
 *
 * Editorial content validation — checks frontmatter rules, locale conventions,
 * translation pairing, and ordering metadata across all posts and TIL entries.
 *
 * Usage: node scripts/validate-editorial.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parseFrontmatter } from './editorial-content.mjs'

const POSTS_DIR = 'src/content/posts'
const TIL_DIR = 'src/content/til'

// ── Helpers ────────────────────────────────────────────────────────────

function has(field) {
  return field !== undefined && field !== null && String(field).trim() !== ''
}

function collectErrors(errors, file) {
  return function pushError(field, message) {
    errors.push({ file, field, message })
  }
}

// ── Post validation ────────────────────────────────────────────────────

const POST_REQUIRED = [
  'slug', 'title', 'kicker', 'date', 'readingTime',
  'author', 'excerpt', 'cover', 'coverAlt', 'published',
]

function validatePost(meta, file) {
  const errors = []
  const e = collectErrors(errors, file)

  for (const field of POST_REQUIRED) {
    if (!has(meta[field])) {
      e(field, `Missing required field "${field}"`)
    }
  }

  if (meta.locale && meta.locale !== 'pt-BR' && meta.locale !== 'en') {
    e('locale', `Unsupported locale "${meta.locale}". Expected "pt-BR" or "en".`)
  }

  if (meta.date && !/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) {
    e('date', `Invalid date format "${meta.date}". Expected YYYY-MM-DD.`)
  } else if (meta.date && Number.isNaN(Date.parse(`${meta.date}T12:00:00`))) {
    e('date', `Invalid date "${meta.date}".`)
  }

  if (meta.published && meta.published !== 'true' && meta.published !== 'false') {
    e('published', `Invalid published value "${meta.published}". Expected "true" or "false".`)
  }

  return errors
}

// ── TIL validation ─────────────────────────────────────────────────────

const TIL_REQUIRED = ['slug', 'title', 'kicker', 'date', 'excerpt', 'published']

function validateTil(meta, file) {
  const errors = []
  const e = collectErrors(errors, file)

  for (const field of TIL_REQUIRED) {
    if (!has(meta[field])) {
      e(field, `Missing required field "${field}"`)
    }
  }

  if (meta.locale && meta.locale !== 'pt-BR' && meta.locale !== 'en') {
    e('locale', `Unsupported locale "${meta.locale}". Expected "pt-BR" or "en".`)
  }

  if (meta.date && !/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) {
    e('date', `Invalid date format "${meta.date}". Expected YYYY-MM-DD.`)
  } else if (meta.date && Number.isNaN(Date.parse(`${meta.date}T12:00:00`))) {
    e('date', `Invalid date "${meta.date}".`)
  }

  if (meta.published && meta.published !== 'true' && meta.published !== 'false') {
    e('published', `Invalid published value "${meta.published}". Expected "true" or "false".`)
  }

  return errors
}

// ── Translation pair validation ────────────────────────────────────────

function validateTranslationPairs(postEntries) {
  const errors = []
  const invariants = ['slug', 'translationKey', 'date', 'cover', 'author']
  const byKey = new Map()

  for (const { meta, file } of postEntries) {
    if (meta.locale === 'en' || meta.locale === 'pt-BR') {
      const key = meta.translationKey || meta.slug
      if (!byKey.has(key)) byKey.set(key, [])
      byKey.get(key).push({ meta, file })
    }
  }

  for (const [, entries] of byKey) {
    if (entries.length < 2) continue
    const pt = entries.find(e => e.meta.locale !== 'en')
    const en = entries.find(e => e.meta.locale === 'en')
    if (!pt || !en) continue

    for (const field of invariants) {
      if (String(pt.meta[field]) !== String(en.meta[field])) {
        errors.push({
          file: `${pt.file} ↔ ${en.file}`,
          field,
          message: `Inconsistent "${field}" across translation pair: "${pt.meta[field]}" vs "${en.meta[field]}"`,
        })
      }
    }

    if (String(pt.meta.published) !== String(en.meta.published)) {
      errors.push({
        file: `${pt.file} ↔ ${en.file}`,
        field: 'published',
        message: 'Translation pair must share the same published state',
      })
    }
  }

  return errors
}

// ── Locale presence check ──────────────────────────────────────────────

function validateLocalePresence(postEntries) {
  const errors = []

  for (const { meta, file } of postEntries) {
    if (!meta.locale) {
      errors.push({
        file,
        field: 'locale',
        message: 'Missing explicit locale field. Add "locale: pt-BR" or "locale: en".',
      })
    }
  }

  return errors
}

// ── Main ───────────────────────────────────────────────────────────────

function collectDirectoryEntries(dir, depth = 0) {
  const entries = []
  const items = readdirSync(dir)

  for (const item of items) {
    const fullPath = join(dir, item)
    if (statSync(fullPath).isDirectory() && depth < 2) {
      entries.push(...collectDirectoryEntries(fullPath, depth + 1))
    } else if (item.endsWith('.md')) {
      const raw = readFileSync(fullPath, 'utf8')
      const { metadata: meta } = parseFrontmatter(raw)
      entries.push({ meta, file: fullPath })
    }
  }

  return entries
}

function main() {
  let totalErrors = 0

  // ── Validate posts ──────────────────────────────────────────────────
  const postDirItems = collectDirectoryEntries(POSTS_DIR)
  const postErrors = []

  for (const { meta, file } of postDirItems) {
    postErrors.push(...validatePost(meta, file))
  }

  // Locale presence
  postErrors.push(...validateLocalePresence(postDirItems))

  // Translation pairing
  postErrors.push(...validateTranslationPairs(postDirItems))

  if (postErrors.length > 0) {
    console.error(`\n❌ Post validation errors (${postErrors.length}):`)
    for (const { file, field, message } of postErrors) {
      console.error(`  ${file}: [${field}] ${message}`)
    }
    totalErrors += postErrors.length
  } else {
    console.log(`✓ Posts (${postDirItems.length} files) — all valid`)
  }

  // ── Validate TIL ────────────────────────────────────────────────────
  const tilItems = readdirSync(TIL_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const raw = readFileSync(join(TIL_DIR, f), 'utf8')
      const { metadata: meta } = parseFrontmatter(raw)
      return { meta, file: join(TIL_DIR, f) }
    })

  const tilErrors = []
  for (const { meta, file } of tilItems) {
    tilErrors.push(...validateTil(meta, file))
  }

  if (tilErrors.length > 0) {
    console.error(`\n❌ TIL validation errors (${tilErrors.length}):`)
    for (const { file, field, message } of tilErrors) {
      console.error(`  ${file}: [${field}] ${message}`)
    }
    totalErrors += tilErrors.length
  } else {
    console.log(`✓ TIL entries (${tilItems.length} files) — all valid`)
  }

  // ── Summary ──────────────────────────────────────────────────────────
  console.log(`\n${totalErrors === 0 ? '✓ All editorial content valid.' : `❌ ${totalErrors} validation error(s) found.`}`)

  process.exit(totalErrors > 0 ? 1 : 0)
}

main()
