/**
 * scripts/run-lhci.mjs — `npm run lhci`
 *
 * Sobe o servidor local de medição, roda `lhci collect` + `lhci assert` (config em `lighthouserc.cjs`),
 * imprime a execução mediana de cada URL e encerra tudo (wrangler, workerd e fixture), mesmo em falha.
 *
 * Servidor: build real do adapter-cloudflare no `wrangler dev` (porta 8788) com D1 local migrado do zero em
 * `.wrangler/lhci-state` e a API do GitHub trocada pela fixture (porta 8791); o cron é disparado uma vez para
 * `/api/activity` responder 200 (o rodapé não gera erro de console na medição).
 * Saída: `.lighthouseci/` (relatórios HTML/JSON e `summary.json` com as medianas), fora do Git.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const port = Number(process.env.LHCI_PORT ?? 8788)
const fixturePort = 8791
const base = `http://127.0.0.1:${port}`
const state = '.wrangler/lhci-state'

if (!existsSync('.svelte-kit/cloudflare/_worker.js')) {
  console.error('✗ build ausente: rode `npm run build` antes de `npm run lhci`.')
  process.exit(1)
}

const children = []
function start(command, args, env = {}) {
  const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'inherit'], detached: true, env: { ...process.env, ...env } })
  children.push(child)
  return child
}

async function stopAll() {
  for (const child of children.reverse()) {
    if (child.exitCode !== null) continue
    const exited = new Promise((resolve) => child.once('exit', resolve))
    // SIGINT deixa o wrangler encerrar o workerd filho; SIGKILL no grupo é o plano B.
    try { process.kill(-child.pid, 'SIGINT') } catch { /* já encerrado */ }
    const timeout = new Promise((resolve) => setTimeout(() => resolve('timeout'), 5000))
    if ((await Promise.race([exited, timeout])) === 'timeout') {
      try { process.kill(-child.pid, 'SIGKILL') } catch { /* já encerrado */ }
    }
  }
}

async function waitFor(url, seconds) {
  for (let attempt = 0; attempt < seconds; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return
    } catch { /* ainda subindo */ }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  throw new Error(`${url} não respondeu em ${seconds} s`)
}

// No WSL o chrome-launcher prefere o Chrome do Windows (e não conecta); fixa o Chrome do Linux.
const chromePath =
  process.env.CHROME_PATH ?? ['/usr/bin/google-chrome', '/usr/bin/chromium'].find((path) => existsSync(path)) ?? chromium.executablePath()

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', env: { ...process.env, CHROME_PATH: chromePath } })
  return result.status ?? 1
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

/** Resume as execuções: por URL, a execução mediana de performance (a mesma regra do `median-run`). */
function summarize() {
  const dir = '.lighthouseci'
  const runs = readdirSync(dir)
    .filter((file) => /^lhr-.*\.json$/.test(file))
    .map((file) => JSON.parse(readFileSync(join(dir, file), 'utf8')))
  const byUrl = new Map()
  for (const lhr of runs) {
    const path = new URL(lhr.requestedUrl).pathname
    if (!byUrl.has(path)) byUrl.set(path, [])
    byUrl.get(path).push({
      performance: Math.round(lhr.categories.performance.score * 100),
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
      seo: Math.round(lhr.categories.seo.score * 100),
      lcp: lhr.audits['largest-contentful-paint'].numericValue,
      tbt: lhr.audits['total-blocking-time'].numericValue,
      cls: lhr.audits['cumulative-layout-shift'].numericValue,
    })
  }
  const summary = [...byUrl].map(([path, list]) => {
    const medianPerf = median(list.map((r) => r.performance))
    const mid = list.find((r) => r.performance === medianPerf)
    return { path, runs: list.map((r) => r.performance), ...mid, lighthouse: runs[0]?.lighthouseVersion }
  })
  writeFileSync(join(dir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
  console.log('\nLighthouse (mobile, execução mediana de 3):')
  console.log('rota | perf (3 execuções) | a11y | BP | SEO | LCP | TBT | CLS')
  for (const s of summary) {
    console.log(
      `${s.path} | ${s.performance} (${s.runs.join(' / ')}) | ${s.accessibility} | ${s.bestPractices} | ${s.seo} | ` +
        `${(s.lcp / 1000).toFixed(2)} s | ${Math.round(s.tbt)} ms | ${s.cls.toFixed(3)}`,
    )
  }
}

let status = 1
try {
  rmSync('.lighthouseci', { recursive: true, force: true })
  rmSync(state, { recursive: true, force: true })
  start('node', ['tests/fixtures/github-fixture-server.mjs'], { GITHUB_FIXTURE_PORT: String(fixturePort) })
  await waitFor(`http://127.0.0.1:${fixturePort}/`, 10)
  // Sem as rotas de produção (ver scripts/wrangler-dev-config.mjs).
  if (run('node', ['scripts/wrangler-dev-config.mjs']) !== 0) throw new Error('não gerou wrangler.dev.jsonc')
  if (run('npx', ['wrangler', 'd1', 'migrations', 'apply', 'DB', '--config', 'wrangler.dev.jsonc', '--local', '--persist-to', state]) !== 0) {
    throw new Error('migrações do D1 local falharam')
  }
  start('npx', [
    'wrangler', 'dev', '--config', 'wrangler.dev.jsonc', '--port', String(port), '--ip', '127.0.0.1', '--log-level', 'warn',
    '--persist-to', state, '--test-scheduled', '--var', `GITHUB_API_BASE:http://127.0.0.1:${fixturePort}`,
  ], { CI: '1' })
  await waitFor(`${base}/`, 120)
  const cron = await fetch(`${base}/__scheduled?cron=*/30+*+*+*+*`)
  if (!cron.ok) throw new Error(`cron local falhou (${cron.status})`)
  // O job roda em `waitUntil`: espera o D1 ter a primeira leitura.
  await waitFor(`${base}/api/activity`, 20)

  status = run('npx', ['lhci', 'collect', '--config=lighthouserc.cjs'])
  if (status === 0) {
    summarize()
    status = run('npx', ['lhci', 'assert', '--config=lighthouserc.cjs'])
    run('npx', ['lhci', 'upload', '--config=lighthouserc.cjs'])
  }
} catch (error) {
  console.error(`✗ ${error.message}`)
  status = 1
} finally {
  await stopAll()
}
console.log(status === 0 ? '\n✓ Lighthouse CI ok.' : '\n✗ Lighthouse CI reprovou.')
process.exit(status)
