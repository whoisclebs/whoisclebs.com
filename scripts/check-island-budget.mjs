/**
 * scripts/check-island-budget.mjs
 *
 * Mede os chunks das ilhas carregadas por import dinâmico no build do cliente e falha acima do budget (gzip).
 * Cada ilha é achada por um texto que só existe no chunk dela:
 * - simulador do tuxedo (texto do botão): 15 KiB;
 * - ciclo do farol na 404 (codec do WebM): 4 KiB;
 * - easter eggs globais: teclado, neon, atalhos, aviso (estilo da arte no console): 4 KiB;
 * - notebook e celular da home, com terminal, boot e gaveta de apps (nome do vídeo de boot): 16 KiB;
 * - console de bolso com a serpente, no Sobre (modelo do aparelho): 4 KiB;
 * - d20 da página Hobbies (o sorteio): 4 KiB;
 * - estante da página Livros (o dialog do livro aberto): 7 KiB.
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
  { name: 'Ilha do ciclo do farol (404)', marker: 'av01.0.05M.08', budget: 4 * KIB },
  { name: 'Ilha dos easter eggs globais', marker: 'font-family:monospace', budget: 4 * KIB },
  { name: 'Ilha do notebook e do celular (home)', marker: 'boot-v1', budget: 16 * KIB },
  { name: 'Ilha do console de bolso (Sobre)', marker: 'PC-01', budget: 4 * KIB },
  { name: 'Ilha do d20 (Hobbies)', marker: 'getRandomValues', budget: 4 * KIB },
  { name: 'Ilha da estante (Livros)', marker: 'aria-haspopup', budget: 7 * KIB },
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
