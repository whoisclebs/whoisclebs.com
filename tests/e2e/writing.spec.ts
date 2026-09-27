import AxeBuilder from '@axe-core/playwright'
import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

/**
 * Passo 06 — Escrita/Notas, RSS, metadados e comentários (o manifesto virou "O que eu faço" no passo 15).
 * Tudo contra o build real (wrangler dev), com URLs tiradas do sitemap para não fixar a lista à mão.
 */

const SITE = 'https://whoisclebs.com'
const feeds = ['/rss/blog.xml', '/rss/blog-en.xml', '/rss/til.xml']

async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
  const xml = await (await request.get('/sitemap.xml')).text()
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => (match[1] ?? '').replace(SITE, ''))
}

/** Artigos e notas (não índices nem páginas de assunto). */
async function entryPaths(request: APIRequestContext): Promise<string[]> {
  return (await sitemapPaths(request)).filter((path) => /^\/(escrita|en\/writing|notas)\/(?!assunto\/|topic\/)[^/]+\/$/.test(path))
}

test.describe('RSS', () => {
  for (const feed of feeds) {
    test(`${feed} é XML válido com itens, links novos e datas RFC 822`, async ({ page, request }) => {
      const response = await request.get(feed)
      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toContain('xml')
      const xml = await response.text()
      await page.goto('/')
      const parsed = await page.evaluate((source) => {
        const doc = new DOMParser().parseFromString(source, 'application/xml')
        const error = doc.querySelector('parsererror')?.textContent ?? null
        const items = [...doc.querySelectorAll('channel > item')].map((item) => ({
          title: item.querySelector('title')?.textContent ?? '',
          link: item.querySelector('link')?.textContent ?? '',
          guid: item.querySelector('guid')?.textContent ?? '',
          pubDate: item.querySelector('pubDate')?.textContent ?? '',
        }))
        return { error, root: doc.documentElement.nodeName, version: doc.documentElement.getAttribute('version'), items }
      }, xml)
      expect(parsed.error).toBeNull()
      expect(parsed.root).toBe('rss')
      expect(parsed.version).toBe('2.0')
      expect(parsed.items.length).toBeGreaterThan(0)
      for (const item of parsed.items) {
        expect(item.title.length).toBeGreaterThan(0)
        expect(item.link).toMatch(/^https:\/\/whoisclebs\.com\/(escrita|en\/writing|notas)\/[a-z0-9-]+\/$/)
        // GUID antigo preservado para leitores de RSS não duplicarem itens.
        expect(item.guid).toMatch(/^https:\/\/whoisclebs\.com\/(blog|en\/blog|til)\/[a-z0-9-]+\/$/)
        expect(item.pubDate).toMatch(/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/)
        expect(Number.isNaN(Date.parse(item.pubDate))).toBe(false)
        const target = await request.get(item.link.replace(SITE, ''), { maxRedirects: 0 })
        expect(target.status(), item.link).toBe(200)
      }
    })
  }
})

test.describe('metadados de artigos e notas', () => {
  test('toda página de artigo/nota tem canonical, lang e datas ISO; hreflang só entre pares recíprocos', async ({ request }) => {
    const paths = await entryPaths(request)
    expect(paths.length).toBeGreaterThanOrEqual(13)
    for (const path of paths) {
      const html = await (await request.get(path, { maxRedirects: 0 })).text()
      const head = html.slice(0, html.indexOf('</head>'))
      expect(head, path).toContain(`<link rel="canonical" href="${SITE}${path}"`)
      expect(html).toMatch(new RegExp(`<html lang="${path.startsWith('/en/') ? 'en' : 'pt-BR'}"`))
      const published = /<meta property="article:published_time" content="([^"]+)"/.exec(head)?.[1]
      expect(published, path).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(html, path).toContain(`<time datetime="${published}"`)
      const alternates = [...head.matchAll(/<link rel="alternate" hreflang="(pt-BR|en)" href="([^"]+)"/g)]
      if (alternates.length > 0) {
        expect(alternates.map((match) => match[2])).toContain(`${SITE}${path}`)
        for (const [, , href] of alternates) {
          const other = await (await request.get((href ?? '').replace(SITE, ''))).text()
          expect(other, `${href} aponta de volta para ${path}`).toContain(`hreflang="${path.startsWith('/en/') ? 'en' : 'pt-BR'}" href="${SITE}${path}"`)
        }
      }
    }
  })

  test('links internos dos artigos e notas resolvem (sem 404) e âncoras existem', async ({ page, request }) => {
    const checked = new Map<string, number>()
    for (const path of await entryPaths(request)) {
      await page.goto(path)
      const { links, ids } = await page.evaluate(() => ({
        links: [...document.querySelectorAll<HTMLAnchorElement>('main a[href]')].map((a) => a.getAttribute('href') ?? ''),
        ids: [...document.querySelectorAll('[id]')].map((el) => el.id),
      }))
      for (const href of links) {
        if (href.startsWith('#')) {
          expect(ids, `${path} → ${href}`).toContain(decodeURIComponent(href.slice(1)))
          continue
        }
        const internal = href.startsWith('/') ? href : href.startsWith(SITE) ? href.slice(SITE.length) : null
        if (!internal || internal.startsWith('/rss/')) continue
        if (!checked.has(internal)) checked.set(internal, (await request.get(internal)).status())
        expect(checked.get(internal), `${path} → ${internal}`).toBe(200)
      }
    }
    expect(checked.size).toBeGreaterThan(5)
  })

  test('relação artigo ↔ projeto nos dois sentidos quando declarada', async ({ page, request }) => {
    // Nenhum texto publicado declara projeto hoje (a regra é testada em unidade); o laço cobre o futuro.
    for (const path of await entryPaths(request)) {
      await page.goto(path)
      const related = page.getByRole('region', { name: /Projetos relacionados|Related projects/ })
      if ((await related.count()) === 0) continue
      for (const href of await related.getByRole('link').evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''))) {
        await page.goto(href)
        await expect(page.getByRole('region', { name: /Escrita relacionada|Related writing/ }).locator(`a[href="${path}"]`)).toBeVisible()
      }
    }
  })
})

