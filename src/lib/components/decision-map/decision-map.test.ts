import { agentProjects } from '$lib/content/agents'
import { describe, expect, it } from 'vitest'
import { DECISION_ROUTES, GRID, expandRoute, nextIndex, routeCells } from './decision-map'

describe('nextIndex (teclado do padrão de abas, ativação automática)', () => {
  it('setas para baixo e para a direita avançam; para cima e para a esquerda voltam', () => {
    expect(nextIndex(0, 'ArrowDown', 3)).toBe(1)
    expect(nextIndex(0, 'ArrowRight', 3)).toBe(1)
    expect(nextIndex(2, 'ArrowUp', 3)).toBe(1)
    expect(nextIndex(2, 'ArrowLeft', 3)).toBe(1)
  })

  it('dá a volta nas pontas', () => {
    expect(nextIndex(2, 'ArrowDown', 3)).toBe(0)
    expect(nextIndex(0, 'ArrowUp', 3)).toBe(2)
  })

  it('Home e End vão para o primeiro e o último', () => {
    expect(nextIndex(1, 'Home', 3)).toBe(0)
    expect(nextIndex(1, 'End', 3)).toBe(2)
  })

  it('ignora outras teclas (devolve null para o componente não interceptar)', () => {
    expect(nextIndex(1, 'Tab', 3)).toBeNull()
    expect(nextIndex(1, 'Enter', 3)).toBeNull()
    expect(nextIndex(1, 'a', 3)).toBeNull()
  })

  it('não quebra com lista vazia', () => {
    expect(nextIndex(0, 'ArrowDown', 0)).toBeNull()
  })
})

describe('expandRoute', () => {
  it('expande pontos de virada em células vizinhas, sem repetir a esquina', () => {
    expect(expandRoute([[1, 4], [1, 2], [3, 2]])).toEqual([
      [1, 4], [1, 3], [1, 2], [2, 2], [3, 2],
    ])
  })

  it('rejeita segmento diagonal (o mapa é desenhado na quadrícula)', () => {
    expect(() => expandRoute([[0, 0], [2, 2]])).toThrow(/diagonal/)
  })
})

describe('rotas do mapa (verdade editorial codificada na forma)', () => {
  it('o primeiro caminho tem código público e pagamentos continua sem case público', () => {
    expect(DECISION_ROUTES[0]?.evidence).toBe('public-code')
    expect(DECISION_ROUTES.find((route) => route.id === 'payments')?.evidence).toBe('no-public-case')
  })

  it('agentes só aparece como código público se o capítulo lista um protótipo com código público', () => {
    const agents = DECISION_ROUTES.find((route) => route.id === 'agents')
    const hasPublicPrototype = agentProjects.some((project) => ['producao', 'prototipo'].includes(project.status) && project.code)
    expect(agents?.evidence === 'public-code').toBe(hasPublicPrototype)
  })

  it('cada caminho é contínuo, cabe na grade e não cruza outro', () => {
    const seen = new Set<string>()
    for (const route of DECISION_ROUTES) {
      const cells = routeCells(route)
      cells.forEach(([x, y], index) => {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThan(GRID.cols)
        expect(y).toBeLessThan(GRID.rows)
        const prev = cells[index - 1]
        if (prev) expect(Math.abs(prev[0] - x) + Math.abs(prev[1] - y)).toBe(1)
        const key = `${x},${y}`
        expect(seen.has(key)).toBe(false)
        seen.add(key)
      })
    }
  })

  it('todos saem de uma célula vizinha à origem', () => {
    for (const route of DECISION_ROUTES) {
      const [first] = routeCells(route)
      expect(first).toBeDefined()
      const [x, y] = first as [number, number]
      expect(Math.abs(x - GRID.origin[0]) + Math.abs(y - GRID.origin[1])).toBe(1)
    }
  })
})
