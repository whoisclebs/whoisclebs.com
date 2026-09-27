import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type Route } from '@playwright/test'
import { activityBody, unavailableBody } from '../fixtures/activity-fixtures.mjs'

/**
 * Passo 11 — rodapé (convite, contato, atividade pública, horizonte) e `/contato/`.
 * `/api/activity` é interceptado com `page.route`: o estado do rodapé não depende do D1 do e2e.
 */

test.use({ timezoneId: 'America/Fortaleza' })

type Mode = 'fresh' | 'stale' | 'empty' | 'unavailable' | 'invalid' | 'hang'

async function mockActivity(page: Page, mode: Mode) {
  const calls: number[] = []
  await page.route('**/api/activity', async (route: Route) => {
    calls.push(Date.now())
    if (mode === 'hang') return // nunca responde: o cliente aborta no timeout
    if (mode === 'unavailable') return route.fulfill({ status: 503, json: unavailableBody })
    if (mode === 'invalid') return route.fulfill({ status: 200, json: { hello: 'world' } })
    const body = activityBody(mode === 'stale' ? 'stale' : 'fresh', new Date(), { empty: mode === 'empty' })
    return route.fulfill({ status: 200, json: body })
  })
  return calls
}

async function openFooter(page: Page, path = '/') {
  await page.goto(path)
  await page.getByRole('contentinfo').scrollIntoViewIfNeeded()
  await page.locator('[data-activity-state]').scrollIntoViewIfNeeded()
  return page.getByRole('region', { name: /Atividade pública|Public activity/ })
}

test.describe('atividade pública no rodapé', () => {
  test('fresh: itens com link do GitHub, rótulo "Em dia", fonte e <time> relativo', async ({ page }) => {
    await mockActivity(page, 'fresh')
    const region = await openFooter(page)
    await expect(region.locator('[data-activity-state="fresh"]')).toBeVisible()
    const status = region.locator('.status')
    await expect(status).toContainText('Em dia')
    await expect(status).toContainText('fonte: GitHub · atualizado há 12 minutos')
    expect(Date.parse((await status.locator('time').getAttribute('datetime')) ?? '')).not.toBeNaN()
    // Verde só com rótulo: a célula é decorativa e o estado está escrito.
    await expect(status.locator('.status__cell')).toHaveAttribute('aria-hidden', 'true')

    const links = region.getByRole('listitem').getByRole('link')
    await expect(links).toHaveCount(6) // o rodapé lista o cache inteiro (até 10), a mesma contagem do HUD
    for (const href of await links.evaluateAll((els) => els.map((el) => el.getAttribute('href')))) {
      expect(href).toMatch(/^https:\/\/github\.com\//)
    }
    await expect(region.getByRole('listitem').first().locator('time')).toHaveAttribute('datetime', /Z$/)
    // Nenhum contador: nada de "N commits", "N eventos".
    expect(await region.innerText()).not.toMatch(/\d+\s+(commits?|eventos|events|contribui)/i)
  })

  test('stale: aviso textual com a data da última sincronização e sem o verde de estado', async ({ page }) => {
    await mockActivity(page, 'stale')
    const region = await openFooter(page)
    const stale = region.locator('[data-activity-state="stale"] .status')
    await expect(stale).toContainText('Desatualizada: a última sincronização com o GitHub foi em')
    await expect(stale.locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}T/)
    await expect(stale).toContainText('2026') // data absoluta, não "há 3 dias"
    await expect(region.locator('.status__cell')).toHaveCount(0)
    await expect(region.getByRole('listitem')).toHaveCount(6)
  })

  test('sucesso sem eventos: diz que não há atividade recente, com a fonte', async ({ page }) => {
    await mockActivity(page, 'empty')
    const region = await openFooter(page)
    await expect(region).toContainText('Nenhuma atividade pública recente no GitHub.')
    await expect(region.locator('.status')).toContainText('fonte: GitHub')
  })

  test('503: "Atividade indisponível no momento" e link para o perfil', async ({ page }) => {
    await mockActivity(page, 'unavailable')
    const region = await openFooter(page)
    await expect(region.locator('[data-activity-state="unavailable"]')).toContainText('Atividade indisponível no momento.')
    await expect(region.getByRole('link', { name: 'Ver o perfil no GitHub' })).toHaveAttribute('href', 'https://github.com/whoisclebs')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('corpo fora do contrato também vira indisponível', async ({ page }) => {
    await mockActivity(page, 'invalid')
    const region = await openFooter(page)
    await expect(region).toContainText('Atividade indisponível no momento.')
  })

  test('API lenta: mostra "carregando" e, no timeout, indisponível sem travar a página', async ({ page }) => {
    test.setTimeout(30_000)
    await mockActivity(page, 'hang')
    const region = await openFooter(page)
    await expect(region.locator('[data-activity-state="loading"]')).toContainText('Carregando a atividade pública do GitHub')
    await expect(region.locator('[data-activity-state]')).toHaveAttribute('aria-busy', 'true')
    await expect(region.locator('[data-activity-state="unavailable"]')).toBeVisible({ timeout: 8_000 })
    await expect(region.locator('[data-activity-state]')).toHaveAttribute('aria-busy', 'false')
  })

  test('fora da home, só busca a atividade quando o rodapé se aproxima (depois do conteúdo crítico)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const calls = await mockActivity(page, 'fresh')
    await page.goto('/sobre/')
    await page.waitForLoadState('networkidle')
    expect(calls).toHaveLength(0)
    await page.locator('[data-activity-state]').scrollIntoViewIfNeeded()
    await expect.poll(() => calls.length).toBe(1)
  })

  test('na home, o HUD e o rodapé dividem uma única chamada, feita depois do load', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const calls = await mockActivity(page, 'fresh')
    await page.goto('/')
    await expect(page.locator('[data-hud-phase="done"]')).toBeVisible()
    await page.locator('[data-activity-state]').scrollIntoViewIfNeeded()
    await expect(page.locator('[data-activity-state="fresh"]')).toBeVisible()
    expect(calls).toHaveLength(1)
    // A requisição começa depois do fim do evento load da navegação (o LCP é o H1, não a atividade).
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const api = performance.getEntriesByType('resource').find((entry) => entry.name.endsWith('/api/activity'))
      return { loadEnd: nav.loadEventEnd, fetchStart: api?.startTime ?? -1 }
    })
    expect(timing.fetchStart).toBeGreaterThanOrEqual(timing.loadEnd)
  })

  test('inglês: rótulos em inglês, títulos marcados como pt-BR e páginas só em português sinalizadas', async ({ page }) => {
    await mockActivity(page, 'fresh')
    const region = await openFooter(page, '/en/')
    await expect(region.locator('.status')).toContainText('Up to date')
    await expect(region.locator('.status')).toContainText('source: GitHub · updated 12 minutes ago')
    await expect(region.locator('ul.items')).toHaveAttribute('lang', 'pt-BR')
    const more = page.getByRole('contentinfo').getByRole('navigation', { name: 'More' })
    await expect(more.getByRole('link', { name: 'Notes' })).toHaveAttribute('hreflang', 'pt-BR')
    await expect(more.getByRole('link', { name: 'Books' })).toHaveAttribute('href', '/en/books/')
  })
})

