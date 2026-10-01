/**
 * Casca do notebook em CSS 3D: as faces de borda da base e da tampa, com os cantos arredondados em facetas.
 * Cada faceta é um plano só, e nenhum plano atravessa outro (só se tocam nas arestas): o Chrome não precisa
 * dividir nada, e as faces ficam lisas. A cor de cada faceta sai da direção da normal em relação à luz da cena:
 * alumínio mais claro de frente para a direita, fio magenta na frente-direita da base e ciano na tampa.
 *
 * Posições em `calc()` sobre as medidas do componente (`--w`, `--deck`, `--lid-h`, `--radius`).
 */

export interface BaseFacet {
  /** Centro da faceta no plano da mesa (x para a direita, z para a frente a partir da dobradiça). */
  x: string
  z: string
  width: string
  /** Direção da normal em graus: 0 frente, 90 direita, 180 trás, 270 esquerda. */
  angle: number
  tone: string
  /** Face reta (lado inteiro) ou faceta de canto. */
  side: boolean
}

export interface LidEdge {
  /** Centro da aresta na caixa da tampa (origem no canto de cima à esquerda; y para baixo). */
  x: string
  y: string
  width: string
  /** Direção da normal em graus: 0 em cima, 90 direita, 180 embaixo (dobradiça), 270 esquerda. */
  angle: number
  tone: string
  side: boolean
}

const RAD = Math.PI / 180
/** Sobreposição entre facetas vizinhas: sem fresta de antisserrilhado. */
const OVERLAP = 1.06
const PINK = '237 26 160'
const CYAN = '95 211 230'

const n = (value: number) => Number(value.toFixed(4))
/** Lóbulo de luz: 1 na direção `peak`, caindo a 0 a 90° dela; `sharp` estreita o lóbulo (fio de luz). */
const lobe = (angle: number, peak: number, sharp = 2) => Math.max(0, Math.cos((angle - peak) * RAD)) ** sharp

function wash(rgb: string, alpha: number): string {
  return `linear-gradient(rgb(${rgb} / ${n(alpha)}), rgb(${rgb} / ${n(alpha)}))`
}

/** Alumínio na vertical: chanfro claro em cima, escurecendo para baixo; `light` de 0 a 1. */
function metal(light: number, direction = '180deg'): string {
  const top = 34 + light * 22
  const bottom = 12 + light * 12
  return `linear-gradient(${direction}, hsl(222 7% ${n(top + 18)}%) 0, hsl(222 6% ${n(top)}%) 12%, hsl(222 6% ${n(bottom)}%))`
}

function baseTone(angle: number, side: boolean): string {
  const light = 0.35 + 0.65 * lobe(angle, 60)
  // Faces retas: só o degradê ao longo do lado. Facetas de canto: lóbulo largo, para a luz que termina numa
  // face reta continuar pelo canto sem faixa cinza.
  const layers = side ? [] : [wash(PINK, 0.5 * lobe(angle, 40, 4)), wash(CYAN, 0.3 * lobe(angle, 135, 4))]
  // Nas faces longas a luz anda ao longo do lado: a frente acende para a direita, a lateral direita vai do
  // magenta (frente) ao ciano (trás).
  if (side && angle === 0) layers.unshift(`linear-gradient(90deg, transparent 72%, rgb(${PINK} / 0.45))`)
  if (side && angle === 90) layers.unshift(`linear-gradient(90deg, rgb(${PINK} / 0.45), transparent 30%, transparent 70%, rgb(${CYAN} / 0.2))`)
  return [...layers, metal(light)].join(', ')
}

function lidTone(angle: number, side: boolean): string {
  const light = 0.2 + 0.8 * Math.max(lobe(angle, 30), 0.25 * lobe(angle, 300))
  const layers = side ? [] : [wash(CYAN, 0.6 * lobe(angle, 45, 4))]
  if (side && angle === 0) layers.unshift(`linear-gradient(90deg, transparent 72%, rgb(${CYAN} / 0.6))`)
  if (side && angle === 90) layers.unshift(`linear-gradient(90deg, rgb(${CYAN} / 0.45), rgb(${CYAN} / 0.08))`)
  // O degradê vertical do metal vai ao longo da espessura (das costas para a tela).
  return [...layers, metal(light)].join(', ')
}

function chord(perCorner: number): string {
  return `calc(var(--radius) * ${n(2 * Math.sin(((90 / perCorner) * RAD) / 2) * OVERLAP)})`
}

