/**
 * Artigos (Escrita). Fonte: `src/content/posts/<data-slug>/{pt-BR,en}.md`.
 * Validação Zod no carregamento do módulo: conteúdo inválido derruba o build (prerender).
 * Só importar em código de servidor (+page.server.ts, +server.ts), nunca em componentes.
 */
import type { Locale } from '$lib/i18n'
import { absoluteUrl, articlePath } from '$lib/routing/paths'
import { formatIssues, parseFrontmatter, postFrontmatterSchema, validateTranslationPairs } from './schema'
import { sortByDateDesc } from './sort'

export type Post = {
  file: string
  slug: string
  translationKey: string
  locale: Locale
  title: string
  kicker: string
  date: string
  updated?: string
  readingTime: string
  author: string
  excerpt: string
  cover: string
  coverAlt: string
  published: boolean
  sources: string[]
  path: string
  canonical: string
  body: string
}

export type PostSummary = Omit<Post, 'body' | 'file'>

export function loadPosts(sources: Record<string, string>): Post[] {
  const errors: string[] = []
  const posts: Post[] = []
  for (const [file, raw] of Object.entries(sources)) {
    let parsed: ReturnType<typeof parseFrontmatter>
    try {
      parsed = parseFrontmatter(raw)
    } catch (error) {
      errors.push(`  ${file}: ${(error as Error).message}`)
      continue
    }
    const result = postFrontmatterSchema.safeParse(parsed.data)
    if (!result.success) {
      errors.push(formatIssues(file, result.error))
      continue
    }
    const meta = result.data
    const expectedLocale = /\/(pt-BR|en)\.md$/.exec(file)?.[1]
    if (expectedLocale && expectedLocale !== meta.locale) {
      errors.push(`  ${file}: [locale] "${meta.locale}" não corresponde ao nome do arquivo (${expectedLocale})`)
    }
    const path = articlePath(meta.slug, meta.locale)
    posts.push({
      file,
      ...meta,
      translationKey: meta.translationKey ?? meta.slug,
      sources: meta.sources ?? [],
      path,
      canonical: absoluteUrl(path),
      body: parsed.body,
    })
  }
  const keys = posts.map((post) => `${post.locale}:${post.slug}`)
  const duplicated = keys.filter((key, index) => keys.indexOf(key) !== index)
  if (duplicated.length > 0) errors.push(`  slugs duplicados em artigos: ${duplicated.join(', ')}`)
  errors.push(...validateTranslationPairs(posts).map((message) => `  ${message}`))
  if (errors.length > 0) throw new Error(`Conteúdo inválido em artigos:\n${errors.join('\n')}`)
  return sortByDateDesc(posts)
}

const sources = import.meta.glob<string>('/src/content/posts/*/*.md', { eager: true, query: '?raw', import: 'default' })
const posts = loadPosts(sources)

export function getPublishedPosts(locale: Locale): Post[] {
  return posts.filter((post) => post.published && post.locale === locale)
}

export function getPost(slug: string, locale: Locale): Post | undefined {
  return getPublishedPosts(locale).find((post) => post.slug === slug)
}

export function getTranslation(post: Post, locale: Locale): Post | undefined {
  return posts.find((other) => other.published && other.locale === locale && other.translationKey === post.translationKey)
}

export function toSummary({ body: _body, file: _file, ...summary }: Post): PostSummary {
  return summary
}
