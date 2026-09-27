import type { D1Database } from '@cloudflare/workers-types'
import type { ActivityKind, PublicActivityItem } from '../../domain/public-activity'
import type { PublicActivityRepository, SyncCursor } from '../../ports/public-activity-repository'

interface ActivityRow {
  external_id: string
  kind: string
  title: string
  url: string
  occurred_at: string
}

interface CursorRow {
  source: string
  last_success_at: string | null
  etag: string | null
  last_error: string | null
}

const UPSERT_ITEM = `INSERT INTO public_activity (external_id, kind, title, url, occurred_at)
VALUES (?1, ?2, ?3, ?4, ?5)
ON CONFLICT (external_id) DO UPDATE SET
  kind = excluded.kind, title = excluded.title, url = excluded.url, occurred_at = excluded.occurred_at`

/** Adaptador D1 do repositório de atividade. Único ponto (além de compose.ts) que conhece `D1Database`. */
export class D1ActivityRepository implements PublicActivityRepository {
  constructor(private readonly db: D1Database) {}

  async listRecent(limit: number): Promise<PublicActivityItem[]> {
    const { results } = await this.db
      .prepare(
        'SELECT external_id, kind, title, url, occurred_at FROM public_activity ORDER BY occurred_at DESC, external_id ASC LIMIT ?1',
      )
      .bind(limit)
      .all<ActivityRow>()
    return results.map((row) => ({
      id: row.external_id,
      // O CHECK da migração garante o conjunto; o domínio revalida ao ler.
      kind: row.kind as ActivityKind,
      title: row.title,
      url: row.url,
      occurredAt: row.occurred_at,
    }))
  }

  /** Upserts + remoção dos ausentes num único `batch` (transação implícita do D1). */
  async replaceItems(items: readonly PublicActivityItem[]): Promise<void> {
    const upserts = items.map((item) =>
      this.db.prepare(UPSERT_ITEM).bind(item.id, item.kind, item.title, item.url, item.occurredAt),
    )
    const prune = this.db
      .prepare('DELETE FROM public_activity WHERE external_id NOT IN (SELECT value FROM json_each(?1))')
      .bind(JSON.stringify(items.map((item) => item.id)))
    await this.db.batch([...upserts, prune])
  }

  async getCursor(source: string): Promise<SyncCursor | null> {
    const row = await this.db
      .prepare('SELECT source, last_success_at, etag, last_error FROM sync_cursor WHERE source = ?1')
      .bind(source)
      .first<CursorRow>()
    return row ? { source: row.source, lastSuccessAt: row.last_success_at, etag: row.etag, lastError: row.last_error } : null
  }

  async saveCursor(cursor: SyncCursor): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO sync_cursor (source, last_success_at, etag, last_error) VALUES (?1, ?2, ?3, ?4)
ON CONFLICT (source) DO UPDATE SET
  last_success_at = excluded.last_success_at, etag = excluded.etag, last_error = excluded.last_error`,
      )
      .bind(cursor.source, cursor.lastSuccessAt, cursor.etag, cursor.lastError)
      .run()
  }
}
