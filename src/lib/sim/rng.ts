/**
 * Gerador pseudoaleatório mulberry32 em forma pura: recebe o estado (inteiro de 32 bits) e devolve
 * `[valor em [0, 1), próximo estado]`. Sem estado escondido, o simulador inteiro fica serializável e
 * reprodutível pela semente.
 */
export function nextRandom(state: number): [number, number] {
  const next = (state + 0x6d2b79f5) | 0
  let t = next
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next]
}
