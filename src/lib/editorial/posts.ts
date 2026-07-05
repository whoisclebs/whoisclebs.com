import type { Locale } from '../i18n'
import type { ValidationError } from './schema'
import {
  parseLocale,
  parsePublished,
  validateDate,
  validateLocale,
  validateRequired,
  validateTranslationPair,
} from './schema'
import { parseMarkdownBlocks, type MarkdownBlock } from '../markdown'

// ── Post-specific types ────────────────────────────────────────────────

export type PostBlock = MarkdownBlock

export interface PostEntry {
  sourcePath: string
  slug: string
  title: string
  kicker: string
  date: string
  readingTime: string
  author: string
  excerpt: string
  cover: string
  coverAlt: string
  locale: Locale
  translationKey: string
  published: boolean
  blocks: PostBlock[]
}

export interface PostMeta {
  sourcePath: string
  slug: string
  title: string
  kicker: string
  date: string
  readingTime: string
  author: string
  excerpt: string
  cover: string
  coverAlt: string
  locale: Locale
  translationKey: string
  published: boolean
}

// ── Post schema validation ─────────────────────────────────────────────

const POST_REQUIRED_FIELDS = [
  'slug',
  'title',
  'kicker',
  'date',
  'readingTime',
  'author',
  'excerpt',
  'cover',
  'coverAlt',
  'published',
] as const

export function validatePostMeta(
  meta: Record<string, string>,
  file: string,
): ValidationError[] {
  const errors: ValidationError[] = []

  for (const field of POST_REQUIRED_FIELDS) {
    const err = validateRequired(meta, field, file)
    if (err) errors.push(err)
  }

  const localeErr = validateLocale(meta, file)
  if (localeErr) errors.push(localeErr)

  const dateErr = validateDate(meta, file)
  if (dateErr) errors.push(dateErr)

  return errors
}

// ── Post parsing ───────────────────────────────────────────────────────

export function parsePostMeta(
  meta: Record<string, string>,
  sourcePath: string,
): PostMeta {
  return {
    sourcePath,
    slug: meta.slug,
    title: meta.title,
    kicker: meta.kicker,
    date: meta.date,
    readingTime: meta.readingTime,
    author: meta.author,
    excerpt: meta.excerpt,
    cover: meta.cover,
    coverAlt: meta.coverAlt,
    locale: parseLocale(meta.locale),
    translationKey: meta.translationKey || meta.slug,
    published: parsePublished(meta.published),
  }
}

export function parsePost(
  sourcePath: string,
  raw: string,
): PostEntry {
  const { metadata, body } = parseFrontmatter(raw)
  const meta = parsePostMeta(metadata, sourcePath)

  return {
    ...meta,
    blocks: parseMarkdownBlocks(body),
  }
}

// ── Frontmatter parsing (reused from markdown.ts) ──────────────────────

export { parseMarkdownBlocks }
export type { MarkdownBlock }

export function parseFrontmatter(raw: string): { metadata: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)

  if (!match) {
    throw new Error('Markdown must start with frontmatter')
  }

  const [, frontmatterRaw, body] = match
  const entries = frontmatterRaw.split(/\r?\n/).map((line) => {
    const separatorIndex = line.indexOf(':')
    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    return [key, value] as const
  })

  return { metadata: Object.fromEntries(entries), body }
}

// ── Post collection ────────────────────────────────────────────────────

export function loadPostCollection(
  sources: { path: string; raw: string }[],
  options?: { validate?: boolean },
): PostEntry[] {
  const entries = sources.map(({ path, raw }) => parsePost(path, raw))

  if (options?.validate) {
    const errors: ValidationError[] = []
    for (const source of sources) {
      const { metadata } = parseFrontmatter(source.raw)
      errors.push(...validatePostMeta(metadata, source.path))
    }
    if (errors.length > 0) {
      const message = errors
        .map((e) => `  ${e.file}: [${e.field}] ${e.message}`)
        .join('\n')
      throw new Error(`Post validation failed:\n${message}`)
    }
  }

  return entries
}

// ── Translation pairing ────────────────────────────────────────────────

export function validatePostTranslationPairs(
  posts: PostEntry[],
): ValidationError[] {
  const errors: ValidationError[] = []
  const seen = new Map<string, PostEntry>()

  for (const post of posts) {
    if (post.locale === 'pt-BR') {
      // translationKey defaults to slug; register as source
      seen.set(post.translationKey, post)
    }
  }

  for (const post of posts) {
    if (post.locale === 'en') {
      const source = seen.get(post.translationKey)
      if (source) {
        errors.push(
          ...validateTranslationPair(
            {
              sourcePath: source.sourcePath,
              slug: source.slug,
              translationKey: source.translationKey,
              date: source.date,
              cover: source.cover,
              author: source.author,
              published: String(source.published),
            },
            {
              sourcePath: post.sourcePath,
              slug: post.slug,
              translationKey: post.translationKey,
              date: post.date,
              cover: post.cover,
              author: post.author,
              published: String(post.published),
            },
          ),
        )
      }
    }
  }

  return errors
}

// ── Ordering ───────────────────────────────────────────────────────────

export function sortPosts<T extends { date: string; slug: string }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date)
    if (dateCmp !== 0) return dateCmp
    return a.slug.localeCompare(b.slug)
  })
}

// ── Legacy re-exports to minimize migration churn ──────────────────────

export const BLOG_POSTS_PER_PAGE = 10

export type PaginatedItems<T> = {
  items: T[]
  currentPage: number
  totalPages: number
  totalItems: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export function paginatePosts<T>(
  postsToPaginate: T[],
  requestedPage: number,
  perPage = BLOG_POSTS_PER_PAGE,
): PaginatedItems<T> {
  const totalItems = postsToPaginate.length
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage))
  const currentPage = Math.min(
    Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1),
    totalPages,
  )
  const start = (currentPage - 1) * perPage
  const items = postsToPaginate.slice(start, start + perPage)

  return {
    items,
    currentPage,
    totalPages,
    totalItems,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  }
}
