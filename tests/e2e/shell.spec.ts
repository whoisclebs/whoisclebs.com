import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { blockingViolations, gotoWithEggs, horizontalOverflow, scrollThrough } from './helpers'

/**
 * Casca do site (Grafite Editorial): cabeçalho fixo por teclado, sem JS, paleta única, `lang` na navegação pelo
 * cliente, overflow nas rotas-chave e axe, incluindo os estados abertos (notebook, gaveta do celular, atalhos,
 * livro, console de bolso, d20).
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
      // Marca (no celular só o símbolo; o nome continua no texto e no aria-label), três destinos e o idioma.
      const expected = ['Pular para o conteúdo', 'whoisclebs', 'Artigos', 'Projetos', 'Sobre', 'PT (Português)', 'EN (English)']
      for (const text of expected) {
        await page.keyboard.press('Tab')
        const info = await focusedInfo(page)
        expect(info?.text).toBe(text)
        expect(info?.inViewport, `${text} visível`).toBe(true)
        expect(info?.outlineStyle).toBe('solid')
        expect(info?.outlineWidth).toBe('2px')
        expect(info?.outlineOffset).toBe('3px')
      }
      await expect(page.getByRole('banner').getByRole('link', { name: 'WHOISCLEBS, Clebson Augusto' })).toHaveAttribute('href', '/')
      // Volta para "Artigos" e segue o link pelo teclado.
      for (let i = 0; i < 4; i += 1) await page.keyboard.press('Shift+Tab')
      expect((await focusedInfo(page))?.text).toBe('Artigos')
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(/\/escrita\/$/)
      const nav = page.getByRole('navigation', { name: 'Principal' })
      await expect(nav.getByRole('link', { name: 'Artigos' })).toHaveAttribute('aria-current', 'page')
      await expect(nav.getByRole('link', { name: 'Projetos' })).not.toHaveAttribute('aria-current', /.+/)
    })
  }

  for (const width of [390, 1440]) {
    test(`os links do cabeçalho fixo mantêm o contraste AA sobre qualquer conteúdo que passe por baixo (${width} px)`, async ({ page }) => {
      test.setTimeout(90_000)
      await page.setViewportSize({ width, height: 900 })
      // O Sobre tem as cópias em papel (a superfície mais clara do site); a home, os botões brancos e o filtro ativo.
      const problems: string[] = []
      for (const path of ['/sobre/', '/']) {
        await page.goto(path)
        const height = await page.evaluate(() => document.documentElement.scrollHeight)
        for (let y = 0; y < height; y += 150) {
          await page.evaluate((top) => scrollTo(0, top), y)
          await page.waitForTimeout(30)
          const results = await new AxeBuilder({ page }).withRules(['color-contrast']).include('header.site-header').analyze()
          for (const violation of results.violations) for (const node of violation.nodes) problems.push(`${path} @${y}px: ${node.target.join(' ')}`)
        }
      }
      expect(problems).toEqual([])
    })
  }

  test('cabeçalho fixo de 56 px que fica no topo ao rolar', async ({ page }) => {
    await page.goto('/escrita/github-actions-como-fazer-deploy/')
    const header = page.getByRole('banner')
    expect(await header.evaluate((el) => el.getBoundingClientRect().height)).toBe(56)
    await page.mouse.wheel(0, 1500)
    await expect.poll(() => header.evaluate((el) => el.getBoundingClientRect().top)).toBe(0)
    await expect(header.getByRole('navigation', { name: 'Principal' })).toBeInViewport()
  })

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
  test('cabeçalho, navegação e rodapé funcionam sem JS (o menu não depende de script)', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'Principal' })
    for (const [name, href] of [
      ['Artigos', '/escrita/'],
      ['Projetos', '/projetos/'],
      ['Sobre', '/sobre/'],
    ] as const) {
      await expect(nav.getByRole('link', { name })).toHaveAttribute('href', href)
    }
    // O botão de contato saiu do cabeçalho: o contato fica no rodapé.
    await expect(page.getByRole('banner').getByRole('link', { name: 'Contato' })).toHaveCount(0)
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Contato' })).toHaveAttribute('href', '/contato/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await nav.getByRole('link', { name: 'Projetos' }).click()
    await expect(page).toHaveURL(/\/projetos\/$/)
    await context.close()
  })
})

test.describe('paleta única (Grafite Editorial)', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`a preferência do sistema (${scheme}) não muda nada: grafite em todas as superfícies`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto('/escrita/github-actions-como-fazer-deploy/')
      expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(20, 21, 24)')
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark')
      // Blocos de código no grafite mais fundo; nenhuma superfície clara.
      expect(await page.locator('.code-block').first().evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(11, 12, 16)')
      const light = await page.evaluate(() =>
        [...document.querySelectorAll('body *')]
          .filter((el) => {
            const [r = 0, g = 0, b = 0, a = 1] = (getComputedStyle(el).backgroundColor.match(/[\d.]+/g) ?? []).map(Number)
            return a > 0.5 && r > 200 && g > 200 && b > 200 && el.getBoundingClientRect().width > 200
          })
          .map((el) => `${el.tagName.toLowerCase()}.${el.className}`),
      )
      expect(light).toEqual([])
    })
  }
})

test.describe('lang do <html> na navegação pelo cliente', () => {
  test('/en/ → Notas (pt-BR) pelo roteador do cliente → voltar', async ({ page }) => {
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

test.describe('layout', () => {
  for (const width of widths) {
    test(`sem overflow horizontal em ${width} px nas rotas-chave`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      for (const path of keyRoutes) {
        await page.goto(path)
        // Rola a página inteira: as ilhas (aparelho, d20, estante) entram e o rodapé também conta.
        await scrollThrough(page)
        expect(await horizontalOverflow(page), `${path} em ${width} px`).toBeLessThanOrEqual(0)
      }
    })
  }

  for (const width of [320, 768]) {
    test(`em ${width} px o header cabe numa linha e o H1 fica nas duas linhas do desenho`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      const tops = await page.getByRole('banner').getByRole('link').evaluateAll((links) => links.map((a) => Math.round(a.getBoundingClientRect().top)))
      expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(12)
      const lines = await page.getByRole('heading', { level: 1 }).evaluate((h1) => {
        const lineHeight = parseFloat(getComputedStyle(h1).lineHeight)
        return Math.round(h1.getBoundingClientRect().height / lineHeight)
      })
      // "Entre código, / ideias e sistemas.": uma linha por <span>, sem quebra extra a partir de 320 px.
      expect(lines).toBeLessThanOrEqual(width < 400 ? 3 : 2)
    })
  }
})

test.describe('axe-core', () => {
  for (const scheme of ['light', 'dark'] as const) {
    for (const path of ['/', '/en/']) {
      test(`sem violações critical/serious em ${path} (${scheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme })
        await page.goto(path, { waitUntil: 'load' })
        // Com o hero já pintado e o rodapé e as ilhas carregados.
        await expect(page.locator('section.hero [data-shown]')).toHaveCount(1, { timeout: 10_000 })
        await scrollThrough(page)
        expect(await blockingViolations(page)).toEqual([])
      })
    }
  }

  test('home com o notebook aberto e o terminal ligado', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.locator('#terminal').scrollIntoViewIfNeeded()
    await page.getByRole('button', { name: 'Abrir o notebook' }).click()
    await expect(page.getByRole('textbox', { name: 'Comando do terminal' })).toBeFocused({ timeout: 10_000 })
    await page.getByRole('textbox', { name: 'Comando do terminal' }).fill('help')
    await page.keyboard.press('Enter')
    expect(await blockingViolations(page)).toEqual([])
  })

  test('home no celular com a gaveta de aplicativos aberta', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.locator('#terminal').scrollIntoViewIfNeeded()
    await page.getByRole('group', { name: 'Celular com aplicativos' }).getByRole('button', { name: 'Ligar o celular' }).first().click()
    await expect(page.getByRole('navigation', { name: 'Aplicativos' })).toBeVisible({ timeout: 10_000 })
    expect(await blockingViolations(page)).toEqual([])
  })

  test('painel de atalhos aberto', async ({ page }) => {
    await gotoWithEggs(page, '/')
    await page.keyboard.press('?')
    await expect(page.getByRole('dialog', { name: 'Atalhos' })).toBeVisible()
    expect(await blockingViolations(page)).toEqual([])
  })

  test('livro aberto na estante', async ({ page }) => {
    await page.goto('/livros/')
    await page.getByRole('region', { name: 'Recomendações' }).getByRole('button').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.waitForTimeout(800) // fim da animação de abrir
    expect(await blockingViolations(page)).toEqual([])
  })

  test('console de bolso aberto no Sobre', async ({ page }) => {
    await page.goto('/sobre/')
    await page.getByRole('button', { name: 'Abrir o console de bolso' }).click()
    await expect(page.getByRole('group', { name: 'Pocket CLEBS' })).toBeVisible()
    expect(await blockingViolations(page)).toEqual([])
  })

  test('d20 depois de uma rolagem em Hobbies', async ({ page }) => {
    await page.goto('/hobbies/')
    const dice = page.getByRole('region', { name: 'Um d20 na mesa' })
    await dice.scrollIntoViewIfNeeded()
    await dice.getByRole('button', { name: 'Rolar o d20' }).click()
    await expect(dice).toContainText(/Resultado:/, { timeout: 5_000 })
    expect(await blockingViolations(page)).toEqual([])
  })
})