test.describe('rodapé sem JS', () => {
  test.use({ javaScriptEnabled: false })

  test('mostra convite, contato, RSS, currículo, navegação e o link para a atividade no GitHub', async ({ page }) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    await expect(footer.getByRole('heading', { name: 'Contato', exact: true })).toBeVisible()
    await expect(footer.getByRole('link', { name: 'hello@whoisclebs.com' })).toHaveAttribute('href', 'mailto:hello@whoisclebs.com')
    await expect(footer.getByRole('link', { name: 'RSS da Escrita' })).toHaveAttribute('href', '/rss/blog.xml')
    await expect(footer.getByRole('link', { name: 'Currículo (JSON)' })).toHaveAttribute('href', '/resume.json')
    for (const name of ['Notas', 'Livros', 'Hobbies', 'Agentes']) {
      await expect(footer.getByRole('navigation', { name: 'Mais' }).getByRole('link', { name })).toBeVisible()
    }
    const activity = footer.locator('[data-activity-state="nojs"]')
    await expect(activity).toContainText('A atividade pública recente fica no perfil do GitHub.')
    await expect(activity.getByRole('link', { name: 'perfil do GitHub' })).toHaveAttribute('href', 'https://github.com/whoisclebs')
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
  await mockActivity(page, 'fresh')
  await openFooter(page)
  await expect(page.locator('[data-activity-state="fresh"]')).toBeVisible()
  const footer = page.getByRole('contentinfo')
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

test.describe('horizonte de células', () => {
  test('é decorativo, fica estático com reduced motion e não gera overflow', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await mockActivity(page, 'fresh')
    await page.goto('/')
    const horizon = page.locator('.horizon')
    await expect(horizon).toHaveAttribute('aria-hidden', 'true')
    await expect(horizon).toHaveAttribute('data-rise', 'none')
    await horizon.scrollIntoViewIfNeeded()
    const duration = await page.locator('.sun-row').first().evaluate((el) => getComputedStyle(el).transitionDuration)
    expect(duration).toBe('0s')
    await expect(horizon).toHaveAttribute('data-rise', 'none')
  })

  test('sem reduced motion, o sol sobe uma vez quando o rodapé aparece', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await mockActivity(page, 'fresh')
    await page.goto('/')
    const horizon = page.locator('.horizon')
    await expect(horizon).toHaveAttribute('data-rise', 'pending')
    await horizon.scrollIntoViewIfNeeded()
    await expect(horizon).toHaveAttribute('data-rise', 'done')
    // Só transform/opacity animam, nunca `all`.
    const property = await page.locator('.sun-row').first().evaluate((el) => getComputedStyle(el).transitionProperty)
    expect(property).toBe('transform, opacity')
  })
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
  for (const mode of ['fresh', 'stale', 'unavailable'] as const) {
    test(`axe sem critical/serious com atividade ${mode} (${scheme})`, async ({ page }) => {
      test.setTimeout(60_000)
      await page.emulateMedia({ colorScheme: scheme })
      await mockActivity(page, mode)
      for (const path of mode === 'fresh' ? axeRoutes : ['/']) {
        await openFooter(page, path)
        await expect(page.locator(`[data-activity-state="${mode}"]`)).toBeVisible()
        const results = await new AxeBuilder({ page }).analyze()
        const serious = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
        expect(serious.map((v) => `${path}: ${v.id} ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
      }
    })
  }
}

for (const width of [390, 768, 1440]) {
  test(`sem overflow horizontal com o rodapé carregado em ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await mockActivity(page, 'fresh')
    for (const path of ['/', '/contato/', '/escrita/github-actions-como-fazer-deploy/', '/privacy-policy/', '/en/']) {
      await openFooter(page, path)
      await expect(page.locator('[data-activity-state="fresh"]')).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `${path} em ${width} px`).toBeLessThanOrEqual(0)
    }
  })
}
