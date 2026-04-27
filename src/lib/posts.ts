import { markdownPostSources } from '@/content/posts'
import { parseFrontmatter, parseMarkdownBlocks, type MarkdownBlock } from './markdown'

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

export function getPublishedPosts(): BlogPost[] {
  return [...posts]
    .filter((post) => post.published)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getPublishedPosts().find((post) => post.slug === slug)
}

export function getResponsiveGridClass(count: number): string {
  if (count <= 1) return 'md:grid-cols-1'
  if (count === 2) return 'md:grid-cols-2'
  return 'md:grid-cols-3'
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

export function formatPostDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`)).replace('.', '')
}
