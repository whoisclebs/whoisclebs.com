import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type Route } from '@playwright/test'
import sharp from 'sharp'
import { activityBody, unavailableBody } from '../fixtures/activity-fixtures.mjs'

/**
 * Passo 15 — "amanhecer por rolagem": faixas noite → aurora → dia → noite, HUD com telemetria real no
 * horizonte do hero, vídeo da luz rasante (nunca o LCP, nunca baixado com movimento reduzido ou saveData),
 * contraste do H1 e do apoio sobre o quadro mais claro, `lang` na navegação pelo cliente.
 */

test.use({ timezoneId: 'America/Fortaleza' })

type Mode = 'fresh' | 'stale' | 'unavailable' | 'abort'

async function mockActivity(page: Page, mode: Mode) {
  await page.route('**/api/activity', async (route: Route) => {
    if (mode === 'abort') return route.abort('failed')
    if (mode === 'unavailable') return route.fulfill({ status: 503, json: unavailableBody })
    return route.fulfill({ status: 200, json: activityBody(mode, new Date()) })
  })
}

const hudItem = (page: Page, key: string) => page.locator(`[data-hud="${key}"]`)

function luminance([r = 0, g = 0, b = 0]: (number | undefined)[]) {
  const lin = (c: number) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

test.describe('faixas do amanhecer', () => {
  test('home: noite no hero, céu índigo com estrelas depois dele, noite do farol no rodapé', async ({ page }) => {
    await mockActivity(page, 'fresh')
    await page.goto('/')
    const bg = (selector: string) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(await bg('section.hero')).toBe('rgb(11, 17, 32)')
    // Céu índigo quase preto, estrelas em SVG e a transição da noite do hero (e para o rodapé) em degradê.
    expect(await bg('[data-band="aurora"]')).toBe('rgb(10, 14, 32)')
    const image = await page.locator('[data-band="aurora"]').evaluate((el) => getComputedStyle(el).backgroundImage)
    expect(image).toContain('linear-gradient')
    expect(image).toContain('circle')
    // O papel só aparece na leitura longa; o corpo continua papel por baixo.
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(236, 238, 241)')
    expect(await bg('footer.site-footer')).toBe('rgb(11, 21, 16)')
  })

  test('páginas internas: topo em noite curta com o fio do horizonte e corpo em papel', async ({ page }) => {
    await page.goto('/escrita/github-actions-como-fazer-deploy/')
    const header = page.locator('header.site-header')
    expect(await header.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(11, 17, 32)')
    expect(await header.evaluate((el) => getComputedStyle(el).borderBottomColor)).toBe('rgb(242, 230, 160)')
    expect(await header.evaluate((el) => el.getBoundingClientRect().height)).toBeLessThan(200)
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(236, 238, 241)')
    // Leitura longa confortável: 18 px / 1,7 no papel.
    const prose = await page.locator('.prose').first().evaluate((el) => ({ size: getComputedStyle(el).fontSize, line: getComputedStyle(el).lineHeight }))
    expect(prose).toEqual({ size: '18px', line: '30.6px' })
  })
})

test.describe('HUD no horizonte', () => {
  test('sem JS: build em texto com link para o commit, link para o GitHub e o resto em "sem dado"', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/')
    const hud = page.getByRole('group', { name: 'Estado do site' })
    await expect(hud).toBeVisible()
    await expect(hud).toHaveAttribute('data-hud-phase', 'nojs')
    const build = hudItem(page, 'build').locator('a.hud__value')
    await expect(build).toHaveText(/^[0-9a-f]{7}$/)
    await expect(build).toHaveAttribute('href', /^https:\/\/github\.com\/whoisclebs\/whoisclebs\.com\/commit\/[0-9a-f]{40}$/)
    expect((await build.getAttribute('href'))?.split('/').pop()?.startsWith((await build.textContent()) ?? '-')).toBe(true)
    await expect(hudItem(page, 'activity').getByRole('link', { name: 'perfil do GitHub' })).toHaveAttribute('href', 'https://github.com/whoisclebs')
    await expect(hudItem(page, 'sync').locator('.hud__value')).toHaveText('sem dado')
    await expect(hudItem(page, 'latency').locator('.hud__value')).toHaveText('sem dado')
    // Nenhum segmento aceso sem dado; nenhum número inventado.
    await expect(hud.locator('.hud__seg[data-on]')).toHaveCount(0)
    expect(await hud.innerText()).not.toMatch(/\d+\s*(ms|eventos|minutos)/)
    await context.close()
  })

  test('com dado: contagem do cache (a mesma do rodapé), idade do sync, latência medida e build', async ({ page }) => {
    await mockActivity(page, 'fresh')
    await page.goto('/')
    await expect(page.locator('[data-hud-phase="done"]')).toBeVisible()
    await expect(hudItem(page, 'activity').locator('.hud__value')).toHaveText('6 eventos')
    await expect(hudItem(page, 'activity').locator('.hud__seg[data-on]')).toHaveCount(6)
    await expect(hudItem(page, 'sync').locator('time')).toHaveText('há 12 minutos')
    await expect(hudItem(page, 'sync').locator('.hud__seg[data-on]')).toHaveCount(8)
    await expect(hudItem(page, 'latency').locator('.hud__value')).toHaveText(/^\d+ ms$/)
    await expect(hudItem(page, 'build').locator('a.hud__value')).toHaveText(/^[0-9a-f]{7}$/)
  })

  test('sync desatualizado: texto com a data e barra cinza', async ({ page }) => {
    await mockActivity(page, 'stale')
    await page.goto('/')
    await expect(hudItem(page, 'sync').locator('.hud__value')).toContainText('desatualizada desde')
    await expect(hudItem(page, 'sync').locator('.hud__bar')).toHaveAttribute('data-tone', 'dim')
  })

  test('API falhando (503): atividade indisponível, sync sem dado, latência da resposta que chegou', async ({ page }) => {
    await mockActivity(page, 'unavailable')
    await page.goto('/')
    await expect(page.locator('[data-hud-phase="done"]')).toBeVisible()
    await expect(hudItem(page, 'activity').locator('.hud__value')).toHaveText('atividade indisponível')
    await expect(hudItem(page, 'sync').locator('.hud__value')).toHaveText('sem dado')
    await expect(hudItem(page, 'latency').locator('.hud__value')).toHaveText(/^\d+ ms$/)
    await expect(hudItem(page, 'activity').locator('.hud__seg[data-on]')).toHaveCount(0)
  })

  test('rede caída: nada de latência inventada', async ({ page }) => {
    await mockActivity(page, 'abort')
    await page.goto('/')
    await expect(page.locator('[data-hud-phase="done"]')).toBeVisible()
    await expect(hudItem(page, 'activity').locator('.hud__value')).toHaveText('atividade indisponível')
    await expect(hudItem(page, 'latency').locator('.hud__value')).toHaveText('sem dado')
  })

  test('dicas: abrem no foco do teclado, fecham com Esc; o rótulo continua em texto', async ({ page }) => {
    await mockActivity(page, 'fresh')
    await page.goto('/')
    await expect(page.locator('[data-hud-phase="done"]')).toBeVisible()
    const label = hudItem(page, 'latency').getByRole('button', { name: 'latência /api/activity' })
    const tip = hudItem(page, 'latency').getByRole('tooltip')
    await expect(tip).toBeHidden()
    await label.focus()
    await expect(tip).toBeVisible()
    await expect(label).toHaveAttribute('aria-describedby', 'hud-tip-latency')
    await expect(tip).toContainText('100 ms')
    // Foco de "unidade selecionada": anel de 2 px + cantos.
    const focus = await label.evaluate((el) => ({ outline: getComputedStyle(el).outlineStyle, corners: getComputedStyle(el, '::after').backgroundImage }))
    expect(focus.outline).toBe('solid')
    expect(focus.corners).toContain('linear-gradient')
    await page.keyboard.press('Escape')
    await expect(tip).toBeHidden()
    // A dica cabe na tela nas duas pontas do HUD.
    for (const key of ['activity', 'build']) {
      await hudItem(page, key).getByRole('button').focus()
      const box = await hudItem(page, key).getByRole('tooltip').boundingBox()
      const width = page.viewportSize()?.width ?? 0
      expect(box && box.x >= 0 && box.x + box.width <= width).toBe(true)
    }
  })

  test('dicas no toque: um toque abre, outro fora fecha (sem depender de hover)', async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    await mockActivity(page, 'fresh')
    await page.goto('/')
    await expect(page.locator('[data-hud-phase="done"]')).toBeVisible()
    const tip = hudItem(page, 'sync').getByRole('tooltip')
    await hudItem(page, 'sync').getByRole('button').tap()
    await expect(tip).toBeVisible()
    await page.locator('h1').tap()
    await expect(tip).toBeHidden()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    await context.close()
  })
})

