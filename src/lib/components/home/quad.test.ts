import { describe, expect, it } from 'vitest'
import { matrixForQuad, projectPoint, type Quad } from './quad'

/** Tela do laptop no quadro do hero, já em pixels de um palco de 1280×720. */
const SCREEN: Quad = [
  [785, 396],
  [1058, 406],
  [1020, 612],
  [741, 596],
]

describe('matrixForQuad', () => {
  it('leva os quatro cantos do retângulo aos quatro cantos do quadrilátero', () => {
    const matrix = matrixForQuad(480, 300, SCREEN)
    const corners: [number, number][] = [
      [0, 0],
      [480, 0],
      [480, 300],
      [0, 300],
    ]
    corners.forEach((corner, index) => {
      const [x, y] = projectPoint(matrix, corner)
      const [qx, qy] = SCREEN[index]!
      expect(x).toBeCloseTo(qx, 6)
      expect(y).toBeCloseTo(qy, 6)
    })
  })

  it('um retângulo igual ao de origem dá a identidade', () => {
    const matrix = matrixForQuad(200, 100, [
      [0, 0],
      [200, 0],
      [200, 100],
      [0, 100],
    ])
    expect(matrix.map((value) => Number(value.toFixed(9)))).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
  })

  it('um paralelogramo sai sem perspectiva (termos de projeção zerados)', () => {
    const matrix = matrixForQuad(100, 100, [
      [10, 10],
      [110, 30],
      [130, 130],
      [30, 110],
    ])
    expect(matrix[3]).toBeCloseTo(0, 9)
    expect(matrix[7]).toBeCloseTo(0, 9)
  })

  it('o centro do retângulo cai dentro do quadrilátero, puxado para o lado mais distante', () => {
    const [x, y] = projectPoint(matrixForQuad(480, 300, SCREEN), [240, 150])
    expect(x).toBeGreaterThan(741)
    expect(x).toBeLessThan(1058)
    expect(y).toBeGreaterThan(396)
    expect(y).toBeLessThan(612)
  })
})
