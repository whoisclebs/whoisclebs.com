import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * Passo 05 — casca editorial e hero (o Mapa de Decisões saiu no passo 15): teclado, sem JS, overflow e axe.
 */

const keyRoutes = [
  '/',
  '/projetos/',
  '/projetos/tuxedo/',
  '/projetos/golpher/',
  '/escrita/',
  '/escrita/github-actions-como-fazer-deploy/',
  '/escrita/assunto/hackathon/',
  '/notas/',
  '/notas/docker-healthcheck-para-servicos/',
  '/sobre/',
  '/contato/',
  '/agentes/',
  '/livros/',
  '/hobbies/',
  '/rota-inexistente/',
  '/en/',
  '/en/writing/',
  '/en/writing/github-actions-como-fazer-deploy/',
]

const widths = [390, 768, 1440]

async function focusedInfo(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    if (!el) return null
    const style = getComputedStyle(el)
    const rect = el.getBoundingClientRect()
    return {
      text: el.textContent?.trim() ?? '',
      id: el.id,
      href: el.getAttribute('href'),
      outlineWidth: style.outlineWidth,
      outlineOffset: style.outlineOffset,
      outlineStyle: style.outlineStyle,
      inViewport: rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0 && rect.right <= window.innerWidth,
    }
  })
}

test.describe('skip link e navegação por teclado', () => {
  test('o skip link é o primeiro foco, fica visível e leva ao conteúdo', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skip = await focusedInfo(page)
    expect(skip?.text).toBe('Pular para o conteúdo')
    expect(skip?.inViewport).toBe(true)
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#conteudo$/)
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('conteudo')
  })

  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    test(`header operável por teclado com foco visível (${viewport.width} px)`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')
      const expected = ['Pular para o conteúdo', 'WHOISCLEBS', 'Arquitetura', 'Projetos', 'Escrita', 'Sobre', 'Contato', 'PT (Português)', 'EN (English)']
      for (const text of expected) {
        await page.keyboard.press('Tab')
        const info = await focusedInfo(page)
        expect(info?.text).toBe(text)
        expect(info?.inViewport, `${text} visível`).toBe(true)
        expect(info?.outlineStyle).toBe('solid')
        expect(info?.outlineWidth).toBe('2px')
        expect(info?.outlineOffset).toBe('3px')
      }
      // Volta para "Escrita" e segue o link pelo teclado.
      for (let i = 0; i < 4; i += 1) await page.keyboard.press('Shift+Tab')
      expect((await focusedInfo(page))?.text).toBe('Escrita')
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/escrita\/$/)
      const nav = page.getByRole('navigation', { name: 'Principal' })
      await expect(nav.getByRole('link', { name: 'Escrita' })).toHaveAttribute('aria-current', 'page')
      await expect(nav.getByRole('link', { name: 'Projetos' })).not.toHaveAttribute('aria-current', /.+/)
    })
  }

  test('seletor de idioma por link aponta para a tradução e marca o idioma atual', async ({ page }) => {
    await page.goto('/sobre/')
    const lang = page.getByRole('list', { name: 'Idioma' })
    await expect(lang.getByRole('link', { name: /^PT/ })).toHaveAttribute('aria-current', 'true')
    await expect(lang.getByRole('link', { name: /^EN/ })).toHaveAttribute('href', '/en/about/')
    await lang.getByRole('link', { name: /^EN/ }).click()
    await expect(page).toHaveURL(/\/en\/about\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('navegação secundária (Notas, Livros, Hobbies) no rodapé', async ({ page }) => {
    await page.goto('/')
    const secondary = page.getByRole('contentinfo').getByRole('navigation', { name: 'Mais' })
    for (const name of ['Notas', 'Livros', 'Hobbies']) await expect(secondary.getByRole('link', { name })).toBeVisible()
  })
})

test.describe('sem JavaScript', () => {
  test('home mostra H1, apoio, CTAs e navegação; o Mapa de Decisões saiu', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Construo sistemas distribuídos, backends de alta performance e agentes de IA.')
    await expect(page.getByText(/Sou Clebson Augusto, engenheiro de software sênior/)).toBeVisible()
    const nav = page.getByRole('navigation', { name: 'Principal' })
    for (const name of ['Arquitetura', 'Projetos', 'Escrita', 'Sobre']) await expect(nav.getByRole('link', { name })).toBeVisible()
    await expect(nav.getByRole('link', { name: 'Arquitetura' })).toHaveAttribute('href', '/#arquitetura')
    // Contato em destaque, fora da lista (no celular fica na linha da marca).
    await expect(page.getByRole('banner').getByRole('link', { name: 'Contato' })).toHaveAttribute('href', '/contato/')
    await expect(page.locator('#arquitetura').getByRole('heading', { level: 2, name: 'Arquitetura' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ver projetos' })).toHaveAttribute('href', '/projetos/')
    await expect(page.getByRole('link', { name: 'Mandar um e-mail' })).toHaveAttribute('href', 'mailto:hello@whoisclebs.com')
    await expect(page.getByRole('tablist')).toHaveCount(0)
    await expect(page.getByText('Mapa de decisões')).toHaveCount(0)
    await context.close()
  })
})

test.describe('layout', () => {
  for (const width of widths) {
    test(`sem overflow horizontal em ${width} px nas rotas-chave`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      for (const path of keyRoutes) {
        await page.goto(path)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow, `${path} em ${width} px`).toBeLessThanOrEqual(0)
      }
    })
  }

  test('em 768 px o header cabe numa linha e o H1 não quebra palavra por palavra', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    const tops = await page.locator('.site-header a').evaluateAll((links) =>
      links.filter((a) => !a.classList.contains('skip-link')).map((a) => Math.round(a.getBoundingClientRect().top)),
    )
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(12)
    const lines = await page.getByRole('heading', { level: 1 }).evaluate((h1) => {
      const lineHeight = parseFloat(getComputedStyle(h1).lineHeight)
      return Math.round(h1.getBoundingClientRect().height / lineHeight)
    })
    // H1 de 13 palavras (copy.md §1): até 4 linhas em 768 px, nunca uma palavra por linha.
    expect(lines).toBeLessThanOrEqual(4)
  })
})

test.describe('axe-core', () => {
  for (const scheme of ['light', 'dark'] as const) {
    for (const path of ['/', '/en/']) {
      test(`sem violações critical/serious em ${path} (${scheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme })
        await page.goto(path)
        await expect(page.locator('[data-hud-phase="done"]')).toBeVisible()
        const results = await new AxeBuilder({ page }).analyze()
        const blocking = results.violations
          .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
          .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
        expect(blocking).toEqual([])
      })
    }
  }
})
