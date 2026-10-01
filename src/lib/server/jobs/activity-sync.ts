import { composeActivitySync, type ActivityEnv } from '../compose'
import { syncPublicActivity, type SyncPublicActivityResult } from '../domain/sync-public-activity'
import type { FetchLike } from '../infra/github/public-activity-source'

/**
 * Tarefa agendada (cron do Worker): monta as dependências e roda o caso de uso. Nenhuma regra aqui.
 * Falha da fonte não lança: o caso de uso registra o erro no `sync_cursor` e preserva o cache.
 */
export async function runActivitySync(env: ActivityEnv, fetchImpl?: FetchLike): Promise<SyncPublicActivityResult> {
  const result = await syncPublicActivity(composeActivitySync(env, fetchImpl))
  if (result.outcome === 'failed') console.warn(`activity-sync: falhou (${result.error})`)
  else console.log(`activity-sync: ${result.outcome}${result.outcome === 'updated' ? ` (${result.stored} itens)` : ''}`)
  return result
}
