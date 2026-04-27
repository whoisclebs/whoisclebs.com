import { markdownPostSources } from '@/content/posts'
import { parseFrontmatter, parseMarkdownBlocks, type MarkdownBlock } from './markdown'
import type { Locale } from './i18n'

export type PostBlock = MarkdownBlock

export type BlogPost = {
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

function parsePost(sourcePath: string, raw: string): BlogPost {
  const { metadata, body } = parseFrontmatter(raw)

  return {
    sourcePath,
    slug: metadata.slug,
    title: metadata.title,
    kicker: metadata.kicker,
    date: metadata.date,
    readingTime: metadata.readingTime,
    author: metadata.author,
    excerpt: metadata.excerpt,
    cover: metadata.cover,
    coverAlt: metadata.coverAlt,
    locale: metadata.locale === 'en' ? 'en' : 'pt-BR',
    translationKey: metadata.translationKey || metadata.slug,
    published: metadata.published !== 'false',
    blocks: parseMarkdownBlocks(body),
  }
}

const posts = markdownPostSources.map(({ path, raw }) => parsePost(path, raw))

export const BLOG_POSTS_PER_PAGE = 10

export type PaginatedItems<T> = {
  items: T[]
  currentPage: number
  totalPages: number
  totalItems: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

function filterLocalizedPosts(postsToFilter: BlogPost[], locale?: Locale): BlogPost[] {
  if (!locale) return postsToFilter

  const localized = postsToFilter.filter((post) => post.locale === locale)
  return localized.length > 0 ? localized : postsToFilter.filter((post) => post.locale === 'pt-BR')
}

export function getPublishedPosts(locale: Locale = 'pt-BR'): BlogPost[] {
  const published = posts.filter((post) => post.published)

  return filterLocalizedPosts(published, locale)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getPostBySlug(slug: string, locale: Locale = 'pt-BR'): BlogPost | undefined {
  const published = getPublishedPosts(locale)
  return published.find((post) => post.slug === slug)
    ?? posts.find((post) => post.published && post.slug === slug)
}

export function getResponsiveGridClass(count: number): string {
  if (count <= 1) return 'md:grid-cols-1'
  if (count === 2) return 'md:grid-cols-2'
  return 'md:grid-cols-3'
}

export function getBalancedEditorialGridItemClass(index: number, count: number): string {
  const remainder = count % 3

  if (remainder === 1 && index === count - 1) return 'md:col-span-6'
  if (remainder === 2 && index >= count - 2) return 'md:col-span-3'
  return 'md:col-span-2'
}

export function paginatePosts<T>(postsToPaginate: T[], requestedPage: number, perPage = BLOG_POSTS_PER_PAGE): PaginatedItems<T> {
  const totalItems = postsToPaginate.length
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage))
  const currentPage = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), totalPages)
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

export function formatPostDate(date: string, locale: Locale = 'pt-BR'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`)).replace('.', '')
}
