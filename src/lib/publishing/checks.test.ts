import { describe, expect, it } from 'vitest'
import { builtFileFor, canonicalIssue, DYNAMIC_ENDPOINTS, dynamicEndpointFor, extractJsonLd, extractPageFacts, internalLinks, jsonLdIssues, manifestHasRoute } from './checks'

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
