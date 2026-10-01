import { createRequire } from 'node:module'
import { expect, test } from '@playwright/test'
import {
  canonicalIssue,
  dynamicEndpointFor,
  extractJsonLd,
  extractPageFacts,
  graphNodes,
  internalLinks,
  jsonLdIssues,
  llmsIndexIssues,
  markdownAlternate,
  markdownDocumentIssues,
  robotsIssues,
  SITE_ORIGIN,
  sitemapLocs,
} from '../../src/lib/publishing/checks'

/**
 * Camada legível por agentes (spec §5) contra o build servido pelo Worker local:
 * JSON-LD coerente com o que a página mostra, canonical, Open Graph, /resume.json, /llms*.txt,
 * /sitemap.xml e /robots.txt.
 */
const require = createRequire(import.meta.url)
const { validate } = require('@jsonresume/schema') as { validate: (resume: unknown, callback: (errors: unknown[] | null) => void) => void }

const keyRoutes = [
  '/',
  '/projetos/',
  '/projetos/tuxedo/',
  '/projetos/golpher/',
  '/projetos/seishin/',
  '/escrita/',
  '/escrita/github-actions-como-fazer-deploy/',
  '/escrita/assunto/devops/',
  '/notas/',
  '/notas/docker-healthcheck-para-servicos/',
  '/sobre/',
  '/contato/',
  '/livros/',
  '/privacy-policy/',
  '/en/',
  '/en/about/',
  '/en/projects/tuxedo/',
  '/en/writing/github-actions-como-fazer-deploy/',
]

/** URL absoluta do site → caminho no servidor local. */
const local = (url: string) => url.replace(SITE_ORIGIN, '') || '/'

for (const path of keyRoutes) {
  test(`JSON-LD, canonical e og:image coerentes em ${path}`, async ({ page, request }) => {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.status()).toBe(200)
    const html = await response.text()
    const facts = extractPageFacts(html)

    expect(canonicalIssue(facts.canonical)).toBeUndefined()
    expect(facts.canonical).toBe(`${SITE_ORIGIN}${path}`)

    const blocks = extractJsonLd(html)
    expect(blocks.length).toBeGreaterThan(0)
    expect(jsonLdIssues(blocks, facts)).toEqual([])

    // O H1 que a pessoa vê no navegador é o título declarado no JSON-LD (headline, name ou fim da trilha).
    await page.goto(path)
    const h1 = (await page.getByRole('heading', { level: 1 }).innerText()).replace(/\s+/g, ' ').trim()
    const nodes = graphNodes(blocks)
    const titled = nodes.flatMap((node) => {
      if (typeof node.headline === 'string') return [node.headline]
      if (node['@type'] === 'BreadcrumbList') return [String((node.itemListElement as Array<{ name: string }>).at(-1)?.name)]
      if (['ProfilePage', 'ContactPage', 'WebPage', 'CollectionPage'].includes(String(node['@type']))) return [String(node.name)]
      return []
    })
    if (path === '/' || path === '/en/') {
      // A home não tem título de página no H1 (é o mote do hero): o que precisa bater é a pessoa. O nome
      // declarado aparece no rodapé (colofão) e a página se apresenta pelo prenome e sobrenome do hero.
      const person = nodes.find((node) => node['@type'] === 'Person')
      await expect(page.getByRole('contentinfo')).toContainText(String(person?.name))
      await expect(page.locator('section.hero')).toContainText('Clebson Fonseca')
    } else {
      expect(titled.length).toBeGreaterThan(0)
      for (const title of titled) expect(title).toBe(h1)
    }

    const ogImage = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1] ?? ''
    expect(ogImage.startsWith(`${SITE_ORIGIN}/og/`)).toBe(true)
    const image = await request.get(local(ogImage))
    expect(image.status()).toBe(200)
    expect(image.headers()['content-type']).toContain('image/png')
    expect((await image.body()).length).toBeLessThanOrEqual(100 * 1024)
    for (const tag of ['og:title', 'og:description']) expect(html).toContain(`<meta property="${tag}"`)
    expect(html).toContain(`<meta property="og:url" content="${facts.canonical}"`)
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image"')
    expect(html).toContain(`<meta name="twitter:image" content="${ogImage}"`)
  })
}

