/**
 * scripts/capture-snapshots.mjs
 *
 * Captura snapshots de página inteira das rotas-chave em 390, 768 e 1440 px e
 * grava WebP otimizados em docs/redesign/snapshots/<pasta>/<rota>-<largura>.webp.
 *
 * Serve o diretório de build (padrão: dist) com um servidor estático próprio,
 * para não depender de `vite preview` nem deixar processos rodando.
 *
 * Uso:
 *   node scripts/capture-snapshots.mjs [pasta-de-saida] [dir-do-build]
 *   node scripts/capture-snapshots.mjs 00-baseline dist
 *
 * Variáveis opcionais: SNAPSHOT_ROUTES (JSON [{ name, path }]) substitui as rotas padrão.
 */

/* global document, window */
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname, normalize } from 'node:path'
import { chromium } from '@playwright/test'
import sharp from 'sharp'

const outName = process.argv[2] ?? '00-baseline'
const buildDir = process.argv[3] ?? 'dist'
const outDir = join('docs/redesign/snapshots', outName)

const defaultRoutes = [
  { name: 'home', path: '/' },
  { name: 'portfolio', path: '/portfolio/' },
  { name: 'projeto-tuxedo', path: '/projects/tuxedo/' },
  { name: 'blog', path: '/blog/' },
  { name: 'artigo', path: '/blog/github-actions-como-fazer-deploy/' },
  { name: 'til', path: '/til/' },
  { name: 'sobre', path: '/about/' },
  { name: 'livros', path: '/books/' },
  { name: 'hobbies', path: '/hobbies/' },
  { name: '404', path: '/rota-inexistente/' },
  { name: 'en-home', path: '/en/' },
]
const routes = process.env.SNAPSHOT_ROUTES ? JSON.parse(process.env.SNAPSHOT_ROUTES) : defaultRoutes
const widths = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]
const maxHeight = 16000 // limite do WebP é 16383 px
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jfif': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon',
}

function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '')
  const candidate = join(buildDir, clean)
  if (existsSync(candidate) && statSync(candidate).isFile()) return { file: candidate, status: 200 }
  const index = join(candidate, 'index.html')
  if (existsSync(index)) return { file: index, status: 200 }
  for (const fallback of ['404.html', '404/index.html']) {
    const file = join(buildDir, fallback)
    if (existsSync(file)) return { file, status: 404 }
  }
  return { file: null, status: 404 }
}

const server = createServer((req, res) => {
  const { file, status } = resolveFile(req.url ?? '/')
  if (!file) { res.writeHead(404).end('not found'); return }
  res.writeHead(status, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
  res.end(readFileSync(file))
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}`

mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
const results = []
try {
  for (const viewport of widths) {
    // locale pt-BR: o site detecta navigator.language e trocaria o texto das rotas PT para inglês
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'reduce', locale: process.env.SNAPSHOT_LOCALE ?? 'pt-BR' })
    const page = await context.newPage()
    for (const route of routes) {
      await page.goto(base + route.path, { waitUntil: 'networkidle' })
      await page.evaluate(async () => {
        await document.fonts.ready
        for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 60))
        }
        window.scrollTo(0, 0)
      })
      await page.waitForTimeout(300)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      const png = await page.screenshot({ fullPage: true })
      let image = sharp(png)
      const { height } = await image.metadata()
      if (height > maxHeight) image = image.extract({ left: 0, top: 0, width: viewport.width, height: maxHeight })
      const file = join(outDir, `${route.name}-${viewport.width}.webp`)
      const info = await image.webp({ quality: 72, effort: 6 }).toFile(file)
      results.push({ file, kb: Math.round(info.size / 1024), height, overflow })
    }
    await context.close()
  }
} finally {
  await browser.close()
  server.close()
}

for (const r of results) {
  console.log(`${r.file}\t${r.kb} KB\taltura=${r.height}px${r.overflow > 0 ? `\tOVERFLOW=${r.overflow}px` : ''}`)
}
