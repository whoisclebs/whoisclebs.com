import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const siteUrl = 'https://whoisclebs.com'

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) throw new Error('Markdown sem frontmatter')
  const metadata = Object.fromEntries(match[1].split(/\r?\n/).map((line) => {
    const index = line.indexOf(':')
    return [line.slice(0, index).trim(), line.slice(index + 1).trim()]
  }))
  return metadata
}

function escapeXml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function readEntries(directory, urlPrefix, locale) {
  const isEn = locale === 'en'
  return readdirSync(directory)
    .filter((file) => {
      if (isEn) return file.endsWith('.en.md')
      return file.endsWith('.md') && !file.endsWith('.en.md')
    })
    .map((file) => parseFrontmatter(readFileSync(join(directory, file), 'utf8')))
    .filter((entry) => entry.published !== 'false')
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((entry) => ({ ...entry, url: `${siteUrl}${urlPrefix}/${entry.slug}/` }))
}

function generateFeed({ title, description, sitePath, feedPath, entries, language }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${siteUrl}${sitePath}</link>
    <description>${escapeXml(description)}</description>
    <language>${language}</language>
    <atom:link href="${siteUrl}${feedPath}" rel="self" type="application/rss+xml" />
${entries.map((entry) => `    <item>
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

writeFileSync(
  join(rssDir, 'blog.xml'),
  generateFeed({
    title: 'whoisclebs.com Blog',
    description: 'Artigos sobre engenharia de software, arquitetura, frontend, operação e produto.',
    sitePath: '/blog',
    feedPath: '/rss/blog.xml',
    language: 'pt-BR',
    entries: readEntries('src/content/posts', '/blog', 'pt'),
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
    entries: readEntries('src/content/posts', '/en/blog', 'en'),
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
    entries: readEntries('src/content/til', '/til', 'pt'),
  }),
)
