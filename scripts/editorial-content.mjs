/**
 * scripts/editorial-content.mjs
 *
 * Shared editorial content loader for build scripts (RSS, prerender, etc.).
 * Reads posts and TIL entries from disk with the same frontmatter parsing
 * used by editorial validation, removing duplicated parsing from each script.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const POSTS_DIR = 'src/content/posts'
const TIL_DIR = 'src/content/til'
const SITE_URL = 'https://whoisclebs.com'

// ── Frontmatter parsing (shared, single implementation) ───────────────

export function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) throw new Error('Markdown must start with frontmatter')
  const [, frontmatterRaw, body] = match
  const entries = frontmatterRaw.split(/\r?\n/).map((line) => {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) return null
    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    return [key, value]
  }).filter(Boolean)
  return { metadata: Object.fromEntries(entries), body }
}

// ── File collection ───────────────────────────────────────────────────

function collectMarkdownFiles(dir) {
  const files = []
  const items = readdirSync(dir)

  for (const item of items) {
    const fullPath = join(dir, item)
    if (statSync(fullPath).isDirectory()) {
      const nested = readdirSync(fullPath)
        .filter(f => f.endsWith('.md'))
        .map(f => join(fullPath, f))
      files.push(...nested)
    } else if (item.endsWith('.md')) {
      files.push(fullPath)
    }
  }

  return files
}

// ── Post collection ───────────────────────────────────────────────────

export function getPublishedPosts() {
  const files = collectMarkdownFiles(POSTS_DIR)
  const ptPosts = []
  const enPosts = []

  for (const file of files) {
    const raw = readFileSync(file, 'utf8')
    const { metadata } = parseFrontmatter(raw)

    if (metadata.published !== 'true') continue

    const entry = {
      slug: metadata.slug,
      title: metadata.title,
      excerpt: metadata.excerpt || '',
      date: metadata.date,
      cover: metadata.cover,
      author: metadata.author,
      readingTime: metadata.readingTime,
      url: null, // filled later
    }

    const locale = metadata.locale === 'en' ? 'en' : 'pt-BR'
    const urlPrefix = locale === 'en' ? '/en/blog' : '/blog'
    entry.url = `${SITE_URL}${urlPrefix}/${entry.slug}/`

    if (locale === 'en') {
      enPosts.push(entry)
    } else {
      ptPosts.push(entry)
    }
  }

  // Editorial ordering: reverse chronological, slug tie-break
  const sortFn = (a, b) => {
    const dateCmp = b.date.localeCompare(a.date)
    if (dateCmp !== 0) return dateCmp
    return a.slug.localeCompare(b.slug)
  }

  ptPosts.sort(sortFn)
  enPosts.sort(sortFn)

  return { ptPosts, enPosts }
}

// ── TIL collection ────────────────────────────────────────────────────

export function getPublishedTilEntries() {
  const files = readdirSync(TIL_DIR).filter(f => f.endsWith('.md'))
  const entries = []

  for (const file of files) {
    const raw = readFileSync(join(TIL_DIR, file), 'utf8')
    const { metadata } = parseFrontmatter(raw)

    if (metadata.published !== 'true') continue

    entries.push({
      slug: metadata.slug,
      title: metadata.title,
      excerpt: metadata.excerpt || '',
      date: metadata.date,
      url: `${SITE_URL}/til/${metadata.slug}/`,
    })
  }

  entries.sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date)
    if (dateCmp !== 0) return dateCmp
    return a.slug.localeCompare(b.slug)
  })

  return entries
}

// ── Shared escape helpers ─────────────────────────────────────────────

export function escapeXml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export const siteUrl = SITE_URL
export const siteName = 'Clebson Augusto'
