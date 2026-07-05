import type { Locale } from '../i18n'

// ── Shared editorial schemas ───────────────────────────────────────────

export type EditorialMeta = Record<string, string>

export interface EditorialEntry {
  sourcePath: string
  slug: string
  title: string
  date: string
  locale: Locale
  published: boolean
}

// ── Validation primitives ─────────────────────────────────────────────

export type ValidationError = {
  file: string
  field: string
  message: string
}

export function validateRequired(
  meta: EditorialMeta,
  field: string,
  file: string,
): ValidationError | null {
  if (!meta[field] || String(meta[field]).trim() === '') {
    return { file, field, message: `Missing required field "${field}"` }
  }
  return null
}

export function validateLocale(
  meta: EditorialMeta,
  file: string,
): ValidationError | null {
  const locale = meta.locale
  if (!locale) return null // locale is optional at schema level; defaults to pt-BR
  if (locale !== 'pt-BR' && locale !== 'en') {
    return { file, field: 'locale', message: `Unsupported locale "${locale}". Expected "pt-BR" or "en".` }
  }
  return null
}

export function validateDate(
  meta: EditorialMeta,
  file: string,
): ValidationError | null {
  const date = meta.date
  if (!date) return null // required field check handles this
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { file, field: 'date', message: `Invalid date format "${date}". Expected YYYY-MM-DD.` }
  }
  if (Number.isNaN(Date.parse(`${date}T12:00:00`))) {
    return { file, field: 'date', message: `Invalid date "${date}".` }
  }
  return null
}

export function validatePublished(
  meta: EditorialMeta,
  file: string,
): ValidationError | null {
  const published = meta.published
  if (published === undefined || published === null) {
    return { file, field: 'published', message: 'Missing required field "published"' }
  }
  if (published !== 'true' && published !== 'false') {
    return { file, field: 'published', message: `Invalid published value "${published}". Expected "true" or "false".` }
  }
  return null
}

export function parseLocale(rawLocale?: string): Locale {
  if (rawLocale === 'en') return 'en'
  return 'pt-BR'
}

export function parsePublished(rawPublished?: string): boolean {
  return rawPublished !== 'false'
}

// ── Translation validation ────────────────────────────────────────────

export interface TranslationCheck {
  sourceFiles: string[]
  errors: ValidationError[]
}

/**
 * Validates that two entries sharing a translationKey have consistent
 * invariant metadata (slug, translationKey, date, cover, author, published).
 */
export function validateTranslationPair(
  entryA: EditorialMeta & { sourcePath: string },
  entryB: EditorialMeta & { sourcePath: string },
): ValidationError[] {
  const errors: ValidationError[] = []

  const invariants = ['slug', 'translationKey', 'date', 'cover', 'author'] as const
  for (const field of invariants) {
    if (String(entryA[field]) !== String(entryB[field])) {
      errors.push({
        file: `${entryA.sourcePath} ↔ ${entryB.sourcePath}`,
        field,
        message: `Inconsistent "${field}" across translation pair: "${entryA[field]}" vs "${entryB[field]}"`,
      })
    }
  }

  // published must be in the same review state
  if (String(entryA.published) !== String(entryB.published)) {
    errors.push({
      file: `${entryA.sourcePath} ↔ ${entryB.sourcePath}`,
      field: 'published',
      message: 'Translation pair must share the same published state',
    })
  }

  return errors
}

// ── Ordering contract ──────────────────────────────────────────────────

/**
 * Default editorial ordering: reverse chronological by date.
 * Tie-break: slug alphabetically for deterministic sort.
 */
export function editorialSort<T extends EditorialEntry>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date)
    if (dateCmp !== 0) return dateCmp
    return a.slug.localeCompare(b.slug)
  })
}
