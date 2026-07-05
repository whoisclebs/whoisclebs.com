import { markdownPostSources } from '@/content/posts'
import type { Locale } from './i18n'
import {
  parsePost,
  sortPosts,
  BLOG_POSTS_PER_PAGE,
  paginatePosts,
  type PostEntry,
  type PostBlock,
  type PaginatedItems,
} from './editorial/posts'

// ── Re-exports ─────────────────────────────────────────────────────────

export type BlogPost = PostEntry
export type { PostBlock, PaginatedItems }
export { BLOG_POSTS_PER_PAGE }

// ── Collection ─────────────────────────────────────────────────────────

const posts = markdownPostSources.map(({ path, raw }) => parsePost(path, raw))

// ── Queries ────────────────────────────────────────────────────────────

function filterLocalizedPosts(postsToFilter: BlogPost[], locale?: Locale): BlogPost[] {
  if (!locale) return postsToFilter
  return postsToFilter.filter((post) => post.locale === locale)
}

export function getPublishedPosts(locale: Locale = 'pt-BR'): BlogPost[] {
  const published = posts.filter((post) => post.published)

  return sortPosts(filterLocalizedPosts(published, locale))
}

export function getPostBySlug(slug: string, locale: Locale = 'pt-BR'): BlogPost | undefined {
  const published = getPublishedPosts(locale)
  return published.find((post) => post.slug === slug)
}

// ── Grid helpers ───────────────────────────────────────────────────────

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

// ── Pagination ─────────────────────────────────────────────────────────

export { paginatePosts }

// ── Date formatting ────────────────────────────────────────────────────

export function formatPostDate(date: string, locale: Locale = 'pt-BR'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`)).replace('.', '')
}
