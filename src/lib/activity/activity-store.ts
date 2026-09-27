/**
 * Uma única chamada a `/api/activity` por carregamento de página, dividida entre o HUD da home e o rodapé.
 * Quem pedir primeiro dispara a busca; o segundo recebe a mesma promessa. A latência é medida no próprio
 * navegador, do envio até a chegada dos cabeçalhos da resposta (qualquer status); sem resposta (rede ou
 * timeout), fica `null`.
 */
import { loadActivity, type ActivityResult } from './activity-client'

/** A API manda no máximo 10 eventos; o HUD conta e o rodapé lista todos os que estão no cache. */
export const ACTIVITY_CACHE_LIMIT = 10

export interface ActivitySnapshot {
  result: ActivityResult
  latencyMs: number | null
  receivedAt: Date
}

type Fetch = (url: string, init?: RequestInit) => Promise<Response>

let pending: Promise<ActivitySnapshot> | null = null

export function requestActivity(fetchImpl: Fetch = (url, init) => fetch(url, init), now: () => number = () => performance.now()): Promise<ActivitySnapshot> {
  if (pending) return pending
  let latencyMs: number | null = null
  const timed: Fetch = async (url, init) => {
    const started = now()
    const response = await fetchImpl(url, init)
    latencyMs = now() - started
    return response
  }
  pending = loadActivity({ fetch: timed, limit: ACTIVITY_CACHE_LIMIT }).then((result) => ({ result, latencyMs, receivedAt: new Date() }))
  return pending
}

/** Só para testes: esquece a busca em andamento. */
export function resetActivityStore() {
  pending = null
}
