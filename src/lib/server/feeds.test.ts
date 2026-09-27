import { describe, expect, it } from 'vitest'
import { blogFeed, notesFeed, renderRss, rfc822, sitemapEntries } from './feeds'

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