test.describe('vídeo da luz rasante', () => {
  test('carrega depois do load, toca mudo e sem controles, e nunca é o LCP', async ({ page }) => {
    await mockActivity(page, 'fresh')
    const media: { url: string; at: number }[] = []
    page.on('request', (request) => {
      if (/\/media\/hero-light-v3\.(webm|mp4)/.test(request.url())) media.push({ url: request.url(), at: Date.now() })
    })
    await page.addInitScript(() => {
      const w = window as unknown as { __lcp: string[] }
      w.__lcp = []
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & { element?: Element | null })[]) {
          w.__lcp.push(entry.element ? entry.element.tagName : 'desconhecido')
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    })
    await page.goto('/', { waitUntil: 'load' })
    const loadedAt = Date.now()
    expect(media).toHaveLength(0)
    const video = page.locator('.light video')
    await expect(video).toHaveCount(1)
    await expect(page.locator('.light')).toHaveAttribute('data-shown', 'true', { timeout: 10_000 })
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
    expect(media.length).toBeGreaterThan(0)
    expect(media.every((request) => request.at >= loadedAt)).toBe(true)
    // Os quadros chegam ao canvas (o que se vê); o <video> é só a fonte, com 1 px.
    const painted = await page.locator('.light canvas').evaluate((el: HTMLCanvasElement) => {
      const pixels = el.getContext('2d')!.getImageData(0, 0, el.width, el.height).data
      let sum = 0
      for (let i = 0; i < pixels.length; i += 4 * 97) sum += (pixels[i] ?? 0) + (pixels[i + 1] ?? 0) + (pixels[i + 2] ?? 0)
      return sum
    })
    expect(painted).toBeGreaterThan(0)
    expect(await video.evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(1)
    await page.waitForTimeout(1500)
    const lcp = await page.evaluate(() => (window as unknown as { __lcp: string[] }).__lcp)
    expect(lcp.length).toBeGreaterThan(0)
    expect(lcp.at(-1)).toBe('H1')
    expect(lcp).not.toContain('VIDEO')
    expect(lcp).not.toContain('IMG')
    expect(lcp).not.toContain('CANVAS')
  })

  test('movimento reduzido: só o pôster, nenhum byte de vídeo', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await mockActivity(page, 'fresh')
    const media: string[] = []
    page.on('request', (request) => {
      if (/\/media\/hero-light-v3\.(webm|mp4)/.test(request.url())) media.push(request.url())
    })
    await page.goto('/', { waitUntil: 'load' })
    await expect(page.locator('.light')).toHaveAttribute('data-light', 'poster')
    await expect(page.locator('.light')).toHaveAttribute('data-shown', 'true')
    await page.waitForTimeout(1000)
    await expect(page.locator('.light video')).toHaveCount(0)
    expect(media).toEqual([])
    await context.close()
  })

  test('saveData: só o pôster, nenhum byte de vídeo', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true }))
    const media: string[] = []
    page.on('request', (request) => {
      if (/\/media\/hero-light-v3\.(webm|mp4)/.test(request.url())) media.push(request.url())
    })
    await page.goto('/', { waitUntil: 'load' })
    await expect(page.locator('.light')).toHaveAttribute('data-light', 'poster')
    await expect(page.locator('.light')).toHaveAttribute('data-shown', 'true')
    await page.waitForTimeout(1000)
    expect(media).toEqual([])
  })

  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    test(`contraste AA do H1 e do apoio sobre o quadro mais claro, com o véu (${viewport.width} px)`, async ({ browser }) => {
      // O pôster é o primeiro quadro do loop, com a faixa no estado final: o mais claro dos 97 quadros.
      const context = await browser.newContext({ reducedMotion: 'reduce', viewport, deviceScaleFactor: 1 })
      const page = await context.newPage()
      await mockActivity(page, 'fresh')
      await page.goto('/', { waitUntil: 'load' })
      await expect(page.locator('.light')).toHaveAttribute('data-shown', 'true')
      await page.waitForTimeout(1200) // fim do fade de opacidade do pôster
      const targets = { h1: '.hero__title', apoio: '.hero__support' }
      // Caixas das linhas de texto (Range.getClientRects), não a caixa do elemento: a faixa de luz passa à
      // direita do título (passo 17) e a caixa de 20ch do H1 incluiria luz que não fica atrás de nenhuma letra.
      const info = await page.evaluate((selectors) => {
        const out: Record<string, { rects: { x: number; y: number; w: number; h: number }[]; color: string }> = {}
        for (const [name, selector] of Object.entries(selectors)) {
          const el = document.querySelector<HTMLElement>(selector)!
          const range = document.createRange()
          range.selectNodeContents(el)
          const rects = [...range.getClientRects()].map((r) => ({ x: r.left, y: r.top + scrollY, w: r.width, h: r.height }))
          out[name] = { rects, color: getComputedStyle(el).color }
          el.style.color = 'transparent'
        }
        return out
      }, targets)
      const png = await page.screenshot({ fullPage: true })
      const { data, info: meta } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true })
      for (const [name, { rects, color }] of Object.entries(info)) {
        let brightest = 0
        for (const rect of rects) {
          for (let y = Math.max(0, Math.floor(rect.y)); y < Math.min(meta.height, Math.ceil(rect.y + rect.h)); y += 1) {
            for (let x = Math.max(0, Math.floor(rect.x)); x < Math.min(meta.width, Math.ceil(rect.x + rect.w)); x += 1) {
              const i = (y * meta.width + x) * 3
              brightest = Math.max(brightest, luminance([data[i], data[i + 1], data[i + 2]]))
            }
          }
        }
        const text = luminance(color.match(/\d+/g)!.slice(0, 3).map(Number))
        const contrast = ratio(text, brightest)
        console.log(`${viewport.width} px ${name}: ${contrast.toFixed(2)}:1 no pixel mais claro atrás do texto`)
        expect(contrast, name).toBeGreaterThanOrEqual(4.5)
      }
      await context.close()
    })
  }
})

