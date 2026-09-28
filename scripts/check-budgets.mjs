/**
 * scripts/check-budgets.mjs
 *
 * Budgets do portão final, medidos sobre o build do adapter-cloudflare (`.svelte-kit/cloudflare`):
 *
 * 1. JS de entrada da home: todo módulo que a navegação inicial de `/` carrega — `modulepreload` + `import()`
 *    do script inline de boot + a árvore de imports estáticos de cada um (imports dinâmicos dentro dos chunks,
 *    como a ilha do simulador, ficam de fora porque não carregam na entrada). Soma do gzip (nível padrão 6,
 *    conservador em relação ao nível 9) de cada arquivo ≤ 90 KiB.
 * 2. Fontes críticas: as `<link rel="preload" as="font">` de todas as rotas-chave (união, sem repetição),
 *    em bytes do WOFF2 (já comprimido) ≤ 90 KiB. As demais faces usam `font-display: swap` com fallback
 *    métrico e são só informadas.
 * 3. Imagens: nas rotas-chave, **toda** `<img>` precisa de `width` e `height` (mais estrito que "acima da
 *    dobra", que depende do viewport; o e2e `release.spec.ts` confere a dobra no navegador, incluindo o 404
 *    renderizado pelo Worker).
 * 4. Open Graph: cada `og:image` citada nas páginas prerenderizadas resolve para um arquivo do build ≤ 100 KiB.
 *
 * Limites podem ser sobrescritos por variável de ambiente só para provar que o script falha
 * (ex.: `BUDGET_HOME_JS_KIB=10 node scripts/check-budgets.mjs` sai 1). Uso: `npm run build && npm run check:budgets`.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const ROOT = '.svelte-kit/cloudflare'
const KIB = 1024
const limits = {
  homeJs: Number(process.env.BUDGET_HOME_JS_KIB ?? 90) * KIB,
  fonts: Number(process.env.BUDGET_FONTS_KIB ?? 90) * KIB,
  og: Number(process.env.BUDGET_OG_KIB ?? 100) * KIB,
}

/** Rotas-chave prerenderizadas (o 404 é renderizado pelo Worker e é conferido no e2e). */
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
  '/en/',
]

const failures = []
const kib = (bytes) => `${(bytes / KIB).toFixed(1)} KiB`
const htmlFile = (path) => join(ROOT, path, 'index.html')

if (!existsSync(htmlFile('/'))) {
  console.error(`✗ build ausente em ${ROOT} (rode npm run build antes)`)
  process.exit(1)
}

