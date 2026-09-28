/**
 * scripts/build-brand.mjs
 * Gera os SVGs do símbolo WHOISCLEBS (bloco de terminal com C em espaço negativo + cursor sublinhado) e da assinatura horizontal com letreiro em células. Uso: node scripts/build-brand.mjs
 * O path vem de src/lib/brand/symbol.ts (fonte única, também usada no header do site).
 * Saída: static/brand/*.svg.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SYMBOL_PATH } from '../src/lib/brand/symbol.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'static', 'brand')
mkdirSync(out, { recursive: true })

const INK = '#16181d'
const PAPER = '#eeeae1'

// Grade 16×16: moldura de 2, C de traço 3 escavado, cursor sublinhado 4×2 na base.

// Letreiro em células 5 linhas de altura (mesma lógica do símbolo: quadrado, sem curva).
const GLYPHS = {
  W: ['#...#', '#...#', '#.#.#', '#.#.#', '#####'],
  H: ['#..#', '#..#', '####', '#..#', '#..#'],
  O: ['####', '#..#', '#..#', '#..#', '####'],
  I: ['#', '#', '#', '#', '#'],
  S: ['####', '#...', '####', '...#', '####'],
  C: ['####', '#...', '#...', '#...', '####'],
  L: ['#...', '#...', '#...', '#...', '####'],
  E: ['####', '#...', '###.', '#...', '####'],
  B: ['###.', '#..#', '###.', '#..#', '###.'],
}

/** Converte linhas de células em um único path (retângulos por sequência horizontal). */
function cellsPath(rows, ox = 0, oy = 0, size = 1) {
  let d = ''
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      if (row[x] !== '#') { x++; continue }
      let end = x
      while (row[end] === '#') end++
      d += `M${+(ox + x * size).toFixed(3)} ${+(oy + y * size).toFixed(3)}h${+((end - x) * size).toFixed(3)}v${size}h${-((end - x) * size)}Z`
      x = end
    }
  })
  return d
}

function wordmark(text, ox, oy, size) {
  let x = ox
  let d = ''
  for (const ch of text) {
    const g = GLYPHS[ch]
    d += cellsPath(g, x, oy, size)
    x += (g[0].length + 1) * size
  }
  return { d, width: x - size - ox }
}

const svg = (viewBox, body, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${extra}>${body}</svg>\n`

const title = '<title>WHOISCLEBS</title>'

// 1. Símbolo quadrado (currentColor: herda a cor do texto quando embutido inline).
writeFileSync(join(out, 'symbol.svg'), svg('0 0 16 16', `${title}<path fill="currentColor" fill-rule="evenodd" d="${SYMBOL_PATH}"/>`, ' role="img"'))
// 2. Símbolo em tinta fixa (para <img>, onde currentColor não se aplica).
writeFileSync(join(out, 'symbol-ink.svg'), svg('0 0 16 16', `${title}<path fill="${INK}" fill-rule="evenodd" d="${SYMBOL_PATH}"/>`, ' role="img"'))
// 3. Favicon: tinta no claro, papel no escuro.
writeFileSync(
  join(out, 'favicon.svg'),
  svg(
    '0 0 16 16',
    `<style>path{fill:${INK}}@media (prefers-color-scheme:dark){path{fill:${PAPER}}}</style><path fill-rule="evenodd" d="${SYMBOL_PATH}"/>`,
  ),
)
// 4. Assinatura horizontal: símbolo (16) + letreiro com células de 2 (10 de altura), centrado. Uso mínimo: 24 px de altura.
const cell = 2
const gap = 8
const wm = wordmark('WHOISCLEBS', 16 + gap, (16 - 5 * cell) / 2, cell)
const width = +(16 + gap + wm.width).toFixed(3)
writeFileSync(
  join(out, 'lockup-horizontal.svg'),
  svg(`0 0 ${width} 16`, `${title}<g fill="currentColor"><path fill-rule="evenodd" d="${SYMBOL_PATH}"/><path d="${wm.d}"/></g>`, ' role="img"'),
)
console.log('ok', out, 'lockup width', width)

// 5. PNGs para plataformas que não aceitam SVG: apple-touch-icon (180, papel com margem) e 32 px.
const { default: sharp } = await import('sharp')
const tile = (size, pad) =>
  Buffer.from(
    svg(`0 0 ${16 + pad * 2} ${16 + pad * 2}`, `<rect width="100%" height="100%" fill="#f5f2ea"/><path transform="translate(${pad} ${pad})" fill="${INK}" fill-rule="evenodd" d="${SYMBOL_PATH}"/>`, ` width="${size}" height="${size}"`),
  )
await sharp(tile(180, 4)).png({ compressionLevel: 9, palette: true }).toFile(join(out, 'apple-touch-icon.png'))
await sharp(Buffer.from(svg('0 0 16 16', `<path fill="${INK}" fill-rule="evenodd" d="${SYMBOL_PATH}"/>`, ' width="32" height="32"'))).png({ compressionLevel: 9, palette: true }).toFile(join(out, 'icon-32.png'))
