/**
 * scripts/check-contrast.mjs
 *
 * Calcula o contraste WCAG 2.x dos pares texto/fundo declarados abaixo, lendo os
 * valores de src/styles/tokens.css, e sai com código 1 se algum par ficar abaixo
 * do mínimo (AA: 4,5:1 texto normal; 3:1 texto grande, foco e componentes de interface).
 *
 * A paleta é única e escura (grafite, creme, acento ciano): não há tema claro nem `prefers-color-scheme`.
 * Também falha se um bloco de tema claro/escuro voltar a aparecer em tokens.css.
 *
 * Uso: node scripts/check-contrast.mjs [caminho/para/tokens.css]
 */
import { readFileSync } from 'node:fs'

const file = process.argv[2] ?? 'src/styles/tokens.css'
const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

/** Extrai as declarações `--x: valor;` do primeiro bloco cujo seletor casa com `selectorRe`. */
function block(selectorRe) {
  const match = selectorRe.exec(css)
  if (!match) throw new Error(`Bloco não encontrado: ${selectorRe}`)
  let depth = 0
  let i = css.indexOf('{', match.index)
  const start = i + 1
  for (; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) break
  }
  const body = css.slice(start, i)
  const vars = {}
  for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[name] = value.trim()
  return vars
}

const root = block(/(^|\n)\s*:root\s*\{/)
/**
 * Superfícies reais do site. O hero da home põe texto sobre o vídeo: ali o contraste é medido no e2e, contra os
 * pixels atrás de cada texto; aqui entra o fundo sólido por baixo do vídeo (`--color-band`).
 */
const themes = {
  página: root,
  'superfície elevada (painéis)': { ...root, '--color-bg': 'var(--color-surface)' },
  'superfície funda (hero, código, telas)': { ...root, '--color-bg': 'var(--color-band)' },
}

function resolve(vars, name, seen = new Set()) {
  if (seen.has(name)) throw new Error(`Referência circular em ${name}`)
  seen.add(name)
  const value = vars[name]
  if (value === undefined) throw new Error(`Token ausente: ${name}`)
  const ref = /^var\((--[\w-]+)\)$/.exec(value)
  return ref ? resolve(vars, ref[1], seen) : value
}

function luminance(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!m) throw new Error(`Cor não suportada (use #rrggbb): ${hex}`)
  const [r, g, b] = [0, 2, 4].map((o) => parseInt(m[1].slice(o, o + 2), 16) / 255)
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const TEXT = 4.5 // texto normal
const LARGE = 3 // texto ≥ 24 px, ou ≥ 18,66 px em negrito; foco; bordas de controle

/** [primeiro plano, fundo, mínimo, uso] */
const pairs = [
  ['--color-text', '--color-bg', TEXT, 'títulos e texto forte'],
  ['--color-text-body', '--color-bg', TEXT, 'corpo de leitura'],
  ['--color-text-soft', '--color-bg', TEXT, 'texto de apoio'],
  ['--color-text-faint', '--color-bg', TEXT, 'metadados 12–14 px'],
  ['--color-link', '--color-bg', TEXT, 'link'],
  ['--color-link-hover', '--color-bg', TEXT, 'link hover'],
  ['--color-accent', '--color-bg', TEXT, 'rótulo em caixa alta (ciano)'],
  ['--color-on-button', '--color-button', TEXT, 'botão principal (pílula branca)'],
  ['--color-bg', '--color-text', TEXT, 'filtro ativo (pílula creme)'],
  ['--color-button', '--color-bg', LARGE, 'contorno do botão principal'],
  ['--color-status-live', '--color-bg', TEXT, 'rótulo de estado'],
  ['--color-focus', '--color-bg', LARGE, 'anel de foco'],
  ['--color-mark', '--color-bg', LARGE, 'símbolo (componente gráfico)'],
  ['--color-print-ink', '--color-print', TEXT, 'legenda das fotos em papel'],
  ['--color-rule', '--color-bg', 1, 'fio decorativo (informativo)'],
  ['--color-text-mute', '--color-bg', 1, 'separador decorativo (informativo; não usar em texto)'],
]

let failures = 0
for (const [theme, vars] of Object.entries(themes)) {
  console.log(`\nTema ${theme}`)
  for (const [fg, bg, min, use] of pairs) {
    // Fios de 1 px são decorativos (sem mínimo); o valor fica no relatório.
    const a = resolve(vars, fg)
    const b = resolve(vars, bg)
    const r = ratio(a, b)
    const ok = r >= min
    if (!ok) failures++
    console.log(
      `${ok ? 'ok   ' : 'FALHA'} ${r.toFixed(2).padStart(5)}:1 (mín ${min}) ${fg} ${a} sobre ${bg} ${b} — ${use}`,
    )
  }
}

if (/data-theme|prefers-color-scheme/.test(css)) {
  failures++
  console.log('\nFALHA tokens.css voltou a declarar tema claro/escuro (data-theme ou prefers-color-scheme)')
}

console.log(failures ? `\n${failures} falha(s) de contraste.` : `\nTodos os ${pairs.length * Object.keys(themes).length} pares passam em AA.`)
process.exit(failures ? 1 : 0)
