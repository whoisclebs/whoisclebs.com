import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import sharp from 'sharp'

/**
 * Utilitários compartilhados pelos specs e2e: contraste medido sobre os pixels reais, axe, rolagem, overflow,
 * vídeo servido com Range e a espera pela ilha dos easter eggs. Não é um spec (o Playwright só roda `*.spec.ts`).
 */

/** Luminância relativa (WCAG 2.x) de uma cor sRGB de 8 bits. */
export function luminance(r: number, g: number, b: number): number {
  const lin = (c: number) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

const rgb = (color: string) => color.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number) as [number, number, number]

/**
 * Contraste do texto contra os pixels reais atrás das linhas (Range.getClientRects), com o texto transparente.
 * O fundo de cada elemento é o percentil `percentile` da luminância atrás das suas linhas (padrão 0,99): um
 * pingo de chuva ou uma estrela isolada atrás de uma letra não é o fundo do texto; todo o resto, sim.
 * Vale para texto claro sobre fundo escuro (o caso do hero).
 */
export async function contrastOverPixels(page: Page, selectors: Record<string, string>, percentile = 0.99): Promise<Record<string, number>> {
  const info = await page.evaluate((targets) => {
    const out: Record<string, { rects: { x: number; y: number; w: number; h: number }[]; color: string }> = {}
    for (const [name, selector] of Object.entries(targets)) {
      const el = document.querySelector<HTMLElement>(selector)!
      const range = document.createRange()
      range.selectNodeContents(el)
      const rects = [...range.getClientRects()].map((r) => ({ x: r.left, y: r.top + scrollY, w: r.width, h: r.height }))
      out[name] = { rects, color: getComputedStyle(el).color }
    }
    return out
  }, selectors)
  const hide = await page.addStyleTag({
    content: `${Object.values(selectors).map((s) => `${s}, ${s} *`).join(', ')} { color: transparent !important; transition: none !important; }`,
  })
  await page.waitForTimeout(80)
  const png = await page.screenshot({ fullPage: true })
  await hide.evaluate((el) => (el as Element).remove())
  const { data, info: meta } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const result: Record<string, number> = {}
  for (const [name, { rects, color }] of Object.entries(info)) {
    const values: number[] = []
    for (const rect of rects) {
      for (let y = Math.max(0, Math.floor(rect.y)); y < Math.min(meta.height, Math.ceil(rect.y + rect.h)); y += 1) {
        for (let x = Math.max(0, Math.floor(rect.x)); x < Math.min(meta.width, Math.ceil(rect.x + rect.w)); x += 1) {
          const i = (y * meta.width + x) * 3
          values.push(luminance(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0))
        }
      }
    }
    expect(values.length, `${name}: nenhum pixel medido`).toBeGreaterThan(0)
    values.sort((a, b) => a - b)
    const background = values[Math.min(values.length - 1, Math.floor(values.length * percentile))] ?? 0
    const text = luminance(...rgb(color))
    result[name] = (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05)
  }
  return result
}

type Box = { x: number; y: number; w: number; h: number; color: string; label: string }

/**
 * Menor contraste entre as linhas de texto dos seletores e o fundo real, dentro da viewport (e de `clip`).
 * Compara texto claro com o pixel mais claro atrás dele e texto escuro com o mais escuro (no percentil dado).
 */
