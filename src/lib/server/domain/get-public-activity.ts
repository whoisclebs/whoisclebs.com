import type { Clock } from '../ports/clock'
import type { PublicActivityRepository } from '../ports/public-activity-repository'
import {
  ACTIVITY_SOURCE,
  MAX_ACTIVITY_ITEMS,
  sanitizeActivityItems,
  type PublicActivitySnapshot,
} from './public-activity'

export interface GetPublicActivityDeps {
  repository: PublicActivityRepository
  clock: Clock
  /** Idade máxima da última sincronização bem-sucedida para o cache ainda ser `fresh`. */
  freshWindowMs: number
}

export type GetPublicActivityResult = { available: false } | { available: true; snapshot: PublicActivitySnapshot }

/**
 * Lê o cache persistido. Sem nenhuma sincronização bem-sucedida → indisponível (a rota responde 503).
 * `stale` quando a última tentativa falhou ou quando o último sucesso passou da janela.
 */
export async function getPublicActivity({ repository, clock, freshWindowMs }: GetPublicActivityDeps): Promise<GetPublicActivityResult> {
  const cursor = await repository.getCursor(ACTIVITY_SOURCE)
  const lastSuccess = cursor?.lastSuccessAt ? Date.parse(cursor.lastSuccessAt) : Number.NaN
  if (!cursor || Number.isNaN(lastSuccess)) return { available: false }

  // Relê mais que o limite para que um item inválido no banco não reduza a lista abaixo de 10.
  const items = sanitizeActivityItems(await repository.listRecent(MAX_ACTIVITY_ITEMS * 2))
  const age = clock.now().getTime() - lastSuccess
  const status = cursor.lastError !== null || age > freshWindowMs ? 'stale' : 'fresh'

  return {
    available: true,
    snapshot: { source: ACTIVITY_SOURCE, updatedAt: new Date(lastSuccess).toISOString(), status, items },
  }
}
