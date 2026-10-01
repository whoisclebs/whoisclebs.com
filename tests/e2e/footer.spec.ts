import { expect, test } from '@playwright/test'
import { blockingViolations } from './helpers'

/**
 * Rodapé em duas linhas (Grafite Editorial): em cima, as páginas que não cabem no cabeçalho (Notas, Livros,
 * Hobbies, Contato, RSS, currículo); embaixo, a marca, o jurídico e os perfis. Presente em todas as páginas,
 * inclusive a 404. Também: `/contato/` e os textos legais. Nenhuma página chama `/api/activity`.
 */

test('nenhuma página chama /api/activity e o rodapé não tem região de atividade (PT e EN)', async ({ page }) => {
  const calls: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/activity')) calls.push(request.url())
  })
  for (const path of ['/', '/sobre/', '/en/']) {
    await page.goto(path, { waitUntil: 'networkidle' })
    const footer = page.getByRole('contentinfo')
    await footer.scrollIntoViewIfNeeded()
    await expect(footer.getByRole('region')).toHaveCount(0)
    await expect(footer).not.toContainText(/Atividade pública|Public activity/)
  }
  await page.waitForTimeout(500)
  expect(calls).toEqual([])
})

test.describe('rodapé sem JS', () => {
  test.use({ javaScriptEnabled: false })

  test('português: páginas secundárias, contato, RSS, currículo, jurídico e perfis', async ({ page }) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    const more = footer.getByRole('navigation', { name: 'Mais' })
    for (const [name, href] of [
      ['Notas', '/notas/'],
      ['Livros', '/livros/'],
      ['Hobbies', '/hobbies/'],
      ['Contato', '/contato/'],
      ['RSS', '/rss/blog.xml'],
      ['Currículo (JSON)', '/resume.json'],
    ] as const) {
      await expect(more.getByRole('link', { name, exact: true })).toHaveAttribute('href', href)
    }
    for (const [name, href] of [
      ['Privacidade', '/privacy-policy/'],
      ['Termos', '/terms-of-use/'],
      ['GitHub', 'https://github.com/whoisclebs'],
    ] as const) {
      await expect(footer.getByRole('link', { name, exact: true })).toHaveAttribute('href', href)
    }
    await expect(footer.getByRole('link', { name: 'LinkedIn', exact: true })).toHaveAttribute('href', /linkedin\.com\/in\/whoisclebs/)
    await expect(footer).toContainText('© 2022–2026 Clebson A. Fonseca.')
  })

  test('inglês: rótulos em inglês, páginas só em português sinalizadas e contato pelo e-mail', async ({ page }) => {
    await page.goto('/en/')
    const footer = page.getByRole('contentinfo')
    const more = footer.getByRole('navigation', { name: 'More' })
    const notes = more.getByRole('link', { name: 'Notes', exact: true })
    await expect(notes).toHaveAttribute('href', '/notas/')
    await expect(notes).toHaveAttribute('hreflang', 'pt-BR')
    await expect(more.getByRole('link', { name: 'Contact', exact: true })).toHaveAttribute('href', 'mailto:hello@whoisclebs.com')
    await expect(more.getByRole('link', { name: 'RSS', exact: true })).toHaveAttribute('href', '/rss/blog-en.xml')
    await expect(footer.getByRole('link', { name: 'Privacy', exact: true })).toHaveAttribute('href', '/en/privacy-policy/')
    await expect(footer.getByRole('link', { name: 'Terms', exact: true })).toHaveAttribute('href', '/en/terms-of-use/')
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
    // O Dribbble saiu (perfil com 404, auditoria editorial).
    await expect(page.getByRole('link', { name: 'Dribbble' })).toHaveCount(0)
  })
})

test('todo link interno do rodapé responde 200 (PT e EN)', async ({ page, request }) => {
  for (const path of ['/', '/en/']) {
    await page.goto(path)
    const hrefs = await page.getByRole('contentinfo').locator('a[href^="/"]').evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''))
    expect(hrefs.length).toBeGreaterThan(5)
    for (const href of hrefs) expect((await request.get(href, { maxRedirects: 0 })).status(), href).toBe(200)
  }
})

test('teclado: os controles do rodapé seguem a ordem visual e têm foco visível', async ({ page }) => {
  await page.goto('/')
  const footer = page.getByRole('contentinfo')
  await footer.scrollIntoViewIfNeeded()
  // Links e a marca (um botão: o easter egg dos cinco cliques), na ordem do documento.
  const controls = footer.locator('a, button')
  const expected = await controls.evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? el.textContent?.trim() ?? ''))
  await controls.first().focus()
  const seen: string[] = []
  for (let i = 0; i < expected.length; i += 1) {
    const info = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement
      const style = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return { id: el.getAttribute('href') ?? el.textContent?.trim() ?? '', outline: style.outlineStyle, width: style.outlineWidth, visible: rect.width > 0 && rect.bottom > 0 && rect.top < innerHeight }
    })
    expect(info.outline, info.id).toBe('solid')
    expect(info.width, info.id).toBe('2px')
    expect(info.visible, info.id).toBe(true)
    seen.push(info.id)
    await page.keyboard.press('Tab')
  }
  expect(seen).toEqual(expected)
})

test('Política de Privacidade cita as duas chaves de localStorage; Termos sem formulário (PT e EN)', async ({ page }) => {
  await page.goto('/privacy-policy/')
  const pt = page.getByRole('main')
  await expect(pt).toContainText('Cloudflare Workers')
  await expect(pt).toContainText('whoisclebs.snake.hi')
  await expect(pt).toContainText('whoisclebs.hero')
  await expect(pt).toContainText('Carregar comentários')
  await expect(pt).not.toContainText('GitHub Pages')
  await page.goto('/en/privacy-policy/')
  const en = page.getByRole('main')
  await expect(en).toContainText('Cloudflare Workers')
  await expect(en).toContainText('whoisclebs.snake.hi')
  await expect(en).toContainText('whoisclebs.hero')
  await expect(en).toContainText('Load comments')
  await page.goto('/terms-of-use/')
  await expect(page.getByRole('main')).toContainText('Este site não tem formulário de contato próprio.')
  await page.goto('/en/terms-of-use/')
  await expect(page.getByRole('main')).toContainText('This site has no contact form of its own.')
})

test('a 404 tem o cabeçalho e o rodapé do site', async ({ page }) => {
  const response = await page.goto('/nao-existe/')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('banner').getByRole('navigation', { name: 'Principal' })).toBeVisible()
  const footer = page.getByRole('contentinfo')
  await expect(footer).toBeVisible()
  await expect(footer.getByRole('navigation', { name: 'Mais' }).getByRole('link', { name: 'Notas' })).toBeVisible()
})

const axeRoutes = ['/', '/contato/', '/privacy-policy/', '/en/privacy-policy/', '/terms-of-use/']
for (const scheme of ['light', 'dark'] as const) {
  test(`axe sem critical/serious com o rodapé à vista (${scheme})`, async ({ page }) => {
    test.setTimeout(60_000)
    await page.emulateMedia({ colorScheme: scheme })
    for (const path of axeRoutes) {
      await page.goto(path)
      await page.getByRole('contentinfo').scrollIntoViewIfNeeded()
      expect(await blockingViolations(page), path).toEqual([])
    }
  })
}
