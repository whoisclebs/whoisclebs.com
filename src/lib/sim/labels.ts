/** Rótulos em texto (pt-BR) dos estados e resultados: a cor/forma nunca é a única pista. */
import type { BreakerStatus } from './breaker'
import type { EventKind, summarize } from './simulator'

export const STATUS_LABEL: Record<BreakerStatus, string> = { closed: 'fechado', open: 'aberto', 'half-open': 'meio-aberto' }

export const KIND_LABEL: Record<EventKind, string> = {
  success: 'Cobrado',
  replay: 'Repetição reconhecida',
  error: '503 antes de cobrar',
  timeout: 'Timeout depois de cobrar',
  rejected: 'Recusado pelo disjuntor',
  'half-open': 'Disjuntor meio-aberto',
}

export function formatMs(value: number): string {
  return `${value.toLocaleString('pt-BR')} ms`
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

/** Resumo em uma frase (mesmo texto na ilha e na tabela sem JS). */
export function describeSummary(s: ReturnType<typeof summarize>): string {
  const parts = [
    `Fim: ${s.succeeded} de ${s.orders} pedidos confirmados`,
    plural(s.charges, 'cobrança efetivada', 'cobranças efetivadas'),
    s.duplicates > 0 ? plural(s.duplicates, 'duplicada', 'duplicadas') : 'nenhuma duplicada',
  ]
  if (s.chargedButGaveUp > 0) parts.push(`${plural(s.chargedButGaveUp, 'pedido abandonado', 'pedidos abandonados')} pelo cliente, mas cobrado pelo servidor`)
  if (s.rejected > 0) parts.push(`${plural(s.rejected, 'tentativa recusada', 'tentativas recusadas')} pelo disjuntor sem chamar o servidor`)
  return `${parts.join('; ')}.`
}
