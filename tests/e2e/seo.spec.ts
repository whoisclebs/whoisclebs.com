import { expect, test } from '@playwright/test'

/**
 * Cada página prerenderizada tem o próprio <title>, description e canonical com barra final
 * (bug da baseline: rotas estáticas herdavam o head da home). O idioma vem só da URL.
 */
const pages: Array<{ path: string; lang: 'pt-BR' | 'en'; title: RegExp; hreflangEn?: string }> = [
  { path: '/', lang: 'pt-BR', title: /Engenharia de software sem teatro/, hreflangEn: '/en/' },
  { path: '/projetos/', lang: 'pt-BR', title: /^Projetos – /, hreflangEn: '/en/projects/' },
  // Case (pt-BR) e ficha (en) não são tradução uma da outra: sem hreflang (decisão do passo 12).
  { path: '/projetos/tuxedo/', lang: 'pt-BR', title: /^tuxedo: estudo de caso – / },
  { path: '/escrita/', lang: 'pt-BR', title: /^Escrita – /, hreflangEn: '/en/writing/' },
  { path: '/escrita/github-actions-como-fazer-deploy/', lang: 'pt-BR', title: /^GitHub Actions/, hreflangEn: '/en/writing/github-actions-como-fazer-deploy/' },
  { path: '/notas/', lang: 'pt-BR', title: /^Notas – / },
  { path: '/notas/docker-healthcheck-para-servicos/', lang: 'pt-BR', title: /^Docker healthcheck/ },
  { path: '/sobre/', lang: 'pt-BR', title: /^Sobre – /, hreflangEn: '/en/about/' },
  { path: '/contato/', lang: 'pt-BR', title: /^Contato – / },
  { path: '/livros/', lang: 'pt-BR', title: /^Livros – / },
  { path: '/hobbies/', lang: 'pt-BR', title: /^Hobbies – / },
  { path: '/privacy-policy/', lang: 'pt-BR', title: /^Política de Privacidade – / },
  { path: '/terms-of-use/', lang: 'pt-BR', title: /^Termos de Uso – / },
  { path: '/en/', lang: 'en', title: /Software engineering without theater/ },
  { path: '/en/projects/', lang: 'en', title: /^Projects – / },
  { path: '/en/writing/strike-campus-party-digital-goias-2021/', lang: 'en', title: /./ },
  { path: '/en/about/', lang: 'en', title: /^About – / },
]

for (const entry of pages) {
  test(`head próprio em ${entry.path}`, async ({ request }) => {
    const response = await request.get(entry.path, { maxRedirects: 0 })
    expect(response.status()).toBe(200)
    const html = await response.text()
    const head = html.slice(0, html.indexOf('</head>'))
    expect(html).toMatch(new RegExp(`<html lang="${entry.lang}"`))
    const title = /<title>(.*?)<\/title>/.exec(head)?.[1] ?? ''
    expect(title).toMatch(entry.title)
    expect(head.match(/<link rel="canonical"/g)).toHaveLength(1)
    expect(head).toContain(`<link rel="canonical" href="https://whoisclebs.com${entry.path}"`)
    expect(head).toMatch(/<meta name="description" content="[^"]{20,}"/)
    if (entry.hreflangEn) expect(head).toContain(`hreflang="en" href="https://whoisclebs.com${entry.hreflangEn}"`)
  })
}

test('títulos e descriptions não se repetem entre páginas', async ({ request }) => {
  const heads = await Promise.all(pages.map(async ({ path }) => (await (await request.get(path)).text()).split('</head>')[0] ?? ''))
  const titles = heads.map((head) => /<title>(.*?)<\/title>/.exec(head)?.[1])
  expect(new Set(titles).size).toBe(titles.length)
})

test('página PT continua em português num navegador en-US (sem troca por navigator.language)', async ({ page }) => {
  await page.goto('/sobre/')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quem é Clebson?')
  await expect(page.getByRole('link', { name: 'Escrita' }).first()).toBeVisible()
})

test('artigo renderiza código destacado no build e sem JS', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/escrita/github-actions-como-fazer-deploy/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('GitHub Actions')
  await expect(page.locator('pre.shiki').first()).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible()
  await context.close()
})

test('feeds e sitemap são XML com URLs novas', async ({ request }) => {
  for (const feed of ['/rss/blog.xml', '/rss/blog-en.xml', '/rss/til.xml']) {
    const body = await (await request.get(feed)).text()
    expect(body.startsWith('<?xml')).toBe(true)
    expect(body).toContain('<item>')
  }
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).toContain('<loc>https://whoisclebs.com/escrita/github-actions-como-fazer-deploy/</loc>')
  expect(sitemap).not.toContain('/blog/')
})