/** Faces de borda da base: frente, direita, trás, esquerda e os quatro cantos. */
export function baseFacets(perCorner = 5): BaseFacet[] {
  const sides: BaseFacet[] = [
    { x: '0px', z: 'var(--deck)', width: 'calc(var(--w) - var(--radius) * 2)', angle: 0, tone: '', side: true },
    { x: 'calc(var(--w) * 0.5)', z: 'calc(var(--deck) * 0.5)', width: 'calc(var(--deck) - var(--radius) * 2)', angle: 90, tone: '', side: true },
    { x: '0px', z: '0px', width: 'calc(var(--w) - var(--radius) * 2)', angle: 180, tone: '', side: true },
    { x: 'calc(var(--w) * -0.5)', z: 'calc(var(--deck) * 0.5)', width: 'calc(var(--deck) - var(--radius) * 2)', angle: 270, tone: '', side: true },
  ]
  // Cantos: [ângulo inicial, lado em x (+1 direita), lado em z (+1 frente)].
  const corners: [number, 1 | -1, 1 | -1][] = [
    [0, 1, 1],
    [90, 1, -1],
    [180, -1, -1],
    [270, -1, 1],
  ]
  const step = 90 / perCorner
  const reach = Math.cos((step * RAD) / 2)
  const width = chord(perCorner)
  const facets: BaseFacet[] = []
  for (const [from, sx, sz] of corners) {
    for (let index = 0; index < perCorner; index++) {
      const angle = from + (index + 0.5) * step
      const a = reach * Math.sin(angle * RAD)
      const b = reach * Math.cos(angle * RAD)
      facets.push({
        x: `calc(var(--w) * ${sx * 0.5} + var(--radius) * ${n(a - sx)})`,
        z: sz === 1 ? `calc(var(--deck) + var(--radius) * ${n(b - 1)})` : `calc(var(--radius) * ${n(1 + b)})`,
        width,
        angle: n(angle),
        tone: '',
        side: false,
      })
    }
  }
  return [...sides, ...facets].map((facet) => ({ ...facet, tone: baseTone(facet.angle, facet.side) }))
}

/** Arestas da tampa: em cima, direita, embaixo (dobradiça), esquerda e os quatro cantos. */
export function lidEdges(perCorner = 5): LidEdge[] {
  const sides: LidEdge[] = [
    { x: 'calc(var(--w) * 0.5)', y: '0px', width: 'calc(var(--w) - var(--radius) * 2)', angle: 0, tone: '', side: true },
    { x: 'var(--w)', y: 'calc(var(--lid-h) * 0.5)', width: 'calc(var(--lid-h) - var(--radius) * 2)', angle: 90, tone: '', side: true },
    { x: 'calc(var(--w) * 0.5)', y: 'var(--lid-h)', width: 'calc(var(--w) - var(--radius) * 2)', angle: 180, tone: '', side: true },
    { x: '0px', y: 'calc(var(--lid-h) * 0.5)', width: 'calc(var(--lid-h) - var(--radius) * 2)', angle: 270, tone: '', side: true },
  ]
  // Cantos: [ângulo inicial, lado em x (+1 direita), lado em y (+1 embaixo)].
  const corners: [number, 1 | -1, 1 | -1][] = [
    [0, 1, -1],
    [90, 1, 1],
    [180, -1, 1],
    [270, -1, -1],
  ]
  const step = 90 / perCorner
  const reach = Math.cos((step * RAD) / 2)
  const width = chord(perCorner)
  const edges: LidEdge[] = []
  for (const [from, sx, sy] of corners) {
    for (let index = 0; index < perCorner; index++) {
      const angle = from + (index + 0.5) * step
      const a = reach * Math.sin(angle * RAD)
      const b = reach * Math.cos(angle * RAD)
      edges.push({
        x: sx === 1 ? `calc(var(--w) + var(--radius) * ${n(a - 1)})` : `calc(var(--radius) * ${n(1 + a)})`,
        y: sy === 1 ? `calc(var(--lid-h) - var(--radius) * ${n(1 + b)})` : `calc(var(--radius) * ${n(1 - b)})`,
        width,
        angle: n(angle),
        tone: '',
        side: false,
      })
    }
  }
  return [...sides, ...edges].map((edge) => ({ ...edge, tone: lidTone(edge.angle, edge.side) }))
}
