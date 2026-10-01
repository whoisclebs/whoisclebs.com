/** RSS 2.0 e sitemap gerados do conteúdo tipado (prerenderizados como arquivos estáticos). */
import type { Locale } from '$lib/i18n'
import { getPublishedNotes } from '$lib/content/notes'
import { getPublishedPosts, getTranslation } from '$lib/content/posts'
import { projects } from '$lib/content/projects'
import { getCaseStudy } from '$lib/content/cases/index'
import { absoluteUrl, articlePath, notePath, pages, projectPath, topicPath, type PageKey } from '$lib/routing/paths'

export function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
}

type FeedItem = { title: string; url: string; guid: string; date: string; excerpt: string; category?: string }
type Feed = { title: string; description: string; sitePath: string; feedPath: string; language: Locale; items: FeedItem[] }

/** Data `YYYY-MM-DD` → RFC 822 (exigido pelo RSS 2.0), meio-dia UTC para não mudar de dia por fuso. */
export function rfc822(date: string): string {
  return new Date(`${date}T12:00:00Z`).toUTCString()
}

export function renderRss(feed: Feed): string {
  const items = feed.items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="${item.guid === item.url}">${escapeXml(item.guid)}</guid>
      <pubDate>${rfc822(item.date)}</pubDate>
      <description>${escapeXml(item.excerpt)}</description>${item.category ? `\n      <category>${escapeXml(item.category)}</category>` : ''}
    </item>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feed.title)}</title>
    <link>${absoluteUrl(feed.sitePath)}</link>
    <description>${escapeXml(feed.description)}</description>
    <language>${feed.language}</language>${feed.items[0] ? `\n    <lastBuildDate>${rfc822(feed.items[0].date)}</lastBuildDate>` : ''}
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
      category: post.topic.label,
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
      category: note.topic.label,
    })),
  })
}

type SitemapEntry = { path: string; lastmod?: string; alternates?: Partial<Record<Locale, string>> }

function latest(dates: Array<string | undefined>): string | undefined {
  return dates.filter((date): date is string => Boolean(date)).sort().at(-1)
}

const revised = (entry: { date: string; updated?: string }) => entry.updated ?? entry.date

/**
 * Todas as rotas indexáveis (páginas prerenderizadas com 200; nada de redirect ou 404). `lastmod` só onde há
 * data de revisão no conteúdo; hreflang só entre pares que são tradução um do outro.
 */
export function sitemapEntries(): SitemapEntry[] {
  const entries: SitemapEntry[] = []
  const lastmodFor: Partial<Record<PageKey, Partial<Record<Locale, string>>>> = {
    writing: { 'pt-BR': latest(getPublishedPosts('pt-BR').map(revised)), en: latest(getPublishedPosts('en').map(revised)) },
    notes: { 'pt-BR': latest(getPublishedNotes().map(revised)) },
    projects: { 'pt-BR': latest(projects.map((project) => project.statusCheckedAt)), en: latest(projects.map((project) => project.statusCheckedAt)) },
  }
  for (const key of Object.keys(pages) as PageKey[]) {
    const alternates: Partial<Record<Locale, string>> = pages[key]
    for (const [locale, path] of Object.entries(alternates) as Array<[Locale, string | undefined]>) {
      if (path) entries.push({ path, lastmod: lastmodFor[key]?.[locale], alternates })
    }
  }
  for (const project of projects) {
    const study = getCaseStudy(project.slug)
    // Com case, pt-BR (estudo de caso) e en (ficha) não são tradução: sem hreflang.
    const alternates = study ? undefined : { 'pt-BR': projectPath(project.slug, 'pt-BR'), en: projectPath(project.slug, 'en') }
    entries.push(
      { path: projectPath(project.slug, 'pt-BR'), lastmod: study?.checkedAt ?? project.statusCheckedAt, alternates },
      { path: projectPath(project.slug, 'en'), lastmod: project.statusCheckedAt, alternates },
    )
  }
  for (const locale of ['pt-BR', 'en'] as const) {
    for (const post of getPublishedPosts(locale)) {
      const translation = getTranslation(post, locale === 'en' ? 'pt-BR' : 'en')
      const alternates = translation ? { [post.locale]: post.path, [translation.locale]: translation.path } : undefined
      entries.push({ path: articlePath(post.slug, locale), lastmod: revised(post), alternates })
    }
  }
  const topicDates = (locale: 'pt-BR' | 'en') => {
    const dates = new Map<string, string>()
    for (const post of getPublishedPosts(locale)) {
      const current = dates.get(post.topic.slug)
      if (!current || revised(post) > current) dates.set(post.topic.slug, revised(post))
    }
    return dates
  }
  const ptTopics = topicDates('pt-BR')
  const enTopics = topicDates('en')
  for (const [locale, own, other] of [['pt-BR', ptTopics, enTopics], ['en', enTopics, ptTopics]] as const) {
    for (const [slug, lastmod] of own) {
      const alternates = other.has(slug) ? { 'pt-BR': topicPath(slug, 'pt-BR'), en: topicPath(slug, 'en') } : undefined
      entries.push({ path: topicPath(slug, locale), lastmod, alternates })
    }
  }
  for (const note of getPublishedNotes()) entries.push({ path: notePath(note.slug), lastmod: revised(note) })
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
