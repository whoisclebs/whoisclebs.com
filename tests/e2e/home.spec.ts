import { expect, test, type Page } from '@playwright/test'
import { contrastOverPixels, serveVideoWithRanges } from './helpers'

/**
 * Home do Grafite Editorial: hero em vídeo pintado num <canvas> (chuva, ou o cometa por easter egg), laptop
 * clicável, Últimos artigos com filtro por assunto e a ordem das seções. O H1 é o LCP; o vídeo só entra depois
 * do load e nunca com movimento reduzido ou economia de dados.
 */

const RAIN_VIDEO = /\/media\/hero-rain-v1\.(webm|mp4)/
const COMET_MEDIA = /\/media\/hero-comet-v1(-poster\.webp|\.webm|\.mp4)/

/** A cena do hero (decorativa): é ela que diz se a mídia já chegou ao canvas. */
const scene = (page: Page) => page.locator('section.hero [data-scene]')

/** Grava a escolha do cometa antes de qualquer script da página (como o easter egg faria). */
async function preferComet(page: Page) {
  await page.addInitScript(() => localStorage.setItem('whoisclebs.hero', 'comet'))
}

test.describe('hero', () => {
  test('sem <video> nem <img> grande visível; o vídeo entra depois do load, é copiado para o canvas e o LCP é o H1', async ({ page }) => {
    const media: { url: string; at: number }[] = []
    page.on('request', (request) => {
      if (RAIN_VIDEO.test(request.url())) media.push({ url: request.url(), at: Date.now() })
    })
    await page.addInitScript(() => {
      const w = window as unknown as { __lcp: string[] }
      w.__lcp = []
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & { element?: Element | null })[]) {
          // O H1 tem uma linha por <span>: o candidato pode ser a linha, que conta como o H1.
          const el = entry.element
          w.__lcp.push(el ? (el.closest('h1') ? 'H1' : el.tagName) : 'desconhecido')
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    })
    await page.goto('/', { waitUntil: 'load' })
    const loadedAt = Date.now()
    // No HTML não há mídia: nada é pedido antes do load.
    expect(media).toHaveLength(0)
    await expect(scene(page)).toHaveAttribute('data-mode', 'video', { timeout: 10_000 })
    await expect(scene(page)).toHaveAttribute('data-shown', 'true', { timeout: 10_000 })
    expect(media.length).toBeGreaterThan(0)
    expect(media.every((request) => request.at >= loadedAt)).toBe(true)

    // O <video> é só a fonte dos quadros: mudo, em loop, sem controles, escondido e com 1 px.
    const video = page.locator('section.hero video')
    await expect(video).toHaveCount(1)
    const attrs = await video.evaluate((el: HTMLVideoElement) => ({
      muted: el.muted,
      loop: el.loop,
      playsInline: el.playsInline,
      preload: el.getAttribute('preload'),
      hidden: el.getAttribute('aria-hidden'),
      controls: el.controls,
      paused: el.paused,
    }))
    expect(attrs).toEqual({ muted: true, loop: true, playsInline: true, preload: 'none', hidden: 'true', controls: false, paused: false })

    // Nenhuma mídia grande à vista dentro do hero: o que se vê é o canvas.
    const visibleMedia = await page.locator('section.hero').evaluate((hero) =>
      [...hero.querySelectorAll('video, img')]
        .map((el) => el.getBoundingClientRect())
        .filter((rect) => rect.width * rect.height > 4)
        .map((rect) => `${Math.round(rect.width)}×${Math.round(rect.height)}`),
    )
    expect(visibleMedia).toEqual([])

    // Os quadros do vídeo chegam ao canvas: o desenho muda com o tempo (o pôster sozinho ficaria parado).
    const fingerprint = () =>
      page.locator('section.hero canvas').evaluate((el: HTMLCanvasElement) => {
        const pixels = el.getContext('2d')!.getImageData(0, 0, el.width, el.height).data
        let sum = 0
        for (let i = 0; i < pixels.length; i += 4 * 97) sum += (pixels[i] ?? 0) + (pixels[i + 1] ?? 0) * 3 + (pixels[i + 2] ?? 0) * 7
        return sum
      })
    const first = await fingerprint()
    expect(first).toBeGreaterThan(0)
    await expect.poll(fingerprint, { timeout: 5_000 }).not.toBe(first)

    await page.waitForTimeout(1000)
    const lcp = await page.evaluate(() => (window as unknown as { __lcp: string[] }).__lcp)
    expect(lcp.length).toBeGreaterThan(0)
    expect(lcp.at(-1)).toBe('H1')
    for (const tag of ['VIDEO', 'IMG', 'CANVAS']) expect(lcp).not.toContain(tag)
  })

  test('movimento reduzido: só o pôster no canvas, nenhum byte de vídeo', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    const media: string[] = []
    page.on('request', (request) => {
      if (/\/media\/hero-.*\.(webm|mp4)/.test(request.url())) media.push(request.url())
    })
    await page.goto('/', { waitUntil: 'load' })
    await expect(scene(page)).toHaveAttribute('data-mode', 'poster', { timeout: 10_000 })
    await expect(scene(page)).toHaveAttribute('data-shown', 'true')
    await page.waitForTimeout(1000)
    await expect(page.locator('section.hero video')).toHaveCount(0)
    expect(media).toEqual([])
    await context.close()
  })

  test('saveData: só o pôster, nenhum byte de vídeo', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true }))
    const media: string[] = []
    page.on('request', (request) => {
      if (/\/media\/hero-.*\.(webm|mp4)/.test(request.url())) media.push(request.url())
    })
    await page.goto('/', { waitUntil: 'load' })
    await expect(scene(page)).toHaveAttribute('data-mode', 'poster', { timeout: 10_000 })
    await expect(scene(page)).toHaveAttribute('data-shown', 'true')
    await page.waitForTimeout(1000)
    expect(media).toEqual([])
  })

  // Celular, tablet em pé, tablet deitado e desktop: o véu muda em 1280 px (chuva e cometa) e em 960 px (cometa).
  const viewports = [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
  ]
  for (const sceneName of ['rain', 'comet'] as const) {
    for (const viewport of viewports) {
      test(`contraste AA do H1 e do apoio sobre o pôster (${sceneName}, ${viewport.width} px)`, async ({ browser }) => {
        // O pôster é um quadro do vídeo; com movimento reduzido ele fica parado no canvas, por baixo do véu.
        const context = await browser.newContext({ reducedMotion: 'reduce', viewport, deviceScaleFactor: 1 })
        const page = await context.newPage()
        if (sceneName === 'comet') await preferComet(page)
        await page.goto('/', { waitUntil: 'load' })
        await expect(scene(page)).toHaveAttribute('data-scene', sceneName)
        await expect(scene(page)).toHaveAttribute('data-shown', 'true', { timeout: 10_000 })
        await page.waitForTimeout(1200) // fim do fade de opacidade do canvas
        const result = await contrastOverPixels(page, { h1: '.hero__title', apoio: '.hero__support', rótulo: '.hero__eyebrow' })
        for (const [name, contrast] of Object.entries(result)) {
          console.log(`${sceneName} ${viewport.width} px ${name}: ${contrast.toFixed(2)}:1 atrás do texto (p99)`)
          expect(contrast, name).toBeGreaterThanOrEqual(4.5)
        }
        await context.close()
      })
    }
  }

  for (const viewport of [{ width: 390, height: 844 }, { width: 1024, height: 768 }, { width: 1440, height: 900 }]) {
    test(`contraste AA do H1 e do apoio durante o loop da chuva (${viewport.width} px)`, async ({ browser }) => {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1 })
      const page = await context.newPage()
      // Com Range o vídeo é buscável: cada instante do loop chega ao canvas enquanto ele toca.
      await serveVideoWithRanges(page, 'hero-rain-v1')
      await page.goto('/', { waitUntil: 'load' })
      await expect(scene(page)).toHaveAttribute('data-mode', 'video', { timeout: 10_000 })
      await expect(scene(page)).toHaveAttribute('data-shown', 'true', { timeout: 10_000 })
      // A chuva em CSS (fios de 1 px) é decorativa e se move: fica fora da foto para a medida ser do vídeo.
      await page.addStyleTag({ content: '.scene__rain { display: none !important; }' })
      const video = page.locator('section.hero video')
      await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.duration)).toBeGreaterThan(1)
      const duration = await video.evaluate((el: HTMLVideoElement) => el.duration)
      for (const fraction of [0.05, 0.25, 0.5, 0.75, 0.95]) {
        await video.evaluate(async (el: HTMLVideoElement, t) => {
          el.currentTime = t
          await new Promise((resolve) => el.addEventListener('seeked', resolve, { once: true }))
        }, duration * fraction)
        await page.waitForTimeout(250)
        const result = await contrastOverPixels(page, { h1: '.hero__title', apoio: '.hero__support' })
        for (const [name, contrast] of Object.entries(result)) {
          console.log(`chuva ${viewport.width} px t≈${(duration * fraction).toFixed(1)} s ${name}: ${contrast.toFixed(2)}:1`)
          expect(contrast, `${name} em t≈${(duration * fraction).toFixed(1)} s`).toBeGreaterThanOrEqual(4.5)
        }
      }
      await context.close()
    })
  }

  test('a cena do cometa salva no navegador é a que carrega', async ({ page }) => {
    await preferComet(page)
    const comet: string[] = []
    page.on('request', (request) => {
      if (COMET_MEDIA.test(request.url())) comet.push(request.url())
    })
    await page.goto('/', { waitUntil: 'load' })
    await expect(scene(page)).toHaveAttribute('data-scene', 'comet')
    await expect(scene(page)).toHaveAttribute('data-shown', 'true', { timeout: 10_000 })
    expect(comet.length).toBeGreaterThan(0)
  })

  test('laptop do hero: liga e desliga (aria-pressed) e avisa quando acorda', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    const wake = page.getByRole('button', { name: 'Acordar o laptop' })
    await expect(wake).toHaveAttribute('aria-pressed', 'false')
    await wake.click()
    await expect(wake).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText('A tela acordou.')).toBeVisible()
    // A tela ligada mostra o uptime medido no navegador e um atalho para a seção do terminal.
    await expect(page.getByText(/\d+s sem incidentes/)).toBeVisible()
    await expect(page.getByRole('link', { name: /Abrir o terminal/ })).toHaveAttribute('href', '#terminal')
    await wake.click()
    await expect(wake).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByText(/\d+s sem incidentes/)).toHaveCount(0)
  })

  test('laptop do hero: o texto fica deitado na tela, na perspectiva do vídeo, e acompanha o tamanho do palco', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    const wake = page.getByRole('button', { name: 'Acordar o laptop' })
    await wake.click()
    const line = page.getByText(/\d+s sem incidentes/)
    await expect(line).toBeVisible()
    /** Matriz do plano da tela e a inclinação, em graus, da linha de texto na tela. */
    const measure = () =>
      line.evaluate((el) => {
        const plane = el.closest('.laptop__plane') as HTMLElement
        const range = document.createRange()
        range.selectNodeContents(el)
        const quad = (range as Range & { getClientRects(): DOMRectList }).getClientRects()[0]
        const matrix = new DOMMatrixReadOnly(getComputedStyle(plane).transform)
        // A base do texto no plano é horizontal: leva dois pontos dela pela matriz e mede o ângulo na tela.
        const at = (x: number, y: number) => {
          const point = matrix.transformPoint(new DOMPoint(x, y))
          return [point.x / point.w, point.y / point.w] as const
        }
        const [x0, y0] = at(0, 100)
        const [x1, y1] = at(480, 100)
        return { is3d: !matrix.is2D, perspective: Math.abs(matrix.m14) + Math.abs(matrix.m24), tilt: (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI, width: quad?.width ?? 0 }
      })
    const wide = await measure()
    // Perspectiva de verdade (não só rotação): a matriz tem termos de projeção, e a linha desce para a direita
    // como a borda de cima da tela no vídeo (uns 2°).
    expect(wide.is3d).toBe(true)
    expect(wide.perspective).toBeGreaterThan(0)
    expect(wide.tilt).toBeGreaterThan(0.5)
    expect(wide.tilt).toBeLessThan(6)
    // Outro tamanho de janela, outro palco: a matriz é recalculada e o texto continua na tela.
    await page.setViewportSize({ width: 1100, height: 800 })
    await expect.poll(async () => (await measure()).width).not.toBe(wide.width)
    expect((await measure()).tilt).toBeGreaterThan(0.5)
  })

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
  ]) {
    test(`laptop do hero: não existe em ${viewport.width} px (ali ele fica atrás do título e dos botões)`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')
      await expect(scene(page)).toHaveAttribute('data-shown', 'true', { timeout: 10_000 })
      await expect(page.getByRole('button', { name: 'Acordar o laptop' })).toHaveCount(0)
    })
  }

  test('sem JS: H1, apoio e CTAs; nenhum botão do laptop que não responde', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Entre código,\s*ideias e sistemas\./, { useInnerText: true })
    await expect(page.getByText(/^Escrevo sobre arquitetura de software, pagamentos e IA/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Explorar artigos' })).toHaveAttribute('href', '/escrita/')
    await expect(page.getByRole('link', { name: 'Sobre mim', exact: true })).toHaveAttribute('href', '/sobre/')
    await expect(page.getByRole('button', { name: 'Acordar o laptop' })).toHaveCount(0)
    await context.close()
  })
})

