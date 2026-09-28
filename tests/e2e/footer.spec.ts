import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * Passos 11 e 17 — rodapé (convite, perfis, leitura, navegação secundária, noite do farol) e `/contato/`.
 * A atividade pública saiu do rodapé e do HUD: nenhuma página chama
 * `/api/activity`.
 */

test.use({ timezoneId: 'America/Fortaleza' })

/** Abre a página e rola até o rodapé (a camada animada da cena entra perto dele). */
async function openFooter(page: Page, path = '/') {
  await page.goto(path)
  const footer = page.getByRole('contentinfo')
  await footer.scrollIntoViewIfNeeded()
  const scene = page.locator('footer .scene__image')
  if (await scene.count()) await scene.scrollIntoViewIfNeeded()
  return footer
}

test('o rodapé não tem região de atividade pública e nenhuma página chama a API (PT e EN)', async ({ page }) => {
  const calls: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/activity')) calls.push(request.url())
  })
  for (const path of ['/sobre/', '/en/']) {
    const footer = await openFooter(page, path)
    await expect(footer.getByRole('region', { name: /Atividade pública|Public activity/ })).toHaveCount(0)
    await expect(footer.locator('[data-activity-state]')).toHaveCount(0)
    await expect(footer).not.toContainText(/Atividade pública|Public activity/)
  }
  await page.waitForTimeout(500)
  expect(calls).toEqual([])
})

test('inglês: rótulos em inglês e páginas só em português sinalizadas', async ({ page }) => {
  const footer = await openFooter(page, '/en/')
  await expect(footer.getByRole('heading', { name: 'Contact', exact: true })).toBeVisible()
  const notes = footer.getByRole('navigation', { name: 'More' }).getByRole('link', { name: 'Notes' })
  await expect(notes).toHaveAttribute('hreflang', 'pt-BR')
})

test.describe('rodapé sem JS', () => {
  test.use({ javaScriptEnabled: false })

  test('mostra convite, contato, RSS, currículo, navegação e a imagem da cena', async ({ page }) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    await expect(footer.getByRole('heading', { name: 'Contato', exact: true })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'hello@whoisclebs.com' })).toHaveAttribute('href', 'mailto:hello@whoisclebs.com')
    await expect(footer.getByRole('link', { name: 'RSS da Escrita' })).toHaveAttribute('href', '/rss/blog.xml')
    await expect(footer.getByRole('link', { name: 'Currículo (JSON)' })).toHaveAttribute('href', '/resume.json')
    for (const name of ['Notas', 'Livros', 'Hobbies', 'Agentes']) {
      await expect(footer.getByRole('navigation', { name: 'Mais' }).getByRole('link', { name })).toBeVisible()
    }
    await expect(footer.getByRole('link', { name: 'GitHub', exact: true })).toHaveAttribute('href', 'https://github.com/whoisclebs')
    await expect(footer.locator('.scene__image')).toHaveAttribute('alt', '')
    await expect(footer).not.toContainText('Carregando')
  })

  test('/contato/ lista e-mail e perfis reais, sem formulário', async ({ page }) => {
    await page.goto('/contato/')
    const main = page.getByRole('main')
    await expect(main.getByRole('heading', { level: 1, name: 'Contato' })).toBeVisible()
    await expect(main.getByRole('link', { name: 'hello@whoisclebs.com' })).toHaveAttribute('href', 'mailto:hello@whoisclebs.com')
    for (const [name, href] of [
      ['GitHub', 'https://github.com/whoisclebs'],
      ['LinkedIn', 'https://linkedin.com/in/whoisclebs'],
      ['Substack', 'https://whoisclebs.substack.com'],
      ['YouTube', 'https://www.youtube.com/@whoisclebs'],
    ] as const) {
      await expect(main.getByRole('link', { name, exact: true })).toHaveAttribute('href', href)
    }
    await expect(page.locator('form')).toHaveCount(0)
    await expect(main).toContainText('Não há formulário de contato nem newsletter própria aqui.')
    // O convite do rodapé não se repete na própria página de contato.
    await expect(page.getByRole('contentinfo').getByRole('heading', { name: 'Contato', exact: true })).toHaveCount(0)
    // O Dribbble saiu (perfil com 404, auditoria editorial).
    await expect(page.getByRole('link', { name: 'Dribbble' })).toHaveCount(0)
  })
})

test('teclado: os links do rodapé seguem a ordem visual e têm foco visível', async ({ page }) => {
  const footer = await openFooter(page)
  const expected = await footer.locator('a').evaluateAll((els) => els.map((el) => el.getAttribute('href')))
  await footer.locator('a').first().focus()
  const seen: (string | null)[] = []
  for (let i = 0; i < expected.length; i += 1) {
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement
      const style = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return { href: el.getAttribute('href'), outline: style.outlineStyle, width: style.outlineWidth, visible: rect.width > 0 && rect.bottom > 0 && rect.top < innerHeight }
    })
    expect(info.outline, `${info.href}`).toBe('solid')
    expect(info.width).toBe('2px')
    expect(info.visible).toBe(true)
    seen.push(info.href)
    await page.keyboard.press('Tab')
  }
  expect(seen).toEqual(expected)
})

test('Política de Privacidade e Termos descrevem o site novo (PT e EN)', async ({ page }) => {
  await page.goto('/privacy-policy/')
  const pt = page.getByRole('main')
  await expect(pt).toContainText('Cloudflare Workers')
  await expect(pt).toContainText('não usa localStorage')
  await expect(pt).toContainText('/api/activity')
  await expect(pt).toContainText('Carregar comentários')
  await expect(pt).not.toContainText('GitHub Pages')
  await page.goto('/en/privacy-policy/')
  const en = page.getByRole('main')
  await expect(en).toContainText('Cloudflare Workers')
  await expect(en).toContainText('does not use localStorage')
  await expect(en).toContainText('Load comments')
  await page.goto('/terms-of-use/')
  await expect(page.getByRole('main')).toContainText('Este site não tem formulário de contato próprio.')
  await page.goto('/en/terms-of-use/')
  await expect(page.getByRole('main')).toContainText('This site has no contact form of its own.')
})

const axeRoutes = ['/', '/contato/', '/privacy-policy/', '/en/privacy-policy/', '/terms-of-use/']
for (const scheme of ['light', 'dark'] as const) {
  test(`axe sem critical/serious no rodapé (${scheme})`, async ({ page }) => {
    test.setTimeout(60_000)
    await page.emulateMedia({ colorScheme: scheme })
    for (const path of axeRoutes) {
      await openFooter(page, path)
      const results = await new AxeBuilder({ page }).analyze()
      const serious = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
      expect(serious.map((v) => `${path}: ${v.id} ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
    }
  })
}

test('a 404 não tem rodapé de contato: só o ciclo do farol ', async ({ page }) => {
  const response = await page.goto('/nao-existe/')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('contentinfo')).toHaveCount(0)
  await expect(page.getByText('hello@whoisclebs.com')).toHaveCount(0)
})

for (const width of [390, 768, 1440]) {
  test(`sem overflow horizontal com o rodapé carregado em ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/', '/contato/', '/escrita/github-actions-como-fazer-deploy/', '/privacy-policy/', '/en/']) {
      await openFooter(page, path)
      await expect.poll(() => page.locator('footer .scene__image').evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `${path} em ${width} px`).toBeLessThanOrEqual(0)
    }
  })
}
