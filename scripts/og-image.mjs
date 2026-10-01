/**
 * Imagens Open Graph (1200×630) desenhadas em SVG a partir do símbolo (`src/lib/brand/symbol.ts`) e dos
 * tokens primitivos (`src/styles/tokens.css`), com texto em letras de células — a mesma gramática do
 * letreiro da marca. Sem fonte do sistema: o resultado é igual em qualquer máquina de build.
 * Funções puras; quem grava os PNGs é `scripts/build-og.mjs`.
 */

export const OG_WIDTH = 1200
export const OG_HEIGHT = 630
export const OG_MAX_BYTES = 100 * 1024

/** Alfabeto de células, 5 linhas de altura (quadrado, sem curva, como o símbolo). */
export const CELL_GLYPHS = {
  A: ['.##.', '#..#', '####', '#..#', '#..#'],
  B: ['###.', '#..#', '###.', '#..#', '###.'],
  C: ['####', '#...', '#...', '#...', '####'],
  D: ['###.', '#..#', '#..#', '#..#', '###.'],
  E: ['####', '#...', '###.', '#...', '####'],
  F: ['####', '#...', '###.', '#...', '#...'],
  G: ['####', '#...', '#.##', '#..#', '####'],
  H: ['#..#', '#..#', '####', '#..#', '#..#'],
  I: ['#', '#', '#', '#', '#'],
  J: ['...#', '...#', '...#', '#..#', '####'],
  K: ['#..#', '#.#.', '##..', '#.#.', '#..#'],
  L: ['#...', '#...', '#...', '#...', '####'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'],
  O: ['####', '#..#', '#..#', '#..#', '####'],
  P: ['####', '#..#', '####', '#...', '#...'],
  Q: ['####', '#..#', '#..#', '#.##', '####'],
  R: ['####', '#..#', '####', '#.#.', '#..#'],
  S: ['####', '#...', '####', '...#', '####'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  U: ['#..#', '#..#', '#..#', '#..#', '####'],
  V: ['#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#.#.#', '#.#.#', '#####'],
  X: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  Y: ['#...#', '.#.#.', '..#..', '..#..', '..#..'],
  Z: ['####', '...#', '.##.', '#...', '####'],
  ' ': ['..', '..', '..', '..', '..'],
  '.': ['.', '.', '.', '.', '#'],
}

/** Primitivos `--p-*` do tokens.css (ex.: `ink`, `cream`, `cyan`). A paleta é única e escura: grafite, creme, ciano. */
export function readPrimitives(css) {
  const colors = {}
  for (const match of css.matchAll(/--p-([a-z-]+):\s*(#[0-9a-f]{6})/gi)) colors[match[1]] = match[2].toLowerCase()
  for (const name of ['ink', 'cream', 'cream-soft', 'ink-raised', 'ink-line', 'cyan']) {
    if (!colors[name]) throw new Error(`tokens.css sem o primitivo --p-${name}`)
  }
  return colors
}

/** Texto em letras de células → um path. Lança erro para caractere sem glifo (nada de fallback silencioso). */
export function cellText(text, x0, y0, size) {
  let x = x0
  let d = ''
  for (const char of text.toUpperCase()) {
    const glyph = CELL_GLYPHS[char]
    if (!glyph) throw new Error(`sem glifo de células para "${char}" em "${text}"`)
    glyph.forEach((row, y) => {
      let col = 0
      while (col < row.length) {
        if (row[col] !== '#') {
          col++
          continue
        }
        let end = col
        while (row[end] === '#') end++
        d += `M${x + col * size} ${y0 + y * size}h${(end - col) * size}v${size}h${-(end - col) * size}Z`
        col = end
      }
    })
    x += (glyph[0].length + 1) * size
  }
  return { d, width: x - x0 - size, height: 5 * size }
}

/** Maior tamanho de célula (inteiro) para o texto caber em `maxWidth`, limitado a `maxSize`. */
export function fitCellSize(text, maxWidth, maxSize) {
  for (let size = maxSize; size > 1; size--) if (cellText(text, 0, 0, size).width <= maxWidth) return size
  return 1
}

function grid(colors) {
  let d = ''
  for (let x = 30; x < OG_WIDTH; x += 30) d += `M${x} 0V${OG_HEIGHT}`
  for (let y = 30; y < OG_HEIGHT; y += 30) d += `M0 ${y}H${OG_WIDTH}`
  return `<path d="${d}" stroke="${colors['ink-raised']}" stroke-width="1" shape-rendering="crispEdges" fill="none"/>`
}

function symbol(symbolPath, x, y, scale, fill) {
  return `<path transform="translate(${x} ${y}) scale(${scale})" fill="${fill}" fill-rule="evenodd" d="${symbolPath}"/>`
}

/**
 * `title` ausente = imagem padrão do site (símbolo grande + letreiro + lema).
 * Com `title` (case): assinatura pequena no topo, rótulo azul e o nome do projeto grande.
 */
export function ogSvg({ symbolPath, colors, kicker, title }) {
  const margin = 90
  const parts = [`<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${colors.ink}"/>`, grid(colors)]
  const footer = cellText('WHOISCLEBS.COM', margin, 540, 4)
  if (!title) {
    parts.push(symbol(symbolPath, margin, 150, 12, colors.cream))
    const mark = cellText('WHOISCLEBS', 330, 162, 14)
    parts.push(`<path fill="${colors.cream}" d="${mark.d}"/>`)
    const line = cellText(kicker ?? 'ENGENHARIA DE SOFTWARE SEM TEATRO', 330, 282, fitCellSize(kicker ?? 'ENGENHARIA DE SOFTWARE SEM TEATRO', OG_WIDTH - 330 - margin, 6))
    parts.push(`<path fill="${colors['cream-soft']}" d="${line.d}"/>`)
  } else {
    parts.push(symbol(symbolPath, margin, 90, 4, colors.cream))
    const mark = cellText('WHOISCLEBS', margin + 90, 104, 7)
    parts.push(`<path fill="${colors.cream}" d="${mark.d}"/>`)
    const label = cellText(kicker ?? 'ESTUDO DE CASO', margin, 240, 6)
    parts.push(`<path fill="${colors.cyan}" d="${label.d}"/>`)
    const size = fitCellSize(title, OG_WIDTH - 2 * margin, 26)
    const big = cellText(title, margin, 300, size)
    parts.push(`<path fill="${colors.cream}" d="${big.d}"/>`)
    // Cursor sublinhado depois do nome, como no símbolo ("C_").
    parts.push(`<rect x="${margin + big.width + size}" y="${300 + 4 * size}" width="${2 * size}" height="${size}" fill="${colors.cyan}"/>`)
  }
  parts.push(`<path d="M${margin} 510H${OG_WIDTH - margin}" stroke="${colors['ink-line']}" stroke-width="2" shape-rendering="crispEdges"/>`)
  parts.push(`<path fill="${colors['cream-soft']}" d="${footer.d}"/>`)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">${parts.join('')}</svg>\n`
}
