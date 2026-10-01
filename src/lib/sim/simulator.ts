/**
 * Simulação determinística de um cliente HTTP que cobra pedidos num servidor instável:
 * nova tentativa com backoff exponencial + jitter, chave de idempotência e disjuntor.
 *
 * Dados sintéticos, relógio simulado (ms), nenhuma rede. O estado é um objeto simples; `step` devolve um
 * estado novo com um evento a mais. Mesma configuração (incluindo a semente) → mesma sequência de eventos.
 */
import { backoffDelay, type BackoffPolicy } from './backoff'
import { beforeRequest, CLOSED, onFailure, onSuccess, type Breaker, type BreakerConfig, type BreakerStatus } from './breaker'
import { applyEffect, emptyLedger, type Ledger } from './idempotency'
import { formatMs } from './labels'
import { nextRandom } from './rng'

export interface SimConfig {
  seed: number
  orders: number
  /** Probabilidade (0–1) de o servidor responder 503 antes de cobrar. */
  failureRate: number
  /** Latência média; cada chamada sorteia entre 0,5× e 1,5× desse valor. */
  latencyMs: number
  /** Acima disso o cliente desiste da resposta; o servidor pode ter cobrado mesmo assim. */
  timeoutMs: number
  maxAttempts: number
  backoff: BackoffPolicy
  breaker: BreakerConfig
  /** Envia a chave `pedido-N` em todas as tentativas do pedido N. */
  idempotency: boolean
}

export const DEFAULT_CONFIG: SimConfig = {
  seed: 170,
  orders: 6,
  failureRate: 0.4,
  latencyMs: 800,
  timeoutMs: 1000,
  maxAttempts: 4,
  backoff: { baseMs: 250, capMs: 4000 },
  breaker: { threshold: 3, cooldownMs: 1500 },
  idempotency: true,
}

/** `half-open`: passo sem chamada, só a transição do disjuntor (a próxima tentativa vai como teste). */
export type EventKind = 'success' | 'replay' | 'error' | 'timeout' | 'rejected' | 'half-open'

export interface SimEvent {
  index: number
  /** Instante (ms simulados) em que a tentativa começou. */
  at: number
  order: number
  attempt: number
  kind: EventKind
  durationMs: number
  /** O servidor efetivou uma cobrança nesta tentativa. */
  charged: boolean
  breakerBefore: BreakerStatus
  breakerAfter: BreakerStatus
  /** Espera até a próxima tentativa do mesmo pedido (null se acabou o pedido). */
  waitMs: number | null
  gaveUp: boolean
  message: string
}

export interface SimState {
  config: SimConfig
  rng: number
  now: number
  order: number
  attempt: number
  breaker: Breaker
  ledger: Ledger
  outcomes: ('pending' | 'ok' | 'gave-up')[]
  events: SimEvent[]
  finished: boolean
}

export function createSimulation(config: SimConfig): SimState {
  return {
    config,
    rng: config.seed,
    now: 0,
    order: 1,
    attempt: 1,
    breaker: CLOSED,
    ledger: emptyLedger(),
    outcomes: Array.from({ length: config.orders }, () => 'pending' as const),
    events: [],
    finished: config.orders === 0,
  }
}

const ms = formatMs