test.describe('Escrita', () => {
  test('filtros por assunto são links HTML para páginas prerenderizadas (sem JS)', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/escrita/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Escrita')
    const topics = page.getByRole('navigation', { name: 'Assuntos' })
    await expect(topics.getByRole('link', { name: /Todos/ })).toHaveAttribute('aria-current', 'page')
    const total = await page.locator('.writing-list > li').count()
    await topics.getByRole('link', { name: /Hackathon/ }).click()
    await expect(page).toHaveURL(/\/escrita\/assunto\/hackathon\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Escrita sobre Hackathon')
    await expect(page.getByRole('navigation', { name: 'Assuntos' }).getByRole('link', { name: /Hackathon/ })).toHaveAttribute('aria-current', 'page')
    const filtered = await page.locator('.writing-list > li').count()
    expect(filtered).toBeGreaterThan(0)
    expect(filtered).toBeLessThan(total)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}/escrita/assunto/hackathon/`)
    await context.close()
  })

  test('assunto inexistente é 404', async ({ request }) => {
    expect((await request.get('/escrita/assunto/nao-existe/')).status()).toBe(404)
  })

  test('artigo longo: sumário, datas e tempo de leitura; prosa a 18 px/1,7 com 62–68 caracteres por linha', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/escrita/github-actions-como-fazer-deploy/')
    await expect(page.getByRole('navigation', { name: 'Neste texto' }).getByRole('link')).toHaveCount(9)
    await expect(page.locator('.entry-meta')).toContainText('Publicado em')
    await expect(page.locator('.entry-meta')).toContainText('6 min')
    const metrics = await page.locator('.prose').evaluate(async (prose) => {
      await document.fonts.ready
      const style = getComputedStyle(prose)
      const paragraph = prose.querySelector('p')?.textContent ?? ''
      const context = document.createElement('canvas').getContext('2d')!
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      const average = context.measureText(paragraph).width / paragraph.length
      return { fontSize: style.fontSize, lineHeight: parseFloat(style.lineHeight) / parseFloat(style.fontSize), chars: prose.clientWidth / average }
    })
    expect(metrics.fontSize).toBe('18px')
    expect(metrics.lineHeight).toBeCloseTo(1.7, 2)
    expect(metrics.chars).toBeGreaterThanOrEqual(62)
    expect(metrics.chars).toBeLessThanOrEqual(68)
  })

  test('linha de progresso é decorativa e some com reduced motion', async ({ browser }) => {
    for (const reducedMotion of ['reduce', 'no-preference'] as const) {
      const context = await browser.newContext({ reducedMotion })
      const page = await context.newPage()
      await page.goto('/escrita/github-actions-como-fazer-deploy/')
      const bar = page.locator('.reading-progress')
      await expect(bar).toHaveAttribute('aria-hidden', 'true')
      const display = await bar.evaluate((el) => getComputedStyle(el).display)
      expect(display).toBe(reducedMotion === 'reduce' ? 'none' : 'block')
      await context.close()
    }
  })

  test('blocos de código roláveis recebem foco por teclado', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/escrita/github-actions-como-fazer-deploy/')
    const pre = page.locator('.code-block pre').first()
    await expect(pre).toHaveAttribute('tabindex', '0')
    const scrolls = await pre.evaluate((el) => el.scrollWidth > el.clientWidth)
    expect(scrolls).toBe(true)
  })
})

test.describe('comentários (Giscus)', () => {
  async function trackGiscus(page: Page) {
    const requests: string[] = []
    // Nenhuma rede real: o client do Giscus é substituído por um script vazio.
    await page.route('https://giscus.app/**', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }))
    page.on('request', (req) => {
      if (req.url().startsWith('https://giscus.app')) requests.push(req.url())
    })
    return requests
  }

  test('nada de terceiros até o clique; depois, termo do caminho antigo', async ({ page }) => {
    const requests = await trackGiscus(page)
    await page.goto('/escrita/github-actions-como-fazer-deploy/')
    await page.getByRole('heading', { name: 'Comentários' }).scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    expect(requests).toEqual([])
    await page.getByRole('button', { name: 'Carregar comentários' }).click()
    await expect.poll(() => requests.length).toBe(1)
    const script = page.locator('script[src="https://giscus.app/client.js"]')
    await expect(script).toHaveAttribute('data-mapping', 'specific')
    await expect(script).toHaveAttribute('data-term', 'blog/github-actions-como-fazer-deploy/')
    await expect(page.locator('.giscus')).toBeFocused()
  })

  test('nota e artigo em inglês usam os termos antigos de /til/ e /en/blog/', async ({ page }) => {
    await trackGiscus(page)
    await page.goto('/notas/docker-healthcheck-para-servicos/')
    await page.getByRole('button', { name: 'Carregar comentários' }).click()
    await expect(page.locator('script[src="https://giscus.app/client.js"]')).toHaveAttribute('data-term', 'til/docker-healthcheck-para-servicos/')
    await page.goto('/en/writing/github-actions-como-fazer-deploy/')
    await page.getByRole('button', { name: 'Load comments' }).click()
    await expect(page.locator('script[src="https://giscus.app/client.js"]')).toHaveAttribute('data-term', 'en/blog/github-actions-como-fazer-deploy/')
  })

  test('sem JS: texto e link para a discussão no GitHub, sem botão inerte', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/escrita/github-actions-como-fazer-deploy/')
    await expect(page.getByRole('button', { name: 'Carregar comentários' })).toHaveCount(0)
    const link = page.getByRole('link', { name: 'Procurar a discussão no GitHub' })
    await expect(link).toHaveAttribute('href', /^https:\/\/github\.com\/whoisclebs\/whoisclebs\.com\/discussions\?discussions_q=/)
    await context.close()
  })
})

test.describe('home: ritmo editorial', () => {
  test('o que eu faço e a história na aurora; projetos, agentes e escrita no dia; Agora datado', async ({ page }) => {
    await page.goto('/')
    const aurora = page.locator('[data-band="aurora"]')
    await expect(aurora.getByRole('heading', { level: 3 })).toHaveText(['Sistemas distribuídos', 'Backend de alta performance', 'IA agêntica'])
    await expect(aurora.getByRole('heading', { level: 2 })).toHaveText(['O que eu faço', 'Como cheguei aqui'])
    await expect(page.locator('section.manifesto')).toHaveCount(0)
    // Ordem dos capítulos (passo 15): hero → o que eu faço → história → projetos → agentes → escrita.
    const order = await page.locator('main h2').allTextContents()
    const expected = ['O que eu faço', 'Como cheguei aqui', 'Projetos', 'Agentes de IA', 'Escrita e notas']
    expect(expected.map((title) => order.indexOf(title))).toEqual([...expected.map((title) => order.indexOf(title))].sort((x, y) => x - y))
    expect(order.indexOf('O que eu faço')).toBeGreaterThanOrEqual(0)
    const rows = page.locator('.writing .writing-list > li')
    await expect(rows).toHaveCount(5)
    await expect(rows.first().locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/)
    await expect(page.getByRole('region', { name: 'Agora' }).locator('time')).toHaveAttribute('datetime', '2026-07-02')
  })
})

test.describe('axe-core nas rotas novas', () => {
  const routes = [
    '/escrita/',
    '/escrita/assunto/hackathon/',
    '/escrita/github-actions-como-fazer-deploy/',
    '/notas/',
    '/notas/docker-healthcheck-para-servicos/',
    '/en/writing/',
    '/en/writing/github-actions-como-fazer-deploy/',
  ]
  for (const scheme of ['light', 'dark'] as const) {
    for (const path of routes) {
      test(`sem violações critical/serious em ${path} (${scheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme })
        await page.goto(path)
        const results = await new AxeBuilder({ page }).analyze()
        const blocking = results.violations
          .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
          .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
        expect(blocking).toEqual([])
      })
    }
  }
})
