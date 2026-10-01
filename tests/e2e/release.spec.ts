import { expect, test } from '@playwright/test'
import { blockingViolations, scrollThrough } from './helpers'

/**
 * o que faltava do portão final nas rotas-chave:
 * - sem erro de console, sem exceção de página e sem request 4xx/5xx inesperado (página inteira percorrida,
 *   ilhas e vídeo do hero carregados);
 * - `prefers-reduced-motion`: nenhuma animação nem transição de deslocamento/escala/tamanho dispara ao carregar
 *   e rolar a página inteira (opacidade e cor continuam permitidas, como em tokens.css);
 * - nenhuma `<img>` acima da dobra sem `width`/`height` (390 e 1440 px), incluindo o 404 do Worker;
 * - axe claro/escuro nas rotas-chave que ainda não tinham (as demais estão em shell, writing, cases
 *   e footer).
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
  '/sobre/',
  '/contato/',
  '/livros/',
  '/hobbies/',
  '/rota-inexistente/',
  '/en/',
]
const NOT_FOUND = '/rota-inexistente/'



test.describe('console e rede limpos', () => {
  for (const path of keyRoutes) {
    test(`sem erro de console nem 4xx/5xx inesperado em ${path}`, async ({ page }) => {
      const problems: string[] = []
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
      // Rolar a página inteira traz as ilhas (aparelho da home, d20, estante) e o vídeo do hero.
      await scrollThrough(page)
      if (path === '/' || path === '/en/') await expect(page.locator('section.hero [data-shown]')).toHaveCount(1, { timeout: 10_000 })
      await page.waitForLoadState('networkidle')
      expect(problems).toEqual([])
    })
  }
})

test.describe('prefers-reduced-motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  /**
   * A regra de tokens.css: com movimento reduzido não há deslocamento, escala nem mudança de tamanho; opacidade e
   * cor continuam (um esmaecimento curto, como o da tampa do notebook ou do d20, é permitido). Por isso cada
   * animação CSS é julgada pelas propriedades dos seus keyframes, e cada transição pela propriedade que muda.
   */
  for (const path of keyRoutes) {
    test(`sem animação decorativa em ${path}`, async ({ page }) => {
      // Registra, desde o primeiro script, toda animação CSS e toda transição que começar na página, com as
      // propriedades que ela anima.
      await page.addInitScript(() => {
        const ALLOWED = /^(opacity|color|background-color|border-color|outline-color|fill|stroke|text-decoration-color|offset|composite|easing|computed-offset)$/
        // `getKeyframes()` devolve as propriedades em camelCase (`backgroundColor`); as folhas de estilo, com hífen.
        const kebab = (key: string) => key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
        const started: string[] = []
        ;(window as unknown as { __motion: string[] }).__motion = started
        const describe = (target: EventTarget | null) => {
          const el = target as Element | null
          return el ? `${el.tagName.toLowerCase()}.${(el.getAttribute('class') ?? '').split(' ')[0]}` : '?'
        }
        document.addEventListener(
          'animationstart',
          (event) => {
            const target = event.target as Element
            const animation = target.getAnimations().find((item) => (item as CSSAnimation).animationName === event.animationName)
            const moved = (animation?.effect as KeyframeEffect | null)?.getKeyframes().flatMap((frame) => Object.keys(frame)).filter((key) => !ALLOWED.test(kebab(key))) ?? ['?']
            if (moved.length) started.push(`animation ${event.animationName} (${[...new Set(moved)].join(', ')}) em ${describe(target)}`)
          },
          true,
        )
        document.addEventListener(
          'transitionstart',
          (event) => {
            if (ALLOWED.test(event.propertyName)) return
            started.push(`transition ${event.propertyName} em ${describe(event.target)}`)
          },
          true,
        )
      })
      await page.goto(path, { waitUntil: 'networkidle' })
      await scrollThrough(page)
      if (path === '/' || path === '/en/') await expect(page.locator('section.hero [data-shown]')).toHaveCount(1, { timeout: 10_000 })
      await page.waitForTimeout(500)
      const motion = await page.evaluate(() => {
        const ALLOWED = /^(opacity|color|background-color|border-color|outline-color|fill|stroke|text-decoration-color|offset|composite|easing|computed-offset)$/
        // `getKeyframes()` devolve as propriedades em camelCase (`backgroundColor`); as folhas de estilo, com hífen.
        const kebab = (key: string) => key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
        /** Propriedades animadas por um @keyframes declarado nas folhas de estilo (inclusive dentro de @media). */
        const keyframeProps = (name: string): string[] => {
          const props = new Set<string>()
          const visit = (rules: CSSRuleList) => {
            for (const rule of rules) {
              if (rule instanceof CSSKeyframesRule && rule.name === name) {
                for (const frame of rule.cssRules) for (const prop of (frame as CSSKeyframeRule).style) props.add(prop)
              } else if ('cssRules' in rule) visit((rule as CSSGroupingRule).cssRules)
            }
          }
          for (const sheet of document.styleSheets) {
            try {
              visit(sheet.cssRules)
            } catch {
              // Folha de outra origem: as regras não são legíveis (o site não usa nenhuma).
            }
          }
          return [...props]
        }
        return {
          started: (window as unknown as { __motion: string[] }).__motion,
          // Animações rodando agora que mexem em algo além de opacidade e cor.
          running: document
            .getAnimations()
            .filter((animation) => animation.playState === 'running')
            .filter((animation) => (animation.effect as KeyframeEffect | null)?.getKeyframes().some((frame) => Object.keys(frame).some((key) => !ALLOWED.test(kebab(key)))))
            .map((animation) => (animation as CSSAnimation).animationName ?? (animation as CSSTransition).transitionProperty ?? 'script'),
          // Elementos renderizados com uma animação declarada que desloca ou redimensiona (o que está em
          // `display: none` não se move).
          declared: [...document.querySelectorAll('*')]
            .filter((el) => el.checkVisibility())
            .map((el) => ({ el, name: getComputedStyle(el).animationName }))
            .filter(({ name }) => name !== 'none')
            .flatMap(({ el, name }) =>
              name
                .split(',')
                .map((item) => item.trim())
                .filter((item) => keyframeProps(item).some((prop) => !ALLOWED.test(prop)))
                .map((item) => `${el.tagName.toLowerCase()}: ${item}`),
            ),
        }
      })
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
        await page.emulateMedia({ colorScheme: scheme })
        await page.goto(path)
        expect(await blockingViolations(page)).toEqual([])
      })
    }
  }
})
