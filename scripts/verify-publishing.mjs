/**
 * Portão do build para a camada legível por agentes (spec §5), sobre a saída prerenderizada:
 * - toda página HTML: canonical absoluto com barra final; og:image local, existente e ≤ 100 KiB;
 *   JSON-LD que parseia, tem os campos obrigatórios e bate com o texto visível (H1, nomes, datas);
 * - /resume.json valida no schema oficial do JSON Resume (`@jsonresume/schema`);
 * - /llms.txt no formato llmstxt.org; todo link interno de /llms.txt e /llms-full.txt resolve para um
 *   arquivo prerenderizado ou, se for um endpoint dinâmico declarado (`/mcp`), para uma rota do build;
 * - cada artigo e nota tem a versão .md prerenderizada (H1, página canônica, sem front matter) e a anuncia com
 *   <link rel="alternate" type="text/markdown">; nenhuma outra página anuncia uma .md;
 * - /sitemap.xml só lista URLs com página prerenderizada (nada de redirect ou 404) e nenhuma .md;
 * - /robots.txt libera tudo, declara cada crawler de IA de `AI_CRAWLERS` e aponta para o sitemap.
 * Uso: node scripts/verify-publishing.mjs [diretório-do-build]   (Node ≥ 22.18, type stripping)
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, relative } from 'node:path'
import {
  builtFileFor,
  canonicalIssue,
  dynamicEndpointFor,
  extractJsonLd,
  extractPageFacts,
  internalLinks,
  jsonLdIssues,
  llmsIndexIssues,
  manifestHasRoute,
  markdownAlternateIssue,
  markdownDocumentIssues,
  markdownUrlFor,
  robotsIssues,
  SITE_ORIGIN,
  sitemapLocs,
} from '../src/lib/publishing/checks.ts'

const require = createRequire(import.meta.url)
const { validate } = require('@jsonresume/schema')

const dir = process.argv[2] ?? '.svelte-kit/cloudflare'
const OG_MAX_BYTES = 100 * 1024
const problems = []
const fail = (where, message) => problems.push(`${where}: ${message}`)

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) return entry.name === '_app' ? [] : htmlFiles(full)
    return entry.name.endsWith('.html') ? [full] : []
  })
}

const read = (path) => readFileSync(join(dir, path), 'utf8')
// Manifesto do servidor SvelteKit (irmão da saída do adapter): lista as rotas dinâmicas do build.
const serverManifest = () => readFileSync(join(dir, '..', 'output', 'server', 'manifest.js'), 'utf8')
const exists = (url) => {
  const file = builtFileFor(url)
  return Boolean(file) && existsSync(join(dir, file))
}

// Páginas
const pages = htmlFiles(dir).filter((file) => !file.endsWith('404.html'))
for (const file of pages) {
  const where = relative(dir, file)
  const html = readFileSync(file, 'utf8')
  const facts = extractPageFacts(html)
  const canonicalProblem = canonicalIssue(facts.canonical)
  if (canonicalProblem) fail(where, canonicalProblem)
  else if (builtFileFor(facts.canonical) !== where) fail(where, `canonical ${facts.canonical} não é a própria página`)
  const ogImage = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1]
  if (!ogImage) fail(where, 'sem og:image')
  else if (!ogImage.startsWith(`${SITE_ORIGIN}/`) || !exists(ogImage)) fail(where, `og:image inexistente no build: ${ogImage}`)
  else if (statSync(join(dir, builtFileFor(ogImage))).size > OG_MAX_BYTES) fail(where, `og:image acima de 100 KiB: ${ogImage}`)
  for (const tag of ['og:title', 'og:description', 'og:url']) if (!html.includes(`<meta property="${tag}"`)) fail(where, `sem ${tag}`)
  for (const tag of ['twitter:card', 'twitter:title', 'twitter:image']) if (!html.includes(`<meta name="${tag}"`)) fail(where, `sem ${tag}`)
  // Versão Markdown: o link do head e o arquivo .md prerenderizado.
  const markdownProblem = markdownAlternateIssue(html, facts.canonical)
  if (markdownProblem) fail(where, markdownProblem)
  const markdownUrl = markdownUrlFor(facts.canonical)
  if (markdownUrl) {
    if (!exists(markdownUrl)) fail(where, `versão Markdown ausente no build: ${markdownUrl}`)
    else for (const issue of markdownDocumentIssues(read(builtFileFor(markdownUrl)), facts.canonical)) fail(builtFileFor(markdownUrl), issue)
  }
  try {
    for (const issue of jsonLdIssues(extractJsonLd(html), facts)) fail(where, issue)
  } catch (error) {
    fail(where, error.message)
  }
}

// /resume.json
validate(JSON.parse(read('resume.json')), (errors) => {
  for (const error of errors ?? []) fail('resume.json', `${error.property} ${error.message}`)
})

// /llms.txt e /llms-full.txt
for (const issue of llmsIndexIssues(read('llms.txt'))) fail('llms.txt', issue)
for (const file of ['llms.txt', 'llms-full.txt']) {
  for (const url of internalLinks(read(file))) {
    const endpoint = dynamicEndpointFor(url)
    if (endpoint) {
      if (!manifestHasRoute(serverManifest(), endpoint)) fail(file, `endpoint citado sem rota no build: ${endpoint}`)
    } else if (!exists(url)) fail(file, `link sem página prerenderizada: ${url}`)
  }
}
if (!read('llms-full.txt').includes('\n## Limites\n')) fail('llms-full.txt', 'sem a seção "Limites"')

// Sitemap e robots
const locs = sitemapLocs(read('sitemap.xml'))
if (locs.length === 0) fail('sitemap.xml', 'sem URLs')
if (new Set(locs).size !== locs.length) fail('sitemap.xml', 'URL repetida')
for (const loc of locs) {
  if (loc.endsWith('.md')) fail('sitemap.xml', `versão Markdown no sitemap (só páginas HTML canônicas): ${loc}`)
  else if (!exists(loc) || !loc.endsWith('/')) fail('sitemap.xml', `URL sem página prerenderizada (redirect ou 404?): ${loc}`)
}
for (const file of pages) {
  const canonical = `${SITE_ORIGIN}/${relative(dir, file).replace(/index\.html$/, '')}`
  if (!locs.includes(canonical)) fail('sitemap.xml', `página indexável fora do sitemap: ${canonical}`)
}
for (const issue of robotsIssues(read('robots.txt'))) fail('robots.txt', issue)

// Cabeçalhos das .md (o Worker serve o arquivo prerenderizado como asset; o tipo e o noindex vêm de _headers).
const headersFile = read('_headers')
for (const prefix of ['/escrita/', '/en/writing/', '/notas/']) {
  const rule = new RegExp(`^${prefix.replaceAll('/', '\\/')}\\*\\.md\\n(?:[ \\t]+.+\\n?)*`, 'm').exec(headersFile)?.[0] ?? ''
  if (!/Content-Type: text\/markdown; charset=utf-8/.test(rule) || !/X-Robots-Tag: noindex/.test(rule)) fail('_headers', `sem Content-Type text/markdown e X-Robots-Tag noindex para ${prefix}*.md`)
}

if (problems.length > 0) {
  console.error(`Camada para agentes inconsistente (${problems.length}):\n${problems.map((problem) => `  - ${problem}`).join('\n')}`)
  process.exit(1)
}
const markdownCount = pages.filter((file) => markdownUrlFor(extractPageFacts(readFileSync(file, 'utf8')).canonical)).length
console.log(`Camada para agentes ok: ${pages.length} páginas com JSON-LD/OG/canonical, ${markdownCount} versões .md, robots.txt com os crawlers de IA, resume.json no schema JSON Resume, llms.txt + llms-full.txt, ${locs.length} URLs no sitemap.`)
