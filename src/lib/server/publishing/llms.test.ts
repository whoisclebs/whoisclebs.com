import { describe, expect, it } from 'vitest'
import { getPublishedNotes } from '$lib/content/notes'
import { getPublishedPosts } from '$lib/content/posts'
import { caseStudies } from '$lib/content/cases/index'
import { DYNAMIC_ENDPOINTS, internalLinks, llmsIndexIssues, markdownDocumentIssues, markdownUrlFor, MCP_PATH } from '$lib/publishing/checks'
import { absoluteUrl, markdownPath } from '$lib/routing/paths'
import { sitemapEntries } from '../feeds'
import { embedMarkdown, entryMarkdown, llmsFull, llmsIndex } from './llms'

/** URLs que existem no build: páginas do sitemap + arquivos gerados/estáticos + endpoints dinâmicos (o portão confere a rota). */
const known = new Set([
  ...DYNAMIC_ENDPOINTS.map(absoluteUrl),
  ...sitemapEntries().map((entry) => absoluteUrl(entry.path)),
  ...[...getPublishedPosts('pt-BR'), ...getPublishedPosts('en'), ...getPublishedNotes()].map((entry) => absoluteUrl(markdownPath(entry.path))),
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

  it('lista cases, artigos e notas publicados; artigos e notas apontam para a versão .md', () => {
    for (const study of caseStudies) expect(index).toContain(`(https://whoisclebs.com/projetos/${study.slug}/)`)
    for (const entry of [...getPublishedPosts('pt-BR'), ...getPublishedPosts('en'), ...getPublishedNotes()]) {
      expect(index).toContain(`(${markdownUrlFor(entry.canonical)})`)
      expect(index).not.toContain(`(${entry.canonical})`)
    }
  })

  it('explica a versão Markdown por página e não cita a página de agentes removida', () => {
    expect(index).toMatch(/\.md/)
    for (const gone of ['/agentes/', 'YandeCode', 'SENTINEL', 'Agentes de IA']) expect(index).not.toContain(gone)
  })

  it('cita o servidor MCP somente leitura em Optional', () => {
    const optional = index.slice(index.indexOf('\n## Optional\n'))
    expect(optional).toMatch(new RegExp(`- \\[[^\\]]*MCP[^\\]]*\\]\\(${absoluteUrl(MCP_PATH)}\\): .*search_content`))
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

  it('inclui perfil, cases, artigos e notas, sem a página de agentes removida', () => {
    for (const heading of ['## Perfil', '## Estudos de caso e projetos', '## Artigos', '## Notas']) expect(full).toContain(`\n${heading}\n`)
    for (const study of caseStudies) expect(full).toContain(`### ${study.title}`)
    for (const gone of ['/agentes/', 'YandeCode', 'SENTINEL', '## Agentes de IA']) expect(full).not.toContain(gone)
  })

  it('cada artigo e nota cita a sua versão Markdown', () => {
    for (const entry of [...getPublishedPosts('pt-BR'), ...getPublishedPosts('en'), ...getPublishedNotes()]) {
      const block = full.slice(full.indexOf(`### ${entry.title}\n`))
      expect(block).toContain(`- Markdown: ${markdownUrlFor(entry.canonical)}`)
    }
  })

  it('explica o servidor MCP na abertura, com os mesmos recursos', () => {
    const intro = full.slice(0, full.indexOf('\n## Perfil\n'))
    expect(intro).toContain(absoluteUrl(MCP_PATH))
    expect(intro).toContain('search_content')
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

describe('versão Markdown de cada artigo e nota', () => {
  const ptPost = getPublishedPosts('pt-BR')[0]
  const enPost = getPublishedPosts('en')[0]
  const note = getPublishedNotes()[0]

  it('o caminho da .md troca a barra final por .md', () => {
    expect(markdownPath('/escrita/x/')).toBe('/escrita/x.md')
    expect(markdownPath('/en/writing/x/')).toBe('/en/writing/x.md')
    expect(markdownPath('/notas/x/')).toBe('/notas/x.md')
  })

  it('abre com o título em H1, o resumo e os metadados; segue o corpo sem front matter', () => {
    if (!ptPost) throw new Error('sem artigo publicado')
    const md = entryMarkdown(ptPost)
    expect(markdownDocumentIssues(md, ptPost.canonical)).toEqual([])
    expect(md.startsWith(`# ${ptPost.title}\n\n> ${ptPost.excerpt}\n\n`)).toBe(true)
    for (const line of [`- Canonical: ${ptPost.canonical}`, '- Idioma: pt-BR', `- Publicado em: ${ptPost.date}`, `- Assunto: ${ptPost.topic.label}`, '- Autor: Clebson A. Fonseca (Clebson Augusto), https://whoisclebs.com/sobre/']) {
      expect(md).toContain(`${line}\n`)
    }
    if (ptPost.updated) expect(md).toContain(`- Revisado em: ${ptPost.updated}\n`)
    expect(md).not.toMatch(/^(title|slug|locale):/m)
    // Os títulos do corpo continuam H2 (o H1 é o título do texto) e os links relativos viram absolutos.
    expect(md).toContain(embedMarkdown(ptPost.body, 0))
    expect(md.endsWith('\n')).toBe(true)
  })

  it('artigo em inglês tem rótulos em inglês e aponta para a página sobre em inglês', () => {
    if (!enPost) throw new Error('sem artigo em inglês')
    const md = entryMarkdown(enPost)
    expect(markdownDocumentIssues(md, enPost.canonical)).toEqual([])
    for (const line of ['- Language: en', `- Published: ${enPost.date}`, '- Author: Clebson A. Fonseca (Clebson Augusto), https://whoisclebs.com/en/about/']) expect(md).toContain(`${line}\n`)
  })

  it('nota tem os mesmos metadados que um artigo em pt-BR', () => {
    if (!note) throw new Error('sem nota publicada')
    const md = entryMarkdown(note)
    expect(markdownDocumentIssues(md, note.canonical)).toEqual([])
    expect(md).toContain('- Tipo: Nota\n')
  })

  it('todo link interno da .md existe', () => {
    for (const entry of [ptPost, enPost, note]) {
      if (!entry) continue
      for (const url of internalLinks(entryMarkdown(entry))) expect(known.has(url), url).toBe(true)
    }
  })
})
