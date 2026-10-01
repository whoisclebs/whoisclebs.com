import { expect, test, type Page } from '@playwright/test'

/**
 * Livros: a estante. Sem JS, cada livro real é um link comum; com JS, a lombada vira botão e abre o livro num
 * <dialog> modal com título, autor e o link de afiliado (`sponsored`). Esc fecha e o foco volta à lombada.
 * As lombadas decorativas não têm texto e ficam fora da árvore de acessibilidade.
 */

const shelf = (page: Page) => page.getByRole('region', { name: 'Recomendações' }).getByRole('list')

test('sem JS: só os livros reais, como links para a loja', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/livros/')
  const books = shelf(page).getByRole('listitem')
  const count = await books.count()
  expect(count).toBeGreaterThan(0)
  // Cada item exposto é um livro real com um link nomeado por título e autor; nenhum botão inerte.
  await expect(shelf(page).getByRole('link')).toHaveCount(count)
  await expect(shelf(page).getByRole('button')).toHaveCount(0)
  for (const link of await shelf(page).getByRole('link').all()) {
    await expect(link).toHaveAccessibleName(/.+, .+/)
    await expect(link).toHaveAttribute('href', /^https:\/\//)
    await expect(link).toHaveAttribute('rel', /noopener/)
  }
  // As lombadas decorativas existem no HTML, mas fora da árvore de acessibilidade.
  const all = await shelf(page).locator(':scope > li').count()
  expect(all).toBeGreaterThan(count)
  await context.close()
})

test('com JS: abrir um livro mostra título, autor e link sponsored; Esc fecha e o foco volta à lombada', async ({ page }) => {
  await page.goto('/livros/')
  const spines = shelf(page).getByRole('button')
  await expect(spines.first()).toBeVisible()
  const name = (await spines.first().getAttribute('aria-label')) ?? ''
  const [title, author] = name.split(', ')
  await spines.first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: title })).toBeVisible()
  await expect(dialog.getByRole('paragraph').filter({ hasText: author! }).first()).toBeVisible()
  const store = dialog.getByRole('link', { name: /Ver na Amazon/ })
  await expect(store).toHaveAttribute('rel', /\bsponsored\b/)
  await expect(store).toHaveAttribute('href', /^https:\/\//)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(spines.first()).toBeFocused()
})

test('o botão Fechar livro também fecha e devolve o foco', async ({ page }) => {
  await page.goto('/livros/')
  const spine = shelf(page).getByRole('button').last()
  await spine.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Fechar livro' }).click()
  await expect(dialog).toBeHidden()
  await expect(spine).toBeFocused()
})

test('lombadas decorativas fora da árvore de acessibilidade e do Tab', async ({ page }) => {
  await page.goto('/livros/')
  const real = await shelf(page).getByRole('button').count()
  await expect(shelf(page).getByRole('listitem')).toHaveCount(real)
  const decorative = shelf(page).locator(':scope > li[aria-hidden="true"]')
  expect(await decorative.count()).toBeGreaterThan(0)
  expect(await decorative.locator('a, button, [tabindex]').count()).toBe(0)
  expect((await decorative.allInnerTexts()).join('').trim()).toBe('')
})
