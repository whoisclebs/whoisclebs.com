import { markdownPostSources } from '@/content/posts'

export type PostBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'code'; language: string; code: string }

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

type PostFrontmatter = Omit<BlogPost, 'sourcePath' | 'blocks'>

function parseFrontmatter(raw: string): { frontmatter: PostFrontmatter; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)

  if (!match) {
    throw new Error('Post Markdown must start with frontmatter')
  }

  const [, frontmatterRaw, body] = match
  const entries = frontmatterRaw.split('\n').map((line) => {
    const separatorIndex = line.indexOf(':')
    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    return [key, value] as const
  })

  const metadata = Object.fromEntries(entries) as Record<string, string>

  return {
    frontmatter: {
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
    },
    body,
  }
}

function pushParagraph(blocks: PostBlock[], lines: string[]) {
  if (lines.length === 0) return
  blocks.push({ type: 'paragraph', text: lines.join(' ').trim() })
  lines.length = 0
}

function parseMarkdownBlocks(markdown: string): PostBlock[] {
  const blocks: PostBlock[] = []
  const paragraphLines: string[] = []
  const lines = markdown.split('\n')

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      pushParagraph(blocks, paragraphLines)
      const language = trimmed.replace('```', '').trim() || 'text'
      const codeLines: string[] = []

      index += 1
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index])
        index += 1
      }

      blocks.push({ type: 'code', language, code: codeLines.join('\n') })
      continue
    }

    if (trimmed.startsWith('## ')) {
      pushParagraph(blocks, paragraphLines)
      blocks.push({ type: 'heading', text: trimmed.replace(/^##\s+/, '') })
      continue
    }

    if (trimmed.startsWith('- ')) {
      pushParagraph(blocks, paragraphLines)
      const items = [trimmed.replace(/^-\s+/, '')]

      while (index + 1 < lines.length && lines[index + 1].trim().startsWith('- ')) {
        index += 1
        items.push(lines[index].trim().replace(/^-\s+/, ''))
      }

      blocks.push({ type: 'list', items })
      continue
    }

    if (trimmed === '') {
      pushParagraph(blocks, paragraphLines)
      continue
    }

    paragraphLines.push(trimmed)
  }

  pushParagraph(blocks, paragraphLines)
  return blocks
}

function parsePost(sourcePath: string, raw: string): BlogPost {
  const { frontmatter, body } = parseFrontmatter(raw)

  return {
    sourcePath,
    ...frontmatter,
    blocks: parseMarkdownBlocks(body),
  }
}

const posts = markdownPostSources.map(({ path, raw }) => parsePost(path, raw))

export const BLOG_POSTS_PER_PAGE = 10

export type PaginatedPosts = {
  items: BlogPost[]
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

export function paginatePosts(postsToPaginate: BlogPost[], requestedPage: number, perPage = BLOG_POSTS_PER_PAGE): PaginatedPosts {
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