test.describe('lang do <html> na navegação pelo cliente', () => {
  test('/en/ → Notas (pt-BR) pelo roteador do cliente → voltar', async ({ page }) => {
    await mockActivity(page, 'fresh')
    await page.goto('/en/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    // Confirma que é navegação no cliente: o marcador sobrevive se não houver HTML novo.
    await page.evaluate(() => ((window as unknown as { __spa: boolean }).__spa = true))
    await page.getByRole('contentinfo').getByRole('link', { name: 'Notes' }).click()
    await expect(page).toHaveURL(/\/notas\/$/)
    expect(await page.evaluate(() => (window as unknown as { __spa?: boolean }).__spa)).toBe(true)
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')
    await page.goBack()
    await expect(page).toHaveURL(/\/en\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })
})

test.describe('axe na home com o HUD carregado', () => {
  for (const scheme of ['light', 'dark'] as const) {
    for (const path of ['/', '/en/']) {
      test(`sem violações critical/serious em ${path} com dica aberta (${scheme})`, async ({ page }) => {
        await mockActivity(page, 'fresh')
        await page.emulateMedia({ colorScheme: scheme })
        await page.goto(path)
        await expect(page.locator('[data-hud-phase="done"]')).toBeVisible()
        await hudItem(page, 'sync').getByRole('button').focus()
        const results = await new AxeBuilder({ page }).analyze()
        const blocking = results.violations
          .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
          .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
        expect(blocking).toEqual([])
      })
    }
  }
})
