import { describe, expect, it } from 'vitest'
import { getPublishedNotes } from '$lib/content/notes'
import { getPublishedPosts } from '$lib/content/posts'
import { caseStudies } from '$lib/content/cases/index'
import { internalLinks, llmsIndexIssues } from '$lib/publishing/checks'
import { absoluteUrl } from '$lib/routing/paths'
import { sitemapEntries } from '../feeds'
import { embedMarkdown, llmsFull, llmsIndex } from './llms'

/** URLs que existem no build: páginas do sitemap + arquivos gerados/estáticos citados. */
const known = new Set([
  ...sitemapEntries().map((entry) => absoluteUrl(entry.path)),
  ...['/resume.json', '/llms.txt', '/llms-full.txt', '/sitemap.xml', '/rss/blog.xml', '/rss/blog-en.xml', '/rss/til.xml', '/.well-known/security.txt'].map(absoluteUrl),
])

describe('/llms.txt', () => {
  const index = llmsIndex()

  it('segue o formato llmstxt.org: H1, resumo em blockquote, seções H2 com file lists', () => {
    expect(llmsIndexIssues(index)).toEqual([])
    expect(index.startsWith('# whoisclebs.com\n\n> ')).toBe(true)
    expect(index).toContain('\n## Optional\n')
  })

  it('só aponta para URLs canônicas que existem', () => {
    const links = internalLinks(index)
    expect(links.length).toBeGreaterThan(10)
    for (const url of links) expect(known.has(url), url).toBe(true)
  })

  it('lista cases, artigos e notas publicados', () => {
    for (const study of caseStudies) expect(index).toContain(`(https://whoisclebs.com/projetos/${study.slug}/)`)
    for (const post of [...getPublishedPosts('pt-BR'), ...getPublishedPosts('en')]) expect(index).toContain(`(${post.canonical})`)
    for (const note of getPublishedNotes()) expect(index).toContain(`(${note.canonical})`)
  })

  it('o verificador reprova um arquivo fora do formato', () => {
    expect(llmsIndexIssues('Sem H1\n\n## Seção\n\ntexto solto')).not.toEqual([])
  })
})

describe('/llms-full.txt', () => {
  const full = llmsFull()

  it('traz canonical, idioma e datas de cada artigo e nota, e a seção Limites no fim', () => {
    for (const entry of [...getPublishedPosts('pt-BR'), ...getPublishedPosts('en'), ...getPublishedNotes()]) {
      const block = full.slice(full.indexOf(`### ${entry.title}\n`))
      expect(block).toContain(`- Canonical: ${entry.canonical}`)
      expect(block).toContain(`- Idioma: ${entry.locale}`)
      expect(block).toContain(`- Publicado em: ${entry.date}`)
    }
    expect(full).toMatch(/\n## Limites\n[\s\S]*proposta de descoberta[\s\S]*Não há garantia/)
    expect(full.lastIndexOf('\n## ')).toBe(full.indexOf('\n## Limites\n'))
  })

  it('inclui perfil, cases e agentes', () => {
    for (const heading of ['## Perfil', '## Estudos de caso e projetos', '## Agentes de IA', '## Artigos', '## Notas']) expect(full).toContain(`\n${heading}\n`)
    for (const study of caseStudies) expect(full).toContain(`### ${study.title}`)
  })

  it('todo link interno existe', () => {
    for (const url of internalLinks(full)) expect(known.has(url), url).toBe(true)
  })
})

describe('embedMarkdown', () => {
  it('rebaixa títulos e torna links absolutos só fora de blocos de código', () => {
    const md = '## Seção\n\nVeja [a nota](/notas/x/).\n\n```bash\n# comentário\necho [a](/b)\n```\n'
    expect(embedMarkdown(md, 2)).toBe('#### Seção\n\nVeja [a nota](https://whoisclebs.com/notas/x/).\n\n```bash\n# comentário\necho [a](/b)\n```')
  })
})
