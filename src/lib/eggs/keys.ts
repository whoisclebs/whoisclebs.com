/**
 * Rastreador de teclas dos easter eggs globais. Puro (sem DOM, sem relógio próprio): recebe cada tecla
 * (`KeyboardEvent.key`) e o instante em ms, e devolve a ação que ela completou, ou `null`. Quem filtra o que
 * não deve chegar aqui (modificadores, campos de texto, jogo aberto) é a ilha `EasterEggs.svelte`.
 *
 * Ordem de avaliação de cada tecla: Esc, Konami, palavras digitadas, `?`, `g` + tecla. A palavra vem antes do
 * atalho para que o fim de uma palavra nunca navegue; e o `g` só arma o atalho quando começa algo novo
 * (depois de uma pausa ou de um caractere que não é letra), para "logs" ou "pega" não mudarem de página.
 */
export type GoTarget = 'writing' | 'projects' | 'about' | 'home'
export type EggWord = 'clebs' | 'sudo' | 'rm' | 'comet' | 'rain'

export type KeyAction =
  | { type: 'neon' }
  | { type: 'help' }
  | { type: 'close' }
  | { type: 'go'; target: GoTarget }
  | { type: 'word'; word: EggWord }

export const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'] as const

/** Janela do `g` + tecla, como no design. */
export const LEADER_MS = 900

const GO_KEYS: Record<string, GoTarget> = { a: 'writing', p: 'projects', s: 'about', h: 'home' }

/** Palavras e o easter egg de cada uma. `comet` e `cometa` dão no mesmo: o buffer é limpo no primeiro acerto. */
const WORDS: readonly [string, EggWord][] = [
  ['clebs', 'clebs'],
  ['sudo', 'sudo'],
  ['rm -rf', 'rm'],
  ['comet', 'comet'],
  ['chuva', 'rain'],
  ['rain', 'rain'],
]

const BUFFER_MAX = 12
/** Teclas que não interrompem nada: só mudam o que a próxima tecla produz. */
const MODIFIERS = new Set(['Shift', 'CapsLock', 'Control', 'Alt', 'AltGraph', 'Meta', 'Dead'])

export interface KeyTracker {
  push(key: string, at: number): KeyAction | null
  reset(): void
}

export function createKeyTracker(): KeyTracker {
  let recent: string[] = []
  let buffer = ''
  let leaderAt: number | null = null
  let prevChar = ''
  let prevAt = -Infinity

  function reset(): void {
    recent = []
    buffer = ''
    leaderAt = null
    prevChar = ''
    prevAt = -Infinity
  }

  function push(rawKey: string, at: number): KeyAction | null {
    if (rawKey === 'Escape') {
      leaderAt = null
      return { type: 'close' }
    }
    if (MODIFIERS.has(rawKey)) return null

    const isChar = rawKey.length === 1
    const key = isChar ? rawKey.toLowerCase() : rawKey

    recent = [...recent, key].slice(-KONAMI.length)
    if (recent.length === KONAMI.length && recent.every((value, index) => value === KONAMI[index])) {
      reset()
      return { type: 'neon' }
    }

    // Enter, Tab, setas etc. encerram a palavra em curso e o atalho armado.
    if (!isChar) {
      buffer = ''
      leaderAt = null
      prevChar = ''
      return null
    }

    buffer = (buffer + key).slice(-BUFFER_MAX)
    const word = WORDS.find(([text]) => buffer.endsWith(text))
    if (word) {
      buffer = ''
      leaderAt = null
      prevChar = key
      prevAt = at
      return { type: 'word', word: word[1] }
    }

    let action: KeyAction | null = null
    if (key === '?') {
      action = { type: 'help' }
    } else if (leaderAt !== null && at - leaderAt <= LEADER_MS) {
      const target = GO_KEYS[key]
      if (target) action = { type: 'go', target }
    }

    const startsSomething = !/[\p{L}\p{N}]/u.test(prevChar) || at - prevAt > LEADER_MS
    leaderAt = !action && key === 'g' && startsSomething ? at : null
    prevChar = key
    prevAt = at
    return action
  }

  return { push, reset }
}
