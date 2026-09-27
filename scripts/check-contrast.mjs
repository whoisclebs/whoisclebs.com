/**
 * scripts/check-contrast.mjs
 *
 * Calcula o contraste WCAG 2.x dos pares texto/fundo declarados abaixo, lendo os
 * valores de src/styles/tokens.css (tema claro e escuro), e sai com código 1 se
 * algum par ficar abaixo do mínimo (AA: 4,5:1 texto normal; 3:1 texto grande,
 * foco e componentes de interface).
 *
 * Também confere que o bloco `prefers-color-scheme: dark` declara exatamente os
 * mesmos valores que `:root[data-theme='dark']`.
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

const light = block(/(^|\n)\s*:root\s*\{/)
const darkAttr = block(/:root\[data-theme='dark'\]\s*\{/)
const darkMedia = block(/:root:not\(\[data-theme='light'\]\)\s*\{/)
const themes = { claro: light, escuro: { ...light, ...darkAttr } }

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
  ['--color-text', '--color-bg', TEXT, 'corpo'],
  ['--color-text', '--color-surface', TEXT, 'corpo em folha/campo'],
  ['--color-text', '--color-band', TEXT, 'corpo em faixa de capítulo'],
  ['--color-text-soft', '--color-bg', TEXT, 'texto secundário'],
  ['--color-text-soft', '--color-surface', TEXT, 'texto secundário em folha'],
  ['--color-text-soft', '--color-band', TEXT, 'texto secundário em faixa'],
  ['--color-text-faint', '--color-bg', TEXT, 'metadados mono 12–14 px'],
  ['--color-text-faint', '--color-surface', TEXT, 'metadados mono em folha'],
  ['--color-text-faint', '--color-band', TEXT, 'metadados mono em faixa'],
  ['--color-link', '--color-bg', TEXT, 'link'],
  ['--color-link', '--color-surface', TEXT, 'link em folha'],
  ['--color-link', '--color-band', TEXT, 'link em faixa'],
  ['--color-link-hover', '--color-bg', TEXT, 'link hover'],
  ['--color-on-accent', '--color-accent', TEXT, 'botão primário'],
  ['--color-status-live', '--color-bg', TEXT, 'rótulo de estado'],
  ['--color-status-live', '--color-surface', TEXT, 'rótulo de estado em folha'],
  ['--color-focus', '--color-bg', LARGE, 'anel de foco'],
  ['--color-focus', '--color-surface', LARGE, 'anel de foco em folha'],
  ['--color-focus', '--color-band', LARGE, 'anel de foco em faixa'],
  ['--color-mark', '--color-bg', LARGE, 'símbolo (componente gráfico)'],
  ['--color-night-text', '--color-night-bg', TEXT, 'texto em trecho noturno'],
  ['--color-night-text', '--color-night-surface', TEXT, 'texto em trecho noturno elevado'],
  ['--color-night-text-soft', '--color-night-bg', TEXT, 'texto secundário noturno'],
  ['--color-night-text-soft', '--color-night-surface', TEXT, 'texto secundário noturno elevado'],
  ['--color-night-link', '--color-night-bg', TEXT, 'link noturno'],
  ['--color-night-link', '--color-night-surface', TEXT, 'link noturno elevado'],
  ['--color-dawn', '--color-night-bg', LARGE, 'primeira luz (só texto grande/decorativo)'],
]

let failures = 0
for (const [theme, vars] of Object.entries(themes)) {
  console.log(`\nTema ${theme}`)
  for (const [fg, bg, min, use] of pairs) {
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

const mismatched = Object.keys({ ...darkAttr, ...darkMedia }).filter((k) => darkAttr[k] !== darkMedia[k])
if (mismatched.length) {
  failures++
  console.log(`\nFALHA tema escuro divergente entre data-theme e prefers-color-scheme: ${mismatched.join(', ')}`)
}

console.log(failures ? `\n${failures} falha(s) de contraste.` : `\nTodos os ${pairs.length * 2} pares passam em AA.`)
process.exit(failures ? 1 : 0)
