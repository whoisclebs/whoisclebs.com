/**
 * scripts/capture-snapshots.mjs
 *
 * Captura snapshots de página inteira das rotas-chave em 390, 768 e 1440 px e
 * grava WebP otimizados em docs/redesign/snapshots/<pasta>/<rota>-<largura>.webp.
 *
 * Dois modos de servidor, ambos encerrados no fim (nenhum processo fica rodando):
 * - padrão (site SvelteKit): sobe `wrangler dev` sobre o build do adapter-cloudflare
 *   (`.svelte-kit/cloudflare`), com redirects e 404 reais do Worker. Rode `npm run build` antes.
 * - `dist` ou outro diretório como 2º argumento: servidor estático próprio (usado na baseline React).
 *
 * Uso:
 *   npm run snapshots -- <pasta-de-saida>           ex.: npm run snapshots -- 02-sveltekit
 *   node scripts/capture-snapshots.mjs 00-baseline dist
 *
 * Variáveis opcionais: SNAPSHOT_ROUTES (JSON [{ name, path, scheme?, click?, element? }]) substitui as rotas
 * padrão; `click: { selector, count }` clica N vezes antes da captura (estados do simulador) e `element`
 * captura só aquele elemento em vez da página inteira; SNAPSHOT_WIDTHS ("390,1440") limita as larguras;
 * SNAPSHOT_LOCALE troca o locale do navegador (padrão en-US: o site novo não pode depender dele).
 */

import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname, normalize } from 'node:path'
import { chromium } from '@playwright/test'
import sharp from 'sharp'

const outName = process.argv[2]
if (!outName) {
  console.error('Informe a pasta de saída: npm run snapshots -- <NN-passo>')
  process.exit(1)
}
const buildDir = process.argv[3] ?? null
const outDir = join('docs/redesign/snapshots', outName)

const legacyRoutes = [
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
const siteRoutes = [
  { name: 'home', path: '/' },
  { name: 'home-escuro', path: '/', scheme: 'dark' },
  { name: 'projetos', path: '/projetos/' },
  { name: 'projeto-tuxedo', path: '/projetos/tuxedo/' },
  { name: 'escrita', path: '/escrita/' },
  { name: 'artigo', path: '/escrita/github-actions-como-fazer-deploy/' },
  { name: 'notas', path: '/notas/' },
  { name: 'sobre', path: '/sobre/' },
  { name: 'contato', path: '/contato/' },
  { name: 'livros', path: '/livros/' },
  { name: 'hobbies', path: '/hobbies/' },
  { name: '404', path: '/rota-inexistente/' },
  { name: 'en-home', path: '/en/' },
]
const defaultRoutes = buildDir ? legacyRoutes : siteRoutes
const routes = process.env.SNAPSHOT_ROUTES ? JSON.parse(process.env.SNAPSHOT_ROUTES) : defaultRoutes
const allWidths = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]
// SNAPSHOT_WIDTHS="390,1440" limita as larguras (ex.: estados do simulador no passo 08).
const onlyWidths = process.env.SNAPSHOT_WIDTHS?.split(',').map(Number)
const widths = onlyWidths ? allWidths.filter((viewport) => onlyWidths.includes(viewport.width)) : allWidths
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

async function startStatic() {
  const server = createServer((req, res) => {
    const { file, status } = resolveFile(req.url ?? '/')
    if (!file) { res.writeHead(404).end('not found'); return }
    res.writeHead(status, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  return { base: `http://127.0.0.1:${server.address().port}`, stop: () => server.close() }
}

async function startWrangler() {
  if (!existsSync('.svelte-kit/cloudflare/_worker.js')) throw new Error('Build ausente: rode `npm run build` antes.')
  const port = 8790
  const child = spawn('npx', ['wrangler', 'dev', '--port', String(port), '--ip', '127.0.0.1', '--log-level', 'error'], {
    stdio: 'ignore',
    detached: true,
  })
  const base = `http://127.0.0.1:${port}`
  const exited = new Promise((resolve) => child.once('exit', resolve))
  // SIGINT deixa o wrangler encerrar o workerd filho; SIGKILL no grupo é o plano B.
  const stop = async () => {
    try { process.kill(-child.pid, 'SIGINT') } catch { /* já encerrado */ }
    const timeout = new Promise((resolve) => setTimeout(() => resolve('timeout'), 5000))
    if ((await Promise.race([exited, timeout])) === 'timeout') {
      try { process.kill(-child.pid, 'SIGKILL') } catch { /* já encerrado */ }
    }
  }
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${base}/`)
      if (response.ok) return { base, stop }
    } catch { /* ainda subindo */ }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  await stop()
  throw new Error('wrangler dev não respondeu em 60 s')
}

const { base, stop } = buildDir ? await startStatic() : await startWrangler()

mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
const results = []
try {
  for (const viewport of widths) {
    // Baseline React: locale pt-BR (o site antigo trocava o idioma por navigator.language). Site novo: en-US,
    // para provar que o idioma vem só da URL.
    const locale = process.env.SNAPSHOT_LOCALE ?? (buildDir ? 'pt-BR' : 'en-US')
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'reduce', locale })
    const page = await context.newPage()
    for (const route of routes) {
      // Rotas com `scheme: 'dark'` emulam prefers-color-scheme (tema "noite"); as demais ficam no claro.
      await page.emulateMedia({ colorScheme: route.scheme ?? 'light' })
      await page.goto(base + route.path, { waitUntil: 'networkidle' })
      await page.evaluate(async () => {
        await document.fonts.ready
        for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 60))
        }
        window.scrollTo(0, 0)
      })
      if (route.click) {
        const target = page.locator(route.click.selector)
        await target.waitFor()
        for (let i = 0; i < route.click.count; i += 1) await target.click()
      }
      await page.waitForTimeout(300)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      const png = route.element ? await page.locator(route.element).screenshot() : await page.screenshot({ fullPage: true })
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
  await stop()
}

for (const r of results) {
  console.log(`${r.file}\t${r.kb} KB\taltura=${r.height}px${r.overflow > 0 ? `\tOVERFLOW=${r.overflow}px` : ''}`)
}
