/** RSS 2.0 e sitemap gerados do conteúdo tipado (prerenderizados como arquivos estáticos). */
import type { Locale } from '$lib/i18n'
import { getPublishedNotes } from '$lib/content/notes'
import { getPublishedPosts, getTranslation } from '$lib/content/posts'
import { projects } from '$lib/content/projects'
import { absoluteUrl, articlePath, notePath, pages, projectPath, type PageKey } from '$lib/routing/paths'

export function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
}

type FeedItem = { title: string; url: string; guid: string; date: string; excerpt: string }
type Feed = { title: string; description: string; sitePath: string; feedPath: string; language: Locale; items: FeedItem[] }

export function renderRss(feed: Feed): string {
  const items = feed.items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="${item.guid === item.url}">${escapeXml(item.guid)}</guid>
      <pubDate>${new Date(`${item.date}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(item.excerpt)}</description>
    </item>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feed.title)}</title>
    <link>${absoluteUrl(feed.sitePath)}</link>
    <description>${escapeXml(feed.description)}</description>
    <language>${feed.language}</language>
    <atom:link href="${absoluteUrl(feed.feedPath)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`
}

/**
 * GUID mantém a URL antiga (`/blog/…/`, `/til/…/`) para leitores de RSS não duplicarem itens já lidos;
 * o link aponta para a URL canônica nova. A URL antiga continua respondendo com 301.
 */
export function blogFeed(locale: Locale): string {
  const legacyPrefix = locale === 'en' ? '/en/blog/' : '/blog/'
  return renderRss({
    title: locale === 'en' ? 'whoisclebs.com Blog EN' : 'whoisclebs.com Blog',
    description:
      locale === 'en'
        ? 'Articles about software engineering, architecture, frontend, operations, and product.'
        : 'Artigos sobre engenharia de software, arquitetura, frontend, operação e produto.',
    sitePath: pages.writing[locale],
    feedPath: locale === 'en' ? '/rss/blog-en.xml' : '/rss/blog.xml',
    language: locale,
    items: getPublishedPosts(locale).map((post) => ({
      title: post.title,
      url: post.canonical,
      guid: absoluteUrl(`${legacyPrefix}${post.slug}/`),
      date: post.date,
      excerpt: post.excerpt,
    })),
  })
}

export function notesFeed(): string {
  return renderRss({
    title: 'whoisclebs.com Today I Learned',
    description: 'Notas curtas sobre aprendizados técnicos do dia a dia.',
    sitePath: pages.notes['pt-BR'],
    feedPath: '/rss/til.xml',
    language: 'pt-BR',
    items: getPublishedNotes().map((note) => ({
      title: note.title,
      url: note.canonical,
      guid: absoluteUrl(`/til/${note.slug}/`),
      date: note.date,
      excerpt: note.excerpt,
    })),
  })
}

type SitemapEntry = { path: string; lastmod?: string; alternates?: Partial<Record<Locale, string>> }

export function sitemapEntries(): SitemapEntry[] {
  const entries: SitemapEntry[] = []
  for (const key of Object.keys(pages) as PageKey[]) {
    const alternates: Partial<Record<Locale, string>> = pages[key]
    for (const path of Object.values(alternates)) if (path) entries.push({ path, alternates })
  }
  for (const project of projects) {
    const alternates = { 'pt-BR': projectPath(project.slug, 'pt-BR'), en: projectPath(project.slug, 'en') }
    entries.push({ path: alternates['pt-BR'], alternates }, { path: alternates.en, alternates })
  }
  for (const locale of ['pt-BR', 'en'] as const) {
    for (const post of getPublishedPosts(locale)) {
      const translation = getTranslation(post, locale === 'en' ? 'pt-BR' : 'en')
      const alternates = translation ? { [post.locale]: post.path, [translation.locale]: translation.path } : undefined
      entries.push({ path: articlePath(post.slug, locale), lastmod: post.updated ?? post.date, alternates })
    }
  }
  for (const note of getPublishedNotes()) entries.push({ path: notePath(note.slug), lastmod: note.updated ?? note.date })
  return entries
}

export function renderSitemap(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const alternates = Object.entries(entry.alternates ?? {}).filter(([, path]) => path)
      const links =
        alternates.length > 1
          ? alternates.map(([locale, path]) => `\n    <xhtml:link rel="alternate" hreflang="${locale}" href="${absoluteUrl(path as string)}"/>`).join('')
          : ''
      const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ''
      return `  <url>\n    <loc>${absoluteUrl(entry.path)}</loc>${lastmod}${links}\n  </url>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`
}
