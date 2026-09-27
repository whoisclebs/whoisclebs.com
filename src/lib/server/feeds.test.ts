import { describe, expect, it } from 'vitest'
import { blogFeed, notesFeed, renderRss, renderSitemap, rfc822, sitemapEntries } from './feeds'

describe('RSS', () => {
  it('data ISO vira RFC 822 sem trocar de dia', () => {
    expect(rfc822('2025-09-16')).toBe('Tue, 16 Sep 2025 12:00:00 GMT')
  })

  it('escapa texto e só marca guid como permalink quando é a própria URL', () => {
    const xml = renderRss({
      title: 'A & B',
      description: 'd',
      sitePath: '/escrita/',
      feedPath: '/rss/blog.xml',
      language: 'pt-BR',
      items: [{ title: '<x>', url: 'https://whoisclebs.com/escrita/x/', guid: 'https://whoisclebs.com/blog/x/', date: '2025-01-02', excerpt: 'e', category: 'DevOps' }],
    })
    expect(xml).toContain('<title>A &amp; B</title>')
    expect(xml).toContain('<title>&lt;x&gt;</title>')
    expect(xml).toContain('<guid isPermaLink="false">https://whoisclebs.com/blog/x/</guid>')
    expect(xml).toContain('<category>DevOps</category>')
    expect(xml).toContain('<lastBuildDate>Thu, 02 Jan 2025 12:00:00 GMT</lastBuildDate>')
  })

  it('feeds reais apontam para as URLs novas e mantêm o guid antigo', () => {
    const pt = blogFeed('pt-BR')
    expect(pt).toContain('<link>https://whoisclebs.com/escrita/github-actions-como-fazer-deploy/</link>')
    expect(pt).toContain('<guid isPermaLink="false">https://whoisclebs.com/blog/github-actions-como-fazer-deploy/</guid>')
    expect(blogFeed('en')).toContain('https://whoisclebs.com/en/blog/github-actions-como-fazer-deploy/')
    expect(notesFeed()).toContain('<guid isPermaLink="false">https://whoisclebs.com/til/docker-healthcheck-para-servicos/</guid>')
  })
})

describe('sitemap', () => {
  it('inclui as páginas de assunto com hreflang só quando o par existe', () => {
    const topic = sitemapEntries().find((entry) => entry.path === '/escrita/assunto/devops/')
    expect(topic?.alternates).toEqual({ 'pt-BR': '/escrita/assunto/devops/', en: '/en/writing/topic/devops/' })
  })
})

describe('sitemap: rotas indexáveis, lastmod e hreflang', () => {
  const entries = sitemapEntries()

  it('não repete URL e toda URL termina com barra (sem redirect de barra)', () => {
    const paths = entries.map((entry) => entry.path)
    expect(new Set(paths).size).toBe(paths.length)
    for (const path of paths) expect(path).toMatch(/^\/(.*\/)?$/)
  })

  it('não lista rotas antigas que só redirecionam', () => {
    for (const legacy of ['/blog/', '/til/', '/about/', '/portfolio/', '/books/', '/en/blog/']) {
      expect(entries.some((entry) => entry.path === legacy)).toBe(false)
    }
  })

  it('lastmod vem da data de revisão do conteúdo', () => {
    const article = entries.find((entry) => entry.path === '/escrita/github-actions-como-fazer-deploy/')
    expect(article?.lastmod).toBe('2025-09-16')
    expect(entries.find((entry) => entry.path === '/projetos/tuxedo/')?.lastmod).toBe('2026-09-27')
    expect(entries.find((entry) => entry.path === '/agentes/')?.lastmod).toBe('2026-09-27')
    for (const entry of entries) if (entry.lastmod) expect(entry.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('hreflang só entre pares traduzidos: case (pt) e ficha (en) não são tradução', () => {
    expect(entries.find((entry) => entry.path === '/projetos/tuxedo/')?.alternates).toBeUndefined()
    expect(entries.find((entry) => entry.path === '/en/projects/golpher/')?.alternates).toBeUndefined()
    expect(entries.find((entry) => entry.path === '/projetos/seishin/')?.alternates).toEqual({ 'pt-BR': '/projetos/seishin/', en: '/en/projects/seishin/' })
    expect(entries.find((entry) => entry.path === '/notas/')?.alternates).toEqual({ 'pt-BR': '/notas/' })
    const xml = renderSitemap(entries)
    expect(xml).not.toMatch(/<loc>https:\/\/whoisclebs\.com\/notas\/<\/loc>\s*<xhtml:link/)
  })
})
