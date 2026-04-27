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

function readEntries(directory, pathPrefix) {
  return readdirSync(directory)
    .filter((file) => file.endsWith('.md'))
    .map((file) => parseFrontmatter(readFileSync(join(directory, file), 'utf8')))
    .filter((entry) => entry.published !== 'false')
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((entry) => ({ ...entry, url: `${siteUrl}/${pathPrefix}/${entry.slug}` }))
}

function generateFeed({ title, description, path, entries }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${siteUrl}${path}</link>
    <description>${escapeXml(description)}</description>
    <language>pt-BR</language>
    <atom:link href="${siteUrl}${path}.xml" rel="self" type="application/rss+xml" />
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
mkdirSync(publicDir, { recursive: true })

writeFileSync(
  join(publicDir, 'blog.xml'),
  generateFeed({
    title: 'whoisclebs.com Blog',
    description: 'Artigos sobre engenharia de software, arquitetura, frontend, operação e produto.',
    path: '/blog',
    entries: readEntries('src/content/posts', 'blog'),
  }),
)

writeFileSync(
  join(publicDir, 'til.xml'),
  generateFeed({
    title: 'whoisclebs.com Today I Learned',
    description: 'Notas curtas sobre aprendizados técnicos do dia a dia.',
    path: '/til',
    entries: readEntries('src/content/til', 'til'),
  }),
)
