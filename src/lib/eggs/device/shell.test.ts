import { describe, expect, it } from 'vitest'
import { baseFacets, lidEdges } from './shell'

/** Extrai o fator de `var(--radius) * k` de uma largura de faceta de canto. */
function radiusFactor(width: string): number {
  const match = /var\(--radius\) \* ([\d.]+)/.exec(width)
  return match ? Number(match[1]) : Number.NaN
}

const PINK = '237 26 160'
const CYAN = '95 211 230'

/** Alfa do véu de cor chapada (`linear-gradient(rgb(c / a), rgb(c / a))`) no fundo de uma faceta. */
function wash(tone: string | undefined, rgb: string): number {
  const match = new RegExp(`linear-gradient\\(rgb\\(${rgb} / ([\\d.]+)\\), rgb`).exec(tone ?? '')
  return match ? Number(match[1]) : 0
}

describe('casca da base', () => {
  const facets = baseFacets(5)

  it('tem as quatro faces retas e cinco facetas por canto', () => {
    expect(facets).toHaveLength(4 + 4 * 5)
    expect(facets.filter((facet) => facet.side).map((facet) => facet.angle)).toEqual([0, 90, 180, 270])
  })

  it('as facetas de cada canto cobrem o quarto de círculo sem buraco', () => {
    const corners = facets.filter((facet) => !facet.side)
    const angles = corners.map((facet) => facet.angle).sort((a, b) => a - b)
    expect(angles[0]).toBeGreaterThan(0)
    expect(angles.at(-1)).toBeLessThan(360)
    // Soma das cordas de um canto ≥ comprimento do arco (π/2 · r): sem fresta entre facetas.
    const quarter = corners.filter((facet) => facet.angle < 90)
    const covered = quarter.reduce((total, facet) => total + radiusFactor(facet.width), 0)
    expect(covered).toBeGreaterThanOrEqual(Math.PI / 2)
    expect(covered).toBeLessThan((Math.PI / 2) * 1.12)
  })

  it('a luz pinta magenta na frente-direita e ciano atrás à direita, e a frente fica alumínio', () => {
    const at = (angle: number) => facets.find((facet) => Math.abs(facet.angle - angle) < 10)
    expect(wash(at(45)?.tone, PINK)).toBeGreaterThan(0.3)
    expect(wash(at(135)?.tone, CYAN)).toBeGreaterThan(0.15)
    expect(wash(facets.find((facet) => facet.side && facet.angle === 0)?.tone, PINK)).toBeLessThan(0.05)
    expect(wash(at(225)?.tone, PINK)).toBeLessThan(0.01)
  })
})

describe('arestas da tampa', () => {
  const edges = lidEdges(5)

  it('tem as quatro arestas retas e cinco facetas por canto', () => {
    expect(edges).toHaveLength(4 + 4 * 5)
    expect(edges.filter((edge) => edge.side).map((edge) => edge.angle)).toEqual([0, 90, 180, 270])
  })

  it('a aresta de cima (a da frente com a tampa fechada) acende em ciano à direita', () => {
    expect(edges.find((edge) => edge.side && edge.angle === 0)?.tone).toContain('95 211 230')
  })
})