export async function worstContrast(page: Page, selectors: string[], options: { percentile?: number; clip?: string } = {}) {
  const boxes = await page.evaluate(
    ({ list, clip }) => {
      const limit = clip ? document.querySelector(clip)!.getBoundingClientRect() : { top: 0, bottom: innerHeight }
      const out: Box[] = []
      for (const selector of list) {
        for (const el of document.querySelectorAll<HTMLElement>(selector)) {
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (!node.textContent?.trim()) continue
            const range = document.createRange()
            range.selectNodeContents(node)
            for (const r of range.getClientRects()) {
              const top = Math.max(r.top, limit.top, 0)
              const bottom = Math.min(r.bottom, limit.bottom, innerHeight)
              if (bottom - top < 4 || r.width < 2) continue
              out.push({ x: r.left, y: top, w: r.width, h: bottom - top, color: getComputedStyle(node.parentElement!).color, label: selector })
            }
          }
        }
      }
      return out
    },
    { list: selectors, clip: options.clip },
  )
  expect(boxes.length).toBeGreaterThan(0)
  const hide = await page.addStyleTag({
    content: `${selectors.map((s) => `${s}, ${s} *`).join(', ')} { color: transparent !important; text-decoration-color: transparent !important; transition: none !important; }`,
  })
  await page.waitForTimeout(80)
  const png = await page.screenshot()
  await hide.evaluate((el) => (el as Element).remove())
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const percentile = options.percentile ?? 1
  let worst = { ratio: Infinity, label: '' }
  for (const box of boxes) {
    const values: number[] = []
    for (let y = Math.max(0, Math.floor(box.y)); y < Math.min(info.height, Math.ceil(box.y + box.h)); y += 1) {
      for (let x = Math.max(0, Math.floor(box.x)); x < Math.min(info.width, Math.ceil(box.x + box.w)); x += 1) {
        const i = (y * info.width + x) * 3
        values.push(luminance(data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0))
      }
    }
    if (!values.length) continue
    values.sort((a, b) => a - b)
    const text = luminance(...rgb(box.color))
    const light = values[Math.min(values.length - 1, Math.floor(values.length * percentile))]!
    const dark = values[Math.floor(values.length * (1 - percentile))]!
    const ratio = text > light ? (text + 0.05) / (light + 0.05) : (dark + 0.05) / (text + 0.05)
    if (ratio < worst.ratio) worst = { ratio, label: `${box.label} @${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.w)}×${Math.round(box.h)} ${box.color}` }
  }
  return worst
}

/**
 * O `wrangler dev` serve os assets sem Range nem Content-Length, e o Chrome trata o vídeo como fluxo sem busca
 * (`currentTime` volta a 0). Para parar um vídeo num instante fixo, o teste serve o arquivo de `static/media/`
 * com Range, como o CDN faz em produção.
 */
export async function serveVideoWithRanges(page: Page, name: string): Promise<void> {
  await page.route(new RegExp(`/media/${name}\\.(webm|mp4)$`), async (route) => {
    const ext = new URL(route.request().url()).pathname.endsWith('.webm') ? 'webm' : 'mp4'
    const body = readFileSync(`static/media/${name}.${ext}`)
    const type = ext === 'webm' ? 'video/webm' : 'video/mp4'
    const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers()['range'] ?? '')
    if (!range) return route.fulfill({ status: 200, body, headers: { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': String(body.length) } })
    const start = Number(range[1])
    const end = range[2] ? Number(range[2]) : body.length - 1
    return route.fulfill({
      status: 206,
      body: body.subarray(start, end + 1),
      headers: { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${body.length}`, 'content-length': String(end - start + 1) },
    })
  })
}

/** Violações critical/serious do axe na página como está agora (com o que estiver aberto). */
export async function blockingViolations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).analyze()
  return results.violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`)
}

/** Rola até o fim em passos de meia tela (dispara os IntersectionObserver das ilhas) e para no rodapé. */
export async function scrollThrough(page: Page): Promise<void> {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 40))
    }
    window.scrollTo(0, document.documentElement.scrollHeight)
    await new Promise((resolve) => setTimeout(resolve, 200))
  })
}

/** Quanto o documento passa da largura da viewport (≤ 0: sem rolagem horizontal). */
export function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
}

/**
 * Abre a página e espera a ilha dos easter eggs montar (o layout a baixa depois do `load`, num momento ocioso).
 * O sinal é o convite que ela escreve no console, que só existe depois da montagem.
 */
export async function gotoWithEggs(page: Page, path: string): Promise<void> {
  const ready = page.waitForEvent('console', { predicate: (message) => /Aperte \?|Press \?/.test(message.text()), timeout: 15_000 })
  await page.goto(path)
  await ready
}
