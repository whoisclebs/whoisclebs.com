import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * simulador determinístico no case tuxedo: teclado de ponta a ponta, reiniciar, reprodução,
 * reduced motion, JS desligado (tabela) e axe claro/escuro. O cenário padrão (semente 170) abre o disjuntor
 * no passo 3, fica meio-aberto no passo 8 e fecha no passo 9 (testado também em src/lib/sim/sim.test.ts).
 */

const CASE = '/projetos/tuxedo/'

async function openIsland(page: Page) {
  await page.goto(`${CASE}#simulador`)
  const step = page.getByRole('button', { name: 'Avançar um passo' })
  await expect(step).toBeVisible()
  return { step, status: page.getByTestId('breaker-status'), live: page.locator('.sim [aria-live="polite"]') }
}

test('rotulada como simulação com dados sintéticos e sem afirmar que o tuxedo faz isso', async ({ page }) => {
  await openIsland(page)
  await expect(page.locator('.sim')).toContainText('Simulação com dados sintéticos')
  await expect(page.locator('.sim')).toContainText('Nada disso existe no código do tuxedo')
  // Uma única região viva na ilha (a outra da página é o anunciador de rotas do SvelteKit).
  expect(await page.locator('.sim [aria-live], .sim output, .sim [role="status"]').count()).toBe(1)
})

test('teclado de ponta a ponta: controles, passos e estados closed → open → half-open → closed', async ({ page }) => {
  const { step, status, live } = await openIsland(page)

  // Controles nativos pelo teclado; cada mudança reinicia o cenário e é anunciada uma vez.
  const failure = page.getByRole('slider', { name: /Falha do servidor/ })
  await failure.focus()
  await page.keyboard.press('End')
  await expect(page.locator('.sim__value').first()).toHaveText('90%')
  await expect(live).toContainText('falha de 90%')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('slider', { name: /Latência média/ })).toBeFocused()
  await page.keyboard.press('Tab')
  const key = page.getByRole('checkbox', { name: 'Enviar chave de idempotência' })
  await expect(key).toBeFocused()
  await page.keyboard.press('Space')
  await expect(key).not.toBeChecked()
  await expect(live).toContainText('sem chave de idempotência')

  // Volta ao cenário padrão pelo teclado.
  await page.keyboard.press('Space')
  await failure.focus()
  for (let i = 0; i < 5; i += 1) await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.sim__value').first()).toHaveText('40%')

  await step.focus()
  await expect(status).toHaveText('fechado')
  for (let i = 0; i < 3; i += 1) await page.keyboard.press('Enter')
  await expect(status).toHaveText('aberto')
  await expect(live).toContainText('o disjuntor abriu')
  for (let i = 0; i < 5; i += 1) await page.keyboard.press('Enter')
  await expect(status).toHaveText('meio-aberto')
  await expect(live).toContainText('meio-aberto')
  await page.keyboard.press('Enter')
  await expect(status).toHaveText('fechado')
  await expect(live).toContainText('O teste passou e o disjuntor fechou')
  await expect(step).toBeFocused()
  await expect(page.locator('.sim [aria-current="step"]')).toContainText('fechado')
})

test('reiniciar volta ao passo 0 e mantém o foco no botão', async ({ page }) => {
  const { step, status, live } = await openIsland(page)
  for (let i = 0; i < 4; i += 1) await step.click()
  await expect(status).toHaveText('aberto')
  const restart = page.getByRole('button', { name: 'Reiniciar' })
  await restart.focus()
  await page.keyboard.press('Enter')
  await expect(status).toHaveText('fechado')
  await expect(page.locator('.sim__clock dd').first()).toHaveText('0')
  await expect(live).toContainText('reiniciada')
  await expect(restart).toBeFocused()
})

test('reproduzir chega ao fim, lê o resumo uma vez e não desabilita o foco', async ({ page }) => {
  const { step, live } = await openIsland(page)
  const play = page.getByRole('button', { name: 'Reproduzir' })
  await play.click()
  await expect(live).toHaveText('Reproduzindo; o resumo será lido no fim.')
  await expect(page.locator('.sim__summary')).toContainText('Fim: 5 de 6 pedidos confirmados', { timeout: 20_000 })
  await expect(live).toContainText('Fim: 5 de 6')
  await expect(live).toContainText('abandonado pelo cliente, mas cobrado pelo servidor')
  await expect(step).toHaveAttribute('aria-disabled', 'true')
  await expect(step).not.toHaveAttribute('disabled')
})

test('prefers-reduced-motion desliga a transição da célula nova, com a mesma informação', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const { step, live } = await openIsland(page)
  await step.click()
  const tick = page.locator('.sim__tick').first()
  expect(await tick.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe('0s')
  await expect(live).toContainText('Pedido 1, tentativa 1')

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.reload()
  await page.getByRole('button', { name: 'Avançar um passo' }).click()
  expect(await page.locator('.sim__tick').first().evaluate((element) => getComputedStyle(element).transitionDuration)).not.toBe('0s')
})

test('com JS, a tabela fica recolhida; a ilha só é baixada no case tuxedo', async ({ page }) => {
  const scripts: string[] = []
  page.on('request', (request) => request.resourceType() === 'script' && scripts.push(request.url()))
  await page.goto('/projetos/golpher/')
  await page.waitForLoadState('networkidle')
  const golpherScripts = [...scripts]
  await openIsland(page)
  await expect(page.locator('.sim-demo__table')).not.toHaveAttribute('open', '')
  const islandChunk = scripts.find((url) => !golpherScripts.includes(url))
  expect(islandChunk, 'o case tuxedo baixa um chunk que o golpher não baixa').toBeTruthy()
})

test('sem JS, o case mostra a tabela pré-calculada com o mesmo cenário', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(CASE)
  const table = page.locator('.sim-demo__table')
  await expect(table).toHaveAttribute('open', '')
  await expect(table.locator('tbody tr')).toHaveCount(17)
  await expect(table.locator('caption')).toContainText('Dados sintéticos')
  await expect(table.locator('tbody tr').nth(7)).toContainText('meio-aberto')
  await expect(page.locator('.sim-demo__nojs')).toContainText('Simulação com dados sintéticos')
  await expect(page.getByRole('button', { name: 'Avançar um passo' })).toHaveCount(0)
  // A tabela aberta rola dentro da própria região, sem esticar a página.
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
  await context.close()
})

test.describe('axe-core com o simulador carregado', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`sem violações critical/serious em ${CASE} (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      const { step } = await openIsland(page)
      for (let i = 0; i < 8; i += 1) await step.click()
      await page.locator('.sim__log summary').click()
      const results = await new AxeBuilder({ page }).analyze()
      const blocking = results.violations
        .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
        .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
      expect(blocking).toEqual([])
    })
  }
})