export function step(state: SimState): SimState {
  if (state.finished) return state
  const { config } = state
  let rng = state.rng
  const draw = () => {
    const [value, next] = nextRandom(rng)
    rng = next
    return value
  }

  const { order, attempt, now } = state
  const key = config.idempotency ? `pedido-${order}` : null
  const before = state.breaker.status
  const gate = beforeRequest(state.breaker, now, config.breaker)

  // A passagem para meio-aberto vira um passo próprio: é o estado que o leitor mais precisa ver.
  if (before === 'open' && gate.breaker.status === 'half-open') {
    const event: SimEvent = {
      index: state.events.length + 1,
      at: now,
      order,
      attempt,
      kind: 'half-open',
      durationMs: 0,
      charged: false,
      breakerBefore: before,
      breakerAfter: 'half-open',
      waitMs: null,
      gaveUp: false,
      message: `Passaram ${ms(config.breaker.cooldownMs)} desde que o disjuntor abriu: ele fica meio-aberto, e a tentativa ${attempt} do pedido ${order} vai como teste.`,
    }
    return { ...state, breaker: gate.breaker, events: [...state.events, event] }
  }

  let breaker = gate.breaker
  let ledger = state.ledger
  let kind: EventKind
  let durationMs = 0
  let charged = false
  const parts: string[] = [`Pedido ${order}, tentativa ${attempt}:`]

  if (before === 'half-open') parts.push('pedido de teste com o disjuntor meio-aberto;')

  if (!gate.allowed) {
    kind = 'rejected'
    parts.push('o disjuntor está aberto; o pedido nem saiu do cliente.')
  } else {
    const latency = Math.round(config.latencyMs * (0.5 + draw()))
    const failed = draw() < config.failureRate
    if (failed) {
      kind = 'error'
      durationMs = Math.min(latency, config.timeoutMs)
      parts.push(`o servidor respondeu 503 antes de cobrar (${ms(durationMs)}).`)
    } else {
      const effect = applyEffect(ledger, order, key)
      ledger = effect.ledger
      charged = effect.charged
      if (latency > config.timeoutMs) {
        kind = 'timeout'
        durationMs = config.timeoutMs
        parts.push(
          effect.replayed
            ? `a chave ${key} já era conhecida, mas a resposta passou de ${ms(config.timeoutMs)} e se perdeu.`
            : `o servidor cobrou, mas a resposta passou de ${ms(config.timeoutMs)} e se perdeu. O cliente não sabe que a cobrança aconteceu.`,
        )
      } else if (effect.replayed) {
        kind = 'replay'
        durationMs = latency
        parts.push(`o servidor reconheceu a chave ${key} e devolveu a cobrança já feita, sem cobrar de novo (${ms(latency)}).`)
      } else {
        kind = 'success'
        durationMs = latency
        const duplicate = ledger.charges.filter((charge) => charge.order === order).length > 1
        parts.push(duplicate ? `cobrado de novo em ${ms(latency)}: sem chave de idempotência, este pedido foi cobrado mais de uma vez.` : `cobrado em ${ms(latency)}.`)
      }
    }
    const ok = kind === 'success' || kind === 'replay'
    const next = ok ? onSuccess(breaker) : onFailure(breaker, now + durationMs, config.breaker)
    if (next.status === 'open' && breaker.status !== 'open') {
      parts.push(breaker.status === 'half-open' ? 'O teste falhou e o disjuntor abriu de novo.' : `${next.failures} falhas seguidas: o disjuntor abriu.`)
    } else if (breaker.status === 'half-open' && next.status === 'closed') {
      parts.push('O teste passou e o disjuntor fechou.')
    } else if (!ok && next.status === 'closed') {
      parts.push(`Falhas seguidas: ${next.failures} de ${config.breaker.threshold}.`)
    }
    breaker = next
  }

  const ok = kind === 'success' || kind === 'replay'
  const outcomes = [...state.outcomes]
  let waitMs: number | null = null
  let gaveUp = false
  let nextOrder = order
  let nextAttempt = attempt + 1
  let clock = now + durationMs

  if (ok) {
    outcomes[order - 1] = 'ok'
    nextOrder = order + 1
    nextAttempt = 1
  } else if (attempt >= config.maxAttempts) {
    gaveUp = true
    outcomes[order - 1] = 'gave-up'
    nextOrder = order + 1
    nextAttempt = 1
    parts.push(`Desisti do pedido ${order} depois de ${config.maxAttempts} tentativas.`)
  } else {
    waitMs = backoffDelay(attempt, config.backoff, draw())
    clock += waitMs
    parts.push(`Nova tentativa em ${ms(waitMs)}.`)
  }

  const event: SimEvent = {
    index: state.events.length + 1,
    at: now,
    order,
    attempt,
    kind,
    durationMs,
    charged,
    breakerBefore: before,
    breakerAfter: breaker.status,
    waitMs,
    gaveUp,
    message: parts.join(' '),
  }

  return {
    ...state,
    rng,
    now: clock,
    order: nextOrder,
    attempt: nextAttempt,
    breaker,
    ledger,
    outcomes,
    events: [...state.events, event],
    finished: nextOrder > config.orders,
  }
}

/** Roda até o fim (com teto de segurança: pedidos × tentativas). */
export function runToEnd(config: SimConfig): SimState {
  let state = createSimulation(config)
  const limit = config.orders * config.maxAttempts * 2
  for (let i = 0; i < limit && !state.finished; i += 1) state = step(state)
  return state
}

export function summarize(state: SimState) {
  const charged = new Set(state.ledger.charges.map((charge) => charge.order))
  return {
    orders: state.config.orders,
    succeeded: state.outcomes.filter((outcome) => outcome === 'ok').length,
    gaveUp: state.outcomes.filter((outcome) => outcome === 'gave-up').length,
    /** O cliente desistiu, mas uma tentativa perdida por timeout já tinha cobrado. */
    chargedButGaveUp: state.outcomes.filter((outcome, index) => outcome === 'gave-up' && charged.has(index + 1)).length,
    charges: state.ledger.charges.length,
    duplicates: state.ledger.charges.length - charged.size,
    timeouts: state.events.filter((event) => event.kind === 'timeout').length,
    replays: state.events.filter((event) => event.kind === 'replay').length,
    rejected: state.events.filter((event) => event.kind === 'rejected').length,
    elapsedMs: state.now,
  }
}
