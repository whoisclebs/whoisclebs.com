/**
 * Disjuntor (circuit breaker) em funções puras.
 * - closed: pedidos passam; falhas seguidas contam; ao atingir o limite, abre.
 * - open: pedidos são recusados no cliente, sem chamar o servidor, até passar a espera.
 * - half-open: um pedido de teste passa; sucesso fecha, falha reabre.
 */
export type BreakerStatus = 'closed' | 'open' | 'half-open'

export interface Breaker {
  status: BreakerStatus
  /** Falhas seguidas desde o último sucesso. */
  failures: number
  /** Instante (ms simulados) em que abriu pela última vez. */
  openedAt: number | null
}

export interface BreakerConfig {
  threshold: number
  cooldownMs: number
}

export const CLOSED: Breaker = { status: 'closed', failures: 0, openedAt: null }

export function beforeRequest(breaker: Breaker, now: number, config: BreakerConfig): { allowed: boolean; breaker: Breaker } {
  if (breaker.status !== 'open') return { allowed: true, breaker }
  if (breaker.openedAt !== null && now - breaker.openedAt >= config.cooldownMs) {
    return { allowed: true, breaker: { ...breaker, status: 'half-open' } }
  }
  return { allowed: false, breaker }
}

export function onSuccess(_breaker: Breaker): Breaker {
  return CLOSED
}

export function onFailure(breaker: Breaker, now: number, config: BreakerConfig): Breaker {
  // O teste do meio-aberto falhou: reabre sem somar (a contagem já estava no limite).
  if (breaker.status === 'half-open') return { status: 'open', failures: breaker.failures, openedAt: now }
  const failures = breaker.failures + 1
  if (failures >= config.threshold) return { status: 'open', failures, openedAt: now }
  return { status: 'closed', failures, openedAt: null }
}
