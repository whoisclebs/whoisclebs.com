/**
 * O d20 da página Hobbies: sorteio, vantagem/desvantagem e a geometria do icosaedro. Módulo puro (sem DOM),
 * testado em `d20.test.ts`; o componente só cuida do relógio e do desenho.
 *
 * Convenções: vetores do mundo com x para a direita, y para cima e z saindo da tela na direção de quem olha.
 * Rotações são quatérnios `[w, x, y, z]`. A projeção devolve coordenadas de SVG (y para baixo), centradas no 0.
 */
export type Vec3 = readonly [number, number, number]
export type Quat = readonly [number, number, number, number]

/** Fonte de inteiros sem sinal de 32 bits. Injetável: os testes escolhem a "sorte". */
export type RandomSource = () => number

export type Mode = 'normal' | 'advantage' | 'disadvantage'

export type Outcome = {
  /** Um valor por dado, na ordem em que aparecem na mesa. */
  rolls: number[]
  /** Índice do dado que vale. */
  kept: number
  value: number
}

// ---------- Sorteio ----------

const UINT32 = 2 ** 32

/** O gerador criptográfico do navegador (e do Node), um inteiro por chamada. */
export const cryptoSource: RandomSource = () => crypto.getRandomValues(new Uint32Array(1))[0]!

/**
 * Inteiro uniforme em 1..n. O resto da divisão favoreceria os primeiros números quando 2^32 não é múltiplo de n,
 * então a faixa final incompleta é descartada e o sorteio se repete (rejeição).
 */
export function randomInt(n: number, source: RandomSource): number {
  const limit = UINT32 - (UINT32 % n)
  for (;;) {
    const x = source()
    if (x < limit) return (x % n) + 1
  }
}

export const rollD20 = (source: RandomSource): number => randomInt(20, source)

/** Rola conforme o modo: um dado no normal; dois na vantagem (vale o maior) e na desvantagem (vale o menor). */
export function resolve(mode: Mode, source: RandomSource): Outcome {
  if (mode === 'normal') {
    const value = rollD20(source)
    return { rolls: [value], kept: 0, value }
  }
  const a = rollD20(source)
  const b = rollD20(source)
  const kept = mode === 'advantage' ? (b > a ? 1 : 0) : b < a ? 1 : 0
  return { rolls: [a, b], kept, value: kept === 0 ? a : b }
}

// ---------- Vetores e quatérnios ----------

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k]
const normalize = (a: Vec3): Vec3 => scale(a, 1 / Math.hypot(...a))

export function mul(a: Quat, b: Quat): Quat {
  const [aw, ax, ay, az] = a
  const [bw, bx, by, bz] = b
  return [
    aw * bw - ax * bx - ay * by - az * bz,
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
  ]
}

export function axisAngle(axis: Vec3, angle: number): Quat {
  const [x, y, z] = normalize(axis)
  const s = Math.sin(angle / 2)
  return [Math.cos(angle / 2), x * s, y * s, z * s]
}

/** Aplica a rotação ao vetor (q v q*). */
export function rotate(q: Quat, v: Vec3): Vec3 {
  const [w, x, y, z] = q
  // Forma expandida de q v q*: v + 2w(u × v) + 2u × (u × v), com u = (x, y, z).
  const u: Vec3 = [x, y, z]
  const t = scale(cross(u, v), 2)
  const r = cross(u, t)
  return [v[0] + w * t[0] + r[0], v[1] + w * t[1] + r[1], v[2] + w * t[2] + r[2]]
}

function slerp(a: Quat, b: Quat, t: number): Quat {
  let cos = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]
  // Caminho mais curto: q e -q são a mesma rotação.
  const bb: Quat = cos < 0 ? [-b[0], -b[1], -b[2], -b[3]] : b
  cos = Math.abs(cos)
  let ka = 1 - t
  let kb = t
  if (cos < 0.9995) {
    const theta = Math.acos(cos)
    const sin = Math.sin(theta)
    ka = Math.sin((1 - t) * theta) / sin
    kb = Math.sin(t * theta) / sin
  }
  const q: Quat = [a[0] * ka + bb[0] * kb, a[1] * ka + bb[1] * kb, a[2] * ka + bb[2] * kb, a[3] * ka + bb[3] * kb]
  const len = Math.hypot(...q)
  return [q[0] / len, q[1] / len, q[2] / len, q[3] / len]
}

