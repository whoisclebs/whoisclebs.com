/**
 * Lógica pura do Mapa de Decisões (hero da home, passo 05): geometria dos caminhos na quadrícula e
 * navegação por teclado do padrão de abas (WAI-ARIA APG "Tabs", ativação automática).
 *
 * Verdade editorial (decisions.md, item 12): a forma codifica a evidência. Caminho de células cheias =
 * código público; caminho vazado = sem case público, sempre com rótulo em texto no componente.
 */

export type Cell = readonly [x: number, y: number]
export type Evidence = 'public-code' | 'no-public-case' | 'in-progress'
export type RouteId = 'http' | 'payments' | 'agents'

export interface DecisionRoute {
  id: RouteId
  evidence: Evidence
  /** Pontos de virada; entre dois pontos o segmento é horizontal ou vertical. */
  waypoints: readonly Cell[]
}

/** Textos do mapa (i18n `home.map`); `routes` segue a ordem de `DECISION_ROUTES`. */
export interface DecisionMapCopy {
  title: string
  intro: string
  listLabel: string
  decision: string
  tradeoff: string
  noLink: string
  routes: readonly { label: string; evidence: string; decision: string; tradeoff: string; link: string }[]
}

/** Quadrícula em células; a origem é a célula "problema" de onde saem os caminhos. */
export const GRID = { cols: 16, rows: 10, origin: [1, 5] as Cell } as const

export const DECISION_ROUTES: readonly DecisionRoute[] = [
  { id: 'http', evidence: 'public-code', waypoints: [[1, 4], [1, 2], [6, 2], [6, 1], [14, 1]] },
  { id: 'payments', evidence: 'no-public-case', waypoints: [[2, 5], [14, 5]] },
  { id: 'agents', evidence: 'public-code', waypoints: [[1, 6], [1, 8], [14, 8]] },
]

/** Expande pontos de virada em células vizinhas (sem repetir a esquina). */
export function expandRoute(waypoints: readonly Cell[]): Cell[] {
  const cells: Cell[] = []
  waypoints.forEach((point, index) => {
    const prev = waypoints[index - 1]
    if (!prev) {
      cells.push(point)
      return
    }
    const dx = Math.sign(point[0] - prev[0])
    const dy = Math.sign(point[1] - prev[1])
    if (dx !== 0 && dy !== 0) throw new Error(`segmento diagonal entre ${prev.join(',')} e ${point.join(',')}`)
    let [x, y] = prev
    while (x !== point[0] || y !== point[1]) {
      x += dx
      y += dy
      cells.push([x, y])
    }
  })
  return cells
}

export function routeCells(route: DecisionRoute): Cell[] {
  return expandRoute(route.waypoints)
}

/**
 * Próxima aba para a tecla pressionada. Setas nos dois eixos (a lista é vertical no desktop e pode ser
 * lida como horizontal), com volta nas pontas; Home/End. `null` = tecla que o componente não trata.
 */
export function nextIndex(current: number, key: string, count: number): number | null {
  if (count <= 0) return null
  switch (key) {
    case 'ArrowDown':
    case 'ArrowRight':
      return (current + 1) % count
    case 'ArrowUp':
    case 'ArrowLeft':
      return (current - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}
