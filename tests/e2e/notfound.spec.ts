import { expect, test, type Browser } from '@playwright/test'
import { serveVideoWithRanges, worstContrast } from './helpers'

/**
 * 404: o ciclo do Farol do Cabo Branco em loop lento atrás de um painel grafite, com o cabeçalho e o rodapé do
 * site. Status 404 real; o vídeo só entra com movimento permitido e sem economia de dados; o texto fica legível em
 * qualquer hora do ciclo (medido nos pixels reais).
 */

const PATH = '/nao-existe-mesmo/'

async function reducedContext(browser: Browser, width: number) {
  return browser.newContext({ reducedMotion: 'reduce', viewport: { width, height: width < 700 ? 844 : 900 }, deviceScaleFactor: 1 })
}

test('status 404 real, título e caminhos de volta; vídeo mudo em loop, inline e escondido de leitores de tela', async ({ page }) => {
  const response = await page.goto(PATH)
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('404')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Página não encontrada')
  await expect(page.getByText(/Cabo Branco, na Ponta do Seixas/)).toBeVisible()
  const nav = page.getByRole('navigation', { name: 'Para onde ir' })
  await expect(nav.getByRole('link')).toHaveText(['Voltar para o início', 'Projetos', 'Artigos'])
  await expect(nav.getByRole('link', { name: 'Voltar para o início' })).toHaveAttribute('href', '/')
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

test('404 em inglês: textos e links no idioma da URL', async ({ page }) => {
  const response = await page.goto('/en/nao-existe/')
  expect(response?.status()).toBe(404)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('404')
  await expect(page.getByRole('banner').getByRole('link', { name: 'Articles' })).toHaveAttribute('href', '/en/writing/')
})

test('movimento reduzido: só o pôster da noite, nenhum byte de vídeo', async ({ browser }) => {
  const context = await reducedContext(browser, 1440)
  const page = await context.newPage()
  const media: string[] = []
  page.on('request', (request) => {
    if (/farol-ciclo\.(webm|mp4)/.test(request.url())) media.push(request.url())
  })
  const response = await page.goto(PATH, { waitUntil: 'load' })
  expect(response?.status()).toBe(404)
  await expect(page.locator('.nf')).toHaveAttribute('data-video', 'poster')
  await page.waitForTimeout(800)
  await expect(page.locator('.nf video')).toHaveCount(0)
  expect(media).toEqual([])
  await context.close()
})

test('saveData: só o pôster', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true }))
  await page.goto(PATH, { waitUntil: 'load' })
  await expect(page.locator('.nf')).toHaveAttribute('data-video', 'poster')
  await expect(page.locator('.nf video')).toHaveCount(0)
})

for (const width of [390, 1440]) {
  test(`legível em qualquer hora do ciclo (${width} px)`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: width < 700 ? 844 : 900 }, deviceScaleFactor: 1 })
    const page = await context.newPage()
    await serveVideoWithRanges(page, 'farol-ciclo')
    await page.goto(PATH, { waitUntil: 'load' })
    await expect(page.locator('.nf')).toHaveAttribute('data-video', 'playing', { timeout: 15_000 })
    // Um instante de cada hora (noite, amanhecer, dia, entardecer): título, texto e botões sobre o painel.
    for (const [seconds, sky] of [[1, 'night'], [8, 'dawn'], [20, 'day'], [28, 'dusk']] as const) {
      await page.locator('.nf video').evaluate(async (el: HTMLVideoElement, t) => {
        el.pause()
        el.currentTime = t
        await new Promise((resolve) => el.addEventListener('seeked', resolve, { once: true }))
      }, seconds)
      await expect(page.locator('.nf')).toHaveAttribute('data-sky', sky)
      await page.waitForTimeout(300)
      const worst = await worstContrast(page, ['.nf__title', '.nf__text', '.nf__links a'], { clip: '.nf' })
      console.log(`${width} px 404 t=${seconds}s (${sky}): ${worst.ratio.toFixed(2)}:1 (${worst.label})`)
      expect(worst.ratio, `t=${seconds}s ${worst.label}`).toBeGreaterThanOrEqual(4.5)
    }
    await context.close()
  })
}
