import { markdownTilSources } from '@/content/til'
import type { Locale } from './i18n'
import {
  parseTil,
  sortTilEntries,
  type TilEntry,
} from './editorial/til'
import type { MarkdownBlock } from './markdown'

// ── Re-exports ─────────────────────────────────────────────────────────

export type { TilEntry }
export type { MarkdownBlock }
export type TilBlock = MarkdownBlock

// ── Collection ─────────────────────────────────────────────────────────

const tilEntries = markdownTilSources.map(({ path, raw }) => parseTil(path, raw))

// ── Queries ────────────────────────────────────────────────────────────

function filterLocalizedEntries(entries: TilEntry[], locale?: Locale): TilEntry[] {
  if (!locale) return entries
  const localized = entries.filter((entry) => entry.locale === locale)
  return localized.length > 0 ? localized : entries.filter((entry) => entry.locale === 'pt-BR')
}

export function getPublishedTilEntries(locale: Locale = 'pt-BR'): TilEntry[] {
  const published = tilEntries.filter((entry) => entry.published)

  return sortTilEntries(filterLocalizedEntries(published, locale))
}

export function getTilBySlug(slug: string, locale: Locale = 'pt-BR'): TilEntry | undefined {
  return getPublishedTilEntries(locale).find((entry) => entry.slug === slug)
    ?? tilEntries.find((entry) => entry.published && entry.slug === slug)
}
