import { describe, expect, it } from 'vitest'
import { backoffDelay } from './backoff'
import { beforeRequest, CLOSED, onFailure, onSuccess, type BreakerConfig } from './breaker'
import { applyEffect, emptyLedger } from './idempotency'
import { nextRandom } from './rng'
import { createSimulation, DEFAULT_CONFIG, runToEnd, step, summarize, type SimConfig } from './simulator'

const breakerConfig: BreakerConfig = { threshold: 3, cooldownMs: 2000 }

describe('rng (mulberry32 puro)', () => {
  it('é determinístico: mesma semente, mesma sequência', () => {
    const seq = (seed: number) => {
      const out: number[] = []
      let state = seed
      for (let i = 0; i < 5; i += 1) {
        const [value, next] = nextRandom(state)
        out.push(value)
        state = next
      }
      return out
    }
    expect(seq(7)).toEqual(seq(7))
    expect(seq(7)).not.toEqual(seq(8))
    for (const value of seq(123)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('backoff exponencial com jitter completo', () => {
  const policy = { baseMs: 200, capMs: 1600 }

  it('sorteia entre 0 e base × 2^(tentativa − 1)', () => {
    expect(backoffDelay(1, policy, 0)).toBe(0)
    expect(backoffDelay(1, policy, 0.999999)).toBe(200)
    expect(backoffDelay(2, policy, 0.5)).toBe(200)
    expect(backoffDelay(3, policy, 0.999999)).toBe(800)
  })

  it('nunca passa do teto', () => {
    expect(backoffDelay(4, policy, 0.999999)).toBe(1600)
    expect(backoffDelay(10, policy, 0.999999)).toBe(1600)
  })
})

describe('disjuntor (closed → open → half-open)', () => {
  it('fica fechado abaixo do limite e zera a contagem num sucesso', () => {
    let breaker = onFailure(CLOSED, 0, breakerConfig)
    breaker = onFailure(breaker, 10, breakerConfig)
    expect(breaker).toMatchObject({ status: 'closed', failures: 2 })
    expect(onSuccess(breaker)).toEqual(CLOSED)
  })

  it('abre na falha que atinge o limite e recusa pedidos até o fim da espera', () => {
    let breaker = CLOSED
    for (const at of [0, 10, 20]) breaker = onFailure(breaker, at, breakerConfig)
    expect(breaker).toMatchObject({ status: 'open', openedAt: 20 })
    const early = beforeRequest(breaker, 2019, breakerConfig)
    expect(early.allowed).toBe(false)
    expect(early.breaker.status).toBe('open')
  })

  it('passa a meio-aberto depois da espera e deixa um pedido de teste passar', () => {
    const open = { status: 'open' as const, failures: 3, openedAt: 20 }
    const probe = beforeRequest(open, 2020, breakerConfig)
    expect(probe.allowed).toBe(true)
    expect(probe.breaker.status).toBe('half-open')
  })

  it('meio-aberto: sucesso fecha, falha reabre com novo horário', () => {
    const half = { status: 'half-open' as const, failures: 3, openedAt: 20 }
    expect(onSuccess(half)).toEqual(CLOSED)
    expect(onFailure(half, 5000, breakerConfig)).toEqual({ status: 'open', failures: 3, openedAt: 5000 })
  })
})

describe('chave de idempotência', () => {
  it('com chave, repetir o mesmo pedido devolve o resultado guardado sem novo efeito', () => {
    const first = applyEffect(emptyLedger(), 1, 'pedido-1')
    expect(first).toMatchObject({ charged: true, replayed: false })
    const second = applyEffect(first.ledger, 1, 'pedido-1')
    expect(second).toMatchObject({ charged: false, replayed: true })
    expect(second.ledger.charges).toHaveLength(1)
  })

  it('sem chave, cada repetição cobra de novo', () => {
    const first = applyEffect(emptyLedger(), 1, null)
    const second = applyEffect(first.ledger, 1, null)
    expect(second).toMatchObject({ charged: true, replayed: false })
    expect(second.ledger.charges).toHaveLength(2)
  })
})

describe('simulador', () => {
  const calm: SimConfig = { ...DEFAULT_CONFIG, failureRate: 0, latencyMs: 200 }

  it('é determinístico e reiniciar volta exatamente ao estado inicial', () => {
    expect(runToEnd(DEFAULT_CONFIG).events).toEqual(runToEnd(DEFAULT_CONFIG).events)
    const initial = createSimulation(DEFAULT_CONFIG)
    const advanced = step(step(initial))
    expect(advanced.events).toHaveLength(2)
    expect(createSimulation(DEFAULT_CONFIG)).toEqual(initial)
  })

  it('sem falhas: um passo por pedido, todos cobrados uma vez, disjuntor sempre fechado', () => {
    const result = runToEnd(calm)
    expect(result.events).toHaveLength(calm.orders)
    expect(result.events.every((event) => event.kind === 'success' && event.breakerAfter === 'closed')).toBe(true)
    expect(summarize(result)).toMatchObject({ succeeded: calm.orders, gaveUp: 0, charges: calm.orders, duplicates: 0 })
  })

  it('com 100% de falha: abre o disjuntor, recusa pedidos sem chamar o servidor e desiste', () => {
    const result = runToEnd({ ...DEFAULT_CONFIG, failureRate: 1, latencyMs: 200 })
    const kinds = new Set(result.events.map((event) => event.kind))
    expect(kinds).toContain('error')
    expect(kinds).toContain('rejected')
    expect(result.events.filter((event) => event.kind === 'rejected').every((event) => !event.charged && event.durationMs === 0)).toBe(true)
    expect(summarize(result)).toMatchObject({ succeeded: 0, gaveUp: DEFAULT_CONFIG.orders, charges: 0 })
  })

  it('timeout depois do efeito: sem chave duplica a cobrança; com chave, o servidor reconhece a repetição', () => {
    // Latência sempre acima do tempo limite na 1ª tentativa é difícil de fixar por sorteio; a média alta garante timeouts.
    const slow: SimConfig = { ...DEFAULT_CONFIG, failureRate: 0, latencyMs: 900 }
    const withKey = summarize(runToEnd({ ...slow, idempotency: true }))
    const withoutKey = summarize(runToEnd({ ...slow, idempotency: false }))
    expect(withKey.timeouts).toBeGreaterThan(0)
    expect(withKey.duplicates).toBe(0)
    expect(withKey.replays).toBeGreaterThan(0)
    expect(withoutKey.duplicates).toBeGreaterThan(0)
  })

  it('o cenário padrão passa por fechado, aberto, meio-aberto e fecha de novo', () => {
    const statuses = runToEnd(DEFAULT_CONFIG).events.map((event) => event.breakerAfter)
    expect(statuses).toContain('open')
    expect(statuses).toContain('half-open')
    const firstOpen = statuses.indexOf('open')
    expect(statuses.slice(firstOpen).includes('closed')).toBe(true)
  })

  it('conta pedidos que o cliente abandonou mas o servidor cobrou', () => {
    const result = runToEnd(DEFAULT_CONFIG)
    const abandoned = result.outcomes.flatMap((outcome, index) => (outcome === 'gave-up' ? [index + 1] : []))
    const charged = new Set(result.ledger.charges.map((charge) => charge.order))
    expect(summarize(result).chargedButGaveUp).toBe(abandoned.filter((order) => charged.has(order)).length)
    expect(summarize(result).chargedButGaveUp).toBeGreaterThan(0)
  })

  it('cada passo tem explicação em texto, tempo e estado do disjuntor', () => {
    for (const event of runToEnd(DEFAULT_CONFIG).events) {
      expect(event.message.length).toBeGreaterThan(20)
      expect(event.at).toBeGreaterThanOrEqual(0)
      expect(['closed', 'open', 'half-open']).toContain(event.breakerAfter)
    }
  })

  it('passo depois do fim não muda nada', () => {
    const done = runToEnd(DEFAULT_CONFIG)
    expect(done.finished).toBe(true)
    expect(step(done)).toBe(done)
  })

  it('respeita o número máximo de tentativas por pedido', () => {
    const result = runToEnd({ ...DEFAULT_CONFIG, failureRate: 1 })
    for (let order = 1; order <= DEFAULT_CONFIG.orders; order += 1) {
      const attempts = result.events.filter((event) => event.order === order && event.kind !== 'half-open')
      expect(attempts).toHaveLength(DEFAULT_CONFIG.maxAttempts)
      expect(attempts.at(-1)?.gaveUp).toBe(true)
    }
  })
})
