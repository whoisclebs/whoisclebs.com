import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Browser, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'

/**
 * "v1, só que melhor": depois do hero, um céu noturno índigo (estrelas, via láctea que gira com a
 * rolagem) com a arquitetura logo abaixo do hero, passagem contínua para a noite do farol no rodapé (ilha
 * canvas) e o ciclo do farol na 404, legível em qualquer hora sem véu nem halo.
 *
 * O contraste é medido nos pixels reais: o texto fica transparente, a página é fotografada e cada caixa de
 * linha (Range.getClientRects) é comparada com o pixel mais claro (texto claro) ou mais escuro (texto escuro)
 * atrás dela. Na jornada usa-se o percentil 99,5 porque as estrelas são pontos de 1–2 px, não fundo de leitura;
 * no rodapé, 98, porque a própria ilustração tem estrelas pintadas de 3–4 px que caem atrás de rótulos curtos
 * (a camada animada já desvia as dela do texto); na 404 vale o pixel extremo.
 */

test.use({ timezoneId: 'America/Fortaleza' })


function luminance(r: number, g: number, b: number) {
  const lin = (c: number) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/**
 * O `wrangler dev` serve os assets sem Range nem Content-Length, e o Chrome trata o vídeo como fluxo sem busca.
 * Para parar o ciclo num instante fixo, o teste serve o arquivo do build com Range (como o CDN em produção).
 */
async function serveVideoWithRanges(page: Page) {
  await page.route(/\/media\/farol-ciclo\.(webm|mp4)$/, async (route) => {
    const file = new URL(route.request().url()).pathname.endsWith('.webm') ? 'webm' : 'mp4'
    const body = readFileSync(`static/media/farol-ciclo.${file}`)
    const type = file === 'webm' ? 'video/webm' : 'video/mp4'
    const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers()['range'] ?? '')
    if (!range) return route.fulfill({ status: 200, body, headers: { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': String(body.length) } })
    const start = Number(range[1])
    const end = range[2] ? Number(range[2]) : body.length - 1
    return route.fulfill({
      status: 206,
      body: body.subarray(start, end + 1),
      headers: { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${body.length}`, 'content-length': String(end - start + 1) },
    })
  })
}

type Box = { x: number; y: number; w: number; h: number; color: string; label: string }

/** Menor contraste entre as linhas de texto dos seletores e o fundo real, dentro da viewport (e de `clip`). */
async function worstContrast(page: Page, selectors: string[], options: { percentile?: number; clip?: string; skipBrightBackground?: number } = {}) {
  const boxes = await page.evaluate(
    ({ list, clip }) => {
      const limit = clip ? document.querySelector(clip)!.getBoundingClientRect() : { top: 0, bottom: innerHeight }
      const out: Box[] = []
      for (const selector of list) {
        for (const el of document.querySelectorAll<HTMLElement>(selector)) {
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (!node.textContent?.trim()) continue
            const range = document.createRange()
            range.selectNodeContents(node)
            for (const r of range.getClientRects()) {
              const top = Math.max(r.top, limit.top, 0)
              const bottom = Math.min(r.bottom, limit.bottom, innerHeight)
              if (bottom - top < 4 || r.width < 2) continue
              out.push({ x: r.left, y: top, w: r.width, h: bottom - top, color: getComputedStyle(node.parentElement!).color, label: selector })
            }
          }
        }
      }
      return out
    },
    { list: selectors, clip: options.clip },
  )
  expect(boxes.length).toBeGreaterThan(0)
  const hide = await page.addStyleTag({
    content: `${selectors.map((s) => `${s}, ${s} *`).join(', ')} { color: transparent !important; text-decoration-color: transparent !important; transition: none !important; }`,
  })
  await page.waitForTimeout(80)
  const png = await page.screenshot()
  await hide.evaluate((el) => (el as Element).remove())
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const percentile = options.percentile ?? 1
  let worst = { ratio: Infinity, label: '' }
  for (const box of boxes) {
    const values: number[] = []
    for (let y = Math.max(0, Math.floor(box.y)); y < Math.min(info.height, Math.ceil(box.y + box.h)); y += 1) {
      for (let x = Math.max(0, Math.floor(box.x)); x < Math.min(info.width, Math.ceil(box.x + box.w)); x += 1) {
        const i = (y * info.width + x) * 3
        values.push(luminance(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0))
      }
    }
    if (!values.length) continue
    values.sort((a, b) => a - b)
    // Fundo claro de propósito (a torre branca do farol no rodapé, decisão de design): a linha sai da conta.
    // Critério: mais de 1 % dos pixels atrás da linha acima do limite (a linha cruza a torre; uma estrela pintada
    // tem ~12 px e não chega a isso).
    if (options.skipBrightBackground !== undefined && values[Math.floor(values.length * 0.99)]! > options.skipBrightBackground) continue
    const [r, g, b] = box.color.match(/\d+/g)!.slice(0, 3).map(Number) as [number, number, number]
    const text = luminance(r, g, b)
    const light = values[Math.min(values.length - 1, Math.floor(values.length * percentile))]!
    const dark = values[Math.floor(values.length * (1 - percentile))]!
    const ratio = text > light ? (text + 0.05) / (light + 0.05) : (dark + 0.05) / (text + 0.05)
    if (ratio < worst.ratio) worst = { ratio, label: `${box.label} @${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.w)}×${Math.round(box.h)} ${box.color}` }
  }
  return worst
}

async function reducedContext(browser: Browser, width: number) {
  return browser.newContext({ reducedMotion: 'reduce', viewport: { width, height: width < 700 ? 844 : 900 }, deviceScaleFactor: 1 })
}

test.describe('jornada escura da home', () => {
  test('a via láctea gira com a rolagem (scroll-driven) e fica parada com movimento reduzido', async ({ page, browser }) => {
    await page.goto('/')
    const light = page.locator('.journey__light')
    const style = await light.evaluate((el) => {
      const cs = getComputedStyle(el) as CSSStyleDeclaration & { animationTimeline?: string }
      return { name: cs.animationName, timeline: cs.animationTimeline }
    })
    // O Svelte prefixa o nome dos keyframes com o hash do componente.
    expect(style.name).toMatch(/sky-turn$/)
    expect(style.timeline).toBe('--journey')
    const transformAt = async (fraction: number) => {
      await page.evaluate((f) => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), fraction)
      await page.waitForTimeout(150)
      return light.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42)
    }
    const early = await transformAt(0.2)
    const late = await transformAt(0.7)
    expect(late).toBeLessThan(early)

    const context = await reducedContext(browser, 1440)
    const reduced = await context.newPage()
    await reduced.goto('/')
    expect(await reduced.locator('.journey__light').evaluate((el) => getComputedStyle(el).animationName)).toBe('none')
    await context.close()
  })

  for (const width of [390, 1440]) {
    test(`contraste AA do texto sobre o céu com a via láctea (${width} px)`, async ({ browser }) => {
      const context = await reducedContext(browser, width)
      const page = await context.newPage()
      await page.goto('/')
      const sections = ['#arquitetura', '.story', '.projects', '.agents-call', '.now', '.writing']
      for (const section of sections) {
        await page.locator(section).first().evaluate((el) => el.scrollIntoView({ block: 'start' }))
        await page.waitForTimeout(100)
        const worst = await worstContrast(page, [`${section} h2`, `${section} h3`, `${section} p:not(.mark)`, `${section} li`, `${section} dd`, `${section} dt`], { percentile: 0.995 })
        console.log(`${width} px ${section}: ${worst.ratio.toFixed(2)}:1 (${worst.label})`)
        expect(worst.ratio, `${section} ${worst.label}`).toBeGreaterThanOrEqual(4.5)
      }
      await context.close()
    })
  }

  test('arquitetura: três frentes com problema, entrega e evidência pública; convite para conversar', async ({ page }) => {
    await page.goto('/')
    const offer = page.locator('#arquitetura')
    await expect(offer.locator('.offer__item')).toHaveCount(3)
    for (const label of ['O problema', 'O que entrego', 'Evidência pública']) await expect(offer.getByText(label, { exact: true })).toHaveCount(3)
    const evidence = await offer.locator('.offer__item .offer__part:last-child a').evaluateAll((links) => links.map((a) => a.getAttribute('href')))
    expect(evidence).toEqual(['/projetos/tuxedo/', '/projetos/golpher/', '/agentes/'])
    await expect(offer.getByRole('link', { name: 'Conversar sobre um projeto' })).toHaveAttribute('href', '/contato/')
    // A seção vem logo depois do hero, e a navegação leva a ela.
    const firstChapter = await page.locator('main h2').first().textContent()
    expect(firstChapter).toBe('Arquitetura')
    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Arquitetura' }).click()
    await expect(page).toHaveURL(/#arquitetura$/)
  })

  test('linhas-alvo: cantos e fio no foco do teclado, sem animação de deslocamento com movimento reduzido', async ({ page }) => {
    await page.goto('/')
    const link = page.locator('.project .project__name a').first()
    await link.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    const row = page.locator('.project').first()
    await expect.poll(() => row.evaluate((el) => getComputedStyle(el, '::before').opacity)).toBe('1')
    expect(await row.evaluate((el) => getComputedStyle(el, '::after').transitionProperty)).toBe('transform')
  })
})

test.describe('rodapé: a noite do farol', () => {
  test('sem JS: só a imagem (AVIF/WebP), sem camada animada', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/sobre/')
    const image = page.locator('footer .scene__image')
    await image.scrollIntoViewIfNeeded()
    await expect(image).toBeVisible()
    await expect(image).toHaveAttribute('alt', '')
    await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
    await expect(page.locator('footer source[type="image/avif"]')).toHaveAttribute('srcset', /footer-night-960\.avif 960w/)
    await expect(page.locator('footer .sky')).not.toHaveAttribute('data-scene', /.+/)
    await context.close()
  })

  test('com movimento: a ilha só carrega perto do rodapé, roda visível e pausa fora da tela', async ({ page }) => {
    const chunks: string[] = []
    page.on('response', (response) => {
      if (/\/_app\/immutable\/chunks\/.*\.js$/.test(response.url())) chunks.push(response.url())
    })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(String(error)))
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))
    await page.goto('/sobre/', { waitUntil: 'load' })
    const sky = page.locator('footer .sky')
    await expect(sky).not.toHaveAttribute('data-scene', /.+/)
    const before = chunks.length
    await sky.scrollIntoViewIfNeeded()
    await expect(sky).toHaveAttribute('data-scene', 'running')
    expect(chunks.length).toBeGreaterThan(before)
    // A lâmpada acende no canvas: há pixels desenhados perto dela.
    const painted = await page.locator('footer .sky__layer').evaluate((canvas: HTMLCanvasElement) => {
      const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data
      let sum = 0
      for (let i = 3; i < data.length; i += 4 * 53) sum += data[i] ?? 0
      return sum
    })
    expect(painted).toBeGreaterThan(0)
    await page.evaluate(() => scrollTo(0, 0))
    await expect(sky).toHaveAttribute('data-scene', 'paused')
    expect(errors).toEqual([])
  })

  test('movimento reduzido: um quadro estático, facho parado e nenhum erro', async ({ browser }) => {
    const context = await reducedContext(browser, 1440)
    const page = await context.newPage()
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(String(error)))
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))
    await page.goto('/')
    const sky = page.locator('footer .sky')
    await sky.scrollIntoViewIfNeeded()
    await expect(sky).toHaveAttribute('data-scene', 'static')
    const snapshot = () => page.locator('footer .sky__layer').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL().length)
    const first = await snapshot()
    await page.waitForTimeout(600)
    expect(await snapshot()).toBe(first)
    // Na home a jornada já termina no tom do céu do farol: sem faixa de anoitecer (nem corte).
    expect(await page.locator('footer .dusk').evaluate((el) => getComputedStyle(el).display)).toBe('none')
    expect(errors).toEqual([])
    await context.close()
  })

  for (const width of [390, 1440]) {
    test(`texto direto no céu com contraste AA (${width} px)`, async ({ browser }) => {
      const context = await reducedContext(browser, width)
      const page = await context.newPage()
      await page.goto('/sobre/')
      const image = page.locator('footer .scene__image')
      await image.scrollIntoViewIfNeeded()
      await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
      await expect(page.locator('footer .sky')).toHaveAttribute('data-scene', 'static')
      // Cada pedaço do rodapé na viewport, do convite à atividade, com o facho parado e as estrelas desenhadas.
      for (const part of ['.invite', '.col--contact', '.col--read', '.colophon']) {
        await page.locator(`footer ${part}`).evaluate((el) => el.scrollIntoView({ block: 'center' }))
        await page.waitForTimeout(100)
        // Decisão de design: o texto do rodapé pode passar por cima do farol. As linhas com o
        // fundo claro (mais de 1 % dos pixels acima de 0,45 de luminância: a linha cruza a torre branca) não entram na conta; todo o texto sobre o céu, sim.
        const worst = await worstContrast(page, [`footer ${part} h2`, `footer ${part} p`, `footer ${part} li`, `footer ${part} a`], { percentile: 0.98, skipBrightBackground: 0.45 })
        console.log(`${width} px rodapé ${part}: ${worst.ratio.toFixed(2)}:1`)
        expect(worst.ratio, `${part} ${worst.label}`).toBeGreaterThanOrEqual(4.5)
      }
      await context.close()
    })
  }
})

test.describe('404: o ciclo do farol', () => {
  test('status 404 real, vídeo mudo em loop, inline e escondido de leitores de tela', async ({ page }) => {
    const response = await page.goto('/nao-existe-mesmo/')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('404')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Página não encontrada')
    await expect(page.getByText(/Cabo Branco, na Ponta do Seixas/)).toBeVisible()
    const nav = page.getByRole('navigation', { name: 'Para onde ir' })
    await expect(nav.getByRole('link')).toHaveText(['Voltar para o início', 'Projetos', 'Escrita'])
    const video = page.locator('.nf video')
    await expect(video).toHaveCount(1)
    await expect(page.locator('.nf')).toHaveAttribute('data-video', 'playing', { timeout: 15_000 })
    const attrs = await video.evaluate((el: HTMLVideoElement) => ({
      muted: el.muted,
      loop: el.loop,
      playsInline: el.playsInline,
      hidden: el.getAttribute('aria-hidden'),
      controls: el.controls,
      mutedAttr: el.hasAttribute('muted'),
      inlineAttr: el.hasAttribute('playsinline'),
    }))
    expect(attrs).toEqual({ muted: true, loop: true, playsInline: true, hidden: 'true', controls: false, mutedAttr: true, inlineAttr: true })
    // Ciclo lento: 40–60 s por volta.
    const duration = await video.evaluate((el: HTMLVideoElement) => el.duration)
    expect(duration).toBeGreaterThanOrEqual(40)
    expect(duration).toBeLessThanOrEqual(60)
  })

  test('movimento reduzido: só o pôster da noite, nenhum byte de vídeo', async ({ browser }) => {
    const context = await reducedContext(browser, 1440)
    const page = await context.newPage()
    const media: string[] = []
    page.on('request', (request) => /farol-ciclo\.(webm|mp4)/.test(request.url()) && media.push(request.url()))
    const response = await page.goto('/nao-existe-mesmo/', { waitUntil: 'load' })
    expect(response?.status()).toBe(404)
    await expect(page.locator('.nf')).toHaveAttribute('data-video', 'poster')
    await expect(page.locator('.nf__poster')).toBeVisible()
    await page.waitForTimeout(800)
    await expect(page.locator('.nf video')).toHaveCount(0)
    expect(media).toEqual([])
    await context.close()
  })

  test('saveData: só o pôster', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true }))
    await page.goto('/nao-existe-mesmo/', { waitUntil: 'load' })
    await expect(page.locator('.nf')).toHaveAttribute('data-video', 'poster')
    await expect(page.locator('.nf video')).toHaveCount(0)
  })

  for (const width of [390, 1440]) {
    test(`legível em qualquer hora do ciclo, sem véu nem halo (${width} px)`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: width < 700 ? 844 : 900 }, deviceScaleFactor: 1 })
      const page = await context.newPage()
      await serveVideoWithRanges(page)
      await page.goto('/nao-existe-mesmo/', { waitUntil: 'load' })
      await expect(page.locator('.nf')).toHaveAttribute('data-video', 'playing', { timeout: 15_000 })
      // Nada de halo borrado atrás do texto.
      expect(await page.locator('.nf__copy').evaluate((el) => getComputedStyle(el, '::before').content)).toBe('none')
      // "404" e subtítulo: creme com contorno fino por fora e sombra dura curta (sem desfoque).
      for (const [selector, minStroke] of [['.nf__code', 1.5], ['.nf__name', 1]] as const) {
        const style = await page.locator(selector).evaluate((el) => {
          const cs = getComputedStyle(el) as CSSStyleDeclaration & { webkitTextStrokeWidth: string; paintOrder: string }
          return { stroke: parseFloat(cs.webkitTextStrokeWidth), paint: cs.paintOrder, shadow: cs.textShadow }
        })
        expect(style.stroke, selector).toBeGreaterThanOrEqual(minStroke)
        expect(style.paint).toMatch(/^stroke/)
        expect(style.shadow).toMatch(/px \d+px 0px$/)
      }
      // Um instante de cada hora (noite, amanhecer, dia, entardecer): o parágrafo na etiqueta e os botões são
      // sólidos, então o contraste é medido sobre eles mesmos.
      for (const [seconds, sky] of [[1, 'night'], [8, 'dawn'], [20, 'day'], [28, 'dusk']] as const) {
        await page.locator('.nf video').evaluate(async (el: HTMLVideoElement, t) => {
          el.pause()
          el.currentTime = t
          await new Promise((resolve) => el.addEventListener('seeked', resolve, { once: true }))
        }, seconds)
        await expect(page.locator('.nf')).toHaveAttribute('data-sky', sky)
        await page.waitForTimeout(300)
        const worst = await worstContrast(page, ['.nf__text', '.nf__links a'], { clip: '.nf' })
        console.log(`${width} px 404 t=${seconds}s (${sky}): etiqueta e botões ${worst.ratio.toFixed(2)}:1`)
        expect(worst.ratio, `t=${seconds}s ${worst.label}`).toBeGreaterThanOrEqual(4.5)
      }
      await context.close()
    })
  }
})

test.describe('axe: home com a jornada, rodapé com a cena e 404', () => {
  for (const path of ['/', '/en/', '/sobre/', '/nao-existe-mesmo/']) {
    test(`sem violações critical/serious em ${path}`, async ({ page }) => {
      await page.goto(path)
      // A 404 não tem rodapé ; nas outras rotas o axe roda com o rodapé em vista.
      if (await page.locator('footer').count()) await page.locator('footer').scrollIntoViewIfNeeded()
      await page.waitForTimeout(300)
      const results = await new AxeBuilder({ page }).analyze()
      const blocking = results.violations
        .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
        .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
      expect(blocking).toEqual([])
    })
  }
})
