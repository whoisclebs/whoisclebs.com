import { describe, expect, it } from 'vitest'
import {
  FACES,
  VERTICES,
  cryptoSource,
  faceForward,
  orientationFor,
  project,
  randomInt,
  rollD20,
  resolve,
  rotate,
  tumble,
  type Quat,
} from './d20'

/** Fonte fixa: devolve os valores na ordem, como `Uint32` vindos do gerador. */
function seq(...values: number[]) {
  let i = 0
  return () => {
    const v = values[i++]
    if (v === undefined) throw new Error('a sequência acabou')
    return v
  }
}

const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps

function quatClose(a: Quat, b: Quat, eps = 1e-9): boolean {
  // q e -q são a mesma rotação.
  const same = a.every((v, i) => close(v, b[i]!, eps))
  const flip = a.every((v, i) => close(v, -b[i]!, eps))
  return same || flip
}

describe('randomInt', () => {
  it('mapeia o resto da divisão para 1..n', () => {
    expect(randomInt(20, seq(0))).toBe(1)
    expect(randomInt(20, seq(19))).toBe(20)
    expect(randomInt(20, seq(20))).toBe(1)
  })

  it('rejeita a faixa final que daria viés e sorteia de novo', () => {
    // 2^32 = 4294967296; 4294967296 % 20 = 16, então de 4294967280 em diante é rejeitado.
    expect(randomInt(20, seq(4294967295, 4294967280, 6))).toBe(7)
    expect(randomInt(20, seq(4294967279))).toBe(20)
  })

  it('cada face sai exatamente uma vez num ciclo completo de restos', () => {
    const counts = new Map<number, number>()
    const source = seq(...Array.from({ length: 200 }, (_, i) => i))
    for (let i = 0; i < 200; i++) {
      const n = randomInt(20, source)
      counts.set(n, (counts.get(n) ?? 0) + 1)
    }
    expect([...counts.keys()].sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1))
    expect([...counts.values()].every((c) => c === 10)).toBe(true)
  })

  it('a fonte criptográfica do navegador fica sempre em 1..20', () => {
    for (let i = 0; i < 2000; i++) {
      const n = rollD20(cryptoSource)
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(20)
    }
  })
})

describe('resolve', () => {
  it('normal: um dado, vale ele', () => {
    expect(resolve('normal', seq(13))).toEqual({ rolls: [14], kept: 0, value: 14 })
  })

  it('vantagem: dois dados, vale o maior', () => {
    expect(resolve('advantage', seq(3, 16))).toEqual({ rolls: [4, 17], kept: 1, value: 17 })
  })

  it('desvantagem: dois dados, vale o menor', () => {
    expect(resolve('disadvantage', seq(3, 16))).toEqual({ rolls: [4, 17], kept: 0, value: 4 })
  })

  it('empate fica com o primeiro dado', () => {
    expect(resolve('advantage', seq(9, 9)).kept).toBe(0)
  })
})

describe('geometria do icosaedro', () => {
  it('tem 12 vértices na esfera unitária e 20 faces', () => {
    expect(VERTICES).toHaveLength(12)
    for (const v of VERTICES) expect(close(Math.hypot(...v), 1)).toBe(true)
    expect(FACES).toHaveLength(20)
  })

  it('cada face é um triângulo equilátero com a normal para fora', () => {
    const edge = Math.hypot(...VERTICES[0]!.map((c, i) => c - VERTICES[FACES[0]!.vertices[1]!]![i]!))
    for (const face of FACES) {
      const [a, b, c] = face.vertices.map((i) => VERTICES[i]!)
      const d = (p: readonly number[], q: readonly number[]) => Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! - q[2]!)
      expect(close(d(a!, b!), d(b!, c!), 1e-9) && close(d(b!, c!), d(c!, a!), 1e-9)).toBe(true)
      expect(d(a!, b!)).toBeGreaterThan(edge * 0.99)
      // A normal aponta para o mesmo lado do centro da face.
      const dot = face.normal[0] * face.center[0] + face.normal[1] * face.center[1] + face.normal[2] * face.center[2]
      expect(dot).toBeGreaterThan(0)
    }
  })

  it('números de 1 a 20, uma vez cada, e faces opostas somam 21', () => {
    expect(FACES.map((f) => f.number).sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1))
    for (const face of FACES) {
      const opposite = FACES.find((f) => close(f.normal[0], -face.normal[0]) && close(f.normal[1], -face.normal[1]) && close(f.normal[2], -face.normal[2]))
      expect(opposite?.number).toBe(21 - face.number)
    }
  })

  it('o "alto" do número fica no plano da face, apontando para um vértice', () => {
    for (const face of FACES) {
      const n = face.normal
      const u = face.up
      expect(close(n[0] * u[0] + n[1] * u[1] + n[2] * u[2], 0)).toBe(true)
      expect(close(Math.hypot(...u), 1)).toBe(true)
    }
  })
})

