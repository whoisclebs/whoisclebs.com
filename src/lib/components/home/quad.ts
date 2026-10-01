/**
 * Perspectiva de um retângulo sobre um quadrilátero: a matriz que deita um elemento plano (o conteúdo da tela)
 * em cima de uma superfície vista de lado numa imagem (a tela do laptop no vídeo do hero).
 *
 * Um `rotate`/`skew` não resolve: a tela está em perspectiva, as bordas opostas não são paralelas. A saída é a
 * homografia que leva os quatro cantos do elemento aos quatro cantos medidos na imagem, no formato do
 * `matrix3d()` do CSS (16 valores, por colunas), para usar com `transform-origin: 0 0`.
 */
export type Point = readonly [number, number]
/** Cantos no sentido horário a partir do superior esquerdo. */
export type Quad = readonly [Point, Point, Point, Point]

/** Matriz que leva o retângulo `width` × `height` (origem no canto superior esquerdo) ao quadrilátero. */
export function matrixForQuad(width: number, height: number, quad: Quad): number[] {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad
  // Quadrado unitário → quadrilátero (Heckbert, 1989). `g` e `h` são os termos de projeção: zero num
  // paralelogramo.
  const dx1 = x1 - x2
  const dx2 = x3 - x2
  const dx3 = x0 - x1 + x2 - x3
  const dy1 = y1 - y2
  const dy2 = y3 - y2
  const dy3 = y0 - y1 + y2 - y3
  const det = dx1 * dy2 - dy1 * dx2
  const g = det === 0 ? 0 : (dx3 * dy2 - dy3 * dx2) / det
  const h = det === 0 ? 0 : (dx1 * dy3 - dy1 * dx3) / det
  const a = x1 - x0 + g * x1
  const b = x3 - x0 + h * x3
  const d = y1 - y0 + g * y1
  const e = y3 - y0 + h * y3
  // Do quadrado unitário para o retângulo do elemento: divide cada coluna pela dimensão correspondente.
  return [a / width, d / width, 0, g / width, b / height, e / height, 0, h / height, 0, 0, 1, 0, x0, y0, 0, 1]
}

/** Onde um ponto do elemento vai parar depois da matriz (a mesma conta que o navegador faz). */
export function projectPoint(matrix: readonly number[], [x, y]: Point): [number, number] {
  const at = (index: number) => matrix[index] ?? 0
  const w = at(3) * x + at(7) * y + at(15)
  return [(at(0) * x + at(4) * y + at(12)) / w, (at(1) * x + at(5) * y + at(13)) / w]
}
