import { markdownTilSources } from '@/content/til'
import { parseFrontmatter, parseMarkdownBlocks, type MarkdownBlock } from './markdown'

export type TilEntry = {
  sourcePath: string
  slug: string
  title: string
  kicker: string
  date: string
  excerpt: string
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
    published: metadata.published !== 'false',
    blocks: parseMarkdownBlocks(body),
  }
}

const tilEntries = markdownTilSources.map(({ path, raw }) => parseTil(path, raw))

export function getPublishedTilEntries(): TilEntry[] {
  return [...tilEntries]
    .filter((entry) => entry.published)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getTilBySlug(slug: string): TilEntry | undefined {
  return getPublishedTilEntries().find((entry) => entry.slug === slug)
}
