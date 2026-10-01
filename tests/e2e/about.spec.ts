import { expect, test, type Page } from '@playwright/test'

/**
 * Sobre: duas fotos em papel, as linhas Agora/Escrevo sobre/Contato, o cartucho que abre o console de bolso com a
 * serpente (ilha baixada só no clique), a oferta de Arquitetura com evidência pública e o bloco Agora. A página
 * /agentes/ saiu: nada aponta para ela.
 */

/** Célula da cabeça da serpente, lida dos pixels do canvas (a cabeça é creme; o corpo, ciano; a comida, rosa). */
async function snakeHead(page: Page): Promise<{ x: number; y: number } | null> {
  return page.getByRole('group', { name: 'Pocket CLEBS' }).locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const CELL = canvas.width / 20
    const ctx = canvas.getContext('2d')!
    for (let y = 0; y < 16; y += 1) {
      for (let x = 0; x < 20; x += 1) {
        const [r = 0, g = 0, b = 0] = ctx.getImageData(x * CELL + CELL / 2, y * CELL + CELL / 2, 1, 1).data
        if (r === 0xef && g === 0xe9 && b === 0xe0) return { x, y }
      }
    }
    return null
  })
}

test('duas fotos em papel com texto alternativo e as linhas Agora, Escrevo sobre e Contato', async ({ page }) => {
  await page.goto('/sobre/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quem está por aqui')
  const header = page.locator('header.page-header')
  const prints = header.getByRole('figure')
  await expect(prints).toHaveCount(2)
  await expect(header.getByRole('img', { name: 'Retrato de Clebson Fonseca' })).toBeVisible()
  await expect(header.getByRole('img', { name: 'Equipe no palco do Microlearning, Campus Party' })).toBeVisible()
  for (const index of [0, 1]) {
    // Cópias opacas pousadas na página: sombra, leve giro e nada de máscara que as dissolva no fundo.
    const style = await prints.nth(index).evaluate((el) => ({ mask: getComputedStyle(el).maskImage, shadow: getComputedStyle(el).boxShadow }))
    expect(style.mask).toBe('none')
    expect(style.shadow).not.toBe('none')
  }
  for (const term of ['Agora', 'Escrevo sobre', 'Contato']) await expect(header.getByRole('term').filter({ hasText: term })).toBeVisible()
  const contact = header.getByRole('definition').filter({ has: page.getByRole('link', { name: 'GitHub' }) })
  await expect(contact.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/whoisclebs')
  await expect(contact.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', /linkedin\.com\/in\/whoisclebs/)
})

test('o cartucho abre o console (chunk baixado só no clique), as setas movem a serpente e Esc fecha', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const scripts: string[] = []
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.push(request.url())
  })
  await page.goto('/sobre/', { waitUntil: 'networkidle' })
  const cartridge = page.getByRole('button', { name: 'Abrir o console de bolso' })
  await expect(cartridge).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('group', { name: 'Pocket CLEBS' })).toHaveCount(0)
  const before = new Set(scripts)

  await cartridge.click()
  const consoleGroup = page.getByRole('group', { name: 'Pocket CLEBS' })
  await expect(consoleGroup).toBeVisible()
  await expect(cartridge).toHaveAttribute('aria-expanded', 'true')
  expect(scripts.filter((url) => !before.has(url)).length).toBeGreaterThan(0)
  await expect(page.getByText('Cartucho inserido. WASD ou setas.')).toBeVisible()

  // A serpente começa parada, indo para a direita. A primeira seta dá a partida: para cima, ela sobe na mesma coluna.
  const start = await snakeHead(page)
  expect(start).not.toBeNull()
  // Ao abrir, a página rola (suave) até o console; espera ela parar antes de medir.
  let last = -1
  await expect
    .poll(async () => {
      const now = await page.evaluate(() => scrollY)
      const settled = now === last
      last = now
      return settled
    }, { intervals: [250] })
    .toBe(true)
  const scrollBefore = await page.evaluate(() => scrollY)
  await page.keyboard.press('ArrowUp')
  await expect(consoleGroup).toContainText('Espaço pausa')
  await expect.poll(async () => (await snakeHead(page))?.y ?? Infinity, { timeout: 3_000 }).toBeLessThan(start!.y)
  expect((await snakeHead(page))?.x).toBe(start!.x)
  // Com o console aberto, as setas são do jogo: a página não rola.
  expect(await page.evaluate(() => scrollY)).toBe(scrollBefore)
  await page.keyboard.press('ArrowLeft')
  const turned = await snakeHead(page)
  await expect.poll(async () => (await snakeHead(page))?.x ?? Infinity, { timeout: 3_000 }).toBeLessThan(turned!.x)

  await page.keyboard.press('Escape')
  await expect(consoleGroup).toHaveCount(0)
  await expect(cartridge).toBeFocused()
  await expect(cartridge).toHaveAttribute('aria-expanded', 'false')
})

test('com o console aberto, as teclas dos easter eggs globais ficam com o jogo', async ({ page }) => {
  await page.goto('/sobre/')
  await page.getByRole('button', { name: 'Abrir o console de bolso' }).click()
  await expect(page.getByRole('group', { name: 'Pocket CLEBS' })).toBeVisible()
  await page.keyboard.press('?')
  await page.waitForTimeout(300)
  await expect(page.getByRole('dialog', { name: 'Atalhos' })).toHaveCount(0)
})

test('Arquitetura: três frentes com problema, entrega e evidência pública válida; convite para conversar', async ({ page, request }) => {
  await page.goto('/sobre/')
  const offer = page.getByRole('region', { name: 'Arquitetura' })
  await expect(offer.getByRole('heading', { level: 3 })).toHaveText(['Sistemas distribuídos', 'Backend de alta performance', 'IA agêntica'])
  for (const label of ['O problema', 'O que entrego', 'Evidência pública']) await expect(offer.getByText(label, { exact: true })).toHaveCount(3)
  const evidence = await offer
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { level: 3 }) })
    .evaluateAll((items) => items.map((item) => item.querySelector<HTMLAnchorElement>('.link-lit')?.getAttribute('href') ?? ''))
  expect(evidence).toHaveLength(3)
  expect(evidence.slice(0, 2)).toEqual(['/projetos/tuxedo/', '/projetos/golpher/'])
  for (const href of evidence) {
    if (href.startsWith('/')) expect((await request.get(href, { maxRedirects: 0 })).status(), href).toBe(200)
    else expect(href).toMatch(/^https:\/\/github\.com\//)
  }
  await expect(offer.getByRole('link', { name: 'Conversar sobre um projeto' })).toHaveAttribute('href', '/contato/')
  // A âncora antiga da home (#arquitetura) agora vive no Sobre.
  await expect(page.locator('#arquitetura')).toHaveCount(1)
})

test('bloco Agora com data de atualização em <time>', async ({ page }) => {
  await page.goto('/sobre/')
  const now = page.getByRole('region', { name: 'Agora' })
  await expect(now.locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/)
})

test('nenhuma referência a /agentes/ no Sobre (pt e en)', async ({ page }) => {
  for (const path of ['/sobre/', '/en/about/']) {
    await page.goto(path)
    const hrefs = await page.locator('a[href]').evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''))
    expect(hrefs.filter((href) => /\/agentes\/?/.test(href)), path).toEqual([])
  }
})

test('sem JS: fotos e a oferta de Arquitetura aparecem', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/sobre/')
  await expect(page.getByRole('img', { name: 'Retrato de Clebson Fonseca' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Arquitetura' })).toBeVisible()
  await context.close()
})