describe('orientationFor', () => {
  it('traz a face sorteada para a frente, de pé, mais perto do observador que todas as outras', () => {
    for (let n = 1; n <= 20; n++) {
      const q = orientationFor(n)
      expect(close(Math.hypot(...q), 1)).toBe(true)
      const face = FACES.find((f) => f.number === n)!
      const normal = rotate(q, face.normal)
      const up = rotate(q, face.up)
      // A face de cima é a mais frontal (z maior) e quase de frente (inclinação leve, para o dado ter volume).
      for (const other of FACES) if (other !== face) expect(rotate(q, other.normal)[2]).toBeLessThan(normal[2])
      expect(normal[2]).toBeGreaterThan(0.9)
      // De pé: o "alto" do número aponta para cima na tela (y do mundo positivo) e não para os lados.
      expect(up[1]).toBeGreaterThan(0.9)
      expect(faceForward(q)).toBe(n)
    }
  })

  it('sem inclinação, a face fica exatamente de frente', () => {
    const q = orientationFor(7, { tiltX: 0, tiltY: 0 })
    const face = FACES.find((f) => f.number === 7)!
    const normal = rotate(q, face.normal)
    expect(close(normal[2], 1)).toBe(true)
    expect(close(rotate(q, face.up)[1], 1)).toBe(true)
  })
})

describe('tumble', () => {
  it('começa na orientação de partida e termina exatamente na de chegada', () => {
    const from = orientationFor(3)
    const to = orientationFor(18)
    const axis: [number, number, number] = [0.3, 0.8, 0.52]
    expect(quatClose(tumble(from, to, axis, 4 * Math.PI, 0), from)).toBe(true)
    expect(quatClose(tumble(from, to, axis, 4 * Math.PI, 1), to)).toBe(true)
  })

  it('no meio do caminho continua sendo uma rotação (quatérnio unitário)', () => {
    const q = tumble(orientationFor(1), orientationFor(20), [1, 0, 0], 6 * Math.PI, 0.4)
    expect(close(Math.hypot(...q), 1, 1e-9)).toBe(true)
  })
})

describe('project', () => {
  it('desenha só as faces voltadas para o observador, da mais funda para a mais próxima', () => {
    const views = project(orientationFor(20), 100)
    expect(views.length).toBeGreaterThan(5)
    expect(views.length).toBeLessThan(15)
    for (let i = 1; i < views.length; i++) expect(views[i]!.depth).toBeGreaterThanOrEqual(views[i - 1]!.depth)
    expect(views.at(-1)!.number).toBe(20)
  })

  it('o número da face da frente sai de pé (matriz quase sem rotação) e centrado na face', () => {
    const view = project(orientationFor(5, { tiltX: 0, tiltY: 0 }), 100).at(-1)!
    expect(view.number).toBe(5)
    const [a, b, c, d] = view.text
    expect(a).toBeGreaterThan(0)
    expect(close(b, 0, 1e-6) && close(c, 0, 1e-6)).toBe(true)
    expect(close(a, d, 1e-6)).toBe(true)
    expect(view.light).toBeGreaterThan(0)
    expect(view.light).toBeLessThanOrEqual(1)
    expect(view.points).toHaveLength(3)
  })
})
