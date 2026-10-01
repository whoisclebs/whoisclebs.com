import type { PublicActivityItem } from '../domain/public-activity'

/** Estado da última sincronização de uma fonte (tabela `sync_cursor`). */
export interface SyncCursor {
  source: string
  /** Última sincronização bem-sucedida (ISO 8601) ou `null` se nunca houve. */
  lastSuccessAt: string | null
  /** ETag da última resposta 200 da fonte, reenviado em `If-None-Match`. */
  etag: string | null
  /** Resumo curto do último erro; `null` quando a última tentativa deu certo. */
  lastError: string | null
}

/** Persistência do cache de atividade pública. Implementações: D1 (produção) e memória (testes). */
export interface PublicActivityRepository {
  /** Itens mais recentes primeiro, no máximo `limit`. */
  listRecent(limit: number): Promise<PublicActivityItem[]>
  /**
   * Substitui o conjunto publicado: faz upsert por ID externo de cada item e remove os que não vieram
   * (evento que deixou de ser público sai do cache). Idempotente.
   */
  replaceItems(items: readonly PublicActivityItem[]): Promise<void>
  getCursor(source: string): Promise<SyncCursor | null>
  saveCursor(cursor: SyncCursor): Promise<void>
}
