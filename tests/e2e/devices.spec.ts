import { expect, test, type Page } from '@playwright/test'

/**
 * Seção dos aparelhos da home (`#terminal`): em tela larga, um notebook em CSS 3D que abre, toca o boot e entrega
 * um terminal de verdade; em tela estreita, um celular com a gaveta de aplicativos e nenhum terminal. O aparelho é
 * uma ilha baixada perto da seção; o vídeo de boot só é pedido depois do gesto de abrir.
 */

const BOOT_VIDEO = /\/media\/boot-v1\.(webm|mp4)/

function trackBootVideo(page: Page): string[] {
  const requests: string[] = []
  page.on('request', (request) => {
    if (BOOT_VIDEO.test(request.url())) requests.push(request.url())
  })
  return requests
}

/** Rola até a seção para a ilha do aparelho carregar. */
async function openSection(page: Page) {
  await page.locator('#terminal').scrollIntoViewIfNeeded()
}

const terminalInput = (page: Page) => page.getByRole('textbox', { name: 'Comando do terminal' })
const terminalLog = (page: Page) => page.getByRole('log', { name: 'Terminal interativo' })

/** Roda um comando e devolve as linhas que ele acrescentou ao registro. */
async function run(page: Page, command: string): Promise<string[]> {
  const lines = terminalLog(page).locator(':scope > *')
  const before = await lines.count()
  await terminalInput(page).fill(command)
  await terminalInput(page).press('Enter')
  await expect.poll(() => lines.count()).toBeGreaterThan(before + 1)
  return (await lines.allInnerTexts()).slice(before)
}

test.describe('notebook (1440 px)', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('começa fechado, abre, toca o boot, foca o terminal; help, ls, comando desconhecido; exit e Esc fecham e devolvem o foco', async ({ page }) => {
    const boot = trackBootVideo(page)
    await page.goto('/')
    await openSection(page)
    const toggle = page.getByRole('button', { name: 'Abrir o notebook' })
    await expect(toggle).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(terminalInput(page)).toHaveCount(0)
    // Nada de vídeo antes do gesto.
    await page.waitForTimeout(500)
    expect(boot).toEqual([])

    await toggle.click()
    await expect(page.getByRole('button', { name: 'Fechar o notebook' })).toHaveAttribute('aria-expanded', 'true')
    await expect.poll(() => boot.length).toBeGreaterThan(0)
    await expect(terminalInput(page)).toBeFocused({ timeout: 10_000 })

    const help = (await run(page, 'help')).join('\n')
    for (const command of ['help', 'ls', 'cat', 'open', 'exit']) expect(help).toMatch(new RegExp(`\\b${command}\\b`))
    const ls = (await run(page, 'ls')).join('\n')
    expect(ls).toContain('artigos/')
    expect(ls).toContain('projetos/')
    const unknown = await run(page, 'xyzzy')
    expect(unknown.join('\n')).toContain('xyzzy: comando não encontrado')

    // `exit` fecha e devolve o foco ao botão de abrir.
    await terminalInput(page).fill('exit')
    await terminalInput(page).press('Enter')
    const reopen = page.getByRole('button', { name: 'Abrir o notebook' })
    await expect(reopen).toBeFocused()
    await expect(reopen).toHaveAttribute('aria-expanded', 'false')

    // Reabre e fecha com Esc a partir da linha de comando.
    await reopen.click()
    await expect(terminalInput(page)).toBeFocused({ timeout: 10_000 })
    await page.keyboard.press('Escape')
    await expect(reopen).toBeFocused()
    await expect(reopen).toHaveAttribute('aria-expanded', 'false')
  })

  test('o terminal usa dados reais do site: ls artigos lista um artigo publicado', async ({ page }) => {
    await page.goto('/')
    await openSection(page)
    await page.getByRole('button', { name: 'Abrir o notebook' }).click()
    await expect(terminalInput(page)).toBeFocused({ timeout: 10_000 })
    const articles = (await run(page, 'ls artigos')).join('\n')
    expect(articles).toContain('GitHub Actions: Como fazer deploy de suas aplicações Vite')
  })

  test.describe('movimento reduzido', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } })

    test('abre sem giro nem vídeo de boot e o terminal recebe o foco', async ({ page }) => {
      const boot = trackBootVideo(page)
      await page.goto('/')
      await openSection(page)
      await page.getByRole('button', { name: 'Abrir o notebook' }).click()
      await expect(terminalInput(page)).toBeFocused({ timeout: 5_000 })
      await page.waitForTimeout(500)
      expect(boot).toEqual([])
    })
  })

  test('saveData: abre sem vídeo de boot', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true }))
    const boot = trackBootVideo(page)
    await page.goto('/')
    await openSection(page)
    await page.getByRole('button', { name: 'Abrir o notebook' }).click()
    await expect(terminalInput(page)).toBeFocused({ timeout: 5_000 })
    expect(boot).toEqual([])
  })
})

test.describe('celular (390 px)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('aparece o celular; ligar mostra a gaveta com links para as páginas e não há terminal', async ({ page }) => {
    const boot = trackBootVideo(page)
    await page.goto('/')
    await openSection(page)
    const phone = page.getByRole('group', { name: 'Celular com aplicativos' })
    await expect(phone).toBeVisible()
    await expect(page.getByRole('group', { name: 'Notebook com terminal' })).toHaveCount(0)
    // O botão lateral de energia diz se o aparelho está ligado (a tela apagada também é um botão de ligar).
    await expect(phone.locator('button[aria-pressed="false"]').and(phone.getByRole('button', { name: 'Ligar o celular' }))).toHaveCount(1)
    expect(boot).toEqual([])

    await phone.getByRole('button', { name: 'Ligar o celular' }).first().click()
    const drawer = page.getByRole('navigation', { name: 'Aplicativos' })
    await expect(drawer).toBeVisible({ timeout: 10_000 })
    await expect(phone.getByRole('button', { name: 'Desligar o celular' })).toHaveAttribute('aria-pressed', 'true')
    for (const href of ['/escrita/', '/projetos/', '/sobre/']) await expect(drawer.locator(`a[href="${href}"]`).first()).toBeVisible()
    await expect(terminalInput(page)).toHaveCount(0)

    // Um app de página navega para ela.
    await drawer.locator('a[href="/projetos/"]').first().click()
    await expect(page).toHaveURL(/\/projetos\/$/)
  })
})

test('sem JS a seção mostra só o aviso, sem aparelho que não responde', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')
  const section = page.locator('section#terminal')
  // O aviso vem num <noscript>, que o Playwright não expõe a getByText nem à árvore de acessibilidade:
  // confere o texto e a caixa desenhada.
  const notice = section.locator('noscript p')
  await expect(notice).toHaveText('Esta parte precisa de JavaScript.')
  expect(await notice.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(0)
  await expect(section.getByRole('button')).toHaveCount(0)
  // O espaço reservado para o aparelho não vira um buraco na página.
  const height = await section.evaluate((el) => el.getBoundingClientRect().height)
  expect(height).toBeLessThan(400)
  await context.close()
})