/** Quatérnio da matriz de rotação cujas linhas são `r`, `u` e `n` (leva r → x, u → y, n → z). */
function fromRows(r: Vec3, u: Vec3, n: Vec3): Quat {
  const [m00, m01, m02] = r
  const [m10, m11, m12] = u
  const [m20, m21, m22] = n
  const trace = m00 + m11 + m22
  let q: Quat
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2
    q = [s / 4, (m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s]
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2
    q = [(m21 - m12) / s, s / 4, (m01 + m10) / s, (m02 + m20) / s]
  } else if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2
    q = [(m02 - m20) / s, (m01 + m10) / s, s / 4, (m12 + m21) / s]
  } else {
    const s = Math.sqrt(1 + m22 - m00 - m11) * 2
    q = [(m10 - m01) / s, (m02 + m20) / s, (m12 + m21) / s, s / 4]
  }
  const len = Math.hypot(...q)
  return [q[0] / len, q[1] / len, q[2] / len, q[3] / len]
}

// ---------- Icosaedro ----------

const PHI = (1 + Math.sqrt(5)) / 2

/** Os 12 vértices: retângulos áureos nos três planos, levados à esfera de raio 1. */
export const VERTICES: readonly Vec3[] = (
  [
    [0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI],
    [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0],
    [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1],
  ] as Vec3[]
).map(normalize)

export type Face = {
  number: number
  /** Índices em `VERTICES`, no sentido anti-horário visto de fora. */
  vertices: readonly [number, number, number]
  center: Vec3
  normal: Vec3
  /** Direção do "alto" do número, no plano da face, do centro para um vértice. */
  up: Vec3
}

/** As faces são os trios de vértices vizinhos dois a dois (aresta = menor distância entre vértices). */
function buildFaces(): Face[] {
  const edge = Math.min(...VERTICES.slice(1).map((v) => Math.hypot(...sub(v, VERTICES[0]!))))
  const near = (i: number, j: number) => Math.abs(Math.hypot(...sub(VERTICES[i]!, VERTICES[j]!)) - edge) < 1e-6
  const raw: Omit<Face, 'number'>[] = []
  for (let i = 0; i < 12; i++)
    for (let j = i + 1; j < 12; j++)
      for (let k = j + 1; k < 12; k++) {
        if (!near(i, j) || !near(j, k) || !near(i, k)) continue
        const a = VERTICES[i]!
        const center = scale([a[0] + VERTICES[j]![0] + VERTICES[k]![0], a[1] + VERTICES[j]![1] + VERTICES[k]![1], a[2] + VERTICES[j]![2] + VERTICES[k]![2]], 1 / 3)
        let normal = normalize(cross(sub(VERTICES[j]!, a), sub(VERTICES[k]!, a)))
        let vertices: [number, number, number] = [i, j, k]
        if (dot(normal, center) < 0) {
          normal = scale(normal, -1)
          vertices = [i, k, j]
        }
        raw.push({ vertices, center, normal, up: normalize(sub(a, center)) })
      }

  // Numeração: faces opostas somam 21, como num d20 de verdade. Os pares alternam o lado do número baixo para os
  // altos e baixos se misturarem em volta de cada face.
  const numbers = new Array<number>(raw.length).fill(0)
  let pair = 0
  raw.forEach((face, index) => {
    if (numbers[index]) return
    const opposite = raw.findIndex((f) => dot(f.normal, face.normal) < -0.999)
    pair++
    const low = pair
    numbers[index] = pair % 2 ? 21 - low : low
    numbers[opposite] = 21 - numbers[index]!
  })
  return raw.map((face, index) => ({ ...face, number: numbers[index]! }))
}

export const FACES: readonly Face[] = buildFaces()

export type Tilt = { tiltX: number; tiltY: number }

/**
 * Inclinação de repouso: a face sorteada continua de frente, mas o dado mostra o volume (de frente exata, o
 * contorno vira um hexágono chapado). Abaixo de ~20° a face de cima segue sendo a mais frontal.
 */
