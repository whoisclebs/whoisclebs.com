/**
 * Lógica pura da serpente do console de bolso: só estado e regras. Sem DOM, sem relógio e sem `Math.random`
 * (a aleatoriedade entra por parâmetro), para os testes controlarem tudo. Cada função devolve um estado novo.
 * O tabuleiro é de 20 × 16 células; a cabeça fica no início de `snake`.
 */
export const COLS = 20
export const ROWS = 16

export type Dir = 'up' | 'down' | 'left' | 'right'
export type Status = 'idle' | 'running' | 'over'
export type Cell = { x: number; y: number }
/** Sorteio em [0, 1), como `Math.random`. */
export type Rng = () => number

export interface SnakeState {
  /** Da cabeça (índice 0) até a cauda. */
  snake: Cell[]
  /** Direção do último passo dado: é contra ela que o giro de 180° é medido. */
  dir: Dir
  /** Direção do próximo passo (a virada pedida pelo jogador). */
  next: Dir
  /** `null` só quando a cobra ocupa o tabuleiro inteiro (vitória). */
  food: Cell | null
  score: number
  status: Status
}

const DELTA: Record<Dir, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' }

const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y

/** Sorteia uma célula livre; `null` se não sobrou nenhuma. */
export function placeFood(snake: readonly Cell[], rng: Rng): Cell | null {
  const free: Cell[] = []
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!snake.some((c) => c.x === x && c.y === y)) free.push({ x, y })
    }
  }
  if (free.length === 0) return null
  return free[Math.min(free.length - 1, Math.floor(rng() * free.length))] ?? null
}

/** Partida nova, parada: 3 células no meio, indo para a direita. */
export function reset(rng: Rng): SnakeState {
  const y = Math.floor(ROWS / 2)
  const snake = [
    { x: 6, y },
    { x: 5, y },
    { x: 4, y },
  ]
  return { snake, dir: 'right', next: 'right', food: placeFood(snake, rng), score: 0, status: 'idle' }
}

/** Pede uma virada. Ignora o giro de 180°; com o jogo parado, a primeira virada dá a partida. */
export function turn(state: SnakeState, dir: Dir): SnakeState {
  if (state.status === 'over') return state
  const status = state.status === 'idle' ? 'running' : state.status
  if (dir === OPPOSITE[state.dir]) return status === state.status ? state : { ...state, status }
  return { ...state, next: dir, status }
}

/** Alterna pausa/partida (Espaço, Enter e o botão de ação). No fim de jogo, recomeça. */
export function toggle(state: SnakeState, rng: Rng): SnakeState {
  if (state.status === 'over') return { ...reset(rng), status: 'running' }
  return { ...state, status: state.status === 'running' ? 'idle' : 'running' }
}

/** Um tick: anda uma célula; parede ou o próprio corpo terminam; comida soma 1 ponto e cresce. */
export function step(state: SnakeState, rng: Rng): SnakeState {
  if (state.status !== 'running') return state
  const dir = state.next
  const delta = DELTA[dir]
  const head = state.snake[0]
  if (!head) return { ...state, status: 'over' }
  const to = { x: head.x + delta.x, y: head.y + delta.y }

  if (to.x < 0 || to.x >= COLS || to.y < 0 || to.y >= ROWS) return { ...state, dir, status: 'over' }

  const eats = state.food !== null && same(to, state.food)
  // Sem comer, a cauda sai neste mesmo tick: a célula dela não conta como corpo.
  const body = eats ? state.snake : state.snake.slice(0, -1)
  if (body.some((c) => same(c, to))) return { ...state, dir, status: 'over' }

  const snake = [to, ...body]
  if (!eats) return { ...state, snake, dir }

  const food = placeFood(snake, rng)
  return { ...state, snake, dir, food, score: state.score + 1, status: food ? 'running' : 'over' }
}