test.describe('Últimos artigos', () => {
  const section = (page: Page) => page.getByRole('region', { name: 'Últimos artigos' })

  test('sem JS aparecem todos os itens, com "Todos" marcado', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/')
    const noJs = await section(page).getByRole('article').count()
    await expect(section(page).getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true')
    await context.close()

    // Com JS e "Todos", a lista é a mesma: o HTML prerenderizado não esconde nada.
    const js = await browser.newContext()
    const full = await js.newPage()
    await full.goto('/')
    await expect(section(full).getByRole('button', { name: 'Todos' })).toBeEnabled()
    expect(noJs).toBeGreaterThan(1)
    await expect(section(full).getByRole('article')).toHaveCount(noJs)
    await js.close()
  })

  test('com JS o filtro por assunto reduz a lista e marca aria-pressed', async ({ page }) => {
    await page.goto('/')
    const all = section(page).getByRole('button', { name: 'Todos' })
    const hackathon = section(page).getByRole('button', { name: 'Hackathon' })
    await expect(hackathon).toBeEnabled()
    const total = await section(page).getByRole('article').count()
    await hackathon.click()
    await expect(hackathon).toHaveAttribute('aria-pressed', 'true')
    await expect(all).toHaveAttribute('aria-pressed', 'false')
    const articles = section(page).getByRole('article')
    await expect.poll(() => articles.count()).toBeLessThan(total)
    expect(await articles.count()).toBeGreaterThan(0)
    // Todo item que sobrou é do assunto escolhido, e o primeiro vira o destaque.
    for (const article of await articles.all()) await expect(article).toContainText('Hackathon')
    await expect(articles.first()).toContainText('Destaque')
    await all.click()
    await expect(articles).toHaveCount(total)
  })
})

