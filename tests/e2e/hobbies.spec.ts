import { expect, test, type Page } from '@playwright/test'

/**
 * Hobbies: o d20 na mesa (ilha baixada perto da seção). Rola por clique e por teclado; o resultado aparece em
 * texto e numa região `aria-live`; os modos Vantagem e Desvantagem rolam dois dados e dizem qual valeu.
 */

const section = (page: Page) => page.getByRole('region', { name: 'Um d20 na mesa' })

/** A região que anuncia o resultado (a única `aria-live` da mesa). */
const live = (page: Page) => section(page).locator('[aria-live="polite"]')

async function openTray(page: Page) {
  await page.goto('/hobbies/')
  await section(page).scrollIntoViewIfNeeded()
  await expect(section(page).getByRole('button', { name: 'Rolar o d20' })).toBeVisible()
}

test('rola por clique: o resultado de 1 a 20 aparece em texto e na região aria-live', async ({ page }) => {
  await openTray(page)
  await expect(live(page)).toHaveText('Clique no dado para rolar.')
  await section(page).getByRole('button', { name: 'Rolar o d20' }).click()
  await expect(live(page)).toContainText(/Resultado:\s*\d{1,2}/, { timeout: 5_000 })
  const value = Number(/Resultado:\s*(\d+)/.exec((await live(page).innerText()).replace(/\s+/g, ' '))?.[1])
  expect(value).toBeGreaterThanOrEqual(1)
  expect(value).toBeLessThanOrEqual(20)
  // O número é visível, não só lido por leitor de tela.
  const shown = live(page).getByRole('paragraph').first()
  await expect(shown).toBeVisible()
  await expect(shown).toContainText(String(value))
})

test('rola pelo teclado (Enter e Espaço no dado)', async ({ page }) => {
  await openTray(page)
  const die = section(page).getByRole('button', { name: 'Rolar o d20' })
  await die.focus()
  await page.keyboard.press('Enter')
  await expect(live(page)).toContainText(/Resultado:\s*\d+/, { timeout: 5_000 })
  await page.keyboard.press(' ')
  await expect(live(page)).toContainText(/Resultado:\s*\d+/, { timeout: 5_000 })
  await expect(die).toBeFocused()
})

test('Vantagem e Desvantagem: dois dados, vale o maior ou o menor, e o outro é dito em texto', async ({ page }) => {
  await openTray(page)
  const modes = section(page).getByRole('group', { name: 'Modo da rolagem' })
  await expect(modes.getByRole('button', { name: 'Normal', exact: true })).toHaveAttribute('aria-pressed', 'true')

  await modes.getByRole('button', { name: 'Vantagem', exact: true }).click()
  await expect(modes.getByRole('button', { name: 'Vantagem', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(modes.getByRole('button', { name: 'Normal', exact: true })).toHaveAttribute('aria-pressed', 'false')
  await section(page).getByRole('button', { name: 'Rolar dois d20 com vantagem' }).click()
  await expect(live(page)).toContainText(/Vale o maior\. O outro deu \d+\./, { timeout: 5_000 })
  const high = (await live(page).innerText()).replace(/\s+/g, ' ')
  const [kept, other] = [Number(/Resultado:\s*(\d+)/.exec(high)?.[1]), Number(/O outro deu (\d+)/.exec(high)?.[1])]
  expect(kept).toBeGreaterThanOrEqual(other)

  await modes.getByRole('button', { name: 'Desvantagem', exact: true }).click()
  await section(page).getByRole('button', { name: 'Rolar dois d20 com desvantagem' }).click()
  await expect(live(page)).toContainText(/Vale o menor\. O outro deu \d+\./, { timeout: 5_000 })
  const low = (await live(page).innerText()).replace(/\s+/g, ' ')
  expect(Number(/Resultado:\s*(\d+)/.exec(low)?.[1])).toBeLessThanOrEqual(Number(/O outro deu (\d+)/.exec(low)?.[1]))
})

test.describe('movimento reduzido', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('o resultado sai na hora, sem rolagem animada', async ({ page }) => {
    await openTray(page)
    await section(page).getByRole('button', { name: 'Rolar o d20' }).click()
    await expect(live(page)).toContainText(/Resultado:\s*\d+/, { timeout: 500 })
  })
})
