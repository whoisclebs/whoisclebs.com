import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * Passo 05 — casca editorial, hero e Mapa de Decisões: teclado, sem JS, reduced motion, overflow e axe.
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
      const expected = ['Pular para o conteúdo', 'WHOISCLEBS', 'Projetos', 'Escrita', 'Sobre', 'Contato', 'PT (Português)', 'EN (English)']
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

test.describe('Mapa de Decisões', () => {
  test('troca decisão, trade-off e link por teclado (setas, Home, End) e por clique', async ({ page }) => {
    await page.goto('/')
    const tablist = page.getByRole('tablist', { name: 'Caminhos do mapa' })
    await expect(tablist).toBeVisible()
    const tabs = tablist.getByRole('tab')
    await expect(tabs).toHaveCount(3)
    const panel = page.getByRole('tabpanel')

    const first = tabs.nth(0)
    await expect(first).toHaveAttribute('aria-selected', 'true')
    await expect(panel.getByRole('link', { name: 'Ver o case tuxedo' })).toHaveAttribute('href', '/projetos/tuxedo/')

    await first.focus()
    await page.keyboard.press('ArrowDown')
    await expect(tabs.nth(1)).toBeFocused()
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(first).toHaveAttribute('aria-selected', 'false')
    await expect(panel).toContainText('Integrações de pagamento')
    await expect(panel.getByRole('link', { name: 'Ler a trajetória no Sobre' })).toHaveAttribute('href', '/sobre/')

    await page.keyboard.press('End')
    await expect(tabs.nth(2)).toBeFocused()
    await expect(panel).toContainText('contexto pequeno e verificável')
    await expect(panel.getByRole('link', { name: 'Ler o capítulo sobre agentes' })).toHaveAttribute('href', '/agentes/')

    await page.keyboard.press('ArrowRight')
    await expect(first).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(tabs.nth(2)).toBeFocused()
    await page.keyboard.press('Home')
    await expect(first).toHaveAttribute('aria-selected', 'true')

    // Só a aba selecionada entra na ordem de tabulação; Tab sai da lista para o link do painel.
    await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1')
    await page.keyboard.press('Tab')
    expect((await focusedInfo(page))?.text).toBe('Ver o case tuxedo')

    await tabs.nth(1).click()
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(panel).toHaveAttribute('aria-labelledby', (await tabs.nth(1).getAttribute('id')) ?? '')
  })

  test('evidência rotulada em texto em cada caminho, não só pela forma', async ({ page }) => {
    await page.goto('/')
    const tabs = page.getByRole('tablist', { name: 'Caminhos do mapa' }).getByRole('tab')
    await expect(tabs.nth(0)).toContainText('Código público')
    await expect(tabs.nth(1)).toContainText('Sem case público')
    await expect(tabs.nth(2)).toContainText('Protótipos públicos')
  })
})

test.describe('sem JavaScript', () => {
  test('home mostra H1, texto, navegação e o 1º caminho do mapa', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sistemas que resistem ao mundo real.')
    await expect(page.getByText(/Sou Clebson Augusto, desenvolvedor fullstack/)).toBeVisible()
    const nav = page.getByRole('navigation', { name: 'Principal' })
    for (const name of ['Projetos', 'Escrita', 'Sobre', 'Contato']) await expect(nav.getByRole('link', { name })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ver o case tuxedo' }).first()).toBeVisible()
    // Sem JS a lista é estática (nenhum botão inerte) e o painel mostra o caminho com código público.
    await expect(page.getByRole('tab')).toHaveCount(0)
    const list = page.getByRole('list', { name: 'Caminhos do mapa' })
    await expect(list).toContainText('Clientes HTTP')
    await expect(list).toContainText('Código público')
    await expect(page.locator('#mapa-decisoes-painel')).toContainText('API encadeável sobre o net/http')
    await context.close()
  })
})

test.describe('movimento', () => {
  test('realce de 180 ms só com opacity/transform', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('tablist')).toBeVisible()
    const transition = await page.locator('.route__cell').first().evaluate((el) => {
      const style = getComputedStyle(el)
      return { property: style.transitionProperty, duration: style.transitionDuration }
    })
    expect(transition.property).toBe('opacity, transform')
    expect(transition.duration).toBe('0.18s, 0.18s')
  })

  test('prefers-reduced-motion: nenhuma transição nem animação ao trocar de caminho', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    const tabs = page.getByRole('tablist').getByRole('tab')
    await tabs.nth(1).click()
    const running = await page.evaluate(() => {
      const cells = [...document.querySelectorAll('.route__cell, .route__end')]
      return {
        durations: [...new Set(cells.map((el) => getComputedStyle(el).transitionDuration))],
        animations: document.getAnimations().length,
      }
    })
    expect(running.durations).toEqual(['0s'])
    expect(running.animations).toBe(0)
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
    expect(lines).toBeLessThanOrEqual(2)
  })
})

test.describe('axe-core', () => {
  for (const scheme of ['light', 'dark'] as const) {
    for (const path of ['/', '/en/']) {
      test(`sem violações critical/serious em ${path} (${scheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme })
        await page.goto(path)
        await expect(page.getByRole('tablist')).toBeVisible()
        const results = await new AxeBuilder({ page }).analyze()
        const blocking = results.violations
          .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
          .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
        expect(blocking).toEqual([])
      })
    }
  }
})
