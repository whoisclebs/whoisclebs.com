import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { getPublishedPosts, getPublishedTilEntries, escapeXml, siteUrl } from './editorial-content.mjs'

function generateFeed({ title, description, sitePath, feedPath, entries, language }) {
  const sortedEntries = [...entries].sort((a, b) => {
    const dateCmp = b.date.localeCompare(a.date)
    if (dateCmp !== 0) return dateCmp
    return a.slug.localeCompare(b.slug)
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${siteUrl}${sitePath}</link>
    <description>${escapeXml(description)}</description>
    <language>${language}</language>
    <atom:link href="${siteUrl}${feedPath}" rel="self" type="application/rss+xml" />
${sortedEntries.map((entry) => `    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${entry.url}</link>
      <guid>${entry.url}</guid>
      <pubDate>${new Date(`${entry.date}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(entry.excerpt)}</description>
    </item>`).join('\n')}
  </channel>
</rss>
`
}

const publicDir = 'public'
const rssDir = join(publicDir, 'rss')
mkdirSync(rssDir, { recursive: true })

const { ptPosts, enPosts } = getPublishedPosts()
const tilEntries = getPublishedTilEntries()

writeFileSync(
  join(rssDir, 'blog.xml'),
  generateFeed({
    title: 'whoisclebs.com Blog',
    description: 'Artigos sobre engenharia de software, arquitetura, frontend, operação e produto.',
    sitePath: '/blog',
    feedPath: '/rss/blog.xml',
    language: 'pt-BR',
    entries: ptPosts,
  }),
)

writeFileSync(
  join(rssDir, 'blog-en.xml'),
  generateFeed({
    title: 'whoisclebs.com Blog EN',
    description: 'Articles about software engineering, architecture, frontend, operations, and product.',
    sitePath: '/en/blog',
    feedPath: '/rss/blog-en.xml',
    language: 'en',
    entries: enPosts,
  }),
)

writeFileSync(
  join(rssDir, 'til.xml'),
  generateFeed({
    title: 'whoisclebs.com Today I Learned',
    description: 'Notas curtas sobre aprendizados técnicos do dia a dia.',
    sitePath: '/til',
    feedPath: '/rss/til.xml',
    language: 'pt-BR',
    entries: tilEntries,
  }),
)
