import { expect, test } from '@playwright/test'
import { blockingViolations } from './helpers'

/**
 * estudos de caso: navegação home → case → código, seções com título próprio e links no texto,
 * índice de projetos, sem JS e axe claro/escuro.
 */

const CASES = ['/projetos/tuxedo/', '/projetos/golpher/']

function isAllowedSource(href: string) {
  const url = new URL(href)
  return url.protocol === 'https:' && ['github.com', 'whoisclebs.com'].includes(url.hostname)
}

test('home → case tuxedo → código no GitHub', async ({ page }) => {
  // O GitHub é substituído por uma resposta local: o teste prova a navegação, não depende da rede.
  await page.route('https://github.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>GitHub (fixture)</title>' }))
  await page.goto('/')
  // Na home os projetos ficam em "Ideias em construção"; o link de um projeto com case leva ao estudo.
  const projects = page.getByRole('region', { name: 'Ideias em construção' })
  await expect(projects.getByRole('heading', { level: 3, name: 'tuxedo' })).toBeVisible()
  await expect(projects.getByRole('heading', { level: 3, name: 'golpher' })).toBeVisible()
  await expect(projects.getByRole('link', { name: /^Conhecer projeto\s*:\s*golpher$/ })).toHaveAttribute('href', '/projetos/golpher/')
  await projects.getByRole('link', { name: /^Conhecer projeto\s*:\s*tuxedo$/ }).click()

  await expect(page).toHaveURL(/\/projetos\/tuxedo\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('tuxedo')

  const snippetLink = page.locator('figure.snippet figcaption a').first()
  const href = await snippetLink.getAttribute('href')
  expect(href).toMatch(/^https:\/\/github\.com\/whoisclebs\/tuxedo\/blob\/[0-9a-f]{40}\/[\w./-]+#L\d+-L\d+$/)
  await snippetLink.click()
  await expect(page).toHaveURL(href!)
})

for (const path of CASES) {
  test(`${path}: seções com título e âncora próprios, índice no topo e links de código no texto`, async ({ page }) => {
    await page.goto(path)
    const sections = page.locator('section.case-section')
    const ids = await sections.evaluateAll((items) => items.map((item) => item.id))
    expect(ids.length).toBeGreaterThanOrEqual(4)
    expect(new Set(ids).size).toBe(ids.length)
    const toc = await page.locator('.case__toc a').evaluateAll((links) => links.map((link) => link.getAttribute('href')))
    expect(toc).toEqual(ids.map((id) => `#${id}`))
    for (const id of ids) await expect(page.locator(`#${id} h2`)).not.toBeEmpty()
    expect(await page.locator('.case-section__text p a[href^="https://github.com/"]').count()).toBeGreaterThan(5)
    // Sem o formato de laudo: nada de rótulo de análise, painel de fontes, tabela ou data de conferência.
    for (const gone of ['.case-section__voice', '.case-section__sources', '.measurements table']) await expect(page.locator(gone)).toHaveCount(0)
    await expect(page.locator('main')).not.toContainText(/conferid[ao]s? em|Análise minha|simulador/i)
  })

  test(`${path}: todo link do texto, do diagrama e dos trechos aponta para https no GitHub ou no próprio site`, async ({ page }) => {
    await page.goto(path)
    const hrefs = await page
      .locator('.case-section a, .case__facts a, .case__revision a')
      .evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).href))
    expect(hrefs.length).toBeGreaterThan(15)
    for (const href of hrefs) expect(isAllowedSource(href), href).toBe(true)
  })

  test(`${path}: medições em uma linha cada, com comando e ambiente`, async ({ page }) => {
    await page.goto(path)
    const runs = page.locator('.runs li')
    expect(await runs.count()).toBeGreaterThan(0)
    for (const run of await runs.all()) await expect(run).toContainText(/^Rodei go /)
    await expect(page.locator('.runs .runs__context').last()).toContainText('Go 1.26.4')
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

test('o rodapé do case diz qual revisão do código o texto cita', async ({ page }) => {
  await page.goto('/projetos/tuxedo/')
  await expect(page.locator('.case__revision')).toContainText('Código lido na revisão 5fbf678')
  await expect(page.locator('.case__revision a')).toHaveAttribute('href', /\/commit\/5fbf678c40f9d0c628a960ea353204c205faf9d7$/)
})

test('/projetos/ é um índice com status, linguagem, último commit datado e link do código', async ({ page }) => {
  await page.goto('/projetos/')
  // Uma lista só, do commit mais recente ao mais antigo; os dois cases levam o link do estudo.
  const entries = page.locator('.case-entry')
  expect(await entries.count()).toBe(4)
  const dates = await entries.evaluateAll((els) => els.map((el) => el.querySelector('dd time')?.getAttribute('datetime') ?? ''))
  expect(dates).toEqual([...dates].sort().reverse())
  await expect(page.locator('.case-entry[data-case]')).toHaveCount(2)
  for (const entry of await entries.all()) {
    await expect(entry.locator('time[datetime]').first()).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/)
    await expect(entry.getByText('Linguagem')).toBeVisible()
    await expect(entry.locator('a[href^="https://github.com/"]').first()).toBeVisible()
  }
})

test('no inglês, a página do projeto leva ao case em português com hreflang', async ({ page }) => {
  await page.goto('/en/projects/tuxedo/')
  const link = page.getByRole('link', { name: 'Read the write-up (in Portuguese)' })
  await expect(link).toHaveAttribute('href', '/projetos/tuxedo/')
  await expect(link).toHaveAttribute('hreflang', 'pt-BR')
})

test('sem JS, o case mostra título, seções, links e código', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/projetos/golpher/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('golpher')
  expect(await page.locator('section.case-section').count()).toBeGreaterThanOrEqual(4)
  await expect(page.locator('.case-section__text p a').first()).toBeVisible()
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
