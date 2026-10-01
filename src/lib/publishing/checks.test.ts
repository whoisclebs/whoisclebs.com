import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  AI_CRAWLERS,
  builtFileFor,
  canonicalIssue,
  DYNAMIC_ENDPOINTS,
  dynamicEndpointFor,
  extractJsonLd,
  extractPageFacts,
  internalLinks,
  jsonLdIssues,
  manifestHasRoute,
  markdownAlternate,
  markdownAlternateIssue,
  markdownDocumentIssues,
  markdownUrlFor,
  robotsIssues,
} from './checks'

const page = (jsonLd: unknown, body = '') => `<!doctype html><html lang="pt-BR"><head>
<link rel="canonical" href="https://whoisclebs.com/escrita/x/">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script></head>
<body><h1>Título &amp; subtítulo</h1><time datetime="2025-01-02">2 jan 2025</time>${body}<footer>© Clebson A. Fonseca.</footer></body></html>`

const article = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BlogPosting',
      headline: 'Título & subtítulo',
      url: 'https://whoisclebs.com/escrita/x/',
      inLanguage: 'pt-BR',
      datePublished: '2025-01-02',
      author: { '@type': 'Person', name: 'Clebson A. Fonseca' },
    },
  ],
}

describe('checks do JSON-LD contra a página', () => {
  it('aceita um artigo coerente', () => {
    const html = page(article)
    expect(jsonLdIssues(extractJsonLd(html), extractPageFacts(html))).toEqual([])
  })

  it('reprova título diferente do H1, data ausente da página, URL ≠ canonical e idioma errado', () => {
    const node = { ...article['@graph'][0], headline: 'Outro', datePublished: '2025-02-02', url: 'https://whoisclebs.com/y/', inLanguage: 'en' }
    const html = page({ ...article, '@graph': [node] })
    const issues = jsonLdIssues(extractJsonLd(html), extractPageFacts(html)).join('\n')
    expect(issues).toContain('headline')
    expect(issues).toContain('2025-02-02')
    expect(issues).toContain('canonical')
    expect(issues).toContain('inLanguage')
  })

  it('reprova campos obrigatórios ausentes, avaliação/preço e pessoa que não aparece na página', () => {
    const html = page({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'SoftwareSourceCode', name: 'tuxedo', offers: { '@type': 'Offer', price: 0 } },
        { '@type': 'Person', name: 'Fulano', url: 'https://example.com' },
      ],
    })
    const issues = jsonLdIssues(extractJsonLd(html), extractPageFacts(html)).join('\n')
    expect(issues).toContain('SoftwareSourceCode sem codeRepository')
    expect(issues).toContain('chave proibida')
    expect(issues).toContain('Person.name "Fulano"')
  })

  it('lança erro com JSON-LD que não parseia', () => {
    expect(() => extractJsonLd('<script type="application/ld+json">{nope}</script>')).toThrow(/JSON-LD inválido/)
  })

  it('canonical precisa ser absoluto e com barra final', () => {
    expect(canonicalIssue('https://whoisclebs.com/sobre/')).toBeUndefined()
    expect(canonicalIssue('/sobre/')).toMatch(/absoluto/)
    expect(canonicalIssue('https://whoisclebs.com/sobre')).toMatch(/barra/)
  })

  it('links internos ignoram blocos de código e âncoras; mapeiam para o arquivo do build', () => {
    const md = 'Ver [a](/sobre/#x) e https://whoisclebs.com/notas/. Fora: [b](https://github.com/x)\n```\nhttps://whoisclebs.com/codigo/\n```\n'
    expect(internalLinks(md).sort()).toEqual(['https://whoisclebs.com/notas/', 'https://whoisclebs.com/sobre/'])
    expect(builtFileFor('https://whoisclebs.com/sobre/')).toBe('sobre/index.html')
    expect(builtFileFor('https://whoisclebs.com/')).toBe('index.html')
    expect(builtFileFor('https://whoisclebs.com/resume.json')).toBe('resume.json')
  })
})

describe('endpoints dinâmicos citados em /llms*.txt', () => {
  it('reconhece só os endpoints declarados, pela URL absoluta', () => {
    expect(DYNAMIC_ENDPOINTS).toEqual(['/mcp'])
    expect(dynamicEndpointFor('https://whoisclebs.com/mcp')).toBe('/mcp')
    expect(dynamicEndpointFor('https://whoisclebs.com/mcp/')).toBeUndefined()
    expect(dynamicEndpointFor('https://whoisclebs.com/sobre/')).toBeUndefined()
  })

  it('confere a rota no manifesto do servidor gerado pelo SvelteKit', () => {
    const manifest = 'routes: [{ id: "/api/activity", pattern: /x/ }, { id: "/mcp", pattern: /y/ }]'
    expect(manifestHasRoute(manifest, '/mcp')).toBe(true)
    expect(manifestHasRoute(manifest.replace('"/mcp"', '"/outra"'), '/mcp')).toBe(false)
  })
})

