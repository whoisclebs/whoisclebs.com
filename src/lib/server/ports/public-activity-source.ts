import type { PublicActivityItem } from '../domain/public-activity'

export type SourceFetchResult =
  | { status: 'not-modified' }
  | {
      status: 'ok'
      /** Candidatos já mapeados só de eventos públicos; o domínio ainda valida URL, tipo e limite. */
      items: PublicActivityItem[]
      etag: string | null
    }

/** Fonte externa de atividade pública (GitHub). Lança erro em falha de rede, timeout ou HTTP inesperado. */
export interface PublicActivitySource {
  readonly name: string
  fetchRecent(options: { etag: string | null }): Promise<SourceFetchResult>
}
