/**
 * scripts/check-island-budget.mjs
 *
 * Mede o chunk da ilha do simulador (passo 08) no build do cliente e falha acima de 15 KiB gzip.
 * O chunk é achado pelo texto do botão ("Avançar um passo"); o runtime do Svelte, compartilhado por todas
 * as páginas, não entra na conta — só o que a ilha baixa a mais.
 *
 * Uso: npm run build && node scripts/check-island-budget.mjs
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const BUDGET = 15 * 1024
const dir = '.svelte-kit/output/client/_app/immutable/chunks'
const files = readdirSync(dir).filter((file) => file.endsWith('.js'))
const island = files.find((file) => readFileSync(join(dir, file), 'utf8').includes('Avançar um passo'))
if (!island) {
  console.error('✗ chunk da ilha não encontrado (rode npm run build antes)')
  process.exit(1)
}
const source = readFileSync(join(dir, island))
const gz = gzipSync(source, { level: 9 }).length
const kib = (bytes) => (bytes / 1024).toFixed(1)
console.log(`Ilha do simulador: ${island} — ${kib(source.length)} KiB bruto, ${kib(gz)} KiB gzip (budget ${kib(BUDGET)} KiB)`)
process.exit(gz <= BUDGET ? 0 : 1)