test.describe('ritmo da home', () => {
  test('seções na ordem do design: hero, Últimos artigos, Ideias em construção, Terminal, Quem está por aqui', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    const order = await page.getByRole('main').getByRole('heading', { level: 2 }).evaluateAll((headings) => headings.map((h) => (h as HTMLElement).innerText.trim()))
    expect(order).toEqual(['Últimos artigos', 'Ideias em construção', 'Terminal', 'Quem está por aqui'])
    // Projetos: quatro itens, cada um com um link nomeado pelo projeto.
    const projects = page.getByRole('region', { name: 'Ideias em construção' })
    await expect(projects.getByRole('listitem')).toHaveCount(4)
    await expect(projects.getByRole('link', { name: /^Conhecer projeto\s*: / })).toHaveCount(4)
    await expect(projects.getByRole('link', { name: 'Todos os projetos' })).toHaveAttribute('href', '/projetos/')
  })

  test('no celular o título da seção dos aparelhos vira "Aplicativos"', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const order = await page.getByRole('main').getByRole('heading', { level: 2 }).evaluateAll((headings) => headings.map((h) => (h as HTMLElement).innerText.trim()))
    expect(order).toEqual(['Últimos artigos', 'Ideias em construção', 'Aplicativos', 'Quem está por aqui'])
  })

  test('inglês: as mesmas seções, em inglês e com âncoras em inglês', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/en/')
    for (const [id, name] of [
      ['articles', 'Latest articles'],
      ['projects', 'Ideas under construction'],
      ['terminal', 'Terminal'],
      ['about', "Who's around here"],
    ] as const) {
      await expect(page.locator(`section#${id}`).getByRole('heading', { level: 2, name })).toBeVisible()
    }
  })
})
