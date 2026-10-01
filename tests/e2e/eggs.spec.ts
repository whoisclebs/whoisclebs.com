import { expect, test } from '@playwright/test'
import { gotoWithEggs } from './helpers'

/**
 * Easter eggs globais (ilha `EasterEggs.svelte`, baixada depois do load): painel de atalhos (`?`), `g` + tecla,
 * código Konami (neon), palavras digitadas, cinco cliques na marca do rodapé e a troca da cena do hero. Tudo
 * exige um gesto; digitar num campo de texto não dispara nada.
 */

test('? abre o painel de atalhos com o foco preso nele; Esc fecha', async ({ page }) => {
  await gotoWithEggs(page, '/')
  await page.keyboard.press('?')
  const dialog = page.getByRole('dialog', { name: 'Atalhos' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Projetos')
  const focusInside = () => page.evaluate(() => Boolean(document.activeElement?.closest('dialog[open]')))
  expect(await focusInside()).toBe(true)
  // Modal: o Tab nunca chega a um elemento da página atrás do painel (ela fica inerte). Depois do último controle
  // o foco pode ir para a interface do navegador (no headless, `body`) e volta ao painel no Tab seguinte.
  const outside: string[] = []
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press('Tab')
    const where = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body || el.closest('dialog[open]')) return null
      return `${el.tagName.toLowerCase()} ${el.textContent?.trim().slice(0, 40) ?? ''}`
    })
    if (where) outside.push(where)
  }
  expect(outside).toEqual([])
  expect(await focusInside()).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('o botão Fechar e o clique fora também fecham o painel', async ({ page }) => {
  await gotoWithEggs(page, '/sobre/')
  await page.keyboard.press('?')
  const dialog = page.getByRole('dialog', { name: 'Atalhos' })
  await dialog.getByRole('button', { name: 'Fechar' }).click()
  await expect(dialog).toBeHidden()
  await page.keyboard.press('?')
  await expect(dialog).toBeVisible()
  await page.mouse.click(5, 400)
  await expect(dialog).toBeHidden()
})

test('g + p navega para Projetos; g + a para Artigos (no idioma da página)', async ({ page }) => {
  await gotoWithEggs(page, '/')
  await page.keyboard.press('g')
  await page.keyboard.press('p')
  await expect(page).toHaveURL(/\/projetos\/$/)
  await gotoWithEggs(page, '/en/')
  await page.keyboard.press('g')
  await page.keyboard.press('a')
  await expect(page).toHaveURL(/\/en\/writing\/$/)
})

test('digitar dentro de um <input> não dispara nada', async ({ page }) => {
  const path = '/escrita/github-actions-como-fazer-deploy/'
  await gotoWithEggs(page, path)
  const email = page.getByRole('textbox').first()
  await email.click()
  await page.keyboard.type('gp?sudo')
  await page.waitForTimeout(300)
  await expect(page).toHaveURL(new RegExp(`${path}$`))
  await expect(page.getByRole('dialog', { name: 'Atalhos' })).toBeHidden()
  await expect(page.getByText(/sudoers/)).toHaveCount(0)
  await expect(email).toHaveValue('gp?sudo')
})

test('o código Konami liga o neon (e desliga na segunda vez)', async ({ page }) => {
  await gotoWithEggs(page, '/')
  const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
  for (const key of konami) await page.keyboard.press(key)
  await expect(page.getByText('30 vidas. Modo neon ativado.')).toBeVisible()
  // O neon é uma camada decorativa por cima da página, que não recebe cliques.
  const overlay = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('[aria-hidden="true"]')].some((el) => {
        const style = getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        return style.position === 'fixed' && style.pointerEvents === 'none' && rect.width >= innerWidth && rect.height >= innerHeight
      }),
    )
  expect(await overlay()).toBe(true)
  for (const key of konami) await page.keyboard.press(key)
  await expect(page.getByText('Modo neon desativado.')).toBeVisible()
  expect(await overlay()).toBe(false)
})

test('digitar sudo mostra o aviso', async ({ page }) => {
  await gotoWithEggs(page, '/sobre/')
  await page.keyboard.type('sudo')
  await expect(page.getByText('clebs não está no arquivo sudoers. Este incidente será reportado.')).toBeVisible()
})

test('cinco cliques na marca do rodapé mostram o aviso', async ({ page }) => {
  await gotoWithEggs(page, '/projetos/')
  const brand = page.getByRole('contentinfo').getByRole('button', { name: 'whoisclebs.com' })
  for (let i = 0; i < 4; i += 1) await brand.click()
  await expect(page.getByText(/Cinco cliques/)).toHaveCount(0)
  await brand.click()
  await expect(page.getByText('Cinco cliques. Você é persistente. Eu também.')).toBeVisible()
})

test('digitar "cometa" troca a cena do hero, grava whoisclebs.hero e a escolha persiste ao recarregar', async ({ page }) => {
  const comet: string[] = []
  page.on('request', (request) => {
    if (/\/media\/hero-comet-v1/.test(request.url())) comet.push(request.url())
  })
  await gotoWithEggs(page, '/')
  const scene = page.locator('section.hero [data-scene]')
  await expect(scene).toHaveAttribute('data-scene', 'rain')
  await page.keyboard.type('cometa')
  await expect(page.getByText('O cometa voltou.')).toBeVisible()
  await expect(scene).toHaveAttribute('data-scene', 'comet')
  expect(await page.evaluate(() => localStorage.getItem('whoisclebs.hero'))).toBe('comet')

  await page.reload({ waitUntil: 'load' })
  await expect(scene).toHaveAttribute('data-scene', 'comet')
  await expect(scene).toHaveAttribute('data-shown', 'true', { timeout: 10_000 })
  expect(comet.length).toBeGreaterThan(0)

  // "chuva" volta ao padrão e apaga a chave (nada fica guardado sem necessidade).
  await gotoWithEggs(page, '/')
  await page.keyboard.type('chuva')
  await expect(scene).toHaveAttribute('data-scene', 'rain')
  expect(await page.evaluate(() => localStorage.getItem('whoisclebs.hero'))).toBeNull()
})

test('nada é guardado no navegador sem um gesto', async ({ page }) => {
  await gotoWithEggs(page, '/')
  await page.mouse.wheel(0, 2000)
  await page.waitForTimeout(500)
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([])
})
