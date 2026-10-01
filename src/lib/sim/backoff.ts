export interface BackoffPolicy {
  baseMs: number
  capMs: number
}

/**
 * Espera antes da próxima tentativa: backoff exponencial com jitter completo ("full jitter").
 * Sorteia entre 0 e min(teto, base × 2^(tentativa − 1)); o sorteio espalha clientes que falharam juntos.
 */
export function backoffDelay(attempt: number, policy: BackoffPolicy, random: number): number {
  const ceiling = Math.min(policy.capMs, policy.baseMs * 2 ** (attempt - 1))
  return Math.round(random * ceiling)
}