describe('versão Markdown de artigos e notas', () => {
  it('a URL da .md troca a barra final por .md, só em artigos e notas', () => {
    expect(markdownUrlFor('https://whoisclebs.com/escrita/x/')).toBe('https://whoisclebs.com/escrita/x.md')
    expect(markdownUrlFor('https://whoisclebs.com/en/writing/x/')).toBe('https://whoisclebs.com/en/writing/x.md')
    expect(markdownUrlFor('https://whoisclebs.com/notas/x/')).toBe('https://whoisclebs.com/notas/x.md')
    for (const other of ['https://whoisclebs.com/escrita/', 'https://whoisclebs.com/escrita/assunto/devops/', 'https://whoisclebs.com/en/writing/topic/devops/', 'https://whoisclebs.com/sobre/', 'https://whoisclebs.com/projetos/tuxedo/']) {
      expect(markdownUrlFor(other), other).toBeUndefined()
    }
  })

  it('lê o <link rel="alternate" type="text/markdown"> do head', () => {
    const html = '<head><link rel="alternate" hreflang="en" href="https://whoisclebs.com/en/"><link rel="alternate" type="text/markdown" href="https://whoisclebs.com/escrita/x.md"></head>'
    expect(markdownAlternate(html)).toBe('https://whoisclebs.com/escrita/x.md')
    expect(markdownAlternate('<head></head>')).toBeUndefined()
  })

  it('artigo e nota precisam do link para a própria .md; outras páginas não', () => {
    const link = '<link rel="alternate" type="text/markdown" href="https://whoisclebs.com/escrita/x.md">'
    expect(markdownAlternateIssue(link, 'https://whoisclebs.com/escrita/x/')).toBeUndefined()
    expect(markdownAlternateIssue('', 'https://whoisclebs.com/escrita/x/')).toMatch(/sem <link rel="alternate" type="text\/markdown">/)
    expect(markdownAlternateIssue(link, 'https://whoisclebs.com/notas/y/')).toMatch(/aponta para/)
    expect(markdownAlternateIssue('', 'https://whoisclebs.com/sobre/')).toBeUndefined()
    expect(markdownAlternateIssue(link, 'https://whoisclebs.com/sobre/')).toMatch(/não tem versão Markdown/)
  })

  it('o documento .md abre com H1, cita a página canônica e não traz front matter', () => {
    const canonical = 'https://whoisclebs.com/escrita/x/'
    expect(markdownDocumentIssues(`# Título\n\n- Canonical: ${canonical}\n\nTexto.\n`, canonical)).toEqual([])
    const issues = markdownDocumentIssues('---\ntitle: x\n---\nTexto', canonical).join('\n')
    expect(issues).toContain('H1')
    expect(issues).toContain('front matter')
    expect(issues).toContain(canonical)
  })
})

describe('robots.txt', () => {
  const allowAll = (agents: readonly string[]) => agents.map((agent) => `User-agent: ${agent}\nAllow: /\n`).join('\n')
  const sitemap = 'Sitemap: https://whoisclebs.com/sitemap.xml\n'

  it('aceita todos os crawlers de IA liberados, o grupo * e o sitemap', () => {
    expect(robotsIssues(`# comentário\n${allowAll(AI_CRAWLERS)}\n${allowAll(['*'])}\n${sitemap}`)).toEqual([])
  })

  it('o static/robots.txt publicado passa na conferência', () => {
    expect(robotsIssues(readFileSync('static/robots.txt', 'utf8'))).toEqual([])
  })

  it('reprova crawler ausente, bloqueio total, falta do grupo * e do sitemap', () => {
    const [first, ...rest] = AI_CRAWLERS
    const issues = robotsIssues(`${allowAll(rest)}\nUser-agent: GPTBot\nDisallow: /\n`).join('\n')
    expect(issues).toContain(`${String(first)} sem grupo próprio`)
    expect(issues).toContain('Disallow: /')
    expect(issues).toContain('User-agent: *')
    expect(issues).toContain('Sitemap')
  })
})
