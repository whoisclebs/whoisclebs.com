import { describe, expect, it } from 'vitest'
import { COLS, ROWS, placeFood, reset, step, turn, type SnakeState } from './snake'

/** Aleatoriedade fixa: o teste escolhe a "sorte". */
const rng = (value = 0) => () => value

/** Estado de partida com a cobra e a direção que o teste quer, comida longe do caminho. */
function game(partial: Partial<SnakeState>): SnakeState {
  return { ...reset(rng()), status: 'running', food: { x: COLS - 1, y: ROWS - 1 }, ...partial }
}

describe('reset', () => {
  it('começa com 3 células indo para a direita, parada e sem pontos', () => {
    const s = reset(rng())
    expect(s.snake).toHaveLength(3)
    expect(s.dir).toBe('right')
    expect(s.status).toBe('idle')
    expect(s.score).toBe(0)
    const [head, second] = s.snake
    expect(head!.x - second!.x).toBe(1)
  })
})

describe('step', () => {
  it('avança uma célula na direção atual', () => {
    const s = game({ snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], dir: 'right', next: 'right' })
    const n = step(s, rng())
    expect(n.snake).toEqual([{ x: 6, y: 5 }, { x: 5, y: 5 }, { x: 4, y: 5 }])
    expect(n.status).toBe('running')
  })

  it('não anda se o jogo não está rodando', () => {
    const s = reset(rng())
    expect(step(s, rng())).toBe(s)
  })

  it('come, soma um ponto, cresce e põe comida nova', () => {
    const s = game({ snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }], dir: 'right', next: 'right', food: { x: 6, y: 5 } })
    const n = step(s, rng())
    expect(n.score).toBe(1)
    expect(n.snake).toHaveLength(4)
    expect(n.snake[0]).toEqual({ x: 6, y: 5 })
    expect(n.food).not.toEqual({ x: 6, y: 5 })
  })

  it('termina ao bater na parede', () => {
    const s = game({ snake: [{ x: COLS - 1, y: 3 }, { x: COLS - 2, y: 3 }, { x: COLS - 3, y: 3 }], dir: 'right', next: 'right' })
    expect(step(s, rng()).status).toBe('over')
    const top = game({ snake: [{ x: 3, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 }], dir: 'up', next: 'up' })
    expect(step(top, rng()).status).toBe('over')
  })

  it('termina ao bater no próprio corpo', () => {
    // Cabeça em (5,5) indo para baixo, com o corpo dando a volta e passando por (5,6).
    const snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 5 }]
    const s = game({ snake, dir: 'down', next: 'down' })
    expect(step(s, rng()).status).toBe('over')
  })

  it('pode entrar na célula que a cauda acabou de deixar', () => {
    const snake = [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 5 }]
    const s = game({ snake, dir: 'right', next: 'right' })
    expect(step(s, rng()).status).toBe('running')
  })
})

describe('turn', () => {
  it('muda de direção em ângulo reto', () => {
    const s = game({ dir: 'right', next: 'right' })
    expect(step(turn(s, 'up'), rng()).dir).toBe('up')
  })

  it('não vira 180 graus, nem com duas viradas no mesmo tick', () => {
    const s = game({ dir: 'right', next: 'right' })
    expect(turn(s, 'left').next).toBe('right')
    // up e depois left no mesmo tick: left seria inverter o movimento real (right), então é ignorado.
    const twice = turn(turn(s, 'up'), 'left')
    expect(step(twice, rng()).dir).toBe('up')
  })

  it('dá a partida quando o jogo está parado', () => {
    const s = reset(rng())
    expect(turn(s, 'up').status).toBe('running')
  })

  it('ignora a virada depois do fim de jogo', () => {
    const s = game({ status: 'over' })
    expect(turn(s, 'up')).toBe(s)
  })
})

describe('placeFood', () => {
  it('nunca nasce em cima da cobra, para qualquer sorte', () => {
    const s = reset(rng())
    for (let i = 0; i < 100; i++) {
      const food = placeFood(s.snake, rng(i / 100))!
      expect(s.snake.some((c) => c.x === food.x && c.y === food.y)).toBe(false)
      expect(food.x).toBeGreaterThanOrEqual(0)
      expect(food.x).toBeLessThan(COLS)
      expect(food.y).toBeLessThan(ROWS)
    }
  })

  it('devolve null quando a cobra ocupa o tabuleiro todo', () => {
    const all = Array.from({ length: COLS * ROWS }, (_, i) => ({ x: i % COLS, y: Math.floor(i / COLS) }))
    expect(placeFood(all, rng())).toBeNull()
  })
})