/** Resolve um href da página (relativo ou absoluto a partir da raiz do site) para um arquivo do build. */
function resolveHref(page, href) {
  const clean = href.split(/[?#]/)[0]
  if (/^https?:\/\//.test(clean)) {
    const url = new URL(clean)
    return join(ROOT, decodeURIComponent(url.pathname))
  }
  return clean.startsWith('/') ? join(ROOT, clean) : resolve(dirname(page), clean)
}

// 1. JS de entrada da home -------------------------------------------------------------------------
const homeHtml = readFileSync(htmlFile('/'), 'utf8')
const entryHrefs = [
  ...[...homeHtml.matchAll(/<link\b[^>]*rel="modulepreload"[^>]*>/g)].map((m) => m[0].match(/href="([^"]+)"/)?.[1]),
  ...[...homeHtml.matchAll(/<script\b(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) =>
    [...m[1].matchAll(/import\(\s*["']([^"']+\.js)["']\s*\)/g)].map((i) => i[1]),
  ),
].filter(Boolean)

const staticImport = /(?:\bimport|\bexport)\s*(?:[\w*${}\s,]*?\s*from\s*)?["']([^"']+\.js)["']/g
const modules = new Set()
const queue = entryHrefs.map((href) => resolveHref(htmlFile('/'), href))
while (queue.length > 0) {
  const file = queue.pop()
  if (modules.has(file)) continue
  if (!existsSync(file)) {
    failures.push(`módulo de entrada ausente no build: ${relative(ROOT, file)}`)
    continue
  }
  modules.add(file)
  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(staticImport)) queue.push(resolve(dirname(file), match[1]))
}
let jsRaw = 0
let jsGzip = 0
for (const file of modules) {
  const source = readFileSync(file)
  jsRaw += source.length
  jsGzip += gzipSync(source).length
}
report('JS de entrada da home (gzip)', jsGzip, limits.homeJs, `${modules.size} módulos, ${kib(jsRaw)} bruto`)

// 2. Fontes críticas (com preload) ------------------------------------------------------------------
const preloaded = new Map()
for (const path of keyRoutes) {
  const page = htmlFile(path)
  if (!existsSync(page)) {
    failures.push(`rota-chave sem HTML prerenderizado: ${path}`)
    continue
  }
  const html = readFileSync(page, 'utf8')
  for (const [tag] of html.matchAll(/<link\b[^>]*rel="preload"[^>]*>/g)) {
    if (!/as="font"/.test(tag)) continue
    const file = resolveHref(page, tag.match(/href="([^"]+)"/)[1])
    if (!existsSync(file)) failures.push(`fonte com preload ausente no build: ${file} (${path})`)
    else preloaded.set(file, statSync(file).size)
  }
}
const fontBytes = [...preloaded.values()].reduce((sum, size) => sum + size, 0)
const allFonts = readdirSync(join(ROOT, '_app/immutable/assets')).filter((file) => file.endsWith('.woff2'))
const allFontBytes = allFonts.reduce((sum, file) => sum + statSync(join(ROOT, '_app/immutable/assets', file)).size, 0)
report(
  'Fontes críticas com preload (WOFF2)',
  fontBytes,
  limits.fonts,
  `${preloaded.size} arquivo(s): ${[...preloaded.keys()].map((f) => f.split('/').pop()).join(', ') || 'nenhum'}; ` +
    `informativo: ${allFonts.length} WOFF2 no build somam ${kib(allFontBytes)}, carregados com swap`,
)

// 3. Imagens com dimensões ---------------------------------------------------------------------------
let images = 0
for (const path of keyRoutes) {
  const page = htmlFile(path)
  if (!existsSync(page)) continue
  for (const [tag] of readFileSync(page, 'utf8').matchAll(/<img\b[^>]*>/g)) {
    images += 1
    if (!/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag)) failures.push(`<img> sem width/height em ${path}: ${tag.slice(0, 120)}`)
  }
}
console.log(`${failures.some((f) => f.startsWith('<img>')) ? '✗' : '✓'} Imagens com width/height: ${images} <img> em ${keyRoutes.length} rotas-chave`)

// 4. Imagens Open Graph -----------------------------------------------------------------------------
function htmlPages(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === '_app' ? [] : htmlPages(full)
    return entry.name.endsWith('.html') ? [full] : []
  })
}
const ogImages = new Map()
for (const page of htmlPages(ROOT)) {
  const content = readFileSync(page, 'utf8').match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/)?.[1]
  if (content) ogImages.set(resolveHref(page, content), page)
}
if (ogImages.size === 0) failures.push('nenhuma og:image encontrada nas páginas')
let ogMax = 0
for (const [file, page] of ogImages) {
  if (!existsSync(file)) {
    failures.push(`og:image ausente no build: ${relative(ROOT, file)} (${relative(ROOT, page)})`)
    continue
  }
  const size = statSync(file).size
  ogMax = Math.max(ogMax, size)
  if (size > limits.og) failures.push(`og:image acima de ${kib(limits.og)}: ${relative(ROOT, file)} tem ${kib(size)}`)
}
console.log(
  `${ogMax <= limits.og ? '✓' : '✗'} Imagens OG: ${ogImages.size} arquivo(s), maior ${kib(ogMax)} (limite ${kib(limits.og)}): ` +
    [...ogImages.keys()].map((f) => relative(ROOT, f)).join(', '),
)

function report(label, value, limit, detail) {
  const ok = value <= limit
  console.log(`${ok ? '✓' : '✗'} ${label}: ${kib(value)} (limite ${kib(limit)}) — ${detail}`)
  if (!ok) failures.push(`${label}: ${kib(value)} > ${kib(limit)}`)
}

if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} budget(s) estourado(s):`)
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}
console.log('\nBudgets ok.')