test('case tem imagem OG própria e sem hreflang para a ficha em inglês (não é tradução)', async ({ request }) => {
  const html = await (await request.get('/projetos/tuxedo/')).text()
  expect(html).toContain(`<meta property="og:image" content="${SITE_ORIGIN}/og/tuxedo.png"`)
  expect(html).not.toContain('<link rel="alternate" hreflang=')
  const seishin = await (await request.get('/projetos/seishin/')).text()
  expect(seishin).toContain(`<link rel="alternate" hreflang="en" href="${SITE_ORIGIN}/en/projects/seishin/"`)
})

const files: Array<{ path: string; type: RegExp }> = [
  { path: '/resume.json', type: /^application\/json/ },
  { path: '/llms.txt', type: /^text\/plain/ },
  { path: '/llms-full.txt', type: /^text\/plain/ },
  { path: '/sitemap.xml', type: /^(application|text)\/xml/ },
  { path: '/robots.txt', type: /^text\/plain/ },
]

for (const file of files) {
  test(`${file.path} responde 200 com o content-type certo`, async ({ request }) => {
    const response = await request.get(file.path, { maxRedirects: 0 })
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toMatch(file.type)
  })
}

test('/resume.json valida no schema oficial do JSON Resume', async ({ request }) => {
  const resume = await (await request.get('/resume.json')).json()
  let errors: unknown[] | null = ['não validado']
  validate(resume, (result) => {
    errors = result
  })
  expect(errors).toBeNull()
  expect(resume.work).toEqual([])
  expect(resume.education).toEqual([])
})

test('/llms.txt no formato llmstxt.org e todo link de /llms.txt e /llms-full.txt responde 200 sem redirect', async ({ request }) => {
  const index = await (await request.get('/llms.txt')).text()
  expect(llmsIndexIssues(index)).toEqual([])
  const full = await (await request.get('/llms-full.txt')).text()
  expect(full).toContain('\n## Limites\n')
  const links = new Set([...internalLinks(index), ...internalLinks(full)])
  expect(links.size).toBeGreaterThan(10)
  for (const url of links) {
    // Endpoint dinâmico (MCP): só POST/OPTIONS; o protocolo é coberto em mcp.spec.ts.
    const response = dynamicEndpointFor(url) ? await request.fetch(local(url), { method: 'OPTIONS', maxRedirects: 0 }) : await request.get(local(url), { maxRedirects: 0 })
    expect(response.status(), url).toBe(dynamicEndpointFor(url) ? 204 : 200)
  }
})

test('sitemap: XML com URLs que respondem 200 (nenhum redirect ou 404) e robots.txt aponta para ele', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text()
  expect(xml.startsWith('<?xml')).toBe(true)
  const locs = sitemapLocs(xml)
  expect(locs.length).toBeGreaterThan(30)
  for (const loc of locs) {
    const response = await request.get(local(loc), { maxRedirects: 0 })
    expect(response.status(), loc).toBe(200)
  }
  expect(xml).toMatch(/<loc>https:\/\/whoisclebs\.com\/escrita\/github-actions-como-fazer-deploy\/<\/loc>\s*<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
  const robots = await (await request.get('/robots.txt')).text()
  expect(robotsIssues(robots)).toEqual([])
  expect(locs.some((loc) => loc.endsWith('.md'))).toBe(false)
})

// Versão Markdown servida pelo Worker a partir do arquivo prerenderizado: o tipo e o noindex vêm de _headers.
for (const path of ['/escrita/github-actions-como-fazer-deploy/', '/en/writing/github-actions-como-fazer-deploy/', '/notas/docker-healthcheck-para-servicos/']) {
  test(`${path} anuncia a versão .md, servida como text/markdown e fora do índice`, async ({ request }) => {
    const html = await (await request.get(path)).text()
    const markdownUrl = markdownAlternate(html)
    expect(markdownUrl).toBe(`${SITE_ORIGIN}${path.slice(0, -1)}.md`)
    const response = await request.get(local(markdownUrl ?? ''), { maxRedirects: 0 })
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toBe('text/markdown; charset=utf-8')
    expect(response.headers()['x-robots-tag']).toBe('noindex')
    expect(markdownDocumentIssues(await response.text(), `${SITE_ORIGIN}${path}`)).toEqual([])
  })
}

test('/agentes/ foi removida e responde 404', async ({ request }) => {
  expect((await request.get('/agentes/', { maxRedirects: 0 })).status()).toBe(404)
})
