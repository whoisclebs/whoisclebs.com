import type { Locale } from '../i18n'
import type { ValidationError } from './schema'
import {
  parseLocale,
  parsePublished,
  validateDate,
  validateLocale,
  validateRequired,
} from './schema'
import { parseMarkdownBlocks, type MarkdownBlock, parseFrontmatter as parseEditorialFrontmatter } from './posts'

// ── TIL-specific types ─────────────────────────────────────────────────

export interface TilEntry {
  sourcePath: string
  slug: string
  title: string
  kicker: string
  date: string
  excerpt: string
  locale: Locale
  published: boolean
  blocks: MarkdownBlock[]
}

export interface TilMeta {
  sourcePath: string
  slug: string
  title: string
  kicker: string
  date: string
  excerpt: string
  locale: Locale
  published: boolean
}

// ── TIL schema validation ─────────────────────────────────────────────

const TIL_REQUIRED_FIELDS = [
  'slug',
  'title',
  'kicker',
  'date',
  'excerpt',
  'published',
] as const

export function validateTilMeta(
  meta: Record<string, string>,
  file: string,
): ValidationError[] {
  const errors: ValidationError[] = []

  for (const field of TIL_REQUIRED_FIELDS) {
    const err = validateRequired(meta, field, file)
    if (err) errors.push(err)
  }

  const localeErr = validateLocale(meta, file)
  if (localeErr) errors.push(localeErr)

  const dateErr = validateDate(meta, file)
  if (dateErr) errors.push(dateErr)

  return errors
}

// ── TIL parsing ────────────────────────────────────────────────────────

export function parseTilMeta(
  meta: Record<string, string>,
  sourcePath: string,
): TilMeta {
  return {
    sourcePath,
    slug: meta.slug,
    title: meta.title,
    kicker: meta.kicker,
    date: meta.date,
    excerpt: meta.excerpt,
    locale: parseLocale(meta.locale),
    published: parsePublished(meta.published),
  }
}

export function parseTil(
  sourcePath: string,
  raw: string,
): TilEntry {
  const { metadata, body } = parseEditorialFrontmatter(raw)
  const meta = parseTilMeta(metadata, sourcePath)

  return {
    ...meta,
    blocks: parseMarkdownBlocks(body),
  }
}

// ── TIL collection ─────────────────────────────────────────────────────

export function loadTilCollection(
  sources: { path: string; raw: string }[],
  options?: { validate?: boolean },
): TilEntry[] {
  const entries = sources.map(({ path, raw }) => parseTil(path, raw))

  if (options?.validate) {
    const errors: ValidationError[] = []
    for (const source of sources) {
      const { metadata } = parseEditorialFrontmatter(source.raw)
      errors.push(...validateTilMeta(metadata, source.path))
    }
    if (errors.length > 0) {
      const message = errors
        .map((e) => `  ${e.file}: [${e.field}] ${e.message}`)
        .join('\n')
      throw new Error(`TIL validation failed:\n${message}`)
    }
  }

  return entries
}

// ── Ordering ───────────────────────────────────────────────────────────

export function sortTilEntries<T extends { date: string; slug: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date)
    if (dateCmp !== 0) return dateCmp
    return a.slug.localeCompare(b.slug)
  })
}
