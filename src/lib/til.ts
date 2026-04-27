import { markdownTilSources } from '@/content/til'
import { parseFrontmatter, parseMarkdownBlocks, type MarkdownBlock } from './markdown'
import type { Locale } from './i18n'

export type TilEntry = {
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

function parseTil(sourcePath: string, raw: string): TilEntry {
  const { metadata, body } = parseFrontmatter(raw)

  return {
    sourcePath,
    slug: metadata.slug,
    title: metadata.title,
    kicker: metadata.kicker,
    date: metadata.date,
    excerpt: metadata.excerpt,
    locale: metadata.locale === 'en' ? 'en' : 'pt-BR',
    published: metadata.published !== 'false',
    blocks: parseMarkdownBlocks(body),
  }
}

const tilEntries = markdownTilSources.map(({ path, raw }) => parseTil(path, raw))

function filterLocalizedEntries(entries: TilEntry[], locale?: Locale): TilEntry[] {
  if (!locale) return entries
  const localized = entries.filter((entry) => entry.locale === locale)
  return localized.length > 0 ? localized : entries.filter((entry) => entry.locale === 'pt-BR')
}

export function getPublishedTilEntries(locale: Locale = 'pt-BR'): TilEntry[] {
  const published = tilEntries.filter((entry) => entry.published)

  return filterLocalizedEntries(published, locale)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getTilBySlug(slug: string, locale: Locale = 'pt-BR'): TilEntry | undefined {
  return getPublishedTilEntries(locale).find((entry) => entry.slug === slug)
    ?? tilEntries.find((entry) => entry.published && entry.slug === slug)
}