export const REST_TILT: Tilt = { tiltX: 0.24, tiltY: -0.2 }

/** A rotação que traz a face `n` para a frente, com o número de pé, mais a inclinação de repouso. */
export function orientationFor(n: number, tilt: Tilt = REST_TILT): Quat {
  const face = FACES.find((f) => f.number === n)
  if (!face) throw new RangeError(`face inexistente: ${n}`)
  const align = fromRows(cross(face.up, face.normal), face.up, face.normal)
  const lean = mul(axisAngle([0, 1, 0], tilt.tiltY), axisAngle([1, 0, 0], tilt.tiltX))
  return mul(lean, align)
}

/** O número da face mais voltada para quem olha. */
export function faceForward(q: Quat): number {
  let best = FACES[0]!
  let bestZ = -Infinity
  for (const face of FACES) {
    const z = rotate(q, face.normal)[2]
    if (z > bestZ) {
      bestZ = z
      best = face
    }
  }
  return best.number
}

/**
 * Trajeto de uma rolagem com progresso `e` (0 a 1, já com a curva aplicada): um giro de `angle` radianos em
 * torno de `axis` que se desfaz até zero enquanto a orientação vai da partida à chegada. Contínuo na partida
 * (vale a orientação atual, então um clique no meio de outra rolagem não dá salto) e exato na chegada.
 */
export function tumble(from: Quat, to: Quat, axis: Vec3, angle: number, e: number): Quat {
  const start = mul(axisAngle(axis, -angle), from)
  return mul(axisAngle(axis, angle * (1 - e)), slerp(start, to, e))
}

/** Desaceleração da rolagem: começa rápida e perde velocidade como quem gasta o atrito da mesa. */
export const spinEase = (t: number): number => 1 - (1 - t) ** 3

// ---------- Projeção ----------

/** Distância da câmera em raios do dado: perspectiva leve, o bastante para as faces de trás encolherem. */
const CAMERA = 6
/** Luz vinda do alto à esquerda, um pouco de frente. */
const LIGHT = normalize([-0.45, 0.7, 0.6])

export type FaceView = {
  number: number
  /** Vértices na tela (SVG, y para baixo), em px, centrados no 0. */
  points: [number, number][]
  /** Profundidade do centro: maior é mais perto. */
  depth: number
  /** 0 a 1: quanto a face recebe da luz. */
  light: number
  /** 0 a 1: quanto a face está de frente para quem olha. */
  facing: number
  /** Matriz SVG `[a, b, c, d, e, f]` que põe o número no plano da face; 1 unidade local = 1 px de frente. */
  text: [number, number, number, number, number, number]
}

/** Projeta o dado com a orientação `q` num círculo de raio `radius` px; só as faces visíveis, das fundas às próximas. */
export function project(q: Quat, radius: number): FaceView[] {
  const point = (p: Vec3): [number, number] => {
    const k = (radius * CAMERA) / (CAMERA - p[2])
    return [p[0] * k, -p[1] * k]
  }
  // Derivada da projeção no ponto p ao longo de v, normalizada para 1 px por unidade de frente.
  const along = (p: Vec3, v: Vec3): [number, number] => {
    const d = CAMERA - p[2]
    const k = CAMERA / d
    const kz = (CAMERA * v[2]) / (d * d)
    return [v[0] * k + p[0] * kz, -(v[1] * k + p[1] * kz)]
  }

  const views: FaceView[] = []
  for (const face of FACES) {
    const normal = rotate(q, face.normal)
    if (normal[2] <= 1e-4) continue
    const center = rotate(q, face.center)
    const up = rotate(q, face.up)
    const right = cross(up, normal)
    const [a, b] = along(center, right)
    const [c, d] = along(center, scale(up, -1))
    const [e, f] = point(center)
    views.push({
      number: face.number,
      points: face.vertices.map((i) => point(rotate(q, VERTICES[i]!))),
      depth: center[2],
      light: Math.min(1, Math.max(0, dot(normal, LIGHT))),
      facing: normal[2],
      text: [a, b, c, d, e, f],
    })
  }
  return views.sort((x, y) => x.depth - y.depth)
}
