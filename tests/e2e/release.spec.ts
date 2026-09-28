import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { activityBody } from '../fixtures/activity-fixtures.mjs'

/**
 * Passo 14 — o que faltava do portão final nas rotas-chave:
 * - sem erro de console, sem exceção de página e sem request 4xx/5xx inesperado (página inteira percorrida,
 *   rodapé com a atividade carregada);
 * - `prefers-reduced-motion`: nenhuma animação CSS e nenhuma transição de deslocamento/tamanho dispara ao
 *   carregar e rolar a página inteira (opacidade e cor continuam permitidas, como em tokens.css);
 * - nenhuma `<img>` acima da dobra sem `width`/`height` (390 e 1440 px), incluindo o 404 do Worker;
 * - axe claro/escuro nas rotas-chave que ainda não tinham (as demais estão em shell, writing, cases,
 *   agents, footer e simulator).
 * O overflow em 390/768/1440 de todas as rotas-chave já está em `shell.spec.ts` (grupo "layout").
 */

const keyRoutes = [
  '/',
  '/projetos/',
  '/projetos/tuxedo/',
  '/projetos/golpher/',
  '/escrita/',
  '/escrita/github-actions-como-fazer-deploy/',
  '/notas/',
  '/notas/docker-healthcheck-para-servicos/',
  '/agentes/',
  '/sobre/',
  '/contato/',
  '/livros/',
  '/hobbies/',
  '/rota-inexistente/',
  '/en/',
]
const NOT_FOUND = '/rota-inexistente/'

/** `/api/activity` responde a fixture "fresh": o estado do rodapé não depende do D1 do e2e. */
async function mockActivity(page: Page) {
  await page.route('**/api/activity', (route) => route.fulfill({ status: 200, json: activityBody('fresh', new Date()) }))
}

/** Rola até o fim em passos de uma tela (dispara IntersectionObserver do rodapé e do horizonte) e volta ao topo. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 40))
    }
    window.scrollTo(0, document.documentElement.scrollHeight)
    await new Promise((resolve) => setTimeout(resolve, 200))
  })
}

test.describe('console e rede limpos', () => {
  for (const path of keyRoutes) {
    test(`sem erro de console nem 4xx/5xx inesperado em ${path}`, async ({ page }) => {
      const problems: string[] = []
      await mockActivity(page)
      page.on('pageerror', (error) => problems.push(`exceção: ${error.message}`))
      page.on('console', (message) => {
        if (message.type() !== 'error' && message.type() !== 'warning') return
        // O 404 da rota inexistente é o esperado; o Chrome o registra como "Failed to load resource".
        if (path === NOT_FOUND && /status of 404/.test(message.text())) return
        problems.push(`console.${message.type()}: ${message.text()}`)
      })
      page.on('response', (response) => {
        const expected404 = path === NOT_FOUND && new URL(response.url()).pathname === NOT_FOUND
        if (response.status() >= 400 && !expected404) problems.push(`${response.status()} ${response.url()}`)
      })
      page.on('requestfailed', (request) => problems.push(`falhou: ${request.url()} (${request.failure()?.errorText})`))

      const response = await page.goto(path, { waitUntil: 'networkidle' })
      expect(response?.status()).toBe(path === NOT_FOUND ? 404 : 200)
      await scrollThrough(page)
      // Só o HUD da home busca a atividade (o rodapé não tem mais essa região, passo 17).
      if (path === '/' || path === '/en/') await expect(page.locator('[data-hud-phase="done"]')).toBeVisible()
      await page.waitForLoadState('networkidle')
      expect(problems).toEqual([])
    })
  }
})

test.describe('prefers-reduced-motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  for (const path of keyRoutes) {
    test(`sem animação decorativa em ${path}`, async ({ page }) => {
      await mockActivity(page)
      // Registra, desde o primeiro script, toda animação CSS e toda transição que começar na página.
      await page.addInitScript(() => {
        const started: string[] = []
        ;(window as unknown as { __motion: string[] }).__motion = started
        const describe = (target: EventTarget | null) => {
          const el = target as Element | null
          return el ? `${el.tagName.toLowerCase()}.${(el.getAttribute('class') ?? '').split(' ')[0]}` : '?'
        }
        document.addEventListener('animationstart', (event) => started.push(`animation ${event.animationName} em ${describe(event.target)}`), true)
        document.addEventListener(
          'transitionstart',
          (event) => {
            // Opacidade e cor são permitidas com movimento reduzido; deslocamento, escala e tamanho não.
            if (/^(opacity|color|background-color|border-color|outline-color|fill|stroke|text-decoration-color)$/.test(event.propertyName)) return
            started.push(`transition ${event.propertyName} em ${describe(event.target)}`)
          },
          true,
        )
      })
      await page.goto(path, { waitUntil: 'networkidle' })
      await scrollThrough(page)
      // Só o HUD da home busca a atividade (o rodapé não tem mais essa região, passo 17).
      if (path === '/' || path === '/en/') await expect(page.locator('[data-hud-phase="done"]')).toBeVisible()
      const motion = await page.evaluate(() => ({
        started: (window as unknown as { __motion: string[] }).__motion,
        running: document
          .getAnimations()
          .filter((animation) => animation.playState === 'running')
          .map((animation) => (animation as CSSAnimation).animationName ?? (animation as CSSTransition).transitionProperty ?? 'script'),
        declared: [...document.querySelectorAll('*')]
          .filter((el) => getComputedStyle(el).animationName !== 'none')
          .map((el) => `${el.tagName.toLowerCase()}: ${getComputedStyle(el).animationName}`),
      }))
      expect(motion).toEqual({ started: [], running: [], declared: [] })
    })
  }
})

test.describe('imagens acima da dobra', () => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    test(`toda <img> visível na primeira tela tem width e height (${viewport.width} px)`, async ({ page }) => {
      await page.setViewportSize(viewport)
      for (const path of keyRoutes) {
        await page.goto(path)
        const missing = await page.evaluate(() =>
          [...document.images]
            .filter((img) => img.getBoundingClientRect().top < window.innerHeight)
            .filter((img) => !img.hasAttribute('width') || !img.hasAttribute('height'))
            .map((img) => img.currentSrc || img.src),
        )
        expect(missing, path).toEqual([])
      }
    })
  }
})

test.describe('axe-core nas rotas-chave restantes', () => {
  for (const scheme of ['light', 'dark'] as const) {
    for (const path of ['/sobre/', '/livros/', '/hobbies/', NOT_FOUND]) {
      test(`sem violações critical/serious em ${path} (${scheme})`, async ({ page }) => {
        await mockActivity(page)
        await page.emulateMedia({ colorScheme: scheme })
        await page.goto(path)
        const results = await new AxeBuilder({ page }).analyze()
        const blocking = results.violations
          .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
          .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
        expect(blocking).toEqual([])
      })
    }
  }
})
