/**
 * scripts/check-island-budget.mjs
 *
 * Mede os chunks das ilhas carregadas por import dinâmico no build do cliente e falha acima do budget (gzip):
 * - simulador do tuxedo, achado pelo texto do botão ("Avançar um passo"): 15 KiB;
 * - noite do farol no rodapé, achada pela cor do brilho da lâmpada: 8 KiB;
 * - ciclo do farol na 404, achado pelo codec do WebM: 4 KiB.
 * O runtime do Svelte, compartilhado por todas as páginas, não entra na conta — só o que cada ilha baixa a mais.
 *
 * Uso: npm run build && node scripts/check-island-budget.mjs
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const KIB = 1024
const islands = [
  { name: 'Ilha do simulador', marker: 'Avançar um passo', budget: 15 * KIB },
  { name: 'Ilha da noite do farol (rodapé)', marker: 'rgba(255, 250, 200, 1)', budget: 8 * KIB },
  { name: 'Ilha do ciclo do farol (404)', marker: 'av01.0.05M.08', budget: 4 * KIB },
]
const dir = '.svelte-kit/output/client/_app/immutable/chunks'
const files = readdirSync(dir).filter((file) => file.endsWith('.js'))
const kib = (bytes) => (bytes / KIB).toFixed(1)
let failed = false
for (const island of islands) {
  const file = files.find((name) => readFileSync(join(dir, name), 'utf8').includes(island.marker))
  if (!file) {
    console.error(`✗ ${island.name}: chunk não encontrado (rode npm run build antes)`)
    failed = true
    continue
  }
  const source = readFileSync(join(dir, file))
  const gz = gzipSync(source, { level: 9 }).length
  const ok = gz <= island.budget
  if (!ok) failed = true
  console.log(`${ok ? '✓' : '✗'} ${island.name}: ${file} — ${kib(source.length)} KiB bruto, ${kib(gz)} KiB gzip (budget ${kib(island.budget)} KiB)`)
}
process.exit(failed ? 1 : 0)
