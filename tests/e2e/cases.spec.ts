import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * Passo 07 — estudos de caso: navegação home → case → código, fontes por seção, índice de projetos,
 * sem JS e axe claro/escuro.
 */

const CASES = ['/projetos/tuxedo/', '/projetos/golpher/']
const SECTION_IDS = ['contexto', 'restricoes', 'decisao', 'arquitetura', 'alternativas', 'resultado', 'mudaria', 'codigo']

function isAllowedSource(href: string) {
  const url = new URL(href)
  return url.protocol === 'https:' && ['github.com', 'whoisclebs.com'].includes(url.hostname)
}

async function blockingViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  return results.violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

test('home → case tuxedo → código no GitHub', async ({ page }) => {
  // O GitHub é substituído por uma resposta local: o teste prova a navegação, não depende da rede.
  await page.route('https://github.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>GitHub (fixture)</title>' }))
  await page.goto('/')
  const cases = page.locator('[data-slot="cases"]')
  await expect(cases.getByRole('heading', { level: 3, name: 'tuxedo' })).toBeVisible()
  await expect(cases.getByRole('heading', { level: 3, name: 'golpher' })).toBeVisible()
  await cases.getByRole('link', { name: /^Ler o case\s*:\s*tuxedo$/ }).click()

  await expect(page).toHaveURL(/\/projetos\/tuxedo\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('tuxedo')

  const snippetLink = page.locator('#codigo figure.snippet figcaption a').first()
  const href = await snippetLink.getAttribute('href')
  expect(href).toMatch(/^https:\/\/github\.com\/whoisclebs\/tuxedo\/blob\/[0-9a-f]{40}\/[\w./-]+#L\d+-L\d+$/)
  await snippetLink.click()
  await expect(page).toHaveURL(href!)
})

for (const path of CASES) {
  test(`${path}: oito seções na ordem, cada uma com fonte visível`, async ({ page }) => {
    await page.goto(path)
    const ids = await page.locator('section.case-section').evaluateAll((sections) => sections.map((section) => section.id))
    expect(ids).toEqual(SECTION_IDS)
    for (const id of SECTION_IDS) {
      const sources = page.locator(`#${id} .case-section__sources a`)
      expect(await sources.count(), id).toBeGreaterThan(0)
      await expect(sources.first()).toBeVisible()
    }
  })

  test(`${path}: toda fonte e todo trecho apontam para https no GitHub ou no próprio site`, async ({ page }) => {
    await page.goto(path)
    const hrefs = await page
      .locator('.case-section__sources a, .arch__source, .snippet figcaption a, .case__facts a')
      .evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href))
    expect(hrefs.length).toBeGreaterThan(15)
    for (const href of hrefs) expect(isAllowedSource(href), href).toBe(true)
  })

  test(`${path}: diagrama tem texto equivalente e trechos numerados como no arquivo`, async ({ page }) => {
    await page.goto(path)
    const nodes = page.locator('.arch__node')
    expect(await nodes.count()).toBeGreaterThanOrEqual(5)
    await expect(page.locator('.arch figcaption')).not.toBeEmpty()
    // Lacunas são ditas em texto, não só pelo tracejado.
    for (const gap of await page.locator('.arch__node[data-state="gap"]').all()) await expect(gap).toContainText('Lacuna')
    // A numeração começa na linha do link (#Lx): o contador CSS parte de x − 1.
    const first = page.locator('.snippet').first()
    const [, start] = /#L(\d+)/.exec((await first.locator('figcaption a').getAttribute('href')) ?? '') ?? []
    const reset = await first.locator('pre code').evaluate((code) => getComputedStyle(code).counterReset)
    expect(reset).toBe(`line ${Number(start) - 1}`)
  })
}

test('análise do autor aparece rotulada no case', async ({ page }) => {
  await page.goto('/projetos/tuxedo/')
  await expect(page.locator('#mudaria .case-section__voice')).toContainText('Análise minha')
  await expect(page.locator('#resultado table caption')).toContainText('não são benchmarks')
})

test('/projetos/ é um índice com status, linguagem, último commit datado e link do código', async ({ page }) => {
  await page.goto('/projetos/')
  await expect(page.getByRole('heading', { level: 2, name: 'Estudos de caso' })).toBeVisible()
  const entries = page.locator('.case-entry, .other')
  expect(await entries.count()).toBe(4)
  for (const entry of await entries.all()) {
    await expect(entry.locator('time[datetime]').first()).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/)
    await expect(entry.getByText('Linguagem')).toBeVisible()
    await expect(entry.locator('a[href^="https://github.com/"]').first()).toBeVisible()
  }
})

test('no inglês, a página do projeto leva ao case em português com hreflang', async ({ page }) => {
  await page.goto('/en/projects/tuxedo/')
  const link = page.getByRole('link', { name: 'Read the case study (in Portuguese)' })
  await expect(link).toHaveAttribute('href', '/projetos/tuxedo/')
  await expect(link).toHaveAttribute('hreflang', 'pt-BR')
})

test('sem JS, o case mostra título, seções, fontes e código', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/projetos/golpher/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('golpher')
  await expect(page.locator('section.case-section')).toHaveCount(8)
  await expect(page.locator('.snippet pre').first()).toBeVisible()
  await context.close()
})

test.describe('axe-core nos cases', () => {
  for (const scheme of ['light', 'dark'] as const) {
    for (const path of ['/projetos/', ...CASES, '/en/projects/']) {
      test(`sem violações critical/serious em ${path} (${scheme})`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme })
        await page.goto(path)
        expect(await blockingViolations(page)).toEqual([])
      })
    }
  }
})
