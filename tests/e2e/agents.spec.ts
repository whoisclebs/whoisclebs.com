import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * capítulo de IA agêntica: dois níveis sem JS, teclado, status verdadeiro, Mapa → capítulo,
 * home (capítulo 4) e axe claro/escuro.
 */

const PATH = '/agentes/'

async function blockingViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  return results.violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

test('sem JS: H1, os dois níveis visíveis, as cinco partes, os tópicos técnicos e os projetos', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(PATH)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Agentes de IA')
  await expect(page.getByRole('heading', { level: 2, name: 'Visão geral: o laço em cinco partes' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Detalhes técnicos' })).toBeVisible()
  const steps = page.locator('#visao-geral ol.loop > li h3')
  await expect(steps).toHaveText(['Objetivo', 'Seleção de contexto', 'Ações', 'Avaliação', 'Observabilidade'])
  const topics = page.locator('#detalhes-tecnicos section.topic h3')
  await expect(topics).toHaveText(['Limites de contexto', 'Memória', 'Permissões', 'Avaliação', 'Falhas'])
  for (const topic of await page.locator('#detalhes-tecnicos section.topic').all()) {
    await expect(topic.locator('aside a').first()).toBeVisible()
  }
  await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible()
  await context.close()
})

test('status verdadeiro: todo projeto em produção ou protótipo tem link público de código', async ({ page }) => {
  await page.goto(PATH)
  const projects = page.locator('#projetos li.project')
  expect(await projects.count()).toBeGreaterThan(0)
  for (const project of await projects.all()) {
    const status = (await project.locator('.project__status').innerText()).trim()
    const name = (await project.locator('h3').innerText()).trim()
    if (/^(Produção|Protótipo)$/.test(status)) {
      const code = project.locator('dt:text-is("Código") + dd a')
      await expect(code, name).toHaveAttribute('href', /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/)
    } else {
      expect(status, name).toMatch(/^(Pesquisa|Privado|Em construção, sem código público)$/)
    }
  }
  await expect(projects.filter({ hasText: 'Orquestrador de agentes em Go' }).locator('.project__status')).toHaveText('Em construção, sem código público')
  // Nenhum número de benchmark (porcentagens, Recall, MRR) no capítulo.
  expect(await page.locator('main').innerText()).not.toMatch(/\d\s?%|recall@|\bMRR\b/i)
})

test('teclado: as duas leituras levam aos níveis com foco visível', async ({ page }) => {
  await page.goto(PATH)
  const target = page.getByRole('navigation', { name: 'Duas leituras' }).getByRole('link', { name: 'Detalhes técnicos' })
  let found = false
  for (let i = 0; i < 25 && !found; i += 1) {
    await page.keyboard.press('Tab')
    found = await target.evaluate((el) => el === document.activeElement)
  }
  expect(found).toBe(true)
  const outline = await target.evaluate((el) => getComputedStyle(el).outlineStyle)
  expect(outline).toBe('solid')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#detalhes-tecnicos$/)
  await expect(page.getByRole('heading', { level: 2, name: 'Detalhes técnicos' })).toBeInViewport()
})

test('home → capítulo de agentes pelo teclado (o Mapa de Decisões saiu)', async ({ page }) => {
  await page.goto('/')
  const link = page.locator('[data-slot="agents"] a')
  await link.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/agentes\/$/)
})

test('home: capítulo 4 entre os casos e a escrita, com link (PT e EN)', async ({ page }) => {
  await page.goto('/')
  const slots = await page.locator('[data-slot]').evaluateAll((els) => els.map((el) => el.getAttribute('data-slot')))
  expect(slots.indexOf('agents')).toBe(slots.indexOf('cases') + 1)
  await expect(page.locator('[data-slot="agents"] a')).toHaveAttribute('href', PATH)
  await page.goto('/en/')
  const link = page.locator('[data-slot="agents"] a')
  await expect(link).toHaveAttribute('href', PATH)
  await expect(link).toHaveAttribute('hreflang', 'pt-BR')
})

test('rodapé e sitemap incluem o capítulo', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Agentes' })).toHaveAttribute('href', PATH)
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).toContain('https://whoisclebs.com/agentes/')
})

for (const scheme of ['light', 'dark'] as const) {
  test(`axe sem critical/serious em ${PATH} (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    await page.goto(PATH)
    await page.locator('details.statuses summary').click()
    expect(await blockingViolations(page)).toEqual([])
  })
}
