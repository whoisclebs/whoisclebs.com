import type { Clock } from '../ports/clock'
import type { PublicActivityRepository, SyncCursor } from '../ports/public-activity-repository'
import type { PublicActivitySource } from '../ports/public-activity-source'
import { ACTIVITY_SOURCE, sanitizeActivityItems } from './public-activity'

export interface SyncPublicActivityDeps {
  repository: PublicActivityRepository
  source: PublicActivitySource
  clock: Clock
}

export type SyncPublicActivityResult =
  | { outcome: 'updated'; stored: number }
  | { outcome: 'not-modified' }
  | { outcome: 'failed'; error: string }

export const MAX_ERROR_SUMMARY_LENGTH = 200

export function summarizeError(error: unknown): string {
  const message = error instanceof Error ? `${error.message}` : String(error)
  const clean = message.replace(/\s+/g, ' ').trim() || 'erro desconhecido'
  return clean.slice(0, MAX_ERROR_SUMMARY_LENGTH)
}

/**
 * Sincroniza o cache com a fonte. Idempotente (substituição por ID externo). Em falha, o cache antigo
 * fica intacto e só o cursor registra o erro resumido; o último sucesso e o ETag são preservados.
 */
export async function syncPublicActivity({ repository, source, clock }: SyncPublicActivityDeps): Promise<SyncPublicActivityResult> {
  const previous: SyncCursor = (await repository.getCursor(ACTIVITY_SOURCE)) ?? {
    source: ACTIVITY_SOURCE,
    lastSuccessAt: null,
    etag: null,
    lastError: null,
  }
  // Só reaproveita o ETag se já existe cache; um 304 sobre banco vazio deixaria a API em 503 para sempre.
  const etag = previous.lastSuccessAt ? previous.etag : null

  try {
    const result = await source.fetchRecent({ etag })
    const now = clock.now().toISOString()
    if (result.status === 'not-modified') {
      await repository.saveCursor({ ...previous, lastSuccessAt: now, lastError: null })
      return { outcome: 'not-modified' }
    }
    const items = sanitizeActivityItems(result.items)
    await repository.replaceItems(items)
    await repository.saveCursor({ source: ACTIVITY_SOURCE, lastSuccessAt: now, etag: result.etag, lastError: null })
    return { outcome: 'updated', stored: items.length }
  } catch (error) {
    const summary = summarizeError(error)
    await repository.saveCursor({ ...previous, lastError: summary })
    return { outcome: 'failed', error: summary }
  }
}
