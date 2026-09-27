import { describe, expect, it } from 'vitest'
import { createFixedWindowLimiter } from './rate-limit'

describe('createFixedWindowLimiter', () => {
  it('permite até o limite por chave na janela e bloqueia o excedente com o tempo de espera', () => {
    let now = 0
    const limiter = createFixedWindowLimiter({ limit: 2, windowMs: 60_000, now: () => now })
    expect(limiter.take('a')).toEqual({ allowed: true })
    expect(limiter.take('a')).toEqual({ allowed: true })
    expect(limiter.take('a')).toEqual({ allowed: false, retryAfterSeconds: 60 })
    expect(limiter.take('b')).toEqual({ allowed: true })
    now = 59_001
    expect(limiter.take('a')).toEqual({ allowed: false, retryAfterSeconds: 1 })
    now = 60_000
    expect(limiter.take('a')).toEqual({ allowed: true })
  })

  it('limita a memória: descarta janelas vencidas e, no limite de chaves, as mais antigas', () => {
    let now = 0
    const limiter = createFixedWindowLimiter({ limit: 1, windowMs: 1_000, maxKeys: 2, now: () => now })
    limiter.take('a')
    limiter.take('b')
    limiter.take('c')
    expect(limiter.size()).toBe(2)
    expect(limiter.take('a')).toEqual({ allowed: true })
    now = 5_000
    limiter.take('d')
    expect(limiter.size()).toBe(1)
  })
})
